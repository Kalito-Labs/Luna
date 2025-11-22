<template>
  <div class="chat-panel">
    <!-- Chat Output Area -->
    <div class="chat-output-bar" ref="outputBarRef">
      <div
        v-for="(msg, i) in chatMessages"
        :key="i"
        class="chat-message"
        :class="[msg?.from, msg?.isRecap ? 'recap-message' : '']"
      >
        <!-- Kalito (agent) messages -->
        <template v-if="msg && msg.from === 'kalito'">
          <div class="agent-message">
            <div class="sender-label">Kalito<span v-if="msg.isRecap"> (Recap)</span>:</div>

            <!-- Searching indicator (shown BEFORE content when searching) -->
            <div
              v-if="searching && i === chatMessages.length - 1 && msg.from === 'kalito'"
              class="searching-placeholder"
            >
              <span class="search-icon">🔍</span>
              <span class="search-text">Searching online...</span>
              <span class="search-dots">
                <span class="dot">●</span>
                <span class="dot">●</span>
                <span class="dot">●</span>
              </span>
            </div>

            <!-- Formatted content (with syntax highlighting) -->
            <div
              v-if="
                msg.text &&
                (msg.text.includes('```') || msg.text.includes('**') || msg.text.includes('`'))
              "
              v-html="getProcessedMessage(msg.text)"
              class="formatted-content"
            ></div>

            <!-- Plain text content -->
            <div v-else-if="msg.text" class="plain-content">{{ msg.text }}</div>

            <!-- Loading placeholder -->
            <div
              v-else-if="loading && i === chatMessages.length - 1 && msg.from === 'kalito'"
              class="loading-placeholder"
            ></div>

            <!-- Fallback -->
            <div v-else class="fallback-content">[No text]</div>

            <!-- Streaming indicator -->
            <span
              v-if="loading && i === chatMessages.length - 1 && msg.from === 'kalito' && !searching"
              class="streaming-indicator"
              >●</span
            >

            <div class="message-actions">
              <button class="message-pin-btn" @click="pinMessage(msg.text || '', msg.id)" :title="'Pin this message'">
                <span class="pin-icon">📌</span>
              </button>
              <button class="message-copy-btn" @click="copyMessage(msg.text || '')">Copy</button>
            </div>
          </div>
        </template>
        <!-- User messages -->
        <template v-else-if="msg && msg.from === 'user'">
          <div class="user-message">
            <div class="sender-label">User:</div>
            {{ msg.text || '[No text]' }}
          </div>
        </template>
        <!-- Fallback for malformed messages -->
        <template v-else>
          <div class="user-message">
            <div class="sender-label">Unknown:</div>
            [Bad message]
          </div>
        </template>
      </div>
    </div>
    <form class="chat-input-bar" @submit.prevent="handleSend">
      <div class="input-container">
        <textarea
          v-model="input"
          ref="inputRef"
          class="chat-input"
          placeholder="Type your message or paste context here…"
          rows="1"
          :disabled="!isSessionActive || loading"
          @keydown.enter="handleEnter"
          @keydown.shift.enter.stop
          autocomplete="off"
          autocorrect="off"
          spellcheck="false"
        ></textarea>
        <div class="input-actions">
          <button
            type="submit"
            class="primary-button send-btn"
            :disabled="!isSessionActive || input.trim().length === 0 || loading"
            :title="loading ? 'Please wait…' : isSessionActive ? 'Send' : 'Start session to enable'"
          >
            <span v-if="!loading">Send</span>
            <span v-else>…</span>
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { parseMessage } from '../../utils/syntaxHighlighter'

const props = defineProps<{
  chatMessages: { from: 'user' | 'kalito'; text?: string; isRecap?: boolean; id?: string }[]
  isSessionActive: boolean
  loading?: boolean
  searching?: boolean
  sessionSettings?: any
  tokenUsage?: number
  sessions?: any[]
  currentSessionId?: string | null
  showSessionMenu?: boolean
}>()

const emit = defineEmits<{
  (e: 'send-message', text: string): void
  (e: 'save-session'): void
  (e: 'update:session-settings', settings: any): void
  (e: 'start-session', settings: any): void
  (e: 'reset-session'): void
  (e: 'load-session'): void
  (e: 'create-pin', content: string, messageId?: string): void
  (e: 'delete-session', sessionId: string): void
}>()

const input = ref('')
const outputBarRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLTextAreaElement | null>(null)

