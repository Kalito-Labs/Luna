# OpenAI Types Documentation

## Overview

The `types.ts` file defines **TypeScript types and interfaces** for the OpenAI adapter module, providing type safety for model configurations, API options, results, and streaming data.

**Location**: `/backend/logic/adapters/openai/types.ts`

**Primary Responsibilities**:
- Define OpenAI model identifiers (string literals)
- Define model configuration structure
- Define adapter options interface
- Define API result types (usage, generation, streaming)
- Define settings and parameter types

**Design Pattern**: **Type-Driven Development**
- Types define contracts
- Compile-time safety
- Clear documentation through types
- Prevents runtime errors

---

## Architecture Overview

### Type Hierarchy

```
OpenAIModel (literal type)
       ↓
OpenAIModelConfig (configuration)
       ↓
OpenAIAdapterOptions (factory input)
       ↓
LLMAdapter (output)
       ↓
OpenAIGenerateResult / OpenAIStreamChunk (results)
```

### Type Categories

1. **Model Types**: `OpenAIModel`, `OpenAIModelConfig`
2. **Option Types**: `OpenAIAdapterOptions`, `OpenAIAdapterSettings`
3. **Result Types**: `OpenAIGenerateResult`, `OpenAIStreamChunk`
4. **Usage Types**: `OpenAIUsage`
5. **Special Types**: `ReasoningEffort`

---

## Model Types

### OpenAIModel

```typescript
export type OpenAIModel = 
  | 'gpt-4.1-nano'
```

**Purpose**: String literal type for valid OpenAI model identifiers.

**Type**: Union of string literals.

**Current Models**: 1
- `'gpt-4.1-nano'` - GPT-4.1 Nano (fastest GPT-4.1)

**Why String Literal?**
- Compile-time validation (typo prevention)
- IDE autocomplete
- Explicit allowed values
- Type narrowing

**Usage Example**:
```typescript
// ✅ GOOD: Valid model
const model: OpenAIModel = 'gpt-4.1-nano'

// ❌ ERROR: Invalid model (compile-time error)
const model: OpenAIModel = 'gpt-5-turbo'  // Type error!
```

**Future Extension**:
```typescript
export type OpenAIModel = 
  | 'gpt-4.1-nano'
  | 'gpt-4o-mini'       // Add new models
  | 'gpt-4-turbo'
```

---

### OpenAIModelConfig

```typescript
export interface OpenAIModelConfig {
  /** The OpenAI model identifier */
  model: OpenAIModel
  /** Display name for the model */
  name: string
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
```

**Purpose**: Complete configuration for a specific OpenAI model.

**Fields**:

#### model (Required)

```typescript
model: OpenAIModel
```

**Type**: `OpenAIModel` (string literal union)

**Purpose**: OpenAI API model identifier.

**Example**: `'gpt-4.1-nano'`

#### name (Required)

```typescript
name: string
```

**Type**: String

**Purpose**: Human-readable display name.

**Example**: `'GPT-4.1 Nano'`

#### contextWindow (Required)

```typescript
contextWindow: number
```

**Type**: Number (tokens)

**Purpose**: Maximum context window size.

**Example**: `128000` (128K tokens)

**Usage**:
- Validate message length
- Truncate context if needed
- Display to users

#### defaultMaxTokens (Required)

```typescript
defaultMaxTokens: number
```

**Type**: Number (tokens)

**Purpose**: Default max tokens for completions.

**Example**: `1024`

**When Used**: If user doesn't specify `maxTokens`.

#### defaultTemperature (Required)

```typescript
defaultTemperature: number
```

**Type**: Number (0.0 - 2.0)

**Purpose**: Default temperature setting.

**Example**: `0.7`

**Temperature Guide**:
- `0.0 - 0.3`: Deterministic, factual
- `0.4 - 0.7`: Balanced (default range)
- `0.8 - 1.0`: Creative
- `1.1 - 2.0`: Very creative (rare)

#### pricing (Optional)

```typescript
pricing?: {
  input: number  // Cost per million input tokens
  output: number // Cost per million output tokens
}
```

**Type**: Object with input/output costs

**Purpose**: Cost estimation for usage tracking.

**Example**:
```typescript
pricing: {
  input: 0.20,   // $0.20 per 1M input tokens
  output: 0.80   // $0.80 per 1M output tokens
}
```

**Usage**:
```typescript
// Calculate cost
const inputCost = (inputTokens / 1_000_000) * pricing.input
const outputCost = (outputTokens / 1_000_000) * pricing.output
const totalCost = inputCost + outputCost
```

