# Models Type Definitions

This file documents the type definitions found in `/backend/types/models.ts`.

## Overview

The `models.ts` file defines the interface for Language Learning Model (LLM) adapters used in the Kalito application. This interface establishes a consistent contract for all AI model integrations, whether they are cloud-based or local.

## Interfaces

### LLMAdapter

```typescript
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
  }): Promise<{ reply: string; tokenUsage: number | null }>

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
```

#### Properties

- `id`: Unique identifier for the model adapter
- `name`: Display name of the model
- `type`: Type of model, either 'cloud' or 'local'
- `contextWindow`: Optional number indicating the token context window size
- `pricing`: Optional pricing information as a string
- `info`: Optional additional information about the model

#### Methods

**generate**

A method for standard, non-streaming text generation:

```typescript
generate(_args: {
  messages: { role: string; content: string }[]
  settings?: Record<string, unknown>
  fileIds?: string[]
}): Promise<{ reply: string; tokenUsage: number | null }>
```

Parameters:
- `messages`: Array of message objects with role and content fields, representing the conversation history
- `settings`: Optional object containing model-specific settings
- `fileIds`: Optional array of file identifiers to provide additional context

Returns a Promise resolving to an object with:
- `reply`: The generated text response
- `tokenUsage`: Number of tokens used (can be null if not available)

**generateStream** (Optional)

An optional method for streaming text generation:

```typescript
generateStream?(_args: {
  messages: { role: string; content: string }[]
  settings?: Record<string, unknown>
  fileIds?: string[]
}): AsyncGenerator<{ delta: string; done?: boolean; tokenUsage?: number }>
```

Parameters:
- Same as the `generate` method

Returns an AsyncGenerator that yields objects with:
- `delta`: Text chunk from the streaming response
- `done`: Optional boolean indicating if the stream is complete
- `tokenUsage`: Optional number of tokens used so far

## Usage in the Codebase

The LLMAdapter interface is imported in:

1. `/backend/logic/modelRegistry.ts`:
   ```typescript
   import type { LLMAdapter } from '../types/models'
   ```
   
   This is the primary module that manages model adapters in the backend. It likely maintains a registry of available models and provides methods to get the appropriate adapter for a given model ID.

The system appears to have multiple model adapter implementations:

- Cloud-based adapters:
  - Claude (`/backend/logic/adapters/claudeAdapter.ts`)
  - OpenAI models (`/backend/logic/adapters/openai/*`)
  
- Local models:
  - Mistral (`/backend/logic/adapters/mistralAdapter.ts`)
  - Qwen 2.5 (`/backend/logic/adapters/qwen25Adapter.ts`)
  - Qwen 2.5 Coder (`/backend/logic/adapters/qwen25CoderAdapter.ts`)

Each of these adapter implementations should conform to the LLMAdapter interface, providing a consistent way to interact with different AI models regardless of their underlying implementation details.