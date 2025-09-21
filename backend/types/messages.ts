// backend/types/messages.ts
/**
 * Chat roles used in OpenAI-style message payloads.
 */
export type Role = 'system' | 'user' | 'assistant'

/**
 * Represents a single message in a chat session.
 */
export interface ChatMessage {
  role: Role
  content: string
}

/**
 * UI message format for frontend applications
 */
export interface Message {
  id?: string
  role: Role
  text: string
  timestamp?: string
}

// AgentRequest moved to agent.ts to avoid duplication
// Use AgentRequest from './agent' instead
