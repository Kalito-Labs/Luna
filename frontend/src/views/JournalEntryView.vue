<template>
  <div class="journal-entry-view">
    <!-- Header -->
    <header class="entry-header">
      <button @click="cancel" class="close-btn" aria-label="Close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
      
      <input 
        v-model="entry.title" 
        :placeholder="isEditing ? 'Edit entry title...' : 'New journal entry...'"
        class="entry-title-input"
      />
      
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

          <!-- Sleep Hours -->
          <div class="tracking-item sleep-item">
            <label for="sleep-hours" class="item-label">
              Sleep Hours
              <span v-if="entry.sleep_hours" class="sleep-value">{{ entry.sleep_hours }}hrs</span>
            </label>
            <div class="sleep-scale-container">
              <span class="scale-label">0</span>
              <input 
                id="sleep-hours"
                type="range"
                min="0"
                max="12"
                step="0.5"
                v-model.number="entry.sleep_hours"
                class="sleep-slider"
              />
              <span class="scale-label">12</span>
            </div>
            <div class="sleep-scale-labels">
              <span class="sleep-label-low">None</span>
              <span class="sleep-label-high">Full</span>
            </div>
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
  max-height: 100vh;
  background: linear-gradient(135deg, 
    rgba(15, 23, 42, 0.98) 0%, 
    rgba(30, 41, 59, 0.95) 50%,
    rgba(67, 56, 202, 0.08) 100%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

/* Header */
.entry-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: rgba(30, 41, 59, 0.85);
  backdrop-filter: blur(25px);
  border-bottom: 1px solid rgba(139, 92, 246, 0.15);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
  gap: 1rem;
  position: relative;
  flex-shrink: 0;
  min-height: 70px;
}

.entry-header::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, 
    transparent, 
    rgba(139, 92, 246, 0.6), 
    transparent);
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
  background: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.95);
  transform: scale(1.05);
}

.delete-btn {
  background: transparent;
  color: rgba(239, 68, 68, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: all 0.3s ease;
}

.delete-btn svg {
  width: 20px;
  height: 20px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  color: rgba(239, 68, 68, 1);
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.entry-title-input {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  letter-spacing: -0.01em;
  flex: 1;
  text-align: center;
  background: transparent;
  border: none;
  outline: none;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: all 0.3s ease;
}

.entry-title-input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.entry-title-input:focus {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 1);
}

.save-btn {
  background: linear-gradient(135deg, 
    rgba(139, 92, 246, 0.85) 0%, 
    rgba(124, 58, 237, 0.9) 100%);
  color: white;
  min-width: 88px;
  font-weight: 600;
  letter-spacing: 0.02em;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
}

.save-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, 
    rgba(139, 92, 246, 1) 0%, 
    rgba(124, 58, 237, 1) 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(139, 92, 246, 0.5);
  border-color: rgba(255, 255, 255, 0.3);
}

.save-btn:active:not(:disabled) {
  transform: translateY(-1px);
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* Entry Form */
.entry-form {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1rem 1rem 1rem;
  gap: 1rem;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
  scroll-behavior: smooth;
}

/* Custom scrollbar for entry form */
.entry-form::-webkit-scrollbar {
  width: 8px;
}

.entry-form::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}

.entry-form::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, 
    rgba(139, 92, 246, 0.6), 
    rgba(124, 58, 237, 0.7));
  border-radius: 10px;
  transition: all 0.3s ease;
}

.entry-form::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, 
    rgba(139, 92, 246, 0.8), 
    rgba(124, 58, 237, 0.9));
}

.form-section {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-radius: 1.25rem;
  backdrop-filter: blur(25px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: visible;
  min-height: auto;
}

.form-section:hover {
  border-color: rgba(139, 92, 246, 0.3);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
  background: rgba(255, 255, 255, 0.08);
  transform: translateY(-2px);
}

/* Mental Health Tracking Card */
.mental-health-card {
  padding: 1rem;
  position: relative;
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.08) 0%, 
    rgba(139, 92, 246, 0.05) 100%);
  min-height: auto;
  height: auto;
}

.mental-health-card::before {
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
}

.section-title {
  margin: 0 0 1.5rem 0;
  font-size: 1.2rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
  text-align: center;
  letter-spacing: -0.02em;
  position: relative;
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: -0.75rem;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 2px;
  background: linear-gradient(90deg, 
    rgba(139, 92, 246, 0.6), 
    rgba(196, 181, 253, 0.4));
  border-radius: 2px;
}

.tracking-grid {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  width: 100%;
}

@media (min-width: 640px) {
  .tracking-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    align-items: start;
  }
  
  .emotion-item {
    grid-column: 1;
  }
  
  .sleep-item {
    grid-column: 2;
  }
  
  .mood-item {
    grid-column: 1 / -1;
    margin-top: 0.75rem;
  }
}

.tracking-item {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.25rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-radius: 1rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.tracking-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, 
    transparent, 
    rgba(139, 92, 246, 0.05), 
    transparent);
  transition: left 0.6s ease;
}

.tracking-item:hover::before {
  left: 100%;
}

.tracking-item:hover {
  border-color: rgba(139, 92, 246, 0.3);
  background: rgba(255, 255, 255, 0.05);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.1);
}

.item-label {
  font-size: 1rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
  letter-spacing: 0.01em;
}

/* Emotion Dropdown */
.emotion-dropdown {
  padding: 1rem 1.25rem;
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 0.75rem;
  background: rgba(15, 23, 42, 0.6);
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.95);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;
  width: 100%;
  backdrop-filter: blur(10px);
}

.emotion-dropdown:focus {
  border-color: rgba(139, 92, 246, 0.6);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2), 
              0 8px 24px rgba(139, 92, 246, 0.15);
  transform: translateY(-2px);
  background: rgba(15, 23, 42, 0.8);
}

