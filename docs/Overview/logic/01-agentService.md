# agentService.ts - AI Orchestration Service

## Purpose

`agentService.ts` is the **central orchestration layer** for all AI interactions in KalitoSpace. It coordinates between the user interface, database, memory system, and AI models to provide intelligent, context-aware responses.

## Core Responsibilities

1. **Context Building** - Assembles all relevant information for AI models
2. **Request Orchestration** - Manages AI model requests (streaming and non-streaming)
3. **Persona Management** - Applies persona prompts and settings
4. **Memory Integration** - Includes conversation history in requests
5. **Eldercare Context** - Injects relevant database information

## Architecture

```
User Request
    ↓
agentService.ts
    ├── getPersonaPrompt() → Database
    ├── getPersonaSettings() → Database  
    ├── getConversationHistory() → memoryManager
    ├── eldercareContextService → Database
    └── buildSystemPrompt() → Combined Context
    ↓
modelRegistry.getAdapter()
    ↓
adapter.generate() or adapter.generateStream()
    ↓
AI Model Response
```

## Key Functions

### 1. `runAgent()` - Standard AI Completion

**Purpose:** Executes a single, complete AI request (non-streaming)

**Process:**
```typescript
runAgent(payload: RunAgentParams) → { reply: string, tokenUsage: number | null }
```

**Steps:**
1. Get model adapter from registry
2. Fetch persona settings from database
3. Merge persona settings with request settings
4. Build system prompt (persona + eldercare + custom + focus instructions)
5. Get conversation history from memory manager
6. Assemble messages array: [system, ...history, user]
7. Call adapter.generate()
8. Return complete response

**Use Cases:**
- Simple question/answer
- When full response needed at once
- Lower latency for short responses

---

### 2. `runAgentStream()` - Streaming AI Completion

**Purpose:** Executes AI request with real-time streaming output

**Process:**
```typescript
runAgentStream(payload) → AsyncGenerator<{ delta, done?, tokenUsage? }>
```

**Steps:**
1-6. Same as runAgent()
7. Call adapter.generateStream()
8. Yield chunks progressively as they arrive

**Use Cases:**
- Long responses (better UX)
- Real-time feedback
- Chat-like experience

---

### 3. `getPersonaPrompt()` - Fetch Persona Instructions

**Purpose:** Retrieves persona's system prompt from database

**SQL Query:**
```sql
SELECT prompt FROM personas WHERE id = ?
```

**Returns:**
- Persona's full system prompt (e.g., "You are Kalito, a Cloud AI Assistant...")
- Empty string if persona not found

**Example Persona Prompt:**
```
You are Kalito, a Cloud AI Assistant for KalitoSpace.
You have complete read-only access to the local SQLite database.
[... full persona instructions ...]
```

---

### 4. `getPersonaSettings()` - Fetch Model Parameters

**Purpose:** Retrieves persona's model configuration settings

**SQL Query:**
```sql
SELECT temperature, maxTokens, topP, repeatPenalty 
FROM personas WHERE id = ?
```

**Returns:**
```typescript
{
  temperature: 0.7,
  maxTokens: 1000,
  topP: 0.9,
  repeatPenalty: 1.1,
  frequencyPenalty: 1.1  // Normalized for OpenAI
}
```

**Key Feature - Cross-Model Normalization:**
```typescript
// Ollama uses: repeatPenalty
// OpenAI uses: frequencyPenalty
// Solution: Set both!
if (persona.repeatPenalty != null) {
  settings.repeatPenalty = persona.repeatPenalty    // Ollama
  settings.frequencyPenalty = persona.repeatPenalty // OpenAI
}
```

---

### 5. `getConversationHistory()` - Hybrid Memory Retrieval

**Purpose:** Builds intelligent conversation context using hybrid memory system

**Process:**
1. Call `memoryManager.buildContext(sessionId, maxTokens)`
2. Get summaries, semantic pins, recent messages
3. Structure history with clear labels:
   - **System instructions** - "Use ONLY for contextual understanding"
   - **Summaries** - Past conversation overviews
   - **Semantic pins** - Important flagged information
   - **Historical messages** - Older exchanges (combined, low priority)
   - **Recent messages** - Last 2 exchanges (high priority)

**Message Structure:**
```typescript
[
  { role: 'system', content: 'CRITICAL INSTRUCTION: Focus on CURRENT question...' },
  { role: 'system', content: 'REFERENCE - Background: [summaries]' },
  { role: 'system', content: 'REFERENCE - Important: [pins]' },
  { role: 'system', content: 'HISTORICAL REFERENCE: [older msgs]' },
  { role: 'system', content: '--- RECENT CONVERSATION ---' },
  { role: 'user', content: 'RECENT EXCHANGE: What meds...' },
  { role: 'assistant', content: 'RECENT EXCHANGE: Here are...' }
]
```

