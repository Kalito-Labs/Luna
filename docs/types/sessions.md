# Sessions Type Definitions

This file documents the type definitions found in `/backend/types/sessions.ts`.

## Overview

The `sessions.ts` file defines the types related to user sessions in the Kalito application. Sessions represent conversation instances between users and AI assistants, maintaining state, history, and configuration throughout an interaction.

## Interfaces

### Session

```typescript
export interface Session {
  id: string
  name: string
  model: string | null
  recap: string | null
  persona_id: string | null
  created_at: string
  updated_at: string
  saved?: number // 0 = ephemeral (default), 1 = saved/persisted
}
```

Represents a conversation session in the application:

- `id`: Unique identifier for the session
- `name`: Display name or title of the session
- `model`: Identifier for the AI model being used, or null if not specified
- `recap`: Optional summary or recap of the session, or null if not available
- `persona_id`: Reference to a persona ID, or null if using default behavior
- `created_at`: Timestamp when the session was created
- `updated_at`: Timestamp when the session was last updated
- `saved`: Optional flag indicating persistence status (0 = ephemeral/temporary, 1 = saved/persisted)

### CreateSessionRequest

```typescript
export interface CreateSessionRequest {
  name?: string
  model?: string
  persona_id?: string
}
```

Request payload for creating a new session:

- `name`: Optional display name for the session
- `model`: Optional identifier for the AI model to use
- `persona_id`: Optional reference to a persona to apply

### UpdateSessionRequest

```typescript
export interface UpdateSessionRequest {
  id: string
  name?: string
  model?: string
  persona_id?: string
  recap?: string
  saved?: number
}
```

Request payload for updating an existing session:

- `id`: Identifier of the session to update
- `name`: Optional new name for the session
- `model`: Optional new AI model identifier
- `persona_id`: Optional new persona reference
- `recap`: Optional updated recap/summary
- `saved`: Optional persistence status update

## Usage in the Codebase

While direct import references to `sessions.ts` were not found in the grep search, sessions are clearly a fundamental component of the application. Based on the examination of related code:

1. `/backend/server.ts` includes session persistence functionality:
   ```typescript
   // Session persistence (save-only policy, recap, listing/deleting saved sessions)
   ```

2. `/backend/middleware/validation.ts` contains validation schemas for session-related operations:
   ```typescript
   * Session creation validation schema
   * Session update validation schema
   ```

3. `/backend/routes/agentRouter.ts` has several references to session management:
   ```typescript
   /* ----------------------- Transient session helpers ---------------------- */
   * Ensure a persistent session row exists (saved = 1).
   // Use or generate a session id (transient until explicitly saved)
   // Make sure a transient session row exists and bump updated_at
   ```

4. `/backend/logic/agentService.ts` accepts sessionId as a parameter:
   ```typescript
   sessionId?: string // new: session ID for conversation history retrieval
   ```

5. `/backend/routes/memoryRouter.ts` has endpoints for retrieving memory context for sessions:
   ```typescript
   * Get intelligent memory context for a session
   ```

These types support the session management system in Kalito, which maintains conversation state and allows users to save, resume, and manage their interactions with AI assistants.