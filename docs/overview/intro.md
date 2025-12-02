# Luna: Introduction & System Overview

**Document Version**: 1.2  
**Last Updated**: December 2, 2025  
**Status**: Active Documentation  
**Related Documents**: [Technical Architecture Deep Dive](./architecture.md)

---

## What is Luna?

Luna is a **comprehensive personal mental health companion and practice management system** designed as a single-patient application for tracking complete mental wellness journeys. It uniquely combines therapeutic data management with intelligent AI conversations that have full contextual awareness of the patient's mental health history.

Unlike traditional multi-user practice management systems, Luna is built for **depth over breadth**—providing a deeply personalized experience with rich contextual awareness that would be impossible in a standard multi-patient environment.

---

## Core Purpose & Philosophy

## Core Purpose & Philosophy

Luna serves as a **personal mental health command center** with these foundational principles:

1. **Integration Over Isolation** - Rather than separate tools for tracking medications, appointments, and conversations, Luna provides a unified platform where all mental health data informs AI interactions.

2. **Context-Aware Intelligence** - The AI doesn't just respond to questions—it understands your complete therapeutic history, current medications, recent journal entries, and ongoing CBT exercises.

3. **Privacy-First Design** - All data stored locally in SQLite. AI has read-only access. Core features work completely offline. You own your data.

4. **Hallucination Prevention** - Structured services handle factual data (medications, appointments) to ensure accuracy, while AI provides therapeutic support and analysis.

5. **Single-Patient Architecture** - Built for personal use (currently configured for Kaleb, age 39, Texas-based), enabling deeper personalization than multi-user systems.

---

## What Makes Luna Unique

### 1. Hybrid Mental Health Management + AI Companion

### 1. Hybrid Mental Health Management + AI Companion

Luna isn't just a chatbot or just a health tracker—it's both systems deeply integrated:

- **Full Context Access**: AI has complete read access to medications, appointments, journal entries, and CBT exercises
- **Therapeutically Relevant Conversations**: Discussions are informed by your actual mental health data
- **Privacy Protection**: All data stored locally in SQLite; AI cannot modify patient records
- **Seamless Experience**: Switch between data management and AI conversation without context loss

### 2. Single-Patient Architecture

Unlike traditional practice management systems designed for multiple patients:

- **Personalized for Kaleb**: Currently configured for one patient (age 39, Texas-based)
- **Name-Based Lookups**: Simple patient reference without complex multi-user overhead
- **Rich Context**: Deep integration possible because there's only one person's data to manage
- **Personal Tool**: Designed for individual use, not clinical practice management

### 3. Intelligent Memory System

Luna implements a sophisticated hybrid memory architecture:

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

#### 1. Patient Profile Management

Comprehensive demographic and medical history tracking:
- Core demographics (name, date of birth, gender, contact information)
- Location information (city, state)
- Occupation and occupation description
- Language preferences
- Medical notes and history
- Automatic age calculation from date of birth

#### 2. Medication Tracking

Full prescription management with structured validation (4 active prescriptions currently):

**Active Medications**:
- Lithium
- Zyprexa  
- Hydroxizine
- Naltrexone

**Tracking Features**:
- Dosage and frequency management
- Route of administration
- Prescribing doctor information
- Pharmacy details and RX numbers
- Side effects monitoring
- Comprehensive notes
- Structured validation to prevent AI hallucinations

#### 3. Appointment Management

Healthcare scheduling and tracking system:
- Appointment date/time scheduling
- Appointment type categorization
- Location tracking
- Status management (scheduled, completed, cancelled, no-show)
- Preparation notes for upcoming visits
- Outcome summaries post-appointment
- Follow-up requirement tracking
- Integration with AI for appointment discussions

#### 4. Therapeutic Journaling

Daily wellness tracking with rich metadata:

**Journal Features**:
- Free-form text entries with titles
- Entry date and time stamps
- Mood tracking (happy, sad, anxious, calm, etc.)
- Multiple emotion tagging per entry
- Journal type classification (free-form, prompted, gratitude, reflection)
- Prompt tracking for guided journaling
- Privacy level settings
- Favorite entry flagging
- Word count tracking
- Calendar visualization for pattern recognition

**Current State**: 5+ recent entries with mood/emotion tracking

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

**Current State**: 1 active CBT thought record

---

### AI Conversation System

#### 1. Multi-Model Support

Flexible AI provider integration:

**Cloud Models**:

**Cloud Models**:
- OpenAI GPT-4.1-nano (primary)
- Anthropic Claude (available)

**Local Models**:
- Ollama integration for offline privacy
- Full feature parity with cloud models
- No internet required for local model operation

**Model Registry**:
- Intelligent adapter selection
- Per-model configuration (temperature, tokens, etc.)
- Automatic fallback handling
- Streaming support for real-time responses

