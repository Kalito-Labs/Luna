<template>
  <div class="journal-home">
    <!-- Compact Header -->
    <header class="journal-header">
      <div class="header-left">
        <HamburgerMenu />
        <div class="header-title">
          <h1>My Journal</h1>
          <span class="current-date">{{ formattedDate }}</span>
        </div>
      </div>
      <button @click="startNewEntry" class="new-entry-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14" />
        </svg>
        <span>New Entry</span>
      </button>
    </header>

    <!-- Main Content Container -->
    <div class="content-container">
      <!-- Left Column: Entries List -->
      <div class="entries-column">
        <div class="column-header">
          <h2>Recent Entries</h2>
          <span v-if="hasEntries" class="entry-count">{{ recentEntries.length }} total</span>
        </div>

        <div v-if="loading" class="loading-state">
        <div class="loading-animation">
          <div class="loading-dots">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
          </div>
        </div>
        <p>Loading your journal...</p>
      </div>

        <div v-else-if="!hasEntries" class="empty-state">
          <div class="empty-icon">📖</div>
          <p>No entries yet</p>
          <button @click="startNewEntry" class="empty-cta">Create First Entry</button>
        </div>

        <div v-else class="entries-list">
          <JournalPreviewCard 
            v-for="entry in recentEntries" 
            :key="entry.id" 
            :entry="entry"
            @click="openEntry(entry.id)"
          />
        </div>
      </div>

      <!-- Right Column: Stats & Quick Actions -->
      <aside class="sidebar">
        <!-- Quick Stats -->
        <div class="stats-panel">
          <h3>Overview</h3>
          <div class="stat-row">
            <span class="stat-label">Total Entries</span>
            <span class="stat-value">{{ totalEntries }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Current Streak</span>
            <span class="stat-value">{{ currentStreak }} days 🔥</span>
          </div>
          <div v-if="lastEntryDate" class="stat-row">
            <span class="stat-label">Last Entry</span>
            <span class="stat-value">{{ lastEntryDate }}</span>
          </div>
          <div v-if="averageMood" class="stat-row">
            <span class="stat-label">Recent Mood</span>
            <span class="stat-value">{{ averageMood }}</span>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions">
          <button @click="viewAllEntries" class="action-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M3 10h18" />
            </svg>
            <span>Calendar View</span>
          </button>
        </div>
      </aside>
    </div>

    <!-- Error Toast Notification -->
    <transition name="toast">
      <div v-if="errorMessage" class="error-toast">
        <svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
        <span>{{ errorMessage }}</span>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePatient } from '../composables/usePatient'
import { apiUrl } from '../config/api'
import JournalPreviewCard from '../components/journal/JournalPreviewCard.vue'
import HamburgerMenu from '../components/HamburgerMenu.vue'
import type { JournalEntry } from '../types/journal'

const router = useRouter()
const { getPatientName, getPatientId, loadPatient } = usePatient()

// State
const loading = ref(true)
const recentEntries = ref<JournalEntry[]>([])
const errorMessage = ref('')
const patientName = computed(() => getPatientName())
const patientId = computed(() => getPatientId())

// Computed
const hasEntries = computed(() => recentEntries.value.length > 0)
const todaysEntries = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return recentEntries.value.filter((entry: JournalEntry) => {
    return entry.entry_date === today
  })
})

const totalEntries = computed(() => recentEntries.value.length)

const thisWeekEntries = computed(() => {
  const now = new Date()
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
  const weekStartString = weekStart.toISOString().split('T')[0] || ''
  
  return recentEntries.value.filter((entry: JournalEntry) => {
    return entry.entry_date >= weekStartString
  })
})

const currentStreak = computed(() => {
  if (recentEntries.value.length === 0) return 0
  
  // Get unique entry dates and sort descending
  const uniqueDates = [...new Set(recentEntries.value.map((entry: JournalEntry) => entry.entry_date))]
    .sort()
    .reverse()
  
  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // Check consecutive days starting from today or yesterday
  for (let i = 0; i < uniqueDates.length; i++) {
    const checkDate = new Date(today)
    checkDate.setDate(today.getDate() - i)
    const checkDateString = checkDate.toISOString().split('T')[0]
    
    if (uniqueDates.includes(checkDateString)) {
      streak++
    } else if (i > 0) {
      // Only break after first day (allow starting yesterday)
      break
    }
  }
  
  return streak
})

