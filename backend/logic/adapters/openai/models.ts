// backend/logic/adapters/openai/models.ts

import type { OpenAIModelConfig } from './types'

/**
 * Central configuration for all OpenAI models
 *
 * This file is the definitive source of model configurations.
 * Keeping only nano variants for optimal speed and cost efficiency.
 */
export const OPENAI_MODELS: Record<string, OpenAIModelConfig> = {
  // GPT-4.1 Nano - Fastest GPT-4.1 model (Chat Completions API)
  'gpt-4.1-nano': {
    model: 'gpt-4.1-nano',
    name: 'GPT-4.1 Nano',
    apiMode: 'chat',
    contextWindow: 128000,
    defaultMaxTokens: 1024,
    defaultTemperature: 0.7,
    pricing: {
      input: 0.20,   // $0.20 / 1M input tokens
      output: 0.80,  // $0.80 / 1M output tokens
    },
  },

  // GPT-5 Nano - Fastest GPT-5 model (Responses API)
  'gpt-5-nano': {
    model: 'gpt-5-nano',
    name: 'GPT-5 Nano',
    apiMode: 'responses',
    contextWindow: 200000,
    defaultMaxTokens: 2048,
    defaultTemperature: 0.2,
    pricing: {
      input: 0.05,   // $0.05 / 1M input tokens
      output: 0.4,   // $0.40 / 1M output tokens
    },
  },
}

/**
 * Get model configuration by ID or alias
 */
export function getModelConfig(modelId: string): OpenAIModelConfig | undefined {
  // Direct lookup first
  if (OPENAI_MODELS[modelId]) {
    return OPENAI_MODELS[modelId]
  }

  // Search by alias
  for (const config of Object.values(OPENAI_MODELS)) {
    if (config.aliases?.includes(modelId)) {
      return config
    }
  }

  return undefined
}

/**
 * Get all available model IDs (including aliases)
 */
export function getAllModelIds(): string[] {
  const ids: string[] = []

  for (const [modelId, config] of Object.entries(OPENAI_MODELS)) {
    ids.push(modelId)
    if (config.aliases) {
      ids.push(...config.aliases)
    }
  }

  return ids
}

/**
 * Get only non-deprecated models
 */
export function getActiveModels(): Record<string, OpenAIModelConfig> {
  return Object.fromEntries(
    Object.entries(OPENAI_MODELS).filter(([_, config]) => !config.deprecated)
  )
}
