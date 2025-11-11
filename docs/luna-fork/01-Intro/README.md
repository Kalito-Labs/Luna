# 🌙 Project Luna# 🌙 Project Luna

  
  
  

**My Personal Mental Health Companion****My Personal Mental Health Companion**

  
  
  

> _"What lies behind us and what lies before us are tiny matters compared to what lies within us."_ — Ralph Waldo Emerson> _"What lies behind us and what lies before us are tiny matters compared to what lies within us."_ — Ralph Waldo Emerson

  
  
  

Luna is my personal mental health management app built for tracking bipolar disorder, managing recovery, and having meaningful conversations with AI companions who understand my journey.Luna is my personal mental health management app built for tracking bipolar disorder, managing recovery, and having meaningful conversations with AI companions who understand my journey.

  
  
  

------

  
  
  

## ✨ What Luna Does## What Luna Does

  
  
  

Luna provides a comprehensive suite of mental health tools accessible through a clean, intuitive interface:- **📔 Journaling**: Write freely with AI-powered theme analysis

  

  

### 🏠 **Home**- **📊 Mood Tracking**: Monitor mood, energy, anxiety, sleep, and triggers

  

- Inspirational quotes and daily affirmations

  

- Quick access to all features- **🎯 Recovery Goals**: Set and track goals with progress monitoring

  

- Clean, welcoming landing page

  

- **💊 Medication Tracking**: Log medications and track adherence

  

### 💬 **Chat (Luna AI)**

  

- Empathetic AI companion with crisis detection- **🛠️ Coping Strategies**: Build a personal toolkit of what works

  

- Access to recent journal entries and mood patterns

  

- Customizable personas for different support styles- **🧘 Mindfulness**: Guided meditation and grounding practices

  

- Real-time web search via Tavily API (optional)

  

- **📚 Resources**: Recovery literature (AA/NA/CBT/DBT)

  

### 📓 **Journal**

  

- Write-first composer with distraction-free writing- **💬 Luna AI**: Empathetic AI companion with crisis detection

  

- Split-view mode for reviewing past entries while writing

  

- AI-powered theme analysis and emotional insights- **🔒 Private**: All data stays local on my device

  

- Word count threshold (20 words) before reflection phase

  

- Auto-save with draft management

  

- Query journal entries by prompt---

  
  
  

### 💭 **Reflect (Therapeutic Prompts)**## Why I Built This

  

- 21 guided prompts across 7 categories:

  

- General (3 prompts)Generic mental health apps don’t fit my needs. Luna is tailored to my journey with bipolar disorder and recovery. Every feature exists because I need it. The AI can be customized to provide exactly the kind of support that helps me. Everything stays on my machine — no cloud storage, complete privacy.

  

- Feelings (3 prompts)

  

- Gratitude (3 prompts)---

  

- Goals (3 prompts)

  

- Reflection (3 prompts)## Getting Started

  

- Challenges (3 prompts)

  

- Relationships (3 prompts)### Prerequisites

  

- Category filtering with prompt counts

  

- Direct integration with journal (click to write)- Node.js 18+

  

  

### 🛠️ **Coping Strategies**- pnpm (or npm)

  

- 15 evidence-based techniques from DBT, CBT, and mindfulness traditions:

  

- **Crisis**: TIPP Skills, 5-4-3-2-1 Grounding, STOP Skill

  

- **Breathing**: Box Breathing, 4-7-8 Breathing### Setup

  

- **Distress Tolerance**: ACCEPTS, IMPROVE the Moment, Radical Acceptance

  

