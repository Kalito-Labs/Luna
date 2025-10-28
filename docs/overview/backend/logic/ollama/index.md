# Ollama Index Documentation

## Overview

The `index.ts` file serves as the **public API facade** for the Ollama adapter module, providing a clean, organized interface for importing Ollama-related functionality.

**Location**: `/backend/logic/adapters/ollama/index.ts`

**Primary Responsibilities**:
- Export factory function and types
- Export pre-built adapter instances
- Export utility functions
- Provide single import point for consumers
- Hide internal implementation details

**Design Pattern**: **Facade Pattern**
- Single entry point for module
- Organized exports by category
- Encapsulates internal structure
- Simplifies consumer imports

---

## Architecture Overview

### Module Structure

```
/backend/logic/adapters/ollama/
├── index.ts          ← Public API (YOU ARE HERE)
├── factory.ts        ← Factory function + types
└── adapters.ts       ← Pre-built instances + utilities
```

### Export Flow

```
Internal Modules
       ↓
index.ts (Facade)
       ↓
Public API
       ↓
External Consumers
```

### Comparison: Ollama vs OpenAI Index

```
┌──────────────────────────────────────────────────────┐
│              Module Index Patterns                   │
├──────────────────────────────────────────────────────┤
│                                                      │
│  OpenAI Index           Ollama Index                │
│  ├─ Factory exports     ├─ Factory exports          │
│  ├─ Model exports       │   (no separate models.ts) │
│  └─ Adapter exports     └─ Adapter exports          │
│                                                      │
│  5 files total          3 files total               │
│  (index, factory,       (index, factory,            │
│   types, models,        adapters)                   │
│   adapters)                                          │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Why Simpler?**
- Ollama models don't have pricing configs
- No separate types file (types in factory.ts)
- Simpler configuration (fewer options)
- Local models (no API key management)

---

## Exports

### Factory Exports

```typescript
export { createOllamaAdapter } from './factory'
export type { OllamaAdapterConfig } from './factory'
```

**Purpose**: Export factory function and configuration type.

**Exports**:
1. **`createOllamaAdapter`** (function)
   - Factory function for creating adapters
   - Type: `(config: OllamaAdapterConfig) => LLMAdapter`
   - Usage: Create custom adapter instances

2. **`OllamaAdapterConfig`** (type)
   - Configuration interface for factory
   - Properties: id, name, model, contextWindow, baseUrl?
   - Usage: Type-safe adapter creation

#### Factory Export Examples

**Example 1: Import Factory**
```typescript
import { createOllamaAdapter } from './adapters/ollama'

const adapter = createOllamaAdapter({
  id: 'custom-phi3',
  name: 'Custom Phi-3',
  model: 'phi3:mini',
  contextWindow: 4096,
})
```

**Example 2: Import Type**
```typescript
import type { OllamaAdapterConfig } from './adapters/ollama'

const config: OllamaAdapterConfig = {
  id: 'llama3',
  name: 'Llama 3',
  model: 'llama3',
  contextWindow: 8192,
}
```

**Example 3: Both Together**
```typescript
import { createOllamaAdapter, type OllamaAdapterConfig } from './adapters/ollama'

const configs: OllamaAdapterConfig[] = [
  { id: 'phi3-mini', name: 'Phi-3 Mini', model: 'phi3:mini', contextWindow: 4096 },
  { id: 'llama3', name: 'Llama 3', model: 'llama3', contextWindow: 8192 },
]

const adapters = configs.map(createOllamaAdapter)
```

---

### Adapter Exports

```typescript
export {
  phi3MiniAdapter,
  ollamaAdapters,
  getOllamaAdapterIds,
} from './adapters'
```

**Purpose**: Export pre-built adapter instances and utilities.

**Exports**:
1. **`phi3MiniAdapter`** (LLMAdapter instance)
   - Pre-built Phi-3 Mini adapter
   - Ready to use immediately
   - Type: `LLMAdapter`

2. **`ollamaAdapters`** (Record)
   - Collection of all Ollama adapters
   - Type: `Record<string, LLMAdapter>`
   - Usage: Iteration, lookup by ID

3. **`getOllamaAdapterIds`** (function)
   - Get list of all adapter IDs
   - Type: `() => string[]`
   - Usage: Dynamic model selection, validation

#### Adapter Export Examples

**Example 1: Import Pre-Built Adapter**
```typescript
import { phi3MiniAdapter } from './adapters/ollama'

const result = await phi3MiniAdapter.generate({
  messages: [{ role: 'user', content: 'Hello!' }]
})
```

**Example 2: Import Collection**
```typescript
import { ollamaAdapters } from './adapters/ollama'

