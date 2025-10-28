# Models Router Documentation

## Overview

The `modelsRouter.ts` file provides endpoints for discovering and retrieving available AI models. It serves as the API gateway to the model registry, allowing the frontend to display model selection options and understand model capabilities.

**Location**: `/backend/routes/modelsRouter.ts`

**Mounted At**: `/api/models`

**Created**: August 24, 2025

**Purpose**:
- List all available AI models (cloud and local)
- Provide model metadata (name, type, context window, pricing)
- Enable dynamic model selection in the UI
- Support model registry lookups

**Key Features**:
- **Single Endpoint**: Simple GET endpoint for all models
- **Deduplication**: Handles model aliases (multiple names for same model)
- **Type Information**: Distinguishes cloud vs local models
- **Minimal Logic**: Delegates to `ModelRegistry` for business logic

---

## Architecture

### Dependencies

```typescript
import { Router } from 'express'
import { listModelAdapters } from '../logic/modelRegistry'
import { handleRouterError } from '../utils/routerHelpers'
```

**Key Dependencies**:
- **ModelRegistry**: Central registry of all model adapters (lives in `/logic/modelRegistry.ts`)
- **Router Helpers**: Standardized error handling

**Delegation Pattern**: Router is a thin wrapper around `ModelRegistry.listModelAdapters()`

### Model Registry Architecture

**Location**: `/backend/logic/modelRegistry.ts`

**Purpose**: 
- Central repository for all model adapters
- Supports canonical IDs and aliases
- Deduplicates adapter instances
- Provides sorted, deterministic model lists

**Current Models**:

| Model | Type | ID | Aliases | Context Window | Pricing |
|-------|------|-----|---------|----------------|---------|
| GPT-4.1 Nano | cloud | `gpt-4.1-nano` | `gpt-4.1-nano`, `gpt-4-nano` | 128,000 | $0.20/$0.80 per 1M tokens |
| Phi-3 Mini | local | `phi3-mini` | `phi3`, `phi-3` | 4,096 | Free (local) |

**Design Pattern**:
```typescript
// Registry stores adapters by lookup key
const modelRegistry: Record<string, LLMAdapter> = {}

// Aliases point to same adapter instance
registerAdapter(gpt41NanoAdapter, ['gpt-4.1-nano', 'gpt-4-nano'])
// Both 'gpt-4.1-nano' and 'gpt-4-nano' resolve to same adapter object
```

---

## Model Adapter Interface

### LLMAdapter Type

**Location**: `/backend/types/models.ts`

```typescript
interface LLMAdapter {
  id: string                    // Canonical model ID
  name: string                  // Display name
  type: 'cloud' | 'local'       // Deployment type
  contextWindow?: number        // Max tokens in context
  pricing?: string              // Cost information
  info?: string                 // Additional details
  
  // Classic (non-streaming) generation
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
  
  // Optional streaming generation
  generateStream?(args: {
    messages: { role: string; content: string }[]
    settings?: Record<string, unknown>
    fileIds?: string[]
  }): AsyncGenerator<{
    delta: string
    done?: boolean
    tokenUsage?: number
  }>
}
```

**Field Explanations**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Canonical model identifier (e.g., 'gpt-4.1-nano') |
| `name` | string | Yes | Human-readable name (e.g., 'GPT-4.1 Nano') |
| `type` | 'cloud' \| 'local' | Yes | Cloud (API) or local (Ollama) |
| `contextWindow` | number | No | Maximum context size in tokens |
| `pricing` | string | No | Cost description (cloud models only) |
| `info` | string | No | Additional information |
| `generate` | function | Yes | Non-streaming text generation |
| `generateStream` | function | No | Streaming text generation |

---

## Endpoints

### GET /api/models

**Purpose**: Get list of all available AI models with metadata.

#### Path Parameters

None.

#### Query Parameters

None.

#### Implementation

```typescript
router.get('/', (req, res) => {
  try {
    const adapters = listModelAdapters()
    
    // Deduplicate by adapter instance (aliases point to same adapter object)
    const uniqueAdapters = Array.from(new Set(adapters))
    
    const models = uniqueAdapters.map(adapter => ({
      key: adapter.id,   // Frontend expects 'key' property
      id: adapter.id,    // Keep 'id' for backward compatibility
      name: adapter.name,
      type: adapter.type,
    }))

    res.json({
      success: true,
      models,
    })
  } catch (error) {
    return handleRouterError(res, error, 'fetch available models')
  }
})
```

