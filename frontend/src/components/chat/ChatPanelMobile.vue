<template>
  <div class="chat-panel-mobile">
    <!-- Mobile Header -->
    <div class="mobile-header">
      <button class="header-btn home-btn" @click="goToHome" title="Go Home">
        🏠
      </button>
      <h1 class="header-title">Kalito AI</h1>
      <button class="header-btn settings-btn" @click="$emit('open-settings')" title="Settings">
        ⚙️
      </button>
    </div>

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
              <button class="message-action-btn" @click="toggleMessageMenu(i)" title="Actions">
                ⋮
              </button>
              <div v-if="activeMessageMenu === i" class="message-menu">
                <button @click="pinMessage(msg.text || '', msg.id); closeMessageMenu()">
                  <span class="menu-icon">📌</span> Pin
                </button>
                <button @click="copyMessage(msg.text || ''); closeMessageMenu()">
                  <span class="menu-icon">📋</span> Copy
                </button>
              </div>
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

    <!-- Chat Input Bar -->
    <form class="chat-input-bar" @submit.prevent="handleSend">
      <div class="input-container">
        <textarea
          v-model="input"
          ref="inputRef"
          class="chat-input"
          placeholder="Type your message..."
          rows="1"
          :disabled="!isSessionActive || loading"
          @keydown.enter="handleEnter"
          @keydown.shift.enter.stop
          autocomplete="off"
          autocorrect="off"
          spellcheck="false"
        ></textarea>
        <button
          type="submit"
          class="send-btn"
          :disabled="!isSessionActive || input.trim().length === 0 || loading"
          :title="loading ? 'Please wait…' : isSessionActive ? 'Send' : 'Start session to enable'"
        >
          <span v-if="!loading" class="send-icon">➤</span>
          <span v-else class="loading-dots">…</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { parseMessage } from '../../utils/syntaxHighlighter'

const router = useRouter()

const props = defineProps<{
  chatMessages: { from: 'user' | 'kalito'; text?: string; isRecap?: boolean; id?: string }[]
  isSessionActive: boolean
  loading?: boolean
  searching?: boolean
  currentSessionId?: string | null
}>()

const emit = defineEmits<{
  (e: 'send-message', text: string): void
  (e: 'open-settings'): void
  (e: 'create-pin', content: string, messageId?: string): void
}>()

const input = ref('')
const outputBarRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLTextAreaElement | null>(null)
const activeMessageMenu = ref<number | null>(null)

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
          processedMessages.value = new Map(processedMessages.value)
        } catch (error) {
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
  
  const distanceFromBottom = scrollHeight - scrollTop - clientHeight
  userScrolledUp = distanceFromBottom > 100
  
  if (scrollTop < lastScrollTop && !props.loading) {
    userScrolledUp = true
  }
  lastScrollTop = scrollTop
}

// Smooth auto-scroll function
const autoScrollToBottom = (force = false) => {
  if (!outputBarRef.value) return
  
  if (userScrolledUp && !force) return
  
  const element = outputBarRef.value
  const scrollHeight = element.scrollHeight
  const clientHeight = element.clientHeight
  
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
  }, 100)
}

// Setup scroll listener
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
      userScrolledUp = false
    } else if (!isLoading && wasLoading) {
      nextTick(() => {
        autoScrollToBottom(true)
      })
    }
  }
)

// Sync function to get parsed message
const getProcessedMessage = (text: string): string => {
  if (!text) return ''
  
  const cached = processedMessages.value.get(text)
  if (cached) return cached
  
  if (!text.includes('```') && !text.includes('**') && !text.includes('`')) {
    return text
  }
  
  return text
}

// Watch for message changes
watch(
  () => props.chatMessages,
  async () => {
    await nextTick()
    
    if (props.loading) {
      debouncedAutoScroll()
    } else {
      autoScrollToBottom()
    }
  },
  { deep: true }
)

// Navigation
function goToHome() {
  router.push('/')
}

// Message actions
function toggleMessageMenu(index: number) {
  activeMessageMenu.value = activeMessageMenu.value === index ? null : index
}

function closeMessageMenu() {
  activeMessageMenu.value = null
}

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

// Input handling
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

