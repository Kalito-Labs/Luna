# KalitoSpace

**A Personal AI Conversational Interface with Privacy-First Architecture**

KalitoSpace is a sophisticated AI workspace that provides secure, transparent interactions with multiple AI models while maintaining complete data sovereignty and operational transparency.

## 🏗️ Architecture Overview

### Core Philosophy
- **Privacy-First**: All conversations and data stored locally with SQLite
- **Transparency**: Full token usage tracking and cost estimation
- **Modularity**: Pluggable AI model adapters with unified interface
- **No Vendor Lock-in**: Export, migrate, or purge data at any time
- **Industry Standards**: Clean code with proper TypeScript typing and error handling

### Technology Stack
- **Backend**: Node.js + Express + TypeScript + SQLite (better-sqlite3)
- **Frontend**: Vue 3 + Vite + TypeScript
- **Database**: SQLite with WAL mode and foreign key constraints
- **Quality**: ESLint + Prettier + Husky pre-commit hooks
- **Monitoring**: Structured logging with correlation IDs

## 🤖 AI Model Capabilities

### Supported Models

#### **OpenAI Models**
- **GPT-4.1 Mini** - Balanced performance and cost (`gpt-4.1-mini`)
- **GPT-4.1 Nano** - Fastest responses (`gpt-4.1-nano`)
- **GPT-5 Mini** - Advanced reasoning with GPT-5 (`gpt-5-mini`)
- **GPT-5 Nano** - Efficient GPT-5 variant (`gpt-5-nano`)

#### **Anthropic Models**
- **Claude 3.5 Sonnet** - Latest Claude with enhanced capabilities (`claude-3-5-sonnet`)

#### **Local Models**
- **Qwen2.5 Coder** - Code-specialized variant with excellent programming and general conversation capabilities (`qwen2.5-coder`)

### Advanced AI Integration

#### **Dual API Architecture**
- **Chat Completions API**: Traditional models (GPT-4.1, Claude)
- **Responses API**: Next-generation models (GPT-5) with reasoning tokens

#### **Streaming Capabilities**
- Real-time response streaming for all models
- Server-Sent Events (SSE) with proper error handling
- Progressive token counting and cost estimation

#### **Model Registry System**
```typescript
interface LLMAdapter {
  id: string
  name: string
  type: 'cloud' | 'local'
  contextWindow?: number
  pricing?: string
  generate(args): Promise<{ reply: string; tokenUsage: number }>
  generateStream?(args): AsyncGenerator<{ delta: string; done?: boolean }>
}
```

## 🧠 Intelligent Features

### **Persona System**
- Customizable AI personalities with persistent settings
- Per-persona model preferences and parameters
- Template-based prompt engineering
- Context-aware conversation styles

### **Session Management**
- Persistent conversation sessions with automatic saving
- Session-based context isolation
- Smart conversation summarization and recaps
- Export conversations in multiple formats

### **Memory Architecture**
- SQLite-based conversation storage with full-text search
- Efficient message threading and context management
- Automatic database backups with rotation
- ACID compliance for data integrity

### **Cost Tracking & Analytics**
- Real-time token usage monitoring
- Precise cost estimation per model
- Conversation-level cost analysis
- Historical usage patterns and trends

## 🔒 Security & Privacy

### **Data Sovereignty**
- **100% Local Storage**: All conversations stored in local SQLite database
- **No Telemetry**: Zero data collection or external analytics
- **No Cloud Dependencies**: Fully functional offline (except model API calls)
- **Audit Trail**: Complete conversation history with timestamps

### **Security Measures**
- Express security middleware (Helmet, CORS, rate limiting)
- Input validation and sanitization
- SQL injection prevention with prepared statements
- Request size and timeout limits
- Structured error handling without data leakage

### **AI Safety Protocols**
Implements rigorous [AI Protocols](docs/Ai-Protocols/) including:
- **Reality Check**: Verification-first approach to AI responses
- **Bias Detection**: Self-audit mechanisms for AI behavior
- **Tool Cross-Verification**: Multiple validation methods for accuracy
- **Quality Gates**: Mandatory evidence and impact assessment

