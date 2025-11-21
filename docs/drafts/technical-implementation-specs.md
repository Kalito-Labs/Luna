# Technical Implementation Specifications

**Created:** November 20, 2025  
**Status:** 🛠️ Technical Design  
**Priority:** High  
**Target:** Development Team

---

## 🏗️ System Architecture Overview

### **Current Luna Stack**
```
Frontend: Vue.js 3 + TypeScript + Vite
Backend:  Node.js + Express + TypeScript  
Database: SQLite with better-sqlite3
Storage:  Local filesystem
```

### **Enhanced Stack for Persona + RAG System**
```
Frontend: Vue.js 3 + TypeScript + Vite + Enhanced Components
Backend:  Node.js + Express + TypeScript + Vector Processing
Database: SQLite + Vector Storage + Full-Text Search
Storage:  Local filesystem + Document processing
ML/AI:    Local embeddings (sentence-transformers-js) + Optional OpenAI
```

---

## 📊 Database Schema Specifications

### **Enhanced Personas Table**
```sql
-- Extend existing personas table
ALTER TABLE personas ADD COLUMN specialty TEXT;                    -- 'CBT', 'DBT', 'Mindfulness'
ALTER TABLE personas ADD COLUMN therapeutic_focus TEXT;            -- Detailed therapeutic focus
ALTER TABLE personas ADD COLUMN template_id TEXT;                  -- Reference to source template
ALTER TABLE personas ADD COLUMN created_from TEXT DEFAULT 'manual'; -- 'template'|'duplicate'|'manual'
ALTER TABLE personas ADD COLUMN builtin_data_access TEXT;          -- JSON config for Luna data access
ALTER TABLE personas ADD COLUMN color_theme TEXT DEFAULT '#6366f1'; -- UI theme color
ALTER TABLE personas ADD COLUMN is_favorite INTEGER DEFAULT 0;     -- User favorite flag
ALTER TABLE personas ADD COLUMN chat_count INTEGER DEFAULT 0;      -- Usage statistics
ALTER TABLE personas ADD COLUMN last_used TEXT;                    -- Last interaction timestamp
ALTER TABLE personas ADD COLUMN tags TEXT;                         -- JSON array of tags

-- Example of enhanced persona record:
INSERT INTO personas VALUES (
    'cbt-assistant-1',                    -- id
    'CBT Therapeutic Assistant',          -- name  
    'You are a supportive CBT assistant...', -- prompt
    'Helps with cognitive behavioral therapy techniques and thought pattern analysis', -- description
    '🧠',                                 -- icon
    'therapy',                            -- category
    0.6,                                  -- temperature
    1200,                                 -- maxTokens
    0.8,                                  -- topP
    1.1,                                  -- repeatPenalty
    '[]',                                 -- stopSequences JSON
    0,                                    -- is_default
    '2025-11-20T10:00:00Z',              -- created_at
    '2025-11-20T10:00:00Z',              -- updated_at
    NULL,                                 -- eldercare_specialty (legacy)
    1,                                    -- patient_context
    'Cognitive Behavioral Therapy',       -- specialty
    'Anxiety and depression management through CBT techniques', -- therapeutic_focus
    'cbt-therapist-template',             -- template_id
    'template',                           -- created_from
    '{"journal_entries": true, "mood_data": true, "appointments": false}', -- builtin_data_access
    '#3b82f6',                           -- color_theme
    1,                                    -- is_favorite
    23,                                   -- chat_count
    '2025-11-20T15:30:00Z',              -- last_used
    '["anxiety", "depression", "thought-patterns"]' -- tags
);
```