// Lookup by ID
const adapter = ollamaAdapters['phi3-mini']

// Iterate all
for (const [id, adapter] of Object.entries(ollamaAdapters)) {
  console.log(`${id}: ${adapter.name}`)
}
```

**Example 3: Import Utility Function**
```typescript
import { getOllamaAdapterIds } from './adapters/ollama'

const ids = getOllamaAdapterIds()
console.log('Available models:', ids)
// ['phi3-mini']
```

**Example 4: Import All**
```typescript
import {
  phi3MiniAdapter,
  ollamaAdapters,
  getOllamaAdapterIds
} from './adapters/ollama'

// Use pre-built adapter
const result = await phi3MiniAdapter.generate({...})

// Or lookup from collection
const adapterId = 'phi3-mini'
const adapter = ollamaAdapters[adapterId]

// Or validate selection
const ids = getOllamaAdapterIds()
if (!ids.includes(userSelection)) {
  console.error('Invalid model')
}
```

---

## Complete Export Summary

### All Exports

```typescript
// Factory exports
export { createOllamaAdapter } from './factory'
export type { OllamaAdapterConfig } from './factory'

// Adapter exports
export {
  phi3MiniAdapter,
  ollamaAdapters,
  getOllamaAdapterIds,
} from './adapters'
```

**Total Exports**: 5
- 1 factory function
- 1 type
- 1 adapter instance
- 1 adapter collection
- 1 utility function

### Export Categories

| Category | Exports | Purpose |
|----------|---------|---------|
| **Factory** | `createOllamaAdapter`, `OllamaAdapterConfig` | Create custom adapters |
| **Instances** | `phi3MiniAdapter` | Use pre-built adapter |
| **Collections** | `ollamaAdapters` | Lookup/iterate adapters |
| **Utilities** | `getOllamaAdapterIds` | Helper functions |

---

## Import Patterns

### Pattern 1: Use Pre-Built Adapter (Most Common)

```typescript
import { phi3MiniAdapter } from './adapters/ollama'

const result = await phi3MiniAdapter.generate({
  messages: [{ role: 'user', content: 'What is eldercare?' }]
})
```

**When to use**: 
- Default use case
- Standard Phi-3 Mini setup
- No customization needed

### Pattern 2: Create Custom Adapter

```typescript
import { createOllamaAdapter } from './adapters/ollama'

const customAdapter = createOllamaAdapter({
  id: 'llama3',
  name: 'Llama 3',
  model: 'llama3',
  contextWindow: 8192,
})
```

**When to use**:
- Adding new models
- Custom configurations
- Testing different models

### Pattern 3: Dynamic Model Selection

```typescript
import { ollamaAdapters, getOllamaAdapterIds } from './adapters/ollama'

function selectModel(modelId: string): LLMAdapter | null {
  const validIds = getOllamaAdapterIds()
  
  if (!validIds.includes(modelId)) {
    console.error(`Invalid model. Choose from: ${validIds.join(', ')}`)
    return null
  }
  
  return ollamaAdapters[modelId]
}

const adapter = selectModel(userInput)
```

**When to use**:
- User-selectable models
- Configuration-driven selection
- Validation required

### Pattern 4: Type-Safe Configuration

```typescript
import { createOllamaAdapter, type OllamaAdapterConfig } from './adapters/ollama'

const configs: OllamaAdapterConfig[] = [
  { id: 'phi3-mini', name: 'Phi-3 Mini', model: 'phi3:mini', contextWindow: 4096 },
  { id: 'llama3', name: 'Llama 3', model: 'llama3', contextWindow: 8192 },
]

const adapters = configs.map(createOllamaAdapter)
```

**When to use**:
- Multiple adapter setup
- Configuration files
- Type safety required

### Pattern 5: Mixed Factory + Instance

```typescript
import { 
  phi3MiniAdapter,           // Pre-built
  createOllamaAdapter,       // Factory
  type OllamaAdapterConfig 
} from './adapters/ollama'

// Use pre-built for default
const defaultAdapter = phi3MiniAdapter

// Create custom for special case
const specialAdapter = createOllamaAdapter({
  id: 'phi3-custom',
  name: 'Phi-3 Custom',
  model: 'phi3:mini',
  contextWindow: 4096,
  baseUrl: 'http://gpu-server:11434',  // Remote Ollama
})
```

**When to use**:
- Hybrid setup (default + custom)
- Remote + local Ollama
- A/B testing

---

## Integration Examples

### Example 1: Model Registry Integration

```typescript
// In modelRegistry.ts
import { phi3MiniAdapter } from './adapters/ollama'

