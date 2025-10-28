# OpenAI Adapters Documentation

## Overview

The `adapters.ts` file provides **pre-built adapter instances** created using the factory pattern, offering ready-to-use implementations for OpenAI models.

**Location**: `/backend/logic/adapters/openai/adapters.ts`

**Primary Responsibilities**:
- Create pre-built adapter instances using factory
- Export individual adapters for direct use
- Provide adapter collection for iteration
- Eliminate boilerplate adapter creation

**Design Pattern**: **Factory-Generated Instances**
- Uses `createOpenAIAdapter()` factory
- Pre-configured with model configs
- Ready to use immediately
- Consistent with factory implementation

---

## Architecture Overview

### Adapter Creation Flow

```
OPENAI_MODELS['gpt-4.1-nano']
       ↓
createOpenAIAdapter({ config })
       ↓
gpt41NanoAdapter (LLMAdapter instance)
       ↓
Exported for use in modelRegistry
```

### Component Dependencies

```typescript
import { createOpenAIAdapter } from './factory'
import { OPENAI_MODELS } from './models'
import type { LLMAdapter } from '../../modelRegistry'
```

**Dependencies**:
- `factory.ts` - Adapter creation
- `models.ts` - Model configurations
- `modelRegistry.ts` - LLMAdapter type

---

## Adapter Instances

### gpt41NanoAdapter

```typescript
export const gpt41NanoAdapter: LLMAdapter = createOpenAIAdapter({
  id: 'gpt-4.1-nano',
  config: OPENAI_MODELS['gpt-4.1-nano'],
})
```

**Purpose**: Pre-built GPT-4.1 Nano adapter instance.

**Type**: `LLMAdapter`

**Configuration**:
- **ID**: `'gpt-4.1-nano'`
- **Name**: `'GPT-4.1 Nano'` (from config)
- **Type**: `'cloud'`
- **Context Window**: 128,000 tokens
- **Default Max Tokens**: 1024
- **Default Temperature**: 0.7
- **Pricing**: $0.20 input, $0.80 output (per 1M tokens)

**Methods**:
- `generate({ messages, settings, tools })` - Non-streaming generation
- `generateStream({ messages, settings })` - Streaming generation

#### Usage Examples

**Example 1: Direct Usage**
```typescript
import { gpt41NanoAdapter } from './adapters/openai'

const result = await gpt41NanoAdapter.generate({
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'What is the capital of France?' }
  ]
})

console.log(result.reply)  // "The capital of France is Paris."
console.log(result.tokenUsage)  // 25
```

**Example 2: Custom Settings**
```typescript
const result = await gpt41NanoAdapter.generate({
  messages: [{ role: 'user', content: 'Explain quantum computing' }],
  settings: {
    temperature: 0.3,      // More focused
    maxTokens: 500,        // Longer response
    topP: 0.9,             // Nucleus sampling
  }
})
```

**Example 3: Streaming**
```typescript
const stream = gpt41NanoAdapter.generateStream({
  messages: [{ role: 'user', content: 'Write a short poem' }]
})

for await (const chunk of stream) {
  if (chunk.done) {
    console.log('\nComplete!')
    break
  }
  process.stdout.write(chunk.delta)
}
```

**Example 4: Function Calling**
```typescript
const result = await gpt41NanoAdapter.generate({
  messages: [{ role: 'user', content: 'Search for Python tutorials' }],
  tools: [{
    type: 'function',
    function: {
      name: 'web_search',
      description: 'Search the web',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' }
        },
        required: ['query']
      }
    }
  }]
})

if (result.toolCalls) {
  console.log('Model wants to call:', result.toolCalls[0].name)
  console.log('With arguments:', result.toolCalls[0].arguments)
}
```

---

## Adapter Collection

### openaiAdapters

```typescript
export const openaiAdapters = {
  'gpt-4.1-nano': gpt41NanoAdapter,
} as const
```

**Purpose**: Collection of all OpenAI adapter instances.

**Type**: `Record<string, LLMAdapter>` (readonly)

**Structure**:
- **Key**: Model ID (string)
- **Value**: Adapter instance (LLMAdapter)

