<template>
  <!-- Mobile Modal Overlay -->
  <Transition name="modal-fade">
    <div v-if="show" class="modal-overlay" @click="handleOverlayClick">
      <Transition name="modal-slide">
        <div v-if="show" class="mobile-sidebar-modal" @click.stop>
          <!-- Modal Header -->
          <div class="modal-header">
            <h2 class="modal-title">Kalito AI</h2>
            <button class="close-button" @click="$emit('close')" title="Close">×</button>
          </div>

          <!-- Modal Content -->
          <div class="modal-content">
            <!-- Token Usage Section -->
            <div class="token-usage-section">
              <div class="section-header" @click="toggleSection('tokenUsage')">
                <div class="section-title">Token Usage</div>
                <div class="section-toggle">{{ sectionExpanded.tokenUsage ? '−' : '+' }}</div>
              </div>
              <Transition name="section-expand">
                <div v-if="sectionExpanded.tokenUsage" class="section-content">
                  <div class="token-display glass-panel-secondary">
                    <div class="token-info">
                      <div class="token-label">Tokens Used</div>
                      <div v-if="isLocalModel" class="token-unlimited">Unlimited</div>
                      <div v-else class="token-count">{{ tokenUsage || 0 }}</div>
                    </div>
                    <div class="token-indicator" :class="{ unlimited: isLocalModel }"></div>
                  </div>
                </div>
              </Transition>
            </div>

            <!-- Quick Start Section -->
            <div class="quick-start-section">
              <div class="section-header" @click="toggleSection('quickStart')">
                <div class="section-title">Quick Start</div>
                <div class="section-toggle">{{ sectionExpanded.quickStart ? '−' : '+' }}</div>
              </div>
              <Transition name="section-expand">
                <div v-if="sectionExpanded.quickStart" class="section-content">
                  <div class="quick-settings">
                    <div class="setting-group">
                      <label>Model</label>
                      <select
                        v-model="localSessionSettings.model"
                        class="select-glass"
                        :disabled="isSessionActive"
                      >
                        <option v-for="model in models" :key="model.id" :value="model.id">
                          {{ model.name }}
                        </option>
                      </select>
                    </div>

                    <div class="setting-group">
                      <label>Persona</label>
                      <div class="persona-selector">
                        <select v-model="localSessionSettings.persona" class="select-glass">
                          <option v-for="persona in filteredPersonas" :key="persona.id" :value="persona.id">
                            {{ persona.name }}
                          </option>
                        </select>
                        <button
                          class="btn-glass-icon-small"
                          @click="goToPersonaManager"
                          title="Manage Personas"
                        >
                          ⚙️
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Session Actions -->
                  <div class="session-actions">
                    <!-- Start New Session -->
                    <template v-if="!isSessionActive">
                      <button
                        v-if="!confirmingStartSession"
                        class="btn-primary"
                        @click="confirmingStartSession = true"
                      >
                        ♻ New Session
                      </button>
                      <div v-else class="action-confirmation">
                        <div class="confirmation-message">
                          <span class="confirmation-icon">🚀</span>
                          <span>Start new session?</span>
                        </div>
                        <div class="confirmation-actions">
                          <button class="btn-confirm" @click="handleStartSession">
                            Yes
                          </button>
                          <button class="btn-cancel" @click="confirmingStartSession = false">
                            No
                          </button>
                        </div>
                      </div>
                    </template>

                    <!-- Reset Session -->
                    <template v-else>
                      <button
                        v-if="!confirmingReset"
                        class="btn-secondary"
                        @click="confirmingReset = true"
                        :disabled="!isSessionActive"
                      >
                        🔄 Reset
                      </button>
                      <div v-else class="action-confirmation">
                        <div class="confirmation-message">
                          <span class="confirmation-icon">⚠️</span>
                          <span>Reset session?</span>
                        </div>
                        <div class="confirmation-actions">
                          <button class="btn-confirm" @click="handleResetSession">
                            Yes
                          </button>
                          <button class="btn-cancel" @click="confirmingReset = false">
                            No
                          </button>
                        </div>
                      </div>
                    </template>
                  </div>
                </div>
              </Transition>
            </div>

            <!-- Saved Sessions Section -->
            <div class="sessions-section">
              <div class="section-header" @click="toggleSection('savedSessions')">
                <div class="section-title">Saved Sessions</div>
                <div class="section-toggle">{{ sectionExpanded.savedSessions ? '−' : '+' }}</div>
              </div>
              <Transition name="section-expand">
                <div v-if="sectionExpanded.savedSessions" class="section-content">
                  <div class="sessions-content">
                    <div v-if="savedSessions.length === 0" class="no-sessions-message">
                      <div class="empty-icon">💭</div>
                      <p>No conversations yet</p>
                      <p class="hint">Start a new session to begin chatting</p>
                    </div>
                    <div v-else class="sessions-list">
                      <div
                        v-for="session in savedSessions"
                        :key="session.id"
                        class="session-item glass-panel-primary"
                        :class="{ 
                          active: session.id === currentSessionId,
                          'has-content': session.recap && session.recap.trim().length > 0 && !session.recap.includes('😞'),
                          'confirming-delete': sessionToDelete === session.id
                        }"
                      >
                        <!-- Normal session view -->
                        <template v-if="sessionToDelete !== session.id">
                          <div class="session-content" @click="loadSession(session)">
                            <div class="session-header">
                              <div class="session-title text-truncate">
                                {{ getSessionTitle(session) }}
                                <span v-if="session.saved === 1" class="text-muted"> • Saved</span>
                              </div>
                              <div class="session-date text-muted">{{ formatDate(session.created_at) }}</div>
                            </div>
                            <div class="session-preview text-muted">{{ getSessionPreview(session) }}</div>
                          </div>
                          <div class="session-actions">
                            <button
                              class="session-action-btn btn-glass-icon-small"
                              @click.stop="loadSession(session)"
                              title="Load session"
                            >
                              ▶
                            </button>
                            <button
                              class="session-action-btn btn-glass-icon-small"
                              @click.stop="sessionToDelete = session.id"
                              title="Delete session"
                            >
                              ×
                            </button>
                          </div>
                        </template>

                        <!-- Delete confirmation view -->
                        <template v-else>
                          <div class="delete-confirmation">
                            <div class="delete-message">
                              <span class="delete-icon">⚠️</span>
                              <span>Delete this session?</span>
                            </div>
                            <div class="delete-actions">
                              <button
                                class="btn-delete-confirm"
                                @click.stop="handleDeleteConfirm"
                                title="Yes, delete"
                              >
                                Yes
                              </button>
                              <button
                                class="btn-delete-cancel"
                                @click.stop="handleDeleteCancel"
                                title="Cancel"
                              >
                                No
                              </button>
                            </div>
                          </div>
                        </template>
                      </div>
                    </div>
                  </div>
                </div>
              </Transition>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { reactive, ref, watch, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { fetchAvailableModels, fetchSessionMessages } from '../../core'
import { usePersonaStore } from '../../composables/usePersonaStore'

const router = useRouter()

interface Model {
  id: string
  name: string
  type: 'local' | 'cloud'
}

interface Session {
  id: string
  name?: string
  model?: string
  persona_id?: string
  created_at?: string
  updated_at?: string
  recap?: string
  saved?: number // 0 | 1
}

const props = defineProps<{
  show: boolean
  isSessionActive: boolean
  tokenUsage?: number
  sessions?: Session[] | { items?: Session[]; data?: Session[]; list?: Session[] } | null
  currentSessionId?: string | null
  sessionSettings?: any
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'update:session-settings', settings: any): void
  (e: 'start-session', settings: any): void
  (e: 'reset-session'): void
  (e: 'select-session', session: any): void
  (e: 'delete-session', sessionId: string): void
  (e: 'load-session', session: any): void
}>()