// Reactive message parsing
const processedMessages = ref<Map<string, string>>(new Map())

// Watch for message changes and parse them
watch(
  () => props.chatMessages,
  async (newMessages) => {
    for (const msg of newMessages) {
      if (msg.text && 
          (msg.text.includes('```') || msg.text.includes('**') || msg.text.includes('`')) &&
          !processedMessages.value.has(msg.text)) {
        try {
          const parsed = await parseMessage(msg.text)
          processedMessages.value.set(msg.text, parsed)
          // Force reactivity update
          processedMessages.value = new Map(processedMessages.value)
        } catch (error) {
          // Fallback to original text if parsing fails
          processedMessages.value.set(msg.text, msg.text)
        }
      }
    }
  },
  { deep: true, immediate: true }
)

// Enhanced auto-scroll system
let scrollTimeout: number | null = null
let userScrolledUp = false
let lastScrollTop = 0

// Check if user has manually scrolled up
const checkUserScroll = () => {
  if (!outputBarRef.value) return
  
  const element = outputBarRef.value
  const scrollTop = element.scrollTop
  const scrollHeight = element.scrollHeight
  const clientHeight = element.clientHeight
  
  // Consider user "scrolled up" if they're more than 100px from bottom
  const distanceFromBottom = scrollHeight - scrollTop - clientHeight
  userScrolledUp = distanceFromBottom > 100
  
  // Track scroll direction
  if (scrollTop < lastScrollTop && !props.loading) {
    userScrolledUp = true
  }
  lastScrollTop = scrollTop
}

// Smooth auto-scroll function with user respect
const autoScrollToBottom = (force = false) => {
  if (!outputBarRef.value) return
  
  // Don't auto-scroll if user has manually scrolled up, unless forced
  if (userScrolledUp && !force) return
  
  const element = outputBarRef.value
  const scrollHeight = element.scrollHeight
  const clientHeight = element.clientHeight
  
  // Only scroll if there's content to scroll to
  if (scrollHeight > clientHeight) {
    element.scrollTo({
      top: scrollHeight,
      behavior: 'smooth'
    })
  }
}

// Debounced scroll during streaming
const debouncedAutoScroll = () => {
  if (scrollTimeout) {
    clearTimeout(scrollTimeout)
  }
  
  scrollTimeout = window.setTimeout(() => {
    autoScrollToBottom()
  }, 100) // Small delay to batch rapid updates
}

// Add scroll listener to detect user interaction
const setupScrollListener = () => {
  if (outputBarRef.value) {
    outputBarRef.value.addEventListener('scroll', checkUserScroll, { passive: true })
  }
}

// Watch for loading state changes
watch(
  () => props.loading,
  (isLoading, wasLoading) => {
    if (isLoading && !wasLoading) {
      // Starting to load - reset user scroll state
      userScrolledUp = false
    } else if (!isLoading && wasLoading) {
      // Finished loading - do final smooth scroll
      nextTick(() => {
        autoScrollToBottom(true) // Force scroll when response is complete
      })
    }
  }
)

// Sync function to get parsed message
const getProcessedMessage = (text: string): string => {
  if (!text) return ''
  
  // Return cached version if available
  const cached = processedMessages.value.get(text)
  if (cached) return cached
  
  // For messages that don't need highlighting, return as-is
  if (!text.includes('```') && !text.includes('**') && !text.includes('`')) {
    return text
  }
  
  // Return original text while async parsing is in progress
  return text
}

// Watch for message changes with improved scrolling
watch(
  () => props.chatMessages,
  async () => {
    await nextTick()
    
    if (props.loading) {
      // During streaming, use debounced scroll
      debouncedAutoScroll()
    } else {
      // After message is complete, do smooth scroll
      autoScrollToBottom()
    }
  },
  { deep: true }
)

function copyMessage(text: string) {
  navigator.clipboard.writeText(text).catch(err => {
    console.error('Failed to copy message:', err)
  })
}

function pinMessage(content: string, messageId?: string) {
  if (!content.trim()) return
  if (!props.currentSessionId) {
    console.error('Cannot pin message: No active session')
    return
  }
  emit('create-pin', content, messageId)
}

