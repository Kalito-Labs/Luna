# agent.ts - AI Agent Type Definitions

## Overview
`agent.ts` defines TypeScript interfaces for AI agent configuration, requests, and responses. These types ensure type safety when working with AI model agents across the Kalito backend and frontend applications.

---

## Type Definitions

### AgentConfig (Lines 5-49)

```typescript
export interface AgentConfig {
  modelName: string
  displayName: string
  bio: string
  description: string
  persona: string
  pricing: {
    input: number
    output: number
    currency: string
    unit: string
  }
  limits: {
    maxTokens: number
    maxInputTokens?: number
    maxOutputTokens?: number
    minTemperature: number
    maxTemperature: number
    temperatureStep: number
    minTopP?: number
    maxTopP?: number
    topPStep?: number
    minFrequencyPenalty?: number
    maxFrequencyPenalty?: number
    frequencyPenaltyStep?: number
    minPresencePenalty?: number
    maxPresencePenalty?: number
    presencePenaltyStep?: number
    allowedstrings?: string[]
  }
  defaultSettings: {
    temperature: number
    maxTokens: number
    topP: number
    frequencyPenalty: number
    presencePenalty: number
    outputFormat: string
  }
  guidelines: string[]
}
```

**Purpose:**
Defines the complete structure of an AI model agent configuration, mirroring the JSON configuration files (1.json, 2.json, 3.json) used by Kalito applications.

---

#### Property: modelName
```typescript
modelName: string
```

**What it is:** Unique identifier for the AI model

**Examples:**
```typescript
modelName: "gpt-4-turbo-preview"
modelName: "claude-3-opus-20240229"
modelName: "llama-3-70b"
```

**Use cases:**
- API routing (which model to call)
- Model selection in UI dropdowns
- Logging and analytics

---

#### Property: displayName
```typescript
displayName: string
```

**What it is:** Human-readable name shown in UI

**Examples:**
```typescript
displayName: "GPT-4 Turbo"
displayName: "Claude 3 Opus"
displayName: "Llama 3 70B"
```

**Why separate from modelName?**
- `modelName`: Technical identifier (API calls)
- `displayName`: User-friendly label (UI)

---

#### Property: bio
```typescript
bio: string
```

**What it is:** Short description of the model's capabilities

**Example:**
```typescript
bio: "Advanced reasoning and creative tasks with 128K context window"
```

**Use cases:**
- Model selection tooltips
- Marketing/documentation
- Help users choose appropriate model

---

#### Property: description
```typescript
description: string
```

**What it is:** Detailed explanation of model features and use cases

**Example:**
```typescript
description: "GPT-4 Turbo is OpenAI's most advanced model, optimized for instruction following, complex problem solving, and creative writing. Supports vision, function calling, and JSON mode."
```

---

#### Property: persona
```typescript
persona: string
```

**What it is:** Default system prompt/personality for the agent

**Example:**
```typescript
persona: "You are a helpful AI assistant focused on eldercare. Be empathetic, clear, and patient when discussing health topics."
```

**Use cases:**
- Sets default behavior/tone
- Can be overridden per request
- Ensures consistent agent personality

---

#### Object: pricing
```typescript
pricing: {
  input: number
  output: number
  currency: string
  unit: string
}
```

**What it is:** Cost structure for using the model

**Example:**
```typescript
pricing: {
  input: 0.01,      // $0.01 per...
  output: 0.03,     // $0.03 per...
  currency: "USD",
  unit: "1K tokens" // ...per 1,000 tokens
}
```

**Fields:**
- **input**: Cost per unit of input tokens
- **output**: Cost per unit of output tokens (often higher)
- **currency**: "USD", "EUR", etc.
- **unit**: Pricing basis (usually "1K tokens" or "1M tokens")

**Why separate input/output?**
- Most providers charge more for output tokens
- Input = user prompts, system prompts, context
- Output = model's response

