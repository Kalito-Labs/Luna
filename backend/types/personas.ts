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

/** How a persona was created - tracking origin for better UX */
export type PersonaCreatedFrom = 'template' | 'duplicate' | 'manual'

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
 * PersonaTemplate - therapeutic templates for creating specialized personas
 * These are pre-configured therapeutic personas that users can instantiate
 */
export interface PersonaTemplate {
  id: string
  name: string
  description: string
  icon: string
  category: PersonaCategory
  prompt_template: string
  temperature: number
  maxTokens: number
  topP: number
  repeatPenalty: number
  tags?: string // JSON array
  key_features?: string // JSON array of key features
  best_for?: string // Description of ideal use cases
  therapeutic_approaches?: string // JSON array
  example_datasets?: string // JSON array of recommended document types
  is_system: boolean // System template vs user-created
  is_active: boolean // Template availability
  usage_count: number // How many personas created from this
  created_at: string
  updated_at: string
}

/**
 * Canonical Persona record (DB + API)
 * - `category` is REQUIRED
 * - `is_default` flags system defaults (one per category, enforced by DB index)
 * - timestamps are required on the wire for consistency
 * - Enhanced with therapeutic specialization and user experience fields
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
  
  // === THERAPEUTIC ENHANCEMENT FIELDS ===
  /** Reference to the template this was created from */
  template_id?: string
  /** How this persona was created */
  created_from?: PersonaCreatedFrom
  /** JSON array of searchable tags */
  tags?: string
  /** User favorite flag */
  is_favorite?: boolean
  /** Number of times this persona has been used */
  usage_count?: number
  /** Last interaction timestamp */
  last_used_at?: string
  /** JSON object defining what user data this persona can access */
  builtin_data_access?: string
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
  
  // === ENHANCED FIELDS FOR PERSONA CREATION ===
  template_id?: string // If created from a template
  created_from?: PersonaCreatedFrom
  tags?: string
  builtin_data_access?: string
}

/** Client → Server: update request (sparse/partial) */
export interface UpdatePersonaRequest {
  name?: string
  prompt?: string
  description?: string
  icon?: string
  category?: PersonaCategory
  settings?: PersonaSettings
  
  // === ENHANCED FIELDS FOR PERSONA UPDATES ===
  tags?: string
  is_favorite?: boolean
  builtin_data_access?: string
}

/** Client → Server: create persona from template */
export interface CreateFromTemplateRequest {
  template_id: string
  persona_id: string
  name?: string // Override template name
  description?: string // Override template description
  customizations?: {
    prompt_modifications?: string
    temperature?: number
    maxTokens?: number
    topP?: number
    repeatPenalty?: number
    tags?: string
    builtin_data_access?: string
  }
}

/* ------------------------------------------------------------------ */
/* Canonical API response envelopes (via shared)                       */
/* ------------------------------------------------------------------ */

export type PersonaItemResponse = ApiSuccessItem<Persona>
export type PersonaListResponse = ApiSuccessList<Persona>
export type PersonaTemplateItemResponse = ApiSuccessItem<PersonaTemplate>
export type PersonaTemplateListResponse = ApiSuccessList<PersonaTemplate>

export interface PersonaDeletedResponse {
  version: typeof API_CONTRACT_VERSION
  ok: true
}

export interface PersonaFromTemplateResponse {
  version: typeof API_CONTRACT_VERSION
  ok: true
  data: {
    persona: Persona
    template: PersonaTemplate
  }
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
