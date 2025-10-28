# Session Router Documentation

## Overview

The `sessionRouter.ts` file implements the conversation session and message management system. Sessions represent individual chat conversations with the AI, storing conversation history, AI personas, and metadata. Messages within sessions form the conversation transcript.

**Location**: `/backend/routes/sessionRouter.ts`

**Mounted At**: `/api/sessions`

**Created**: Core chat system component

**Purpose**:
- Manage conversation sessions (chat threads)
- Store and retrieve message history
- Generate AI-powered conversation summaries
- Support session persistence (save/load conversations)
- Clean up orphaned messages
- Enable conversation organization and retrieval

**Key Features**:
- **Session Management**: Create, retrieve, save, delete sessions
- **Message History**: Load complete conversation transcripts
- **AI Summaries**: Auto-generate conversation recaps using MemoryManager
- **Saved Sessions**: Flag important conversations for persistence
- **Bulk Operations**: Cleanup orphaned messages
- **Rate Limiting**: API protection against abuse
- **Transaction Safety**: Cascading deletes with rollback support

---

## Architecture

### Dependencies

```typescript
import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { db } from '../db/db'
import { okItem, okList, err } from '../utils/apiContract'
import { handleRouterError } from '../utils/routerHelpers'
import { logError, logInfo } from '../utils/logger'
import { asyncHandler } from '../middleware/errorMiddleware'
import { generalRateLimit } from '../middleware/security'
import { MemoryManager } from '../logic/memoryManager'
```

**Key Dependencies**:
- **Zod**: Request body validation
- **Database**: Direct SQLite queries
- **MemoryManager**: AI-powered conversation summarization
- **Middleware**: Rate limiting, error handling, async wrapper

**Service Integration**:
- **MemoryManager**: Creates conversation summaries for recaps
- **Personas**: Sessions reference persona_id for AI behavior
- **Models**: Sessions track which model was used

---

## Database Schema

### Sessions Table

```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  name TEXT,
  model TEXT,
  recap TEXT,
  persona_id TEXT,
  created_at TEXT,
  updated_at TEXT,
  saved INTEGER DEFAULT 0,
  session_type TEXT DEFAULT 'chat',
  patient_id TEXT,
  related_record_id TEXT,
  care_category TEXT
);

CREATE INDEX idx_sessions_patient_type ON sessions(
  patient_id, 
  session_type, 
  updated_at DESC
);
```

**Field Explanations**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | TEXT | Yes | Unique session identifier (client-generated) |
| `name` | TEXT | No | Session name (default: "Untitled Chat") |
| `model` | TEXT | No | Model ID used in conversation |
| `recap` | TEXT | No | AI-generated conversation summary |
| `persona_id` | TEXT | No | Reference to personas table |
| `created_at` | TEXT | Yes | Session creation timestamp |
| `updated_at` | TEXT | Yes | Last activity timestamp |
| `saved` | INTEGER | Yes | 0 = ephemeral, 1 = saved (default 0) |
| `session_type` | TEXT | Yes | 'chat' or other types (default 'chat') |
| `patient_id` | TEXT | No | Eldercare: link to patient |
| `related_record_id` | TEXT | No | Eldercare: link to specific record |
| `care_category` | TEXT | No | Eldercare: care category context |

**Purpose**: Store conversation sessions with metadata

**Constraints**:
- `id`: Primary key (client-generated UUID or similar)
- `saved`: 0 or 1 (boolean flag)

### Messages Table

```sql
CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  role TEXT,
  text TEXT,
  model_id TEXT,
  token_usage INTEGER,
  importance_score REAL DEFAULT 0.5,
  created_at TEXT,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE INDEX idx_messages_session_created ON messages(
  session_id, 
  created_at DESC
);
```

**Field Explanations**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | INTEGER | Yes | Auto-incrementing message ID |
| `session_id` | TEXT | Yes | Foreign key to sessions |
| `role` | TEXT | No | 'user', 'assistant', or 'system' |
| `text` | TEXT | No | Message content |
| `model_id` | TEXT | No | Model that generated response |
| `token_usage` | INTEGER | No | Tokens consumed by this message |
| `importance_score` | REAL | Yes | Relevance score (0.0-1.0, default 0.5) |
| `created_at` | TEXT | Yes | Message timestamp |

**Purpose**: Store individual messages within sessions

**Constraints**:
- `id`: Auto-incrementing primary key
- `session_id`: Foreign key with CASCADE DELETE

