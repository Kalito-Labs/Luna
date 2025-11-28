/**
 * useTherapyStorage composable
 * Provides centralized therapy record management with backend integration
 * and localStorage fallback for offline support
 */

import { ref, computed, unref, type Ref } from 'vue'

export type TherapyType = 'cbt' | 'act' | 'dbt'

/**
 * Base therapy record interface
 */
export interface TherapyRecord<T = Record<string, unknown>> {
  id: string
  patient_id: string
  session_id?: string
  therapy_type: TherapyType
  data: T
  created_at: string
  updated_at: string
}

/**
 * CBT Thought Record data structure
 */
export interface CBTThoughtRecordData {
  situation: string
  automaticThought: string
  emotion: string
  emotionIntensity: number
  evidenceFor: string
  evidenceAgainst: string
  alternativeThought: string
  newEmotion: string
  newEmotionIntensity: number
}

/**
 * Configuration options for useTherapyStorage
 */
export interface TherapyStorageOptions {
  therapyType: TherapyType
  patientId: string | Ref<string>  // Accept both string and ref
  useBackend?: boolean // Default: true
  localStorageKey?: string // Default: `${therapyType}-records`
}

/**
 * Composable for managing therapy records with backend sync
 */
export function useTherapyStorage<T = Record<string, unknown>>(options: TherapyStorageOptions) {
  const {
    therapyType,
    patientId,
    useBackend = true,
    localStorageKey = `${therapyType}-records`
  } = options

  // State
  const records = ref<TherapyRecord<T>[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const isSynced = ref(false) // Track if data is synced with backend

  // API base URL
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

  /**
   * Load records from localStorage
   */
  const loadFromLocalStorage = (): TherapyRecord<T>[] => {
    try {
      const stored = window.localStorage.getItem(localStorageKey)
      if (stored) {
        return JSON.parse(stored) as TherapyRecord<T>[]
      }
    } catch (err) {
      // Error loading from localStorage
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error('Error loading from localStorage:', err)
      }
    }
    return []
  }

  /**
   * Save records to localStorage
   */
  const saveToLocalStorage = (data: TherapyRecord<T>[]): void => {
    try {
      window.localStorage.setItem(localStorageKey, JSON.stringify(data))
    } catch (err) {
      // Error saving to localStorage
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error('Error saving to localStorage:', err)
      }
    }
  }

  /**
   * Load records from backend
   */
  const loadFromBackend = async (): Promise<TherapyRecord<T>[]> => {
    const response = await fetch(
      `${API_BASE_URL}/api/therapy-records/patient/${unref(patientId)}?therapy_type=${therapyType}&sortOrder=DESC`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Backend error: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Load records (tries backend first, falls back to localStorage)
   */
  const load = async (): Promise<void> => {
    // Skip loading if patient ID is not set
    const currentPatientId = unref(patientId)
    if (!currentPatientId || currentPatientId.trim() === '') {
      console.warn('⏭️ Skipping load: patient ID not set')
      records.value = loadFromLocalStorage()
      return
    }

    isLoading.value = true
    error.value = null
    isSynced.value = false

    try {
      if (useBackend) {
        // Try to load from backend
        try {
          const backendRecords = await loadFromBackend()
          records.value = backendRecords
          isSynced.value = true
          
          // Update localStorage with backend data
          saveToLocalStorage(backendRecords)
        } catch (backendError) {
          // eslint-disable-next-line no-console
          console.warn('Backend unavailable, using localStorage:', backendError)
          // Fallback to localStorage
          records.value = loadFromLocalStorage()
          isSynced.value = false
        }
      } else {
        // Use only localStorage
        records.value = loadFromLocalStorage()
        isSynced.value = false
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load records'
      // eslint-disable-next-line no-console
      console.error('Error loading records:', err)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Save a new record
   */
  const save = async (data: T, sessionId?: string): Promise<boolean> => {
    isLoading.value = true
    error.value = null

    try {
      const newRecord: Omit<TherapyRecord<T>, 'id' | 'created_at' | 'updated_at'> = {
        patient_id: unref(patientId),  // Use unref to handle both string and Ref<string>
        session_id: sessionId,
        therapy_type: therapyType,
        data
      }

      if (useBackend) {
        // Try to save to backend
        try {
          console.log('🔵 Attempting backend save:', {
            url: `${API_BASE_URL}/api/therapy-records`,
            payload: newRecord
          })
          
          const response = await fetch(`${API_BASE_URL}/api/therapy-records`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(newRecord)
          })

          console.log('🔵 Backend response status:', response.status, response.statusText)

          if (!response.ok) {
            const errorText = await response.text()
            console.error('🔴 Backend error response:', errorText)
            throw new Error(`Backend error: ${response.statusText} - ${errorText}`)
          }

          const savedRecord = await response.json() as TherapyRecord<T>
          console.log('✅ Backend save successful:', savedRecord)
          
          // @ts-expect-error - Vue ref unwrapping type mismatch
          records.value.unshift(savedRecord)
          isSynced.value = true
          
          // Also save to localStorage as backup
          // @ts-expect-error - Vue ref unwrapping type mismatch
          saveToLocalStorage(records.value)
          
          return true
        } catch (backendError) {
          console.error('🔴 Backend save failed, falling back to localStorage:', backendError)
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.warn('Backend save failed, saving to localStorage only:', backendError)
          }
          
          // Fallback: save to localStorage with temporary ID
          const localRecord: TherapyRecord<T> = {
            ...newRecord,
            id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          
          // @ts-expect-error - Vue ref unwrapping type mismatch
          records.value.unshift(localRecord)
          // @ts-expect-error - Vue ref unwrapping type mismatch
          saveToLocalStorage(records.value)
          isSynced.value = false
          
          return true
        }
      } else {
        // Save only to localStorage
        const localRecord: TherapyRecord<T> = {
          ...newRecord,
          id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        // @ts-expect-error - Vue ref unwrapping type mismatch
        records.value.unshift(localRecord)
        // @ts-expect-error - Vue ref unwrapping type mismatch
        saveToLocalStorage(records.value)
        isSynced.value = false
        
        return true
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to save record'
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error('Error saving record:', err)
      }
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Delete a record by ID
   */
  const remove = async (id: string): Promise<boolean> => {
    isLoading.value = true
    error.value = null

    try {
      if (useBackend && !id.startsWith('local-')) {
        // Try to delete from backend
        try {
          const response = await fetch(`${API_BASE_URL}/api/therapy-records/${id}`, {
            method: 'DELETE'
          })

          if (!response.ok) {
            throw new Error(`Backend error: ${response.statusText}`)
          }

          // Remove from local state
          const index = records.value.findIndex(r => r.id === id)
          if (index > -1) {
            records.value.splice(index, 1)
            // @ts-expect-error - Vue ref unwrapping type mismatch
            saveToLocalStorage(records.value)
          }
          
          return true
        } catch (backendError) {
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.warn('Backend delete failed, removing from localStorage only:', backendError)
          }
          
          // Fallback: remove from localStorage
          const index = records.value.findIndex(r => r.id === id)
          if (index > -1) {
            records.value.splice(index, 1)
            // @ts-expect-error - Vue ref unwrapping type mismatch
            saveToLocalStorage(records.value)
            isSynced.value = false
            return true
          }
          return false
        }
      } else {
        // Remove only from localStorage
        const index = records.value.findIndex(r => r.id === id)
        if (index > -1) {
          records.value.splice(index, 1)
          // @ts-expect-error - Vue ref unwrapping type mismatch
          saveToLocalStorage(records.value)
          return true
        }
        return false
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete record'
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error('Error deleting record:', err)
      }
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Sync localStorage records to backend (for offline-created records)
   */
  const syncToBackend = async (): Promise<number> => {
    if (!useBackend) return 0

    const localRecords = records.value.filter(r => r.id.startsWith('local-'))
    if (localRecords.length === 0) return 0

    let syncedCount = 0

    for (const record of localRecords) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/therapy-records`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            patient_id: record.patient_id,
            session_id: record.session_id,
            therapy_type: record.therapy_type,
            data: record.data
          })
        })

        if (response.ok) {
          const savedRecord = await response.json() as TherapyRecord<T>
          
          // Replace local record with backend record
          const index = records.value.findIndex(r => r.id === record.id)
          if (index > -1) {
            // @ts-expect-error - Vue ref unwrapping type mismatch
            records.value[index] = savedRecord
          }
          
          syncedCount++
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.error('Error syncing record:', err)
        }
      }
    }

    if (syncedCount > 0) {
      // @ts-expect-error - Vue ref unwrapping type mismatch
      saveToLocalStorage(records.value)
      isSynced.value = true
    }

    return syncedCount
  }

  /**
   * Clear all records (use with caution)
   */
  const clear = (): void => {
    records.value = []
    saveToLocalStorage([])
  }

  // Computed
  const recordCount = computed(() => records.value.length)
  const hasRecords = computed(() => records.value.length > 0)
  const unsyncedCount = computed(() => records.value.filter(r => r.id.startsWith('local-')).length)

  // Auto-load on creation only if patient ID is set
  const currentPatientId = unref(patientId)
  if (currentPatientId && currentPatientId.trim() !== '') {
    load()
  } else {
    // Load from localStorage as fallback
    records.value = loadFromLocalStorage()
  }

  return {
    // State
    records,
    isLoading,
    error,
    isSynced,
    
    // Computed
    recordCount,
    hasRecords,
    unsyncedCount,
    
    // Methods
    load,
    save,
    remove,
    syncToBackend,
    clear
  }
}
