# Luna AI Context & Memory Architecture

**Last Updated:** November 23, 2025  
**Version:** 2.0  
**Status:** Production Ready ✅  

This document provides comprehensive documentation for Luna's AI context and memory management system, which powers intelligent conversations with full awareness of patient data, conversation history, journal entries, and knowledge base integration (RAG).

  

## 🏗️ Overview

Luna's AI system consists of three primary integrated services that work together to provide intelligent, context-aware conversations:

1. **LunaContextService** - Provides real-time patient data context (medications, appointments, journal entries, and demographics)
2. **MemoryManager** - Manages conversation history, summarization, and semantic memory
3. **Dataset Integration (RAG)** - Knowledge base with document processing, chunking, and retrieval-augmented generation

### Architecture Diagram

```mermaid
graph TB
subgraph "AI Context Pipeline"
A[User Query] --> B[AgentRouter]
B --> C[MemoryManager]
B --> D[LunaContextService]
B --> E[QueryRouter]
C --> F[Conversation Context]
D --> G[Patient Data Context]
E --> H[Structured Services]
F --> I[AI Model]
G --> I
H --> I
I --> J[AI Response]
J --> K[Save to Database]
K --> L[Update Memory Cache]
K --> M[Auto-Summarization Check]
end

subgraph "Data Sources - Patient Data"
N[(Patients)] --> D
O[(Medications)] --> D
P[(Appointments)] --> D
Q[(Journal Entries)] --> D
end

subgraph "Data Sources - Memory"
R[(Messages)] --> C
S[(Summaries)] --> C
T[(Semantic Pins)] --> C
end

subgraph "Data Sources - Knowledge Base"
U[(Datasets)] --> D
V[(Document Chunks)] --> D
W[(Persona-Dataset Links)] --> D
end

subgraph "Validation Services"
H --> X[StructuredMedicationService]
H --> Y[StructuredAppointmentService]
end

style I fill:#4CAF50
style C fill:#2196F3
style D fill:#FF9800
style E fill:#9C27B0
style H fill:#F44336
```

  

## 📊 LunaContextService

**Location:** `/backend/logic/lunaContextService.ts`  
**Purpose:** Provides AI models with comprehensive patient data context including RAG knowledge base

### Core Functionality

The LunaContextService bridges patient data and knowledge bases with AI conversations, enabling the AI to reference:
- Patient demographics and personal information
- Current medications with full prescription details
- Recent and upcoming appointments
- Journal entries (mood, emotions, therapeutic insights)
- Document-based knowledge (PDF, DOCX, TXT, MD files via RAG)

  

### Key Features

#### 🔒 **Security & Privacy**
```typescript
// Read-only operations only - AI cannot modify patient data
// All models get full context access for comprehensive care
// Strict confidentiality protocols in generated prompts
// Session-aware patient focus tracking
```

#### 🎯 **Mental Health Focus**
- Optimized for therapeutic conversations
- Journal entries provide emotional/mood context
- Crisis intervention content prioritization
- Family dynamics awareness (Kaleb caring for patients)
- Medication adherence tracking

#### 📚 **Knowledge Base Integration (RAG)**
- Document upload and processing (PDF, DOCX, TXT, MD)
- Persona-specific dataset access control
- Weighted dataset prioritization
- Access levels: `read`, `summary`, `reference_only`
- Automatic chunk retrieval based on relevance

  

#### 📋 **Data Structures**

```typescript
interface PatientContext {
  id: string
  name: string
  age?: number // Calculated from date_of_birth
  gender?: string
  phone?: string
  city?: string
  state?: string
  occupation?: string
  occupation_description?: string
  languages?: string
  primary_doctor_id?: string
  notes?: string
}

interface MedicationContext {
  id: string
  patientId: string
  patientName?: string // For easy reference
  name: string // Brand name
  genericName?: string
  dosage: string
  frequency: string
  prescribingDoctor?: string
  pharmacy?: string
  rxNumber?: string
  sideEffects?: string
  notes?: string
}

interface AppointmentContext {
  id: string
  appointmentDate: string
  appointmentTime?: string
  appointmentType?: string
  location?: string
  status: string
  preparationNotes?: string
  outcomeSummary?: string
  followUpRequired?: boolean
}

interface JournalContext {
  id: string
  patientId: string
  patientName?: string
  title?: string
  content: string
  entryDate: string
  entryTime?: string
  mood?: string
  emotions?: string[]
  journalType?: string
  wordCount: number
}

interface DatasetContext {
  id: string
  name: string
  description?: string
  chunkCount: number
  accessLevel: 'read' | 'summary' | 'reference_only'
  enabled: boolean
  chunks: DatasetChunk[]
}

interface DatasetChunk {
  id: string
  content: string
  chunkIndex: number
  sectionTitle?: string
  pageNumber?: number
  tokenCount?: number
}
```

  

### Core Methods

#### `getLunaContext(adapter: LLMAdapter, patientId?: string, personaId?: string): LunaContext`
**Primary method** - Returns comprehensive context for AI models including datasets

```typescript
const context = lunaContextService.getLunaContext(adapter, patientId, personaId)
// Returns: { patients, medications, recentAppointments, journalEntries, datasets, summary }
```

**Enhanced Features:**
- **Patient filtering**: Optional patientId to focus on specific patient
- **Persona datasets**: Automatic retrieval of documents linked to persona via `personaId`
- **Journal insights**: Last 30 days of journal entries with mood/emotion data
- **Knowledge base**: All enabled datasets with their document chunks

#### `generateContextualPrompt(adapter: LLMAdapter, userQuery: string, sessionId?: string): string`
**Smart context injection** - Analyzes user query and session to provide relevant context

```typescript
// Automatically detects patient references in queries
// Session-aware patient focus with pronoun resolution
// Dataset retrieval based on session persona
// Returns formatted prompt with relevant data

const contextPrompt = lunaContextService.generateContextualPrompt(
  adapter,
  "How is the medication working?",
  sessionId
)
```

**Intelligence Features:**
- Extracts patient references from natural language
- Resolves pronouns ("she", "he", "they") using session context
- Maintains conversation continuity across multiple queries
- Fetches persona-specific datasets for RAG integration

#### `findPatientByReference(reference: string): PatientContext | null`
**Natural language patient lookup** - Case-insensitive patient name matching

```typescript
// Supports partial names, nicknames, and fuzzy matching
const patient = lunaContextService.findPatientByReference("Kaleb")
const patient = lunaContextService.findPatientByReference("mom") // Context-aware
```

  

