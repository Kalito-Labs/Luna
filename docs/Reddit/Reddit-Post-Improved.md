# I Built an AI Family Care Platform That Can't Hallucinate Medical Data (6 Months, 143K Lines of Code)

## TL;DR
Built a privacy-first AI eldercare platform for managing my parents' healthcare. It has **zero-hallucination architecture** - when you ask about medications or appointments, it returns database facts, not AI guesses. Local-first, open source, works as PWA or Android app. Looking for feedback from the community.

---

## Why I Built This

Six months ago, I was juggling my parents' (Aurora and Basilio) healthcare across scattered notes, pharmacy receipts, appointment cards, and my increasingly unreliable memory. One day I almost gave my dad the wrong medication because I confused his morning and evening pills.

That's when I decided: I'm a developer. I can fix this.

But I didn't want just another medication tracker. I wanted an **AI assistant that actually knew my family's health data** - one I could ask "Does Mom have any appointments this week?" and get a real answer, not a hallucination.

---

## 🛡️ The Killer Feature: Zero-Hallucination Architecture

Here's the problem with most AI health apps: **the AI makes stuff up**.

Ask ChatGPT "Does Mom have appointments?" and it might say "Yes, November 12th at 10 AM" when she actually has zero appointments. That's dangerous with medical data.

**My solution:**
- When you ask about medications or appointments, the query is **intercepted before reaching the AI**
- A structured validation service queries the actual database
- Returns ground truth data to you
- **The AI never generates the answer** - it's pure database facts

### How It Works:
```
User: "Does she have any appointments?"
  ↓
Query Detection: Recognizes "appointments" intent
  ↓
Database Query: SELECT * FROM appointments WHERE patient_id = ?
  ↓
Result: "Aurora has NO upcoming appointments scheduled"
  ↓
AI NEVER SEES THIS QUERY - just database truth
```

This architecture includes:
- ✅ Dual-path routing (streaming + non-streaming modes)
- ✅ Session-based patient tracking (maintains conversation context)
- ✅ Pronoun resolution ("Does she..." uses patient from previous question)
- ✅ Query type detection (medications, appointments, vitals, general)

**Result:** Zero medical data hallucinations. Ever.

---

## 🏠 What It Does

### The Family Hub
Think of this as your family's digital health filing cabinet:

**👥 Patient Profiles**
- Complete demographics, emergency contacts, insurance
- Everything about each person you care for in one place

**💊 Medication Management** 
- Track brand/generic names, dosages, frequencies
- Prescribing doctors, pharmacies, RX numbers, side effects
- **Adherence logs**: Track taken/missed/late doses with reminders
- **Ground truth validation**: AI returns exact database data (no fabrication)

**📅 Appointment Tracking**
- All doctor visits organized by type (routine, follow-up, specialist, emergency)
- Preparation notes (what to bring, questions to ask)
- Outcome summaries after each visit
- **Validated responses**: AI explicitly states when no appointments exist
- Link appointments to healthcare providers, track follow-ups

**📊 Health Measurements**
- Log weight and blood glucose readings over time
- See trends, identify patterns
- Have concrete data when doctors ask "How's his blood sugar been?"

**🏥 Healthcare Provider Directory**
- Complete list of doctors, specialists, clinics
- Contact info, specialties, notes about preferences

**📄 Professional Reports**
- Generate printable patient reports
- Demographics, current meds, upcoming appointments, emergency contacts
- Perfect for sharing with healthcare providers or family

### 🤖 The AI Assistant

**Context-Aware Intelligence:**
- AI has full read access to your family database
- Knows patients, medications, appointments, vitals, caregivers, providers
- Hybrid memory system: recent messages + semantic pins + conversation summaries
- Auto-summarization after 15+ messages for efficient context

**Real-Time Web Search:**
- Integrated Tavily Search API for current information
- AI decides when to search online
- "Search for latest Metformin side effects" - gets current medical research
- Visual feedback with animated "🔍 Searching online..." indicator

**Two Model Options:**
- **GPT-4.1 Nano** (cloud): Fast, function calling support, eldercare context
- **Phi3 Mini** (local): 100% private, offline capable, no data transmission

