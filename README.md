# Luna 🌙

**Personal Mental Health Companion & AI Practice Assistant**

Luna is your comprehensive mental health management platform combining personal wellness tracking with intelligent AI conversations. Built as a single-patient system focused on Kaleb's mental health journey, Luna provides medication tracking, appointment management, therapeutic journaling, and context-aware AI interactions—all with a modern purple gradient interface.

---

## 🎯 What Luna Does

### Mental Health Management
Luna serves as your digital mental health command center, tracking every aspect of your wellness journey:

- **Patient Profile** - Core demographic and contact information for Kaleb
- **Medication Tracking** - 4 active prescriptions (Lithium, Zyprexa, Hydroxizine, Naltrexone) with dosages, frequencies, pharmacy details, and side effects monitoring
- **Appointments** - Healthcare scheduling with preparation notes, outcomes, and follow-up tracking
- **Vitals Monitoring** - Weight (lbs) and glucose (AM/PM) tracking with historical trends
- **Journal System** - Daily therapeutic journaling with mood tracking, emotions tagging, and calendar visualization

### AI Companion System
The heart of Luna is its intelligent conversation system that understands your complete mental health context:

- **Contextual Conversations** - AI has full access to your medications, appointments, journal entries, and vitals
- **Therapeutic Personas** - Enhanced persona system with specialty fields (CBT, DBT, Mindfulness), therapeutic focus areas, and customizable color themes
- **Memory Architecture** - Industry-standard conversation memory with rolling buffers, automatic summarization, and semantic pin extraction
- **Multi-Model Support** - OpenAI GPT-4.1-nano (cloud) and Ollama (local) with intelligent model selection
- **Session Management** - Organized conversations with session types (chat, journal, medication), care categories, and patient linking

### Knowledge Integration
Luna can incorporate external medical knowledge through its dataset system:

- **Document Processing** - Upload PDFs and Word docs for AI reference
- **Chunked Storage** - Smart text splitting with vector embeddings for semantic search
- **Context-Aware Retrieval** - AI automatically pulls relevant dataset information during conversations
- **Permission Controls** - Fine-grained access levels per persona (read, summary, reference-only)

---

## 🏗️ Architecture Overview

### Tech Stack
```
Frontend: Vue 3 + TypeScript + Ionic Capacitor + Vite
Backend:  Node.js + Express + TypeScript
Database: SQLite with WAL mode
AI:       OpenAI GPT-4.1-nano, Anthropic Claude, Ollama local models
Search:   Tavily API for web search capabilities
```

### Database Structure (10 Tables)
**Mental Health Core:**
- `patients` - Patient profile (1 active: Kaleb)
- `medications` - Prescription tracking (4 active)
- `appointments` - Healthcare scheduling
- `journal_entries` - Therapeutic journaling with mood/emotion tracking
- `vitals` - Health metrics (weight, glucose)

**AI Conversation:**
- `sessions` - Chat session management with patient/care context
- `messages` - Individual conversation messages (4 messages in 1 active session)
- `personas` - AI personality configurations with therapeutic enhancements

**Memory System:**
- `conversation_summaries` - Compressed conversation history
- `semantic_pins` - Extracted important medical/therapeutic insights

### Key Features

#### 🎨 Modern UI/UX
- **Purple Gradient Theme** - Unified design system across all components
- **Glass-morphic Effects** - Backdrop blur, color saturation, subtle transparency
- **Responsive Design** - Desktop, tablet, and mobile optimized
- **Dark Mode Native** - Purple-tinted dark backgrounds throughout
- **Component Consistency** - Standardized styling for forms, cards, buttons, and inputs

#### 🤖 Intelligent Memory
- **Rolling Buffer** - Last 10 messages in active context (configurable)
- **Auto-Summarization** - Compresses conversation history after 8 messages
- **Semantic Pins** - Extracts important medical info (symptoms, medications, moods) with urgency levels
- **Context Building** - Pre-builds conversation context BEFORE sending to AI for accuracy
- **Importance Scoring** - Weighted message importance for better context selection

#### 🔐 Privacy & Security
- **Local-First** - All data stored in SQLite on your machine
- **No Cloud Dependencies** - Core features work completely offline
- **Read-Only AI** - AI can read your data but cannot modify it
- **Validation Layer** - Zod schemas validate all inputs
- **Rate Limiting** - API protection against abuse

