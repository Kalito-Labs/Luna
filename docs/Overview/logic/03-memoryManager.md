# memoryManager.ts - Hybrid Conversation Memory System

## Purpose

`memoryManager.ts` implements a **sophisticated hybrid memory system** that allows AI to maintain context across long conversations without overwhelming the context window. It combines recent messages, semantic pins, and summaries to create smart, token-efficient context.

## Why This Matters

**Without memory management:**
```
User: "Create a poem about nature" [Message 1]
AI: [Creates poem]
User: "Make it shorter" [Message 50]
AI: "I don't know what you're referring to"
```

**With hybrid memory:**
```
Recent Messages: Last 8 messages (includes "make it shorter")
Semantic Pins: Original poem pinned for reference
Summaries: "User and AI collaborated on nature poetry"
AI: [Successfully shortens the poem from context]
```

---

## Core Architecture

```
┌─────────────────────────────────────────────────┐
│           MemoryManager.buildContext()           │
└─────────────────────────────────────────────────┘
                      ↓
    ┌─────────────────┴─────────────────┐
    ↓                 ↓                   ↓
┌─────────┐    ┌─────────┐        ┌─────────┐
│ Recent  │    │Semantic │        │Summaries│
│Messages │    │  Pins   │        │         │
│(last 8) │    │ (top 5) │        │(last 3) │
└─────────┘    └─────────┘        └─────────┘
    ↓                 ↓                   ↓
    └─────────────────┴─────────────────┘
                      ↓
         ┌────────────────────────┐
         │ Estimate Total Tokens  │
         └────────────────────────┘
                      ↓
              [Over 3000 tokens?]
                ↓           ↓
              YES           NO
                ↓           ↓
         Truncate      Return Full
         Context        Context
```

---

## Three-Tiered Memory System

### 1. **Recent Messages** (Rolling Window)
- **What:** Last 5-8 messages from conversation
- **Why:** Immediate context for current exchange
- **Storage:** SQLite `messages` table
- **Lifecycle:** Always available, auto-updated

**Example:**
```
User: "How many meds is dad taking?"
AI: "Basilio is taking 2 medications..."
User: "What are their side effects?"  ← Recent context knows "their" = Basilio's meds
```

### 2. **Semantic Pins** (Important Markers)
- **What:** User-pinned content or auto-extracted key info
- **Why:** Preserve important context beyond recent window
- **Storage:** SQLite `semantic_pins` table
- **Lifecycle:** Persists until manually removed

**Example:**
```
[Pin created] User shared: "Dad's doctor appointment is Oct 20, 10:30 AM"
[15 messages later]
User: "When is dad's appointment again?"
AI: [Accesses pinned info] "October 20 at 10:30 AM"
```

### 3. **Conversation Summaries** (Compressed History)
- **What:** AI-generated summaries of 15+ message chunks
- **Why:** Preserve early conversation context efficiently
- **Storage:** SQLite `conversation_summaries` table
- **Lifecycle:** Auto-created every 15 messages

**Example:**
```
Summary 1 (Messages 1-15): "User asked about diabetes medications, discussed Farxiga and Janumet dosages, confirmed prescription details."
Summary 2 (Messages 16-30): "Discussed upcoming cardiology appointment, reviewed preparation requirements, noted fasting needed."
[Current: Messages 31-45]
```

---

## Core Methods

### 1. `buildContext()` - Assemble Smart Context

**Purpose:** Builds complete memory context for AI within token budget

**Signature:**
```typescript
buildContext(sessionId: string, maxTokens = 3000): Promise<MemoryContext>
```

**Process:**
```typescript
// Step 1: Get recent messages (last 8)
const recentMessages = this.getRecentMessages(sessionId, 8)

// Step 2: Get top semantic pins (5 highest importance)
const semanticPins = this.getTopSemanticPins(sessionId, 5)

// Step 3: Get recent summaries (last 3)
const summaries = this.getRecentSummaries(sessionId, 3)

// Step 4: Estimate total tokens (~0.75 tokens/char)
const totalTokens = this.estimateTokens(recentMessages, semanticPins, summaries)

// Step 5: Truncate if needed
if (totalTokens > maxTokens) {
  return this.truncateContext(recentMessages, semanticPins, summaries, maxTokens)
}

return { recentMessages, semanticPins, summaries, totalTokens }
```