**Example Queries:**
```
"When is Dad's next appointment?" 
→ AI checks appointments table, returns database fact

"What medications does Mom take in the morning?" 
→ AI queries medications with frequency filters

"Search online for latest information about Metformin side effects" 
→ AI uses web search function, returns current research

"Has Dad's blood pressure been trending down?" 
→ AI analyzes vitals data over time

"Does she have any appointments?"
→ Uses session patient context (pronoun resolution)
```

### 🎭 Persona System

Create custom AI personalities for different needs:

- **Family Companion**: Empathetic, conversational, patient-focused
- **News Researcher**: Search-focused, current events, summarization
- **Medical Research Assistant**: High detail, eldercare context, search enabled

**Customize everything:**
- System prompt (personality, expertise, behavior)
- Temperature (creativity vs. precision: 0.0-2.0)
- Max tokens (response length)
- Top-P, repeat penalty, stop sequences
- Patient context access per persona

---

## 🔒 Privacy-First Architecture

### What Stays on Your Device (100%)
- ✅ SQLite database with all family health data
- ✅ Patient records, medications, appointments, vitals
- ✅ Conversation history
- ✅ Medical data validation (happens locally before AI)

### What Goes to Cloud (Optional - your choice)
- Questions to AI models (if using GPT-4.1 Nano)
- Web search queries (no patient identifiers)
- **Medical queries are intercepted and answered locally** before reaching AI

### Your Options
- **Maximum Privacy**: Use Phi3 Mini (local) - nothing ever leaves your device
- **Trusted Cloud**: Use GPT-4.1 Nano - you control the API key
- **Your Data, Your Rules**: Delete anytime, no cloud lock-in

---

## 🔧 Technical Details

### The Stack
**Backend:**
- Node.js 18+ with Express 5.1.0
- TypeScript 5.0+ (type-safe everything)
- SQLite with better-sqlite3
- 14 tables, 13 foreign keys, 11+ performance indexes
- OpenAI SDK 5.0.1 + Ollama integration
- Tavily Search API integration
- Helmet security, CORS, rate limiting
- Zod validation, Winston logging

**Frontend:**
- Vue 3.5.13 (Composition API)
- TypeScript 5.8.3
- Vite 6.3.5 (lightning-fast dev)
- Vue Router 4.5.1
- Shiki syntax highlighting
- PWA support (installable)

**Ground Truth Validation:**
- StructuredMedicationService
- StructuredAppointmentService  
- Query routing & intent detection
- Session patient tracking
- Pronoun resolution

### The Numbers
- **143,000+ lines of code** (TypeScript + Vue)
- **6 months of development** (evenings and weekends)
- **14 database tables** with full referential integrity
- **11 API routers** (complete REST API)
- **17 backend logic services**
- **50+ features** from AI chat to adherence tracking
- **25+ documentation files** (comprehensive technical docs)

### Database Architecture
```
Chat System (5 tables):
- sessions, messages, conversation_summaries, semantic_pins, personas

Eldercare System (9 tables):
- patients, medications, medication_adherence_logs
- appointments, vitals, medical_records
- healthcare_providers, caregivers, caregiver_time_logs

Full referential integrity with cascade deletes
Optimized indexes for patient queries, date ranges, status filters
```

---

## 📱 How You Use It

**As a PWA (Progressive Web App):**
- Works on any device (desktop, tablet, phone)
- Install like a native app
- Offline capable

**As an Android App:**
- Recently converted to .apk
- Backend runs on my Kubuntu laptop
- Family connects via local network
- No internet required (except for cloud AI/search if you choose)

**Setup:**
```bash
# Clone the repo
git clone https://github.com/Kalito-Labs/kalito-repo.git

# Install dependencies (both frontend & backend)
pnpm install

# Start backend (Terminal 1)
cd backend && npm run dev

# Start frontend (Terminal 2)  
cd frontend && npm run dev

# Open browser
http://localhost:5173/family-hub
```

That's it. No cloud services to configure (unless you want AI features).

---