const formattedDate = computed(() => {
  const today = new Date()
  return today.toLocaleDateString('en-US', { 
    weekday: 'long',
    month: 'long', 
    day: 'numeric',
    year: 'numeric'
  })
})

const lastEntryDate = computed(() => {
  if (recentEntries.value.length === 0) return null
  const lastEntry = recentEntries.value[0]
  const date = new Date(lastEntry.entry_date)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
})

const averageMood = computed(() => {
  const recentWithMood = recentEntries.value.slice(0, 7).filter((e: JournalEntry) => e.mood)
  if (recentWithMood.length === 0) return null
  
  // Get most common mood from last 7 entries
  const moodCounts: Record<string, number> = {}
  recentWithMood.forEach((entry: JournalEntry) => {
    if (entry.mood) {
      moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1
    }
  })
  
  const mostCommon = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]
  if (!mostCommon) return null
  
  const moodEmojis: Record<string, string> = {
    happy: '😊',
    excited: '🎉',
    grateful: '🙏',
    relaxed: '🌴',
    content: '😌',
    tired: '😴',
    unsure: '🤔',
    bored: '😑',
    anxious: '😰',
    angry: '😠',
    stressed: '😫',
    sad: '😢',
    desperate: '😭'
  }
  
  return moodEmojis[mostCommon[0]] || '😊'
})

// Methods
const showError = (message: string) => {
  errorMessage.value = message
  setTimeout(() => {
    errorMessage.value = ''
  }, 5000)
}

const fetchRecentEntries = async () => {
  try {
    loading.value = true
    errorMessage.value = ''
    
    const response = await fetch(apiUrl(`/api/journal/patient/${patientId.value}`))
    
    if (!response.ok) {
      throw new Error(`Failed to fetch entries: ${response.status}`)
    }
    
    const entries = await response.json()
    
    // Sort entries by entry_date (newest first), then by created_at as secondary sort
    recentEntries.value = entries.sort((a: JournalEntry, b: JournalEntry) => {
      const dateCompare = b.entry_date.localeCompare(a.entry_date)
      if (dateCompare !== 0) return dateCompare
      return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
    })
  } catch (error) {
    console.error('Error fetching recent entries:', error)
    showError('Failed to load journal entries. Please try again.')
  } finally {
    loading.value = false
  }
}

const startNewEntry = () => {
  router.push('/journal/new')
}

const openEntry = (id: string) => {
  router.push(`/journal/${id}/edit`)
}

const viewAllEntries = () => {
  router.push('/journal/calendar')
}

// Lifecycle
onMounted(async () => {
  // Load patient data first
  await loadPatient()
  // Then fetch journal entries
  await fetchRecentEntries()
})
</script>

<style scoped>
.journal-home {
  min-height: 100vh;
  height: 100vh;
  background: linear-gradient(135deg, 
    rgba(15, 23, 42, 0.98) 0%, 
    rgba(30, 41, 59, 0.95) 50%,
    rgba(67, 56, 202, 0.1) 100%);
  display: flex;
  flex-direction: column;
  color: rgba(255, 255, 255, 0.92);
  position: relative;
  overflow: hidden;
}

/* Compact Header */
.journal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: rgba(30, 41, 59, 0.6);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(139, 92, 246, 0.15);
  flex-shrink: 0;
  position: relative;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-title h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  line-height: 1;
}

.current-date {
  display: block;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 0.25rem;
  font-weight: 400;
}

.new-entry-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: linear-gradient(135deg, 
    rgba(139, 92, 246, 0.9) 0%, 
    rgba(124, 58, 237, 0.95) 100%);
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.new-entry-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.5);
}

.new-entry-btn svg {
  width: 18px;
  height: 18px;
}

