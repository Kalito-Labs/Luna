# OpenAI Models Documentation

## Overview

The `models.ts` file defines the **central configuration registry** for all OpenAI models, providing model specifications, pricing, defaults, and utility functions for model lookup.

**Location**: `/backend/logic/adapters/openai/models.ts`

**Primary Responsibilities**:
- Define all OpenAI model configurations
- Store model specifications (context window, pricing, defaults)
- Provide model lookup by ID or alias
- List available models
- Filter active (non-deprecated) models

**Design Pattern**: **Configuration Registry**
- Single source of truth for model configs
- Centralized management
- Easy to add/remove models
- Supports aliases for flexibility

---

## Architecture Overview

### Model Registry Structure

```
OPENAI_MODELS (const)
       ↓
{
  'gpt-4.1-nano': {
    model: 'gpt-4.1-nano',
    name: 'GPT-4.1 Nano',
    contextWindow: 128000,
    defaultMaxTokens: 1024,
    defaultTemperature: 0.7,
    pricing: { input: 0.20, output: 0.80 }
  }
}
       ↓
Utilities:
- getModelConfig(id) → config
- getAllModelIds() → string[]
- getActiveModels() → Record<string, config>
```

### Data Flow

```
User selects "gpt-4.1-nano"
       ↓
getModelConfig('gpt-4.1-nano')
       ↓
Returns model configuration
       ↓
createOpenAIAdapter({ config })
       ↓
Adapter uses config for API calls
```

---

## Model Configurations

### OPENAI_MODELS

```typescript
export const OPENAI_MODELS: Record<string, OpenAIModelConfig> = {
  // GPT-4.1 Nano - Fastest GPT-4.1 model with excellent context understanding
  'gpt-4.1-nano': {
    model: 'gpt-4.1-nano',
    name: 'GPT-4.1 Nano',
    contextWindow: 128000,
    defaultMaxTokens: 1024,
    defaultTemperature: 0.7,
    pricing: {
      input: 0.20,   // $0.20 / 1M input tokens
      output: 0.80,  // $0.80 / 1M output tokens
    },
  },
}
```

**Type**: `Record<string, OpenAIModelConfig>`

**Purpose**: Central registry of all model configurations.

**Structure**: 
- **Key**: Model ID (string)
- **Value**: Model configuration object

**Current Models**: 1 (GPT-4.1 Nano)

---

### GPT-4.1 Nano Configuration

```typescript
'gpt-4.1-nano': {
  model: 'gpt-4.1-nano',
  name: 'GPT-4.1 Nano',
  contextWindow: 128000,
  defaultMaxTokens: 1024,
  defaultTemperature: 0.7,
  pricing: {
    input: 0.20,   // $0.20 / 1M input tokens
    output: 0.80,  // $0.80 / 1M output tokens
  },
}
```

**Field Details**:

#### model

```typescript
model: 'gpt-4.1-nano'
```

**Type**: `OpenAIModel` (string literal)

**Purpose**: OpenAI API model identifier.

**Value**: `'gpt-4.1-nano'`

#### name

```typescript
name: 'GPT-4.1 Nano'
```

**Purpose**: Display name for UI.

**Value**: `'GPT-4.1 Nano'`

#### contextWindow

```typescript
contextWindow: 128000
```

**Purpose**: Maximum context window in tokens.

**Value**: `128000` (128K tokens)

**Significance**:
- Large context window (128K is excellent)
- Can handle long conversations
- Fits entire eldercare database context
- Supports long documents

**Usage**:
```typescript
if (totalTokens > config.contextWindow) {
  throw new Error(`Context exceeds ${config.contextWindow} tokens`)
}
```

#### defaultMaxTokens

```typescript
defaultMaxTokens: 1024
```

**Purpose**: Default maximum tokens for response.

**Value**: `1024` tokens

**Why 1024?**
- Reasonable default for most responses
- ~750 words of text
- Not too short, not too long
- User can override if needed

**Usage**:
```typescript
const maxTokens = settings.maxTokens ?? config.defaultMaxTokens
```

#### defaultTemperature

```typescript
defaultTemperature: 0.7
```

**Purpose**: Default temperature setting.

**Value**: `0.7`

**Why 0.7?**
- Balanced creativity and coherence
- Not too deterministic (0.0)
- Not too random (1.0+)
- Good for conversational AI

**Temperature Scale**:
- `0.0 - 0.3`: Deterministic, factual
- `0.4 - 0.7`: Balanced (← 0.7 is here)
- `0.8 - 1.0`: Creative
- `1.1 - 2.0`: Very creative

**Usage**:
```typescript
const temperature = settings.temperature ?? config.defaultTemperature
```

#### pricing

