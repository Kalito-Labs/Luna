# Messages Type Definitions

This file documents the type definitions found in `/backend/types/messages.ts`.

## Overview

The `messages.ts` file defines the basic message structures used throughout the Kalito application for representing chat interactions between users and AI assistants.

## Type Definitions

### Role

```typescript
export type Role = 'system' | 'user' | 'assistant'
```

A union type defining all possible roles in a chat conversation:

- `system`: System messages that provide instructions or context to the AI model
- `user`: Messages from the human user
- `assistant`: Messages from the AI assistant

This type follows the OpenAI-style message roles convention, making it compatible with various AI model APIs.

## Interfaces

### ChatMessage

```typescript
export interface ChatMessage {
  role: Role
  content: string
}
```

Represents a single message in the format expected by most AI model APIs:

- `role`: The sender role (system, user, or assistant)
- `content`: The text content of the message

This interface is typically used when sending messages to AI model APIs like OpenAI or Claude.

### Message

```typescript
export interface Message {
  id?: string
  role: Role
  text: string
  timestamp?: string
}
```

An extended message format used in the frontend applications:

- `id`: Optional unique identifier for the message
- `role`: The sender role (system, user, or assistant)
- `text`: The content of the message (renamed from `content` in ChatMessage)
- `timestamp`: Optional timestamp indicating when the message was created

## Additional Notes

A comment in the file indicates that `AgentRequest` type was previously defined here but has been moved to the `agent.ts` file to avoid duplication:

```typescript
// AgentRequest moved to agent.ts to avoid duplication
// Use AgentRequest from './agent' instead
```

## Usage in the Codebase

The Message type is imported in:

1. `/frontend/src/components/chat/ChatWorkspace.vue`:
   ```typescript
   import type { Message as SharedMessage } from '../../../../backend/types/messages'
   ```
   
   This suggests that the frontend chat interface uses this type to represent messages in the chat workspace UI component.

These message types provide a standardized way to represent conversations throughout the application, from the database layer to the API and UI components.