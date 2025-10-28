# 🏠 Kalito Space

**A Privacy-First Family Eldercare Management Platform**

> *Technology in service of family, dignity, and love.*

Kalito Space is a comprehensive eldercare management platform designed to help families provide the best possible care for their loved ones. Built with privacy, dignity, and family values at its core, this platform serves as your central hub for managing all aspects of eldercare.

## 🌟 Why Kalito Space?

Caring for aging parents is one of life's most important responsibilities. Kalito Space recognizes that eldercare involves complex coordination of medical information, schedules, medications, and multiple caregivers. Our platform brings everything together in one secure, family-friendly interface.

### ✨ Key Benefits
- **🔒 Complete Privacy**: All data stored locally - no cloud dependencies for data storage
- **👨‍⚕️ Professional Caregiver Tools**: Comprehensive scheduling and time tracking
- **🤖 AI-Powered Assistance**: Context-aware AI with eldercare database access and web search
- **📱 Modern Interface**: Beautiful, intuitive design that works on all devices
- **🏥 Complete Care Management**: Patients, medications, appointments, and vitals in one place
- **🔍 Real-Time Information**: Integrated web search for current medical and care information

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
├── 📁 backend/              # Node.js + Express API
│   ├── 📁 db/              # SQLite database & schemas
│   ├── 📁 logic/           # Business logic & AI services
│   ├── 📁 routes/          # API endpoints
│   ├── 📁 types/           # TypeScript interfaces
│   └── 📁 utils/           # Utilities & helpers
├── 📁 frontend/            # Vue.js 3 application
│   ├── 📁 src/
│   │   ├── 📁 components/  # Vue components
│   │   ├── 📁 views/       # Page views
│   │   ├── 📁 router/      # Vue Router config
│   │   └── 📁 utils/       # Frontend utilities
└── 📁 docs/               # Documentation
```

## 🎯 Core Features

### 👥 Patient Management
- Complete patient profiles with medical history
- Relationship tracking and emergency contacts
- Age calculation and demographic information

### 💊 Medication Tracking
- Comprehensive medication lists with dosages
- Patient-specific medication organization
- Frequency and administration tracking

### 📅 Appointment Scheduling
- Medical appointment management
- Healthcare provider information
- Appointment type categorization

### ‍⚕️ Caregiver Profile System
- Professional caregiver management
- Weekly availability scheduling
- Clock in/out time tracking
- Specialties and certifications tracking

### 🤖 AI-Powered Care Assistant
- Context-aware AI with full eldercare database access
- GPT-4.1 Nano (cloud) and Phi3 Mini (local) models
- Real-time web search integration via Tavily API
- Hybrid memory system (recent messages, pins, summaries)
- Customizable AI personas with temperature and behavior settings
- Privacy-conscious with local and cloud model options

### 🔍 Web Search Integration
- Real-time internet search capability
- Tavily API integration for current information
- Automatic tool calling - AI decides when to search
- Search medical information, news, research, and more

## 🔧 Technology Stack

### Backend
- **Node.js 18+ with Express 5.1.0**: RESTful API server
- **TypeScript 5.8.3**: Type-safe development
- **SQLite (better-sqlite3 12.2.0)**: Local database storage
- **AI Integration**: OpenAI SDK 5.0.1, Tavily Search API
- **Security**: Helmet 8.1.0, CORS, rate limiting

### Frontend  
- **Vue.js 3.5.13**: Modern reactive framework with Composition API
- **TypeScript 5.8.3**: Full type safety throughout
- **Vite 6.3.5**: Lightning-fast development and optimized builds
- **Shiki 3.9.2**: Syntax highlighting for code in chat
- **Responsive Design**: Works seamlessly on all devices

## 📱 User Interface

### Dashboard
Navigate your family's care with six main sections:

- **👨‍⚕️ My Caregiver Profile** - Manage your professional caregiver information
- **👤 Add Patient** - Register new family members
- **👥 Saved Patients** - View and manage all patients (includes vital signs tracking)
- **💊 Medications** - Track all medications and dosages
- **📅 Appointments** - Schedule and manage medical visits
- **� AI Assistant** - Context-aware chat with eldercare knowledge and web search

### Modal Design
- **Widescreen Caregiver Modal**: Comprehensive profile management
- **Responsive Patient Details**: Complete patient information at a glance
- **Intuitive Forms**: User-friendly data entry for all family members

## 🔒 Privacy & Security

### Local-First Architecture
- **No Cloud Storage**: All data remains on your device
- **Complete Control**: You own and control all family health data
- **Privacy by Design**: Built with family privacy as the top priority

### Security Features
- **Data Encryption**: All sensitive data encrypted
- **Secure Authentication**: Protected access to family information
- **Audit Trails**: Comprehensive logging for accountability

## 🌐 API Endpoints

```
# Core Chat & AI
POST       /api/agent            # AI chat completions (streaming/non-streaming)
GET/POST   /api/sessions         # Session management & persistence
GET/POST   /api/personas         # AI persona CRUD operations
GET        /api/models           # List available AI models
GET/POST   /api/memory           # Conversation memory (pins, summaries)
GET        /api/search           # Web search integration

