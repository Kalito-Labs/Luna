<template>
  <!-- 
    ChatWorkspace.vue - Main Application Orchestrator
    
    Formerly ChatSessionManager.vue, renamed for better clarity.
    
    Responsibilities:
    - Application state management and business logic
    - Session lifecycle coordination 
    - Message handling and API communication
    - Local storage persistence
    - Background processes and data loading
  -->
  
  <div class="workspace-shell">
    <div class="shell-body">
      <!-- Desktop Layout -->
      <SessionSidebar
        v-if="!isMobile && !isTablet"
        :chat-messages="chatMessages"
        :is-session-active="isSessionActive"
        :session-settings="sessionSettings"
        :token-usage="tokenUsage"
        :loading="loading"
        :searching="searching"
        :sessions="sessions"
        :current-session-id="currentSessionId"
        @send-message="sendMessage"
        @update:session-settings="updateSessionSettings"
        @start-session="startSession"
        @reset-session="resetSession"
        @select-session="handleSelectSession"
        @delete-session="handleDeleteSession"
        @load-session="handleLoadSession"
        @create-pin="handleCreatePin"
      />

      <!-- Mobile/Tablet Layout -->
      <div v-else class="mobile-layout">
        <ChatPanelMobile
          :chat-messages="chatMessages"
          :is-session-active="isSessionActive"
          :loading="loading"
          :searching="searching"
          :current-session-id="currentSessionId"
          @send-message="sendMessage"
          @open-settings="showMobileSettings = true"
          @create-pin="handleCreatePin"
        />
        <SessionSidebarMobile
          :show="showMobileSettings"
          :is-session-active="isSessionActive"
          :session-settings="sessionSettings"
          :token-usage="tokenUsage"
          :sessions="sessions"
          :current-session-id="currentSessionId"
          @close="showMobileSettings = false"
          @update:session-settings="updateSessionSettings"
          @start-session="handleMobileStartSession"
          @reset-session="resetSession"
          @select-session="handleSelectSession"
          @delete-session="handleDeleteSession"
          @load-session="handleMobileLoadSession"
        />
      </div>
    </div>

    <!-- Custom Reset Confirmation Dialog -->
    <ConfirmDialog
      :show="showResetDialog"
      title="Reset Session"
      :message="resetDialogMessage"
      confirm-text="Save"
      cancel-text="Discard"
      @confirm="handleResetConfirm"
      @cancel="handleResetCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import SessionSidebar from './SessionSidebar.vue'
import SessionSidebarMobile from './SessionSidebarMobile.vue'
import ChatPanelMobile from './ChatPanelMobile.vue'
import ConfirmDialog from '../ConfirmDialog.vue'
import {
  sendMessageToAgent,
  sendMessageToAgentStream,
  fetchSessions,
  fetchSessionMessages,
  createSession,
  createSemanticPin,
  saveSession,
  fetchAvailableModels,
} from '../../core'
import type { Message as SharedMessage } from '../../../../backend/types/messages'

// Optional props for ChatSessionView compatibility
const props = defineProps<{
  'chat-messages'?: SharedMessage[]
}>()

const emit = defineEmits<{
  'send-message': [text: string]
}>()

interface Message {
  role: 'user' | 'assistant'
  content: string
}

// Viewport detection for responsive layout
const isMobile = ref(false)
const isTablet = ref(false)
const showMobileSettings = ref(false)

function updateViewport() {
  const width = window.innerWidth
  isMobile.value = width <= 768
  isTablet.value = width > 768 && width <= 1024
}

onMounted(() => {
  updateViewport()
  window.addEventListener('resize', updateViewport)
})

// Mobile-specific session handlers
function handleMobileStartSession(settings: any) {
  startSession(settings)
  showMobileSettings.value = false
}

function handleMobileLoadSession(session: any) {
  handleLoadSession(session)
  showMobileSettings.value = false
}

/**
 * Intelligently truncates messages to fit within character budget
 * Preserves message structure and context while staying under limit
 */