**Current Adapters**: 1
- `'gpt-4.1-nano'`: gpt41NanoAdapter

#### Usage Examples

**Example 1: Lookup by ID**
```typescript
import { openaiAdapters } from './adapters/openai'

const adapter = openaiAdapters['gpt-4.1-nano']

const result = await adapter.generate({
  messages: [{ role: 'user', content: 'Hello!' }]
})
```

**Example 2: Iterate All Adapters**
```typescript
import { openaiAdapters } from './adapters/openai'

// List all adapters
for (const [id, adapter] of Object.entries(openaiAdapters)) {
  console.log(`${id}: ${adapter.name}`)
}

// Output:
// gpt-4.1-nano: GPT-4.1 Nano
```

**Example 3: Dynamic Selection**
```typescript
function getAdapter(modelId: string): LLMAdapter | undefined {
  return openaiAdapters[modelId]
}

const adapter = getAdapter('gpt-4.1-nano')
if (adapter) {
  console.log(`Using ${adapter.name}`)
}
```

**Example 4: Test All Adapters**
```typescript
describe('OpenAI Adapters', () => {
  for (const [id, adapter] of Object.entries(openaiAdapters)) {
    it(`${id} should generate responses`, async () => {
      const result = await adapter.generate({
        messages: [{ role: 'user', content: 'Test' }]
      })
      
      expect(result.reply).toBeDefined()
      expect(result.tokenUsage).toBeGreaterThan(0)
    })
  }
})
```

---

## Integration with Model Registry

### Registration Pattern

```typescript
// In modelRegistry.ts
import { gpt41NanoAdapter } from './adapters/openai'

registerAdapter(gpt41NanoAdapter, [
  'gpt-4.1-nano',  // Canonical ID
  'gpt-4-nano',    // Alias
])
```

**Flow**:
1. Import adapter from `adapters/openai`
2. Register with canonical ID + aliases
3. Available for lookup via `getModelAdapter()`

**Example Usage**:
```typescript
// User selects "gpt-4.1-nano" or "gpt-4-nano"
const adapter = getModelAdapter(userSelection)

if (adapter) {
  // adapter === gpt41NanoAdapter (same instance)
  const result = await adapter.generate({...})
}
```

---

## Adding New Adapters

### Pattern: Create and Export

**Step 1: Add Model Config** (in `models.ts`)
```typescript
export const OPENAI_MODELS: Record<string, OpenAIModelConfig> = {
  'gpt-4.1-nano': { ... },
  
  // New model
  'gpt-4o-mini': {
    model: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    contextWindow: 128000,
    defaultMaxTokens: 2048,
    defaultTemperature: 0.7,
    pricing: {
      input: 0.15,
      output: 0.60,
    },
  },
}
```

**Step 2: Create Adapter Instance** (in `adapters.ts`)
```typescript
import { createOpenAIAdapter } from './factory'
import { OPENAI_MODELS } from './models'

// Existing adapter
export const gpt41NanoAdapter: LLMAdapter = createOpenAIAdapter({
  id: 'gpt-4.1-nano',
  config: OPENAI_MODELS['gpt-4.1-nano'],
})

// New adapter
export const gpt4oMiniAdapter: LLMAdapter = createOpenAIAdapter({
  id: 'gpt-4o-mini',
  config: OPENAI_MODELS['gpt-4o-mini'],
})
```

**Step 3: Add to Collection**
```typescript
export const openaiAdapters = {
  'gpt-4.1-nano': gpt41NanoAdapter,
  'gpt-4o-mini': gpt4oMiniAdapter,  // Add to collection
} as const
```

**Step 4: Export in Index** (in `index.ts`)
```typescript
export { 
  gpt41NanoAdapter,
  gpt4oMiniAdapter,  // Export individually
  openaiAdapters
} from './adapters'
```

**Step 5: Register** (in `modelRegistry.ts`)
```typescript
import { 
  gpt41NanoAdapter,
  gpt4oMiniAdapter 
} from './adapters/openai'

registerAdapter(gpt41NanoAdapter, ['gpt-4.1-nano', 'gpt-4-nano'])
registerAdapter(gpt4oMiniAdapter, ['gpt-4o-mini', 'gpt4o-mini'])
```