**Return Type:**
```typescript
interface MemoryContext {
  recentMessages: MessageWithImportance[]      // Last 8 messages
  semanticPins: SemanticPin[]                  // Top 5 pins
  summaries: ConversationSummary[]             // Last 3 summaries
  totalTokens: number                          // Estimated token count
}
```

**Example Usage:**
```typescript
const context = await memoryManager.buildContext('session_abc123', 3000)

// Result:
{
  recentMessages: [
    { role: 'user', text: 'What meds is dad taking?', importance_score: 0.8 },
    { role: 'assistant', text: 'Basilio is taking 2 medications...', importance_score: 0.55 },
    // ... 6 more
  ],
  semanticPins: [
    { content: 'Important: Dad has diabetes, needs monitoring', importance_score: 0.9 },
    // ... 4 more
  ],
  summaries: [
    { summary: 'Discussed medications and dosage schedules', message_count: 15 },
    // ... 2 more
  ],
  totalTokens: 2847
}
```

---

### 2. `getRecentMessages()` - Fetch Recent Conversation

**Purpose:** Retrieves last N messages with caching for performance

**SQL Query:**
```sql
SELECT * FROM (
  SELECT id, session_id, role, text, model_id, token_usage, created_at, importance_score
  FROM messages
  WHERE session_id = ?
  ORDER BY created_at DESC
  LIMIT ? OFFSET 1    -- OFFSET 1 excludes newest message (current user input)
) ORDER BY created_at ASC  -- Return in chronological order
```

**Why OFFSET 1?**
```
Without OFFSET:
User: "What meds is dad taking?" ← This gets included in context
AI sees: "User asked 'What meds is dad taking?' ... [context] ... What meds is dad taking?"
Result: AI might echo the question instead of answering

With OFFSET 1:
User: "What meds is dad taking?" ← This is excluded
AI sees: [previous context only]
Result: AI focuses on answering, not echoing
```

**Caching System:**
```typescript
// 5-second cache to reduce database hits
private recentMessagesCache = new Map()
private readonly CACHE_TTL = 5000

getRecentMessages(sessionId, limit) {
  const cacheKey = `${sessionId}:${limit}`
  const cached = this.recentMessagesCache.get(cacheKey)
  
  if (cached && Date.now() - cached.timestamp < 5000) {
    return cached.messages  // Return cached
  }
  
  // Query database and cache result
}
```

**Cache Invalidation:**
```typescript
// Called by agentService after adding new message
memoryManager.invalidateSessionCache(sessionId)
```

---

### 3. `getTopSemanticPins()` - Fetch Important Pins

**Purpose:** Get highest-importance pinned content

**SQL Query:**
```sql
SELECT * FROM semantic_pins
WHERE session_id = ?
ORDER BY importance_score DESC, created_at DESC
LIMIT ?
```

**Example Result:**
```typescript
[
  {
    id: 'pin_1234567890_abc',
    session_id: 'session_abc123',
    content: 'Dad's cardiology appointment: Oct 20, 10:30 AM at Memorial Hospital',
    source_message_id: '42',
    importance_score: 0.95,  // Very high importance
    pin_type: 'manual',
    created_at: '2025-10-13T08:00:00Z'
  }
]
```

---

### 4. `getRecentSummaries()` - Fetch Conversation Summaries

**Purpose:** Get recent summaries for historical context

**SQL Query:**
```sql
SELECT * FROM conversation_summaries
WHERE session_id = ?
ORDER BY created_at DESC
LIMIT ?
```

