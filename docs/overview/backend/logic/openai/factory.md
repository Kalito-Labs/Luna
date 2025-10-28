# OpenAI Factory Documentation

## Overview

The `factory.ts` file implements the **factory pattern** for creating OpenAI adapters, providing a unified interface for all OpenAI models using the Chat Completions API.

**Location**: `/backend/logic/adapters/openai/factory.ts`

**Primary Responsibilities**:
- Create `LLMAdapter` instances from model configurations
- Handle OpenAI API calls (Chat Completions)
- Implement non-streaming generation
- Implement streaming generation
- Estimate costs based on token usage
- Handle OpenAI API errors gracefully
- Support function calling (tools)

**Design Pattern**: **Factory Pattern**
- Single function creates all adapters
- Eliminates code duplication
- Consistent behavior across models
- Easy to maintain and extend

---

## Architecture Overview

### Factory Flow

```
OpenAIModelConfig + Options
       ↓
createOpenAIAdapter()
       ↓
┌──────────────────────────────────┐
│   LLMAdapter Instance            │
├──────────────────────────────────┤
│ - id: 'gpt-4.1-nano'             │
│ - name: 'GPT-4.1 Nano'           │
│ - type: 'cloud'                  │
│ - contextWindow: 128000          │
│ - generate()                     │
│ - generateStream()               │
└──────────────────────────────────┘
       ↓
Used by agentService
```

### Component Dependencies

```typescript
import OpenAI from 'openai'
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import type { ChatCompletionTool } from 'openai/resources'
import type { LLMAdapter } from '../../modelRegistry'
import type { 
  OpenAIAdapterOptions, 
  OpenAIUsage, 
  OpenAIGenerateResult,
  OpenAIStreamChunk
} from './types'
```

**External**: OpenAI SDK (`openai` package)
**Internal**: Type definitions, LLMAdapter interface

---

## OpenAI Client

### Default Client

```typescript
const defaultClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-xxx',
})
```

**Purpose**: Singleton OpenAI client instance.

**Configuration**:
- **API Key**: From `OPENAI_API_KEY` environment variable
- **Fallback**: `'sk-xxx'` (will fail at runtime if used)

**Why Singleton?**
- Reuse client across all adapters
- Avoid creating multiple connections
- Share rate limiting state
- More efficient

**Why Fallback?**
- Allows module to load without error
- Better for development/testing
- Clear runtime error if API key missing

**Dependency Injection**:
```typescript
// Production: Use default client
createOpenAIAdapter({ config })

// Testing: Inject mock client
const mockClient = createMockOpenAI()
createOpenAIAdapter({ config, client: mockClient })
```

---

## Utility Functions

### estimateCost

```typescript
function estimateCost(
  usage: OpenAIUsage | undefined,
  pricing?: { input: number; output: number }
): number
```

**Purpose**: Calculate estimated cost in USD based on token usage.

**Parameters**:
- `usage` - Token usage from OpenAI response
- `pricing` - Cost per million tokens (from model config)

**Returns**: Cost in dollars (number)

#### Implementation

```typescript
function estimateCost(
  usage: OpenAIUsage | undefined,
  pricing?: { input: number; output: number }
): number {
  if (!pricing || !usage) return 0

  const inputTokens = usage.prompt_tokens ?? usage.input_tokens ?? 0
  const outputTokens = usage.completion_tokens ?? usage.output_tokens ?? 0
  
  return (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000
}
```

**Steps**:
1. **Null Check**: Return 0 if no pricing or usage
2. **Extract Tokens**: Handle both API formats
   - Chat Completions: `prompt_tokens`, `completion_tokens`
   - Responses API: `input_tokens`, `output_tokens`
3. **Calculate Cost**: `(input * price + output * price) / 1M`

#### Usage Examples

