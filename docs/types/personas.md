# Personas Type Definitions

This file documents the type definitions found in `/backend/types/personas.ts`.

## Overview

The `personas.ts` file defines types related to AI personas in the Kalito application. Personas allow customizing the behavior, personality, and settings of AI models for different use cases and interactions. This file also includes API response types using the shared API envelope patterns.

## Imports

```typescript
import {
  API_CONTRACT_VERSION,
  type ApiErrorResponse,
  type ApiSuccessItem,
  type ApiSuccessList,
} from './api'
```

The file imports standardized API response types from `./api.ts` to maintain consistent API contracts.

## Type Definitions

### PersonaCategory

```typescript
export type PersonaCategory = 'cloud' | 'local'
```

Defines the categories of personas, which map one-to-one with model families exposed in the UI:
- `cloud`: Cloud-based models (e.g., OpenAI, Claude)
- `local`: Locally running models (e.g., Mistral, Qwen)

## Interfaces

### PersonaSettings

```typescript
export interface PersonaSettings {
  /** 0.0–2.0 typical; UI sliders can constrain to 0.1–1.2 */
  temperature?: number
  /** Response cap; UI may constrain 50–4000 but keep it open here */
  maxTokens?: number
  /** 0.0–1.0 nucleus sampling */
  topP?: number
  /** e.g. 0.8–1.5 depending on backend */
  repeatPenalty?: number
}
```

Defines tuning parameters for personas that adapters understand:

- `temperature`: Optional value, typically between 0.0 and 2.0, controlling randomness
- `maxTokens`: Optional value limiting response length
- `topP`: Optional nucleus sampling parameter between 0.0 and 1.0
- `repeatPenalty`: Optional parameter to reduce repetition, values typically 0.8 to 1.5

### PromptTemplate

```typescript
export interface PromptTemplate {
  id: string
  name: string
  content: string
  category: PersonaCategory
  icon: string
  settings?: PersonaSettings
}
```

Defines an optional template entity for prompt presets:

- `id`: Unique identifier for the template
- `name`: Display name for the template
- `content`: The actual prompt template text
- `category`: Whether this template is for cloud or local models
- `icon`: Icon reference for the UI
- `settings`: Optional persona settings to apply with this template

### Persona

```typescript
export interface Persona {
  id: string
  name: string
  prompt: string
  description?: string
  icon?: string
  category: PersonaCategory
  settings?: PersonaSettings
  is_default: boolean
  created_at: string
  updated_at: string
}
```

The canonical persona record used in both the database and API:

- `id`: Unique identifier
- `name`: Display name of the persona
- `prompt`: System prompt that defines the persona's behavior
- `description`: Optional description of the persona
- `icon`: Optional icon reference for the UI
- `category`: Whether this persona is for cloud or local models
- `settings`: Optional model settings to apply with this persona
- `is_default`: Boolean flag indicating if this is a default persona (one per category, enforced by DB index)
- `created_at`: Timestamp of creation
- `updated_at`: Timestamp of last update

### CreatePersonaRequest

```typescript
export interface CreatePersonaRequest {
  id: string
  name: string
  prompt: string
  description?: string
  icon?: string
  /** If omitted, backend may infer from active model; prefer sending explicitly */
  category?: PersonaCategory
  settings?: PersonaSettings
}
```

Request payload for creating a new persona:

- `id`: Unique identifier (provided by the UI)
- `name`: Display name for the persona
- `prompt`: System prompt that defines the persona's behavior
- `description`: Optional description
- `icon`: Optional icon reference
- `category`: Optional category (cloud/local); backend may infer if omitted
- `settings`: Optional model settings

### UpdatePersonaRequest

```typescript
export interface UpdatePersonaRequest {
  name?: string
  prompt?: string
  description?: string
  icon?: string
  category?: PersonaCategory
  settings?: PersonaSettings
}
```

Request payload for updating an existing persona (sparse/partial):

- All fields are optional, allowing partial updates
- Structure otherwise matches the fields in CreatePersonaRequest

## API Response Types

```typescript
export type PersonaItemResponse = ApiSuccessItem<Persona>
export type PersonaListResponse = ApiSuccessList<Persona>

export interface PersonaDeletedResponse {
  version: typeof API_CONTRACT_VERSION
  ok: true
}
```

Standard API response types for persona operations:

- `PersonaItemResponse`: Response containing a single persona
- `PersonaListResponse`: Response containing a list of personas
- `PersonaDeletedResponse`: Response confirming successful deletion

## Type Guards

The file includes several runtime type guards to help with type checking in frontend fetch layers:

### isApiErrorResponse

```typescript
export function isApiErrorResponse(x: unknown): x is ApiErrorResponse {
  return !!(
    x &&
    typeof x === 'object' &&
    'error' in (x as any) &&
    typeof (x as any).error?.message === 'string' &&
    'version' in (x as any)
  )
}
```

Checks if a response is an API error response.

### isPersonaItemResponse

```typescript
export function isPersonaItemResponse(x: unknown): x is PersonaItemResponse {
  return !!(
    x &&
    typeof x === 'object' &&
    'data' in (x as any) &&
    (x as any).data &&
    typeof (x as any).data.id === 'string' &&
    typeof (x as any).data.name === 'string' &&
    typeof (x as any).data.prompt === 'string' &&
    typeof (x as any).data.category === 'string' &&
    'version' in (x as any)
  )
}
```

Checks if a response is a single persona item response.

### isPersonaListResponse

```typescript
export function isPersonaListResponse(x: unknown): x is PersonaListResponse {
  return !!(
    x &&
    typeof x === 'object' &&
    Array.isArray((x as any).data) &&
    'version' in (x as any)
  )
}
```

Checks if a response is a list of personas response.

## Usage in the Codebase

The persona types are used in multiple locations:

1. `/backend/routes/personasRouter.ts`:
   ```typescript
   import type { Persona } from '../types/personas'
   ```
   Used for defining the API routes for persona management.

2. `/backend/logic/agentService.ts`:
   ```typescript
   import type { Persona as _Persona } from '../types/personas'
   ```
   Imported as a renamed type to avoid conflicts, used in agent service for persona-related functionality.

3. `/frontend/src/core.ts`:
   ```typescript
   import type { PersonaCategory } from '../../backend/types/personas'
   ```
   Used in the core frontend module for type definitions.

4. `/frontend/src/components/personas/PersonaEditModal.vue` and `/frontend/src/components/personas/PersonaManager.vue`:
   ```typescript
   import type { Persona, PersonaCategory } from '../../../../backend/types/personas'
   ```
   Used in the frontend components for persona management UI.

These types support the persona system in Kalito, which allows for customized AI assistants with specialized system prompts, behavioral patterns, and context awareness tailored to specific tasks.