### Integration with Structured Services

LunaContextService leverages specialized services for data validation and query routing:

```typescript
// Uses StructuredMedicationService for validated medication data
this.structuredMedicationService.getMedicationsStructured(patientId)

// Uses StructuredAppointmentService for consistent appointment data
this.structuredAppointmentService.getRecentAppointmentsForContext(patientId)
```

**Query Routing Intelligence:**
- **detectQueryType()** - Classifies queries as `MEDICATIONS`, `APPOINTMENTS`, or `GENERAL`
- **extractPatientReference()** - Extracts patient names from natural language
- **containsPronounReference()** - Detects pronoun usage for context continuation

**Direct Database Responses** (bypasses AI for accuracy):
When queries are classified as `APPOINTMENTS` or `MEDICATIONS`, the system:
1. Detects query type using pattern matching
2. Resolves patient identity (explicit name, pronoun, or session context)
3. Fetches validated data from structured services
4. Returns formatted database ground truth
5. Prevents AI hallucinations by skipping LLM generation

  

### Context Summary Generation

The service automatically generates comprehensive summaries with **explicit null-state handling**:

```typescript
## Mental Health Practice Context Summary

### Patients (1)
- **Kaleb Sanchez**, age 39, male
Phone: 956-324-1560
Location: Laredo, Texas
Occupation: Caregiver "Palomita"
Details: I take care of my elderly Mom Aurora Sanchez.
Languages: English and Spanish

### Active Medications (4)
**Kaleb Sanchez (4 medications)**
- Lithium (Lithium Carb) 300mg - three_times_daily
Prescribed by: Dr. Smith
Pharmacy: CVS Pharmacy (Rx: 12345)

### Upcoming Appointments
**NO UPCOMING APPOINTMENTS SCHEDULED**
- There are currently no appointments in the system
- Do not fabricate or suggest appointment dates
- If asked about appointments, clearly state that none are scheduled

### Recent Journal Entries (Last 30 Days: 1 entries)
**Kaleb Sanchez (1 recent entry)**
- 2025-11-21: "Reflections on caregiving journey"
Emotional state: Relaxed (also feeling: grateful, hopeful)
Content: Today was a good day. Mom seemed more engaged...
(250 words)

### Knowledge Base Documents (2)
**AVAILABLE REFERENCE MATERIALS**

#### 📚 CBT Anxiety Treatment Guide
Cognitive Behavioral Therapy techniques for anxiety management
- Access Level: read
- Content: 15 sections

**Section 1**: Introduction to CBT
Cognitive Behavioral Therapy (CBT) is an evidence-based...

**Section 2**: Identifying Thought Patterns
Negative automatic thoughts are...
```

**Null-State Prevention:**
- Explicitly states when NO appointments exist
- Prevents AI from hallucinating future dates
- Clear instructions not to fabricate data
- Same pattern applied to medications and journals

  

### AI Instructions Integration

Each context includes specific AI behavioral instructions tailored to data availability:

```typescript
## CRITICAL Instructions for AI Assistant
- **USE ONLY CURRENT DATA**: The information above is the AUTHORITATIVE source - ignore any data from previous messages
- **PATIENT CONFIDENTIALITY**: Treat all patient information as strictly confidential
- **ACCURATE REPORTING**: When discussing patient information, use only the data shown above
- **NO HALLUCINATION**: Do not invent or assume patient details not explicitly provided
- **JOURNAL INSIGHTS**: Use journal entries to understand emotional state, concerns, and therapy progress
- **THERAPEUTIC SUPPORT**: Help identify patterns in mood, emotions, and themes from journal entries
- **KNOWLEDGE BASE ACCESS**: You have access to reference documents shown in the Knowledge Base section above
- **CITE SOURCES**: When using information from knowledge base documents, reference the document name
- **APPLY EXPERTISE**: Use the knowledge base to provide evidence-based therapeutic guidance
- **DATASET PRIORITY**: Information from knowledge base documents should supplement, not replace, patient-specific data
- **PROFESSIONAL CONTEXT**: This is for mental health practice management
- Focus on supporting therapeutic goals and treatment planning
```

**Dynamic Instructions:**
- RAG instructions only appear when datasets are available
- Journal guidance included when entries exist
- Null-state warnings prevent data fabrication

---

## 📚 Dataset Integration & RAG System

**Location:** `/backend/logic/documentProcessor.ts`, `/backend/logic/chunkingService.ts`  
**Purpose:** Knowledge base integration with document processing and retrieval-augmented generation

### Overview

Luna's RAG (Retrieval-Augmented Generation) system enables AI to reference external documents and knowledge bases, providing evidence-based therapeutic guidance and medical information.

### Supported Document Types
- **PDF** - Medical research, treatment guidelines, therapy protocols
- **DOCX** - Clinical documentation, therapy worksheets
- **TXT** - Plain text resources, notes
- **MD** - Markdown formatted guides and documentation

### Database Schema (3 Tables)

#### `datasets` Table
```sql
CREATE TABLE datasets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  therapeutic_category TEXT,
  processing_mode TEXT DEFAULT 'local',  -- 'local' or 'cloud'
  processing_status TEXT DEFAULT 'pending',
  chunk_count INTEGER DEFAULT 0,
  embedding_model TEXT,
  created_by_user BOOLEAN DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  processed_at TEXT,
  error_message TEXT,
  metadata TEXT  -- JSON: page_count, word_count, author, etc.
)
```

#### `document_chunks` Table
```sql
CREATE TABLE document_chunks (
  id TEXT PRIMARY KEY,
  dataset_id TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding BLOB,  -- Vector embedding for similarity search
  embedding_dim INTEGER DEFAULT 384,
  embedding_model TEXT,
  chunk_type TEXT DEFAULT 'body',
  section_title TEXT,
  page_number INTEGER,
  char_start INTEGER,
  char_end INTEGER,
  token_count INTEGER,
  therapeutic_tags TEXT,
  similarity_threshold REAL DEFAULT 0.7,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
)
```

#### `persona_datasets` Table
```sql
CREATE TABLE persona_datasets (
  id TEXT PRIMARY KEY,
  persona_id TEXT NOT NULL,
  dataset_id TEXT NOT NULL,
  enabled BOOLEAN DEFAULT 1,
  weight REAL DEFAULT 1.0,  -- Priority weighting for retrieval
  access_level TEXT DEFAULT 'read',  -- 'read', 'summary', 'reference_only'
  last_used_at TEXT,
  usage_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (persona_id) REFERENCES personas(id) ON DELETE CASCADE,
  FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE,
  UNIQUE(persona_id, dataset_id)
)
```

