/**
 * agentService.ts
 * Loads agent configs, builds system prompts, and performs completions (classic or streaming).
 */

import { getModelAdapter } from './modelRegistry'
import type { LLMAdapter } from './modelRegistry'
import { db } from '../db/db'
import { MemoryManager } from './memoryManager'
import { EldercareContextService } from './eldercareContextService'
import { AVAILABLE_TOOLS, executeToolCall } from './tools'
import type { AgentRequest } from '../types/agent'
import type { Persona as _Persona } from '../types/personas'
import type { ConversationSummary, SemanticPin, MessageWithImportance } from '../types/memory'
import type { ChatCompletionTool } from 'openai/resources'

// Initialize MemoryManager for enhanced context building
const memoryManager = new MemoryManager()

// Initialize EldercareContextService for eldercare data integration
const eldercareContextService = new EldercareContextService()

type RunAgentParams = AgentRequest & {
  stream?: boolean // new: enable streaming mode
  personaId?: string // new: persona selection
  sessionId?: string // new: session ID for conversation history retrieval
}

/**
 * Gets a persona's prompt from the database by ID.
 * Returns empty string if persona not found.
 */
function getPersonaPrompt(personaId?: string): string {
  if (!personaId) return ''

  try {
    const persona = db.prepare('SELECT prompt FROM personas WHERE id = ?').get(personaId) as
      | { prompt: string }
      | undefined

    return persona?.prompt || ''
  } catch (error) {
    console.error('Error fetching persona:', error)
    return ''
  }
}

/**
 * Gets a persona's settings from the database by ID.
 * Normalizes settings so they work for both local (Ollama) and cloud (OpenAI) adapters.
 */
function getPersonaSettings(personaId?: string): Record<string, unknown> | undefined {
  if (!personaId) return undefined

  try {
    const persona = db.prepare(
      'SELECT temperature, maxTokens, topP, repeatPenalty FROM personas WHERE id = ?'
    ).get(personaId) as {
      temperature?: number
      maxTokens?: number  
      topP?: number
      repeatPenalty?: number
    } | undefined

    if (!persona) return undefined

    const settings: Record<string, unknown> = {}
    
    if (persona.temperature != null) settings.temperature = persona.temperature
    if (persona.maxTokens != null) settings.maxTokens = persona.maxTokens
    if (persona.topP != null) settings.topP = persona.topP

    // 🔑 Normalize repeatPenalty for both local + OpenAI
    if (persona.repeatPenalty != null) {
      settings.repeatPenalty = persona.repeatPenalty    // used by Ollama
      settings.frequencyPenalty = persona.repeatPenalty // used by OpenAI
    }

    return Object.keys(settings).length > 0 ? settings : undefined
  } catch (error) {
    console.error('Error fetching persona settings:', error)
    return undefined
  }
}

/**
 * Placeholder for future document context feature.
 * Currently returns empty string as the documents feature is not implemented.
 */
function getDocumentContext(_fileIds: string[] = []): string {
  return ''
}

/**
 * Gets enhanced conversation history from the hybrid memory system.
 * Includes recent messages, conversation summaries, and semantic pins for intelligent context building.
 * Returns the enhanced context excluding the most recent message (current user input).
 */
