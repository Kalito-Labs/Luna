# Agent Router Documentation

## Overview

The `agentRouter.ts` file implements the **core AI chat endpoint** for the application. It handles both streaming (SSE) and non-streaming chat interactions with AI models, manages persistent sessions, integrates with the memory system for intelligent context management, and provides model listing capabilities.

**Location**: `/backend/routes/agentRouter.ts`

**Mounted At**: `/api/agent`

**Purpose**:
- Process user chat messages with AI models
- Support streaming (Server-Sent Events) and classic request/response
- Manage persistent chat sessions (auto-save policy)
- Integrate with Phase 2 memory system (importance scoring, auto-summarization)
- Provide model adapter registry listing
- Rate limit AI requests for security

**Key Features**:
- **Dual Response Modes**: Streaming (SSE) vs non-streaming (JSON)
- **Auto-Save Sessions**: All sessions are persistent (saved = 1) from first message
- **Memory Integration**: Importance scoring, auto-summarization, semantic pinning
- **Model Authority**: Request `modelName` overrides persona/settings model
- **Rate Limiting**: Prevents abuse (disabled in tests)
- **Heartbeat**: Keep-alive pings for SSE connections

---

## Architecture

### Dependencies

```typescript
// Express framework
import express from 'express'
import type { Request, Response } from 'express'

// Core AI logic
import { runAgent, runAgentStream } from '../logic/agentService'
import { listModelAdapters } from '../logic/modelRegistry'
import { MemoryManager } from '../logic/memoryManager'

// Database
import { db } from '../db/db'

// Middleware
import { agentRateLimit } from '../middleware/security'
import { validateBody, agentRequestSchema } from '../middleware/validation'
import { asyncHandler } from '../middleware/errorMiddleware'

// Utilities
import { okItem, okList, err } from '../utils/apiContract'
import { handleRouterError } from '../utils/routerHelpers'
import { logError, logInfo } from '../utils/logger'
```

### Global Instances

```typescript
const agentRouter = express.Router()
const memoryManager = new MemoryManager()
```

**Why Global MemoryManager**:
- Single instance manages all session memories
- Caches summaries and pins for performance
- Consistent importance scoring across requests

---

## Middleware Stack

### Rate Limiting (Conditional)

```typescript
if (process.env.NODE_ENV !== 'test') {
  agentRouter.use(agentRateLimit)
}
```

**Purpose**: Prevent abuse of expensive AI API calls.

**Disabled In**: `test` environment (allows unlimited test requests)

**Configuration**: See `middleware/security.ts` for rate limits (e.g., 30 requests per 15 minutes)

---

## Helper Functions

### SSE (Server-Sent Events) Helpers

#### `setSSEHeaders(res: Response)`

**Purpose**: Configure response headers for SSE streaming.

```typescript
function setSSEHeaders(res: Response) {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no') // Prevent nginx buffering
  ;(res as any).flushHeaders?.()
}
```

**Headers Explained**:
- `text/event-stream`: SSE MIME type
- `no-cache, no-transform`: Prevent caching of streaming data
- `keep-alive`: Maintain persistent connection
- `X-Accel-Buffering: no`: Disable nginx/proxy buffering for immediate delivery

**Flush Headers**: Immediately send headers to client (important for SSE to start quickly)

---

#### `sseSend(res: Response, data: unknown)`

**Purpose**: Send SSE-formatted data chunk to client.

```typescript
function sseSend(res: Response, data: unknown) {
  res.write(`data: ${JSON.stringify(data)}\n\n`)
}
```

**SSE Format**:
```
data: {"delta":"Hello"}\n\n
data: {"delta":" world"}\n\n
data: {"done":true,"tokenUsage":15}\n\n
```

**Double Newline**: Required by SSE spec to delimit events

**Sent Data Types**:
1. `{ delta: string }` - Incremental text chunk
2. `{ tokenUsage: number }` - Token count update
3. `{ done: true, tokenUsage: number }` - Stream completion
4. `{ error: { code: string, message: string }, done: true }` - Error event

---

### Session Management Helper

#### `ensurePersistentSession(sessionId: string, modelId?: string)`

**Purpose**: Create or update session row in database (auto-save policy).

