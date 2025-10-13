# Backend Logic System Overview

## Purpose

The `/backend/logic` folder contains the core AI and data integration logic for KalitoSpace. This system enables AI models to understand and interact with eldercare data through a sophisticated context-aware architecture.

## Architecture

```
logic/
├── agentService.ts              # Main AI orchestration service
├── eldercareContextService.ts   # Database context provider for AI
├── memoryManager.ts             # Conversation memory system
├── modelRegistry.ts             # Central model registration & lookup
└── adapters/                    # Model-specific implementations
    ├── openai/                  # OpenAI adapter (GPT-4.1 Nano)
    └── ollama/                  # Local model adapters (Phi3, etc.)
```

## Core Components

### 1. **agentService.ts** - AI Orchestration
- Coordinates AI model requests
- Builds context from multiple sources (persona, eldercare data, conversation history)
- Manages streaming and non-streaming responses
- Handles persona settings and system prompts

### 2. **eldercareContextService.ts** - Database Context Provider
- **Critical**: Provides AI models with full read-only access to eldercare data
- Queries patients, medications, appointments, vitals, caregivers
- Contextualizes data based on user queries (finds relevant patients/data)
- Trusted cloud models (GPT-4.1 Nano) get complete data access

### 3. **memoryManager.ts** - Conversation Memory
- Implements hybrid memory system (recent + semantic + summaries)
- Creates conversation summaries for long-term context
- Semantic search for relevant past conversations
- Importance scoring for message prioritization

### 4. **modelRegistry.ts** - Model Management
- Central registry for all AI models (cloud + local)
- Model lookup by ID or alias
- Adapter registration system
- Currently registered:
  - **Cloud**: GPT-4.1 Nano (sole cloud model)
  - **Local**: Phi3 Mini, Qwen 2.5 Coder, Llama 3.2/3.1

### 5. **adapters/** - Model Implementations

#### **openai/** - OpenAI Integration
- Factory pattern for OpenAI models
- Chat Completions API integration
- Streaming support
- Cost estimation and token tracking
- Single model: GPT-4.1 Nano

#### **ollama/** - Local Model Integration
- Factory pattern for Ollama models
- Local inference support
- Multiple model support (Phi3, Qwen, Llama)
- No API costs, privacy-focused

## Data Flow

```
User Query
    ↓
agentService.ts
    ↓
[Builds Context]
    ├── Persona Prompt (from database)
    ├── Eldercare Context (eldercareContextService)
    ├── Conversation History (memoryManager)
    └── Custom System Prompt
    ↓
modelRegistry.ts (gets adapter)
    ↓
Adapter (openai/ or ollama/)
    ↓
AI Model Response
    ↓
User
```

## Key Features

### ✅ Full Database Access for AI
- **Trusted cloud models** get complete eldercare data
- Patients, medications, appointments, vitals, caregivers
- Read-only access (AI cannot modify data)
- Privacy-conscious: Only your controlled API keys

### ✅ Context-Aware Responses
- AI understands patient names, relationships, medications
- Contextual queries: "How many meds is dad taking?"
- Automatic patient detection from natural language

### ✅ Hybrid Memory System
- Recent messages for immediate context
- Semantic search for relevant past conversations
- AI-generated summaries for long conversations

### ✅ Model Flexibility
- Switch between cloud (GPT-4.1) and local (Phi3) models
- Consistent interface across all models
- Model-specific optimizations

## Current State (October 2025)

**Active Models:**
- ☁️ GPT-4.1 Nano (OpenAI) - Sole cloud model, excellent eldercare context understanding
- 🏠 Phi3 Mini (Local) - Primary local model, fast and efficient

**Removed:**
- ❌ GPT-5 Nano (removed - caused empty responses)
- ❌ Claude Opus 4.1 (removed - context understanding issues)

## Documentation Structure

Each file in this folder is documented in detail:

1. `01-agentService.md` - AI orchestration and request handling
2. `02-eldercareContextService.md` - Database context for AI models
3. `03-memoryManager.md` - Conversation memory system
4. `04-modelRegistry.md` - Model registration and lookup
5. `05-openai-adapter.md` - OpenAI integration details
6. `06-ollama-adapter.md` - Local model integration details
7. `07-strengths-and-improvements.md` - Analysis and recommendations

## Getting Started

To understand the logic system:

1. Start with `01-agentService.md` - understand how AI requests flow
2. Read `02-eldercareContextService.md` - learn how AI accesses data
3. Review `04-modelRegistry.md` - understand model management
4. Then dive into adapter implementations (openai/ollama)

## Quick Reference

**Add a new model:**
1. Create adapter in `adapters/openai/` or `adapters/ollama/`
2. Register in `modelRegistry.ts`
3. Add to trusted list in `eldercareContextService.ts` (if cloud)

**Modify AI context:**
- Edit `eldercareContextService.ts` → `generateContextualPrompt()`

**Change memory behavior:**
- Edit `memoryManager.ts` → `buildEnhancedContext()`

**Update model settings:**
- Edit `adapters/openai/models.ts` or `adapters/ollama/adapters.ts`
