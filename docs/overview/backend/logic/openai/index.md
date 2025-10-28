# OpenAI Index Documentation

## Overview

The `index.ts` file serves as the **public API entry point** for the OpenAI adapter module, providing clean exports for factory functions, types, model configurations, and adapter instances.

**Location**: `/backend/logic/adapters/openai/index.ts`

**Primary Responsibilities**:
- Export factory function for creating adapters
- Export TypeScript types and interfaces
- Export model configurations and utilities
- Export pre-built adapter instances
- Provide clean module interface

**Design Pattern**: **Facade Pattern**
- Hides internal module structure
- Provides single import point
- Controls what's exposed publicly
- Simplifies consumer imports

---

## Architecture Overview

### Module Structure

```
openai/
├── index.ts          ← Public API (YOU ARE HERE)
├── types.ts          ← Type definitions
├── models.ts         ← Model configurations
├── factory.ts        ← Adapter factory
└── adapters.ts       ← Pre-built instances
```

### Import Flow

```typescript
// Consumer code
import { 
  createOpenAIAdapter,      // From factory.ts
  gpt41NanoAdapter,         // From adapters.ts
  OPENAI_MODELS,            // From models.ts
  OpenAIModelConfig         // From types.ts
} from './adapters/openai'  // All from index.ts!

// Without index.ts facade, consumers would need:
import { createOpenAIAdapter } from './adapters/openai/factory'
import { gpt41NanoAdapter } from './adapters/openai/adapters'
import { OPENAI_MODELS } from './adapters/openai/models'
import type { OpenAIModelConfig } from './adapters/openai/types'
```

---

## Exports

### Factory Exports

```typescript
// Factory function and types
export { createOpenAIAdapter } from './factory'
export type { 
  OpenAIAdapterOptions, 
  OpenAIModelConfig, 
  OpenAIUsage,
  OpenAIGenerateResult,
  OpenAIStreamChunk
} from './types'
```

**Purpose**: Enable consumers to create custom adapter instances.

**Exported Items**:

1. **`createOpenAIAdapter`** (function)
   - Factory function for creating adapters
   - Accepts `OpenAIAdapterOptions`
   - Returns `LLMAdapter` instance

2. **`OpenAIAdapterOptions`** (type)
   - Configuration for factory function
   - Specifies model config, overrides

3. **`OpenAIModelConfig`** (type)
   - Model configuration structure
   - Context window, pricing, defaults

4. **`OpenAIUsage`** (type)
   - Token usage information
   - Prompt/completion/total tokens

5. **`OpenAIGenerateResult`** (type)
   - Non-streaming generation result
   - Reply text, token usage, cost

6. **`OpenAIStreamChunk`** (type)
   - Streaming chunk structure
   - Delta text, done flag, usage

**Usage Example**:
```typescript
import { createOpenAIAdapter, OPENAI_MODELS } from './adapters/openai'

// Create custom adapter
const customAdapter = createOpenAIAdapter({
  id: 'my-gpt-4.1',
  name: 'My Custom GPT-4.1',
  config: OPENAI_MODELS['gpt-4.1-nano']
})
```

### Model Configuration Exports

```typescript
// Model configurations
export { 
  OPENAI_MODELS, 
  getModelConfig, 
  getAllModelIds, 
  getActiveModels 
} from './models'
```

**Purpose**: Provide access to model configurations and utilities.

**Exported Items**:

1. **`OPENAI_MODELS`** (const)
   - Record of all model configurations
   - Key: model ID, Value: config object

2. **`getModelConfig`** (function)
   - Retrieve config by ID or alias
   - Returns `OpenAIModelConfig | undefined`

3. **`getAllModelIds`** (function)
   - Get all model IDs + aliases
   - Returns `string[]`

4. **`getActiveModels`** (function)
   - Get non-deprecated models only
   - Returns filtered model record