**Real-world example:**
```typescript
// GPT-4 Turbo pricing (as of 2024)
pricing: {
  input: 0.01,
  output: 0.03,
  currency: "USD",
  unit: "1K tokens"
}

// For a conversation with:
// - 2,000 input tokens  = $0.02
// - 500 output tokens   = $0.015
// Total cost: $0.035
```

---

#### Object: limits
```typescript
limits: {
  maxTokens: number
  maxInputTokens?: number
  maxOutputTokens?: number
  minTemperature: number
  maxTemperature: number
  temperatureStep: number
  minTopP?: number
  maxTopP?: number
  topPStep?: number
  minFrequencyPenalty?: number
  maxFrequencyPenalty?: number
  frequencyPenaltyStep?: number
  minPresencePenalty?: number
  maxPresencePenalty?: number
  presencePenaltyStep?: number
  allowedstrings?: string[]
}
```

**What it is:** Constraints and boundaries for model parameters

**Purpose:**
- Enforce model provider limits
- Validate user inputs
- Configure UI sliders/inputs

---

##### Token Limits
```typescript
maxTokens: number           // Total context window
maxInputTokens?: number     // Max input (prompt + context)
maxOutputTokens?: number    // Max response length
```

**Example:**
```typescript
limits: {
  maxTokens: 128000,        // GPT-4 Turbo context window
  maxInputTokens: 127000,   // Reserve 1K for output
  maxOutputTokens: 4096,    // Max response length
  // ...
}
```

**Use cases:**
- Prevent exceeding context window
- UI validation (disable submit if prompt too long)
- Automatic truncation strategies

---

##### Temperature Settings
```typescript
minTemperature: number
maxTemperature: number
temperatureStep: number
```

**What is temperature?**
- Controls randomness/creativity
- 0.0 = deterministic, focused
- 1.0 = creative, varied
- 2.0 = very random (rare)

**Example:**
```typescript
limits: {
  minTemperature: 0.0,
  maxTemperature: 2.0,
  temperatureStep: 0.1,  // UI slider increments by 0.1
  // ...
}
```

**UI Implementation:**
```typescript
<Slider
  min={agentConfig.limits.minTemperature}
  max={agentConfig.limits.maxTemperature}
  step={agentConfig.limits.temperatureStep}
  value={temperature}
/>
```

---

##### Top-P (Nucleus Sampling)
```typescript
minTopP?: number
maxTopP?: number
topPStep?: number
```

**What is Top-P?**
- Alternative to temperature for controlling randomness
- 0.1 = only most likely tokens (focused)
- 1.0 = all tokens (diverse)

**Example:**
```typescript
limits: {
  minTopP: 0.0,
  maxTopP: 1.0,
  topPStep: 0.05,
  // ...
}
```

**Temperature vs Top-P:**
- Use **temperature** for general creativity control
- Use **top-P** for fine-tuned probability distribution
- Often used together (temp adjusts distribution, top-p filters)

---

##### Frequency & Presence Penalties
```typescript
minFrequencyPenalty?: number
maxFrequencyPenalty?: number
frequencyPenaltyStep?: number
minPresencePenalty?: number
maxPresencePenalty?: number
presencePenaltyStep?: number
```

**What are penalties?**
- **Frequency penalty**: Reduces repetition of frequent tokens
- **Presence penalty**: Encourages introducing new topics

**Example:**
```typescript
limits: {
  minFrequencyPenalty: 0.0,
  maxFrequencyPenalty: 2.0,
  frequencyPenaltyStep: 0.1,
  minPresencePenalty: 0.0,
  maxPresencePenalty: 2.0,
  presencePenaltyStep: 0.1,
  // ...
}
```

**Use cases:**
- **High frequency penalty**: Avoid repetitive lists, summaries
- **High presence penalty**: Encourage diverse topics, exploration
- **Low penalties**: Natural conversation flow

---

