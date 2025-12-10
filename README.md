# Luna: Introduction & System Overview


**Document Version**: 1.3
**Last Updated**: December 9, 2025
**Status**: Active Documentation
**Related Documents**: [Technical Architecture Deep Dive](./architecture.md)

---
## What is Luna?

Luna is a **personal mental health companion** designed for tracking your mental wellness journey. It combines therapeutic data management with AI conversations that have full contextual awareness of the patient's mental health history providing a personalized experience.

---
## What Makes Luna Unique
### 1. Hybrid Mental Health Management + AI Companion

- **Full Context Access**: AI has complete read access to medications, journal entries, and exercises
- **Therapeutically Relevant Conversations**: Discussions are informed by your actual mental health data
- **Privacy Protection**: All data stored locally in SQLite; AI cannot modify patient records
- **Seamless Experience**: Switch between data management and AI conversation without context loss
### 3. Intelligent Memory System

Luna implements a hybrid memory architecture:

- **Rolling Buffer**: Last 10 messages kept in active conversation context
- **Auto-Summarization**: Automatically compresses conversation history after 8+ messages
- **Semantic Pins**: Extracts and stores important medical insights with importance scoring
- Symptoms, medication mentions, mood changes tracked automatically
- Urgency levels prioritized (Crisis: 0.8-1.0, Therapeutic: 0.7-0.9, Treatment: 0.6-0.8)
- **Crisis Prioritization**: Boosts importance scores by 0.3 for crisis-related content
- **Context Pre-Building**: Assembles complete context BEFORE sending to AI to ensure accuracy
- **Performance Caching**: 30-second TTL cache for therapy session optimization
---
## Key Functional Areas
### Mental Health Core Features

#### 1. Patient Profile Management

- Core demographics (name, date of birth, gender, contact information)
- Location information (city, state)
- Occupation and occupation description
- Language preferences
- Medical notes and history
- Automatic age calculation from date of birth

#### 2. Medication Tracking

Full prescription management with structured validation:

**Active Medications**

- Dosage and frequency management
- Route of administration
- Prescribing doctor information
- Pharmacy details and RX numbers
- Side effects monitoring
- Comprehensive notes
- Structured validation to prevent AI hallucinations
#### 3. Therapeutic Journaling

**Journal Features**:

- Free-form text entries with titles
- Entry date and time stamps
- Mood tracking (happy, sad, anxious, calm, etc.)
- Multiple emotion tagging per entry
- Journal type classification (free-form, prompted, gratitude, reflection)
- Word count tracking
- Calendar visualization for pattern recognition
#### 5. Therapy Exercise Tracking

Structured therapeutic exercise management with AI integration:

**CBT Thought Records** (Cognitive Behavioral Therapy):

- **Situation**: What happened?
- **Automatic Thought**: Initial negative thinking
- **Emotion & Intensity**: What you felt (0-10 scale)
- **Evidence For**: Supporting the automatic thought
- **Evidence Against**: Challenging the automatic thought
- **Alternative Thought**: Balanced, realistic thinking
- **New Emotion & Intensity**: Post-exercise emotional state (0-10 scale)
- **Improvement Score**: Automatic calculation of emotional change

**AI Integration**:

- Therapeutic progress tracking
- Emotion intensity analysis
- Pattern identification across exercises
- Improvement score calculations 

**Future Modules**:

- ACT (Acceptance & Commitment Therapy) exercises

- DBT (Dialectical Behavior Therapy) skills tracking
---
### AI Conversation System
#### 1. Multi-Model Support

**Cloud Models**:
- OpenAI GPT-4.1-nano (primary)

**Local Models**:
- Ollama integration for offline privacy
- Full feature parity with cloud models
- No internet required for local model operation
#### 2. Therapeutic Personas

Enhanced AI personality system with mental health focus:

**Core Features**:
- Custom system prompts for therapeutic contexts
- Template-based persona creation
- Tag categorization for organization
- Usage analytics (count, last used timestamp)

**Configuration Options**:
- Temperature (creativity vs. consistency)
- Max tokens (response length)
- Top-P (sampling diversity)
- Repeat penalty (response variation)

#### 3. Query Routing System

Intelligent query analysis for optimal response handling:

**Query Type Detection**:

- **Medication Queries**: Routes to structured medication service
- **General Queries**: Routes to AI conversation system

**Hallucination Prevention**:

- Factual medical data handled by validated services
- AI bypassed for database-backed information
- Structured responses for medications
- Free-form AI for therapeutic support and analysis

**Web Search Integration**:

- Tavily API integration for web search
- **Explicit Intent Detection**: Only searches when explicitly requested
- No autonomous AI decisions about internet searches
- Trigger phrases: "search online", "look up", "what's the current", "latest news", etc.

**Tool Selection**:

- Context-aware tool availability
- Function calling for structured operations
- Intelligent parameter extraction
---
### Knowledge Integration (RAG System)

#### 1. Document Processing Pipeline
Multi-format document ingestion:

**Supported Formats**:
- PDF documents
- Microsoft Word (DOCX)
- Plain text (TXT)
- Markdown (MD)

**Processing Features**:

- Text extraction with format preservation
- Metadata capture (file name, upload date, file size)
- Smart chunking with semantic coherence
- Automatic token counting
- Error handling and validation
#### 2. Chunking Strategy

Intelligent text segmentation for AI context:

**Configuration**:

- Chunk size: 1000 characters
- Overlap: 200 characters (maintains context across boundaries)
- Semantic coherence preservation
- Section title tracking
- Page number retention (for PDFs)

**Benefits**:

- Optimal token usage for AI context windows
- Maintains narrative flow across chunks
- Enables precise source attribution
- Supports partial document retrieval
#### 3. Persona-Specific Knowledge

Fine-grained dataset access control:

**Access Levels**:

- **Read**: Full content access for AI context
- **Summary**: Only high-level summaries provided
- **Reference-Only**: Metadata only, no content

**Features**:

- Link specific datasets to personas
- Weighted priority (0.1 - 2.0 scale) for document importance
- Enable/disable datasets per persona
- Context-aware retrieval during conversations
- Automatic relevance scoring

**Current State**: 0 datasets uploaded (system fully configured and ready)

---

## Technical Architecture

### Database Layer (SQLite with WAL Mode)

**13 Tables** with strategic optimization:

**Core Tables**:
- `patients` - Patient profiles and demographics
- `sessions` - Conversation session management
- `messages` - Individual conversation messages with importance scoring
- `personas` - AI personality configurations

**Mental Health Tables**:
- `medications` - Prescription tracking with validation
- `journal_entries` - Therapeutic journaling with mood/emotion tracking
- `therapy_records` - Unified storage for CBT/ACT/DBT exercises (JSON data field)

**Memory System Tables**:
- `conversation_summaries` - Compressed conversation history
- `semantic_pins` - Extracted medical insights with importance scoring

**RAG System Tables**:
- `datasets` - Document metadata and management
- `document_chunks` - Segmented text with embeddings
- `persona_datasets` - Links personas to knowledge base documents

**Optimization Features**:
- 8 performance-optimized indexes
- Foreign key constraints with cascade deletes
- Soft deletes via `active` flags for data retention
- Full audit trail (created_at, updated_at timestamps)
- WAL (Write-Ahead Logging) mode for concurrent reads
- Strategic compound indexes for complex queries
### Backend Services (15 Core Services)

**AI & Conversation** (5 services):
- `agentService.ts` - AI conversation orchestration with streaming support
- `memoryManager.ts` - Hybrid memory system with 30s caching
- `lunaContextService.ts` - Patient context builder for AI integration
- `queryRouter.ts` - Intelligent query type detection and routing
- `modelRegistry.ts` - Multi-provider AI model management

**Data Management** (3 services):

- `structuredMedicationService.ts` - Medication CRUD with Zod validation
- `journalService.ts` - Journal entry operations
- `therapyRecordsService.ts` - CBT/ACT/DBT exercise tracking


**RAG & Search** (5 services):

- `documentProcessor.ts` - PDF/DOCX/TXT/MD processing pipeline
- `chunkingService.ts` - Intelligent text segmentation
- `embeddingService.ts` - Vector embedding generation (planned)
- `vectorSearchService.ts` - Semantic search implementation
- `tavilyService.ts` - Web search integration (Tavily API)
**Utilities** (1 service):

- `tools.ts` - AI function calling tools and schema definitions

### Frontend Architecture (Vue 3 + TypeScript)


**Framework Stack**:
- Vue 3 with Composition API
- TypeScript for type safety
- Ionic Framework for UI components
- Capacitor for native mobile features
- Vite for build tooling