// Register local model
registerAdapter(phi3MiniAdapter, [
  'phi3-mini',  // Canonical ID
  'phi3',       // Alias
  'local-phi3', // Alternative
])

// Now available via registry
const adapter = getModelAdapter('phi3-mini')
```

### Example 2: Agent Service Integration

```typescript
// In agentService.ts
import { phi3MiniAdapter } from './adapters/ollama'
import { gpt41NanoAdapter } from './adapters/openai'

async function generateResponse(
  query: string,
  useLocal: boolean
): Promise<string> {
  const adapter = useLocal ? phi3MiniAdapter : gpt41NanoAdapter
  
  const result = await adapter.generate({
    messages: [{ role: 'user', content: query }]
  })
  
  return result.reply
}

// Privacy mode: use local
const reply = await generateResponse('Patient query', true)
```

### Example 3: Dynamic Model Loading

```typescript
// In config.ts
import { getOllamaAdapterIds, ollamaAdapters } from './adapters/ollama'

export function getAvailableLocalModels() {
  return getOllamaAdapterIds().map(id => ({
    id,
    name: ollamaAdapters[id].name,
    type: ollamaAdapters[id].type,
    contextWindow: ollamaAdapters[id].contextWindow,
  }))
}

// Returns:
// [
//   {
//     id: 'phi3-mini',
//     name: 'Phi-3 Mini',
//     type: 'local',
//     contextWindow: 4096
//   }
// ]
```

### Example 4: UI Model Selector

```typescript
// In frontend/composables/useModelSelector.ts
import { getOllamaAdapterIds, ollamaAdapters } from '../../backend/logic/adapters/ollama'

export function useLocalModels() {
  const modelIds = getOllamaAdapterIds()
  
  const modelOptions = modelIds.map(id => ({
    value: id,
    label: ollamaAdapters[id].name,
    context: ollamaAdapters[id].contextWindow,
  }))
  
  return {
    modelOptions,
    selectModel: (id: string) => ollamaAdapters[id]
  }
}
```

### Example 5: Test Suite Setup

```typescript
// In tests/setup.ts
import { 
  phi3MiniAdapter,
  ollamaAdapters,
  getOllamaAdapterIds 
} from '../logic/adapters/ollama'

export const testAdapters = {
  local: phi3MiniAdapter,
  allLocal: ollamaAdapters,
  localIds: getOllamaAdapterIds(),
}

// In tests
describe('Local Model Tests', () => {
  for (const id of testAdapters.localIds) {
    it(`${id} should generate`, async () => {
      const adapter = testAdapters.allLocal[id]
      const result = await adapter.generate({
        messages: [{ role: 'user', content: 'test' }]
      })
      expect(result.reply).toBeDefined()
    })
  }
})
```

---

## Facade Pattern Benefits

### 1. Single Import Point

**Without Facade** ❌:
```typescript
import { createOllamaAdapter } from './adapters/ollama/factory'
import { phi3MiniAdapter } from './adapters/ollama/adapters'
import type { OllamaAdapterConfig } from './adapters/ollama/factory'
```

**With Facade** ✅:
```typescript
import { 
  createOllamaAdapter,
  phi3MiniAdapter,
  type OllamaAdapterConfig
} from './adapters/ollama'
```

### 2. Internal Structure Hidden

```typescript
// Consumer doesn't need to know:
// - Which file contains createOllamaAdapter
// - Which file contains phi3MiniAdapter
// - Internal organization

// Just import from module root
import { phi3MiniAdapter } from './adapters/ollama'
```

### 3. Easy Refactoring

```typescript
// Can reorganize internal files without breaking consumers

// Before: factory.ts exports createOllamaAdapter
// After: Move to builder.ts
// Consumer imports unchanged!
```

### 4. Organized Exports

```typescript
// Logical grouping
// ├─ Factory (create adapters)
// ├─ Instances (pre-built)
// └─ Utilities (helpers)

// Clear, organized API
```

### 5. Version Control

```typescript
// Add new exports without breaking existing
export { 
  // v1.0
  phi3MiniAdapter,
  
  // v1.1 (new export)
  llama3Adapter,
} from './adapters'