**Example 1: Simple Calculation**
```typescript
const usage = {
  prompt_tokens: 150,
  completion_tokens: 50,
  total_tokens: 200
}

const pricing = {
  input: 0.20,   // $0.20 per 1M tokens
  output: 0.80   // $0.80 per 1M tokens
}

const cost = estimateCost(usage, pricing)
// (150 * 0.20 + 50 * 0.80) / 1_000_000
// (30 + 40) / 1_000_000
// = 0.00007 ($0.00007)
```

**Example 2: Missing Data**
```typescript
estimateCost(undefined, pricing)  // 0
estimateCost(usage, undefined)    // 0
estimateCost({}, pricing)         // 0 (no tokens)
```

**Example 3: Both API Formats**
```typescript
// Chat Completions format
const usage1 = {
  prompt_tokens: 100,
  completion_tokens: 50
}

// Responses API format
const usage2 = {
  input_tokens: 100,
  output_tokens: 50
}

// Both produce same result
estimateCost(usage1, pricing) === estimateCost(usage2, pricing)  // true
```

---

### handleOpenAIError

```typescript
function handleOpenAIError(error: unknown, modelName: string): never
```

**Purpose**: Handle OpenAI API errors with specific error messages.

**Parameters**:
- `error` - Error from OpenAI API
- `modelName` - Model identifier (for logging)

**Returns**: Never (always throws)

#### Implementation

```typescript
function handleOpenAIError(error: unknown, modelName: string): never {
  const err = error as { status?: number; message?: string }
  
  console.error(`[${modelName}] OpenAI API error:`, error)
  
  if (err?.status === 429) {
    throw new Error('Rate limit exceeded. Please try again shortly.')
  }
  
  if (err?.status === 401) {
    throw new Error('OpenAI API authentication failed. Please check your API key.')
  }
  
  if (err?.status === 404) {
    throw new Error(`Model "${modelName}" not found or not accessible.`)
  }
  
  if (err?.status) {
    throw new Error(`OpenAI API error (${err.status}): ${err.message || 'Unknown error'}`)
  }
  
  throw error as Error
}
```

**Error Mapping**:

| HTTP Status | Error Message |
|-------------|---------------|
| 429 | Rate limit exceeded. Please try again shortly. |
| 401 | OpenAI API authentication failed. Please check your API key. |
| 404 | Model "X" not found or not accessible. |
| Other | OpenAI API error (status): message |
| No status | Re-throw original error |

#### Error Types

**429 - Rate Limit**
```typescript
// User-friendly message
throw new Error('Rate limit exceeded. Please try again shortly.')

// Indicates:
// - Too many requests
// - Need to slow down
// - Retry with backoff
```

**401 - Authentication**
```typescript
throw new Error('OpenAI API authentication failed. Please check your API key.')

// Indicates:
// - Invalid API key
// - Missing API key
// - Expired API key
```

**404 - Model Not Found**
```typescript
throw new Error(`Model "${modelName}" not found or not accessible.`)

// Indicates:
// - Model doesn't exist
// - No access to model
// - Typo in model name
```

**Other Status Codes**
```typescript
throw new Error(`OpenAI API error (${status}): ${message}`)

// Examples:
// - 400: Bad Request
// - 500: Internal Server Error
// - 503: Service Unavailable
```

#### Usage Example

```typescript
try {
  const response = await openaiClient.chat.completions.create({...})
} catch (error) {
  handleOpenAIError(error, 'gpt-4.1-nano')
  // Never returns (always throws)
}
```

---

## Generation Functions

### generateWithChatAPI

```typescript
async function generateWithChatAPI(
  client: OpenAI,
  modelName: string,
  messages: { role: string; content: string }[],
  maxTokens: number,
  temperature: number,
  pricing?: { input: number; output: number },
  settings?: Record<string, unknown>,
  tools?: ChatCompletionTool[]
): Promise<OpenAIGenerateResult & { toolCalls?: Array<{ id: string; name: string; arguments: string }> }>
```

**Purpose**: Generate non-streaming response using Chat Completions API.

