# Ollama Adapter - Local Model Integration

## Purpose

The Ollama adapter provides integration with **local AI models** running on your machine via Ollama. It uses the same factory pattern as OpenAI for consistency, enabling offline inference with models like Phi-3 Mini, Qwen, and Llama.

## Why This Matters

**Without local models:**
```
Internet down → No AI assistance
Privacy concerns → Can't share data with cloud
High costs → Every request costs money
```

**With Ollama:**
```
✅ Offline capability (no internet required)
✅ Complete privacy (data never leaves machine)
✅ Zero API costs (runs on your hardware)
✅ Fast inference (local processing)
```

---

## File Structure

```
backend/logic/adapters/ollama/
├── factory.ts        # Factory function (core logic)
├── adapters.ts       # Pre-built adapter instances
└── index.ts          # Barrel export
```

---

## Core Architecture

```
┌─────────────────────────────────────────────────┐
│          createOllamaAdapter()                   │
│          (Factory Function)                      │
└─────────────────────────────────────────────────┘
                      ↓
         Uses OllamaAdapterConfig
                      ↓
    ┌─────────────────┴─────────────────┐
    ↓                                    ↓
generate()                      generateStream()
    ↓                                    ↓
fetch('http://localhost:11434/api/chat')
    ↓                                    ↓
        Ollama Local Server
                ↓
     Phi3/Qwen/Llama Models
```

**Key Difference from OpenAI:**
- OpenAI: Cloud API (internet required)
- Ollama: Local HTTP server (localhost:11434)

---

## Model Configuration (adapters.ts)

### Phi-3 Mini Configuration
```typescript
export const phi3MiniAdapter: LLMAdapter = createOllamaAdapter({
  id: 'phi3-mini',           // Canonical adapter ID
  name: 'Phi-3 Mini',        // Display name
  model: 'phi3:mini',        // Ollama model tag
  contextWindow: 4096,       // 4K tokens
})
```

**Why Phi-3 Mini?**
- **Speed:** Fast inference on CPU
- **Size:** 2.7GB model (fits in RAM)
- **Quality:** Excellent for factual queries
- **Trust:** Always trusted (local = full database access)

### Available Adapters
```typescript
export const ollamaAdapters = {
  'phi3-mini': phi3MiniAdapter,
} as const
```

**Easy to Add More:**
```typescript
// Just add new models
export const qwenAdapter: LLMAdapter = createOllamaAdapter({
  id: 'qwen-2.5-coder',
  name: 'Qwen 2.5 Coder',
  model: 'qwen2.5-coder:latest',
  contextWindow: 32768,
})
```

---

## Type System

### `OllamaAdapterConfig` - Configuration Interface
```typescript
export interface OllamaAdapterConfig {
  id: string              // Canonical adapter ID ('phi3-mini')
  name: string            // Display name ('Phi-3 Mini')
  model: string           // Ollama model tag ('phi3:mini')
  contextWindow: number   // Context window size (4096)
  baseUrl?: string        // Optional custom URL (default: localhost:11434)
}
```

**Example Configurations:**
```typescript
// Default (localhost)
{
  id: 'phi3-mini',
  name: 'Phi-3 Mini',
  model: 'phi3:mini',
  contextWindow: 4096
  // baseUrl defaults to 'http://localhost:11434'
}

// Custom Ollama server
{
  id: 'phi3-mini',
  name: 'Phi-3 Mini',
  model: 'phi3:mini',
  contextWindow: 4096,
  baseUrl: 'http://192.168.1.100:11434'  // Remote Ollama server
}
```

---

## Factory Function (factory.ts)

### `createOllamaAdapter()` - Main Factory

**Purpose:** Creates LLMAdapter instances for Ollama models

**Signature:**
```typescript
export function createOllamaAdapter(config: OllamaAdapterConfig): LLMAdapter
```

**Process:**
```typescript
export function createOllamaAdapter(config: OllamaAdapterConfig): LLMAdapter {
  const { id, name, model, contextWindow, baseUrl = 'http://localhost:11434' } = config

  return {
    id,
    name,
    type: 'local',           // ← Always 'local'
    contextWindow,
    
    async generate({ messages, settings = {} }) {
      // Implementation
    },
    
    async *generateStream({ messages, settings = {} }) {
      // Implementation
    }
  }
}
```

