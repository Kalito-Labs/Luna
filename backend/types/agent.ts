
// import type { string } from '../constants/formats'

/**
 * Full definition of a model agent used by Kalito apps and backend.
 * Mirrors structure of 1.json, 2.json, and 3.json agent config files.
 */
export interface AgentConfig {
  modelName: string
  displayName: string
  bio: string
  description: string
  persona: string
  pricing: {
    input: number
    output: number
    currency: string
    unit: string
  }
  limits: {
    maxTokens: number
    maxInputTokens?: number
    maxOutputTokens?: number
    minTemperature: number
    maxTemperature: number
    temperatureStep: number
    minTopP?: number
    maxTopP?: number
    topPStep?: number
    minFrequencyPenalty?: number
    maxFrequencyPenalty?: number
    frequencyPenaltyStep?: number
    minPresencePenalty?: number
    maxPresencePenalty?: number
    presencePenaltyStep?: number
    allowedstrings?: string[]
  }
  defaultSettings: {
    temperature: number
    maxTokens: number
    topP: number
    frequencyPenalty: number
    presencePenalty: number
    outputFormat: string
  }
  guidelines: string[]
}

/**
 * Canonical agent API request payload for /api/agent
 */
export interface AgentRequest {
  input: string
  systemPrompt?: string
  modelName: string
  settings: {
    model: string
    temperature?: number
    maxTokens?: number
    topP?: number
    frequencyPenalty?: number
    presencePenalty?: number
    outputFormat?: string
  }
  fileIds?: string[]
  stream?: boolean // AI-Protocols: Support streaming control
}

/**
 * Canonical agent API response payload from /api/agent
 */
export interface AgentResponse {
  reply: string
  tokenUsage: number
  logs?: unknown[]
}
