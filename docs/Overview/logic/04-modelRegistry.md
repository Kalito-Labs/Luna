# modelRegistry.ts - Central Model Adapter Registry

## Purpose

`modelRegistry.ts` is the **central registry** for all AI model adapters in KalitoSpace. It provides a unified lookup system where models can be accessed by canonical IDs or friendly aliases, eliminating the need for conditional logic throughout the codebase.

## Why This Matters

**Without a registry:**
```typescript
// Scattered conditional logic everywhere
if (modelName === 'gpt-4.1-nano' || modelName === 'gpt-4-nano') {
  return gpt41NanoAdapter
} else if (modelName === 'phi3' || modelName === 'phi3-mini' || modelName === 'phi-3') {
  return phi3MiniAdapter
}
```

**With the registry:**
```typescript
// Clean, centralized lookup
const adapter = getModelAdapter('gpt-4-nano')  // Works!
const adapter = getModelAdapter('phi3')        // Works!
const adapter = getModelAdapter('gpt-4.1-nano') // Works!
```

---

## Core Architecture

```
┌─────────────────────────────────────────────────┐
│         modelRegistry (Object)                   │
│                                                  │
│  Key: 'gpt-4.1-nano'    → Value: gpt41NanoAdapter│
│  Key: 'gpt-4-nano'      → Value: gpt41NanoAdapter│ (alias)
│  Key: 'phi3-mini'       → Value: phi3MiniAdapter │
│  Key: 'phi3'            → Value: phi3MiniAdapter │ (alias)
│  Key: 'phi-3'           → Value: phi3MiniAdapter │ (alias)
└─────────────────────────────────────────────────┘
           ↓
    getModelAdapter('phi3')
           ↓
    Returns: phi3MiniAdapter
```

**Key Concept:** Multiple keys (canonical ID + aliases) point to the **same adapter instance**.

---

## Registry Data Structure

### Internal Storage
```typescript
const modelRegistry: Record<string, LLMAdapter> = Object.create(null)
```

**Why `Object.create(null)`?**
- Creates object with no prototype
- No inherited properties (`toString`, `hasOwnProperty`, etc.)
- Cleaner lookup, no prototype pollution
- Safer for dynamic key access

**Structure:**
```typescript
{
  // Canonical entries
  'gpt-4.1-nano': gpt41NanoAdapter,
  'phi3-mini': phi3MiniAdapter,
  
  // Alias entries (point to same instances)
  'gpt-4-nano': gpt41NanoAdapter,  // Same instance
  'phi3': phi3MiniAdapter,         // Same instance
  'phi-3': phi3MiniAdapter,        // Same instance
}
```

---

## Currently Registered Models

### Cloud Models

#### GPT-4.1 Nano (Sole Cloud Model)
```typescript
registerAdapter(gpt41NanoAdapter, [
  'gpt-4.1-nano',  // Canonical ID
  'gpt-4-nano',    // Short alias
])
```

**Characteristics:**
- **Type:** `cloud`
- **Provider:** OpenAI
- **Context:** 128,000 tokens
- **Strengths:** Excellent eldercare context understanding
- **Trust Level:** Trusted (in `TRUSTED_MODELS`)
- **Database Access:** Full (includes private data)

**Access Methods:**
```typescript
getModelAdapter('gpt-4.1-nano')  // Canonical ✅
getModelAdapter('gpt-4-nano')    // Alias ✅
```

### Local Models

#### Phi3 Mini (Primary Local Model)
```typescript
registerAdapter(phi3MiniAdapter, [
  'phi3',      // Short alias
  'phi-3',     // Alternative format
])
```

**Characteristics:**
- **Type:** `local`
- **Provider:** Ollama
- **Context:** 4,096 tokens
- **Strengths:** Fast local inference, offline capability
- **Trust Level:** Trusted (all local models trusted)
- **Database Access:** Full (includes private data)

**Access Methods:**
```typescript
getModelAdapter('phi3-mini')  // Canonical ✅
getModelAdapter('phi3')       // Alias ✅
getModelAdapter('phi-3')      // Alias ✅
```

