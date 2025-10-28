# 🏠 Kalito Space

**Your Personal AI Family Platform with Complete Eldercare Management**

> *Technology in service of family, dignity, and love.*

Kalito Space is a comprehensive AI-powered family platform that combines intelligent conversation, real-time internet search, and complete eldercare management. It's a Progressive Web App (PWA) that runs locally with complete privacy control, designed specifically for families managing complex care coordination.

Built for Aurora and Basilio Sanchez, this deeply personal tool has evolved into a full-featured family AI hub that grows with your needs.

## 📊 At a Glance

- **14 Database Tables**: 5 chat system + 9 eldercare management
- **13 Foreign Keys**: Full referential integrity with cascade deletes
- **11+ Performance Indexes**: Optimized queries for patient, date, and status lookups
- **11 API Routers**: Complete REST API for all operations
- **50+ Features**: From AI chat to medication adherence tracking
- **15,000+ Lines of Code**: Backend + Frontend in TypeScript
- **25+ Documentation Files**: Comprehensive technical documentation
- **6 Months Development**: Evenings and weekends of love and dedication
- **2 AI Models**: Cloud (GPT-4.1 Nano) and Local (Phi3 Mini)
- **1 Mission**: Take the best possible care of family

## 🌟 Why Kalito Space?

Unlike generic chatbots or cloud-based eldercare apps, Kalito Space provides:

- **Context-Aware AI**: The AI has full read access to your family database (patients, medications, appointments, vitals, caregivers)
- **Real-Time Search**: Integrated web search for current medical information, research, and news
- **Complete Privacy**: All data stored locally on your device - you control everything
- **Unified Platform**: Eldercare management + AI chat + internet search in one place
- **Extensible**: Built to grow with your family's changing needs

### ✨ Key Features
- **🤖 Intelligent AI Assistant**: GPT-4.1 Nano (cloud) or Phi3 Mini (local) with full family context
- **🔍 Web Search Integration**: AI can search the internet for current information
- **� Hybrid Memory System**: Recent messages + semantic pins + conversation summaries
- **🎭 Custom Personas**: Create specialized AI personalities for different tasks
- **👥 Patient Management**: Complete profiles with demographics and emergency contacts
- **💊 Medication Tracking**: Full medication management with adherence logs
- **� Appointment Scheduling**: Healthcare appointments with preparation notes and outcomes
- **📊 Vitals Tracking**: Weight and glucose monitoring over time
- **🏥 Medical Records**: Comprehensive documentation with attachments and tags
- **👨‍⚕️ Caregiver Management**: Professional caregiver scheduling and time tracking
- **� Complete Privacy**: Local storage with optional cloud AI (your choice)
- **📱 Progressive Web App**: Install on any device, works like a native app

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or pnpm
- Modern web browser

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Kalito-Labs/kalito-repo.git
   cd kalito-repo
   ```

2. **Install dependencies**
   ```bash
   # Install all dependencies for both frontend and backend
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy example environment file
   cp backend/.env.example backend/.env
   
   # Edit with your API keys (optional - works without AI)
   nano backend/.env
   ```

4. **Initialize the database**
   ```bash
   cd backend
   npm run build
   ```

5. **Start the development servers**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev
   
   # Terminal 2 - Frontend  
   cd frontend
   npm run dev
   ```

6. **Open your browser**
   ```
   http://localhost:5173/eldercare
   ```

## 🏗️ Project Structure