// Confirmation states (inline, no modals)
const sessionToDelete = ref<string | null>(null)
const confirmingStartSession = ref(false)
const confirmingReset = ref(false)

// Session menu state
const models = ref<Model[]>([])
const personaStore = usePersonaStore()
const { personas } = personaStore

// Cache for session messages
const sessionMessagesCache = ref<Map<string, any[]>>(new Map())

// Section expansion state
const sectionExpanded = reactive({
  tokenUsage: true,
  quickStart: true,
  savedSessions: true,
})

const localSessionSettings = reactive({
  model: '',
  persona: 'default',
  customContext: '',
  ...props.sessionSettings,
})

// Close modal on overlay click
function handleOverlayClick() {
  emit('close')
}

// Route helpers
function goToPersonaManager() {
  emit('close')
  router.push({ name: 'personas' })
}

// Load models & personas
onMounted(async () => {
  await Promise.all([
    fetchAvailableModels().then(data => { models.value = data || [] }),
    personaStore.loadPersonas(),
  ])

  // Ensure model selection
  if (
    (!localSessionSettings.model || !models.value.find(m => m.id === localSessionSettings.model)) &&
    models.value.length > 0
  ) {
    const firstModel = models.value[0]
    if (firstModel) {
      localSessionSettings.model = firstModel.id
    }
  }

  // Ensure persona selection
  if (!localSessionSettings.persona && personas.value.length > 0) {
    const current = models.value.find(m => m.id === localSessionSettings.model)
    const cat: 'local' | 'cloud' = current?.type === 'local' ? 'local' : 'cloud'
    const categoryDefault = cat === 'local' ? 'default-local' : 'default-cloud'

    localSessionSettings.persona =
      personas.value.find(p => p.id === categoryDefault && p.category === cat)?.id
      ?? personas.value.find(p => p.category === cat)?.id
      ?? personas.value[0]?.id
      ?? 'default'
  }

  emit('update:session-settings', { ...localSessionSettings })
})