function intelligentMessageTruncation(messages: Message[], maxChars: number): Message[] {
  // First, calculate total length of all messages
  let totalLength = messages.reduce((sum, msg) => sum + msg.content.length, 0)
  
  // If already under budget, return as-is
  if (totalLength <= maxChars) {
    return messages
  }

  // Strategy 1: Truncate individual long messages
  const maxMessageLength = Math.floor(maxChars / messages.length) // Fair distribution
  let truncatedMessages = messages.map(msg => {
    if (msg.content.length > maxMessageLength) {
      // Intelligent truncation: keep beginning and end, show truncation
      const keepLength = Math.floor(maxMessageLength * 0.8) // Leave some buffer
      const startLength = Math.floor(keepLength / 2)
      const endLength = keepLength - startLength
      
      const truncated = 
        msg.content.substring(0, startLength) + 
        '\n...[content truncated]...\n' + 
        msg.content.substring(msg.content.length - endLength)
      
      return { ...msg, content: truncated }
    }
    return msg
  })

  // Recalculate length after truncation
  totalLength = truncatedMessages.reduce((sum, msg) => sum + msg.content.length, 0)
  
  // Strategy 2: If still too long, reduce number of messages
  if (totalLength > maxChars) {
    // Keep the most recent messages that fit
    let currentLength = 0
    const finalMessages: Message[] = []
    
    for (let i = truncatedMessages.length - 1; i >= 0; i--) {
      const msgLength = truncatedMessages[i].content.length
      if (currentLength + msgLength <= maxChars) {
        finalMessages.unshift(truncatedMessages[i])
        currentLength += msgLength
      } else {
        break
      }
    }
    
    return finalMessages
  }

  return truncatedMessages
}

interface SessionSettings {
  model: string
  persona?: string
  temperature?: number
  maxTokens?: number
  customContext?: string
  fileIds?: string[]
}
interface ChatMessage {
  from: 'user' | 'kalito'
  text: string
  isRecap?: boolean
  id?: string
}

interface Session {
  id: string
  name?: string
  model?: string
  persona_id?: string
  created_at?: string
  updated_at?: string
  recap?: string
  saved?: number
}

// Type conversion utilities for ChatSessionView compatibility
function convertSharedMessageToChatMessage(msg: SharedMessage): ChatMessage {
  return {
    from: msg.role === 'user' ? 'user' : 'kalito',
    text: msg.text,
    isRecap: false
  }
}

function convertSharedMessageArrayToChatMessages(messages: SharedMessage[]): ChatMessage[] {
  return messages.map(convertSharedMessageToChatMessage)
}

const sessionSettings = ref<SessionSettings>({
  model: '',
  persona: 'default',
  temperature: 0.7,
  maxTokens: 1024,
  customContext: '',
})
const isSessionActive = ref(false)
const chatMessages = ref<ChatMessage[]>(
  // Initialize with converted messages from props if provided
  props['chat-messages'] ? convertSharedMessageArrayToChatMessages(props['chat-messages']) : []
)
const tokenUsage = ref<number>(0)
const currentSessionId = ref<string | null>(null)
const loading = ref(false)
const searching = ref(false)
const sessions = ref<Session[]>([])           // <-- always an array
// lastSaveTime removed - no longer needed with auto-save model
const models = ref<any[]>([]) // AI-Protocols: Always initialize as empty array

// Dialog state for custom reset confirmations
const showResetDialog = ref(false)
const resetDialogMessage = ref('')

// Model classification helper using backend data - DEFENSIVE PROGRAMMING
function getModelType(modelId: string): 'local' | 'cloud' | 'unknown' {
  if (!Array.isArray(models.value)) {
    console.warn('Models not loaded yet or invalid format, defaulting to unknown type')
    return 'unknown'
  }
  
  if (!modelId) {
    return 'unknown'
  }
  
  const model = models.value.find(m => m && m.id === modelId)
  return model?.type || 'unknown'
}

function canLoadSession(currentModel: string, sessionModel: string): boolean {
  if (!Array.isArray(models.value)) {
    console.warn('Models not loaded, allowing session load (will warn later)')
    return true
  }
  
  const currentType = getModelType(currentModel)
  const sessionType = getModelType(sessionModel || '')
  
  if (currentType === 'local' && sessionType !== 'local') {
    return false
  }
  
  return true
}