**Example Usage:**
```typescript
const adapter = createOllamaAdapter({
  id: 'phi3-mini',
  name: 'Phi-3 Mini',
  model: 'phi3:mini',
  contextWindow: 4096
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
  fileIds?: string[]
}): Promise<{ reply: string; tokenUsage: number | null }>
```

**Process:**
```typescript
async generate({ messages, settings = {} }) {
  // Step 1: Map generic settings to Ollama options
  const options: Record<string, unknown> = {}
  if (settings.temperature !== undefined) options.temperature = settings.temperature
  if (settings.maxTokens !== undefined) options.num_predict = settings.maxTokens
  if (settings.topP !== undefined) options.top_p = settings.topP
  if (settings.repeatPenalty !== undefined) options.repeat_penalty = settings.repeatPenalty
  
  // Handle stop sequences
  const stopSequences = settings.stopSequences as string[] | undefined
  if (Array.isArray(stopSequences) && stopSequences.length > 0) {
    options.stop = stopSequences
  }

  // Step 2: Build Ollama API request
  const body = {
    model,                                    // 'phi3:mini'
    messages,                                 // Chat messages
    stream: false,                            // Non-streaming
    options: Object.keys(options).length ? options : undefined
  }

  // Step 3: Call Ollama API
  const resp = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })

  if (!resp.ok) {
    throw new Error(`Ollama error: ${resp.status} ${resp.statusText}`)
  }

  // Step 4: Parse response
  const data = await resp.json()
  const reply = data?.message?.content?.trim() ?? ''
  
  return {
    reply,
    tokenUsage: null  // Ollama doesn't provide reliable token counts
  }
}
```

**Example Usage:**
```typescript
const result = await phi3MiniAdapter.generate({
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'What medications is dad taking?' }
  ],
  settings: {
    temperature: 0.7,
    maxTokens: 512
  }
})

console.log(result.reply)        // "Based on the eldercare context..."
console.log(result.tokenUsage)   // null (Ollama limitation)
```

**Ollama API Request:**
```json
POST http://localhost:11434/api/chat
{
  "model": "phi3:mini",
  "messages": [
    { "role": "system", "content": "You are a helpful assistant." },
    { "role": "user", "content": "What medications is dad taking?" }
  ],
  "stream": false,
  "options": {
    "temperature": 0.7,
    "num_predict": 512
  }
}
```

**Ollama API Response:**
```json
{
  "message": {
    "role": "assistant",
    "content": "Based on the eldercare context provided..."
  },
  "done": true
}
```

---

### 2. `generateStream()` - Streaming Completion

**Purpose:** Generate response with streaming (token-by-token)

**Signature:**
```typescript
async *generateStream({
  messages: { role: string; content: string }[]
  settings?: Record<string, unknown>
  fileIds?: string[]
}): AsyncGenerator<{ delta: string; done?: boolean }>
```

**Process:**
```typescript
async *generateStream({ messages, settings = {} }) {
  // Step 1: Map settings to Ollama options (same as generate)
  const options = { /* ... */ }

  // Step 2: Build streaming request
  const body = {
    model,
    messages,
    stream: true,  // ← Enable streaming
    options: Object.keys(options).length ? options : undefined
  }

  // Step 3: Call Ollama API
  const resp = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })

  if (!resp.ok) {
    throw new Error(`Ollama error: ${resp.status} ${resp.statusText}`)
  }

  // Step 4: Read stream (JSONL format)
  const reader = resp.body?.getReader()
  if (!reader) throw new Error('No response stream')

  const decoder = new TextDecoder()
  
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      
      // Ollama streams JSONL: one JSON object per line
      const lines = chunk.split('\n').filter(Boolean)

      for (const line of lines) {
        try {
          const evt = JSON.parse(line)

          // Yield content chunks
          if (evt.message?.content) {
            yield {
              delta: evt.message.content,
              done: !!evt.done
            }
          }

          // Yield final done event
          if (evt.done) {
            yield { delta: '', done: true }
            return
          }
        } catch {
          // Skip malformed/partial lines (common at chunk boundaries)
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}
```