---

## Core Functions

### 1. `registerAdapter()` - Register Model with Aliases

**Purpose:** Adds adapter to registry under canonical ID and aliases

**Signature:**
```typescript
function registerAdapter(adapter: LLMAdapter, aliases: string[] = []): void
```

**Process:**
```typescript
function registerAdapter(adapter: LLMAdapter, aliases: string[] = []) {
  // Step 1: Register canonical ID
  modelRegistry[adapter.id] = adapter
  
  // Step 2: Register all aliases (point to same instance)
  for (const alias of aliases) {
    if (!alias) continue  // Skip empty strings
    modelRegistry[alias] = adapter
  }
}
```

**Example Usage:**
```typescript
registerAdapter(gpt41NanoAdapter, ['gpt-4.1-nano', 'gpt-4-nano'])

// Result in registry:
{
  'gpt-4.1-nano': gpt41NanoAdapter,  // Canonical
  'gpt-4-nano': gpt41NanoAdapter,    // Alias → same instance
}
```

**Memory Efficiency:**
```typescript
// NOT creating copies - all keys point to SAME adapter instance
modelRegistry['gpt-4.1-nano'] === modelRegistry['gpt-4-nano']  // true
```

---

### 2. `getModelAdapter()` - Lookup Adapter by ID

**Purpose:** Retrieve adapter by canonical ID or alias

**Signature:**
```typescript
export function getModelAdapter(id: string): LLMAdapter | undefined
```

**Process:**
```typescript
export function getModelAdapter(id: string): LLMAdapter | undefined {
  // Validation
  if (!id) return undefined
  
  // Normalize input (trim whitespace)
  const key = typeof id === 'string' ? id.trim() : id
  
  // Simple lookup
  return modelRegistry[key]
}
```

**Example Usage:**
```typescript
// By canonical ID
const adapter1 = getModelAdapter('gpt-4.1-nano')
console.log(adapter1?.name)  // "GPT-4.1 Nano"

// By alias
const adapter2 = getModelAdapter('gpt-4-nano')
console.log(adapter2?.name)  // "GPT-4.1 Nano" (same instance)

// Same instance check
adapter1 === adapter2  // true ✅

// Unknown model
const adapter3 = getModelAdapter('unknown-model')
console.log(adapter3)  // undefined
```

**Safety Features:**
```typescript
// Handles edge cases
getModelAdapter('')           // undefined (empty string)
getModelAdapter('  phi3  ')   // Works (trimmed to 'phi3')
getModelAdapter(null)         // undefined
getModelAdapter(undefined)    // undefined
```

---

### 3. `listModelAdapters()` - Get All Unique Adapters

**Purpose:** Returns all registered adapters (unique, sorted, no duplicates from aliases)

**Signature:**
```typescript
export function listModelAdapters(): LLMAdapter[]
```

**Process:**
```typescript
export function listModelAdapters(): LLMAdapter[] {
  const seen = new Set<string>()  // Track canonical IDs
  const unique: LLMAdapter[] = []
  
  // Step 1: Iterate all registry entries
  for (const adapter of Object.values(modelRegistry)) {
    if (!adapter?.id) continue           // Skip invalid entries
    if (seen.has(adapter.id)) continue   // Skip duplicates (aliases)
    
    seen.add(adapter.id)   // Mark as seen
    unique.push(adapter)   // Add to results
  }
  
  // Step 2: Sort for stable, deterministic ordering
  unique.sort((a, b) => {
    // Primary sort: type (cloud < local)
    const ta = a.type || ''
    const tb = b.type || ''
    if (ta !== tb) return ta < tb ? -1 : 1
    
    // Secondary sort: name
    if (a.name !== b.name) return a.name < b.name ? -1 : 1
    
    // Tertiary sort: id
    return a.id < b.id ? -1 : 1
  })
  
  return unique
}
```

**Why Deduplication?**

