# Ollama Factory Documentation

## Overview

The `factory.ts` file provides a **factory function** for creating LLM adapters that connect to local Ollama models, eliminating code duplication and ensuring consistent behavior across all local model adapters.

**Location**: `/backend/logic/adapters/ollama/factory.ts`

**Primary Responsibilities**:
- Create LLMAdapter instances for Ollama models
- Handle HTTP communication with Ollama API
- Map generic settings to Ollama-specific parameters
- Implement streaming and non-streaming generation
- Parse JSONL response format from Ollama

**Design Pattern**: **Factory Pattern** (mirrors OpenAI factory for consistency)
- Single factory function creates all adapters
- Eliminates duplication across models
- Consistent error handling
- Unified API interface

---

## Architecture Overview

### Factory Pattern Flow

```
Configuration (OllamaAdapterConfig)
       ↓
createOllamaAdapter(config)
       ↓
LLMAdapter Instance
       ↓
Methods: generate() + generateStream()
       ↓
Ollama API Communication
```

### Local vs Cloud Architecture

```
┌─────────────────────────────────────────────────────┐
│              Adapter Factory Layer                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  OpenAI Factory          Ollama Factory             │
│  ├─ Cloud API            ├─ Local API              │
│  ├─ Chat Completions     ├─ Chat endpoint          │
│  ├─ Streaming SSE        ├─ Streaming JSONL        │
│  ├─ Function calling     ├─ No tools (yet)         │
│  ├─ Token usage          ├─ No token tracking      │
│  └─ Cost estimation      └─ Free (local)           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Component Dependencies

```typescript
import type { LLMAdapter } from '../../modelRegistry'
import { fetch } from 'undici'
import { TextDecoder } from 'util'
```

**Dependencies**:
- `modelRegistry.ts` - LLMAdapter type interface
- `undici` - Modern HTTP client (Node.js built-in)
- `util` - TextDecoder for stream parsing

---

## Type Definitions

### OllamaAdapterConfig

```typescript
export interface OllamaAdapterConfig {
  /** Canonical adapter ID (e.g., 'phi3-mini') */
  id: string
  
  /** Display name for UI (e.g., 'Phi-3 Mini') */
  name: string
  
  /** Ollama model identifier (e.g., 'phi3:mini') */
  model: string
  
  /** Context window size in tokens */
  contextWindow: number
  
  /** Optional Ollama base URL (defaults to localhost:11434) */
  baseUrl?: string
}
```

**Purpose**: Configuration object for creating Ollama adapters.

**Properties**:

1. **`id`** (required)
   - Type: `string`
   - Purpose: Canonical identifier for the adapter
   - Example: `'phi3-mini'`
   - Used for: Model registry lookup, logging, identification

2. **`name`** (required)
   - Type: `string`
   - Purpose: Human-readable display name
   - Example: `'Phi-3 Mini'`
   - Used for: UI display, user selection

3. **`model`** (required)
   - Type: `string`
   - Purpose: Ollama model identifier (format: `name:tag`)
   - Example: `'phi3:mini'`, `'llama3:latest'`, `'mistral:7b'`
   - Used for: Ollama API request

4. **`contextWindow`** (required)
   - Type: `number`
   - Purpose: Maximum context size in tokens
   - Example: `4096`, `8192`, `32768`
   - Used for: Context management, truncation decisions

5. **`baseUrl`** (optional)
   - Type: `string`
   - Default: `'http://localhost:11434'`
   - Purpose: Ollama API endpoint
   - Example: `'http://192.168.1.100:11434'` (remote server)
   - Used for: Custom Ollama installations

#### Usage Examples

**Example 1: Basic Configuration**
```typescript
const config: OllamaAdapterConfig = {
  id: 'phi3-mini',
  name: 'Phi-3 Mini',
  model: 'phi3:mini',
  contextWindow: 4096,
}

const adapter = createOllamaAdapter(config)
```

**Example 2: Remote Ollama Server**
```typescript
const config: OllamaAdapterConfig = {
  id: 'llama3-remote',
  name: 'Llama 3 (Remote)',
  model: 'llama3',
  contextWindow: 8192,
  baseUrl: 'http://gpu-server.local:11434',  // Custom URL
}

const adapter = createOllamaAdapter(config)
```

**Example 3: Multiple Model Variants**
```typescript
// Small model for fast queries
const miniConfig: OllamaAdapterConfig = {
  id: 'phi3-mini',
  name: 'Phi-3 Mini',
  model: 'phi3:mini',
  contextWindow: 4096,
}

// Medium model for complex queries
const mediumConfig: OllamaAdapterConfig = {
  id: 'phi3-medium',
  name: 'Phi-3 Medium',
  model: 'phi3:medium',
  contextWindow: 8192,
}