// Derive model category
const isLocalModel = computed(() => {
  const model = localSessionSettings.model
  const currentModel = models.value.find(m => m.id === model)
  return currentModel?.type === 'local'
})

// Filtered personas
const filteredPersonas = computed(() => {
  if (!localSessionSettings.model) return personas.value

  const current = models.value.find(m => m.id === localSessionSettings.model)
  const targetCategory: 'local' | 'cloud' = current?.type === 'local' ? 'local' : 'cloud'

  const list = personas.value.filter(p => p.category === targetCategory)

  return list.slice().sort((a, b) => {
    const aDef = a.id.startsWith('default-') ? 0 : 1
    const bDef = b.id.startsWith('default-') ? 0 : 1
    return aDef - bDef
  })
})

// Normalize sessions prop
const sessionsArray = computed<Session[]>(() => {
  const s = props.sessions as any
  if (Array.isArray(s)) return s
  if (s && Array.isArray(s.items)) return s.items
  if (s && Array.isArray(s.data)) return s.data
  if (s && Array.isArray(s.list)) return s.list
  return []
})

// Auto-select default persona when model changes
watch(
  () => localSessionSettings.model,
  (newModel) => {
    if (!newModel || !models.value.length || !personas.value.length) return
    
    const currentModel = models.value.find(m => m.id === newModel)
    if (!currentModel) return
    
    const modelCategory = currentModel.type === 'local' ? 'local' : 'cloud'
    const categoryDefaultId = modelCategory === 'local' ? 'default-local' : 'default-cloud'
    
    const modelName = newModel.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
    const modelSpecificDefaultPersona = personas.value.find(
      p => (p.id === `default-${modelName}` || p.id === `${modelName}-default`) && p.category === modelCategory
    )
    
    if (modelSpecificDefaultPersona) {
      localSessionSettings.persona = modelSpecificDefaultPersona.id
    } else {
      const defaultPersona = personas.value.find(p => p.id === categoryDefaultId && p.category === modelCategory)
      if (defaultPersona) {
        localSessionSettings.persona = defaultPersona.id
      }
    }
  }
)

// Persist settings
watch(
  localSessionSettings,
  newSettings => {
    // Don't override persona settings - just pass through
    emit('update:session-settings', { ...newSettings })
  },
  { deep: true }
)

// Actions
function toggleSection(section: keyof typeof sectionExpanded) {
  sectionExpanded[section] = !sectionExpanded[section]
}

