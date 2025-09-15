import type { LLMAdapter } from '../modelRegistry'
import { fetch } from 'undici'
import { TextDecoder } from 'util'

export const qwen25CoderAdapter: LLMAdapter = {
  id: 'qwen-2.5-coder-3b',
  name: 'Qwen 2.5 Coder 3B',
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
    if (Array.isArray((settings as any).stopSequences) && (settings as any).stopSequences.length > 0) {
      options.stop = (settings as any).stopSequences
    }

    const body = {
      model: 'qwen2.5-coder:3b',
      messages,              // ← includes system persona + history + current user
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

    // Non-streaming response example:
    // { "message": { "role":"assistant","content":"..." }, "done": true, ... }
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
    if (Array.isArray((settings as any).stopSequences) && (settings as any).stopSequences.length > 0) {
      options.stop = (settings as any).stopSequences
    }

    const body = {
      model: 'qwen2.5-coder:3b',
      messages,              // ← includes system persona + history + current user
      stream: true,
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