.emotion-dropdown option {
  background: rgba(15, 23, 42, 0.95);
  color: rgba(255, 255, 255, 0.95);
  padding: 0.5rem;
}

/* Mood Scale */
.mood-value {
  color: rgba(139, 92, 246, 0.95);
  font-weight: 700;
  font-size: 0.9rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.mood-scale-container {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 0.75rem 0;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 0.75rem;
  margin: 0.25rem 0;
}

.scale-label {
  font-size: 0.875rem;
  color: rgba(196, 181, 253, 0.8);
  font-weight: 600;
  min-width: 1.5rem;
  text-align: center;
  padding: 0.25rem;
  background: rgba(139, 92, 246, 0.1);
  border-radius: 0.5rem;
}

.mood-slider {
  flex: 1;
  height: 8px;
  border-radius: 6px;
  background: linear-gradient(90deg, 
    rgba(239, 68, 68, 0.3), 
    rgba(245, 158, 11, 0.3), 
    rgba(34, 197, 94, 0.3));
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  transition: all 0.3s ease;
  position: relative;
}

.mood-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, 
    rgba(139, 92, 246, 1) 0%, 
    rgba(196, 181, 253, 0.95) 100%);
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.5);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 3px solid rgba(255, 255, 255, 0.9);
  position: relative;
}

.mood-slider::-webkit-slider-thumb:hover {
  background: linear-gradient(135deg, 
    rgba(139, 92, 246, 1) 0%, 
    rgba(196, 181, 253, 1) 100%);
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.7);
  transform: scale(1.2);
  border-color: white;
}

.mood-scale-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  padding: 0 0.5rem;
}

/* Sleep Scale */
.sleep-value {
  color: rgba(139, 92, 246, 0.95);
  font-weight: 700;
  font-size: 0.9rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.sleep-scale-container {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 0.75rem 0;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 0.75rem;
  margin: 0.25rem 0;
}

.sleep-slider {
  flex: 1;
  height: 8px;
  border-radius: 6px;
  background: linear-gradient(90deg, 
    rgba(30, 41, 59, 0.4), 
    rgba(59, 130, 246, 0.3), 
    rgba(139, 92, 246, 0.3));
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  transition: all 0.3s ease;
  position: relative;
}

.sleep-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, 
    rgba(59, 130, 246, 1) 0%, 
    rgba(139, 92, 246, 0.95) 100%);
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.5);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 3px solid rgba(255, 255, 255, 0.9);
  position: relative;
}

.sleep-slider::-webkit-slider-thumb:hover {
  background: linear-gradient(135deg, 
    rgba(59, 130, 246, 1) 0%, 
    rgba(139, 92, 246, 1) 100%);
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.7);
  transform: scale(1.2);
  border-color: white;
}

.sleep-scale-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  padding: 0 0.5rem;
}

.content-area {
  flex: 1;
  padding: 2rem;
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-radius: 1.25rem;
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(25px);
  font-size: 1.125rem;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.95);
  resize: none;
  font-family: inherit;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  min-height: 250px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 400;
  letter-spacing: 0.01em;
}

.content-area::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.content-area:focus {
  outline: none;
  border-color: rgba(139, 92, 246, 0.6);
  box-shadow: 0 12px 48px rgba(139, 92, 246, 0.25);
  transform: translateY(-4px);
  background: rgba(255, 255, 255, 0.06);
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
  padding: 1.25rem 1.5rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(139, 92, 246, 0.15);
  backdrop-filter: blur(25px);
  border-radius: 1rem;
  font-size: 0.9rem;
  color: rgba(196, 181, 253, 0.8);
  font-weight: 500;
  flex-shrink: 0;
}

.metadata-left,
.metadata-right {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

/* Auto-save Indicator */
.auto-save-indicator {
  position: fixed;
  bottom: 2rem;
  left: 2rem;
  padding: 0.875rem 1.5rem;
  background: rgba(30, 41, 59, 0.95);
  border: 1px solid rgba(139, 92, 246, 0.3);
  backdrop-filter: blur(20px);
  color: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 500;
  z-index: 1001;
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.3);
  display: flex;
  align-items: center;
  gap: 0.5rem;
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
  .entry-header {
    padding: 0.875rem 1rem;
    flex-wrap: wrap;
    min-height: auto;
  }

  .entry-title-input {
    font-size: 1rem;
    order: 2;
    width: 100%;
    text-align: center;
    margin-top: 0.5rem;
  }

  .close-btn {
    order: 1;
  }

  .header-actions {
    order: 3;
  }

  .entry-form {
    padding: 1rem;
    gap: 1rem;
  }

  .mental-health-card {
    padding: 1.5rem;
  }

  .section-title {
    font-size: 1.125rem;
    margin-bottom: 1.5rem;
  }

  .tracking-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .tracking-item {
    padding: 1.25rem;
  }

  .content-area {
    padding: 1.5rem;
    font-size: 1rem;
    min-height: 200px;
  }

  .metadata-left,
  .metadata-right {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }

  .metadata-right {
    align-items: flex-end;
  }

  .entry-metadata {
    padding: 1rem;
    font-size: 0.8rem;
  }

  .mood-scale-container {
    gap: 1rem;
  }

  .sleep-input-container {
    flex-direction: column;
    gap: 0.75rem;
  }

  .sleep-input {
    text-align: center;
    max-width: none;
  }
}

@media (max-width: 480px) {
  .entry-form {
    padding: 0.75rem;
  }

  .mental-health-card {
    padding: 1.25rem;
  }

  .tracking-item {
    padding: 1rem;
  }

  .content-area {
    padding: 1.25rem;
    min-height: 180px;
  }
}
</style>