**Parameters**:
- `client` - OpenAI client instance
- `modelName` - Model identifier (e.g., 'gpt-4.1-nano')
- `messages` - Conversation messages
- `maxTokens` - Maximum response tokens
- `temperature` - Randomness (0.0 - 2.0)
- `pricing` - Cost per million tokens (optional)
- `settings` - Additional API parameters (optional)
- `tools` - Function calling tools (optional)

**Returns**: Result object with reply, usage, cost, and tool calls

#### Implementation Steps

**Step 1: Build API Parameters**
```typescript
const castMessages = messages as ChatCompletionMessageParam[]

const apiParams: {
  model: string
  messages: ChatCompletionMessageParam[]
  temperature: number
  top_p?: number
  frequency_penalty?: number
  presence_penalty?: number
  max_tokens: number
  tools?: ChatCompletionTool[]
  tool_choice?: 'auto'
} = {
  model: modelName,
  messages: castMessages,
  temperature,
  top_p: settings?.topP as number | undefined,
  frequency_penalty: settings?.frequencyPenalty as number | undefined,
  presence_penalty: settings?.presencePenalty as number | undefined,
  max_tokens: maxTokens,
}
```

**Optional Parameters**:
- `top_p`: Nucleus sampling (alternative to temperature)
- `frequency_penalty`: Reduce repetition (0.0 - 2.0)
- `presence_penalty`: Encourage new topics (0.0 - 2.0)

**Step 2: Add Tools (if provided)**
```typescript
if (tools && tools.length > 0) {
  apiParams.tools = tools
  apiParams.tool_choice = 'auto'
}
```

**Function Calling**:
- `tools`: Array of function definitions
- `tool_choice: 'auto'`: Model decides when to call functions

**Step 3: Call OpenAI API**
```typescript
const completion = await client.chat.completions.create(apiParams)
```

**Step 4: Extract Response**
```typescript
const message = completion.choices[0]?.message
const reply = message?.content ?? ''
const usage = completion.usage
```

**Step 5: Extract Tool Calls**
```typescript
const toolCalls = message?.tool_calls
  ?.filter(tc => tc.type === 'function')
  .map(tc => ({
    id: tc.id,
    name: tc.type === 'function' ? tc.function.name : '',
    arguments: tc.type === 'function' ? tc.function.arguments : '',
  }))
```

**Tool Call Format**:
```typescript
{
  id: "call_abc123",
  name: "web_search",
  arguments: "{\"query\":\"Python tutorial\"}"
}
```

**Step 6: Return Result**
```typescript
return {
  reply,
  tokenUsage: usage?.total_tokens,
  estimatedCost: estimateCost(usage, pricing),
  toolCalls,
}
```

#### Usage Example

```typescript
const result = await generateWithChatAPI(
  defaultClient,
  'gpt-4.1-nano',
  [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'What is 2+2?' }
  ],
  1024,
  0.7,
  { input: 0.20, output: 0.80 }
)

console.log(result.reply)          // "2 + 2 equals 4."
console.log(result.tokenUsage)     // 25
console.log(result.estimatedCost)  // 0.000005
console.log(result.toolCalls)      // undefined (no tools called)
```

---

### generateStreamWithChatAPI

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

**Purpose**: Generate streaming response using Chat Completions API.

**Parameters**: Same as `generateWithChatAPI` (except tools - not supported in streaming)

**Returns**: Async generator yielding stream chunks

#### Implementation Steps

**Step 1: Create Stream**
```typescript
const castMessages = messages as ChatCompletionMessageParam[]

const stream = await client.chat.completions.create({
  model: modelName,
  messages: castMessages,
  max_tokens: maxTokens,
  temperature,
  stream: true,
  stream_options: { include_usage: true },
  top_p: settings?.topP as number | undefined,
  frequency_penalty: settings?.frequencyPenalty as number | undefined,
  presence_penalty: settings?.presencePenalty as number | undefined,
})
```

**Key Differences**:
- `stream: true` - Enable streaming
- `stream_options: { include_usage: true }` - Get usage in final chunk

