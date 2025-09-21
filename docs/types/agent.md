# Agent Type Definitions

This file documents the type definitions found in `/backend/types/agent.ts`.

## Overview

The `agent.ts` file defines interfaces related to AI models, their configurations, and request/response formats for agent interactions in the Kalito application. These types are crucial for standardizing AI model interactions across the platform.

## Interfaces

### AgentConfig

Full definition of a model agent used by Kalito apps and backend. Mirrors the structure of agent config files (1.json, 2.json, and 3.json).

```typescript
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
```

#### Properties

- `modelName`: Identifier for the AI model
- `displayName`: User-friendly name shown in the UI
- `bio`: Brief bio description of the agent
- `description`: Detailed description of the agent's capabilities
- `persona`: Personality characteristics of the agent

**Pricing Configuration**
- `pricing.input`: Cost rate for input tokens
- `pricing.output`: Cost rate for output tokens
- `pricing.currency`: Currency used for pricing (e.g., "USD")
- `pricing.unit`: Unit of pricing (e.g., "1K tokens")

**Model Limits**
- `limits.maxTokens`: Maximum total tokens allowed
- `limits.maxInputTokens`: Optional maximum input tokens
- `limits.maxOutputTokens`: Optional maximum output tokens
- `limits.minTemperature` / `limits.maxTemperature`: Temperature range bounds
- `limits.temperatureStep`: Increment step for temperature UI controls
- `limits.minTopP` / `limits.maxTopP`: Top-P range bounds (optional)
- `limits.topPStep`: Increment step for top-p UI controls (optional)
- `limits.minFrequencyPenalty` / `limits.maxFrequencyPenalty`: Frequency penalty bounds (optional)
- `limits.frequencyPenaltyStep`: Increment step for frequency penalty UI controls (optional)
- `limits.minPresencePenalty` / `limits.maxPresencePenalty`: Presence penalty bounds (optional)
- `limits.presencePenaltyStep`: Increment step for presence penalty UI controls (optional)
- `limits.allowedstrings`: Optional array of allowed string formats

**Default Settings**
- `defaultSettings.temperature`: Default temperature value
- `defaultSettings.maxTokens`: Default maximum tokens
- `defaultSettings.topP`: Default top-p value
- `defaultSettings.frequencyPenalty`: Default frequency penalty
- `defaultSettings.presencePenalty`: Default presence penalty
- `defaultSettings.outputFormat`: Default output format (e.g., "text")

**Guidelines**
- `guidelines`: Array of guidelines or instructions for the agent

### AgentRequest

Canonical agent API request payload for `/api/agent` endpoint.

```typescript
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
```

#### Properties

- `input`: The user's input text/prompt
- `systemPrompt`: Optional system instructions to guide the model
- `modelName`: Identifier of the model to use
- `settings`: Configuration parameters for this specific request
  - `settings.model`: Model identifier (may duplicate modelName)
  - `settings.temperature`: Optional temperature control
  - `settings.maxTokens`: Optional token limit
  - `settings.topP`: Optional nucleus sampling parameter
  - `settings.frequencyPenalty`: Optional repetition penalty
  - `settings.presencePenalty`: Optional repetition penalty
  - `settings.outputFormat`: Optional output format specification
- `fileIds`: Optional array of file identifiers to provide context
- `stream`: Optional boolean flag to enable streaming responses

### AgentResponse

Canonical agent API response payload from `/api/agent` endpoint.

```typescript
export interface AgentResponse {
  reply: string
  tokenUsage: number
  logs?: unknown[]
}
```

#### Properties

- `reply`: The generated text response from the agent
- `tokenUsage`: Number of tokens consumed by this request
- `logs`: Optional array of log entries or debug information

## Usage in the Codebase

The `AgentRequest` type is imported and used in:

1. `/backend/logic/agentService.ts` - Used as part of the `RunAgentParams` type with additional fields:
   ```typescript
   type RunAgentParams = AgentRequest & {
     stream?: boolean // new: enable streaming mode
     personaId?: string // new: persona selection
     sessionId?: string // new: session ID for conversation history retrieval
   }
   ```
   
2. `/frontend/src/core.ts` - Imports both `AgentRequest` and `AgentResponse` types for frontend interactions with the backend agent API.

These types serve as the contract between frontend and backend for AI agent interactions, ensuring consistency in request and response formats.