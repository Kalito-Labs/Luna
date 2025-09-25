<template>
  <!-- Desktop Layout -->
  <div class="sidebar-layout">
    <!-- Sidebar -->
    <div class="sidebar glass-panel-primary">
      <div class="sidebar-header">
        <button class="home-button btn-glass-icon" @click="goToHome" title="Back to Home">
          <span class="home-icon">🏠</span>
        </button>
        <h2 class="sidebar-title">Kalito AI</h2>
      </div>

      <div class="sidebar-content">
        <!-- Session Menu Content -->
        <div class="sidebar-session-menu scrollbar-custom">
          <!-- Token Usage -->
          <div v-if="tokenUsage !== undefined" class="token-usage-section">
            <div class="token-display glass-panel-secondary">
              <div class="token-info">
                <span class="token-label text-muted">Session Tokens</span>
                <span v-if="isLocalModel" class="token-unlimited">Unlimited</span>
                <span v-else class="token-count">{{ tokenUsage.toLocaleString() }}</span>
              </div>
              <div class="token-indicator" :class="{ unlimited: isLocalModel }"></div>
            </div>
          </div>

          <!-- Quick Start Section -->
          <div class="quick-start-section">
            <div class="section-header">
              <h3 class="section-title">Quick Start</h3>
            </div>

            <div class="quick-settings">
              <div class="setting-group">
                <label for="model" class="text-muted">AI Model</label>
                <select
                  v-model="localSessionSettings.model"
                  id="model"
                  :disabled="isSessionActive"
                  class="select-glass"
                >
                  <option v-for="model in models" :key="model.id" :value="model.id">
                    {{ model.name }}
                  </option>
                </select>
              </div>

              <div class="setting-group">
                <label for="persona" class="text-muted">Persona</label>
                <div class="persona-selector">
                  <select
                    v-model="localSessionSettings.persona"
                    id="persona"
                    :disabled="isSessionActive"
                    class="select-glass"
                  >
                    <option v-for="persona in filteredPersonas" :key="persona.id" :value="persona.id">
                      {{ persona.icon }} {{ persona.name }}
                    </option>
                  </select>
                  <button class="btn-glass-icon-small" @click="goToPersonaManager" title="Manage Personas">
                    ⚙️
                  </button>
                </div>
              </div>
            </div>

            <!-- Session Actions -->
            <div class="session-actions">
              <div class="active-session-actions">
                <button class="btn-primary" @click="handleStartSession">
                  🚀 Start New Session
                </button>
                <button class="btn-secondary" @click="$emit('reset-session')" :disabled="!isSessionActive">
                  🔄 Reset
                </button>
              </div>
            </div>
          </div>

          <!-- Saved Sessions -->
          <div class="sessions-section">
            <div class="section-header section-collapsible" @click="toggleSection('savedSessions')">
              <h3 class="section-title">💬 Saved Sessions</h3>
              <span class="section-toggle" :class="{ expanded: sectionExpanded.savedSessions }">
                {{ sectionExpanded.savedSessions ? '−' : '+' }}
              </span>
            </div>

            <div v-show="sectionExpanded.savedSessions" class="section-content sessions-content">
              <div v-if="savedSessions.length === 0" class="no-sessions-message">
                <div class="empty-icon">💭</div>
                <p>No conversations yet</p>
                                <p class="hint">Start a conversation and it will automatically appear in your session history</p>
              </div>
              <div v-else class="sessions-list scrollbar-thin">
                <div
                  v-for="session in savedSessions"
                  :key="session.id"
                  class="session-item glass-panel-primary"
                  :class="{ 
                    active: session.id === currentSessionId,
                    'has-content': session.recap && session.recap.trim().length > 0 && !session.recap.includes('😞')
                  }"
                >
                  <div class="session-content" @click="$emit('select-session', session)">
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
                      @click.stop="confirmDeleteSession(session.id, session.name || `Session ${session.id.slice(0, 6)}`)"
                      title="Delete session"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Chat Area -->
    <div class="main-content">
      <ChatPanel
        :chat-messages="chatMessages"
        :is-session-active="isSessionActive"
        :session-settings="sessionSettings"
        :token-usage="tokenUsage"
        :loading="loading"
        :current-session-id="currentSessionId"
        @send-message="$emit('send-message', $event)"
        @update:session-settings="$emit('update:session-settings', $event)"
        @create-pin="(content, messageId) => $emit('create-pin', content, messageId)"
        @start-session="$emit('start-session', $event)"
        @reset-session="$emit('reset-session')"
        @delete-session="$emit('delete-session', $event)"
      />
    </div>
  </div>

  <!-- Delete Session Confirmation Dialog -->
  <ConfirmDialog
    :show="showDeleteDialog"
    title="Delete Session"
    :message="deleteDialogMessage"
    confirm-text="Yes, Delete"
    cancel-text="Cancel"
    @confirm="handleDeleteConfirm"
    @cancel="handleDeleteCancel"
  />