### Document Processing Pipeline

```mermaid
graph LR
A[Upload Document] --> B[Extract Text]
B --> C[Chunk Text]
C --> D[Generate Embeddings]
D --> E[Store in Database]
E --> F[Link to Persona]
F --> G[Available for RAG]
```

#### 1. **Document Upload** (`/api/datasets/upload`)
```typescript
POST /api/datasets/upload
Content-Type: multipart/form-data

{
  file: <binary>,
  therapeutic_category: "CBT_ANXIETY",
  processing_mode: "local",  // or "cloud"
  persona_id: "persona_123",
  description: "CBT techniques for anxiety"
}
```

#### 2. **Text Extraction**
- **PDF**: Uses `pdf-parse` library
- **DOCX**: Uses `mammoth` library
- **TXT/MD**: Direct file reading

#### 3. **Chunking Strategy**
```typescript
interface ChunkingOptions {
  chunk_size: number        // Default: 1000 characters
  chunk_overlap: number     // Default: 200 characters
  respect_paragraphs: boolean  // Default: true
  max_chunk_size: number    // Default: 1500 characters
}
```

**Smart Chunking Features:**
- Respects paragraph boundaries
- Maintains section headers with chunks
- Preserves semantic coherence
- Overlapping chunks for context continuity

#### 4. **Embedding Generation** (Future Enhancement)
```typescript
// Currently using mock embeddings
// Future: @xenova/transformers for local embeddings
// Future: OpenAI embeddings for cloud mode

interface EmbeddingOptions {
  model: 'local' | 'openai'
  embedding_model: 'all-MiniLM-L6-v2' | 'text-embedding-3-small'
  normalize: boolean
  batch_size: number
}
```

### Persona-Dataset Linking

**Access Levels:**
- `read` - Full access to document content
- `summary` - AI generates summaries before using
- `reference_only` - Cited but not directly included in context

**Weight System:**
- Higher weights prioritize certain documents
- Used for relevance ranking in retrieval
- Range: 0.1 - 2.0 (default: 1.0)

### RAG Integration Flow

```typescript
// 1. User sends message in session with persona
POST /api/agent
{
  sessionId: "session_123",
  personaId: "persona_456",
  input: "What are CBT techniques for anxiety?"
}

// 2. LunaContextService fetches persona datasets
const datasets = lunaContextService.getLunaContext(adapter, patientId, personaId)

// 3. All enabled dataset chunks included in system prompt
context.datasets.forEach(dataset => {
  dataset.chunks.forEach(chunk => {
    // Chunk content added to AI context
  })
})

// 4. AI generates response using both:
//    - Patient data (medications, journal, appointments)
//    - Knowledge base documents (CBT guides, research)
```

### Context Building with RAG

```typescript
interface LunaContext {
  patients: PatientContext[]
  medications: MedicationContext[]
  recentAppointments: AppointmentContext[]
  journalEntries: JournalContext[]
  datasets: DatasetContext[]  // ← RAG knowledge base
  summary: string  // Formatted for AI consumption
}

// Example formatted summary with datasets:
`
### Knowledge Base Documents (2)
**AVAILABLE REFERENCE MATERIALS**

#### 📚 CBT Anxiety Treatment Guide
Cognitive Behavioral Therapy techniques for anxiety management
- Access Level: read
- Content: 15 sections

**Section 1**: Introduction to CBT
[Full chunk content here...]

**Section 2**: Cognitive Distortions
[Full chunk content here...]
`
```

### API Endpoints

```typescript
// List all datasets
GET /api/datasets
Response: DatasetRecord[]

// Upload and process document
POST /api/datasets/upload
Body: multipart/form-data
Response: { dataset_id, chunk_count, processing_time_ms }

// Link dataset to persona
POST /api/datasets/:datasetId/link-persona
Body: { persona_id, enabled, weight, access_level }

// Get datasets for persona
GET /api/datasets/persona/:personaId
Response: DatasetWithLink[]

// Delete dataset (cascades to chunks and links)
DELETE /api/datasets/:datasetId
```

### Performance Characteristics

**Document Processing:**
- PDF (10 pages): ~2-5 seconds
- DOCX (10 pages): ~1-3 seconds
- TXT (50KB): <1 second
- Chunking: ~100ms per document

**Context Building:**
- Dataset retrieval: ~50-100ms per persona
- Chunk concatenation: ~10-20ms
- Total RAG overhead: ~100-200ms

**Storage:**
- Average chunk: ~1KB
- Typical document: 10-50 chunks
- 100 documents: ~5-10MB database space

### Best Practices

1. **Therapeutic Categories**: Organize by treatment type (CBT, DBT, Medication Guides)
2. **Persona Specificity**: Link relevant docs only to specialized personas
3. **Weight Optimization**: Higher weights for primary reference materials
4. **Chunk Size**: 1000 chars optimal for therapeutic content
5. **Access Levels**: Use `summary` for lengthy documents to reduce context size

### Future Enhancements

1. **Semantic Search**: True vector similarity search with embeddings
2. **Hybrid Search**: Combine keyword and semantic approaches
3. **Dynamic Retrieval**: Fetch only relevant chunks based on query
4. **Citation Tracking**: Automatic source attribution in AI responses
5. **Version Control**: Track document updates and changes

---

  

## 🧠 MemoryManager

**Location:** `/backend/logic/memoryManager.ts`  
**Purpose:** Hybrid memory system with rolling buffer, summarization, semantic pins, and therapy-optimized importance scoring

### Core Architecture

The MemoryManager implements a sophisticated three-layer memory system optimized for therapeutic conversations:

1. **Rolling Buffer** - Recent messages (configurable, default 10 messages)
2. **Conversation Summaries** - AI-generated summaries of message groups (triggered after 8 messages)
3. **Semantic Pins** - Important extracted information with urgency levels

### Key Features

#### ⚡ **Performance Optimization**
```typescript
// Intelligent caching with 30-second TTL (therapy session optimized)
private messageCountCache = new Map()
private recentMessagesCache = new Map()
private readonly CACHE_TTL = 30000 // Longer for therapy session patterns
```

#### 🎯 **Mental Health Optimization**
```typescript
// Therapy-optimized summarization threshold
private readonly SUMMARY_THRESHOLD = 8 // Messages before auto-summarization
private readonly DEFAULT_CONTEXT_LIMIT = 10 // Rolling buffer size
private readonly DEFAULT_TOKEN_LIMIT = 3000 // Max context tokens

// Mental health importance scoring (see scoreMessageImportance below)
if (text.includes('feeling') || text.includes('anxiety') || text.includes('depression')) {
  score += 0.25 // Higher than technical content
}

// Crisis content gets highest priority
if (text.includes('crisis') || text.includes('suicidal')) {
  score += 0.3 // Maximum urgency
}
```

