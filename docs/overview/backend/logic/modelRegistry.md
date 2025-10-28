# Model Registry Documentation

## Overview

The `modelRegistry.ts` file implements a **centralized model adapter registry** for managing all AI model adapters (OpenAI, Ollama) with support for aliases and unified lookups.

**Location**: `/backend/logic/modelRegistry.ts`

**Primary Responsibilities**:
- Register all available model adapters (OpenAI, Ollama)
- Provide unified adapter lookup by ID or alias
- List all unique registered adapters
- Support multiple aliases per adapter
- Maintain adapter singleton instances

**Key Design Pattern**: **Registry Pattern**
- Single source of truth for all model adapters
- Alias resolution (multiple names → one adapter)
- Deduplication when listing adapters

**Integration Points**: 
- Called by `agentService` to get model adapters
- Called by `memoryManager` to check model type
- Called by `modelsRouter` to list available models

---

## Architecture Overview

### Registry Pattern

```
User Request: "gpt-4.1-nano"
       ↓
modelRegistry lookup
       ↓
┌──────────────────────────────────────┐
│   Model Registry (Object)            │
├──────────────────────────────────────┤
│  "gpt-4.1-nano" → gpt41NanoAdapter   │ ← Canonical ID
│  "gpt-4-nano"   → gpt41NanoAdapter   │ ← Alias
│  "phi3"         → phi3MiniAdapter    │ ← Alias
│  "phi-3"        → phi3MiniAdapter    │ ← Alias
└──────────────────────────────────────┘
       ↓
Return: gpt41NanoAdapter instance
       ↓
agentService.runAgent()
```

### Component Dependencies

```typescript
import type { LLMAdapter } from '../types/models'

// Cloud adapters
import { 
  gpt41NanoAdapter,
} from './adapters/openai'

// Local adapters
import {
  phi3MiniAdapter,
} from './adapters/ollama'
```

**Adapter Sources**:
- `./adapters/openai` - Cloud model adapters (OpenAI API)
- `./adapters/ollama` - Local model adapters (Ollama)

---

## Core Data Structure

### Model Registry Object

```typescript
const modelRegistry: Record<string, LLMAdapter> = Object.create(null)
```

**Type**: Plain object with null prototype (no inherited properties).

**Structure**:
```typescript
{
  // Canonical IDs
  "gpt-4.1-nano": gpt41NanoAdapter,
  "phi3": phi3MiniAdapter,
  
  // Aliases (point to same instances)
  "gpt-4-nano": gpt41NanoAdapter,
  "phi-3": phi3MiniAdapter,
}
```

**Why `Object.create(null)`?**
- No prototype pollution
- No inherited properties (toString, hasOwnProperty, etc.)
- Pure key-value storage
- Faster lookups (no prototype chain)

### LLMAdapter Interface

```typescript
interface LLMAdapter {
  id: string              // Canonical unique identifier
  name: string            // Display name
  type: 'cloud' | 'local' // Adapter type
  
  // Core methods
  generate(params: GenerateParams): Promise<GenerateResult>
  generateStream?(params: GenerateParams): AsyncGenerator<StreamChunk>
  
  // Optional capabilities
  supportsStreaming?: boolean
  supportsTools?: boolean
}
```

**Key Fields**:
- `id` - Unique canonical identifier (e.g., "gpt-4.1-nano")
- `type` - Determines privacy, tool support, offline capability
- `generate` - Core completion method (always present)
- `generateStream` - Streaming method (optional)

---

## Registration System

### registerAdapter

```typescript
function registerAdapter(adapter: LLMAdapter, aliases: string[] = []) {
  // Canonical
  modelRegistry[adapter.id] = adapter
  
  // Aliases
  for (const alias of aliases) {
    if (!alias) continue
    modelRegistry[alias] = adapter
  }
}
```

**Purpose**: Register adapter under canonical ID + all aliases.

**Parameters**:
- `adapter` - The adapter instance to register
- `aliases` - Array of alternative names/IDs

**Behavior**:
1. Register under canonical `adapter.id`
2. Register under each alias
3. All entries point to same adapter instance

**Example**:
```typescript
registerAdapter(gpt41NanoAdapter, ['gpt-4.1-nano', 'gpt-4-nano'])

// Results in:
modelRegistry['gpt-4.1-nano'] = gpt41NanoAdapter // Canonical
modelRegistry['gpt-4-nano']   = gpt41NanoAdapter // Alias
```