// Lifecycle
onMounted(() => {
  setupScrollListener()
})

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
/* Mobile Chat Panel Layout */
.chat-panel-mobile {
  display: flex;
  flex-direction: column;
  height: 90vh;
  width: 100%;
  background: linear-gradient(135deg, #0c0e14 0%, #1a1d29 100%);
  overflow: hidden;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Mobile Header */
.mobile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  background: rgba(14, 18, 26, 0.95);
  backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 1px solid rgba(139, 92, 246, 0.2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 100;
}

.header-btn {
  width: 48px;
  height: 48px;
  min-width: 48px;
  min-height: 48px;
  background: rgba(139, 92, 246, 0.12);
  border: 1px solid rgba(139, 92, 246, 0.25);
  border-radius: 0.75rem;
  color: rgba(139, 92, 246, 0.9);
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-btn:active {
  background: rgba(139, 92, 246, 0.2);
  transform: scale(0.95);
}

.home-btn {
  background: rgba(66, 165, 245, 0.12);
  border-color: rgba(66, 165, 245, 0.25);
  color: rgba(66, 165, 245, 0.9);
}

.header-title {
  color: #e8eaed;
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  letter-spacing: 0.02em;
}

/* Chat Output Area */
.chat-output-bar {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.chat-output-bar::-webkit-scrollbar {
  width: 4px;
}

.chat-output-bar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 2px;
}

.chat-output-bar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
}

.chat-output-bar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.25);
}

/* Chat Messages */
.chat-message {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  word-break: break-word;
}

/* Agent Messages */
.agent-message {
  position: relative;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(139, 92, 246, 0.04) 100%);
  backdrop-filter: blur(20px) saturate(150%);
  border-radius: 1rem 1rem 0.5rem 1rem;
  padding: 1.25rem 1.5rem 3.5rem 1.5rem;
  font-size: 0.95rem;
  color: #f0f2f5;
  line-height: 1.7;
  border: 1px solid rgba(139, 92, 246, 0.2);
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  word-wrap: break-word;
  overflow-wrap: break-word;
  white-space: pre-wrap;
}

.recap-message .agent-message {
  background: rgba(66, 165, 245, 0.08) !important;
  border-left: 3px solid rgba(66, 165, 245, 0.6);
  border-radius: 0.5rem 1rem 1rem 0.5rem;
  font-style: italic;
  color: #c8d3ea;
}

/* User Messages */
.user-message {
  font-weight: 500;
  color: #f8f9fa;
  font-size: 0.95rem;
  background: rgba(66, 165, 245, 0.12);
  backdrop-filter: blur(16px) saturate(150%);
  border: 1px solid rgba(66, 165, 245, 0.25);
  border-radius: 0.5rem 1rem 1rem 1rem;
  padding: 1.25rem 1.5rem;
  max-width: 85%;
  width: fit-content;
  box-sizing: border-box;
  word-wrap: break-word;
  overflow-wrap: break-word;
  white-space: pre-wrap;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  box-shadow: 0 4px 16px rgba(66, 165, 245, 0.15);
  align-self: flex-start;
  line-height: 1.6;
}

/* Sender Labels */
.sender-label {
  font-size: 0.75rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.85;
}

.user-message .sender-label {
  color: rgba(66, 165, 245, 1);
}

.agent-message .sender-label {
  color: rgba(139, 92, 246, 0.8);
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
    opacity: 0.8;
  }
}

/* Message Actions */
.message-actions {
  position: absolute;
  bottom: 0.75rem;
  right: 0.75rem;
  z-index: 2;
}