```typescript
function ensurePersistentSession(sessionId: string, modelId?: string) {
  const now = new Date().toISOString()
  const existing = db
    .prepare(`SELECT id FROM sessions WHERE id = ?`)
    .get(sessionId) as { id: string } | undefined

  if (!existing) {
    db.prepare(
      `INSERT INTO sessions (id, name, model, recap, persona_id, created_at, updated_at, saved)
       VALUES (?, ?, ?, NULL, NULL, ?, ?, 1)`
    ).run(sessionId, 'New Chat', modelId ?? null, now, now)
  } else {
    db.prepare(`UPDATE sessions SET updated_at = ? WHERE id = ?`).run(now, sessionId)
  }
}
```

**Auto-Save Policy**: All sessions are created with `saved = 1` (immediately appear in sidebar)

**Behavior**:
- **New Session**: Creates with default name "New Chat", `saved = 1`
- **Existing Session**: Updates `updated_at` timestamp only

**Why Auto-Save**:
- Simplifies UX (no "unsaved session" confusion)
- Users can rename/delete later if needed
- Matches ChatGPT-style session management

---

## Endpoints

### POST /api/agent

**Purpose**: Main chat endpoint - send user message, receive AI response (streaming or non-streaming).

#### Request Validation

```typescript
validateBody(agentRequestSchema)
```

**Schema** (`agentRequestSchema` from `middleware/validation.ts`):

```typescript
{
  input: z.string()
    .min(1, 'Input text is required')
    .max(16000, 'Input too long (max 16000 characters)')
    .refine(val => val.trim().length > 0, 'Input text is required'),
  
  sessionId: z.string().optional()
    .refine(val => !val || val.length > 0, 'Session ID cannot be empty string'),
  
  systemPrompt: z.string().optional().default(''),
  
  modelName: z.string().optional(),
  
  mode: z.enum(['single', 'cloud']).optional().default('single'),
  
  personaId: z.string().optional(),
  
  settings: z.object({
    model: z.string().optional(),
    temperature: z.number().min(0.1).max(1.2).optional(),
    maxTokens: z.number().min(1).max(4000).optional(),
    topP: z.number().min(0).max(1).optional(),
    frequencyPenalty: z.number().min(0).max(2).optional(),
    presencePenalty: z.number().min(0).max(2).optional(),
    outputFormat: z.string().optional(),
  }).optional().default({}),
  
  fileIds: z.array(z.string()).optional().default([]),
  
  stream: z.boolean().optional().default(false),
}
```

#### Request Body

```typescript
{
  input: string;              // User's message (1-16000 chars, trimmed)
  sessionId?: string;         // Existing session ID or omit for auto-generation
  systemPrompt?: string;      // Override system prompt
  modelName?: string;         // Model to use (e.g., "gpt-4", "gpt-3.5-turbo")
  mode?: 'single' | 'cloud';  // Execution mode (default: 'single')
  personaId?: string;         // Persona to apply
  settings?: {                // Model generation settings
    model?: string;           // Model override (ignored - modelName wins)
    temperature?: number;     // 0.1-1.2
    maxTokens?: number;       // 1-4000
    topP?: number;            // 0-1
    frequencyPenalty?: number; // 0-2
    presencePenalty?: number;  // 0-2
    outputFormat?: string;    // e.g., "json_object"
  };
  fileIds?: string[];         // File attachments for vision models
  stream?: boolean;           // Enable SSE streaming (default: false)
}
```

#### Request Processing Flow

**1. Validation & Logging**

```typescript
logInfo('Agent request received', {
  sessionId,
  modelName,
  stream,
  personaId,
  hasSystemPrompt: !!systemPrompt,
  inputLength: input?.length ?? 0,
  ip: req.ip,
})
```

**2. Model Name Validation**

```typescript
if (!modelName || typeof modelName !== 'string') {
  return err(res, 400, 'VALIDATION_ERROR', 'Invalid or missing model name')
}
```

**Why Required**: Cannot route to model adapter without valid model identifier.

**3. Session ID Resolution**

```typescript
const usedSessionId =
  typeof sessionId === 'string' && sessionId.length > 0 
    ? sessionId 
    : Date.now().toString()
```

