# Repository Overview

## Directory Structure and Technologies

- **backend/** – Node.js/Express server written in TypeScript, containing the API logic, AI model integration, and database access. It includes subfolders for routes, business logic, database, utilities, and type definitions. The backend is the core “Personal AI Conversational Interface” (KalitoSpace) service.
    
- **frontend/** – Vue 3 single-page application (SPA) that serves as the user interface. It contains Vue components (e.g. chat UI, persona modals), a router, and client-side logic to communicate with the backend. The frontend is designed as a web/PWA app (with potential for native integration) and uses modern tooling (Vite) for development.
    
- **docs/** – Documentation files describing aspects of the system (e.g. model preloader design). These help explain architectural decisions like how AI models are warmed up on startup.
    
- **Project Config** – Various config files and scripts (e.g. package.json, TypeScript configs, ESLint) exist for both backend and frontend, reflecting a monorepo structure. For example, the backend package.json declares dependencies like Express, OpenAI/Anthropic SDKs, and SQLite library, while the frontend likely has its own build config for the Vue app.
    

## Backend: Express Server and AI Logic

The backend is an Express server (backend/server.ts) that exposes a set of RESTful API endpoints under /api/* and orchestrates AI model calls, chat sessions, and data persistence:

- **Express App & Middleware:** On startup, it loads configuration from .env, applies security middleware (Helmet, CORS), request size limits, and rate limiting. A health-check endpoint at /api/health returns the service status. The server also trusts proxy headers in production and logs startup info via Winston.
    
- **API Routes:** The server mounts several routers, each handling a core feature area:
    
- **/api/agent** – **Chat agent endpoint.** Receives user messages and returns AI responses. This is the primary chat interface used by the frontend. It supports both single-response requests and Server-Sent Events for streaming replies.
    
- **/api/sessions** – **Session management.** Allows saving, listing, or deleting chat sessions (conversation histories). Sessions are automatically created when a conversation starts and marked saved for persistence.
    
- **/api/personas** – **Persona library.** CRUD for AI personas (custom system prompts and default settings). This lets users define “characters” or assistant profiles. Default personas (e.g. Cloud vs Local assistant) are pre-seeded in the database.
    
- **/api/models** – **Model registry.** Provides information about available AI models. For example, a GET /api/agent/models returns the list of model adapters (with id, name, type) that the backend can use. There’s also an /api/models/status endpoint to check local model loading status (integrating with the Ollama service for local models).
    
- **/api/memory** – **Conversation memory system.** Manages pinned facts and summary snippets for long conversations. This supports the “hybrid memory” feature where older chat context is distilled into summaries or important notes.
    
- **Core Logic (Agent Service):** The heart of the backend’s chat functionality is the **Agent Service** (backend/logic/agentService.ts). When the frontend sends a message to /api/agent, the backend will: validate the request, ensure a session record exists, and save the user’s message to the database. It then builds the AI **prompt context** by combining the selected persona’s system prompt and relevant conversation history:
    
- The selected **Persona** ID (if any) is used to fetch the persona’s predefined prompt and model settings from the DB. This becomes a system prompt that guides the AI’s behavior.
    
- A **MemoryManager** module constructs enhanced conversation context from the session’s history, including recent messages, prior summaries, and “semantic pins” (notable info). Older messages may be summarized or marked as historical reference to stay within context length limits.
    
- The latest user query plus this context are then passed to the appropriate AI model.
    
- **Model Adapter System:** The backend is designed to interface with multiple AI model backends through a unified adapter interface. It uses a **Model Registry** pattern (backend/logic/modelRegistry.ts) to register each model adapter and allow lookups by model ID. Key adapters include:
    
- **OpenAI GPT models:** Adapters for GPT-4.1 and GPT-5 variants (e.g. “gpt-4.1-mini”, “gpt-5-nano”) are defined using factory methods. These call OpenAI’s API (chat or completion endpoints) and support both full output and streaming. The model configurations (context window, default tokens, pricing, etc.) are centralized in a config file.
    
- **Anthropic Claude:** An adapter for Claude 4.1 (Anthropic’s model) is implemented (claudeAdapter.ts). It uses the Anthropc SDK with the 200k token context model and supports both synchronous and streaming generation. For streaming, it yields partial chunks as they arrive from Claude’s API.
    
- **Local LLM (Ollama):** The system integrates a local model via **Ollama**, which runs models on-device. For example, an adapter for a Qwen 2.5 Code model (3B parameters) calls Ollama’s HTTP API at localhost:11434. It maps general settings (temperature, max tokens, stop sequences, etc.) to Ollama’s options and handles Ollama’s JSONL streaming responses. Local models are marked with type 'local' and have their own IDs (e.g. “qwen-2.5-coder-3b”).
    
