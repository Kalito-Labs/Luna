# OpenAI Adapter - Factory Pattern & Chat Completions API

## Purpose

The OpenAI adapter provides integration with OpenAI's GPT models using a **factory pattern** that eliminates code duplication and provides consistent behavior across all models. Currently configured for **GPT-4.1 Nano**, the sole cloud model with excellent eldercare context understanding.

## Why This Matters

**Without factory pattern:**
```typescript
// Duplicate code for each model
class GPT41NanoAdapter { /* 200 lines */ }
class GPT4Adapter { /* 200 lines, mostly duplicated */ }
class GPT35Adapter { /* 200 lines, mostly duplicated */ }
```

**With factory pattern:**
```typescript
// Single factory, configuration-driven
const gpt41NanoAdapter = createOpenAIAdapter({
  id: 'gpt-4.1-nano',
  config: OPENAI_MODELS['gpt-4.1-nano']
})
// All logic in one place ✅
```

---

## File Structure

```
backend/logic/adapters/openai/
├── factory.ts        # Factory function (core logic)
├── models.ts         # Model configurations
├── types.ts          # TypeScript interfaces
├── adapters.ts       # Pre-built adapter instances
└── index.ts          # Barrel export
```

---

## Core Architecture

```
┌─────────────────────────────────────────────────┐
│          createOpenAIAdapter()                   │
│          (Factory Function)                      │
└─────────────────────────────────────────────────┘
                      ↓
         Uses OpenAIModelConfig from models.ts
                      ↓
    ┌─────────────────┴─────────────────┐
    ↓                                    ↓
generate()                      generateStream()
    ↓                                    ↓
generateWithChatAPI()        generateStreamWithChatAPI()
    ↓                                    ↓
OpenAI Chat Completions API (chat.completions.create)
```

---

## Model Configuration (models.ts)

### GPT-4.1 Nano Configuration
```typescript
export const OPENAI_MODELS: Record<string, OpenAIModelConfig> = {
  'gpt-4.1-nano': {
    model: 'gpt-4.1-nano',           // OpenAI model ID
    name: 'GPT-4.1 Nano',            // Display name
    contextWindow: 128000,            // 128K tokens
    defaultMaxTokens: 1024,           // Default response length
    defaultTemperature: 0.7,          // Default creativity level
    pricing: {
      input: 0.20,                    // $0.20 per 1M input tokens
      output: 0.80,                   // $0.80 per 1M output tokens
    },
  },
}
```

**Why Configuration-Based?**
- Single source of truth for model settings
- Easy to add new models (just add config)
- No code changes needed for parameter updates
- Pricing calculations built-in

### Helper Functions

#### `getModelConfig()` - Lookup by ID or Alias
```typescript
export function getModelConfig(modelId: string): OpenAIModelConfig | undefined {
  // Direct lookup
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
```

**Example Usage:**
```typescript
const config = getModelConfig('gpt-4.1-nano')
console.log(config?.contextWindow)  // 128000
```

#### `getAllModelIds()` - Get All Available IDs
```typescript
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
```

#### `getActiveModels()` - Get Non-Deprecated Models
```typescript
export function getActiveModels(): Record<string, OpenAIModelConfig> {
  return Object.fromEntries(
    Object.entries(OPENAI_MODELS).filter(([_, config]) => !config.deprecated)
  )
}
```

---

## Type System (types.ts)

### Core Types

#### `OpenAIModel` - Model ID Type
```typescript
export type OpenAIModel = 
  | 'gpt-4.1-nano'
```
**Purpose:** Type-safe model IDs, prevents typos

#### `OpenAIModelConfig` - Configuration Interface
```typescript
export interface OpenAIModelConfig {
  model: OpenAIModel              // OpenAI model ID
  name: string                    // Display name
  contextWindow: number           // Context window size
  defaultMaxTokens: number        // Default max tokens
  defaultTemperature: number      // Default temperature
  pricing?: {
    input: number                 // Cost per 1M input tokens
    output: number                // Cost per 1M output tokens
  }
  deprecated?: boolean            // Deprecation flag
  aliases?: string[]              // Alternative IDs
}
```

