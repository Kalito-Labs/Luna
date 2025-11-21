# 🚀 Luna Persona Enhancement & RAG System - Onboarding Guide

**Project:** Luna Mental Health Companion Platform  
**Feature:** Advanced Persona System with RAG (Retrieval-Augmented Generation)  
**Timeline:** 8-week implementation roadmap  
**Status:** Planning phase - ready for implementation  

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current System State](#current-system-state)
3. [Target Architecture](#target-architecture)
4. [Database Schema Changes](#database-schema-changes)
5. [API Specifications](#api-specifications)
6. [UI/UX Design System](#uiux-design-system)
7. [RAG Pipeline Architecture](#rag-pipeline-architecture)
8. [Implementation Phases](#implementation-phases)
9. [Testing Strategy](#testing-strategy)
10. [Success Metrics](#success-metrics)

---

## 🎯 Executive Summary

### What We're Building

Luna is evolving from a basic AI companion to a sophisticated **therapeutic persona system** with **RAG-powered contextual intelligence**. Users will be able to:

1. **Create Custom Therapeutic Personas** - Specialized AI companions (CBT therapist, DBT coach, mindfulness guide)
2. **Upload Therapeutic Documents** - PDFs, worksheets, therapy handouts that personas can reference
3. **Receive Contextual Responses** - AI responses grounded in user's actual therapeutic materials
4. **Template System** - Pre-built therapeutic persona templates for immediate use
5. **Multi-Persona Management** - Switch between different therapeutic approaches seamlessly

### Why This Matters

**Current Problem:**
- Generic AI responses without therapeutic grounding
- No personalization to user's specific therapeutic approach
- Users receive advice not aligned with their therapist's materials

**Solution:**
- **RAG Technology**: Personas reference user's actual therapy documents
- **Therapeutic Specialization**: Personas trained on specific therapeutic modalities
- **Context-Aware**: Responses cite specific worksheets, techniques from user's materials

### Technical Stack

- **Frontend**: Vue.js 3 + TypeScript + Capacitor (mobile)
- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite with FTS5 (full-text search)
- **AI/ML**: 
  - Ollama (local LLM inference)
  - OpenAI API (optional cloud processing)
  - Local embedding generation (privacy-first)
  - Vector similarity search
- **Design**: Violet theme (#8B5CF6), glass morphism, responsive grid layouts

---

## 📊 Current System State

### Existing Features

**Database** (`/backend/db/db.ts`):
- ✅ `personas` table (basic fields: id, name, description, icon, color, prompt)
- ✅ `messages` table (chat history)
- ✅ `sessions` table (conversation tracking)
- ✅ `journal_entries` table (user journal data)
- ✅ `mood_tracking` table (mental health tracking)

**Backend Services** (`/backend/logic/`):
- ✅ `agentService.ts` - LLM integration (Ollama/OpenAI)
- ✅ `modelRegistry.ts` - Model management
- ✅ `queryRouter.ts` - Request routing
- ✅ `memoryManager.ts` - Conversation context

**Frontend** (`/frontend/src/`):
- ✅ Persona selection interface
- ✅ Chat interface with message history
- ✅ Journal entry system with mental health tracking
- ✅ Basic persona CRUD operations

### Current Limitations

❌ **No persona specialization** - All personas are generic
❌ **No document upload** - Can't add therapeutic materials
❌ **No context retrieval** - Responses not grounded in user documents
❌ **No templates** - Users must create from scratch
❌ **Limited metadata** - No specialty, therapeutic focus, tags
❌ **No RAG pipeline** - No document processing or vector search

---

## 🏗️ Target Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        User Interface                        │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Persona   │  │   Document   │  │   Chat with      │  │
│  │   Manager   │  │   Upload     │  │   Source Links   │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Backend Services                        │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Persona   │  │  Document    │  │   RAG-Enhanced   │  │
│  │   Service   │  │  Processor   │  │   Agent Service  │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Storage Layer                           │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Personas   │  │   Datasets   │  │  Vector Index    │  │
│  │  Templates  │  │   Chunks     │  │  (Embeddings)    │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

**1. Enhanced Persona System**
- Therapeutic specialization (CBT, DBT, Mindfulness, etc.)
- Template-based creation
- Custom LLM settings per persona
- Data access controls (journal, mood, appointments)

**2. Document Processing Pipeline**
- File upload (PDF, DOCX, TXT, MD)
- Text extraction
- Intelligent chunking (therapeutic-aware)
- Embedding generation (local/cloud)
- Vector storage

**3. RAG-Enhanced Chat**
- Query embedding
- Vector similarity search
- Context retrieval from documents
- Source attribution in responses
- Therapeutic relevance reranking

---

## 🗄️ Database Schema Changes

### New Tables

#### `persona_templates`
Pre-built persona configurations for common therapeutic approaches.

```sql
CREATE TABLE persona_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT '🤖',
    color_theme TEXT DEFAULT '#6366f1',
    specialty TEXT NOT NULL,
    therapeutic_focus TEXT,
    category TEXT DEFAULT 'general',
    prompt TEXT NOT NULL,
    temperature REAL DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 1000,
    top_p REAL DEFAULT 0.9,
    repeat_penalty REAL DEFAULT 1.0,
    tags TEXT, -- JSON array
    best_for TEXT, -- Description of ideal use cases
    example_datasets TEXT, -- JSON array of recommended document types
    is_system BOOLEAN DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

**System Templates** (pre-populated):
- 🧠 CBT Therapeutic Assistant
- 💜 DBT Skills Coach
- 🧘 Mindfulness & Meditation Guide
- 🌱 Trauma-Informed Support Companion
- ❤️ General Mental Health Companion

#### `personas` (enhanced)
Extended with 20+ new fields for specialization.

```sql
-- New columns added to existing personas table
ALTER TABLE personas ADD COLUMN specialty TEXT;
ALTER TABLE personas ADD COLUMN therapeutic_focus TEXT;
ALTER TABLE personas ADD COLUMN category TEXT DEFAULT 'general';
ALTER TABLE personas ADD COLUMN template_id TEXT REFERENCES persona_templates(id);
ALTER TABLE personas ADD COLUMN tags TEXT; -- JSON array
ALTER TABLE personas ADD COLUMN is_favorite BOOLEAN DEFAULT 0;
ALTER TABLE personas ADD COLUMN color_theme TEXT DEFAULT '#6366f1';
ALTER TABLE personas ADD COLUMN temperature REAL DEFAULT 0.7;
ALTER TABLE personas ADD COLUMN max_tokens INTEGER DEFAULT 1000;
ALTER TABLE personas ADD COLUMN top_p REAL DEFAULT 0.9;
ALTER TABLE personas ADD COLUMN repeat_penalty REAL DEFAULT 1.0;
ALTER TABLE personas ADD COLUMN builtin_data_access TEXT; -- JSON object
ALTER TABLE personas ADD COLUMN usage_count INTEGER DEFAULT 0;
ALTER TABLE personas ADD COLUMN last_used_at TEXT;
ALTER TABLE personas ADD COLUMN response_quality_rating REAL;
```

**builtin_data_access JSON structure:**
```json
{
  "journal_entries": true,
  "mood_data": false,
  "appointments": false,
  "user_profile": true
}
```

#### `datasets`
Uploaded therapeutic documents associated with personas.

```sql
CREATE TABLE datasets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL, -- pdf, docx, txt, md
    file_size INTEGER NOT NULL,
    file_path TEXT NOT NULL, -- Local storage path
    therapeutic_category TEXT, -- CBT, DBT, mindfulness, etc.
    processing_mode TEXT DEFAULT 'local', -- local or cloud
    processing_status TEXT DEFAULT 'pending', -- pending, processing, completed, error
    chunk_count INTEGER DEFAULT 0,
    embedding_model TEXT, -- e.g., 'all-minilm-l6-v2'
    created_by_user BOOLEAN DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    processed_at TEXT,
    error_message TEXT,
    metadata TEXT -- JSON: page_count, author, source, etc.
);
```

#### `document_chunks`
Text chunks with embeddings for vector search.

```sql
CREATE TABLE document_chunks (
    id TEXT PRIMARY KEY,
    dataset_id TEXT NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL, -- The actual text content
    embedding BLOB, -- Serialized float32 array
    embedding_dim INTEGER DEFAULT 384,
    chunk_type TEXT DEFAULT 'body', -- header, body, footer, instruction, example
    section_title TEXT, -- Section/chapter heading
    page_number INTEGER,
    char_start INTEGER,
    char_end INTEGER,
    token_count INTEGER,
    therapeutic_tags TEXT, -- JSON array: cognitive_distortion, coping_skill, etc.
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast retrieval
CREATE INDEX idx_chunks_dataset ON document_chunks(dataset_id);
CREATE INDEX idx_chunks_type ON document_chunks(chunk_type);

-- Full-text search index
CREATE VIRTUAL TABLE document_chunks_fts USING fts5(
    content,
    section_title,
    therapeutic_tags,
    content='document_chunks',
    content_rowid='id'
);
```

#### `persona_datasets`
Many-to-many relationship: which documents each persona can access.

```sql
CREATE TABLE persona_datasets (
    id TEXT PRIMARY KEY,
    persona_id TEXT NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
    dataset_id TEXT NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT 1,
    weight REAL DEFAULT 1.0, -- Importance weight for this dataset (0.1 - 2.0)
    access_level TEXT DEFAULT 'full', -- full, summary, reference_only
    last_used_at TEXT,
    usage_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(persona_id, dataset_id)
);

CREATE INDEX idx_persona_datasets_persona ON persona_datasets(persona_id);
CREATE INDEX idx_persona_datasets_enabled ON persona_datasets(enabled);
```

---

## 🔌 API Specifications

### Persona Management APIs

#### `GET /api/personas`
List all user personas with enhanced metadata.

**Response:**
```typescript
interface PersonaListResponse {
  personas: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    color_theme: string;
    specialty: string;
    therapeutic_focus: string;
    category: string;
    is_favorite: boolean;
    usage_count: number;
    last_used_at: string;
    dataset_count: number;
    template_based: boolean;
  }>;
  total: number;
}
```

#### `POST /api/personas`
Create new persona (from scratch or template).

**Request:**
```typescript
interface CreatePersonaRequest {
  name: string;
  description?: string;
  icon?: string;
  color_theme?: string;
  specialty: string;
  therapeutic_focus?: string;
  category?: string;
  template_id?: string; // If creating from template
  prompt: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  builtin_data_access?: {
    journal_entries: boolean;
    mood_data: boolean;
    appointments: boolean;
    user_profile: boolean;
  };
  enabled_datasets?: string[]; // Dataset IDs to link
}
```

**Response:**
```typescript
interface CreatePersonaResponse {
  persona: EnhancedPersona;
  created_from_template: boolean;
  template_info?: {
    id: string;
    name: string;
  };
}
```

#### `GET /api/templates`
Get all available persona templates.

**Response:**
```typescript
interface TemplateListResponse {
  templates: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    color_theme: string;
    specialty: string;
    category: string;
    tags: string[];
    best_for: string;
    example_datasets: string[];
    usage_count: number; // How many personas created from this
  }>;
  categories: string[]; // Unique categories
  specialties: string[]; // Unique specialties
}
```

### Document Processing APIs

#### `POST /api/datasets/upload`
Upload therapeutic document for processing.

**Request (FormData):**
```typescript
interface DocumentUploadRequest {
  file: File;
  persona_id?: string; // Optional: link to specific persona
  processing_mode: 'local' | 'cloud';
  name?: string;
  description?: string;
  therapeutic_category?: string;
  chunk_settings?: {
    chunk_size?: number; // Tokens per chunk (default: 512)
    overlap?: number; // Token overlap (default: 50)
    strategy?: 'semantic' | 'fixed' | 'therapeutic_aware';
  };
}
```

**Response:**
```typescript
interface DocumentUploadResponse {
  dataset_id: string;
  upload_status: 'uploaded' | 'processing' | 'completed' | 'error';
  processing_job_id?: string;
  estimated_completion_time?: number; // seconds
  file_info: {
    name: string;
    size: number;
    type: string;
    page_count?: number;
  };
}
```

#### `GET /api/datasets/:id/status`
Check document processing status.

**Response:**
```typescript
interface ProcessingStatusResponse {
  dataset_id: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: {
    current_step: 'extracting' | 'chunking' | 'embedding' | 'storing';
    percentage: number; // 0-100
    estimated_remaining_time?: number;
  };
  results?: {
    chunk_count: number;
    processing_time_ms: number;
    embedding_model: string;
    content_summary?: string;
  };
  error?: {
    message: string;
    code: string;
    retry_possible: boolean;
  };
}
```

#### `GET /api/personas/:id/datasets`
Get all datasets associated with a persona.

**Response:**
```typescript
interface PersonaDatasetResponse {
  persona: EnhancedPersona;
  datasets: Array<{
    dataset: Dataset;
    enabled: boolean;
    weight: number;
    access_level: 'full' | 'summary' | 'reference_only';
    last_used?: string;
    usage_count: number;
    chunk_count: number;
  }>;
  builtin_data_access: {
    journal_entries: boolean;
    mood_data: boolean;
    appointments: boolean;
    user_profile: boolean;
  };
  summary: {
    total_datasets: number;
    enabled_datasets: number;
    total_chunks: number;
    storage_used_mb: number;
  };
}
```

### RAG-Enhanced Chat API

#### `POST /api/chat` (enhanced)
Send message to persona with RAG context retrieval.

**Request:**
```typescript
interface ChatRequest {
  persona_id: string;
  message: string;
  session_id?: string;
  context_settings?: {
    use_rag: boolean; // Enable document retrieval
    max_chunks: number; // Max chunks to retrieve (default: 5)
    similarity_threshold: number; // Min similarity (default: 0.7)
    include_sources: boolean; // Return source citations
  };
}
```

**Response:**
```typescript
interface ChatResponse {
  message_id: string;
  content: string;
  sources?: Array<{
    dataset_id: string;
    dataset_name: string;
    chunk_id: string;
    source_file: string;
    page_reference?: number;
    section_title?: string;
    relevance_score: number;
    excerpt: string; // Short excerpt from chunk
  }>;
  context_used: boolean;
  model_used: string;
  processing_time_ms: number;
}
```

---

## 🎨 UI/UX Design System

### Color Palette

**Primary Violet Theme:**
- Primary: `#8B5CF6` (violet-500)
- Light: `#C4B5FD` (violet-300)
- Dark: `#6D28D9` (violet-700)
- Background Light: `rgba(139, 92, 246, 0.1)`

**Therapeutic Specialty Colors:**
- CBT (Cognitive): `#3B82F6` (blue-500)
- DBT (Balance): `#A855F7` (purple-500)
- Mindfulness: `#10B981` (green-500)
- Trauma Care: `#EC4899` (pink-500)
- General: `#6366F1` (indigo-500)

**UI States:**
- Success: `#10B981` (green-500)
- Warning: `#F59E0B` (amber-500)
- Error: `#EF4444` (red-500)
- Info: `#3B82F6` (blue-500)

### Key Components

#### 1. Enhanced Persona Cards
**Location:** `PersonasView.vue`

**Features:**
- Large avatar with emoji icon + themed background
- Specialty badge (color-coded by therapeutic approach)
- Favorite star indicator
- Usage statistics (conversation count, last used)
- Dataset count badge
- Quick actions: Chat, Edit, Duplicate, Delete

**Grid Layout:**
```scss
.personas-grid-enhanced {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}
```

#### 2. Persona Creation Wizard
**Location:** New component `PersonaWizard.vue`

**Steps:**
1. **Choose Starting Point**
   - Start from template
   - Create from scratch
2. **Configure Basics**
   - Name, icon, color theme
   - Specialty selection
   - Description
3. **Customize Prompt**
   - System prompt editor
   - Therapeutic guidelines
   - Example interactions
4. **AI Settings**
   - Temperature slider (0.1 - 2.0)
   - Max tokens (100 - 4000)
   - Top-p, repeat penalty
5. **Data Access**
   - Toggle Luna data (journal, mood, appointments)
   - Link existing documents
   - Upload new documents

#### 3. Template Gallery
**Location:** New view `TemplateGallery.vue`

**Features:**
- Filterable by specialty/category
- Template cards with:
  - Large specialty icon
  - Description
  - Key features list
  - "Best for" section
  - Tags (e.g., "beginner-friendly", "advanced")
  - Preview button
  - Use template button

#### 4. Document Upload Interface
**Location:** New component `DocumentUpload.vue`

**Features:**
- Drag & drop zone (2px dashed border, hover effects)
- File type badges (PDF, DOCX, TXT, MD)
- Processing mode toggle:
  - 🔒 Privacy Mode (local processing)
  - ☁️ Cloud Mode (OpenAI embeddings)
- Real-time progress tracking:
  - Extracting text... (30%)
  - Breaking into chunks... (60%)
  - Generating embeddings... (80%)
  - Ready to use! (100%)
- Error handling with retry option

#### 5. Dataset Manager
**Location:** New tab in `PersonaEdit.vue`

**Features:**
- List of linked documents
- Enable/disable toggles per document
- Weight slider (0.1 - 2.0) for relevance tuning
- Access level dropdown (Full, Summary, Reference Only)
- Preview button (shows chunks and content)
- Usage statistics (times referenced, last used)
- Delete with confirmation

#### 6. Enhanced Chat Interface
**Location:** `ChatView.vue` (enhanced)

**New Features:**
- **Source Citations:** 
  - Collapsible "Sources" section below AI responses
  - Each source shows: document name, page, relevance score
  - Click to view full chunk content
- **Context Indicator:**
  - Badge showing "3 documents referenced" when RAG used
  - Toggle to disable RAG for this conversation
- **Therapeutic Tags:**
  - When persona references specific techniques (e.g., "Cognitive Restructuring from CBT Worksheet")
  - Visual tags/badges for therapeutic concepts

### Responsive Breakpoints

```scss
$breakpoint-mobile: 640px;
$breakpoint-tablet: 768px;
$breakpoint-desktop: 1024px;

@media (max-width: $breakpoint-mobile) {
  // Stack grids vertically
  // Larger touch targets
  // Simplified navigation
}
```

---

## 🤖 RAG Pipeline Architecture

### Overview

**RAG (Retrieval-Augmented Generation)** enhances AI responses by retrieving relevant context from user documents before generating responses.

**Flow:**
```
User Message
    ↓
Query Embedding (convert to vector)
    ↓
Vector Similarity Search (find relevant chunks)
    ↓
Therapeutic Reranking (prioritize by relevance)
    ↓
Build Enhanced Prompt (inject retrieved context)
    ↓
LLM Generation (with document context)
    ↓
Response + Source Citations
```

### Document Processing Pipeline

#### Step 1: Text Extraction
**Input:** PDF, DOCX, TXT, MD files  
**Output:** Plain text content

**Implementation:**
```typescript
class DocumentExtractor {
  async extractText(file: File): Promise<ExtractedDocument> {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return await this.extractPDF(file);
      case 'docx':
        return await this.extractDOCX(file);
      case 'txt':
      case 'md':
        return await this.extractPlainText(file);
      default:
        throw new Error('Unsupported file type');
    }
  }
  
  private async extractPDF(file: File): Promise<ExtractedDocument> {
    // Use pdf-parse or similar library
    const buffer = await file.arrayBuffer();
    const pdfData = await pdfParse(buffer);
    
    return {
      text: pdfData.text,
      metadata: {
        pages: pdfData.numpages,
        author: pdfData.info?.Author,
        title: pdfData.info?.Title
      }
    };
  }
}
```

#### Step 2: Intelligent Chunking
**Goal:** Split document into semantically meaningful chunks

**Strategies:**
1. **Fixed-Size Chunking** - Simple 512 token chunks with 50 token overlap
2. **Semantic Chunking** - Split on paragraphs, maintain context
3. **Therapeutic-Aware Chunking** - Preserve instruction sections, worksheets, examples

**Implementation:**
```typescript
interface ChunkingOptions {
  chunk_size: number; // Tokens per chunk
  overlap: number; // Overlap tokens
  strategy: 'fixed' | 'semantic' | 'therapeutic_aware';
}

class DocumentChunker {
  async chunk(text: string, options: ChunkingOptions): Promise<DocumentChunk[]> {
    if (options.strategy === 'therapeutic_aware') {
      return this.therapeuticAwareChunking(text, options);
    }
    
    // Simple fixed-size chunking
    const tokens = this.tokenize(text);
    const chunks: DocumentChunk[] = [];
    
    for (let i = 0; i < tokens.length; i += options.chunk_size - options.overlap) {
      const chunkTokens = tokens.slice(i, i + options.chunk_size);
      chunks.push({
        index: chunks.length,
        content: this.detokenize(chunkTokens),
        token_count: chunkTokens.length,
        char_start: this.getCharPosition(tokens, i),
        char_end: this.getCharPosition(tokens, i + chunkTokens.length)
      });
    }
    
    return chunks;
  }
  
  private async therapeuticAwareChunking(
    text: string,
    options: ChunkingOptions
  ): Promise<DocumentChunk[]> {
    // Analyze document structure
    const structure = this.analyzeDocumentStructure(text);
    
    // Preserve:
    // - Instruction sections intact
    // - Examples with their context
    // - Worksheets/exercises complete
    // - Section headers with content
    
    return this.createSemanticChunks(text, structure, {
      preserve_instructions: true,
      group_examples: true,
      maintain_exercises: true,
      respect_sections: true
    });
  }
}
```

#### Step 3: Embedding Generation
**Goal:** Convert text chunks to vector embeddings

**Models:**
- **Local (Privacy Mode):** `all-MiniLM-L6-v2` (384 dimensions)
- **Cloud:** OpenAI `text-embedding-3-small` (1536 dimensions)

**Implementation:**
```typescript
class EmbeddingService {
  async generateEmbedding(
    text: string,
    mode: 'local' | 'cloud'
  ): Promise<Float32Array> {
    if (mode === 'local') {
      return this.generateLocalEmbedding(text);
    } else {
      return this.generateCloudEmbedding(text);
    }
  }
  
  private async generateLocalEmbedding(text: string): Promise<Float32Array> {
    // Use @xenova/transformers for browser/Node.js
    const { pipeline } = await import('@xenova/transformers');
    const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    
    const output = await extractor(text, { pooling: 'mean', normalize: true });
    return new Float32Array(output.data);
  }
  
  private async generateCloudEmbedding(text: string): Promise<Float32Array> {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text
      })
    });
    
    const data = await response.json();
    return new Float32Array(data.data[0].embedding);
  }
}
```

#### Step 4: Vector Storage
**Goal:** Store embeddings for fast similarity search

**Implementation:**
```typescript
class VectorStore {
  async storeChunk(chunk: ProcessedChunk): Promise<void> {
    // Serialize embedding to BLOB
    const embeddingBlob = Buffer.from(chunk.embedding.buffer);
    
    await db.prepare(`
      INSERT INTO document_chunks (
        id, dataset_id, chunk_index, content, embedding,
        embedding_dim, section_title, page_number, token_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      chunk.id,
      chunk.dataset_id,
      chunk.index,
      chunk.content,
      embeddingBlob,
      chunk.embedding.length,
      chunk.section_title,
      chunk.page_number,
      chunk.token_count
    );
  }
}
```

### Context Retrieval

#### Vector Similarity Search

**Goal:** Find most relevant chunks for user query

**Implementation:**
```typescript
class VectorSearchService {
  async search(
    queryEmbedding: Float32Array,
    datasetIds: string[],
    options: SearchOptions
  ): Promise<SearchResult[]> {
    // Get all chunks from enabled datasets
    const chunks = await db.prepare(`
      SELECT id, dataset_id, content, embedding, section_title, page_number
      FROM document_chunks
      WHERE dataset_id IN (${datasetIds.map(() => '?').join(',')})
    `).all(...datasetIds);
    
    // Calculate cosine similarity for each chunk
    const results = chunks.map(chunk => {
      const chunkEmbedding = new Float32Array(chunk.embedding);
      const similarity = this.cosineSimilarity(queryEmbedding, chunkEmbedding);
      
      return {
        chunk_id: chunk.id,
        dataset_id: chunk.dataset_id,
        content: chunk.content,
        section_title: chunk.section_title,
        page_number: chunk.page_number,
        similarity_score: similarity
      };
    });
    
    // Filter by threshold and sort by similarity
    return results
      .filter(r => r.similarity_score >= options.threshold)
      .sort((a, b) => b.similarity_score - a.similarity_score)
      .slice(0, options.top_k);
  }
  
  private cosineSimilarity(a: Float32Array, b: Float32Array): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
```

#### Therapeutic Reranking

**Goal:** Prioritize chunks by therapeutic relevance

**Implementation:**
```typescript
class TherapeuticReranker {
  async rerank(
    candidates: SearchResult[],
    context: RerankContext
  ): Promise<SearchResult[]> {
    // Score adjustments based on:
    // 1. Persona specialty alignment
    // 2. Query intent (learning, coping, processing)
    // 3. Therapeutic tags matching
    // 4. Recent usage patterns
    
    return candidates.map(candidate => {
      let adjustedScore = candidate.similarity_score;
      
      // Boost if specialty matches
      if (this.matchesSpecialty(candidate, context.persona_specialty)) {
        adjustedScore *= 1.2;
      }
      
      // Boost if therapeutic tags align
      const tagMatch = this.calculateTagMatch(candidate, context.query_intent);
      adjustedScore *= (1 + tagMatch * 0.3);
      
      // Boost recently used chunks (recency bias)
      if (candidate.last_used_within_hours < 24) {
        adjustedScore *= 1.1;
      }
      
      return {
        ...candidate,
        final_score: adjustedScore
      };
    }).sort((a, b) => b.final_score - a.final_score);
  }
}
```

### Prompt Enhancement

**Goal:** Inject retrieved context into LLM prompt

**Implementation:**
```typescript
class PromptBuilder {
  buildEnhancedPrompt(
    basePrompt: string,
    userMessage: string,
    retrievedChunks: RetrievedChunk[],
    conversationHistory: Message[]
  ): string {
    const contextSection = this.formatRetrievedContext(retrievedChunks);
    
    return `${basePrompt}

RELEVANT THERAPEUTIC MATERIALS:
${contextSection}

CONVERSATION HISTORY:
${this.formatHistory(conversationHistory)}

USER MESSAGE:
${userMessage}

Please provide a thoughtful response that:
1. References the therapeutic materials when relevant
2. Cites specific techniques or concepts from the documents
3. Maintains therapeutic boundaries
4. Is personalized to the user's context`;
  }
  
  private formatRetrievedContext(chunks: RetrievedChunk[]): string {
    return chunks.map((chunk, i) => 
      `[Source ${i + 1}: ${chunk.dataset_name}, page ${chunk.page_number}]
${chunk.content}
---`
    ).join('\n\n');
  }
}
```

---

## 📅 Implementation Phases

### Phase 1: Database & Templates (Weeks 1-2)

**Goals:**
- ✅ Create new database tables
- ✅ Write migration scripts
- ✅ Seed system templates
- ✅ Update existing services

**Tasks:**

**Week 1: Database Schema**
1. Create migration script for new tables
2. Add new columns to personas table
3. Create indexes for performance
4. Write data validation logic
5. Test with sample data

**Week 2: Template System**
1. Create PersonaTemplate interface
2. Implement template seeding script
3. Build template CRUD APIs
4. Add template usage tracking
5. Create 5 system templates (CBT, DBT, Mindfulness, Trauma, General)

**Deliverables:**
- `/backend/db/migrations/002-persona-rag-schema.sql`
- `/backend/logic/templateService.ts`
- `/backend/routes/templatesRouter.ts`
- `/backend/scripts/seed-templates.ts`

### Phase 2: Document Processing (Weeks 3-4)

**Goals:**
- ✅ File upload and storage
- ✅ Text extraction from PDFs/DOCX
- ✅ Chunking algorithms
- ✅ Embedding generation

**Tasks:**

**Week 3: File Upload & Extraction**
1. Implement file upload API (`POST /api/datasets/upload`)
2. Add file validation (size, type)
3. Create storage service (local filesystem)
4. Implement PDF extraction (pdf-parse)
5. Implement DOCX extraction (mammoth)
6. Add progress tracking

**Week 4: Chunking & Embeddings**
1. Build chunking service with multiple strategies
2. Implement therapeutic-aware chunking
3. Integrate local embedding model (@xenova/transformers)
4. Add cloud embedding option (OpenAI)
5. Create vector storage service
6. Add processing queue system

**Deliverables:**
- `/backend/logic/documentProcessor.ts`
- `/backend/logic/embeddingService.ts`
- `/backend/logic/chunkingService.ts`
- `/backend/routes/datasetsRouter.ts`

### Phase 3: UI Components (Weeks 5-6)

**Goals:**
- ✅ Enhanced persona management UI
- ✅ Template gallery
- ✅ Document upload interface
- ✅ Dataset manager

**Tasks:**

**Week 5: Persona UI Enhancement**
1. Update PersonasView.vue with enhanced cards
2. Create PersonaWizard.vue component
3. Build TemplateGallery.vue
4. Add specialty filtering
5. Implement favorite toggling
6. Add usage statistics display

**Week 6: Document Management UI**
1. Create DocumentUpload.vue component
2. Build drag & drop functionality
3. Add progress tracking UI
4. Create DatasetManager.vue component
5. Add dataset preview modal
6. Implement enable/disable toggles

**Deliverables:**
- `/frontend/src/views/PersonasView.vue` (enhanced)
- `/frontend/src/components/PersonaWizard.vue`
- `/frontend/src/components/TemplateGallery.vue`
- `/frontend/src/components/DocumentUpload.vue`
- `/frontend/src/components/DatasetManager.vue`

### Phase 4: RAG Integration (Weeks 7-8)

**Goals:**
- ✅ Vector search implementation
- ✅ Context retrieval in chat
- ✅ Source attribution UI
- ✅ End-to-end testing

**Tasks:**

**Week 7: RAG Backend**
1. Implement vector search service
2. Add therapeutic reranking
3. Create RAG-enhanced agent service
4. Build prompt enhancement logic
5. Add context usage tracking
6. Implement source attribution

**Week 8: Chat Integration & Testing**
1. Update ChatView.vue with source citations
2. Add context toggle in chat
3. Build source preview modal
4. Comprehensive integration testing
5. Performance optimization
6. User acceptance testing

**Deliverables:**
- `/backend/logic/vectorSearchService.ts`
- `/backend/logic/ragAgentService.ts`
- `/frontend/src/views/ChatView.vue` (enhanced)
- `/frontend/src/components/SourceCitation.vue`
- Full test suite

---

## 🧪 Testing Strategy

### Unit Tests

**Backend:**
- Document extraction (PDF, DOCX parsing)
- Chunking algorithms (fixed, semantic, therapeutic)
- Embedding generation (local/cloud)
- Vector similarity calculations
- Template CRUD operations
- Persona CRUD with new fields

**Frontend:**
- PersonaWizard form validation
- Template filtering logic
- File upload validation
- Progress tracking updates
- Dataset enable/disable logic

### Integration Tests

**Document Processing Pipeline:**
```typescript
describe('Document Processing Pipeline', () => {
  it('should process PDF and generate embeddings', async () => {
    const file = await loadTestPDF('cbt-worksheet.pdf');
    
    // Upload
    const uploadResponse = await uploadDocument(file, {
      processing_mode: 'local',
      therapeutic_category: 'CBT'
    });
    
    expect(uploadResponse.dataset_id).toBeDefined();
    
    // Wait for processing
    await waitForProcessing(uploadResponse.dataset_id);
    
    // Verify chunks created
    const chunks = await getDatasetChunks(uploadResponse.dataset_id);
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].embedding).toBeDefined();
  });
});
```

**RAG Chat Flow:**
```typescript
describe('RAG-Enhanced Chat', () => {
  it('should retrieve relevant context and cite sources', async () => {
    // Setup: Create persona with linked document
    const persona = await createTestPersona({
      specialty: 'CBT',
      datasets: [testDatasetId]
    });
    
    // Send message
    const response = await sendChatMessage({
      persona_id: persona.id,
      message: "I'm catastrophizing about work",
      context_settings: { use_rag: true }
    });
    
    expect(response.content).toBeDefined();
    expect(response.sources).toBeDefined();
    expect(response.sources.length).toBeGreaterThan(0);
    expect(response.sources[0].dataset_name).toBe('CBT Workbook');
  });
});
```

### Performance Tests

**Metrics:**
- Document processing time (target: <30s for 10-page PDF)
- Vector search latency (target: <100ms for 1000 chunks)
- Chat response time with RAG (target: <3s total)
- Memory usage (target: <500MB for 100 documents)

### User Acceptance Tests

**Scenarios:**
1. Create persona from CBT template
2. Upload therapy handout PDF
3. Chat with persona, verify relevant citations
4. Switch between personas with different datasets
5. Disable dataset and verify it's not referenced
6. Mobile responsiveness on all screens

---

## 📊 Success Metrics

### Technical KPIs

- **Processing Success Rate:** >95% of uploaded documents process without errors
- **Search Relevance:** >80% of retrieved chunks rated as relevant by users
- **Response Time:** <3s average for RAG-enhanced responses
- **Storage Efficiency:** <50MB per 100-page document collection

### User Engagement KPIs

- **Adoption Rate:** >60% of users create at least one persona
- **Document Upload:** >40% of users upload at least one document
- **Template Usage:** >70% of new personas created from templates
- **Retention:** >50% increase in daily active users
- **Satisfaction:** >4.5/5 average rating for persona responses

### Business Impact

- **Therapeutic Value:** Measurable improvement in response quality scores
- **Personalization:** Users report higher satisfaction with contextual responses
- **Engagement:** Increased conversation length and frequency
- **Differentiation:** Unique RAG capability sets Luna apart from competitors

---

## 🚀 Getting Started (For Next AI Model)

### Quick Start Checklist

1. **Review Current Codebase:**
   - [ ] Read `/backend/db/db.ts` - current database schema
   - [ ] Read `/backend/logic/agentService.ts` - current chat implementation
   - [ ] Read `/frontend/src/views/PersonasView.vue` - current persona UI
   - [ ] Read `/frontend/src/views/ChatView.vue` - current chat UI

2. **Phase 1 Start:**
   - [ ] Create `/backend/db/migrations/002-persona-rag-schema.sql`
   - [ ] Run migration and verify tables
   - [ ] Create `/backend/logic/templateService.ts`
   - [ ] Build template API endpoints
   - [ ] Seed 5 system templates

3. **Development Environment:**
   - [ ] Install dependencies: `pnpm install`
   - [ ] Start backend: `cd backend && pnpm dev`
   - [ ] Start frontend: `cd frontend && pnpm dev`
   - [ ] Test database: `sqlite3 backend/kalito.db`

4. **Key Files to Create:**
   ```
   backend/
     db/migrations/002-persona-rag-schema.sql
     logic/templateService.ts
     logic/documentProcessor.ts
     logic/embeddingService.ts
     logic/vectorSearchService.ts
     logic/ragAgentService.ts
     routes/templatesRouter.ts
     routes/datasetsRouter.ts
   
   frontend/src/
     components/PersonaWizard.vue
     components/TemplateGallery.vue
     components/DocumentUpload.vue
     components/DatasetManager.vue
     components/SourceCitation.vue
   ```

5. **Dependencies to Install:**
   ```bash
   # Backend
   pnpm add pdf-parse mammoth @xenova/transformers
   
   # Frontend
   pnpm add @vueuse/core
   ```

### Key Principles

- **Privacy First:** Default to local processing, cloud as opt-in
- **Progressive Enhancement:** RAG is optional, personas work without documents
- **User Control:** Users decide what data personas can access
- **Therapeutic Safety:** Maintain boundaries, cite sources, avoid medical advice
- **Performance:** Optimize for mobile, minimize processing time

---

## 📚 Additional Resources

### Referenced Files
- `/docs/Tasks/01-Persona Enhancement.md` - Detailed persona requirements (1532 lines)
- `/docs/Tasks/02-RAG.md` - RAG architecture explanation (783 lines)
- `/docs/Tasks/03-Technical-Implementation.md` - Technical specs (2345 lines)
- `/docs/Tasks/04-UI-UX.md` - Design system (2679 lines)

### External Documentation
- [Ollama API](https://github.com/ollama/ollama/blob/main/docs/api.md)
- [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings)
- [Xenova Transformers](https://huggingface.co/docs/transformers.js)
- [SQLite FTS5](https://www.sqlite.org/fts5.html)

### Contact
- Project: Luna Mental Health Companion
- Stack: Vue 3 + TypeScript + Node.js + SQLite
- Theme: Violet (#8B5CF6), glass morphism design

---

**This onboarding document provides complete context for implementing Luna's enhanced persona system with RAG capabilities. Follow the 8-week roadmap, refer to the detailed task documents, and maintain focus on therapeutic safety and user privacy throughout development.**