const miniAdapter = createOllamaAdapter(miniConfig)
const mediumAdapter = createOllamaAdapter(mediumConfig)
```

---

## Factory Function

### createOllamaAdapter()

```typescript
export function createOllamaAdapter(config: OllamaAdapterConfig): LLMAdapter
```

**Purpose**: Create a complete LLMAdapter instance for an Ollama model.

**Parameters**:
- `config`: OllamaAdapterConfig - Model configuration

**Returns**: `LLMAdapter` - Complete adapter instance with:
- `id`, `name`, `type`, `contextWindow` properties
- `generate()` method for non-streaming
- `generateStream()` method for streaming

**Implementation Overview**:
```typescript
export function createOllamaAdapter(config: OllamaAdapterConfig): LLMAdapter {
  const { id, name, model, contextWindow, baseUrl = 'http://localhost:11434' } = config

  return {
    id,
    name,
    type: 'local',
    contextWindow,
    
    async generate(payload) { /* ... */ },
    async *generateStream(payload) { /* ... */ },
  }
}
```

#### Adapter Properties

**1. id**
```typescript
id: string  // From config.id
```
- Canonical identifier
- Used for registry lookup
- Example: `'phi3-mini'`

**2. name**
```typescript
name: string  // From config.name
```
- Display name
- Used in UI
- Example: `'Phi-3 Mini'`

**3. type**
```typescript
type: 'local'  // Always 'local' for Ollama
```
- Distinguishes from cloud adapters (`'cloud'`)
- Used for routing, privacy decisions
- Constant: `'local'`

**4. contextWindow**
```typescript
contextWindow: number  // From config.contextWindow
```
- Maximum context size in tokens
- Used for context management
- Example: `4096`

---

## Settings Mapping

### Generic Settings → Ollama Options

The factory maps generic LLM settings to Ollama-specific parameter names:

```typescript
// Map generic settings -> Ollama options
const options: Record<string, unknown> = {}
if (settings.temperature !== undefined) options.temperature = settings.temperature
if (settings.maxTokens !== undefined) options.num_predict = settings.maxTokens
if (settings.topP !== undefined) options.top_p = settings.topP
if (settings.repeatPenalty !== undefined) options.repeat_penalty = settings.repeatPenalty

const stopSequences = (settings as { stopSequences?: string[] }).stopSequences
if (Array.isArray(stopSequences) && stopSequences.length > 0) {
  options.stop = stopSequences
}
```

### Settings Translation Table

| Generic Setting | Ollama Parameter | Type | Description |
|----------------|------------------|------|-------------|
| `temperature` | `temperature` | number | Randomness (0.0-2.0) |
| `maxTokens` | `num_predict` | number | Max output tokens |
| `topP` | `top_p` | number | Nucleus sampling (0.0-1.0) |
| `repeatPenalty` | `repeat_penalty` | number | Penalize repetition (1.0+) |
| `stopSequences` | `stop` | string[] | Stop generation at sequences |

### Unsupported Settings

The following generic settings are **not supported** by Ollama:
- `frequencyPenalty` - Not available in Ollama
- `presencePenalty` - Not available in Ollama
- `tools` - Function calling not yet supported

#### Settings Examples

**Example 1: Temperature Control**
```typescript
// Generic interface
const result = await adapter.generate({
  messages: [{ role: 'user', content: 'Explain dementia' }],
  settings: {
    temperature: 0.3,  // More focused
  }
})

// Translated to Ollama:
// { temperature: 0.3 }
```

**Example 2: Token Limit**
```typescript
const result = await adapter.generate({
  messages: [{ role: 'user', content: 'List medications' }],
  settings: {
    maxTokens: 200,  // Concise response
  }
})

// Translated to Ollama:
// { num_predict: 200 }
```

**Example 3: Multiple Settings**
```typescript
const result = await adapter.generate({
  messages: [{ role: 'user', content: 'Write a care plan' }],
  settings: {
    temperature: 0.7,
    maxTokens: 500,
    topP: 0.9,
    repeatPenalty: 1.1,
  }
})

// Translated to Ollama:
// {
//   temperature: 0.7,
//   num_predict: 500,
//   top_p: 0.9,
//   repeat_penalty: 1.1
// }
```

**Example 4: Stop Sequences**
```typescript
const result = await adapter.generate({
  messages: [{ role: 'user', content: 'List 3 benefits:\n1.' }],
  settings: {
    stopSequences: ['4.', '\n\n'],  // Stop after 3 items
  }
})

