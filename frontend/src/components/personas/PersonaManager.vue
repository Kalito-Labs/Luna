<template>
  <div class="persona-manager-view">
    <!-- Hamburger button/menu, top left -->
    <div class="hamburger-fixed">
      <HamburgerMenu />
    </div>
    
    <div class="header">
      <div class="header-spacer"></div>
      <h1 class="page-title">Persona Manager</h1>
      <button class="primary-button" @click="showCreateModal = true">
        <span class="plus-icon">+</span>
        New Persona
      </button>
    </div>

    <div class="personas-grid" v-if="personas.length > 0">
      <div
        v-for="persona in personas"
        :key="persona.id"
        class="persona-card"
        :class="{ 'is-default': isDefaultPersona(persona.id) }"
      >
        <div class="persona-header">
          <div class="persona-icon">{{ persona.icon || '🤖' }}</div>
          <div class="persona-info">
            <div class="persona-title">
              <h3 class="persona-name">{{ persona.name }}</h3>
              <span v-if="getPersonaBadge(persona.id)" class="default-badge">
                {{ getPersonaBadge(persona.id) }}
              </span>
            </div>
            <p class="persona-id">ID: {{ persona.id }}</p>
          </div>
          <div class="persona-actions">
            <button
              class="action-button edit"
              @click="editPersona(persona)"
              :title="`Edit ${persona.name}`"
            >
              ✏️
            </button>
            <button
              v-if="!isDefaultPersona(persona.id)"
              class="action-button delete"
              @click="confirmDelete(persona)"
              :title="`Delete ${persona.name}`"
            >
              🗑️
            </button>
          </div>
        </div>

        <div class="persona-content">
          <div class="category-and-description">
            <div class="category-badge" :class="`category-${persona.category || 'cloud'}`">
              {{ getCategoryLabel(persona.category) }}
            </div>
            <p class="persona-description" v-if="persona.description">
              {{ persona.description }}
            </p>
          </div>

          <div class="persona-prompt">
            <strong>System Prompt:</strong>
            <p class="prompt-text">{{ truncateText(persona.prompt, 200) }}</p>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="!loading && error" class="empty-state error-state">
      <div class="empty-icon">⚠️</div>
      <h2>Backend Connection Required</h2>
      <p>Unable to connect to the backend server. All personas are stored in the database.</p>
      <p class="error-details">{{ error }}</p>
      <button class="secondary-button" @click="retryConnection">Retry Connection</button>
    </div>

    <div v-else-if="!loading && !error" class="empty-state">
      <div class="empty-icon">🤖</div>
      <h2>No Personas Found</h2>
      <p>Create your first custom persona to get started.</p>
      <button class="primary-button" @click="showCreateModal = true">Create First Persona</button>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading personas...</p>
    </div>

    <!-- Create/Edit Modal -->
    <PersonaEditModal
      :show="showCreateModal || showEditModal"
      :isEditing="showEditModal"
      :editingPersona="showEditModal ? personaToEdit : null"
      @close="handleModalClose"
      @save="handlePersonaSave"
    />

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="showDeleteModal = false">
      <div class="modal modal-small" @click.stop>
        <div class="modal-header">
          <h2>Confirm Delete</h2>
        </div>

        <div class="modal-content">
          <p>
            Are you sure you want to delete the persona
            <strong>"{{ personaToDelete?.name }}"</strong>?
          </p>
          <p class="warning-text">
            This action cannot be undone. Any active sessions using this persona will be switched to
            the default persona.
          </p>
        </div>

        <div class="form-actions">
          <button class="secondary-button" @click="showDeleteModal = false">Cancel</button>
          <button class="danger-button" @click="deletePersona" :disabled="submitting">
            {{ submitting ? 'Deleting...' : 'Delete Persona' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Toast notifications -->
    <div v-if="notification" class="toast" :class="notification.type">
      {{ notification.message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import HamburgerMenu from '../HamburgerMenu.vue'
import PersonaEditModal from './PersonaEditModal.vue'
import type { Persona, PersonaCategory, CreatePersonaRequest } from '../../../../backend/types/personas'
import { usePersonaStore } from '../../composables/usePersonaStore'

const personaStore = usePersonaStore()

// State
const { personas, loading, error } = personaStore
const submitting = ref(false)

// Modals
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const personaToDelete = ref<Persona | null>(null)
const personaToEdit = ref<Persona | null>(null)

// Notification system
const notification = ref<{ type: 'success' | 'error'; message: string } | null>(null)

// Centralized default persona IDs
const DEFAULT_PERSONA_IDS = [
  'default-cloud', 
  'default-local',              // Qwen 2.5 Default
  'mistral-default',            // Mistral 7B Default
  'qwen25-assistant',           // Future: Qwen2.5 Assistant
  'qwen25-coder'                // Future: Qwen2.5 Code Expert
]

// Types for payload from modal (optional but nice)
type PersonaPayload = {
  name: string
  icon: string
  category: PersonaCategory
  description: string
  prompt: string
  settings?: Partial<{
    temperature: number
    maxTokens: number
    topP: number
    repeatPenalty: number
  }>
}



// Functions
async function retryConnection() {
  await personaStore.loadPersonas()
}

function getCategoryLabel(category?: PersonaCategory): string {
  switch (category) {
    case 'cloud':
      return '🚀 High Performance (Cloud Models)'
    case 'local':
      return '⚡ Fast & Private (Local Models)'
    default:
      return '🚀 High Performance (Cloud Models)'
  }
}

function isDefaultPersona(personaId: string): boolean {
  return DEFAULT_PERSONA_IDS.includes(personaId)
}

function getPersonaBadge(personaId: string): string | null {
  return isDefaultPersona(personaId) ? 'Default' : null
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

function editPersona(persona: Persona) {
  personaToEdit.value = persona
  showEditModal.value = true
}

function confirmDelete(persona: Persona) {
  personaToDelete.value = persona
  showDeleteModal.value = true
}

function showNotification(type: 'success' | 'error', message: string) {
  notification.value = { type, message }
  setTimeout(() => {
    notification.value = null
  }, 3000)
}

// Generate a unique ID for new personas
function generatePersonaId(name: string): string {
  // Create a clean ID based on the name, with timestamp for uniqueness
  const cleanName = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')         // Replace spaces with hyphens
    .replace(/-+/g, '-')          // Collapse multiple hyphens
    .replace(/^-|-$/g, '')        // Remove leading/trailing hyphens
  
  const timestamp = Date.now().toString(36) // Base36 for shorter string
  return `${cleanName}-${timestamp}`.substring(0, 50) // Ensure it fits the DB limit
}

// **FIXED**: consume payload and persist via store
async function handlePersonaSave(payload: PersonaPayload) {
  submitting.value = true
  try {
    const isEdit = showEditModal.value && !!personaToEdit.value
    if (isEdit) {
      // Update existing persona - clean up the payload
      const updatePayload = {
        name: payload.name,
        prompt: payload.prompt,
        description: payload.description?.trim() || undefined,
        icon: payload.icon?.trim() || undefined,
        category: payload.category,
        settings: payload.settings
      }
      await personaStore.updatePersona(personaToEdit.value!.id, updatePayload)
    } else {
      // Create new persona - add the missing ID field
      const createPayload: CreatePersonaRequest = {
        id: generatePersonaId(payload.name),
        name: payload.name,
        prompt: payload.prompt,
        description: payload.description?.trim() || undefined,
        icon: payload.icon?.trim() || undefined,
        category: payload.category,
        settings: payload.settings
      }
      await personaStore.createPersona(createPayload)
    }

    // Refresh list (or optimistically update if your store returns the entity)
    await personaStore.loadPersonas()

    showNotification('success', `Persona ${isEdit ? 'updated' : 'created'} successfully!`)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error saving persona:', error)
    showNotification('error', error instanceof Error ? error.message : 'Failed to save persona')
  } finally {
    submitting.value = false
    showCreateModal.value = false
    showEditModal.value = false
    personaToEdit.value = null
  }
}

function handleModalClose() {
  showCreateModal.value = false
  showEditModal.value = false
  personaToEdit.value = null
}

async function deletePersona() {
  if (!personaToDelete.value) return
  submitting.value = true
  try {
    await personaStore.deletePersona(personaToDelete.value.id)
    showNotification('success', `Persona "${personaToDelete.value.name}" deleted successfully!`)
    showDeleteModal.value = false
    personaToDelete.value = null
    await personaStore.loadPersonas()
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error deleting persona:', error)
    showNotification('error', error instanceof Error ? error.message : 'Failed to delete persona')
  } finally {
    submitting.value = false
  }
}

// Lifecycle
onMounted(async () => {
  await personaStore.loadPersonas()
})
</script>

<style scoped>
.persona-manager-view {
  min-height: 100vh;
  background: var(--bg-main);
  color: var(--text-main);
  padding: 2rem;
  overflow: auto;
}

/* Fixed hamburger placement */
.hamburger-fixed {
  position: fixed;
  top: 32px;
  left: 32px;
  z-index: 100; /* Below modals (1000+) but above regular content */
}

.header {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: var(--border);
}

.header-spacer {
  /* Empty div to balance the grid - ensures title stays centered */
  min-width: 0;
}

.page-title {
  font-size: 2rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-heading);
  text-align: center;
  grid-column: 2;
}

.primary-button {
  grid-column: 3;
  justify-self: end;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--accent-blue);
  border: none;
  border-radius: 0.5rem;
  color: white;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
}

.primary-button:hover {
  transform: translateY(-1px);
  box-shadow: var(--glow-blue);
}

.primary-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.plus-icon {
  font-size: 1.2rem;
}

.personas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
}

.persona-card {
  background: var(--bg-glass);
  backdrop-filter: var(--blur);
  border: var(--border);
  border-radius: 1rem;
  padding: 1.5rem;
  transition: all 0.2s ease;
}

.persona-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-soft);
  border-color: var(--accent-blue);
}

