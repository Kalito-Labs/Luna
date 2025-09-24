/**
 * core.ts
 *
 * Core logic for agent API calls, chat session/message management, and browser storage utilities.
 * Uses shared types/constants from backend/types for contract parity.
 */

import type { AgentRequest, AgentResponse } from '../../backend/types/agent'
import type { PersonaCategory } from '../../backend/types/personas'

/**
 * sendMessageToAgent
 * Calls the backend `/api/agent` endpoint with the user input, context, and settings,
 * then returns the AI assistant's reply **and token usage** or a friendly error message.
 */
export async function sendMessageToAgent(
  userInput: string,
  systemPrompt: string = '',
  modelKey: string,
  sessionSettings: Partial<AgentRequest['settings']> & { persona?: string; customContext?: string; fileIds?: string[] } = {
    model: modelKey,
  },
  fileIds: string[] = [],
  sessionId?: string,
  sessionName?: string
): Promise<{ reply: string; tokenUsage: number }> {
  try {
    // Whitelist settings to only include valid API properties
    const validSettings: Partial<AgentRequest['settings']> = {}

    if ('model' in sessionSettings && sessionSettings.model) validSettings.model = sessionSettings.model
    if ('temperature' in sessionSettings && sessionSettings.temperature !== undefined) validSettings.temperature = sessionSettings.temperature
    if ('maxTokens' in sessionSettings && sessionSettings.maxTokens !== undefined) validSettings.maxTokens = sessionSettings.maxTokens
    if ('topP' in sessionSettings && sessionSettings.topP !== undefined) validSettings.topP = sessionSettings.topP
    if ('frequencyPenalty' in sessionSettings && sessionSettings.frequencyPenalty !== undefined) validSettings.frequencyPenalty = sessionSettings.frequencyPenalty
    if ('presencePenalty' in sessionSettings && sessionSettings.presencePenalty !== undefined) validSettings.presencePenalty = sessionSettings.presencePenalty
    if ('outputFormat' in sessionSettings && sessionSettings.outputFormat !== undefined) validSettings.outputFormat = sessionSettings.outputFormat

    // Merge fileIds: prefer function arg; fall back to sessionSettings.fileIds
    const sessionFileIds = 'fileIds' in sessionSettings ? (sessionSettings.fileIds as string[] | undefined) : undefined
    const finalFileIds = fileIds.length > 0 ? fileIds : (sessionFileIds || [])

    // Extract persona/context
    const persona = 'persona' in sessionSettings ? sessionSettings.persona : undefined
    const customContext = 'customContext' in sessionSettings ? sessionSettings.customContext : undefined

    // Optimize the prompt for the selected model
    const optimizedPrompt = optimizePromptForModel(systemPrompt, modelKey)

    const payload: AgentRequest & {
      sessionId?: string
      sessionName?: string
      personaId?: string
      customContext?: string
    } = {
      input: userInput,
      systemPrompt: optimizedPrompt,
      modelName: modelKey,
      // Model authority: modelKey wins by placing it last
      settings: { ...validSettings, model: modelKey },
      fileIds: finalFileIds,
      stream: false, // AI-Protocols: Explicitly disable streaming for sendMessageToAgent
    }
    if (sessionId) payload.sessionId = sessionId
    if (sessionName) payload.sessionName = sessionName
    if (persona) payload.personaId = persona
    if (customContext) payload.customContext = customContext

    const response = await fetch('/api/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      // eslint-disable-next-line no-console
      console.error('Agent API error', response.status, response.statusText)
      return {
        reply: '😞 Sorry, I hit an error. Let’s try again in a moment.',
        tokenUsage: 0,
      }
    }

    const data: AgentResponse = await response.json()
    return {
      reply: typeof data.reply === 'string' ? data.reply : '(No reply from agent)',
      tokenUsage: typeof data.tokenUsage === 'number' ? data.tokenUsage : 0,
    }
  } catch (_err) {
    // eslint-disable-next-line no-console
    console.error('sendMessageToAgent: Network or JSON error', _err)
    return {
      reply: '😞 Sorry, there was a network error. Please try again.',
      tokenUsage: 0,
    }
  }
}

/**
 * sendMessageToAgentStream
 * Streams messages from the backend using Server-Sent Events (SSE).
 * Returns an async generator that yields streaming chunks.
 */