**Related Tables**:
- `sessions` (parent)
- `conversation_summaries` (session summaries)
- `semantic_pins` (important message excerpts)

---

## Type Definitions

### Session Type (Inferred)

```typescript
interface Session {
  id: string
  name: string | null
  model: string | null
  recap: string | null
  persona_id: string | null
  created_at: string | null
  updated_at: string | null
  saved: number  // 0 or 1
  session_type?: string
  patient_id?: string | null
  related_record_id?: string | null
  care_category?: string | null
}
```

### Message Type (Inferred)

```typescript
interface Message {
  id: number
  session_id: string
  role: string | null  // 'user' | 'assistant' | 'system'
  text: string | null
  model_id: string | null
  token_usage: number | null
  importance_score: number  // 0.0-1.0
  created_at: string
}
```

---

## Validation Schemas

### Save Session Schema

```typescript
const saveSessionSchema = z.object({
  sessionId: z.string().min(1),
  name: z.string().optional(),
  model: z.string().optional(),
  persona_id: z.string().optional(),
  recap: z.string().optional(),       // Bypass AI summary
  allowEmpty: z.boolean().optional(), // Allow saving empty session
})
```

**Validation Rules**:
- `sessionId`: Required, minimum 1 character
- `name`: Optional string (defaults to "Untitled Chat")
- `model`: Optional string
- `persona_id`: Optional string
- `recap`: Optional string (if not provided, AI generates one)
- `allowEmpty`: Optional boolean (default false, rejects empty sessions)

---

## Utility Functions

### nowISO()

**Purpose**: Get current timestamp in ISO 8601 format

```typescript
function nowISO() {
  return new Date().toISOString()
}
```

### getSessionById(id)

**Purpose**: Retrieve single session by ID

```typescript
function getSessionById(id: string): Session | undefined {
  return db.prepare(`
    SELECT id, name, model, recap, persona_id, created_at, updated_at, saved
    FROM sessions WHERE id = ?
  `).get(id)
}
```

### listSavedSessions()

**Purpose**: Get all saved sessions (saved=1), newest first

```typescript
function listSavedSessions(): Session[] {
  return db.prepare(`
    SELECT id, name, model, recap, persona_id, created_at, updated_at, saved
    FROM sessions
    WHERE saved = 1
    ORDER BY COALESCE(updated_at, created_at) DESC
  `).all()
}
```

**Ordering**: By `updated_at` DESC (most recently active first)

### buildRecapWithAI(sessionId)

**Purpose**: Generate AI-powered conversation summary using MemoryManager

```typescript
async function buildRecapWithAI(sessionId: string): Promise<string> {
  // 1. Get message range
  const meta = db.prepare(`
    SELECT MIN(id) AS startId, MAX(id) AS endId, COUNT(*) AS count
    FROM messages WHERE session_id = ?
  `).get(sessionId)
  
  // 2. Create summary via MemoryManager
  const summary = await memory.createSummary({
    session_id: sessionId,
    start_message_id: String(meta.startId),
    end_message_id: String(meta.endId),
    message_count: meta.count,
  })
  
  // 3. Trim to 500 chars for UI
  const recap = summary.summary.length > 500 
    ? summary.summary.slice(0, 500).trimEnd() + '…' 
    : summary.summary
  
  return recap
}
```

**Behavior**:
- Analyzes all messages in session
- Creates summary via MemoryManager (stores in `conversation_summaries`)
- Returns truncated version for recap field (500 chars max)
- Falls back to "Empty session" if no messages

**Error Handling**: Caller catches errors and uses fallback (last assistant message)

---

## Middleware

### Rate Limiting

```typescript
if (process.env.NODE_ENV !== 'test') {
  router.use(generalRateLimit)
}
```

**Purpose**: Prevent API abuse

**Behavior**:
- Applied to all session endpoints
- Disabled in test environment

---

## Endpoints

### GET /api/sessions

**Purpose**: List all saved sessions, ordered by most recent activity.

#### Path Parameters

None.

#### Query Parameters

None.

#### Implementation

```typescript
router.get('/', asyncHandler(async (_req: Request, res: Response) => {
  try {
    const sessions = listSavedSessions()
    return okList(res, sessions)
  } catch (error) {
    return handleRouterError(res, error, 'list sessions')
  }
}))
```

**Query Details**:
- Filters: `saved = 1` (only saved sessions)
- Ordering: `updated_at DESC` (most recent first)