**Example Usage:**
```typescript
const stream = phi3MiniAdapter.generateStream({
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'What medications is dad taking?' }
  ],
  settings: { temperature: 0.7 }
})

for await (const chunk of stream) {
  if (chunk.done) {
    console.log('\nStream complete!')
  } else {
    process.stdout.write(chunk.delta)  // Print tokens as they arrive
  }
}
```

**Ollama Streaming Response (JSONL):**
```json
{"message":{"role":"assistant","content":"Based"},"done":false}
{"message":{"role":"assistant","content":" on"},"done":false}
{"message":{"role":"assistant","content":" the"},"done":false}
{"message":{"role":"assistant","content":" eldercare"},"done":false}
{"done":true}
```

**Parsed Stream Events:**
```typescript
{ delta: "Based", done: false }
{ delta: " on", done: false }
{ delta: " the", done: false }
{ delta: " eldercare", done: false }
{ delta: "", done: true }
```

---

## Settings Mapping

### Generic → Ollama Options

KalitoSpace uses **generic settings** that work across all adapters. The Ollama adapter maps these to Ollama-specific options:

| Generic Setting | Ollama Option | Type | Description |
|----------------|---------------|------|-------------|
| `temperature` | `temperature` | number | 0.0-2.0, creativity control |
| `maxTokens` | `num_predict` | number | Max tokens to generate |
| `topP` | `top_p` | number | 0.0-1.0, nucleus sampling |
| `repeatPenalty` | `repeat_penalty` | number | Discourage repetition |
| `stopSequences` | `stop` | string[] | Stop generation at sequences |

**Example Mapping:**
```typescript
// User provides generic settings
settings = {
  temperature: 0.3,
  maxTokens: 256,
  topP: 0.9,
  repeatPenalty: 1.1
}

// Adapter maps to Ollama options
options = {
  temperature: 0.3,      // Direct mapping
  num_predict: 256,      // maxTokens → num_predict
  top_p: 0.9,           // Direct mapping
  repeat_penalty: 1.1   // repeatPenalty → repeat_penalty (snake_case)
}
```

**Why Mapping?**
- Consistent API across cloud and local models
- No need to know provider-specific parameter names
- Easy to switch between OpenAI and Ollama

---

## Ollama Server Configuration

### Default Configuration
```typescript
baseUrl = 'http://localhost:11434'
```

**Requirements:**
- Ollama must be installed and running
- Models must be pulled: `ollama pull phi3:mini`

### Check Ollama Status
```bash
# Check if Ollama is running
curl http://localhost:11434/api/version

# List available models
ollama list

# Pull Phi-3 Mini
ollama pull phi3:mini
```

### Custom Ollama Server
```typescript
// Connect to remote Ollama instance
const adapter = createOllamaAdapter({
  id: 'phi3-mini',
  name: 'Phi-3 Mini',
  model: 'phi3:mini',
  contextWindow: 4096,
  baseUrl: 'http://192.168.1.100:11434'  // Remote server
})
```

---

## Error Handling

### Common Errors

#### Ollama Not Running
```typescript
// Error: Failed to fetch
throw new Error('Ollama error: Failed to fetch')
```

**Solution:** Start Ollama
```bash
ollama serve
```

#### Model Not Found
```typescript
// Error: 404 model not found
throw new Error('Ollama error: 404 Not Found')
```

**Solution:** Pull model
```bash
ollama pull phi3:mini
```

#### Connection Refused
```typescript
// Error: ECONNREFUSED
throw new Error('Ollama error: ECONNREFUSED')
```

**Solution:** Check Ollama is running on correct port

---

## Differences from OpenAI Adapter