// localStorage keys for persistence
const STORAGE_KEYS = {
  CHAT_MESSAGES: 'kalito-chat-messages',
  SESSION_ACTIVE: 'kalito-session-active',
  CURRENT_SESSION_ID: 'kalito-current-session-id',
  SESSION_SETTINGS: 'kalito-session-settings',
  TOKEN_USAGE: 'kalito-token-usage',
  CURRENT_SESSION_DATA: 'kalito-current-session-data', // New: for browser refresh persistence
}

// Load persisted state from localStorage
function loadPersistedState() {
  try {
    // Only restore user preferences (settings)
    const savedSettings = localStorage.getItem(STORAGE_KEYS.SESSION_SETTINGS)
    if (savedSettings) {
      sessionSettings.value = { ...sessionSettings.value, ...JSON.parse(savedSettings) }
    }
    
    // Restore current active session if it exists (for browser refresh)
    const savedSessionData = localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION_DATA)
    if (savedSessionData) {
      const sessionData = JSON.parse(savedSessionData)
      
      // Restore current session state
      chatMessages.value = sessionData.messages || []
      isSessionActive.value = sessionData.isActive || false
      currentSessionId.value = sessionData.sessionId || null
      tokenUsage.value = sessionData.tokenUsage || 0
      
      console.log('✅ Current session restored from browser storage')
    } else {
      // Start with clean session state if no current session saved
      isSessionActive.value = false
      chatMessages.value = []
      currentSessionId.value = null
      tokenUsage.value = 0
      console.log('App started with clean session state - ready for new conversation')
    }
    
    // Clean up old storage keys (backwards compatibility)
    localStorage.removeItem(STORAGE_KEYS.CHAT_MESSAGES)
    localStorage.removeItem(STORAGE_KEYS.SESSION_ACTIVE)
    localStorage.removeItem(STORAGE_KEYS.TOKEN_USAGE)
    
  } catch (error) {
    console.warn('Failed to load persisted state:', error)
    // Fallback to clean state
    isSessionActive.value = false
    chatMessages.value = []
    currentSessionId.value = null
    tokenUsage.value = 0
  }
}

// Save persistent user preferences and current session (for browser refresh)
function saveStateToStorage() {
  try {
    // Save user preferences that should persist between app launches
    localStorage.setItem(STORAGE_KEYS.SESSION_SETTINGS, JSON.stringify(sessionSettings.value))
    
    // Save current session data for browser refresh recovery (but not permanent storage)
    if (isSessionActive.value && currentSessionId.value) {
      const currentSessionData = {
        messages: chatMessages.value,
        isActive: isSessionActive.value,
        sessionId: currentSessionId.value,
        tokenUsage: tokenUsage.value,
        timestamp: new Date().toISOString(),
      }
      localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION_DATA, JSON.stringify(currentSessionData))
    } else {
      // Clear session data if no active session
      localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION_DATA)
    }
  } catch (error) {
    console.warn('Failed to save state to storage:', error)
  }
}

// Clear persisted state (for session reset)
function clearPersistedState() {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key)
    })
    console.log('✅ All persisted state cleared')
  } catch (error) {
    console.warn('Failed to clear persisted state:', error)
  }
}

onMounted(async () => {
  loadPersistedState()
  await loadModels()
  await loadSessions()
})

// Watch for changes and persist to localStorage
watch(
  [chatMessages, isSessionActive, currentSessionId, sessionSettings, tokenUsage],
  () => {
    saveStateToStorage()
  },
  { deep: true }
)

async function loadSessions() {
  try {
    const raw = await fetchSessions()

    // Normalize common API shapes -> always an array
    const arr =
      Array.isArray(raw) ? raw :
      Array.isArray((raw as any)?.items) ? (raw as any).items :
      Array.isArray((raw as any)?.data) ? (raw as any).data :
      Array.isArray((raw as any)?.rows) ? (raw as any).rows :
      []

    sessions.value = arr as Session[]
  } catch (err) {
    console.error('Failed to load sessions:', err)
    sessions.value = [] // never leave it as an object
  }
}