#### 🔄 **Industry Standard Memory Pattern**
```typescript
// Build context from existing messages BEFORE saving current input
// This prevents including the user's current message in their own context

1. User sends message
2. buildContext(sessionId) - Retrieves ONLY previous messages
3. Save user message to database  
4. Pass pre-built context + new message to AI
5. Save AI response with metadata
6. Auto-summarization check
7. Update memory cache
```

**Critical Design:** Context is built BEFORE the current message is saved, ensuring the AI receives conversation history without the current input being duplicated.

  

### Core Methods

  

#### `buildContext(sessionId: string, maxTokens?: number): Promise<MemoryContext>`

**Primary memory method** - Builds comprehensive conversation context

  

```typescript

const context = await memoryManager.buildContext(sessionId, 3000)

// Returns: { recentMessages, semanticPins, summaries, totalTokens }

```

  

#### `scoreMessageImportance(message: MessageWithImportance): number`
**Intelligent scoring** - Tailored for mental health conversations with crisis prioritization

```typescript
// Base score: 0.5

// Questions and inquiries: +0.2
if (text.includes('?') || text.startsWith('what/how/why')) score += 0.2

// MENTAL HEALTH: Emotional and therapeutic content (+0.25)
if (text.includes('feeling', 'mood', 'depression', 'anxiety', 'stress', 
                  'worried', 'overwhelmed', 'therapy', 'counseling')) {
  score += 0.25 // HIGH therapeutic importance
}

// MENTAL HEALTH: Treatment discussions (+0.2)
if (text.includes('medication', 'prescription', 'dosage', 'side effect',
                  'treatment', 'doctor', 'appointment')) {
  score += 0.2
}

// MENTAL HEALTH: Family/caregiver context (+0.15)
if (text.includes('mom', 'mother', 'dad', 'father', 'family', 'caregiver')) {
  score += 0.15 // Kaleb's specific caregiving situation
}

// MENTAL HEALTH: Crisis content (+0.3) - HIGHEST PRIORITY
if (text.includes('crisis', 'emergency', 'urgent', 'help me',
                  'can\'t cope', 'suicidal', 'self-harm')) {
  score += 0.3 // Maximum urgency for safety
}

// Technical content: +0.1 (lower priority in therapy)
if (text.includes('```', 'function', 'class')) score += 0.1

// Error/problem reports: +0.1
if (text.includes('error', 'problem', 'issue')) score += 0.1

// Longer messages (more content): +0.1
if (text.length > 200) score += 0.1

// Assistant responses: +0.05 (contain answers)
if (message.role === 'assistant') score += 0.05

// Capped at 1.0
return Math.min(score, 1.0)
```

**Scoring Philosophy:**
- Crisis safety: 0.8-1.0 (immediate attention required)
- Therapeutic content: 0.7-0.9 (core treatment focus)
- Treatment planning: 0.6-0.8 (medication, appointments)
- General questions: 0.5-0.7 (information seeking)
- Technical/casual: 0.4-0.6 (lower therapeutic priority)

  

#### `autoSummarizeSession(sessionId: string): Promise<ConversationSummary | null>`

**Automatic summarization** - Creates summaries when conversation reaches threshold

  

```typescript

// Smart session-aware model selection

private getSummarizationModel(sessionId: string): string {

const sessionModel = this.getSessionModel(sessionId)

if (sessionModel && this.isLocalModel(sessionModel)) {

return sessionModel // Use local model for offline capability

}

return 'gpt-4.1-nano' // Fallback to Luna's preferred cloud model

}

```

  

#### `createSemanticPin(request: CreatePinRequest): SemanticPin`

**Information extraction** - Manually or automatically create important information pins

  

```typescript

const pin = memoryManager.createSemanticPin({

session_id: sessionId,

content: "Patient reported significant mood improvement with new medication",

source_message_id: messageId,

importance_score: 0.9,

pin_type: 'therapeutic_insight'

})

```

  

### Memory Context Structure

  

```typescript

interface MemoryContext {

recentMessages: MessageWithImportance[] // Last 5-8 messages

semanticPins: SemanticPin[] // Top 3-5 important extracts

summaries: ConversationSummary[] // Recent 2-3 summaries

totalTokens: number // Estimated token count

}

  

interface MessageWithImportance {

id: number

session_id: string

role: 'user' | 'assistant'

text: string

model_id?: string

token_usage?: number

importance_score: number // 0.0 - 1.0

created_at: string

}