| Feature | OpenAI | Ollama |
|---------|--------|--------|
| **Type** | `cloud` | `local` |
| **Internet** | Required | Not required |
| **Cost** | Per token | Free |
| **Privacy** | Data sent to OpenAI | Data stays local |
| **Token Counts** | Accurate | Not provided (`null`) |
| **Speed** | 2-5 seconds | 1-3 seconds (CPU) |
| **Models** | GPT-4.1 Nano | Phi3, Qwen, Llama |
| **API Format** | OpenAI SDK | HTTP fetch |
| **Streaming** | Server-Sent Events | JSONL |

---

## Currently Registered Models

### Phi-3 Mini (Primary Local Model)

**Configuration:**
```typescript
{
  id: 'phi3-mini',
  name: 'Phi-3 Mini',
  model: 'phi3:mini',
  contextWindow: 4096
}
```

**Characteristics:**
- **Size:** 2.7GB
- **Speed:** Fast (even on CPU)
- **Quality:** Good for factual queries
- **Context:** 4K tokens
- **Best For:** Eldercare queries, quick responses

**Installation:**
```bash
ollama pull phi3:mini
```

---

## Adding New Models

### Step 1: Pull Model
```bash
ollama pull qwen2.5-coder:latest
```

### Step 2: Create Adapter
```typescript
// In adapters.ts
export const qwenCoderAdapter: LLMAdapter = createOllamaAdapter({
  id: 'qwen-2.5-coder',
  name: 'Qwen 2.5 Coder',
  model: 'qwen2.5-coder:latest',
  contextWindow: 32768  // 32K tokens
})
```

### Step 3: Export Adapter
```typescript
// In adapters.ts
export const ollamaAdapters = {
  'phi3-mini': phi3MiniAdapter,
  'qwen-2.5-coder': qwenCoderAdapter,  // Add here
} as const
```

### Step 4: Register in modelRegistry
```typescript
// In backend/logic/modelRegistry.ts
import {
  phi3MiniAdapter,
  qwenCoderAdapter,  // Import
} from './adapters/ollama'

registerAdapter(qwenCoderAdapter, [
  'qwen',         // Short alias
  'qwen-coder',   // Alternative
])
```

### Step 5: Done!
```typescript
const adapter = getModelAdapter('qwen-2.5-coder')
const result = await adapter.generate({ messages: [...] })
```

---

## Design Decisions

### 1. **Why Factory Pattern?**
**Consistency with OpenAI:**
- Same pattern for all adapters
- Easy to understand codebase
- Minimal code duplication

### 2. **Why HTTP Fetch Instead of SDK?**
**Simplicity:**
- Ollama API is simple HTTP/JSON
- No need for heavy SDK dependency
- Direct control over requests

### 3. **Why Return `null` for Token Usage?**
**Ollama Limitation:**
- Ollama doesn't provide reliable token counts
- Would be misleading to estimate
- `null` is honest about unavailability

### 4. **Why JSONL Parsing for Streaming?**
**Ollama Format:**
- Ollama streams JSON Lines (JSONL)
- One JSON object per line
- Must parse line-by-line

### 5. **Why Settings Mapping?**
**Cross-Provider Compatibility:**
- Users don't need to know provider-specific names
- Same settings work for OpenAI and Ollama
- Easy to switch between providers

---

## Performance Characteristics

### Non-Streaming (`generate()`)
- **Latency:** 1-3 seconds (CPU), 0.5-1s (GPU)
- **Memory:** ~3GB RAM for Phi-3 Mini
- **CPU Usage:** 100% during generation (normal)

### Streaming (`generateStream()`)
- **Latency:** First token in ~500ms
- **Memory:** Same as non-streaming
- **CPU Usage:** Steady during generation

### vs Cloud Models
```
Local (Ollama):    ████████ 1.5s
Cloud (OpenAI):    ████████████ 3s
                   + network latency
                   + API processing
```

---

## Usage Examples

### Example 1: Simple Question
```typescript
const result = await phi3MiniAdapter.generate({
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'What is 2+2?' }
  ],
  settings: { temperature: 0.1, maxTokens: 50 }
})

console.log(result.reply)        // "2+2 equals 4."
console.log(result.tokenUsage)   // null (Ollama doesn't provide)
```

### Example 2: Eldercare Query
```typescript
const systemPrompt = `
You have complete read-only access to the local SQLite database.