**Step 2: Iterate Chunks**
```typescript
let finalUsage: OpenAIUsage | undefined

for await (const chunk of stream) {
  const delta = chunk.choices[0]?.delta?.content ?? ''
  
  if (delta) {
    yield { delta }
  }
  
  // Capture final usage information
  if (chunk.usage) {
    finalUsage = chunk.usage
  }
}
```

**Chunk Structure**:
```typescript
{
  delta: "The "  // Incremental text
}
```

**Step 3: Yield Completion**
```typescript
yield {
  delta: '',
  done: true,
  tokenUsage: finalUsage?.total_tokens,
  estimatedCost: estimateCost(finalUsage, pricing),
}
```

**Final Chunk**:
```typescript
{
  delta: '',        // Empty (stream complete)
  done: true,       // Indicates completion
  tokenUsage: 87,   // Total tokens
  estimatedCost: 0.000018
}
```

#### Usage Example

```typescript
const stream = generateStreamWithChatAPI(
  defaultClient,
  'gpt-4.1-nano',
  [{ role: 'user', content: 'Tell me a short story' }],
  1024,
  0.7,
  { input: 0.20, output: 0.80 }
)

for await (const chunk of stream) {
  if (chunk.done) {
    console.log('\n\nTotal tokens:', chunk.tokenUsage)
    console.log('Cost: $', chunk.estimatedCost?.toFixed(6))
    break
  }
  process.stdout.write(chunk.delta)  // Print incrementally
}

// Output:
// Once upon a time, there was...
//
// Total tokens: 156
// Cost: $ 0.000033
```

---

## Factory Function

### createOpenAIAdapter

```typescript
export function createOpenAIAdapter(options: OpenAIAdapterOptions): LLMAdapter
```

**Purpose**: Create a complete `LLMAdapter` instance for an OpenAI model.

**Parameters**:
- `options` - Adapter configuration options

**Returns**: `LLMAdapter` instance

#### Implementation

**Step 1: Extract Options**
```typescript
const { config, client = defaultClient } = options
const adapterId = options.id ?? config.model
const adapterName = options.name ?? config.name

const openaiClient = client as OpenAI
```

**Defaults**:
- `client`: Use default client if not provided
- `id`: Use model name if not overridden
- `name`: Use model display name if not overridden

**Step 2: Log Creation**
```typescript
console.log(`[${adapterId}] Creating OpenAI adapter with Chat Completions API`)
```

**Step 3: Return Adapter Object**
```typescript
return {
  id: adapterId,
  name: adapterName,
  type: 'cloud',
  contextWindow: config.contextWindow,
  
  async generate({ messages, settings = {}, tools }): Promise<...> {
    // Implementation
  },
  
  async *generateStream({ messages, settings = {} }): AsyncGenerator<...> {
    // Implementation
  },
}
```

### Adapter Methods

#### generate

```typescript
async generate({
  messages,
  settings = {},
  tools,
}: {
  messages: { role: string; content: string }[]
  settings?: Record<string, unknown>
  tools?: ChatCompletionTool[]
}): Promise<{ reply: string; tokenUsage: number | null; toolCalls?: Array<{ id: string; name: string; arguments: string }> }>
```

**Purpose**: Non-streaming generation with optional tool calling.

**Implementation**:

```typescript
const maxTokens = (settings.maxTokens as number) ?? config.defaultMaxTokens
const temperature = (settings.temperature as number) ?? config.defaultTemperature

try {
  const result = await generateWithChatAPI(
    openaiClient,
    config.model,
    messages,
    maxTokens,
    temperature,
    config.pricing,
    settings,
    tools
  )
  
  console.log(`[${adapterId}] Generation successful:`, {
    replyLength: result.reply.length,
    tokenUsage: result.tokenUsage,
    estimatedCost: result.estimatedCost ? `$${result.estimatedCost.toFixed(6)}` : 'N/A',
    toolCalls: result.toolCalls?.length ?? 0,
  })
  
  return {
    reply: result.reply,
    tokenUsage: result.tokenUsage ?? null,
    toolCalls: result.toolCalls,
  }
  
} catch (error) {
  handleOpenAIError(error, adapterId)
}
```

