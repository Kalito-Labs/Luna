<template>
  <div class="persona-manager-view">
    <div class="header">
      <div class="header-content">
        <HamburgerMenu />
        <h1 class="page-title">Persona Manager</h1>
      </div>
      <div class="header-actions">
        <button 
          class="primary-button"
          @click="showTemplateModal = true"
        >
          <span class="plus-icon">⚡</span>
          Create from Template
        </button>
        <button 
          class="secondary-button"
          @click="showCreateModal = true"
        >
          <span class="plus-icon">✨</span>
          Create Custom
        </button>
      </div>
    </div>

    <div class="personas-grid" v-if="personas.length > 0">
      <div
        v-for="persona in personas"
        :key="persona.id"
        class="persona-card"
        :class="{ 'is-default': isDefaultPersona(persona.id) }"
      >
        <div class="persona-header">
          <div class="persona-icon">
            {{ persona.icon || '🤖' }}
          </div>
          <div class="persona-info">
            <div class="persona-title">
              <h3 class="persona-name">{{ persona.name }}</h3>
              <div class="persona-badges">
                <span v-if="getPersonaBadge(persona.id)" class="default-badge">
                  {{ getPersonaBadge(persona.id) }}
                </span>
              </div>
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
              @click="confirmDeletePersona(persona)"
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
      <p>Default personas will appear here once the backend is connected.</p>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading personas...</p>
    </div>

    <!-- Edit Modal -->
    <PersonaEditModal
      :show="showEditModal"
      :isEditing="showEditModal"
      :editingPersona="showEditModal ? personaToEdit : null"
      @close="handleModalClose"
      @save="handlePersonaSave"
    />

    <!-- Create Modal -->
    <PersonaEditModal
      :show="showCreateModal"
      :isEditing="false"
      :editingPersona="null"
      @close="handleCreateModalClose"
      @save="handlePersonaCreate"
    />

    <!-- Template Browser Modal -->
    <div v-if="showTemplateModal" class="modal-overlay" @click="handleTemplateModalClose">
      <div class="modal modal-wide" @click.stop>
        <div class="modal-header">
          <h2>Choose a Therapeutic Template</h2>
          <button class="close-button" @click="handleTemplateModalClose">✕</button>
        </div>
        
        <div class="modal-content">
          <p class="modal-description">
            Select a pre-configured therapeutic persona template to get started quickly with specialized mental health support.
          </p>
          
          <div v-if="templates.length > 0" class="template-grid">
            <div 
              v-for="template in templates" 
              :key="template.id"
              class="template-card"
              :class="{ selected: selectedTemplate?.id === template.id }"
              @click="selectedTemplate = template"
            >
              <div class="template-icon">
                {{ template.icon }}
              </div>
              <h3 class="template-name">{{ template.name }}</h3>
              <p class="template-description">{{ template.description }}</p>
              <div class="template-tags" v-if="template.tags">
                <span 
                  v-for="tag in JSON.parse(template.tags || '[]').slice(0, 3)" 
                  :key="tag"
                  class="tag"
                >
                  {{ tag }}
                </span>
              </div>
            </div>
          </div>
          
          <div v-else-if="!loading" class="empty-templates">
            <p>No therapeutic templates available.</p>
          </div>
          
          <div v-if="loading" class="loading-state">
            <div class="spinner"></div>
            <p>Loading templates...</p>
          </div>
        </div>
        
        <div class="form-actions">
          <button class="secondary-button" @click="handleTemplateModalClose">
            Cancel
          </button>
          <button 
            class="primary-button" 
            :disabled="!selectedTemplate || submitting"
            @click="createFromSelectedTemplate"
          >
            {{ submitting ? 'Creating...' : 'Create Persona' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="handleDeleteModalClose">
      <div class="modal modal-small" @click.stop>
        <div class="modal-header">
          <h2>Delete Persona</h2>
          <button class="close-button" @click="handleDeleteModalClose">✕</button>
        </div>
        
        <div class="modal-content">
          <p>Are you sure you want to delete <strong>{{ personaToDelete?.name }}</strong>?</p>
          <p class="warning-text">This action cannot be undone.</p>
        </div>
        
        <div class="form-actions">
          <button class="secondary-button" @click="handleDeleteModalClose">
            Cancel
          </button>
          <button 
            class="danger-button" 
            :disabled="submitting"
            @click="handlePersonaDelete"
          >
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
import type { Persona, PersonaCategory, PersonaTemplate } from '../../../../backend/types/personas'
import { usePersonaStore } from '../../composables/usePersonaStore'

const personaStore = usePersonaStore()

// State
const { personas, templates, loading, error } = personaStore
const submitting = ref(false)

// Modals
const showEditModal = ref(false)
const showCreateModal = ref(false)
const showTemplateModal = ref(false)
const showDeleteModal = ref(false)
const personaToEdit = ref<Persona | null>(null)
const personaToDelete = ref<Persona | null>(null)
const selectedTemplate = ref<PersonaTemplate | null>(null)

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
      return '☁️ Cloud Models'
    case 'local':
      return '💻 Local Models'
    default:
      return '☁️ Cloud Models'
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

function showNotification(type: 'success' | 'error', message: string) {
  notification.value = { type, message }
  setTimeout(() => {
    notification.value = null
  }, 3000)
}

// Update existing persona only
async function handlePersonaSave(payload: PersonaPayload) {
  submitting.value = true
  try {
    if (!personaToEdit.value) {
      throw new Error('No persona selected for editing')
    }

    // Update existing persona - clean up the payload
    const updatePayload = {
      name: payload.name,
      prompt: payload.prompt,
      description: payload.description?.trim() || undefined,
      icon: payload.icon?.trim() || undefined,
      category: payload.category,
      settings: payload.settings
    }
    await personaStore.updatePersona(personaToEdit.value.id, updatePayload)

    // Refresh list
    await personaStore.loadPersonas()

    showNotification('success', 'Persona updated successfully!')
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error saving persona:', error)
    showNotification('error', error instanceof Error ? error.message : 'Failed to save persona')
  } finally {
    submitting.value = false
    showEditModal.value = false
    personaToEdit.value = null
  }
}

function handleModalClose() {
  showEditModal.value = false
  personaToEdit.value = null
}

function handleCreateModalClose() {
  showCreateModal.value = false
}

function handleTemplateModalClose() {
  showTemplateModal.value = false
  selectedTemplate.value = null
}

// Create new persona from scratch
async function handlePersonaCreate(payload: PersonaPayload) {
  submitting.value = true
  try {
    // Generate a unique ID for the new persona
    const timestamp = Date.now()
    const personaId = `persona-${timestamp}`
    
    const createPayload = {
      id: personaId,
      ...payload
    }
    await personaStore.createPersona(createPayload)
    await personaStore.loadPersonas()

    showNotification('success', 'Persona created successfully!')
  } catch (error) {
    console.error('Error creating persona:', error)
    showNotification('error', error instanceof Error ? error.message : 'Failed to create persona')
  } finally {
    submitting.value = false
    showCreateModal.value = false
  }
}

// Create persona from selected template
async function createFromSelectedTemplate() {
  if (!selectedTemplate.value) return
  
  submitting.value = true
  try {
    // Generate a unique ID for the new persona
    const timestamp = Date.now()
    const personaId = `${selectedTemplate.value.id}-${timestamp}`
    
    const templateRequest = {
      template_id: selectedTemplate.value.id,
      persona_id: personaId
    }
    
    await personaStore.createFromTemplate(templateRequest)
    await personaStore.loadPersonas()

    showNotification('success', `Created "${selectedTemplate.value.name}" persona successfully!`)
  } catch (error) {
    console.error('Error creating persona from template:', error)
    showNotification('error', error instanceof Error ? error.message : 'Failed to create persona from template')
  } finally {
    submitting.value = false
    showTemplateModal.value = false
    selectedTemplate.value = null
  }
}

// Delete confirmation and handling
function confirmDeletePersona(persona: Persona) {
  personaToDelete.value = persona
  showDeleteModal.value = true
}

function handleDeleteModalClose() {
  showDeleteModal.value = false
  personaToDelete.value = null
}

async function handlePersonaDelete() {
  if (!personaToDelete.value) return
  
  submitting.value = true
  try {
    await personaStore.deletePersona(personaToDelete.value.id)
    await personaStore.loadPersonas()

    showNotification('success', `Deleted "${personaToDelete.value.name}" successfully!`)
  } catch (error) {
    console.error('Error deleting persona:', error)
    showNotification('error', error instanceof Error ? error.message : 'Failed to delete persona')
  } finally {
    submitting.value = false
    showDeleteModal.value = false
    personaToDelete.value = null
  }
}

// Lifecycle
onMounted(async () => {
  await Promise.all([
    personaStore.loadPersonas(),
    personaStore.loadTemplates()
  ])
})
</script>

<style scoped>
.persona-manager-view {
  min-height: 100vh;
  background: linear-gradient(135deg, 
    rgba(15, 23, 42, 0.98) 0%, 
    rgba(30, 41, 59, 0.95) 50%,
    rgba(67, 56, 202, 0.1) 100%);
  color: rgba(255, 255, 255, 0.92);
  padding: 0;
  overflow: auto;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(139, 92, 246, 0.15);
  background: rgba(30, 41, 59, 0.6);
  backdrop-filter: blur(20px);
  position: sticky;
  top: 0;
  z-index: 100;
  flex-shrink: 0;
}

.header-content {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  flex: 1;
}

.header-content :deep(.hamburger-menu) {
  flex-shrink: 0;
  margin-left: -0.5rem;
  margin-top: 0.25rem;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0.25rem 0 0 0;
  color: rgba(255, 255, 255, 0.95);
  flex: 1;
}

.primary-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, 
    rgba(139, 92, 246, 0.9) 0%, 
    rgba(124, 58, 237, 0.95) 100%);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 0.75rem;
  color: white;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 600;
  font-size: 0.875rem;
}