```typescript
pricing: {
  input: 0.20,   // $0.20 / 1M input tokens
  output: 0.80,  // $0.80 / 1M output tokens
}
```

**Purpose**: Cost per million tokens for usage tracking.

**Values**:
- **Input**: $0.20 per 1M tokens
- **Output**: $0.80 per 1M tokens

**Cost Examples**:

**Example 1: Simple Query**
```typescript
Input: 150 tokens
Output: 50 tokens

inputCost = (150 / 1_000_000) * 0.20 = $0.00003
outputCost = (50 / 1_000_000) * 0.80 = $0.00004
totalCost = $0.00007 (~$0.0001)
```

**Example 2: Long Conversation**
```typescript
Input: 3000 tokens (context + query)
Output: 500 tokens

inputCost = (3000 / 1_000_000) * 0.20 = $0.0006
outputCost = (500 / 1_000_000) * 0.80 = $0.0004
totalCost = $0.001 (~$0.001 per message)
```

**Example 3: 1000 Messages/Day**
```typescript
Avg input: 2000 tokens
Avg output: 300 tokens

Daily cost = 1000 * $0.0008 = $0.80
Monthly cost = $0.80 * 30 = $24
```

**Usage in Code**:
```typescript
function estimateCost(usage: OpenAIUsage, config: OpenAIModelConfig): number {
  if (!config.pricing) return 0
  
  const inputTokens = usage.prompt_tokens ?? 0
  const outputTokens = usage.completion_tokens ?? 0
  
  return (
    (inputTokens * config.pricing.input) +
    (outputTokens * config.pricing.output)
  ) / 1_000_000
}
```

---

## Utility Functions

### getModelConfig

```typescript
export function getModelConfig(modelId: string): OpenAIModelConfig | undefined
```

**Purpose**: Retrieve model configuration by ID or alias.

**Parameters**:
- `modelId` - Model identifier (canonical ID or alias)

**Returns**: `OpenAIModelConfig | undefined`

**Algorithm**:

**Step 1: Direct Lookup**
```typescript
// Direct lookup first
if (OPENAI_MODELS[modelId]) {
  return OPENAI_MODELS[modelId]
}
```

**Step 2: Alias Search**
```typescript
// Search by alias
for (const config of Object.values(OPENAI_MODELS)) {
  if (config.aliases?.includes(modelId)) {
    return config
  }
}
```

**Step 3: Not Found**
```typescript
return undefined
```

#### Usage Examples

**Example 1: Direct Lookup**
```typescript
const config = getModelConfig('gpt-4.1-nano')

console.log(config?.name)  // "GPT-4.1 Nano"
console.log(config?.contextWindow)  // 128000
```

**Example 2: Alias Lookup** (if aliases defined)
```typescript
// Assume 'gpt-4.1-nano' has alias 'gpt-4-nano'
const config = getModelConfig('gpt-4-nano')

console.log(config?.model)  // "gpt-4.1-nano" (canonical)
```

**Example 3: Not Found**
```typescript
const config = getModelConfig('gpt-5-turbo')

console.log(config)  // undefined
```

**Example 4: Safe Usage**
```typescript
const config = getModelConfig(userInput)

if (!config) {
  throw new Error(`Unknown model: ${userInput}`)
}

// Use config safely
console.log(`Using ${config.name}`)
```

---

### getAllModelIds

```typescript
export function getAllModelIds(): string[]
```

**Purpose**: Get list of all model IDs including aliases.

**Returns**: `string[]` - Array of model identifiers.

**Algorithm**:

```typescript
const ids: string[] = []

for (const [modelId, config] of Object.entries(OPENAI_MODELS)) {
  ids.push(modelId)
  if (config.aliases) {
    ids.push(...config.aliases)
  }
}

return ids
```

**Steps**:
1. Iterate all model entries
2. Add canonical ID
3. Add all aliases (if present)
4. Return complete list

#### Usage Examples

**Example 1: List All Models**
```typescript
const allIds = getAllModelIds()

console.log('Available models:', allIds)
// ['gpt-4.1-nano']

// If aliases were defined:
// ['gpt-4.1-nano', 'gpt-4-nano', 'gpt4nano']
```

**Example 2: Validation**
```typescript
const allIds = getAllModelIds()

function isValidModel(id: string): boolean {
  return allIds.includes(id)
}

console.log(isValidModel('gpt-4.1-nano'))  // true
console.log(isValidModel('gpt-5'))  // false
```

**Example 3: UI Dropdown**
```typescript
const modelIds = getAllModelIds()

const dropdown = modelIds.map(id => ({
  value: id,
  label: getModelConfig(id)?.name ?? id
}))

// [{ value: 'gpt-4.1-nano', label: 'GPT-4.1 Nano' }]
```

---

### getActiveModels

