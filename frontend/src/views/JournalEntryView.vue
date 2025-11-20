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
      <!-- Entry Title -->
      <div class="form-section title-section">
        <input 
          v-model="entry.title" 
          placeholder="Entry title (optional)"
          class="title-input"
        />
      </div>

      <!-- Mental Health Tracking Card -->
      <div class="form-section mental-health-card">
        <h3 class="section-title">How are you today?</h3>
        
        <div class="tracking-grid">
          <!-- Emotion Selector -->
          <div class="tracking-item emotion-item">
            <label for="emotion-select" class="item-label">Feeling</label>
            <select 
              id="emotion-select"
              v-model="entry.mood" 
              class="emotion-dropdown"
            >
              <option :value="undefined">Select emotion</option>
              <option 
                v-for="mood in availableMoods" 
                :key="mood.id" 
                :value="mood.id"
              >
                {{ mood.icon }} {{ mood.label }}
              </option>
            </select>
          </div>

          <!-- Mood Scale -->
          <div class="tracking-item mood-item">
            <label for="mood-scale" class="item-label">
              Mood Scale
              <span v-if="entry.mood_scale" class="mood-value">{{ entry.mood_scale }}/10</span>
            </label>
            <div class="mood-scale-container">
              <span class="scale-label">1</span>
              <input 
                id="mood-scale"
                type="range"
                min="1"
                max="10"
                v-model.number="entry.mood_scale"
                class="mood-slider"
              />
              <span class="scale-label">10</span>
            </div>
            <div class="mood-scale-labels">
              <span class="mood-label-low">Low</span>
              <span class="mood-label-high">Great</span>
            </div>
          </div>

          <!-- Sleep Hours -->
          <div class="tracking-item sleep-item">
            <label for="sleep-hours" class="item-label">Sleep Hours</label>
            <div class="sleep-input-container">
              <input 
                id="sleep-hours"
                type="number"
                min="0"
                max="24"
                step="0.5"
                v-model.number="entry.sleep_hours"
                placeholder="8"
                class="sleep-input"
              />
              <span class="sleep-unit">hrs</span>
            </div>
          </div>
        </div>
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
import { apiUrl } from '../config/api'
import type { MoodType, JournalEntry, CreateJournalEntryRequest } from '../types/journal'

const router = useRouter()
const route = useRoute()
const { getPatientId } = usePatient()

// State
const entry = ref<{
  title: string
  content: string
  mood: MoodType | undefined
  mood_scale: number | undefined
  sleep_hours: number | undefined
  entry_date: string
  entry_time: string
}>({
  title: '',
  content: '',
  mood: undefined,
  mood_scale: undefined,
  sleep_hours: undefined,
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
    mood_scale: entry.value.mood_scale,
    sleep_hours: entry.value.sleep_hours,
    journal_type: 'free'
  }

  const response = await fetch(apiUrl('/api/journal'), {
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
    mood: entry.value.mood,
    mood_scale: entry.value.mood_scale,
    sleep_hours: entry.value.sleep_hours
  }

  const response = await fetch(apiUrl(`/api/journal/${entryId.value}`), {
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
    const response = await fetch(apiUrl(`/api/journal/${id}`))
    
    if (!response.ok) {
      throw new Error('Failed to load entry')
    }
    
    const data = await response.json() as JournalEntry
    
    entry.value = {
      title: data.title || '',
      content: data.content,
      mood: data.mood,
      mood_scale: data.mood_scale,
      sleep_hours: data.sleep_hours,
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
    const response = await fetch(apiUrl(`/api/journal/${entryId.value}`), {
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
  height: 100vh;
  background: linear-gradient(135deg, 
    rgba(15, 23, 42, 0.95) 0%, 
    rgba(30, 41, 59, 0.95) 100%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Header */
.entry-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: rgba(30, 41, 59, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
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
  color: rgba(255, 255, 255, 0.7);
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
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
}

.delete-btn {
  background: transparent;
  color: #ef4444;
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
  background: rgba(239, 68, 68, 0.2);
}

.entry-title {
  margin: 0;
  font-size: 1.25rem;
  color: rgba(255, 255, 255, 0.95);
}

.save-btn {
  background: rgba(59, 130, 246, 0.8);
  color: white;
  min-width: 80px;
}

.save-btn:hover:not(:disabled) {
  background: rgba(59, 130, 246, 1);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
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
  gap: 1.5rem;
  overflow-y: auto;
  min-height: 0;
}

/* Custom scrollbar for entry form */
.entry-form::-webkit-scrollbar {
  width: 8px;
}

.entry-form::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.3);
  border-radius: 10px;
}

.entry-form::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, rgba(60, 60, 70, 0.7), rgba(80, 80, 90, 0.7));
  border-radius: 10px;
  border: 1px solid transparent;
  background-clip: padding-box;
  transition: all 0.3s ease;
}

.entry-form::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, rgba(90, 90, 100, 0.8), rgba(110, 110, 120, 0.8));
}

.form-section {
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.form-section:hover {
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
}

/* Title Section */
.title-section {
  padding: 1rem;
}

.title-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 0.5rem;
  background: rgba(15, 23, 42, 0.4);
  font-size: 1.125rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.95);
  transition: all 0.3s ease;
  outline: none;
}

.title-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.title-input:focus {
  background: rgba(15, 23, 42, 0.6);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
}

/* Mental Health Tracking Card */
.mental-health-card {
  padding: 1.5rem;
}

.section-title {
  margin: 0 0 1.5rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  text-align: center;
}

.tracking-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .tracking-grid {
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem 2rem;
  }
  
  .mood-item {
    grid-column: 1 / -1;
  }
}

