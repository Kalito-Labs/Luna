/**
 * useCurrentUser composable
 * Single-user app: Provides consistent access to Kaleb's patient data
 * across all therapy modules (CBT, ACT, DBT, medications, etc.)
 */

import { ref, computed, onMounted } from 'vue'

interface Patient {
  id: string
  name: string
  date_of_birth?: string
  gender?: string
  phone?: string
  city?: string
  state?: string
  occupation?: string
  occupation_description?: string
  languages?: string
  notes?: string
  active?: number
  created_at?: string
  updated_at?: string
}

// Shared state across all components
const currentPatient = ref<Patient | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

/**
 * Load the current user (Kaleb) from the database
 */
async function loadCurrentUser() {
  if (currentPatient.value) {
    // Already loaded
    return currentPatient.value
  }

  isLoading.value = true
  error.value = null

  try {
    // Fetch all patients and find Kaleb
    const response = await fetch(`${API_BASE_URL}/api/patients`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to load patient data: ${response.statusText}`)
    }

    const data = await response.json()
    
    // Handle different response formats:
    // 1. Plain array: [{ id, name, ... }]
    // 2. Paginated: { patients: [...] }
    // 3. Versioned API: { version: "1", data: [...] }
    const patients = Array.isArray(data) 
      ? data 
      : (data.data || data.patients || [])
    
    console.log('🔍 API Response format:', { 
      isArray: Array.isArray(data), 
      hasData: !!data.data,
      hasPatientsKey: !!data.patients,
      version: data.version 
    })
    console.log('🔍 Parsed patients array:', patients)
    console.log('🔍 Number of patients:', patients.length)
    
    if (!Array.isArray(patients)) {
      console.error('Unexpected API response format:', data)
      throw new Error('Invalid response format from /api/patients')
    }
    
    if (patients.length > 0) {
      console.log('🔍 Patient names:', patients.map((p: Patient) => p.name))
    }
    
    // Find patient named "Kaleb" (case-insensitive)
    const kaleb = patients.find((p: Patient) => 
      p.name.toLowerCase() === 'kaleb' || 
      p.name.toLowerCase().includes('kaleb')
    )

    if (!kaleb) {
      console.error('❌ Patient "Kaleb" not found. Available patients:', patients.map((p: Patient) => p.name))
      throw new Error('Patient "Kaleb" not found in database. Please ensure your profile exists in KalitoHub.')
    }

    currentPatient.value = kaleb
    console.log('✅ Loaded current user:', kaleb.name, 'ID:', kaleb.id)
    
    return kaleb
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load user data'
    console.error('❌ Error loading current user:', err)
    throw err
  } finally {
    isLoading.value = false
  }
}

/**
 * Composable for accessing current user data
 */
export function useCurrentUser() {
  // Auto-load on first use if not already loaded
  onMounted(() => {
    if (!currentPatient.value && !isLoading.value) {
      loadCurrentUser().catch(err => {
        console.error('Failed to auto-load current user:', err)
      })
    }
  })

  const patientId = computed(() => currentPatient.value?.id || null)
  const patientName = computed(() => currentPatient.value?.name || 'User')
  const isReady = computed(() => !!currentPatient.value)

  return {
    // State
    currentPatient,
    isLoading,
    error,
    
    // Computed
    patientId,
    patientName,
    isReady,
    
    // Methods
    loadCurrentUser,
    
    // Convenience method for ensuring user is loaded
    async ensureLoaded() {
      if (!currentPatient.value && !isLoading.value) {
        await loadCurrentUser()
      }
      return currentPatient.value
    }
  }
}