# Eldercare Management
GET/POST   /api/patients         # Patient profiles (includes vitals)
GET/POST   /api/providers        # Healthcare provider directory
GET/POST   /api/medications      # Medication tracking  
GET/POST   /api/appointments     # Appointment scheduling
GET/POST   /api/caregivers       # Caregiver management
```

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

- **[Complete Platform Overview](docs/overview/ks-overview.md)** - Comprehensive technical documentation
- **[AI Development Protocols](docs/00-Ai-Protocols/)** - AI integration guidelines and best practices

For more information, explore the `/docs` directory in this repository.

## 🛠️ Development

### Build Commands
```bash
# Backend
cd backend
npm run build    # Compile TypeScript
npm run dev      # Development with auto-reload
npm start        # Production mode

# Frontend  
cd frontend
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview production build
```

### Database Management
```bash
# Backup database (from project root)
./scripts/backup-db

# Restore database (from project root)
./scripts/restore-db
```

## 🤝 Contributing

We welcome contributions that align with our mission of family-centered eldercare:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines
- Maintain the privacy-first architecture
- Ensure all features enhance family care coordination
- Write comprehensive tests for new functionality
- Follow TypeScript best practices
- Keep the interface intuitive for all age groups

## 🐛 Troubleshooting

### Common Issues

**Database Connection Issues**
```bash
# Reinitialize database
cd backend
rm db/kalito.db*
npm run build
```

**Port Conflicts**
- Backend runs on port 3000
- Frontend runs on port 5173
- Ensure these ports are available

**AI Features Not Working**
- Check API keys in `.env` file (OPENAI_API_KEY, TAVILY_API_KEY)
- Verify network connectivity for cloud models and web search
- For local models, ensure Ollama is running: `ollama serve`
- Check Ollama has Phi3 Mini installed: `ollama list`

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 💝 Acknowledgments

Built with love for families everywhere who are caring for their aging parents. This platform represents our belief that technology should serve to enhance human connection and care, not replace it.

Special recognition to all family caregivers who dedicate their time, energy, and love to ensuring their parents receive the dignity and care they deserve.

---

## 🏠 About Kalito Labs

Kalito Labs is dedicated to building technology that strengthens families and communities. We believe in:

- **Privacy by Design**: Your family's data belongs to you
- **Human-Centered Technology**: Tools that enhance human relationships
- **Accessibility**: Technology that works for everyone
- **Family Values**: Solutions that honor family bonds and responsibilities

---

**Questions? Need Help?**

- 📖 [Read the Full Documentation](docs/overview/ks-overview.md)
- 🐛 [Report Issues](https://github.com/Kalito-Labs/kalito-repo/issues)
- 💬 [Discussions](https://github.com/Kalito-Labs/kalito-repo/discussions)

*Kalito Space - Where technology meets family care.*