#### deprecated (Optional)

```typescript
deprecated?: boolean
```

**Type**: Boolean

**Purpose**: Mark model as deprecated (exclude from UI).

**Example**: `deprecated: true`

**Usage**:
```typescript
// Filter active models
const activeModels = Object.values(OPENAI_MODELS)
  .filter(config => !config.deprecated)
```

#### aliases (Optional)

```typescript
aliases?: string[]
```

**Type**: String array

**Purpose**: Alternative names/IDs for backward compatibility.

**Example**: `aliases: ['gpt-4-nano', 'gpt4nano']`

**Usage**:
```typescript
// Look up by alias
getModelConfig('gpt-4-nano')  // Finds 'gpt-4.1-nano'
```

---

## Adapter Types

### OpenAIAdapterOptions

```typescript
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
```

**Purpose**: Configuration for `createOpenAIAdapter()` factory function.

**Fields**:

#### id (Optional)

```typescript
id?: string
```

**Purpose**: Override adapter ID (defaults to `config.model`).

**Example**:
```typescript
createOpenAIAdapter({
  id: 'my-custom-gpt',
  config: OPENAI_MODELS['gpt-4.1-nano']
})
```

#### name (Optional)

```typescript
name?: string
```

**Purpose**: Override display name (defaults to `config.name`).

**Example**:
```typescript
createOpenAIAdapter({
  name: 'My Custom Model',
  config: OPENAI_MODELS['gpt-4.1-nano']
})
```

#### config (Required)

```typescript
config: OpenAIModelConfig
```

**Purpose**: Model configuration object.

**Example**:
```typescript
createOpenAIAdapter({
  config: OPENAI_MODELS['gpt-4.1-nano']
})
```

#### client (Optional)

```typescript
client?: unknown
```

**Type**: `unknown` (OpenAI client instance)

**Purpose**: Dependency injection for testing.

**Example**:
```typescript
// Production: Uses default client
createOpenAIAdapter({ config })

// Testing: Inject mock client
const mockClient = createMockOpenAI()
createOpenAIAdapter({ config, client: mockClient })
```

**Why `unknown`?**
- Avoids OpenAI SDK type dependency in types.ts
- Factory casts to `OpenAI` internally
- More flexible for testing

---

### OpenAIAdapterSettings

```typescript
export interface OpenAIAdapterSettings {
  temperature?: number
  topP?: number
  maxTokens?: number
  max_output_tokens?: number
  // Pass-through for future params
  [key: string]: unknown
}
```

**Purpose**: Runtime settings for generation requests.

**Fields**:

#### temperature (Optional)

```typescript
temperature?: number
```

**Range**: 0.0 - 2.0

**Default**: From model config (usually 0.7)

**Purpose**: Controls randomness.

#### topP (Optional)

```typescript
topP?: number
```

**Range**: 0.0 - 1.0

**Default**: OpenAI default (1.0)

**Purpose**: Nucleus sampling (alternative to temperature).

#### maxTokens (Optional)

```typescript
maxTokens?: number
```

**Purpose**: Maximum tokens in response.

**Default**: From model config.

#### max_output_tokens (Optional)

```typescript
max_output_tokens?: number
```

**Purpose**: Alternative name for `maxTokens` (some APIs).

#### Index Signature

```typescript
[key: string]: unknown
```

**Purpose**: Allow pass-through of future/unknown parameters.

**Example**:
```typescript
const settings: OpenAIAdapterSettings = {
  temperature: 0.5,
  maxTokens: 500,
  frequencyPenalty: 0.2,  // Future parameter (allowed by index signature)
}
```

---

## Usage Types

### OpenAIUsage

```typescript
export interface OpenAIUsage {
  prompt_tokens?: number
  completion_tokens?: number
  total_tokens?: number
  // Responses API format
  input_tokens?: number
  output_tokens?: number
}
```

**Purpose**: Token usage information from OpenAI API.

**Why Multiple Formats?**
- Chat Completions API uses `prompt_tokens`, `completion_tokens`
- Responses API uses `input_tokens`, `output_tokens`
- Interface supports both formats

**Fields**:

#### Chat Completions Format

```typescript
prompt_tokens?: number
completion_tokens?: number
total_tokens?: number
```

**Example**:
```json
{
  "prompt_tokens": 150,
  "completion_tokens": 50,
  "total_tokens": 200
}
```

#### Responses API Format

```typescript
input_tokens?: number
output_tokens?: number
```

**Example**:
```json
{
  "input_tokens": 150,
  "output_tokens": 50
}
```