### Registered Adapters

#### Cloud Models (OpenAI)

```typescript
// Cloud model - GPT-4.1 Nano (sole cloud model, excellent context understanding)
registerAdapter(gpt41NanoAdapter, [
  'gpt-4.1-nano', // exact match
  'gpt-4-nano',   // short alias
])
```

**Adapter Details**:
- **Canonical ID**: `gpt-4.1-nano`
- **Type**: `cloud` (OpenAI API)
- **Aliases**: `gpt-4-nano`
- **Use Case**: Primary cloud model for tool calling, summarization
- **Capabilities**: Function calling, streaming, high context understanding

**Lookup Examples**:
```typescript
getModelAdapter('gpt-4.1-nano') // ✅ Returns gpt41NanoAdapter
getModelAdapter('gpt-4-nano')   // ✅ Returns gpt41NanoAdapter (alias)
getModelAdapter('gpt4nano')     // ❌ Returns undefined (not registered)
```

#### Local Models (Ollama)

```typescript
// Local model - Phi3 Mini (fast local inference)
registerAdapter(phi3MiniAdapter, [
  'phi3',      // short alias
  'phi-3',     // alternative format
])
```

**Adapter Details**:
- **Canonical ID**: `phi3`
- **Type**: `local` (Ollama)
- **Aliases**: `phi-3`
- **Use Case**: Offline conversations, privacy-sensitive tasks
- **Capabilities**: Local inference, no internet required

**Lookup Examples**:
```typescript
getModelAdapter('phi3')   // ✅ Returns phi3MiniAdapter
getModelAdapter('phi-3')  // ✅ Returns phi3MiniAdapter (alias)
getModelAdapter('phi3:latest') // ❌ Returns undefined (Ollama tag notation not supported)
```

---

## Public API Methods

### getModelAdapter

```typescript
export function getModelAdapter(id: string): LLMAdapter | undefined
```

**Purpose**: Retrieve adapter by ID or alias.

**Parameters**:
- `id` - Model identifier (canonical ID or alias)

**Return Value**:
- `LLMAdapter` instance if found
- `undefined` if not registered

#### Implementation

```typescript
export function getModelAdapter(id: string): LLMAdapter | undefined {
  if (!id) return undefined
  const key = typeof id === 'string' ? id.trim() : id
  return modelRegistry[key]
}
```

**Safety Features**:
- Null/undefined check
- String trimming (handles whitespace)
- Type guard (typeof check)

#### Usage Examples

**Valid Lookups**:
```typescript
// Canonical ID
const adapter1 = getModelAdapter('gpt-4.1-nano')
console.log(adapter1?.name) // "GPT-4.1 Nano"

// Alias
const adapter2 = getModelAdapter('gpt-4-nano')
console.log(adapter2?.id)   // "gpt-4.1-nano"

// Same instance
console.log(adapter1 === adapter2) // true ✅
```

**Invalid Lookups**:
```typescript
getModelAdapter('')           // undefined (empty string)
getModelAdapter(null)         // undefined (null)
getModelAdapter('unknown')    // undefined (not registered)
getModelAdapter('GPT-4-NANO') // undefined (case-sensitive!)
```

**Case Sensitivity**:
```typescript
// ❌ Registry is case-sensitive
getModelAdapter('GPT-4.1-NANO') // undefined
getModelAdapter('gpt-4.1-nano') // gpt41NanoAdapter ✅

// ⚠️ Always use exact case
```

#### Integration Example

**In agentService.ts**:
```typescript
import { getModelAdapter } from './modelRegistry'

export async function runAgent(payload: RunAgentParams) {
  const { modelName } = payload
  
  const adapter = getModelAdapter(modelName)
  if (!adapter) {
    throw new Error(`Adapter for model "${modelName}" not found.`)
  }
  
  // Use adapter
  const result = await adapter.generate({ messages, settings })
  return result
}
```

---

### listModelAdapters

```typescript
export function listModelAdapters(): LLMAdapter[]
```

**Purpose**: List all unique registered adapters (deduplicated, sorted).

**Return Value**: Array of unique `LLMAdapter` instances.

#### Implementation

**Step 1: Deduplicate by Canonical ID**