Registry has multiple entries for aliases:
```typescript
{
  'gpt-4.1-nano': gpt41NanoAdapter,  // Instance #1
  'gpt-4-nano': gpt41NanoAdapter,    // Same instance (alias)
  'phi3-mini': phi3MiniAdapter,      // Instance #2
  'phi3': phi3MiniAdapter,           // Same instance (alias)
  'phi-3': phi3MiniAdapter,          // Same instance (alias)
}
```

Without deduplication:
```typescript
Object.values(modelRegistry)  // [adapter1, adapter1, adapter2, adapter2, adapter2]
// 5 entries (includes duplicates)
```

With deduplication:
```typescript
listModelAdapters()  // [adapter1, adapter2]
// 2 unique adapters ✅
```

**Sorting Strategy:**

```typescript
// Example output (sorted):
[
  {
    id: 'gpt-4.1-nano',
    name: 'GPT-4.1 Nano',
    type: 'cloud',        // ← 'cloud' comes first
    provider: 'openai'
  },
  {
    id: 'phi3-mini',
    name: 'Phi-3 Mini',
    type: 'local',        // ← 'local' comes second
    provider: 'ollama'
  }
]
```

**Why Stable Ordering?**
- **API Consistency:** Same results every time
- **UI Predictability:** Model list doesn't shuffle
- **Testing:** Deterministic behavior for tests
- **User Experience:** Models appear in expected order

**Example Usage:**
```typescript
// Get all available models for UI dropdown
const allModels = listModelAdapters()

allModels.forEach(adapter => {
  console.log(`${adapter.name} (${adapter.type})`)
})

// Output:
// GPT-4.1 Nano (cloud)
// Phi-3 Mini (local)
```

---

## Adapter Import System

### Import Structure
```typescript
// OpenAI adapters
import { 
  gpt41NanoAdapter,
} from './adapters/openai'

// Ollama adapters
import {
  phi3MiniAdapter,
} from './adapters/ollama'
```

**Barrel Exports:**
- `./adapters/openai/index.ts` - Exports all OpenAI adapters
- `./adapters/ollama/index.ts` - Exports all Ollama adapters

**Adapter Files:**
- `./adapters/openai/adapters.ts` - Pre-built OpenAI adapter instances
- `./adapters/ollama/adapters.ts` - Pre-built Ollama adapter instances

---

## Type System

### LLMAdapter Interface
```typescript
export type { LLMAdapter }  // Re-exported for convenience

interface LLMAdapter {
  id: string              // Canonical ID ('gpt-4.1-nano')
  name: string            // Display name ('GPT-4.1 Nano')
  type: 'local' | 'cloud' // Deployment type
  provider: string        // Provider name ('openai', 'ollama')
  // ... other properties (generate, generateStream, cost, etc.)
}
```

---

## Usage Patterns

### Pattern 1: Simple Model Lookup
```typescript
// In agentService.ts
export async function runAgent(options: AgentOptions) {
  const adapter = getModelAdapter(options.modelName)
  
  if (!adapter) {
    throw new Error(`Model not found: ${options.modelName}`)
  }
  
  const result = await adapter.generate(/* ... */)
  return result
}
```

### Pattern 2: Get Available Models for UI
```typescript
// In modelsRouter.ts
router.get('/models', (req, res) => {
  const models = listModelAdapters()
  
  res.json({
    models: models.map(adapter => ({
      id: adapter.id,
      name: adapter.name,
      type: adapter.type,
      provider: adapter.provider
    }))
  })
})
```

### Pattern 3: Check Model Type
```typescript
// In eldercareContextService.ts
private isLocalModel(modelId: string): boolean {
  const adapter = getModelAdapter(modelId)
  return adapter?.type === 'local'
}
```

### Pattern 4: Alias Support in User Input
```typescript
// User can use any alias
const userInput = 'phi3'  // or 'phi-3' or 'phi3-mini'
const adapter = getModelAdapter(userInput)
// Works for all variations ✅
```

---

## Adding New Models

### Step 1: Create Adapter
```typescript
// In ./adapters/openai/adapters.ts
export const gpt4Adapter = createOpenAIAdapter({
  id: 'gpt-4',
  name: 'GPT-4',
  modelName: 'gpt-4',
  // ... configuration
})
```

