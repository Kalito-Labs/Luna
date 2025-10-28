# Tools Documentation

## Overview

The `tools.ts` file implements the **function calling system** for AI agents, defining tools that models can invoke to perform external actions like web search.

**Location**: `/backend/logic/tools.ts`

**Primary Responsibilities**:
- Define available tools (function schemas)
- Execute tool calls with validated arguments
- Format tool results for AI consumption
- Handle tool execution errors gracefully

**Key Concept**: **Function Calling (Tool Use)**
- AI models can "call" predefined functions
- Models generate structured function calls (JSON)
- Backend executes functions and returns results
- Models incorporate results into responses

**Integration Points**:
- Used by `agentService` during two-phase tool calling
- Calls `tavilyService` for web search execution
- OpenAI function calling format (standard)

---

## Architecture Overview

### Function Calling Flow

```
User: "What are the latest treatments for Parkinson's?"
       ↓
Agent recognizes need for current information
       ↓
Model generates tool call:
{
  "name": "web_search",
  "arguments": {
    "query": "latest Parkinson's disease treatments 2025",
    "max_results": 5
  }
}
       ↓
agentService.runAgent() detects tool call
       ↓
executeToolCall("web_search", { query: "...", max_results: 5 })
       ↓
┌─────────────────────────────────────┐
│   tools.ts                          │
├─────────────────────────────────────┤
│ 1. Validate function name           │
│ 2. Validate arguments                │
│ 3. Call searchWeb()                  │
│ 4. Format results                    │
│ 5. Return JSON string                │
└─────────────────────────────────────┘
       ↓
tavilyService.searchWeb()
       ↓
Tool Response (JSON string):
{
  "query": "latest Parkinson's disease treatments 2025",
  "answer": "Recent advances in Parkinson's treatment include...",
  "sources": [
    { "title": "NIH - Parkinson's Research", "url": "...", "excerpt": "..." }
  ],
  "results_count": 5
}
       ↓
Agent sends tool response back to model
       ↓
Model generates final response:
"Based on recent research, the latest treatments include..."
```

### Component Dependencies

```typescript
// Services
import { searchWeb } from './tavilyService'

// Type definitions
import type { SearchOptions } from '../types/search'
```

**Dependencies**:
- `tavilyService` - Web search execution
- `../types/search` - Type safety for search options

---

## Tool Definitions

### AVAILABLE_TOOLS

```typescript
export const AVAILABLE_TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'web_search',
      description: '...',
      parameters: { ... }
    },
  },
] as const
```

**Purpose**: Array of tool definitions in OpenAI function calling format.

**Type**: Readonly tuple (`as const`) for type safety.

**Structure**: OpenAI Function Calling Schema
- `type`: Always `'function'`
- `function.name`: Function identifier
- `function.description`: When/how to use the function
- `function.parameters`: JSON Schema for arguments

**Current Tools**: 1 tool (web_search)

**Future**: Can add more tools (calculator, database_query, send_email, etc.)

---

## Web Search Tool

### Tool Schema

```typescript
{
  type: 'function' as const,
  function: {
    name: 'web_search',
    description: 'Search the internet for current information, news, facts, or research. Use this when you need up-to-date information that may not be in your training data, or when the user explicitly asks you to search online or look something up. Returns AI-generated answer along with source URLs.',
    parameters: {
      type: 'object',
      properties: {
        query: { ... },
        max_results: { ... },
        include_answer: { ... },
        search_depth: { ... },
      },
      required: ['query'],
    },
  },
}
```

### Description Field

```typescript
description: 'Search the internet for current information, news, facts, or research. Use this when you need up-to-date information that may not be in your training data, or when the user explicitly asks you to search online or look something up. Returns AI-generated answer along with source URLs.'
```

**Purpose**: Instructs the model WHEN and HOW to use the tool.

**Key Phrases**:
- **"current information"** → Triggers for recent events
- **"news, facts, or research"** → Specific use cases
- **"not in your training data"** → Knowledge cutoff trigger
- **"explicitly asks"** → User intent ("search for", "look up")
- **"AI-generated answer"** → Sets expectation for output

**Why This Matters**:
- Models use description to decide when to call function
- Good descriptions = better tool usage
- Bad descriptions = unused or misused tools