**Deduplication Logic**:
1. `listModelAdapters()` returns unique adapters (no alias duplicates)
2. Convert to Set for extra safety (redundant but harmless)
3. Map to response format with both `key` and `id` fields

**Why Both `key` and `id`?**
- `key`: Frontend components (Select, Dropdown) expect this property
- `id`: Backward compatibility with existing API consumers

#### Response Format (Success)

```typescript
{
  success: true,
  models: [
    {
      key: "gpt-4.1-nano",
      id: "gpt-4.1-nano",
      name: "GPT-4.1 Nano",
      type: "cloud"
    },
    {
      key: "phi3-mini",
      id: "phi3-mini",
      name: "Phi-3 Mini",
      type: "local"
    }
  ]
}
```

**Response Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Always `true` (errors throw exceptions) |
| `models` | array | List of available models |
| `models[].key` | string | Model identifier (for UI components) |
| `models[].id` | string | Model identifier (same as key) |
| `models[].name` | string | Display name |
| `models[].type` | string | 'cloud' or 'local' |

**Sorting**: Models are sorted by:
1. Type (cloud before local, alphabetically)
2. Name (alphabetically)
3. ID (alphabetically, as tiebreaker)

#### Response Format (Error)

```typescript
{
  success: false,
  error: {
    code: "INTERNAL_ERROR",
    message: "Failed to fetch available models",
    details: "Error details here"
  }
}
```

#### Example Requests

```typescript
// Fetch all models
const response = await fetch('/api/models')
const data = await response.json()

console.log(`Found ${data.models.length} models:`)
data.models.forEach(model => {
  console.log(`- ${model.name} (${model.type})`)
})

// Output:
// Found 2 models:
// - GPT-4.1 Nano (cloud)
// - Phi-3 Mini (local)
```

```typescript
// Use in model selector
async function loadModelOptions() {
  const response = await fetch('/api/models')
  const data = await response.json()
  
  // Group by type
  const cloudModels = data.models.filter(m => m.type === 'cloud')
  const localModels = data.models.filter(m => m.type === 'local')
  
  console.log('Cloud Models:', cloudModels.map(m => m.name))
  console.log('Local Models:', localModels.map(m => m.name))
}
```

**HTTP Status Codes**:
- `200 OK`: Models retrieved successfully
- `500 Internal Server Error`: Registry failure

---

## Model Registry Details

### Registration Process

**Location**: `/backend/logic/modelRegistry.ts`

**How Models Are Registered**:

```typescript
// 1. Import adapters
import { gpt41NanoAdapter } from './adapters/openai'
import { phi3MiniAdapter } from './adapters/ollama'

// 2. Register with canonical ID and aliases
registerAdapter(gpt41NanoAdapter, [
  'gpt-4.1-nano',  // exact match
  'gpt-4-nano',    // short alias
])

registerAdapter(phi3MiniAdapter, [
  'phi3',     // short alias
  'phi-3',    // alternative format
])

// 3. All keys point to same adapter instance
modelRegistry['gpt-4.1-nano'] === modelRegistry['gpt-4-nano']  // true
```

**Benefits**:
- Multiple names for same model (user convenience)
- Single adapter instance (memory efficient)
- Easy model lookup by any alias

### Lookup Methods

**Get Specific Model**:
```typescript
import { getModelAdapter } from '../logic/modelRegistry'

// All resolve to same adapter
const adapter1 = getModelAdapter('gpt-4.1-nano')
const adapter2 = getModelAdapter('gpt-4-nano')
adapter1 === adapter2  // true

// Supports local models too
const phi3 = getModelAdapter('phi3')      // Works
const phi3Alt = getModelAdapter('phi-3')  // Also works
phi3 === phi3Alt  // true
```

**List All Models**:
```typescript
import { listModelAdapters } from '../logic/modelRegistry'

const adapters = listModelAdapters()
// Returns unique adapters only (no duplicates from aliases)
// Sorted deterministically (type → name → id)

adapters.forEach(adapter => {
  console.log(`${adapter.id}: ${adapter.name} (${adapter.type})`)
})
```

### Adapter Implementations