#### Response Format (Success)

```typescript
{
  data: [
    {
      id: "session_abc123",
      name: "Medical Questions",
      model: "gpt-4-turbo",
      recap: "Discussion about medication interactions and dosage schedules...",
      persona_id: "medical-advisor",
      created_at: "2024-10-20T10:00:00.000Z",
      updated_at: "2024-10-20T14:30:00.000Z",
      saved: 1
    },
    {
      id: "session_def456",
      name: "Untitled Chat",
      model: "gpt-4-turbo",
      recap: "General conversation about daily activities...",
      persona_id: "friendly-companion",
      created_at: "2024-10-19T09:00:00.000Z",
      updated_at: "2024-10-19T12:00:00.000Z",
      saved: 1
    }
    // ... more sessions
  ]
}
```

#### Example Request

```typescript
const response = await fetch('/api/sessions')
const data = await response.json()

console.log(`Saved sessions: ${data.data.length}`)

data.data.forEach(session => {
  console.log(`- ${session.name} (${session.id})`)
  console.log(`  ${session.recap?.substring(0, 100)}...`)
  console.log(`  Updated: ${new Date(session.updated_at).toLocaleDateString()}`)
})
```

**Use Case**: Display session history sidebar, load previous conversations

---

### GET /api/sessions/:id

**Purpose**: Get a specific session by ID (saved or unsaved).

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Session ID |

#### Implementation

```typescript
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  if (!id) return err(res, 400, 'VALIDATION_ERROR', 'Missing session id')

  try {
    const session = getSessionById(id)
    if (!session) return err(res, 404, 'NOT_FOUND', 'Session not found')
    return okItem(res, session)
  } catch (error) {
    return handleRouterError(res, error, 'get session', { id })
  }
}))
```

#### Response Format (Success)

```typescript
{
  data: {
    id: "session_abc123",
    name: "Medical Questions",
    model: "gpt-4-turbo",
    recap: "Discussion about medication interactions...",
    persona_id: "medical-advisor",
    created_at: "2024-10-20T10:00:00.000Z",
    updated_at: "2024-10-20T14:30:00.000Z",
    saved: 1
  }
}
```

#### Response Format (Not Found)

```typescript
{
  success: false,
  error: {
    code: "NOT_FOUND",
    message: "Session not found"
  }
}
```

**HTTP Status**: 404

#### Example Request

```typescript
const response = await fetch('/api/sessions/session_abc123')
const data = await response.json()

if (data.data) {
  console.log(`Session: ${data.data.name}`)
  console.log(`Persona: ${data.data.persona_id}`)
  console.log(`Messages: ${data.data.recap}`)
}
```

**Use Case**: Load session metadata before fetching messages

---

### GET /api/sessions/:id/messages

**Purpose**: Get all messages in a session, ordered chronologically.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Session ID |

#### Implementation

```typescript
router.get('/:id/messages', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  if (!id) return err(res, 400, 'VALIDATION_ERROR', 'Missing session id')

  try {
    const rows = db.prepare(`
      SELECT id, session_id, role, text, model_id, token_usage, importance_score, created_at
      FROM messages
      WHERE session_id = ?
      ORDER BY created_at ASC
    `).all(id)
    
    return okList(res, rows)
  } catch (error) {
    return handleRouterError(res, error, 'get messages', { id })
  }
}))
```

**Query Details**:
- Filters: `session_id = ?`
- Ordering: `created_at ASC` (chronological)

#### Response Format (Success)

```typescript
{
  data: [
    {
      id: 1,
      session_id: "session_abc123",
      role: "user",
      text: "What are the side effects of lisinopril?",
      model_id: null,
      token_usage: null,
      importance_score: 0.5,
      created_at: "2024-10-20T10:00:00.000Z"
    },
    {
      id: 2,
      session_id: "session_abc123",
      role: "assistant",
      text: "Lisinopril is an ACE inhibitor commonly used to treat high blood pressure...",
      model_id: "gpt-4-turbo",
      token_usage: 450,
      importance_score: 0.8,
      created_at: "2024-10-20T10:00:15.000Z"
    },
    {
      id: 3,
      session_id: "session_abc123",
      role: "user",
      text: "Can I take it with aspirin?",
      model_id: null,
      token_usage: null,
      importance_score: 0.5,
      created_at: "2024-10-20T10:01:00.000Z"
    }
    // ... more messages
  ]
}
```