### Parameters

#### query (Required)

```typescript
query: {
  type: 'string',
  description: 'The search query. Be specific and clear. Examples: "latest research on carbidopa-levodopa side effects", "current treatment guidelines for Parkinson\'s disease"',
}
```

**Type**: String (required)

**Description Strategy**:
- Clear instruction: "Be specific and clear"
- Examples provided (critical for good prompts!)
- Domain-specific examples (eldercare context)

**Why Examples Matter**:
```typescript
// Without examples, model might generate:
{ "query": "medicine" }  // ❌ Too vague

// With examples, model generates:
{ "query": "carbidopa-levodopa side effects in elderly patients" }  // ✅ Specific
```

#### max_results (Optional)

```typescript
max_results: {
  type: 'number',
  description: 'Maximum number of search results to return (1-10). Default is 5.',
  minimum: 1,
  maximum: 10,
}
```

**Type**: Number (optional)

**Range**: 1-10 (enforced by JSON Schema)

**Default**: 5 (handled in execution)

**Why Limit to 10?**
- More results = more tokens
- 10 results ≈ 2000-5000 tokens
- Protects context window
- Note: tavilyService has hard limit of 20, this is more conservative

#### include_answer (Optional)

```typescript
include_answer: {
  type: 'boolean',
  description: 'Whether to include an AI-generated answer based on search results. Highly recommended. Default is true.',
}
```

**Type**: Boolean (optional)

**Default**: `true` (handled in execution)

**Recommendation**: "Highly recommended"
- AI answer is most useful output
- Saves model from parsing results
- Direct answer to user's question

**When to Use `false`**:
- Want raw sources without interpretation
- Need to parse results manually
- Rare use case

#### search_depth (Optional)

```typescript
search_depth: {
  type: 'string',
  enum: ['basic', 'advanced'],
  description: 'Search depth: "basic" for quick results, "advanced" for more comprehensive search. Default is "basic".',
}
```

**Type**: Enum (`'basic'` | `'advanced'`)

**Default**: `'basic'` (handled in execution)

**Comparison**:

| Aspect | Basic | Advanced |
|--------|-------|----------|
| Speed | Fast (~1s) | Slow (~3s) |
| Cost | Low | Higher |
| Depth | Surface-level | Comprehensive |
| Use Case | Most queries | Complex research |

**Model Decision**:
- Most queries → `'basic'` (default)
- Complex research → `'advanced'`

---

## Tool Execution

### executeToolCall

```typescript
export async function executeToolCall(
  functionName: string,
  functionArgs: Record<string, unknown>
): Promise<string>
```

**Purpose**: Execute a tool call and return formatted results.

**Parameters**:
- `functionName` - Name of the function to execute
- `functionArgs` - Arguments object (untyped from model)

**Returns**: JSON string (formatted results or error)

**Why Return String?**
- OpenAI expects tool results as strings
- Consistent format for all tools
- Easy to serialize complex objects

#### Implementation Flow

**Step 1: Log Execution**
```typescript
console.log(`[Tools] Executing tool: ${functionName}`, functionArgs)
```

**Purpose**: Debug logging for tool usage monitoring.

**Step 2: Function Routing (Switch Statement)**
```typescript
switch (functionName) {
  case 'web_search': {
    // Web search execution
  }
  
  default:
    return JSON.stringify({
      error: `Unknown tool: ${functionName}`
    })
}
```

**Pattern**: Switch statement for multiple tools.

**Future**: Could use a registry pattern like `modelRegistry`.

**Step 3: Argument Extraction & Type Assertion**
```typescript
const { query, max_results, include_answer, search_depth } = functionArgs as {
  query: string
  max_results?: number
  include_answer?: boolean
  search_depth?: 'basic' | 'advanced'
}
```