**OpenAI Adapter**:
- Location: `/backend/logic/adapters/openai/adapters.ts`
- Factory-created: Uses `createOpenAIAdapter()` factory
- Configuration: Defined in `/backend/logic/adapters/openai/models.ts`
- Current Model: GPT-4.1 Nano only

**Ollama Adapter**:
- Location: `/backend/logic/adapters/ollama/adapters.ts`
- Factory-created: Uses `createOllamaAdapter()` factory
- Configuration: Direct in adapter definition
- Current Model: Phi-3 Mini only

---

## Usage Examples

### Model Selection Dropdown

```typescript
async function buildModelSelector() {
  const response = await fetch('/api/models')
  const data = await response.json()
  
  const select = document.createElement('select')
  
  // Group by type
  const cloudGroup = document.createElement('optgroup')
  cloudGroup.label = '☁️ Cloud Models'
  
  const localGroup = document.createElement('optgroup')
  localGroup.label = '💻 Local Models'
  
  data.models.forEach(model => {
    const option = document.createElement('option')
    option.value = model.key
    option.textContent = model.name
    
    if (model.type === 'cloud') {
      cloudGroup.appendChild(option)
    } else {
      localGroup.appendChild(option)
    }
  })
  
  select.appendChild(cloudGroup)
  select.appendChild(localGroup)
  
  return select
}
```

### Check Model Availability

```typescript
async function isModelAvailable(modelId: string): Promise<boolean> {
  const response = await fetch('/api/models')
  const data = await response.json()
  
  return data.models.some(model => model.key === modelId)
}

// Usage
if (await isModelAvailable('gpt-4.1-nano')) {
  console.log('GPT-4.1 Nano is available')
}
```

### Get Model Type

```typescript
async function getModelType(modelId: string): Promise<'cloud' | 'local' | null> {
  const response = await fetch('/api/models')
  const data = await response.json()
  
  const model = data.models.find(m => m.key === modelId)
  return model?.type || null
}

// Usage
const type = await getModelType('phi3-mini')
console.log(`Phi-3 Mini is a ${type} model`)  // "local"
```

### Display Model Count

```typescript
async function displayModelStats() {
  const response = await fetch('/api/models')
  const data = await response.json()
  
  const cloudCount = data.models.filter(m => m.type === 'cloud').length
  const localCount = data.models.filter(m => m.type === 'local').length
  
  console.log(`Available Models:`)
  console.log(`- ${cloudCount} cloud model(s)`)
  console.log(`- ${localCount} local model(s)`)
  console.log(`- ${data.models.length} total`)
}
```

---

## Best Practices

### 1. Use Model Keys Consistently

```typescript
// ✅ GOOD: Use canonical IDs from API
const models = await fetch('/api/models').then(r => r.json())
const modelId = models.models[0].key  // Use 'key' property

// Save to session
await fetch('/api/sessions', {
  method: 'POST',
  body: JSON.stringify({ model_id: modelId })
})

// ❌ BAD: Hardcode model IDs (breaks if IDs change)
const modelId = 'gpt-4.1-nano'  // Fragile
```

### 2. Handle Missing Models Gracefully

```typescript
// ✅ GOOD: Validate model exists
async function createSession(modelId: string) {
  const available = await fetch('/api/models').then(r => r.json())
  
  if (!available.models.some(m => m.key === modelId)) {
    console.warn(`Model ${modelId} not available, using default`)
    modelId = available.models[0].key  // Fallback to first model
  }
  
  return fetch('/api/sessions', {
    method: 'POST',
    body: JSON.stringify({ model_id: modelId })
  })
}

// ❌ BAD: Assume model exists
async function createSession(modelId: string) {
  return fetch('/api/sessions', {
    method: 'POST',
    body: JSON.stringify({ model_id: modelId })
  })
  // Fails if model doesn't exist
}
```

### 3. Group Models by Type in UI

```typescript
// ✅ GOOD: Organize by cloud/local
const models = await fetch('/api/models').then(r => r.json())

const grouped = {
  cloud: models.models.filter(m => m.type === 'cloud'),
  local: models.models.filter(m => m.type === 'local')
}

// Display in separate sections
console.log('Cloud Models:')
grouped.cloud.forEach(m => console.log(`  - ${m.name}`))

console.log('Local Models:')
grouped.local.forEach(m => console.log(`  - ${m.name}`))

// ❌ AVOID: Flat list (confusing for users)
models.models.forEach(m => console.log(m.name))
```

