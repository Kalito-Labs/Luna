import Anthropic from '@anthropic-ai/sdk'
import type { LLMAdapter } from '../modelRegistry'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'sk-ant-xxx',
})

// Debug logging
console.log(
  'Anthropic API Key loaded:',
  process.env.ANTHROPIC_API_KEY
    ? 'YES (length: ' + process.env.ANTHROPIC_API_KEY.length + ')'
    : 'NO'
)

export const claudeAdapter: LLMAdapter = {
  id: 'claude-opus-4.1',
  name: 'Claude Opus 4.1',
  type: 'cloud',
  contextWindow: 200000, // Claude Opus 4.1 has 200K context window

  /**
   * Classic non-streaming generation: returns full reply at once.
   */
  async generate({
    messages,
    settings = {},
    fileIds: _fileIds = [],
  }: {
    messages: { role: string; content: string }[]
    settings?: Record<string, unknown>
    fileIds?: string[]
  }) {
    console.log('Claude generate called with:', {
      messagesCount: messages.length,
      model: 'claude-opus-4-1-20250805',
      settings,
    })

    try {
      // Convert messages format for Anthropic API
      const anthropicMessages: { role: 'user' | 'assistant'; content: string }[] = []
      let systemMessage = ''

      for (const msg of messages) {
        if (msg.role === 'system') {
          systemMessage = msg.content
        } else if (msg.role === 'user' || msg.role === 'assistant') {
          anthropicMessages.push({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
          })
        }
      }

      const completion = await anthropic.messages.create({
        model: 'claude-opus-4-1-20250805',
        max_tokens: (settings.maxTokens as number) || 1024,
        temperature: (settings.temperature as number) || 0.7,
        system: systemMessage || undefined,
        messages: anthropicMessages,
      })

      const reply = completion.content[0]?.type === 'text' ? completion.content[0].text : ''
      const tokenUsage =
        (completion.usage?.input_tokens || 0) + (completion.usage?.output_tokens || 0)

      console.log('Claude response received:', {
        reply: reply.substring(0, 100) + '...',
        tokenUsage,
      })

      return { reply, tokenUsage }
    } catch (error) {
      console.error('Claude API error:', error)
      throw new Error(
        `Claude generation failed: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  },

  /**
   * Streaming generation: yields chunks progressively.
   */
  async *generateStream({
    messages,
    settings = {},
    fileIds: _fileIds = [],
  }: {
    messages: { role: string; content: string }[]
    settings?: Record<string, unknown>
    fileIds?: string[]
  }) {
    console.log('Claude generateStream called with:', {
      messagesCount: messages.length,
      model: 'claude-opus-4-1-20250805',
      settings,
    })

    try {
      // Convert messages format for Anthropic API
      const anthropicMessages: { role: 'user' | 'assistant'; content: string }[] = []
      let systemMessage = ''

      for (const msg of messages) {
        if (msg.role === 'system') {
          systemMessage = msg.content
        } else if (msg.role === 'user' || msg.role === 'assistant') {
          anthropicMessages.push({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
          })
        }
      }

      const stream = await anthropic.messages.stream({
        model: 'claude-opus-4-1-20250805',
        max_tokens: (settings.maxTokens as number) || 1024,
        temperature: (settings.temperature as number) || 0.7,
        system: systemMessage || undefined,
        messages: anthropicMessages,
      })

      let totalTokens = 0

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          yield {
            delta: chunk.delta.text,
            done: false,
          }
        } else if (chunk.type === 'message_delta' && chunk.usage) {
          totalTokens = (chunk.usage.input_tokens || 0) + (chunk.usage.output_tokens || 0)
        }
      }

      // Final chunk with token usage
      yield {
        delta: '',
        done: true,
        tokenUsage: totalTokens,
      }

      console.log('Claude streaming completed, total tokens:', totalTokens)
    } catch (error) {
      console.error('Claude streaming error:', error)
      yield {
        delta: '',
        done: true,
        error: `Claude streaming failed: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  },
}