**Logic**:
- Use provided `sessionId` if valid string
- Generate timestamp-based ID if missing (`Date.now().toString()`)

**4. Ensure Persistent Session**

```typescript
try {
  ensurePersistentSession(usedSessionId, modelName)
} catch (e) {
  logError('Failed to ensure transient session', e as Error, { sessionId: usedSessionId })
  return err(res, 500, 'INTERNAL', 'Failed to initialize session')
}
```

**Creates or updates session row** with `saved = 1`.

**5. Save User Message with Importance Scoring**

```typescript
const userMessage = {
  id: 0,
  session_id: usedSessionId,
  role: 'user' as const,
  text: String(input ?? '').trim(),
  model_id: modelName,
  token_usage: 0,
  created_at: new Date().toISOString(),
  importance_score: 0.5, // placeholder
}

const importanceScore = memoryManager.scoreMessageImportance(userMessage)

db.prepare(`
  INSERT INTO messages (session_id, role, text, model_id, importance_score, created_at)
  VALUES (?, ?, ?, ?, ?, ?)
`).run(
  usedSessionId,
  'user',
  String(input ?? '').trim(),
  modelName,
  importanceScore,
  new Date().toISOString()
)

// Update session timestamp
db.prepare(`UPDATE sessions SET updated_at = ? WHERE id = ?`)
  .run(new Date().toISOString(), usedSessionId)
```

**Memory Integration**:
- `memoryManager.scoreMessageImportance()` analyzes message for importance (0-1 scale)
- Importance scoring considers: length, keywords, questions, commands
- Stored in `messages.importance_score` column for retrieval prioritization

---

### Streaming Branch (SSE)

**Triggered When**: `stream: true` in request

#### Flow

**1. Set SSE Headers**

```typescript
setSSEHeaders(res)
```

**2. Start Heartbeat (Keep-Alive)**

```typescript
const heartbeat = setInterval(() => {
  try {
    res.write(': keep-alive\n\n')
  } catch {
    // ignore write errors; cleanup happens below
  }
}, 20000) // Every 20 seconds
```

**Why Heartbeat**: Prevents proxies/firewalls from closing idle connections.

**SSE Comment**: `: keep-alive\n\n` is an SSE comment (ignored by client, keeps connection alive)

**3. Stream Agent Response**

```typescript
let agentReply = ''
let totalTokens: number | undefined

for await (const chunk of runAgentStream({
  input,
  systemPrompt,
  modelName,
  settings: { ...settings, model: modelName }, // Enforce model authority
  fileIds,
  sessionId: usedSessionId,
  personaId,
})) {
  if (chunk.delta) {
    agentReply += chunk.delta
    sseSend(res, { delta: chunk.delta })
  }
  if (typeof chunk.tokenUsage === 'number') {
    totalTokens = chunk.tokenUsage
    sseSend(res, { tokenUsage: totalTokens })
  }
  if (chunk.done) {
    // Handle completion (save message, summarize)
  }
}
```

**Chunk Types**:
- `{ delta: string }` - Text increment
- `{ tokenUsage: number }` - Token count
- `{ done: true }` - Stream complete

**Model Authority**: `settings.model` is overridden with `modelName` to ensure correct model is used.

**4. Save Assistant Message (on completion)**