#### `OpenAIAdapterOptions` - Factory Options
```typescript
export interface OpenAIAdapterOptions {
  id?: string                     // Override adapter ID
  name?: string                   // Override display name
  config: OpenAIModelConfig       // Model configuration (required)
  client?: unknown                // Optional OpenAI client (DI)
}
```

#### `OpenAIUsage` - Token Usage
```typescript
export interface OpenAIUsage {
  prompt_tokens?: number          // Input tokens
  completion_tokens?: number      // Output tokens
  total_tokens?: number           // Total tokens
  // Responses API format (legacy)
  input_tokens?: number
  output_tokens?: number
}
```

#### `OpenAIGenerateResult` - Generation Result
```typescript
export interface OpenAIGenerateResult {
  reply: string                   // Generated text
  tokenUsage?: number            // Total tokens used
  estimatedCost?: number         // Estimated cost in USD
}
```

#### `OpenAIStreamChunk` - Streaming Chunk
```typescript
export interface OpenAIStreamChunk {
  delta: string                   // Text fragment
  done?: boolean                  // Stream complete flag
  tokenUsage?: number            // Final token count (on done)
  estimatedCost?: number         // Final cost estimate (on done)
}
```

---

## Factory Function (factory.ts)

### `createOpenAIAdapter()` - Main Factory

**Purpose:** Creates LLMAdapter instances from configuration

**Signature:**
```typescript
export function createOpenAIAdapter(options: OpenAIAdapterOptions): LLMAdapter
```

**Process:**
```typescript
export function createOpenAIAdapter(options: OpenAIAdapterOptions): LLMAdapter {
  const { config, client = defaultClient } = options
  const adapterId = options.id ?? config.model
  const adapterName = options.name ?? config.name
  
  const openaiClient = client as OpenAI
  
  console.log(`[${adapterId}] Creating OpenAI adapter with Chat Completions API`)
  
  return {
    id: adapterId,
    name: adapterName,
    type: 'cloud',
    contextWindow: config.contextWindow,
    
    async generate({ messages, settings = {} }) {
      // Implementation
    },
    
    async *generateStream({ messages, settings = {} }) {
      // Implementation
    },
  }
}
```

**Example Usage:**
```typescript
const adapter = createOpenAIAdapter({
  id: 'gpt-4.1-nano',
  config: OPENAI_MODELS['gpt-4.1-nano']
})

// Now adapter.generate() and adapter.generateStream() are available
```

---

## Core Methods

### 1. `generate()` - Standard Completion

**Purpose:** Generate complete response (non-streaming)

**Signature:**
```typescript
async generate({
  messages: { role: string; content: string }[]
  settings?: Record<string, unknown>
}): Promise<{ reply: string; tokenUsage: number | null }>
```

**Process:**
```typescript
async generate({ messages, settings = {} }) {
  // Extract settings
  const maxTokens = settings.maxTokens ?? config.defaultMaxTokens
  const temperature = settings.temperature ?? config.defaultTemperature
  
  try {
    // Call Chat Completions API
    const result = await generateWithChatAPI(
      openaiClient,
      config.model,
      messages,
      maxTokens,
      temperature,
      config.pricing,
      settings
    )
    
    console.log(`[${adapterId}] Generation successful:`, {
      replyLength: result.reply.length,
      tokenUsage: result.tokenUsage,
      estimatedCost: result.estimatedCost ? `$${result.estimatedCost.toFixed(6)}` : 'N/A'
    })
    
    return {
      reply: result.reply,
      tokenUsage: result.tokenUsage ?? null
    }
    
  } catch (error) {
    handleOpenAIError(error, adapterId)
  }
}
```

**Example Usage:**
```typescript
const result = await adapter.generate({
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'What medications is dad taking?' }
  ],
  settings: {
    temperature: 0.7,
    maxTokens: 1024
  }
})

console.log(result.reply)        // "Basilio is taking 2 medications..."
console.log(result.tokenUsage)   // 342
```

---

### 2. `generateStream()` - Streaming Completion

**Purpose:** Generate response with streaming (token-by-token)

**Signature:**
```typescript
async *generateStream({
  messages: { role: string; content: string }[]
  settings?: Record<string, unknown>
}): AsyncGenerator<{ delta: string; done?: boolean; tokenUsage?: number }>
```