#### Example Request

```typescript
const response = await fetch('/api/sessions/session_abc123/messages')
const data = await response.json()

console.log(`Messages: ${data.data.length}`)

data.data.forEach(msg => {
  console.log(`[${msg.role}]: ${msg.text.substring(0, 100)}...`)
})
```

**Use Case**: Load conversation history for chat panel display

---

### POST /api/sessions/save

**Purpose**: Mark a session as saved and generate AI recap.

#### Request Body

```typescript
{
  sessionId: string;        // Required
  name?: string;            // Optional (default "Untitled Chat")
  model?: string;           // Optional
  persona_id?: string;      // Optional
  recap?: string;           // Optional (bypass AI generation)
  allowEmpty?: boolean;     // Optional (default false)
}
```

#### Implementation

```typescript
router.post('/save', asyncHandler(async (req: Request, res: Response) => {
  // 1. Validate input
  const parse = saveSessionSchema.safeParse(req.body)
  if (!parse.success) {
    return err(res, 400, 'VALIDATION_ERROR', parse.error.flatten().formErrors.join('; '))
  }
  
  const { sessionId, name, model, persona_id, recap: providedRecap, allowEmpty } = parse.data

  // 2. Check message count
  const messageCount = db.prepare(`
    SELECT COUNT(*) as c FROM messages WHERE session_id = ?
  `).get(sessionId).c

  if (!allowEmpty && messageCount === 0) {
    return err(res, 400, 'VALIDATION_ERROR', 'Cannot save an empty session (no messages)')
  }

  // 3. Generate recap if not provided
  let recap = providedRecap
  if (!recap) {
    try {
      recap = await buildRecapWithAI(sessionId)
    } catch (summaryErr) {
      // Fallback: use last assistant message
      const lastAssistant = db.prepare(`
        SELECT text FROM messages
        WHERE session_id = ? AND role = 'assistant'
        ORDER BY created_at DESC LIMIT 1
      `).get(sessionId)
      
      const fallback = lastAssistant?.text || 'Conversation saved'
      recap = fallback.length > 500 ? fallback.slice(0, 500) + '…' : fallback
    }
  }

  // 4. Upsert session
  const existing = getSessionById(sessionId)
  const timestamp = nowISO()
  const finalName = name?.trim() || existing?.name || 'Untitled Chat'

  if (existing) {
    db.prepare(`
      UPDATE sessions
      SET name = COALESCE(?, name),
          model = COALESCE(?, model),
          persona_id = COALESCE(?, persona_id),
          recap = ?,
          saved = 1,
          updated_at = ?
      WHERE id = ?
    `).run(finalName, model ?? null, persona_id ?? null, recap, timestamp, sessionId)
  } else {
    db.prepare(`
      INSERT INTO sessions (id, name, model, recap, persona_id, created_at, updated_at, saved)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `).run(sessionId, finalName, model ?? null, recap, persona_id ?? null, timestamp, timestamp)
  }

  const savedSession = getSessionById(sessionId)
  return okItem(res, savedSession)
}))
```

**Save Behavior**:
1. Validates request body
2. Checks message count (rejects empty unless `allowEmpty=true`)
3. Generates AI recap if not provided (or uses fallback)
4. Upserts session row with `saved=1`
5. Returns updated session

**AI Recap Generation**:
- Uses MemoryManager to create conversation summary
- Stores full summary in `conversation_summaries` table
- Truncates to 500 chars for `recap` field
- Falls back to last assistant message on error

#### Response Format (Success)

```typescript
{
  data: {
    id: "session_abc123",
    name: "Medical Questions",
    model: "gpt-4-turbo",
    recap: "Discussion about medication interactions and dosage schedules. User asked about lisinopril side effects and interactions with aspirin...",
    persona_id: "medical-advisor",
    created_at: "2024-10-20T10:00:00.000Z",
    updated_at: "2024-10-28T16:00:00.000Z",
    saved: 1
  }
}
```

**HTTP Status**: 200

#### Response Format (Empty Session)

```typescript
{
  success: false,
  error: {
    code: "VALIDATION_ERROR",
    message: "Cannot save an empty session (no messages)"
  }
}
```

**HTTP Status**: 400

#### Example Requests