### 4. Cache Model List

```typescript
// ✅ GOOD: Cache model list (rarely changes)
class ModelCache {
  private cache: any = null
  private timestamp: number = 0
  private readonly TTL = 5 * 60 * 1000  // 5 minutes
  
  async getModels() {
    const now = Date.now()
    
    if (!this.cache || now - this.timestamp > this.TTL) {
      const response = await fetch('/api/models')
      this.cache = await response.json()
      this.timestamp = now
    }
    
    return this.cache
  }
}

const modelCache = new ModelCache()

// Fast subsequent calls
const models1 = await modelCache.getModels()  // API call
const models2 = await modelCache.getModels()  // Cached
const models3 = await modelCache.getModels()  // Cached

// ⚠️ OKAY BUT WASTEFUL: Fetch every time
const models = await fetch('/api/models').then(r => r.json())
```

---

## Frontend Integration

### Vue Model Selector Component

```vue
<template>
  <div class="model-selector">
    <label for="model-select">AI Model</label>
    <select 
      id="model-select" 
      v-model="selectedModel"
      @change="$emit('modelChanged', selectedModel)"
    >
      <optgroup label="☁️ Cloud Models">
        <option 
          v-for="model in cloudModels" 
          :key="model.key"
          :value="model.key"
        >
          {{ model.name }}
        </option>
      </optgroup>
      
      <optgroup label="💻 Local Models">
        <option 
          v-for="model in localModels" 
          :key="model.key"
          :value="model.key"
        >
          {{ model.name }}
        </option>
      </optgroup>
    </select>
    
    <p class="model-info" v-if="selectedModelInfo">
      Type: {{ selectedModelInfo.type }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const emit = defineEmits<{
  modelChanged: [modelId: string]
}>()

interface Model {
  key: string
  id: string
  name: string
  type: 'cloud' | 'local'
}

const models = ref<Model[]>([])
const selectedModel = ref<string>('')

const cloudModels = computed(() => 
  models.value.filter(m => m.type === 'cloud')
)

const localModels = computed(() => 
  models.value.filter(m => m.type === 'local')
)

const selectedModelInfo = computed(() => 
  models.value.find(m => m.key === selectedModel.value)
)

async function loadModels() {
  const response = await fetch('/api/models')
  const data = await response.json()
  
  if (data.success) {
    models.value = data.models
    
    // Default to first model
    if (data.models.length > 0) {
      selectedModel.value = data.models[0].key
    }
  }
}

onMounted(loadModels)
</script>

<style scoped>
.model-selector {
  margin-bottom: 1rem;
}

select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.model-info {
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #666;
}
</style>
```

### Model Badge Component

```vue
<template>
  <span :class="['model-badge', `model-${model?.type}`]">
    <span class="icon">{{ typeIcon }}</span>
    <span class="name">{{ model?.name || 'Unknown' }}</span>
  </span>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const props = defineProps<{
  modelId: string
}>()

const model = ref<any>(null)

const typeIcon = computed(() => {
  if (model.value?.type === 'cloud') return '☁️'
  if (model.value?.type === 'local') return '💻'
  return '🤖'
})

async function loadModelInfo() {
  const response = await fetch('/api/models')
  const data = await response.json()
  
  model.value = data.models.find((m: any) => m.key === props.modelId)
}

onMounted(loadModelInfo)
</script>

<style scoped>
.model-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 500;
}

.model-cloud {
  background: #e3f2fd;
  color: #1976d2;
}

.model-local {
  background: #f3e5f5;
  color: #7b1fa2;
}
</style>
```

### React Model Selector Hook

```typescript
// useModels.ts
import { useState, useEffect } from 'react'

interface Model {
  key: string
  id: string
  name: string
  type: 'cloud' | 'local'
}

export function useModels() {
  const [models, setModels] = useState<Model[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  useEffect(() => {
    async function fetchModels() {
      try {
        const response = await fetch('/api/models')
        const data = await response.json()
        
        if (data.success) {
          setModels(data.models)
        } else {
          throw new Error('Failed to load models')
        }
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchModels()
  }, [])
  
  const cloudModels = models.filter(m => m.type === 'cloud')
  const localModels = models.filter(m => m.type === 'local')
  
  const getModel = (modelId: string) => 
    models.find(m => m.key === modelId)
  
  return {
    models,
    cloudModels,
    localModels,
    loading,
    error,
    getModel
  }
}

// Usage
function ModelSelector() {
  const { cloudModels, localModels, loading } = useModels()
  const [selected, setSelected] = useState('')
  
  if (loading) return <div>Loading models...</div>
  
  return (
    <select value={selected} onChange={e => setSelected(e.target.value)}>
      <optgroup label="Cloud Models">
        {cloudModels.map(m => (
          <option key={m.key} value={m.key}>{m.name}</option>
        ))}
      </optgroup>
      <optgroup label="Local Models">
        {localModels.map(m => (
          <option key={m.key} value={m.key}>{m.name}</option>
        ))}
      </optgroup>
    </select>
  )
}
```