- All these adapters conform to a common interface (LLMAdapter) with methods generate() for one-shot completion and generateStream() for streaming. The **ModelRegistry** registers each with its canonical ID and aliases (for backward-compatible names) so that a model can be looked up by ID or alias. The Agent Service finds the right adapter via getModelAdapter(modelName) and invokes it to get the AI’s reply.
    
- **Request/Response Flow:** For each chat message, the /api/agent handler does the following:
    
- **Session & Message Saving:** It generates or accepts a sessionId and calls ensurePersistentSession to record the session in the sessions table (with a default name like "New Chat"). Then it inserts the user’s message into the messages table with an importance score calculated by the memory system (for context pruning later).
    
- **AI Response Generation:** It invokes either runAgent (for normal calls) or runAgentStream (for SSE streaming) from the Agent Service, passing along the user input, system prompt (persona), model name, and combined settings. The Agent Service assembles the full prompt (persona prompt + conversation history + user query) and calls the model adapter. For streaming responses, the backend sets the HTTP response to **event-stream** and iteratively writes chunks as they come.
    
- **AI Message Saving:** Once the model yields a complete answer, the backend saves the assistant’s reply into the messages table (with role "assistant", the model id, and token usage if available). It updates the session’s updated_at timestamp and may update a running conversation summary (“recap”) for the session. The MemoryManager will decide if the conversation has grown long enough to warrant summarization; if so, it automatically generates or updates a summary in the background.
    
- **Response to Client:** Finally, the /api/agent endpoint returns the AI’s reply (and token usage) to the client, or ends the SSE stream with a final "done": true event. Error conditions are caught and reported as JSON errors or SSE error events without crashing the server.
    
- **Memory & Summarization:** The **MemoryManager** (backend/logic/memoryManager.ts) analyzes message importance and creates **conversation summaries** and **semantic pins** for long chats. When building context for a new query, it retrieves the most important recent messages, plus any summary snippets of older exchanges, and prepends them as system-level context with instructions not to deviate from the current question. For example, multiple older messages might be condensed into a single “historical reference” system message, and critical facts are pinned in another system message. This way, the AI gets a focused history. The memory system’s state (summaries, pins) is stored in dedicated DB tables (see below) and managed via /api/memory endpoints.
    
- **Other Backend Features:** The backend uses Zod schemas for validating input (e.g., persona payloads), and has centralized error handling (with consistent JSON error responses). It also logs key events (requests, errors, model usage) using a Winston logger. On startup, a **Model Preloader** runs to pre-load local models into memory (via Ollama) to avoid initial latency. This preloading is done asynchronously and followed by periodic warming pings to keep models active in RAM. Overall, the backend is robust and modular, separating concerns of routing, AI logic, and persistence.
    

## Frontend: Vue 3 Application (User Interface)

The frontend is a Vue.js 3 application (frontend/) that provides an interface to interact with the AI assistant. Key characteristics of the frontend:

- **Vue SPA Structure:** It uses a single-page application approach. The main entry (main.ts) initializes the app with createApp(App) and sets up a Vue Router for navigation. Global styles are imported (e.g. main.css), and the app is mounted on a DOM element (#app). The code indicates a PWA mode; it logs whether it’s running as a web/PWA build and can accommodate a “native” flag (possibly for a future Electron or mobile build).
    
- **Components and Views:** The UI is composed of Vue single-file components. For example, there is a **PersonaEditModal.vue** component for creating/editing persona profiles through a form. We can infer other components exist for the chat interface (chat window, message list), session sidebar (to list or switch conversations), and settings. The persona modal UI shows fields for name, icon, category (cloud/local), description, the system prompt text, and tuning sliders for model settings like temperature, max tokens, top-p, repetition penalty, etc.. This matches the data stored in the persona object in the backend.
    
- **State Management:** The frontend likely manages the current conversation state (messages, selected persona, chosen model, etc.) in memory and possibly localStorage. Indeed, utility functions in frontend/src/core.ts use window.localStorage to save or restore the current session ID, messages, and settings. This ensures if the user refreshes the page or reopens the app, the last session can be reloaded, improving continuity.
    
- **Backend API Communication:** The Vue app communicates with the backend through RESTful fetch calls (or SSE for streaming). For instance, a core function sendMessageToAgent posts a JSON payload to /api/agent and awaits the assistant’s reply. This payload includes the user’s input, the chosen model key, optional system prompt (persona prompt), and any settings or file IDs. The response is parsed and returned to the UI (with the reply text and token usage). In the streaming case, a similar function opens an EventSource or uses fetch with the text/event-stream response to yield incremental delta chunks of the reply. The frontend then appends these chunks to the on-screen conversation as the AI “typing” effect.
    
- **Shared Types and Validation:** Notably, the frontend imports TypeScript types from the backend (via relative paths to backend/types/*) for Request/Response shapes. This ensures the data contract between frontend and backend is consistent (e.g. the structure of AgentRequest, AgentResponse, Persona types). It likely also uses these types to do client-side validation or to shape form data (for example, matching the Zod schema constraints for persona fields).
    
- **User Experience Features:** The UI provides mechanisms to manage chats and personas. Users can create new personas or edit existing ones via the modal (with form validation feedback as seen by error messages in the template). The chat interface presumably allows switching the active persona or model (the presence of a “model” or “persona” selector is implied by session records storing persona_id and model). Also, default personas (Cloud vs Local) might be auto-selected based on category. The frontend likely has a sidebar for sessions (as the backend supports listing saved sessions) and the ability to save/rename a chat (the sessionRouter is described as “save-only policy, recap, listing/deleting saved sessions”, meaning the UI can mark a session as saved or remove it).
    
- **Design and Platform:** The component code hints at a “desktop-first” design (the persona modal has comments about being tuned for large screens and an Electron frameless window environment). So the UI may have been designed to work nicely in a desktop application context (Electron) in addition to the browser. The app likely uses a minimal, custom-styled design (there are CSS classes like .modal, .form-input, slider components, etc., suggesting custom CSS rather than a heavy UI framework). The main.css and component styles create a cohesive “glass” theme (as seen with class names like glass-slider).
    
- **Progressive Web App:** The logs in main.ts show it identifies as "web/PWA build" and sets some flags if in dev mode. This suggests the app can be installed as a PWA for offline use. The localStorage persistence of the last session supports offline or at least seamless resume. (Though full offline chat would require local models – which exists via Ollama integration – so it’s plausible that when using a local persona/model, the app could work without internet).
    
- In summary, the frontend provides a rich interface for chat and configuration, and it fully relies on the backend APIs for functionality. All frontend logic (sending messages, editing personas, fetching model lists) ties into the backend, meaning it should be largely reusable for the text-based game concept (the UI can be adapted to game messages and scenarios, but the communication and state management groundwork is in place).
    

## SQLite Database Schema and Persistence

The project uses a local **SQLite database** (via the **Better-SQLite3** library) as a lightweight datastore for chats, personas, and memory. The database file (e.g. kalito.db) is created at startup if not present. Key aspects of the DB setup:

- **Initialization:** On server launch, backend/db/init.ts runs. It determines the DB file path (development vs packaged build) and creates the file if needed. Then it executes CREATE TABLE IF NOT EXISTS statements for all required tables and sets PRAGMA foreign keys on. This ensures the schema is up-to-date each run.
    
- **Schema (Core Tables):** The schema defines the following tables to support the application’s features:
    
- **sessions** – Stores chat sessions (conversations). Columns: id (TEXT primary key, likely a timestamp or UUID), name (user-defined or default title), model (the model id used in the session), recap (a summary of the conversation, for quick reference), persona_id (the persona used, if any), timestamps, and a saved flag. The saved flag indicates if the session is user-saved/shown in the UI sidebar (unsaved transient sessions might still be in DB for continuity, but possibly hidden).
    
- **messages** – Stores individual messages in a conversation. Columns: id (INTEGER primary key autoincrement), session_id (links to a session, with cascade delete on session removal), role (e.g. 'user' or 'assistant'), text (the message content), model_id (which model produced this message, useful for multi-model sessions), token_usage (tokens consumed by this message, if known), importance_score (REAL, a score used by the memory system to rank how important the message is), and created_at timestamp. An index is later created on (session_id, created_at) for retrieving messages by session in chronological order.
    
- **personas** – Stores AI personas (custom assistants). Columns include id (TEXT primary key, an identifier), name (display name), prompt (the system prompt defining the persona’s behavior), description (short text about it), icon (emoji or symbol), category (cloud or local), default_model (preferred model for that persona), suggested_models (maybe a list of model IDs suitable for it), and **per-model settings** like temperature, maxTokens, topP, repeatPenalty, stopSequences (all optional tuning parameters). Also an is_default flag marks if it’s a built-in default persona. This table allows the app to list personas, and each persona can carry custom generation settings. The persona CRUD API writes to this table (with input validated by Zod).
    
- **conversation_summaries** – Stores summary snippets of conversations for memory. Columns: id (TEXT primary key, perhaps a UUID), session_id (link to the conversation), summary (textual summary), message_count (how many messages it summarizes), start_message_id and end_message_id (range of messages covered by this summary), importance_score (a score indicating how important this summary is), and timestamp. The MemoryManager may generate these when a session gets long; they are then used as background context (fed to the model as a system message) instead of all raw messages.
    
- **semantic_pins** – Stores **pinned facts** or details extracted from the conversation to always keep in context. Columns: id (TEXT primary key), session_id, content (the text of the pinned info), source_message_id (reference to the original message this was derived from, if any), importance_score (likely weight of this pin), pin_type (e.g. 'user' or 'assistant' indicating who said it or what kind of info it is), plus timestamp These pins represent crucial info (like names, key facts) that the AI should always remember during that session. The memory system likely promotes certain messages to pins based on importance or via a future user action.
    
- **Migrations:** The init script includes a **migration routine** that checks for the existence of certain columns and adds them if missing. For example, if an older DB is missing suggested_models or is_default in personas, or importance_score in messages, it runs ALTER TABLE to add them. It also ensures the foreign key constraint on messages → sessions by rebuilding the messages table if needed (wrapping in a transaction). This indicates the project has evolved, adding new features (like message importance) while preserving existing data.
    
- **Seeding Defaults:** After ensuring schema, the code seeds a couple of **default personas** if they don’t exist. Specifically:
    
- _Default Cloud Assistant_ (id: "default-cloud") – A general-purpose AI persona for cloud models, with a friendly helpful prompt and typical default settings (temp ~0.7, maxTokens 1500, etc.).
    
- _Default Local Assistant_ (id: "default-local") – A persona for local/offline models, emphasizing privacy and concise answers, with slightly different default settings (temp ~0.6, lower max tokens, etc.). Both are marked is_default=1. These serve as fallback personas and are used if a session’s persona is deleted (the deletion logic reassigns sessions to a default of the same category). The persona management API prevents deleting these default entries.
    
- **Data Access in Backend:** The backend interacts with SQLite synchronously via prepared statements (Better-SQLite3). For example, when a persona is created, the API inserts a new row in personas. When listing personas, it SELECTs all rows and maps them to JSON (combining the discrete settings fields into a nested settings object). Chat sessions and messages are similarly managed:
    
- On each new user message, an INSERT goes into messages and an UPDATE touches the session’s updated_at.
    
- After the AI responds, another INSERT adds the assistant message.
    
- The sessions table is updated with recap (summary) once the MemoryManager produces one in the background.
    
- The memoryRouter (though not shown above) likely provides endpoints to fetch or pin memories, which would SELECT from semantic_pins or INSERT new pins.
    
- The sessionRouter likely allows marking a session as saved (setting saved=1 or updating the name), listing all sessions (SELECT * FROM sessions), and deleting a session (which triggers cascade delete of its messages, summaries, pins).
    
- **DB File Location:** By default in development, the SQLite file is kalito.db in the project root (or in backend directory). In a production build, it appears the path might adjust (looking at __dirname.includes('dist') ? '../../../db/kalito.db' suggests that in a packaged app the DB might reside outside the bundled code. In any case, it’s a single-file database, making it easy to copy or reset for the new game project.
    
- **Reusability:** This SQLite setup provides a ready-made persistence layer for the text-based game refactor. The **sessions/messages** schema can be repurposed to track game sessions and transcripts (which are essentially also a sequence of messages). The **personas** could be repurposed as game characters or NPC profiles (with their dialogue style in the prompt). The memory system (summaries and pins) could translate to game lore memory or quest state tracking. Having this structured storage and retrieval system in place will save development time, as we can adapt the tables to new needs or use them as-is for storing game narrative state.
    

## Summary of Key Components to Reuse

In summary, the Kalito Labs repository provides a full-stack foundation consisting of:

- **Frontend UI (Vue 3):** A dynamic, component-based interface for text interactions and configuration. This can be reused as the game’s interface – leveraging the existing chat view and modals for game dialogues, character management (personas as characters), etc., with only cosmetic or workflow changes.
    
- **Backend Logic (Node/Express):** A robust API server that handles message exchange, integrates multiple AI models, and manages state. The game can utilize the same agent mechanism to handle player inputs as “prompts” and AI model outputs as game narrative or NPC responses. The persona system can define characters, and the session logic can represent game sessions or chapters. The modular model adapters allow switching between AI engines easily for different game needs (local vs cloud).
    
- **SQLite Database:** A persistence layer already structured for conversations, which maps closely to interactive text story data. We can store game session progress, dialogue history, and even use the memory features to maintain long-term story coherence. The existing schema can be extended if needed (for example, to store player stats or inventory), but it covers the essentials for text-based interaction out of the box.
    

All these components – frontend, backend, and database – form a solid groundwork. With a clear grasp of this repo’s layout and key parts, we are prepared to proceed with the refactor, transforming this conversational AI platform into the envisioned text-based game while reusing as much of the established structure as possible.

**Sources:**

- Kalito Labs Repository – **Backend** code (server setup, routes, logic, DB schema) and **Frontend** code (Vue initialization, API calls, components).
    