#### 2. Therapeutic Personas

Enhanced AI personality system with mental health focus:

**Core Features**:
- Custom system prompts for therapeutic contexts
- Template-based persona creation
- Tag categorization for organization
- Favorite marking for quick access
- Usage analytics (count, last used timestamp)
- Granular data access controls

**Configuration Options**:
- Temperature (creativity vs. consistency)
- Max tokens (response length)
- Top-P (sampling diversity)
- Repeat penalty (response variation)
- Stop sequences (output control)
- Default model assignment
- Suggested alternative models

**Default Personas**:
1. **Default Cloud Assistant** (☁️)
   - Temperature: 0.7
   - Max Tokens: 1500
   - Focus: Versatile general support
   - Category: Cloud

2. **Default Local Assistant** (⚡)
   - Temperature: 0.6
   - Max Tokens: 800
   - Focus: Privacy-focused offline conversations
   - Category: Local

#### 3. Session Management

Organized conversation tracking and history:

**Session Types**:
- Chat (general conversations)
- Journal (journal-focused discussions)
- Medication (prescription-related queries)

**Session Features**:
- Care category organization
- Patient linking for context
- Save/load functionality
- Session naming and recap
- Model tracking per session
- Timestamp tracking (created, updated)
- Message history retrieval

**Current State**: 1 active session with 4 messages

#### 4. Query Routing System

Intelligent query analysis for optimal response handling:

**Query Type Detection**:
- **Medication Queries**: Routes to structured medication service
- **Appointment Queries**: Routes to structured appointment service  
- **General Queries**: Routes to AI conversation system

**Hallucination Prevention**:
- Factual medical data handled by validated services
- AI bypassed for database-backed information
- Structured responses for appointments and medications
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

#### 4. Vector Search (Planned Enhancement)

Semantic search capabilities in development:

- Embedding generation for text chunks
- Similarity-based retrieval
- Semantic query matching
- Hybrid search (keyword + semantic)
- Relevance ranking

---

## Technical Architecture

### Database Layer (SQLite with WAL Mode)

**14 Tables** with strategic optimization:

**Core Tables**:
- `patients` - Patient profiles and demographics
- `sessions` - Conversation session management
- `messages` - Individual conversation messages with importance scoring
- `personas` - AI personality configurations

**Mental Health Tables**:
- `medications` - Prescription tracking with validation
- `appointments` - Healthcare scheduling and outcomes
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

**Data Management** (4 services):
- `structuredMedicationService.ts` - Medication CRUD with Zod validation
- `structuredAppointmentService.ts` - Appointment CRUD with validation
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

**Design System**:
- **Primary Purple**: `rgba(139, 92, 246)` - Buttons, borders, accents
- **Light Purple**: `rgba(196, 181, 253)` - Text gradients, labels
- **Indigo**: `rgba(129, 140, 248)` - Secondary actions, user messages
- **Dark Backgrounds**: `rgba(15, 23, 42, 0.95-0.98)` - Cards, modals
- **Glass Overlays**: `rgba(255, 255, 255, 0.04-0.06)` - Translucent layers
- **Border Radius**: 12-16px for modern rounded corners
- **Transitions**: `cubic-bezier(0.4, 0, 0.2, 1)` for smooth animations

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
- **Appointments**: 0 scheduled
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
The AI truly understands your complete mental health picture:
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

## Development & Deployment

### Technology Stack Summary
```
Frontend:  Vue 3 + TypeScript + Ionic + Capacitor + Vite
Backend:   Node.js + Express + TypeScript  
Database:  SQLite with WAL mode
AI:        OpenAI GPT-4.1-nano, Anthropic Claude, Ollama
Search:    Tavily API for web search
```

### Project Statistics
- **Total TypeScript Files**: 77 files (50+ backend, 27+ frontend)
- **Vue Components**: 33 components (10 views, 23 reusable components)
- **Backend Routes**: 12 API route groups
- **Database Tables**: 14 optimized tables
- **Active Indexes**: 8 performance indexes
- **Backend Services**: 15 core logic services
- **Documentation Files**: 9 markdown files
- **Lines of Code**: ~18,000+ (TypeScript + Vue)
- **Dependencies**: Minimal, carefully selected
- **Bundle Size**: Optimized for fast loading

### Running Luna
```bash
# Backend (Port 3000)
cd backend && pnpm dev

# Frontend (Port 5173)
cd frontend && pnpm dev

# Or from root
pnpm run dev:backend
pnpm run dev:frontend
```

### Building for Production
```bash
# Frontend build
cd frontend && pnpm build

# Backend build
cd backend && pnpm build && pnpm start

# Android APK
pnpm run build-app
```

### Database Management
```bash
pnpm run db:backup   # Backup kalito.db
pnpm run db:restore  # Restore from backup
```

---