---

## Performance Considerations

### 1. Minimal Processing

**Current Implementation**: O(n) complexity
```typescript
const adapters = listModelAdapters()  // Already deduplicated and sorted
const uniqueAdapters = Array.from(new Set(adapters))  // O(n) - redundant but safe
const models = uniqueAdapters.map(...)  // O(n) - simple mapping
```

**Performance**: Sub-millisecond for typical registry (< 10 models)

### 2. No Database Access

**Benefit**: Instant response (no I/O wait)
```typescript
// Fast - in-memory registry
const adapters = listModelAdapters()

// Slow - database query (not used)
const models = db.prepare('SELECT * FROM models').all()
```

### 3. Caching Recommendation

**Server-Side**: Registry is already in-memory (no need to cache)

**Client-Side**: Cache API responses
```typescript
// Cache for 5 minutes (models rarely change)
const CACHE_TTL = 5 * 60 * 1000

let cachedModels: any = null
let cacheTime = 0

async function getModels() {
  const now = Date.now()
  
  if (!cachedModels || now - cacheTime > CACHE_TTL) {
    const response = await fetch('/api/models')
    cachedModels = await response.json()
    cacheTime = now
  }
  
  return cachedModels
}
```

---

## Security Considerations

### 1. No Sensitive Data Exposure

**Safe**: Only exposes public model metadata
```typescript
{
  key: "gpt-4.1-nano",
  id: "gpt-4.1-nano",
  name: "GPT-4.1 Nano",
  type: "cloud"
}
```

**Not Exposed**: API keys, endpoints, credentials

### 2. Read-Only Endpoint

**Status**: ✅ Safe (GET only, no mutations)

**No Risk of**:
- Data modification
- Privilege escalation
- Resource exhaustion

### 3. Input Validation

**Current State**: No input validation needed (no parameters)

**Note**: Future endpoints that accept model IDs should validate against registry:
```typescript
// Good practice for future endpoints
function validateModelId(modelId: string): boolean {
  const adapter = getModelAdapter(modelId)
  return adapter !== undefined
}
```

---

## Testing Considerations

### Unit Test Scenarios

```typescript
import request from 'supertest'
import app from '../server'

describe('Models Router', () => {
  describe('GET /api/models', () => {
    it('should return list of models', async () => {
      const response = await request(app).get('/api/models')
      
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(Array.isArray(response.body.models)).toBe(true)
    })
    
    it('should return models with required fields', async () => {
      const response = await request(app).get('/api/models')
      
      response.body.models.forEach((model: any) => {
        expect(model).toHaveProperty('key')
        expect(model).toHaveProperty('id')
        expect(model).toHaveProperty('name')
        expect(model).toHaveProperty('type')
        expect(['cloud', 'local']).toContain(model.type)
      })
    })
    
    it('should include GPT-4.1 Nano', async () => {
      const response = await request(app).get('/api/models')
      
      const gpt41 = response.body.models.find(
        (m: any) => m.key === 'gpt-4.1-nano'
      )
      
      expect(gpt41).toBeDefined()
      expect(gpt41.name).toBe('GPT-4.1 Nano')
      expect(gpt41.type).toBe('cloud')
    })
    
    it('should include Phi-3 Mini', async () => {
      const response = await request(app).get('/api/models')
      
      const phi3 = response.body.models.find(
        (m: any) => m.key === 'phi3-mini'
      )
      
      expect(phi3).toBeDefined()
      expect(phi3.name).toBe('Phi-3 Mini')
      expect(phi3.type).toBe('local')
    })
    
    it('should not have duplicate models', async () => {
      const response = await request(app).get('/api/models')
      
      const ids = response.body.models.map((m: any) => m.key)
      const uniqueIds = new Set(ids)
      
      expect(ids.length).toBe(uniqueIds.size)
    })
    
    it('should have key and id matching', async () => {
      const response = await request(app).get('/api/models')
      
      response.body.models.forEach((model: any) => {
        expect(model.key).toBe(model.id)
      })
    })
    
    it('should sort models deterministically', async () => {
      const response1 = await request(app).get('/api/models')
      const response2 = await request(app).get('/api/models')
      
      const ids1 = response1.body.models.map((m: any) => m.key)
      const ids2 = response2.body.models.map((m: any) => m.key)
      
      expect(ids1).toEqual(ids2)
    })
  })
})
```

