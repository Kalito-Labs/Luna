// backend/types/personas.ts
// Persona type definitions (uses shared API envelopes from ./api)

import {
  API_CONTRACT_VERSION,
  type ApiErrorResponse,
  type ApiSuccessItem,
  type ApiSuccessList,
} from './api'

/** Persona categories map 1:1 with model families you expose in UI */
export type PersonaCategory = 'cloud' | 'local'

/** Tuning knobs your adapters understand (kept sparse/optional) */
export interface PersonaSettings {
  /** 0.0–2.0 typical; UI sliders can constrain to 0.1–1.2 */
  temperature?: number
  /** Response cap; UI may constrain 50–4000 but keep it open here */
  maxTokens?: number
  /** 0.0–1.0 nucleus sampling */
  topP?: number
  /** e.g. 0.8–1.5 depending on backend */
  repeatPenalty?: number
}

/** Optional template entity if you surface prompt presets */
export interface PromptTemplate {
  id: string
  name: string
  content: string
  category: PersonaCategory
  icon: string
  settings?: PersonaSettings
}

/**
 * Canonical Persona record (DB + API)
 * - `category` is REQUIRED
 * - `is_default` flags system defaults (one per category, enforced by DB index)
 * - timestamps are required on the wire for consistency
 */
export interface Persona {
  id: string
  name: string
  prompt: string
  description?: string
  icon?: string
  category: PersonaCategory
  settings?: PersonaSettings
  is_default: boolean
  created_at: string
  updated_at: string
}

/** Client → Server: create request (ID is provided by UI) */
export interface CreatePersonaRequest {
  id: string
  name: string
  prompt: string
  description?: string
  icon?: string
  /** If omitted, backend may infer from active model; prefer sending explicitly */
  category?: PersonaCategory
  settings?: PersonaSettings
}

/** Client → Server: update request (sparse/partial) */
export interface UpdatePersonaRequest {
  name?: string
  prompt?: string
  description?: string
  icon?: string
  category?: PersonaCategory
  settings?: PersonaSettings
}

/* ------------------------------------------------------------------ */
/* Canonical API response envelopes (via shared)                       */
/* ------------------------------------------------------------------ */

export type PersonaItemResponse = ApiSuccessItem<Persona>
export type PersonaListResponse = ApiSuccessList<Persona>

export interface PersonaDeletedResponse {
  version: typeof API_CONTRACT_VERSION
  ok: true
}

/* ------------------------------------------------------------------ */
/* Optional runtime guards (handy in frontend fetch layers)            */
/* ------------------------------------------------------------------ */

export function isApiErrorResponse(x: unknown): x is ApiErrorResponse {
  return !!(
    x &&
    typeof x === 'object' &&
    'error' in (x as any) &&
    typeof (x as any).error?.message === 'string' &&
    'version' in (x as any)
  )
}

export function isPersonaItemResponse(x: unknown): x is PersonaItemResponse {
  return !!(
    x &&
    typeof x === 'object' &&
    'data' in (x as any) &&
    (x as any).data &&
    typeof (x as any).data.id === 'string' &&
    typeof (x as any).data.name === 'string' &&
    typeof (x as any).data.prompt === 'string' &&
    typeof (x as any).data.category === 'string' &&
    'version' in (x as any)
  )
}

export function isPersonaListResponse(x: unknown): x is PersonaListResponse {
  return !!(
    x &&
    typeof x === 'object' &&
    Array.isArray((x as any).data) &&
    'version' in (x as any)
  )
}