## Documentation Structure

This document is part of Luna's comprehensive documentation (9 markdown files):

- **Overview Documentation** (`docs/overview/`)
  - `intro.md` - System introduction and overview (this document, 658 lines)
  - `architecture.md` - [Technical architecture deep dive](./architecture.md) (1100+ lines)
  
- **Resource Documentation** (`docs/resources/`)
  - `cbt.md` - Cognitive Behavioral Therapy guide
  - `act.md` - Acceptance & Commitment Therapy guide
  - `dbt.md` - Dialectical Behavior Therapy guide
  - `integrations.md` - Integration patterns and guidelines
  
- **AI Protocols** (`docs/00-Ai-Protocols/`)
  - AI system protocols and interaction guidelines
  
- **Root Documentation**
  - `README.md` - Project readme and getting started

### Document Hierarchy

```
luna-repo/
├── README.md             ← Project readme
├── docs/
│   ├── overview/
│   │   ├── intro.md          ← You are here (628 lines, high-level overview)
│   │   └── architecture.md   ← Technical deep dive (1100+ lines)
│   ├── resources/
│   │   ├── cbt.md           ← Cognitive Behavioral Therapy guide
│   │   ├── act.md           ← Acceptance & Commitment Therapy
│   │   ├── dbt.md           ← Dialectical Behavior Therapy
│   │   └── integrations.md  ← Integration patterns
│   └── 00-Ai-Protocols/
│       └── [AI interaction protocols]
├── backend/              ← 50+ TypeScript files
│   ├── db/              ← Database layer + migrations
│   ├── logic/           ← 15 services + adapters/
│   ├── routes/          ← 12 API routers
│   ├── middleware/      ← Security, validation, errors
│   ├── types/           ← Shared type contracts
│   ├── utils/           ← Logging, helpers
│   ├── scripts/         ← Development tools
│   ├── tests/           ← Test suites
│   └── uploads/         ← RAG documents (100+ files)
├── frontend/            ← 27+ TypeScript files, 33 Vue components
│   └── src/
│       ├── components/  ← 23 reusable components (5 subdirectories)
│       ├── views/       ← 10 route views
│       ├── router/      ← 12 routes configured
│       ├── composables/ ← Composition API utilities
│       └── utils/       ← Frontend utilities
├── scripts/             ← Utility scripts (backup-db, restore-db, update-icons)
├── backups/             ← Database backups
└── test-documents/      ← Sample RAG documents
```

**For Technical Implementation Details**: See [architecture.md](./architecture.md) for:
- **Repository Structure**: Complete file organization (77 TS files, 33 Vue components)
- **Backend Server Architecture**: Express setup, middleware stack, environment configuration
- **AI Conversation Flow**: Pre-context building pattern, streaming support
- **API Route Organization**: 12 route groups with detailed responsibilities
- **Memory & Context Management**: Hybrid memory, caching, importance scoring
- **Tool System**: Function calling architecture, Tavily search integration
- **Type System & Contracts**: Shared TypeScript types across frontend/backend
- **Frontend Architecture**: Vue 3 router, API client, component organization
- **Security Architecture**: Multi-layer defense, rate limiting, validation
- **Performance Optimizations**: Database indexes, caching strategies
- **Deployment Patterns**: Development, production, Android builds

---

## Future Roadmap

### Active Development
- Enhanced AI memory features (semantic pins in production)
- Conversation summarization automation
- ACT (Acceptance & Commitment Therapy) exercises
- DBT (Dialectical Behavior Therapy) skills tracking
- Journal insights and analytics
- Mood pattern analysis

### Planned Features
- Medication reminder system
- Appointment preparation workflows
- Crisis intervention protocols
- Advanced analytics dashboard
- Export reports for healthcare providers
- Vector search enhancement (embeddings + similarity matching)

---

## Conclusion

Luna represents a new paradigm in personal mental health management: a **unified platform where therapeutic data tracking and AI conversations are not separate features, but deeply integrated aspects of a single system**.

By combining comprehensive data management with context-aware AI, Luna provides insights and support that would be impossible with traditional chatbots or standalone tracking apps. Its single-patient architecture enables a level of personalization and contextual depth that multi-user systems cannot achieve.

Most importantly, Luna respects your privacy, ensures data accuracy through structured services, and empowers you to maintain complete control over your mental health journey—all while providing intelligent, contextually relevant support whenever you need it.

---

**Document Status**: ✅ Complete and Active  
**Version**: 1.2  
**Last Updated**: December 2, 2025  
**Changelog**: Updated with accurate repository statistics (77 TS files, 33 Vue components), detailed component organization, backend structure, and comprehensive documentation hierarchy  
**Maintained By**: Kalito Labs  
**Project Status**: Production Ready with Active Development  
**Related Documents**: [Technical Architecture](./architecture.md)