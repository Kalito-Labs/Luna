# Kalito - Family Care Assistant

## What This Is

Kalito is a personal AI-powered care assistant I built to help manage the care of my parents, Aurora and Basilio Sanchez. It's a Progressive Web App (PWA) that runs on my laptop at home and can be accessed from any device on our network, primarily the iPads my parents use.

This isn't a product or a service for others - it's a custom tool designed specifically for our family's needs.

## Why I Built This

Taking care of my parents means juggling a lot:
- Multiple medications with different schedules
- Doctor appointments with various specialists
- Tracking blood pressure, weight, and other vitals
- Coordinating with caregivers when I need help
- Keeping notes about what's working and what's not
- Answering questions like "When did Mom last take her medication?" or "What did the doctor say about Dad's blood pressure?"

I needed something better than scattered notes, calendar reminders, and trying to remember everything. I wanted a single place where I could store all this information AND have an AI assistant that actually knows our situation - not a generic chatbot, but one that understands my parents' specific medications, appointments, and health history.

## How It Works

### The Setup

**Hardware**: My Kubuntu laptop runs the server 24/7 on our home network

**Access**: My parents access it via Safari/Chrome on their iPads using the local IP address, installed as a PWA app

**Data**: Everything stays local on my laptop - no cloud storage, complete privacy

### What I Can Track

**Patients** (Mom & Dad):
- Basic info (names, ages, relationships, emergency contacts)
- Medical history and notes
- Insurance information
- Doctor contact details
- Pharmacy information

**Medications**:
- What they take, dosage, frequency
- When to take it (morning, evening, with food, etc.)
- Special instructions
- History of what worked or didn't work

**Appointments**:
- Upcoming doctor visits
- Past appointment notes
- Which provider, what type of visit
- Outcomes and follow-ups

**Vitals**:
- Blood pressure readings
- Weight tracking
- Temperature
- Any other measurements
- All timestamped so I can see trends

**Caregivers**:
- Professional caregivers when I need help
- Their schedules and contact info
- Clock in/out tracking
- Notes about their work

### The AI Assistant

This is the heart of Kalito. Unlike ChatGPT or other generic AI chatbots, Kalito's AI has **complete access to our family's care database**. When I ask a question, it knows:

- Every medication Mom and Dad take
- All upcoming appointments
- Recent vital sign readings
- Medical history and notes
- Caregiver schedules
- Everything in the database

**Examples of what I can ask**:
- "When is Dad's next appointment?"
- "What medications does Mom take in the morning?"
- "Has Dad's blood pressure been going down?"
- "What did the cardiologist say last time?"
- "Who's the caregiver coming tomorrow?"

The AI gives me answers based on our actual data, not generic medical advice. It's like having a family care assistant who knows everything about our situation.

**AI Models I Use**:
- **OpenAI GPT-4o**: Main model for complex questions (cloud-based)
- **Claude 3.5 Sonnet**: Alternative when I want Anthropic's approach (cloud-based)
- **Phi-3 (Local)**: Runs on my laptop for privacy-sensitive questions

### New Features I'm Adding

**1. Internet Search (Coming Soon)**
- AI can search for current medical information when needed
- Example: "Any recent FDA warnings about Lisinopril?"
- Uses OpenAI Function Calling (AI decides when to search)
- Tavily search API (free tier: 1,000 searches/month)
- Only searches trusted health sources (NIH, CDC, Mayo Clinic, FDA)
- **Cost**: $0/month (free tier more than enough)
- **Time to build**: ~4 hours

**2. Voice Capability (Coming Soon)**
- Hands-free interaction using voice
- Speak questions in English or Spanish
- AI responds with voice
- Perfect for my parents who prefer Spanish
- Uses Web Speech API (built into iPad Safari)
- Works offline once installed as PWA
- **Cost**: $0/month (browser-native, free)
- **Time to build**: 4-6 hours

**Both features**: ~8-10 hours total, $0/month to run

## The Tech Stack

**Frontend**: Vue 3 + TypeScript + Vite
**Backend**: Node.js + Express + TypeScript
**Database**: SQLite (local file, no cloud)
**AI Integration**: OpenAI API, Anthropic API, Ollama (local)
**Deployment**: PWA on local network

Everything runs on my laptop. My parents access it through their iPads. No cloud services for data storage - just the AI APIs when I need smarter responses.

## Privacy & Security

**All family health data stays on my laptop**:
- Patient information
- Medications
- Appointments
- Vitals
- Medical notes

**What goes to the cloud**:
- Only my questions to the AI
- The AI's responses
- Search queries (no patient names)

**What never leaves my network**:
- The actual database
- Personal health information
- Patient identities in raw form

When I use cloud AI models, the AI sees our data (that's the point - so it can answer questions about Mom and Dad), but that data isn't stored by OpenAI or Anthropic. When I use the local Phi-3 model, nothing leaves my laptop at all.

## What This Looks Like

**Main Dashboard** (6 sections):
1. **My Caregiver Profile** - My info as the primary caregiver
2. **Add Patient** - Quick add for Mom or Dad
3. **Saved Patients** - Mom and Dad's full profiles
4. **Medications** - All their meds in one view
5. **Appointments** - Calendar and upcoming visits
6. **Vitals** - Health tracking and trends

**Chat Interface**:
- Clean chat window like talking to a person
- AI responds with full knowledge of our situation
- Can ask follow-up questions
- Conversation history saved by session
- Soon: Voice input/output for hands-free use

**Forms & Data Entry**:
- Add medications easily
- Schedule appointments
- Log vital signs
- Update patient info
- Everything validated to prevent errors

## What Makes This Different

**Not a generic eldercare app** - It's built specifically for Aurora and Basilio Sanchez

**Not a chatbot** - It's an AI that knows our family's complete care situation

**Not cloud-based** - Everything stays on my laptop at home

**Not complicated** - Mom and Dad can use it on their iPads (especially with voice coming soon)

**Not a product** - It's a personal tool for our family

## Why I'm Documenting This

I might want to show my brothers what I've built, or explain it to close friends who are curious about how I manage Mom and Dad's care. This document helps me explain:

- What problem I was solving (care coordination is complex)
- How I solved it (custom AI assistant with our data)
- Why I built it myself (no existing tool did what I needed)
- How it works (PWA on home network, AI with full context)

It's also a reference for myself when I need to remember how the system works, or when I'm adding new features like voice and search.

## Current Status

**What's Working**:
- ✅ Patient management (Mom & Dad's profiles)
- ✅ Medication tracking (all their meds)
- ✅ Appointment scheduling
- ✅ Vital signs logging
- ✅ Caregiver management
- ✅ AI chat with full eldercare context
- ✅ Multiple AI models (OpenAI, Claude, Local Phi-3)
- ✅ Conversation memory and sessions
- ✅ PWA installation on iPads

**What I'm Building Next**:
- 🚧 Internet search for current health info (4 hours)
- 🚧 Voice input/output in English & Spanish (4-6 hours)

**Total time investment so far**: ~6 months of evenings and weekends

**Total monthly cost**: ~$20-30 for OpenAI/Claude API usage

**Value**: Priceless - much better care for Mom and Dad, less stress for me

## The Bottom Line

This is my way of using technology to take better care of my parents. Instead of relying on generic apps that don't understand our situation, I built something that knows Aurora and Basilio, knows their medications, knows their appointments, and can answer my questions instantly.

It's not fancy. It's not perfect. But it's exactly what we need.

---

*Built with love for Aurora and Basilio Sanchez by their son, Caleb*