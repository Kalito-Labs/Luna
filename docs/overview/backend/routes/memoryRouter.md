# Memory Router Documentation

## Overview

The `memoryRouter.ts` file implements the **Phase 2 memory system** for intelligent conversation management. It provides endpoints for creating summaries, managing semantic pins, scoring message importance, and building optimized context for AI conversations.

**Location**: `/backend/routes/memoryRouter.ts`

**Mounted At**: `/api/memory`

**Created**: August 24, 2025

**Purpose**:
- Build intelligent conversation context for AI models
- Create and manage conversation summaries
- Create and retrieve semantic pins (key conversation points)
- Score messages for importance
- Provide memory statistics and insights
- Optimize context delivery within token limits

**Key Features**:
- **Smart Context Building**: Combines recent messages, summaries, and pins intelligently
- **Conversation Summaries**: Auto-generated summaries of message ranges
- **Semantic Pins**: Important conversation points saved for later retrieval
- **Importance Scoring**: Automatic relevance scoring for messages
- **Token Optimization**: Truncates context to fit within model limits
- **Memory Statistics**: Track memory usage per session

---

## Architecture

### Dependencies

```typescript
import { Router } from 'express'
import { MemoryManager } from '../logic/memoryManager'
import { validateQuery, validateBody } from '../middleware/validation'
import { z } from 'zod'
import { db } from '../db/db'
import { okItem } from '../utils/apiContract'
import { handleRouterError } from '../utils/routerHelpers'
```

**Key Dependencies**:
- **MemoryManager**: Core logic for memory operations (lives in `/logic/memoryManager.ts`)
- **Validation Middleware**: Zod-based request validation
- **Database**: Direct queries for statistics
- **API Contract**: Standardized response format

**Delegation Pattern**: Router delegates most logic to `MemoryManager` class

---

## Database Schema

### Conversation Summaries Table

```sql
CREATE TABLE conversation_summaries (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  summary TEXT NOT NULL,
  message_count INTEGER NOT NULL,
  start_message_id TEXT,
  end_message_id TEXT,
  importance_score REAL DEFAULT 0.7,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);
```

**Field Explanations**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | TEXT | Yes | Primary key (generated) |
| `session_id` | TEXT | Yes | Foreign key to sessions table (CASCADE delete) |
| `summary` | TEXT | Yes | AI-generated summary of message range |
| `message_count` | INTEGER | Yes | Number of messages summarized |
| `start_message_id` | TEXT | No | ID of first message in range |
| `end_message_id` | TEXT | No | ID of last message in range |
| `importance_score` | REAL | Yes | Relevance score 0.0-1.0 (default: 0.7) |
| `created_at` | TEXT | Yes | Summary creation timestamp |

**Purpose**: Store compressed versions of conversation history to save tokens

### Semantic Pins Table

```sql
CREATE TABLE semantic_pins (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  content TEXT NOT NULL,
  source_message_id TEXT,
  importance_score REAL DEFAULT 0.8,
  pin_type TEXT DEFAULT 'user',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  medical_category TEXT,
  patient_id TEXT,
  urgency_level TEXT DEFAULT 'normal',
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE INDEX idx_semantic_pins_patient_medical 
  ON semantic_pins(patient_id, medical_category, importance_score DESC);
```

**Field Explanations**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | TEXT | Yes | Primary key (generated) |
| `session_id` | TEXT | Yes | Foreign key to sessions table (CASCADE delete) |
| `content` | TEXT | Yes | The pinned content/insight |
| `source_message_id` | TEXT | No | Message ID this pin was created from |
| `importance_score` | REAL | Yes | Relevance score 0.0-1.0 (default: 0.8) |
| `pin_type` | TEXT | Yes | Type: 'manual', 'auto', 'code', 'concept', 'system' (default: 'user') |
| `created_at` | TEXT | Yes | Pin creation timestamp |
| `medical_category` | TEXT | No | Eldercare: category like 'medication', 'symptoms', 'vitals' |
| `patient_id` | TEXT | No | Eldercare: associated patient ID |
| `urgency_level` | TEXT | Yes | Eldercare: 'normal', 'high', 'urgent' (default: 'normal') |

**Purpose**: Store key conversation insights that should persist across sessions

**Indexes**:
- `idx_semantic_pins_patient_medical`: Fast retrieval of eldercare-related pins by patient and category

---

## Validation Schemas

### Create Summary Schema

```typescript
const createSummarySchema = z.object({
  session_id: z.string().min(1),
  start_message_id: z.string(),
  end_message_id: z.string(),
  message_count: z.number().positive()
})
```

**Validation Rules**:
- `session_id`: Required, non-empty string
- `start_message_id`: Required string (first message ID in range)
- `end_message_id`: Required string (last message ID in range)
- `message_count`: Required positive number (how many messages summarized)

**Note**: The actual summary text is generated by AI (not in request body)

### Create Pin Schema

```typescript
const createPinSchema = z.object({
  session_id: z.string().min(1),
  content: z.string().min(1),
  source_message_id: z.string().optional(),
  importance_score: z.number().min(0).max(1).optional(),
  pin_type: z.enum(['manual', 'auto', 'code', 'concept', 'system']).optional()
})
```

