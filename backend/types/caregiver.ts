// backend/types/caregiver.ts

/**
 * Singleton caregiver profile - represents the single caregiver (you)
 * This is your personal profile for providing context to AI models
 */
export interface Caregiver {
  id: string
  name: string
  date_of_birth?: string
  email?: string
  phone?: string
  address?: string
  relationship?: string  // e.g., "son", "daughter", "spouse"
  emergency_contact_name?: string
  emergency_contact_phone?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface CreateCaregiverRequest {
  name: string
  date_of_birth?: string
  email?: string
  phone?: string
  address?: string
  relationship?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  notes?: string
}

export interface UpdateCaregiverRequest {
  name?: string
  date_of_birth?: string
  email?: string
  phone?: string
  address?: string
  relationship?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  notes?: string
}