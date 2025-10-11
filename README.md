# 🏠 Kalito Space

**A Privacy-First Family Eldercare Management Platform**

> *Technology in service of family, dignity, and love.*

Kalito Space is a comprehensive eldercare management platform designed to help families provide the best possible care for their loved ones. Built with privacy, dignity, and family values at its core, this platform serves as your central hub for managing all aspects of eldercare.

## 🌟 Why Kalito Space?

Caring for aging parents is one of life's most important responsibilities. Kalito Space recognizes that eldercare involves complex coordination of medical information, schedules, medications, and multiple caregivers. Our platform brings everything together in one secure, family-friendly interface.

### ✨ Key Benefits
- **🔒 Complete Privacy**: All data stored locally - no cloud dependencies
- **👨‍⚕️ Professional Caregiver Tools**: Comprehensive scheduling and time tracking
- **🤖 AI-Powered Assistance**: Context-aware AI that understands your family's care situation
- **📱 Modern Interface**: Beautiful, intuitive design that works on all devices
- **🏥 Complete Care Management**: Patients, medications, appointments, and vitals in one place

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

### 📊 Vital Signs Monitoring
- Blood pressure, weight, and temperature tracking
- Health trend monitoring over time
- Date-stamped measurement records

### 👨‍⚕️ Caregiver Profile System
- Professional caregiver management
- Weekly availability scheduling
- Clock in/out time tracking
- Specialties and certifications tracking

### 🤖 AI-Powered Care Assistant
- Context-aware AI that knows your family's care situation
- Support for OpenAI, Anthropic (Claude), and local models
- Privacy-conscious with different context levels
- Intelligent care recommendations

## 🔧 Technology Stack

### Backend
- **Node.js + Express**: RESTful API server
- **TypeScript**: Type-safe development
- **SQLite**: Local database storage
- **AI Integration**: OpenAI, Anthropic, Local models

### Frontend  
- **Vue.js 3**: Modern reactive framework
- **TypeScript**: Type safety throughout
- **Vite**: Fast development and building
- **Responsive Design**: Works on all devices

## 📱 User Interface

### Dashboard
Navigate your family's care with six main sections:

- **👨‍⚕️ My Caregiver Profile** - Manage your professional caregiver information
- **👤 Add Patient** - Register new family members
- **👥 Saved Patients** - View and manage all patients
- **💊 Medications** - Track all medications and dosages
- **📅 Appointments** - Schedule and manage medical visits
- **📊 Vitals** - Monitor health metrics and trends

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
GET/POST   /api/patients          # Patient management
GET/POST   /api/medications       # Medication tracking  
GET/POST   /api/appointments      # Appointment scheduling
GET/POST   /api/vitals           # Vital signs monitoring
GET/POST   /api/caregivers       # Caregiver management
POST       /api/agents           # AI model interactions
GET/POST   /api/memory           # AI conversation memory
GET/POST   /api/sessions         # Chat sessions
```

## 🤖 AI Configuration

### Supported Models
- **OpenAI**: GPT-4, GPT-3.5 Turbo
- **Anthropic**: Claude 3.5 Sonnet, Claude 3 Haiku  
- **Local Models**: Ollama integration

### Environment Setup
```bash
# Optional - for AI features
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key

# Local models (Ollama)
OLLAMA_BASE_URL=http://localhost:11434
```

## 📖 Documentation

- **[Complete Overview](docs/Kalito-Space-Overview.md)** - Detailed platform documentation
- **[Database Documentation](docs/db-docs/)** - Database schema and operations
- **[AI Protocols](docs/ai/)** - AI integration and protocols

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
cd backend
npm run db:backup    # Backup database
npm run db:restore   # Restore from backup
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
- Check API keys in `.env` file
- Verify network connectivity for cloud models
- For local models, ensure Ollama is running

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

- 📖 [Read the Full Documentation](docs/Kalito-Space-Overview.md)
- 🐛 [Report Issues](https://github.com/Kalito-Labs/kalito-repo/issues)
- 💬 [Discussions](https://github.com/Kalito-Labs/kalito-repo/discussions)

*Kalito Space - Where technology meets family care.*