```
kalito-repo/
├── 📁 backend/                    # Node.js + Express + TypeScript API
│   ├── 📁 db/                    # SQLite database (14 tables)
│   │   ├── kalito.db            # Main database file
│   │   ├── db.ts                # Database connection
│   │   ├── init.ts              # Schema initialization
│   │   └── migrations/          # Database migrations
│   ├── 📁 logic/                # Business logic & AI services
│   │   ├── agentService.ts      # AI orchestration & tool calling
│   │   ├── memoryManager.ts     # Hybrid memory system
│   │   ├── eldercareContextService.ts  # Database-to-prompt conversion
│   │   ├── modelRegistry.ts     # AI model management
│   │   └── adapters/            # OpenAI & Ollama integrations
│   ├── 📁 routes/               # 11 API routers
│   │   ├── agentRouter.ts       # Chat completions
│   │   ├── sessionRouter.ts     # Session management
│   │   ├── memoryRouter.ts      # Memory & pins
│   │   ├── personasRouter.ts    # AI personas
│   │   ├── patientsRouter.ts    # Patient CRUD
│   │   ├── medicationsRouter.ts # Medication tracking
│   │   └── ...                  # And 5 more
│   ├── 📁 types/                # TypeScript interfaces
│   ├── 📁 middleware/           # Security, validation, errors
│   └── 📁 utils/                # Logging, contracts, helpers
├── 📁 frontend/                  # Vue 3 + TypeScript + Vite
│   ├── 📁 src/
│   │   ├── 📁 components/       # Vue components
│   │   │   ├── chat/           # ChatWorkspace, ChatPanel
│   │   │   ├── eldercare/      # Patient forms, lists
│   │   │   └── personas/       # PersonaManager
│   │   ├── 📁 views/           # Page views
│   │   │   ├── HomeView.vue    # Landing page
│   │   │   └── EldercareDashboard.vue  # Care management
│   │   ├── 📁 router/          # Vue Router config
│   │   ├── 📁 utils/           # Frontend utilities
│   │   └── core.ts             # API client & core logic
├── 📁 docs/                     # Comprehensive documentation
│   ├── 📁 overview/            # System documentation
│   │   ├── ks-overview.md      # Complete platform overview
│   │   └── backend/db/         # Database schema diagrams
│   └── 📁 00-Ai-Protocols/     # AI development guidelines
├── 📁 scripts/                  # Utility scripts
│   ├── backup-db               # Database backup
│   └── restore-db              # Database restore
└── 📁 backups/                  # Database backups
```

## 🎯 Core Features

### 🤖 AI Chat Interface - The Heart of Kalito Space

**Context-Aware Intelligence**:
- AI has full read access to family database (patients, medications, appointments, vitals, caregivers, providers)
- Hybrid memory system: recent messages + semantic pins + conversation summaries
- Auto-summarization after 15+ messages for efficient context management
- Importance scoring prioritizes relevant information

**Real-Time Web Search**:
- Integrated Tavily Search API for current information
- AI automatically decides when to search
- Visual feedback with animated "🔍 Searching online..." indicator
- Search medical info, news, research, and more

**Multiple AI Models**:
- **GPT-4.1 Nano** (cloud): Fast, function calling support, eldercare context
- **Phi3 Mini** (local): Privacy-first, offline capable, no data transmission

**Custom Personas**:
- Create specialized AI personalities
- Configure temperature, maxTokens, behavior
- Eldercare specialty focus (cardiology, neurology, etc.)
- Toggle patient context access per persona

### 👥 Patient Management
- Complete patient profiles with demographics
- Emergency contacts and insurance information
- Primary doctor and contact details
- Age calculation and relationship tracking
- Active/inactive status management
- Patient-specific session linking

### 💊 Medication Tracking
- Comprehensive medication lists (brand & generic names)
- Dosage, frequency, and route tracking
- Prescribing doctor and pharmacy information
- RX number and side effects documentation
- Active/inactive medication status
- **Medication adherence logs** with reminder tracking
- Status tracking (taken, missed, late, skipped)

### 📅 Appointment Scheduling
- Healthcare appointment management
- Provider linking and location tracking
- Appointment type categorization (routine, follow-up, specialist, emergency)
- **Preparation notes** (what to bring, special instructions)
- Status tracking (scheduled, completed, cancelled, rescheduled)
- **Post-appointment outcome summaries**
- Follow-up requirement flags

### 📊 Vitals Tracking
- Weight monitoring (kg)
- Blood glucose readings (AM and PM)
- Date-stamped entries with notes
- Patient-specific vital history
- Active/inactive status

### 🏥 Medical Records
- Comprehensive medical documentation
- 5 record types: diagnosis, treatment, test results, incidents, notes
- Provider and location tracking
- Importance scoring for prioritization
- JSON tag system for categorization
- JSON attachment support for documents

