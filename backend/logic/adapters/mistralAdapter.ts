import type { LLMAdapter } from '../modelRegistry'
import { fetch } from 'undici'
import { TextDecoder } from 'util'

export const mistralAdapter: LLMAdapter = {
  id: 'mistral-7b',
  name: 'Mistral 7B',
  type: 'local',
  contextWindow: 32768,

  async generate(payload: {
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
    if (Array.isArray(settings.stopSequences) && settings.stopSequences.length > 0) {
      options.stop = settings.stopSequences
    }

    const body = {
      model: 'mistral:7b',  // Ollama model name for Mistral 7B
      messages,             // ← includes system persona + history + current user
      stream: false,
      options: Object.keys(options).length ? options : undefined,
    }

    const resp = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!resp.ok) {
      throw new Error(`Ollama error: ${resp.status} ${resp.statusText}`)
    }

    // Non-streaming example:
    // { "message": { "role":"assistant","content":"..." }, "done": true, ... }
    const data = (await resp.json()) as {
      message?: { content?: string }
      done?: boolean
    }

    if (!data.message?.content) {
      throw new Error('Invalid response from Ollama: missing message content')
    }

    // Rough token estimation (chars / 4)
    const tokenUsage = Math.ceil((data.message.content.length || 0) / 4)

    return {
      reply: data.message.content,
      tokenUsage,
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
    if (Array.isArray(settings.stopSequences) && settings.stopSequences.length > 0) {
      options.stop = settings.stopSequences
    }

    const body = {
      model: 'mistral:7b',  // Ollama model name for Mistral 7B
      messages,             // ← includes system persona + history + current user
      stream: true,         // Enable streaming
      options: Object.keys(options).length ? options : undefined,
    }

    const resp = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!resp.ok) {
      throw new Error(`Ollama error: ${resp.status} ${resp.statusText}`)
    }

    if (!resp.body) {
      throw new Error('No response body for streaming')
    }

    const decoder = new TextDecoder()
    const reader = resp.body.getReader()
    let buffer = ''
    let totalTokens = 0

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep incomplete line in buffer

        for (const line of lines) {
          if (!line.trim()) continue

          try {
            const parsed = JSON.parse(line) as {
              message?: { content?: string }
              done?: boolean
            }

            if (parsed.message?.content) {
              const delta = parsed.message.content
              totalTokens += Math.ceil(delta.length / 4) // Rough estimation
              yield { delta, done: false }
            }

            if (parsed.done) {
              yield { delta: '', done: true, tokenUsage: totalTokens }
              return
            }
          } catch (parseError) {
            // Skip malformed JSON lines
            continue
          }
        }
      }
    } finally {
      reader.releaseLock()
    }

    // Final yield in case we exit without done:true
    yield { delta: '', done: true, tokenUsage: totalTokens }
  },
}