```typescript
if (chunk.done) {
  const assistantMessage = {
    id: 0,
    session_id: usedSessionId,
    role: 'assistant' as const,
    text: agentReply,
    model_id: modelName,
    token_usage: totalTokens || 0,
    created_at: new Date().toISOString(),
    importance_score: 0.6, // placeholder
  }
  
  const importanceScore = memoryManager.scoreMessageImportance(assistantMessage)

  db.prepare(`
    INSERT INTO messages (session_id, role, text, model_id, token_usage, importance_score, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    usedSessionId,
    'assistant',
    agentReply,
    modelName,
    totalTokens || 0,
    importanceScore,
    new Date().toISOString()
  )

  // Update session timestamp
  db.prepare(`UPDATE sessions SET updated_at = ? WHERE id = ?`)
    .run(new Date().toISOString(), usedSessionId)
  
  sseSend(res, { done: true, tokenUsage: totalTokens || 0 })
}
```

**5. Auto-Summarization (Fire-and-Forget)**

```typescript
setTimeout(async () => {
  try {
    if (memoryManager.needsSummarization(usedSessionId)) {
      await memoryManager.autoSummarizeSession(usedSessionId)
    }
  } catch (autoErr) {
    logError('Auto-summarization failed', autoErr as Error, { sessionId: usedSessionId })
  }
}, 0)
```

**Why `setTimeout(..., 0)`**: Run asynchronously without blocking SSE response.

**When Triggered**: After every message (checks if summarization threshold reached)

**Summarization Logic**: See `MemoryManager.needsSummarization()` and `autoSummarizeSession()`

**6. Error Handling**

```typescript
catch (error) {
  logError('Streaming error', error as Error, { sessionId: usedSessionId, modelName })
  const message = (error as Error)?.message || 'Unknown streaming error'
  sseSend(res, { error: { code: 'INTERNAL', message: `AI Model: ${message}` }, done: true })
  res.end()
  return
} finally {
  clearInterval(heartbeat)
}
```

**Graceful Error**: Send error as SSE event instead of HTTP error (client can display inline)

**Cleanup**: Always clear heartbeat interval

---

### Non-Streaming Branch (Classic JSON)

**Triggered When**: `stream: false` or omitted in request

#### Flow

**1. Run Agent (Await Complete Response)**

```typescript
const result = await runAgent({
  input,
  systemPrompt,
  modelName,
  settings: { ...settings, model: modelName }, // Enforce model authority
  fileIds,
  sessionId: usedSessionId,
  personaId,
})
```

**Returns**: `{ reply: string, tokenUsage: number, logs?: string[] }`

**2. Save Assistant Message**

```typescript
const assistantMessage = {
  id: 0,
  session_id: usedSessionId,
  role: 'assistant' as const,
  text: result.reply,
  model_id: modelName,
  token_usage: result.tokenUsage || 0,
  created_at: new Date().toISOString(),
  importance_score: 0.6, // placeholder
}

const importanceScore = memoryManager.scoreMessageImportance(assistantMessage)

db.prepare(`
  INSERT INTO messages (session_id, role, text, model_id, token_usage, importance_score, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`).run(
  usedSessionId,
  'assistant',
  result.reply,
  modelName,
  result.tokenUsage || 0,
  importanceScore,
  new Date().toISOString()
)

// Update session timestamp
db.prepare(`UPDATE sessions SET updated_at = ? WHERE id = ?`)
  .run(new Date().toISOString(), usedSessionId)
```

**3. Auto-Summarization with Recap Update**

```typescript
setTimeout(async () => {
  try {
    if (memoryManager.needsSummarization(usedSessionId)) {
      const summary = await memoryManager.autoSummarizeSession(usedSessionId)
      // Update session recap if we generated a new summary
      if (summary) {
        db.prepare(`UPDATE sessions SET recap = ? WHERE id = ?`)
          .run(summary.summary, usedSessionId)
      }
    }
  } catch (autoErr) {
    logError('Auto-summarization failed', autoErr as Error, { sessionId: usedSessionId })
  }
}, 0)
```

**Recap Update**: Non-streaming updates `sessions.recap` with latest summary (streaming doesn't to avoid race conditions)

**4. Success Response**

```typescript
logInfo('Agent response sent', {
  sessionId: usedSessionId,
  tokenUsage: result.tokenUsage,
  replyLength: result.reply?.length ?? 0,
})

