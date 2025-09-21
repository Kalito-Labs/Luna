# Memory Type Definitions

This file documents the type definitions found in `/backend/types/memory.ts`.

## Overview

The `memory.ts` file contains type definitions for the Phase 2 Memory System, which was implemented on August 24, 2025. These types support advanced memory management features including conversation summarization, semantic pinning, and message importance scoring.

## Interfaces

### ConversationSummary

```typescript
export interface ConversationSummary {
  id: string
  session_id: string
  summary: string
  message_count: number
  start_message_id: string
  end_message_id: string
  importance_score: number
  created_at: string
}
```

Represents a summary of a conversation segment:

- `id`: Unique identifier for the summary
- `session_id`: ID of the session this summary belongs to
- `summary`: The actual text summary of the conversation segment
- `message_count`: Number of messages included in this summary
- `start_message_id`: ID of the first message in the summarized segment
- `end_message_id`: ID of the last message in the summarized segment
- `importance_score`: Numerical score (likely 0-1) indicating the importance of this summary
- `created_at`: Timestamp when the summary was created

### SemanticPin

```typescript
export interface SemanticPin {
  id: string
  session_id: string
  content: string
  source_message_id?: string
  importance_score: number
  pin_type: 'manual' | 'auto' | 'code' | 'concept' | 'system'
  created_at: string
}
```

Represents an important piece of information pinned from a conversation:

- `id`: Unique identifier for the pin
- `session_id`: ID of the session this pin belongs to
- `content`: The actual text content of the pin
- `source_message_id`: Optional ID of the message this pin was created from
- `importance_score`: Numerical score indicating the importance of this pin
- `pin_type`: Category of the pin:
  - `manual`: Created explicitly by the user
  - `auto`: Created automatically by the system
  - `code`: Contains code snippets
  - `concept`: Contains important concepts
  - `system`: Created by the system for operational purposes
- `created_at`: Timestamp when the pin was created

### MessageWithImportance

```typescript
export interface MessageWithImportance {
  id: number
  session_id: string
  role: 'user' | 'assistant' | 'system'
  text: string
  model_id: string
  token_usage: number
  created_at: string
  importance_score: number
}
```

Extends the basic message type with an importance score:

- `id`: Numeric message identifier
- `session_id`: ID of the session this message belongs to
- `role`: Role of the message sender (user, assistant, or system)
- `text`: The actual message content
- `model_id`: ID of the AI model used for this message (if applicable)
- `token_usage`: Number of tokens used by this message
- `created_at`: Timestamp when the message was created
- `importance_score`: Numerical score indicating the importance of this message

### MemoryContext

```typescript
export interface MemoryContext {
  recentMessages: MessageWithImportance[]
  semanticPins: SemanticPin[]
  summaries: ConversationSummary[]
  totalTokens: number
}
```

Composite structure containing all memory elements for a context window:

- `recentMessages`: Array of recent messages with importance scores
- `semanticPins`: Array of semantic pins relevant to the current context
- `summaries`: Array of conversation summaries
- `totalTokens`: Total token count for all included memory elements

### CreateSummaryRequest

```typescript
export interface CreateSummaryRequest {
  session_id: string
  start_message_id: string
  end_message_id: string
  message_count: number
}
```

Request payload for creating a new conversation summary:

- `session_id`: ID of the session to create a summary for
- `start_message_id`: ID of the first message to include in the summary
- `end_message_id`: ID of the last message to include in the summary
- `message_count`: Number of messages to be summarized

### CreatePinRequest

```typescript
export interface CreatePinRequest {
  session_id: string
  content: string
  source_message_id?: string
  importance_score?: number
  pin_type?: 'manual' | 'auto' | 'code' | 'concept' | 'system'
}
```

Request payload for creating a new semantic pin:

- `session_id`: ID of the session to create a pin for
- `content`: The text content to pin
- `source_message_id`: Optional ID of the message this pin is created from
- `importance_score`: Optional importance score (system may calculate if not provided)
- `pin_type`: Optional type of pin (defaults may apply based on the system)

### MemoryStats

```typescript
export interface MemoryStats {
  totalMessages: number
  totalSummaries: number
  totalPins: number
  oldestMessage: string
  newestMessage: string
  averageImportanceScore: number
}
```

Statistical overview of a session's memory:

- `totalMessages`: Total number of messages in the session
- `totalSummaries`: Total number of summaries created for the session
- `totalPins`: Total number of semantic pins in the session
- `oldestMessage`: Timestamp of the oldest message
- `newestMessage`: Timestamp of the newest message
- `averageImportanceScore`: Average importance score across all elements

## Usage in the Codebase

Memory types are imported in:

1. `/backend/logic/agentService.ts`:
   ```typescript
   import type { ConversationSummary, SemanticPin, MessageWithImportance } from '../types/memory'
   ```
   These types are used by the agent service to access and manage memory components while processing user requests.

2. The MemoryManager class (`/backend/logic/memoryManager.ts`) likely uses these types extensively for implementing the memory system functionality, including summarization and context assembly.

These types form the foundation of Kalito's advanced memory management system that helps maintain context across long conversations without overwhelming AI models with excessive history.