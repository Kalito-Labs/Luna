# Ollama Adapters Documentation

## Overview

The `adapters.ts` file provides **pre-built adapter instances** for local Ollama models, offering ready-to-use implementations for privacy-focused, offline AI capabilities.

**Location**: `/backend/logic/adapters/ollama/adapters.ts`

**Primary Responsibilities**:
- Create pre-built adapter instances for Ollama models
- Export individual adapters for direct use
- Provide adapter collection for iteration
- Utility functions for adapter discovery

**Design Pattern**: **Factory-Generated Local Instances**
- Uses `createOllamaAdapter()` factory
- Pre-configured for local Ollama models
- Runs offline (no cloud API required)
- Privacy-focused (data stays local)

---

## Architecture Overview

### Local vs Cloud Adapters

```
┌─────────────────────────────────────────────────────┐
│                  Adapter Layer                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Cloud Adapters (OpenAI)    Local Adapters (Ollama)│
│  ├─ gpt41NanoAdapter         ├─ phi3MiniAdapter    │
│  ├─ Type: 'cloud'            ├─ Type: 'local'      │
│  ├─ Requires API key         ├─ No API key needed  │
│  ├─ Internet required        ├─ Offline capable    │
│  ├─ Cost per token           ├─ Free (local GPU)   │
│  └─ High capability          └─ Fast, private      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Adapter Creation Flow

```
phi3MiniAdapter Configuration
       ↓
createOllamaAdapter({
  id: 'phi3-mini',
  name: 'Phi-3 Mini',
  model: 'phi3:mini',
  contextWindow: 4096
})
       ↓
LLMAdapter instance (type: 'local')
       ↓
Registered in modelRegistry
       ↓
Available for use by agentService
```

### Component Dependencies

```typescript
import { createOllamaAdapter } from './factory'
import type { LLMAdapter } from '../../modelRegistry'
```

**Dependencies**:
- `factory.ts` - Ollama adapter factory function
- `modelRegistry.ts` - LLMAdapter type definition

---

## Adapter Instances

### phi3MiniAdapter

```typescript
export const phi3MiniAdapter: LLMAdapter = createOllamaAdapter({
  id: 'phi3-mini',
  name: 'Phi-3 Mini',
  model: 'phi3:mini',
  contextWindow: 4096,
})
```

**Purpose**: Pre-built Phi-3 Mini adapter for local, privacy-focused AI inference.

**Type**: `LLMAdapter`

**Model Information**:
- **Model**: Phi-3 Mini (Microsoft's lightweight reasoning model)
- **Size**: ~2.3GB download
- **Parameters**: 3.8 billion
- **Quantization**: Q4 (4-bit quantized for efficiency)
- **Use Case**: Fast, factual eldercare queries without cloud dependency

**Configuration**:
- **ID**: `'phi3-mini'`
- **Name**: `'Phi-3 Mini'`
- **Model Identifier**: `'phi3:mini'` (Ollama model name)
- **Type**: `'local'`
- **Context Window**: 4,096 tokens (~3,000 words)
- **Base URL**: `http://localhost:11434` (default Ollama endpoint)