export async function* sendMessageToAgentStream(
  userInput: string,
  systemPrompt: string = '',
  modelKey: string,
  sessionSettings: Partial<AgentRequest['settings']> & { persona?: string; customContext?: string; fileIds?: string[] } = {
    model: modelKey,
  },
  fileIds: string[] = [],
  sessionId?: string,
  sessionName?: string
): AsyncGenerator<{ delta?: string; done?: boolean; tokenUsage?: number; error?: string }> {
  try {
    // Extract persona/context and whitelist settings; do NOT drop persona
    const { persona, customContext, fileIds: sessionFileIds, ...maybeSettings } = sessionSettings

    const validSettings: Partial<AgentRequest['settings']>= {}
    if ('model' in maybeSettings && maybeSettings.model) validSettings.model = maybeSettings.model
    if ('temperature' in maybeSettings && maybeSettings.temperature !== undefined) validSettings.temperature = maybeSettings.temperature
    if ('maxTokens' in maybeSettings && maybeSettings.maxTokens !== undefined) validSettings.maxTokens = maybeSettings.maxTokens
    if ('topP' in maybeSettings && maybeSettings.topP !== undefined) validSettings.topP = maybeSettings.topP
    if ('frequencyPenalty' in maybeSettings && maybeSettings.frequencyPenalty !== undefined) validSettings.frequencyPenalty = maybeSettings.frequencyPenalty
    if ('presencePenalty' in maybeSettings && maybeSettings.presencePenalty !== undefined) validSettings.presencePenalty = maybeSettings.presencePenalty
    if ('outputFormat' in maybeSettings && maybeSettings.outputFormat !== undefined) validSettings.outputFormat = maybeSettings.outputFormat

    // File IDs parity with non-streaming: prefer arg, fall back to session
    const finalFileIds = fileIds.length > 0 ? fileIds : (sessionFileIds || [])

    // Optimize the prompt for the selected model
    const optimizedPrompt = optimizePromptForModel(systemPrompt, modelKey)

    const payload: AgentRequest & {
      sessionId?: string
      sessionName?: string
      stream: boolean
      personaId?: string
      customContext?: string
    } = {
      input: userInput,
      systemPrompt: optimizedPrompt,
      modelName: modelKey,
      // Model authority: modelKey wins by placing it last
      settings: { ...validSettings, model: modelKey },
      fileIds: finalFileIds,
      stream: true,
    }
    if (sessionId) payload.sessionId = sessionId
    if (sessionName) payload.sessionName = sessionName
    if (persona) payload.personaId = persona
    if (customContext) payload.customContext = customContext

    const response = await fetch('/api/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      // Get more specific error information
      let errorMessage = "😞 Sorry, I hit an error. Let's try again in a moment."
      try {
        const errorData = await response.json()
        if (errorData.error) {
          errorMessage = `😞 ${errorData.error}`
        }
      } catch {
        // If we can't parse the error response, use the status text
        errorMessage = `😞 Server error (${response.status}): ${response.statusText}`
      }

      // eslint-disable-next-line no-console
      console.error('Agent API error', response.status, response.statusText)
      yield { error: errorMessage }
      return
    }

    const reader = response.body?.getReader()
    if (!reader) {
      yield { error: 'Failed to get response stream' }
      return
    }

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6))
            yield data
          } catch (err) {
            // eslint-disable-next-line no-console
            console.error('Failed to parse SSE data:', err)
          }
        }
      }
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('sendMessageToAgentStream: Network error', err)
    yield { error: '😞 Sorry, there was a network error. Please try again.' }
  }
}

/**
 * fetchAvailableModels
 * Fetches the list of available models from the backend `/api/models` endpoint.
 */
export async function fetchAvailableModels() {
  const response = await fetch('/api/models')
  if (!response.ok) throw new Error('Failed to fetch models')
  const data = await response.json()
  return data.models || [] // Extract models array from response
}

/**
 * selectOptimalModel
 * Intelligently selects the best model based on persona category
 *
 * @param category - The persona category (cloud, local)
 * @param availableModels - List of available models to choose from
 * @returns The optimal model key for the given category
 */
export interface ModelInfo {
  key: string
  name: string
  [key: string]: string | number | boolean | unknown
}

export function selectOptimalModel(
  category: PersonaCategory = 'cloud',
  availableModels: ModelInfo[] = []
): string {
  // Default fallback model (if no models match or are available)
  let fallbackModel = 'gpt-4.1-nano'

  // If no models are available, return the fallback
  if (!availableModels.length) {
    return fallbackModel
  }

  // Find first available model as a fallback
  fallbackModel = availableModels[0]?.key || fallbackModel

  // Priority lists for each category
  const modelPriorities: Record<PersonaCategory, string[]> = {
    // Cloud models prioritize powerful cloud-hosted models
    cloud: [
      'claude-sonnet-4',
      'gpt-4.1-mini',
      'gpt-4.1-nano',
    ],

    // Local models prioritize locally-hosted models
    local: ['llama-3.2-3b', 'llama-3.1-8b'],
  }

  // Get the priority list for the requested category
  const priorityList = modelPriorities[category]

  // Find the first available model from the priority list
  const availableModelKeys = availableModels.map(model => model.key)
  const optimalModel = priorityList.find(modelKey => availableModelKeys.includes(modelKey))

  // Return the optimal model, or fallback if none found
  return optimalModel || fallbackModel
}

/**
 * optimizePromptForModel
 * Adjusts the system prompt based on the model's capabilities
 *
 * @param prompt - The original system prompt
 * @param modelKey - The selected model's key
 * @returns Optimized system prompt
 */