**Example Result:**
```typescript
[
  {
    id: 'summary_1234567890_xyz',
    session_id: 'session_abc123',
    summary: 'User asked about diabetes medications, discussed Farxiga and Janumet, confirmed dosages and side effects.',
    message_count: 15,
    start_message_id: '1',
    end_message_id: '15',
    importance_score: 0.7,
    created_at: '2025-10-13T07:00:00Z'
  }
]
```

---

### 5. `createSummary()` - Generate Conversation Summary

**Purpose:** AI-powered summarization of message ranges

**Process:**
```typescript
async createSummary(request: CreateSummaryRequest): Promise<ConversationSummary> {
  // 1. Get messages in range
  const messages = this.getMessagesInRange(
    request.session_id,
    request.start_message_id,
    request.end_message_id
  )

  // 2. Generate AI summary (session-aware model selection)
  const summary = await this.generateAISummary(messages, request.session_id)

  // 3. Create and store summary record
  const summaryRecord = {
    id: `summary_${Date.now()}_${randomId}`,
    session_id: request.session_id,
    summary,
    message_count: request.message_count,
    start_message_id: request.start_message_id,
    end_message_id: request.end_message_id,
    importance_score: 0.7,  // Summaries are important
    created_at: new Date().toISOString()
  }

  this.storeSummary(summaryRecord)
  return summaryRecord
}
```

**Example Usage:**
```typescript
const summary = await memoryManager.createSummary({
  session_id: 'session_abc123',
  start_message_id: '1',
  end_message_id: '15',
  message_count: 15
})

// Result:
{
  id: 'summary_1234567890_xyz',
  summary: 'User asked about diabetes medications...',
  message_count: 15,
  ...
}
```

---

### 6. `generateAISummary()` - AI-Powered Summary Generation

**Purpose:** Uses AI to create concise, accurate summaries

**Session-Aware Model Selection:**
```typescript
private getSummarizationModel(sessionId: string): string {
  const sessionModel = this.getSessionModel(sessionId)
  
  if (sessionModel && this.isLocalModel(sessionModel)) {
    return sessionModel  // Use local model (offline capability)
  }
  
  return 'gpt-4.1-mini'  // Fallback to cloud (consistency)
}
```

**Why Two Different Prompts?**

**Local Models** (Phi3, Qwen, Llama):
```typescript
const systemPrompt = `TASK: Create a brief summary of the conversation below. 
Focus ONLY on what was discussed, not generating new content.

FORMAT: 1-2 sentences describing the key topics and outcomes.
EXAMPLE: "User asked about poetry types, discussed sonnets and free verse."

DO NOT: Create new poems, stories, or content. Only summarize what was discussed.`
```
**Problem:** Local models sometimes generate new content (poems, stories) instead of summarizing

**Cloud Models** (GPT-4.1 Mini):
```typescript
const systemPrompt = `You are a conversation summarizer. Create a concise summary that preserves:
1. Key topics discussed
2. Important decisions made
3. Facts or information shared
4. Current context/state

Keep under 200 words.`
```
**Benefit:** More sophisticated understanding, less prone to hallucination

**Summary Validation (Local Models):**
```typescript
private isInvalidSummary(summary: string, originalMessages: MessageWithImportance[]): boolean {
  // Check 1: Too long (>300 chars) - likely generated content
  if (summary.length > 300) return true
  
  // Check 2: Ratio too high (>30% of original) - likely generated
  const summaryRatio = summary.length / conversationLength
  if (summaryRatio > 0.3) return true
  
  // Check 3: Invalid patterns
  const invalidPatterns = [
    /^(Here's|Certainly|Let me|I'll create)/i,  // AI response starters
    /```/,                                       // Code blocks
    /^Title:/i,                                  // Poem titles
    /^In fields where|^Once upon/i,              // Story beginnings
  ]
  for (const pattern of invalidPatterns) {
    if (pattern.test(summary)) return true
  }
  
  // Check 4: Low word overlap (<10%) - likely new content
  const matchRatio = matchingWords / summaryWords.length
  if (matchRatio < 0.1) return true
  
  return false
}
```

**Fallback Summary (When AI Fails):**
```typescript
private createFallbackSummary(messages: MessageWithImportance[]): string {
  const messageCount = messages.length
  const topics = this.extractTopics(messages)  // "programming", "database", "API"
  
  if (topics.length > 0) {
    return `Conversation with ${messageCount} messages about: ${topics.join(', ')}.`
  }
  
  // Basic fallback
  const firstUserMsg = messages[0].text.substring(0, 30)
  const lastUserMsg = messages[messages.length - 1].text.substring(0, 30)
  
  return `Conversation with ${messageCount} messages. Started: "${firstUserMsg}..." Recent: "${lastUserMsg}..."`
}
```

**Example Outputs:**
```typescript
// AI Summary (Success)
"User asked about diabetes medications, discussed Farxiga and Janumet dosages, confirmed prescription details and side effects."

