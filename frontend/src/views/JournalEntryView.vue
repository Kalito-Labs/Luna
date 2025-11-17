<template>
  <div class="journal-entry-view">
    <!-- Header -->
    <header class="entry-header">
      <button @click="cancel" class="close-btn" aria-label="Close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
      
      <h2 class="entry-title">{{ isEditing ? 'Edit Entry' : 'New Journal Entry' }}</h2>
      
      <div class="header-actions">
        <button v-if="isEditing" @click="deleteEntry" class="delete-btn" aria-label="Delete">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" />
          </svg>
        </button>
        <button @click="save" class="save-btn" :disabled="!canSave">
          Save
        </button>
      </div>
    </header>

    <!-- Entry Form -->
    <div class="entry-form">
      <!-- Optional Title -->
      <input 
        v-model="entry.title" 
        placeholder="Entry title (optional)"
        class="title-input"
      />

      <!-- Emotion Selector -->
      <div class="emotion-selector">
        <label for="emotion-select" class="emotion-label">How are you feeling?</label>
        <select 
          id="emotion-select"
          v-model="entry.mood" 
          class="emotion-dropdown"
        >
          <option :value="undefined">Select an emotion (optional)</option>
          <option 
            v-for="mood in availableMoods" 
            :key="mood.id" 
            :value="mood.id"
          >
            {{ mood.icon }} {{ mood.label }}
          </option>
        </select>
      </div>

      <!-- Main Content Area -->
      <textarea
        v-model="entry.content"
        :placeholder="placeholder"
        @input="handleInput"
        class="content-area"
        ref="contentArea"
      />

      <!-- Metadata Footer -->
      <div class="entry-metadata">
        <div class="metadata-left">
          <span class="word-count">{{ wordCount }} words</span>
          <span class="char-count">{{ charCount }} characters</span>
        </div>
        <div class="metadata-right">
          <span class="date-display">{{ formattedDate }}</span>
        </div>
      </div>
    </div>

    <!-- Auto-save Indicator -->
    <transition name="fade">
      <div v-if="autoSaveStatus" class="auto-save-indicator">
        {{ autoSaveStatus }}
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { usePatient } from '../composables/usePatient'
import type { MoodType, JournalEntry, CreateJournalEntryRequest } from '../types/journal'

const router = useRouter()
const route = useRoute()
const { getPatientId } = usePatient()

// State
const entry = ref<{
  title: string
  content: string
  mood: MoodType | undefined
  entry_date: string
  entry_time: string
}>({
  title: '',
  content: '',
  mood: undefined,
  entry_date: new Date().toISOString().substring(0, 10),
  entry_time: new Date().toTimeString().substring(0, 5)
})

const autoSaveStatus = ref('')
const isEditing = ref(false)
const entryId = ref<string>()
const autoSaveTimer = ref<ReturnType<typeof setTimeout>>()
const contentArea = ref<HTMLTextAreaElement>()

const patientId = computed(() => getPatientId())

// Available moods
const availableMoods = [
  { id: 'happy', label: 'Happy', icon: '😊' },
  { id: 'excited', label: 'Excited', icon: '🎉' },
  { id: 'grateful', label: 'Grateful', icon: '🙏' },
  { id: 'relaxed', label: 'Relaxed', icon: '🌴' },
  { id: 'content', label: 'Content', icon: '😌' },
  { id: 'tired', label: 'Tired', icon: '😴' },
  { id: 'unsure', label: 'Unsure', icon: '🤔' },
  { id: 'bored', label: 'Bored', icon: '😑' },
  { id: 'anxious', label: 'Anxious', icon: '😰' },
  { id: 'angry', label: 'Angry', icon: '😠' },
  { id: 'stressed', label: 'Stressed', icon: '😫' },
  { id: 'sad', label: 'Sad', icon: '😢' },
  { id: 'desperate', label: 'Desperate', icon: '😭' }
] as const

// Computed
const wordCount = computed(() => {
  if (!entry.value.content.trim()) return 0
  return entry.value.content.trim().split(/\s+/).length
})

const charCount = computed(() => entry.value.content.length)

const canSave = computed(() => entry.value.content.trim().length > 0)

const placeholder = computed(() => {
  const prompts = [
    'Write down your thoughts...',
    'How are you feeling today?',
    'What\'s on your mind?',
    'Begin writing...',
    'Express yourself freely...'
  ]
  return prompts[Math.floor(Math.random() * prompts.length)]
})

const formattedDate = computed(() => {
  const date = new Date()
  return date.toLocaleDateString('en-US', { 
    weekday: 'long',
    year: 'numeric', 
    month: 'long', 
    day: 'numeric'
  })
})

// Methods
const handleInput = () => {
  // Clear existing timer
  if (autoSaveTimer.value) {
    clearTimeout(autoSaveTimer.value)
  }

  // Set new auto-save timer (30 seconds)
  autoSaveTimer.value = setTimeout(() => {
    if (canSave.value && isEditing.value) {
      autoSave()
    }
  }, 30000)
}

const autoSave = async () => {
  try {
    autoSaveStatus.value = 'Saving...'
    
    if (isEditing.value && entryId.value) {
      await updateEntry()
    }
    
    autoSaveStatus.value = 'Saved ✓'
    setTimeout(() => {
      autoSaveStatus.value = ''
    }, 2000)
  } catch (error) {
    console.error('Auto-save failed:', error)
    autoSaveStatus.value = 'Save failed'
    setTimeout(() => {
      autoSaveStatus.value = ''
    }, 3000)
  }
}