- **Emotional Regulation**: Opposite Action```bash

  

- **Mindfulness**: Body Scan, Walking Meditation, Loving-Kindness# Install dependencies

  

- **Physical**: Progressive Muscle Relaxationpnpm install

  

- **Social**: Reach Out for Support

  

- Searchable by name, description, or tags# Start backend (Terminal 1)

  

- Expandable cards with step-by-step instructionscd backend && npm run dev

  

- Difficulty levels (Beginner, Intermediate, Advanced)

  

- "Best Used For" guidance and tips# Start frontend (Terminal 2)

  

cd frontend && npm run dev

  

### 🧘 **Mindfulness**

  

- 12 guided practices across 5 categories:# Open in browser

  

- **Meditation**: Mindful Breathing, Loving-Kindness, Open Awarenesshttp://localhost:5173

  

- **Breathing**: 4-7-8, Box Breathing, Alternate Nostril```

  

- **Body Scan**: Full Body Scan, Progressive Muscle Relaxation

  

- **Movement**: Walking Meditation, Mindful Movement FlowThe database initializes automatically on first run.

  

- **Visualization**: Safe Place, Healing Light

  

- Interactive timer with circular progress visualization---

  

- Phase tracking (e.g., Settling → Practice → Integration)

  

- Pause/Resume/Stop session controls## Current Status

  

- Duration tracking with completion alerts

  

✅ **Complete:**

  

### 👤 **Personas**

  

- Customizable AI personalities for different support needs- Mental Health Dashboard with overview stats

  

- Manage multiple personas with unique traits

  

- Switch between personas during conversations- AI Chat with Luna (GPT-4.1 Nano or local Phi3)

  

  

### 📚 **Resources**- Journaling with AI theme analysis

  

- Recovery literature library (AA/NA/CBT/DBT)

  

- Future: EPUB/PDF content management- Mood tracking modal

  

- Placeholder for comprehensive wellness library

  

- Goals management modal

  

---

  

- Inspirational quotes on home screen

  

## 🎨 Key Features

  

- Database (13 tables, 6 API routers)

  

### **Full-Width Responsive Design**

  

- All views expand to fill available screen width

  

- Automatic grid reflow based on viewport size🚧 **In Progress:**

  

- Mobile-first responsive CSS with smooth breakpoints

  

- No artificial width constraints- Medication tracking modal

  

  

### **Consistent Navigation**- Coping strategies toolkit

  

- Hamburger menu accessible from every view

  

- Sticky headers with glassmorphism effects- Mindfulness practices

  

- Mobile-optimized button sizing

  

- Z-index managed for proper overlay behavior- Resources library (AA/NA/CBT/DBT)

  

  

### **Modern UI/UX**

  

