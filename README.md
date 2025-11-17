# Luna 🌙

**A Mental Health Companion Platform**

Luna is a personal mental health companion designed to support individuals in managing their mental wellness journey. Built with Vue.js, Node.js, and SQLite, Luna provides a secure, privacy-focused platform for tracking medications, appointments, and engaging in therapeutic conversations with AI assistants.

![Luna Platform](https://img.shields.io/badge/Platform-Mental%20Health%20Companion-blue)
![Status](https://img.shields.io/badge/Status-Production%20Ready-green)
![Database](https://img.shields.io/badge/Database-Cleaned%20%26%20Optimized-success)
![Conversation System](https://img.shields.io/badge/AI%20Memory-Industry%20Standard-brightgreen)

## ✨ Features

### 🧠 Mental Health Management
- **Personal Profile**: Comprehensive patient information focused on mental health needs
- **Medication Tracking**: Detailed prescription management with doctor and pharmacy information
- **Appointment Scheduling**: Healthcare appointment tracking with preparation notes and outcomes
- **Journal System**: Daily journaling with mood and emotion tracking for therapeutic insights
- **Treatment History**: Complete medical timeline for informed care decisions

### 🤖 AI Companion System
- **Intelligent Conversations**: Multi-turn conversations with context continuity
- **Persona Customization**: Cloud and local AI assistant variants
- **Memory Management**: Industry-standard conversation memory architecture
- **Full Context Access**: AI has access to patient data, medications, appointments, and journal entries
- **Therapeutic Focus**: AI trained specifically for mental health support with journaling insights

### 🔒 Privacy & Security
- **Local Data**: All personal data stored locally in SQLite database
- **No Cloud Dependencies**: Core functionality works offline
- **Secure Architecture**: Industry-standard security practices
- **Data Ownership**: Complete user control over personal information

### 📱 Modern Interface
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Intuitive UI**: Clean, accessible interface optimized for daily use
- **Real-time Updates**: Instant synchronization across all features
- **Print Support**: Generate printable reports for healthcare providers

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   Vue.js + TS   │◄──►│  Node.js + TS   │◄──►│     SQLite      │
│                 │    │                 │    │                 │
│ • Patient UI    │    │ • REST API      │    │ • Patient Data  │
│ • Med Tracking  │    │ • AI Service    │    │ • Conversations │
│ • Appointments  │    │ • Memory Mgmt   │    │ • AI Memory     │
│ • Journaling    │    │ • Validation    │    │ • Journal Data  │
│ • Chat Interface│    │ • Context Gen   │    │ • Audit Logs    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Core Technologies
- **Frontend**: Vue.js 3, TypeScript, Ionic Capacitor, Vite
- **Backend**: Node.js, Express, TypeScript, ts-node
- **Database**: SQLite with WAL mode for optimal performance
- **AI Integration**: OpenAI GPT-4.1-nano, Ollama (local models)
- **Development**: PNPM workspace, ESLint, Nodemon

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PNPM (recommended) or NPM
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Kalito-Labs/luna-repo.git
cd luna-repo
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Set up environment variables**
```bash
# Backend environment
cp backend/.env.example backend/.env
# Add your OpenAI API key and other configurations
```

4. **Initialize the database**
```bash
cd backend
pnpm run dev  # This will auto-initialize the database
```

5. **Start development servers**

Frontend (in one terminal):
```bash
cd frontend
pnpm run dev
```

Backend (in another terminal):
```bash
cd backend
pnpm run dev
```

6. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## 📊 Database Schema

Luna uses a carefully designed SQLite database with 10 optimized tables:

### Core Data
- **`patients`** - Personal profile information (mental health focused)
- **`medications`** - Prescription tracking with complete details
- **`appointments`** - Healthcare scheduling and outcomes
- **`journal_entries`** - Daily journaling with mood and emotion tracking

### AI System
- **`sessions`** - Chat conversation management
- **`messages`** - Individual conversation messages
- **`personas`** - AI assistant personality configurations

### Memory System
- **`conversation_summaries`** - Compressed conversation history
- **`semantic_pins`** - Important information extraction

### Status: ✅ **PERFECTLY CLEAN** 
All eldercare legacy removed, optimized for mental health use case with integrated journaling system.

[View detailed schema documentation →](docs/db/DB-SCHEMA.md)

## 🤖 AI Conversation System

Luna implements an industry-standard conversation memory architecture:

### Features
- **Context Continuity**: Maintains conversation flow across multiple exchanges
- **Smart Memory**: Automatic summarization and important information extraction
- **Full Patient Context**: AI has access to medications, appointments, and journal entries
- **Journal Integration**: AI can discuss and provide insights on your journal entries
- **Mood Pattern Recognition**: AI identifies emotional patterns from journaling history
- **Persona System**: Customizable AI personalities for different interaction styles
- **Performance Optimized**: Pre-built context passing for fast response times

### Architecture Highlights
```typescript
// Industry Standard Pattern
1. Build context from existing messages (BEFORE saving current input)
2. Save user message to database  
3. Pass pre-built context + current input to AI
4. Save AI response with metadata
```

[View conversation fix documentation →](docs/fixes/conversation-context-continuity-fix.md)

## 📁 Project Structure

```
luna-repo/
├── frontend/                 # Vue.js application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── views/           # Page components
│   │   ├── composables/     # Vue composition functions
│   │   ├── router/          # Vue Router configuration
│   │   └── utils/           # Utility functions
│   ├── android/             # Capacitor Android build
│   └── public/              # Static assets
├── backend/                 # Node.js API server
│   ├── logic/               # Core business logic
│   │   ├── agentService.ts  # AI conversation management
│   │   ├── memoryManager.ts # Conversation memory system
│   │   └── modelRegistry.ts # AI model configuration
│   ├── routes/              # Express route handlers
│   ├── middleware/          # Express middleware
│   ├── types/               # TypeScript type definitions
│   ├── db/                  # Database setup and migrations
│   └── tests/               # Backend test suite
├── docs/                    # Documentation
│   ├── db/                  # Database documentation
│   └── fixes/               # Technical fix documentation
└── scripts/                 # Utility scripts
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
pnpm test                    # Run all tests
pnpm test:watch             # Watch mode
pnpm test:coverage          # Coverage report
```

### Frontend Tests
```bash
cd frontend  
pnpm test                   # Run component tests
pnpm test:e2e              # End-to-end tests
```

## 📱 Mobile Development

Luna supports mobile deployment through Capacitor:

### Android Build
```bash
cd frontend
pnpm run build
npx cap sync android
npx cap open android
```

### iOS Build
```bash
cd frontend  
pnpm run build
npx cap sync ios
npx cap open ios
```

## 🔧 Configuration

### Environment Variables

**Backend (.env)**
```env
# Database
DATABASE_PATH=./db/kalito.db

# AI Configuration
OPENAI_API_KEY=your_openai_key_here
OPENAI_BASE_URL=https://api.openai.com/v1
DEFAULT_MODEL=gpt-4.1-nano

# Server
PORT=3000
NODE_ENV=development

# Security
RATE_LIMIT_ENABLED=true
CORS_ORIGINS=http://localhost:5173
```

**Frontend (environment files)**
```env
VITE_API_BASE_URL=http://localhost:3000
VITE_APP_NAME=Luna
```

### AI Model Configuration

Luna supports multiple AI providers:
- **OpenAI**: GPT-4.1-nano (cloud, high quality)
- **Ollama**: Local models (privacy-focused, offline)

Configure models in `backend/logic/modelRegistry.ts`

## 🛠️ Development

### Available Scripts

**Root Project**
```bash
pnpm install              # Install all dependencies
pnpm run lint             # Lint all code
pnpm run format           # Format all code
```

**Backend**
```bash
pnpm run dev              # Start development server
pnpm run build            # Build production bundle
pnpm run test             # Run test suite
pnpm run lint             # Lint backend code
```

**Frontend**
```bash
pnpm run dev              # Start development server
pnpm run build            # Build production bundle
pnpm run preview          # Preview production build
pnpm run test             # Run component tests
```

### Database Management

```bash
# Backup database
./scripts/backup-db

# Restore from backup  
./scripts/restore-db <backup-file>

# Database audit (check for issues)
cd backend && node dist/scripts/audit-database.js
```

## 📖 Documentation

### Available Documentation
- **[Database Schema](docs/db/DB-SCHEMA.md)** - Complete database documentation
- **[Conversation Fix](docs/fixes/conversation-context-continuity-fix.md)** - AI memory architecture fix
- **[Database Instructions](docs/db/db-instructions.md)** - Database setup and maintenance
- **[API Documentation](backend/types/)** - TypeScript API contracts

### Key Features Documented
- ✅ Database schema and relationships
- ✅ AI conversation memory system  
- ✅ Frontend-backend integration
- ✅ Security and validation patterns
- ✅ Performance optimizations

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes with proper TypeScript types
4. Add tests for new functionality
5. Run linting and tests: `pnpm run lint && pnpm test`
6. Commit with conventional commits: `git commit -m "feat: add amazing feature"`
7. Push to your branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

### Code Standards
- **TypeScript**: Strict mode enabled, full type coverage required
- **ESLint**: Enforced code quality and consistency
- **Conventional Commits**: Required for clear history
- **Test Coverage**: New features must include tests
- **Documentation**: Update relevant docs with changes

## 📋 Roadmap

### ✅ Completed
- Core patient management system
- Medication and appointment tracking
- **Journal system with mood and emotion tracking**
- **AI context integration with journal entries**
- AI conversation system with context continuity
- Database cleanup and optimization
- Mobile app foundation

### 🔄 In Progress
- Enhanced AI memory system (summarization, semantic pins)
- Advanced appointment preparation workflows
- Medication reminder system
- Journal analytics and insights dashboard

### 🔮 Planned
- **Enhanced AI Features**
  - Advanced mood tracking analytics
  - Therapy session preparation
  - Crisis intervention protocols
  - Goal setting and progress tracking
  - Journal sentiment analysis

- **Platform Expansion**
  - iOS app deployment
  - Offline-first enhancements
  - Healthcare provider integration
  - Family caregiver features

- **Analytics & Insights**
  - Mental health trend analysis from journal patterns
  - Medication adherence tracking
  - Appointment outcome correlation
  - Personalized wellness recommendations

## 🏥 Use Cases

### Primary Users
- **Individuals managing mental health conditions**
- **Caregivers supporting loved ones**
- **Patients preparing for therapy sessions**
- **Anyone seeking structured mental wellness support**

### Key Scenarios
- **Daily Check-ins**: Regular conversations with AI companion
- **Journaling**: Track moods, emotions, and thoughts with calendar view
- **AI Reflection**: Discuss journal entries with AI for therapeutic insights
- **Medication Management**: Track prescriptions and side effects
- **Appointment Preparation**: Organize questions and concerns
- **Progress Tracking**: Monitor mental health journey over time through journaling
- **Crisis Support**: Immediate access to coping strategies

## 📞 Support

### Getting Help
- **Documentation**: Check the [docs/](docs/) directory first
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Use GitHub Discussions for questions
- **Security**: Email security issues to security@kalito-labs.com

### System Requirements
- **Minimum**: Node.js 18+, 2GB RAM, 1GB storage
- **Recommended**: Node.js 20+, 4GB RAM, 5GB storage
- **Mobile**: Android 7+ or iOS 12+

## 🔐 Security & Privacy

### Data Security
- **Local Storage**: All personal data stored locally
- **Encryption**: Sensitive data encrypted at rest
- **Access Control**: Role-based permissions
- **Audit Logs**: Complete activity tracking

### Privacy Commitment
- **No Data Collection**: Personal information never leaves your device
- **Optional Cloud**: AI features use only necessary context
- **User Control**: Complete data ownership and deletion rights
- **Transparency**: Open source for full visibility

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Mental Health Community** - For inspiring this platform's mission
- **Open Source Contributors** - For the incredible tools that make this possible
- **Healthcare Professionals** - For guidance on therapeutic best practices
- **Beta Testers** - For valuable feedback and real-world testing

---

<div align="center">

**Luna 🌙 - Your Mental Health Companion**

*Building bridges between technology and mental wellness*

[🌟 Star this repo](https://github.com/Kalito-Labs/luna-repo) | [🐛 Report Bug](https://github.com/Kalito-Labs/luna-repo/issues) | [💡 Request Feature](https://github.com/Kalito-Labs/luna-repo/discussions)

</div>

---

**Last Updated**: November 17, 2025  
**Version**: 1.1.0-beta  
**Status**: Production Ready ✅