// Fallback Summary (AI Failed)
"Conversation with 15 messages about: database, eldercare, medications."

// Offline Summary (Network Error)
"📱 Offline summary: 15 messages. Started: 'What medications...' Recent: 'Confirm side effects...'"
```

---

### 7. `autoSummarizeSession()` - Automatic Summarization

**Purpose:** Automatically creates summaries every 15 messages

**Logic:**
```typescript
async autoSummarizeSession(sessionId: string): Promise<ConversationSummary | null> {
  const lastSummary = this.getLastSummary(sessionId)
  
  if (!lastSummary) {
    // First summary: Take messages 1-15
    const allMessages = this.getAllMessagesForSession(sessionId)
    if (allMessages.length < 15) return null  // Not enough yet
    
    const messagesToSummarize = allMessages.slice(0, 15)
    return await this.createSummary({
      session_id: sessionId,
      start_message_id: messagesToSummarize[0].id,
      end_message_id: messagesToSummarize[14].id,
      message_count: 15
    })
  } else {
    // Subsequent summaries: Messages since last summary
    const messagesSinceLastSummary = this.getMessagesSinceLastSummary(sessionId, lastSummary.created_at)
    if (messagesSinceLastSummary.length < 15) return null  // Not enough yet
    
    return await this.createSummary({
      session_id: sessionId,
      start_message_id: messagesSinceLastSummary[0].id,
      end_message_id: messagesSinceLastSummary[14].id,
      message_count: 15
    })
  }
}
```

**Timeline Example:**
```
Messages 1-14: No summary yet
Message 15: ✅ Auto-summary created (Summary 1: Messages 1-15)
Messages 16-29: Using Summary 1 + recent messages
Message 30: ✅ Auto-summary created (Summary 2: Messages 16-30)
Messages 31-45: Using Summary 1 + Summary 2 + recent messages (31-45)
```

---

### 8. `needsSummarization()` - Check Summary Threshold

**Purpose:** Determines if conversation needs summarization

**Logic:**
```typescript
needsSummarization(sessionId: string): boolean {
  const messageCount = this.getSessionMessageCount(sessionId)
  const lastSummary = this.getLastSummary(sessionId)
  
  if (!lastSummary) {
    // No summary yet: Check total message count
    return messageCount >= 15  // SUMMARY_THRESHOLD
  }
  
  // Has summaries: Check messages since last summary
  const messagesSinceLastSummary = this.getMessageCountSince(sessionId, lastSummary.created_at)
  return messagesSinceLastSummary >= 15
}
```

**Example:**
```typescript
// Session with 10 messages
memoryManager.needsSummarization('session_abc123')  // false

// Session with 15 messages
memoryManager.needsSummarization('session_abc123')  // true

// Session with 25 messages + summary at message 15
memoryManager.needsSummarization('session_abc123')  // false (only 10 since last)

