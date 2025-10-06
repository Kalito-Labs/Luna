/**
 * Ollama Model Adapters
 * 
 * Pre-configured adapters for local Ollama models.
 * All adapters are created using the factory pattern for consistency.
 */

import { createOllamaAdapter } from './factory'
import type { LLMAdapter } from '../../modelRegistry'

/**
 * Qwen 2.5 Coder 3B - Coding-focused model with 32K context
 */
export const qwen25CoderAdapter: LLMAdapter = createOllamaAdapter({
  id: 'qwen-2.5-coder-3b',
  name: 'Qwen 2.5 Coder 3B',
  model: 'qwen2.5-coder:3b',
  contextWindow: 32768,
})

/**
 * Phi-3 Mini - Lightweight reasoning model with 4K context
 */
export const phi3MiniAdapter: LLMAdapter = createOllamaAdapter({
  id: 'phi3-mini',
  name: 'Phi-3 Mini',
  model: 'phi3:mini',
  contextWindow: 4096,
})

/**
 * Neural Chat 7B - High-performance Mistral-based chatbot with 32K context
 */
export const neuralChatAdapter: LLMAdapter = createOllamaAdapter({
  id: 'neural-chat-7b',
  name: 'Neural Chat 7B',
  model: 'neural-chat:7b',
  contextWindow: 32768,
})

/**
 * Collection of all Ollama adapters
 */
export const ollamaAdapters = {
  'qwen-2.5-coder-3b': qwen25CoderAdapter,
  'phi3-mini': phi3MiniAdapter,
  'neural-chat-7b': neuralChatAdapter,
} as const

/**
 * Get all Ollama adapter IDs
 */
export function getOllamaAdapterIds(): string[] {
  return Object.keys(ollamaAdapters)
}