**Validation Rules**:
- `session_id`: Required, non-empty string
- `content`: Required, non-empty string (the pin text)
- `source_message_id`: Optional reference to source message
- `importance_score`: Optional 0.0-1.0 score (defaults to 0.8)
- `pin_type`: Optional enum (defaults to 'user')

**Pin Types**:
- `manual`: User-created pin
- `auto`: Automatically detected important point
- `code`: Code snippet or technical detail
- `concept`: Key concept or definition
- `system`: System-generated insight

### Context Query Schema

```typescript
const contextQuerySchema = z.object({
  maxTokens: z.number().positive().optional()
})
```

**Validation Rules**:
- `maxTokens`: Optional positive number for token limit (defaults to 3000)

---

## Endpoints

### GET /api/memory/:sessionId/context

**Purpose**: Get intelligent memory context for a session, optimized for AI consumption.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sessionId` | string | Yes | Session ID to build context for |

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `maxTokens` | number | No | Maximum tokens for context (default: 3000) |

#### Implementation

```typescript
router.get('/:sessionId/context', 
  validateQuery(contextQuerySchema),
  async (req, res) => {
    const { sessionId } = req.params
    try {
      const { maxTokens } = req.query
      
      const context = await memoryManager.buildContext(
        sessionId, 
        maxTokens ? Number(maxTokens) : undefined
      )
      
      return okItem(res, context)
    } catch (error) {
      return handleRouterError(res, error, 'get memory context', { sessionId })
    }
  }
)
```

**Context Building Logic** (in MemoryManager):
1. Retrieve recent messages (last 8) with importance scores
2. Get top semantic pins (up to 5, sorted by importance)
3. Get recent summaries (up to 3, most recent first)
4. Estimate total token count
5. If over limit, intelligently truncate while preserving important content

**Smart Truncation Strategy**:
- Always preserve highest-importance pins
- Keep most recent messages
- Include most relevant summaries
- Drop lower-importance content first

#### Response Format

```typescript
{
  data: {
    recentMessages: [
      {
        id: 123,
        session_id: "sess_abc",
        role: "user",
        text: "What medications does my father take?",
        importance_score: 0.85,
        created_at: "2024-01-20T10:00:00.000Z"
      },
      {
        id: 124,
        session_id: "sess_abc",
        role: "assistant",
        text: "Based on the records, your father takes Lisinopril 10mg daily...",
        importance_score: 0.90,
        created_at: "2024-01-20T10:00:15.000Z"
      }
    ],
    semanticPins: [
      {
        id: "pin_xyz",
        session_id: "sess_abc",
        content: "Patient has allergy to penicillin - documented in medical history",
        importance_score: 0.95,
        pin_type: "auto",
        medical_category: "allergy",
        patient_id: "pat_123",
        created_at: "2024-01-15T14:30:00.000Z"
      }
    ],
    summaries: [
      {
        id: "sum_def",
        session_id: "sess_abc",
        summary: "Discussion about medication schedule adjustments and upcoming doctor appointment.",
        message_count: 12,
        importance_score: 0.75,
        created_at: "2024-01-18T16:00:00.000Z"
      }
    ],
    estimatedTokens: 2450
  }
}
```

**Enriched Context**:
- `recentMessages`: Last N important messages
- `semanticPins`: Key insights to remember
- `summaries`: Compressed conversation history
- `estimatedTokens`: Rough token count for the context

#### Example Request

```typescript
// Get context with default token limit (3000)
const response = await fetch('/api/memory/sess_abc/context')
const data = await response.json()

console.log(`Context includes:`)
console.log(`- ${data.data.recentMessages.length} recent messages`)
console.log(`- ${data.data.semanticPins.length} semantic pins`)
console.log(`- ${data.data.summaries.length} summaries`)
console.log(`- ~${data.data.estimatedTokens} tokens`)

// Get context with custom token limit
const compactContext = await fetch('/api/memory/sess_abc/context?maxTokens=1500')
```

**Use Case**: Called before sending messages to AI to include relevant conversation history

---

### POST /api/memory/summaries

**Purpose**: Create a new conversation summary for a range of messages.

#### Request Body

```typescript
{
  session_id: string;         // Required
  start_message_id: string;   // Required
  end_message_id: string;     // Required
  message_count: number;      // Required (positive)
}
```

#### Implementation

```typescript
router.post('/summaries',
  validateBody(createSummarySchema),
  async (req, res) => {
    try {
      const summary = await memoryManager.createSummary(req.body)
      
      return okItem(res, summary, 201)
    } catch (error) {
      return handleRouterError(res, error, 'create summary')
    }
  }
)
```

**Summary Creation Process** (in MemoryManager):
1. Retrieve all messages in the specified range
2. Format messages for AI summarization
3. Call AI model (prefers session's local model, falls back to cloud)
4. Generate concise summary preserving key points
5. Store summary in database with importance score
6. Return created summary

**AI Summarization Prompt**:
```
Summarize the following conversation concisely, preserving key information, 
decisions, and important context. Focus on what would be useful to remember 
in future conversations.
```

#### Response Format (Success)

```typescript
{
  data: {
    id: "sum_new123",
    session_id: "sess_abc",
    summary: "User discussed adjusting father's medication schedule due to morning nausea. Decided to move Metformin to evening dose. Scheduled follow-up with Dr. Johnson next week to review blood sugar levels.",
    message_count: 15,
    start_message_id: "100",
    end_message_id: "115",
    importance_score: 0.7,
    created_at: "2024-01-20T15:30:00.000Z"
  }
}
```

**HTTP Status**: 201 Created

#### Example Request

```typescript
const response = await fetch('/api/memory/summaries', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    session_id: 'sess_abc',
    start_message_id: '100',
    end_message_id: '115',
    message_count: 15
  })
})