**Why This Structure?**
- **Prevents AI from answering old questions** - Clear labeling
- **Prioritizes recent context** - Last 2 exchanges get full weight
- **Maintains long-term memory** - Summaries provide overview
- **Optimizes token usage** - Combines older messages

**Fallback:**
If memory manager fails, falls back to simple SQL query:
```sql
SELECT role, text FROM messages 
WHERE session_id = ? 
ORDER BY created_at DESC 
LIMIT 11
```

---

### 6. `buildSystemPrompt()` - Context Assembly

**Purpose:** Combines all context sources into final system prompt

**Components:**
1. **Persona Prompt** - AI identity and behavior (`getPersonaPrompt()`)
2. **Document Context** - File attachments (currently placeholder)
3. **Eldercare Context** - Database information (`eldercareContextService`)
4. **Custom Prompt** - Request-specific instructions
5. **Focus Instructions** - "Answer ONLY the current question"

**Assembly:**
```typescript
const parts = [
  personaPrompt,        // "You are Kalito..."
  documentContext,      // "" (not implemented yet)
  eldercareContext,     // "## Available Eldercare Information..."
  customPrompt,         // Optional custom instructions
  focusInstructions     // "CRITICAL INSTRUCTION: Focus on current question"
]
return parts.filter(Boolean).join('\n\n')
```

**Eldercare Context Example:**
```markdown
## Available Eldercare Information

Patient: Basilio Sanchez (Father)
- Medications: 2 active prescriptions
  - Farxiga 10mg (diabetes)
  - Janumet 50/1000mg (diabetes)
- Recent vitals: Blood pressure 120/80, measured today
- Upcoming appointments: Cardiology on Oct 20

## Instructions for AI Assistant
- Use eldercare information to provide relevant responses
- Reference specific medication names and dosages
- Maintain compassionate, family-focused tone
```

**Focus Instructions:**
```
CRITICAL INSTRUCTION: You MUST address ONLY the user's CURRENT QUESTION. 
Previous conversation is provided SOLELY as background context. 
You MUST NOT: 
1) Answer questions from previous exchanges
2) Refer to previous topics unless explicitly asked
3) Provide information not directly relevant to the current question
```

**Why Focus Instructions?**
- Solves "AI answering old questions" problem
- Keeps responses on-topic
- Improves conversation flow

---

### 7. `getDocumentContext()` - File Attachments (Placeholder)

**Purpose:** Future feature for document/file context

**Current Implementation:**
```typescript
function getDocumentContext(_fileIds: string[] = []): string {
  return ''
}
```

**Future Use:**
- Attach medical records, lab reports
- Reference uploaded documents in conversations
- "Analyze this blood work report"

---

## Message Flow Breakdown

### Example: "How many medications is dad taking?"

**Step 1: Build System Prompt**
```typescript
const systemPrompt = buildSystemPrompt(adapter, userInput, personaId)
// Result:
// - Persona: "You are Kalito..."
// - Eldercare: "Patient: Basilio (Father), Medications: 2..."
// - Focus: "Answer ONLY current question"
```

**Step 2: Get Conversation History**
```typescript
const history = await getConversationHistory(sessionId)
// Result: Previous 10 messages with labels
```

**Step 3: Assemble Messages Array**
```typescript
const messages = [
  { role: 'system', content: systemPrompt },
  ...history,
  { role: 'user', content: "How many medications is dad taking?" }
]
```

**Step 4: Call Model**
```typescript
const response = await adapter.generate({ messages, settings, fileIds })
// AI Response: "Basilio Sanchez is currently taking 2 medications:
//   1. Farxiga 10mg for diabetes
//   2. Janumet 50/1000mg for diabetes"
```

---

## Settings Management

### Persona Settings Priority

```typescript
const personaSettings = getPersonaSettings(personaId)  // From database
const mergedSettings = { 
  ...personaSettings,     // Base settings
  ...settings             // Request overrides
}
```

**Example:**
```typescript
// Persona: default-cloud
personaSettings = {
  temperature: 0.7,
  maxTokens: 2500,
  topP: 0.9
}

// Request override
settings = {
  temperature: 0.3  // Make it more deterministic
}

// Merged result
mergedSettings = {
  temperature: 0.3,    // Overridden
  maxTokens: 2500,     // From persona
  topP: 0.9            // From persona
}
```

---

## Error Handling

### Model Not Found
```typescript
if (!adapter) throw new Error(`Adapter for model "${modelName}" not found.`)
```

### No Streaming Support
```typescript
if (!('generateStream' in adapter)) {
  throw new Error(`Adapter "${modelName}" does not support streaming.`)
}
```

### Memory System Failure
```typescript
try {
  const memoryContext = await memoryManager.buildContext(sessionId, maxTokens)
} catch (error) {
  console.error('Error building enhanced conversation history:', error)
  // Fallback to simple SQL query
}
```