### Integration Test Scenarios

```typescript
describe('Models Integration', () => {
  it('should work with session creation', async () => {
    // 1. Get available models
    const modelsRes = await request(app).get('/api/models')
    const modelId = modelsRes.body.models[0].key
    
    // 2. Create session with model
    const sessionRes = await request(app)
      .post('/api/sessions')
      .send({
        name: 'Test Session',
        model_id: modelId
      })
    
    expect(sessionRes.status).toBe(201)
    expect(sessionRes.body.data.model_id).toBe(modelId)
  })
  
  it('should support model lookup by alias', async () => {
    // Registry should resolve aliases
    const adapter1 = getModelAdapter('gpt-4.1-nano')
    const adapter2 = getModelAdapter('gpt-4-nano')
    
    expect(adapter1).toBe(adapter2)
  })
})
```

---

## Adding New Models

### Step-by-Step Guide

**1. Create Adapter** (in appropriate adapter directory):

```typescript
// backend/logic/adapters/openai/adapters.ts

export const gpt4MiniAdapter: LLMAdapter = createOpenAIAdapter({
  id: 'gpt-4-mini',
  config: OPENAI_MODELS['gpt-4-mini'],
})
```

**2. Add Model Configuration**:

```typescript
// backend/logic/adapters/openai/models.ts

export const OPENAI_MODELS: Record<string, OpenAIModelConfig> = {
  'gpt-4-mini': {
    model: 'gpt-4-mini',
    name: 'GPT-4 Mini',
    contextWindow: 128000,
    defaultMaxTokens: 1024,
    defaultTemperature: 0.7,
    pricing: {
      input: 0.15,
      output: 0.60,
    },
  },
  // ... existing models
}
```

**3. Register in Model Registry**:

```typescript
// backend/logic/modelRegistry.ts

import { gpt4MiniAdapter } from './adapters/openai'

registerAdapter(gpt4MiniAdapter, [
  'gpt-4-mini',     // canonical
  'gpt4-mini',      // alias
  'mini',           // short alias
])
```

**4. Verify Registration**:

```typescript
// Test
const adapter = getModelAdapter('gpt-4-mini')
console.log(adapter.name)  // "GPT-4 Mini"

const models = listModelAdapters()
console.log(models.map(m => m.name))  // Includes "GPT-4 Mini"
```

**5. Test API Endpoint**:

```bash
curl http://localhost:3000/api/models

# Should include:
# {
#   "key": "gpt-4-mini",
#   "id": "gpt-4-mini",
#   "name": "GPT-4 Mini",
#   "type": "cloud"
# }
```

---

## Summary

The **Models Router** provides a simple API for discovering available AI models:

**Endpoint**:
- **GET /api/models** - List all available models

**Key Features**:
- Single endpoint (minimal API surface)
- Automatic deduplication (handles aliases)
- Type information (cloud vs local)
- Sorted, deterministic output
- Instant response (in-memory registry)

**Current Models**:
- **GPT-4.1 Nano** (cloud): Primary model, 128K context, excellent reasoning
- **Phi-3 Mini** (local): Fast local inference, 4K context, factual queries

**Architecture**:
- Thin router layer (delegates to ModelRegistry)
- Adapter pattern (uniform interface for all models)
- Factory pattern (consistent adapter creation)
- Alias support (multiple names → same adapter)

**Use Cases**:
- Populate model selection dropdowns
- Validate model availability
- Display model type badges
- Group models by deployment type
- Cache model metadata

**Integration**:
Call `/api/models` once on app load, cache results, and use for all model-related UI components. The registry ensures consistent, deduplicated model information across the application.