async function loadModels() {
  try {
    console.log('Loading models from API...')
    const response = await fetch('/api/models')
    if (response.ok) {
      const data = await response.json()
      // Handle both array response and object with models property
      if (Array.isArray(data)) {
        models.value = data
        console.log('Models loaded successfully:', data.length, 'models')
      } else if (data && Array.isArray(data.models)) {
        models.value = data.models
        console.log('Models loaded successfully:', data.models.length, 'models')
      } else {
        console.error('Models API returned unexpected format:', data)
        models.value = [] // Ensure it's always an array
      }
    } else {
      console.error('Models API failed:', response.status, response.statusText)
      models.value = [] // Ensure it's always an array
    }
  } catch (error) {
    console.error('Failed to load models:', error)
    models.value = [] // Ensure it's always an array
  }
}

async function handleSelectSession(session: { id: string; recap?: string; model?: string }) {
  // Direct session loading for sidebar interface
  if (!session?.id) return

  // Check model compatibility - warn if loading incompatible session
  const currentModel = sessionSettings.value.model
  if (session.model && !canLoadSession(currentModel, session.model)) {
    const currentType = getModelType(currentModel)
    const sessionType = getModelType(session.model)
    console.warn(`Loading ${sessionType} model session into ${currentType} model - may cause confusion`)
  }

  // Reset current state
  chatMessages.value = []
  tokenUsage.value = 0
  loading.value = false

  // Load the selected session
  currentSessionId.value = session.id
  isSessionActive.value = true

  // Add recap as first message if it exists
  if (session.recap) {
    const cleanedRecap = cleanRecapContent(session.recap)
    chatMessages.value.push({
      from: 'kalito',
      text: cleanedRecap,
      isRecap: true,
    })
  }

  // Save the new state
  saveStateToStorage()

  console.log('Session loaded:', session.id)
}

async function startSession(updatedSettings?: SessionSettings) {
  const newSession = await createSession()
  currentSessionId.value = newSession.id
  // Use provided settings or current settings as fallback
  if (updatedSettings) {
    sessionSettings.value = { ...updatedSettings }
  }
  // Ensure we have a valid model
  if (!sessionSettings.value.model) {
    console.warn('No model selected, cannot start session')
    chatMessages.value.push({
      from: 'kalito',
      text: '❌ No model selected. Please select a model before starting a session.',
    })
    return
  }
  isSessionActive.value = true
  chatMessages.value = []
  tokenUsage.value = 0
  await loadSessions()

  // Enhanced visual feedback for session start with persona info
  let personaInfo = ''
  if (sessionSettings.value.persona && sessionSettings.value.persona !== 'default') {
    personaInfo = ` | Persona: ${sessionSettings.value.persona}`
  }

  // Document info for session start message
  let documentInfo = ''
  if (sessionSettings.value.fileIds && sessionSettings.value.fileIds.length > 0) {
    const docCount = sessionSettings.value.fileIds.length
    documentInfo = ` | Documents: ${docCount} attached`
  }

  chatMessages.value.push({
    from: 'kalito',
    text: `🚀 **New Session Started**\n\nModel: ${sessionSettings.value.model}${personaInfo}${documentInfo}\n\nReady to chat!`,
  })

  // Auto-send document introduction if documents are attached
  if (sessionSettings.value.fileIds && sessionSettings.value.fileIds.length > 0) {
    const docCount = sessionSettings.value.fileIds.length
    const docText = docCount === 1 ? 'document' : 'documents'

    const documentIntroMessage = `I have ${docCount} ${docText} attached to this session that you can reference. You can ask me questions about the content, request summaries, or have me analyze the information in these documents.`

    try {
      const result = await sendMessageToAgent(
        documentIntroMessage,
        '', // systemPrompt
        sessionSettings.value.model,
        sessionSettings.value,
        sessionSettings.value.fileIds,
        currentSessionId.value || undefined
      )

      // Add the intro message and AI response to chat
      chatMessages.value.push({
        from: 'user',
        text: documentIntroMessage,
      })

      chatMessages.value.push({
        from: 'kalito',
        text: result.reply,
      })

      if (typeof result.tokenUsage === 'number' && result.tokenUsage > 0) {
        tokenUsage.value += result.tokenUsage
      }
    } catch (error) {
      console.error('Failed to send document introduction:', error)
      chatMessages.value.push({
        from: 'kalito',
        text: '⚠️ Note: Documents are attached but introduction failed. You can still ask about the documents.',
      })
    }
  }
}