---

## Dependencies

### Internal
- `modelRegistry` - Get model adapters
- `memoryManager` - Conversation history
- `eldercareContextService` - Database context
- `db` - Direct database access

### Types
- `AgentRequest` - Request payload type
- `LLMAdapter` - Model adapter interface
- `ConversationSummary` - Memory summary type
- `SemanticPin` - Flagged message type
- `MessageWithImportance` - Weighted message type

---

## Key Design Decisions

### 1. **Hybrid Memory System**
Instead of simple message history, uses:
- Recent messages (immediate context)
- Summaries (long-term overview)
- Semantic pins (important facts)

**Benefit:** Better context with fewer tokens

### 2. **Clear Message Labeling**
Labels like "REFERENCE ONLY" and "RECENT EXCHANGE" help AI:
- Distinguish current vs. past questions
- Prioritize recent context
- Avoid answering old questions

**Benefit:** More focused, on-topic responses

### 3. **Cross-Model Normalization**
Maps settings between different model APIs:
- `repeatPenalty` → `frequencyPenalty`

**Benefit:** Same persona works across all models

### 4. **Eldercare Context Injection**
Automatically queries database for relevant patient data

**Benefit:** AI understands family context without explicit instructions

---

## Performance Considerations

### Token Usage
```typescript
getConversationHistory(sessionId, maxTokens = 3000)
```
- Limits history to ~3000 tokens
- Prevents context overflow
- Balances memory vs. token cost

### Message Grouping
Older messages combined into single system message:
```typescript
const combinedOlderMessages = olderMessages
  .map(msg => `${msg.role}: ${msg.text}`)
  .join('\n\n')
```
**Benefit:** Reduces message count, same information

---

## Common Issues & Solutions

### Issue: AI answers old questions
**Solution:** Focus instructions + message labeling
```typescript
"CRITICAL INSTRUCTION: You MUST address ONLY the user's CURRENT QUESTION"
```

### Issue: Context overflow (too many tokens)
**Solution:** Token limit + message grouping
```typescript
getConversationHistory(sessionId, maxTokens = 3000)
```

### Issue: Persona settings not applied
**Solution:** Setting merge order
```typescript
mergedSettings = { ...personaSettings, ...settings }
// Request settings override persona settings
```

---

## Future Enhancements

### 1. Document Context
```typescript
// Currently placeholder
function getDocumentContext(fileIds: string[]): string {
  // TODO: Implement file attachment support
}
```

### 2. Dynamic Token Limits
```typescript
// Adjust based on model context window
const maxTokens = adapter.contextWindow * 0.3
```

### 3. Context Caching
```typescript
// Cache eldercare context for repeated queries
const cachedContext = contextCache.get(patientId)
```

---

## Testing Scenarios

### Test 1: Simple Question
```typescript
await runAgent({
  modelName: 'gpt-4.1-nano',
  input: 'Hello',
  personaId: 'default-cloud'
})
// Should: Return greeting, no eldercare context needed
```

### Test 2: Eldercare Query
```typescript
await runAgent({
  modelName: 'gpt-4.1-nano',
  input: 'How many medications is dad taking?',
  personaId: 'default-cloud',
  sessionId: 'abc123'
})
// Should: Find patient "dad", query meds, return count with details
```

### Test 3: Conversation Continuation
```typescript
// Message 1
await runAgent({ input: 'What meds is dad taking?', sessionId: 'abc123' })
// Message 2
await runAgent({ input: 'Tell me about Farxiga', sessionId: 'abc123' })
// Should: Remember context, answer about Farxiga specifically
```

### Test 4: Streaming
```typescript
for await (const chunk of runAgentStream({ 
  input: 'Explain diabetes management', 
  sessionId: 'abc123' 
})) {
  console.log(chunk.delta)
}
// Should: Stream response in real-time chunks
```

---

## Related Files

- `modelRegistry.ts` - Model lookup and adapter management
- `memoryManager.ts` - Conversation history and summaries
- `eldercareContextService.ts` - Database context for AI
- `adapters/openai/factory.ts` - OpenAI adapter implementation
- `adapters/ollama/factory.ts` - Local model adapter implementation

---

## Quick Reference

**Run AI request:**
```typescript
const { reply, tokenUsage } = await runAgent({
  modelName: 'gpt-4.1-nano',
  input: 'Your question here',
  personaId: 'default-cloud',
  sessionId: 'optional-session-id',
  settings: { temperature: 0.7 }
})
```

**Stream AI response:**
```typescript
for await (const chunk of runAgentStream({
  modelName: 'gpt-4.1-nano',
  input: 'Your question here',
  personaId: 'default-cloud'
})) {
  if (!chunk.done) {
    process.stdout.write(chunk.delta)
  }
}
```