</template>

<script setup lang="ts">
import { reactive, ref, watch, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import ChatPanel from './ChatPanel.vue'
import ConfirmDialog from '../ConfirmDialog.vue'
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
  chatMessages: { from: 'user' | 'kalito'; text?: string; isRecap?: boolean }[]
  isSessionActive: boolean
  loading?: boolean
  sessionSettings?: any
  tokenUsage?: number
  sessions?: Session[] | { items?: Session[]; data?: Session[]; list?: Session[] } | null
  currentSessionId?: string | null
}>()

const emit = defineEmits<{
  (e: 'send-message', text: string): void
  (e: 'update:session-settings', settings: any): void
  (e: 'start-session', settings: any): void
  (e: 'reset-session'): void
  (e: 'select-session', session: any): void
  (e: 'delete-session', sessionId: string): void
  (e: 'load-session', session: any): void
  (e: 'create-pin', content: string, messageId?: string): void
}>()

// Delete confirmation dialog state
const showDeleteDialog = ref(false)
const deleteDialogMessage = ref('')
const sessionToDelete = ref<string | null>(null)

// Session menu state
const models = ref<Model[]>([])
const personaStore = usePersonaStore()
const { personas } = personaStore

// Cache for session messages to create better previews
const sessionMessagesCache = ref<Map<string, any[]>>(new Map())

// Function to create preview from first few messages
async function createPreviewFromMessages(sessionId: string): Promise<string> {
  try {
    // Check cache first
    if (sessionMessagesCache.value.has(sessionId)) {
      const messages = sessionMessagesCache.value.get(sessionId)
      return generatePreviewFromMessages(messages || [])
    }

    // Fetch messages if not cached
    const response = await fetchSessionMessages(sessionId)
    const messages = Array.isArray(response) ? response : (response.data || response.items || [])
    
    // Cache the messages
    sessionMessagesCache.value.set(sessionId, messages)
    
    return generatePreviewFromMessages(messages)
  } catch (error) {
    console.warn('Failed to fetch messages for preview:', error)
    return 'Unable to load preview'
  }
}

// Generate preview text from message array
function generatePreviewFromMessages(messages: any[]): string {
  if (!messages || messages.length === 0) {
    return 'Empty conversation'
  }

  // Find the first user message to get context
  const userMessages = messages.filter(msg => msg.role === 'user' && msg.text && msg.text.trim())

  if (userMessages.length === 0) {
    return 'No user messages found'
  }

  const firstUserMsg = userMessages[0].text.trim()
  
  // Create preview based on first user message
  if (firstUserMsg.length <= 100) {
    return `Discussion about: ${firstUserMsg}`
  } else {
    // Find a good truncation point
    const truncated = firstUserMsg.substring(0, 100)
    const lastSpace = truncated.lastIndexOf(' ')
    const breakPoint = lastSpace > 50 ? lastSpace : 100
    return `Discussion about: ${firstUserMsg.substring(0, breakPoint)}...`
  }
}

// Section expansion state
const sectionExpanded = reactive({
  savedSessions: true,
})

const localSessionSettings = reactive({
  model: '',
  persona: 'default',
  customContext: '',
  ...props.sessionSettings,
})

// Route helpers
function goToHome() {
  router.push('/')
}
function goToPersonaManager() {
  router.push({ name: 'personas' })
}

// Load models & personas, then ensure a persona is always selected
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

  // Ensure persona selection using fallback chain
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

