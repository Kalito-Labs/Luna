// backend/types/models.ts
/**
 * LLM Adapter interface - defines the contract for all AI model adapters
 * Used by both backend model registry and frontend model management
 */

import type { ChatCompletionTool } from 'openai/resources'

export interface LLMAdapter {
  id: string
  name: string
  type: 'cloud' | 'local'
  contextWindow?: number
  pricing?: string
  info?: string
  /**
   * Classic (non-streaming) generation
   */
  generate(_args: {
    messages: { role: string; content: string }[]
    settings?: Record<string, unknown>
    fileIds?: string[]
    tools?: ChatCompletionTool[]
  }): Promise<{ reply: string; tokenUsage: number | null; toolCalls?: Array<{ id: string; name: string; arguments: string }> }>

  /**
   * Streaming generation (optional)
   * Async generator yields { delta, done?, tokenUsage? }
   */
  generateStream?(_args: {
    messages: { role: string; content: string }[]
    settings?: Record<string, unknown>
    fileIds?: string[]
  }): AsyncGenerator<{ delta: string; done?: boolean; tokenUsage?: number }>
}