async function resetSession() {
  // Always work with an array
  const list = Array.isArray(sessions.value) ? sessions.value : []

  // Check if current session has content
  if (isSessionActive.value && chatMessages.value.length > 0) {
    const currentSession = currentSessionId.value
      ? list.find(s => s.id === currentSessionId.value)
      : undefined

    const hasRecap = !!currentSession?.recap?.trim()

    if (!hasRecap) {
      // Auto-saved session without summary - simpler dialog
      resetDialogMessage.value =
        'Click Save to generate a summary and start a new session, or click Discard to start a new session without saving a summary.'
    } else {
      // Session with summary - traditional behavior
      resetDialogMessage.value =
        'Click Save to update the current session summary and start a new session, or click Discard to discard recent changes and start a new session.'
    }
    
    showResetDialog.value = true
    return // Dialog handlers will continue the reset process
  }

  // If no active session or no content, start new session immediately
  performReset()
}

// Dialog event handlers
async function handleResetConfirm() {
  showResetDialog.value = false
  
  // User clicked "Save" - generate recap and save session before resetting
  if (currentSessionId.value && isSessionActive.value) {
    try {
      chatMessages.value.push({
        from: 'kalito',
        text: '💾 Saving session and generating summary...',
      })
      
      // Call the save API which will generate a recap automatically
      await saveSession(
        currentSessionId.value,
        '', // Empty recap - API will generate one
        sessionSettings.value.model || 'default',
        sessionSettings.value.persona || 'default',
        undefined // No custom name
      )
      
      chatMessages.value.push({
        from: 'kalito',
        text: '✅ Session saved successfully! Starting new session...',
      })
      
      // Refresh sessions list to show the saved session
      await loadSessions()
    } catch (error) {
      console.error('Failed to save session:', error)
      chatMessages.value.push({
        from: 'kalito',
        text: '⚠️ Failed to save session, but starting new session anyway...',
      })
    }
  }
  
  performReset()
}

function handleResetCancel() {
  showResetDialog.value = false
  
  // User chose "Discard" - Discard current session and start new one
  chatMessages.value.push({
    from: 'kalito',
    text: '🗑️ Session discarded. Starting new session...',
  })
  performReset()
}

// Actual reset implementation - starts a new session
function performReset() {
  // Clear current session state
  isSessionActive.value = false
  chatMessages.value = []
  tokenUsage.value = 0
  currentSessionId.value = null

  // Clear persisted state
  clearPersistedState()
  
  // Add final reset confirmation
  setTimeout(() => {
    chatMessages.value.push({
      from: 'kalito',
      text: '🆕 Ready for a new conversation! Select your model and persona to get started.',
    })
  }, 100)
}