.message-action-btn {
  width: 44px;
  height: 44px;
  min-width: 44px;
  min-height: 44px;
  background: rgba(139, 92, 246, 0.15);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 50%;
  color: rgba(139, 92, 246, 0.8);
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.message-action-btn:active {
  background: rgba(139, 92, 246, 0.25);
  transform: scale(0.95);
}

.message-menu {
  position: absolute;
  bottom: 100%;
  right: 0;
  margin-bottom: 0.5rem;
  background: rgba(14, 18, 26, 0.98);
  backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 0.75rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  overflow: hidden;
  min-width: 150px;
}

.message-menu button {
  width: 100%;
  padding: 1rem 1.25rem;
  background: transparent;
  border: none;
  color: #e8eaed;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border-bottom: 1px solid rgba(139, 92, 246, 0.1);
}

.message-menu button:last-child {
  border-bottom: none;
}

.message-menu button:active {
  background: rgba(139, 92, 246, 0.15);
}

.menu-icon {
  font-size: 1.1rem;
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

.fallback-content {
  color: rgba(255, 255, 255, 0.5);
  font-style: italic;
}

/* Chat Input Bar */
.chat-input-bar {
  padding: 1rem;
  background: rgba(14, 18, 26, 0.95);
  backdrop-filter: blur(20px) saturate(180%);
  border-top: 1px solid rgba(139, 92, 246, 0.2);
  position: relative;
  z-index: 100;
}

.input-container {
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
  width: 100%;
}

.chat-input {
  flex: 1;
  background: rgba(16, 24, 34, 0.651);
  backdrop-filter: blur(12px);
  color: #f6f8fa;
  border: 1px solid rgba(51, 51, 51, 0.15);
  border-radius: 0.75rem;
  padding: 1rem;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 1rem;
  line-height: 1.5;
  outline: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  resize: none;
  min-height: 52px;
  max-height: 150px;
  overflow-y: auto;
}

.chat-input:focus {
  border-color: rgba(66, 165, 245, 0.5);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15), 0 0 0 3px rgba(66, 165, 245, 0.15);
  background: rgba(16, 24, 34, 0.8);
}

.chat-input::placeholder {
  color: rgba(232, 234, 237, 0.5);
}

.send-btn {
  width: 52px;
  height: 52px;
  min-width: 52px;
  min-height: 52px;
  background: linear-gradient(135deg, rgba(30, 25, 85, 0.9) 0%, rgba(55, 48, 163, 0.9) 100%);
  border: 1px solid rgba(67, 56, 202, 0.4);
  border-radius: 50%;
  color: #ffffff;
  font-size: 1.25rem;
  cursor: pointer;
  transition: all 0.3s ease;
  outline: none;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(67, 56, 202, 0.25);
}

.send-btn:active {
  transform: scale(0.95);
  box-shadow: 0 2px 6px rgba(67, 56, 202, 0.3);
}

.send-btn:disabled {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  color: rgba(232, 234, 237, 0.5);
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

.send-icon {
  font-size: 1.25rem;
}

.loading-dots {
  font-size: 1.5rem;
}

/* Code Blocks */
.simple-code-block {
  background: rgba(8, 12, 20, 0.98);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 0.75rem;
  margin: 1rem 0;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.simple-code-header {
  background: rgba(139, 92, 246, 0.1);
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(139, 92, 246, 0.2);
}

.simple-language {
  background: rgba(0, 0, 0, 0.6);
  color: rgba(139, 92, 246, 0.7);
  font-size: 0.65rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(139, 92, 246, 0.2);
  display: inline-block;
}

.simple-code-content {
  padding: 1rem;
  font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', 'Consolas', monospace;
  font-size: 0.85rem;
  line-height: 1.5;
  overflow-x: auto;
  white-space: pre;
}

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

.simple-code-content::-webkit-scrollbar {
  height: 6px;
}

.simple-code-content::-webkit-scrollbar-track {
  background: rgba(139, 92, 246, 0.05);
  border-radius: 3px;
}

.simple-code-content::-webkit-scrollbar-thumb {
  background: rgba(139, 92, 246, 0.3);
  border-radius: 3px;
}

/* Inline Code */
.simple-inline-code {
  background: rgba(139, 92, 246, 0.15);
  color: rgba(139, 92, 246, 0.9);
  padding: 0.2rem 0.5rem;
  border-radius: 0.4rem;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.88em;
  font-weight: 500;
  border: 1px solid rgba(139, 92, 246, 0.2);
}

/* Bold Text */
.bold-text {
  font-weight: 600;
  color: #f0f2f5;
}

/* List Styling */
.list-container {
  margin: 1rem 0;
  counter-reset: list-counter;
}

.list-item {
  margin: 0.5rem 0;
  padding-left: 1.25rem;
  position: relative;
  line-height: 1.7;
}

.list-item::before {
  content: '•';
  color: #64b5f6;
  position: absolute;
  left: 0;
  font-weight: bold;
  font-size: 1em;
}

.list-item.numbered {
  counter-increment: list-counter;
}

.list-item.numbered::before {
  content: counter(list-counter) '.';
  color: #64b5f6;
}

.message-paragraph {
  margin-bottom: 1rem;
  line-height: 1.75;
}

.message-paragraph:last-child {
  margin-bottom: 0;
}
</style>

<style>
/* Global styles for Shiki syntax highlighting */
.simple-code-content pre {
  margin: 0;
  padding: 0;
  background: transparent !important;
  border: none;
  font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', 'Consolas', monospace;
  font-size: 0.85rem;
  line-height: 1.5;
  white-space: pre;
  overflow-x: auto;
}

.simple-code-content code {
  font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', 'Consolas', monospace;
  font-size: 0.85rem;
  line-height: 1.5;
  background: transparent;
}
</style>