// Personas visible for current model: filter by category only, sort defaults first
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

// NEW: normalize sessions prop to a plain array so renders never crash
const sessionsArray = computed<Session[]>(() => {
  const s = props.sessions as any
  if (Array.isArray(s)) return s
  if (s && Array.isArray(s.items)) return s.items
  if (s && Array.isArray(s.data)) return s.data
  if (s && Array.isArray(s.list)) return s.list
  return []
})

// Auto-select the default persona when model changes
watch(
  () => localSessionSettings.model,
  (newModel) => {
    if (!newModel || !models.value.length || !personas.value.length) return
    
    // Get the model type (local or cloud)
    const currentModel = models.value.find(m => m.id === newModel)
    if (!currentModel) return
    
    const modelCategory = currentModel.type === 'local' ? 'local' : 'cloud'
    
    // Find the default persona for this model category
    const categoryDefaultId = modelCategory === 'local' ? 'default-local' : 'default-cloud'
    
    // Look for model-specific default first (e.g., "default-qwen25" or "mistral-default")
    const modelName = newModel.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
    const modelSpecificDefaultPersona = personas.value.find(
      p => (p.id === `default-${modelName}` || p.id === `${modelName}-default`) && p.category === modelCategory
    )
    
    // If found model-specific default, use it; otherwise use category default
    if (modelSpecificDefaultPersona) {
      localSessionSettings.persona = modelSpecificDefaultPersona.id
      console.log(`Selected model-specific persona: ${modelSpecificDefaultPersona.id}`)
    } else {
      // Use category default or fallbacks
      const defaultPersona = personas.value.find(p => p.id === categoryDefaultId && p.category === modelCategory)
      
      if (defaultPersona) {
        localSessionSettings.persona = defaultPersona.id
        console.log(`Selected category default persona: ${defaultPersona.id}`)
      }
    }
  }
)

// Persist settings to parent anytime they change
watch(
  localSessionSettings,
  newSettings => {
    const sessionData = {
      ...newSettings,
      temperature: 0.7,
      maxTokens: 1000,
    }
    emit('update:session-settings', sessionData)
  },
  { deep: true }
)

// Actions
function toggleSection(section: keyof typeof sectionExpanded) {
  sectionExpanded[section] = !sectionExpanded[section]
}

function handleStartSession() {
  const sessionData = {
    ...localSessionSettings,
    temperature: 0.7,
    maxTokens: 1000,
  }
  emit('start-session', sessionData)
}

// saveCurrentSession removed - sessions are auto-saved in new model

// Saved sessions helpers
const savedSessions = computed(() => {
  const sessions = sessionsArray.value
    // Only explicitly saved sessions OR legacy with recap
    .filter(s => (typeof s.saved === 'number' ? s.saved === 1 : !!(s.recap && s.recap.trim())))
    .slice()
    .sort((a, b) => {
      const aTime = new Date((a.updated_at || a.created_at) || '').getTime()
      const bTime = new Date((b.updated_at || b.created_at) || '').getTime()
      return bTime - aTime
    })

  // Load message previews for sessions without recaps (background operation)
  sessions.forEach(session => {
    if (session?.id && (!session.recap || session.recap.trim().length === 0) && !sessionMessagesCache.value.has(session.id)) {
      createPreviewFromMessages(session.id).catch(() => {
        // Silent fail - preview loading is optional
      })
    }
  })

  return sessions
})

function loadSession(session: Session) {
  emit('load-session', session)
}

function confirmDeleteSession(sessionId: string, sessionName: string) {
  sessionToDelete.value = sessionId
  deleteDialogMessage.value = `Are you sure you want to delete "${sessionName}"?\n\nThis action cannot be undone.`
  showDeleteDialog.value = true
}
function handleDeleteConfirm() {
  if (sessionToDelete.value) {
    console.log('🗑️ Confirmed session deletion, emitting delete-session event with ID:', sessionToDelete.value)
    emit('delete-session', sessionToDelete.value)
    console.log('Event emitted, resetting dialog state')
    sessionToDelete.value = null
  } else {
    console.warn('No session ID set for deletion!')
  }
  showDeleteDialog.value = false
  deleteDialogMessage.value = ''
}
function handleDeleteCancel() {
  sessionToDelete.value = null
  showDeleteDialog.value = false
  deleteDialogMessage.value = ''
}