### Step 2: Export from Barrel
```typescript
// In ./adapters/openai/index.ts
export { gpt41NanoAdapter, gpt4Adapter } from './adapters'
```

### Step 3: Import and Register
```typescript
// In modelRegistry.ts
import { 
  gpt41NanoAdapter,
  gpt4Adapter,  // ← Import new adapter
} from './adapters/openai'

// Register with aliases
registerAdapter(gpt4Adapter, [
  'gpt4',        // Short alias
  'gpt-4.0',     // Version alias
])
```

### Step 4: Done!
```typescript
// Now available everywhere
const adapter = getModelAdapter('gpt4')
const adapter = getModelAdapter('gpt-4')
const adapter = getModelAdapter('gpt-4.0')
// All work ✅
```

---

## Removed Models (This Session)

### GPT-5 Nano (Removed Oct 13, 2025)
**Reason:** Caused `[no text]` replies, API instability

**Previous Registration:**
```typescript
// REMOVED
registerAdapter(gpt5NanoAdapter, [
  'gpt-5-nano',
  'gpt5-nano',
])
```

### Claude Opus 4.1 (Removed Oct 13, 2025)
**Reason:** Context understanding issues, user decision to use only GPT-4.1 Nano as cloud model

**Previous Registration:**
```typescript
// REMOVED
registerAdapter(claudeAdapter, [
  'claude-opus-4.1',
  'claude-opus',
  'claude-4-sonnet',
  'claude-sonnet',
])
```

---

## Design Decisions

### 1. **Why Single Registry Object?**
**Benefit:** Simple O(1) lookup, no search required
```typescript
// Direct key access - instant
return modelRegistry['gpt-4-nano']
```

**Alternative (Array-based):**
```typescript
// Would require O(n) search
adapters.find(a => a.id === 'gpt-4-nano')
```

### 2. **Why Object.create(null)?**
**Problem:** Regular objects have prototype
```typescript
const obj = {}
obj.toString  // Function from Object.prototype
obj.hasOwnProperty  // Function from Object.prototype
```

**Solution:** Prototype-less object
```typescript
const obj = Object.create(null)
obj.toString  // undefined
obj.hasOwnProperty  // undefined
```

**Benefits:**
- No inherited properties
- Safer for dynamic keys
- No prototype pollution
- Cleaner `Object.values()` iteration

### 3. **Why Shared Instances for Aliases?**
**Memory Efficient:**
```typescript
// NOT creating copies
modelRegistry['phi3'] = phi3MiniAdapter        // Reference
modelRegistry['phi-3'] = phi3MiniAdapter       // Same reference
modelRegistry['phi3-mini'] = phi3MiniAdapter   // Same reference

// Memory usage: 1 adapter instance + 3 string keys
```

**Alternative (Copies):**
```typescript
// BAD: Would create separate instances
modelRegistry['phi3'] = { ...phi3MiniAdapter }
modelRegistry['phi-3'] = { ...phi3MiniAdapter }
// Memory usage: 3 adapter instances
```

### 4. **Why Sorting in listModelAdapters()?**
**Problem:** JavaScript object iteration order is insertion-dependent
```typescript
// Order changes based on registration sequence
// Could return: [local, cloud, local, cloud] (unpredictable)
```

**Solution:** Explicit sorting
```typescript
// Always returns: [all cloud models, then all local models]
// Within each type: sorted by name
```

### 5. **Why Trim Input in getModelAdapter()?**
**User Input Tolerance:**
```typescript
// Handle whitespace from user input
getModelAdapter('  gpt-4-nano  ')  // Works ✅
getModelAdapter('phi3\n')          // Works ✅
```

---

## Error Handling

### Model Not Found
```typescript
const adapter = getModelAdapter('unknown-model')

if (!adapter) {
  throw new Error(`Model "${modelName}" not found`)
}
```

### No ID Provided
```typescript
const adapter = getModelAdapter('')
// Returns: undefined (safe, no error)
```