function handleStartSession() {
  // Don't override persona settings - backend will merge them properly
  const sessionData = {
    ...localSessionSettings,
  }
  emit('start-session', sessionData)
  confirmingStartSession.value = false
  emit('close') // Close modal after starting session
}

function handleResetSession() {
  emit('reset-session')
  confirmingReset.value = false
}

// Saved sessions
const savedSessions = computed(() => {
  const sessions = sessionsArray.value
    .filter(s => (typeof s.saved === 'number' ? s.saved === 1 : !!(s.recap && s.recap.trim())))
    .slice()
    .sort((a, b) => {
      const aTime = new Date((a.updated_at || a.created_at) || '').getTime()
      const bTime = new Date((b.updated_at || b.created_at) || '').getTime()
      return bTime - aTime
    })

  sessions.forEach(session => {
    if (session?.id && (!session.recap || session.recap.trim().length === 0) && !sessionMessagesCache.value.has(session.id)) {
      createPreviewFromMessages(session.id).catch(() => {})
    }
  })

  return sessions
})

async function createPreviewFromMessages(sessionId: string): Promise<string> {
  try {
    if (sessionMessagesCache.value.has(sessionId)) {
      const messages = sessionMessagesCache.value.get(sessionId)
      return generatePreviewFromMessages(messages || [])
    }

    const response = await fetchSessionMessages(sessionId)
    const messages = Array.isArray(response) ? response : (response.data || response.items || [])
    
    sessionMessagesCache.value.set(sessionId, messages)
    
    return generatePreviewFromMessages(messages)
  } catch (error) {
    return 'Unable to load preview'
  }
}

function generatePreviewFromMessages(messages: any[]): string {
  if (!messages || messages.length === 0) {
    return 'Empty conversation'
  }

  const userMessages = messages.filter(msg => msg.role === 'user' && msg.text && msg.text.trim())

  if (userMessages.length === 0) {
    return 'No user messages found'
  }

  const firstUserMsg = userMessages[0].text.trim()
  
  if (firstUserMsg.length <= 100) {
    return `Discussion about: ${firstUserMsg}`
  } else {
    const truncated = firstUserMsg.substring(0, 100)
    const lastSpace = truncated.lastIndexOf(' ')
    const breakPoint = lastSpace > 50 ? lastSpace : 100
    return `Discussion about: ${firstUserMsg.substring(0, breakPoint)}...`
  }
}

function loadSession(session: Session) {
  emit('load-session', session)
  emit('close') // Close modal after loading session
}

function handleDeleteConfirm() {
  if (sessionToDelete.value) {
    emit('delete-session', sessionToDelete.value)
    sessionToDelete.value = null
  }
}

function handleDeleteCancel() {
  sessionToDelete.value = null
}

// UI helpers
function getSessionTitle(session: Session): string {
  if (session?.name && session.name.trim() && session.name !== 'New Chat') {
    return session.name
  }
  
  if (session?.id && sessionMessagesCache.value.has(session.id)) {
    const messages = sessionMessagesCache.value.get(session.id)
    const userMessages = messages?.filter(msg => msg.role === 'user' && msg.text && msg.text.trim()) || []
    
    if (userMessages.length > 0) {
      const firstUserMsg = userMessages[0].text.trim()
      const words = firstUserMsg.split(/\s+/)
      if (words.length <= 8 && firstUserMsg.length <= 60) {
        return firstUserMsg
      } else if (words.length > 8) {
        return words.slice(0, 8).join(' ') + '...'
      } else {
        return firstUserMsg.substring(0, 57) + '...'
      }
    }
  }
  
  if (session?.recap && session.recap.trim().length > 0) {
    if (session.recap.includes('😞') || session.recap.toLowerCase().includes('sorry, i hit an error')) {
      return 'Chat Session'
    }
    
    const recap = session.recap.trim()
    const sentences = recap.split(/[.!?]+/)
    const firstSentence = sentences[0]?.trim() || ''
    
    if (firstSentence.length > 5 && firstSentence.length <= 50) {
      return firstSentence
    } else if (firstSentence.length > 50) {
      return firstSentence.substring(0, 47) + '...'
    }
  }
  
  const modelName = session?.model ? session.model.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'AI'
  const date = session?.created_at ? formatDate(session.created_at) : 'Recent'
  return `${modelName} Chat • ${date}`
}

