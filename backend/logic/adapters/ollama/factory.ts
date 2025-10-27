/**
 * Ollama Adapter Factory
 * 
 * Factory function to create LLM adapters for Ollama models.
 * Reduces code duplication across local model adapters.
 * 
 * Pattern mirrors the OpenAI factory approach for consistency.
 */

import type { LLMAdapter } from '../../modelRegistry'
import { fetch } from 'undici'
import { TextDecoder } from 'util'

/**
 * Configuration for an Ollama model adapter
 */
export interface OllamaAdapterConfig {
  /** Canonical adapter ID (e.g., 'phi3-mini') */
  id: string
  
  /** Display name for UI (e.g., 'Phi-3 Mini') */
  name: string
  
  /** Ollama model identifier (e.g., 'phi3:mini') */
  model: string
  
  /** Context window size in tokens */
  contextWindow: number
  
  /** Optional Ollama base URL (defaults to localhost:11434) */
  baseUrl?: string
}

/**
 * Create an Ollama adapter with the given configuration
 */
export function createOllamaAdapter(config: OllamaAdapterConfig): LLMAdapter {
  const { id, name, model, contextWindow, baseUrl = 'http://localhost:11434' } = config

  return {
    id,
    name,
    type: 'local',
    contextWindow,

    async generate(payload: {
      messages: { role: string; content: string }[]
      settings?: Record<string, unknown>
      fileIds?: string[]
      tools?: unknown // Ollama doesn't support tools yet
    }): Promise<{ reply: string; tokenUsage: number | null; toolCalls?: Array<{ id: string; name: string; arguments: string }> }> {
      const { messages, settings = {} } = payload

      // Map generic settings -> Ollama options
      const options: Record<string, unknown> = {}
      if (settings.temperature !== undefined) options.temperature = settings.temperature
      if (settings.maxTokens !== undefined) options.num_predict = settings.maxTokens
      if (settings.topP !== undefined) options.top_p = settings.topP
      if (settings.repeatPenalty !== undefined) options.repeat_penalty = settings.repeatPenalty
      
      // Handle stop sequences with proper typing
      const stopSequences = (settings as { stopSequences?: string[] }).stopSequences
      if (Array.isArray(stopSequences) && stopSequences.length > 0) {
        options.stop = stopSequences
      }

      const body = {
        model,
        messages,
        stream: false,
        options: Object.keys(options).length ? options : undefined,
      }

      const resp = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!resp.ok) {
        throw new Error(`Ollama error: ${resp.status} ${resp.statusText}`)
      }

      const data = (await resp.json()) as {
        message?: { content?: string }
        done?: boolean
      }

      const reply = data?.message?.content?.trim() ?? ''
      return {
        reply,
        tokenUsage: null, // Ollama doesn't provide reliable token counts
      }
    },

    async *generateStream(payload: {
      messages: { role: string; content: string }[]
      settings?: Record<string, unknown>
      fileIds?: string[]
    }) {
      const { messages, settings = {} } = payload

      // Map generic settings -> Ollama options
      const options: Record<string, unknown> = {}
      if (settings.temperature !== undefined) options.temperature = settings.temperature
      if (settings.maxTokens !== undefined) options.num_predict = settings.maxTokens
      if (settings.topP !== undefined) options.top_p = settings.topP
      if (settings.repeatPenalty !== undefined) options.repeat_penalty = settings.repeatPenalty
      
      // Handle stop sequences with proper typing
      const stopSequences = (settings as { stopSequences?: string[] }).stopSequences
      if (Array.isArray(stopSequences) && stopSequences.length > 0) {
        options.stop = stopSequences
      }

      const body = {
        model,
        messages,
        stream: true,
        options: Object.keys(options).length ? options : undefined,
      }

      const resp = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!resp.ok) {
        throw new Error(`Ollama error: ${resp.status} ${resp.statusText}`)
      }

      const reader = resp.body?.getReader()
      if (!reader) throw new Error('No response stream')

      const decoder = new TextDecoder()
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          // Ollama streams JSONL: one JSON object per line
          const lines = chunk.split('\n').filter(Boolean)

          for (const line of lines) {
            try {
              // Example event:
              // { "message":{"role":"assistant","content":"partial"}, "done": false }
              // Final:
              // { "done": true, ... }
              const evt = JSON.parse(line)

              if (evt.message?.content) {
                yield {
                  delta: evt.message.content as string,
                  done: !!evt.done,
                }
              }

              if (evt.done) {
                // Always yield final done event, even if no content
                yield {
                  delta: '',
                  done: true,
                }
                return
              }
            } catch {
              // Skip malformed/partial lines (common at chunk boundaries)
            }
          }
        }
      } finally {
        reader.releaseLock()
      }
    },
  }
}
