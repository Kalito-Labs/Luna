# Kalito Space - A Personal AI Family Platform

Kalito-Space is designed to be **the family's AI hub** that helps manage medications, appointments, vital signs, and healthcare providers while having conversations with context-aware AI personas.
### The  Family Hub

Think of this as your family's digital filing cabinet:

**Patient Profiles**: Store everything about each person you care for. Their demographics, emergency contacts, insurance information, primary doctor, medications, appointments, and health measurements. Each patient becomes a complete record you can access instantly.

**Medication Management**: Track every medication with brand and generic names, dosages, frequencies, prescribing doctors, pharmacies, and even side effects to watch for. 

**Appointment Tracking**: Keep all doctor visits organized with appointment types (routine checkup, follow-up, specialist visit, emergency), preparation notes (what to bring, questions to ask), and outcome summaries after the visit. Link appointments to specific healthcare providers and track follow-up requirements.

**Health Measurements**: Log weight and blood glucose readings over time. See trends, identify patterns, and have concrete data ready when doctors ask "How has his blood sugar been?"

**Healthcare Provider Directory**: Maintain a complete list of doctors, and clinics with all their contact information, specialties, and notes about preferences or important details.

**Professional Reports**: Generate clean, printable patient reports with comprehensive information including demographics, current medications, upcoming appointments, and emergency contacts. Perfect for sharing with healthcare providers, caregivers, or keeping physical records.

## Kalito Ai Assistant

Kalito Ai is powered by 2 types of AI models:

- **Cloud AI (GPT-4.1 Nano)**: Fast, intelligent, with advanced reasoning—but requires internet and sends your questions to OpenAI

- **Local AI (Phi3 Mini)**: Runs entirely on your computer, 100% private, no internet needed—perfect for sensitive questions

**Examples of what I can ask:**
- "When is Dad's next appointment?" - AI checks the appointments table
- "What medications does Mom take in the morning?" - AI queries medications with frequency filters
- "Search online for latest information about Metformin side effects" - AI uses web search function
- "Has Dad's blood pressure been trending down?" - AI analyzes vitals data over time

### Internet Search Capability ( Cloud Only)

**What it can do:**

- Search for current medical information, FDA warnings, drug interactions
- Find latest news, trends, research
- Look up technical information, documentation
- Get up-to-date facts and statistics
- Research any topic with real-time data

- **Tavily Search API**: High-quality search results with relevance scoring
- **Function Calling Architecture**: OpenAI function calling with tool execution pipeline
- **Streaming Support**: Works seamlessly with real-time streaming responses
- **Visual Feedback**: Animated "🔍 Searching online..." indicator during searches
### 🎭 Persona System 

**Custom AI personalities for different use cases:**

- **Medical Research Assistant**: High temperature, eldercare context, search enabled
- **Medication Expert**: Low temperature, patient context, precise responses
- **Family Companion**: Medium temperature, conversational, empathetic tone
- **News Researcher**: Search-focused, current events, summary generation

**What you can customize:**
- **Category**: Cloud (high-performance) or Local (privacy-focused)
- **System Prompt**: Define the AI's personality, expertise, and behavior
- **Model Settings**:
- `temperature`: Creativity vs. precision (0.0-2.0)
- `maxTokens`: Response length limit
- `topP`: Nucleus sampling parameter (0.0-1.0)
- `repeatPenalty`: Reduce repetitive responses (1.0+)
- `stopSequences`: Custom stop sequences (JSON array)
## Closing Thoughts

Kalito Space started as a simple eldercare tracker. It's evolving into an intelligent family AI platform. It will continue growing as our family's needs evolve.