async function sendMessage(text: string) {
  // Emit for ChatSessionView compatibility
  emit('send-message', text)
  
  if (!isSessionActive.value || !currentSessionId.value) return

  console.log('Sending message with model:', sessionSettings.value.model)
  console.log('Session settings:', sessionSettings.value)

  chatMessages.value.push({ from: 'user', text })
  loading.value = true
  searching.value = false
  const assistantMessageIndex = chatMessages.value.length
  chatMessages.value.push({ from: 'kalito', text: '' })
  try {
    let accumulatedText = ''
    let finalTokenUsage = 0
    for await (const chunk of sendMessageToAgentStream(
      text,
      '',
      sessionSettings.value.model,
      sessionSettings.value,
      sessionSettings.value.fileIds || [],
      currentSessionId.value || undefined
    )) {
      if (chunk.error) {
        chatMessages.value[assistantMessageIndex]!.text = chunk.error
        break
      }
      if (chunk.delta) {
        accumulatedText += chunk.delta
        
        // Check for searching marker
        if (accumulatedText.includes('[SEARCHING_ONLINE]')) {
          searching.value = true
          accumulatedText = accumulatedText.replace('[SEARCHING_ONLINE]', '')
        }
        
        chatMessages.value[assistantMessageIndex]!.text = accumulatedText
      }
      if (chunk.tokenUsage !== undefined) {
        console.log('Chunk token usage:', chunk.tokenUsage)
        finalTokenUsage = chunk.tokenUsage
        // Don't update tokenUsage.value here - wait for completion
      }
      if (chunk.done) {
        console.log('Message complete. Tokens for this exchange:', finalTokenUsage)
        searching.value = false
        if (finalTokenUsage > 0) {
          tokenUsage.value += finalTokenUsage // Accumulate tokens when message is complete
        }
        console.log('Total session tokens:', tokenUsage.value)
        
        await loadSessions()
        break
      }
    }
  } catch (err: any) {
    chatMessages.value[assistantMessageIndex]!.text = `Agent error: ${err?.message || String(err)}`
  } finally {
    loading.value = false
    searching.value = false
  }
}

// Clean recap content to prevent model confusion
function cleanRecapContent(content: string): string {
  if (!content) return content
  
  // Remove model references that confuse AI models
  let cleaned = content
    .replace(/Model:\s*[^\|,\n]*/gi, '') // Remove "Model: gpt-4.1-mini" etc
    .replace(/🚀\s*New Session Started/gi, '') // Remove UI text
    .replace(/💾\s*\*\*Injected Session Recap\*\*/gi, '') // Remove injection headers
    .replace(/📝\s*\*\*Session Content Loaded\*\*/gi, '') // Remove load headers
    .replace(/Using:\s*[^\n]*/gi, '') // Remove "Using: model | persona" lines
    .replace(/Conversation about:/gi, '') // Remove conversation labels
    .replace(/\|\s*,/g, '') // Remove malformed separators like "| ,"
    .replace(/\s*\|\s*/g, ' ') // Clean up remaining separators
    .replace(/\n\s*\n/g, '\n') // Remove extra blank lines
    .trim()
  
  return cleaned
}

function generateSessionTitle(messages: ChatMessage[]): string {
  // Get the first user message to create a descriptive title
  const firstUserMessage = messages.find(m => m.from === 'user' && m.text && !m.isRecap)

  if (firstUserMessage?.text) {
    // Clean and truncate the message for a title
    let title = firstUserMessage.text
      .replace(/[^\w\s]/g, '') // Remove special characters
      .trim()
      .substring(0, 50) // Max 50 characters

    if (firstUserMessage.text.length > 50) {
      title += '...'
    }

    return title || 'Chat Session'
  }

  return 'Chat Session'
}

/**
 * Convert database messages to chat messages format
 */
function convertDBMessagesToChatMessages(dbMessages: any[]): ChatMessage[] {
  if (!Array.isArray(dbMessages)) {
    console.warn('Invalid dbMessages format:', dbMessages)
    return []
  }

  return dbMessages.map(msg => ({
    from: msg.role === 'user' ? 'user' : 'kalito',
    text: msg.text || '',
    isRecap: false,
  }))
}

async function handleCreatePin(content: string, messageId?: string) {
  if (!currentSessionId.value) {
    console.warn('Cannot create pin: No active session')
    return
  }
  
  try {
    const result = await createSemanticPin(
      currentSessionId.value,
      content,
      messageId,
      'manual'
    )
    
    // Notify user that pin was created
    chatMessages.value.push({
      from: 'kalito',
      text: '📌 Pin created successfully! This content will be prioritized in the memory context.',
    })
    
    console.log('Pin created:', result)
  } catch (error) {
    console.error('Failed to create pin:', error)
    
    // Notify user of error
    chatMessages.value.push({
      from: 'kalito',
      text: '❌ Failed to create pin. Please try again.',
    })
  }
}

