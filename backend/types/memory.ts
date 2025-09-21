// backend/types/memory.ts
// Phase 2 Memory System Types
// Date: August 24, 2025

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

export interface SemanticPin {
  id: string
  session_id: string
  content: string
  source_message_id?: string
  importance_score: number
  pin_type: 'manual' | 'auto' | 'code' | 'concept' | 'system'
  created_at: string
}

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

export interface MemoryContext {
  recentMessages: MessageWithImportance[]
  semanticPins: SemanticPin[]
  summaries: ConversationSummary[]
  totalTokens: number
}

// Request types for API endpoints
export interface CreateSummaryRequest {
  session_id: string
  start_message_id: string
  end_message_id: string
  message_count: number
}

export interface CreatePinRequest {
  session_id: string
  content: string
  source_message_id?: string
  importance_score?: number
  pin_type?: 'manual' | 'auto' | 'code' | 'concept' | 'system'
}

// Response types
export interface MemoryStats {
  totalMessages: number
  totalSummaries: number
  totalPins: number
  oldestMessage: string
  newestMessage: string
  averageImportanceScore: number
}
