// backend/logic/adapters/openai/adapters.ts

import { createOpenAIAdapter } from './factory'
import { OPENAI_MODELS } from './models'
import type { LLMAdapter } from '../../modelRegistry'

/**
 * Factory-generated OpenAI adapters
 * 
 * These adapters are created using the factory pattern to eliminate
 * code duplication and provide consistent behavior across all OpenAI models.
 * 
 * Keeping only nano variants for optimal speed and cost efficiency.
 */

// GPT-4.1 Nano - Fastest GPT-4.1 model
export const gpt41NanoAdapter: LLMAdapter = createOpenAIAdapter({
  id: 'gpt-4.1-nano',
  config: OPENAI_MODELS['gpt-4.1-nano'],
})

// GPT-5 Nano - Fastest GPT-5 model for quick tasks
export const gpt5NanoAdapter: LLMAdapter = createOpenAIAdapter({
  id: 'gpt-5-nano',
  config: OPENAI_MODELS['gpt-5-nano'],
})

/**
 * Collection of all factory-generated OpenAI adapters
 */
export const openaiAdapters = {
  'gpt-4.1-nano': gpt41NanoAdapter,
  'gpt-5-nano': gpt5NanoAdapter,
} as const