// UI text helpers
function getSessionTitle(session: Session): string {
  // If there's a custom name, use it
  if (session?.name && session.name.trim() && session.name !== 'New Chat') {
    return session.name
  }
  
  // Try to generate a title from cached messages first
  if (session?.id && sessionMessagesCache.value.has(session.id)) {
    const messages = sessionMessagesCache.value.get(session.id)
    const userMessages = messages?.filter(msg => msg.role === 'user' && msg.text && msg.text.trim()) || []
    
    if (userMessages.length > 0) {
      const firstUserMsg = userMessages[0].text.trim()
      
      // Extract key phrases or topics from the first message
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
  
  // Try to generate a title from the recap
  if (session?.recap && session.recap.trim().length > 0) {
    if (session.recap.includes('😞') || session.recap.toLowerCase().includes('sorry, i hit an error')) {
      return 'Chat Session'
    }
    
    // Extract first meaningful sentence or phrase as title
    const recap = session.recap.trim()
    const sentences = recap.split(/[.!?]+/)
    const firstSentence = sentences[0]?.trim() || ''
    
    if (firstSentence.length > 5 && firstSentence.length <= 50) {
      return firstSentence
    } else if (firstSentence.length > 50) {
      return firstSentence.substring(0, 47) + '...'
    }
  }
  
  // Fallback based on model and date
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
    
    // If recap is short enough, show it all
    if (recap.length <= 120) {
      return recap
    }
    
    // For longer recaps, try to find a good breaking point
    const truncated = recap.substring(0, 120)
    const lastSpace = truncated.lastIndexOf(' ')
    const lastPunctuation = Math.max(
      truncated.lastIndexOf('.'),
      truncated.lastIndexOf('!'),
      truncated.lastIndexOf('?'),
      truncated.lastIndexOf(',')
    )
    
    // Use the best breaking point
    const breakPoint = Math.max(lastSpace, lastPunctuation)
    if (breakPoint > 80) {
      return truncated.substring(0, breakPoint) + '...'
    }
    
    return truncated + '...'
  }
  
  // Try to load preview from messages if available
  if (session?.id && sessionMessagesCache.value.has(session.id)) {
    const messages = sessionMessagesCache.value.get(session.id)
    const preview = generatePreviewFromMessages(messages || [])
    if (preview !== 'Empty conversation' && preview !== 'No user messages found') {
      return preview
    }
  }
  
  // Generate preview from session metadata if no recap
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
/* ============================================================================
   SessionSidebar.vue — Unified Sidebar Layout and Session Management
   ============================================================================ */

/* === Main Layout Container === */
.sidebar-layout {
  display: flex;
  height: 100vh;
  background: linear-gradient(135deg, #0c0e14 0%, #1a1d29 100%);
  overflow: hidden;
}

/* === Sidebar Layout Components === */
.sidebar {
  width: 370px;
  min-width: 300px;
  background: rgba(14, 18, 26, 0.95);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-right: 1px solid rgba(139, 92, 246, 0.2);
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 16px rgba(139, 92, 246, 0.15);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.sidebar-header {
  position: relative;
  display: flex;
  align-items: center;
  gap: 2rem;
  padding: 1rem;
  border-bottom: 1px solid rgba(139, 92, 246, 0.2);
  background: linear-gradient(135deg, rgba(11, 7, 20, 0.08) 0%, rgba(139, 92, 246, 0.04) 100%);
}

.sidebar-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

/* === Home Button Styling === */
.home-button {
  width: 32px;
  height: 32px;
  font-size: 1rem;
  background: rgba(66, 165, 245, 0.12);
  border: 1px solid rgba(66, 165, 245, 0.25);
  border-radius: 0.5rem;
  color: rgba(66, 165, 245, 0.9);
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(12px);
}

.home-button:hover {
  background: rgba(66, 165, 245, 0.2);
  border-color: rgba(66, 165, 245, 0.4);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(66, 165, 245, 0.25);
}

.home-icon {
  transition: transform 0.2s ease;
}

/* === Sidebar Title Typography === */
.sidebar-title {
  position: absolute;
  left: 48%;
  transform: translateX(-50%);
  color: #e8eaed;
  font-size: 1rem;
  font-weight: 700;
  margin: 0;
  letter-spacing: 0.02em;
  text-align: center;
}

/* === Session Menu Styles === */

/* Main Layout */
.sidebar-session-menu {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 1rem;
  gap: 1.5rem;
  overflow-y: auto;
}

/* Section Structure */
.token-usage-section,
.quick-start-section {
  flex-shrink: 0;
}

.sessions-section {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  cursor: pointer;
  padding: 0.75rem;
  border-radius: 0.75rem;
  background: rgba(139, 92, 246, 0.08);
  border: 1px solid rgba(139, 92, 246, 0.2);
  transition: all 0.3s ease;
}

.section-header:hover {
  background: rgba(139, 92, 246, 0.12);
  border-color: rgba(139, 92, 246, 0.3);
  transform: translateY(-1px);
}

.section-title {
  color: #e8eaed;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  text-align: center;
}

.section-toggle {
  color: rgba(66, 165, 245, 0.8);
  font-size: 1.1rem;
  font-weight: 600;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(66, 165, 245, 0.12);
  border: 1px solid rgba(66, 165, 245, 0.25);
  transition: all 0.3s ease;
}

.section-toggle:hover {
  background: rgba(66, 165, 245, 0.2);
  border-color: rgba(66, 165, 245, 0.4);
  color: rgba(66, 165, 245, 1);
}

.section-content {
  overflow: hidden;
}

/* Token Usage */
.token-display {
  padding: 1.25rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, rgba(66, 165, 245, 0.08) 0%, rgba(66, 165, 245, 0.04) 100%);
  border: 1px solid rgba(66, 165, 245, 0.2);
  backdrop-filter: blur(16px) saturate(150%);
  transition: all 0.3s ease;
}

.token-display:hover {
  border-color: rgba(66, 165, 245, 0.3);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(66, 165, 245, 0.15);
}

.token-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.token-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(66, 165, 245, 0.8);
}

.token-count {
  font-size: 1.1rem;
  font-weight: 600;
  color: #e8eaed;
}

.token-unlimited {
  font-size: 1.1rem;
  font-weight: 600;
  color: rgba(34, 197, 94, 0.9);
}

.token-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(66, 165, 245, 0.8);
  box-shadow: 0 0 8px rgba(66, 165, 245, 0.4);
}

.token-indicator.unlimited {
  background: rgba(34, 197, 94, 0.8);
  box-shadow: 0 0 8px rgba(34, 197, 94, 0.4);
}

/* Quick Settings */
.quick-settings {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.setting-group label {
  color: rgba(139, 92, 246, 0.8);
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.select-glass {
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(12px);
  color: #e8eaed;
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 0.9rem;
  outline: none;
  transition: all 0.3s ease;
  cursor: pointer;
}

.select-glass:focus {
  border-color: rgba(139, 92, 246, 0.5);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.15);
  background: rgba(255, 255, 255, 0.08);
}

.select-glass:hover {
  border-color: rgba(139, 92, 246, 0.3);
  background: rgba(255, 255, 255, 0.08);
}

.persona-selector {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.persona-selector .select-glass {
  flex: 1;
}

.btn-glass-icon-small {
  width: 32px;
  height: 32px;
  background: rgba(139, 92, 246, 0.12);
  border: 1px solid rgba(139, 92, 246, 0.25);
  border-radius: 0.5rem;
  color: rgba(139, 92, 246, 0.8);
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
}

.btn-glass-icon-small:hover {
  background: rgba(139, 92, 246, 0.2);
  border-color: rgba(139, 92, 246, 0.4);
  color: rgba(139, 92, 246, 1);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.25);
}

/* Session Actions */
.session-actions {
  margin-top: 1.5rem;
}

.btn-primary {
  background: linear-gradient(135deg, rgba(30, 25, 85, 0.9) 0%, rgba(55, 48, 163, 0.9) 100%);
  border: 1px solid rgba(67, 56, 202, 0.4);
  color: #ffffff;
  padding: 0.875rem 1.5rem;
  border-radius: 0.75rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  outline: none;
  width: 100%;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  box-shadow: 0 4px 16px rgba(67, 56, 202, 0.25);
}

.btn-primary:hover {
  background: linear-gradient(135deg, rgba(30, 25, 85, 1) 0%, rgba(55, 48, 163, 1) 100%);
  border-color: rgba(67, 56, 202, 0.6);
  box-shadow: 0 8px 24px rgba(67, 56, 202, 0.35);
  transform: translateY(-1px);
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: 0 4px 16px rgba(67, 56, 202, 0.3);
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
  gap: 0.75rem;
}

.btn-secondary {
  background: rgba(139, 92, 246, 0.12);
  border: 1px solid rgba(139, 92, 246, 0.25);
  color: rgba(139, 92, 246, 0.9);
  padding: 0.75rem 1.25rem;
  border-radius: 0.75rem;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  outline: none;
  flex: 1;
  backdrop-filter: blur(12px);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.btn-secondary:hover {
  background: rgba(139, 92, 246, 0.2);
  border-color: rgba(139, 92, 246, 0.4);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.25);
}

.btn-danger {
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.25);
  color: rgba(239, 68, 68, 0.9);
  padding: 0.75rem 1.25rem;
  border-radius: 0.75rem;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  outline: none;
  flex: 1;
  backdrop-filter: blur(12px);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.btn-danger:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.4);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(239, 68, 68, 0.25);
}

