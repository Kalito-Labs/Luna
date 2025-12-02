<template>
  <div class="journal-entry-view">
    <!-- Header -->
    <header class="entry-header">
      <div class="header-top">
        <button @click="cancel" class="icon-btn" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        
        <input 
          v-model="entry.title" 
          :placeholder="isEditing ? 'Edit entry title...' : 'Untitled Entry'"
          class="title-input"
        />
        
        <!-- Auto-save Status -->
        <div class="save-status">
          <transition name="fade">
            <svg v-if="autoSaveStatus === 'Saving...'" class="status-icon spinning" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" opacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round" />
            </svg>
            <svg v-else-if="autoSaveStatus === 'Saved ✓'" class="status-icon success" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            <svg v-else class="status-icon idle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3" />
            </svg>
          </transition>
        </div>
      </div>
      
      <div class="header-actions">
        <button @click="save" class="primary-btn" :disabled="!canSave || isSaving">
          <svg v-if="isSaving" class="btn-icon spinning" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" opacity="0.25" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round" />
          </svg>
          <svg v-else class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <path d="M17 21v-8H7v8M7 3v5h8" />
          </svg>
          <span>{{ isSaving ? 'Saving...' : 'Save Entry' }}</span>
        </button>
        
        <button v-if="isEditing" @click="deleteEntry" class="danger-btn" aria-label="Delete">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" />
          </svg>
        </button>
      </div>
    </header>

    <!-- Entry Form -->
    <div class="entry-form">
      <!-- Mental Health Tracking Card -->
      <div class="form-section wellness-tracker">
        <div class="tracker-header">
          <h3 class="section-title">Today's Check-in</h3>
          <span class="tracker-badge">Optional</span>
        </div>
        
        <div class="tracking-grid">
          <!-- Emotion Selector - Dropdown -->
          <div class="tracking-item emotion-item">
            <label for="mood-select" class="item-label">How are you feeling?</label>
            <select 
              id="mood-select"
              v-model="entry.mood" 
              class="mood-dropdown"
            >
              <option value="">Select an emotion...</option>
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
            <div class="item-header">
              <label for="sleep-hours" class="item-label">Sleep Hours</label>
              <span class="value-badge">{{ entry.sleep_hours || 0 }}h</span>
            </div>
            <div class="slider-wrapper">
              <div class="slider-icons">
                <span class="slider-icon-start">😴</span>
                <div class="slider-track">
                  <div class="slider-fill" :style="{ width: `${((entry.sleep_hours || 0) / 12) * 100}%` }"></div>
                  <input 
                    id="sleep-hours"
                    type="range"
                    min="0"
                    max="12"
                    step="0.5"
                    v-model.number="entry.sleep_hours"
                    class="modern-slider"
                  />
                </div>
                <span class="slider-icon-end">🌟</span>
              </div>
              <div class="slider-ticks">
                <span>0</span>
                <span>3</span>
                <span>6</span>
                <span>9</span>
                <span>12</span>
              </div>
            </div>
          </div>

          <!-- Mood Scale -->
          <div class="tracking-item mood-item">
            <div class="item-header">
              <label for="mood-scale" class="item-label">Energy Level</label>
              <span class="value-badge">{{ entry.mood_scale || 5 }}/10</span>
            </div>
            <div class="slider-wrapper">
              <div class="slider-icons">
                <span class="slider-icon-start">😔</span>
                <div class="slider-track">
                  <div class="slider-fill energy" :style="{ width: `${((entry.mood_scale || 5) / 10) * 100}%` }"></div>
                  <input 
                    id="mood-scale"
                    type="range"
                    min="1"
                    max="10"
                    v-model.number="entry.mood_scale"
                    class="modern-slider energy"
                  />
                </div>
                <span class="slider-icon-end">🚀</span>
              </div>
              <div class="slider-ticks">
                <span>1</span>
                <span>3</span>
                <span>5</span>
                <span>7</span>
                <span>10</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content Area -->
      <div class="editor-container">
        <textarea
          v-model="entry.content"
          :placeholder="placeholder"
          @input="handleInput"
          class="content-area"
          ref="contentArea"
        />
        
        <!-- Editor Footer -->
        <div class="editor-footer">
          <div class="metadata-left">
            <span class="word-count">{{ wordCount }} words</span>
            <span class="char-count">{{ charCount }} characters</span>
          </div>
          <div class="metadata-right">
            <span class="date-display">{{ formattedDate }}</span>
          </div>
        </div>
      </div>
    </div>
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
const isSaving = ref(false)
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
  if (!canSave.value || isSaving.value) return

  try {
    isSaving.value = true
    autoSaveStatus.value = 'Saving...'
    
    if (isEditing.value && entryId.value) {
      await updateEntry()
    } else {
      await createEntry()
    }
    
    autoSaveStatus.value = 'Saved ✓'
    router.push('/journal')
  } catch (error) {
    console.error('Error saving entry:', error)
    autoSaveStatus.value = 'Save failed - please try again'
    setTimeout(() => {
      autoSaveStatus.value = ''
    }, 3000)
  } finally {
    isSaving.value = false
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
/* Modern Design System */
:root {
  --surface-1: rgba(255, 255, 255, 0.03);
  --surface-2: rgba(255, 255, 255, 0.06);
  --surface-3: rgba(255, 255, 255, 0.10);
  
  --primary: rgba(139, 92, 246, 1);
  --primary-light: rgba(196, 181, 253, 1);
  --primary-dark: rgba(124, 58, 237, 1);
  
  --success: rgba(34, 197, 94, 1);
  --danger: rgba(239, 68, 68, 1);
  --warning: rgba(245, 158, 11, 1);
  
  --text-primary: rgba(255, 255, 255, 0.95);
  --text-secondary: rgba(255, 255, 255, 0.7);
  --text-tertiary: rgba(255, 255, 255, 0.5);
}

.journal-entry-view {
  height: 100vh;
  background: linear-gradient(135deg, 
    rgba(15, 23, 42, 0.98) 0%, 
    rgba(30, 41, 59, 0.95) 50%,
    rgba(67, 56, 202, 0.08) 100%);
  display: flex;
  flex-direction: column;
  position: relative;
}

/* Modern Header */
.entry-header {
  display: flex;
  flex-direction: column;
  padding: 0.75rem 1.25rem;
  background: rgba(30, 41, 59, 0.85);
  backdrop-filter: blur(25px);
  border-bottom: 1px solid rgba(139, 92, 246, 0.15);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
  gap: 0.75rem;
  position: relative;
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

.header-top {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.icon-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.375rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.icon-btn svg {
  width: 18px;
  height: 18px;
}

.icon-btn:hover {
  background: var(--surface-2);
  color: var(--text-primary);
}

.title-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  text-align: center;
  padding: 0.375rem 0.5rem;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
}

.title-input::placeholder {
  color: var(--text-tertiary);
}

.title-input:focus {
  background: var(--surface-1);
}

.save-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.625rem;
  background: var(--surface-1);
  border-radius: 0.5rem;
  font-size: 0.75rem;
  color: var(--text-tertiary);
  min-width: 36px;
  justify-content: center;
}

.status-icon {
  width: 14px;
  height: 14px;
}

.status-icon.spinning {
  animation: spin 1s linear infinite;
}

.status-icon.success {
  color: var(--success);
}

.status-icon.idle {
  opacity: 0.3;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  justify-content: center;
}

.primary-btn,
.danger-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 0.625rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.primary-btn {
  background: linear-gradient(135deg, 
    var(--primary) 0%, 
    var(--primary-dark) 100%);
  color: white;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
  min-width: 140px;
}

.primary-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(139, 92, 246, 0.5);
}