```typescript
const seen = new Set<string>()
const unique: LLMAdapter[] = []

for (const adapter of Object.values(modelRegistry)) {
  if (!adapter?.id) continue     // Skip invalid entries
  if (seen.has(adapter.id)) continue // Skip duplicates (aliases)
  seen.add(adapter.id)
  unique.push(adapter)
}
```

**Why Deduplication?**
- Registry contains aliases (multiple keys → same adapter)
- Want to list each model once (not once per alias)

**Example**:
```typescript
// Registry contains:
{
  'gpt-4.1-nano': gpt41NanoAdapter,
  'gpt-4-nano': gpt41NanoAdapter,    // Same instance
  'phi3': phi3MiniAdapter,
  'phi-3': phi3MiniAdapter,          // Same instance
}

// After deduplication:
[gpt41NanoAdapter, phi3MiniAdapter] // Only 2 unique adapters
```

**Step 2: Sort for Deterministic Ordering**

```typescript
// Ensure stable, deterministic ordering in APIs/UI
unique.sort((a, b) => {
  const ta = a.type || ''
  const tb = b.type || ''
  if (ta !== tb) return ta < tb ? -1 : 1      // Sort by type first
  if (a.name !== b.name) return a.name < b.name ? -1 : 1  // Then by name
  return a.id < b.id ? -1 : 1                 // Finally by ID
})

return unique
```

**Sort Order**:
1. **Type** (ascending): `cloud` before `local`
2. **Name** (ascending): Alphabetical
3. **ID** (ascending): Alphabetical (tiebreaker)

**Why Stable Ordering?**
- Consistent API responses
- Predictable UI rendering
- Easier testing
- Better UX (models always in same order)

#### Usage Example

**In modelsRouter.ts**:
```typescript
import { listModelAdapters } from './modelRegistry'

router.get('/models', (req, res) => {
  const adapters = listModelAdapters()
  
  const models = adapters.map(adapter => ({
    id: adapter.id,
    name: adapter.name,
    type: adapter.type,
    supportsStreaming: adapter.supportsStreaming,
    supportsTools: adapter.supportsTools,
  }))
  
  res.json({ models })
})
```

**Response Example**:
```json
{
  "models": [
    {
      "id": "gpt-4.1-nano",
      "name": "GPT-4.1 Nano",
      "type": "cloud",
      "supportsStreaming": true,
      "supportsTools": true
    },
    {
      "id": "phi3",
      "name": "Phi-3 Mini",
      "type": "local",
      "supportsStreaming": true,
      "supportsTools": false
    }
  ]
}
```

---

## Alias System

### Why Aliases?

**Use Cases**:
1. **User Convenience**: Multiple ways to reference same model
2. **Backward Compatibility**: Old IDs still work after renaming
3. **Shorthand**: Easier typing (`phi3` vs `phi3-mini-4k-instruct`)
4. **Migration**: Gradual transition between naming schemes

### Alias Examples

**Cloud Model Aliases**:
```typescript
'gpt-4.1-nano'  // Canonical (exact version)
'gpt-4-nano'    // Shorthand (version-agnostic)
```

**Use Case**:
- Canonical for precision (API contracts)
- Alias for convenience (user input)

**Local Model Aliases**:
```typescript
'phi3'     // Canonical
'phi-3'    // Alternative format (matches branding)
```

### Adding New Aliases

**Pattern**:
```typescript
registerAdapter(adapterInstance, [
  'canonical-id',      // Primary ID
  'common-shorthand',  // User-friendly
  'legacy-name',       // Backward compatibility
])
```

**Example - Adding New Model**:
```typescript
import { llama32Adapter } from './adapters/ollama'

registerAdapter(llama32Adapter, [
  'llama3.2',        // Canonical (Ollama notation)
  'llama-3.2',       // Alternative format
  'llama32',         // Shorthand
  'llama',           // Generic (if it's the default Llama)
])
```

---

## Type Re-Export

```typescript
// Re-export LLMAdapter for adapters to import
export type { LLMAdapter }
```

**Purpose**: Allow adapter files to import type from single source.

**Benefits**:
- Avoids circular dependencies
- Single source of truth for type
- Cleaner imports in adapter files

**Usage in Adapter Files**:
```typescript
// adapters/openai/adapters.ts
import type { LLMAdapter } from '../../modelRegistry'

export const gpt41NanoAdapter: LLMAdapter = {
  id: 'gpt-4.1-nano',
  name: 'GPT-4.1 Nano',
  type: 'cloud',
  // ...
}
```