---

## Adapter Customization

### Custom ID/Name

```typescript
// Create custom adapter with different ID
export const myCustomAdapter: LLMAdapter = createOpenAIAdapter({
  id: 'my-gpt-4.1',              // Custom ID
  name: 'My Custom GPT-4.1',     // Custom name
  config: OPENAI_MODELS['gpt-4.1-nano'],
})

// Same underlying model, different identity
```

**Use Cases**:
- Multiple configurations of same model
- Different personas/contexts
- A/B testing
- User-specific adapters

### Custom Client (Testing)

```typescript
// For testing with mock client
import { createMockOpenAI } from './test-utils'

const mockAdapter: LLMAdapter = createOpenAIAdapter({
  config: OPENAI_MODELS['gpt-4.1-nano'],
  client: createMockOpenAI()  // Inject mock
})

// Test without real API calls
const result = await mockAdapter.generate({
  messages: [{ role: 'user', content: 'Test' }]
})
```

---

## Best Practices

### 1. Use Pre-Built Adapters

```typescript
// ✅ GOOD: Use pre-built adapter
import { gpt41NanoAdapter } from './adapters/openai'

const result = await gpt41NanoAdapter.generate({...})

// ❌ BAD: Create new adapter each time
import { createOpenAIAdapter, OPENAI_MODELS } from './adapters/openai'

const adapter = createOpenAIAdapter({
  config: OPENAI_MODELS['gpt-4.1-nano']
})  // Unnecessary!
```

**Why**: Pre-built adapters are singletons, more efficient.

### 2. Import from Index Module

```typescript
// ✅ GOOD: Import from module root
import { gpt41NanoAdapter } from './adapters/openai'

// ❌ BAD: Import from internal file
import { gpt41NanoAdapter } from './adapters/openai/adapters'
```

**Why**: Respects module encapsulation.

### 3. Use Collection for Iteration

```typescript
// ✅ GOOD: Iterate collection
import { openaiAdapters } from './adapters/openai'

for (const adapter of Object.values(openaiAdapters)) {
  console.log(adapter.name)
}

// ⚠️ ACCEPTABLE: Manual list
import { gpt41NanoAdapter } from './adapters/openai'

const adapters = [gpt41NanoAdapter]
```

**Why**: Collection is maintained automatically.

### 4. Type Assertions for Type Safety

```typescript
// ✅ GOOD: Type assertion
const adapter: LLMAdapter = openaiAdapters['gpt-4.1-nano']

// ⚠️ ACCEPTABLE: Check before use
const adapter = openaiAdapters['gpt-4.1-nano']
if (adapter) {
  // Use adapter
}
```

---

## Testing Examples

### Unit Tests

```typescript
import { gpt41NanoAdapter, openaiAdapters } from './adapters/openai'

describe('OpenAI Adapters', () => {
  describe('gpt41NanoAdapter', () => {
    it('should have correct properties', () => {
      expect(gpt41NanoAdapter.id).toBe('gpt-4.1-nano')
      expect(gpt41NanoAdapter.name).toBe('GPT-4.1 Nano')
      expect(gpt41NanoAdapter.type).toBe('cloud')
      expect(gpt41NanoAdapter.contextWindow).toBe(128000)
    })

    it('should have generate method', () => {
      expect(typeof gpt41NanoAdapter.generate).toBe('function')
    })

    it('should have generateStream method', () => {
      expect(typeof gpt41NanoAdapter.generateStream).toBe('function')
    })
  })

  describe('openaiAdapters', () => {
    it('should contain gpt41NanoAdapter', () => {
      expect(openaiAdapters['gpt-4.1-nano']).toBe(gpt41NanoAdapter)
    })

    it('should have correct number of adapters', () => {
      expect(Object.keys(openaiAdapters).length).toBe(1)
    })
  })
})
```

### Integration Tests