function getSessionPreview(session: Session): string {
  if (session?.recap && session.recap.trim().length > 0) {
    if (session.recap.includes('😞') || session.recap.toLowerCase().includes('sorry, i hit an error')) {
      return 'Session recap unavailable - please load to continue'
    }
    
    const recap = session.recap.trim()
    
    if (recap.length <= 120) {
      return recap
    }
    
    const truncated = recap.substring(0, 120)
    const lastSpace = truncated.lastIndexOf(' ')
    const lastPunctuation = Math.max(
      truncated.lastIndexOf('.'),
      truncated.lastIndexOf('!'),
      truncated.lastIndexOf('?'),
      truncated.lastIndexOf(',')
    )
    
    const breakPoint = Math.max(lastSpace, lastPunctuation)
    if (breakPoint > 80) {
      return truncated.substring(0, breakPoint) + '...'
    }
    
    return truncated + '...'
  }
  
  if (session?.id && sessionMessagesCache.value.has(session.id)) {
    const messages = sessionMessagesCache.value.get(session.id)
    const preview = generatePreviewFromMessages(messages || [])
    if (preview !== 'Empty conversation' && preview !== 'No user messages found') {
      return preview
    }
  }
  
  const parts = []
  if (session?.model) {
    const modelName = session.model.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    parts.push(`${modelName} conversation`)
  }
  if (session?.persona_id && session.persona_id !== 'default') {
    const personaName = session.persona_id.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    parts.push(`using ${personaName} persona`)
  }
  
  return parts.length > 0 ? parts.join(' ') : 'Saved conversation — click to load'
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return 'Unknown date'
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  } catch {
    return 'Invalid date'
  }
}
</script>