async function getConversationHistory(sessionId?: string, maxTokens: number = 3000): Promise<Array<{ role: string; content: string }>> {
  if (!sessionId) return []

  try {
    const memoryContext = await memoryManager.buildContext(sessionId, maxTokens)
    
    // Create a simple history array with alternating user/assistant messages
    // This matches Ollama's native format for optimal context handling
    const history: Array<{ role: string; content: string }> = []
    
    // Add stronger directive for how the model should use the conversation history
    history.push({
      role: 'system',
      content: 'CRITICAL INSTRUCTION: The following is REFERENCE material from previous conversation. Use it ONLY for contextual understanding. You MUST FOCUS EXCLUSIVELY on responding to the CURRENT QUESTION. DO NOT address any previous topics or questions unless the current question EXPLICITLY requests information about them. Previous exchanges should be treated as background information only.'
    })
    
    // Include summaries as a single system message if available (useful context)
    if (memoryContext.summaries.length > 0) {
      const summariesText = memoryContext.summaries
        .map((summary: ConversationSummary) => `${summary.summary}`)
        .join('\n\n')
      
      history.push({
        role: 'system',
        content: `REFERENCE ONLY - Background context: ${summariesText} [NOTE: This is background information only. Do not directly respond to any of these topics unless explicitly asked in the current question.]`
      })
    }
    
    // Include semantic pins if available (key information)
    if (memoryContext.semanticPins.length > 0) {
      const pinsText = memoryContext.semanticPins
        .map((pin: SemanticPin) => pin.content)
        .join('; ')
      
      history.push({
        role: 'system', 
        content: `REFERENCE MATERIAL - Important information: ${pinsText} [Use this information only if directly relevant to the current question.]`
      })
    }
    
    // Get messages but exclude the last one (current query)
    const messages = memoryContext.recentMessages.slice(0, -1)
    
    // Divide messages into "recent" and "earlier" groups
    const totalMessages = messages.length;
    const recentThreshold = Math.min(2, totalMessages); // Consider last 2 exchanges as recent
    
    // Add older messages with clear labeling they are reference material
    if (totalMessages > recentThreshold) {
      const olderMessages = messages.slice(0, totalMessages - recentThreshold);
      // Add older messages with clear labeling they are reference material
      if (olderMessages.length > 0) {
        // Filter out invalid roles before processing
        const validOlderMessages = olderMessages.filter((msg: MessageWithImportance) => {
          const validRoles = ['system', 'user', 'assistant'];
          if (!validRoles.includes(msg.role)) {
            console.warn(`[Agent] Filtering out older message with invalid role: ${msg.role}`);
            return false;
          }
          return true;
        });
        
        if (validOlderMessages.length > 0) {
          const combinedOlderMessages = validOlderMessages
            .map((msg: MessageWithImportance) => `${msg.role.toUpperCase()}: ${msg.text}`)
            .join('\n\n');
            
          history.push({
            role: 'system',
            content: `HISTORICAL REFERENCE ONLY: ${combinedOlderMessages}\n\n[NOTE: These are older messages provided only for background context. DO NOT respond to any questions or requests in this historical content.]`
          });
        }
      }
      
      // Add a separator for clarity
      history.push({
        role: 'system',
        content: '--- RECENT CONVERSATION ---'
      });
    }
    
    // Add recent messages with clear markers that they're from the recent conversation
    const recentMessages = messages.slice(Math.max(0, totalMessages - recentThreshold));
    for (const message of recentMessages) {
      // Filter out invalid roles that OpenAI doesn't support
      const validRoles = ['system', 'user', 'assistant'];
      if (!validRoles.includes(message.role)) {
        console.warn(`[Agent] Skipping message with invalid role: ${message.role}`);
        continue;
      }
      
      // Add a prefix to distinguish this as a recent message but not the current one
      history.push({
        role: message.role,
        content: `RECENT EXCHANGE: ${message.text}\n[This is from the recent conversation, not the current question.]`
      });
    }
    
    return history
  } catch (error) {
    console.error('Error building enhanced conversation history:', error)
    try {
      const rows = db
        .prepare(`
          SELECT * FROM (
            SELECT role, text, created_at FROM messages 
            WHERE session_id = ? 
            ORDER BY created_at DESC 
            LIMIT 11
          ) ORDER BY created_at ASC
        `)
        .all(sessionId) as { role: string; text: string }[]

      const trimmed = rows.slice(0, -1)
      return trimmed.map(msg => ({
        role: msg.role,
        content: msg.text
      }))
    } catch (fallbackError) {
      console.error('Error in fallback conversation history:', fallbackError)
      return []
    }
  }
}

/**
 * Builds the final system prompt by combining persona prompt, document context, eldercare context, and custom system prompt.
 */
function buildSystemPrompt(
  adapter: LLMAdapter,
  userInput: string,
  personaId?: string,
  customSystemPrompt?: string,
  fileIds: string[] = []
): string {
  const personaPrompt = getPersonaPrompt(personaId)
  const documentContext = getDocumentContext(fileIds)
  const customPrompt = customSystemPrompt?.trim() || ''
  
  // Get eldercare context based on user query and model capabilities
  const eldercareContext = eldercareContextService.generateContextualPrompt(adapter, userInput)
  
  // Add stronger and more explicit instructions to focus on current query only
  const focusInstructions = "CRITICAL INSTRUCTION: You MUST address ONLY the user's CURRENT QUESTION. Previous conversation is provided SOLELY as background context. You MUST NOT: 1) Answer questions from previous exchanges, 2) Refer to previous topics unless explicitly asked, 3) Provide information not directly relevant to the current question. Treat the current question as if it were asked in isolation, while using context only to enhance your understanding of what the user is currently asking."

  const parts = [personaPrompt, documentContext, eldercareContext, customPrompt, focusInstructions].filter(Boolean)
  return parts.join('\n\n')
}

/**
 * Runs agent for a single classic (full) completion.
 * Supports function calling - will automatically execute tools and return final response.
 */