#### 📊 Data Insights
- **Journal Calendar** - Visual mood/emotion tracking across days
- **Medication History** - Complete prescription timeline
- **Appointment Outcomes** - Track healthcare visit results
- **Vitals Trends** - Weight and glucose patterns over time

---

## 🗂️ Application Structure

### Frontend Views
```
/                    - Home with wellness quotes and navigation
/kalito              - Main chat workspace (ChatWorkspace.vue)
  ├─ ChatPanel       - Desktop conversation interface
  ├─ ChatPanelMobile - Mobile-optimized chat
  ├─ SessionSidebar  - Desktop session/persona management
  └─ SessionSidebarMobile - Mobile session settings

/journal             - Journal hub with calendar visualization
  ├─ /calendar       - Calendar view of journal entries
  └─ /entry/:id      - Individual journal entry view/edit

/kalitohub           - KalitoHub patient management
  ├─ PatientDetail   - Patient profile with tabs
  ├─ Medications     - Med list and form
  ├─ Appointments    - Appointment list and scheduling
  └─ Vitals          - Health metrics tracking

/library             - Document library and dataset management
```

### Backend API Routes
```
/api/agent           - AI conversation endpoints
/api/sessions        - Session CRUD and management
/api/messages        - Message history and retrieval
/api/memory          - Conversation summaries and semantic pins
/api/personas        - Persona management with therapeutic fields
/api/patients        - Patient profile operations
/api/medications     - Medication tracking
/api/appointments    - Appointment scheduling
/api/journal         - Journal entry CRUD
/api/vitals          - Vitals recording and history
/api/models          - AI model registry and configuration
/api/search          - Tavily web search integration
/api/datasets        - Document upload and vector search
/api/vector-search   - Semantic search across documents
```

### Core Services
```typescript
// Backend Logic Layer
agentService.ts              - AI conversation orchestration
memoryManager.ts             - Hybrid memory system implementation
lunaContextService.ts        - Patient data context builder for AI
modelRegistry.ts             - Multi-provider AI model management
queryRouter.ts               - Intelligent query routing and tool selection
structuredMedicationService  - Medication CRUD with validation
structuredAppointmentService - Appointment CRUD with validation
journalService.ts            - Journal operations
tavilyService.ts             - Web search integration
tools.ts                     - AI function calling tools
```

---

## 💾 Database State

### Current Data (November 22, 2025)
- **Patients**: 1 (Kaleb, age 39, Texas)
- **Medications**: 4 active prescriptions
- **Appointments**: 0 scheduled
- **Journal Entries**: 1 (Nov 21, mood: Relaxed)
- **Vitals**: Ongoing tracking
- **Personas**: 2 (default-cloud, default-local) with therapeutic enhancements
- **Active Sessions**: 1 with 4 conversation messages
- **Summaries**: 0 (generated as conversations grow)
- **Semantic Pins**: 0 (extracted automatically)

### Database Optimizations
- **WAL Mode** - Write-Ahead Logging for concurrent reads
- **Strategic Indexes** - 8 indexes for fast queries
- **Foreign Keys** - Cascade deletes, referential integrity
- **Soft Deletes** - `active` flags for data retention
- **Timestamps** - Full audit trail (created_at, updated_at)

---

## 🎭 Persona System

### Enhanced Therapeutic Features
Personas now include specialized mental health fields:
- `specialty` - Therapeutic approach (CBT, DBT, Mindfulness)
- `therapeutic_focus` - Focus areas (Anxiety, Depression, Trauma)
- `template_id` - Link to persona templates
- `tags` - JSON categorization
- `color_theme` - UI color customization (hex)
- `is_favorite` - Quick access flagging
- `usage_count` - Analytics tracking
- `last_used_at` - Usage timestamps
- `builtin_data_access` - Granular data permissions

### Default Personas
1. **default-cloud** (☁️) - Cloud-based assistant (GPT-4.1-nano)
   - Temperature: 0.7
   - Max Tokens: 1500
   - Focus: Versatile general support

2. **default-local** (⚡) - Privacy-focused local assistant (Ollama)
   - Temperature: 0.6
   - Max Tokens: 800
   - Focus: Offline, private conversations

---

## 🔧 Configuration

### Environment Setup
**Root `.env`:**
```bash
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-...
TAVILY_API_KEY=tvly-dev-...
VITE_KALITOSPACE_DEV_MODE=true
```