- Glassmorphism dark theme with purple accents (#8b5cf6)---

  

- Smooth transitions and hover effects

  

- Card-based layouts with expandable details## Tech Stack

  

- Category filtering with visual counts

  

- Search functionality where appropriate**Backend:**

  
  
  

### **Privacy-First Architecture**- Node.js + Express + TypeScript

  

- **Local-first**: SQLite database lives locally

  

- **No cloud storage**: Conversations and raw journal data never leave device- SQLite (local storage, better-sqlite3)

  

- **Optional cloud AI**: GPT-4.1 Nano (via HTTPS)

  

- **Local AI**: Phi3 Mini runs entirely on your device- OpenAI SDK for AI chat

  

- **Security**: Helmet.js, CORS, rate limiting, input validation, parameterized queries

  
  
  

---**Frontend:**

  
  
  

## 🚀 Getting Started- Vue 3 + TypeScript + Composition API

  

  

### Prerequisites- Vite for development

  

  

- Node.js 18+- Glassmorphism UI design

  

- pnpm (or npm)

  

- Modal-based architecture

  

### Setup

  
  
  

```bash**AI:**

  

# Install dependencies

  

pnpm install- GPT-4.1 Nano (cloud) or Phi3 Mini (local)

  

  

# Start backend (Terminal 1)- Access to recent journal entries, mood patterns, goals, and crisis indicators

  

cd backend && npm run dev

  

- Real-time web search via Tavily API (optional)

  

# Start frontend (Terminal 2)

  

cd frontend && npm run dev

  

**Storage:**

  

# Open in browser

  

http://localhost:5173- SQLite database stored locally

  

```

  

- No cloud storage for raw data or conversations

  

The database initializes automatically on first run.

  
  
  

------

  
  
  

## 📁 Project Structure## Project Structure

  
  
  

``````

  

Luna/Luna/

  

├── backend/ # Express + TypeScript API├── backend/ # Express + TypeScript API

  

│ ├── db/ # SQLite database (13 tables)│ ├── db/ # SQLite database (13 tables)

  

│ │ ├── db.ts # Database connection│ ├── logic/ # AI & memory systems

  

│ │ └── init.ts # Schema initialization│ ├── routes/ # API endpoints

  

│ ├── logic/ # AI & memory systems│ └── types/ # TypeScript types

  

│ │ ├── agentService.ts # AI agent orchestration├── frontend/ # Vue 3 + TypeScript

  

│ │ ├── memoryManager.ts # Context management│ ├── components/ # Chat, wellness modals

  

│ │ ├── mentalHealthContextService.ts│ ├── views/ # Dashboard, journal, home

  

│ │ ├── modelRegistry.ts # AI model configuration│ └── utils/ # Quotes, helpers

  

│ │ ├── tavilyService.ts # Web search integration├── db/ # SQLite database file

  

│ │ └── tools.ts # AI function calling├── scripts/ # Backup/restore scripts

  

│ ├── routes/ # API endpoints (9 routers)└── docs/ # Documentation & notes

  

│ │ ├── agentRouter.ts```

  

│ │ ├── copingRouter.ts

  

│ │ ├── journalRouter.ts---

  

│ │ ├── memoryRouter.ts

  

│ │ ├── mindfulnessRouter.ts## Database Backups

  

│ │ ├── modelsRouter.ts

  

│ │ ├── personasRouter.ts```bash

  

│ │ ├── resourcesRouter.ts# Backup

  

│ │ ├── searchRouter.ts./scripts/backup-db

  

│ │ └── sessionRouter.ts

  

│ ├── types/ # TypeScript type definitions# Restore

  

│ └── utils/ # Logging, validation, helpers./scripts/restore-db backups/kalito.db.YYYY-MM-DD_HHMMSS.bak

  

│```

  

├── frontend/ # Vue 3 + TypeScript

  

│ ├── src/---

  

│ │ ├── components/

  

│ │ │ ├── HamburgerMenu.vue # Global navigation## Development

  

│ │ │ ├── ConfirmDialog.vue # Confirmation modals

  

│ │ │ ├── chat/ # Chat components```bash

  

│ │ │ │ └── ChatWorkspace.vue# Backend

  

│ │ │ └── personas/ # Persona managementcd backend

  

│ │ │ └── PersonaManager.vuepnpm install

  

│ │ │pnpm run build

  

│ │ ├── views/ # Full-page views (7,110 lines)pnpm run dev

  

│ │ │ ├── HomeView.vue # Landing page with quotespnpm start

  

│ │ │ ├── JournalView.vue # 3,406 lines - comprehensive journaling

  

│ │ │ ├── TherapeuticPromptsView.vue # 399 lines - reflection prompts# Frontend

  

│ │ │ ├── CopingStrategiesView.vue # 1,023 lines - coping toolkitcd frontend

  

│ │ │ ├── MindfulnessView.vue # 1,135 lines - meditation practicespnpm install

  

│ │ │ └── ResourcesView.vue # 347 lines - library placeholderpnpm run dev

  

│ │ │pnpm run build

  

│ │ ├── router/pnpm run preview

  

│ │ │ └── index.ts # Vue Router configuration```

  

│ │ ├── composables/

  

│ │ │ └── usePersonaStore.ts # Persona state management**Database inspection:**

  

│ │ └── utils/

  

│ │ └── quotes.ts # Inspirational quotes```bash

  

│ │sqlite3 backend/db/kalito.db

  

│ └── public/ # Static assets.tables

  

│.schema sessions

  

├── db/ # SQLite database fileSELECT * FROM patients;

  

├── backups/ # Database backups.quit

  

│ ├── daily/```

  

│ ├── weekly/

  

│ └── emergency/**Development Workflow:**

  

├── scripts/ # Utility scripts

  

│ ├── backup-db # Database backup1. Backend: [http://localhost:3000](http://localhost:3000/)

  

│ └── restore-db # Database restore

  

└── docs/ # Documentation2. Frontend: [http://localhost:5173](http://localhost:5173/)

  

├── 00-Ai-Protocols/

  

│ ├── 01-Ai-Protocols.md3. Frontend proxies API requests to backend

  

│ └── 02-Self-Audit-Questions.md

  

└── progress/4. Database auto-initializes

  

└── development-progress-report.md

  

```5. Hot reload enabled

  

  

---

  

---

  

## 🛠️ Tech Stack

  

## Privacy & Security

  

### **Backend**

  

- **Runtime**: Node.js 18+ with TypeScript- **Local-first**: SQLite database lives locally

  

- **Framework**: Express.js with async/await

  

- **Database**: SQLite (better-sqlite3) - 13 tables- **No cloud storage**: Conversations and raw journal data never leave device

  

- **AI Integration**: OpenAI SDK (GPT-4.1 Nano) or Ollama (Phi3 Mini)

  

- **Search**: Tavily API for real-time web search- **Optional cloud AI**: GPT-4.1 Nano (via HTTPS)

  

- **Validation**: Zod schemas for type-safe API contracts

  

- **Security**: Helmet.js, CORS, rate limiting, parameterized queries- **Local AI**: Phi3 Mini runs entirely on your device

  

  

### **Frontend**- **Security**: Helmet.js, CORS, rate limiting, input validation, parameterized queries

  

- **Framework**: Vue 3 with Composition API (`<script setup>`)

  

- **Language**: TypeScript with strict mode

  

- **Build Tool**: Vite for lightning-fast HMR**Environment variables:**

  

- **Router**: Vue Router with history mode

  

- **State**: Composables and ref/reactive patterns```bash

  

- **Styling**: Scoped CSS with glassmorphism effectsOPENAI_API_KEY=your_openai_key

  

- **Responsive**: Mobile-first CSS with `@media` queriesTAVILY_API_KEY=your_tavily_key

  

OLLAMA_URL=http://localhost:11434

  

### **Development Tools**```

  

- **Nodemon**: Auto-restart on backend changes

  

- **Vite**: Hot module replacement for frontend---

  

- **TSC**: TypeScript compilation

  

- **ESLint**: Code quality and consistency## Contributing

  
  
  

### **Database Schema**- Fork repo, create branch, commit, push, PR

  

13 tables for comprehensive mental health tracking:

  

- `patients` - User profile- Privacy-first, family-focused, TypeScript, Zod validation, documentation updates

  

- `sessions` - Chat conversations

  

- `messages` - Individual chat messages- Accessibility, testing, code quality

  

- `memories` - AI memory system

  

- `journal_entries` - Journal data with mood/themes

  

- `goals` - Goal tracking**Contribution Ideas:**

  

- `personas` - AI personality configurations

  

- `coping_strategies` - Personal coping toolkit- Additional AI tools, enhanced search, mobile apps, reminders, report generation, multi-language support, charts, accessibility improvements

  

- `mindfulness_practices` - Practice history

  

- `resources` - Recovery literature

  

- And more...---

  
  
  

---## Troubleshooting

  
  
  

## 🎯 Architecture Highlights- Database connection issues

  

  

### **Migration from Modals to Full Views**- Port conflicts

  

Luna recently underwent a major architectural refactoring:

  

- AI features not working

  

**Before:**

  

- Dashboard-centric with modal overlays- Frontend build issues

  

- Limited screen real estate on mobile

  

- Cramped UI for complex components- TypeScript errors

  

  

**After:**- Module not found

  

- Full-page standalone views

  

- Dedicated routes for each feature (`/journal`, `/prompts`, `/coping`, `/mindfulness`)- Database locked

  

- Hamburger menu for global navigation

  

- Shareable URLs for each feature

  

- Dashboard simplified to Resources placeholder (346 lines, 65% reduction)---

  
  
  

### **Responsive Design Philosophy**## License

  

- **No artificial width constraints**: Content uses 100% viewport width

  

- **Fluid grid layouts**: `grid-template-columns: repeat(auto-fill, minmax(320px, 1fr))`MIT License — see [LICENSE](https://chatgpt.com/c/LICENSE)

  

- **Breakpoints**: 768px (mobile), 1024px (tablet), 1200px+ (desktop)

  

- **Mobile-first**: Base styles optimized for small screens---

  

- **Progressive enhancement**: Add complexity for larger viewports

  

## Acknowledgments

  

### **Component Consistency**

  

All wellness views follow the same pattern:Built with love for Aurora and Basilio Sanchez, and families caring for aging parents.

  

```vue

  

<template>---

  

<div class="[feature]-view">

  

<!-- Sticky Header -->## About Kalito Space

  

<div class="view-header">

  

<div class="header-content">Personal family project by Caleb Sanchez. Core beliefs:

  

<div class="header-left">

  

<HamburgerMenu />- Privacy by Design

  

<div class="header-text">

  

<h1><!-- Title --></h1>- Human-Centered Technology

  

<p><!-- Description --></p>

  

</div>- Accessibility

  

</div>

  

</div>- Family Values

  

</div>

  

- Extensible

  

<!-- Scrollable Content -->

  

<div class="view-content">

  

<!-- Feature-specific content -->_Last Updated: October 28, 2025_

  

</div>_Kalito Space - Where technology meets family care._

  

</div>

</template>

  

<style scoped>

.[feature]-view {

min-height: 100vh;

overflow-y: auto;

overflow-x: hidden;

background: linear-gradient(135deg, #0e121a 0%, #1a1f2e 100%);

}

</style>

```

  

---

  

## 💾 Database Backups

  

Luna includes automated backup scripts:

  

```bash

# Manual backup

./scripts/backup-db

  

# Restore from backup

./scripts/restore-db backups/kalito.db.YYYY-MM-DD_HHMMSS.bak

```

  

**Backup locations:**

- `backups/daily/` - Daily backups

- `backups/weekly/` - Weekly backups

- `backups/emergency/` - Manual emergency backups

  

---

  

## 🔧 Development

  

### **Backend Development**

```bash

cd backend

pnpm install

pnpm run build # Compile TypeScript

pnpm run dev # Development with nodemon

pnpm start # Production mode

```

  

**Backend runs on**: [http://localhost:3000](http://localhost:3000/)

  

### **Frontend Development**

```bash

cd frontend

pnpm install

pnpm run dev # Development with HMR

pnpm run build # Production build

pnpm run preview # Preview production build

```

  

**Frontend runs on**: [http://localhost:5173](http://localhost:5173/)

  

### **Database Inspection**

```bash

# Open SQLite CLI

sqlite3 backend/db/kalito.db

  

# Useful commands

.tables # List all tables

.schema sessions # Show table schema

SELECT * FROM journal_entries; # Query data

.quit # Exit

```

  

### **Development Workflow**

1. Start backend in Terminal 1: `cd backend && npm run dev`

2. Start frontend in Terminal 2: `cd frontend && npm run dev`

3. Frontend proxies API requests to `http://localhost:3000`

4. Database auto-initializes with schema on first run

5. Hot reload enabled for both frontend and backend

6. Open `http://localhost:5173` in browser

  

---

  

## 🔒 Security & Privacy

  

### **Privacy Guarantees**

- ✅ **Local-first storage**: All data in SQLite on your device

- ✅ **No cloud sync**: Journal entries and personal data never leave device

- ✅ **Optional cloud AI**: GPT-4.1 Nano requires internet (via HTTPS)

- ✅ **Local AI option**: Phi3 Mini runs 100% on your machine via Ollama

- ✅ **No telemetry**: No analytics, tracking, or data collection

  

### **Security Measures**

- **Helmet.js**: HTTP security headers

- **CORS**: Configured for frontend origin only

- **Rate limiting**: Prevents abuse of API endpoints

- **Input validation**: Zod schemas validate all requests

- **Parameterized queries**: SQL injection prevention

- **Type safety**: TypeScript end-to-end

  

### **Environment Variables**

Create `.env` files in backend directory:

  

```bash

# OpenAI (optional - for GPT-4.1 Nano)

OPENAI_API_KEY=sk-...

  

# Tavily (optional - for web search)

TAVILY_API_KEY=tvly-...

  

# Ollama (optional - for local AI)

OLLAMA_URL=http://localhost:11434

```

  

---

  

## 🧪 Testing

  

```bash

# Backend tests (if implemented)

cd backend

pnpm test

  

# Frontend tests (if implemented)

cd frontend

pnpm test

```

  

---

  

## 📊 Current Status

  

### ✅ **Complete Features**

- Full-page views for all wellness tools

- Hamburger menu navigation

- Journal with AI theme analysis

- Reflect (Therapeutic Prompts) - 21 prompts

- Coping Strategies - 15 evidence-based techniques

- Mindfulness - 12 guided practices with timer

- AI Chat with Luna (GPT-4.1 Nano or Phi3)

- Persona management

- Resources placeholder

- Database with 13 tables

- Backup/restore scripts

- Mobile-responsive UI

- Glassmorphism dark theme

  

### 🚧 **In Progress**

- Resources library content (EPUB/PDF parsing)

- Advanced mood tracking visualizations

- Medication tracking integration

- Goals progress charts

- Export journal entries

  

### 💡 **Future Ideas**

- Mobile apps (React Native or Flutter)

- Calendar view for journal entries

- Habit tracking

- Reminders and notifications

- Multi-language support

- Voice journaling

- Data export (PDF, JSON)

- Themes and customization

  

---

  

## 🐛 Troubleshooting

  

### **Backend Issues**

  

**Database connection errors:**

```bash

# Check if database file exists

ls -la backend/db/kalito.db

  

# Reset database (WARNING: deletes all data)

rm backend/db/kalito.db

# Restart backend to reinitialize

```

  

**Port 3000 already in use:**

```bash

# Find and kill process using port 3000

lsof -ti:3000 | xargs kill -9

  

# Or use a different port

PORT=3001 npm run dev

```

  

**AI features not working:**

- Verify `OPENAI_API_KEY` in `.env`

- For Ollama: Check if Ollama is running (`ollama serve`)

- Check API logs in terminal

  

### **Frontend Issues**

  

**Port 5173 already in use:**

```bash

# Vite will automatically try next available port

# Or kill the process

lsof -ti:5173 | xargs kill -9

```

  

**Module not found errors:**

```bash

# Clear node_modules and reinstall

rm -rf node_modules package-lock.json

pnpm install

```

  

**TypeScript errors:**

```bash

# Rebuild TypeScript

pnpm run build

```

  

**Vite cache issues:**

```bash

# Clear Vite cache

rm -rf frontend/.vite

```

  

### **Database Issues**

  

**Database locked:**

```bash

# Close all connections and restart backend

pkill -f "node.*backend"

cd backend && npm run dev

```

  

**Corrupted database:**

```bash

# Restore from backup

./scripts/restore-db backups/kalito.db.YYYY-MM-DD_HHMMSS.bak

```

  

---

  

## 🤝 Contributing

  

Luna is a personal project, but contributions are welcome!

  

### **Contribution Guidelines**

1. Fork the repository

2. Create a feature branch: `git checkout -b feature/amazing-feature`

3. Commit changes: `git commit -m 'Add amazing feature'`

4. Push to branch: `git push origin feature/amazing-feature`

5. Open a Pull Request

  

### **Coding Standards**

- **TypeScript**: Use strict mode, provide types

- **Vue 3**: Composition API with `<script setup>`

- **Zod**: Validate all API inputs/outputs

- **Comments**: Document complex logic

- **Accessibility**: ARIA labels, keyboard navigation

- **Privacy**: Keep data local, no telemetry

- **Testing**: Add tests for new features

  

### **Contribution Ideas**

- 📱 Mobile app (React Native, Flutter)

- 📊 Data visualization (charts, graphs)

- 🎨 Themes and customization

- 🌍 Internationalization (i18n)

- 🔊 Voice journaling

- 📤 Export functionality

- ♿ Accessibility improvements

- 🧪 Test coverage

  

---

  

## 📜 License

  

MIT License

  

Copyright (c) 2025 Caleb Sanchez (Kalito Space)

  

Permission is hereby granted, free of charge, to any person obtaining a copy

of this software and associated documentation files (the "Software"), to deal

in the Software without restriction, including without limitation the rights

to use, copy, modify, merge, publish, distribute, sublicense, and/or sell

copies of the Software, and to permit persons to whom the Software is

furnished to do so, subject to the following conditions:

  

The above copyright notice and this permission notice shall be included in all

copies or substantial portions of the Software.

  

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR

IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,

FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE

AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER

LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,

OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE

SOFTWARE.

  

---

  

## 💖 Acknowledgments

  

Built with love for **Aurora and Basilio Sanchez**, and all families caring for loved ones with mental health challenges and aging parents.

  

Special thanks to the open-source community for the incredible tools that made this project possible.

  

---

  

## 🌟 About Kalito Space

  

Luna is a personal project by **Caleb Sanchez**, developed under the Kalito Space initiative.

  

### **Core Principles**

- **Privacy by Design**: Your data belongs to you

- **Human-Centered Technology**: Technology should serve people, not exploit them

- **Accessibility**: Mental health tools should be available to everyone

- **Family Values**: Built with real families in mind

- **Extensibility**: Open architecture for customization

  

### **Philosophy**

Mental health management shouldn't require surrendering your privacy to cloud platforms. Luna proves that powerful, AI-enhanced tools can run entirely on your device while respecting your autonomy and dignity.

  

---

  

## 📞 Contact & Support

  

- **GitHub**: [Kalito-Labs/Luna](https://github.com/Kalito-Labs/Luna)

- **Issues**: [Report bugs or request features](https://github.com/Kalito-Labs/Luna/issues)

- **Discussions**: [Join the conversation](https://github.com/Kalito-Labs/Luna/discussions)

  

---

  

## 📝 Changelog

  

### **November 2025 - Major Architectural Refactor**

- ✅ Migrated from modal-based to full-page view architecture

- ✅ Created dedicated routes for all wellness features

- ✅ Implemented global hamburger menu navigation

- ✅ Removed artificial width constraints for full responsive design

- ✅ Renamed "Therapeutic Prompts" → "Reflect"

- ✅ Added overflow scrolling to all views

- ✅ Optimized mobile button sizes in journal composer

- ✅ Dashboard simplified to Resources placeholder (65% size reduction)

- ✅ Deleted empty quickactions folder

- ✅ Updated all views with consistent header structure

  

### **October 2025 - Initial Release**

- ✅ Core database schema (13 tables)

- ✅ AI chat with Luna (GPT-4.1 Nano and Phi3 support)

- ✅ Journaling with theme analysis

- ✅ Basic mood tracking

- ✅ Goals management

- ✅ Persona system

  

---

  

_Last Updated: November 5, 2025_

_Kalito Space - Where technology meets compassionate care._

  

🌙 **May Luna light your path to wellness.**