### Invalid Registry Entry
```typescript
// listModelAdapters() skips invalid entries
for (const adapter of Object.values(modelRegistry)) {
  if (!adapter?.id) continue  // Skip nulls, undefined, objects without id
}
```

---

## Performance Characteristics

### Lookup Time Complexity
- **getModelAdapter():** O(1) - Direct key access
- **listModelAdapters():** O(n log n) - Iteration + sorting
  - n = number of unique adapters (currently 2)
  - Called rarely (UI initialization, API endpoints)

### Memory Usage
- **Registry Storage:** O(n) where n = canonical IDs + aliases
  - Currently: 5 keys, 2 adapter instances
  - Aliases are references, not copies

### Cache Behavior
- **No Caching Needed:** Direct object property access is instant
- **Registry is Immutable:** Set at startup, never changes at runtime

---

## Testing Scenarios

### Test 1: Canonical ID Lookup
```typescript
const adapter = getModelAdapter('gpt-4.1-nano')
assert(adapter?.id === 'gpt-4.1-nano')
assert(adapter?.name === 'GPT-4.1 Nano')
```

### Test 2: Alias Lookup
```typescript
const adapter = getModelAdapter('gpt-4-nano')
assert(adapter?.id === 'gpt-4.1-nano')  // Resolves to canonical
```

### Test 3: Same Instance Check
```typescript
const adapter1 = getModelAdapter('phi3')
const adapter2 = getModelAdapter('phi-3')
assert(adapter1 === adapter2)  // Same instance
```

### Test 4: List All Models
```typescript
const adapters = listModelAdapters()
assert(adapters.length === 2)  // No duplicates
assert(adapters[0].type === 'cloud')  // Sorted by type
```

### Test 5: Unknown Model
```typescript
const adapter = getModelAdapter('unknown')
assert(adapter === undefined)  // Safe failure
```

---

## Future Enhancements

### 1. Model Metadata
```typescript
registerAdapter(gpt41NanoAdapter, ['gpt-4-nano'], {
  category: 'reasoning',
  costTier: 'premium',
  maxTokens: 128000,
  features: ['streaming', 'function-calling']
})
```

### 2. Dynamic Registration (Hot Reload)
```typescript
export function registerRuntimeAdapter(adapter: LLMAdapter) {
  modelRegistry[adapter.id] = adapter
  // Notify UI of new model availability
}
```

### 3. Model Tags/Categories
```typescript
export function getModelsByTag(tag: string): LLMAdapter[] {
  return listModelAdapters().filter(a => a.tags?.includes(tag))
}

// Usage
const codingModels = getModelsByTag('coding')
```

### 4. Deprecation Warnings
```typescript
const deprecatedModels = {
  'gpt-3.5-turbo': 'gpt-4.1-nano'  // old → recommended replacement
}

export function getModelAdapter(id: string): LLMAdapter | undefined {
  if (deprecatedModels[id]) {
    console.warn(`Model "${id}" is deprecated. Use "${deprecatedModels[id]}" instead.`)
  }
  return modelRegistry[id]
}
```

---

## Related Files

- `./adapters/openai/adapters.ts` - OpenAI adapter instances
- `./adapters/ollama/adapters.ts` - Ollama adapter instances
- `./adapters/openai/index.ts` - OpenAI barrel export
- `./adapters/ollama/index.ts` - Ollama barrel export
- `../types/models.ts` - LLMAdapter interface definition
- `agentService.ts` - Primary consumer of adapters
- `eldercareContextService.ts` - Uses for model type checking
- `memoryManager.ts` - Uses for model type checking

---

## Quick Reference

**Get model adapter:**
```typescript
const adapter = getModelAdapter('gpt-4-nano')
```

**List all models:**
```typescript
const models = listModelAdapters()
```

**Register new model:**
```typescript
registerAdapter(newAdapter, ['alias1', 'alias2'])
```

**Check if model exists:**
```typescript
const exists = getModelAdapter('model-id') !== undefined
```

**Get model by user input (with alias support):**
```typescript
// All work:
getModelAdapter('phi3')
getModelAdapter('phi-3')
getModelAdapter('phi3-mini')
```