<style scoped>
/* Mobile Modal Overlay */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(20px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Mobile Sidebar Modal */
.mobile-sidebar-modal {
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(30px) saturate(180%);
  border-radius: 0;
  box-shadow: none;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Modal Header */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid rgba(139, 92, 246, 0.15);
  background: rgba(255, 255, 255, 0.04);
}

.modal-title {
  color: #e8eaed;
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  letter-spacing: 0.02em;
}

.close-button {
  width: 44px;
  height: 44px;
  min-width: 44px;
  min-height: 44px;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 16px;
  color: rgba(239, 94, 68, 0.9);
  font-size: 2rem;
  font-weight: 300;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  backdrop-filter: blur(12px);
}

.close-button:hover {
  background: rgba(239, 68, 68, 0.18);
  border-color: rgba(239, 68, 68, 0.3);
  transform: scale(1.05);
}

/* Modal Content */
.modal-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.modal-content::-webkit-scrollbar {
  width: 6px;
}

.modal-content::-webkit-scrollbar-track {
  background: rgba(139, 92, 246, 0.05);
  border-radius: 3px;
}

.modal-content::-webkit-scrollbar-thumb {
  background: rgba(139, 92, 246, 0.3);
  border-radius: 3px;
}

.modal-content::-webkit-scrollbar-thumb:hover {
  background: rgba(139, 92, 246, 0.5);
}

/* Section Styles */
.token-usage-section,
.quick-start-section,
.sessions-section {
  flex-shrink: 0;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  cursor: pointer;
  padding: 1rem;
  border-radius: 16px;
  background: rgba(139, 92, 246, 0.06);
  border: 1px solid rgba(139, 92, 246, 0.15);
  transition: all 0.3s ease;
  min-height: 56px;
}

.section-header:active {
  background: rgba(139, 92, 246, 0.1);
  transform: scale(0.98);
}

.section-title {
  color: #e8eaed;
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.section-toggle {
  color: rgba(66, 165, 245, 0.8);
  font-size: 1.5rem;
  font-weight: 600;
  width: 36px;
  height: 36px;
  min-width: 36px;
  min-height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(66, 165, 245, 0.12);
  border: 1px solid rgba(66, 165, 245, 0.25);
}

.section-content {
  overflow: hidden;
}

/* Token Display */
.token-display {
  padding: 1.5rem;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(66, 165, 245, 0.15);
  backdrop-filter: blur(20px) saturate(150%);
}

.token-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.token-label {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(66, 165, 245, 0.8);
}

.token-count {
  font-size: 1.25rem;
  font-weight: 600;
  color: #e8eaed;
}

.token-unlimited {
  font-size: 1.25rem;
  font-weight: 600;
  color: rgba(34, 197, 94, 0.9);
}

.token-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(66, 165, 245, 0.8);
  box-shadow: 0 0 12px rgba(66, 165, 245, 0.6);
}

.token-indicator.unlimited {
  background: rgba(34, 197, 94, 0.8);
  box-shadow: 0 0 12px rgba(34, 197, 94, 0.6);
}

/* Quick Settings */
.quick-settings {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.setting-group label {
  color: rgba(139, 92, 246, 0.8);
  font-size: 0.85rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.select-glass {
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(12px);
  color: #e8eaed;
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-radius: 16px;
  padding: 1rem;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 1rem;
  outline: none;
  transition: all 0.3s ease;
  cursor: pointer;
  min-height: 56px;
}

.select-glass:focus {
  border-color: rgba(139, 92, 246, 0.4);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.15);
  background: rgba(255, 255, 255, 0.06);
}

.persona-selector {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.persona-selector .select-glass {
  flex: 1;
}

.btn-glass-icon-small {
  width: 56px;
  height: 56px;
  min-width: 56px;
  min-height: 56px;
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 16px;
  color: rgba(139, 92, 246, 0.8);
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.btn-glass-icon-small:active {
  background: rgba(139, 92, 246, 0.15);
  transform: scale(0.95);
}

/* Session Actions */
.session-actions {
  margin-top: 1.5rem;
}

/* Action Confirmation (Start/Reset) */
.action-confirmation {
  background: rgba(139, 92, 246, 0.06);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 16px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.confirmation-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: rgba(139, 92, 246, 0.9);
  font-size: 0.95rem;
  font-weight: 500;
}

.confirmation-icon {
  font-size: 1.5rem;
}

.confirmation-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.btn-confirm,
.btn-cancel {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid;
  min-width: 80px;
}

.btn-confirm {
  background: linear-gradient(135deg, rgba(30, 25, 85, 0.9) 0%, rgba(55, 48, 163, 0.9) 100%);
  border-color: rgba(67, 56, 202, 0.4);
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(67, 56, 202, 0.2);
}

.btn-confirm:active {
  transform: scale(0.95);
  box-shadow: 0 1px 4px rgba(67, 56, 202, 0.3);
}

.btn-cancel {
  background: rgba(139, 92, 246, 0.12);
  border-color: rgba(139, 92, 246, 0.3);
  color: rgba(139, 92, 246, 0.9);
}

.btn-cancel:active {
  background: rgba(139, 92, 246, 0.2);
  transform: scale(0.95);
}

.btn-primary {
  background: linear-gradient(135deg, rgba(20, 48, 71, 0.9) 0%, rgba(48, 88, 163, 0.9) 100%);
  border: 1px solid rgba(67, 56, 202, 0.4);
  color: #ffffff;
  padding: 1.25rem 1.5rem;
  border-radius: 16px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  outline: none;
  width: 100%;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  box-shadow: 0 4px 16px rgba(67, 56, 202, 0.25);
  min-height: 56px;
}

.btn-primary:active {
  transform: scale(0.98);
  box-shadow: 0 2px 8px rgba(67, 56, 202, 0.3);
}

.btn-primary:disabled {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  color: rgba(232, 234, 237, 0.5);
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

.active-session-actions {
  display: flex;
  gap: 1rem;
}

.btn-secondary {
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.2);
  color: rgba(139, 92, 246, 0.9);
  padding: 1.25rem;
  border-radius: 16px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  outline: none;
  flex: 1;
  backdrop-filter: blur(12px);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  min-height: 56px;
}

.btn-secondary:active {
  transform: scale(0.98);
}

/* Sessions List */
.sessions-content {
  min-height: 200px;
}

.sessions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 400px;
  overflow-y: auto;
}

.session-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.25rem;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(139, 92, 246, 0.15);
  backdrop-filter: blur(20px) saturate(150%);
  min-height: 80px;
}

.session-item:active {
  background: rgba(255, 255, 255, 0.06);
  transform: scale(0.98);
}

.session-item.active {
  background: rgba(129, 140, 248, 0.12);
  border-color: rgba(129, 140, 248, 0.3);
}

.session-item.has-content {
  border-left: 3px solid rgba(34, 197, 94, 0.6);
}

.session-content {
  flex: 1;
  min-width: 0;
}

.session-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
  gap: 0.75rem;
}

.session-title {
  font-weight: 600;
  color: #e8eaed;
  font-size: 1rem;
}

.session-date {
  font-size: 0.8rem;
  white-space: nowrap;
  color: rgba(139, 92, 246, 0.7);
}

.session-preview {
  font-size: 0.85rem;
  line-height: 1.5;
  color: #cbd5e1;
}

.session-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.session-action-btn {
  width: 44px;
  height: 44px;
  min-width: 44px;
  min-height: 44px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  transition: all 0.3s ease;
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.2);
  color: rgba(139, 92, 246, 0.8);
  backdrop-filter: blur(12px);
}