async function handleDeleteSession(sessionId: string) {
  console.log('🔥 Delete session called with ID:', sessionId)
  try {
    console.log('Sending DELETE request to:', `/api/sessions/${encodeURIComponent(sessionId)}`)
    const response = await fetch(`/api/sessions/${encodeURIComponent(sessionId)}`, {
      method: 'DELETE',
    })
    
    console.log('Delete response:', response.status, response.statusText)
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Server error: ${response.status} ${response.statusText} - ${errorText}`)
    }
    
    console.log('Reloading sessions after delete')
    await loadSessions()
    if (currentSessionId.value === sessionId) {
      // If deleting the current session, perform direct reset without dialog
      // User already confirmed deletion, so no need for save/discard dialog
      console.log('Deleting current session, performing reset')
      performReset()
    }
  } catch (err) {
    console.error('Error deleting session:', err)
    window.alert('Failed to delete session: ' + (err as any)?.message)
  }
}

async function handleLoadSession(session: any) {
  // Enhanced session loading with smart behavior based on current state
  if (!session?.id) {
    console.error('Invalid session data:', session)
    chatMessages.value.push({
      from: 'kalito',
      text: '❌ Unable to load session: Invalid session data. Please try creating a new session.',
    })
    return
  }

  // Check model compatibility - warn if loading incompatible session
  const currentModel = sessionSettings.value.model
  if (session.model && !canLoadSession(currentModel, session.model)) {
    const currentType = getModelType(currentModel)
    const sessionType = getModelType(session.model)
    console.warn(`Loading ${sessionType} model session into ${currentType} model - may cause confusion`)
  }

  console.log('Loading session:', session.id, 'with model:', session.model, 'persona:', session.persona_id)

  // Check if there's an active session already
  if (isSessionActive.value && currentSessionId.value && chatMessages.value.length > 0) {
    // Ask user if they want to inject the recap into the current session
    const confirmed = window.confirm(
      `You're about to inject a recap from another session into your current chat.\n\n` +
        `Recap preview: "${session.recap.substring(0, 100)}${session.recap.length > 100 ? '...' : ''}"\n\n` +
        `Would you like to continue?`
    )

    if (confirmed) {
      // Inject the recap as a message in the current session
      const cleanedRecap = cleanRecapContent(session.recap)
      chatMessages.value.push({
        from: 'kalito',
        text: `💾 **Injected Session Recap**\n\n${cleanedRecap}`,
        isRecap: true,
      })

      // Trigger AI response about the injection
      try {
        loading.value = true
        const contextPrompt = `The user just injected a session recap into our current conversation. The recap contains: "${cleanedRecap}". Please acknowledge this injection and provide a brief introduction about how you can help continue both conversations seamlessly. Be concise and welcoming.`

        const assistantMessageIndex = chatMessages.value.length
        chatMessages.value.push({ from: 'kalito', text: '' })

        let accumulatedText = ''
        let finalTokenUsage = 0

        for await (const chunk of sendMessageToAgentStream(
          contextPrompt,
          '',
          sessionSettings.value.model,
          sessionSettings.value,
          sessionSettings.value.fileIds || [],
          currentSessionId.value || undefined
        )) {
          if (chunk.error) {
            chatMessages.value[assistantMessageIndex].text = chunk.error
            break
          }
          if (chunk.delta) {
            accumulatedText += chunk.delta
            chatMessages.value[assistantMessageIndex].text = accumulatedText
          }
          if (chunk.tokenUsage !== undefined) {
            finalTokenUsage = chunk.tokenUsage
          }
          if (chunk.done) {
            if (finalTokenUsage > 0) {
              tokenUsage.value += finalTokenUsage
            }
            break
          }
        }
      } catch (err: any) {
        chatMessages.value.push({
          from: 'kalito',
          text: `✅ Session recap injected successfully. You can continue the conversation. (AI response unavailable: ${err?.message})`,
        })
      } finally {
        loading.value = false
      }
    }
    return
  }

  // No active session, so start a new one with the recap
  // Reset current state
  chatMessages.value = []
  tokenUsage.value = 0
  loading.value = false

  // Load the selected session
  currentSessionId.value = session.id
  isSessionActive.value = true

  // Use CURRENT user-selected model and persona (improved UX)
  const sessionModel = sessionSettings.value.model || 'gpt-4.1-nano'
  const sessionPersona = sessionSettings.value.persona || 'default'
  
  // Add recap as initial message with special formatting
  const cleanedRecap = cleanRecapContent(session.recap)
  chatMessages.value.push({
    from: 'kalito',
    text: `📝 **Session Content Loaded**\n\nUsing: ${sessionModel} | ${sessionPersona}\n\n${cleanedRecap}`,
    isRecap: true,
  })

  // Trigger AI response about session restoration with better error handling
  try {
    loading.value = true
    const contextPrompt = `The user just loaded session content into a new conversation using ${sessionModel}. Here's the previous conversation context: "${cleanedRecap}". Please provide a warm welcome message, briefly acknowledge the previous context, and let them know you're ready to continue the conversation with their chosen model and settings. Be concise and friendly.`

    const assistantMessageIndex = chatMessages.value.length
    chatMessages.value.push({ from: 'kalito', text: '' })

    let accumulatedText = ''
    let finalTokenUsage = 0
    let hasReceivedResponse = false

    console.log('Sending session resume request with model:', sessionModel)

    for await (const chunk of sendMessageToAgentStream(
      contextPrompt,
      '',
      sessionModel,
      { ...sessionSettings.value, model: sessionModel },
      sessionSettings.value.fileIds || [],
      currentSessionId.value || undefined
    )) {
      hasReceivedResponse = true
      if (chunk.error) {
        console.error('Session resume error:', chunk.error)
        chatMessages.value[assistantMessageIndex].text = `❌ ${chunk.error}`
        break
      }
      if (chunk.delta) {
        accumulatedText += chunk.delta
        chatMessages.value[assistantMessageIndex].text = accumulatedText
      }
      if (chunk.tokenUsage !== undefined) {
        finalTokenUsage = chunk.tokenUsage
      }
      if (chunk.done) {
        if (finalTokenUsage > 0) {
          tokenUsage.value += finalTokenUsage
        }
        break
      }
    }

    // If no response was received at all, provide a fallback message
    if (!hasReceivedResponse || !accumulatedText.trim()) {
      chatMessages.value[assistantMessageIndex].text = `✅ Session content loaded successfully with ${sessionModel}. You can continue the conversation with your selected model and settings.`
    }
  } catch (err: any) {
    console.error('Session resumption error:', err)
    const assistantMessageIndex = chatMessages.value.length - 1
    chatMessages.value[assistantMessageIndex].text = `✅ Session content loaded successfully with ${sessionModel}. You can continue the conversation with your selected model and settings. (AI response unavailable: ${err?.message || 'Unknown error'})`
  } finally {
    loading.value = false
  }

  console.log(
    'Session content loaded:',
    session.id,
    'using current model:',
    sessionModel,
    'persona:',
    sessionPersona
  )
}