## 🎯 What Makes This Different

**vs. Generic Chatbots (ChatGPT, Claude):**
- ❌ They don't know your family data
- ❌ No persistence, no context
- ❌ **Will hallucinate medical information**
- ✅ Kalito has full family context
- ✅ Zero hallucination for medical queries
- ✅ All conversations saved locally

**vs. Cloud Eldercare Apps (CareZone, Caring Village):**
- ❌ They're cloud-only (privacy concerns)
- ❌ Subscription fees
- ❌ No AI intelligence
- ❌ Limited customization
- ✅ Kalito is local-first
- ✅ Open source (free forever)
- ✅ Context-aware AI assistant
- ✅ Extensible and customizable

**vs. Local AI Tools (Ollama alone):**
- ❌ Just the model, no application
- ❌ No eldercare structure
- ❌ No validation layer
- ✅ Kalito has complete care management
- ✅ Ground truth validation prevents hallucination
- ✅ Web search + cloud model options

---

## 🚀 What's Next

**Short Term:**
- Extend validation to vitals and provider queries
- Medication/appointment push notifications
- Export reports as PDF
- Multi-language support

**Long Term:**
- Caregiver mobile app (React Native)
- Medication photo recognition (scan pill bottles)
- Voice interface (hands-free for elderly)
- Care team collaboration features
- Analytics dashboard (medication adherence trends, appointment history)

**Community Ideas?**
I'm one developer building this for my family, but I'd love to hear:
- What features would you need?
- What eldercare pain points should I solve next?
- Technical improvements or optimizations?

---

## 📚 Documentation

The repo includes comprehensive docs:
- **Complete System Overview** (1,700+ lines)
- **Database Schema Diagrams** (10 Mermaid diagrams)
- **Backend Logic Documentation** (7 detailed guides)
- **Hallucination Prevention Fix** (technical deep-dive)
- **AI Development Protocols**
- **Setup & Deployment Guides**

Everything is documented because I want others to learn from this and build their own versions.

---

## 💝 The Real Story

This isn't just a side project. It's a tool I use **every single day** to care for my parents.

When the AI tells me "Aurora has NO upcoming appointments scheduled," I trust it completely because I know it's querying the actual database, not generating probabilistic text.

When I ask "What meds does Basilio take at 8 PM?" I get his actual medication list with RX numbers, dosages, and prescribing doctors - not AI guesswork.

That trust is everything when you're managing someone's healthcare.

---

## 🤝 I Want Your Feedback

**Specific Questions:**
1. **Privacy**: Is the local-first architecture compelling enough, or would you still worry about using AI with health data?
2. **Features**: What's missing? What would make you actually use this for your family?
3. **Technical**: Any suggestions for the hallucination prevention architecture?
4. **UI/UX**: What would make this more intuitive for non-technical caregivers?
5. **Distribution**: Should I focus on PWA, native mobile apps, or both?

**Links:**
- 📦 GitHub: `https://github.com/Kalito-Labs/kalito-repo` *(coming soon - cleaning up for public release)*
- 📖 Full Docs: Check `/docs/overview/ks-overview.md` in the repo
- 🛡️ Hallucination Fix: `/docs/fixes/appointment-hallucination-fix.md`

---

## ⚖️ License & Philosophy

MIT License - use it, modify it, learn from it, build your own version.

**Core Beliefs:**
- Family health data should be private and local
- AI should enhance human care, not replace it
- Technology should serve human dignity
- Open source enables community healthcare solutions
- Caregiving deserves better tools

---

## 🙏 Thank You

To everyone in the caregiver community: You're doing the hardest, most important work. If this tool helps even one family coordinate care better, it was worth every late night of coding.

To the developer community: I'd genuinely love your code reviews, architecture feedback, and ideas for improvement. This started as a personal project but I think it could help a lot of families.

**Built with love for Aurora and Basilio Sanchez, and families everywhere caring for aging parents.**

---

*P.S. - Yes, I named it "Kalito" which is a family nickname. The logo is a house because home is where we care for family. Every line of code is an act of love.*

---

**What do you think? Would you use something like this for your family?**