// Translated to Ollama:
// { stop: ['4.', '\n\n'] }
```

---

## Generate Method (Non-Streaming)

### Implementation

```typescript
async generate(payload: {
  messages: { role: string; content: string }[]
  settings?: Record<string, unknown>
  fileIds?: string[]
  tools?: unknown
}): Promise<{ 
  reply: string
  tokenUsage: number | null
  toolCalls?: Array<{ id: string; name: string; arguments: string }>
}>
```

**Purpose**: Generate a complete response from Ollama (non-streaming).

**Parameters**:
- `messages`: Conversation history (role + content)
- `settings`: Optional generation settings
- `fileIds`: Ignored (not supported by Ollama)
- `tools`: Ignored (not supported by Ollama yet)

**Returns**:
- `reply`: Generated text response
- `tokenUsage`: Always `null` (Ollama doesn't provide reliable counts)
- `toolCalls`: Always `undefined` (function calling not supported)

### Request Flow

```
1. Extract messages + settings from payload
       ↓
2. Map settings to Ollama options
       ↓
3. Build request body { model, messages, stream: false, options }
       ↓
4. POST to http://localhost:11434/api/chat
       ↓
5. Check HTTP status (throw if error)
       ↓
6. Parse JSON response
       ↓
7. Extract reply from data.message.content
       ↓
8. Return { reply, tokenUsage: null }
```

### Request Body Format

```typescript
const body = {
  model: 'phi3:mini',
  messages: [
    { role: 'system', content: 'You are helpful.' },
    { role: 'user', content: 'Hello!' }
  ],
  stream: false,
  options: {
    temperature: 0.7,
    num_predict: 100
  }
}
```

### Response Format

```json
{
  "message": {
    "role": "assistant",
    "content": "Hello! How can I help you today?"
  },
  "done": true,
  "total_duration": 1234567890,
  "load_duration": 123456,
  "prompt_eval_count": 10,
  "eval_count": 20
}
```

**Extracted**:
```typescript
const reply = data?.message?.content?.trim() ?? ''
```

### Error Handling

```typescript
if (!resp.ok) {
  throw new Error(`Ollama error: ${resp.status} ${resp.statusText}`)
}
```

**Common Errors**:
- **404**: Model not found → Run `ollama pull phi3:mini`
- **500**: Ollama internal error → Check Ollama logs
- **Connection refused**: Ollama not running → Run `ollama serve`

#### Generate Examples

**Example 1: Basic Generation**
```typescript
const adapter = createOllamaAdapter({
  id: 'phi3-mini',
  name: 'Phi-3 Mini',
  model: 'phi3:mini',
  contextWindow: 4096,
})

const result = await adapter.generate({
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'What is eldercare?' }
  ]
})

console.log(result.reply)
// "Eldercare refers to the care and support provided to elderly individuals..."

console.log(result.tokenUsage)
// null (Ollama doesn't track)
```

**Example 2: With Settings**
```typescript
const result = await adapter.generate({
  messages: [
    { role: 'user', content: 'List common medications for diabetes' }
  ],
  settings: {
    temperature: 0.2,  // Very focused
    maxTokens: 200,    // Concise
  }
})
```

**Example 3: Multi-Turn Conversation**
```typescript
const messages = [
  { role: 'system', content: 'You are an eldercare expert.' },
  { role: 'user', content: 'What is dementia?' }
]

// First turn
const result1 = await adapter.generate({ messages })
messages.push({ role: 'assistant', content: result1.reply })

// Second turn
messages.push({ role: 'user', content: 'How do you treat it?' })
const result2 = await adapter.generate({ messages })

console.log(result2.reply)
// Response considers full conversation context
```

**Example 4: Error Handling**
```typescript
try {
  const result = await adapter.generate({
    messages: [{ role: 'user', content: 'Test' }]
  })
} catch (error) {
  console.error('Generation failed:', error.message)
  // "Ollama error: 404 Not Found"
  // → Model not downloaded
}
```

---

## GenerateStream Method (Streaming)

### Implementation

```typescript
async *generateStream(payload: {
  messages: { role: string; content: string }[]
  settings?: Record<string, unknown>
  fileIds?: string[]
}): AsyncGenerator<{
  delta: string
  done: boolean
}>
```

**Purpose**: Generate response incrementally (streaming) for real-time display.

**Parameters**:
- `messages`: Conversation history
- `settings`: Optional generation settings
- `fileIds`: Ignored (not supported)

**Yields**: Objects with:
- `delta`: Incremental text chunk
- `done`: `false` during generation, `true` when complete

**Returns**: AsyncGenerator (use with `for await...of`)

### Streaming Flow

```
1. Extract messages + settings from payload
       ↓
2. Map settings to Ollama options
       ↓
3. Build request body { model, messages, stream: true, options }
       ↓
4. POST to http://localhost:11434/api/chat
       ↓
5. Check HTTP status (throw if error)
       ↓
6. Get ReadableStream reader
       ↓
7. Loop: Read chunks from stream
       ↓