---

## Extension Patterns

### Adding New Cloud Model

**Step 1: Create Adapter**
```typescript
// adapters/openai/adapters.ts
export const gpt4oMiniAdapter: LLMAdapter = {
  id: 'gpt-4o-mini',
  name: 'GPT-4o Mini',
  type: 'cloud',
  generate: async (params) => {
    // Implementation
  },
  generateStream: async function* (params) {
    // Implementation
  },
}
```

**Step 2: Import in Registry**
```typescript
// modelRegistry.ts
import { 
  gpt41NanoAdapter,
  gpt4oMiniAdapter,  // ← Add import
} from './adapters/openai'
```

**Step 3: Register with Aliases**
```typescript
registerAdapter(gpt4oMiniAdapter, [
  'gpt-4o-mini',  // Canonical
  'gpt4o-mini',   // No hyphen variant
  'gpt-4-omni',   // Marketing name
])
```

### Adding New Local Model

**Step 1: Create Adapter**
```typescript
// adapters/ollama/adapters.ts
export const llama32Adapter: LLMAdapter = {
  id: 'llama3.2',
  name: 'Llama 3.2',
  type: 'local',
  generate: async (params) => {
    // Ollama API call
  },
}
```

**Step 2: Import in Registry**
```typescript
// modelRegistry.ts
import {
  phi3MiniAdapter,
  llama32Adapter,  // ← Add import
} from './adapters/ollama'
```

**Step 3: Register with Aliases**
```typescript
registerAdapter(llama32Adapter, [
  'llama3.2',    // Canonical (Ollama notation)
  'llama-3.2',   // Alternative
  'llama32',     // Shorthand
])
```

---

## Testing & Validation

### Registry Validation

**Check Registration**:
```typescript
// In tests or startup validation
const adapters = listModelAdapters()

console.log(`Registered ${adapters.length} unique adapters:`)
adapters.forEach(adapter => {
  console.log(`- ${adapter.id} (${adapter.type}): ${adapter.name}`)
})
```

**Output**:
```
Registered 2 unique adapters:
- gpt-4.1-nano (cloud): GPT-4.1 Nano
- phi3 (local): Phi-3 Mini
```

### Adapter Lookup Tests

```typescript
describe('modelRegistry', () => {
  describe('getModelAdapter', () => {
    it('should return adapter by canonical ID', () => {
      const adapter = getModelAdapter('gpt-4.1-nano')
      expect(adapter).toBeDefined()
      expect(adapter?.id).toBe('gpt-4.1-nano')
    })

    it('should return adapter by alias', () => {
      const adapter = getModelAdapter('gpt-4-nano')
      expect(adapter).toBeDefined()
      expect(adapter?.id).toBe('gpt-4.1-nano')
    })

    it('should return same instance for ID and alias', () => {
      const adapter1 = getModelAdapter('gpt-4.1-nano')
      const adapter2 = getModelAdapter('gpt-4-nano')
      expect(adapter1).toBe(adapter2)
    })

    it('should return undefined for unknown ID', () => {
      const adapter = getModelAdapter('unknown-model')
      expect(adapter).toBeUndefined()
    })

    it('should return undefined for empty string', () => {
      const adapter = getModelAdapter('')
      expect(adapter).toBeUndefined()
    })

    it('should handle whitespace', () => {
      const adapter = getModelAdapter('  gpt-4.1-nano  ')
      expect(adapter).toBeDefined()
    })
  })

  describe('listModelAdapters', () => {
    it('should return all unique adapters', () => {
      const adapters = listModelAdapters()
      const ids = adapters.map(a => a.id)
      
      // No duplicates
      expect(new Set(ids).size).toBe(ids.length)
      
      // Contains expected models
      expect(ids).toContain('gpt-4.1-nano')
      expect(ids).toContain('phi3')
    })

    it('should sort by type then name', () => {
      const adapters = listModelAdapters()
      
      // Cloud models before local
      const types = adapters.map(a => a.type)
      const cloudIndex = types.indexOf('cloud')
      const localIndex = types.indexOf('local')
      
      if (cloudIndex >= 0 && localIndex >= 0) {
        expect(cloudIndex).toBeLessThan(localIndex)
      }
    })

    it('should return same count regardless of aliases', () => {
      // Even with aliases, each adapter appears once
      const adapters = listModelAdapters()
      
      // Count unique canonical IDs
      const uniqueIds = new Set(adapters.map(a => a.id))
      expect(adapters.length).toBe(uniqueIds.size)
    })
  })
})
```

