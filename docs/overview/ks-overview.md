# 🏠 Kalito Space - Your Family's AI Command Center

**The problem**: Managing family healthcare is overwhelming. Remembering medication schedules, tracking appointments, monitoring health trends, researching medical information - it's a lot. And existing solutions are either too generic (just chatbots) or too limited (just tracking apps).

**The solution**: Kalito Space is your family's AI hub that brings everything together. It's like having a smart assistant who knows your family, remembers everything, and helps you stay organized - all while keeping your data private and under your control.

**Built for real families**: Whether you're caring for aging parents, managing your own health, or coordinating family medical needs, Kalito gives you one place to handle it all.

---
## What Can Kalito Do?

### 🤖 Smart AI Conversations

Talk to AI that actually knows your family's situation. No more repeating yourself or explaining context every time.

**Ask things like:**
- "When is Mom's next appointment?"
- "What medications does Dad take in the morning?"
- "Has Dad's blood pressure been improving?"
- "Search for side effects of Metformin"
- "Remind me what the doctor said last visit"

The AI remembers your conversations, understands your family's medical history, and can search the internet for current information when needed.

---

### 📅 Family Care Dashboard

Everything your family needs, organized in one place:

**Patients**: Track family members' health information, relationships, doctors, insurance details

**Medications**: Manage prescriptions, dosages, schedules, pharmacy info, and refills

**Appointments**: Schedule doctor visits, store preparation notes, track outcomes, set reminders

**Vital Signs**: Record weight, blood glucose, and other health metrics over time

**Healthcare Providers**: Keep all your doctors, specialists, and clinics organized with contact info

**Caregiver Profile**: Your information and preferences as the family coordinator

---

### 🔍 Internet Search

The AI can search the web for you when it needs current information:
- Latest medical research and drug information
- FDA warnings and recalls
- Health news and guidelines
- General information and facts

You get accurate, up-to-date answers without leaving the conversation.

---

### 🎭 Custom AI Personalities

Create different AI assistants for different needs:

- **Medical Expert**: Precise, factual, patient context enabled
- **Research Assistant**: Search-focused, detailed explanations
- **Family Companion**: Warm, conversational, remembers everything
- **Privacy Mode**: Local-only AI, no internet required

Switch between them depending on what you need help with.

---

### 💾 Your Data, Your Control

**Everything stays on your device**:
- All family health records stored locally
- Complete conversation history on your computer
- No forced cloud storage or subscriptions
- Optional cloud AI if you want smarter responses

**Choose your privacy level**:
- 🔒 **Maximum Privacy**: Use local AI models (Phi3 Mini) - nothing leaves your device
- ⚡ **Smart Features**: Use cloud AI (GPT-4o Nano) with your own API key - you control what gets sent

You decide the balance between privacy and capabilities.
---

## Why I Built This

I was juggling my parents' medications, appointment schedules, and health questions while trying to keep track of everything in my head (and scattered notes). Existing apps were either:
- Generic chatbots that didn't know my family
- Simple trackers without intelligence
- Cloud services I didn't trust with sensitive health data

So I built something better: an AI family hub that's smart, organized, and completely private.

---

## Who Is This For?

**You might love Kalito if you're:**
- Managing care for aging parents or family members
- Coordinating healthcare across multiple family members
- Tired of juggling medication schedules and appointments
- Want an AI assistant that knows your family's context
- Care about privacy and want your data under your control
- Comfortable with a bit of tech setup (or willing to learn)

---

## How Does It Work?

**Simple version**: 
1. Install on your computer (works on Windows, Mac, Linux)
2. Add your family members and their health info
3. Chat with the AI, track medications, schedule appointments
4. Everything is saved locally - access from your phone, tablet, or any device on your network