##### Allowed Formats
```typescript
allowedstrings?: string[]
```

**What it is:** Supported output formats (JSON mode, plain text, etc.)

**Example:**
```typescript
limits: {
  allowedstrings: ["text", "json", "json_object"],
  // ...
}
```

**Use cases:**
```typescript
// Request JSON response
settings: {
  outputFormat: "json_object"
}

// Model returns:
{
  "name": "John Doe",
  "age": 75,
  "medications": ["Lisinopril", "Metformin"]
}
```

---

#### Object: defaultSettings
```typescript
defaultSettings: {
  temperature: number
  maxTokens: number
  topP: number
  frequencyPenalty: number
  presencePenalty: number
  outputFormat: string
}
```

**What it is:** Default parameter values for the model

**Example:**
```typescript
defaultSettings: {
  temperature: 0.7,
  maxTokens: 2048,
  topP: 1.0,
  frequencyPenalty: 0.0,
  presencePenalty: 0.0,
  outputFormat: "text"
}
```

**Use cases:**
- Initial values in UI forms
- Fallback when user doesn't specify
- Recommended settings for the model

**Flow:**
```typescript
// User opens chat → UI uses defaults
const settings = agentConfig.defaultSettings

// User adjusts temperature → override default
settings.temperature = 0.9

// User sends message → use modified settings
await generateResponse({ ...settings })
```

---

#### Property: guidelines
```typescript
guidelines: string[]
```

**What it is:** Best practices and usage recommendations

**Example:**
```typescript
guidelines: [
  "Use temperature 0.2-0.5 for factual tasks",
  "Use temperature 0.7-1.0 for creative writing",
  "Enable JSON mode for structured data extraction",
  "Keep context under 100K tokens for best performance"
]
```

**Use cases:**
- Help tooltips in UI
- Documentation generation
- Onboarding new users

---

### Complete AgentConfig Example

```typescript
const gpt4TurboConfig: AgentConfig = {
  modelName: "gpt-4-turbo-preview",
  displayName: "GPT-4 Turbo",
  bio: "OpenAI's most advanced model with 128K context",
  description: "Optimized for complex reasoning, coding, and creative tasks. Supports vision and function calling.",
  persona: "You are a helpful AI assistant specializing in eldercare.",
  
  pricing: {
    input: 0.01,
    output: 0.03,
    currency: "USD",
    unit: "1K tokens"
  },
  
  limits: {
    maxTokens: 128000,
    maxInputTokens: 124000,
    maxOutputTokens: 4096,
    minTemperature: 0.0,
    maxTemperature: 2.0,
    temperatureStep: 0.1,
    minTopP: 0.0,
    maxTopP: 1.0,
    topPStep: 0.05,
    minFrequencyPenalty: 0.0,
    maxFrequencyPenalty: 2.0,
    frequencyPenaltyStep: 0.1,
    minPresencePenalty: 0.0,
    maxPresencePenalty: 2.0,
    presencePenaltyStep: 0.1,
    allowedstrings: ["text", "json_object"]
  },
  
  defaultSettings: {
    temperature: 0.7,
    maxTokens: 2048,
    topP: 1.0,
    frequencyPenalty: 0.0,
    presencePenalty: 0.0,
    outputFormat: "text"
  },
  
  guidelines: [
    "Use 0.2-0.5 temperature for factual queries",
    "Use 0.7-1.0 temperature for creative tasks",
    "Enable JSON mode for structured extraction"
  ]
}
```

---

## AgentRequest (Lines 54-69)

```typescript
export interface AgentRequest {
  input: string
  systemPrompt?: string
  modelName: string
  settings: {
    model: string
    temperature?: number
    maxTokens?: number
    topP?: number
    frequencyPenalty?: number
    presencePenalty?: number
    outputFormat?: string
  }
  fileIds?: string[]
  stream?: boolean
}
```

**Purpose:**
Canonical request payload sent to `/api/agent` endpoint for generating AI responses.

