// backend/logic/adapters/openai/index.ts

/**
 * OpenAI Factory Pattern Exports
 * 
 * This module provides a clean interface for the OpenAI factory pattern,
 * exporting factory-generated adapters, configurations, and utilities.
 */

// Factory function and types
export { createOpenAIAdapter } from './factory'
export type { 
  OpenAIAdapterOptions, 
  OpenAIModelConfig, 
  OpenAIUsage,
  OpenAIGenerateResult,
  OpenAIStreamChunk
} from './types'

// Model configurations
export { 
  OPENAI_MODELS, 
  getModelConfig, 
  getAllModelIds, 
  getActiveModels 
} from './models'

// Pre-built adapter instances
export { 
  gpt41NanoAdapter,
  openaiAdapters
} from './adapters'