**Process:**
```typescript
async *generateStream({ messages, settings = {} }) {
  const maxTokens = settings.maxTokens ?? config.defaultMaxTokens
  const temperature = settings.temperature ?? config.defaultTemperature
  
  try {
    // Stream from Chat Completions API
    for await (const chunk of generateStreamWithChatAPI(
      openaiClient,
      config.model,
      messages,
      maxTokens,
      temperature,
      config.pricing,
      settings
    )) {
      yield {
        delta: chunk.delta,
        done: chunk.done,
        tokenUsage: chunk.tokenUsage
      }
    }
    
  } catch (error) {
    handleOpenAIError(error, adapterId)
  }
}
```

**Example Usage:**
```typescript
const stream = adapter.generateStream({
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'What medications is dad taking?' }
  ],
  settings: { temperature: 0.7 }
})

for await (const chunk of stream) {
  if (chunk.done) {
    console.log('Stream complete. Tokens:', chunk.tokenUsage)
  } else {
    process.stdout.write(chunk.delta)  // Print tokens as they arrive
  }
}
```

---

## Internal Functions

### `generateWithChatAPI()` - Chat Completions Request

**Purpose:** Execute non-streaming Chat Completions API call

**Signature:**
```typescript
async function generateWithChatAPI(
  client: OpenAI,
  modelName: string,
  messages: { role: string; content: string }[],
  maxTokens: number,
  temperature: number,
  pricing?: { input: number; output: number },
  settings?: Record<string, unknown>
): Promise<OpenAIGenerateResult>
```

**Process:**
```typescript
async function generateWithChatAPI(/* params */) {
  const castMessages = messages as ChatCompletionMessageParam[]
  
  // Build API parameters
  const apiParams = {
    model: modelName,
    messages: castMessages,
    temperature,
    top_p: settings?.topP as number | undefined,
    frequency_penalty: settings?.frequencyPenalty as number | undefined,
    presence_penalty: settings?.presencePenalty as number | undefined,
    max_tokens: maxTokens,
  }
  
  // Call OpenAI API
  const completion = await client.chat.completions.create(apiParams)
  
  // Extract response
  const reply = completion.choices[0]?.message?.content ?? ''
  const usage = completion.usage
  
  return {
    reply,
    tokenUsage: usage?.total_tokens,
    estimatedCost: estimateCost(usage, pricing)
  }
}
```

**OpenAI API Call:**
```javascript
// What actually gets sent to OpenAI
{
  model: "gpt-4.1-nano",
  messages: [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "What medications is dad taking?" }
  ],
  temperature: 0.7,
  max_tokens: 1024,
  top_p: undefined,              // Optional parameters
  frequency_penalty: undefined,
  presence_penalty: undefined
}
```

---

### `generateStreamWithChatAPI()` - Streaming Chat Completions

**Purpose:** Execute streaming Chat Completions API call

**Signature:**
```typescript
async function* generateStreamWithChatAPI(
  client: OpenAI,
  modelName: string,
  messages: { role: string; content: string }[],
  maxTokens: number,
  temperature: number,
  pricing?: { input: number; output: number },
  settings?: Record<string, unknown>
): AsyncGenerator<OpenAIStreamChunk>
```

**Process:**
```typescript
async function* generateStreamWithChatAPI(/* params */) {
  const castMessages = messages as ChatCompletionMessageParam[]
  
  // Create streaming request
  const stream = await client.chat.completions.create({
    model: modelName,
    messages: castMessages,
    max_tokens: maxTokens,
    temperature,
    stream: true,                           // Enable streaming
    stream_options: { include_usage: true },  // Get final token count
    top_p: settings?.topP as number | undefined,
    frequency_penalty: settings?.frequencyPenalty as number | undefined,
    presence_penalty: settings?.presencePenalty as number | undefined,
  })
  
  let finalUsage: OpenAIUsage | undefined
  
  // Iterate chunks
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content ?? ''
    
    if (delta) {
      yield { delta }  // Yield text fragment
    }
    
    // Capture final usage
    if (chunk.usage) {
      finalUsage = chunk.usage
    }
  }
  
  // Yield completion event with final metrics
  yield {
    delta: '',
    done: true,
    tokenUsage: finalUsage?.total_tokens,
    estimatedCost: estimateCost(finalUsage, pricing)
  }
}
```