---

### Property: input
```typescript
input: string
```

**What it is:** The user's message/prompt

**Example:**
```typescript
input: "What medications should I take with food?"
```

---

### Property: systemPrompt
```typescript
systemPrompt?: string
```

**What it is:** Optional override for agent's system prompt

**Example:**
```typescript
systemPrompt: "You are a certified pharmacist. Provide medical advice based on current guidelines."
```

**Use cases:**
- Persona switching (doctor vs nurse vs caregiver)
- Task-specific instructions
- Context injection

---

### Property: modelName
```typescript
modelName: string
```

**What it is:** Which AI model to use

**Example:**
```typescript
modelName: "gpt-4-turbo-preview"
```

**Why needed?**
- Backend routes to correct model
- Determines pricing and limits
- Logs which model was used

---

### Object: settings
```typescript
settings: {
  model: string
  temperature?: number
  maxTokens?: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
  outputFormat?: string
}
```

**What it is:** Runtime parameters for the generation

**Example:**
```typescript
settings: {
  model: "gpt-4-turbo-preview",
  temperature: 0.7,
  maxTokens: 1024,
  topP: 0.9,
  frequencyPenalty: 0.5,
  presencePenalty: 0.3,
  outputFormat: "text"
}
```

**Note:** `settings.model` typically matches `modelName` (redundancy for compatibility)

---

### Property: fileIds
```typescript
fileIds?: string[]
```

**What it is:** IDs of uploaded files for context (vision, document analysis)

**Example:**
```typescript
fileIds: ["file-abc123", "file-def456"]
```

**Use cases:**
- Image analysis (medical scans, pill identification)
- Document processing (lab results, prescriptions)
- Multi-file comparisons

---

### Property: stream
```typescript
stream?: boolean
```

**What it is:** Enable streaming responses (tokens arrive incrementally)

**Example:**
```typescript
stream: true  // Get tokens as they're generated
stream: false // Wait for complete response (default)
```

**Streaming flow:**
```typescript
// Without streaming (stream: false)
const response = await fetch('/api/agent', { ... })
const data = await response.json()
console.log(data.reply)  // Full response at once

// With streaming (stream: true)
const response = await fetch('/api/agent', { ... })
const reader = response.body.getReader()
while (true) {
  const { done, value } = await reader.read()
  if (done) break
  console.log(value)  // Partial response, token by token
}
```

---

### Complete AgentRequest Example

```typescript
const request: AgentRequest = {
  input: "What are the side effects of Lisinopril?",
  systemPrompt: "You are a pharmacist assistant. Be concise and accurate.",
  modelName: "gpt-4-turbo-preview",
  settings: {
    model: "gpt-4-turbo-preview",
    temperature: 0.3,  // Low temp for factual answers
    maxTokens: 500,
    topP: 0.9,
    frequencyPenalty: 0.0,
    presencePenalty: 0.0,
    outputFormat: "text"
  },
  fileIds: [],
  stream: false
}

// Send to backend
const response = await fetch('/api/agent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(request)
})

const data: AgentResponse = await response.json()
console.log(data.reply)  // AI's answer
console.log(data.tokenUsage)  // Tokens used (for billing)
```

---

## AgentResponse (Lines 74-78)

```typescript
export interface AgentResponse {
  reply: string
  tokenUsage: number
  logs?: unknown[]
}
```

**Purpose:**
Canonical response payload returned from `/api/agent` endpoint after generation.

---

### Property: reply
```typescript
reply: string
```

**What it is:** The AI model's generated response

**Example:**
```typescript
reply: "Lisinopril is an ACE inhibitor used to treat high blood pressure. Common side effects include dry cough, dizziness, and headache. Rare but serious side effects include angioedema and kidney problems."
```

---

### Property: tokenUsage
```typescript
tokenUsage: number
```

**What it is:** Total tokens consumed (input + output)