```typescript
export function getActiveModels(): Record<string, OpenAIModelConfig>
```

**Purpose**: Get only non-deprecated models.

**Returns**: `Record<string, OpenAIModelConfig>` - Filtered model registry.

**Algorithm**:

```typescript
return Object.fromEntries(
  Object.entries(OPENAI_MODELS).filter(([_, config]) => !config.deprecated)
)
```

**Steps**:
1. Convert object to entries (key-value pairs)
2. Filter out deprecated models
3. Convert back to object

#### Usage Examples

**Example 1: List Active Models**
```typescript
const activeModels = getActiveModels()

console.log(Object.keys(activeModels))
// ['gpt-4.1-nano']

// If we had deprecated models:
// OPENAI_MODELS = {
//   'gpt-3.5-turbo': { deprecated: true, ... },
//   'gpt-4.1-nano': { deprecated: false, ... }
// }
// getActiveModels() → { 'gpt-4.1-nano': { ... } }
```

**Example 2: UI Model Selector**
```typescript
const activeModels = getActiveModels()

const modelOptions = Object.values(activeModels).map(config => ({
  id: config.model,
  name: config.name,
  description: `${config.contextWindow / 1000}K context`
}))

// Only shows active models in UI
```

**Example 3: API Endpoint**
```typescript
router.get('/models', (req, res) => {
  const models = getActiveModels()
  
  res.json({
    models: Object.values(models).map(config => ({
      id: config.model,
      name: config.name,
      contextWindow: config.contextWindow,
      pricing: config.pricing
    }))
  })
})
```

---

## Adding New Models

### Pattern: Add to Registry

**Step 1: Define Configuration**
```typescript
export const OPENAI_MODELS: Record<string, OpenAIModelConfig> = {
  // Existing models
  'gpt-4.1-nano': { ... },
  
  // New model
  'gpt-4o-mini': {
    model: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    contextWindow: 128000,
    defaultMaxTokens: 2048,
    defaultTemperature: 0.7,
    pricing: {
      input: 0.15,   // Check OpenAI pricing page
      output: 0.60,
    },
    aliases: ['gpt4o-mini', 'gpt-4-omni-mini'],
  },
}
```

**Step 2: Update Type (if needed)**
```typescript
// types.ts
export type OpenAIModel = 
  | 'gpt-4.1-nano'
  | 'gpt-4o-mini'  // Add new model
```

**Step 3: Create Adapter (if needed)**
```typescript
// adapters.ts
import { OPENAI_MODELS } from './models'

export const gpt4oMiniAdapter = createOpenAIAdapter({
  config: OPENAI_MODELS['gpt-4o-mini']
})

export const openaiAdapters = {
  'gpt-4.1-nano': gpt41NanoAdapter,
  'gpt-4o-mini': gpt4oMiniAdapter,
}
```

**Step 4: Register (if needed)**
```typescript
// modelRegistry.ts
import { gpt41NanoAdapter, gpt4oMiniAdapter } from './adapters/openai'

registerAdapter(gpt4oMiniAdapter, ['gpt-4o-mini', 'gpt4o-mini'])
```

---

## Deprecating Models

### Pattern: Mark as Deprecated

```typescript
export const OPENAI_MODELS: Record<string, OpenAIModelConfig> = {
  'gpt-3.5-turbo': {
    model: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    contextWindow: 16000,
    defaultMaxTokens: 1024,
    defaultTemperature: 0.7,
    deprecated: true,  // ← Mark as deprecated
    pricing: {
      input: 0.10,
      output: 0.30,
    },
  },
  'gpt-4.1-nano': {
    // ... active model
  },
}
```

**Effects**:
- `getActiveModels()` excludes it
- Still accessible via `getModelConfig()` (backward compatibility)
- UI can hide deprecated models
- Existing code continues to work

**Usage**:
```typescript
// Active models only (for UI)
const activeModels = getActiveModels()
// { 'gpt-4.1-nano': { ... } }

// All models (for backward compatibility)
const allModels = OPENAI_MODELS
// { 'gpt-3.5-turbo': { deprecated: true }, 'gpt-4.1-nano': { ... } }

// Lookup still works
const config = getModelConfig('gpt-3.5-turbo')
// { deprecated: true, ... }
```

---

## Best Practices

### 1. Keep Pricing Up to Date

```typescript
// ✅ GOOD: Check OpenAI pricing page regularly
pricing: {
  input: 0.20,   // Current price from openai.com/pricing
  output: 0.80,
}

// ❌ BAD: Outdated pricing
pricing: {
  input: 0.50,   // Old price!
  output: 1.50,
}
```

**Why**: Accurate cost estimation for users.

### 2. Use Descriptive Names