**Backend:**
- Port: 3000
- Database: `backend/db/kalito.db`
- Logging: Winston with file rotation

**Frontend:**
- Port: 5173 (dev)
- Build: Vite optimized bundle
- PWA: Service worker enabled

---

## 🚀 Development Workflow

### Running the App
```bash
# Terminal 1 - Backend
cd backend && pnpm dev

# Terminal 2 - Frontend  
cd frontend && pnpm dev

# Or use npm scripts from root:
pnpm run dev:backend
pnpm run dev:frontend
```

### Database Management
```bash
pnpm run db:backup        # Backup kalito.db
pnpm run db:restore       # Restore from backup
```

### Building for Production
```bash
# Frontend build
cd frontend && pnpm build

# Backend build
cd backend && pnpm build && pnpm start

# Android APK
pnpm run build-app        # Build + sync + generate APK
```

---

## 📱 Mobile Support

Luna is a hybrid app using Capacitor:
- **Android**: Full support (builds to APK)
- **iOS**: Configured but not actively developed
- **PWA**: Installable web app with offline support

### Android Build
```bash
pnpm run android:build    # Sync Capacitor
pnpm run android:apk      # Generate debug APK
pnpm run android:install  # Install on device via ADB
```

---

## 🎨 UI Design System

### Color Palette
- **Primary Purple**: `rgba(139, 92, 246)` - Buttons, borders, accents
- **Light Purple**: `rgba(196, 181, 253)` - Text gradients, labels
- **Indigo**: `rgba(129, 140, 248)` - Secondary actions, user messages
- **Dark Backgrounds**: `rgba(15, 23, 42, 0.95-0.98)` - Cards, modals
- **Glass Overlays**: `rgba(255, 255, 255, 0.04-0.06)` - Translucent layers

### Component Patterns
- **Border Radius**: 12-16px for modern rounded corners
- **Transitions**: `cubic-bezier(0.4, 0, 0.2, 1)` for smooth animations
- **Shadows**: Purple-tinted with varying intensities
- **Gradient Backgrounds**: Purple-tinted gradients across backgrounds
- **Glass-morphism**: `backdrop-filter: blur(20-30px) saturate(180%)`

### Key Components
- `HamburgerMenu.vue` - Global navigation (dark purple theme)
- `PatientDetailModal.vue` - Patient management (glass-morphic cards)
- `MedicationForm/List.vue` - Med tracking (purple filter buttons)
- `AppointmentForm/List.vue` - Appointment scheduling (status badges)
- `ChatPanel.vue` - Conversation interface (purple gradient input)
- `SessionSidebar.vue` - Session management (purple cards)
- `PersonaManager.vue` - Persona configuration (therapeutic fields)

---

## 📖 Documentation

### Database Docs
- `docs/db/01-DATABASE-SCHEMA.md` - Complete schema reference
- `docs/db/02-DATABASE-ARCHITECTURE.md` - Architecture and optimizations

### Implementation Docs
- `docs/00-Ai-Protocols/` - AI system protocols and guidelines
- `docs/Tasks/` - Development roadmap and task tracking

---

## 🎯 Current Focus

### Completed
✅ Purple gradient UI theme across all components
✅ Enhanced persona system with therapeutic fields
✅ Journal calendar visualization
✅ Medication and appointment tracking
✅ AI conversation with full patient context
✅ Memory system architecture (rolling buffer + summarization)
✅ Database optimization and cleanup
✅ Mobile-responsive design
✅ Dataset/document integration

### Active Development
🔄 Enhanced AI memory features (semantic pins in production)
🔄 Conversation summarization automation
🔄 Journal insights and analytics
🔄 Mood pattern analysis

### Planned
🔮 Medication reminder system
🔮 Appointment preparation workflows
🔮 Crisis intervention protocols
🔮 Advanced analytics dashboard
🔮 Export reports for healthcare providers

---

## 📊 Project Stats

- **Frontend Components**: 50+ Vue components
- **Backend Routes**: 13 API route groups
- **Database Tables**: 10 optimized tables
- **Active Indexes**: 8 performance indexes
- **Lines of Code**: ~15,000+ (TypeScript + Vue)
- **Dependencies**: Minimal, carefully selected
- **Bundle Size**: Optimized for fast loading

---

**Last Updated**: November 22, 2025  
**Version**: 1.2.0-beta  
**Status**: Production Ready with Active Development ✅

**Built with ❤️ for mental wellness**