**Usage Example**:
```typescript
import { OPENAI_MODELS, getModelConfig } from './adapters/openai'

// Direct access
const config = OPENAI_MODELS['gpt-4.1-nano']

// By ID or alias
const config2 = getModelConfig('gpt-4.1-nano')

// List all IDs
const allIds = getAllModelIds()
// ['gpt-4.1-nano']

// Only active models
const activeModels = getActiveModels()
```

### Pre-Built Adapter Exports

```typescript
// Pre-built adapter instances
export { 
  gpt41NanoAdapter,
  openaiAdapters
} from './adapters'
```

**Purpose**: Provide ready-to-use adapter instances.

**Exported Items**:

1. **`gpt41NanoAdapter`** (const)
   - Pre-built GPT-4.1 Nano adapter
   - Type: `LLMAdapter`
   - Ready to use immediately

2. **`openaiAdapters`** (const)
   - Collection of all adapters
   - Key: model ID, Value: adapter
   - Type: `Record<string, LLMAdapter>`

**Usage Example**:
```typescript
import { gpt41NanoAdapter, openaiAdapters } from './adapters/openai'

// Direct use
const result = await gpt41NanoAdapter.generate({
  messages: [{ role: 'user', content: 'Hello' }]
})

// From collection
const adapter = openaiAdapters['gpt-4.1-nano']
```

---

## Import Patterns

### Pattern 1: Import Everything Needed

```typescript
import { 
  createOpenAIAdapter,
  gpt41NanoAdapter,
  OPENAI_MODELS,
  type OpenAIModelConfig 
} from './adapters/openai'
```

**When**: You need multiple items from the module.

### Pattern 2: Import Specific Adapter

```typescript
import { gpt41NanoAdapter } from './adapters/openai'
```

**When**: You only need a specific adapter (common).

### Pattern 3: Import Types Only

```typescript
import type { 
  OpenAIModelConfig,
  OpenAIAdapterOptions,
  OpenAIGenerateResult
} from './adapters/openai'
```

**When**: TypeScript type checking only (no runtime code).

### Pattern 4: Import Factory for Custom Adapters

```typescript
import { createOpenAIAdapter, OPENAI_MODELS } from './adapters/openai'

const customAdapter = createOpenAIAdapter({
  config: OPENAI_MODELS['gpt-4.1-nano']
})
```

**When**: Creating custom adapter configurations.

---

## Consumer Examples

### In modelRegistry.ts

```typescript
import { gpt41NanoAdapter } from './adapters/openai'

registerAdapter(gpt41NanoAdapter, [
  'gpt-4.1-nano',
  'gpt-4-nano'
])
```

**Usage**: Import pre-built adapter for registration.

### In agentService.ts

```typescript
import { getModelAdapter } from './modelRegistry'

const adapter = getModelAdapter('gpt-4.1-nano')
// Returns gpt41NanoAdapter from openai module

const result = await adapter.generate({
  messages: [...],
  settings: { temperature: 0.7 }
})
```

**Usage**: Indirect use through registry (most common).

### In Tests

```typescript
import { 
  createOpenAIAdapter,
  OPENAI_MODELS,
  type OpenAIModelConfig 
} from './adapters/openai'

describe('OpenAI Adapter', () => {
  it('should create adapter with config', () => {
    const adapter = createOpenAIAdapter({
      config: OPENAI_MODELS['gpt-4.1-nano']
    })
    
    expect(adapter.id).toBe('gpt-4.1-nano')
    expect(adapter.type).toBe('cloud')
  })
})
```

**Usage**: Testing adapter creation and configuration.

---

## Design Benefits

### 1. Single Import Point

**Without Facade**:
```typescript
import { createOpenAIAdapter } from './adapters/openai/factory'
import { gpt41NanoAdapter } from './adapters/openai/adapters'
import { OPENAI_MODELS } from './adapters/openai/models'
import type { OpenAIModelConfig } from './adapters/openai/types'
```

**With Facade**:
```typescript
import { 
  createOpenAIAdapter,
  gpt41NanoAdapter,
  OPENAI_MODELS,
  type OpenAIModelConfig
} from './adapters/openai'
```

