// backend/types/sessions.ts

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

export interface CreateSessionRequest {
  name?: string
  model?: string
  persona_id?: string
}

export interface UpdateSessionRequest {
  id: string
  name?: string
  model?: string
  persona_id?: string
  recap?: string
  saved?: number
}