```typescript
describe('OpenAI Adapters Integration', () => {
  // Skip if no API key
  const skipIfNoKey = () => {
    if (!process.env.OPENAI_API_KEY) {
      console.log('Skipping - no API key')
      return true
    }
    return false
  }

  it('should generate real response', async () => {
    if (skipIfNoKey()) return

    const result = await gpt41NanoAdapter.generate({
      messages: [{ role: 'user', content: 'Say "test"' }],
      settings: { maxTokens: 10 }
    })

    expect(result.reply).toBeDefined()
    expect(result.reply.toLowerCase()).toContain('test')
    expect(result.tokenUsage).toBeGreaterThan(0)
  })

  it('should stream real response', async () => {
    if (skipIfNoKey()) return

    const chunks: string[] = []
    
    for await (const chunk of gpt41NanoAdapter.generateStream({
      messages: [{ role: 'user', content: 'Count to 3' }]
    })) {
      if (chunk.done) {
        expect(chunk.tokenUsage).toBeGreaterThan(0)
        break
      }
      chunks.push(chunk.delta)
    }

    expect(chunks.length).toBeGreaterThan(0)
  })
})
```

---

## Performance Considerations

### Singleton Pattern

**Pre-built adapters are singletons**:
```typescript
import { gpt41NanoAdapter } from './adapters/openai'

const adapter1 = gpt41NanoAdapter
const adapter2 = gpt41NanoAdapter

console.log(adapter1 === adapter2)  // true (same instance)
```

**Benefits**:
- Single OpenAI client instance
- Shared rate limiting state
- Lower memory footprint
- Consistent behavior

### Client Reuse

All adapters share the default OpenAI client:
```typescript
const defaultClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-xxx',
})

// All adapters use same client
gpt41NanoAdapter.generate({...})  // Uses defaultClient
gpt4oMiniAdapter.generate({...})  // Uses defaultClient (same instance)
```

**Benefits**:
- Single connection pool
- Shared rate limits
- Lower overhead

---

## Future Enhancements

### 1. More Models

```typescript
// Add o1 models
export const o1PreviewAdapter: LLMAdapter = createOpenAIAdapter({
  config: OPENAI_MODELS['o1-preview'],
})

export const o1MiniAdapter: LLMAdapter = createOpenAIAdapter({
  config: OPENAI_MODELS['o1-mini'],
})

export const openaiAdapters = {
  'gpt-4.1-nano': gpt41NanoAdapter,
  'o1-preview': o1PreviewAdapter,
  'o1-mini': o1MiniAdapter,
} as const
```

### 2. Specialized Adapters

```typescript
// Adapter optimized for summarization
export const summarizerAdapter: LLMAdapter = createOpenAIAdapter({
  id: 'summarizer',
  name: 'Summarization Assistant',
  config: {
    ...OPENAI_MODELS['gpt-4.1-nano'],
    defaultTemperature: 0.3,  // More focused
    defaultMaxTokens: 500,    // Shorter outputs
  },
})
```

### 3. Lazy Loading

```typescript
// Load adapters on demand
export function getAdapter(id: string): LLMAdapter {
  if (!adapterCache[id]) {
    adapterCache[id] = createOpenAIAdapter({
      config: OPENAI_MODELS[id]
    })
  }
  return adapterCache[id]
}
```

---

## Summary

The **OpenAI Adapters Module** provides ready-to-use adapter instances:

**Core Exports**:
- **`gpt41NanoAdapter`**: Pre-built GPT-4.1 Nano adapter
- **`openaiAdapters`**: Collection of all adapters

**Features**:
- Factory-generated (consistent behavior)
- Pre-configured with model specs
- Ready to use (no setup needed)
- Singleton instances (efficient)

**Adapter Properties**:
- **ID**: `'gpt-4.1-nano'`
- **Name**: `'GPT-4.1 Nano'`
- **Type**: `'cloud'`
- **Context**: 128K tokens
- **Pricing**: $0.20/$0.80 per 1M tokens

**Methods**:
- `generate()`: Non-streaming with tool support
- `generateStream()`: Real-time streaming

**Integration**:
- Used by `modelRegistry` for registration
- Called by `agentService` for generation
- Available throughout application

**Best Practices**:
- Use pre-built adapters (not factory)
- Import from index module
- Use collection for iteration
- Singleton pattern (efficient)

**Production Status**: Fully implemented with 1 adapter (GPT-4.1 Nano). Easy to add more models by extending pattern.
