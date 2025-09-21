# Kalito Space

Personal AI workspace for chatting with different models and managing conversations.

## Memory System

Each conversation remembers important context:
- Recent message buffer (last 8 messages)
- Semantic pins (bookmark key messages during the conversation)  
- Conversation summaries (compressed history for longer chats)
- Importance scoring for prioritizing content

Pins only work within the session you create them in. When you delete a session, its pins are removed too.

## Persona System

Create and manage different AI personalities:
- Each persona has its own system prompt and response style
- Switch between coding assistant, general helper, or custom personalities
- Built-in persona manager for creating/editing personalities
- Protected defaults so you always have working options

## Model Support

Mix local and cloud models depending on your needs:

**Local models (runs on your machine via Ollama):**
- Mistral 7B - general conversations
- Qwen 2.5 (3B) - lightweight responses  
- Qwen 2.5 Coder (3B) - coding tasks

**Cloud models (API access):**
- Claude 3.5 Sonnet - complex reasoning
- GPT-4 variants - various tasks

Switch models mid-conversation or set defaults per persona.

## Session Management

Conversations save automatically as you chat. Browse your session history, jump between conversations, or start fresh. No manual saving needed.

## Interface

Simple web interface with:
- Main chat area for conversations
- Session sidebar for managing conversation history  
- Persona manager for creating/editing AI personalities
- Model switching during conversations

## Tech Stack

Built with standard web technologies:
- Vue.js frontend for the interface
- Node.js/Express backend for API and logic
- SQLite database for storing conversations and settings
- Runs locally with cloud API connections when needed