**Features**:
- Default values from config
- Error handling with context
- Success logging with metrics
- Tool call support

**Usage Example**:
```typescript
const adapter = createOpenAIAdapter({ config })

const result = await adapter.generate({
  messages: [{ role: 'user', content: 'Hello!' }],
  settings: { temperature: 0.5, maxTokens: 100 }
})

console.log(result.reply)
```

#### generateStream

```typescript
async *generateStream({
  messages,
  settings = {},
}: {
  messages: { role: string; content: string }[]
  settings?: Record<string, unknown>
}): AsyncGenerator<{ delta: string; done?: boolean; tokenUsage?: number }>
```

**Purpose**: Streaming generation for real-time output.

**Implementation**:

```typescript
const maxTokens = (settings.maxTokens as number) ?? config.defaultMaxTokens
const temperature = (settings.temperature as number) ?? config.defaultTemperature

try {
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
      tokenUsage: chunk.tokenUsage,
    }
  }
  
} catch (error) {
  handleOpenAIError(error, adapterId)
}
```

**Features**:
- Streams chunks as they arrive
- Final chunk includes metrics
- Error handling

**Usage Example**:
```typescript
for await (const chunk of adapter.generateStream({
  messages: [{ role: 'user', content: 'Write a poem' }]
})) {
  if (chunk.done) {
    console.log('\nDone! Tokens:', chunk.tokenUsage)
    break
  }
  process.stdout.write(chunk.delta)
}
```

---

## Complete Usage Example

```typescript
import { createOpenAIAdapter } from './factory'
import { OPENAI_MODELS } from './models'

// Create adapter
const adapter = createOpenAIAdapter({
  config: OPENAI_MODELS['gpt-4.1-nano']
})

// Non-streaming generation
const result1 = await adapter.generate({
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'What is the capital of France?' }
  ],
  settings: {
    temperature: 0.3,
    maxTokens: 100
  }
})

console.log(result1.reply)  // "The capital of France is Paris."
console.log(`Used ${result1.tokenUsage} tokens`)

// Streaming generation
console.log('\nStreaming response:')
for await (const chunk of adapter.generateStream({
  messages: [{ role: 'user', content: 'Count to 5' }]
})) {
  if (chunk.done) {
    console.log(`\n[Complete - ${chunk.tokenUsage} tokens]`)
    break
  }
  process.stdout.write(chunk.delta)
}

// With function calling
const result2 = await adapter.generate({
  messages: [{ role: 'user', content: 'Search for Python tutorials' }],
  tools: [{
    type: 'function',
    function: {
      name: 'web_search',
      description: 'Search the web',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string' }
        },
        required: ['query']
      }
    }
  }]
})

if (result2.toolCalls) {
  console.log('Tool called:', result2.toolCalls[0].name)
  console.log('Arguments:', result2.toolCalls[0].arguments)
}
```

---

## Summary

The **OpenAI Factory** creates adapters with unified behavior:

**Core Function**: `createOpenAIAdapter(options)` → `LLMAdapter`

**Features**:
- **Non-streaming**: `generate()` with tool calling
- **Streaming**: `generateStream()` for real-time output
- **Cost Estimation**: Automatic cost calculation
- **Error Handling**: User-friendly error messages
- **Logging**: Success/error metrics

**Utilities**:
- `estimateCost()`: Calculate USD cost from usage
- `handleOpenAIError()`: Map HTTP status to messages
- `generateWithChatAPI()`: Chat Completions implementation
- `generateStreamWithChatAPI()`: Streaming implementation

**Benefits**:
- Single implementation for all models
- Consistent behavior
- Easy maintenance
- DRY principle

**Production Status**: Fully implemented factory with Chat Completions API support, streaming, function calling, cost estimation, and comprehensive error handling.