8. Decode chunks to text (TextDecoder)
       ↓
9. Split by newlines (JSONL format)
       ↓
10. Parse each JSON line
       ↓
11. Yield { delta: content, done: false }
       ↓
12. When evt.done === true: yield final event + return
       ↓
13. Finally: Release stream lock
```

### JSONL Response Format

Ollama streams responses as **JSON Lines** (JSONL): one JSON object per line.

**During Generation**:
```json
{"message":{"role":"assistant","content":"Hello"},"done":false}
{"message":{"role":"assistant","content":" there"},"done":false}
{"message":{"role":"assistant","content":"!"},"done":false}
```

**Final Event**:
```json
{"done":true,"total_duration":1234567890,"load_duration":123456}
```

### Parsing Logic

```typescript
const decoder = new TextDecoder()

while (true) {
  const { done, value } = await reader.read()
  if (done) break

  const chunk = decoder.decode(value, { stream: true })
  const lines = chunk.split('\n').filter(Boolean)

  for (const line of lines) {
    try {
      const evt = JSON.parse(line)

      if (evt.message?.content) {
        yield {
          delta: evt.message.content as string,
          done: !!evt.done,
        }
      }

      if (evt.done) {
        yield {
          delta: '',
          done: true,
        }
        return
      }
    } catch {
      // Skip malformed/partial lines (common at chunk boundaries)
    }
  }
}
```

**Why try/catch**: Chunk boundaries may split JSON objects, causing parse errors. These are safely ignored.

### Resource Cleanup

```typescript
const reader = resp.body?.getReader()

try {
  // ... streaming logic ...
} finally {
  reader.releaseLock()  // Always release lock
}
```

**Important**: Always release the reader lock to prevent memory leaks.

#### Streaming Examples

**Example 1: Basic Streaming**
```typescript
const adapter = createOllamaAdapter({
  id: 'phi3-mini',
  name: 'Phi-3 Mini',
  model: 'phi3:mini',
  contextWindow: 4096,
})

const stream = adapter.generateStream({
  messages: [
    { role: 'user', content: 'Write a short poem about eldercare' }
  ]
})

for await (const chunk of stream) {
  if (chunk.done) {
    console.log('\n[Complete]')
    break
  }
  process.stdout.write(chunk.delta)  // Real-time output
}
```

**Example 2: Collect Full Response**
```typescript
const chunks: string[] = []

const stream = adapter.generateStream({
  messages: [{ role: 'user', content: 'Explain dementia care' }]
})

for await (const chunk of stream) {
  if (chunk.done) break
  chunks.push(chunk.delta)
}

const fullResponse = chunks.join('')
console.log(fullResponse)
```

**Example 3: Progress Callback**
```typescript
async function generateWithProgress(
  adapter: LLMAdapter,
  messages: Array<{ role: string; content: string }>,
  onProgress: (text: string) => void
) {
  const stream = adapter.generateStream({ messages })
  
  for await (const chunk of stream) {
    if (chunk.done) break
    onProgress(chunk.delta)
  }
}

// Usage
await generateWithProgress(
  adapter,
  [{ role: 'user', content: 'List medications' }],
  (text) => console.log('New text:', text)
)
```

**Example 4: With Settings**
```typescript
const stream = adapter.generateStream({
  messages: [{ role: 'user', content: 'Describe a care plan' }],
  settings: {
    temperature: 0.7,
    maxTokens: 500,
  }
})

for await (const chunk of stream) {
  if (chunk.done) break
  updateUI(chunk.delta)  // Real-time UI update
}
```

**Example 5: Error Handling**
```typescript
try {
  const stream = adapter.generateStream({
    messages: [{ role: 'user', content: 'Test' }]
  })
  
  for await (const chunk of stream) {
    if (chunk.done) break
    console.log(chunk.delta)
  }
} catch (error) {
  console.error('Streaming failed:', error.message)
}
```

---

## Ollama API Reference

### Chat Endpoint

**URL**: `POST http://localhost:11434/api/chat`

**Request Body**:
```typescript
{
  model: string,              // Model identifier (e.g., 'phi3:mini')
  messages: Array<{
    role: string,             // 'system' | 'user' | 'assistant'
    content: string           // Message content
  }>,
  stream: boolean,            // true for streaming, false for complete
  options?: {
    temperature?: number,     // 0.0-2.0 (default: 0.8)
    num_predict?: number,     // Max tokens (default: 128)
    top_p?: number,           // 0.0-1.0 (default: 0.9)
    repeat_penalty?: number,  // 1.0+ (default: 1.1)
    stop?: string[]           // Stop sequences
  }
}
```