### **Persona Templates System**
```sql
-- New table for therapeutic templates
CREATE TABLE persona_templates (
    id TEXT PRIMARY KEY,                           -- 'cbt-therapist'
    name TEXT NOT NULL,                           -- 'CBT Therapist Assistant'
    specialty TEXT NOT NULL,                      -- 'Cognitive Behavioral Therapy'
    description TEXT NOT NULL,                    -- Template description
    prompt_template TEXT NOT NULL,                -- Base therapeutic prompt
    suggested_icon TEXT DEFAULT '🤖',            -- Recommended emoji
    default_settings TEXT NOT NULL,               -- JSON: temperature, maxTokens, etc.
    category TEXT DEFAULT 'therapy',              -- 'therapy'|'specialty'|'general'
    tags TEXT,                                    -- JSON: ['anxiety', 'depression']
    key_features TEXT,                           -- JSON: ['Thought records', 'CBT techniques']
    best_for TEXT,                               -- 'Anxiety, depression, negative thought patterns'
    therapeutic_approaches TEXT,                  -- JSON: ['CBT', 'cognitive restructuring']
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    is_active INTEGER DEFAULT 1                   -- Template availability
);

-- Insert core therapeutic templates
INSERT INTO persona_templates VALUES 
('cbt-therapist', 'CBT Therapist Assistant', 'Cognitive Behavioral Therapy',
 'A supportive CBT assistant specializing in cognitive restructuring and behavioral interventions',
 'You are a supportive CBT (Cognitive Behavioral Therapy) assistant. Your role is to help users identify negative thought patterns, examine evidence for their thoughts, and develop more balanced perspectives. Focus on the CBT triangle of thoughts, feelings, and behaviors. Guide users through thought records, behavioral experiments, and practical coping strategies.',
 '🧠',
 '{"temperature": 0.6, "maxTokens": 1200, "topP": 0.8, "repeatPenalty": 1.1}',
 'therapy',
 '["anxiety", "depression", "thought-patterns", "cognitive-distortions"]',
 '["Thought record guidance", "Cognitive distortion identification", "Evidence examination", "Behavioral activation"]',
 'Anxiety, depression, negative thought patterns, cognitive distortions',
 '["CBT", "cognitive-restructuring", "behavioral-activation"]',
 CURRENT_TIMESTAMP, 1),

('dbt-skills-coach', 'DBT Skills Coach', 'Dialectical Behavior Therapy',
 'A DBT coach focused on teaching distress tolerance and emotion regulation skills',
 'You are a DBT (Dialectical Behavior Therapy) skills coach. Help users learn and practice distress tolerance, emotion regulation, interpersonal effectiveness, and mindfulness skills. Focus on concrete techniques like TIPP, distraction, self-soothing, and wise mind. Use validation and teach practical DBT skills.',
 '⚖️',
 '{"temperature": 0.5, "maxTokens": 1000, "topP": 0.7, "repeatPenalty": 1.0}',
 'therapy',
 '["dbt", "distress-tolerance", "emotion-regulation", "mindfulness"]',
 '["TIPP technique", "Distress tolerance", "Emotion regulation", "Crisis survival"]',
 'Emotional dysregulation, crisis situations, interpersonal difficulties',
 '["DBT", "distress-tolerance", "emotion-regulation", "mindfulness"]',
 CURRENT_TIMESTAMP, 1),

('mindfulness-guide', 'Mindfulness Guide', 'Mindfulness & Meditation',
 'A gentle guide for mindfulness practices and present-moment awareness',
 'You are a gentle mindfulness guide. Help users develop present-moment awareness, practice meditation techniques, and integrate mindfulness into daily life. Offer guided meditations, breathing exercises, body scans, and mindful movement practices. Speak with calm, non-judgmental presence.',
 '🧘',
 '{"temperature": 0.4, "maxTokens": 800, "topP": 0.6, "repeatPenalty": 1.0}',
 'therapy',
 '["mindfulness", "meditation", "stress-reduction", "present-moment"]',
 '["Guided meditation", "Breathing exercises", "Body scan", "Daily mindfulness"]',
 'Stress reduction, anxiety management, concentration improvement',
 '["mindfulness-based-stress-reduction", "meditation", "contemplative-practices"]',
 CURRENT_TIMESTAMP, 1);
```