**Streaming Flow:**
```typescript
// Chunk 1
{ delta: "Basilio" }

// Chunk 2
{ delta: " is" }

// Chunk 3
{ delta: " taking" }

// ... more chunks ...

// Final chunk
{
  delta: '',
  done: true,
  tokenUsage: 342,
  estimatedCost: 0.000274
}
```

---

### `estimateCost()` - Calculate API Cost

**Purpose:** Estimate cost based on token usage and pricing

**Signature:**
```typescript
function estimateCost(
  usage: OpenAIUsage | undefined,
  pricing?: { input: number; output: number }
): number
```

**Process:**
```typescript
function estimateCost(usage, pricing): number {
  if (!pricing || !usage) return 0
  
  // Extract token counts (handle both formats)
  const inputTokens = usage.prompt_tokens ?? usage.input_tokens ?? 0
  const outputTokens = usage.completion_tokens ?? usage.output_tokens ?? 0
  
  // Calculate cost
  return (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000
}
```

**Example Calculation:**
```typescript
// GPT-4.1 Nano pricing: $0.20 input, $0.80 output per 1M tokens
const usage = {
  prompt_tokens: 150,      // 150 input tokens
  completion_tokens: 100   // 100 output tokens
}

const cost = estimateCost(usage, { input: 0.20, output: 0.80 })
// Cost = (150 * 0.20 + 100 * 0.80) / 1_000_000
// Cost = (30 + 80) / 1_000_000
// Cost = 0.00011 USD ($0.00011)

console.log(`$${cost.toFixed(6)}`)  // "$0.000110"
```

---

### `handleOpenAIError()` - Error Handling

**Purpose:** Centralized error handling with user-friendly messages

**Signature:**
```typescript
function handleOpenAIError(error: unknown, modelName: string): never
```

**Process:**
```typescript
function handleOpenAIError(error: unknown, modelName: string): never {
  const err = error as { status?: number; message?: string }
  
  console.error(`[${modelName}] OpenAI API error:`, error)
  
  // HTTP 429 - Rate Limit
  if (err?.status === 429) {
    throw new Error('Rate limit exceeded. Please try again shortly.')
  }
  
  // HTTP 401 - Authentication
  if (err?.status === 401) {
    throw new Error('OpenAI API authentication failed. Please check your API key.')
  }
  
  // HTTP 404 - Model Not Found
  if (err?.status === 404) {
    throw new Error(`Model "${modelName}" not found or not accessible.`)
  }
  
  // Other HTTP errors
  if (err?.status) {
    throw new Error(`OpenAI API error (${err.status}): ${err.message || 'Unknown error'}`)
  }
  
  // Unknown errors
  throw error as Error
}
```

**Example Errors:**
```typescript
// Rate limit
throw new Error('Rate limit exceeded. Please try again shortly.')

// Authentication
throw new Error('OpenAI API authentication failed. Please check your API key.')

// Model not found
throw new Error('Model "gpt-4.1-nano" not found or not accessible.')

// Generic HTTP error
throw new Error('OpenAI API error (500): Internal server error')
```

---

## Pre-built Adapters (adapters.ts)

### GPT-4.1 Nano Adapter

**File: adapters.ts**
```typescript
import { createOpenAIAdapter } from './factory'
import { OPENAI_MODELS } from './models'

export const gpt41NanoAdapter: LLMAdapter = createOpenAIAdapter({
  id: 'gpt-4.1-nano',
  config: OPENAI_MODELS['gpt-4.1-nano']
})

export const openaiAdapters = {
  'gpt-4.1-nano': gpt41NanoAdapter,
} as const
```

**Usage:**
```typescript
import { gpt41NanoAdapter } from './adapters/openai'

const result = await gpt41NanoAdapter.generate({
  messages: [{ role: 'user', content: 'Hello' }]
})
```

---

## OpenAI Client Configuration

### Default Client
```typescript
const defaultClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-xxx',
})
```

**Environment Variable:**
```bash
OPENAI_API_KEY=sk-proj-...your-key-here
```

**Validated At:**
- `backend/middleware/validation.ts` - Startup check

### Custom Client (Dependency Injection)
```typescript
// For testing or custom configuration
const customClient = new OpenAI({
  apiKey: 'test-key',
  baseURL: 'http://localhost:8080/v1'
})

const adapter = createOpenAIAdapter({
  id: 'test-model',
  config: OPENAI_MODELS['gpt-4.1-nano'],
  client: customClient  // Inject custom client
})
```