**Component Library**:
- 33 custom Vue components (10 views, 23 reusable components)
- Organized into 5 feature categories (chat, personas, kalitohub, journal, datasets)
- Consistent purple gradient design system
- Glass-morphic effects (backdrop blur, color saturation)
- Responsive layouts (desktop, tablet, mobile)
- Dark mode with purple tinting throughout

**Key Views** (10 total):

- `HomeView.vue` - Landing page with wellness quotes
- `ChatWorkspace.vue` - Main conversation interface (desktop + mobile)
- `PersonaManager.vue` - Persona configuration and management
- `KalitoHub.vue` - Patient management dashboard
- `JournalView.vue` - Journaling interface with calendar
- `CBTView.vue` / `ACTView.vue` / `DBTView.vue` - Therapy exercise interfaces
- `LibraryView.vue` - Document library and RAG management
- `ResourcesView.vue` - Therapy resources and guides

**Component Organization** (23 reusable components):

- **Chat Components** (5): ChatInput, ChatMessage, ChatSidebar, ModelSelector, StreamingIndicator
- **Personas Components** (2): PersonaCard, PersonaEditor
- **KalitoHub Components** (4): MedicationCard, AppointmentCard, VitalsChart, PatientSummary
- **Journal Components** (3): JournalCard, MoodSelector, TagInput
- **Datasets Components** (5): DatasetUploader, DatasetCard, DocumentViewer, ChunkExplorer, AccessLevelSelector
- **Additional Components** (9): Various utility and layout components

**Platform Support**:

- Desktop browser (primary development target)
- Progressive Web App (PWA) with service workers
- Android APK builds via Capacitor
- iOS configuration (not actively developed)
---
## Current System State (December 2025)

### Active Data

- **Patients**: 1 active (Kaleb, age 39, Texas)
- **Medications**: 4 active prescriptions
- **Journal Entries**: 5+ recent entries with mood tracking
- **CBT Thought Records**: 1 active record
- **AI Sessions**: 1 active session with 4 messages
- **Personas**: 2 default (cloud + local)
### System Readiness

- **Conversation Summaries**: 0 (auto-generates after 8+ messages)
- **Semantic Pins**: 0 (extracts automatically during conversations)
- **RAG Datasets**: 0 uploaded (system fully configured and ready)
- **Document Chunks**: 0 (ready for processing)
---

## What Luna Does Best

### 1. Contextual Therapeutic Conversations

Luna AI understands your complete mental health picture:

- Knows your current medications and can discuss interactions or side effects
- References your recent journal entries for mood pattern analysis
- Understands your CBT progress and can guide therapeutic exercises
- Maintains conversation context across sessions
### 2. Hallucination Prevention

Innovative architecture ensures accuracy:

- Structured services handle all factual medical data
- AI bypassed for medication and appointment queries
- Database-backed responses for prescription information
- Free-form AI only for therapeutic support and analysis
- Zod schema validation on all inputs
### 3. Privacy-First Design

Complete data sovereignty:

- All data stored locally in SQLite on your machine
- Core features work completely offline
- No cloud dependencies for essential functionality
- AI has read-only access to patient data
- Optional cloud AI for enhanced capabilities
- Local models available via Ollama for complete privacy
### 4. Therapeutic Progress Tracking

Quantifiable mental health insights:

- Emotion intensity tracking (0-10 scales)
- Automatic improvement score calculation
- CBT thought pattern identification
- Mood trend analysis across journal entries
- Progress visualization over time
### 5. Comprehensive Data Management

Single source of truth for mental health:

- Unified platform for all wellness data
- No context switching between apps
- Cross-referenced information (journals ↔ appointments ↔ medications)
- Complete audit trail with timestamps
- Data export capabilities
### 6. Intelligent Memory Architecture

Optimized for therapeutic conversations:

- Rolling 10-message buffer prevents context loss
- Auto-summarization preserves long conversation history
- Semantic pins extract key medical insights
- Crisis content automatically prioritized
- 30-second caching for session optimization
- Pre-built context before AI calls ensures accuracy

### 7. Flexible Knowledge Integration

Personalized medical knowledge base:

- Upload therapy guides, medical literature, personal resources
- Persona-specific dataset linking
- Weighted document importance
- Context-aware retrieval during conversations
- Access level controls (read, summary, reference-only)
---
## Conclusion

Luna respects your privacy, ensures data accuracy through structured services, and empowers you to maintain complete control over your mental health journey all while providing intelligent, contextually relevant support whenever you need it.

---

  