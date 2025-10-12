/**
 * Ollama Model Adapters
 * 
 * Pre-configured adapters for local Ollama models.
 * All adapters are created using the factory pattern for consistency.
 */

import { createOllamaAdapter } from './factory'
import type { LLMAdapter } from '../../modelRegistry'

/**
 * Phi-3 Mini - Lightweight reasoning model with 4K context
 * Primary local model for fast, factual eldercare queries
 */
export const phi3MiniAdapter: LLMAdapter = createOllamaAdapter({
  id: 'phi3-mini',
  name: 'Phi-3 Mini',
  model: 'phi3:mini',
  contextWindow: 4096,
})

/**
 * Collection of all Ollama adapters
 */
export const ollamaAdapters = {
  'phi3-mini': phi3MiniAdapter,
} as const

/**
 * Get all Ollama adapter IDs
 */
export function getOllamaAdapterIds(): string[] {
  return Object.keys(ollamaAdapters)
}