.session-action-btn:active {
  transform: scale(0.9);
}

/* Delete Confirmation Inline */
.session-item.confirming-delete {
  background: rgba(239, 68, 68, 0.08) !important;
  border-color: rgba(239, 68, 68, 0.3) !important;
}

.delete-confirmation {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  width: 100%;
}

.delete-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #fca5a5;
  font-size: 0.95rem;
  font-weight: 500;
}

.delete-icon {
  font-size: 1.5rem;
}

.delete-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.btn-delete-confirm,
.btn-delete-cancel {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid;
  min-width: 80px;
}

.btn-delete-confirm {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.4);
  color: #fca5a5;
}

.btn-delete-confirm:active {
  background: rgba(239, 68, 68, 0.25);
  transform: scale(0.95);
}

.btn-delete-cancel {
  background: rgba(139, 92, 246, 0.12);
  border-color: rgba(139, 92, 246, 0.3);
  color: rgba(139, 92, 246, 0.9);
}

.btn-delete-cancel:active {
  background: rgba(139, 92, 246, 0.2);
  transform: scale(0.95);
}

/* Empty State */
.no-sessions-message {
  text-align: center;
  padding: 3rem 1.5rem;
  color: #cbd5e1;
  background: rgba(139, 92, 246, 0.04);
  border: 1px solid rgba(139, 92, 246, 0.12);
  border-radius: 16px;
  backdrop-filter: blur(12px);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1.5rem;
}

.no-sessions-message p {
  color: #e8eaed;
  margin: 0.75rem 0;
  font-size: 1rem;
}

.hint {
  font-size: 0.9rem;
  margin-top: 0.75rem;
  opacity: 0.7;
  color: rgba(139, 92, 246, 0.8);
}

/* Utility Classes */
.text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.text-muted {
  color: rgba(139, 92, 246, 0.7);
}

/* Transitions */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-slide-enter-active,
.modal-slide-leave-active {
  transition: all 0.3s ease;
}

.modal-slide-enter-from,
.modal-slide-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.section-expand-enter-active,
.section-expand-leave-active {
  transition: all 0.3s ease;
}

.section-expand-enter-from,
.section-expand-leave-to {
  opacity: 0;
  max-height: 0;
}

.section-expand-enter-to,
.section-expand-leave-from {
  opacity: 1;
  max-height: 1000px;
}

/* Tablet Adjustments */
@media (min-width: 769px) and (max-width: 1024px) {
  .modal-overlay {
    align-items: center;
  }

  .mobile-sidebar-modal {
    max-width: 600px;
    max-height: 90vh;
    border-radius: 1.5rem;
  }
}
</style>