// Existing code unchanged
```

---

## Module Comparison

### Ollama vs OpenAI Module

| Aspect | Ollama Module | OpenAI Module |
|--------|--------------|---------------|
| **Files** | 3 (index, factory, adapters) | 5 (index, factory, types, models, adapters) |
| **Factory Export** | createOllamaAdapter | createOpenAIAdapter |
| **Type Exports** | OllamaAdapterConfig | 8 types (ModelConfig, AdapterOptions, etc.) |
| **Model Config** | In factory.ts | Separate models.ts |
| **Adapter Count** | 1 (phi3MiniAdapter) | 1 (gpt41NanoAdapter) |
| **Utilities** | getOllamaAdapterIds() | getModelConfig(), getAllModelIds(), etc. |
| **Complexity** | Simple (local, no pricing) | Complex (cloud, pricing, models registry) |

### Why Simpler?

**Ollama module is simpler because**:
1. **No Pricing**: Local models are free
2. **No Model Registry**: Don't need separate models.ts
3. **Fewer Types**: Simpler configuration
4. **No Authentication**: No API key management
5. **Single Endpoint**: Just `/api/chat`

**OpenAI module is more complex because**:
1. **Pricing Configs**: Cost tracking per model
2. **Model Registry**: Multiple models with configs
3. **More Types**: Usage, results, streaming, settings
4. **Authentication**: API key handling
5. **Multiple Endpoints**: Chat, completions, etc.

---

## Best Practices

### 1. Import from Module Root

```typescript
// ✅ GOOD: Import from root
import { phi3MiniAdapter } from './adapters/ollama'

// ❌ BAD: Import from internal file
import { phi3MiniAdapter } from './adapters/ollama/adapters'
```

**Why**: Respects facade pattern, allows refactoring.

### 2. Use Pre-Built Adapters When Possible

```typescript
// ✅ GOOD: Use pre-built
import { phi3MiniAdapter } from './adapters/ollama'

const result = await phi3MiniAdapter.generate({...})

// ❌ BAD: Create unnecessarily
import { createOllamaAdapter } from './adapters/ollama'

const adapter = createOllamaAdapter({
  id: 'phi3-mini',
  name: 'Phi-3 Mini',
  model: 'phi3:mini',
  contextWindow: 4096,
})  // Same as pre-built!
```

**Why**: Pre-built adapters are singletons, more efficient.

### 3. Import Types Separately

```typescript
// ✅ GOOD: Separate type import
import { createOllamaAdapter, type OllamaAdapterConfig } from './adapters/ollama'

// ⚠️ ACCEPTABLE: Mixed import
import { createOllamaAdapter, OllamaAdapterConfig } from './adapters/ollama'
```

**Why**: `type` keyword clarifies it's a type, enables type-only imports.

### 4. Use Named Exports

```typescript
// ✅ GOOD: Named exports (what we have)
import { phi3MiniAdapter, ollamaAdapters } from './adapters/ollama'

// ❌ BAD: Default export
import ollamaModule from './adapters/ollama'
const adapter = ollamaModule.phi3MiniAdapter
```

**Why**: Named exports are more explicit, easier to tree-shake.

### 5. Group Related Imports

```typescript
// ✅ GOOD: Logical grouping
import { 
  // Factory
  createOllamaAdapter,
  type OllamaAdapterConfig,
  
  // Instances
  phi3MiniAdapter,
  ollamaAdapters,
  
  // Utilities
  getOllamaAdapterIds,
} from './adapters/ollama'

// ⚠️ ACCEPTABLE: Single line (if few imports)
import { phi3MiniAdapter, ollamaAdapters } from './adapters/ollama'
```

**Why**: More readable for larger imports.

---

## Testing the Facade

### Unit Tests

```typescript
import * as ollamaModule from './adapters/ollama'

describe('Ollama Module Exports', () => {
  it('should export factory function', () => {
    expect(typeof ollamaModule.createOllamaAdapter).toBe('function')
  })

  it('should export pre-built adapter', () => {
    expect(ollamaModule.phi3MiniAdapter).toBeDefined()
    expect(ollamaModule.phi3MiniAdapter.id).toBe('phi3-mini')
  })

  it('should export adapter collection', () => {
    expect(ollamaModule.ollamaAdapters).toBeDefined()
    expect(ollamaModule.ollamaAdapters['phi3-mini']).toBe(ollamaModule.phi3MiniAdapter)
  })

  it('should export utility function', () => {
    expect(typeof ollamaModule.getOllamaAdapterIds).toBe('function')
    expect(ollamaModule.getOllamaAdapterIds()).toContain('phi3-mini')
  })
})
```

### Type Tests

```typescript
import type { OllamaAdapterConfig } from './adapters/ollama'
import { createOllamaAdapter } from './adapters/ollama'