const save = async () => {
  if (!canSave.value) return

  try {
    if (isEditing.value && entryId.value) {
      await updateEntry()
    } else {
      await createEntry()
    }
    
    router.push('/journal')
  } catch (error) {
    console.error('Error saving entry:', error)
    alert('Failed to save entry. Please try again.')
  }
}

const createEntry = async () => {
  const payload: CreateJournalEntryRequest = {
    patient_id: patientId.value,
    title: entry.value.title || undefined,
    content: entry.value.content,
    entry_date: entry.value.entry_date,
    entry_time: entry.value.entry_time,
    mood: entry.value.mood,
    journal_type: 'free'
  }

  const response = await fetch('/api/journal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    throw new Error('Failed to create entry')
  }

  return await response.json()
}

const updateEntry = async () => {
  const payload = {
    title: entry.value.title || undefined,
    content: entry.value.content,
    mood: entry.value.mood
  }

  const response = await fetch(`/api/journal/${entryId.value}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    throw new Error('Failed to update entry')
  }

  return await response.json()
}

const loadEntry = async (id: string) => {
  try {
    const response = await fetch(`/api/journal/${id}`)
    
    if (!response.ok) {
      throw new Error('Failed to load entry')
    }
    
    const data = await response.json() as JournalEntry
    
    entry.value = {
      title: data.title || '',
      content: data.content,
      mood: data.mood,
      entry_date: data.entry_date,
      entry_time: data.entry_time || new Date().toTimeString().slice(0, 5)
    }
  } catch (error) {
    console.error('Error loading entry:', error)
    alert('Failed to load entry')
    router.push('/journal')
  }
}

const cancel = () => {
  if (entry.value.content.trim() && !confirm('Discard unsaved changes?')) {
    return
  }
  router.push('/journal')
}

const deleteEntry = async () => {
  if (!confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
    return
  }

  try {
    const response = await fetch(`/api/journal/${entryId.value}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      throw new Error('Failed to delete entry')
    }

    router.push('/journal')
  } catch (error) {
    console.error('Error deleting entry:', error)
    alert('Failed to delete entry. Please try again.')
  }
}

// Lifecycle
onMounted(() => {
  // Check if editing existing entry
  if (route.params.id) {
    isEditing.value = true
    entryId.value = route.params.id as string
    loadEntry(entryId.value)
  } else {
    // Focus on content area for new entries
    contentArea.value?.focus()
  }
})

onBeforeUnmount(() => {
  if (autoSaveTimer.value) {
    clearTimeout(autoSaveTimer.value)
  }
})

// Watch for route changes
watch(() => route.params.id, (newId) => {
  if (newId) {
    isEditing.value = true
    entryId.value = newId as string
    loadEntry(entryId.value)
  }
})
</script>

<style scoped>
.journal-entry-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #7dd3c0 0%, #7ba3e3 100%);
  display: flex;
  flex-direction: column;
}

/* Header */
.entry-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  gap: 1rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.close-btn,
.save-btn,
.delete-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.close-btn {
  background: transparent;
  color: #6c757d;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
}

.close-btn svg {
  width: 24px;
  height: 24px;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}

.delete-btn {
  background: transparent;
  color: #dc3545;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
}

.delete-btn svg {
  width: 20px;
  height: 20px;
}

.delete-btn:hover {
  background: rgba(220, 53, 69, 0.1);
}

.entry-title {
  margin: 0;
  font-size: 1.25rem;
  color: #2c3e50;
}

.save-btn {
  background: linear-gradient(135deg, #7dd3c0 0%, #7ba3e3 100%);
  color: white;
  min-width: 80px;
}

.save-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Entry Form */
.entry-form {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  gap: 1rem;
}

.title-input {
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.95);
  font-size: 1.125rem;
  font-weight: 500;
  color: #2c3e50;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.title-input::placeholder {
  color: #adb5bd;
}

/* Emotion Selector */
.emotion-selector {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.emotion-label {
  font-size: 0.9rem;
  color: #495057;
  font-weight: 500;
  padding-left: 0.25rem;
}

.emotion-dropdown {
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.95);
  font-size: 1rem;
  color: #2c3e50;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
}

.emotion-dropdown:focus {
  outline: none;
  box-shadow: 0 4px 12px rgba(123, 163, 227, 0.3);
}

.emotion-dropdown option {
  padding: 0.5rem;
}

.content-area {
  flex: 1;
  padding: 1.5rem;
  border: none;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.95);
  font-size: 1rem;
  line-height: 1.6;
  color: #2c3e50;
  resize: none;
  font-family: inherit;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-height: 300px;
}

.content-area::placeholder {
  color: #adb5bd;
}

.content-area:focus,
.title-input:focus {
  outline: none;
  box-shadow: 0 4px 12px rgba(123, 163, 227, 0.3);
}

/* Metadata */
.entry-metadata {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 0.75rem;
  font-size: 0.875rem;
  color: #6c757d;
}

.metadata-left,
.metadata-right {
  display: flex;
  gap: 1rem;
}

/* Auto-save Indicator */
.auto-save-indicator {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  padding: 0.75rem 1.25rem;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  z-index: 1001;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Responsive */
@media (max-width: 640px) {
  .entry-form {
    padding: 1rem;
  }

  .metadata-left,
  .metadata-right {
    flex-direction: column;
    gap: 0.25rem;
  }
}
</style>