---

## Performance Considerations

### Lookup Performance

**Registry Lookup**: O(1) constant time
```typescript
getModelAdapter('gpt-4.1-nano') // Direct object property access
```

**No Performance Concerns**:
- Registry is pre-populated at module load
- Lookups are simple object property access
- No iteration or searching

### Listing Performance

**listModelAdapters**: O(n) where n = registry size
```typescript
// Iterates all entries once
for (const adapter of Object.values(modelRegistry)) {
  // Deduplication logic
}

// Sorts unique adapters
unique.sort(...)
```

**Optimization**: 
- Could cache result since registry is static
- Only needed for API endpoints (infrequent)
- Current performance is acceptable (~2 adapters)

**Future Optimization**:
```typescript
let cachedAdapters: LLMAdapter[] | null = null

export function listModelAdapters(): LLMAdapter[] {
  if (cachedAdapters) return cachedAdapters
  
  // ... existing deduplication + sorting
  
  cachedAdapters = unique
  return unique
}
```

---

## Best Practices

### 1. Use Canonical IDs in Code

```typescript
// ✅ GOOD: Use canonical ID
const adapter = getModelAdapter('gpt-4.1-nano')

// ❌ BAD: Use alias in code (less clear)
const adapter = getModelAdapter('gpt-4-nano')
```

**Why**: Canonical IDs are explicit and unambiguous.

### 2. Accept Aliases in User Input

```typescript
// ✅ GOOD: Accept user input (may use alias)
const userModel = req.body.model // Could be 'phi3' or 'phi-3'
const adapter = getModelAdapter(userModel)

// ✅ GOOD: Validate and normalize
if (!adapter) {
  return res.status(400).json({ 
    error: `Unknown model: ${userModel}` 
  })
}
```

### 3. Always Validate Adapter Exists

```typescript
// ✅ GOOD: Check for undefined
const adapter = getModelAdapter(modelName)
if (!adapter) {
  throw new Error(`Model "${modelName}" not found`)
}

// ❌ BAD: Assume adapter exists
const adapter = getModelAdapter(modelName)
await adapter.generate(...) // Could crash if undefined!
```

### 4. Register Adapters at Module Top Level

```typescript
// ✅ GOOD: Register at module load (current pattern)
registerAdapter(gpt41NanoAdapter, ['gpt-4.1-nano', 'gpt-4-nano'])

// ❌ BAD: Dynamic registration in functions
function someFunction() {
  registerAdapter(someAdapter, [...]) // Don't do this!
}
```

**Why**: Registry should be static and predictable.

### 5. Document Aliases

```typescript
// ✅ GOOD: Comment explains aliases
registerAdapter(gpt41NanoAdapter, [
  'gpt-4.1-nano', // exact match (canonical)
  'gpt-4-nano',   // short alias (user convenience)
])

// ❌ BAD: Unexplained aliases
registerAdapter(gpt41NanoAdapter, ['gpt-4.1-nano', 'gpt-4-nano', 'gpt4n', 'g41n'])
```

---

## Error Handling

### Missing Adapter

**Detection**:
```typescript
const adapter = getModelAdapter('nonexistent')
if (!adapter) {
  // Handle missing adapter
}
```

**Common Handling Patterns**:

**Pattern 1: Throw Error** (agentService):
```typescript
const adapter = getModelAdapter(modelName)
if (!adapter) {
  throw new Error(`Adapter for model "${modelName}" not found.`)
}
```

**Pattern 2: Return Error Response** (API routes):
```typescript
const adapter = getModelAdapter(req.body.model)
if (!adapter) {
  return res.status(400).json({
    error: 'Invalid model',
    message: `Model "${req.body.model}" not found`,
    availableModels: listModelAdapters().map(a => a.id)
  })
}
```

**Pattern 3: Fallback** (optional):
```typescript
const adapter = getModelAdapter(modelName) || getModelAdapter('gpt-4.1-nano')
// Falls back to default model
```

---

## Future Enhancements

### 1. Dynamic Adapter Loading

**Current**: Static imports at module load.

**Future**: Load adapters from plugins/config.

```typescript
export async function loadAdapterFromPlugin(pluginPath: string) {
  const module = await import(pluginPath)
  const adapter = module.default as LLMAdapter
  
  registerAdapter(adapter, adapter.aliases || [])
}
```