**Usage in Code**:
```typescript
function getTotalTokens(usage: OpenAIUsage): number {
  return usage.total_tokens 
    ?? (usage.prompt_tokens ?? 0) + (usage.completion_tokens ?? 0)
    ?? (usage.input_tokens ?? 0) + (usage.output_tokens ?? 0)
    ?? 0
}
```

---

## Result Types

### OpenAIGenerateResult

```typescript
export interface OpenAIGenerateResult {
  reply: string
  tokenUsage?: number
  estimatedCost?: number
}
```

**Purpose**: Result from non-streaming generation.

**Fields**:

#### reply

```typescript
reply: string
```

**Purpose**: Generated text response.

**Example**: `"The capital of France is Paris."`

#### tokenUsage (Optional)

```typescript
tokenUsage?: number
```

**Purpose**: Total tokens used (prompt + completion).

**Example**: `200`

#### estimatedCost (Optional)

```typescript
estimatedCost?: number
```

**Purpose**: Estimated cost in USD.

**Example**: `0.000042` ($0.000042)

**Calculation**:
```typescript
estimatedCost = (
  (input_tokens * pricing.input) + 
  (output_tokens * pricing.output)
) / 1_000_000
```

---

### OpenAIStreamChunk

```typescript
export interface OpenAIStreamChunk {
  delta: string
  done?: boolean
  tokenUsage?: number
  estimatedCost?: number
}
```

**Purpose**: Single chunk from streaming generation.

**Fields**:

#### delta

```typescript
delta: string
```

**Purpose**: Incremental text content.

**Example**: `"The "` → `"capital "` → `"of "` → `"France "`

#### done (Optional)

```typescript
done?: boolean
```

**Purpose**: Indicates stream completion.

**Example**:
```typescript
for await (const chunk of stream) {
  if (chunk.done) {
    console.log('Stream complete')
    console.log('Total tokens:', chunk.tokenUsage)
    break
  }
  process.stdout.write(chunk.delta)
}
```

#### tokenUsage (Optional)

```typescript
tokenUsage?: number
```

**Purpose**: Total tokens (only present in final chunk).

**Example**: `200` (in final chunk only)

#### estimatedCost (Optional)

```typescript
estimatedCost?: number
```

**Purpose**: Total cost (only present in final chunk).

**Example**: `0.000042` (in final chunk only)

---

## Special Types

### ReasoningEffort

```typescript
export type ReasoningEffort = 'low' | 'medium' | 'high'
```

**Purpose**: Reasoning effort level for o1 models (future).

**Type**: Union of string literals.

**Values**:
- `'low'` - Quick responses, less reasoning
- `'medium'` - Balanced reasoning (default)
- `'high'` - Deep reasoning, slower