```typescript
// ✅ GOOD: Clear, descriptive
name: 'GPT-4.1 Nano'

// ❌ BAD: Ambiguous
name: 'GPT Nano'
```

### 3. Set Reasonable Defaults

```typescript
// ✅ GOOD: Balanced defaults
defaultMaxTokens: 1024,     // Not too short, not too long
defaultTemperature: 0.7,    // Balanced creativity

// ❌ BAD: Extreme defaults
defaultMaxTokens: 16000,    // Too long (expensive!)
defaultTemperature: 2.0,    // Too random
```

### 4. Add Aliases for Usability

```typescript
// ✅ GOOD: Common variations
aliases: ['gpt-4-nano', 'gpt4nano', 'gpt-4.1n']

// ⚠️ ACCEPTABLE: No aliases (but less user-friendly)
aliases: []
```

### 5. Mark Deprecated Models

```typescript
// ✅ GOOD: Keep for backward compatibility
'gpt-3.5-turbo': {
  model: 'gpt-3.5-turbo',
  deprecated: true,
  // ... rest of config
}

// ❌ BAD: Delete model entirely
// Breaks existing code!
```

---

## Integration Examples

### Example 1: Creating Adapter

```typescript
import { OPENAI_MODELS } from './models'
import { createOpenAIAdapter } from './factory'

const adapter = createOpenAIAdapter({
  config: OPENAI_MODELS['gpt-4.1-nano']
})

console.log(adapter.name)  // "GPT-4.1 Nano"
console.log(adapter.contextWindow)  // 128000
```

### Example 2: Cost Estimation

```typescript
import { getModelConfig } from './models'

function estimateRequestCost(modelId: string, inputTokens: number, outputTokens: number): number {
  const config = getModelConfig(modelId)
  
  if (!config?.pricing) {
    return 0
  }
  
  return (
    (inputTokens * config.pricing.input) +
    (outputTokens * config.pricing.output)
  ) / 1_000_000
}

const cost = estimateRequestCost('gpt-4.1-nano', 3000, 500)
console.log(`Cost: $${cost.toFixed(6)}`)  // "Cost: $0.001000"
```

### Example 3: Model Selection UI

```typescript
import { getActiveModels } from './models'

const models = getActiveModels()

const modelOptions = Object.values(models).map(config => ({
  value: config.model,
  label: config.name,
  description: `${config.contextWindow / 1000}K context, $${config.pricing?.input ?? 0}/1M input tokens`,
  contextWindow: config.contextWindow
}))

// Render in UI:
// [
//   {
//     value: "gpt-4.1-nano",
//     label: "GPT-4.1 Nano",
//     description: "128K context, $0.2/1M input tokens",
//     contextWindow: 128000
//   }
// ]
```

---

## Future Enhancements

### 1. Model Capabilities

```typescript
export const OPENAI_MODELS: Record<string, OpenAIModelConfig> = {
  'gpt-4.1-nano': {
    // ... existing fields
    capabilities: {
      functionCalling: true,
      vision: false,
      streaming: true,
      jsonMode: true,
    },
  },
}
```

### 2. Model Limits

```typescript
export const OPENAI_MODELS: Record<string, OpenAIModelConfig> = {
  'gpt-4.1-nano': {
    // ... existing fields
    limits: {
      maxTemperature: 2.0,
      minTemperature: 0.0,
      maxTopP: 1.0,
      minTopP: 0.0,
    },
  },
}
```

### 3. Model Categories

```typescript
export const OPENAI_MODELS: Record<string, OpenAIModelConfig> = {
  'gpt-4.1-nano': {
    // ... existing fields
    category: 'chat',
    tier: 'fast',
    recommended: true,
  },
}
```

---

## Summary

The **OpenAI Models Module** provides centralized model configuration:

**Core Components**:
- **`OPENAI_MODELS`**: Central registry of model configs
- **`getModelConfig(id)`**: Lookup by ID or alias
- **`getAllModelIds()`**: List all available IDs
- **`getActiveModels()`**: Filter non-deprecated models

**Current Models**: 1
- **GPT-4.1 Nano**: 128K context, $0.20/$0.80 pricing, 1024 default tokens, 0.7 temperature

**Model Configuration**:
- Model identifier and display name
- Context window (128K tokens)
- Default settings (1024 tokens, 0.7 temp)
- Pricing ($0.20 input, $0.80 output per 1M tokens)
- Aliases (for flexibility)
- Deprecation flag (for lifecycle management)

**Best Practices**:
- Keep pricing up to date
- Use descriptive names
- Set reasonable defaults
- Add aliases for usability
- Mark deprecated models (don't delete)

**Production Status**: Fully implemented configuration registry with GPT-4.1 Nano. Easy to add new models by extending `OPENAI_MODELS` object.
