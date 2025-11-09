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
  patient_id?: string | null // Track patient focus for conversation context
  session_type?: string | null
  related_record_id?: string | null
  care_category?: string | null
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
  patient_id?: string | null
}