```

  

### Summarization System

#### AI-Generated Summaries with Validation

The system uses session-aware model selection for summarization with **therapy-optimized validation**:

```typescript
// Enhanced prompts for different model types
const systemPrompt = isLocal
  ? `TASK: Create a brief summary of the conversation below. Focus ONLY on what was discussed, not generating new content.

FORMAT: 1-2 sentences describing the key topics and outcomes.
MENTAL HEALTH CONTEXT: This is a therapy/mental health discussion. Include emotional states, treatment topics, and family concerns when relevant.
EXAMPLE: "User discussed feeling overwhelmed with caregiving responsibilities for mother Aurora, mentioned medication side effects, and explored coping strategies."

DO NOT: Create new content. Only summarize what was already discussed.`
  : `You are a conversation summarizer for Luna mental health practice. Create a concise summary that preserves:
1. Key mental health topics discussed (mood, anxiety, depression, etc.)
2. Treatment-related information (medications, therapy, appointments)
3. Family and caregiving concerns
4. Important therapeutic insights or breakthroughs
5. Current emotional state and coping strategies

Focus on therapeutic relevance and maintain patient confidentiality. Keep under 300 words.`
```

**Model-Specific Optimization:**
- **Local models**: Stricter prompts, shorter token limits (100 tokens), lower temperature (0.1)
- **Cloud models**: More detailed prompts, longer limits (300 tokens), standard temperature

#### Summary Validation (Hallucination Prevention)

**Modified for Luna:** Allows therapeutic expressions while blocking generated content

```typescript
private isInvalidSummary(summary: string, originalMessages: MessageWithImportance[]): boolean {
  // ✅ ALLOWS: Therapeutic expressions, emotional content, narrative work
  // ❌ BLOCKS: Code blocks, formal story structure, fabricated content
  
  const invalidPatterns = [
    /^(Here's|Certainly|Let me|I'll create|I can)/i,  // AI response starters
    /```/,                                             // Code blocks
    /^Chapter|^Scene|^Act [IVX]+/i,                   // Formal story structure
  ]
  
  // Length validation: Max 500 chars (increased for therapy context)
  if (summary.length > 500) return true
  
  // Ratio validation: Summary shouldn't be >50% of conversation (relaxed for therapy)
  const summaryRatio = summary.length / conversationLength
  if (summaryRatio > 0.5) return true
  
  // Word overlap check: At least 5% overlap with original (allows paraphrasing)
  const matchRatio = matchingWords / summaryWords.length
  if (matchRatio < 0.05) return true
  
  return false // Valid summary
}
```

**Why Relaxed for Therapy:**
- Emotional language may not directly quote original
- Therapeutic paraphrasing is expected
- Narrative therapeutic work is valid
- Poetry/creative expression in therapy is allowed

  

#### Fallback System with Topic Extraction

When AI summarization fails, the system creates structured fallbacks with **therapy-specific topic extraction**:

```typescript
private extractTopics(messages: MessageWithImportance[]): string[] {
  // MENTAL HEALTH TOPICS (highest priority):
  
  // Emotional states: 'depression', 'anxiety', 'stress management', 'mood discussion'
  // Treatment: 'therapy', 'medication management', 'treatment planning'
  // Family/caregiving: 'mother care', 'father care', 'family caregiving'
  // Health: 'healthcare appointments', 'symptom tracking'
  // Wellness: 'coping strategies', 'sleep issues', 'wellness activities'
  // Crisis: 'crisis support' (urgent situations)
  
  // CREATIVE/EXPRESSIVE (important for therapy):
  // - 'creative expression' (poetry, journaling)
  // - 'narrative therapy' (storytelling)
  // - 'music therapy'
  
  // TECHNICAL TOPICS (lower priority):
  // - 'technical discussion', 'database work', 'API development', 'troubleshooting'
  
  return Array.from(topics).slice(0, 4) // Top 4 most relevant topics
}

// Example fallback summaries:
"Conversation with 8 messages (4 user, 4 assistant) about: anxiety, medication management, coping strategies, family caregiving."

"Conversation with 12 messages. Started with: 'Feeling overwhelmed today...' Recent topic: 'medication side effects...'"
```

**Therapy-First Design:**
- Prioritizes emotional/mental health topics
- Includes creative expression (poetry, narrative)
- Family/caregiving context tracked
- Crisis situations flagged
- Technical topics deprioritized

  

### Caching Strategy

  

#### Performance-Oriented Caching

```typescript

// Cache recent messages with session-specific keys

private recentMessagesCache = new Map<string, { messages, timestamp }>()

  

// Intelligent cache invalidation

public invalidateSessionCache(sessionId: string): void {

// Clear all cache entries for the session

for (const key of this.recentMessagesCache.keys()) {

if (key.startsWith(`${sessionId}:`)) {

this.recentMessagesCache.delete(key)

}

}

}

```

  

#### Cache TTL Optimization

- **30 seconds** cache TTL (longer than typical due to therapy session patterns)

- **Automatic cleanup** of expired entries

- **Session-specific invalidation** when new messages are added

  

### Smart Truncation

  

When context exceeds token limits, the system implements intelligent truncation:

  

```typescript

private truncateContext(messages, pins, summaries, maxTokens): MemoryContext {

// Priority hierarchy:

// 1. Recent messages (minimum 3 messages always preserved)

// 2. High-importance semantic pins

// 3. Recent summaries

// Token estimation: ~0.75 tokens per character

// Smart content preservation based on importance scores

}

```

  

## 🔄 Integration Flow

### Complete Context Flow with Query Routing

```typescript
// 1. User sends message to /api/agent
app.post('/api/agent', async (req, res) => {
  const { sessionId, personaId, message } = req.body

  // 2. Query type detection (smart routing)
  const queryType = detectQueryType(message) // 'MEDICATIONS', 'APPOINTMENTS', or 'GENERAL'
  
  // 3. Structured validation bypass for database queries
  if (queryType === 'APPOINTMENTS') {
    // Extract patient from query, pronoun reference, or session context
    const patientId = resolvePatientId(message, sessionId)
    
    // Get ground truth from database (no AI generation)
    const appointmentData = structuredAppointmentService.getAppointmentsStructured(patientId)
    const formattedResponse = structuredAppointmentService.formatAppointmentsAsText(appointmentData)
    
    // Return immediately - no AI hallucination possible
    return res.json({ reply: formattedResponse })
  }
  
  // 4. For GENERAL queries, build comprehensive context
  
  // 4a. Build conversation context BEFORE saving message (industry standard)
  const conversationHistory = await memoryManager.buildContext(sessionId, 3000)
  
  // 4b. Get patient data context (with journal and datasets)
  const patientContext = lunaContextService.generateContextualPrompt(
    adapter, message, sessionId
  )
  
  // 4c. Save user message with importance scoring
  const userMessage = {
    role: 'user',
    text: message,
    importance_score: memoryManager.scoreMessageImportance({ ...message })
  }
  const userMessageId = await saveMessage(sessionId, userMessage)

  // 5. Detect if explicit search intent (web search)
  const hasSearchIntent = hasExplicitSearchIntent(message)
  const tools = hasSearchIntent ? AVAILABLE_TOOLS : undefined

  // 6. Send to AI with full context
  const aiResponse = await runAgent({
    modelName,
    input: message,
    conversationHistory,        // Pre-built from memory
    systemPrompt: basePrompt + patientContext,  // Patient + datasets
    sessionId,
    personaId,
    tools                       // Web search if explicitly requested
  })

  // 7. Handle tool calls (web search)
  if (aiResponse.toolCalls) {
    // Execute web searches
    const searchResults = await executeToolCalls(aiResponse.toolCalls)
    
    // Re-generate response with search results
    aiResponse = await runAgent({
      modelName,
      input: message,
      systemPrompt: basePrompt + searchResults,
      sessionId
    })
  }

  // 8. Save AI response with importance scoring
  await saveMessage(sessionId, {
    role: 'assistant',
    text: aiResponse.reply,
    model_id: modelName,
    token_usage: aiResponse.tokenUsage,
    importance_score: memoryManager.scoreMessageImportance(aiResponse)
  })

  // 9. Update memory cache
  memoryManager.invalidateSessionCache(sessionId)

  // 10. Auto-summarize if threshold reached
  if (memoryManager.needsSummarization(sessionId)) {
    await memoryManager.autoSummarizeSession(sessionId)
  }
  
  // 11. Return response to user
  return res.json({ reply: aiResponse.reply })
})
```

### Query Type Detection Logic

```typescript
// QueryRouter analyzes user input to classify intent
export function detectQueryType(query: string): QueryType {
  const lowerQuery = query.toLowerCase()
  
  // Medication patterns
  const medicationPatterns = [
    /\b(medication|medicine|drug|prescription|rx|pill|tablet|dose|dosage)\b/i,
    /\b(taking|prescribed|pharmacy)\b/i,
  ]
  if (medicationPatterns.some(p => p.test(lowerQuery))) {
    return 'MEDICATIONS'
  }
  
  // Appointment patterns
  const appointmentPatterns = [
    /\b(appointment|doctor visit|checkup|schedule|upcoming)\b/i,
    /\b(see.*doctor|visit.*doctor)\b/i,
  ]
  if (appointmentPatterns.some(p => p.test(lowerQuery))) {
    return 'APPOINTMENTS'
  }
  
  // Default to general AI conversation
  return 'GENERAL'
}
```

### Patient Resolution Priority

```typescript
// 1. Pronoun detection + session context
if (containsPronounReference(query) && sessionId) {
  const session = db.prepare('SELECT patient_id FROM sessions WHERE id = ?').get(sessionId)
  if (session?.patient_id) return session.patient_id
}

// 2. Explicit patient name in query
const patientRef = extractPatientReference(query) // 'Kaleb', 'mom', 'mother'
if (patientRef) {
  const patient = lunaContextService.findPatientByReference(patientRef)
  if (patient) return patient.id
}

// 3. Session default patient (fallback)
const session = db.prepare('SELECT patient_id FROM sessions WHERE id = ?').get(sessionId)
return session?.patient_id || null
```

### Tool Integration (Web Search)

**Explicit Intent Detection:**
```typescript
function hasExplicitSearchIntent(input: string): boolean {
  const explicitTriggers = [
    'search online', 'search for', 'look up', 'find online',
    'what is the current', 'what is the latest', 'recent',
    'up-to-date', 'real-time', 'breaking news'
  ]
  
  return explicitTriggers.some(trigger => input.toLowerCase().includes(trigger))
}
```

**Tool Execution Flow:**
```typescript
// 1. AI recognizes need for tool (only if hasSearchIntent)
{
  "toolCalls": [{
    "name": "web_search",
    "arguments": {
      "query": "latest CBT research for anxiety 2025",
      "max_results": 5,
      "include_answer": true
    }
  }]
}

// 2. Execute tool via Tavily API
const searchResults = await searchWeb(query, options)

// 3. Add search results to context
const newSystemPrompt = `${basePrompt}\n\nCurrent search results:\n${searchResults}`

// 4. Re-generate response with search context (no tools to avoid recursion)
const finalResponse = await runAgent({ messages: newMessages, settings })
```

  

### Context Building Process

Luna's context pipeline combines multiple sources into a unified AI prompt:

1. **Memory Context**: Recent messages (10), summaries (2-3), semantic pins (3-5)
2. **Patient Context**: Demographics, medications, appointments, journal entries
3. **Knowledge Base**: Persona-linked datasets with document chunks (RAG)
4. **Session Context**: Model selection, patient focus tracking, persona settings
5. **Query Analysis**: Patient reference extraction, pronoun resolution, intent classification
6. **Smart Merging**: Combine contexts without duplication, respect token limits
7. **Token Management**: Intelligent truncation if needed (preserves priority content)

```typescript
// Final AI prompt structure:
{
  messages: [
    // System instructions
    { role: 'system', content: personaPrompt },
    
    // Patient data (medications, appointments, journal)
    { role: 'system', content: lunaContext },
    
    // Knowledge base documents (RAG)
    { role: 'system', content: datasetChunks },
    
    // Conversation history (summaries + pins)
    { role: 'system', content: 'Previous conversation context: [summaries]' },
    { role: 'system', content: 'Key information: [semantic pins]' },
    
    // Recent messages (natural conversation flow)
    { role: 'user', content: 'How are you feeling today?' },
    { role: 'assistant', content: 'I appreciate you asking...' },
    { role: 'user', content: 'I need help with medication' },
    { role: 'assistant', content: 'I can help with that...' },
    
    // Current user input
    { role: 'user', content: currentMessage }
  ]
}
```

**Token Budget Allocation:**
- System prompts (persona + instructions): ~500 tokens
- Patient data context: ~800 tokens
- Knowledge base (datasets): ~1000 tokens
- Conversation history (memory): ~500 tokens
- Recent messages: ~200 tokens
- **Total**: ~3000 tokens (configurable)

  

## 📊 Performance Characteristics

### Timing Benchmarks

| Operation | Cached | Cold | Notes |
|-----------|--------|------|-------|
| Context Building | 50-100ms | 200-500ms | With memory cache |
| Patient Context | 10-50ms | 50-100ms | Database queries |
| Memory Invalidation | 5-10ms | N/A | Cache clearing |
| Auto-summarization | 2-5s | 3-8s | AI generation |
| Dataset Retrieval | 50-100ms | 100-200ms | Per persona |
| Query Type Detection | <1ms | N/A | Regex patterns |
| Importance Scoring | <1ms | N/A | Algorithm-based |

### Memory Usage

| Component | Size | Notes |
|-----------|------|-------|
| Message Cache | ~1MB | Per 1000 cached messages |
| Context Objects | ~10KB | Per session context |
| Summary Storage | ~500B | Per conversation summary |
| Semantic Pins | ~200B | Per pin |
| Dataset Chunks | ~1KB | Per chunk (average) |

### Scalability Characteristics

**Cache Performance:**
- TTL: 30 seconds (therapy session optimized)
- Hit rate: ~80-90% during active conversations
- Memory overhead: <10MB for 100 active sessions

**Summarization:**
- Batch size: 8 messages (therapy optimized)
- Frequency: After every 8 new messages
- Processing time: 2-5 seconds per summary

**Token Management:**
- Default limit: 3000 tokens
- Truncation: Intelligent priority-based
- Minimum preserved: 3 most recent messages

**Session Isolation:**
- Each session maintains independent context
- No cross-session data leakage
- Patient tracking per session

### Database Schema (13 Tables Total)

**Mental Health Core (4 tables):**
- `patients` - Patient demographics
- `medications` - Prescription tracking
- `appointments` - Healthcare scheduling
- `journal_entries` - Mood/emotion journaling

**AI Conversation (3 tables):**
- `sessions` - Chat session management
- `messages` - Individual conversation messages
- `personas` - AI personality configurations

**Memory System (2 tables):**
- `conversation_summaries` - Compressed conversation history
- `semantic_pins` - Extracted important information

**Knowledge Base / RAG (3 tables):**
- `datasets` - Uploaded documents metadata
- `document_chunks` - Processed text chunks
- `persona_datasets` - Persona-dataset linking

**Supporting (1 table):**
- `models` - AI model registry

### Current Production State (November 23, 2025)

**Active Data:**
- Patients: 1 (Kaleb)
- Medications: 4 active prescriptions
- Appointments: Variable (0-N)
- Journal Entries: Growing (1+ entries)
- Personas: 2 default + custom personas
- Active Sessions: Ongoing conversations
- Messages: Accumulating conversation history
- Summaries: Generated after 8+ message batches
- Semantic Pins: Extracted as conversations grow
- Datasets: User-uploaded knowledge base documents

**System Health:**
- Memory system: Fully operational ✅
- Context building: Tested and validated ✅
- Summarization: AI-powered with fallbacks ✅
- Query routing: Pattern-based classification ✅
- RAG integration: Document processing active ✅
- Patient tracking: Session-aware ✅

  

## 🛠️ Configuration Options

### Environment Variables

```env
# Memory Management
MEMORY_CACHE_TTL=30000                 # Cache time-to-live in ms (30s for therapy)
MEMORY_SUMMARY_THRESHOLD=8             # Messages before auto-summarization
MEMORY_DEFAULT_TOKEN_LIMIT=3000        # Default context token limit
MEMORY_MAX_RECENT_MESSAGES=10          # Maximum recent messages in rolling buffer

# Context Service
CONTEXT_MAX_RECENT_DAYS=30             # Days for "recent" journal entries
CONTEXT_ENABLE_PATIENT_DETECTION=true  # Auto-detect patients in queries

# AI Models
OPENAI_API_KEY=sk-proj-xxx             # OpenAI API key for cloud models
ANTHROPIC_API_KEY=sk-ant-xxx           # Anthropic API key (optional)
TAVILY_API_KEY=tvly-dev-xxx            # Tavily search API key

# Dataset Processing
DATASET_CHUNK_SIZE=1000                # Characters per chunk
DATASET_CHUNK_OVERLAP=200              # Overlap between chunks
DATASET_MAX_FILE_SIZE=52428800         # 50MB max file size
```

### Model Configuration

```typescript
// Summarization model selection (session-aware)
private getSummarizationModel(sessionId: string): string {
  const sessionModel = this.getSessionModel(sessionId)
  
  if (sessionModel && this.isLocalModel(sessionModel)) {
    return sessionModel // Use local model for offline capability
  }
  
  return 'gpt-4.1-nano' // Luna's preferred cloud model
}

// Importance scoring weights (configurable)
const IMPORTANCE_WEIGHTS = {
  MENTAL_HEALTH: 0.25,    // Therapeutic content boost
  CRISIS: 0.30,           // Crisis content (highest priority)
  FAMILY: 0.15,           // Family/caregiving content
  TREATMENT: 0.20,        // Medication/appointment content
  TECHNICAL: 0.10,        // Technical content (lower in therapy)
  QUESTIONS: 0.20,        // Questions and inquiries
  LENGTH_BONUS: 0.10,     // Longer messages (200+ chars)
  ASSISTANT_BONUS: 0.05   // Assistant responses
}
```

### Persona Settings Normalization

```typescript
// Persona settings work for both local (Ollama) and cloud (OpenAI) adapters
function getPersonaSettings(personaId?: string): Record<string, unknown> {
  const persona = db.prepare('SELECT temperature, maxTokens, topP, repeatPenalty FROM personas WHERE id = ?').get(personaId)
  
  const settings: Record<string, unknown> = {}
  
  if (persona.temperature != null) settings.temperature = persona.temperature
  if (persona.maxTokens != null) settings.maxTokens = persona.maxTokens
  if (persona.topP != null) settings.topP = persona.topP
  
  // Normalize repeatPenalty for both adapters
  if (persona.repeatPenalty != null) {
    settings.repeatPenalty = persona.repeatPenalty    // Ollama
    settings.frequencyPenalty = persona.repeatPenalty // OpenAI
  }
  
  return settings
}
```

  

## 🚨 Error Handling & Fallbacks

  

### MemoryManager Fallbacks

```typescript

// When AI summarization fails

return this.createFallbackSummary(messages)

// → "Conversation with 8 messages about: anxiety, medication management, family caregiving"

  

// When context building fails

return {

recentMessages: this.getRecentMessages(sessionId, this.DEFAULT_CONTEXT_LIMIT),

semanticPins: [],

summaries: [],

totalTokens: 0,

}

  

// When cache corruption occurs

this.cleanupCache() // Automatic cleanup of expired entries

```

  

### LunaContextService Fallbacks

```typescript

// When patient data unavailable

if (context.patients.length === 0) {

return "" // No context injection

}

  

// When database queries fail

catch (error) {

console.error('Error fetching patients for context:', error)

return [] // Empty results, continue operation

}

  

// When patient not found

return null // Graceful degradation

```

  

### Network & Offline Handling

```typescript

// Detect network errors for offline scenarios

const isNetworkError = errorMessage.includes('ECONNREFUSED') ||

errorMessage.includes('ETIMEDOUT')

  

if (isNetworkError) {

return `📱 Offline summary: ${messageCount} messages. Recent: "${lastMessage}..."`

}

```

  

## 📝 Usage Examples

  

### Basic Context Retrieval

```typescript

import { LunaContextService } from './logic/lunaContextService'

import { MemoryManager } from './logic/memoryManager'

  

const contextService = new LunaContextService()

const memoryManager = new MemoryManager()

  

// Get patient context for AI

const patientContext = contextService.getLunaContext(adapter)

console.log(`Found ${patientContext.patients.length} patients`)

console.log(`Active medications: ${patientContext.medications.length}`)

  

// Get conversation context

const memoryContext = await memoryManager.buildContext(sessionId)

console.log(`Recent messages: ${memoryContext.recentMessages.length}`)

console.log(`Semantic pins: ${memoryContext.semanticPins.length}`)

```

  

### Smart Query Analysis

```typescript

// Automatic patient detection

const contextPrompt = contextService.generateContextualPrompt(

adapter,

"How is mom's anxiety doing with the new medication?", // References Aurora

sessionId

)

// Returns patient-focused context for Aurora's treatment

```

  

### Memory Management

```typescript

// Manual importance scoring

const importance = memoryManager.scoreMessageImportance({

role: 'user',

text: "I'm feeling really depressed and overwhelmed with caregiving",

// ... other properties

})

console.log(`Importance: ${importance}`) // → 0.9 (high therapeutic importance)

  

// Check if summarization needed

if (memoryManager.needsSummarization(sessionId)) {

const summary = await memoryManager.autoSummarizeSession(sessionId)

console.log('Created summary:', summary.summary)

}

```

  

### Semantic Pins

```typescript

// Create important information pins

const pin = memoryManager.createSemanticPin({

session_id: sessionId,

content: "Patient switched from Zyprexa 10mg to 5mg due to side effects",

source_message_id: messageId,

importance_score: 0.9,

pin_type: 'medication_change'

})

```

  

## 🔐 Security & Privacy

  

### Data Protection

- **Read-only operations**: AI cannot modify patient data

- **Session isolation**: Each session maintains independent context

- **Confidentiality instructions**: Every context includes privacy guidelines

- **No data hallucination**: Strict instructions against inventing patient details

  

### Access Control

- **Full context access**: All models receive comprehensive patient data (single-user practice)

- **Session-based focus**: Optional patient focus based on session context

- **Audit trails**: All context access logged for therapeutic review

  

### Privacy Guidelines

```typescript

// Embedded in every AI context

"## CRITICAL Instructions for AI Assistant

- **PATIENT CONFIDENTIALITY**: Treat all information as strictly confidential

- **ACCURATE REPORTING**: Use only the data shown above

- **NO HALLUCINATION**: Do not invent patient details not provided

- **PROFESSIONAL CONTEXT**: This is for mental health practice management"

```

  

## 🧪 Testing & Validation

  

### Unit Tests

- **Context building accuracy**

- **Memory cache invalidation**

- **Patient detection logic**

- **Importance scoring consistency**

- **Fallback behavior verification**

  

### Integration Tests

- **End-to-end conversation flow**

- **Multi-session context isolation**

- **Performance under load**

- **Error recovery scenarios**

  

### Performance Tests

- **Cache hit/miss ratios**

- **Context building latency**

- **Memory usage patterns**

- **Token estimation accuracy**

  

## 🔧 Troubleshooting

  

### Common Issues

  

#### Context Not Available

```bash

# Check database connectivity

node -e "const {db} = require('./db/db'); console.log(db.prepare('SELECT COUNT(*) FROM patients').get())"

  

# Verify patient data

GET /api/patients

```

  

#### Memory Cache Issues

```typescript

// Clear all caches

memoryManager.cleanupCache()

  

// Force cache invalidation

memoryManager.invalidateSessionCache(sessionId)

```

  

#### Summarization Failures

```typescript

// Check model availability

const adapter = getModelAdapter(modelName)

console.log('Model type:', adapter.type)

  

// Review fallback summaries

// Look for "Offline summary" or "Conversation with X messages" patterns

```

  

### Debug Logging

```typescript

// Enable memory manager debug logging

console.log(`[Debug] Cache check for ${sessionId}:`, {

hasCached: !!cached,

cacheAge: now - cached.timestamp,

foundMessages: messages.length

})

```

  

### Performance Monitoring

```typescript

// Monitor context building performance

const startTime = Date.now()

const context = await memoryManager.buildContext(sessionId)

const duration = Date.now() - startTime

console.log(`Context built in ${duration}ms`)

```

  

## 📚 Related Documentation

### Database Documentation
- **[Database Schema](../db/01-DATABASE-SCHEMA.md)** - Complete schema with 13 tables (patients, medications, appointments, journal_entries, sessions, messages, personas, conversation_summaries, semantic_pins, datasets, document_chunks, persona_datasets, models)
- **[Database Architecture](../db/02-DATABASE-ARCHITECTURE.md)** - Performance optimizations, indexes, foreign keys, WAL mode

### API Documentation
- **[Agent Service](./agent-service.md)** - AI model integration and conversation orchestration
- **[Model Registry](./model-registry.md)** - Multi-provider AI model management (OpenAI, Anthropic, Ollama)

### Backend Services
- **Query Router** (`/backend/logic/queryRouter.ts`) - Query classification and patient resolution
- **Structured Services** (`/backend/logic/structured*Service.ts`) - Validated database queries
- **Document Processor** (`/backend/logic/documentProcessor.ts`) - PDF/DOCX processing pipeline
- **Chunking Service** (`/backend/logic/chunkingService.ts`) - Intelligent text segmentation
- **Embedding Service** (`/backend/logic/embeddingService.ts`) - Vector embedding generation (planned)
- **Tavily Service** (`/backend/logic/tavilyService.ts`) - Web search integration
- **Tools** (`/backend/logic/tools.ts`) - Function calling tools for AI agents

### API Routes
- **Agent Router** (`/backend/routes/agentRouter.ts`) - `/api/agent` - Chat completions
- **Memory Router** (`/backend/routes/memoryRouter.ts`) - `/api/memory` - Context, summaries, pins
- **Session Router** (`/backend/routes/sessionRouter.ts`) - `/api/sessions` - Session management
- **Datasets Router** (`/backend/routes/datasetsRouter.ts`) - `/api/datasets` - Document upload/management
- **Journal Router** (`/backend/routes/journalRouter.ts`) - `/api/journal` - Journal entries
- **Patients Router** (`/backend/routes/patientsRouter.ts`) - `/api/patients` - Patient profiles
- **Medications Router** (`/backend/routes/medicationsRouter.ts`) - `/api/medications` - Medication tracking
- **Personas Router** (`/backend/routes/personasRouter.ts`) - `/api/personas` - Persona CRUD

### Type Definitions
- **Memory Types** (`/backend/types/memory.ts`) - ConversationSummary, SemanticPin, MessageWithImportance, MemoryContext
- **Agent Types** (`/backend/types/agent.ts`) - AgentRequest, AgentResponse
- **Persona Types** (`/backend/types/personas.ts`) - Persona interface with therapeutic fields
- **Session Types** (`/backend/types/sessions.ts`) - Session management types
- **Search Types** (`/backend/types/search.ts`) - Tavily search options

---

**Documentation Status**: ✅ Complete and Up-to-Date  
**Last Major Update**: November 23, 2025  
**Next Review**: December 2025  
**Maintainer**: Luna Development Team  
**Version**: 2.0