.persona-card.is-default {
  border-color: var(--accent-blue);
  background: var(--bg-panel);
}

.persona-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.persona-icon {
  font-size: 2rem;
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-panel);
  border-radius: 0.5rem;
  flex-shrink: 0;
}

.persona-info {
  flex: 1;
}

.persona-name {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-heading);
}

.persona-id {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-muted);
  font-family: var(--font-mono);
}

.persona-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.default-badge {
  background: var(--accent-color);
  color: white;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.15rem 0.5rem;
  border-radius: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.persona-actions {
  display: flex;
  gap: 0.5rem;
}

.action-button {
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.action-button.edit {
  background: var(--accent-blue);
  color: white;
}

.action-button.edit:hover {
  background: var(--accent-teal);
}

.action-button.delete {
  background: var(--led-red);
  color: white;
}

.action-button.delete:hover {
  background: var(--led-red);
  opacity: 0.8;
}

.persona-content {
  margin-top: 1rem;
}

.category-and-description {
  margin-bottom: 1rem;
}

.category-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  border: 1px solid;
}

.category-cloud {
  background: var(--accent-blue);
  border-color: var(--accent-blue);
  color: white;
}

.category-local {
  background: var(--accent-green);
  border-color: var(--accent-green);
  color: var(--bg-main);
}

.persona-description {
  color: var(--text-muted);
  font-style: italic;
  margin: 0;
}

.persona-prompt {
  margin-bottom: 1rem;
}

.persona-prompt strong {
  color: var(--text-heading);
  display: block;
  margin-bottom: 0.5rem;
}

.prompt-text {
  color: var(--text-muted);
  line-height: 1.5;
  margin: 0;
  padding: 0.75rem;
  background: var(--bg-main);
  border-radius: 0.5rem;
  font-size: 0.9rem;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
}

.empty-state.error-state {
  border: 2px solid #ff6b6b;
  border-radius: 8px;
  background: rgba(255, 107, 107, 0.05);
  margin: 2rem;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h2 {
  color: var(--text-heading);
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: var(--text-muted);
  margin-bottom: 2rem;
}

.empty-state .error-details {
  font-family: monospace;
  font-size: 0.9rem;
  color: #666;
  background: #f5f5f5;
  padding: 0.5rem;
  border-radius: 4px;
  margin: 1rem auto;
  max-width: 400px;
  word-break: break-word;
}

.loading-state {
  text-align: center;
  padding: 4rem 2rem;
}

.spinner {
  width: 3rem;
  height: 3rem;
  border: 3px solid var(--bg-panel);
  border-top: 3px solid var(--accent-blue);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Toast notifications */
.toast.success {
  background: var(--led-green);
}

.toast.error {
  background: var(--led-red);
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Delete Confirmation Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(10, 12, 16, 0.72);
  backdrop-filter: blur(6px) saturate(115%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
}

.modal {
  background: var(--bg-main);
  border: var(--border);
  border-radius: 12px;
  max-width: calc(100vw - 120px);
  max-height: 85vh;
  box-shadow: var(--shadow-strong);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-small {
  width: 480px;
  max-width: calc(100vw - 48px);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  border-bottom: var(--border);
  background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-main);
}

.modal-content {
  padding: 20px;
  flex: 1;
  overflow-y: auto;
}

.modal-content p {
  margin: 0 0 12px 0;
  line-height: 1.5;
  color: var(--text-main);
}

.warning-text {
  color: var(--led-yellow) !important;
  font-size: 0.9rem;
  margin-top: 16px !important;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding: 14px 18px;
  border-top: var(--border);
  background: linear-gradient(180deg, rgba(0,0,0,0.02), rgba(0,0,0,0.08));
}

.secondary-button {
  padding: 8px 16px;
  border: var(--border);
  border-radius: 6px;
  background: var(--bg-panel);
  color: var(--text-main);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.secondary-button:hover {
  background: var(--bg-glass);
  border-color: var(--blue-400);
}

.danger-button {
  padding: 8px 16px;
  border: 1px solid var(--led-red);
  border-radius: 6px;
  background: var(--led-red);
  color: white;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.danger-button:hover:not(:disabled) {
  background: #dc2626;
  border-color: #dc2626;
  box-shadow: 0 0 12px rgba(239, 68, 68, 0.4);
}

.danger-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Responsive Design */
@media (max-width: 768px) {
  .persona-manager-view {
    padding: 1rem;
  }

  .header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .page-title {
    text-align: center;
    font-size: 1.5rem;
  }

  .personas-grid {
    grid-template-columns: 1fr;
  }

  .modal-small {
    width: 90vw;
    margin: 1rem;
  }

  .form-actions {
    flex-direction: column;
    gap: 8px;
  }

  .toast {
    right: 1rem;
    left: 1rem;
    bottom: 1rem;
  }
}
</style>