**Benefit**: Cleaner, simpler imports.

### 2. Encapsulation

**Hidden Details**:
- Internal module structure
- Implementation files (factory.ts, adapters.ts)
- Private utilities
- Internal types

**Public API**:
- Only what consumers need
- Stable interface
- Controlled changes

### 3. Maintainability

**Refactoring Example**:
```typescript
// Can restructure internals without breaking consumers
// Move factory.ts → core/factory.ts
// Consumers don't need to change imports!

export { createOpenAIAdapter } from './core/factory'  // Updated path
// Consumer code unchanged ✅
```

### 4. Type Safety

**Type Exports**:
```typescript
export type { 
  OpenAIAdapterOptions,
  OpenAIModelConfig,
  // ... all types needed by consumers
}
```

**Benefit**: Full TypeScript support for consumers.

---

## Best Practices

### 1. Import from Index Only

```typescript
// ✅ GOOD: Import from module root
import { gpt41NanoAdapter } from './adapters/openai'

// ❌ BAD: Import from internal files
import { gpt41NanoAdapter } from './adapters/openai/adapters'
```

**Why**: Respects encapsulation, prevents breakage.

### 2. Use Type Imports for Types

```typescript
// ✅ GOOD: Explicit type import
import type { OpenAIModelConfig } from './adapters/openai'

// ⚠️ ACCEPTABLE: Mixed import
import { gpt41NanoAdapter, type OpenAIModelConfig } from './adapters/openai'
```

**Why**: Clear intent, better tree-shaking.

### 3. Import Only What You Need

```typescript
// ✅ GOOD: Specific imports
import { gpt41NanoAdapter } from './adapters/openai'

// ❌ BAD: Namespace import
import * as OpenAI from './adapters/openai'
```

**Why**: Better code clarity, smaller bundles.

---

## Module Exports Summary

**Total Exports**: 10 items

**By Category**:
- **Factory**: 1 function, 5 types
- **Models**: 4 items (1 const, 3 functions)
- **Adapters**: 2 items (1 adapter, 1 collection)

**Export Types**:
- **Functions**: 5 (createOpenAIAdapter, getModelConfig, getAllModelIds, getActiveModels, + 1 adapter instance)
- **Types**: 5 (OpenAIAdapterOptions, OpenAIModelConfig, OpenAIUsage, OpenAIGenerateResult, OpenAIStreamChunk)
- **Constants**: 2 (OPENAI_MODELS, openaiAdapters)
- **Instances**: 1 (gpt41NanoAdapter)

---

## Future Enhancements

### 1. Validation Exports

```typescript
export { 
  validateModelConfig,
  isValidOpenAIModel
} from './validation'
```

### 2. Utility Exports

```typescript
export {
  estimateTokens,
  calculateCost,
  formatUsage
} from './utils'
```

### 3. Constants Exports

```typescript
export {
  DEFAULT_TEMPERATURE,
  DEFAULT_MAX_TOKENS,
  OPENAI_API_BASE
} from './constants'
```

---

## Summary

The **OpenAI Index Module** provides a clean public API:

**Core Purpose**:
- Single import point for all OpenAI adapter functionality
- Hides internal module structure (facade pattern)
- Exports factory, types, models, and instances
- Provides stable public interface

**Key Exports**:
- **Factory**: `createOpenAIAdapter` + 5 types
- **Models**: `OPENAI_MODELS` + 3 utility functions
- **Adapters**: `gpt41NanoAdapter` + `openaiAdapters` collection

**Design Benefits**:
- Clean imports (one source)
- Encapsulation (hide internals)
- Maintainability (refactor-safe)
- Type safety (full TypeScript support)

**Best Practice**: Always import from `./adapters/openai`, never from internal files like `./adapters/openai/factory`.

**Production Status**: Fully implemented facade pattern with comprehensive exports for all OpenAI adapter functionality.