/* Sessions List */
.sessions-content {
  flex: 1;
  min-height: 0;
}

.sessions-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  height: 100%;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.sessions-list::-webkit-scrollbar {
  width: 6px;
}

.sessions-list::-webkit-scrollbar-track {
  background: rgba(139, 92, 246, 0.05);
  border-radius: 3px;
}

.sessions-list::-webkit-scrollbar-thumb {
  background: rgba(139, 92, 246, 0.3);
  border-radius: 3px;
}

.sessions-list::-webkit-scrollbar-thumb:hover {
  background: rgba(139, 92, 246, 0.5);
}

.session-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(139, 92, 246, 0.04) 100%);
  border: 1px solid rgba(139, 92, 246, 0.2);
  backdrop-filter: blur(16px) saturate(150%);
}

.session-item:hover {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%);
  border-color: rgba(139, 92, 246, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(139, 92, 246, 0.15);
}

.session-item.active {
  background: linear-gradient(135deg, rgba(66, 165, 245, 0.12) 0%, rgba(66, 165, 245, 0.08) 100%);
  border-color: rgba(66, 165, 245, 0.4);
  box-shadow: 0 4px 16px rgba(66, 165, 245, 0.2);
}

.session-item.has-content {
  border-left: 3px solid rgba(34, 197, 94, 0.6);
}

