# models.ts - LLM Adapter Interface

## Overview
`models.ts` defines the **LLMAdapter** interface - the contract that all AI model adapters must implement in Kalito. This abstraction layer enables supporting multiple LLM providers (OpenAI, Ollama, Anthropic, etc.) with a consistent interface.

---

## Core Interface

### LLMAdapter (Lines 8-33)

```typescript
export interface LLMAdapter {
  id: string
  name: string
  type: 'cloud' | 'local'
  contextWindow?: number
  pricing?: string
  info?: string
  
  generate(args: {
    messages: { role: string; content: string }[]
    settings?: Record<string, unknown>
    fileIds?: string[]
    tools?: ChatCompletionTool[]
  }): Promise<{ reply: string; tokenUsage: number | null; toolCalls?: Array<{ id: string; name: string; arguments: string }> }>

  generateStream?(args: {
    messages: { role: string; content: string }[]
    settings?: Record<string, unknown>
    fileIds?: string[]
  }): AsyncGenerator<{ delta: string; done?: boolean; tokenUsage?: number }>
}
```

**Purpose:**
Defines a **unified interface** for all LLM providers, enabling swappable AI backends.

---

## Metadata Properties

### Property: id
```typescript
id: string
```

**What it is:** Unique identifier for the model

**Examples:**
```typescript
id: 'gpt-4-turbo-preview'
id: 'claude-3-opus-20240229'
id: 'llama-3-70b'
```

**Use cases:**
- Model selection in UI dropdowns
- Database references (which model generated this response)
- API routing (which adapter to use)

---

### Property: name
```typescript
name: string
```

**What it is:** Human-readable display name

**Examples:**
```typescript
name: 'GPT-4 Turbo'
name: 'Claude 3 Opus'
name: 'Llama 3 70B'
```

**Why separate from id?**
- `id`: Technical identifier (API calls)
- `name`: User-facing label (UI)

---

### Property: type
```typescript
type: 'cloud' | 'local'
```

**What it is:** Where the model runs

---

#### 'cloud'
```typescript
type: 'cloud'
```

**What it means:** Model hosted by third-party provider (requires API key, internet)

**Examples:**
- OpenAI (GPT-4, GPT-3.5)
- Anthropic (Claude)
- Google (Gemini)