**Response (stream: false)**:
```typescript
{
  message: {
    role: 'assistant',
    content: string           // Generated text
  },
  done: true,
  total_duration: number,     // Nanoseconds
  load_duration: number,      // Model load time
  prompt_eval_count: number,  // Input tokens (approximate)
  eval_count: number          // Output tokens (approximate)
}
```

**Response (stream: true)**:
```typescript
// Multiple JSONL events:
{"message":{"role":"assistant","content":"text"},"done":false}
{"message":{"role":"assistant","content":"more"},"done":false}
...
{"done":true,"total_duration":1234567890}
```

### Available Options

| Option | Type | Range | Default | Description |
|--------|------|-------|---------|-------------|
| `temperature` | number | 0.0-2.0 | 0.8 | Randomness (0=deterministic) |
| `num_predict` | number | 1+ | 128 | Max output tokens |
| `top_p` | number | 0.0-1.0 | 0.9 | Nucleus sampling threshold |
| `top_k` | number | 1+ | 40 | Top-k sampling |
| `repeat_penalty` | number | 1.0+ | 1.1 | Penalize repetition |
| `repeat_last_n` | number | 0+ | 64 | Tokens to check for repetition |
| `stop` | string[] | - | - | Stop generation at sequences |
| `seed` | number | - | - | RNG seed (reproducibility) |

**Note**: Not all options are exposed by the factory. Can be extended as needed.

---

## Ollama vs OpenAI Differences

### Comparison Table

| Feature | Ollama Factory | OpenAI Factory |
|---------|---------------|----------------|
| **API Endpoint** | `/api/chat` | `/v1/chat/completions` |
| **Authentication** | None (local) | API key required |
| **Streaming Format** | JSONL | SSE (Server-Sent Events) |
| **Function Calling** | ❌ Not supported | ✅ Supported |
| **Token Usage** | ❌ Unreliable | ✅ Accurate |
| **Cost Tracking** | N/A (free) | ✅ USD estimation |
| **Default Client** | None (direct fetch) | OpenAI SDK client |
| **Error Messages** | Generic HTTP status | Specific error codes |
| **Settings** | Ollama options | OpenAI parameters |

### Key Differences

**1. No Authentication**
```typescript
// Ollama: No auth needed
const resp = await fetch(`${baseUrl}/api/chat`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

// OpenAI: Requires API key
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
```

**2. JSONL vs SSE Streaming**
```typescript
// Ollama: Parse JSONL (newline-delimited JSON)
const lines = chunk.split('\n').filter(Boolean)
for (const line of lines) {
  const evt = JSON.parse(line)
  yield { delta: evt.message.content }
}

// OpenAI: SSE format (handled by SDK)
for await (const chunk of stream) {
  yield { delta: chunk.choices[0]?.delta?.content }
}
```

**3. No Function Calling**
```typescript
// Ollama: tools parameter ignored
async generate(payload: {
  messages: Array<{...}>
  tools?: unknown  // Ignored (not supported yet)
}) {
  // No tool handling
}

// OpenAI: Full tool support
async generate(payload: {
  messages: Array<{...}>
  tools?: Array<{...}>
}) {
  // Extract and return toolCalls
}
```

**4. No Token Usage**
```typescript
// Ollama: Always return null
return {
  reply,
  tokenUsage: null,  // Ollama doesn't provide reliable counts
}

// OpenAI: Accurate token counts
return {
  reply,
  tokenUsage: usage.total_tokens,
  estimatedCost: calculateCost(usage, pricing),
}
```

---

## Error Handling

### HTTP Status Errors

```typescript
if (!resp.ok) {
  throw new Error(`Ollama error: ${resp.status} ${resp.statusText}`)
}
```

**Common Status Codes**:

| Status | Message | Cause | Solution |
|--------|---------|-------|----------|
| 404 | Not Found | Model not downloaded | `ollama pull phi3:mini` |
| 500 | Internal Server Error | Ollama error | Check Ollama logs |
| 503 | Service Unavailable | Ollama overloaded | Wait and retry |

### Network Errors

```typescript
try {
  const result = await adapter.generate({...})
} catch (error) {
  if (error.message.includes('fetch failed')) {
    // Ollama not running or network issue
  } else if (error.message.includes('ECONNREFUSED')) {
    // Connection refused (wrong port/host)
  } else if (error.message.includes('ETIMEDOUT')) {
    // Request timeout
  }
}
```

### Stream Errors

```typescript
const reader = resp.body?.getReader()
if (!reader) throw new Error('No response stream')

try {
  // ... streaming logic ...
} catch (error) {
  console.error('Stream error:', error)
} finally {
  reader.releaseLock()  // Always cleanup
}
```

### Error Handling Best Practices

