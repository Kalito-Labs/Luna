# Luna: Technical Architecture Deep Dive

**Document Version**: 1.1  
**Last Updated**: December 2, 2025  
**Status**: Active Documentation  
**Related Documents**: [Introduction & System Overview](./intro.md)

---

## Overview

This document provides an in-depth technical analysis of Luna's architecture, covering the backend server implementation, AI conversation flow, frontend structure, type system, and deployment patterns. This complements the [Introduction document](./intro.md) with implementation details and architectural patterns.

---

## Table of Contents

1. [Repository Structure](#repository-structure)
2. [Backend Server Architecture](#backend-server-architecture)
3. [AI Conversation Flow](#ai-conversation-flow)
4. [API Route Organization](#api-route-organization)
5. [Memory & Context Management](#memory--context-management)
6. [Tool System (Function Calling)](#tool-system-function-calling)
7. [Type System & Contracts](#type-system--contracts)
8. [Frontend Architecture](#frontend-architecture)
9. [Dependency Stack](#dependency-stack)
10. [Security Architecture](#security-architecture)
11. [Performance Optimizations](#performance-optimizations)
12. [Deployment Patterns](#deployment-patterns)

---

## Repository Structure

### Project Organization

Luna follows a **monorepo architecture** using pnpm workspaces, with clear separation between frontend, backend, documentation, and utility scripts.

```
luna-repo/
├── backend/                    # Node.js + Express backend (50+ TypeScript files)
│   ├── db/                     # Database layer
│   │   ├── init.ts            # Schema definition (14 tables)
│   │   ├── db.ts              # SQLite connection & utilities
│   │   ├── add-rag-tables.sql # RAG system schema
│   │   ├── kalito.db          # Production database
│   │   └── migrations/        # Schema migrations (5 files)
│   │
│   ├── logic/                  # Business logic layer (15 services)
│   │   ├── agentService.ts    # AI conversation orchestration
│   │   ├── memoryManager.ts   # Context & caching
│   │   ├── queryRouter.ts     # Intent detection
│   │   ├── modelRegistry.ts   # AI model configuration
│   │   ├── tools.ts           # Function calling system
│   │   ├── lunaContextService.ts       # Patient context builder
│   │   ├── journalService.ts           # Journal CRUD
│   │   ├── therapyRecordsService.ts    # CBT/ACT/DBT tracking
│   │   ├── documentProcessor.ts        # RAG document parsing
│   │   ├── embeddingService.ts         # Vector embeddings
│   │   ├── chunkingService.ts          # Document chunking
│   │   ├── vectorSearchService.ts      # Semantic search
│   │   ├── tavilyService.ts            # Web search integration
│   │   ├── structuredAppointmentService.ts   # Appointment parsing
│   │   ├── structuredMedicationService.ts    # Medication parsing
│   │   └── adapters/                   # AI provider adapters
│   │       ├── openai/                 # OpenAI integration
│   │       │   ├── factory.ts
│   │       │   ├── adapters.ts
│   │       │   ├── models.ts
│   │       │   └── types.ts
│   │       └── ollama/                 # Ollama integration
│   │           ├── factory.ts
│   │           ├── adapters.ts
│   │           └── types.ts
│   │
│   ├── routes/                 # API endpoints (12 routers)
│   │   ├── agentRouter.ts     # POST /api/agent (chat)
│   │   ├── sessionRouter.ts   # Session CRUD
│   │   ├── memoryRouter.ts    # Context, pins, summaries
│   │   ├── personasRouter.ts  # Persona management
│   │   ├── modelsRouter.ts    # Model registry
│   │   ├── patientsRouter.ts  # Patient profiles
│   │   ├── medicationsRouter.ts        # Prescription tracking
│   │   ├── journalRouter.ts            # Journal entries
│   │   ├── therapyRecordsRouter.ts     # Therapy exercises
│   │   ├── datasetsRouter.ts           # RAG document upload
│   │   ├── vectorSearchRouter.ts       # Semantic search
│   │   └── searchRouter.ts             # Tavily web search
│   │
│   ├── middleware/             # Express middleware
│   │   ├── errorMiddleware.ts # Global error handler
│   │   ├── security.ts        # Rate limiting, timeouts
│   │   └── validation.ts      # Zod schema validation
│   │
│   ├── types/                  # Shared TypeScript types
│   │   ├── agent.ts           # AgentRequest, AgentResponse
│   │   ├── personas.ts        # Persona, PersonaSettings
│   │   ├── memory.ts          # MessageWithImportance, SemanticPin
│   │   ├── messages.ts        # Message types
│   │   ├── sessions.ts        # Session types
│   │   ├── models.ts          # ModelInfo, ModelProvider
│   │   ├── journal.ts         # Journal entry types
│   │   ├── search.ts          # Search request/response
│   │   └── api.ts             # API response wrappers
│   │
│   ├── utils/                  # Utility modules
│   │   ├── logger.ts          # Winston structured logging
│   │   ├── apiContract.ts     # Response formatters
│   │   └── routerHelpers.ts   # Route utilities
│   │
│   ├── scripts/                # Development tools
│   │   ├── audit-database.ts           # Schema validation
│   │   ├── migrate-localstorage-to-db.ts   # Data migration
│   │   └── test-luna-context.ts        # Context builder testing
│   │
│   ├── tests/                  # Test suites
│   │   ├── backend-validation-integration.test.ts
│   │   └── lunaContext.test.ts
│   │
│   ├── uploads/                # RAG document storage (100+ files)
│   ├── server.ts              # Express app entry point
│   ├── nodemon.json           # Dev server config
│   ├── package.json           # Backend dependencies
│   └── tsconfig.json          # TypeScript config
│
├── frontend/                   # Vue 3 + Ionic application (27+ TypeScript files)
│   ├── src/
│   │   ├── components/        # Vue components (23 files)
│   │   │   ├── chat/          # Chat interface (5 components)
│   │   │   │   ├── ChatInput.vue
│   │   │   │   ├── ChatMessage.vue
│   │   │   │   ├── ChatSidebar.vue
│   │   │   │   ├── ModelSelector.vue
│   │   │   │   └── StreamingIndicator.vue
│   │   │   │
│   │   │   ├── personas/      # Persona management (2 components)
│   │   │   │   ├── PersonaCard.vue
│   │   │   │   └── PersonaEditor.vue
│   │   │   │
│   │   │   ├── kalitohub/     # Patient dashboard (4 components)
│   │   │   │   ├── MedicationCard.vue
│   │   │   │   ├── AppointmentCard.vue
│   │   │   │   ├── VitalsChart.vue
│   │   │   │   └── PatientSummary.vue
│   │   │   │
│   │   │   ├── journal/       # Journal interface (3 components)
│   │   │   │   ├── JournalCard.vue
│   │   │   │   ├── MoodSelector.vue
│   │   │   │   └── TagInput.vue
│   │   │   │
│   │   │   └── datasets/      # RAG system UI (5 components)
│   │   │       ├── DatasetUploader.vue
│   │   │       ├── DatasetCard.vue
│   │   │       ├── DocumentViewer.vue
│   │   │       ├── ChunkExplorer.vue
│   │   │       └── AccessLevelSelector.vue
│   │   │
│   │   ├── views/             # Route components (10 views)
│   │   │   ├── HomeView.vue
│   │   │   ├── ChatWorkspace.vue
│   │   │   ├── PersonaManager.vue
│   │   │   ├── LibraryView.vue
│   │   │   ├── ResourcesView.vue
│   │   │   ├── CBTView.vue
│   │   │   ├── ACTView.vue
│   │   │   ├── DBTView.vue
│   │   │   ├── KalitoHub.vue
│   │   │   └── JournalView.vue
│   │   │
│   │   ├── router/            # Vue Router config
│   │   │   └── index.ts       # 12 routes defined
│   │   │
│   │   ├── composables/       # Composition API utilities
│   │   ├── utils/             # Frontend utilities
│   │   ├── core.ts            # API client (streaming + classic)
│   │   ├── main.ts            # App entry point
│   │   └── App.vue            # Root component
│   │
│   ├── android/               # Capacitor Android platform
│   ├── public/                # Static assets
│   ├── resources/             # Icon & splash screen sources
│   ├── capacitor.config.ts    # Capacitor configuration
│   ├── vite.config.ts         # Vite build config
│   ├── package.json           # Frontend dependencies
│   └── tsconfig.json          # TypeScript config
│
├── docs/                       # Documentation (9 markdown files)
│   ├── overview/
│   │   ├── intro.md           # System overview (628 lines)
│   │   └── architecture.md    # This document
│   │
│   ├── 00-Ai-Protocols/       # AI interaction guidelines
│   │   └── (protocol documents)
│   │
│   └── resources/             # Therapy resources
│       ├── cbt.md             # Cognitive Behavioral Therapy guide
│       ├── act.md             # Acceptance & Commitment Therapy
│       ├── dbt.md             # Dialectical Behavior Therapy
│       └── integrations.md    # Integration patterns
│
├── scripts/                    # Utility scripts
│   ├── backup-db              # Database backup automation
│   ├── restore-db             # Database restore utility
│   └── update-icons.sh        # Icon generation script
│
├── backups/                    # Database backups
│   └── kalito.db.*.bak        # Timestamped backups
│
├── test-documents/             # Sample documents for RAG testing
│   └── cbt-anxiety-guide.txt
│
├── .env                        # Environment variables (gitignored)
├── .env.development            # Development overrides
├── .env.production             # Production overrides
├── .env.test                   # Test environment config
├── eslint.config.js            # ESLint configuration
├── package.json                # Root workspace config
├── pnpm-workspace.yaml         # Monorepo workspace definition
├── pnpm-lock.yaml              # Dependency lock file
└── README.md                   # Project readme
```

### Key Statistics

- **Total TypeScript Files**: 77 (50+ backend, 27+ frontend)
- **Vue Components**: 33 (10 views, 23 components)
- **API Routes**: 12 routers covering all feature domains
- **Backend Services**: 15 specialized service modules
- **Documentation Files**: 9 markdown files
- **Database Tables**: 14 tables (see Database Layer section)
- **Migrations**: 5 schema evolution files
- **AI Adapters**: 2 providers (OpenAI, Ollama) with dedicated factories

### Component Organization Strategy

**Backend Logic Services:**
- **Core AI**: agentService, memoryManager, modelRegistry, queryRouter
- **Mental Health**: journalService, therapyRecordsService, lunaContextService
- **RAG System**: documentProcessor, embeddingService, chunkingService, vectorSearchService
- **Structured Data**: structuredAppointmentService, structuredMedicationService
- **External**: tavilyService (web search), tools (function calling)

**Frontend Component Categories:**
- **Chat**: 5 components for conversational UI
- **Personas**: 2 components for AI personality management
- **KalitoHub**: 4 components for patient dashboard
- **Journal**: 3 components for therapeutic journaling
- **Datasets**: 5 components for RAG document management

**Type System:**
All shared types live in `backend/types/` and are imported by both frontend and backend, ensuring type safety across the monorepo boundary.

---

## Backend Server Architecture

### Entry Point: `server.ts`

Luna's backend is built on **Express.js 5.x** with a comprehensive middleware stack designed for production deployment.

#### Environment Configuration

```typescript
// Multi-environment support with cascading configuration
dotenv.config({ path: '../.env' })                    // Main config
dotenv.config({ path: '../.env.development' })        // Development overrides
dotenv.config({ path: '../.env.production' })         // Production overrides
dotenv.config({ path: '../.env.test' })               // Test environment
```

**Environment Variables:**
- `NODE_ENV` - Environment selector (development, test, production)
- `PORT` - Server port (default: 3000)
- `HOST` - Bind address (default: 0.0.0.0 for all interfaces)
- `TRUST_PROXY` - Enable proxy trust for production deployments
- `APP_VERSION` - Application version for health checks
- `OLLAMA_URL` - Ollama server URL for local models

#### Middleware Stack (Applied in Order)

1. **Helmet** - Security headers (XSS, clickjacking, MIME sniffing protection)
2. **CORS** - Cross-origin resource sharing with configurable origins
3. **Security Logger** - Structured logging of all requests
4. **Request Timeout** - Prevents long-running requests from blocking
5. **General Rate Limiting** - DDoS protection and abuse prevention
6. **Body Parsers** - JSON and URL-encoded with size limits

#### Production Features

**Proxy Trust Configuration:**
```typescript
if (process.env.TRUST_PROXY === '1' || nodeEnv === 'production') {
  app.set('trust proxy', 1)
}
```
- Enables accurate client IP detection behind nginx, Fly.io, Render, etc.
- Required for rate limiting and security logging in production

**Health Check Endpoint:**
```typescript
GET /api/health
Response: {
  status: 'ok',
  time: '2025-12-02T10:30:00.000Z',
  environment: 'production',
  version: '1.4.0-beta'
}
```

**Ollama Status Endpoint:**
```typescript
GET /api/models/status
Response: {
  ollama: { status: 'online', url: 'http://localhost:11434' },
  models: {
    loaded: ['phi3-mini', 'llama-3.2-3b'],
    total: 2
  }
}
```

#### Graceful Shutdown

```typescript
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

function shutdown(signal: string) {
  console.log(`${signal} received, shutting down gracefully`)
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
}
```

**Heartbeat Monitoring:**
- 60-second interval keep-alive for platform health checks
- Prevents cold starts on serverless platforms

---

## AI Conversation Flow

### Industry-Standard Pre-Context Building Pattern

Luna implements a **context-before-save** pattern that prevents AI hallucinations and context loss:

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User Message Received                                        │
│    POST /api/agent with { input, sessionId, modelName, ... }    │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│ 2. Pre-Context Building (BEFORE saving user message)            │
│    • memoryManager.buildContext(sessionId)                      │
│    • Retrieve recent messages, summaries, semantic pins         │
│    • Convert to conversation format                             │
│    • Calculate total tokens                                     │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│ 3. Save User Message to Database                                │
│    • Calculate importance score (crisis detection, keywords)    │
│    • INSERT INTO messages (...)                                 │
│    • Update session updated_at timestamp                        │
│    • Invalidate memory cache                                    │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│ 4. AI Processing                                                │
│    • runAgent() or runAgentStream()                             │
│    • Send pre-built context + current message to AI             │
│    • Include Luna patient context if available                  │
│    • Execute function calling tools if requested                │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│ 5. Save AI Response                                             │
│    • Calculate importance score                                 │
│    • INSERT INTO messages (role='assistant', ...)               │
│    • Track token usage                                          │
│    • Update session timestamp                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Why Pre-Context Building Matters

**Problem with Post-Save Context:**
- AI doesn't see the user's current message in history
- Leads to repetition and loss of conversational flow
- Can cause hallucinations about what was said

**Luna's Solution:**
1. **Build context FIRST** from existing messages
2. **Save user message** to database
3. **Send complete context** (including user message) to AI
4. AI responds with full awareness of conversation history

**Debug Logging:**
```typescript
console.log(`[Debug] Pre-save context for session ${usedSessionId}:`, {
  existingMessages: memoryContext.recentMessages.length,
  summaries: memoryContext.summaries.length,
  pins: memoryContext.semanticPins.length
})
```

### Auto-Save Session Model

**All sessions are immediately persistent** (saved=1):
- No transient/ephemeral sessions
- Every conversation appears in sidebar immediately
- Simplified state management
- No manual save required

```typescript
function ensurePersistentSession(sessionId: string, modelId?: string, personaId?: string) {
  const now = new Date().toISOString()
  const existing = db.prepare(`SELECT id FROM sessions WHERE id = ?`).get(sessionId)

  if (!existing) {
    db.prepare(
      `INSERT INTO sessions (id, name, model, persona_id, created_at, updated_at, saved)
       VALUES (?, ?, ?, ?, ?, ?, 1)`  // saved=1 immediately
    ).run(sessionId, 'New Chat', modelId ?? null, personaId ?? null, now, now)
  }
}
```

---

## API Route Organization

### 13 Feature-Domain Route Groups

```typescript
// AI Conversation
app.use('/api/agent', agentRouter)              // Chat endpoints (streaming + classic)

// Session & Memory
app.use('/api/sessions', sessionRouter)         // Session CRUD, save-only policy
app.use('/api/memory', memoryRouter)            // Context, pins, summaries

// AI Configuration
app.use('/api/personas', personasRouter)        // Persona management
app.use('/api/models', modelsRouter)            // Model registry

// Mental Health Core
app.use('/api/patients', patientsRouter)        // Patient profiles
app.use('/api/medications', medicationsRouter)  // Prescription tracking
app.use('/api/journal', journalRouter)          // Therapeutic journaling
app.use('/api/therapy-records', therapyRecordsRouter)  // CBT/ACT/DBT exercises

// RAG System
app.use('/api/datasets', datasetsRouter)        // Document upload & management
app.use('/api/vector-search', vectorSearchRouter)  // Semantic search

// External Services
app.use('/api/search', searchRouter)            // Tavily web search
```

### Route Responsibilities

**Agent Router** (`/api/agent`):
- POST `/` - Classic request/response chat
- POST `/` with `stream: true` - Server-Sent Events streaming
- Rate limiting (disabled in tests)
- Validates `AgentRequest` schema via Zod
- Handles session persistence
- Manages conversation history
- Executes AI function calling tools

**Session Router** (`/api/sessions`):
- GET `/` - List saved sessions
- POST `/` - Create new session
- GET `/:id` - Get session details
- PUT `/:id` - Update session (name, recap)
- DELETE `/:id` - Delete session (cascade to messages)
- POST `/:id/save` - Explicit save (though auto-save is default)

**Memory Router** (`/api/memory`):
- GET `/:sessionId/context` - Get full memory context
- POST `/:sessionId/summaries` - Create conversation summary
- GET `/:sessionId/summaries` - List summaries
- POST `/:sessionId/pins` - Create semantic pin
- GET `/:sessionId/pins` - List semantic pins
- GET `/:sessionId/stats` - Memory statistics

**Personas Router** (`/api/personas`):
- GET `/` - List all personas
- POST `/` - Create persona
- GET `/:id` - Get persona details
- PUT `/:id` - Update persona
- DELETE `/:id` - Delete persona (if not in use)
- GET `/templates` - List persona templates
- POST `/from-template` - Create persona from template

---

## Memory & Context Management

### Memory Manager Architecture

**Location**: `backend/logic/memoryManager.ts`

#### Core Configuration

```typescript
class MemoryManager {
  private readonly DEFAULT_CONTEXT_LIMIT = 10      // Messages in rolling buffer
  private readonly DEFAULT_TOKEN_LIMIT = 3000      // Max tokens for context
  private readonly SUMMARY_THRESHOLD = 8           // Messages before auto-summarization
  private readonly CACHE_TTL = 30000               // 30 seconds cache lifetime
}
```

#### Caching Strategy

**Query Result Caching:**
```typescript
private messageCountCache = new Map<string, { count: number; timestamp: number }>()
private recentMessagesCache = new Map<string, { messages: MessageWithImportance[]; timestamp: number }>()
```

**Benefits:**
- Reduces database queries during active conversations
- 30-second TTL optimized for therapeutic session duration
- Invalidated on message save to ensure data freshness

**Cache Invalidation:**
```typescript
invalidateSessionCache(sessionId: string): void {
  this.messageCountCache.delete(sessionId)
  this.recentMessagesCache.delete(sessionId)
  console.log(`[Memory] Invalidated cache for session ${sessionId}`)
}
```

#### Context Building Process

**Method**: `buildContext(sessionId, maxTokens)`

```typescript
async buildContext(sessionId: string, maxTokens = 3000): Promise<MemoryContext> {
  // 1. Get recent messages (last 8)
  const recentMessages = this.getRecentMessages(sessionId, 8)
  
  // 2. Get top semantic pins (5 most important)
  const semanticPins = this.getTopSemanticPins(sessionId, 5)
  
  // 3. Get recent conversation summaries (last 3)
  const summaries = this.getRecentSummaries(sessionId, 3)
  
  // 4. Estimate total tokens
  const totalTokens = this.estimateTokens(recentMessages, semanticPins, summaries)
  
  // 5. Truncate if over limit
  if (totalTokens > maxTokens) {
    return this.truncateContext(recentMessages, semanticPins, summaries, maxTokens)
  }
  
  return { recentMessages, semanticPins, summaries, totalTokens }
}
```

#### Importance Scoring

**Method**: `scoreMessageImportance(message)`

**Scoring Criteria:**
1. **Crisis Detection** (0.8-1.0 base):
   - "suicide", "self-harm", "crisis", "emergency"
   - Automatic +0.3 boost

2. **Medical/Therapeutic Keywords** (0.7-0.9):
   - Medication names, symptoms, side effects
   - Therapy exercises, emotions, moods

3. **Treatment Plans** (0.6-0.8):
   - Appointments, dosage changes, doctor visits

4. **General Conversation** (0.3-0.5):
   - Default range for non-critical content

**Crisis Prioritization:**
```typescript
if (isCrisisMessage) {
  baseScore += 0.3  // Ensures crisis content is preserved in context
}
```

#### Model-Aware Summarization

**Intelligent Model Selection:**
```typescript
private getSummarizationModel(sessionId: string): string {
  const sessionModel = this.getSessionModel(sessionId)
  
  if (sessionModel && this.isLocalModel(sessionModel)) {
    return sessionModel  // Use local model for offline capability
  }
  
  return 'gpt-4.1-nano'  // Fallback to cloud for consistency
}
```

**Therapy-Optimized Summarization:**
- Validates therapeutic expressions
- Preserves narrative work and progress
- Prevents hallucination of medical facts

---

## Tool System (Function Calling)

### Available Tools

**Location**: `backend/logic/tools.ts`

#### Web Search Tool

```typescript
{
  type: 'function',
  function: {
    name: 'web_search',
    description: 'Perform web search ONLY when user EXPLICITLY requests...',
    parameters: {
      query: { type: 'string', required: true },
      max_results: { type: 'number', min: 1, max: 10, default: 5 },
      include_answer: { type: 'boolean', default: true },
      search_depth: { enum: ['basic', 'advanced'], default: 'basic' }
    }
  }
}
```

**Explicit Intent Detection:**
- User MUST use keywords: "search online", "look up", "what's the current/latest"
- AI cannot autonomously decide to search
- Prevents unwanted internet queries

**Implementation:**
```typescript
export async function executeToolCall(
  functionName: string,
  functionArgs: Record<string, unknown>
): Promise<string> {
  switch (functionName) {
    case 'web_search':
      const results = await searchWeb(query, options)
      return JSON.stringify({
        query: results.query,
        answer: results.answer,
        sources: results.results.map(r => ({
          title: r.title,
          url: r.url,
          excerpt: r.content.substring(0, 300)
        })),
        results_count: results.results_count
      }, null, 2)
  }
}
```

**Tavily Integration:**
- Medical-grade search with source attribution
- AI-generated answer synthesis
- Configurable search depth (basic/advanced)
- Result limiting (1-10 sources)

### Tool Availability Control

**Conditional Tool Injection:**
```typescript
function hasExplicitSearchIntent(input: string): boolean {
  const explicitTriggers = [
    'search online', 'search for', 'look up', 'find online',
    'what is the current', 'what are the latest', 'recent',
    'up-to-date', 'real-time', 'breaking news'
  ]
  
  return explicitTriggers.some(trigger => input.toLowerCase().includes(trigger))
}

// Only provide tools if user explicitly requests them
const tools = hasExplicitSearchIntent(input) ? AVAILABLE_TOOLS : []
```

---

## Type System & Contracts

### Shared Type Definitions

Luna maintains **strict type contracts** between frontend and backend using shared TypeScript types.

#### Agent Types (`backend/types/agent.ts`)

```typescript
export interface AgentRequest {
  input: string                    // User message
  systemPrompt?: string            // Persona prompt
  modelName: string                // Required: model identifier
  settings: {                      // Model-specific configuration
    model: string
    temperature?: number
    maxTokens?: number
    topP?: number
    frequencyPenalty?: number
    presencePenalty?: number
    outputFormat?: string
  }
  fileIds?: string[]               // RAG document references
  stream?: boolean                 // Enable SSE streaming
  sessionId?: string               // Optional: session persistence
  personaId?: string               // Optional: persona selection
}

export interface AgentResponse {
  reply: string                    // AI response text
  tokenUsage: number               // Tokens consumed
  logs?: unknown[]                 // Debug information
}
```

#### Persona Types (`backend/types/personas.ts`)

```typescript
export interface Persona {
  id: string
  name: string
  prompt: string                   // System prompt
  description?: string
  icon?: string                    // Emoji or icon identifier
  category: 'cloud' | 'local'      // Model family
  settings?: {
    temperature?: number           // 0.0-2.0
    maxTokens?: number             // Response length limit
    topP?: number                  // 0.0-1.0 nucleus sampling
    repeatPenalty?: number         // 0.8-1.5
  }
  is_default: boolean              // System default flag
  created_at: string
  updated_at: string
  
  // Therapeutic Enhancement Fields
  template_id?: string             // Source template reference
  created_from?: 'template' | 'duplicate' | 'manual'
  tags?: string                    // JSON array
  is_favorite?: boolean
  usage_count?: number
  last_used_at?: string
  builtin_data_access?: string     // JSON data permissions
}
```

#### Memory Types (`backend/types/memory.ts`)

```typescript
export interface MessageWithImportance {
  id: number
  session_id: string
  role: 'user' | 'assistant' | 'system'
  text: string
  model_id: string
  token_usage: number
  created_at: string
  importance_score: number         // 0.0-1.0
}

export interface SemanticPin {
  id: string
  session_id: string
  content: string                  // Extracted insight
  source_message_id?: string
  importance_score: number         // 0.0-1.0
  pin_type: 'manual' | 'auto' | 'code' | 'concept' | 'system'
  created_at: string
}

export interface ConversationSummary {
  id: string
  session_id: string
  summary: string                  // Compressed conversation
  message_count: number
  start_message_id: string
  end_message_id: string
  importance_score: number
  created_at: string
}

export interface MemoryContext {
  recentMessages: MessageWithImportance[]
  semanticPins: SemanticPin[]
  summaries: ConversationSummary[]
  totalTokens: number
}
```

---

## Frontend Architecture

### Router Structure (`frontend/src/router/index.ts`)

```typescript
const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/kalito', name: 'chat', component: ChatWorkspace },
  { path: '/personas', name: 'personas', component: PersonaManager },
  { path: '/library', name: 'library', component: LibraryView },
  { path: '/resources', name: 'resources', component: ResourcesView },
  
  // Therapy Exercise Routes
  { path: '/cbt', name: 'cbt', component: CBTView },
  { path: '/self-context', name: 'self-context', component: ACTView },
  { path: '/dbt', name: 'dbt', component: DBTView },
  
  // Patient Management
  { path: '/kalito-hub', name: 'kalito-hub', component: KalitoHub },
  
  // Journaling Routes
  { path: '/journal', name: 'journal', component: JournalView },
  { path: '/journal/new', name: 'journal-new', component: JournalEntryView },
  { path: '/journal/:id/edit', name: 'journal-edit', component: JournalEntryView },
  { path: '/journal/calendar', name: 'journal-calendar', component: JournalCalendarView },
]
```

### API Client (`frontend/src/core.ts`)

#### Classic Request/Response

```typescript
export async function sendMessageToAgent(
  userInput: string,
  systemPrompt: string = '',
  modelKey: string,
  sessionSettings: Partial<AgentRequest['settings']> = { model: modelKey },
  fileIds: string[] = [],
  sessionId?: string,
  sessionName?: string
): Promise<{ reply: string; tokenUsage: number }>
```

**Features:**
- Settings whitelist validation (only valid API properties)
- Prompt optimization per model
- File ID merging (function arg > session settings)
- Persona/context extraction
- Error handling with friendly messages

#### Streaming with SSE

```typescript
export async function* sendMessageToAgentStream(
  /* same parameters as sendMessageToAgent */
): AsyncGenerator<{ delta?: string; done?: boolean; tokenUsage?: number; error?: string }>
```

**Implementation:**
- Async generator pattern
- Server-Sent Events (SSE) parsing
- Line-by-line streaming
- Error recovery
- Yields incremental deltas

**Usage Example:**
```typescript
for await (const chunk of sendMessageToAgentStream(input, prompt, model, settings)) {
  if (chunk.delta) {
    assistantMessage += chunk.delta
  }
  if (chunk.error) {
    console.error(chunk.error)
  }
  if (chunk.done) {
    tokenUsage = chunk.tokenUsage || 0
  }
}
```

#### Model Selection Logic

```typescript
export function selectOptimalModel(
  category: 'cloud' | 'local' = 'cloud',
  availableModels: ModelInfo[] = []
): string {
  const modelPriorities = {
    cloud: ['gpt-4.1-nano'],
    local: ['phi3-mini', 'qwen-2.5-coder-3b', 'llama-3.2-3b', 'llama-3.1-8b']
  }
  
  const priorityList = modelPriorities[category]
  const availableModelKeys = availableModels.map(m => m.key)
  
  return priorityList.find(key => availableModelKeys.includes(key)) 
         || availableModels[0]?.key 
         || 'gpt-4.1-nano'
}
```

**Priority Rankings:**
- **Cloud**: GPT-4.1-nano (sole cloud model)
- **Local**: phi3-mini (primary, medical knowledge) → qwen-2.5-coder → llama-3.2 → llama-3.1

#### Prompt Optimization

```typescript
export function optimizePromptForModel(prompt: string, modelKey: string): string {
  if (!prompt) return ''
  
  // Model-specific optimizations
  if (modelKey.includes('phi3')) {
    // Phi3 prefers concise, structured prompts
    return prompt + '\n\nProvide clear, medically accurate responses.'
  }
  
  if (modelKey.includes('llama')) {
    // Llama models benefit from explicit instructions
    return prompt + '\n\nBe thorough and maintain context.'
  }
  
  // Default: return as-is
  return prompt
}
```

---

## Dependency Stack

### Root Project

```json
{
  "packageManager": "pnpm@10.18.2",
  "devDependencies": {
    "@eslint/js": "^9.32.0",
    "@typescript-eslint/eslint-plugin": "^8.38.0",
    "@typescript-eslint/parser": "^8.38.0",
    "eslint": "^9.32.0",
    "eslint-config-prettier": "^10.1.8",
    "husky": "^9.1.7",
    "lint-staged": "^16.1.2",
    "prettier": "^3.6.2",
    "typescript": "^5.9.2",
    "vitest": "^3.2.4"
  }
}
```

### Backend Dependencies

**Core:**
- `express@5.1.0` - HTTP server
- `better-sqlite3@12.2.0` - Database (WAL mode, 50%+ faster writes)
- `dotenv@16.5.0` - Environment configuration
- `typescript@5.0.0` - Type safety

**AI Providers:**
- `openai@5.0.1` - GPT-4.1-nano integration
- `@anthropic-ai/sdk@0.58.0` - Claude integration

**Security:**
- `helmet@8.1.0` - Security headers
- `cors@2.8.5` - Cross-origin resource sharing
- `express-rate-limit@8.0.1` - DDoS protection

**Validation & Utilities:**
- `zod@3.23.8` - Schema validation
- `winston@3.17.0` - Structured logging
- `undici@7.13.0` - Fast HTTP client

**RAG System:**
- `mammoth@1.11.0` - DOCX processing
- `pdf-parse@2.4.5` - PDF extraction
- `multer@2.0.2` - File uploads

**Search:**
- `@tavily/core@0.5.12` - Web search integration

### Frontend Dependencies

**Core:**
- `vue@3.5.13` - Reactive framework
- `vue-router@4.5.1` - Client-side routing
- `typescript@5.8.3` - Type safety

**Mobile & PWA:**
- `@capacitor/core@6.2.0` - Native bridge
- `@capacitor/android@6.2.0` - Android platform
- `@capacitor/assets@3.0.5` - Icon/splash generation
- `vite-plugin-pwa@1.0.2` - Service workers
- `workbox-window@7.3.0` - Offline caching

**UI:**
- `ionicons@8.0.13` - Icon library

**Development:**
- `vite@6.3.5` - Build tool (10x faster than Webpack)
- `@vitejs/plugin-vue@5.2.3` - Vue 3 support
- `@vitejs/plugin-basic-ssl@1.1.0` - HTTPS in dev
- `@vueuse/core@13.6.0` - Composition utilities

**Syntax Highlighting:**
- `shiki@3.9.2` - Code highlighting (for docs/examples)

---

## Security Architecture

### Multi-Layer Defense

#### 1. Helmet Security Headers

```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}))
```

**Protections:**
- XSS (Cross-Site Scripting)
- Clickjacking
- MIME sniffing
- DNS prefetching
- Frame embedding

#### 2. CORS Configuration

```typescript
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
```

#### 3. Rate Limiting

**General Rate Limit:**
```typescript
const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // 100 requests per window
  message: 'Too many requests from this IP'
})
```

**Agent-Specific Rate Limit:**
```typescript
const agentRateLimit = rateLimit({
  windowMs: 60 * 1000,        // 1 minute
  max: 20,                     // 20 AI requests per minute
  message: 'Too many AI requests'
})
```

#### 4. Request Size Limits

```typescript
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
```

#### 5. Request Timeouts

```typescript
const requestTimeout = (timeoutMs = 300000) => {  // 5 minutes
  return (req, res, next) => {
    req.setTimeout(timeoutMs, () => {
      res.status(408).json({ error: 'Request timeout' })
    })
    next()
  }
}
```

#### 6. Input Validation (Zod)

```typescript
const agentRequestSchema = z.object({
  input: z.string().min(1).max(10000),
  systemPrompt: z.string().max(5000).optional(),
  modelName: z.string(),
  settings: z.object({
    model: z.string(),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().min(1).max(8000).optional(),
    // ... other settings
  }),
  stream: z.boolean().optional(),
  sessionId: z.string().optional(),
  personaId: z.string().optional()
})
```

---

## Performance Optimizations

### Database Layer
**Document Status**: ✅ Complete and Active  
**Version**: 1.1  
**Last Updated**: December 2, 2025  
**Changelog**: Added comprehensive repository structure section  
**Maintained By**: Kalito Labs  
**Related Documents**: [Introduction & System Overview](./intro.md)
PRAGMA synchronous = NORMAL;
```

**Benefits:**
- 50%+ faster writes
- Concurrent reads during writes
- Better crash recovery

#### 2. Strategic Indexes

```sql
-- Message queries
CREATE INDEX idx_messages_session_created ON messages(session_id, created_at DESC);
CREATE INDEX idx_messages_session_importance_created 
  ON messages(session_id, importance_score DESC, created_at DESC);

-- Journal queries
CREATE INDEX idx_journal_entries_patient_date ON journal_entries(patient_id, entry_date DESC);
CREATE INDEX idx_journal_entries_mood ON journal_entries(patient_id, mood);

-- Therapy records
CREATE INDEX idx_therapy_records_patient_type 
  ON therapy_records(patient_id, therapy_type, created_at DESC);
```

#### 3. Query Caching

**Memory Manager Cache:**
- 30-second TTL for active conversations
- Invalidated on message save
- Reduces database load by 60-80% during sessions

### Frontend Optimizations

#### 1. Code Splitting

```typescript
// Lazy-loaded routes
const CBTView = () => import('../views/CBTView.vue')
const LibraryView = () => import('../views/LibraryView.vue')
```

#### 2. Vite Build Optimization

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['vue', 'vue-router'],
          'ionicons': ['ionicons'],
        }
      }
    }
  }
})
```

#### 3. Service Worker Caching

```typescript
// PWA offline support
workbox.precaching.precacheAndRoute(self.__WB_MANIFEST)
workbox.routing.registerRoute(
  /\/api\//,
  new workbox.strategies.NetworkFirst()
)
```

---

## Deployment Patterns

### Development Environment

```bash
# Backend (Port 3000)
cd backend && pnpm dev
# Nodemon auto-restart on file changes

# Frontend (Port 5173)
cd frontend && pnpm dev
# Vite HMR (Hot Module Replacement)
```

### Production Build

```bash
# Frontend
cd frontend && pnpm build
# Output: frontend/dist/

# Backend
cd backend && pnpm build
# Output: backend/dist/

# Start production server
cd backend && pnpm start
```

### Android Deployment

```bash
# Full build pipeline
pnpm run build-app
# 1. Build frontend → dist/
# 2. Sync with Capacitor → android/
# 3. Gradle assembleDebug → APK

# Individual steps
pnpm run android:build    # Build + sync
pnpm run android:apk      # Generate APK
pnpm run android:install  # Install via ADB
```

### Cloud Deployment Targets

**Fly.io Configuration:**
```toml
[build]
  builder = "paketobuildpacks/builder:base"
  
[env]
  NODE_ENV = "production"
  TRUST_PROXY = "1"

[[services]]
  internal_port = 3000
  protocol = "tcp"
```

**Render Configuration:**
```yaml
services:
  - type: web
    name: luna-backend
    env: node
    buildCommand: cd backend && pnpm install && pnpm build
    startCommand: cd backend && pnpm start
    envVars:
      - key: NODE_ENV
        value: production
```

### Database Backup Strategy

```bash
# Automated backup script
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
cp backend/db/kalito.db backups/kalito.db.$TIMESTAMP.bak
echo "Backup created: kalito.db.$TIMESTAMP.bak"

# Cron job (daily at 2 AM)
0 2 * * * /path/to/luna-repo/scripts/backup-db
```

---

## Architectural Decisions & Rationale

### Why SQLite?

1. **Local-First**: Complete data sovereignty
2. **Zero Configuration**: No separate database server
3. **Performance**: WAL mode provides excellent concurrency
4. **Portability**: Single file, easy backups
5. **Reliability**: ACID compliant, battle-tested

**Trade-off**: Limited to single-machine deployment (acceptable for personal use)

### Why Express 5.x?

1. **Maturity**: Production-proven for 10+ years
2. **Ecosystem**: Massive middleware ecosystem
3. **Performance**: Native async/await support in v5
4. **Simplicity**: Minimal overhead, easy debugging

### Why Vue 3?

1. **Composition API**: Better TypeScript support
2. **Performance**: Virtual DOM optimizations
3. **Size**: Smaller bundle than React
4. **Developer Experience**: Excellent tooling (Vite, DevTools)

### Why Capacitor over React Native?

1. **Web-First**: Write once, deploy everywhere
2. **Progressive Enhancement**: Works as PWA without compilation
3. **Maintenance**: Single codebase for web + mobile
4. **Ionic Integration**: UI components designed for mobile

### Why pnpm?

1. **Speed**: 2-3x faster than npm
2. **Disk Efficiency**: Shared dependency store
3. **Workspace Support**: Native monorepo support
4. **Strict**: Prevents phantom dependencies

---

## Conclusion

Luna's architecture demonstrates **production-grade engineering principles** applied to a personal mental health application:

- **Security-first** with multi-layer defense
- **Performance-optimized** with caching and indexing
- **Type-safe** with shared contracts
- **Observable** with structured logging
- **Maintainable** with clear separation of concerns
- **Extensible** with plugin-based tools and adapters

The architecture is designed for **reliability, privacy, and therapeutic efficacy**—not just technical excellence. Every decision prioritizes the user's mental health data security and conversational quality.

---

**Document Status**: ✅ Complete and Active  
**Version**: 1.0  
**Last Updated**: December 2, 2025  
**Maintained By**: Kalito Labs  
**Related Documents**: [Introduction & System Overview](./intro.md)
