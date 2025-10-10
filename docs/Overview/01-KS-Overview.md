## What is Kalito Space

Kalito Space is a personal AI workspace for chatting with different models and managing conversations and create custom AI personas. It's built to run locally while also connecting to cloud-based AI services when needed.
## Memory System

Each conversation remembers important context:

- Recent message buffer (last 8 messages)
- Semantic pins (bookmark key messages during the conversation)
- Conversation summaries (compressed history for longer chats)
- Importance scoring for prioritizing content
## Model Support

**Local models run via Ollama:**
- Qwen 2.5 Coder (3B) - coding tasks

**Cloud models (API access):**

- Claude 3.5 Sonnet - complex reasoning
- GPT-4 variants ( mini & nano ) - various tasks

Switch models mid-conversation or set defaults per persona.
## Persona System

Built-in persona manager for creating/editing personalities. Switch between coding assistant, general helper, or custom personalities

**Each Persona has their own:**
- System prompt that define how they behave
- Temperature and response settings
- Protected defaults so you always have working options

### Key Components
1. **Model Registry**: Adapter pattern for different AI providers
2. **Agent Service**: Core chat orchestration logic
3. **Session Router**: Chat persistence and retrieval
4. **Persona Manager**: UI for managing AI personalities
5. **Chat Workspace**: Main conversational interface
6. **Memory Manager**: Context awareness and summarization
### Architecture
- **Backend** (backend): Node.js/Express API server with TypeScript
- **Frontend** (frontend): Vue 3 + Vite SPA with TypeScript  
- **Database**: SQLite (Better-SQLite3) with 44KB active database
- **Package Management**: PNPM with workspace configuration
- **Build Tools**: TypeScript, ESLint, Prettier with Husky integration