**Current Status**: Defined but not used (GPT-4.1 doesn't support reasoning effort).

**Future Usage**:
```typescript
// For o1 models
const settings = {
  reasoningEffort: 'high' as ReasoningEffort
}
```

---

## Type Usage Examples

### Example 1: Creating Model Config

```typescript
import type { OpenAIModelConfig, OpenAIModel } from './types'

const customConfig: OpenAIModelConfig = {
  model: 'gpt-4.1-nano',
  name: 'Custom GPT-4.1',
  contextWindow: 128000,
  defaultMaxTokens: 2048,
  defaultTemperature: 0.5,
  pricing: {
    input: 0.20,
    output: 0.80
  },
  aliases: ['custom-gpt']
}
```

### Example 2: Using Adapter Options

```typescript
import { createOpenAIAdapter, OPENAI_MODELS } from './adapters/openai'
import type { OpenAIAdapterOptions } from './types'

const options: OpenAIAdapterOptions = {
  id: 'my-adapter',
  name: 'My Custom Adapter',
  config: OPENAI_MODELS['gpt-4.1-nano']
}

const adapter = createOpenAIAdapter(options)
```

### Example 3: Handling Results

```typescript
import type { OpenAIGenerateResult } from './types'

async function generate(prompt: string): Promise<void> {
  const result: OpenAIGenerateResult = await adapter.generate({
    messages: [{ role: 'user', content: prompt }]
  })
  
  console.log('Reply:', result.reply)
  console.log('Tokens:', result.tokenUsage)
  console.log('Cost: $', result.estimatedCost?.toFixed(6))
}
```

### Example 4: Processing Streams

```typescript
import type { OpenAIStreamChunk } from './types'

async function streamGenerate(prompt: string): Promise<void> {
  const stream = adapter.generateStream({
    messages: [{ role: 'user', content: prompt }]
  })
  
  for await (const chunk: OpenAIStreamChunk of stream) {
    if (chunk.done) {
      console.log('\nComplete! Tokens:', chunk.tokenUsage)
      break
    }
    process.stdout.write(chunk.delta)
  }
}
```

---

## Type Safety Benefits

### 1. Compile-Time Validation

```typescript
// ✅ GOOD: Valid model
const config: OpenAIModelConfig = {
  model: 'gpt-4.1-nano',
  // ... rest of config
}

// ❌ ERROR: Invalid model (caught at compile-time)
const config: OpenAIModelConfig = {
  model: 'gpt-5-turbo',  // Type error!
  // ... rest of config
}
```

### 2. IDE Autocomplete

```typescript
const config: OpenAIModelConfig = {
  model: '|'  // IDE suggests: 'gpt-4.1-nano'
}
```

### 3. Required Field Enforcement

```typescript
// ❌ ERROR: Missing required fields
const config: OpenAIModelConfig = {
  model: 'gpt-4.1-nano'
  // Type error: missing name, contextWindow, etc.
}

// ✅ GOOD: All required fields
const config: OpenAIModelConfig = {
  model: 'gpt-4.1-nano',
  name: 'GPT-4.1 Nano',
  contextWindow: 128000,
  defaultMaxTokens: 1024,
  defaultTemperature: 0.7
}
```

### 4. Optional Field Safety

```typescript
// Safe optional access
if (config.pricing) {
  const cost = calculateCost(tokens, config.pricing)
}

// Without type, could crash
const cost = calculateCost(tokens, config.pricing)  // Error if undefined!
```

---

## Best Practices

### 1. Use Type Imports

```typescript
// ✅ GOOD: Type-only import
import type { OpenAIModelConfig } from './types'

// ⚠️ ACCEPTABLE: Mixed import
import { createOpenAIAdapter, type OpenAIModelConfig } from './adapters/openai'
```

### 2. Define Complete Configs

```typescript
// ✅ GOOD: All required fields
const config: OpenAIModelConfig = {
  model: 'gpt-4.1-nano',
  name: 'GPT-4.1 Nano',
  contextWindow: 128000,
  defaultMaxTokens: 1024,
  defaultTemperature: 0.7,
  pricing: { input: 0.20, output: 0.80 }
}

// ❌ BAD: Partial config
const config = {
  model: 'gpt-4.1-nano'
  // Missing required fields!
}
```

### 3. Handle Optional Fields

```typescript
// ✅ GOOD: Check before use
const cost = result.estimatedCost ?? 0

// ✅ GOOD: Optional chaining
console.log(config.pricing?.input)

// ❌ BAD: Assume exists
const cost = result.estimatedCost.toFixed(6)  // Error if undefined!
```

---

## Future Enhancements

### 1. Additional Models

```typescript
export type OpenAIModel = 
  | 'gpt-4.1-nano'
  | 'gpt-4o-mini'
  | 'gpt-4-turbo'
  | 'o1-preview'
  | 'o1-mini'
```

### 2. Enhanced Configs

```typescript
export interface OpenAIModelConfig {
  // ... existing fields
  capabilities?: {
    functionCalling: boolean
    vision: boolean
    streaming: boolean
  }
  limits?: {
    maxTemperature: number
    minTemperature: number
  }
}
```

### 3. Stricter Usage Types

```typescript
export interface ChatCompletionsUsage {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
}

export interface ResponsesUsage {
  input_tokens: number
  output_tokens: number
}

export type OpenAIUsage = ChatCompletionsUsage | ResponsesUsage
```

---

## Summary

The **OpenAI Types Module** provides comprehensive type safety:

**Core Types**:
- **Model Types**: `OpenAIModel` (literals), `OpenAIModelConfig` (configuration)
- **Option Types**: `OpenAIAdapterOptions` (factory input), `OpenAIAdapterSettings` (runtime)
- **Result Types**: `OpenAIGenerateResult` (non-streaming), `OpenAIStreamChunk` (streaming)
- **Usage Types**: `OpenAIUsage` (token tracking)
- **Special Types**: `ReasoningEffort` (future o1 models)

**Type Safety Benefits**:
- Compile-time validation (catch errors early)
- IDE autocomplete (better DX)
- Required field enforcement (prevent bugs)
- Optional field safety (null checks)

**Best Practices**:
- Use type imports (`import type`)
- Define complete configs (all required fields)
- Handle optional fields (null checks, optional chaining)

**Production Status**: Fully implemented type system with comprehensive coverage for all OpenAI adapter functionality. Extensible for future models and features.