**Type Assertion**: `as { ... }`
- `functionArgs` is untyped from model
- Type assertion for TypeScript
- Validation happens next (don't trust assertion!)

**Step 4: Argument Validation**
```typescript
if (!query || typeof query !== 'string') {
  return JSON.stringify({
    error: 'Invalid query parameter. Query must be a non-empty string.',
  })
}
```

**Validation Level**: Minimal (only required fields)

**Why Minimal?**
- Optional parameters have defaults
- `tavilyService.searchWeb()` does comprehensive validation
- No need to duplicate validation logic

**Philosophy**: **Defense in Depth**
- Tool validates required fields
- Service validates all fields + business logic
- Multiple validation layers prevent bugs

**Step 5: Build Options Object**
```typescript
const options: SearchOptions = {
  max_results: max_results ?? 5,
  include_answer: include_answer ?? true,
  search_depth: search_depth ?? 'basic',
}
```

**Nullish Coalescing (`??`)**: Use default if undefined/null.

**Defaults Match Tool Schema**:
- `max_results: 5` (schema says "Default is 5")
- `include_answer: true` (schema says "Default is true")
- `search_depth: 'basic'` (schema says "Default is 'basic'")

**Step 6: Execute Search**
```typescript
const results = await searchWeb(query, options)
```

**Delegation**: Tool doesn't implement search logic, delegates to service.

**Separation of Concerns**:
- `tools.ts` - Function calling interface
- `tavilyService.ts` - Search implementation

**Step 7: Format Results**
```typescript
const formattedResults = {
  query: results.query,
  answer: results.answer,
  sources: results.results.map((r) => ({
    title: r.title,
    url: r.url,
    excerpt: r.content.substring(0, 300), // Limit excerpt length
  })),
  results_count: results.results_count,
}
```

**Formatting Strategy**: Simplify for model consumption.

**Changes from Raw Results**:
1. **Excerpt Truncation**: `content.substring(0, 300)`
   - Full content can be 500+ tokens per result
   - 300 chars ≈ 75 tokens (reasonable)
   - Model gets preview, not full text

2. **Field Selection**:
   - Include: query, answer, sources, results_count
   - Exclude: response_time, score, raw_content, images
   - Reduces token usage

3. **Nested Sources**:
   - Organize as array of objects
   - Clear structure for model to parse

**Token Optimization**:
```typescript
// Before formatting (5 results):
{
  answer: "...",
  results: [
    {
      title: "...",
      url: "...",
      content: "... (500 chars)",  // ~125 tokens
      score: 0.95,
      raw_content: null
    },
    // ... 4 more results
  ],
  images: [...],
  response_time: 847
}
// Total: ~3000 tokens

// After formatting (5 results):
{
  "query": "...",
  "answer": "...",
  "sources": [
    {
      "title": "...",
      "url": "...",
      "excerpt": "... (300 chars)"  // ~75 tokens
    },
    // ... 4 more results
  ],
  "results_count": 5
}
// Total: ~1500 tokens (50% reduction!)
```

**Step 8: Return JSON String**
```typescript
return JSON.stringify(formattedResults, null, 2)
```

**Format**: Pretty-printed JSON (2-space indent)

**Why Pretty Print?**
- More readable for model
- Slight token increase, but better comprehension
- Easier debugging (humans can read logs)

**Alternative** (production optimization):
```typescript
return JSON.stringify(formattedResults)  // No pretty print (fewer tokens)
```

**Step 9: Error Handling**
```typescript
catch (error) {
  console.error('[Tools] Web search failed:', error)
  return JSON.stringify({
    error: `Web search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
  })
}
```

**Error Strategy**: **Graceful Degradation**
- Catch errors (don't crash)
- Return error as JSON string (consistent format)
- Log error for debugging
- Model receives error and can inform user

**Error Response Format**:
```json
{
  "error": "Web search failed: TAVILY_API_KEY not configured"
}
```

---

## Tool Response Formats

### Successful Web Search Response

```json
{
  "query": "latest research on carbidopa-levodopa side effects",
  "answer": "Recent research indicates that carbidopa-levodopa, the gold standard for Parkinson's disease treatment, can cause several side effects including dyskinesia (involuntary movements), nausea, and orthostatic hypotension...",
  "sources": [
    {
      "title": "Carbidopa-Levodopa: Side Effects & Management - Mayo Clinic",
      "url": "https://www.mayoclinic.org/drugs-supplements/carbidopa-levodopa/side-effects",
      "excerpt": "Carbidopa-levodopa is the most effective medication for Parkinson's disease. Common side effects include nausea, dizziness, and low blood pressure. Long-term use may lead to dyskinesia, which are involuntary movements that can be..."
    },
    {
      "title": "Recent Advances in Levodopa Therapy - NIH",
      "url": "https://www.nih.gov/news-events/research-updates/levodopa",
      "excerpt": "New formulations of carbidopa-levodopa aim to reduce motor fluctuations and dyskinesia. Extended-release versions provide more stable blood levels, reducing off periods. Research continues into combination therapies that may..."
    },
    {
      "title": "Managing Levodopa Side Effects in Elderly Patients",
      "url": "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC123456",
      "excerpt": "Elderly patients on levodopa therapy require careful monitoring due to increased risk of orthostatic hypotension and cognitive effects. Dose adjustments and timing can help minimize side effects while maintaining efficacy..."
    }
  ],
  "results_count": 3
}
```

**Structure**:
- `query` - Echo of search query
- `answer` - AI-generated direct answer (most valuable!)
- `sources` - Array of source objects
  - `title` - Page title
  - `url` - Source URL
  - `excerpt` - Content preview (300 chars)
- `results_count` - Number of sources

**Token Estimate**: ~1000-1500 tokens (3 sources)

### Error Response

```json
{
  "error": "Web search failed: Search query cannot be empty"
}
```

**Structure**: Single `error` field with message.

**Error Types**:
1. **Validation Error**: "Invalid query parameter. Query must be a non-empty string."
2. **Service Error**: "Web search failed: TAVILY_API_KEY not configured"
3. **Unknown Tool**: "Unknown tool: invalid_function_name"

---

## Agent Integration

### Two-Phase Tool Calling

**Phase 1: Tool Call Detection**
```typescript
// In agentService.runAgent()