```typescript
// Save with auto-generated recap
const save1 = await fetch('/api/sessions/save', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: 'session_abc123',
    name: 'Medical Questions'
  })
})

// Save with custom recap (bypass AI)
const save2 = await fetch('/api/sessions/save', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: 'session_def456',
    name: 'Quick Chat',
    recap: 'Brief conversation about weather',
    model: 'gpt-4-turbo',
    persona_id: 'friendly-companion'
  })
})

// Save empty session (for testing)
const save3 = await fetch('/api/sessions/save', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: 'session_empty',
    name: 'Empty Session',
    allowEmpty: true
  })
})
```

**Use Case**: Persist important conversations for future reference

---

### DELETE /api/sessions/:id

**Purpose**: Delete a session and all related data (messages, summaries, pins).

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Session ID to delete |

#### Implementation

```typescript
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  if (!id) return err(res, 400, 'VALIDATION_ERROR', 'Missing session id')

  try {
    const exists = getSessionById(id)
    if (!exists) return err(res, 404, 'NOT_FOUND', 'Session not found')

    const trx = db.transaction(() => {
      // Delete messages (no foreign key constraint in some setups)
      db.prepare(`DELETE FROM messages WHERE session_id = ?`).run(id)
      
      // Delete summaries (if table exists)
      try {
        db.prepare(`DELETE FROM conversation_summaries WHERE session_id = ?`).run(id)
      } catch (err) {
        // Table might not exist, continue anyway
      }
      
      // Delete pins (if table exists)
      try {
        db.prepare(`DELETE FROM semantic_pins WHERE session_id = ?`).run(id)
      } catch (err) {
        // Table might not exist, continue anyway
      }
      
      // Finally delete session
      db.prepare(`DELETE FROM sessions WHERE id = ?`).run(id)
    })
    
    trx()  // Execute transaction

    logInfo('Session deleted', { sessionId: id })
    return okItem(res, { id, deleted: true })
  } catch (error) {
    return handleRouterError(res, error, 'delete session', { id })
  }
}))
```

**Delete Behavior**:
1. Checks session exists
2. Wraps deletes in transaction
3. Deletes related data:
   - Messages (all messages in session)
   - Conversation summaries (if table exists)
   - Semantic pins (if table exists)
4. Deletes session itself
5. Rolls back on error

**Cascade Behavior**: Deletes all related records atomically

#### Response Format (Success)

```typescript
{
  data: {
    id: "session_abc123",
    deleted: true
  }
}
```

#### Response Format (Not Found)

```typescript
{
  success: false,
  error: {
    code: "NOT_FOUND",
    message: "Session not found"
  }
}
```

**HTTP Status**: 404

#### Example Request

```typescript
const response = await fetch('/api/sessions/session_abc123', {
  method: 'DELETE'
})

const data = await response.json()

if (data.data?.deleted) {
  console.log(`Session ${data.data.id} deleted successfully`)
}
```

**Use Case**: Remove unwanted conversations, cleanup test data

---

### POST /api/sessions/cleanup-orphans

**Purpose**: Backfill orphaned messages into a placeholder session (migration utility).

#### Request Body

None.

#### Implementation

```typescript
router.post('/cleanup-orphans', asyncHandler(async (_req: Request, res: Response) => {
  try {
    // 1. Count orphans
    const orphanCount = db.prepare(`
      SELECT COUNT(*) as c FROM messages
      WHERE session_id IS NULL
         OR session_id NOT IN (SELECT id FROM sessions)
    `).get().c

    if (orphanCount === 0) {
      return okItem(res, { updated: 0, note: 'No orphan messages found' })
    }

    // 2. Create placeholder session if needed
    const ts = nowISO()
    db.prepare(`
      INSERT INTO sessions (id, name, model, recap, persona_id, created_at, updated_at, saved)
      SELECT 'orphan-cleanup', 'Orphaned Messages', 'unknown',
             'Backfilled orphaned messages', NULL, ?, ?, 0
      WHERE NOT EXISTS (SELECT 1 FROM sessions WHERE id = 'orphan-cleanup')
    `).run(ts, ts)

    // 3. Reassign orphans
    const updated = db.prepare(`
      UPDATE messages
      SET session_id = 'orphan-cleanup'
      WHERE session_id IS NULL
         OR session_id NOT IN (SELECT id FROM sessions)
    `).run().changes

    logInfo('Orphan cleanup complete', { updated })
    return okItem(res, { updated })
  } catch (error) {
    return handleRouterError(res, error, 'cleanup orphans')
  }
}))
```