return okItem(res, {
  reply: typeof result.reply === 'string' ? result.reply : '[No response]',
  tokenUsage: typeof result.tokenUsage === 'number' ? result.tokenUsage : 0,
})
```

**Response Format**:
```typescript
{
  data: {
    reply: string,
    tokenUsage: number
  }
}
```

**5. Error Handling**

```typescript
catch (error) {
  logError('Agent processing error', error as Error, { sessionId: usedSessionId })
  return handleRouterError(res, error, 'run agent')
}
```

**`handleRouterError`**: Converts errors to standardized API error responses (see `routerHelpers.ts`)

---

### GET /api/agent/models

**Purpose**: List all available AI model adapters.

#### Implementation

```typescript
agentRouter.get(
  '/models',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const models = listModelAdapters().map(({ id, name, type }) => ({
        id,
        name,
        type,
      }))

      logInfo('Models list requested', { count: models.length, ip: req.ip })
      return okList(res, models)
    } catch (error) {
      logError('Failed to list models', error as Error)
      return handleRouterError(res, error, 'list models')
    }
  })
)
```

#### Response Format

```typescript
{
  data: [
    { id: 'gpt-4', name: 'GPT-4', type: 'cloud' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', type: 'cloud' },
    { id: 'llama2', name: 'Llama 2', type: 'local' },
    // ...
  ]
}
```

**Fields**:
- `id`: Model identifier (used in `modelName` request field)
- `name`: Display name
- `type`: `'cloud'` or `'local'`

**Source**: `modelRegistry.listModelAdapters()` - scans registered adapters

---

## Integration with Other Systems

### Memory Manager Integration

**Instance**: Global `memoryManager` created at router level

**Methods Used**:

#### `scoreMessageImportance(message)`

**Purpose**: Calculate importance score (0-1) for message prioritization.

**Scoring Factors**:
- Message length (longer = more important)
- Keywords (e.g., "error", "important", "remember")
- Questions (contain `?`)
- Commands (imperative verbs)

**Used For**:
- Prioritizing context in retrieval
- Determining what to summarize
- Semantic pinning candidates

#### `needsSummarization(sessionId)`

**Purpose**: Check if session has enough messages to warrant summarization.

**Threshold**: Typically 10+ messages without recent summary

**Returns**: `boolean`

#### `autoSummarizeSession(sessionId)`

**Purpose**: Generate conversation summary and update session recap.

**Process**:
1. Retrieve unsummarized messages
2. Send to AI for summarization
3. Store summary in `conversation_summaries` table
4. Update `sessions.recap` with latest summary

**Returns**: `{ summary: string, message_count: number }` or `null`

---

### Agent Service Integration

**Source**: `logic/agentService.ts`

#### `runAgent(params)`

**Purpose**: Classic request/response AI generation.

**Parameters**:
```typescript
{
  input: string;
  systemPrompt?: string;
  modelName: string;
  settings?: Record<string, unknown>;
  fileIds?: string[];
  sessionId?: string;
  personaId?: string;
}
```

**Returns**: `{ reply: string, tokenUsage: number, logs?: string[] }`

**Process**:
1. Retrieve persona (if `personaId` provided)
2. Build message history with memory context
3. Call model adapter `generate()`
4. Return complete response

#### `runAgentStream(params)`

**Purpose**: Streaming AI generation (SSE).

**Returns**: `AsyncGenerator<StreamChunk>`

**StreamChunk Types**:
```typescript
type StreamChunk = 
  | { delta: string }
  | { tokenUsage: number }
  | { done: true }
```

**Process**:
1. Retrieve persona and memory context
2. Call model adapter `generateStream()`
3. Yield chunks as async generator
4. Yield final `done` event

---

### Model Registry Integration

**Source**: `logic/modelRegistry.ts`

#### `listModelAdapters()`

**Purpose**: Get all registered model adapters.

**Returns**: `LLMAdapter[]`

**Adapters Include**:
- OpenAI models (GPT-4, GPT-3.5, etc.)
- Ollama models (Llama 2, Mistral, etc.)
- Custom adapters

---

### Database Schema

#### Sessions Table

```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'New Chat',
  model TEXT,
  recap TEXT,
  persona_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  saved INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (persona_id) REFERENCES personas(id) ON DELETE SET NULL
);
```

**Fields Used**:
- `id`: Session identifier
- `name`: Session title (default: "New Chat")
- `model`: Last used model
- `recap`: Latest conversation summary
- `persona_id`: Applied persona (nullable)
- `saved`: Always `1` in auto-save policy

#### Messages Table

```sql
CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('system', 'user', 'assistant')),
  text TEXT NOT NULL,
  model_id TEXT,
  token_usage INTEGER DEFAULT 0,
  importance_score REAL DEFAULT 0.5,
  created_at TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);