export function optimizePromptForModel(prompt: string, modelKey: string): string {
  // Avoid appending guidance when the prompt is empty
  if (!prompt) return ''

  // List of local models that benefit from conciseness instructions
  const localModels = ['llama-3.2-3b', 'llama-3.1-8b']

  // For local models, add conciseness instruction to help with context limits
  if (localModels.includes(modelKey)) {
    return `${prompt}\n\nPlease provide concise responses optimized for limited context windows.`
  }

  // For cloud models, use the prompt as-is
  return prompt
}

/**
 * fetchSessions
 * Fetches all chat sessions from the backend `/api/sessions`.
 */
export async function fetchSessions() {
  const response = await fetch('/api/sessions')
  if (!response.ok) throw new Error('Failed to fetch sessions')
  return response.json()
}

/**
 * Local Session Storage Management
 * For preserving current session state across page refreshes without saving to database
 */
const LOCAL_SESSION_KEY = 'kalito-current-session'
const LOCAL_MESSAGES_KEY = 'kalito-current-messages'
const LOCAL_SETTINGS_KEY = 'kalito-current-settings'

interface LocalSessionData {
  sessionId: string
  messages: unknown[]
  settings: Record<string, unknown>
}

export function saveCurrentSessionToLocal(sessionId: string, messages: unknown[], settings: Record<string, unknown>) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(LOCAL_SESSION_KEY, sessionId)
      window.localStorage.setItem(LOCAL_MESSAGES_KEY, JSON.stringify(messages))
      window.localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(settings))
    }
  } catch {
    // Silent fail - local storage might not be available
  }
}

export function loadCurrentSessionFromLocal(): LocalSessionData | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const sessionId = window.localStorage.getItem(LOCAL_SESSION_KEY)
      const messagesStr = window.localStorage.getItem(LOCAL_MESSAGES_KEY)
      const settingsStr = window.localStorage.getItem(LOCAL_SETTINGS_KEY)

      if (!sessionId || !messagesStr || !settingsStr) {
        return null
      }

      return {
        sessionId,
        messages: JSON.parse(messagesStr),
        settings: JSON.parse(settingsStr)
      }
    }
    return null
  } catch {
    return null
  }
}

export function clearCurrentSessionFromLocal() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(LOCAL_SESSION_KEY)
      window.localStorage.removeItem(LOCAL_MESSAGES_KEY)
      window.localStorage.removeItem(LOCAL_SETTINGS_KEY)
    }
  } catch {
    // Silent fail
  }
}

/**
 * createSession
 * Creates a persistent session immediately saved to database (auto-save model).
 * All sessions are persistent and appear in sidebar automatically.
 */
export async function createSession(name: string = 'New Chat') {
  // Generate session ID
  const uuid =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Date.now().toString() + Math.floor(Math.random() * 1000).toString()

  // Return session object (will be persisted on first message via ensurePersistentSession)
  return {
    id: uuid,
    name: name,
    created_at: new Date().toISOString(),
    saved: 1, // Always saved in auto-save model
  }
}

/**
 * saveSession
 * Saves the current session recap to the backend for persistence.
 * POSTs to `/api/sessions/save` with { sessionId, recap, model, personaId, name }
 */
export async function saveSession(
  sessionId: string,
  recap: string,
  model: string,
  personaId?: string,
  name?: string
) {
  const response = await fetch('/api/sessions/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, recap, model, personaId, name }),
  })
  if (!response.ok) throw new Error('Failed to save session')
  return response.json()
}

/**
 * deleteSession
 * Deletes a session via backend.
 */
/**
 * createSemanticPin
 * Creates a semantic pin for a specific session.
 * POSTs to `/api/memory/pins` with the pin data
 */
export async function createSemanticPin(
  sessionId: string,
  content: string,
  sourceMessageId?: string,
  pinType: 'manual' | 'auto' | 'code' | 'concept' | 'system' = 'manual'
) {
  try {
    const response = await fetch('/api/memory/pins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        content,
        source_message_id: sourceMessageId,
        pin_type: pinType,
        importance_score: 0.8 // Default importance score for manual pins
      }),
    })
    
    if (!response.ok) {
      throw new Error('Failed to create semantic pin')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error creating semantic pin:', error)
    throw error
  }
}

export async function deleteSession(sessionId: string) {
  if (!sessionId) throw new Error('No sessionId provided')
  const response = await fetch(`/api/sessions/${encodeURIComponent(sessionId)}`, {
    method: 'DELETE',
  })
  if (!response.ok) throw new Error('Failed to delete session')
  return response.json()
}

/**
 * fetchAvailablePersonas
 * Fetches all available personas from the backend API.
 */
export async function fetchAvailablePersonas() {
  try {
    const response = await fetch('/api/personas')
    if (!response.ok) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch personas:', response.status, response.statusText)
      return []
    }
    const data = await response.json()
    return data.personas || []
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching personas:', error)
    return []
  }
}

/**
 * Document Management Functions
 * 
 * NOTE: This functionality has been removed.
 * The document-related features will be implemented in a future version.
 */