### 🏥 Healthcare Providers
- Provider contact directory
- Specialty and practice information
- Phone, email, and address tracking
- Provider notes and preferences
- Preferred provider designation

### 👨‍⚕️ Caregiver Management
- Professional caregiver profiles
- Contact information and emergency contacts
- Relationship and specialty tracking
- Weekly availability scheduling
- Clock in/out time tracking
- Hourly rate and total hours calculation
- Active/inactive status

### � Hybrid Memory System
- **Recent Messages**: Last 5-10 messages with importance scoring
- **Semantic Pins**: Key facts with medical categories and urgency levels
- **Conversation Summaries**: Auto-generated after 15+ messages
- **Smart Truncation**: Prioritizes pins > summaries > recent messages
- **Cache Management**: 5-second TTL for performance

### 📊 Session Management
- All conversations auto-saved
- Session types: chat, eldercare
- Patient-specific sessions
- Related record tracking
- Care category tagging
- AI-generated recaps
- Cascade delete (removes messages, pins, summaries)

## 🔧 Technology Stack

### Backend
- **Node.js 18+ with Express 5.1.0**: RESTful API server
- **TypeScript 5.0+**: Type-safe development
- **SQLite (better-sqlite3 12.2.0)**: Local database with 14 tables, 13 foreign keys, 11+ indexes
- **AI Integration**: 
  - OpenAI SDK 5.0.1 (GPT-4.1 Nano with function calling)
  - Tavily Search API (@tavily/core 0.5.12)
  - Ollama integration for local Phi3 Mini
- **Security**: Helmet 8.1.0, CORS, rate limiting (100/15min general, 20/15min AI)
- **Validation**: Zod 3.23.8 for runtime type checking
- **Logging**: Winston 3.17.0 with structured output

### Frontend  
- **Vue.js 3.5.13**: Modern reactive framework with Composition API
- **TypeScript 5.8.3**: Full type safety throughout
- **Vite 6.3.5**: Lightning-fast dev server and optimized builds
- **Vue Router 4.5.1**: Client-side routing
- **Shiki 3.9.2**: Syntax highlighting for code blocks in chat
- **VueUse Core 13.6.0**: Composable utilities
- **PWA Support**: Installable as native-like app

### Database (SQLite)
- **14 Tables**: 5 chat system + 9 eldercare management
- **13 Foreign Keys**: Full referential integrity with cascade deletes
- **11+ Indexes**: Optimized for patient queries, date ranges, status filters
- **Hybrid Design**: Chat tables extended with eldercare fields
- **Migration System**: Auto-initialization with schema versioning

## 📱 User Interface

### Pages & Routes
- **`/`** - Landing page with feature showcase
- **`/kalito`** - AI chat interface (ChatWorkspace)
- **`/personas`** - AI persona management
- **`/eldercare`** - Eldercare dashboard (care management)

### Eldercare Dashboard
Six main sections with modal-based workflows:

- **👨‍⚕️ My Caregiver Profile** - Widescreen modal for professional caregiver management
- **👤 Add Patient** - Patient registration with full demographics
- **👥 Saved Patients** - Patient list with detail modals (includes all related data)
- **💊 Medications** - Medication tracking organized by patient
- **📅 Appointments** - Calendar view with provider linking
- **🤖 AI Assistant** - Context-aware chat with family database access

### Chat Interface Features
- Real-time streaming responses with SSE
- Animated "🔍 Searching online..." indicator during web searches
- Code syntax highlighting with Shiki
- Markdown rendering (bold, italic, lists, code blocks)
- Token usage tracking
- Model and persona switching
- Session sidebar (desktop) or bottom tabs (mobile)
- Auto-save conversations