## Eldercare Context
- Basilio Sanchez (Father), age 72
- Medications: Farxiga 10mg, Janumet 50/1000mg
`

const result = await phi3MiniAdapter.generate({
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: 'How many medications is dad taking?' }
  ]
})

console.log(result.reply)
// "Basilio is taking 2 medications: Farxiga 10mg once daily
//  and Janumet 50/1000mg twice daily."
```

### Example 3: Streaming Response
```typescript
const stream = phi3MiniAdapter.generateStream({
  messages: [
    { role: 'user', content: 'List 3 benefits of local AI models.' }
  ],
  settings: { temperature: 0.7, maxTokens: 200 }
})

for await (const chunk of stream) {
  if (chunk.done) {
    console.log('\nStream complete!')
  } else {
    process.stdout.write(chunk.delta)
  }
}

// Output:
// 1. Complete privacy - data stays local
// 2. No internet required - works offline
// 3. Zero API costs - free to use
// 
// Stream complete!
```

### Example 4: With Stop Sequences
```typescript
const result = await phi3MiniAdapter.generate({
  messages: [
    { role: 'user', content: 'Count to 5: 1, 2, 3' }
  ],
  settings: {
    temperature: 0.0,
    stopSequences: [', 5']  // Stop before 5
  }
})

console.log(result.reply)  // "1, 2, 3, 4"
```

---

## Testing Scenarios

### Test 1: Basic Generation
```typescript
const result = await adapter.generate({
  messages: [{ role: 'user', content: 'Test' }]
})
assert(typeof result.reply === 'string')
assert(result.tokenUsage === null)  // Ollama doesn't provide
```

### Test 2: Streaming
```typescript
const chunks: string[] = []

for await (const chunk of adapter.generateStream({
  messages: [{ role: 'user', content: 'Test' }]
})) {
  if (!chunk.done) {
    chunks.push(chunk.delta)
  }
}

assert(chunks.length > 0)
```

### Test 3: Settings Mapping
```typescript
const result = await adapter.generate({
  messages: [{ role: 'user', content: 'Test' }],
  settings: {
    temperature: 0.0,
    maxTokens: 10,
    topP: 1.0,
    repeatPenalty: 1.1
  }
})
assert(result.reply.length > 0)
```

### Test 4: Error Handling (Ollama Down)
```typescript
try {
  await adapter.generate({ messages: [...] })
} catch (error) {
  assert(error.message.includes('Ollama error'))
}
```

---

## Troubleshooting

### Problem: "Ollama error: Failed to fetch"
**Cause:** Ollama not running  
**Solution:** `ollama serve`

### Problem: "Ollama error: 404 Not Found"
**Cause:** Model not pulled  
**Solution:** `ollama pull phi3:mini`

### Problem: Slow generation
**Cause:** Running on CPU  
**Solution:** Use GPU if available, or smaller model

### Problem: High memory usage
**Cause:** Large model loaded  
**Solution:** Use smaller model (phi3:mini = 2.7GB)

### Problem: Empty responses
**Cause:** Model not understanding context  
**Solution:** Improve system prompt, lower temperature

---

## Related Files

- `factory.ts` - Core factory logic
- `adapters.ts` - Pre-built adapter instances
- `index.ts` - Barrel export
- `../openai/factory.ts` - Similar pattern for OpenAI
- `../../modelRegistry.ts` - Model registration
- `../../agentService.ts` - Primary consumer

---

## Quick Reference

**Create adapter:**
```typescript
const adapter = createOllamaAdapter({
  id: 'phi3-mini',
  name: 'Phi-3 Mini',
  model: 'phi3:mini',
  contextWindow: 4096
})
```

**Generate response:**
```typescript
const result = await adapter.generate({
  messages: [{ role: 'user', content: 'Hello' }],
  settings: { temperature: 0.7, maxTokens: 512 }
})
```

**Stream response:**
```typescript
for await (const chunk of adapter.generateStream({ messages })) {
  console.log(chunk.delta)
}
```

**Pull model:**
```bash
ollama pull phi3:mini
```

**Check Ollama:**
```bash
curl http://localhost:11434/api/version
```