function handleEnter(e: KeyboardEvent) {
  if (!props.isSessionActive) {
    e.preventDefault()
    return
  }
  if (!e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

function handleSend() {
  if (!props.isSessionActive) return
  const text = input.value.trim()
  if (text.length === 0 || props.loading) return
  emit('send-message', text)
  input.value = ''
  nextTick(() => {
    inputRef.value?.focus()
  })
}

// Watch for token usage changes (silent tracking)
watch(
  () => props.tokenUsage,
  (newTokenUsage, oldTokenUsage) => {
    console.log('ChatPanel: Token usage changed from', oldTokenUsage, 'to', newTokenUsage)
  }
)

// Watch for session settings changes
watch(
  () => props.sessionSettings,
  (newSettings, oldSettings) => {
    console.log('ChatPanel: Session settings changed:', { old: oldSettings, new: newSettings })
  },
  { deep: true }
)

// Setup scroll listener on mount
onMounted(() => {
  setupScrollListener()
})

// Cleanup on unmount
onUnmounted(() => {
  if (scrollTimeout) {
    clearTimeout(scrollTimeout)
  }
  if (outputBarRef.value) {
    outputBarRef.value.removeEventListener('scroll', checkUserScroll)
  }
})
</script>

<style scoped>
/* ChatPanel Layout */
.chat-panel {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  width: 100%;
  height: 100vh;
  position: relative;
  overflow: hidden;
  padding: 0.5rem;
  box-sizing: border-box;
}

/* Chat Output Area */
.chat-output-bar {
  width: 100%;
  flex: 1 1 auto;
  min-height: 300px;
  max-height: 97vh;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  margin-bottom: .5rem;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.92) 50%, rgba(67, 56, 202, 0.08) 100%);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 16px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #e8eaed;
}

.chat-output-bar::-webkit-scrollbar {
  width: 8px;
}

.chat-output-bar::-webkit-scrollbar-track {
  background: rgba(139, 92, 246, 0.05);
  border-radius: 4px;
}

.chat-output-bar::-webkit-scrollbar-thumb {
  background: rgba(139, 92, 246, 0.3);
  border-radius: 4px;
}

.chat-output-bar::-webkit-scrollbar-thumb:hover {
  background: rgba(139, 92, 246, 0.5);
}

/* Chat Input Bar */
.chat-input-bar {
  width: 100%;
  padding: 1rem;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 16px;
  position: relative;
  z-index: 100;
  box-shadow: 0 -4px 20px rgba(139, 92, 246, 0.1);
}

.input-container {
  display: flex;
  align-items: flex-end;
  gap: 1rem;
  width: 100%;
  position: relative;
}

.chat-input {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%);
  backdrop-filter: blur(20px) saturate(150%);
  color: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(139, 92, 246, 0.25);
  border-radius: 14px;
  padding: 1rem 1.25rem;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 0.95rem;
  line-height: 1.5;
  outline: none;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  resize: none;
  min-height: 3rem;
  max-height: 8rem;
  width: 100%;
  overflow-y: auto;
}

.chat-input:focus {
  border-color: rgba(139, 92, 246, 0.5);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.15), 0 8px 24px rgba(139, 92, 246, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.08);
  transform: translateY(-1px);
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%);
}

.chat-input::placeholder {
  color: rgba(196, 181, 253, 0.4);
}

.primary-button {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.8) 0%, rgba(124, 58, 237, 0.9) 100%);
  border: 1px solid rgba(139, 92, 246, 0.5);
  color: #ffffff;
  padding: 0.875rem 1.75rem;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;
  min-width: 80px;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.primary-button:hover {
  background: linear-gradient(135deg, rgba(139, 92, 246, 1) 0%, rgba(124, 58, 237, 1) 100%);
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.5);
  transform: translateY(-2px);
}

.primary-button:disabled {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  color: rgba(232, 234, 237, 0.5);
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
  opacity: 0.6;
}

/* Chat Messages */
.chat-message {
  margin-bottom: 1.5rem;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  word-break: break-word;
}

.chat-message.user {
  align-items: flex-start;
}

.chat-message.kalito {
  align-items: flex-end;
}

/* Agent Messages */
.agent-message {
  position: relative;
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(20px) saturate(150%);
  border-radius: 16px 16px 8px 16px;
  padding: 1.5rem 2rem 3.5rem 2rem;
  font-size: 0.95rem;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.95);
  line-height: 1.7;
  border: 1px solid rgba(139, 92, 246, 0.25);
  margin: 0.5rem 2.5%;
  width: 95%;
  max-width: 95%;
  min-width: 200px;
  box-sizing: border-box;
  word-wrap: break-word;
  overflow-wrap: break-word;
  white-space: pre-wrap;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.agent-message::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, rgba(139, 92, 246, 0.6) 0%, rgba(196, 181, 253, 0.4) 100%);
  border-radius: 16px 16px 0 0;
}