### **RAG Document Processing System**
```sql
-- Document datasets storage
CREATE TABLE datasets (
    id TEXT PRIMARY KEY,                          -- UUID for dataset
    name TEXT NOT NULL,                           -- User-friendly name
    description TEXT,                             -- Optional description
    file_type TEXT NOT NULL,                      -- 'pdf'|'docx'|'txt'|'md'
    original_filename TEXT NOT NULL,              -- Original file name
    file_path TEXT NOT NULL,                      -- Local storage path
    file_size INTEGER NOT NULL,                   -- Size in bytes
    upload_date TEXT DEFAULT CURRENT_TIMESTAMP,   -- Upload timestamp
    processed_date TEXT,                          -- Processing completion timestamp
    processing_status TEXT DEFAULT 'pending',     -- 'pending'|'processing'|'completed'|'error'
    processing_error TEXT,                        -- Error message if failed
    chunk_count INTEGER DEFAULT 0,                -- Number of chunks created
    embedding_model TEXT,                         -- 'local'|'openai'
    created_by_user TEXT NOT NULL,               -- User ID who uploaded
    is_global INTEGER DEFAULT 0,                 -- Available to all users (0/1)
    therapeutic_category TEXT,                    -- 'cbt'|'dbt'|'mindfulness'|'general'
    metadata TEXT,                               -- JSON: processing settings, file info
    search_keywords TEXT,                        -- Extracted keywords for search
    content_summary TEXT                         -- AI-generated summary
);

-- Document text chunks with vector embeddings
CREATE TABLE document_chunks (
    id TEXT PRIMARY KEY,                         -- Unique chunk ID
    dataset_id TEXT NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,               -- Order within document (0-based)
    content TEXT NOT NULL,                      -- Actual text content
    content_length INTEGER NOT NULL,            -- Character count
    embedding BLOB,                             -- Vector embedding (binary)
    embedding_model TEXT,                       -- Model used for embedding
    metadata TEXT,                              -- JSON: page, section, type, context
    chunk_type TEXT DEFAULT 'text',             -- 'text'|'heading'|'list'|'exercise'|'example'
    section_title TEXT,                         -- Section/chapter title if available
    page_number INTEGER,                        -- Source page number
    confidence_score REAL DEFAULT 1.0,         -- Processing confidence (0-1)
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast vector similarity search
CREATE INDEX idx_chunks_dataset ON document_chunks(dataset_id);
CREATE INDEX idx_chunks_type ON document_chunks(chunk_type);

-- Link personas to their accessible datasets
CREATE TABLE persona_datasets (
    persona_id TEXT NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
    dataset_id TEXT NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
    enabled INTEGER DEFAULT 1,                  -- Dataset enabled for this persona (0/1)
    weight REAL DEFAULT 1.0,                   -- Retrieval weight (0.1-2.0)
    access_level TEXT DEFAULT 'full',          -- 'full'|'summary'|'reference_only'
    last_used TEXT,                            -- Last time dataset was used in chat
    usage_count INTEGER DEFAULT 0,             -- Number of times accessed
    added_date TEXT DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (persona_id, dataset_id)
);

-- Track dataset usage for analytics
CREATE TABLE dataset_usage_log (
    id TEXT PRIMARY KEY,
    dataset_id TEXT NOT NULL REFERENCES datasets(id),
    persona_id TEXT NOT NULL REFERENCES personas(id),
    query TEXT NOT NULL,                       -- User query that triggered retrieval
    chunks_retrieved INTEGER DEFAULT 0,        -- Number of chunks returned
    relevance_scores TEXT,                     -- JSON array of similarity scores
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔌 API Endpoint Specifications

### **Enhanced Persona Management APIs**

#### **GET /api/persona-templates**
```typescript
interface PersonaTemplate {
  id: string;
  name: string;
  specialty: string;
  description: string;
  prompt_template: string;
  suggested_icon: string;
  default_settings: {
    temperature: number;
    maxTokens: number;
    topP: number;
    repeatPenalty: number;
  };
  category: 'therapy' | 'specialty' | 'general';
  tags: string[];
  key_features: string[];
  best_for: string;
  therapeutic_approaches: string[];
}

// Response
{
  "templates": PersonaTemplate[],
  "categories": {
    "therapy": { count: number, templates: string[] },
    "specialty": { count: number, templates: string[] }
  }
}
```

#### **POST /api/personas/from-template/:templateId**
```typescript
interface CreateFromTemplateRequest {
  name: string;
  description?: string;
  customizations?: {
    temperature?: number;
    maxTokens?: number;
    icon?: string;
    color_theme?: string;
    tags?: string[];
  };
  builtin_data_access?: {
    journal_entries?: boolean;
    mood_data?: boolean;
    appointments?: boolean;
    user_profile?: boolean;
  };
}

interface CreateFromTemplateResponse {
  persona: EnhancedPersona;
  template_used: PersonaTemplate;
  customizations_applied: object;
}
```

#### **POST /api/personas/:id/duplicate**
```typescript
interface DuplicatePersonaRequest {
  new_name: string;
  description?: string;
  preserve_datasets?: boolean;  // Copy dataset associations
  customizations?: object;
}

interface DuplicatePersonaResponse {
  original_persona: EnhancedPersona;
  new_persona: EnhancedPersona;
  datasets_copied: number;
}
```

#### **GET /api/personas/by-category/:category**
```typescript
type PersonaCategory = 'all' | 'therapy' | 'specialty' | 'cloud' | 'local' | 'custom' | 'favorites';

interface CategoryFilterResponse {
  personas: EnhancedPersona[];
  category: PersonaCategory;
  total_count: number;
  filters_applied: {
    category: string;
    has_datasets?: boolean;
    recently_used?: boolean;
  };
}
```

### **RAG Document Processing APIs**

#### **POST /api/datasets/upload**
```typescript
interface DocumentUploadRequest extends FormData {
  file: File;                              // The document file
  persona_id?: string;                     // Optional: associate with specific persona
  processing_mode: 'local' | 'cloud';     // Embedding generation mode
  name?: string;                           // Custom dataset name
  description?: string;                    // Dataset description
  therapeutic_category?: string;           // CBT, DBT, mindfulness, etc.
  chunk_settings?: {
    chunk_size?: number;                   // Tokens per chunk (default: 512)
    overlap?: number;                      // Overlap between chunks (default: 50)
    strategy?: 'semantic' | 'fixed' | 'therapeutic_aware';
  };
}