.primary-button:hover {
  transform: translateY(-2px);
  background: linear-gradient(135deg, 
    rgba(139, 92, 246, 1) 0%, 
    rgba(124, 58, 237, 1) 100%);
  border-color: rgba(139, 92, 246, 0.5);
}

.primary-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.plus-icon {
  font-size: 1.2rem;
}

.personas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
  padding: 0 1.5rem 1.5rem 1.5rem;
}

.persona-card {
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(30px);
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-radius: 1rem;
  padding: 1.5rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.persona-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, 
    transparent, 
    rgba(139, 92, 246, 0.6), 
    transparent);
  border-radius: 2px;
}

.persona-card:hover {
  transform: translateY(-2px);
  border-color: rgba(139, 92, 246, 0.3);
  background: rgba(255, 255, 255, 0.08);
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
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-radius: 0.75rem;
  flex-shrink: 0;
}

.persona-info {
  flex: 1;
}

.persona-name {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
}

.persona-id {
  margin: 0;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
  font-family: 'SF Mono', 'Monaco', monospace;
}

.persona-title {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 0.25rem;
}

.persona-badges {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: flex-end;
}

.default-badge {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.8) 0%, rgba(124, 58, 237, 0.9) 100%);
  color: white;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border: 1px solid rgba(139, 92, 246, 0.5);
}