const response = await adapter.generate({
  messages: [...],
  tools: AVAILABLE_TOOLS,  // ← Provide tools
  settings: { ... }
})

// Check for tool calls
if (response.tool_calls && response.tool_calls.length > 0) {
  // Phase 2: Tool execution
}
```

**Phase 2: Tool Execution**
```typescript
// Execute each tool call
const toolResults = await Promise.all(
  response.tool_calls.map(async (toolCall) => {
    const result = await executeToolCall(
      toolCall.function.name,
      toolCall.function.arguments
    )
    
    return {
      tool_call_id: toolCall.id,
      role: 'tool' as const,
      content: result
    }
  })
)

// Send tool results back to model
const finalResponse = await adapter.generate({
  messages: [
    ...messages,
    { role: 'assistant', content: response.content, tool_calls: response.tool_calls },
    ...toolResults
  ],
  settings: { ... }
})

return finalResponse
```

### Complete Flow Example

**User Query**: "What are the side effects of metformin?"

**Step 1: Initial Request**
```typescript
const response = await runAgent({
  input: "What are the side effects of metformin?",
  sessionId: "session-123",
  modelName: "gpt-4.1-nano"
})
```

**Step 2: Model Generates Tool Call**
```json
{
  "role": "assistant",
  "content": null,
  "tool_calls": [
    {
      "id": "call_abc123",
      "type": "function",
      "function": {
        "name": "web_search",
        "arguments": "{\"query\":\"metformin side effects\",\"max_results\":5}"
      }
    }
  ]
}
```

**Step 3: Execute Tool**
```typescript
const result = await executeToolCall(
  "web_search",
  { query: "metformin side effects", max_results: 5 }
)

// result = JSON string with search results
```

**Step 4: Send Tool Result to Model**
```typescript
const messages = [
  { role: "user", content: "What are the side effects of metformin?" },
  { 
    role: "assistant", 
    content: null, 
    tool_calls: [...] 
  },
  {
    role: "tool",
    tool_call_id: "call_abc123",
    content: result  // JSON string from executeToolCall
  }
]