**Example:**
```typescript
tokenUsage: 327  // 250 input + 77 output
```

**Use cases:**
- Cost calculation (tokens × price per token)
- Usage analytics
- Rate limiting

**Cost calculation example:**
```typescript
const response: AgentResponse = {
  reply: "...",
  tokenUsage: 327
}

// Using GPT-4 Turbo pricing
const inputTokens = 250
const outputTokens = 77
const cost = (inputTokens / 1000) * 0.01 + (outputTokens / 1000) * 0.03
// = (250/1000) * $0.01 + (77/1000) * $0.03
// = $0.0025 + $0.00231
// = $0.00481
```

---

### Property: logs
```typescript
logs?: unknown[]
```

**What it is:** Optional debugging/diagnostic information

**Example:**
```typescript
logs: [
  { event: "model_selected", model: "gpt-4-turbo-preview" },
  { event: "tokens_counted", input: 250, output: 77 },
  { event: "response_generated", duration: 1.2 }
]
```

**Use cases:**
- Development debugging
- Performance monitoring
- Audit trails

---

### Complete AgentResponse Example

```typescript
const response: AgentResponse = {
  reply: "Lisinopril is an ACE inhibitor commonly prescribed for hypertension. Main side effects include dry cough (10% of patients), dizziness upon standing, and mild headaches. Contact your doctor if you experience swelling of the face or difficulty breathing, as these may indicate a serious allergic reaction.",
  tokenUsage: 327,
  logs: [
    { timestamp: "2025-10-28T10:30:45Z", event: "request_received" },
    { timestamp: "2025-10-28T10:30:46Z", event: "model_invoked", model: "gpt-4-turbo-preview" },
    { timestamp: "2025-10-28T10:30:48Z", event: "response_completed", duration_ms: 1234 }
  ]
}
```

---

## Usage Patterns

### Pattern 1: Model Selection UI

```typescript
import type { AgentConfig } from './types/agent'

function ModelSelector({ configs }: { configs: AgentConfig[] }) {
  return (
    <select>
      {configs.map(config => (
        <option key={config.modelName} value={config.modelName}>
          {config.displayName} - {config.pricing.currency} {config.pricing.input}/{config.pricing.unit}
        </option>
      ))}
    </select>
  )
}
```

### Pattern 2: Settings Form

```typescript
function AgentSettings({ config }: { config: AgentConfig }) {
  const [temperature, setTemperature] = useState(config.defaultSettings.temperature)
  
  return (
    <div>
      <label>Temperature ({config.limits.minTemperature} - {config.limits.maxTemperature})</label>
      <input
        type="range"
        min={config.limits.minTemperature}
        max={config.limits.maxTemperature}
        step={config.limits.temperatureStep}
        value={temperature}
        onChange={(e) => setTemperature(Number(e.target.value))}
      />
    </div>
  )
}
```

### Pattern 3: API Request

```typescript
async function sendMessage(message: string, config: AgentConfig) {
  const request: AgentRequest = {
    input: message,
    modelName: config.modelName,
    settings: {
      model: config.modelName,
      ...config.defaultSettings
    },
    stream: false
  }
  
  const response = await fetch('/api/agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  })
  
  const data: AgentResponse = await response.json()
  
  return {
    message: data.reply,
    cost: calculateCost(data.tokenUsage, config.pricing)
  }
}

function calculateCost(tokens: number, pricing: AgentConfig['pricing']) {
  // Simplified - assumes equal input/output split
  const avgCost = (pricing.input + pricing.output) / 2
  return (tokens / 1000) * avgCost
}
```

### Pattern 4: Streaming Response

```typescript
async function* streamResponse(request: AgentRequest) {
  const streamingRequest: AgentRequest = { ...request, stream: true }
  
  const response = await fetch('/api/agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(streamingRequest)
  })
  
  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    
    const text = decoder.decode(value)
    yield text
  }
}

// Usage:
for await (const token of streamResponse(request)) {
  console.log(token)  // Display token immediately
  appendToUI(token)
}
```