.persona-actions {
  display: flex;
  gap: 0.5rem;
}

.action-button {
  width: 2rem;
  height: 2rem;
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
  background: rgba(255, 255, 255, 0.04);
}

.action-button.edit {
  color: rgba(139, 92, 246, 1);
}

.action-button.edit:hover {
  background: rgba(139, 92, 246, 0.15);
  border-color: rgba(139, 92, 246, 0.3);
  transform: translateY(-1px);
}

.action-button.delete {
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.2);
}

.action-button.delete:hover {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.3);
  transform: translateY(-1px);
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
  border-radius: 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  border: 1px solid;
}

.category-cloud {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.5);
  color: rgba(147, 197, 253, 1);
}

.category-local {
  background: rgba(34, 197, 94, 0.2);
  border-color: rgba(34, 197, 94, 0.5);
  color: rgba(134, 239, 172, 1);
}

.category-therapy {
  background: var(--accent-teal);
  border-color: var(--accent-teal);
  color: white;
}

.category-general {
  background: var(--accent-purple);
  border-color: var(--accent-purple);
  color: white;
}

.persona-description {
  color: rgba(255, 255, 255, 0.7);
  font-style: italic;
  margin: 0;
  line-height: 1.5;
}

.persona-prompt {
  margin-bottom: 1rem;
}