.primary-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.danger-btn {
  background: rgba(239, 68, 68, 0.15);
  color: var(--danger);
  border: 1px solid rgba(239, 68, 68, 0.3);
  padding: 0.625rem;
}

.danger-btn:hover {
  background: rgba(239, 68, 68, 0.25);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.btn-icon {
  width: 16px;
  height: 16px;
}

.btn-icon.spinning {
  animation: spin 1s linear infinite;
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

.entry-form::-webkit-scrollbar {
  width: 8px;
}

.entry-form::-webkit-scrollbar-track {
  background: var(--surface-1);
  border-radius: 10px;
}

.entry-form::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, 
    rgba(139, 92, 246, 0.6), 
    rgba(124, 58, 237, 0.7));
  border-radius: 10px;
}

/* Wellness Tracker */
.wellness-tracker {
  background: var(--surface-2);
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-radius: 1.25rem;
  padding: 1.5rem;
  backdrop-filter: blur(25px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
  position: relative;
}

.wellness-tracker::before {
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

.tracker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.section-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
}

.tracker-badge {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  background: var(--surface-1);
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-weight: 500;
}

.tracking-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.tracking-item {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.item-label {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
}

.value-badge {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--primary-light);
  background: rgba(139, 92, 246, 0.15);
  padding: 0.25rem 0.75rem;
  border-radius: 0.5rem;
}

/* Mood Dropdown */
.mood-dropdown {
  width: 100%;
  padding: 0.875rem 1rem;
  background: var(--surface-1);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 0.75rem;
  color: var(--text-primary);
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.5)' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 1.25rem;
  padding-right: 2.5rem;
}