export async function runAgent(
  payload: RunAgentParams
): Promise<{ reply: string; tokenUsage: number | null }> {
  const { modelName, settings, input, systemPrompt = '', fileIds = [], personaId, sessionId } = payload
  const adapter = getModelAdapter(modelName)
  if (!adapter) throw new Error(`Adapter for model "${modelName}" not found.`)

  const personaSettings = getPersonaSettings(personaId)
  const mergedSettings = { ...personaSettings, ...settings }

  console.log('🔍 PERSONA SETTINGS DEBUG (runAgent):', {
    personaId,
    personaSettings,
    requestSettings: settings,
    mergedSettings
  })

  // Build a clean system prompt without any special instructions
  // Let Ollama handle the conversation naturally
  const finalSystemPrompt = buildSystemPrompt(adapter, input, personaId, systemPrompt, fileIds)

  // Build messages array with system prompt first
  const messages: Array<{ role: string; content: string }> = []
  if (finalSystemPrompt && finalSystemPrompt.trim()) {
    messages.push({ role: 'system', content: finalSystemPrompt.trim() })
  }
  
  // Add conversation history in its natural format
  // This matches how Ollama expects conversations to be structured
  if (sessionId) {
    const history = await getConversationHistory(sessionId, 3000)
    history.forEach(msg => messages.push({ role: msg.role, content: msg.content }))
  }
  
  // Add the current user input without special formatting
  // Let the model handle it naturally as Ollama expects
  if (input && input.trim()) {
    messages.push({ role: 'user', content: input.trim() })
  }

  // Only use tools for cloud models (OpenAI)
  const tools: ChatCompletionTool[] | undefined = adapter.type === 'cloud' ? ([...AVAILABLE_TOOLS] as unknown as ChatCompletionTool[]) : undefined

  // Remove debug logging
  console.log(`[Agent] Using ${tools ? tools.length : 0} tools for model type: ${adapter.type}`)

  // Initial generation with tools
  let result = await adapter.generate({ messages, settings: mergedSettings, fileIds, tools })

  // Handle tool calls if any
  if (result.toolCalls && result.toolCalls.length > 0) {
    console.log(`[Agent] Model requested ${result.toolCalls.length} tool call(s)`)

    // Execute tool calls and provide results as context for a new simple request
    let searchResults = ''
    
    for (const toolCall of result.toolCalls) {
      console.log(`[Agent] Executing tool: ${toolCall.name}`)
      
      try {
        const args = JSON.parse(toolCall.arguments)
        const toolResult = await executeToolCall(toolCall.name, args)
        searchResults += `Search results for "${args.query}":\n${toolResult}\n\n`
      } catch (error) {
        console.error(`[Agent] Tool execution failed:`, error)
        searchResults += `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}\n\n`
      }
    }

    // Create a completely new request with search results as context
    const newSystemPrompt = `${finalSystemPrompt}\n\nYou have access to current search results. Use them to provide accurate, up-to-date information.`
    
    const newMessages: Array<{ role: string; content: string }> = [
      { role: 'system', content: newSystemPrompt },
      { role: 'system', content: `Current search results:\n${searchResults}` },
      { role: 'user', content: input.trim() }
    ]

    // Generate final response with search context but no tools (to avoid recursion)
    console.log(`[Agent] Generating final response with search results`)
    result = await adapter.generate({ messages: newMessages, settings: mergedSettings, fileIds })
    
    // Add searching marker for frontend
    result.reply = '[SEARCHING_ONLINE]\n\n' + result.reply
  }

  return result
}

/**
 * Runs agent in streaming mode.
 */
export async function* runAgentStream(
  payload: RunAgentParams
): AsyncGenerator<{ delta: string; done?: boolean; tokenUsage?: number }> {
  const { modelName, settings, input, systemPrompt = '', fileIds = [], personaId, sessionId } = payload
  const adapter = getModelAdapter(modelName)
  if (!adapter) throw new Error(`Adapter for model "${modelName}" not found.`)

  const personaSettings = getPersonaSettings(personaId)
  const mergedSettings = { ...personaSettings, ...settings }
    
  // Build the system prompt without special instructions
  const finalSystemPrompt = buildSystemPrompt(adapter, input, personaId, systemPrompt, fileIds)

  const messages = []
  if (finalSystemPrompt && finalSystemPrompt.trim()) {
    messages.push({ role: 'system', content: finalSystemPrompt.trim() })
  }
  
  if (sessionId) {
    const history = await getConversationHistory(sessionId, 3000)
    history.forEach(msg => messages.push({ role: msg.role, content: msg.content }))
  }
  
  if (input && input.trim()) {
    messages.push({ role: 'user', content: input.trim() })
  }

  if (!('generateStream' in adapter) || typeof adapter.generateStream !== 'function') {
    throw new Error(`Adapter "${modelName}" does not support streaming.`)
  }

  for await (const chunk of adapter.generateStream({ messages, settings: mergedSettings, fileIds })) {
    yield chunk
  }
}

/**
 * Returns all sessions (id, name, created_at), newest first.
 */
export async function getAllSessions() {
  const rows = db
    .prepare('SELECT id, name, created_at FROM sessions ORDER BY created_at DESC')
    .all()
  return rows
}