const finalResponse = await adapter.generate({ messages, ... })
```

**Step 5: Model Generates Final Response**
```typescript
{
  "role": "assistant",
  "content": "Based on current medical information, metformin's side effects include:\n\n**Common side effects:**\n- Nausea and vomiting\n- Diarrhea\n- Stomach upset\n- Metallic taste\n\n**Less common but serious:**\n- Lactic acidosis (rare but serious)\n- Vitamin B12 deficiency with long-term use\n\n**Sources:**\n- Mayo Clinic: https://www.mayoclinic.org/drugs-supplements/metformin\n- NIH: https://www.nih.gov/..."
}
```

---

## Extension Patterns

### Adding New Tools

**Pattern**: Define tool schema → Add case to switch statement.

**Example: Calculator Tool**

**Step 1: Add Tool Schema**
```typescript
export const AVAILABLE_TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'web_search',
      // ... existing web_search definition
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'calculator',
      description: 'Perform mathematical calculations. Use this for complex math that requires precision.',
      parameters: {
        type: 'object',
        properties: {
          expression: {
            type: 'string',
            description: 'Mathematical expression to evaluate. Examples: "2 + 2", "sqrt(144)", "15% of 200"',
          },
        },
        required: ['expression'],
      },
    },
  },
] as const
```

**Step 2: Add Execution Case**
```typescript
export async function executeToolCall(
  functionName: string,
  functionArgs: Record<string, unknown>
): Promise<string> {
  switch (functionName) {
    case 'web_search': {
      // ... existing web_search implementation
    }
    
    case 'calculator': {
      const { expression } = functionArgs as { expression: string }
      
      if (!expression || typeof expression !== 'string') {
        return JSON.stringify({
          error: 'Invalid expression parameter'
        })
      }
      
      try {
        // Safe expression evaluation (use a library like math.js)
        const result = evaluateExpression(expression)
        
        return JSON.stringify({
          expression,
          result,
          explanation: `${expression} = ${result}`
        })
      } catch (error) {
        return JSON.stringify({
          error: `Calculation failed: ${error.message}`
        })
      }
    }
    
    default:
      return JSON.stringify({
        error: `Unknown tool: ${functionName}`
      })
  }
}
```

### Eldercare-Specific Tools

**Example: Medication Lookup Tool**

```typescript
{
  type: 'function' as const,
  function: {
    name: 'get_patient_medications',
    description: 'Retrieve current medications for a patient. Use this when user asks about medications for a specific patient.',
    parameters: {
      type: 'object',
      properties: {
        patient_name: {
          type: 'string',
          description: 'Patient name or reference (e.g., "dad", "mom", "John")',
        },
      },
      required: ['patient_name'],
    },
  },
}
```

**Execution**:
```typescript
case 'get_patient_medications': {
  const { patient_name } = functionArgs as { patient_name: string }
  
  // Find patient using eldercareContextService
  const patient = await eldercareContextService.findPatientByReference(patient_name)
  
  if (!patient) {
    return JSON.stringify({
      error: `Patient "${patient_name}" not found`
    })
  }
  
  // Get medications
  const medications = await eldercareContextService.getMedications(patient.id)
  
  return JSON.stringify({
    patient: patient.name,
    medications: medications.map(m => ({
      name: m.medication_name,
      dosage: m.dosage,
      frequency: m.frequency,
      instructions: m.instructions
    }))
  })
}
```

**Example: Appointment Scheduling Tool**

```typescript
{
  type: 'function' as const,
  function: {
    name: 'schedule_appointment',
    description: 'Schedule a medical appointment for a patient. Use when user wants to create a new appointment.',
    parameters: {
      type: 'object',
      properties: {
        patient_name: {
          type: 'string',
          description: 'Patient name',
        },
        provider_name: {
          type: 'string',
          description: 'Healthcare provider name',
        },
        date: {
          type: 'string',
          description: 'Appointment date (YYYY-MM-DD format)',
        },
        time: {
          type: 'string',
          description: 'Appointment time (HH:MM format)',
        },
        reason: {
          type: 'string',
          description: 'Reason for appointment',
        },
      },
      required: ['patient_name', 'provider_name', 'date', 'time', 'reason'],
    },
  },
}
```

---

## Best Practices

### 1. Write Clear Tool Descriptions

```typescript
// ✅ GOOD: Clear description with use cases
description: 'Search the internet for current information, news, facts, or research. Use this when you need up-to-date information that may not be in your training data, or when the user explicitly asks you to search online or look something up.'

