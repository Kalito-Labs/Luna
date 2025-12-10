/**
 * agentService.ts
 * Loads agent configs, builds system prompts, and performs completions (classic or streaming).
 */

import { getModelAdapter } from './modelRegistry'
import type { LLMAdapter } from './modelRegistry'
import { db } from '../db/db'
import { MemoryManager } from './memoryManager'
import { LunaContextService } from './lunaContextService'
import { detectQueryType, extractPatientReference, containsPronounReference } from './queryRouter'
import { AVAILABLE_TOOLS, executeToolCall } from './tools'
import type { AgentRequest } from '../types/agent'
import type { Persona as _Persona } from '../types/personas'
import type { ConversationSummary, SemanticPin, MessageWithImportance } from '../types/memory'
import type { ChatCompletionTool } from 'openai/resources'

// Initialize MemoryManager for enhanced context building
const memoryManager = new MemoryManager()

// Initialize LunaContextService for Luna data integration
const lunaContextService = new LunaContextService()

type RunAgentParams = AgentRequest & {
  stream?: boolean // new: enable streaming mode
  personaId?: string // new: persona selection
  sessionId?: string // new: session ID for conversation history retrieval
  conversationHistory?: Array<{ role: string; content: string }> // new: pre-built conversation history
}

/**
 * Checks if user input contains explicit intent to search online.
 * Only returns true when user explicitly requests web search using clear keywords.
 * This prevents autonomous AI decisions about when to search the internet.
 */