if (response.status === 201) {
  const data = await response.json()
  console.log('Summary created:', data.data.summary)
}
```

**When to Use**:
- After long conversations (15+ messages)
- Before context window fills up
- When switching conversation topics
- To preserve important discussions

---

### POST /api/memory/pins

**Purpose**: Create a semantic pin to remember important conversation points.

#### Request Body

```typescript
{
  session_id: string;              // Required
  content: string;                 // Required (min 1 char)
  source_message_id?: string;      // Optional
  importance_score?: number;       // Optional (0.0-1.0, default: 0.8)
  pin_type?: 'manual' | 'auto' | 'code' | 'concept' | 'system';  // Optional
}
```

#### Implementation

```typescript
router.post('/pins',
  validateBody(createPinSchema),
  async (req, res) => {
    try {
      const pin = memoryManager.createSemanticPin(req.body)
      
      return okItem(res, pin, 201)
    } catch (error) {
      return handleRouterError(res, error, 'create semantic pin')
    }
  }
)
```

**Pin Creation Logic**:
- Generates unique pin ID
- Sets default importance_score (0.8) if not provided
- Sets default pin_type ('user') if not provided
- Stores in database
- Returns created pin

#### Response Format (Success)

```typescript
{
  data: {
    id: "pin_new456",
    session_id: "sess_abc",
    content: "Patient allergic to penicillin - severe reaction in 2010",
    source_message_id: "125",
    importance_score: 0.95,
    pin_type: "manual",
    created_at: "2024-01-20T16:00:00.000Z"
  }
}
```

**HTTP Status**: 201 Created

#### Example Requests

```typescript
// Manual pin (user-created)
await fetch('/api/memory/pins', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    session_id: 'sess_abc',
    content: 'Father prefers morning appointments due to better energy levels',
    importance_score: 0.85,
    pin_type: 'manual'
  })
})

// Auto-detected important point
await fetch('/api/memory/pins', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    session_id: 'sess_abc',
    content: 'New diagnosis: Type 2 Diabetes - starting Metformin 500mg',
    source_message_id: '142',
    importance_score: 0.98,
    pin_type: 'auto'
  })
})

// Code snippet pin
await fetch('/api/memory/pins', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    session_id: 'sess_code',
    content: 'const calculateDosage = (weight, age) => weight * 0.5 / age',
    pin_type: 'code',
    importance_score: 0.75
  })
})
```

**Use Cases**:
- Save critical medical information (allergies, diagnoses)
- Remember user preferences or decisions
- Preserve important code snippets
- Mark key concepts or definitions
- Track system-detected insights

---

### POST /api/memory/:sessionId/score-messages

**Purpose**: Score all messages in a session for importance (batch operation).

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sessionId` | string | Yes | Session ID to score messages for |

#### Implementation

```typescript
router.post('/:sessionId/score-messages', async (req, res) => {
  const { sessionId } = req.params
  try {
    // Get all messages for this session
    const messages = memoryManager['getRecentMessages'](sessionId, 1000)
    
    let updatedCount = 0
    for (const message of messages) {
      const importance = memoryManager.scoreMessageImportance(message)
      memoryManager.updateMessageImportance(message.id, importance)
      updatedCount++
    }
    
    return okItem(res, {
      messagesScored: updatedCount,
      sessionId
    })
  } catch (error) {
    return handleRouterError(res, error, 'score messages', { sessionId })
  }
})
```

**Importance Scoring Algorithm** (in MemoryManager):
- Analyzes message content for keywords, questions, decisions
- Higher scores for:
  - Questions (0.7+)
  - Action items or decisions (0.8+)
  - Medical terms, diagnoses, medications (0.8+)
  - Code blocks (0.75+)
  - Error messages or warnings (0.7+)
- Lower scores for:
  - Short acknowledgments (0.3-0.5)
  - Casual conversation (0.4-0.6)
  - Repeated information (0.4-0.6)

#### Response Format

```typescript
{
  data: {
    messagesScored: 42,
    sessionId: "sess_abc"
  }
}
```

#### Example Request

```typescript
const response = await fetch('/api/memory/sess_abc/score-messages', {
  method: 'POST'
})

const data = await response.json()
console.log(`Scored ${data.data.messagesScored} messages`)
```

**When to Use**:
- After importing old conversations
- When importance scores are missing
- To recalculate scores after algorithm changes
- Part of session maintenance

---

### GET /api/memory/:sessionId/stats