describe('Ollama Type Exports', () => {
  it('should export config type', () => {
    const config: OllamaAdapterConfig = {
      id: 'test',
      name: 'Test',
      model: 'test',
      contextWindow: 1000,
    }
    
    expect(config.id).toBe('test')
  })

  it('should create adapter from config', () => {
    const config: OllamaAdapterConfig = {
      id: 'test',
      name: 'Test',
      model: 'test',
      contextWindow: 1000,
    }
    
    const adapter = createOllamaAdapter(config)
    expect(adapter.id).toBe('test')
  })
})
```

---

## Migration Guide

### Adding New Models

**Step 1: Create adapter in adapters.ts**
```typescript
// In adapters.ts
export const llama3Adapter: LLMAdapter = createOllamaAdapter({
  id: 'llama3',
  name: 'Llama 3',
  model: 'llama3',
  contextWindow: 8192,
})

export const ollamaAdapters = {
  'phi3-mini': phi3MiniAdapter,
  'llama3': llama3Adapter,  // Add new adapter
} as const
```

**Step 2: Export in index.ts**
```typescript
// In index.ts
export {
  phi3MiniAdapter,
  llama3Adapter,  // Export new adapter
  ollamaAdapters,
  getOllamaAdapterIds,
} from './adapters'
```

**Step 3: Use new adapter**
```typescript
import { llama3Adapter } from './adapters/ollama'

const result = await llama3Adapter.generate({...})
```

### Adding New Utilities

**Step 1: Add function in adapters.ts**
```typescript
// In adapters.ts
export function getOllamaAdapterNames(): string[] {
  return Object.values(ollamaAdapters).map(a => a.name)
}
```

**Step 2: Export in index.ts**
```typescript
// In index.ts
export {
  phi3MiniAdapter,
  ollamaAdapters,
  getOllamaAdapterIds,
  getOllamaAdapterNames,  // Export new utility
} from './adapters'
```

**Step 3: Use new utility**
```typescript
import { getOllamaAdapterNames } from './adapters/ollama'

const names = getOllamaAdapterNames()
// ['Phi-3 Mini', 'Llama 3']
```

---

## Future Enhancements

### 1. More Adapters

```typescript
// Future: Multiple pre-built adapters
export {
  phi3MiniAdapter,
  phi3MediumAdapter,
  llama3Adapter,
  mistralAdapter,
  gemmaAdapter,
  ollamaAdapters,
  getOllamaAdapterIds,
} from './adapters'
```

### 2. Configuration Utilities

```typescript
// Future: Helper functions
export {
  // Existing
  phi3MiniAdapter,
  ollamaAdapters,
  getOllamaAdapterIds,
  
  // New utilities
  getAdapterByName,
  findAdapterByContextWindow,
  getRecommendedAdapter,
} from './adapters'
```

### 3. Health Check Utilities

```typescript
// Future: Ollama health checks
export {
  // Existing exports
  ...
  
  // New health functions
  checkOllamaHealth,
  isModelAvailable,
  getOllamaVersion,
} from './utils'
```

### 4. Model Management

```typescript
// Future: Model management
export {
  // Existing exports
  ...
  
  // New management functions
  pullModel,
  deleteModel,
  listInstalledModels,
} from './management'
```

---

## Summary

The **Ollama Index Module** provides a clean facade for the Ollama adapter system:

**Core Purpose**:
- Single entry point for Ollama adapters
- Organized exports by category
- Hides internal implementation
- Simplifies consumer imports

**Exports** (5 total):
1. **`createOllamaAdapter`** - Factory function
2. **`OllamaAdapterConfig`** - Configuration type
3. **`phi3MiniAdapter`** - Pre-built Phi-3 adapter
4. **`ollamaAdapters`** - Collection of adapters
5. **`getOllamaAdapterIds`** - Utility function

**Export Categories**:
- **Factory**: Create custom adapters
- **Instances**: Use pre-built adapters
- **Collections**: Lookup/iterate adapters
- **Utilities**: Helper functions

**Import Patterns**:
- Pre-built adapter (most common)
- Custom adapter creation
- Dynamic model selection
- Type-safe configuration

**Facade Benefits**:
- Single import point
- Internal structure hidden
- Easy refactoring
- Organized API
- Version control

**Best Practices**:
- Import from module root
- Use pre-built adapters
- Separate type imports
- Use named exports
- Group related imports

**Module Simplicity**:
- 3 files (vs 5 for OpenAI)
- No separate models registry
- No pricing configuration
- Simpler types
- Local-first design

**Integration**:
- Model registry registration
- Agent service usage
- Dynamic model loading
- UI model selection
- Test suite setup

**Production Status**: Clean, simple facade providing complete access to local Ollama model adapters with privacy-focused, offline-capable AI inference.
