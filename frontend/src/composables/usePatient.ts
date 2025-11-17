import { ref } from 'vue'

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

// Shared state for current patient
const currentPatient = ref<Patient | null>(null)
const isLoading = ref(false)
const isLoaded = ref(false)

export function usePatient() {
  const setPatient = (patient: Patient | null) => {
    currentPatient.value = patient
    isLoaded.value = true
  }

  const getPatient = () => {
    return currentPatient.value
  }

  const getPatientId = () => {
    return currentPatient.value?.id || '1762885449885-vyuzo96qop9' // Fallback to default
  }

  const getPatientName = () => {
    return currentPatient.value?.name || 'Friend'
  }

  const loadPatient = async () => {
    // Don't reload if already loaded or currently loading
    if (isLoaded.value || isLoading.value) {
      return currentPatient.value
    }

    isLoading.value = true
    try {
      const response = await fetch('/api/patients')
      if (response.ok) {
        const result = await response.json()
        const patients = result.data || []
        
        if (patients.length > 0 && patients[0]) {
          currentPatient.value = patients[0]
          isLoaded.value = true
        }
      }
    } catch {
      // Silent fail - will use fallback values
    } finally {
      isLoading.value = false
    }

    return currentPatient.value
  }

  return {
    currentPatient,
    setPatient,
    getPatient,
    getPatientId,
    getPatientName,
    loadPatient
  }
}