// Enhanced save session - creates recap first, then saves
// handleSaveSession removed - sessions are auto-saved in the new model

// Update session settings
function updateSessionSettings(newSettings: SessionSettings) {
  console.log('ChatWorkspace: Updating session settings:', newSettings)
  sessionSettings.value = { ...newSettings }
  console.log('ChatWorkspace: Session settings updated to:', sessionSettings.value)
}
</script>

<style scoped>
.workspace-shell {
  position: absolute;
  inset: 0;
  background: var(--color-bg, #0c111b);
  display: flex;
  flex-direction: column;
  color: var(--color-text-main, #e9f5ff);
  overflow: hidden;
}

.shell-body {
  flex: 1 1 auto;
  position: relative;
  overflow: hidden;
  height: 100vh;
  width: 100%;
}

.sidebar-layout {
  width: 100%;
  height: 100%;
  background: transparent;
}

/* Mobile Layout Wrapper */
.mobile-layout {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

/* Component-specific modal adjustments */
.delete-btn {
  padding: 0.5rem;
  min-width: 2.5rem;
}

/* Recap modal content styling */
.recap-content {
  background: var(--bg-main);
  padding: 1rem;
  border-radius: 0.5rem;
  margin: 1rem 0;
  white-space: pre-wrap;
  max-height: 400px;
  overflow-y: auto;
}
</style>