// ❌ BAD: Vague description
description: 'Search the web'
```

**Why**: Model uses description to decide when to use tool.

### 2. Provide Parameter Examples

```typescript
// ✅ GOOD: Examples guide model
query: {
  type: 'string',
  description: 'The search query. Be specific and clear. Examples: "latest research on carbidopa-levodopa side effects", "current treatment guidelines for Parkinson\'s disease"',
}

// ❌ BAD: No guidance
query: {
  type: 'string',
  description: 'Search query',
}
```

### 3. Set Reasonable Parameter Constraints

```typescript
// ✅ GOOD: Constrained range
max_results: {
  type: 'number',
  minimum: 1,
  maximum: 10,  // Protects context window
}

// ❌ BAD: No constraints
max_results: {
  type: 'number',
}
```

### 4. Validate Required Parameters

```typescript
// ✅ GOOD: Validate before execution
if (!query || typeof query !== 'string') {
  return JSON.stringify({
    error: 'Invalid query parameter. Query must be a non-empty string.',
  })
}

// ❌ BAD: Trust model output
const results = await searchWeb(query)  // Might crash!
```

### 5. Format Tool Results for Token Efficiency

```typescript
// ✅ GOOD: Truncate excerpts
sources: results.results.map((r) => ({
  title: r.title,
  url: r.url,
  excerpt: r.content.substring(0, 300),  // Limit tokens
}))

// ❌ BAD: Include full content
sources: results.results.map((r) => ({
  title: r.title,
  url: r.url,
  content: r.content,  // Could be 500+ tokens each!
}))
```

### 6. Return Consistent Error Format

```typescript
// ✅ GOOD: Consistent error structure
return JSON.stringify({
  error: `Web search failed: ${error.message}`
})

// ❌ BAD: Throw errors
throw new Error('Search failed')  // Crashes agent!
```

**Why**: Tool execution should never crash the agent.

### 7. Log Tool Execution

```typescript
// ✅ GOOD: Log for debugging
console.log(`[Tools] Executing tool: ${functionName}`, functionArgs)

// Track usage
console.log('[Tools] Web search completed in 847ms')
```

**Benefits**:
- Debug tool usage patterns
- Monitor performance
- Identify errors

---

## Testing Strategies

### Unit Tests

```typescript
import { executeToolCall, AVAILABLE_TOOLS } from './tools'