### 2. Adapter Capabilities Query

**Current**: Check adapter properties directly.

**Future**: Structured capability system.

```typescript
export function getAdapterCapabilities(id: string): AdapterCapabilities {
  const adapter = getModelAdapter(id)
  return {
    streaming: !!adapter?.generateStream,
    tools: adapter?.type === 'cloud',
    offline: adapter?.type === 'local',
    maxTokens: adapter?.maxTokens || 4096,
  }
}
```

### 3. Adapter Versioning

**Current**: Single version per model.

**Future**: Support multiple versions.

```typescript
registerAdapter(gpt41NanoAdapter, {
  canonical: 'gpt-4.1-nano',
  aliases: ['gpt-4-nano'],
  version: '1.0.0',
  deprecated: false,
})
```

### 4. Adapter Health Checks

**Current**: No health monitoring.

**Future**: Periodic adapter availability checks.

```typescript
export async function checkAdapterHealth(id: string): Promise<boolean> {
  const adapter = getModelAdapter(id)
  if (!adapter) return false
  
  try {
    if (adapter.type === 'local') {
      // Check Ollama is running
      await fetch('http://localhost:11434/api/tags')
      return true
    } else {
      // Check OpenAI API
      // (could be expensive, maybe cache results)
      return true
    }
  } catch {
    return false
  }
}
```

---

## Integration Examples

### Complete Agent Request Flow

```typescript
// 1. User request arrives
POST /api/agent/chat
{
  "model": "gpt-4-nano",  // User uses alias
  "input": "Hello",
  ...
}

// 2. Router validates model
import { getModelAdapter } from '../logic/modelRegistry'

const adapter = getModelAdapter(req.body.model)
if (!adapter) {
  return res.status(400).json({ 
    error: `Unknown model: ${req.body.model}` 
  })
}

// 3. Pass to agent service
const result = await runAgent({
  modelName: req.body.model,  // Still 'gpt-4-nano'
  input: req.body.input,
  ...
})

// 4. Agent service resolves adapter
const adapter = getModelAdapter(payload.modelName)
// adapter.id === 'gpt-4.1-nano' (canonical)

// 5. Use adapter
const response = await adapter.generate({
  messages: [...],
  settings: {...}
})

return response
```

### Model Selection UI

```typescript
// Frontend fetches available models
GET /api/models

// Backend returns list
import { listModelAdapters } from '../logic/modelRegistry'

router.get('/models', (req, res) => {
  const adapters = listModelAdapters()
  
  res.json({
    models: adapters.map(adapter => ({
      id: adapter.id,              // Use canonical ID
      name: adapter.name,
      type: adapter.type,
      description: adapter.description,
      capabilities: {
        streaming: !!adapter.generateStream,
        tools: adapter.type === 'cloud',
      }
    }))
  })
})

// Frontend displays
{
  models: [
    { id: "gpt-4.1-nano", name: "GPT-4.1 Nano", type: "cloud", ... },
    { id: "phi3", name: "Phi-3 Mini", type: "local", ... }
  ]
}
```

---

## Summary

The **Model Registry** provides centralized adapter management:

**Core Capabilities**:
- **Adapter Registration**: Single source of truth for all models
- **Alias Resolution**: Multiple names → one adapter
- **Unified Lookup**: `getModelAdapter(id)` works with IDs and aliases
- **Deduplication**: `listModelAdapters()` returns unique adapters
- **Type Re-Export**: Shared `LLMAdapter` type definition

**Registered Models** (Current):
- **Cloud**: `gpt-4.1-nano` (alias: `gpt-4-nano`)
- **Local**: `phi3` (alias: `phi-3`)

**Design Patterns**:
- **Registry Pattern**: Central lookup object
- **Singleton Instances**: Same adapter for ID and aliases
- **Null Prototype**: Clean object without inherited properties
- **Stable Sorting**: Deterministic adapter ordering

**Integration**:
- Used by `agentService` for adapter lookup
- Used by `memoryManager` for model type checking
- Used by `modelsRouter` for listing available models
- Used by adapters for type imports

**Best Practices**:
- Use canonical IDs in code
- Accept aliases in user input
- Always validate adapter exists
- Register at module top level
- Document alias purposes

**Production Status**: Fully implemented with clean architecture, alias support, and comprehensive error handling.