**Capabilities**:
- ✅ Text generation (non-streaming and streaming)
- ✅ Conversation history support
- ✅ Temperature control
- ✅ Token limit control (num_predict)
- ✅ Top-p sampling
- ✅ Repeat penalty
- ✅ Stop sequences
- ❌ Function calling (not supported by Ollama yet)
- ❌ Token usage tracking (Ollama doesn't provide reliable counts)

**Performance Characteristics**:
- **Speed**: ~30-50 tokens/second on modern GPU
- **Latency**: <100ms first token (model loaded)
- **Cost**: Free (local inference)
- **Privacy**: 100% local (no data leaves machine)
- **Offline**: Works without internet

#### Use Cases

**Primary: Eldercare Assistance**
```typescript
import { phi3MiniAdapter } from './adapters/ollama'

// Medication reminder
const result = await phi3MiniAdapter.generate({
  messages: [
    { role: 'system', content: 'You are a helpful eldercare assistant.' },
    { role: 'user', content: 'What medications does patient John Doe need to take today?' }
  ]
})

console.log(result.reply)
// "Based on the eldercare records, John Doe should take..."
```

**Privacy-Sensitive Queries**
```typescript
// Handle sensitive health data locally
const result = await phi3MiniAdapter.generate({
  messages: [
    { role: 'user', content: 'Summarize patient health records for Jane Smith' }
  ],
  settings: {
    temperature: 0.3  // More focused for medical data
  }
})

// Data never leaves local machine
```

**Fast, Factual Responses**
```typescript
// Quick answers without cloud latency
const result = await phi3MiniAdapter.generate({
  messages: [
    { role: 'user', content: 'What are normal blood pressure ranges for elderly patients?' }
  ]
})

// Response in <1 second (no internet required)
```

**Offline Operation**
```typescript
// Works even without internet
const result = await phi3MiniAdapter.generate({
  messages: [
    { role: 'user', content: 'Emergency: How to help a fall victim?' }
  ]
})

// Critical for scenarios where internet is unavailable
```

#### Usage Examples

**Example 1: Basic Generation**
```typescript
import { phi3MiniAdapter } from './adapters/ollama'

const result = await phi3MiniAdapter.generate({
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Explain dementia care basics.' }
  ]
})

console.log(result.reply)
console.log(result.tokenUsage)  // null (Ollama limitation)
```

**Example 2: Custom Settings**
```typescript
const result = await phi3MiniAdapter.generate({
  messages: [
    { role: 'user', content: 'List common medications for hypertension' }
  ],
  settings: {
    temperature: 0.2,        // Very focused (medical facts)
    maxTokens: 300,          // Concise response
    topP: 0.9,               // Nucleus sampling
    repeatPenalty: 1.1,      // Reduce repetition
  }
})
```

**Example 3: Streaming Response**
```typescript
const stream = phi3MiniAdapter.generateStream({
  messages: [
    { role: 'user', content: 'Describe a typical day in assisted living' }
  ]
})

for await (const chunk of stream) {
  if (chunk.done) {
    console.log('\nComplete!')
    break
  }
  process.stdout.write(chunk.delta)  // Real-time output
}
```

**Example 4: Multi-Turn Conversation**
```typescript
const conversation = [
  { role: 'system', content: 'You are an eldercare expert.' },
  { role: 'user', content: 'What is respite care?' },
]

// First response
let result = await phi3MiniAdapter.generate({ messages: conversation })
conversation.push({ role: 'assistant', content: result.reply })

// Follow-up question
conversation.push({ role: 'user', content: 'How much does it cost?' })
result = await phi3MiniAdapter.generate({ messages: conversation })

// Model has full context
```

**Example 5: Stop Sequences**
```typescript
const result = await phi3MiniAdapter.generate({
  messages: [
    { role: 'user', content: 'List 3 benefits of physical therapy:' }
  ],
  settings: {
    stopSequences: ['4.', '\n\n']  // Stop after 3 items or double newline
  }
})
```

**Example 6: Error Handling**
```typescript
try {
  const result = await phi3MiniAdapter.generate({
    messages: [{ role: 'user', content: 'Test query' }]
  })
} catch (error) {
  if (error.message.includes('Ollama error: 404')) {
    console.error('Model not found. Run: ollama pull phi3:mini')
  } else if (error.message.includes('fetch failed')) {
    console.error('Ollama not running. Start with: ollama serve')
  } else {
    console.error('Generation failed:', error.message)
  }
}
```

---

## Adapter Collection

### ollamaAdapters

```typescript
export const ollamaAdapters = {
  'phi3-mini': phi3MiniAdapter,
} as const
```

**Purpose**: Collection of all Ollama adapter instances.

**Type**: `Record<string, LLMAdapter>` (readonly)

**Structure**:
- **Key**: Model ID (string)
- **Value**: Adapter instance (LLMAdapter)

**Current Adapters**: 1
- `'phi3-mini'`: phi3MiniAdapter

**Future Expansion**: Can add more Ollama models
- `'llama3'`: Llama 3 adapter (larger, more capable)
- `'mistral'`: Mistral 7B adapter (multilingual)
- `'codellama'`: CodeLlama adapter (code-focused)
- `'gemma'`: Gemma adapter (Google's model)

#### Usage Examples

**Example 1: Lookup by ID**
```typescript
import { ollamaAdapters } from './adapters/ollama'

const adapter = ollamaAdapters['phi3-mini']

const result = await adapter.generate({
  messages: [{ role: 'user', content: 'Hello!' }]
})
```

**Example 2: Iterate All Adapters**
```typescript
import { ollamaAdapters } from './adapters/ollama'

// List all local models
for (const [id, adapter] of Object.entries(ollamaAdapters)) {
  console.log(`${id}: ${adapter.name} (${adapter.type})`)
}

// Output:
// phi3-mini: Phi-3 Mini (local)
```

**Example 3: Dynamic Selection**
```typescript
function getLocalAdapter(modelId: string): LLMAdapter | undefined {
  return ollamaAdapters[modelId]
}

const adapter = getLocalAdapter('phi3-mini')
if (adapter) {
  console.log(`Using local model: ${adapter.name}`)
}
```

**Example 4: Compare Local vs Cloud**
```typescript
import { ollamaAdapters } from './adapters/ollama'
import { openaiAdapters } from './adapters/openai'

// User preference: privacy vs capability
const useLocal = userPreferenceIsPrivacy()

const adapter = useLocal 
  ? ollamaAdapters['phi3-mini']
  : openaiAdapters['gpt-4.1-nano']

console.log(`Using ${adapter.type} model: ${adapter.name}`)
```

**Example 5: Health Check All Local Models**
```typescript
async function checkLocalModels() {
  for (const [id, adapter] of Object.entries(ollamaAdapters)) {
    try {
      await adapter.generate({
        messages: [{ role: 'user', content: 'test' }],
        settings: { maxTokens: 1 }
      })
      console.log(`✓ ${id} is ready`)
    } catch (error) {
      console.log(`✗ ${id} failed:`, error.message)
    }
  }
}
```

---

## Utility Functions

### getOllamaAdapterIds()

```typescript
export function getOllamaAdapterIds(): string[] {
  return Object.keys(ollamaAdapters)
}
```

**Purpose**: Get list of all available Ollama adapter IDs.

**Parameters**: None

**Returns**: `string[]` - Array of adapter IDs

**Example Return**: `['phi3-mini']`

#### Usage Examples

**Example 1: List Available Models**
```typescript
import { getOllamaAdapterIds } from './adapters/ollama'

const ids = getOllamaAdapterIds()
console.log('Available local models:', ids)
// ['phi3-mini']
```

**Example 2: Validate Model Selection**
```typescript
import { getOllamaAdapterIds, ollamaAdapters } from './adapters/ollama'

function selectModel(id: string): LLMAdapter | null {
  const availableIds = getOllamaAdapterIds()
  
  if (!availableIds.includes(id)) {
    console.error(`Invalid model. Available: ${availableIds.join(', ')}`)
    return null
  }
  
  return ollamaAdapters[id]
}
```

**Example 3: UI Model Selector**
```typescript
import { getOllamaAdapterIds, ollamaAdapters } from './adapters/ollama'

// Generate dropdown options
function getModelOptions() {
  return getOllamaAdapterIds().map(id => ({
    value: id,
    label: ollamaAdapters[id].name,
    type: ollamaAdapters[id].type,
  }))
}

// [{
//   value: 'phi3-mini',
//   label: 'Phi-3 Mini',
//   type: 'local'
// }]
```

**Example 4: Test All Models**
```typescript
import { getOllamaAdapterIds, ollamaAdapters } from './adapters/ollama'

describe('Ollama Adapters', () => {
  const ids = getOllamaAdapterIds()
  
  for (const id of ids) {
    it(`${id} should generate responses`, async () => {
      const adapter = ollamaAdapters[id]
      const result = await adapter.generate({
        messages: [{ role: 'user', content: 'test' }]
      })
      expect(result.reply).toBeDefined()
    })
  }
})
```

---

## Integration with Model Registry

### Registration Pattern

```typescript
// In modelRegistry.ts
import { phi3MiniAdapter } from './adapters/ollama'

registerAdapter(phi3MiniAdapter, [
  'phi3-mini',     // Canonical ID
  'phi3',          // Alias
  'local-phi3',    // Alternative name
])
```

**Registration Flow**:
1. Import adapter from `adapters/ollama`
2. Register with canonical ID + aliases
3. Available for lookup via `getModelAdapter()`
4. Appears in `listModelAdapters()`

**Example Usage**:
```typescript
// User selects "phi3-mini", "phi3", or "local-phi3"
const adapter = getModelAdapter(userSelection)

if (adapter) {
  // adapter === phi3MiniAdapter (same instance)
  const result = await adapter.generate({...})
}
```

### Privacy Mode Integration

```typescript
// In agentService.ts
import { getModelAdapter } from './modelRegistry'

async function generateResponse(query: string, privacyMode: boolean) {
  // Select local model for privacy
  const modelId = privacyMode ? 'phi3-mini' : 'gpt-4.1-nano'
  const adapter = getModelAdapter(modelId)
  
  if (!adapter) {
    throw new Error(`Model not available: ${modelId}`)
  }
  
  return adapter.generate({
    messages: [{ role: 'user', content: query }]
  })
}
```

---

## Ollama Setup Requirements

### Installation

**1. Install Ollama**
```bash
# macOS/Linux
curl -fsSL https://ollama.com/install.sh | sh

# Or download from https://ollama.com
```

**2. Pull Phi-3 Mini Model**
```bash
ollama pull phi3:mini
```

**3. Verify Installation**
```bash
# Check Ollama is running
curl http://localhost:11434/api/tags

# Test generation
ollama run phi3:mini "Hello, world!"
```

### System Requirements

**Minimum**:
- **RAM**: 8GB (4GB for model + 4GB for OS)
- **Disk**: 3GB free space
- **CPU**: Modern x64 processor
- **OS**: macOS, Linux, or Windows (WSL2)

**Recommended**:
- **RAM**: 16GB+ for smooth operation
- **GPU**: NVIDIA/AMD GPU for faster inference
- **Disk**: 10GB+ for multiple models
- **CPU**: Recent Intel/AMD (AVX2 support)

**GPU Acceleration** (Optional but recommended):
- **NVIDIA**: CUDA toolkit installed
- **AMD**: ROCm support (Linux)
- **Apple**: Metal (automatic on M1/M2/M3)

### Configuration

**Custom Ollama URL**
```typescript
// In factory.ts config
const customAdapter = createOllamaAdapter({
  id: 'phi3-mini',
  name: 'Phi-3 Mini',
  model: 'phi3:mini',
  contextWindow: 4096,
  baseUrl: 'http://192.168.1.100:11434'  // Remote Ollama server
})
```

**Environment Variables** (Optional):
```bash
# Change Ollama host
export OLLAMA_HOST="0.0.0.0:11434"

# Change models directory
export OLLAMA_MODELS="/custom/path/models"
```

---

## Adding New Ollama Models

### Pattern: Add Model to Collection

**Step 1: Pull Model from Ollama**
```bash
# Example: Add Llama 3
ollama pull llama3
```

**Step 2: Create Adapter Instance** (in `adapters.ts`)
```typescript
import { createOllamaAdapter } from './factory'
import type { LLMAdapter } from '../../modelRegistry'

// Existing adapter
export const phi3MiniAdapter: LLMAdapter = createOllamaAdapter({
  id: 'phi3-mini',
  name: 'Phi-3 Mini',
  model: 'phi3:mini',
  contextWindow: 4096,
})

// New adapter
export const llama3Adapter: LLMAdapter = createOllamaAdapter({
  id: 'llama3',
  name: 'Llama 3',
  model: 'llama3',
  contextWindow: 8192,  // Llama 3 has 8K context
})
```

**Step 3: Add to Collection**
```typescript
export const ollamaAdapters = {
  'phi3-mini': phi3MiniAdapter,
  'llama3': llama3Adapter,  // Add to collection
} as const
```

**Step 4: Export in Index** (in `index.ts`)
```typescript
export {
  phi3MiniAdapter,
  llama3Adapter,  // Export individually
  ollamaAdapters,
  getOllamaAdapterIds,
} from './adapters'
```

**Step 5: Register** (in `modelRegistry.ts`)
```typescript
import { 
  phi3MiniAdapter,
  llama3Adapter 
} from './adapters/ollama'

registerAdapter(phi3MiniAdapter, ['phi3-mini', 'phi3'])
registerAdapter(llama3Adapter, ['llama3', 'llama-3'])
```

### Popular Ollama Models

**Recommended Models for Eldercare**:

1. **Phi-3 Mini** (Current) ✅
   - Size: 2.3GB
   - Speed: Fast
   - Use: Quick factual queries
   
2. **Llama 3** (8B)
   - Size: 4.7GB
   - Speed: Medium
   - Use: More nuanced conversations
   
3. **Mistral** (7B)
   - Size: 4.1GB
   - Speed: Medium
   - Use: Multilingual support
   
4. **Gemma** (7B)
   - Size: 5.0GB
   - Speed: Medium
   - Use: Google's model, good reasoning

**Code Example**:
```typescript
// Add Mistral adapter
export const mistralAdapter: LLMAdapter = createOllamaAdapter({
  id: 'mistral',
  name: 'Mistral 7B',
  model: 'mistral',
  contextWindow: 8192,
})

export const ollamaAdapters = {
  'phi3-mini': phi3MiniAdapter,
  'mistral': mistralAdapter,
} as const
```

---

## Model Comparison

### Phi-3 Mini vs Cloud Models

| Feature | Phi-3 Mini (Local) | GPT-4.1 Nano (Cloud) |
|---------|-------------------|---------------------|
| **Type** | Local | Cloud |
| **Privacy** | 100% local | Data sent to OpenAI |
| **Internet** | Not required | Required |
| **Cost** | Free | $0.20-$0.80 per 1M tokens |
| **Speed** | Fast (30-50 tok/s) | Medium (network latency) |
| **Context** | 4,096 tokens | 128,000 tokens |
| **Capability** | Good | Excellent |
| **Setup** | Requires Ollama | API key only |
| **Hardware** | GPU recommended | None |
| **Use Case** | Privacy, offline | High complexity |

### When to Use Phi-3 Mini

**✅ Use Phi-3 Mini When**:
- Privacy is critical (HIPAA, patient data)
- Internet unavailable (offline scenarios)
- Cost sensitivity (high volume queries)
- Fast response needed (local is faster)
- Simple queries (factual, straightforward)

**❌ Use Cloud Models When**:
- Complex reasoning required
- Long context needed (>4K tokens)
- Latest capabilities required
- No local GPU available
- Consistency across deployments

### Hybrid Strategy

```typescript
// Use local for privacy, cloud for complexity
async function generateResponse(
  query: string, 
  context: string,
  privacySensitive: boolean
) {
  // Determine model based on requirements
  const modelId = privacySensitive 
    ? 'phi3-mini'           // Local for privacy
    : 'gpt-4.1-nano'        // Cloud for capability
  
  const adapter = getModelAdapter(modelId)
  
  return adapter.generate({
    messages: [
      { role: 'system', content: context },
      { role: 'user', content: query }
    ]
  })
}
```

---

## Performance Optimization

### 1. Keep Model Loaded

```typescript
// Warm up model on app start
async function warmupLocalModels() {
  for (const adapter of Object.values(ollamaAdapters)) {
    try {
      await adapter.generate({
        messages: [{ role: 'user', content: 'ready' }],
        settings: { maxTokens: 1 }
      })
      console.log(`✓ ${adapter.name} warmed up`)
    } catch (error) {
      console.error(`Failed to warm up ${adapter.name}:`, error.message)
    }
  }
}

// Call on app initialization
await warmupLocalModels()
```

**Why**: First request loads model into memory (~2-5 seconds). Subsequent requests are instant.

### 2. Optimize Settings for Speed

```typescript
// Fast generation settings
const result = await phi3MiniAdapter.generate({
  messages: [{ role: 'user', content: query }],
  settings: {
    temperature: 0.3,     // Lower = faster (less sampling)
    maxTokens: 200,       // Shorter = faster
    topP: 0.9,            // Smaller = faster
  }
})
```

### 3. Use Streaming for UX

```typescript
// Better perceived performance
const stream = phi3MiniAdapter.generateStream({
  messages: [{ role: 'user', content: query }]
})

// Show first token immediately (~100ms)
for await (const chunk of stream) {
  if (chunk.done) break
  displayIncrementalOutput(chunk.delta)  // User sees progress
}
```

### 4. Batch Similar Queries

```typescript
// Process multiple queries efficiently
async function batchProcess(queries: string[]) {
  const results = await Promise.all(
    queries.map(query => 
      phi3MiniAdapter.generate({
        messages: [{ role: 'user', content: query }],
        settings: { maxTokens: 100 }
      })
    )
  )
  return results
}
```

---

## Error Handling

### Common Errors and Solutions

**1. Model Not Found (404)**
```typescript
try {
  const result = await phi3MiniAdapter.generate({...})
} catch (error) {
  if (error.message.includes('404')) {
    console.error('Model not downloaded. Run: ollama pull phi3:mini')
  }
}
```

**Solution**:
```bash
ollama pull phi3:mini
```

**2. Ollama Not Running**
```typescript
try {
  const result = await phi3MiniAdapter.generate({...})
} catch (error) {
  if (error.message.includes('fetch failed')) {
    console.error('Ollama not running. Start with: ollama serve')
  }
}
```

**Solution**:
```bash
ollama serve
```

**3. Connection Refused**
```typescript
try {
  const result = await phi3MiniAdapter.generate({...})
} catch (error) {
  if (error.message.includes('ECONNREFUSED')) {
    console.error('Cannot connect to Ollama at http://localhost:11434')
  }
}
```

**Solution**: Check Ollama is running on correct port.

**4. Out of Memory**
```typescript
// If model fails to load (OOM)
// Reduce concurrent requests or use smaller model
const result = await phi3MiniAdapter.generate({
  messages: [{ role: 'user', content: query }],
  settings: {
    maxTokens: 100  // Reduce token limit
  }
})
```

### Robust Error Handling Pattern

```typescript
async function safeGenerate(query: string): Promise<string> {
  try {
    const result = await phi3MiniAdapter.generate({
      messages: [{ role: 'user', content: query }]
    })
    return result.reply
  } catch (error) {
    const message = error.message
    
    if (message.includes('404')) {
      throw new Error('Phi-3 model not installed. Run: ollama pull phi3:mini')
    } else if (message.includes('fetch failed') || message.includes('ECONNREFUSED')) {
      throw new Error('Ollama server not running. Start with: ollama serve')
    } else if (message.includes('timeout')) {
      throw new Error('Request timed out. Try again or reduce maxTokens.')
    } else {
      throw new Error(`Generation failed: ${message}`)
    }
  }
}
```

---

## Testing Examples

### Unit Tests

```typescript
import { phi3MiniAdapter, ollamaAdapters, getOllamaAdapterIds } from './adapters/ollama'

describe('Ollama Adapters', () => {
  describe('phi3MiniAdapter', () => {
    it('should have correct properties', () => {
      expect(phi3MiniAdapter.id).toBe('phi3-mini')
      expect(phi3MiniAdapter.name).toBe('Phi-3 Mini')
      expect(phi3MiniAdapter.type).toBe('local')
      expect(phi3MiniAdapter.contextWindow).toBe(4096)
    })

    it('should have generate method', () => {
      expect(typeof phi3MiniAdapter.generate).toBe('function')
    })

    it('should have generateStream method', () => {
      expect(typeof phi3MiniAdapter.generateStream).toBe('function')
    })
  })

  describe('ollamaAdapters', () => {
    it('should contain phi3MiniAdapter', () => {
      expect(ollamaAdapters['phi3-mini']).toBe(phi3MiniAdapter)
    })

    it('should have correct number of adapters', () => {
      expect(Object.keys(ollamaAdapters).length).toBe(1)
    })
  })

  describe('getOllamaAdapterIds', () => {
    it('should return array of adapter IDs', () => {
      const ids = getOllamaAdapterIds()
      expect(Array.isArray(ids)).toBe(true)
      expect(ids).toContain('phi3-mini')
    })
  })
})
```

### Integration Tests

```typescript
describe('Ollama Adapters Integration', () => {
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

  it('should generate real response', async () => {
    if (await skipIfNoOllama()) return

    const result = await phi3MiniAdapter.generate({
      messages: [{ role: 'user', content: 'Say "test"' }],
      settings: { maxTokens: 10 }
    })

    expect(result.reply).toBeDefined()
    expect(result.reply.toLowerCase()).toContain('test')
    expect(result.tokenUsage).toBeNull()  // Ollama doesn't track
  })

  it('should stream real response', async () => {
    if (await skipIfNoOllama()) return

    const chunks: string[] = []
    
    for await (const chunk of phi3MiniAdapter.generateStream({
      messages: [{ role: 'user', content: 'Count to 3' }]
    })) {
      if (chunk.done) {
        break
      }
      chunks.push(chunk.delta)
    }

    expect(chunks.length).toBeGreaterThan(0)
    const fullText = chunks.join('')
    expect(fullText).toBeTruthy()
  })

  it('should handle conversation context', async () => {
    if (await skipIfNoOllama()) return

    const messages = [
      { role: 'user', content: 'My name is Alice' },
    ]

    const result1 = await phi3MiniAdapter.generate({ messages })
    messages.push({ role: 'assistant', content: result1.reply })
    
    messages.push({ role: 'user', content: 'What is my name?' })
    const result2 = await phi3MiniAdapter.generate({ messages })

    expect(result2.reply.toLowerCase()).toContain('alice')
  })
})
```

---

## Best Practices

### 1. Use Pre-Built Adapters

```typescript
// ✅ GOOD: Use pre-built adapter
import { phi3MiniAdapter } from './adapters/ollama'

const result = await phi3MiniAdapter.generate({...})

// ❌ BAD: Create new adapter each time
import { createOllamaAdapter } from './adapters/ollama'

const adapter = createOllamaAdapter({
  id: 'phi3-mini',
  name: 'Phi-3 Mini',
  model: 'phi3:mini',
  contextWindow: 4096,
})  // Unnecessary!
```

### 2. Import from Index Module

```typescript
// ✅ GOOD: Import from module root
import { phi3MiniAdapter } from './adapters/ollama'

// ❌ BAD: Import from internal file
import { phi3MiniAdapter } from './adapters/ollama/adapters'
```

### 3. Use for Privacy-Sensitive Data

```typescript
// ✅ GOOD: Use local model for sensitive data
const adapter = privacySensitive 
  ? phi3MiniAdapter 
  : gpt41NanoAdapter

// ❌ BAD: Send patient data to cloud
const result = await gpt41NanoAdapter.generate({
  messages: [{ role: 'user', content: patientHealthRecord }]
})  // HIPAA violation!
```

### 4. Warm Up on App Start

```typescript
// ✅ GOOD: Warm up model
await phi3MiniAdapter.generate({
  messages: [{ role: 'user', content: 'ready' }],
  settings: { maxTokens: 1 }
})

// Now first real request is instant
```

### 5. Handle Errors Gracefully

```typescript
// ✅ GOOD: Specific error handling
try {
  const result = await phi3MiniAdapter.generate({...})
} catch (error) {
  if (error.message.includes('404')) {
    // Specific guidance
    showMessage('Please install model: ollama pull phi3:mini')
  }
}

// ❌ BAD: Generic error
try {
  const result = await phi3MiniAdapter.generate({...})
} catch (error) {
  console.error('Failed')  // No guidance for user
}
```

---

## Security Considerations

### 1. Data Privacy

**✅ Advantages**:
- All data processed locally
- No external API calls
- HIPAA compliant (if configured correctly)
- No data retention by third parties

**⚠️ Considerations**:
- Model weights stored on disk
- Conversation history in application memory
- Server logs may contain queries

### 2. Model Integrity

```typescript
// Verify model hash (optional)
async function verifyModel() {
  const response = await fetch('http://localhost:11434/api/show', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'phi3:mini' })
  })
  
  const data = await response.json()
  console.log('Model digest:', data.digest)
  // Compare with known-good hash
}
```

### 3. Network Isolation

```typescript
// Restrict Ollama to localhost only
const adapter = createOllamaAdapter({
  id: 'phi3-mini',
  name: 'Phi-3 Mini',
  model: 'phi3:mini',
  contextWindow: 4096,
  baseUrl: 'http://127.0.0.1:11434'  // Localhost only
})
```

---

## Summary

The **Ollama Adapters Module** provides ready-to-use local model instances:

**Core Exports**:
- **`phi3MiniAdapter`**: Pre-built Phi-3 Mini adapter (local, privacy-focused)
- **`ollamaAdapters`**: Collection of all Ollama adapters
- **`getOllamaAdapterIds()`**: Utility to list available adapters

**Phi-3 Mini Specifications**:
- **Model**: Microsoft Phi-3 Mini (3.8B parameters)
- **Type**: Local (offline capable)
- **Context**: 4,096 tokens
- **Speed**: 30-50 tokens/second (GPU)
- **Cost**: Free (local inference)
- **Privacy**: 100% local (no cloud)

**Features**:
- ✅ Non-streaming generation
- ✅ Streaming generation
- ✅ Conversation history
- ✅ Custom settings (temperature, maxTokens, topP, etc.)
- ❌ Function calling (not yet supported by Ollama)
- ❌ Token usage tracking (limitation of Ollama)

**Use Cases**:
- Privacy-sensitive eldercare data
- Offline operation (no internet)
- Cost-sensitive scenarios (high volume)
- Fast local inference

**Integration**:
- Used by `modelRegistry` for registration
- Called by `agentService` for generation
- Complements cloud models (hybrid strategy)

**Requirements**:
- Ollama installed and running
- Phi-3 model pulled (`ollama pull phi3:mini`)
- 8GB+ RAM recommended
- GPU for optimal performance

**Best Practices**:
- Use for privacy-sensitive data
- Warm up on app start
- Handle errors specifically
- Combine with cloud models (hybrid)

**Production Status**: Fully implemented with 1 model (Phi-3 Mini). Easy to add more Ollama models following the same pattern.