.persona-prompt strong {
  color: rgba(255, 255, 255, 0.95);
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.prompt-text {
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.5;
  margin: 0;
  padding: 0.75rem;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-radius: 0.75rem;
  font-size: 0.875rem;
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
  color: rgba(255, 255, 255, 0.95);
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 2rem;
}

.empty-state .error-details {
  font-family: 'SF Mono', 'Monaco', monospace;
  font-size: 0.875rem;
  color: rgba(239, 68, 68, 1);
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  padding: 0.75rem;
  border-radius: 0.75rem;
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
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top: 3px solid rgba(139, 92, 246, 1);
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
.toast {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  padding: 1rem 1.5rem;
  border-radius: 0.75rem;
  color: white;
  font-weight: 600;
  z-index: 9999;
  animation: slideIn 0.3s ease;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.toast.success {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.9) 0%, rgba(22, 163, 74, 0.95) 100%);
  border: 1px solid rgba(34, 197, 94, 0.5);
}

.toast.error {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.9) 0%, rgba(220, 38, 38, 0.95) 100%);
  border: 1px solid rgba(239, 68, 68, 0.5);
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
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1.5rem;
}

.modal {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98));
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 1.25rem;
  max-width: calc(100vw - 3rem);
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  backdrop-filter: blur(30px);
}

.modal-small {
  width: 30rem;
  max-width: calc(100vw - 3rem);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(139, 92, 246, 0.15);
  background: rgba(30, 41, 59, 0.6);
  backdrop-filter: blur(20px);
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
}

.close-button {
  background: none;
  border: none;
  font-size: 1.75rem;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.6);
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
}

.close-button:hover {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 1);
  transform: rotate(90deg);
}

.modal-content {
  padding: 1.5rem;
  flex: 1;
  overflow-y: auto;
}

.modal-content::-webkit-scrollbar {
  width: 6px;
}

.modal-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.modal-content::-webkit-scrollbar-thumb {
  background: rgba(139, 92, 246, 0.4);
  border-radius: 3px;
}

.modal-content::-webkit-scrollbar-thumb:hover {
  background: rgba(139, 92, 246, 0.6);
}

.modal-content p {
  margin: 0 0 0.75rem 0;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.9);
}

.warning-text {
  color: rgba(251, 191, 36, 1) !important;
  font-size: 0.875rem;
  margin-top: 1rem !important;
  font-weight: 600;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid rgba(139, 92, 246, 0.15);
  background: rgba(30, 41, 59, 0.6);
  backdrop-filter: blur(20px);
}

.secondary-button {
  padding: 0.75rem 1rem;
  border: 1px solid rgba(107, 114, 128, 0.3);
  border-radius: 0.75rem;
  background: rgba(107, 114, 128, 0.2);
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.secondary-button:hover {
  background: rgba(107, 114, 128, 0.3);
  border-color: rgba(107, 114, 128, 0.5);
  transform: translateY(-2px);
}

.danger-button {
  padding: 0.75rem 1rem;
  border: 1px solid rgba(239, 68, 68, 0.5);
  border-radius: 0.75rem;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.9) 0%, rgba(220, 38, 38, 0.95) 100%);
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.danger-button:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(239, 68, 68, 1) 0%, rgba(220, 38, 38, 1) 100%);
  border-color: rgba(239, 68, 68, 0.7);
  transform: translateY(-2px);
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

/* Template Browser Styles */
.modal-description {
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.template-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-radius: 1rem;
  padding: 1.25rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.template-card:hover {
  transform: translateY(-2px);
  border-color: rgba(139, 92, 246, 0.3);
  background: rgba(139, 92, 246, 0.1);
}

.template-card.selected {
  border-color: rgba(139, 92, 246, 0.5);
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(124, 58, 237, 0.15) 100%);
  box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.3);
}

.template-icon {
  width: 3.5rem;
  height: 3.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  border-radius: 50%;
  margin: 0 auto 0.75rem;
  color: white;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.9) 0%, rgba(124, 58, 237, 0.95) 100%);
  border: 1px solid rgba(139, 92, 246, 0.3);
}

.template-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  margin: 0 0 0.5rem;
}

.template-description {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.5;
  margin: 0 0 1rem;
}

.template-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  justify-content: center;
}

.tag {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.8) 0%, rgba(124, 58, 237, 0.9) 100%);
  color: white;
  font-size: 0.7rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.75rem;
  font-weight: 600;
  border: 1px solid rgba(139, 92, 246, 0.5);
}

.empty-templates {
  text-align: center;
  padding: 2rem;
  color: rgba(255, 255, 255, 0.7);
}

.modal-wide {
  width: 56rem;
  max-width: calc(100vw - 3rem);
}
</style>