.tracking-item {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.item-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Emotion Dropdown */
.emotion-dropdown {
  padding: 0.75rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 0.5rem;
  background: rgba(15, 23, 42, 0.4);
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.95);
  cursor: pointer;
  transition: all 0.3s ease;
  outline: none;
}

.emotion-dropdown:focus {
  border-color: rgba(59, 130, 246, 0.5);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.emotion-dropdown option {
  background: rgba(15, 23, 42, 0.95);
  color: rgba(255, 255, 255, 0.95);
  padding: 0.5rem;
}

/* Mood Scale */
.mood-value {
  color: rgba(59, 130, 246, 0.9);
  font-weight: 600;
  font-size: 0.85rem;
}

.mood-scale-container {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem 0;
}

.scale-label {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
  min-width: 1rem;
  text-align: center;
}

.mood-slider {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.1);
  outline: none;
  -webkit-appearance: none;
  transition: all 0.3s ease;
}

.mood-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(96, 165, 250, 0.9));
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.4);
  transition: all 0.3s ease;
}

.mood-slider::-webkit-slider-thumb:hover {
  background: linear-gradient(135deg, rgba(59, 130, 246, 1), rgba(96, 165, 250, 1));
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.6);
  transform: scale(1.1);
}

.mood-scale-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  padding: 0 0.5rem;
}

/* Sleep Input */
.sleep-input-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.sleep-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 0.5rem;
  background: rgba(15, 23, 42, 0.4);
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.95);
  transition: all 0.3s ease;
  outline: none;
  max-width: 100px;
}

.sleep-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.sleep-input:focus {
  border-color: rgba(59, 130, 246, 0.5);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.sleep-unit {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
}

.content-area {
  flex: 1;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  background: rgba(30, 41, 59, 0.6);
  backdrop-filter: blur(10px);
  font-size: 1rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.95);
  resize: none;
  font-family: inherit;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  min-height: 300px;
  transition: all 0.3s ease;
}

.content-area::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.content-area:focus {
  outline: none;
  border-color: rgba(59, 130, 246, 0.5);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

/* Custom scrollbar for content area */
.content-area::-webkit-scrollbar {
  width: 10px;
}

.content-area::-webkit-scrollbar-track {
  background: rgba(30, 30, 35, 0.4);
  border-radius: 10px;
}

.content-area::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, rgba(60, 60, 70, 0.9), rgba(80, 80, 90, 0.9));
  border-radius: 10px;
  border: 2px solid transparent;
  background-clip: padding-box;
  transition: all 0.3s ease;
}

.content-area::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, rgba(90, 90, 100, 0.95), rgba(110, 110, 120, 0.95));
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.3);
}

/* Metadata */
.entry-metadata {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 0.75rem;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
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
  background: rgba(30, 41, 59, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  color: rgba(255, 255, 255, 0.9);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  z-index: 1001;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
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