**1. Specific Error Messages**
```typescript
async function safeGenerate(adapter: LLMAdapter, query: string) {
  try {
    return await adapter.generate({
      messages: [{ role: 'user', content: query }]
    })
  } catch (error) {
    const message = error.message
    
    if (message.includes('404')) {
      throw new Error('Model not found. Run: ollama pull phi3:mini')
    } else if (message.includes('fetch failed') || message.includes('ECONNREFUSED')) {
      throw new Error('Ollama server not running. Start with: ollama serve')
    } else if (message.includes('timeout')) {
      throw new Error('Request timed out. Check Ollama performance.')
    } else {
      throw new Error(`Generation failed: ${message}`)
    }
  }
}
```

**2. Retry Logic**
```typescript
async function generateWithRetry(
  adapter: LLMAdapter,
  payload: any,
  maxRetries = 3
) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await adapter.generate(payload)
    } catch (error) {
      if (i === maxRetries - 1) throw error
      
      // Exponential backoff
      const delay = Math.pow(2, i) * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}
```

**3. Timeout Handling**
```typescript
async function generateWithTimeout(
  adapter: LLMAdapter,
  payload: any,
  timeoutMs = 30000
) {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), timeoutMs)
  )
  
  const generatePromise = adapter.generate(payload)
  
  return Promise.race([generatePromise, timeoutPromise])
}
```

---

## Testing Examples

### Unit Tests

```typescript
import { createOllamaAdapter } from './factory'
import type { OllamaAdapterConfig } from './factory'

describe('Ollama Factory', () => {
  describe('createOllamaAdapter', () => {
    it('should create adapter with correct properties', () => {
      const config: OllamaAdapterConfig = {
        id: 'phi3-mini',
        name: 'Phi-3 Mini',
        model: 'phi3:mini',
        contextWindow: 4096,
      }

      const adapter = createOllamaAdapter(config)

      expect(adapter.id).toBe('phi3-mini')
      expect(adapter.name).toBe('Phi-3 Mini')
      expect(adapter.type).toBe('local')
      expect(adapter.contextWindow).toBe(4096)
      expect(typeof adapter.generate).toBe('function')
      expect(typeof adapter.generateStream).toBe('function')
    })

    it('should use default baseUrl', () => {
      const config: OllamaAdapterConfig = {
        id: 'test',
        name: 'Test',
        model: 'test',
        contextWindow: 1000,
      }

      const adapter = createOllamaAdapter(config)
      // Default baseUrl is http://localhost:11434 (not exposed in interface)
    })

    it('should accept custom baseUrl', () => {
      const config: OllamaAdapterConfig = {
        id: 'test',
        name: 'Test',
        model: 'test',
        contextWindow: 1000,
        baseUrl: 'http://custom:8080',
      }

      const adapter = createOllamaAdapter(config)
      // Custom baseUrl used internally
    })
  })
})
```

### Integration Tests

```typescript
describe('Ollama Adapter Integration', () => {
  let adapter: LLMAdapter

  beforeAll(() => {
    adapter = createOllamaAdapter({
      id: 'phi3-mini',
      name: 'Phi-3 Mini',
      model: 'phi3:mini',
      contextWindow: 4096,
    })
  })

  // Skip if Ollama not available
  const skipIfNoOllama = async () => {
    try {
      await fetch('http://localhost:11434/api/tags')
      return false
    } catch {
      console.log('Skipping - Ollama not running')
      return true
    }
  }

  describe('generate', () => {
    it('should generate response', async () => {
      if (await skipIfNoOllama()) return

      const result = await adapter.generate({
        messages: [{ role: 'user', content: 'Say "test"' }],
        settings: { maxTokens: 10 }
      })

      expect(result.reply).toBeDefined()
      expect(typeof result.reply).toBe('string')
      expect(result.tokenUsage).toBeNull()
    })

    it('should respect temperature setting', async () => {
      if (await skipIfNoOllama()) return

      const result = await adapter.generate({
        messages: [{ role: 'user', content: 'Count to 5' }],
        settings: { temperature: 0.1, maxTokens: 50 }
      })

      expect(result.reply).toBeDefined()
    })

    it('should respect maxTokens setting', async () => {
      if (await skipIfNoOllama()) return

      const result = await adapter.generate({
        messages: [{ role: 'user', content: 'Write a long story' }],
        settings: { maxTokens: 20 }
      })

      // Response should be truncated
      expect(result.reply.length).toBeLessThan(200)
    })
  })

  describe('generateStream', () => {
    it('should stream response', async () => {
      if (await skipIfNoOllama()) return

      const chunks: string[] = []
      
      for await (const chunk of adapter.generateStream({
        messages: [{ role: 'user', content: 'Count to 3' }]
      })) {
        if (chunk.done) {
          expect(chunk.delta).toBe('')
          break
        }
        chunks.push(chunk.delta)
      }

      expect(chunks.length).toBeGreaterThan(0)
    })

    it('should handle stop sequences', async () => {
      if (await skipIfNoOllama()) return

      const result = await adapter.generate({
        messages: [{ role: 'user', content: 'List:\n1. First\n2. Second\n3.' }],
        settings: { stopSequences: ['4.'] }
      })

      expect(result.reply).not.toContain('4.')
    })
  })

  describe('error handling', () => {
    it('should throw on invalid model', async () => {
      const badAdapter = createOllamaAdapter({
        id: 'invalid',
        name: 'Invalid',
        model: 'nonexistent-model',
        contextWindow: 1000,
      })

      await expect(
        badAdapter.generate({
          messages: [{ role: 'user', content: 'test' }]
        })
      ).rejects.toThrow('Ollama error: 404')
    })
  })
})
```