---

## Integration with Backend

### Loading Agent Configurations

```typescript
// Backend: Load from JSON files
import fs from 'fs'
import type { AgentConfig } from './types/agent'

function loadAgentConfigs(): AgentConfig[] {
  const configFiles = ['1.json', '2.json', '3.json']
  return configFiles.map(file => 
    JSON.parse(fs.readFileSync(`./configs/${file}`, 'utf-8'))
  )
}

// API endpoint
app.get('/api/models', (req, res) => {
  const configs = loadAgentConfigs()
  return okList(res, configs)
})
```

### Processing Agent Request

```typescript
// Backend: /api/agent endpoint
app.post('/api/agent', async (req, res) => {
  const request: AgentRequest = req.body
  
  // Validate
  const config = getConfigByModelName(request.modelName)
  if (!config) {
    return err(res, 'NOT_FOUND', 'Model not found')
  }
  
  // Check limits
  if (request.settings.temperature > config.limits.maxTemperature) {
    return err(res, 'VALIDATION_ERROR', 'Temperature exceeds limit')
  }
  
  // Generate
  const result = await generateResponse(request)
  
  const response: AgentResponse = {
    reply: result.text,
    tokenUsage: result.tokens,
    logs: [{ timestamp: new Date().toISOString(), event: 'completed' }]
  }
  
  return okItem(res, response)
})
```

---

## Best Practices

### 1. Validate Against Limits
```typescript
function validateSettings(settings: AgentRequest['settings'], config: AgentConfig): string | null {
  if (settings.temperature && settings.temperature > config.limits.maxTemperature) {
    return `Temperature must be ≤ ${config.limits.maxTemperature}`
  }
  if (settings.maxTokens && settings.maxTokens > config.limits.maxTokens) {
    return `Max tokens must be ≤ ${config.limits.maxTokens}`
  }
  return null
}
```

### 2. Use Default Settings as Fallback
```typescript
function mergeSettings(userSettings: Partial<AgentRequest['settings']>, config: AgentConfig) {
  return {
    ...config.defaultSettings,
    ...userSettings
  }
}
```

### 3. Track Token Usage
```typescript
const usageLog: Array<{ model: string; tokens: number; cost: number }> = []

function logUsage(modelName: string, response: AgentResponse, pricing: AgentConfig['pricing']) {
  const cost = (response.tokenUsage / 1000) * ((pricing.input + pricing.output) / 2)
  usageLog.push({ model: modelName, tokens: response.tokenUsage, cost })
}
```

### 4. Handle Streaming Properly
```typescript
async function handleStreamingResponse(request: AgentRequest) {
  if (!request.stream) {
    // Non-streaming: return full response
    return await generateResponse(request)
  }
  
  // Streaming: return SSE stream
  const stream = new ReadableStream({
    async start(controller) {
      for await (const token of generateStreamingResponse(request)) {
        controller.enqueue(new TextEncoder().encode(`data: ${token}\n\n`))
      }
      controller.close()
    }
  })
  
  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream' }
  })
}
```

---

## Summary

**agent.ts defines three core interfaces:**

### AgentConfig
- **Complete model specification** (capabilities, limits, pricing)
- **Mirrors JSON config files** (1.json, 2.json, 3.json)
- **Supports UI generation** (sliders, dropdowns, validators)

### AgentRequest
- **Canonical request format** for `/api/agent`
- **Includes settings, context, streaming** control
- **Flexible** (all settings optional except input/modelName)

### AgentResponse
- **Standardized response** (reply + token usage)
- **Includes debugging logs** (optional)
- **Enables cost tracking** (token usage × pricing)

**Key benefits:**
- Type safety across frontend/backend
- Automatic validation against model limits
- Consistent API contract
- Easy to add new models (just add JSON config)