describe('tools', () => {
  describe('AVAILABLE_TOOLS', () => {
    it('should have web_search tool', () => {
      const webSearch = AVAILABLE_TOOLS.find(
        t => t.function.name === 'web_search'
      )
      
      expect(webSearch).toBeDefined()
      expect(webSearch?.function.description).toContain('Search the internet')
    })

    it('should require query parameter', () => {
      const webSearch = AVAILABLE_TOOLS.find(
        t => t.function.name === 'web_search'
      )
      
      expect(webSearch?.function.parameters.required).toContain('query')
    })

    it('should have optional max_results', () => {
      const webSearch = AVAILABLE_TOOLS.find(
        t => t.function.name === 'web_search'
      )
      
      const maxResults = webSearch?.function.parameters.properties.max_results
      expect(maxResults).toBeDefined()
      expect(maxResults?.minimum).toBe(1)
      expect(maxResults?.maximum).toBe(10)
    })
  })

  describe('executeToolCall', () => {
    it('should return error for missing query', async () => {
      const result = await executeToolCall('web_search', {})
      const parsed = JSON.parse(result)
      
      expect(parsed.error).toContain('Invalid query parameter')
    })

    it('should return error for unknown tool', async () => {
      const result = await executeToolCall('unknown_tool', {})
      const parsed = JSON.parse(result)
      
      expect(parsed.error).toContain('Unknown tool: unknown_tool')
    })

    it('should execute web search with valid arguments', async () => {
      // Mock searchWeb
      jest.mock('./tavilyService', () => ({
        searchWeb: jest.fn().mockResolvedValue({
          query: 'test query',
          answer: 'Test answer',
          results: [
            {
              title: 'Test Result',
              url: 'https://example.com',
              content: 'Test content with more than 300 characters...'.repeat(10)
            }
          ],
          results_count: 1
        })
      }))

      const result = await executeToolCall('web_search', {
        query: 'test query'
      })
      
      const parsed = JSON.parse(result)
      
      expect(parsed.query).toBe('test query')
      expect(parsed.answer).toBe('Test answer')
      expect(parsed.sources).toHaveLength(1)
      expect(parsed.sources[0].excerpt.length).toBeLessThanOrEqual(300)
    })

    it('should handle search errors gracefully', async () => {
      jest.mock('./tavilyService', () => ({
        searchWeb: jest.fn().mockRejectedValue(new Error('API key not configured'))
      }))

      const result = await executeToolCall('web_search', {
        query: 'test query'
      })
      
      const parsed = JSON.parse(result)
      
      expect(parsed.error).toContain('Web search failed')
      expect(parsed.error).toContain('API key not configured')
    })

    it('should use default values for optional parameters', async () => {
      const searchWebMock = jest.fn().mockResolvedValue({
        query: 'test',
        answer: 'answer',
        results: [],
        results_count: 0
      })

      jest.mock('./tavilyService', () => ({
        searchWeb: searchWebMock
      }))

      await executeToolCall('web_search', {
        query: 'test'
      })

      expect(searchWebMock).toHaveBeenCalledWith(
        'test',
        expect.objectContaining({
          max_results: 5,
          include_answer: true,
          search_depth: 'basic'
        })
      )
    })
  })
})
```

### Integration Tests

```typescript
describe('tools integration', () => {
  // Requires Tavily API key
  const skipIfNotConfigured = () => {
    if (!process.env.TAVILY_API_KEY) {
      console.log('Skipping integration tests - Tavily not configured')
      return true
    }
    return false
  }

  it('should execute real web search', async () => {
    if (skipIfNotConfigured()) return

    const result = await executeToolCall('web_search', {
      query: 'capital of France',
      max_results: 3
    })

    const parsed = JSON.parse(result)

    expect(parsed.query).toBe('capital of France')
    expect(parsed.answer).toContain('Paris')
    expect(parsed.sources.length).toBeGreaterThan(0)
    expect(parsed.sources[0]).toHaveProperty('title')
    expect(parsed.sources[0]).toHaveProperty('url')
    expect(parsed.sources[0]).toHaveProperty('excerpt')
  })

  it('should respect max_results parameter', async () => {
    if (skipIfNotConfigured()) return

    const result = await executeToolCall('web_search', {
      query: 'Python programming',
      max_results: 2
    })

    const parsed = JSON.parse(result)

    expect(parsed.sources.length).toBeLessThanOrEqual(2)
  })

  it('should use advanced search depth', async () => {
    if (skipIfNotConfigured()) return

    const startTime = Date.now()

    const result = await executeToolCall('web_search', {
      query: 'machine learning algorithms',
      search_depth: 'advanced',
      max_results: 5
    })

    const duration = Date.now() - startTime

    const parsed = JSON.parse(result)

    expect(parsed.sources.length).toBeGreaterThan(0)
    expect(duration).toBeGreaterThan(1000) // Advanced search is slower
  })
})
```

---

## Performance Considerations

### Token Usage

**Tool Response Size**:
- Minimal (1 source): ~300 tokens
- Small (3 sources): ~1000 tokens
- Medium (5 sources): ~1500 tokens
- Large (10 sources): ~3000 tokens

**Optimization Strategies**:
1. Limit `max_results` to 3-5
2. Truncate excerpts (300 chars max)
3. Exclude unnecessary fields (score, response_time)
4. Use compact JSON (no pretty print in production)

**Before Optimization** (5 sources):
```json
{
  "query": "...",
  "answer": "...",
  "sources": [
    {
      "title": "...",
      "url": "...",
      "excerpt": "..." // Full content (500+ chars)
    },
    // ... 4 more
  ],
  "results_count": 5,
  "response_time": 847,
  "images": []
}
// ~3500 tokens
```

**After Optimization** (5 sources):
```json
{"query":"...","answer":"...","sources":[{"title":"...","url":"...","excerpt":"..."}],"results_count":5}
// ~1200 tokens (66% reduction!)
```

### Execution Time

**Web Search Tool**:
- Basic search: 500-1500ms
- Advanced search: 1500-3000ms
- Total agent time: +1-3 seconds

**Impact on User Experience**:
- Tool calling adds latency
- Users see "thinking" indicator
- Worth it for accurate, current information

**Optimization**:
- Cache frequent queries (future)
- Parallel tool execution (if multiple tools)
- Streaming tool results (future)

---

## Future Enhancements

### 1. Tool Registry Pattern

**Current**: Switch statement (simple but verbose).

**Future**: Registry pattern (scalable).

```typescript
// Tool registry
const toolRegistry = new Map<string, ToolExecutor>()