### Mock Tests

```typescript
import { jest } from '@jest/globals'
import { createOllamaAdapter } from './factory'

describe('Ollama Adapter Mocked', () => {
  beforeEach(() => {
    // Mock fetch
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should make correct API request', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        message: { content: 'Hello' },
        done: true,
      })
    }
    
    ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

    const adapter = createOllamaAdapter({
      id: 'test',
      name: 'Test',
      model: 'test-model',
      contextWindow: 1000,
    })

    await adapter.generate({
      messages: [{ role: 'user', content: 'Hi' }],
      settings: { temperature: 0.5 }
    })

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:11434/api/chat',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"model":"test-model"'),
      })
    )

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
    expect(body.model).toBe('test-model')
    expect(body.messages[0].content).toBe('Hi')
    expect(body.options.temperature).toBe(0.5)
  })
})
```

---

## Performance Optimization

### 1. Connection Reuse

The factory uses `undici` (Node.js built-in) which automatically reuses HTTP connections:

```typescript
import { fetch } from 'undici'

// Multiple requests reuse same connection
const result1 = await adapter.generate({...})
const result2 = await adapter.generate({...})  // Reuses connection
```

### 2. Stream Processing

Use streaming for better perceived performance:

```typescript
// ✅ GOOD: Streaming (user sees progress)
const stream = adapter.generateStream({...})
for await (const chunk of stream) {
  displayIncrementalText(chunk.delta)  // Immediate feedback
}

// ❌ SLOWER UX: Wait for complete response
const result = await adapter.generate({...})
displayFullText(result.reply)  // User waits entire duration
```

### 3. Parallel Requests

Process multiple queries in parallel:

```typescript
const queries = [
  'What is dementia?',
  'List common medications',
  'Describe care plans',
]

const results = await Promise.all(
  queries.map(query =>
    adapter.generate({
      messages: [{ role: 'user', content: query }]
    })
  )
)
```

### 4. Optimize Settings

```typescript
// Faster generation
const result = await adapter.generate({
  messages: [{ role: 'user', content: query }],
  settings: {
    temperature: 0.3,   // Lower = faster (less sampling)
    maxTokens: 100,     // Shorter = faster
  }
})
```

### 5. Model Warm-Up

```typescript
// Warm up model on app start
async function warmUpModel(adapter: LLMAdapter) {
  await adapter.generate({
    messages: [{ role: 'user', content: 'ready' }],
    settings: { maxTokens: 1 }
  })
  console.log('Model loaded and ready')
}

// First request: ~2-5 seconds (loads model)
// Subsequent requests: <100ms (model in memory)
```

---

## Best Practices

### 1. Use Factory for All Adapters

```typescript
// ✅ GOOD: Use factory
const adapter = createOllamaAdapter({
  id: 'phi3-mini',
  name: 'Phi-3 Mini',
  model: 'phi3:mini',
  contextWindow: 4096,
})

// ❌ BAD: Manually implement LLMAdapter
const adapter: LLMAdapter = {
  id: 'phi3-mini',
  name: 'Phi-3 Mini',
  type: 'local',
  contextWindow: 4096,
  async generate(payload) {
    // Manual implementation (duplicates factory logic)
  },
  async *generateStream(payload) {
    // Manual implementation (duplicates factory logic)
  }
}
```

### 2. Handle Errors Specifically

```typescript
// ✅ GOOD: Specific error handling
try {
  const result = await adapter.generate({...})
} catch (error) {
  if (error.message.includes('404')) {
    showInstallInstructions('ollama pull phi3:mini')
  } else if (error.message.includes('ECONNREFUSED')) {
    showStartInstructions('ollama serve')
  }
}

// ❌ BAD: Generic error
try {
  const result = await adapter.generate({...})
} catch (error) {
  console.error('Failed')
}
```

### 3. Use Streaming for Long Responses