.agent-message:hover {
  border-color: rgba(139, 92, 246, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(139, 92, 246, 0.2);
}

.recap-message .agent-message {
  background: rgba(66, 165, 245, 0.08) !important;
  border-left: 3px solid rgba(66, 165, 245, 0.6);
  border-radius: 0.5rem 1.25rem 1.25rem 0.5rem;
  font-style: italic;
  color: #c8d3ea;
}

/* User Messages */
.user-message {
  font-weight: 500;
  color: rgba(255, 255, 255, 0.95);
  font-size: 0.95rem;
  background: rgba(129, 140, 248, 0.15);
  backdrop-filter: blur(16px) saturate(150%);
  border: 1px solid rgba(129, 140, 248, 0.3);
  border-radius: 8px 16px 16px 16px;
  padding: 1.5rem 2rem;
  margin: 0.5rem 0;
  max-width: 75%;
  width: fit-content;
  min-width: 150px;
  box-sizing: border-box;
  word-wrap: break-word;
  overflow-wrap: break-word;
  white-space: pre-wrap;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  box-shadow: 0 4px 20px rgba(129, 140, 248, 0.2);
  align-self: flex-start;
  line-height: 1.6;
}

/* Sender Labels */
.sender-label {
  font-size: 0.75rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.9;
}

.user-message .sender-label {
  color: rgba(129, 140, 248, 1);
}

.agent-message .sender-label {
  color: rgba(196, 181, 253, 1);
}

/* Streaming Indicator */
.streaming-indicator {
  color: #42a5f5;
  font-size: 1.2rem;
  margin-left: 0.5rem;
  animation: pulse 1.8s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}

/* Message Actions Container */
.message-actions {
  position: absolute;
  bottom: 0.75rem;
  right: 0.75rem;
  display: flex;
  gap: 0.5rem;
  z-index: 2;
}

/* Message Copy Button */
.message-copy-btn {
  background: rgba(139, 92, 246, 0.15);
  border: 1px solid rgba(139, 92, 246, 0.3);
  color: rgba(196, 181, 253, 1);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(8px);
}

.message-copy-btn:hover {
  background: rgba(139, 92, 246, 0.3);
  border-color: rgba(139, 92, 246, 0.6);
  color: rgba(255, 255, 255, 1);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
}

/* Message Pin Button */
.message-pin-btn {
  background: rgba(129, 140, 248, 0.15);
  border: 1px solid rgba(129, 140, 248, 0.3);
  color: rgba(129, 140, 248, 1);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.message-pin-btn:hover {
  background: rgba(129, 140, 248, 0.3);
  border-color: rgba(129, 140, 248, 0.6);
  color: rgba(255, 255, 255, 1);
  transform: translateY(-2px);
}

.pin-icon {
  font-size: 0.9rem;
  margin-right: 0.15rem;
}

/* Formatted Content */
.formatted-content {
  white-space: normal;
  word-wrap: break-word;
  overflow-wrap: break-word;
  font-size: 0.95rem;
  line-height: 1.75;
  max-width: 100%;
  box-sizing: border-box;
}

.formatted-content * {
  max-width: 100%;
  box-sizing: border-box;
}

.plain-content {
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-wrap: break-word;
  font-size: 0.95rem;
  line-height: 1.75;
}

.loading-placeholder {
  min-height: 1rem;
}

/* Searching indicator */
.searching-placeholder {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: rgba(66, 165, 245, 0.9);
  font-weight: 500;
  padding: 0.5rem 0;
  animation: searchPulse 2s ease-in-out infinite;
}

.search-icon {
  font-size: 1.2rem;
  animation: searchRotate 2s linear infinite;
}

@keyframes searchRotate {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-10deg); }
  75% { transform: rotate(10deg); }
}

.search-text {
  font-size: 0.95rem;
  letter-spacing: 0.02em;
}

.search-dots {
  display: flex;
  gap: 0.4rem;
}

.search-dots .dot {
  font-size: 0.6rem;
  animation: searchDotBounce 1.4s infinite;
  opacity: 0.7;
}

.search-dots .dot:nth-child(1) {
  animation-delay: 0s;
}