**Behavior**:
1. Finds orphaned messages (NULL session_id or invalid session_id)
2. Creates `orphan-cleanup` session if needed
3. Reassigns all orphans to placeholder
4. Returns count of updated messages

**Use Case**: One-time migration, database maintenance

#### Response Format (Success)

```typescript
{
  data: {
    updated: 42
  }
}
```

#### Response Format (No Orphans)

```typescript
{
  data: {
    updated: 0,
    note: "No orphan messages found"
  }
}
```

#### Example Request

```typescript
const response = await fetch('/api/sessions/cleanup-orphans', {
  method: 'POST'
})

const data = await response.json()
console.log(`Cleaned up ${data.data.updated} orphaned messages`)
```

---

## Usage Examples

### Load Session with Messages

```typescript
async function loadFullSession(sessionId: string) {
  // 1. Get session metadata
  const sessionRes = await fetch(`/api/sessions/${sessionId}`)
  const sessionData = await sessionRes.json()
  
  if (!sessionData.data) {
    console.error('Session not found')
    return null
  }
  
  // 2. Get messages
  const messagesRes = await fetch(`/api/sessions/${sessionId}/messages`)
  const messagesData = await messagesRes.json()
  
  return {
    session: sessionData.data,
    messages: messagesData.data
  }
}

// Usage
const conversation = await loadFullSession('session_abc123')
console.log(`Session: ${conversation.session.name}`)
console.log(`Messages: ${conversation.messages.length}`)
console.log(`Recap: ${conversation.session.recap}`)
```

### Save Session with Custom Name

```typescript
async function saveConversation(sessionId: string, name: string) {
  const response = await fetch('/api/sessions/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId,
      name
    })
  })
  
  const data = await response.json()
  
  if (data.data) {
    console.log(`✅ Saved: ${data.data.name}`)
    console.log(`Recap: ${data.data.recap?.substring(0, 100)}...`)
    return data.data
  } else {
    console.error(`❌ Save failed: ${data.error.message}`)
    return null
  }
}

// Usage
await saveConversation('session_abc123', 'Medical Consultation')
```

### Display Session History

```typescript
async function displaySessionHistory() {
  const response = await fetch('/api/sessions')
  const data = await response.json()
  
  console.log('📚 Session History')
  console.log('─────────────────────────────')
  
  data.data.forEach((session, index) => {
    const date = new Date(session.updated_at).toLocaleDateString()
    console.log(`${index + 1}. ${session.name}`)
    console.log(`   ${session.recap?.substring(0, 80)}...`)
    console.log(`   Last active: ${date}`)
    console.log('')
  })
}
```

### Delete Session with Confirmation

```typescript
async function deleteSessionSafely(sessionId: string) {
  // 1. Get session info
  const getRes = await fetch(`/api/sessions/${sessionId}`)
  const getData = await getRes.json()
  
  if (!getData.data) {
    console.error('Session not found')
    return false
  }
  
  // 2. Confirm deletion
  const confirm = window.confirm(
    `Delete "${getData.data.name}"?\n\n` +
    `This will permanently delete all messages and cannot be undone.`
  )
  
  if (!confirm) return false
  
  // 3. Delete
  const deleteRes = await fetch(`/api/sessions/${sessionId}`, {
    method: 'DELETE'
  })
  
  const deleteData = await deleteRes.json()
  
  if (deleteData.data?.deleted) {
    console.log('✅ Session deleted')
    return true
  } else {
    console.error('❌ Delete failed')
    return false
  }
}
```

### Export Session to JSON