**Purpose**: Get memory statistics for a session.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sessionId` | string | Yes | Session ID to get stats for |

#### Implementation

```typescript
router.get('/:sessionId/stats', async (req, res) => {
  const { sessionId: _sessionId } = req.params
  try {
    // Get message count and importance stats
    const messageStats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        AVG(importance_score) as avgImportance,
        MIN(created_at) as oldest,
        MAX(created_at) as newest
      FROM messages 
      WHERE session_id = ?
    `).get(_sessionId) as {
      total: number
      avgImportance: number | null
      oldest: string | null
      newest: string | null
    } || { total: 0, avgImportance: null, oldest: null, newest: null }
    
    // Get summary count
    const summaryCount = db.prepare(`
      SELECT COUNT(*) as count 
      FROM conversation_summaries 
      WHERE session_id = ?
    `).get(_sessionId) as { count: number } || { count: 0 }
    
    // Get pin count
    const pinCount = db.prepare(`
      SELECT COUNT(*) as count 
      FROM semantic_pins 
      WHERE session_id = ?
    `).get(_sessionId) as { count: number } || { count: 0 }

    const stats = {
      totalMessages: messageStats.total,
      totalSummaries: summaryCount.count,
      totalPins: pinCount.count,
      oldestMessage: messageStats.oldest || '',
      newestMessage: messageStats.newest || '',
      averageImportanceScore: messageStats.avgImportance || 0
    }
    
    return okItem(res, stats)
  } catch (error) {
    return handleRouterError(res, error, 'get memory stats', { sessionId: _sessionId })
  }
})
```

**Statistics Collected**:
- Total message count
- Total summaries created
- Total semantic pins
- Oldest/newest message timestamps
- Average importance score

#### Response Format

```typescript
{
  data: {
    totalMessages: 142,
    totalSummaries: 8,
    totalPins: 12,
    oldestMessage: "2024-01-10T09:00:00.000Z",
    newestMessage: "2024-01-20T17:30:00.000Z",
    averageImportanceScore: 0.68
  }
}
```

#### Example Request

```typescript
const response = await fetch('/api/memory/sess_abc/stats')
const data = await response.json()

console.log(`Session Statistics:`)
console.log(`- ${data.data.totalMessages} messages`)
console.log(`- ${data.data.totalSummaries} summaries`)
console.log(`- ${data.data.totalPins} semantic pins`)
console.log(`- Avg importance: ${data.data.averageImportanceScore.toFixed(2)}`)
console.log(`- Active from ${data.data.oldestMessage} to ${data.data.newestMessage}`)
```

**Use Cases**:
- Dashboard displays
- Session health monitoring
- Identify sessions needing cleanup
- Track memory system usage

---

### GET /api/memory/:sessionId/needs-summarization

**Purpose**: Check if a session needs summarization (has enough unsummarized messages).

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sessionId` | string | Yes | Session ID to check |

#### Implementation

```typescript
router.get('/:sessionId/needs-summarization', async (req, res) => {
  const { sessionId } = req.params
  try {
    const needsSummary = memoryManager.needsSummarization(sessionId)
    
    return okItem(res, {
      needsSummarization: needsSummary,
      sessionId
    })
  } catch (error) {
    return handleRouterError(res, error, 'check summarization status', { sessionId })
  }
})
```

**Summarization Threshold Logic** (in MemoryManager):
- Default threshold: 15 unsummarized messages
- Compares message count vs last summary
- Returns `true` if threshold exceeded

#### Response Format

```typescript
{
  data: {
    needsSummarization: true,
    sessionId: "sess_abc"
  }
}
```

#### Example Request

```typescript
const response = await fetch('/api/memory/sess_abc/needs-summarization')
const data = await response.json()

if (data.data.needsSummarization) {
  console.log('Session needs summarization - creating summary...')
  // Trigger summary creation
  await createSummary(sessionId)
} else {
  console.log('Session is up to date')
}
```

**Use Cases**:
- Auto-trigger summarization in background
- UI indicators for long conversations
- Maintenance scripts
- Memory optimization workflows

---

## Usage Examples

### Build Context Before AI Call

```typescript
async function sendMessageWithContext(sessionId: string, userMessage: string) {
  // 1. Get memory context
  const contextRes = await fetch(`/api/memory/${sessionId}/context?maxTokens=2500`)
  const contextData = await contextRes.json()
  const memoryContext = contextData.data
  
  // 2. Build system message with context
  const systemMessage = `
You are a helpful AI assistant. Here's the conversation context:

SEMANTIC PINS (Important to Remember):
${memoryContext.semanticPins.map(p => `- ${p.content}`).join('\n')}

PREVIOUS DISCUSSION SUMMARIES:
${memoryContext.summaries.map(s => `- ${s.summary}`).join('\n')}

RECENT MESSAGES:
${memoryContext.recentMessages.map(m => `${m.role}: ${m.text}`).join('\n')}
`
  
  // 3. Send to AI with context
  const response = await fetch('/api/agent/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId,
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage }
      ]
    })
  })
  
  return response
}
```

### Auto-Summarize Long Conversations

```typescript
async function autoSummarize(sessionId: string) {
  // 1. Check if summarization needed
  const checkRes = await fetch(`/api/memory/${sessionId}/needs-summarization`)
  const checkData = await checkRes.json()
  
  if (!checkData.data.needsSummarization) {
    console.log('No summarization needed')
    return null
  }
  
  // 2. Get current stats
  const statsRes = await fetch(`/api/memory/${sessionId}/stats`)
  const stats = await statsRes.json()
  
  // 3. Determine message range to summarize
  // (In real implementation, you'd track last summarized message)
  const startMessageId = '100'  // Last summarized message + 1
  const endMessageId = stats.data.totalMessages.toString()
  const messageCount = stats.data.totalMessages - 100
  
  // 4. Create summary
  const summaryRes = await fetch('/api/memory/summaries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      start_message_id: startMessageId,
      end_message_id: endMessageId,
      message_count: messageCount
    })
  })
  
  const summary = await summaryRes.json()
  console.log('Created summary:', summary.data.summary)
  return summary.data
}
```

### Pin Important Medical Information

```typescript
async function pinMedicalInfo(sessionId: string, content: string, category: string, patientId: string) {
  const response = await fetch('/api/memory/pins', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      content: content,
      importance_score: 0.95,  // High importance for medical data
      pin_type: 'auto',
      // Note: medical_category and patient_id are custom fields
      // Would need to be added to validation schema
    })
  })
  
  return response.json()
}