### Design System
- **Glassmorphism**: Frosted glass effects with backdrop blur
- **Color Palette**: Dark blue-gray background (#16161e) with purple-blue accents (#6e79c7)
- **Typography**: IBM Plex Sans, Barlow, Sora
- **Responsive**: Mobile-first with breakpoints at 768px and 1024px
- **Accessibility**: Touch-optimized, keyboard navigation, ARIA labels

## 🔒 Privacy & Security

### Privacy Architecture

**Local-First Design**:
- **All data stored locally**: SQLite database on your device
- **No cloud storage**: Family health data never leaves your control
- **Optional cloud AI**: Choose when to use cloud models (GPT-4.1 Nano)
- **Local AI option**: Phi3 Mini runs entirely on your device (100% private)

**What Goes to Cloud** (Optional - only if you choose cloud models):
- Questions sent to OpenAI GPT-4.1 Nano (with eldercare context for intelligent responses)
- Web search queries to Tavily API (no patient names or sensitive identifiers)
- AI responses back to your device

**What NEVER Leaves Your Device**:
- SQLite database file
- Raw patient records
- Conversation history (stored locally only)
- Medical history and personal health identifiers

### Security Features
- **Helmet.js**: XSS protection, CSP, HSTS security headers
- **CORS**: Restricted cross-origin access
- **Rate Limiting**: 100 req/15min general, 20 req/15min for AI endpoints
- **Request Timeouts**: 120s for AI, 30s for standard requests
- **Size Limits**: 10MB JSON payload protection
- **Input Validation**: Zod schema validation on all API requests
- **SQL Injection Protection**: Parameterized queries via better-sqlite3
- **Environment Variables**: API keys in .env (never committed)
- **Local Network Only**: Server bound to local IP, not internet-exposed

### Trust Model
- **Maximum Privacy**: Use Phi3 Mini (local) - nothing leaves your laptop
- **Trusted Cloud**: Use GPT-4.1 Nano - you control API key, context sent via HTTPS
- **Search Queries**: Generic searches without patient identifiers

## 🌐 API Endpoints

### Chat & AI System
```
POST   /api/agent                    # Chat completions (streaming/non-streaming)
POST   /api/agent/stream             # Streaming chat with SSE
GET    /api/sessions                 # List all sessions
POST   /api/sessions                 # Create new session
PUT    /api/sessions/:id             # Update session
DELETE /api/sessions/:id             # Delete session (cascade: messages, pins, summaries)
GET    /api/personas                 # List AI personas
POST   /api/personas                 # Create persona
PUT    /api/personas/:id             # Update persona
DELETE /api/personas/:id             # Delete persona
GET    /api/models                   # List available AI models
GET    /api/models/status            # Check model availability
GET    /api/memory/:sessionId/context  # Get full memory context
POST   /api/memory/pins              # Create semantic pin
GET    /api/memory/pins/:sessionId   # Get session pins
POST   /api/memory/summarize/:sessionId  # Trigger summarization
GET    /api/search                   # Web search (Tavily API)
```

### Eldercare Management
```
GET    /api/patients                 # List all patients
POST   /api/patients                 # Create patient
PUT    /api/patients/:id             # Update patient
DELETE /api/patients/:id             # Delete patient (cascade: all related records)
GET    /api/providers                # List healthcare providers
POST   /api/providers                # Create provider
PUT    /api/providers/:id            # Update provider
DELETE /api/providers/:id            # Delete provider
GET    /api/medications              # List medications
POST   /api/medications              # Create medication
PUT    /api/medications/:id          # Update medication
DELETE /api/medications/:id          # Delete medication (cascade: logs)
GET    /api/appointments             # List appointments
POST   /api/appointments             # Create appointment
PUT    /api/appointments/:id         # Update appointment
DELETE /api/appointments/:id         # Delete appointment
GET    /api/caregivers               # List caregivers
POST   /api/caregivers               # Create caregiver
PUT    /api/caregivers/:id           # Update caregiver
DELETE /api/caregivers/:id           # Delete caregiver
```

**Note**: Additional endpoints exist for medical records and vitals (may not be fully exposed in current API surface).

## 🤖 AI Configuration

### Supported Models
- **OpenAI GPT-4.1 Nano**: Fast, context-aware cloud model with function calling support
- **Phi3 Mini (Ollama)**: Privacy-first local model for offline operation

### Environment Setup
```bash
# Required for cloud AI features
OPENAI_API_KEY=your_openai_key

# Required for web search capability
TAVILY_API_KEY=your_tavily_key

# Local models (Ollama) - optional
OLLAMA_URL=http://localhost:11434
```

## 📖 Documentation

### Complete Documentation Set

- **[Kalito Space Overview](docs/overview/ks-overview.md)** (1,700+ lines)
  - Complete platform overview
  - Technical architecture deep dive
  - Feature explanations with examples
  - Development philosophy and lessons learned
  - Setup and deployment guide
  - Cost analysis and roadmap

- **[Database Schema Diagrams](docs/overview/backend/db/database-schema-diagrams.md)**
  - 10 comprehensive Mermaid diagrams
  - Complete ERD with all 14 tables
  - Chat system architecture
  - Eldercare system (patient-centric view)
  - Healthcare provider network
  - Medication management system
  - Memory & context system
  - Index optimization strategy
  - Cascade delete flows
  - Patient care workflow sequences

- **[Backend Logic Documentation](docs/Overview/logic/)**
  - 00-Logic-Overview.md - Business logic architecture
  - 01-agentService.md - AI orchestration (433 lines)
  - 02-eldercareContextService.md - Context building (753 lines)
  - 03-memoryManager.md - Hybrid memory (759 lines)
  - 04-modelRegistry.md - Model management
  - 05-openai-adapter.md - GPT-4.1 Nano integration
  - 06-ollama-adapter.md - Phi3 Mini integration
  - 07-strengths-and-improvements.md - Architecture analysis

- **[AI Development Protocols](docs/00-Ai-Protocols/)**
  - 01-Ai-Protocols.md - AI integration guidelines
  - 02-Self-Audit-Questions.md - Quality assurance

**Total Documentation**: 25+ comprehensive markdown files covering every aspect of the system.

## 🛠️ Development

### Build Commands
```bash
# Backend
cd backend
pnpm install     # Install dependencies
pnpm run build   # Compile TypeScript
pnpm run dev     # Development with nodemon auto-reload
pnpm start       # Production mode

# Frontend  
cd frontend
pnpm install     # Install dependencies
pnpm run dev     # Development server (port 5173)
pnpm run build   # Production build
pnpm run preview # Preview production build
```

### Database Management
```bash
# Backup database (from project root)
./scripts/backup-db
# Creates: backups/kalito.db.YYYY-MM-DD_HHMMSS.bak

# Restore database (from project root)
./scripts/restore-db backups/kalito.db.YYYY-MM-DD_HHMMSS.bak

# Inspect database
sqlite3 backend/db/kalito.db
.tables              # List all tables
.schema sessions     # Show table structure
SELECT * FROM patients;  # Query data
.quit                # Exit
```

### Development Workflow
1. Backend runs on `http://localhost:3000`
2. Frontend runs on `http://localhost:5173`
3. Frontend proxies API requests to backend
4. Database auto-initializes on first backend start
5. Hot reload enabled for both frontend and backend

## 🤝 Contributing

Kalito Space is a personal family project, but contributions that enhance family-centered eldercare are welcome:

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines
- **Privacy First**: Maintain local-first architecture, no mandatory cloud dependencies
- **Family Focused**: Features should enhance care coordination and family wellbeing
- **Type Safety**: Use TypeScript throughout, validate with Zod
- **Documentation**: Update docs for significant changes
- **Testing**: Test eldercare workflows manually, ensure data integrity
- **Accessibility**: Keep UI intuitive for all ages and technical skill levels
- **Code Quality**: Follow existing patterns, comment complex logic

### Areas for Contribution
- Additional AI tools (calculator, weather, calendar integration)
- Enhanced search features (domain filtering, caching)
- Mobile app (React Native or Capacitor)
- Medication/appointment reminders
- Report generation (PDF exports)
- Multi-language support
- Additional chart visualizations
- Accessibility improvements

## 🐛 Troubleshooting

### Common Issues

**Database Connection Issues**
```bash
# Reinitialize database
cd backend
rm db/kalito.db*  # Remove database files
pnpm run build    # Rebuild (auto-creates schema)
```

**Port Conflicts**
- Backend default: port 3000
- Frontend default: port 5173
- Ollama default: port 11434
- Check ports are available: `lsof -i :3000`
- Kill process: `kill -9 <PID>`

**AI Features Not Working**

*Cloud Models (GPT-4.1 Nano)*:
- Check `OPENAI_API_KEY` in backend/.env
- Verify API key is valid and has credits
- Check network connectivity
- Test: `curl https://api.openai.com/v1/models -H "Authorization: Bearer $OPENAI_API_KEY"`

*Local Models (Phi3 Mini)*:
- Ensure Ollama is running: `ollama serve`
- Check Phi3 is installed: `ollama list`
- Install if missing: `ollama pull phi3`
- Verify endpoint: `curl http://localhost:11434/api/tags`
- Check `OLLAMA_URL` in backend/.env (default: http://localhost:11434)

*Web Search*:
- Check `TAVILY_API_KEY` in backend/.env
- Verify API key is valid
- Free tier: 1,000 searches/month
- Test: Check /api/search endpoint

**Frontend Build Issues**
```bash
# Clear cache and rebuild
cd frontend
rm -rf node_modules .vite dist
pnpm install
pnpm run dev
```

**Backend TypeScript Errors**
```bash
# Rebuild TypeScript
cd backend
rm -rf dist
pnpm run build
```

**Module Not Found**
```bash
# Reinstall all dependencies (from project root)
rm -rf node_modules backend/node_modules frontend/node_modules
pnpm install
```

**Database Locked**
```bash
# Check for other processes
fuser backend/db/kalito.db
# Kill if needed
# Close any SQLite browser connections
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 💝 Acknowledgments

Built with love for Aurora and Basilio Sanchez, and families everywhere caring for aging parents.

**What Makes Kalito Space Different**:

**vs. Generic Chatbots** (ChatGPT, Claude):
- ✅ Kalito knows your family data (patients, medications, appointments)
- ✅ Conversations saved locally with full history
- ✅ Customizable personas for different needs
- ❌ ChatGPT has no context of your life, no data persistence

**vs. Eldercare Apps** (CareZone, Caring Village):
- ✅ Kalito has intelligent AI assistant with context
- ✅ Internet search integration
- ✅ Complete privacy (local storage)
- ✅ Open source and customizable
- ❌ Those apps are cloud-only, no AI intelligence

**vs. Local AI Tools** (Ollama alone):
- ✅ Kalito has structured eldercare database
- ✅ Complete care management workflow
- ✅ Web search capability
- ✅ Cloud model options for advanced features
- ❌ Ollama is just the model, no application

**The Value**:
- 6+ months of development done
- 15,000+ lines of code
- 50+ distinct features
- 14-table database with full relationships
- 25+ documentation files
- Proven architecture and patterns
- Ready to use, ready to extend

This platform represents the belief that technology should serve to enhance human connection and care, not replace it. Every line of code is an act of love, every feature a commitment to family wellbeing.

**Special recognition** to all family caregivers who dedicate their time, energy, and love to ensuring their parents receive the dignity and care they deserve.

---

## 🏠 About Kalito Space

**Personal Family Project**: Built specifically for Aurora and Basilio Sanchez by their son Caleb, Kalito Space is a deeply personal tool that evolved into a comprehensive family AI platform.

**Core Beliefs**:
- **Privacy by Design**: Your family's data belongs to you, stored locally
- **Human-Centered Technology**: Tools that enhance human relationships, not replace them
- **Accessibility**: Technology that works for everyone, regardless of technical skill
- **Family Values**: Solutions that honor family bonds and caregiving responsibilities
- **Extensible**: Platform grows with your family's changing needs

**What This Represents**:
- Technology in service of love
- Complete care coordination in one place
- Peace of mind through organization
- Confidence through accessible information
- Legacy of care and dignity

---

**Built with love for Aurora and Basilio Sanchez**

**Questions? Need Help?**

- 📖 [Read the Full Documentation](docs/overview/ks-overview.md)
- 📊 [View Database Schema Diagrams](docs/overview/backend/db/database-schema-diagrams.md)
- 🐛 [Report Issues](https://github.com/Kalito-Labs/kalito-repo/issues)
- 💬 [Discussions](https://github.com/Kalito-Labs/kalito-repo/discussions)

---

*Last Updated: October 28, 2025*

*Kalito Space - Where technology meets family care.*