```typescript
async function exportSession(sessionId: string) {
  const conversation = await loadFullSession(sessionId)
  
  if (!conversation) return null
  
  const exportData = {
    session: {
      id: conversation.session.id,
      name: conversation.session.name,
      persona_id: conversation.session.persona_id,
      created_at: conversation.session.created_at,
      updated_at: conversation.session.updated_at,
    },
    messages: conversation.messages.map(msg => ({
      role: msg.role,
      text: msg.text,
      created_at: msg.created_at
    })),
    exported_at: new Date().toISOString()
  }
  
  // Download as JSON file
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
    type: 'application/json' 
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${conversation.session.name}-${sessionId}.json`
  a.click()
  
  return exportData
}
```

---

## Best Practices

### 1. Always Save Important Conversations

```typescript
// ✅ GOOD: Save after meaningful conversations
async function handleConversationEnd(sessionId: string) {
  const messageCount = await getMessageCount(sessionId)
  
  if (messageCount > 3) {  // More than simple greeting
    await fetch('/api/sessions/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    })
  }
}

// ❌ BAD: Never save sessions
// Users lose conversation history
```

### 2. Provide Custom Names

```typescript
// ✅ GOOD: Descriptive session names
await saveSession({
  sessionId: 'session_abc',
  name: 'Medication Side Effects Discussion'
})

// ⚠️ OKAY: Auto-generated names
await saveSession({
  sessionId: 'session_abc'
  // Defaults to "Untitled Chat"
})

// ❌ BAD: Generic names
await saveSession({
  sessionId: 'session_abc',
  name: 'Chat'  // Not descriptive
})
```

### 3. Handle Empty Sessions

```typescript
// ✅ GOOD: Check before saving
async function saveSafely(sessionId: string) {
  const messages = await fetch(`/api/sessions/${sessionId}/messages`)
    .then(r => r.json())
  
  if (messages.data.length === 0) {
    console.log('No messages to save')
    return null
  }
  
  return await saveSession(sessionId)
}

// ❌ BAD: Attempt to save empty
await saveSession('session_empty')
// Returns 400 error
```

### 4. Confirm Before Deleting

```typescript
// ✅ GOOD: Confirm destructive actions
async function deleteWithConfirm(sessionId: string, sessionName: string) {
  const confirmed = window.confirm(
    `Delete "${sessionName}"? This cannot be undone.`
  )
  
  if (confirmed) {
    await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' })
  }
}

// ❌ BAD: Delete without confirmation
await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' })
```

### 5. Use Recap for Search/Display

```typescript
// ✅ GOOD: Display recap in session list
function SessionCard({ session }) {
  return (
    <div className="session-card">
      <h3>{session.name}</h3>
      <p className="recap">{session.recap}</p>
      <span className="date">{formatDate(session.updated_at)}</span>
    </div>
  )
}

// ✅ GOOD: Search by recap
function searchSessions(query: string, sessions: Session[]) {
  return sessions.filter(s => 
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    s.recap?.toLowerCase().includes(query.toLowerCase())
  )
}
```

### 6. Load Messages Separately

```typescript
// ✅ GOOD: Load session first, then messages on demand
async function SessionView({ sessionId }) {
  const [session, setSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    // Load session metadata immediately
    fetch(`/api/sessions/${sessionId}`)
      .then(r => r.json())
      .then(data => {
        setSession(data.data)
        // Then load messages
        return fetch(`/api/sessions/${sessionId}/messages`)
      })
      .then(r => r.json())
      .then(data => {
        setMessages(data.data)
        setLoading(false)
      })
  }, [sessionId])
  
  // ...
}