/* Two-Column Layout */
.content-container {
  display: flex;
  gap: 1.5rem;
  flex: 1;
  padding: 1.5rem;
  overflow: hidden;
  min-height: 0;
  position: relative;
  z-index: 1;
}

/* Left Column - Entries */
.entries-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-radius: 1.25rem;
  overflow: hidden;
  position: relative;
  z-index: auto;
}

.column-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(139, 92, 246, 0.15);
  background: rgba(255, 255, 255, 0.02);
}

.column-header h2 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
}

.entry-count {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.5);
}

/* Entries List */
.entries-list {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-height: 0;
}

.entries-list::-webkit-scrollbar {
  width: 6px;
}

.entries-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}

.entries-list::-webkit-scrollbar-thumb {
  background: rgba(139, 92, 246, 0.4);
  border-radius: 10px;
}

.entries-list::-webkit-scrollbar-thumb:hover {
  background: rgba(139, 92, 246, 0.6);
}

/* Right Sidebar */
.sidebar {
  width: 320px;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  flex-shrink: 0;
}

.stats-panel {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-radius: 1.25rem;
  padding: 1.25rem;
  backdrop-filter: blur(20px);
}

.stats-panel h3 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 0.875rem;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.stat-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.stat-label {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
}

.stat-value {
  font-size: 0.95rem;
  font-weight: 600;
  color: rgba(196, 181, 253, 0.95);
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.action-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-radius: 1rem;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
}

.action-link:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(139, 92, 246, 0.3);
  color: rgba(255, 255, 255, 1);
  transform: translateX(4px);
}

.action-link svg {
  width: 20px;
  height: 20px;
  color: rgba(139, 92, 246, 0.7);
}

/* Loading & Empty States */
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  text-align: center;
  flex: 1;
}

.loading-animation {
  margin-bottom: 1.5rem;
}

.loading-dots {
  display: flex;
  gap: 0.5rem;
}

.dot {
  width: 10px;
  height: 10px;
  background: rgba(139, 92, 246, 0.8);
  border-radius: 50%;
  animation: loadingPulse 1.5s ease-in-out infinite;
}

.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes loadingPulse {
  0%, 100% { transform: scale(1); opacity: 0.7; }
  50% { transform: scale(1.3); opacity: 1; }
}

.loading-state p {
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-state p {
  color: rgba(255, 255, 255, 0.6);
  margin: 0 0 1.5rem 0;
  font-size: 0.95rem;
}

.empty-cta {
  padding: 0.75rem 1.5rem;
  background: rgba(139, 92, 246, 0.2);
  color: rgba(196, 181, 253, 0.95);
  border: 1px solid rgba(139, 92, 246, 0.4);
  border-radius: 0.75rem;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.empty-cta:hover {
  background: rgba(139, 92, 246, 0.3);
  border-color: rgba(139, 92, 246, 0.6);
  transform: translateY(-2px);
  color: white;
}

/* Error Toast Notification */
@media (max-width: 1024px) {
  .content-container {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
    order: -1;
  }
  
  .stats-panel {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
  
  .stats-panel h3 {
    grid-column: 1 / -1;
  }
  
  .stat-row {
    border-bottom: none;
    padding: 0.5rem;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 0.5rem;
  }
}

@media (max-width: 640px) {
  .journal-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .header-left {
    justify-content: space-between;
  }
  
  .new-entry-btn {
    width: 100%;
    justify-content: center;
  }
  
  .content-container {
    padding: 1rem;
    gap: 1rem;
  }
  
  .stats-panel {
    grid-template-columns: 1fr;
  }
}

/* Error Toast Notification */
.error-toast {
  position: fixed;
  top: 2rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: rgba(239, 68, 68, 0.95);
  color: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(239, 68, 68, 0.4);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  z-index: 1000;
  font-size: 0.95rem;
  font-weight: 500;
  max-width: 90%;
  animation: slideDown 0.3s ease-out;
}

.toast-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

/* Toast Transitions */
.toast-enter-active {
  animation: slideDown 0.3s ease-out;
}

.toast-leave-active {
  animation: slideUp 0.3s ease-in;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

@keyframes slideUp {
  from {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
  to {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }
}
</style>