function hasExplicitSearchIntent(input: string): boolean {
  const lowerInput = input.toLowerCase()
  
  const explicitTriggers = [
    'search online',
    'search for',
    'look up',
    'find online',
    'check online',
    'google',
    'search google',
    'what is the current',
    'what are the current',
    'what\'s the current',
    'what is the latest',
    'what are the latest',
    'what\'s the latest',
    'recent ',
    'recently',
    'today\'s',
    'this week',
    'this month',
    'up-to-date',
    'real-time',
    'live ',
    'breaking news',
    'go online',
    'browse',
    'web search',
  ]
  
  const hasIntent = explicitTriggers.some(trigger => lowerInput.includes(trigger))
  
  if (!hasIntent) {
    console.log('[Agent] No explicit search intent detected - web search tool withheld')
  } else {
    console.log('[Agent] Explicit search intent detected - web search tool available')
  }
  
  return hasIntent
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
  if (!sessionId) {
    console.log('[Debug] No sessionId provided, returning empty history')
    return []
  }

  try {
    console.log(`[Debug] Building conversation history for session: ${sessionId}`)
    const memoryContext = await memoryManager.buildContext(sessionId, maxTokens)
    
    console.log(`[Debug] Memory context retrieved:`, {
      recentMessagesCount: memoryContext.recentMessages.length,
      summariesCount: memoryContext.summaries.length,
      pinsCount: memoryContext.semanticPins.length
    })
    
    // Create a simple history array with alternating user/assistant messages
    // This matches Ollama's native format for optimal context handling
    const history: Array<{ role: string; content: string }> = []
    
    // Add natural conversation context instructions
    history.push({
      role: 'system',
      content: 'The following messages show your recent conversation with this user. Use this context to understand the ongoing discussion and provide continuity in your responses.'
    })
    
    // Include summaries as a single system message if available (useful context)
    if (memoryContext.summaries.length > 0) {
      const summariesText = memoryContext.summaries
        .map((summary: ConversationSummary) => `${summary.summary}`)
        .join('\n\n')
      
      history.push({
        role: 'system',
        content: `Previous conversation context: ${summariesText}`
      })
    }
    
    // Include semantic pins if available (key information)
    if (memoryContext.semanticPins.length > 0) {
      const pinsText = memoryContext.semanticPins
        .map((pin: SemanticPin) => pin.content)
        .join('; ')
      
      history.push({
        role: 'system', 
        content: `Key information to remember: ${pinsText}`
      })
    }
    
    // Messages are already filtered at database level (OFFSET 1) - no need to exclude current message
    const messages = memoryContext.recentMessages
    
    console.log(`[Debug] Recent messages (database filtered):`, {
      totalMessages: memoryContext.recentMessages.length,
      messages: messages.map(m => ({ role: m.role, preview: m.text.slice(0, 50) + '...' }))
    })
    
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
            content: `Earlier conversation context:\n${combinedOlderMessages}`
          });
        }
      }
      
      // Add recent conversation context
      history.push({
        role: 'system',
        content: '--- Recent Conversation ---'
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
      
      // Add recent messages naturally without confusing labels
      history.push({
        role: message.role,
        content: message.text
      });
    }
    
    return history
  } catch (error) {
    console.error('[Debug] Error building enhanced conversation history:', error)
    try {
      console.log(`[Debug] Falling back to basic history for session: ${sessionId}`)
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

      console.log(`[Debug] Fallback query returned ${rows.length} messages`)
      
      const trimmed = rows.slice(0, -1)
      console.log(`[Debug] After excluding current message: ${trimmed.length} messages`)
      
      return trimmed.map(msg => ({
        role: msg.role,
        content: msg.text
      }))
    } catch (fallbackError) {
      console.error('[Debug] Error in fallback conversation history:', fallbackError)
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
  fileIds: string[] = [],
  sessionId?: string
): string {
  const personaPrompt = getPersonaPrompt(personaId)
  const documentContext = getDocumentContext(fileIds)
  const customPrompt = customSystemPrompt?.trim() || ''
  
  // Get eldercare context based on user query and model capabilities
  const lunaContext = lunaContextService.generateContextualPrompt(adapter, userInput, sessionId)
  
  // DEBUG: Log RAG context
  if (lunaContext.includes('Knowledge Base')) {
    console.log('[AgentService] RAG Context Generated:')
    console.log('  - Context length:', lunaContext.length, 'chars')
    console.log('  - Has Knowledge Base:', lunaContext.includes('Knowledge Base Documents'))
    console.log('  - First 500 chars:', lunaContext.substring(0, 500))
  }
  
  // Add balanced instructions that allow natural conversation flow
  const conversationInstructions = "You are engaged in a natural conversation with the user. Use the conversation history to understand context and maintain continuity, while primarily focusing on addressing the user's current question or request. Remember previous topics when relevant and build upon them naturally in your responses."

  const parts = [personaPrompt, documentContext, lunaContext, customPrompt, conversationInstructions].filter(Boolean)
  return parts.join('\n\n')
}

/**
 * Runs agent for a single classic (full) completion.
 * Supports function calling - will automatically execute tools and return final response.
 * Now includes structured validation for medication queries.
 */
export async function runAgent(
  payload: RunAgentParams
): Promise<{ reply: string; tokenUsage: number | null }> {
  const { modelName, settings, input, systemPrompt = '', fileIds = [], personaId, sessionId, conversationHistory } = payload
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

  // Extract and track patient context for session continuity
  if (sessionId) {
    const patientRef = extractPatientReference(input)
    if (patientRef) {
      // Use lunaContextService to properly resolve patient reference
      const patient = lunaContextService.findPatientByReference(patientRef)
      
      if (patient) {
        // Update session to track patient focus
        db.prepare('UPDATE sessions SET patient_id = ? WHERE id = ?').run(patient.id, sessionId)
        console.log(`[Agent] 👤 Session patient context set: ${patient.name} (${patient.id})`)
      }
    }
  }

  // Detect query type for structured validation
  const queryType = detectQueryType(input)
  console.log(`[Agent] Query type detected: ${queryType}`)

  // Build a clean system prompt without any special instructions
  // Let Ollama handle the conversation naturally
  const finalSystemPrompt = buildSystemPrompt(adapter, input, personaId, systemPrompt, fileIds, sessionId)

  // Build messages array with system prompt first
  const messages: Array<{ role: string; content: string }> = []
  if (finalSystemPrompt && finalSystemPrompt.trim()) {
    messages.push({ role: 'system', content: finalSystemPrompt.trim() })
  }
  
  // Add conversation history in its natural format
  // Use pre-built conversation history if provided, otherwise build from scratch
  if (conversationHistory) {
    console.log(`[Debug] Using pre-built conversation history: ${conversationHistory.length} messages`)
    conversationHistory.forEach(msg => messages.push({ role: msg.role, content: msg.content }))
  } else if (sessionId) {
    console.log(`[Debug] Building conversation history from scratch for session: ${sessionId}`)
    const history = await getConversationHistory(sessionId, 3000)
    history.forEach(msg => messages.push({ role: msg.role, content: msg.content }))
  }
  
  // Add the current user input without special formatting
  // Let the model handle it naturally as Ollama expects
  if (input && input.trim()) {
    messages.push({ role: 'user', content: input.trim() })
  }

  // Only use tools for cloud models (OpenAI) AND if user explicitly requested search
  const tools: ChatCompletionTool[] | undefined = 
    adapter.type === 'cloud' && hasExplicitSearchIntent(input)
      ? ([...AVAILABLE_TOOLS] as unknown as ChatCompletionTool[])
      : undefined

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
 * Supports function calling - will automatically execute tools and return final response.
 */
export async function* runAgentStream(
  payload: RunAgentParams
): AsyncGenerator<{ delta: string; done?: boolean; tokenUsage?: number }> {
  const { modelName, settings, input, systemPrompt = '', fileIds = [], personaId, sessionId, conversationHistory } = payload
  const adapter = getModelAdapter(modelName)
  if (!adapter) throw new Error(`Adapter for model "${modelName}" not found.`)

  const personaSettings = getPersonaSettings(personaId)
  const mergedSettings = { ...personaSettings, ...settings }

  // Extract and track patient context for session continuity
  if (sessionId) {
    const patientRef = extractPatientReference(input)
    if (patientRef) {
      const patient = lunaContextService.findPatientByReference(patientRef)
      if (patient) {
        db.prepare('UPDATE sessions SET patient_id = ? WHERE id = ?').run(patient.id, sessionId)
        console.log(`[Agent Stream] 👤 Session patient context set: ${patient.name} (${patient.id})`)
      }
    }
  }

  // Detect query type for structured validation
  const queryType = detectQueryType(input)
  console.log(`[Agent Stream] Query type detected: ${queryType}`)
    
  // Build the system prompt without special instructions
  const finalSystemPrompt = buildSystemPrompt(adapter, input, personaId, systemPrompt, fileIds, sessionId)

  const messages = []
  if (finalSystemPrompt && finalSystemPrompt.trim()) {
    messages.push({ role: 'system', content: finalSystemPrompt.trim() })
  }
  
  // Use pre-built conversation history if provided, otherwise build from scratch
  if (conversationHistory) {
    console.log(`[Debug] Streaming: Using pre-built conversation history: ${conversationHistory.length} messages`)
    conversationHistory.forEach(msg => messages.push({ role: msg.role, content: msg.content }))
  } else if (sessionId) {
    console.log(`[Debug] Streaming: Building conversation history from scratch for session: ${sessionId}`)
    const history = await getConversationHistory(sessionId, 3000)
    history.forEach(msg => messages.push({ role: msg.role, content: msg.content }))
  }
  
  if (input && input.trim()) {
    messages.push({ role: 'user', content: input.trim() })
  }

  if (!('generateStream' in adapter) || typeof adapter.generateStream !== 'function') {
    throw new Error(`Adapter "${modelName}" does not support streaming.`)
  }

  // Only use tools for cloud models (OpenAI) AND if user explicitly requested search
  const tools: ChatCompletionTool[] | undefined = 
    adapter.type === 'cloud' && hasExplicitSearchIntent(input)
      ? ([...AVAILABLE_TOOLS] as unknown as ChatCompletionTool[])
      : undefined

  console.log(`[Agent Stream] Using ${tools ? tools.length : 0} tools for model type: ${adapter.type}`)

  // For streaming with function calling, we need to handle it differently
  // Check if adapter supports tools in streaming mode
  if (tools && tools.length > 0) {
    // First, do a non-streaming call to check for tool calls
    const initialResult = await adapter.generate({ messages, settings: mergedSettings, fileIds, tools })
    
    if (initialResult.toolCalls && initialResult.toolCalls.length > 0) {
      // Yield searching marker for frontend
      yield { delta: '[SEARCHING_ONLINE]\n\n' }
      
      // Execute tool calls
      const toolResults = await Promise.all(
        initialResult.toolCalls.map(async (toolCall) => {
          const result = await executeToolCall(toolCall.name, JSON.parse(toolCall.arguments))
          return { toolCallId: toolCall.id, result }
        })
      )

      // Build search results context
      const searchResults = toolResults.map(tr => tr.result).join('\n\n')
      
      // Create new messages with search results
      const newSystemPrompt = `${finalSystemPrompt}\n\nYou have access to current search results. Use them to provide accurate, up-to-date information.`
      const newMessages: Array<{ role: string; content: string }> = [
        { role: 'system', content: newSystemPrompt },
        { role: 'system', content: `Current search results:\n${searchResults}` },
        { role: 'user', content: input.trim() }
      ]

      // Stream final response with search context
      for await (const chunk of adapter.generateStream({ messages: newMessages, settings: mergedSettings, fileIds })) {
        yield chunk
      }
      return
    }
  }

  // No tool calls, proceed with normal streaming
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