```

**Fields Used**:
- `session_id`: Foreign key to sessions
- `role`: 'user' or 'assistant' (system prompts not persisted)
- `text`: Message content
- `model_id`: Model used for generation
- `token_usage`: Tokens consumed (0 for user messages)
- `importance_score`: Memory system importance (0-1)

---

## Usage Examples

### Non-Streaming Chat Request

```typescript
const response = await fetch('/api/agent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    input: "Explain quantum computing",
    modelName: "gpt-4",
    sessionId: "session_123",
    settings: {
      temperature: 0.7,
      maxTokens: 500
    }
  })
})

const data = await response.json()
console.log(data.data.reply) // AI response
console.log(data.data.tokenUsage) // Tokens used
```

### Streaming Chat Request (SSE)

```typescript
const response = await fetch('/api/agent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    input: "Write a poem about AI",
    modelName: "gpt-3.5-turbo",
    sessionId: "session_456",
    stream: true
  })
})

const reader = response.body.getReader()
const decoder = new TextDecoder()

while (true) {
  const { done, value } = await reader.read()
  if (done) break
  
  const chunk = decoder.decode(value)
  const lines = chunk.split('\n')
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6))
      
      if (data.delta) {
        process.stdout.write(data.delta) // Stream text
      }
      if (data.done) {
        console.log(`\n[Used ${data.tokenUsage} tokens]`)
      }
      if (data.error) {
        console.error('Error:', data.error.message)
      }
    }
  }
}
```

### Chat with Persona

```typescript
const response = await fetch('/api/agent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    input: "Help me with medication scheduling",
    modelName: "gpt-4",
    sessionId: "session_789",
    personaId: "persona_eldercare_specialist"
  })
})

// Persona provides specialized system prompt for eldercare context
```

### List Available Models

```typescript
const response = await fetch('/api/agent/models')
const data = await response.json()

console.log('Available models:')
data.data.forEach(model => {
  console.log(`- ${model.name} (${model.type}): ${model.id}`)
})
// Output:
// - GPT-4 (cloud): gpt-4
// - GPT-3.5 Turbo (cloud): gpt-3.5-turbo
// - Llama 2 (local): llama2
```

---

## Best Practices

### 1. Model Name Authority

**Why**: Ensure correct model is used regardless of persona/settings.

```typescript
// ✅ GOOD: modelName overrides settings.model
settings: { ...settings, model: modelName }

// ❌ BAD: Using settings.model could mismatch frontend selection
settings: { ...settings }
```

### 2. Error Handling in SSE

**Why**: HTTP errors break SSE connection, inline errors allow recovery.

```typescript
// ✅ GOOD: Send error as SSE event
catch (error) {
  sseSend(res, { 
    error: { code: 'INTERNAL', message: error.message }, 
    done: true 
  })
  res.end()
}

// ❌ BAD: Throwing error closes connection ungracefully
catch (error) {
  throw error
}
```

### 3. Fire-and-Forget Summarization

**Why**: Don't block response waiting for summarization.

```typescript
// ✅ GOOD: Async summarization
setTimeout(async () => {
  if (memoryManager.needsSummarization(sessionId)) {
    await memoryManager.autoSummarizeSession(sessionId)
  }
}, 0)

// ❌ BAD: Blocking summarization
await memoryManager.autoSummarizeSession(sessionId) // Delays response!
```

### 4. Session ID Validation

**Why**: Prevent empty string bugs.

```typescript
// ✅ GOOD: Check for valid string or generate
const usedSessionId = 
  typeof sessionId === 'string' && sessionId.length > 0
    ? sessionId
    : Date.now().toString()

// ❌ BAD: Empty string becomes session ID
const usedSessionId = sessionId || Date.now().toString()
```

### 5. Heartbeat Cleanup

**Why**: Prevent memory leaks from orphaned intervals.

```typescript
// ✅ GOOD: Always cleanup in finally
const heartbeat = setInterval(...)
try {
  // streaming...
} finally {
  clearInterval(heartbeat)
}

