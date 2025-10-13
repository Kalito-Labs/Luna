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
 * Using only GPT-4.1 Nano - works perfectly with eldercare database context.
 */

// GPT-4.1 Nano - Fastest GPT-4.1 model with excellent context understanding
export const gpt41NanoAdapter: LLMAdapter = createOpenAIAdapter({
  id: 'gpt-4.1-nano',
  config: OPENAI_MODELS['gpt-4.1-nano'],
})

/**
 * Collection of all factory-generated OpenAI adapters
 */
export const openaiAdapters = {
  'gpt-4.1-nano': gpt41NanoAdapter,
} as const
