import { ref } from 'vue'
import type {
  Persona,
  CreatePersonaRequest,
  UpdatePersonaRequest,
  PersonaListResponse,
} from '../../../backend/types/personas'
import type { ApiErrorResponse } from '../../../backend/types/api'
import { apiUrl } from '../config/api'

// Global persona state
const personas = ref<Persona[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

// Persona store composable
export function usePersonaStore() {
  // Load personas from API
  async function loadPersonas(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const res = await fetch(apiUrl('/api/personas'))
      const json: PersonaListResponse | ApiErrorResponse = await res.json()

      if ('error' in json) {
        throw new Error(json.error.message)
      }

      personas.value = json.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load personas'
      // eslint-disable-next-line no-console
      console.error('Error loading personas:', err)
    } finally {
      loading.value = false
    }
  }

  // Create a new persona
  async function createPersona(personaData: CreatePersonaRequest): Promise<void> {
    const res = await fetch(apiUrl('/api/personas'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(personaData),
    })
    const json = await res.json()

    if (!res.ok || 'error' in json) {
      throw new Error(json.error?.message || 'Failed to create persona')
    }

    await loadPersonas()
  }

  // Update an existing persona
  async function updatePersona(id: string, updateData: UpdatePersonaRequest): Promise<void> {
    const res = await fetch(apiUrl(`/api/personas/${id}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    })
    const json = await res.json()

    if (!res.ok || 'error' in json) {
      throw new Error(json.error?.message || 'Failed to update persona')
    }

    await loadPersonas()
  }

  // Delete a persona
  async function deletePersona(id: string): Promise<void> {
    const res = await fetch(apiUrl(`/api/personas/${id}`), { method: 'DELETE' })
    const json = await res.json()

    if (!res.ok || 'error' in json) {
      throw new Error(json.error?.message || 'Failed to delete persona')
    }

    await loadPersonas()
  }

  // Find persona by ID
  function getPersonaById(id: string): Persona | undefined {
    return personas.value.find(p => p.id === id)
  }

  return {
    // State
    personas,
    loading,
    error,

    // Actions
    loadPersonas,
    createPersona,
    updatePersona,
    deletePersona,
    getPersonaById,
  }
}