---

## Settings & Parameters

### Supported Settings

**Temperature** (`temperature`):
- Range: 0.0 - 2.0
- Default: 0.7
- Purpose: Creativity control (0 = deterministic, 2 = very creative)

**Max Tokens** (`maxTokens`):
- Range: 1 - contextWindow
- Default: 1024
- Purpose: Maximum response length

**Top P** (`topP`):
- Range: 0.0 - 1.0
- Default: Not set (OpenAI default)
- Purpose: Nucleus sampling (alternative to temperature)

**Frequency Penalty** (`frequencyPenalty`):
- Range: -2.0 - 2.0
- Default: Not set (OpenAI default)
- Purpose: Reduce repetition (positive = discourage, negative = encourage)

**Presence Penalty** (`presencePenalty`):
- Range: -2.0 - 2.0
- Default: Not set (OpenAI default)
- Purpose: Encourage topic diversity (positive = more diverse, negative = focused)

### Example Settings
```typescript
await adapter.generate({
  messages: [/* ... */],
  settings: {
    temperature: 0.3,           // Low creativity (factual)
    maxTokens: 512,            // Short response
    topP: 0.9,                 // Nucleus sampling
    frequencyPenalty: 0.5,     // Discourage repetition
    presencePenalty: 0.3       // Encourage new topics
  }
})
```

---

## Removed Features (This Session)

### GPT-5 Support (Removed Oct 13, 2025)
**Reason:** GPT-5 Nano caused `[no text]` replies, API instability

**Removed Code:**
```typescript
// REMOVED from models.ts
'gpt-5-nano': {
  model: 'gpt-5-nano',
  apiMode: 'responses',  // Used Responses API
  // ...
}

// REMOVED from factory.ts
async function generateWithResponsesAPI() { /* ... */ }
async function* generateStreamWithResponsesAPI() { /* ... */ }
```

### Responses API (Removed Oct 13, 2025)
**Reason:** Only GPT-5 used it, GPT-5 removed, so Responses API removed

**Previous Logic:**
```typescript
// REMOVED conditional logic
if (config.apiMode === 'responses') {
  return await generateWithResponsesAPI(/* ... */)
} else {
  return await generateWithChatAPI(/* ... */)
}
```

**Current Logic:**
```typescript
// Direct call to Chat Completions API
return await generateWithChatAPI(/* ... */)
```

---

## Design Decisions

### 1. **Why Factory Pattern?**
**Problem:** Code duplication across models
```typescript
// Without factory: 200 lines × 3 models = 600 lines
// With factory: 245 lines total (factory) + 20 lines per model
```

**Benefits:**
- Single source of logic
- Easy to add new models (just config)
- Consistent error handling
- Centralized cost estimation

### 2. **Why Configuration-Based?**
**Benefit:** Model parameters in one place
```typescript
// Change pricing without touching code
OPENAI_MODELS['gpt-4.1-nano'].pricing.input = 0.15  // Updated pricing
```

### 3. **Why Chat Completions API Only?**
**Reason:** Simplified after GPT-5 removal
- Responses API only needed for GPT-5
- All current models use Chat Completions API
- Simpler codebase, fewer conditionals

### 4. **Why Cost Estimation?**
**Benefit:** Budget visibility
```typescript
console.log(`[gpt-4.1-nano] Generation successful:`, {
  replyLength: 234,
  tokenUsage: 342,
  estimatedCost: '$0.000274'  // User sees cost immediately
})
```

### 5. **Why AsyncGenerator for Streaming?**
**Benefit:** Natural JavaScript streaming pattern
```typescript
// Clean, idiomatic JavaScript
for await (const chunk of stream) {
  console.log(chunk.delta)
}
```

---

## Performance Characteristics

### Non-Streaming (`generate()`)
- **Latency:** Wait for entire response (~2-5 seconds)
- **Memory:** Entire response in memory at once
- **Use Case:** Short responses, batch processing

### Streaming (`generateStream()`)
- **Latency:** First token in ~500ms, then incremental
- **Memory:** Process chunks as they arrive
- **Use Case:** Long responses, real-time UI feedback