// Session with 30 messages + summary at message 15
memoryManager.needsSummarization('session_abc123')  // true (15 since last)
```

---

### 9. `scoreMessageImportance()` - Importance Scoring

**Purpose:** Calculate importance score for message prioritization

**Scoring Rules:**
```typescript
scoreMessageImportance(message: MessageWithImportance): number {
  let score = 0.5  // Base score
  
  const text = message.text.toLowerCase()
  
  // Questions are important (+0.2)
  if (text.includes('?') || text.startsWith('what') || text.startsWith('how')) {
    score += 0.2
  }
  
  // Technical content (+0.15)
  if (text.includes('```') || text.includes('function') || text.includes('class')) {
    score += 0.15
  }
  
  // Errors/issues (+0.1)
  if (text.includes('error') || text.includes('problem') || text.includes('issue')) {
    score += 0.1
  }
  
  // Long messages (+0.1)
  if (text.length > 200) {
    score += 0.1
  }
  
  // Assistant responses (+0.05)
  if (message.role === 'assistant') {
    score += 0.05
  }
  
  return Math.min(score, 1.0)  // Cap at 1.0
}
```

**Example Scores:**
```typescript
// Simple greeting
scoreMessageImportance({ role: 'user', text: 'Hello' })
// Score: 0.5 (base only)

// Question about medications
scoreMessageImportance({ role: 'user', text: 'What medications is dad taking?' })
// Score: 0.7 (base + question)

// Error report with code
scoreMessageImportance({ role: 'user', text: 'Error in function ```calculateDose()```' })
// Score: 0.85 (base + technical + error)

// Long technical assistant response
scoreMessageImportance({ role: 'assistant', text: '[300-char technical explanation]' })
// Score: 0.7 (base + long + assistant)
```

---

### 10. `createSemanticPin()` - Create Memory Pin

**Purpose:** Create persistent reference to important content

**Signature:**
```typescript
createSemanticPin(request: CreatePinRequest): SemanticPin
```

**Process:**
```typescript
const pin: SemanticPin = {
  id: `pin_${Date.now()}_${randomId}`,
  session_id: request.session_id,
  content: request.content,  // What to pin
  source_message_id: request.source_message_id,  // Where it came from
  importance_score: request.importance_score || 0.8,  // How important
  pin_type: request.pin_type || 'manual',  // How created
  created_at: new Date().toISOString()
}

this.storeSemanticPin(pin)
return pin
```

**Example Usage:**
```typescript
// User says: "Pin this: Dad's appointment is Oct 20 at 10:30 AM"
const pin = memoryManager.createSemanticPin({
  session_id: 'session_abc123',
  content: "Dad's appointment is Oct 20 at 10:30 AM at Memorial Hospital",
  source_message_id: '42',
  importance_score: 0.95,
  pin_type: 'manual'
})