interface DocumentUploadResponse {
  dataset_id: string;
  upload_status: 'uploaded' | 'processing' | 'completed' | 'error';
  processing_job_id?: string;             // For tracking long-running processing
  estimated_completion_time?: number;     // Seconds
  file_info: {
    name: string;
    size: number;
    type: string;
    page_count?: number;                  // For PDFs
  };
}
```

#### **GET /api/datasets/:id/status**
```typescript
interface ProcessingStatusResponse {
  dataset_id: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: {
    current_step: 'extracting' | 'chunking' | 'embedding' | 'storing';
    percentage: number;                   // 0-100
    estimated_remaining_time?: number;    // Seconds
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

#### **GET /api/personas/:id/datasets**
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

#### **PUT /api/personas/:id/datasets/:datasetId**
```typescript
interface UpdateDatasetAssociationRequest {
  enabled: boolean;
  weight?: number;                        // 0.1 - 2.0
  access_level?: 'full' | 'summary' | 'reference_only';
}

interface UpdateDatasetAssociationResponse {
  persona_id: string;
  dataset_id: string;
  previous_settings: object;
  new_settings: object;
  effective_immediately: boolean;
}
```

### **RAG Retrieval API (Internal)**

#### **POST /api/rag/retrieve**
```typescript
interface RAGRetrievalRequest {
  query: string;
  persona_id: string;
  max_chunks?: number;                    // Default: 5
  similarity_threshold?: number;          // Default: 0.7
  include_builtin_data?: boolean;         // Default: true
  rerank_by_relevance?: boolean;         // Default: true
  context?: {
    conversation_history?: Message[];
    user_mood?: number;
    recent_journal_entries?: string[];
  };
}

interface RAGRetrievalResponse {
  query_embedding_generated: boolean;
  chunks_found: number;
  chunks_returned: number;
  retrieval_time_ms: number;
  results: Array<{
    chunk_id: string;
    dataset_name: string;
    content: string;
    similarity_score: number;
    source_reference: string;             // "filename.pdf, page 3"
    chunk_type: string;
    section_title?: string;
    therapeutic_category?: string;
    context_snippet: string;              // Surrounding context
  }>;
  builtin_data_included: Array<{
    type: 'journal_entry' | 'mood_data' | 'appointment';
    content: string;
    date: string;
    relevance_reason: string;
  }>;
  fallback_used: boolean;                 // If no relevant chunks found
}
```

---

## 🧠 Vector Processing Implementation

### **Local Embedding Generation**
```typescript
import { pipeline } from '@xenova/transformers';

class LocalEmbeddingService {
  private model: any = null;
  
  async initialize() {
    // Load sentence transformer model for embeddings
    this.model = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2',  // 384-dimensional embeddings
      { device: 'cpu' }            // CPU-only for privacy
    );
  }
  
  async generateEmbeddings(texts: string[]): Promise<Float32Array[]> {
    const embeddings: Float32Array[] = [];
    
    for (const text of texts) {
      // Generate embedding for text chunk
      const output = await this.model(text, {
        pooling: 'mean',           // Mean pooling
        normalize: true            // L2 normalization
      });
      
      embeddings.push(new Float32Array(output.data));
    }
    
    return embeddings;
  }
  
  async embed(text: string): Promise<Float32Array> {
    const embeddings = await this.generateEmbeddings([text]);
    return embeddings[0];
  }
}
```

### **Vector Similarity Search**
```typescript
class VectorSearchEngine {
  // In-memory vector index for fast search
  private vectorIndex: Map<string, {
    embedding: Float32Array;
    metadata: ChunkMetadata;
  }> = new Map();
  
  async loadDatasetVectors(datasetIds: string[]) {
    // Load vectors from database into memory for fast search
    for (const datasetId of datasetIds) {
      const chunks = await db.prepare(`
        SELECT id, embedding, metadata, content, chunk_type, section_title
        FROM document_chunks 
        WHERE dataset_id = ?
      `).all(datasetId);
      
      for (const chunk of chunks) {
        this.vectorIndex.set(chunk.id, {
          embedding: new Float32Array(chunk.embedding),
          metadata: JSON.parse(chunk.metadata)
        });
      }
    }
  }
  
  async search(
    queryEmbedding: Float32Array,
    options: SearchOptions
  ): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    
    // Calculate cosine similarity for all vectors
    for (const [chunkId, data] of this.vectorIndex) {
      const similarity = this.cosineSimilarity(queryEmbedding, data.embedding);
      
      if (similarity >= options.threshold) {
        results.push({
          chunk_id: chunkId,
          similarity_score: similarity,
          metadata: data.metadata
        });
      }
    }
    
    // Sort by similarity and return top k
    return results
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

### **Document Processing Pipeline**
```typescript
class DocumentProcessor {
  async processDocument(
    file: File, 
    options: ProcessingOptions
  ): Promise<ProcessedDocument> {
    
    // Step 1: Extract text content
    const textContent = await this.extractText(file);
    
    // Step 2: Analyze document structure
    const structure = await this.analyzeStructure(textContent, file.type);
    
    // Step 3: Intelligent chunking
    const chunks = await this.createChunks(textContent, structure, options);
    
    // Step 4: Generate embeddings
    const embeddings = await this.generateEmbeddings(chunks, options.embedding_model);
    
    // Step 5: Extract metadata and keywords
    const metadata = await this.extractMetadata(textContent, structure);
    
    return {
      chunks,
      embeddings,
      metadata,
      structure,
      processing_stats: {
        original_size: file.size,
        chunk_count: chunks.length,
        processing_time: Date.now() - startTime
      }
    };
  }
  
  private async extractText(file: File): Promise<string> {
    switch (file.type) {
      case 'application/pdf':
        return await this.extractFromPDF(file);
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return await this.extractFromDocx(file);
      case 'text/plain':
        return await file.text();
      case 'text/markdown':
        return await this.parseMarkdown(await file.text());
      default:
        throw new Error(`Unsupported file type: ${file.type}`);
    }
  }
  
  private async createChunks(
    text: string, 
    structure: DocumentStructure,
    options: ProcessingOptions
  ): Promise<DocumentChunk[]> {
    
    // Therapeutic document-aware chunking
    if (options.strategy === 'therapeutic_aware') {
      return await this.therapeuticChunking(text, structure, options);
    }
    
    // Standard semantic chunking
    return await this.semanticChunking(text, options);
  }
  
  private async therapeuticChunking(
    text: string,
    structure: DocumentStructure,
    options: ProcessingOptions
  ): Promise<DocumentChunk[]> {
    
    const chunks: DocumentChunk[] = [];
    let chunkIndex = 0;
    
    // Process each section while preserving therapeutic structure
    for (const section of structure.sections) {
      
      // Keep instructions and examples together
      if (section.type === 'instructions' && section.next_section?.type === 'example') {
        const combinedContent = section.content + '\n\n' + section.next_section.content;
        chunks.push({
          content: combinedContent,
          chunk_index: chunkIndex++,
          chunk_type: 'instruction_with_example',
          metadata: {
            section_title: section.title,
            pages: [section.page, section.next_section.page],
            combined_sections: true
          }
        });
        continue;
      }
      
      // Keep worksheets and exercises intact
      if (section.type === 'worksheet' || section.type === 'exercise') {
        chunks.push({
          content: section.content,
          chunk_index: chunkIndex++,
          chunk_type: section.type,
          metadata: {
            section_title: section.title,
            page: section.page,
            preserve_formatting: true
          }
        });
        continue;
      }
      
      // Regular content: split if too large
      if (section.content.length > options.chunk_size * 4) {
        const subChunks = await this.splitLargeSection(section, options);
        chunks.push(...subChunks);
        chunkIndex += subChunks.length;
      } else {
        chunks.push({
          content: section.content,
          chunk_index: chunkIndex++,
          chunk_type: 'text',
          metadata: {
            section_title: section.title,
            page: section.page
          }
        });
      }
    }
    
    return chunks;
  }
}
```

---

## 🎨 Frontend Component Specifications

### **Enhanced PersonaEditModal Component**
```vue
<script setup lang="ts">
interface PersonaEditModalProps {
  persona?: EnhancedPersona;
  mode: 'create' | 'edit';
  template?: PersonaTemplate;
}

interface PersonaFormData {
  // Basic info
  name: string;
  description: string;
  icon: string;
  color_theme: string;
  specialty: string;
  therapeutic_focus: string;
  tags: string[];
  
  // AI settings
  prompt: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  repeatPenalty: number;
  
  // Data access configuration
  builtin_data_access: {
    journal_entries: boolean;
    mood_data: boolean;
    appointments: boolean;
    user_profile: boolean;
  };
  
  // Dataset associations
  enabled_datasets: Array<{
    dataset_id: string;
    weight: number;
    access_level: 'full' | 'summary' | 'reference_only';
  }>;
}

const formData = reactive<PersonaFormData>({
  name: '',
  description: '',
  icon: '🤖',
  color_theme: '#6366f1',
  specialty: '',
  therapeutic_focus: '',
  tags: [],
  prompt: '',
  temperature: 0.7,
  maxTokens: 1000,
  topP: 0.9,
  repeatPenalty: 1.0,
  builtin_data_access: {
    journal_entries: true,
    mood_data: false,
    appointments: false,
    user_profile: true
  },
  enabled_datasets: []
});

// Tab management
const activeTab = ref<'basic' | 'prompt' | 'settings' | 'datasets'>('basic');

// Form validation
const validationRules = {
  name: { required: true, minLength: 3, maxLength: 50 },
  specialty: { required: true },
  prompt: { required: true, minLength: 50, maxLength: 2000 },
  temperature: { min: 0.1, max: 2.0 },
  maxTokens: { min: 100, max: 4000 }
};

// Save persona
const savePersona = async () => {
  try {
    const endpoint = props.mode === 'create' 
      ? '/api/personas' 
      : `/api/personas/${props.persona.id}`;
    
    const method = props.mode === 'create' ? 'POST' : 'PUT';
    
    const response = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    if (!response.ok) throw new Error('Failed to save persona');
    
    const savedPersona = await response.json();
    emit('saved', savedPersona);
    
  } catch (error) {
    console.error('Error saving persona:', error);
    showNotification('error', 'Failed to save persona');
  }
};
</script>

<template>
  <div class="persona-edit-modal">
    <!-- Modal header with persona preview -->
    <div class="modal-header">
      <div class="persona-preview">
        <div class="persona-avatar" :style="{ background: formData.color_theme }">
          {{ formData.icon }}
        </div>
        <div class="persona-info">
          <h2>{{ formData.name || 'New Persona' }}</h2>
          <p>{{ formData.specialty || 'Specialty not set' }}</p>
        </div>
      </div>
      <button @click="$emit('close')" class="close-btn">✕</button>
    </div>
    
    <!-- Tab navigation -->
    <div class="tab-nav">
      <button v-for="tab in tabs" 
              :key="tab.id"
              @click="activeTab = tab.id"
              :class="{ active: activeTab === tab.id }"
              class="tab-button">
        <span class="tab-icon">{{ tab.icon }}</span>
        {{ tab.label }}
      </button>
    </div>
    
    <!-- Tab content -->
    <div class="tab-content">
      
      <!-- Basic Info Tab -->
      <div v-if="activeTab === 'basic'" class="basic-tab">
        <div class="form-section">
          <label>Persona Name *</label>
          <input v-model="formData.name" 
                 type="text" 
                 placeholder="e.g. My CBT Assistant"
                 class="form-input" />
        </div>
        
        <div class="form-section">
          <label>Therapeutic Specialty *</label>
          <select v-model="formData.specialty" class="form-select">
            <option value="">Select specialty...</option>
            <option value="Cognitive Behavioral Therapy">CBT - Cognitive Behavioral Therapy</option>
            <option value="Dialectical Behavior Therapy">DBT - Dialectical Behavior Therapy</option>
            <option value="Mindfulness & Meditation">Mindfulness & Meditation</option>
            <option value="Trauma-Informed Care">Trauma-Informed Care</option>
            <option value="General Mental Health">General Mental Health</option>
            <option value="Custom">Custom Specialty</option>
          </select>
        </div>
        
        <div class="form-grid">
          <div class="form-section">
            <label>Icon</label>
            <EmojiPicker v-model="formData.icon" />
          </div>
          <div class="form-section">
            <label>Theme Color</label>
            <ColorPicker v-model="formData.color_theme" />
          </div>
        </div>
        
        <div class="form-section">
          <label>Description</label>
          <textarea v-model="formData.description" 
                    placeholder="Brief description of this persona's purpose..."
                    class="form-textarea"></textarea>
        </div>
      </div>
      
      <!-- Prompt Configuration Tab -->
      <div v-if="activeTab === 'prompt'" class="prompt-tab">
        <div class="form-section">
          <label>System Prompt *</label>
          <textarea v-model="formData.prompt"
                    placeholder="You are a supportive therapeutic assistant..."
                    class="prompt-textarea"
                    rows="12"></textarea>
          <div class="prompt-help">
            <h4>Prompt Writing Tips:</h4>
            <ul>
              <li>Define the persona's therapeutic approach clearly</li>
              <li>Specify the types of support they provide</li>
              <li>Include guidelines for therapeutic boundaries</li>
              <li>Mention specific techniques or frameworks</li>
            </ul>
          </div>
        </div>
      </div>
      
      <!-- AI Settings Tab -->
      <div v-if="activeTab === 'settings'" class="settings-tab">
        <div class="settings-grid">
          <div class="form-section">
            <label>Temperature: {{ formData.temperature }}</label>
            <input v-model.number="formData.temperature"
                   type="range"
                   min="0.1"
                   max="2.0"
                   step="0.1"
                   class="form-range" />
            <span class="setting-hint">Controls creativity vs consistency</span>
          </div>
          
          <div class="form-section">
            <label>Max Tokens: {{ formData.maxTokens }}</label>
            <input v-model.number="formData.maxTokens"
                   type="range"
                   min="100"
                   max="4000"
                   step="50"
                   class="form-range" />
            <span class="setting-hint">Maximum response length</span>
          </div>
        </div>
      </div>
      
      <!-- Datasets Tab -->
      <div v-if="activeTab === 'datasets'" class="datasets-tab">
        <!-- Luna data access -->
        <div class="builtin-data-section">
          <h3>Luna Data Access</h3>
          <p>Choose what information from Luna this persona can access</p>
          
          <div class="data-toggles">
            <ToggleSwitch v-model="formData.builtin_data_access.journal_entries"
                         label="Journal Entries"
                         description="Access user's journal history for context" />
            <ToggleSwitch v-model="formData.builtin_data_access.mood_data"
                         label="Mood Tracking Data"
                         description="Historical mood patterns and trends" />
            <ToggleSwitch v-model="formData.builtin_data_access.appointments"
                         label="Appointment History"
                         description="Past and upcoming therapy appointments" />
            <ToggleSwitch v-model="formData.builtin_data_access.user_profile"
                         label="User Profile"
                         description="Basic user information and preferences" />
          </div>
        </div>
        
        <!-- Custom documents -->
        <div class="custom-datasets-section">
          <div class="section-header">
            <h3>Custom Documents</h3>
            <button @click="showUploadModal = true" class="upload-btn">
              📁 Upload Document
            </button>
          </div>
          
          <div class="datasets-grid">
            <DatasetCard v-for="dataset in availableDatasets"
                        :key="dataset.id"
                        :dataset="dataset"
                        :association="getDatasetAssociation(dataset.id)"
                        @toggle="toggleDatasetAssociation"
                        @configure="configureDatasetAssociation" />
          </div>
        </div>
      </div>
    </div>
    
    <!-- Modal footer -->
    <div class="modal-footer">
      <button @click="$emit('close')" class="btn-secondary">
        Cancel
      </button>
      <button @click="savePersona" class="btn-primary" :disabled="!isFormValid">
        {{ props.mode === 'create' ? 'Create Persona' : 'Save Changes' }}
      </button>
    </div>
  </div>
</template>
```

### **Document Upload Modal Component**
```vue
<script setup lang="ts">
interface UploadModalProps {
  persona_id?: string;
  show: boolean;
}

const uploadQueue = ref<UploadJob[]>([]);
const processingMode = ref<'local' | 'cloud'>('local');
const isDragActive = ref(false);

interface UploadJob {
  id: string;
  file: File;
  progress: number;
  status: 'queued' | 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
  dataset_id?: string;
}

const handleFileSelect = async (event: Event) => {
  const files = (event.target as HTMLInputElement).files;
  if (!files) return;
  
  await processFiles(Array.from(files));
};

const handleDrop = async (event: DragEvent) => {
  event.preventDefault();
  isDragActive.value = false;
  
  const files = event.dataTransfer?.files;
  if (!files) return;
  
  await processFiles(Array.from(files));
};

const processFiles = async (files: File[]) => {
  for (const file of files) {
    const job: UploadJob = {
      id: generateId(),
      file,
      progress: 0,
      status: 'queued'
    };
    
    uploadQueue.value.push(job);
    await uploadFile(job);
  }
};

const uploadFile = async (job: UploadJob) => {
  try {
    job.status = 'uploading';
    
    const formData = new FormData();
    formData.append('file', job.file);
    formData.append('processing_mode', processingMode.value);
    if (props.persona_id) {
      formData.append('persona_id', props.persona_id);
    }
    
    const response = await fetch('/api/datasets/upload', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) throw new Error('Upload failed');
    
    const result = await response.json();
    job.dataset_id = result.dataset_id;
    job.status = 'processing';
    
    // Poll for processing status
    await pollProcessingStatus(job);
    
  } catch (error) {
    job.status = 'error';
    job.error = error.message;
  }
};

const pollProcessingStatus = async (job: UploadJob) => {
  while (job.status === 'processing') {
    try {
      const response = await fetch(`/api/datasets/${job.dataset_id}/status`);
      const status = await response.json();
      
      job.progress = status.progress.percentage;
      
      if (status.status === 'completed') {
        job.status = 'completed';
        job.progress = 100;
        break;
      } else if (status.status === 'error') {
        job.status = 'error';
        job.error = status.error.message;
        break;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // Poll every second
      
    } catch (error) {
      job.status = 'error';
      job.error = 'Failed to check processing status';
      break;
    }
  }
};
</script>

<template>
  <div v-if="show" class="document-upload-modal">
    <div class="modal-overlay" @click="$emit('close')"></div>
    <div class="modal-content">
      
      <!-- Modal header -->
      <div class="modal-header">
        <h2>Upload Therapeutic Documents</h2>
        <p>Add documents to enhance your persona's knowledge</p>
        <button @click="$emit('close')" class="close-btn">✕</button>
      </div>
      
      <!-- Upload area -->
      <div class="upload-area"
           :class="{ 'drag-active': isDragActive }"
           @drop="handleDrop"
           @dragover.prevent="isDragActive = true"
           @dragleave.prevent="isDragActive = false">
        
        <div class="drop-zone">
          <div class="upload-icon">📄</div>
          <h3>Drag & Drop Documents</h3>
          <p>Or click to browse for files</p>
          <button @click="$refs.fileInput.click()" class="browse-btn">
            Choose Files
          </button>
          <input ref="fileInput"
                 type="file"
                 multiple
                 accept=".pdf,.docx,.txt,.md"
                 @change="handleFileSelect"
                 hidden />
        </div>
        
        <!-- Processing mode selection -->
        <div class="processing-mode">
          <h4>Processing Mode:</h4>
          <div class="mode-options">
            <label class="mode-option">
              <input type="radio" v-model="processingMode" value="local" />
              <div class="mode-info">
                <strong>🔒 Privacy Mode (Recommended)</strong>
                <p>Process documents locally on your device</p>
              </div>
            </label>
            <label class="mode-option">
              <input type="radio" v-model="processingMode" value="cloud" />
              <div class="mode-info">
                <strong>☁️ Cloud Mode</strong>
                <p>Higher quality processing using OpenAI</p>
              </div>
            </label>
          </div>
        </div>
      </div>
      
      <!-- Supported formats -->
      <div class="supported-formats">
        <h4>Supported Formats:</h4>
        <div class="format-badges">
          <span class="format-badge">📄 PDF Documents</span>
          <span class="format-badge">📝 Word Documents (.docx)</span>
          <span class="format-badge">📜 Text Files (.txt)</span>
          <span class="format-badge">📋 Markdown Files (.md)</span>
        </div>
      </div>
      
      <!-- Upload progress -->
      <div v-if="uploadQueue.length > 0" class="upload-progress">
        <h4>Processing Documents:</h4>
        <div class="progress-list">
          <div v-for="job in uploadQueue" :key="job.id" class="progress-item">
            <div class="file-info">
              <span class="file-name">{{ job.file.name }}</span>
              <span class="file-status" :class="job.status">
                {{ getStatusLabel(job.status) }}
              </span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" 
                   :style="{ width: job.progress + '%' }"
                   :class="job.status"></div>
            </div>
            <div v-if="job.error" class="error-message">
              {{ job.error }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
```

---

## 📈 Performance Optimization Strategies

### **Database Optimization**
```sql
-- Indexes for fast persona queries
CREATE INDEX idx_personas_specialty ON personas(specialty);
CREATE INDEX idx_personas_category ON personas(category);
CREATE INDEX idx_personas_template_id ON personas(template_id);
CREATE INDEX idx_personas_user_favorites ON personas(is_favorite, created_at);

-- Indexes for fast dataset queries
CREATE INDEX idx_datasets_user_category ON datasets(created_by_user, therapeutic_category);
CREATE INDEX idx_datasets_status ON datasets(processing_status);
CREATE INDEX idx_dataset_chunks_content ON document_chunks(dataset_id, chunk_type);

-- Full-text search index for content
CREATE VIRTUAL TABLE document_chunks_fts USING fts5(
  content, 
  section_title, 
  chunk_type,
  content='document_chunks',
  content_rowid='id'
);
```

### **Memory Management**
```typescript
class VectorMemoryManager {
  private maxMemoryUsage = 500 * 1024 * 1024; // 500MB
  private vectorCache = new Map<string, Float32Array>();
  private cacheSize = 0;
  
  async loadDatasetVectors(datasetId: string): Promise<void> {
    const chunks = await db.prepare(`
      SELECT id, embedding FROM document_chunks 
      WHERE dataset_id = ?
    `).all(datasetId);
    
    for (const chunk of chunks) {
      if (this.cacheSize > this.maxMemoryUsage) {
        await this.evictOldestVectors();
      }
      
      const embedding = new Float32Array(chunk.embedding);
      this.vectorCache.set(chunk.id, embedding);
      this.cacheSize += embedding.byteLength;
    }
  }
  
  private async evictOldestVectors() {
    // LRU eviction strategy
    const sortedEntries = Array.from(this.vectorCache.entries())
      .sort((a, b) => this.getLastUsed(a[0]) - this.getLastUsed(b[0]));
    
    // Remove oldest 25% of vectors
    const toRemove = Math.floor(sortedEntries.length * 0.25);
    for (let i = 0; i < toRemove; i++) {
      const [chunkId, embedding] = sortedEntries[i];
      this.vectorCache.delete(chunkId);
      this.cacheSize -= embedding.byteLength;
    }
  }
}
```

---

**This technical specification provides the complete implementation blueprint for transforming Luna's persona system with RAG capabilities, ensuring both therapeutic effectiveness and technical robustness.**