## 🛠️ Technical Capabilities

### **Robust Error Handling**
- Comprehensive error middleware with correlation IDs
- Graceful degradation for API failures
- User-friendly error messages without technical details
- Automatic retry mechanisms for transient failures

### **Performance Optimizations**
- Database connection pooling and WAL mode
- Response caching for repeated queries
- Efficient memory management for large conversations
- Background processing for non-critical operations

### **Developer Experience**
- Full TypeScript coverage with strict mode
- Comprehensive ESLint and Prettier configuration
- Pre-commit hooks ensuring code quality
- Structured logging with debug levels
- Hot reloading for development

### **Database Design**
```sql
-- Core entities with proper relationships
Sessions (id, name, model, persona_id, created_at, updated_at)
Messages (id, session_id, role, content, tokens, cost, created_at)
Personas (id, name, category, settings, system_prompt)
MemoryPins (id, session_id, content, embedding, created_at)
```

## 🚀 Operational Features

### **Session Workspace**
- Multi-tab conversation interface
- Real-time message synchronization
- Markdown rendering with syntax highlighting
- Copy/export individual messages or full conversations

### **Model Switching**
- Dynamic model selection mid-conversation
- Context preservation across model changes
- Performance and cost comparison tools
- Automatic fallback for unavailable models

### **Backup & Recovery**
- Automated database backups with timestamps
- Point-in-time recovery capabilities
- Data export in JSON/CSV formats
- Migration tools for version upgrades

### **Development Tools**
```bash
# Quality assurance
pnpm quality        # Lint + format check
pnpm quality:fix    # Auto-fix issues

# Database management
pnpm db:backup      # Create timestamped backup
pnpm db:restore     # Restore from backup

# Development servers
pnpm dev:backend    # API server with hot reload
pnpm dev:frontend   # Vue app with HMR
```

## 📊 Monitoring & Observability

### **Structured Logging**
- Request/response correlation IDs
- Performance metrics and timing
- Error tracking with stack traces
- Model usage statistics

### **Health Monitoring**
- API endpoint health checks
- Database connection monitoring
- Model availability status
- Resource usage tracking

### **Analytics Dashboard**
- Conversation volume trends
- Model usage distribution
- Cost analysis and budgeting
- Performance benchmarks

## 🎯 Use Cases

### **Personal AI Assistant**
- Research and information gathering
- Code review and programming assistance
- Writing and content creation
- Problem-solving and brainstorming

### **Model Comparison**
- A/B testing different AI models
- Cost-benefit analysis for various tasks
- Performance benchmarking
- Quality assessment across providers

### **Privacy-Sensitive Work**
- Legal document analysis
- Medical information processing
- Financial planning and analysis
- Confidential business discussions

### **AI Development**
- Prompt engineering and testing
- Model behavior analysis
- Context window optimization
- Token usage optimization

## 🔮 Technical Innovation

### **Factory Pattern Implementation**
Clean, extensible architecture for AI model integration:
```typescript
// Automatic API selection based on model capabilities
if (config.apiMode === 'responses') {
  return createResponsesAPIAdapter(options)  // GPT-5
} else {
  return createChatAPIAdapter(options)       // Traditional models
}
```

### **Type-Safe AI Interactions**
Comprehensive TypeScript definitions ensuring compile-time safety:
```typescript
interface OpenAIAdapterSettings {
  temperature?: number
  maxTokens?: number
  reasoning_effort?: 'low' | 'medium' | 'high'  // GPT-5 specific
  verbosity?: 'brief' | 'full'
}
```

### **Streaming Architecture**
Efficient real-time response handling with proper error boundaries:
```typescript
async function* generateStream(): AsyncGenerator<StreamChunk> {
  for await (const chunk of apiStream) {
    yield { delta: chunk.text, tokenUsage: chunk.usage }
  }
}
```

---

**KalitoSpace** represents a new paradigm in personal AI interaction - combining the power of cutting-edge AI models with uncompromising privacy, transparency, and user control. Built with enterprise-grade architecture patterns while maintaining the simplicity needed for personal use.