// ❌ BAD: Heartbeat continues after response
const heartbeat = setInterval(...)
// ... no cleanup
```

---

## Migration Notes

### Session Policy Change

**Old Behavior**: Sessions created as ephemeral (`saved = 0`), required explicit save.

**New Behavior**: All sessions auto-save (`saved = 1`) on creation.

**Impact**:
- Sidebar shows all sessions immediately
- No "unsaved session" warnings
- Users can delete unwanted sessions

**Code Comment**:
```typescript
/* ---------------------------------------------------------------------- */
/* NOTE: session + messages endpoints have moved to /api/sessions         */
/*  - GET /api/sessions                    (list saved only)              */
/*  - POST /api/sessions/save              (save with recap)              */
/*  - GET  /api/sessions/:id               (one session)                  */
/*  - GET  /api/sessions/:id/messages      (thread)                       */
/*  - DELETE /api/sessions/:id             (delete)                       */
/* ---------------------------------------------------------------------- */
```

**See**: `sessionRouter.ts` for session management endpoints

---

## Performance Considerations

### 1. Heartbeat Interval (20s)

**Rationale**: Balance between keeping connection alive and reducing network overhead.

**Tuning**: Reduce to 10s for aggressive proxies, increase to 30s for bandwidth savings.

### 2. Memory Manager Caching

**Built-in**: MemoryManager caches summaries and pins to avoid repeated DB queries.

**Invalidation**: Automatic on new summaries/pins.

### 3. Rate Limiting

**Default**: 30 requests per 15 minutes (see `middleware/security.ts`)

**Why**: Prevent expensive OpenAI API abuse.

**Bypass**: Disabled in `test` environment.

---

## Error Scenarios

### Model Not Found

**Request**: `modelName: "nonexistent-model"`

**Response**: 
```json
{
  "error": {
    "code": "INTERNAL",
    "message": "Model adapter not found: nonexistent-model"
  }
}
```

**Source**: `modelRegistry.getModelAdapter()` throws error

### Empty Input

**Request**: `input: "   "` (whitespace only)

**Response**:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Input text is required"
  }
}
```

**Source**: Zod schema validation with `.refine(val => val.trim().length > 0)`

### Streaming Error

**Scenario**: OpenAI API timeout during streaming

**SSE Event**:
```
data: {"error":{"code":"INTERNAL","message":"AI Model: Request timeout"},"done":true}\n\n
```

**Client Handling**: Display error inline, allow retry

### Session Creation Failure

**Scenario**: Database locked during session insert

**Response**:
```json
{
  "error": {
    "code": "INTERNAL",
    "message": "Failed to initialize session"
  }
}
```

**Logged**: `logError('Failed to ensure transient session', ...)`

---

## Testing Considerations

### Rate Limiting Bypass

```typescript
if (process.env.NODE_ENV !== 'test') {
  agentRouter.use(agentRateLimit)
}
```

**Why**: Tests need unlimited requests for comprehensive coverage.

**Setup**: Set `NODE_ENV=test` in test environment.

### Mock Dependencies

**For Unit Tests**, mock:
- `runAgent` / `runAgentStream` (logic/agentService)
- `MemoryManager` (logic/memoryManager)
- `db` (database)
- `listModelAdapters` (modelRegistry)

### Integration Tests

**Test Scenarios**:
1. Non-streaming chat (happy path)
2. Streaming chat with heartbeat
3. Session auto-creation
4. Message importance scoring
5. Auto-summarization trigger
6. Model name validation
7. Error handling (model not found, empty input)

---

## Summary

The **agentRouter** is the core AI interaction endpoint:

- **POST /api/agent**: Chat with AI (streaming or non-streaming)
  - Auto-save sessions (all sessions persistent)
  - Memory integration (importance scoring, auto-summarization)
  - Model authority (request modelName overrides settings)
  - SSE streaming with heartbeat keep-alive
  - Fire-and-forget summarization

- **GET /api/agent/models**: List available AI models
  - Returns id, name, type for each adapter
  - Used for model selector UI

**Key Design Decisions**:
- Auto-save policy simplifies UX
- Memory integration enables intelligent context management
- Streaming uses SSE for real-time experience
- Rate limiting prevents abuse
- Error handling preserves SSE connections

**Dependencies**:
- `agentService`: AI generation logic
- `modelRegistry`: Model adapter management
- `MemoryManager`: Context optimization
- `sessionRouter`: Session CRUD (moved to separate router)
