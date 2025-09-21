# Kalito Backend Type System Documentation

This document provides an overview of the type system used in the Kalito backend, explaining the purpose of each type file and the relationships between them.

## Type System Overview

The Kalito backend is built with TypeScript and uses a well-structured type system to ensure type safety and maintain consistent interfaces across the application. The type definitions are organized in the `/backend/types/` directory, with each file focusing on a specific domain area.

## Type Files Summary

| File | Description | Key Types |
|------|-------------|-----------|
| [agent.ts](./agent.md) | Defines AI agent configurations and API payloads | `AgentConfig`, `AgentRequest`, `AgentResponse` |
| [api.ts](./api.md) | Standardized API response formats and error codes | `ApiErrorResponse`, `ApiSuccessItem<T>`, `ApiSuccessList<T>` |
| [memory.ts](./memory.md) | Memory system types for conversation context management | `ConversationSummary`, `SemanticPin`, `MemoryContext` |
| [messages.ts](./messages.md) | Chat message structures | `Role`, `ChatMessage`, `Message` |
| [models.ts](./models.md) | Language model adapter interface | `LLMAdapter` |
| [personas.ts](./personas.md) | Persona system for AI personality customization | `Persona`, `PersonaSettings`, `PersonaCategory` |
| [sessions.ts](./sessions.md) | Conversation session management | `Session`, `CreateSessionRequest`, `UpdateSessionRequest` |

## Type Relationships

The type system in Kalito is interconnected, with several relationships between the different domains:

### Agent and Model Relationship

The `AgentRequest` (from `agent.ts`) is used to communicate with AI models via the `LLMAdapter` interface (from `models.ts`). The agent service constructs these requests based on:

- Selected model
- User input
- Optionally, a persona's system prompt
- Current session's context and memory

### Memory and Message Relationship

The memory system (types from `memory.ts`) extends the basic message types (from `messages.ts`) with additional metadata:

- `MessageWithImportance` adds an importance score to the basic `Message` type
- Memory components like summaries and pins refer to messages by ID

### Session and Persona Relationship

Sessions (from `sessions.ts`) can reference personas (from `personas.ts`) via the `persona_id` field, establishing which persona's behavior and settings should be applied to the conversation.

### API Contract Integration

All API endpoints use the standardized response formats defined in `api.ts`, ensuring consistent error handling and response structures. This is especially visible in the persona types, which define specific response types using the API contract:

```typescript
export type PersonaItemResponse = ApiSuccessItem<Persona>
export type PersonaListResponse = ApiSuccessList<Persona>
```

## Key Design Patterns

### Consistent API Response Format

All API responses follow the same envelope structure with:
- `version` field for API versioning
- `data` field for successful responses or `error` field for error responses

### Type Guard Functions

Runtime type guards are implemented for key response types, especially in `personas.ts`, to help with type safety when working with API responses.

### Optional Fields Pattern

Many request types use optional fields to support partial updates and sensible defaults:

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

### Hybrid Model Support

The type system supports both local and cloud-based AI models through:
- `PersonaCategory` enum with 'cloud' | 'local' values
- `LLMAdapter` interface with `type: 'cloud' | 'local'` property

## Key Subsystems

### Memory Management

The memory management system (types in `memory.ts`) is designed to:
- Store and retrieve messages with importance scoring
- Create and manage conversation summaries
- Handle semantic pins for important information
- Assemble context for AI model requests with token budget optimization

### Persona Management

The persona system (types in `personas.ts`) provides:
- Customized AI personalities with specific system prompts
- Model-specific settings tuning
- Default persona selection per model category

### Session Management

The session system (types in `sessions.ts`) manages:
- Conversation persistence (saved vs. ephemeral)
- Session metadata like names and recaps
- Linking sessions to specific models and personas

## Conclusion

The Kalito type system provides a robust foundation for the application, ensuring type safety and consistent interfaces across all components. The clear separation of concerns between different domain areas (agents, models, memory, etc.) makes the codebase more maintainable while allowing for complex interactions between these systems.