### Cost Estimation
- **Overhead:** ~0.1ms per estimation
- **Accuracy:** Exact (uses OpenAI's reported usage)

---

## Usage Examples

### Example 1: Simple Question
```typescript
const result = await gpt41NanoAdapter.generate({
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'What is 2+2?' }
  ],
  settings: { temperature: 0.1, maxTokens: 50 }
})

console.log(result.reply)        // "2+2 equals 4."
console.log(result.tokenUsage)   // 23
```

### Example 2: Eldercare Query
```typescript
const systemPrompt = `
You are Kalito, a Cloud AI Assistant.
You have complete read-only access to the local SQLite database.

## Eldercare Context
- Basilio Sanchez (Father), age 72
- Medications: Farxiga 10mg, Janumet 50/1000mg
`

const result = await gpt41NanoAdapter.generate({
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: 'How many medications is dad taking?' }
  ]
})

console.log(result.reply)
// "Basilio (Father) is taking 2 medications: Farxiga 10mg once daily
//  and Janumet 50/1000mg twice daily."
```

### Example 3: Streaming Response
```typescript
const stream = gpt41NanoAdapter.generateStream({
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Write a short poem about nature.' }
  ],
  settings: { temperature: 0.8, maxTokens: 200 }
})

for await (const chunk of stream) {
  if (chunk.done) {
    console.log(`\n\nTokens: ${chunk.tokenUsage}, Cost: $${chunk.estimatedCost?.toFixed(6)}`)
  } else {
    process.stdout.write(chunk.delta)  // Print token-by-token
  }
}

// Output:
// Trees whisper in the breeze,
// Flowers dance with gentle ease...
// 
// Tokens: 156, Cost: $0.000125
```

### Example 4: Error Handling
```typescript
try {
  const result = await gpt41NanoAdapter.generate({
    messages: [{ role: 'user', content: 'Hello' }]
  })
} catch (error) {
  console.error('Generation failed:', error.message)
  // "Rate limit exceeded. Please try again shortly."
  // or "OpenAI API authentication failed. Please check your API key."
}
```

---

## Testing Scenarios

### Test 1: Basic Generation
```typescript
const result = await adapter.generate({
  messages: [{ role: 'user', content: 'Test' }]
})
assert(typeof result.reply === 'string')
assert(typeof result.tokenUsage === 'number')
```

### Test 2: Streaming
```typescript
const chunks: string[] = []
let finalTokens = 0

for await (const chunk of adapter.generateStream({
  messages: [{ role: 'user', content: 'Test' }]
})) {
  if (chunk.done) {
    finalTokens = chunk.tokenUsage || 0
  } else {
    chunks.push(chunk.delta)
  }
}

assert(chunks.length > 0)
assert(finalTokens > 0)
```

### Test 3: Custom Settings
```typescript
const result = await adapter.generate({
  messages: [{ role: 'user', content: 'Test' }],
  settings: {
    temperature: 0.0,
    maxTokens: 10,
    topP: 1.0
  }
})
assert(result.reply.split(' ').length <= 10)  // Respects maxTokens
```

---

## Related Files

- `factory.ts` - Core factory logic (this file)
- `models.ts` - Model configurations
- `types.ts` - TypeScript types
- `adapters.ts` - Pre-built instances
- `index.ts` - Barrel export
- `../../modelRegistry.ts` - Model registration
- `../../agentService.ts` - Primary consumer

---

## Quick Reference

**Create adapter:**
```typescript
const adapter = createOpenAIAdapter({
  id: 'gpt-4.1-nano',
  config: OPENAI_MODELS['gpt-4.1-nano']
})
```

**Generate response:**
```typescript
const result = await adapter.generate({
  messages: [{ role: 'user', content: 'Hello' }],
  settings: { temperature: 0.7, maxTokens: 1024 }
})
```

**Stream response:**
```typescript
for await (const chunk of adapter.generateStream({ messages })) {
  console.log(chunk.delta)
}
```

**Get model config:**
```typescript
const config = getModelConfig('gpt-4.1-nano')
console.log(config.contextWindow)  // 128000
```

**Estimate cost:**
```typescript
const cost = estimateCost(usage, { input: 0.20, output: 0.80 })
console.log(`$${cost.toFixed(6)}`)
```