**Implications:**
- Requires API key
- Costs money per token
- Internet connection required
- Fast (runs on provider's GPUs)
- No local setup needed

---

#### 'local'
```typescript
type: 'local'
```

**What it means:** Model runs on user's machine (no API key, no internet)

**Examples:**
- Ollama (Llama, Mistral, etc.)
- LM Studio
- LocalAI

**Implications:**
- No API key needed
- Free (no per-token cost)
- Works offline
- Slower (depends on user's hardware)
- Requires model download/setup

---

### Property: contextWindow
```typescript
contextWindow?: number
```

**What it is:** Maximum tokens the model can process (input + output)

**Examples:**
```typescript
contextWindow: 128000  // GPT-4 Turbo (128K tokens)
contextWindow: 200000  // Claude 3 Opus (200K tokens)
contextWindow: 8192    // Llama 2 (8K tokens)
```

**Use cases:**
- Validate message history length
- Automatic truncation when exceeding limit
- UI warnings ("Context window full")

**Example validation:**
```typescript
function validateContext(adapter: LLMAdapter, messages: Message[]) {
  const totalTokens = countTokens(messages)
  
  if (adapter.contextWindow && totalTokens > adapter.contextWindow) {
    throw new Error(`Context exceeds ${adapter.contextWindow} tokens`)
  }
}
```

---

### Property: pricing
```typescript
pricing?: string
```

**What it is:** Human-readable pricing information

**Examples:**
```typescript
pricing: '$0.01/1K input tokens, $0.03/1K output tokens'
pricing: 'Free (runs locally)'
pricing: '$15/million tokens'
```

**Note:** String format (not structured) - for display only

**Use cases:**
- Show in model selection UI
- Help users choose cost-effective models
- Informational only (actual pricing in AgentConfig)

---

### Property: info
```typescript
info?: string
```

**What it is:** Additional model information or description

**Examples:**
```typescript
info: 'Best for complex reasoning and coding tasks. Supports vision and function calling.'
info: 'Runs locally on your machine. No internet required.'
info: 'Fast and cost-effective for simple tasks.'
```

**Use cases:**
- Model selection tooltips
- Help users understand model capabilities
- Onboarding new users

---

## Core Method: generate()

### Method Signature (Lines 14-21)

```typescript
generate(args: {
  messages: { role: string; content: string }[]
  settings?: Record<string, unknown>
  fileIds?: string[]
  tools?: ChatCompletionTool[]
}): Promise<{
  reply: string
  tokenUsage: number | null
  toolCalls?: Array<{ id: string; name: string; arguments: string }>
}>
```

**Purpose:**
Classic (non-streaming) generation - send messages, get complete response.

---

### Parameter: messages
```typescript
messages: { role: string; content: string }[]
```

**What it is:** Conversation history

**Example:**
```typescript
messages: [
  { role: 'system', content: 'You are a helpful assistant' },
  { role: 'user', content: 'What is eldercare?' },
  { role: 'assistant', content: 'Eldercare refers to...' },
  { role: 'user', content: 'Tell me more' }
]
```

**Format:** Compatible with `ChatMessage` type

---

### Parameter: settings
```typescript
settings?: Record<string, unknown>
```

**What it is:** Model-specific generation parameters

**Example:**
```typescript
settings: {
  temperature: 0.7,
  maxTokens: 2048,
  topP: 0.9,
  frequencyPenalty: 0.5,
  presencePenalty: 0.3
}
```

**Why `Record<string, unknown>`?**
- Different models support different settings
- OpenAI: temperature, top_p, frequency_penalty
- Anthropic: temperature, top_k, top_p
- Ollama: temperature, num_predict, repeat_penalty

**Type flexibility:**
```typescript
// Adapter can cast to its own settings type
class OpenAIAdapter implements LLMAdapter {
  async generate(args) {
    const settings = args.settings as OpenAISettings
    // Now type-safe for OpenAI-specific settings
  }
}
```

---

### Parameter: fileIds
```typescript
fileIds?: string[]
```

**What it is:** File attachments for vision/document analysis

**Example:**
```typescript
fileIds: ['file-abc123', 'file-def456']
```

**Use cases:**
- Image analysis (medical scans, pills)
- Document processing (lab results, prescriptions)
- Multi-modal conversations

**Provider support:**
- ✅ OpenAI (vision models)
- ✅ Anthropic (Claude 3 vision)
- ❌ Most local models (no vision yet)

---

### Parameter: tools
```typescript
tools?: ChatCompletionTool[]
```

**What it is:** Function calling / tool definitions (OpenAI format)

**Example:**
```typescript
tools: [
  {
    type: 'function',
    function: {
      name: 'get_patient_medications',
      description: 'Retrieve list of patient medications',
      parameters: {
        type: 'object',
        properties: {
          patient_id: { type: 'string' }
        },
        required: ['patient_id']
      }
    }
  }
]
```

**Use cases:**
- Function calling (AI can invoke backend functions)
- Structured data extraction
- Interactive tools (search, calculator, database queries)

**Provider support:**
- ✅ OpenAI (native)
- ✅ Anthropic (via Claude 3)
- ⚠️ Ollama (experimental)

---

### Return Type

```typescript
Promise<{
  reply: string
  tokenUsage: number | null
  toolCalls?: Array<{ id: string; name: string; arguments: string }>
}>
```

---

#### Field: reply
```typescript
reply: string
```

**What it is:** The AI's text response

**Example:**
```typescript
reply: "Eldercare involves providing assistance to older adults with daily activities, medical care, and social engagement."
```

---

#### Field: tokenUsage
```typescript
tokenUsage: number | null
```

**What it is:** Total tokens consumed (input + output)

**Example:**
```typescript
tokenUsage: 327  // 250 input + 77 output
```

**Why nullable?**
- Some local models don't report token usage
- Estimation may be unavailable

**Use cases:**
- Cost calculation
- Usage analytics
- Rate limiting

---

#### Field: toolCalls
```typescript
toolCalls?: Array<{
  id: string
  name: string
  arguments: string
}>
```

**What it is:** Functions the AI wants to invoke

**Example:**
```typescript
toolCalls: [
  {
    id: 'call_123',
    name: 'get_patient_medications',
    arguments: '{"patient_id":"patient-456"}'
  }
]
```

**Flow:**
1. Send message with tools defined
2. AI responds with toolCalls (instead of text)
3. Execute function(s)
4. Send results back to AI
5. AI generates final text response

---

## Optional Method: generateStream()

### Method Signature (Lines 27-32)

```typescript
generateStream?(args: {
  messages: { role: string; content: string }[]
  settings?: Record<string, unknown>
  fileIds?: string[]
}): AsyncGenerator<{
  delta: string
  done?: boolean
  tokenUsage?: number
}>
```

**Purpose:**
Streaming generation - receive tokens incrementally as they're generated.

**Why optional (`?`)?**
- Not all providers support streaming
- Some adapters may only implement classic generation

---

### Async Generator

```typescript
AsyncGenerator<{ delta: string; done?: boolean; tokenUsage?: number }>
```

**What it is:** JavaScript async iterator that yields values over time

**Usage:**
```typescript
const adapter: LLMAdapter = getAdapter('gpt-4-turbo')

for await (const chunk of adapter.generateStream?.({ messages })) {
  process.stdout.write(chunk.delta)  // Print token as it arrives
  
  if (chunk.done) {
    console.log('\nComplete!')
    console.log(`Tokens used: ${chunk.tokenUsage}`)
  }
}
```

---

### Yield Type

#### Field: delta
```typescript
delta: string
```

**What it is:** Incremental token(s)

**Example:**
```typescript
// Stream yields:
{ delta: "Elder" }
{ delta: "care" }
{ delta: " involves" }
{ delta: " providing" }
// ... etc
```

**Concatenate to build full response:**
```typescript
let fullReply = ''
for await (const chunk of stream) {
  fullReply += chunk.delta
}
```

---

#### Field: done
```typescript
done?: boolean
```

**What it is:** Indicates last chunk

**Example:**
```typescript
{ delta: "assistance.", done: true, tokenUsage: 327 }
```

**Use case:** Know when to stop listening

---

#### Field: tokenUsage
```typescript
tokenUsage?: number
```

**What it is:** Total tokens (only in final chunk)

**Example:**
```typescript
{ delta: "", done: true, tokenUsage: 327 }
```

---

## Implementation Examples

### Example 1: OpenAI Adapter

```typescript
import OpenAI from 'openai'
import type { LLMAdapter } from './types/models'

export class OpenAIAdapter implements LLMAdapter {
  id = 'gpt-4-turbo-preview'
  name = 'GPT-4 Turbo'
  type: 'cloud' = 'cloud'
  contextWindow = 128000
  pricing = '$0.01/1K input, $0.03/1K output'
  info = 'Best for complex reasoning and coding'
  
  private client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  
  async generate(args) {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: args.messages,
      temperature: args.settings?.temperature as number,
      max_tokens: args.settings?.maxTokens as number,
      tools: args.tools
    })
    
    const choice = response.choices[0]
    
    return {
      reply: choice.message.content || '',
      tokenUsage: response.usage?.total_tokens ?? null,
      toolCalls: choice.message.tool_calls?.map(tc => ({
        id: tc.id,
        name: tc.function.name,
        arguments: tc.function.arguments
      }))
    }
  }
  
  async *generateStream(args) {
    const stream = await this.client.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: args.messages,
      stream: true,
      temperature: args.settings?.temperature as number
    })
    
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || ''
      yield { delta }
    }
    
    yield { delta: '', done: true }
  }
}
```

---

### Example 2: Ollama Adapter

```typescript
import type { LLMAdapter } from './types/models'

export class OllamaAdapter implements LLMAdapter {
  id = 'llama-3-70b'
  name = 'Llama 3 70B'
  type: 'local' = 'local'
  contextWindow = 8192
  pricing = 'Free (runs locally)'
  info = 'Runs on your machine, no internet required'
  
  async generate(args) {
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        model: 'llama3:70b',
        messages: args.messages,
        stream: false,
        options: {
          temperature: args.settings?.temperature,
          num_predict: args.settings?.maxTokens
        }
      })
    })
    
    const data = await response.json()
    
    return {
      reply: data.message.content,
      tokenUsage: null  // Ollama doesn't always report tokens
    }
  }
  
  async *generateStream(args) {
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        model: 'llama3:70b',
        messages: args.messages,
        stream: true
      })
    })
    
    const reader = response.body!.getReader()
    const decoder = new TextDecoder()
    
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      
      const text = decoder.decode(value)
      const lines = text.split('\n').filter(Boolean)
      
      for (const line of lines) {
        const chunk = JSON.parse(line)
        yield { delta: chunk.message.content || '' }
        
        if (chunk.done) {
          yield { delta: '', done: true }
        }
      }
    }
  }
}
```

---

## Usage in Backend

### Model Registry

```typescript
import type { LLMAdapter } from './types/models'
import { OpenAIAdapter } from './adapters/openai'
import { OllamaAdapter } from './adapters/ollama'

class ModelRegistry {
  private adapters = new Map<string, LLMAdapter>()
  
  register(adapter: LLMAdapter) {
    this.adapters.set(adapter.id, adapter)
  }
  
  get(modelId: string): LLMAdapter | undefined {
    return this.adapters.get(modelId)
  }
  
  getAll(): LLMAdapter[] {
    return Array.from(this.adapters.values())
  }
}

// Initialize
const registry = new ModelRegistry()
registry.register(new OpenAIAdapter('gpt-4-turbo-preview'))
registry.register(new OpenAIAdapter('gpt-3.5-turbo'))
registry.register(new OllamaAdapter('llama3:70b'))
registry.register(new OllamaAdapter('mistral:7b'))

export { registry }
```

---

### Agent Service

```typescript
import { registry } from './modelRegistry'

async function generateResponse(request: AgentRequest) {
  const adapter = registry.get(request.modelName)
  
  if (!adapter) {
    throw new Error(`Model not found: ${request.modelName}`)
  }
  
  // Validate context window
  const totalTokens = countTokens(request.messages)
  if (adapter.contextWindow && totalTokens > adapter.contextWindow) {
    throw new Error(`Context exceeds ${adapter.contextWindow} tokens`)
  }
  
  // Generate
  const result = await adapter.generate({
    messages: request.messages,
    settings: request.settings,
    fileIds: request.fileIds,
    tools: request.tools
  })
  
  return result
}
```

---

### API Endpoint

```typescript
router.post('/api/agent', async (req, res) => {
  const request: AgentRequest = req.body
  
  try {
    if (request.stream) {
      // Streaming response
      const adapter = registry.get(request.modelName)
      
      if (!adapter?.generateStream) {
        return err(res, 'VALIDATION_ERROR', 'Model does not support streaming')
      }
      
      res.setHeader('Content-Type', 'text/event-stream')
      
      for await (const chunk of adapter.generateStream({
        messages: request.messages,
        settings: request.settings
      })) {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`)
      }
      
      res.end()
    } else {
      // Non-streaming response
      const result = await generateResponse(request)
      return okItem(res, result)
    }
  } catch (error) {
    return handleRouterError(res, error)
  }
})
```

---

## Best Practices

### 1. Implement Both Methods When Possible
```typescript
// ✅ Good - supports both modes
class MyAdapter implements LLMAdapter {
  async generate(args) { /* ... */ }
  async *generateStream(args) { /* ... */ }
}

