# Core Architecture

The `MemoryManager` implements a **rolling buffer + semantic pins + summarization** approach to maintain conversation context without overwhelming models with excessive history. It combines:

- **Recent Message Buffer** (last 8 messages with smart offset)
- **Semantic Pins** (manually and potentially automatically created bookmarks)
- **Conversation Summaries** (AI-generated compressed history)
- **Importance Scoring** (0.0-1.0 weighting system)
- **Performance Caching** (5-second TTL for frequent queries)
---
## **Configuration Constants**

```typescript
DEFAULT_CONTEXT_LIMIT = 10 // Fallback message limit
DEFAULT_TOKEN_LIMIT = 3000 // Rough token budget for context
SUMMARY_THRESHOLD = 15 // Auto-summarize after N messages
CACHE_TTL = 5000 // 5-second cache lifetime
```

These ensure context stays within model limits while preserving important information.

---
## **Hybrid Model Intelligence**

### **Session-Aware Model Selection**

- Detects which model the session is using (`getSessionModel()`)
- Identifies local vs cloud models (`isLocalModel()`)
- **Smart summarization routing**: Uses session model if local, falls back to `gpt-4.1-mini` for cloud consistency
### **Offline-First Design**

- Can summarize conversations completely offline using local models
- Graceful degradation with network errors
- Enhanced validation for local model outputs (prevents creative content generation)
---

## **Context Building Algorithm**

The `buildContext()` method implements intelligent context assembly:

```typescript
1. Get recent messages (last 8, OFFSET 1 to exclude current input)
2. Get top semantic pins (5 highest importance scores)
3. Get recent summaries (last 3 conversation summaries)
4. Estimate total tokens (~0.75 tokens per character)
5. If over limit → smart truncation (preserves importance hierarchy)
```

**Smart Truncation Priority:**

1. Recent messages (minimum 3 always preserved)
2. High-importance semantic pins
3. Recent summaries (if space allows)
---
## **Importance Scoring System**

The `scoreMessageImportance()` algorithm assigns 0.0-1.0 scores based on content analysis:

```typescript
Base Score: 0.5

Content Heuristics:

+ 0.2 Questions (contains '?', starts with 'what/how/why')
+ 0.15 Code content (contains '```', 'function', 'class')
+ 0.1 Error/issues (contains 'error', 'problem', 'issue')
+ 0.1 Long messages (> 200 characters)
+ 0.05 Assistant responses (contain answers)
  
Maximum: 1.0 (clamped)
```

**Usage:**

- Pins ranked by importance for context inclusion
- Messages prioritized during truncation
- Database queries optimized with importance indexes
---
## **Automatic Summarization**

### **Trigger Conditions**

The system automatically creates summaries when:

- First time: 15+ messages in session
- Subsequent: 15+ messages since last summary

### **Summarization Process**

```typescript
1. Detect session model and whether it's local/cloud
2. For local models: Use session model with strict prompts
3. For cloud models: Fall back to gpt-4.1-mini for consistency
4. Enhanced validation for local models (prevents creative content)
5. Store summary with 0.7 importance score
```
### **Local Model Validation**

Checks prevent local models from generating creative content instead of summaries:

- Length validation (max 300 characters)
- Pattern detection (avoids poetry, stories, code blocks)
- Word overlap analysis (ensures connection to original conversation)
- Ratio checks (summary shouldn't exceed 30% of original length)

### **Fallback Strategy**

When AI summarization fails:

- Network errors → Create offline-friendly summary
- Invalid output → Generate deterministic fallback
- Topic extraction from user messages for context
---
## **Semantic Pins System**

### **Pin Creation Methods**

**Manual Pins (Current Implementation):**

- Created via chat UI pin button (📌)
- User-initiated through `createSemanticPin()` API
- Default importance score: 0.8
- Pin type: 'manual'

**Automatic Pin Capability (Framework Ready):**

The system supports automatic pin creation through:

- `pin_type` field supports: 'manual' | 'auto' | 'code' | 'concept' | 'system'
- API endpoint ready for automatic pin detection
- Database schema prepared for AI-generated pins
### **Pin Storage & Retrieval**

```typescript
Pin Structure:

- id: Unique identifier
- session_id: Associated conversation
- content: Pinned text/concept
- source_message_id: Original message reference
- importance_score: 0.0-1.0 ranking
- pin_type: Classification
- created_at: Timestamp
```

**Context Integration:**

- Top 5 pins by importance score included in context
- Sorted by importance, then recency
- Automatically truncated if token limit exceeded
---
## **Performance Optimizations**
### **Multi-Level Caching**

```typescript
messageCountCache: Map<sessionId, {count, timestamp}>
recentMessagesCache: Map<key, {messages, timestamp}>
CACHE_TTL: 5000ms (5 seconds)
```
### **Cache Invalidation**

- Automatic invalidation when new messages added
- Session-specific cache clearing
- Public method `invalidateSessionCache()` for external triggers
### **Database Indexes**

Optimized queries use composite indexes:

- `(session_id, importance_score DESC, created_at DESC)`
- Applied to messages, summaries, and semantic_pins tables
---
## **Memory Context Assembly**
### **Output Structure**

```typescript
interface MemoryContext {

recentMessages: MessageWithImportance[]
semanticPins: SemanticPin[]
summaries: ConversationSummary[]
totalTokens: number

}
```

### **Smart Truncation Logic**

When context exceeds token limits:

1. **Always preserve** minimum 3 recent messages
2. **Prioritize** highest importance semantic pins
3. **Include** recent summaries if space allows
4. **Maintain** conversation continuity
---
## **API Integration**
### **Core Methods**

- `buildContext(sessionId, maxTokens)` - Main context assembly
- `createSemanticPin(request)` - Manual pin creation
- `needsSummarization(sessionId)` - Check summary triggers
- `autoSummarizeSession(sessionId)` - Background summarization
- `scoreMessageImportance(message)` - Content analysis
- `invalidateSessionCache(sessionId)` - Cache management
### **External Dependencies**

- `agentService.runAgent()` - AI model execution
- `modelRegistry.getModelAdapter()` - Model type detection

- SQLite database via `db.ts`
- Shared types from `memory.ts`
---
## **Error Handling & Resilience**
### **Network Failures**

- Graceful degradation for offline scenarios
- Local model fallback for summarization
- Deterministic fallback when AI unavailable
### **Data Validation**

- Importance scores clamped to 0.0-1.0 range
- Summary content validation (especially for local models)
- Database constraint enforcement
### **Recovery Mechanisms**

- Cache rebuilding on corruption
- Fallback context when database issues
- Minimum viable context guarantee
---
## **System Integration**

### **Memory Router Integration**

The system integrates with `memoryRouter.ts` endpoints:

- `POST /api/memory/summaries` - Create summaries
- `POST /api/memory/pins` - Create semantic pins
- `POST /api/memory/:sessionId/score-messages` - Importance scoring
### **Agent Service Coordination**

- Provides enriched context to `agentService.runAgent()`
- Receives conversation summaries from AI models
- Maintains session awareness across model switches
### **Frontend Connectivity**

- Pin creation triggered from ChatPanel UI
- Context loading during session initialization
- Real-time memory updates during conversations
## **Why It's Critical**

The MemoryManager is the **intelligence layer** that makes Kalito Space's conversations feel truly contextual:

- **Prevents context overflow** that would degrade model performance
- **Preserves important information** across long conversations
- **Enables offline operation** with local model summarization
- **Optimizes token usage** through smart content selection
- **Maintains conversation continuity** across sessions

Without this system, models would either:

1. **Lose context** (forgetting important details)
2. **Overflow context** (performance degradation)
3. **Generate irrelevant responses** (lack of focused context)

The MemoryManager ensures every conversation has the **right balance of recency, importance, and compressed history** for optimal AI responses.

---
### 5. **Importance Scoring**

- Assigns scores based on heuristics:
- Questions → +0.2
- Code snippets → +0.15
- Errors/issues → +0.1
- Long messages → +0.1
- Assistant replies → +0.05
- Clamped at max **1.0**.

This feeds into:

- Ranking pins
- Deciding what to keep/drop when tokens run out.
---
### 6. **Summarization**

- Auto-triggers when enough messages accumulate.
- Creates summaries using AI, stores them in DB (`conversation_summaries`).
- Summaries have a default importance of 0.7 (so they’re always favored).  

Flow:

- If no summaries → summarize first 15 messages.
- If summaries exist → summarize since last one.
- Summaries are created as full DB records with IDs, timestamps, etc.

This guarantees **long-term recall without dumping raw logs.**

---
### 7. **Semantic Pins**

- Created either manually or automatically.
- Always stored in DB (`semantic_pins`) with:
- Content
- Source message ID
- Importance score (default 0.8)
- Pin type (`manual`, `code`, `concept`, etc.)


These are the **"sticky notes" of the memory system.**

---
### 8. **Cache Invalidation**

- When a new message is added, it clears caches for that session.
- Ensures stale message history doesn’t pollute context.
---

  

## **Strengths**

  

- **Separation of Concerns**: MemoryManager doesn’t care about the model adapter—it just builds optimized context.

- **Hybrid-Smart**: Can run fully local or use cloud for summarization.

- **Extensible**: Easy to add new heuristics for importance scoring or new memory structures.

- **Performance-conscious**: Lightweight caching prevents DB overload.

---

  