**Technical version** (if you're curious):
- Progressive Web App (PWA) - works like a native app
- Vue.js frontend + Node.js backend + SQLite database
- Runs on your local network (not on the internet)
- Optional cloud AI models (OpenAI GPT-4o Nano) or fully offline (Ollama Phi3 Mini)
- Real-time internet search via Tavily API

---

## What Makes It Different?

| Feature | Kalito Space | Generic Chatbots | Health Trackers | Cloud Apps |
|---------|--------------|------------------|-----------------|------------|
| **Knows Your Family** | ✅ Full context | ❌ No memory | ❌ No AI | ⚠️ Limited |
| **Smart Conversations** | ✅ Context-aware | ⚠️ Generic | ❌ No chat | ⚠️ Basic |
| **Health Tracking** | ✅ Comprehensive | ❌ None | ✅ Basic | ⚠️ Limited |
| **Privacy Control** | ✅ 100% Local | ❌ Cloud-only | ⚠️ Varies | ❌ Their servers |
| **Internet Search** | ✅ Built-in | ⚠️ Some | ❌ None | ⚠️ Rare |
| **Customizable** | ✅ Fully open | ❌ Locked down | ⚠️ Limited | ❌ Fixed |

---

## Real-World Examples

**Morning routine**:
- "What medications does Mom need to take this morning?"
- AI lists all morning medications with dosages
- Log when she takes them
- Get reminders for the next dose

**Before doctor visits**:
- "Show me Dad's blood pressure readings for the past month"
- See the trend and recent measurements
- "What questions should I ask about his blood pressure medication?"
- AI helps you prepare

**When researching**:
- "Search for drug interactions between Metformin and Lisinopril"
- AI searches the web and summarizes findings
- All while keeping your family's medication list private

**Managing appointments**:
- "When is the next cardiology appointment?"
- See date, time, location, preparation notes
- "What did the doctor say last time?"
- AI recalls the outcome summary from the previous visit

---

## Getting Started

1. **Check the README** for installation instructions (it's detailed but straightforward)
2. **Set up your environment**: Install Node.js and optionally Ollama for local AI
3. **Start the app**: Run the backend and frontend servers
4. **Add your family**: Create patient profiles
5. **Start using it**: Chat with the AI, track medications, schedule appointments

**First-time setup takes about 30 minutes.** After that, it just runs.

---

## Current Status & Future

**What works today** (v1.0):
- ✅ AI chat with family context
- ✅ Patient, medication, appointment, vitals tracking
- ✅ Internet search integration
- ✅ Custom AI personas
- ✅ Local and cloud AI models
- ✅ Mobile-responsive PWA

**Coming soon**:
- 📱 Better mobile app experience
- 📊 Health trend visualizations and charts
- 🔔 Medication reminders and notifications
- 📤 Export medical records (FHIR format)
- 👥 Multi-user support with permissions
- 🔐 Enhanced security features

---

## Philosophy

**Local-first**: Your data lives on your device, not someone else's server.

**Privacy by default**: Use local AI models for complete privacy, cloud models only when you choose.

**Open & hackable**: Built with standard web tech. Want to add a feature? Go for it.

**Real families, real needs**: Built by someone managing family care, for others doing the same.

**No subscriptions**: Once it's set up, it's yours. No monthly fees, no data harvesting.

---

## Want to Try It?

**If you're technical**: Clone the repo, follow the README, and you'll be up and running in 30 minutes.

**If you're not technical (yet)**: The README has step-by-step instructions. It's a learning opportunity - and your family's health data is worth the effort.

**Questions?** Check the documentation or reach out. This is a community project - we help each other out.

---

## The Bottom Line

Kalito Space is an AI-powered family command center that:
- **Remembers** everything about your family's health
- **Organizes** medications, appointments, and vitals in one place
- **Assists** with intelligent conversations and research
- **Protects** your privacy by keeping data local
- **Grows** with your family's needs

It's not perfect, but it's built with care for real families dealing with real healthcare challenges.

**Your family deserves better tools. This is a start.**