```typescript
// ✅ GOOD: Stream long responses
if (expectedLongResponse) {
  const stream = adapter.generateStream({...})
  for await (const chunk of stream) {
    updateUI(chunk.delta)
  }
} else {
  const result = await adapter.generate({...})
}
```

### 4. Set Reasonable Token Limits

```typescript
// ✅ GOOD: Set maxTokens
const result = await adapter.generate({
  messages: [{ role: 'user', content: query }],
  settings: {
    maxTokens: 500  // Prevent runaway generation
  }
})

// ❌ BAD: No limit (may generate thousands of tokens)
const result = await adapter.generate({
  messages: [{ role: 'user', content: query }]
})
```

### 5. Clean Up Streams

```typescript
// ✅ GOOD: Always use try/finally
const reader = resp.body?.getReader()
try {
  // ... streaming logic ...
} finally {
  reader.releaseLock()
}

// ❌ BAD: No cleanup (memory leak)
const reader = resp.body?.getReader()
while (true) {
  const { done, value } = await reader.read()
  if (done) break
}
// reader lock never released!
```

---

## Future Enhancements

### 1. Function Calling Support

When Ollama adds function calling:

```typescript
async generate(payload: {
  messages: Array<{...}>
  tools?: Array<{
    type: 'function'
    function: {
      name: string
      description: string
      parameters: object
    }
  }>
}) {
  // Add tools to request body
  const body = {
    model,
    messages,
    tools: payload.tools,  // Pass to Ollama
  }
  
  // Extract tool calls from response
  const toolCalls = data.message.tool_calls?.map(call => ({
    id: call.id,
    name: call.function.name,
    arguments: JSON.stringify(call.function.arguments)
  }))
  
  return { reply, tokenUsage: null, toolCalls }
}
```

### 2. Token Usage Tracking

If Ollama improves token counting:

```typescript
const result = await adapter.generate({...})

// Extract from response
const tokenUsage = data.prompt_eval_count + data.eval_count

return {
  reply,
  tokenUsage,  // No longer null
}
```

### 3. Additional Settings

Expose more Ollama options:

```typescript
// Map additional settings
if (settings.topK !== undefined) options.top_k = settings.topK
if (settings.seed !== undefined) options.seed = settings.seed
if (settings.repeatLastN !== undefined) options.repeat_last_n = settings.repeatLastN
```

### 4. Model Management

```typescript
// Check if model exists
export async function hasModel(modelName: string, baseUrl?: string): Promise<boolean> {
  const url = baseUrl || 'http://localhost:11434'
  const resp = await fetch(`${url}/api/tags`)
  const data = await resp.json()
  return data.models.some(m => m.name === modelName)
}

// Download model
export async function pullModel(modelName: string, baseUrl?: string): Promise<void> {
  const url = baseUrl || 'http://localhost:11434'
  await fetch(`${url}/api/pull`, {
    method: 'POST',
    body: JSON.stringify({ name: modelName })
  })
}
```

---

## Summary

The **Ollama Factory Module** provides a unified factory function for creating local model adapters:

**Core Export**:
- **`createOllamaAdapter(config)`**: Factory function that creates LLMAdapter instances

**Configuration Type**:
- **`OllamaAdapterConfig`**: Type-safe configuration object
  * `id`: Adapter identifier
  * `name`: Display name
  * `model`: Ollama model identifier
  * `contextWindow`: Context size
  * `baseUrl`: Optional custom Ollama URL

**Adapter Features**:
- ✅ **generate()**: Non-streaming generation
- ✅ **generateStream()**: Streaming generation (JSONL format)
- ✅ Settings mapping (temperature, maxTokens, topP, repeatPenalty, stopSequences)
- ❌ Function calling (not yet supported by Ollama)
- ❌ Token usage tracking (unreliable in Ollama)

**API Integration**:
- **Endpoint**: `POST /api/chat`
- **Format**: JSON request, JSON/JSONL response
- **Authentication**: None (local)
- **Streaming**: JSONL (newline-delimited JSON)

**Settings Translation**:
- `temperature` → `temperature`
- `maxTokens` → `num_predict`
- `topP` → `top_p`
- `repeatPenalty` → `repeat_penalty`
- `stopSequences` → `stop`

**Error Handling**:
- HTTP status errors (404, 500, 503)
- Network errors (ECONNREFUSED, timeout)
- Stream cleanup (finally block)

**Differences from OpenAI**:
- No authentication required
- JSONL streaming (vs SSE)
- No function calling
- No token usage
- No cost tracking
- Simpler error messages

**Best Practices**:
- Use factory for all adapters
- Handle errors specifically
- Stream long responses
- Set token limits
- Clean up streams properly

**Production Status**: Fully implemented with robust error handling, streaming support, and settings mapping. Ready for local model deployment in privacy-focused scenarios.