// Result: Pin persists in context for entire conversation
```

---

### 11. `truncateContext()` - Smart Token Management

**Purpose:** Intelligently reduce context when over token limit

**Priority System:**
```
1. Recent messages (always keep last 3)
2. High-importance semantic pins
3. Recent summaries
```

**Process:**
```typescript
truncateContext(messages, pins, summaries, maxTokens): MemoryContext {
  let currentTokens = 0
  const result = { recentMessages: [], semanticPins: [], summaries: [], totalTokens: 0 }
  
  // Step 1: Always include last 3 messages (minimum context)
  const minMessages = Math.min(3, messages.length)
  for (let i = messages.length - minMessages; i < messages.length; i++) {
    result.recentMessages.push(messages[i])
    currentTokens += estimateTokens(messages[i])
  }
  
  // Step 2: Add highest-importance pins (sorted by score)
  const sortedPins = pins.sort((a, b) => b.importance_score - a.importance_score)
  for (const pin of sortedPins) {
    const pinTokens = estimateTokens(pin)
    if (currentTokens + pinTokens < maxTokens) {
      result.semanticPins.push(pin)
      currentTokens += pinTokens
    } else {
      break  // No more space
    }
  }
  
  // Step 3: Add recent summaries if space allows
  for (const summary of summaries) {
    const summaryTokens = estimateTokens(summary)
    if (currentTokens + summaryTokens < maxTokens) {
      result.summaries.push(summary)
      currentTokens += summaryTokens
    } else {
      break  // No more space
    }
  }
  
  result.totalTokens = currentTokens
  return result
}
```

**Example:**
```typescript
// Input: 2500 tokens, limit: 2000 tokens
// Result:
{
  recentMessages: [last 3 messages],      // 800 tokens (always included)
  semanticPins: [top 2 pins],             // 600 tokens (highest importance)
  summaries: [most recent summary],        // 400 tokens (if space)
  totalTokens: 1800                        // Under limit ✅
}
```

---

## Helper Methods

### `extractTopics()` - Topic Detection for Fallback
```typescript
private extractTopics(messages: MessageWithImportance[]): string[] {
  const topics = new Set<string>()
  
  messages.forEach(msg => {
    const text = msg.text.toLowerCase()
    
    // Technical
    if (text.includes('code') || text.includes('programming')) topics.add('programming')
    if (text.includes('database') || text.includes('sql')) topics.add('database')
    
    // Creative
    if (text.includes('poetry') || text.includes('poem')) topics.add('poetry')
    if (text.includes('story') || text.includes('narrative')) topics.add('creative writing')
    
    // General
    if (text.includes('help') || text.includes('explain')) topics.add('help/explanation')
  })
  
  return Array.from(topics).slice(0, 3)  // Top 3
}
```

### `estimateTokens()` - Token Estimation
```typescript
private estimateTokens(messages, pins, summaries): number {
  // Rough estimation: ~0.75 tokens per character
  let totalChars = 0
  
  totalChars += messages.reduce((sum, msg) => sum + msg.text.length, 0)
  totalChars += pins.reduce((sum, pin) => sum + pin.content.length, 0)
  totalChars += summaries.reduce((sum, s) => sum + s.summary.length, 0)
  
  return Math.ceil(totalChars * 0.75)
}
```

---

## Performance Optimizations

### 1. **Query Result Caching**
```typescript
private messageCountCache = new Map()
private recentMessagesCache = new Map()
private readonly CACHE_TTL = 5000  // 5 seconds

// Reduces database hits for frequently-accessed data
```

### 2. **Cache Cleanup**
```typescript
private cleanupCache(): void {
  const now = Date.now()
  
  // Remove expired entries
  for (const [key, value] of this.messageCountCache.entries()) {
    if (now - value.timestamp >= this.CACHE_TTL) {
      this.messageCountCache.delete(key)
    }
  }
}
```

### 3. **Indexed Queries**
All queries use indexed columns:
- `messages.session_id`
- `messages.created_at`
- `semantic_pins.session_id`
- `conversation_summaries.session_id`

---

## Usage Examples

### Example 1: Build Context for AI
```typescript
// In agentService.ts
const memoryContext = await memoryManager.buildContext(sessionId, 3000)

const conversationHistory = memoryContext.recentMessages.map(msg => ({
  role: msg.role,
  content: msg.text
}))