// ❌ BAD: Load everything at once
// Can be slow for sessions with many messages
```

---

## Frontend Integration

### Vue Session Sidebar Component

```vue
<template>
  <div class="session-sidebar">
    <h2>Conversations</h2>
    
    <button @click="showNewSessionDialog" class="btn-primary">
      + New Chat
    </button>
    
    <div v-if="loading" class="loading">Loading...</div>
    
    <div v-else-if="sessions.length === 0" class="empty">
      No saved conversations yet
    </div>
    
    <div v-else class="session-list">
      <div 
        v-for="session in sessions" 
        :key="session.id"
        :class="['session-item', { active: session.id === activeSessionId }]"
        @click="loadSession(session.id)"
      >
        <div class="session-header">
          <h3>{{ session.name }}</h3>
          <button 
            @click.stop="deleteSession(session.id, session.name)"
            class="btn-icon"
            title="Delete"
          >
            🗑️
          </button>
        </div>
        <p class="session-recap">{{ session.recap }}</p>
        <span class="session-date">
          {{ formatDate(session.updated_at) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const emit = defineEmits<{
  sessionSelected: [sessionId: string]
  newSession: []
}>()

const sessions = ref<any[]>([])
const loading = ref(true)
const activeSessionId = ref<string | null>(null)

async function loadSessions() {
  loading.value = true
  const response = await fetch('/api/sessions')
  const data = await response.json()
  sessions.value = data.data
  loading.value = false
}

function loadSession(sessionId: string) {
  activeSessionId.value = sessionId
  emit('sessionSelected', sessionId)
}

async function deleteSession(sessionId: string, sessionName: string) {
  const confirmed = window.confirm(
    `Delete "${sessionName}"?\n\nThis will permanently delete all messages.`
  )
  
  if (!confirmed) return
  
  const response = await fetch(`/api/sessions/${sessionId}`, {
    method: 'DELETE'
  })
  
  if (response.ok) {
    // Remove from list
    sessions.value = sessions.value.filter(s => s.id !== sessionId)
    
    // Clear active if deleted
    if (activeSessionId.value === sessionId) {
      activeSessionId.value = null
      emit('newSession')
    }
  }
}

function showNewSessionDialog() {
  activeSessionId.value = null
  emit('newSession')
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString()
}

onMounted(loadSessions)
</script>

<style scoped>
.session-sidebar {
  width: 300px;
  border-right: 1px solid #ddd;
  padding: 1rem;
  overflow-y: auto;
}

.session-list {
  margin-top: 1rem;
}

.session-item {
  padding: 0.75rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: background 0.2s;
}

.session-item:hover {
  background: #f5f5f5;
}

.session-item.active {
  background: #e3f2fd;
  border-color: #2196f3;
}

.session-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.session-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.session-recap {
  font-size: 0.85rem;
  color: #666;
  margin: 0.5rem 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.session-date {
  font-size: 0.75rem;
  color: #999;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  opacity: 0.6;
}

.btn-icon:hover {
  opacity: 1;
}

.empty {
  text-align: center;
  color: #999;
  padding: 2rem 1rem;
}
</style>
```

---

## Performance Considerations

### 1. List Query Performance

**Current**: Filters saved sessions, orders by date
```sql
SELECT * FROM sessions 
WHERE saved = 1 
ORDER BY COALESCE(updated_at, created_at) DESC
```

**Performance**: Fast for typical session counts (< 1000)

**Optimization**: Index already exists on `updated_at`

### 2. Message Loading

**Consideration**: Large sessions (1000+ messages) can be slow

**Optimization**:
- Paginate messages (LIMIT/OFFSET)
- Load recent messages first
- Implement virtual scrolling in UI

### 3. AI Recap Generation

**Latency**: Can take 2-5 seconds for large conversations

**Optimization**:
- Show loading indicator
- Allow user to provide custom recap
- Cache recaps (stored in database)

---

## Security Considerations

### 1. SQL Injection Protection

**Status**: ✅ Protected via parameterized queries

```typescript
// Safe
db.prepare('SELECT * FROM sessions WHERE id = ?').get(id)

// Vulnerable (not used)
db.exec(`SELECT * FROM sessions WHERE id = '${id}'`)
```

### 2. Cascade Delete Protection

**Status**: ✅ Transaction-wrapped deletes

**Protection**:
- All related data deleted atomically
- Rollback on error
- No orphaned messages

### 3. Rate Limiting

**Status**: ✅ Enabled via middleware

**Protection**:
- Prevents save spam
- Mitigates delete abuse

### 4. Session Ownership

**Recommendation**: Add user_id field for multi-user systems

```sql
ALTER TABLE sessions ADD COLUMN user_id TEXT;
CREATE INDEX idx_sessions_user ON sessions(user_id);
```

---

## Summary

The **Session Router** manages conversation sessions and message history:

**Endpoints (5 total)**:
- **GET /api/sessions** - List saved sessions (newest first)
- **GET /api/sessions/:id** - Get specific session
- **GET /api/sessions/:id/messages** - Get session messages (chronological)
- **POST /api/sessions/save** - Save session with AI recap
- **DELETE /api/sessions/:id** - Delete session and all data
- **POST /api/sessions/cleanup-orphans** - Backfill orphaned messages (utility)

**Key Features**:
- Session persistence (saved flag)
- AI-powered conversation recaps (via MemoryManager)
- Message history storage
- Cascade deletes (messages, summaries, pins)
- Transaction safety
- Orphan cleanup utility

**Save Behavior**:
- Rejects empty sessions (unless `allowEmpty=true`)
- Auto-generates AI recap if not provided
- Falls back to last assistant message on error
- Upserts session with `saved=1` flag

**Delete Behavior**:
- Cascading delete of all related data
- Transaction-wrapped for atomicity
- Rollback on error

**Use Cases**:
- Persistent conversation history
- Load previous chats
- Organize conversations by topic
- Generate conversation summaries
- Export chat transcripts
- Multi-session management

**Integration**:
Sessions are the foundation of the chat system. Each session represents a conversation thread with an AI persona, containing messages, summaries, and context. Essential for eldercare scenarios requiring continuity of care discussions and historical reference.