// Usage
await pinMedicalInfo(
  'sess_abc',
  'Patient allergic to penicillin - severe reaction documented 2010',
  'allergy',
  'pat_123'
)
```

### Score Messages After Import

```typescript
async function importAndScoreMessages(sessionId: string, messages: any[]) {
  // 1. Import messages (hypothetical endpoint)
  await fetch(`/api/sessions/${sessionId}/import-messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages })
  })
  
  // 2. Score all imported messages
  const scoreRes = await fetch(`/api/memory/${sessionId}/score-messages`, {
    method: 'POST'
  })
  
  const scoreData = await scoreRes.json()
  console.log(`Scored ${scoreData.data.messagesScored} imported messages`)
  
  return scoreData
}
```

### Memory Dashboard

```typescript
async function getMemoryDashboard(sessionId: string) {
  // Parallel requests for efficiency
  const [statsRes, contextRes] = await Promise.all([
    fetch(`/api/memory/${sessionId}/stats`),
    fetch(`/api/memory/${sessionId}/context?maxTokens=1000`)
  ])
  
  const stats = await statsRes.json()
  const context = await contextRes.json()
  
  const dashboard = {
    stats: stats.data,
    recentPins: context.data.semanticPins.slice(0, 5),
    recentSummaries: context.data.summaries.slice(0, 3),
    contextSize: context.data.estimatedTokens
  }
  
  console.log('Memory Dashboard:')
  console.log(`- Messages: ${dashboard.stats.totalMessages}`)
  console.log(`- Summaries: ${dashboard.stats.totalSummaries}`)
  console.log(`- Pins: ${dashboard.stats.totalPins}`)
  console.log(`- Context Size: ~${dashboard.contextSize} tokens`)
  
  return dashboard
}
```

---

## Best Practices

### 1. Use Context Building for Every AI Call

```typescript
// ✅ GOOD: Include memory context
async function callAI(sessionId: string, message: string) {
  const context = await fetch(`/api/memory/${sessionId}/context`)
  const contextData = await context.json()
  
  // Use context in system message
  return callAIWithContext(contextData.data, message)
}

// ❌ BAD: No context (AI forgets previous conversations)
async function callAI(sessionId: string, message: string) {
  return callAIDirectly(message)  // No memory!
}
```

### 2. Tune Token Limits Based on Model

```typescript
// ✅ GOOD: Adjust maxTokens for different models
const tokenLimits = {
  'gpt-4': 6000,
  'gpt-3.5-turbo': 3000,
  'claude-3': 8000,
  'local-llama': 2000
}

const maxTokens = tokenLimits[modelId] || 3000
const context = await fetch(`/api/memory/${sessionId}/context?maxTokens=${maxTokens}`)
```

### 3. Create Pins for Critical Information

```typescript
// ✅ GOOD: Pin important medical data immediately
async function recordAllergy(sessionId: string, allergen: string) {
  await fetch('/api/memory/pins', {
    method: 'POST',
    body: JSON.stringify({
      session_id: sessionId,
      content: `ALLERGY: Patient allergic to ${allergen}`,
      importance_score: 0.98,  // Critical!
      pin_type: 'auto'
    })
  })
}

// ⚠️ OKAY: Rely on AI to remember (might forget)
// Just mention allergy in conversation without pinning
```

### 4. Summarize Regularly

```typescript
// ✅ GOOD: Check and summarize automatically
setInterval(async () => {
  const activeSessions = await getActiveSessions()
  
  for (const session of activeSessions) {
    const check = await fetch(`/api/memory/${session.id}/needs-summarization`)
    const data = await check.json()
    
    if (data.data.needsSummarization) {
      await autoSummarize(session.id)
    }
  }
}, 5 * 60 * 1000)  // Every 5 minutes

// ❌ BAD: Never summarize (context window fills up)
```

### 5. Use Importance Scores Wisely

```typescript
// ✅ GOOD: Set importance based on content type
const importanceScores = {
  allergy: 0.98,
  diagnosis: 0.95,
  medication: 0.90,
  appointment: 0.85,
  symptom: 0.80,
  note: 0.70,
  casual: 0.50
}

// Pin with appropriate score
await createPin({
  content: "Patient diagnosed with Type 2 Diabetes",
  importance_score: importanceScores.diagnosis
})
```

### 6. Score Messages After Batch Operations

```typescript
// ✅ GOOD: Score after importing old data
async function migrateOldConversation(sessionId: string, oldMessages: any[]) {
  // 1. Import messages
  await importMessages(sessionId, oldMessages)
  
  // 2. Score all imported messages
  await fetch(`/api/memory/${sessionId}/score-messages`, { method: 'POST' })
  
  // 3. Create initial summary if needed
  if (oldMessages.length > 15) {
    await autoSummarize(sessionId)
  }
}
```

---

## Frontend Integration

### Memory Context Display

```vue
<template>
  <div class="memory-context">
    <div class="context-stats">
      <h3>Memory Context</h3>
      <div class="stats-grid">
        <div class="stat">
          <label>Messages:</label>
          <span>{{ context.recentMessages.length }}</span>
        </div>
        <div class="stat">
          <label>Pins:</label>
          <span>{{ context.semanticPins.length }}</span>
        </div>
        <div class="stat">
          <label>Summaries:</label>
          <span>{{ context.summaries.length }}</span>
        </div>
        <div class="stat">
          <label>Tokens:</label>
          <span>~{{ context.estimatedTokens }}</span>
        </div>
      </div>
    </div>
    
    <div class="semantic-pins" v-if="context.semanticPins.length > 0">
      <h4>📌 Important Points</h4>
      <div v-for="pin in context.semanticPins" :key="pin.id" class="pin-item">
        <div class="pin-content">{{ pin.content }}</div>
        <div class="pin-meta">
          <span class="importance">{{ (pin.importance_score * 100).toFixed(0) }}%</span>
          <span class="type">{{ pin.pin_type }}</span>
        </div>
      </div>
    </div>
    
    <div class="summaries" v-if="context.summaries.length > 0">
      <h4>📝 Previous Discussions</h4>
      <div v-for="summary in context.summaries" :key="summary.id" class="summary-item">
        <p>{{ summary.summary }}</p>
        <small>{{ summary.message_count }} messages</small>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{ sessionId: string }>()

const context = ref({
  recentMessages: [],
  semanticPins: [],
  summaries: [],
  estimatedTokens: 0
})

async function loadContext() {
  const response = await fetch(`/api/memory/${props.sessionId}/context?maxTokens=3000`)
  const data = await response.json()
  context.value = data.data
}

onMounted(loadContext)
</script>

<style scoped>
.semantic-pins {
  margin-top: 1.5rem;
}

.pin-item {
  background: #fff3cd;
  border-left: 4px solid #ffc107;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  border-radius: 4px;
}

.pin-meta {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: #666;
}

.importance {
  font-weight: bold;
  color: #ff6b6b;
}
</style>
```

### Create Pin Component

```vue
<template>
  <div class="create-pin">
    <button @click="showDialog = true" class="btn-secondary">
      📌 Pin This
    </button>
    
    <dialog v-if="showDialog" open class="pin-dialog">
      <h3>Create Semantic Pin</h3>
      
      <form @submit.prevent="createPin">
        <div class="form-group">
          <label>Content to Remember *</label>
          <textarea 
            v-model="form.content" 
            rows="4" 
            required
            placeholder="Enter important information to remember..."
          ></textarea>
        </div>
        
        <div class="form-group">
          <label>Importance</label>
          <input 
            v-model.number="form.importance_score" 
            type="range" 
            min="0" 
            max="1" 
            step="0.05"
          />
          <span>{{ (form.importance_score * 100).toFixed(0) }}%</span>
        </div>
        
        <div class="form-group">
          <label>Type</label>
          <select v-model="form.pin_type">
            <option value="manual">Manual (User Created)</option>
            <option value="auto">Auto-Detected</option>
            <option value="code">Code Snippet</option>
            <option value="concept">Key Concept</option>
          </select>
        </div>
        
        <div class="form-actions">
          <button type="submit" class="btn-primary">Create Pin</button>
          <button type="button" @click="showDialog = false" class="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{ sessionId: string; messageId?: string }>()
const emit = defineEmits<{ pinCreated: [pin: any] }>()

const showDialog = ref(false)
const form = ref({
  content: '',
  importance_score: 0.8,
  pin_type: 'manual'
})

async function createPin() {
  const response = await fetch('/api/memory/pins', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: props.sessionId,
      content: form.value.content,
      importance_score: form.value.importance_score,
      pin_type: form.value.pin_type,
      source_message_id: props.messageId
    })
  })
  
  if (response.ok) {
    const data = await response.json()
    emit('pinCreated', data.data)
    showDialog.value = false
    form.value.content = ''
  }
}
</script>
```

### Memory Statistics Widget

```vue
<template>
  <div class="memory-stats-widget">
    <h3>Session Memory</h3>
    
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">{{ stats.totalMessages }}</div>
        <div class="stat-label">Messages</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-value">{{ stats.totalSummaries }}</div>
        <div class="stat-label">Summaries</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-value">{{ stats.totalPins }}</div>
        <div class="stat-label">Pins</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-value">{{ avgImportance }}%</div>
        <div class="stat-label">Avg Importance</div>
      </div>
    </div>
    
    <div class="actions">
      <button 
        v-if="needsSummarization" 
        @click="createSummary"
        class="btn-primary"
      >
        Create Summary
      </button>
      <button @click="scoreMessages" class="btn-secondary">
        Score Messages
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const props = defineProps<{ sessionId: string }>()

const stats = ref({
  totalMessages: 0,
  totalSummaries: 0,
  totalPins: 0,
  averageImportanceScore: 0
})

const needsSummarization = ref(false)

const avgImportance = computed(() => 
  (stats.value.averageImportanceScore * 100).toFixed(0)
)

async function loadStats() {
  const [statsRes, summaryCheckRes] = await Promise.all([
    fetch(`/api/memory/${props.sessionId}/stats`),
    fetch(`/api/memory/${props.sessionId}/needs-summarization`)
  ])
  
  const statsData = await statsRes.json()
  const summaryData = await summaryCheckRes.json()
  
  stats.value = statsData.data
  needsSummarization.value = summaryData.data.needsSummarization
}

async function createSummary() {
  // Implementation would need message range logic
  console.log('Creating summary...')
}

async function scoreMessages() {
  const response = await fetch(`/api/memory/${props.sessionId}/score-messages`, {
    method: 'POST'
  })
  
  if (response.ok) {
    await loadStats()
  }
}

onMounted(loadStats)
</script>
```

---

## Performance Considerations

### 1. Caching in MemoryManager

**Built-in Caching**:
```typescript
private messageCountCache = new Map<string, { count: number; timestamp: number }>()
private recentMessagesCache = new Map<string, { messages: MessageWithImportance[]; timestamp: number }>()
private readonly CACHE_TTL = 5000  // 5 seconds
```

**Benefits**:
- Reduces repeated database queries
- Improves context building speed
- 5-second TTL balances freshness vs performance

**Cache Invalidation**: Automatic after 5 seconds

### 2. Query Optimization

**Stats Endpoint**: Uses aggregate functions efficiently
```sql
-- Single query for message stats
SELECT 
  COUNT(*) as total,
  AVG(importance_score) as avgImportance,
  MIN(created_at) as oldest,
  MAX(created_at) as newest
FROM messages 
WHERE session_id = ?
```

**Performance**: Sub-millisecond for typical sessions (< 1000 messages)

### 3. Token Estimation

**Algorithm**: Character-based approximation
```typescript
// Rough estimation: ~4 characters per token
estimatedTokens = totalCharacters / 4
```

**Trade-off**: Fast but approximate (good enough for context limiting)

### 4. Smart Truncation

**Strategy**:
1. Keep all high-importance content (score > 0.8)
2. Drop lower-importance summaries first
3. Trim older messages before newer ones
4. Always preserve at least 3 recent messages

**Result**: Maximizes context quality within token budget

---

## Security Considerations

### 1. SQL Injection Protection

**Status**: ✅ Protected via parameterized queries

```typescript
// Safe - parameterized
db.prepare('SELECT * FROM messages WHERE session_id = ?').all(sessionId)

// Vulnerable (not used)
db.exec(`SELECT * FROM messages WHERE session_id = '${sessionId}'`)
```

### 2. Session Authorization

**Current State**: No authorization checks

**Recommendation**: Add middleware to verify session ownership

```typescript
async function authorizeSessionAccess(req, res, next) {
  const { sessionId } = req.params
  const userId = req.user?.id
  
  const session = db.prepare('SELECT id FROM sessions WHERE id = ? AND user_id = ?')
    .get(sessionId, userId)
  
  if (!session) {
    return err(res, 403, 'FORBIDDEN', 'Access denied')
  }
  
  next()
}

// Apply to all memory routes
router.use('/:sessionId/*', authorizeSessionAccess)
```

### 3. Input Validation

**Status**: ✅ Protected via Zod schemas

**Validates**:
- Required fields
- Data types
- Value ranges (importance_score: 0-1)
- Enum values (pin_type)

### 4. Foreign Key Constraints

**Status**: ✅ CASCADE delete implemented

```sql
FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
```

**Effect**: When session deleted, all summaries and pins automatically removed

---

## Testing Considerations

### Unit Test Scenarios

```typescript
describe('Memory Router', () => {
  let testSessionId: string
  
  beforeEach(async () => {
    // Create test session
    const session = await request(app)
      .post('/api/sessions')
      .send({ name: 'Test Session' })
    testSessionId = session.body.data.id
  })
  
  describe('GET /api/memory/:sessionId/context', () => {
    it('should build context with messages, pins, and summaries', async () => {
      // Create test data
      await createTestMessages(testSessionId, 10)
      await createTestPin(testSessionId, 'Important point')
      await createTestSummary(testSessionId)
      
      const response = await request(app)
        .get(`/api/memory/${testSessionId}/context`)
      
      expect(response.status).toBe(200)
      expect(response.body.data).toHaveProperty('recentMessages')
      expect(response.body.data).toHaveProperty('semanticPins')
      expect(response.body.data).toHaveProperty('summaries')
      expect(response.body.data).toHaveProperty('estimatedTokens')
    })
    
    it('should respect maxTokens parameter', async () => {
      await createTestMessages(testSessionId, 100)
      
      const response = await request(app)
        .get(`/api/memory/${testSessionId}/context?maxTokens=1000`)
      
      expect(response.body.data.estimatedTokens).toBeLessThanOrEqual(1000)
    })
  })
  
  describe('POST /api/memory/summaries', () => {
    it('should create conversation summary', async () => {
      const messages = await createTestMessages(testSessionId, 20)
      
      const response = await request(app)
        .post('/api/memory/summaries')
        .send({
          session_id: testSessionId,
          start_message_id: messages[0].id,
          end_message_id: messages[19].id,
          message_count: 20
        })
      
      expect(response.status).toBe(201)
      expect(response.body.data.summary).toBeTruthy()
      expect(response.body.data.message_count).toBe(20)
    })
    
    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/memory/summaries')
        .send({
          session_id: testSessionId
          // Missing other required fields
        })
      
      expect(response.status).toBe(400)
    })
  })
  
  describe('POST /api/memory/pins', () => {
    it('should create semantic pin', async () => {
      const response = await request(app)
        .post('/api/memory/pins')
        .send({
          session_id: testSessionId,
          content: 'Patient allergic to penicillin',
          importance_score: 0.95,
          pin_type: 'auto'
        })
      
      expect(response.status).toBe(201)
      expect(response.body.data.content).toBe('Patient allergic to penicillin')
      expect(response.body.data.importance_score).toBe(0.95)
    })
    
    it('should default importance_score if not provided', async () => {
      const response = await request(app)
        .post('/api/memory/pins')
        .send({
          session_id: testSessionId,
          content: 'Test pin'
        })
      
      expect(response.status).toBe(201)
      expect(response.body.data.importance_score).toBe(0.8)  // Default
    })
  })
  
  describe('POST /api/memory/:sessionId/score-messages', () => {
    it('should score all messages in session', async () => {
      await createTestMessages(testSessionId, 25)
      
      const response = await request(app)
        .post(`/api/memory/${testSessionId}/score-messages`)
      
      expect(response.status).toBe(200)
      expect(response.body.data.messagesScored).toBe(25)
      
      // Verify scores were updated
      const messages = db.prepare('SELECT importance_score FROM messages WHERE session_id = ?')
        .all(testSessionId)
      
      messages.forEach(msg => {
        expect(msg.importance_score).toBeGreaterThan(0)
      })
    })
  })
  
  describe('GET /api/memory/:sessionId/stats', () => {
    it('should return accurate statistics', async () => {
      await createTestMessages(testSessionId, 30)
      await createTestPin(testSessionId, 'Pin 1')
      await createTestPin(testSessionId, 'Pin 2')
      await createTestSummary(testSessionId)
      
      const response = await request(app)
        .get(`/api/memory/${testSessionId}/stats`)
      
      expect(response.status).toBe(200)
      expect(response.body.data.totalMessages).toBe(30)
      expect(response.body.data.totalPins).toBe(2)
      expect(response.body.data.totalSummaries).toBe(1)
      expect(response.body.data.averageImportanceScore).toBeGreaterThan(0)
    })
  })
  
  describe('GET /api/memory/:sessionId/needs-summarization', () => {
    it('should return true when threshold exceeded', async () => {
      await createTestMessages(testSessionId, 20)  // Threshold is 15
      
      const response = await request(app)
        .get(`/api/memory/${testSessionId}/needs-summarization`)
      
      expect(response.status).toBe(200)
      expect(response.body.data.needsSummarization).toBe(true)
    })
    
    it('should return false when under threshold', async () => {
      await createTestMessages(testSessionId, 10)
      
      const response = await request(app)
        .get(`/api/memory/${testSessionId}/needs-summarization`)
      
      expect(response.status).toBe(200)
      expect(response.body.data.needsSummarization).toBe(false)
    })
  })
})
```

---

## Summary

The **Memory Router** implements the Phase 2 memory system for intelligent conversation management:

**Endpoints (6 total)**:
- **GET /api/memory/:sessionId/context** - Build smart context for AI calls
- **POST /api/memory/summaries** - Create conversation summaries
- **POST /api/memory/pins** - Create semantic pins
- **POST /api/memory/:sessionId/score-messages** - Batch score messages
- **GET /api/memory/:sessionId/stats** - Get memory statistics
- **GET /api/memory/:sessionId/needs-summarization** - Check if summarization needed

**Key Features**:
- **Smart Context Building**: Combines messages, pins, summaries within token limits
- **AI Summarization**: Auto-generates summaries using session's model
- **Semantic Pins**: Save important points for long-term memory
- **Importance Scoring**: Automatic relevance detection
- **Token Optimization**: Intelligent truncation when over limits
- **Caching**: 5-second cache for repeated queries

**Core Concepts**:
- **Rolling Buffer**: Keep recent messages + summaries of older ones
- **Semantic Pins**: Key insights that persist across conversations
- **Importance Scores**: 0.0-1.0 relevance ratings
- **Smart Truncation**: Drop low-importance content first

**MemoryManager Delegation**:
Most logic lives in `/logic/memoryManager.ts`:
- Context building algorithm
- Summarization logic
- Importance scoring
- Token estimation
- Message retrieval with caching

**Use Cases**:
- Maintain conversation context across sessions
- Preserve important information (medical data, code snippets)
- Optimize token usage for cost efficiency
- Enable long-running conversations without context loss
- Track and display memory usage

**Integration**:
Call `/api/memory/:sessionId/context` before every AI message to include relevant history. The memory system ensures AI maintains continuity while staying within token budgets.