.session-item.has-content:hover {
  border-left-color: rgba(34, 197, 94, 0.8);
}

.session-content {
  flex: 1;
  min-width: 0;
}

.session-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
  gap: 0.5rem;
}

.session-title {
  font-weight: 600;
  color: #e8eaed;
  font-size: 0.9rem;
}

.session-date {
  font-size: 0.75rem;
  white-space: nowrap;
  color: rgba(139, 92, 246, 0.7);
}

.session-preview {
  font-size: 0.8rem;
  line-height: 1.4;
  color: #cbd5e1;
}

.session-actions {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.session-action-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  transition: all 0.3s ease;
  background: rgba(139, 92, 246, 0.12);
  border: 1px solid rgba(139, 92, 246, 0.25);
  color: rgba(139, 92, 246, 0.8);
  backdrop-filter: blur(12px);
}

.session-action-btn:hover {
  background: rgba(139, 92, 246, 0.2);
  border-color: rgba(139, 92, 246, 0.4);
  color: rgba(139, 92, 246, 1);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.25);
}

/* Empty States */
.no-sessions-message {
  text-align: center;
  padding: 2rem 1rem;
  color: #cbd5e1;
  background: rgba(139, 92, 246, 0.06);
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-radius: 0.75rem;
  backdrop-filter: blur(12px);
}

.empty-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.no-sessions-message p {
  color: #e8eaed;
  margin: 0.5rem 0;
}

.hint {
  font-size: 0.8rem;
  margin-top: 0.5rem;
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
</style>