// Add to AI prompt
const systemPrompt = buildSystemPrompt(personaPrompt, eldercareContext, memoryContext.summaries)
```

### Example 2: Auto-Summarize Long Conversations
```typescript
// After adding new message
if (memoryManager.needsSummarization(sessionId)) {
  await memoryManager.autoSummarizeSession(sessionId)
}
```

### Example 3: Create Manual Pin
```typescript
// User says: "Remember: Dad's appointment is Oct 20"
const pin = memoryManager.createSemanticPin({
  session_id: sessionId,
  content: "Dad's cardiology appointment: Oct 20, 10:30 AM",
  source_message_id: messageId,
  importance_score: 0.95,
  pin_type: 'manual'
})
```

### Example 4: Invalidate Cache After New Message
```typescript
// After saving new message to database
memoryManager.invalidateSessionCache(sessionId)
```

---

## Configuration Constants

```typescript
private readonly DEFAULT_CONTEXT_LIMIT = 10     // Default message limit
private readonly DEFAULT_TOKEN_LIMIT = 3000     // Default token budget
private readonly SUMMARY_THRESHOLD = 15         // Messages before auto-summary
private readonly CACHE_TTL = 5000              // 5 seconds cache lifetime
```

---

## Key Design Decisions

### 1. **Why OFFSET 1 in Recent Messages?**
Prevents AI from echoing the current user question. The newest message is the one AI is currently responding to, so including it in context causes confusion.

### 2. **Why 15-Message Summary Threshold?**
Balance between:
- **Too frequent** (5 msgs): Excessive summarization, loss of detail
- **Too rare** (30 msgs): Context window overflow, token waste
- **Just right** (15 msgs): Preserves detail, prevents overflow

### 3. **Why Two Different Summary Prompts?**
Local models (Phi3, Qwen, Llama) sometimes generate creative content instead of summarizing. Stricter prompts and validation prevent this.

### 4. **Why Cache Results?**
`buildContext()` is called for every AI request. Without caching, this means 3-4 database queries per request. 5-second cache reduces this to once per 5 seconds per session.

### 5. **Why Importance Scoring?**
Enables smart truncation. When over token limit, keep high-importance content (questions, errors, decisions) over low-importance content (greetings, confirmations).

---

## Common Patterns

### Pattern 1: Memory Context in Agent Service
```typescript
// agentService.ts
const memoryContext = await memoryManager.buildContext(sessionId, 3000)

// Use summaries in system prompt
const systemPrompt = [
  personaPrompt,
  eldercareContext,
  ...memoryContext.summaries.map(s => s.summary)
].join('\n\n')

// Use recent messages as conversation history
const messages = memoryContext.recentMessages.map(msg => ({
  role: msg.role,
  content: msg.text
}))
```

### Pattern 2: Auto-Summarization Hook
```typescript
// After adding new message
memoryManager.invalidateSessionCache(sessionId)

if (memoryManager.needsSummarization(sessionId)) {
  await memoryManager.autoSummarizeSession(sessionId)
}
```

---

## Future Enhancements

### 1. **Vector Embeddings for Semantic Search**
```typescript
// Find relevant past messages by meaning, not just recency
async semanticSearch(sessionId: string, query: string, limit = 5) {
  const queryEmbedding = await generateEmbedding(query)
  // Search message embeddings for similarity
}
```

### 2. **Adaptive Summarization Threshold**
```typescript
// Adjust threshold based on conversation complexity
private calculateSummaryThreshold(sessionId: string): number {
  const avgMessageLength = this.getAvgMessageLength(sessionId)
  const technicalScore = this.getTechnicalComplexity(sessionId)
  
  // Complex conversations: summarize sooner (10 msgs)
  // Simple conversations: summarize later (20 msgs)
  return complexScore > 0.7 ? 10 : 20
}
```

### 3. **Automatic Semantic Pin Extraction**
```typescript
// AI automatically identifies important content to pin
async autoExtractPins(sessionId: string, message: Message) {
  if (this.containsKeyInformation(message)) {
    await this.createSemanticPin({
      session_id: sessionId,
      content: message.text,
      source_message_id: message.id,
      pin_type: 'auto'
    })
  }
}
```

---

## Related Files

- `agentService.ts` - Primary consumer of memory context
- `../types/memory.ts` - Type definitions
- `../db/db.ts` - Database connection
- `modelRegistry.ts` - Model adapter lookup

---

## Quick Reference

**Build context:**
```typescript
const context = await memoryManager.buildContext(sessionId, 3000)
```

**Check if summarization needed:**
```typescript
if (memoryManager.needsSummarization(sessionId)) {
  await memoryManager.autoSummarizeSession(sessionId)
}
```

**Create manual pin:**
```typescript
const pin = memoryManager.createSemanticPin({
  session_id: sessionId,
  content: "Important info to remember",
  source_message_id: messageId,
  importance_score: 0.9
})
```

**Invalidate cache:**
```typescript
memoryManager.invalidateSessionCache(sessionId)
```

**Score message importance:**
```typescript
const score = memoryManager.scoreMessageImportance(message)
memoryManager.updateMessageImportance(message.id, score)
```
