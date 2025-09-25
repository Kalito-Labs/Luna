// backend/logic/adapters/openai/types.ts

/**
 * OpenAI-specific types and interfaces for the factory pattern
 */

export type OpenAIModel = 
  | 'gpt-4.1-mini'
  | 'gpt-4.1-nano'
  | 'gpt-5-mini'
  | 'gpt-5-nano'

export type APIMode = 'chat' | 'responses'

export interface OpenAIModelConfig {
  /** The OpenAI model identifier */
  model: OpenAIModel
  /** Display name for the model */
  name: string
  /** API mode to use (chat completions vs responses) */
  apiMode: APIMode
  /** Context window size in tokens */
  contextWindow: number
  /** Default max tokens for responses */
  defaultMaxTokens: number
  /** Default temperature */
  defaultTemperature: number
  /** Pricing per million tokens (optional, for cost estimation) */
  pricing?: {
    input: number  // Cost per million input tokens
    output: number // Cost per million output tokens
  }
  /** Whether this model is deprecated */
  deprecated?: boolean
  /** Legacy aliases for backward compatibility */
  aliases?: string[]
}

export interface OpenAIAdapterOptions {
  /** Override the adapter ID (defaults to model name) */
  id?: string
  /** Override the display name */
  name?: string
  /** Model configuration */
  config: OpenAIModelConfig
  /** Optional OpenAI client instance (for testing/DI) */
  client?: unknown
}

export interface OpenAIUsage {
  prompt_tokens?: number
  completion_tokens?: number
  total_tokens?: number
  // Responses API format
  input_tokens?: number
  output_tokens?: number
}

export interface OpenAIGenerateResult {
  reply: string
  tokenUsage?: number
  estimatedCost?: number
}

export interface OpenAIStreamChunk {
  delta: string
  done?: boolean
  tokenUsage?: number
  estimatedCost?: number
}

export type ReasoningEffort = 'low' | 'medium' | 'high'

export interface OpenAIAdapterSettings {
  temperature?: number
  topP?: number
  maxTokens?: number
  max_output_tokens?: number
  // GPT-5 extras via Responses API:
  reasoning_effort?: ReasoningEffort
  verbosity?: 'brief' | 'full'
  // Pass-through for future params
  [key: string]: unknown
}