.search-dots .dot:nth-child(2) {
  animation-delay: 0.2s;
}

.search-dots .dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes searchDotBounce {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.7;
  }
  30% {
    transform: translateY(-8px);
    opacity: 1;
  }
}

@keyframes searchPulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.fallback-content {
  color: rgba(255, 255, 255, 0.5);
  font-style: italic;
}

/* Code Blocks - Let Shiki handle all syntax highlighting */
.simple-code-block {
  background: rgba(8, 12, 20, 0.98);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 1rem;
  margin: 1.5rem 0;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.simple-code-header {
  background: rgba(139, 92, 246, 0.1);
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(139, 92, 246, 0.2);
}

.simple-language {
  background: rgba(0, 0, 0, 0.6);
  color: rgba(139, 92, 246, 0.7);
  font-size: 0.7rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  padding: 0.25rem 0.6rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(139, 92, 246, 0.2);
  display: inline-block;
  opacity: 0.8;
  transition: opacity 0.2s ease;
}

.simple-code-content {
  padding: 1.5rem;
  font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', 'Consolas', monospace;
  font-size: 0.9rem;
  line-height: 1.5;
  overflow-x: auto;
  white-space: pre;
  /* Let Shiki's inline styles handle all colors - no overrides */
}

/* Ensure Shiki styles are preserved */
.simple-code-content pre {
  margin: 0;
  padding: 0;
  background: transparent !important;
  border: none;
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  white-space: pre;
  overflow-x: auto;
}

.simple-code-content code {
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  background: transparent;
}

/* Allow all Shiki inline styles to work */
.simple-code-content span[style] {
  /* Preserve Shiki's inline color styles */
  color: inherit;
}

.simple-code-content::-webkit-scrollbar {
  height: 8px;
  width: 8px;
}

.simple-code-content::-webkit-scrollbar-track {
  background: rgba(139, 92, 246, 0.05);
  border-radius: 4px;
}

.simple-code-content::-webkit-scrollbar-thumb {
  background: rgba(139, 92, 246, 0.3);
  border-radius: 4px;
}

.simple-code-content::-webkit-scrollbar-thumb:hover {
  background: rgba(139, 92, 246, 0.5);
}

/* Inline Code */
.simple-inline-code {
  background: rgba(139, 92, 246, 0.15);
  color: rgba(139, 92, 246, 0.9);
  padding: 0.25rem 0.6rem;
  border-radius: 0.5rem;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.88em;
  font-weight: 500;
  border: 1px solid rgba(139, 92, 246, 0.2);
  transition: all 0.2s ease;
}

.simple-inline-code:hover {
  background: rgba(139, 92, 246, 0.25);
  border-color: rgba(139, 92, 246, 0.4);
}

/* Bold Text */
.bold-text {
  font-weight: 600;
  color: #f0f2f5;
}

/* List Styling */
.list-container {
  margin: 1.5rem 0;
  counter-reset: list-counter;
}

.list-item {
  margin: 0.75rem 0;
  padding-left: 1.5rem;
  position: relative;
  line-height: 1.7;
}

.list-item::before {
  content: '•';
  color: #64b5f6;
  position: absolute;
  left: 0;
  font-weight: bold;
  font-size: 1.1em;
}

.list-item.numbered {
  counter-increment: list-counter;
}

.list-item.numbered::before {
  content: counter(list-counter) '.';
  color: #64b5f6;
}

.message-paragraph {
  margin-bottom: 1.5rem;
  line-height: 1.75;
}

.message-paragraph:last-child {
  margin-bottom: 0;
}

/* Let Shiki handle all syntax highlighting - no overrides */
</style>

<style>
/* Global styles for Shiki syntax highlighting - not scoped to avoid conflicts */
.simple-code-content pre {
  margin: 0;
  padding: 0;
  background: transparent !important;
  border: none;
  font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', 'Consolas', monospace;
  font-size: 0.9rem;
  line-height: 1.5;
  white-space: pre;
  overflow-x: auto;
}

.simple-code-content code {
  font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', 'Consolas', monospace;
  font-size: 0.9rem;
  line-height: 1.5;
  background: transparent;
}

/* Shiki Fallback */
.shiki-fallback {
  background: rgba(15, 20, 28, 0.95);
  color: #e8eaed;
  padding: 1rem;
  border-radius: 0.5rem;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.9rem;
  overflow-x: auto;
}
</style>