interface ToolExecutor {
  execute: (args: Record<string, unknown>) => Promise<string>
}

// Register tools
toolRegistry.set('web_search', {
  execute: async (args) => {
    // Web search logic
  }
})

// Execute
export async function executeToolCall(
  functionName: string,
  functionArgs: Record<string, unknown>
): Promise<string> {
  const tool = toolRegistry.get(functionName)
  
  if (!tool) {
    return JSON.stringify({ error: `Unknown tool: ${functionName}` })
  }
  
  return await tool.execute(functionArgs)
}
```

### 2. Parallel Tool Execution

**Current**: Sequential execution.

**Future**: Execute multiple tool calls in parallel.

```typescript
// If model calls multiple tools at once
const toolResults = await Promise.all(
  toolCalls.map(tc => executeToolCall(tc.function.name, tc.function.arguments))
)
```

### 3. Tool Result Streaming

**Current**: Return complete result.

**Future**: Stream tool results as they arrive.

```typescript
export async function* executeToolCallStream(
  functionName: string,
  functionArgs: Record<string, unknown>
): AsyncGenerator<string> {
  yield JSON.stringify({ status: 'searching...' })
  
  const results = await searchWeb(query)
  
  yield JSON.stringify({ status: 'processing results...' })
  
  yield JSON.stringify(formattedResults)
}
```

### 4. Conditional Tool Availability

**Current**: All tools always available.

**Future**: Context-aware tool availability.

```typescript
export function getAvailableTools(context: {
  isLocal: boolean
  hasInternet: boolean
  sessionType: string
}): ToolDefinition[] {
  const tools: ToolDefinition[] = []
  
  // Web search only if internet available
  if (context.hasInternet) {
    tools.push(webSearchTool)
  }
  
  // Eldercare tools only in eldercare sessions
  if (context.sessionType === 'eldercare') {
    tools.push(medicationLookupTool)
    tools.push(appointmentSchedulingTool)
  }
  
  return tools
}
```

### 5. Tool Usage Analytics

```typescript
const toolUsageStats = new Map<string, {
  calls: number
  successes: number
  failures: number
  avg_duration: number
}>()

export function getToolUsageStats() {
  return Object.fromEntries(toolUsageStats)
}

// Track in executeToolCall
toolUsageStats.get('web_search').calls++
```

---

## Summary

The **Tools System** provides function calling capabilities for AI agents:

**Core Capabilities**:
- **Tool Definitions**: OpenAI function calling format
- **Tool Execution**: Validate → Execute → Format → Return
- **Error Handling**: Graceful degradation (never crash)
- **Token Optimization**: Truncate results, exclude unnecessary fields

**Current Tools** (1):
- **web_search**: Internet search with AI-generated answers
  - Required: `query`
  - Optional: `max_results` (1-10), `include_answer` (boolean), `search_depth` ('basic' | 'advanced')

**Tool Response Format**:
- Success: JSON with query, answer, sources, results_count
- Error: JSON with error message
- Always returns string (never throws)

**Integration**:
- Used by `agentService` in two-phase tool calling
- Calls `tavilyService` for web search execution
- Results fed back to model for final response

**Best Practices**:
- Clear descriptions with use cases
- Parameter examples in descriptions
- Reasonable constraints (min/max)
- Validate required parameters
- Format for token efficiency
- Consistent error format
- Log execution for debugging

**Extension Pattern**:
1. Add tool schema to `AVAILABLE_TOOLS`
2. Add execution case to `executeToolCall` switch
3. Implement validation and execution logic
4. Return formatted JSON string

**Production Status**: Fully implemented with web search tool. Clean architecture supports easy addition of new tools (medication lookup, appointment scheduling, calculator, etc.).