// ⚠️ Acceptable - only classic mode
class LegacyAdapter implements LLMAdapter {
  async generate(args) { /* ... */ }
  // generateStream not implemented
}
```

### 2. Handle Settings Gracefully
```typescript
// ✅ Good - use defaults for missing settings
async generate(args) {
  const temperature = (args.settings?.temperature as number) ?? 0.7
  const maxTokens = (args.settings?.maxTokens as number) ?? 2048
  
  // ... use temperature, maxTokens
}
```

### 3. Validate Context Window
```typescript
// ✅ Good - validate before sending
async generate(args) {
  const totalTokens = countTokens(args.messages)
  
  if (this.contextWindow && totalTokens > this.contextWindow) {
    throw new Error(`Context exceeds ${this.contextWindow} tokens`)
  }
  
  // ... proceed with generation
}
```

### 4. Return Null for Unknown Token Usage
```typescript
// ✅ Good - honest about unknown usage
return {
  reply: data.message,
  tokenUsage: null  // Don't guess or estimate
}

// ❌ Bad - fake token count
return {
  reply: data.message,
  tokenUsage: 0  // Misleading!
}
```

### 5. Type-Safe Settings
```typescript
// ✅ Good - define typed settings interface
interface OpenAISettings {
  temperature?: number
  max_tokens?: number
  top_p?: number
}

class OpenAIAdapter implements LLMAdapter {
  async generate(args) {
    const settings = args.settings as OpenAISettings
    // Now type-safe
  }
}
```

---

## Summary

**models.ts defines the LLMAdapter interface:**

### Metadata Properties
- **id**: Unique model identifier
- **name**: Display name
- **type**: 'cloud' | 'local'
- **contextWindow**: Max tokens
- **pricing**: Cost information (string)
- **info**: Description

### Core Method: generate()
- **Classic (non-streaming)** generation
- **Parameters**: messages, settings, fileIds, tools
- **Returns**: reply, tokenUsage, toolCalls

### Optional Method: generateStream()
- **Streaming** generation
- **Yields**: delta chunks
- **Use case**: Real-time UI updates

**Key benefits:**
- **Provider abstraction** (swap OpenAI ↔ Ollama easily)
- **Type safety** across all adapters
- **Consistent interface** (backend doesn't care which model)
- **Flexible settings** (model-specific parameters)

**Enables:**
- Multi-provider support
- Model switching at runtime
- Hybrid cloud/local deployments
- Future-proof architecture (add new providers easily)