.mood-dropdown:hover {
  background: var(--surface-2);
  border-color: rgba(139, 92, 246, 0.4);
}

.mood-dropdown:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2);
  background: var(--surface-2);
}

.mood-dropdown option {
  background: rgba(30, 41, 59, 0.98);
  color: var(--text-primary);
  padding: 0.5rem;
}

/* Modern Sliders */
.slider-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.slider-icons {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.slider-icon-start,
.slider-icon-end {
  font-size: 1.5rem;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.slider-track {
  flex: 1;
  position: relative;
  height: 8px;
  background: var(--surface-1);
  border-radius: 10px;
  overflow: visible;
}

.slider-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: linear-gradient(90deg, 
    rgba(59, 130, 246, 0.6), 
    rgba(139, 92, 246, 0.8));
  border-radius: 10px;
  transition: width 0.2s ease;
  pointer-events: none;
}

.slider-fill.energy {
  background: linear-gradient(90deg, 
    rgba(239, 68, 68, 0.5), 
    rgba(245, 158, 11, 0.5), 
    rgba(34, 197, 94, 0.6));
}

.modern-slider {
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: 8px;
  transform: translateY(-50%);
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  outline: none;
  cursor: pointer;
}

.modern-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: white;
  border: 3px solid var(--primary);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.modern-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 6px 16px rgba(139, 92, 246, 0.6);
}

.modern-slider::-webkit-slider-thumb:active {
  transform: scale(1.1);
}

.slider-ticks {
  display: flex;
  justify-content: space-between;
  padding: 0 0.5rem;
  font-size: 0.7rem;
  color: var(--text-tertiary);
}

/* Editor Container */
.editor-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  position: relative;
  min-height: 0;
}

/* Content Area */
.content-area {
  flex: 1;
  padding: 2rem;
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-radius: 1.25rem;
  background: var(--surface-1);
  backdrop-filter: blur(25px);
  font-size: 1.125rem;
  line-height: 1.7;
  color: var(--text-primary);
  resize: none;
  font-family: inherit;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  min-height: 0;
  transition: all 0.3s ease;
  outline: none;
}

.content-area::placeholder {
  color: var(--text-tertiary);
}

.content-area:focus {
  border-color: rgba(139, 92, 246, 0.5);
  box-shadow: 0 12px 48px rgba(139, 92, 246, 0.15);
  background: var(--surface-2);
}

.content-area::-webkit-scrollbar {
  width: 10px;
}

.content-area::-webkit-scrollbar-track {
  background: rgba(30, 30, 35, 0.4);
  border-radius: 10px;
}

.content-area::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, 
    rgba(60, 60, 70, 0.9), 
    rgba(80, 80, 90, 0.9));
  border-radius: 10px;
}

/* Editor Footer */
.editor-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: var(--surface-1);
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-radius: 1rem;
  font-size: 0.85rem;
  color: var(--text-tertiary);
}

.metadata-left,
.metadata-right {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Responsive */
@media (max-width: 640px) {
  .entry-header {
    padding: 1rem;
  }
  
  .header-actions {
    flex-wrap: wrap;
  }
  
  .primary-btn {
    flex: 1;
    justify-content: center;
    min-width: 0;
  }
  
  .entry-form {
    padding: 1rem;
    gap: 1rem;
  }
  
  .wellness-tracker {
    padding: 1.25rem;
  }
  
  .content-area {
    padding: 1.5rem;
    font-size: 1rem;
    min-height: 250px;
  }
  
  .editor-footer {
    flex-direction: column;
    gap: 0.75rem;
    align-items: flex-start;
  }
  
  .metadata-left,
  .metadata-right {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }
}
</style>
