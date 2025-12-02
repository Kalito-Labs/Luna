<template>
  <div class="calendar-view">
    <!-- Header -->
    <header class="calendar-header">
      <button @click="close" class="close-btn" aria-label="Close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>
      
      <h2>Journal Calendar</h2>
      
      <button @click="goToToday" class="today-btn">Today</button>
    </header>

    <!-- Month Navigation -->
    <div class="month-navigation">
      <button @click="previousMonth" class="nav-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      
      <h3 class="current-month">
        {{ currentMonthName }} {{ currentYear }}
      </h3>
      
      <button @click="nextMonth" class="nav-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </div>

    <!-- Calendar Grid -->
    <div class="calendar-container">
      <!-- Weekday Headers -->
      <div class="weekday-headers">
        <div v-for="day in weekdays" :key="day" class="weekday">
          {{ day }}
        </div>
      </div>

      <!-- Calendar Days -->
      <div class="calendar-grid">
        <div
          v-for="day in calendarDays"
          :key="day.key"
          :class="['calendar-day', {
            'other-month': day.isOtherMonth,
            'today': day.isToday,
            'has-entry': day.hasEntry,
            'selected': day.date === selectedDate
          }]"
          @click="selectDay(day)"
        >
          <div class="day-number">{{ day.dayNumber }}</div>
          
          <!-- Check Mark Indicator -->
          <div v-if="day.hasEntry" class="check-indicator">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Day Entries Modal -->
    <DayEntriesModal
      :is-open="showModal"
      :date="selectedDate"
      :entries="selectedDayEntries"
      @close="closeModal"
    />

    <!-- Monthly Stats -->
    <div class="monthly-stats">
      <div class="stat-card">
        <div class="stat-value">{{ monthStats.totalEntries }}</div>
        <div class="stat-label">Entries</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-value">{{ monthStats.daysWithEntries }}</div>
        <div class="stat-label">Days Journaled</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-value">{{ monthStats.currentStreak }}</div>
        <div class="stat-label">Day Streak</div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { usePatient } from '../composables/usePatient'
import { apiUrl } from '../config/api'
import DayEntriesModal from '../components/journal/DayEntriesModal.vue'
import type { MoodType, JournalEntry } from '../types/journal'

const router = useRouter()
const { getPatientId } = usePatient()

// State
const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth()) // 0-11
const selectedDate = ref<string | null>(null)
const calendarEntries = ref<JournalEntry[]>([])
const loading = ref(false)
const showModal = ref(false)
const errorMessage = ref('')

const patientId = computed(() => getPatientId())

// Constants
const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Computed
const currentMonthName = computed(() => {
  return new Date(currentYear.value, currentMonth.value).toLocaleString('default', { month: 'long' })
})

const calendarDays = computed(() => {
  const year = currentYear.value
  const month = currentMonth.value
  
  // First day of the month
  const firstDay = new Date(year, month, 1)
  const firstDayOfWeek = firstDay.getDay()
  
  // Last day of the month
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  
  // Previous month days
  const prevMonthLastDay = new Date(year, month, 0)
  const prevMonthDays = prevMonthLastDay.getDate()
  
  const days: Array<{
    key: string
    date: string
    dayNumber: number
    isOtherMonth: boolean
    isToday: boolean
    hasEntry: boolean
    mood?: MoodType
    entryCount: number
  }> = []
  
  // Add previous month days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const day = prevMonthDays - i
    const date = formatDate(year, month - 1, day)
    const dayEntries = getEntriesForDate(date)
    
    days.push({
      key: `prev-${day}`,
      date,
      dayNumber: day,
      isOtherMonth: true,
      isToday: false,
      hasEntry: dayEntries.length > 0,
      mood: dayEntries[0]?.mood,
      entryCount: dayEntries.length
    })
  }
  
  // Add current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const date = formatDate(year, month, day)
    const dayEntries = getEntriesForDate(date)
    const today = new Date()
    const isToday = date === formatDate(today.getFullYear(), today.getMonth(), today.getDate())
    
    days.push({
      key: `current-${day}`,
      date,
      dayNumber: day,
      isOtherMonth: false,
      isToday,
      hasEntry: dayEntries.length > 0,
      mood: dayEntries[0]?.mood,
      entryCount: dayEntries.length
    })
  }
  
  // Add next month days to fill grid
  const remainingDays = 42 - days.length // 6 rows × 7 days
  for (let day = 1; day <= remainingDays; day++) {
    const date = formatDate(year, month + 1, day)
    const dayEntries = getEntriesForDate(date)
    
    days.push({
      key: `next-${day}`,
      date,
      dayNumber: day,
      isOtherMonth: true,
      isToday: false,
      hasEntry: dayEntries.length > 0,
      mood: dayEntries[0]?.mood,
      entryCount: dayEntries.length
    })
  }
  
  return days
})

const selectedDayEntries = computed(() => {
  if (!selectedDate.value) return []
  return getEntriesForDate(selectedDate.value)
})

const monthStats = computed(() => {
  const entriesInMonth = calendarEntries.value.filter(entry => {
    const entryDate = new Date(entry.entry_date)
    return entryDate.getMonth() === currentMonth.value && 
           entryDate.getFullYear() === currentYear.value
  })
  
  const daysWithEntries = new Set(
    entriesInMonth.map(entry => entry.entry_date)
  ).size
  
  return {
    totalEntries: entriesInMonth.length,
    daysWithEntries,
    currentStreak: calculateStreak()
  }
})

// Methods
const showError = (message: string) => {
  errorMessage.value = message
  setTimeout(() => {
    errorMessage.value = ''
  }, 5000)
}

const formatDate = (year: number, month: number, day: number): string => {
  const date = new Date(year, month, day)
  return date.toISOString().split('T')[0] ?? ''
}

const getEntriesForDate = (date: string): JournalEntry[] => {
  return calendarEntries.value.filter(entry => entry.entry_date === date)
}

const loadCalendarData = async () => {
  loading.value = true
  
  try {
    const url = apiUrl(`/api/journal/calendar/${patientId.value}/${currentYear.value}/${currentMonth.value + 1}`)
    console.log('Loading calendar data from:', url)
    
    const response = await fetch(url)
    
    if (!response.ok) {
      const errorData = await response.text()
      console.error('Calendar API error:', response.status, errorData)
      throw new Error(`Failed to load calendar data: ${response.status}`)
    }
    
    const calendarData = await response.json()
    console.log('Calendar data loaded:', calendarData)
    
    // The API returns an array of CalendarEntry objects
    // Each CalendarEntry has: { date, entries: JournalEntry[], primaryMood, entryCount }
    // We need to flatten this to just the entries array
    if (Array.isArray(calendarData)) {
      const allEntries: any[] = []
      calendarData.forEach((dayData: any) => {
        if (dayData.entries && Array.isArray(dayData.entries)) {
          allEntries.push(...dayData.entries)
        }
      })
      calendarEntries.value = allEntries
    } else {
      calendarEntries.value = []
    }
  } catch (error) {
    console.error('Error loading calendar data:', error)
    calendarEntries.value = []
    showError('Could not load calendar data. Please try again.')
  } finally {
    loading.value = false
    console.log('Loading complete, entries:', calendarEntries.value.length)
  }
}

const calculateStreak = (): number => {
  if (calendarEntries.value.length === 0) return 0
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const sortedDates = [...new Set(calendarEntries.value.map(e => e.entry_date))]
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
  
  let streak = 0
  let checkDate = new Date(today)
  
  for (const dateStr of sortedDates) {
    const entryDate = new Date(dateStr)
    entryDate.setHours(0, 0, 0, 0)
    
    if (entryDate.getTime() === checkDate.getTime()) {
      streak++
      checkDate.setDate(checkDate.getDate() - 1)
    } else if (entryDate.getTime() < checkDate.getTime()) {
      break
    }
  }
  
  return streak
}

const selectDay = (day: any) => {
  if (day.isOtherMonth) {
    // Navigate to that month and pre-select the date
    selectedDate.value = day.date
    if (day.dayNumber > 15) {
      previousMonth()
    } else {
      nextMonth()
    }
    // Open modal after navigation completes
    setTimeout(() => {
      showModal.value = true
    }, 100)
    return
  }
  
  selectedDate.value = day.date
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedDate.value = null
}

const previousMonth = () => {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

const nextMonth = () => {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
}

const goToToday = () => {
  const today = new Date()
  currentYear.value = today.getFullYear()
  currentMonth.value = today.getMonth()
}

const close = () => {
  router.push('/journal')
}

// Watchers
watch([currentYear, currentMonth], () => {
  loadCalendarData()
})

// Lifecycle
onMounted(() => {
  loadCalendarData()
})
</script>

<style scoped>
.calendar-view {
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
.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  background: rgba(30, 41, 59, 0.85);
  backdrop-filter: blur(25px);
  border-bottom: 1px solid rgba(139, 92, 246, 0.15);
  color: rgba(255, 255, 255, 0.95);
  flex-shrink: 0;
  position: relative;
}

.calendar-header::before {
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

.calendar-header h2 {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.close-btn {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  transition: background 0.3s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: scale(1.05);
}

.close-btn svg {
  width: 24px;
  height: 24px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.today-btn {
  background: linear-gradient(135deg, 
    rgba(139, 92, 246, 0.2) 0%, 
    rgba(124, 58, 237, 0.25) 100%);
  border: 1px solid rgba(139, 92, 246, 0.4);
  color: rgba(255, 255, 255, 0.95);
  padding: 0.625rem 1.25rem;
  border-radius: 0.75rem;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
}

.today-btn:hover {
  background: linear-gradient(135deg, 
    rgba(139, 92, 246, 0.35) 0%, 
    rgba(124, 58, 237, 0.4) 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.4);
  border-color: rgba(139, 92, 246, 0.6);
}

/* Month Navigation */
.month-navigation {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(139, 92, 246, 0.15);
  backdrop-filter: blur(25px);
  margin: 1rem 1.5rem;
  border-radius: 1.25rem;
  color: rgba(255, 255, 255, 0.95);
  flex-shrink: 0;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.current-month {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 500;
}

.nav-btn {
  background: rgba(139, 92, 246, 0.15);
  border: 1px solid rgba(139, 92, 246, 0.3);
  color: rgba(255, 255, 255, 0.95);
  cursor: pointer;
  padding: 0.875rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-btn:hover {
  background: rgba(139, 92, 246, 0.25);
  border-color: rgba(139, 92, 246, 0.5);
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.nav-btn svg {
  width: 20px;
  height: 20px;
}

/* Calendar Container */
.calendar-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 1.5rem;
  margin-bottom: 1rem;
  min-height: 0;
  overflow: hidden;
}

.weekday-headers {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 0.75rem;
  padding: 0.75rem 0.5rem;
  border: 1px solid rgba(139, 92, 246, 0.1);
}

.weekday {
  text-align: center;
  padding: 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(196, 181, 253, 0.85);
  letter-spacing: 0.02em;
}

.calendar-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: repeat(6, 1fr);
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(139, 92, 246, 0.15);
  backdrop-filter: blur(25px);
  padding: 1rem;
  border-radius: 1.25rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  overflow-y: auto;
  min-height: 0;
}

.calendar-day {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid transparent;
  border-radius: 0.75rem;
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;
}

.calendar-day:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: scale(1.05);
}

.calendar-day.other-month {
  opacity: 0.3;
}

.calendar-day.today {
  border-color: rgba(139, 92, 246, 0.8);
  background: rgba(139, 92, 246, 0.2);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.calendar-day.has-entry {
  background: rgba(139, 92, 246, 0.15);
  border-color: rgba(139, 92, 246, 0.3);
}

.calendar-day.selected {
  border-color: rgba(139, 92, 246, 0.9);
  background: rgba(139, 92, 246, 0.3);
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(139, 92, 246, 0.4);
}

.day-number {
  font-size: 0.95rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
}

.check-indicator {
  position: absolute;
  bottom: 0.25rem;
  width: 18px;
  height: 18px;
  background: linear-gradient(135deg, 
    rgba(139, 92, 246, 0.9) 0%, 
    rgba(124, 58, 237, 0.95) 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(139, 92, 246, 0.4);
}

.check-indicator svg {
  width: 12px;
  height: 12px;
  color: white;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
}

/* Selected Day Panel */
.selected-day-panel {
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  margin: 0 1.5rem 1rem;
  padding: 1rem;
  border-radius: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  max-height: 400px;
  overflow-y: auto;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.panel-header h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
}

.clear-btn {
  background: transparent;
  border: none;
  font-size: 1.25rem;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  transition: all 0.3s ease;
}

.clear-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
}

.entries-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* Monthly Stats */
.monthly-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  padding: 0 1.5rem 1.5rem;
  flex-shrink: 0;
}

.stat-card {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(139, 92, 246, 0.15);
  backdrop-filter: blur(25px);
  padding: 1.5rem;
  border-radius: 1.25rem;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, 
    transparent, 
    rgba(139, 92, 246, 0.4), 
    transparent);
}

.stat-card:hover {
  border-color: rgba(139, 92, 246, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
}

.stat-value {
  font-size: 2.25rem;
  font-weight: 700;
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.95) 0%, 
    rgba(196, 181, 253, 0.9) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
  letter-spacing: -0.02em;
}

.stat-label {
  font-size: 0.875rem;
  color: rgba(196, 181, 253, 0.75);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Loading Overlay */
.loading-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(255, 255, 255, 0.2);
  border-top-color: rgba(59, 130, 246, 0.8);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Enhanced scrollbar for calendar grid */
.calendar-grid::-webkit-scrollbar {
  width: 8px;
}

.calendar-grid::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}

.calendar-grid::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, 
    rgba(139, 92, 246, 0.6), 
    rgba(124, 58, 237, 0.7));
  border-radius: 10px;
  transition: all 0.3s ease;
}

.calendar-grid::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, 
    rgba(139, 92, 246, 0.8), 
    rgba(124, 58, 237, 0.9));
}

/* Custom scrollbar for selected day panel */
.selected-day-panel::-webkit-scrollbar {
  width: 10px;
}

.selected-day-panel::-webkit-scrollbar-track {
  background: rgba(30, 30, 35, 0.4);
  border-radius: 10px;
}

.selected-day-panel::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, rgba(60, 60, 70, 0.9), rgba(80, 80, 90, 0.9));
  border-radius: 10px;
  border: 2px solid transparent;
  background-clip: padding-box;
  transition: all 0.3s ease;
}

.selected-day-panel::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, rgba(90, 90, 100, 0.95), rgba(110, 110, 120, 0.95));
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.3);
}

/* Responsive */
@media (max-width: 640px) {
  .calendar-container {
    padding: 0 1rem;
  }

  .calendar-grid {
    gap: 0.25rem;
    padding: 0.75rem;
    grid-template-rows: repeat(6, minmax(40px, 1fr));
  }

  .weekday-headers {
    padding: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .weekday {
    font-size: 0.8rem;
    padding: 0.375rem;
  }

  .calendar-day {
    min-height: 40px;
  }

  .day-number {
    font-size: 0.85rem;
  }

  .monthly-stats {
    grid-template-columns: 1fr;
    padding: 0 1rem 1.5rem;
  }

  .current-month {
    font-size: 1.25rem;
  }

  .month-navigation {
    margin: 0.75rem 1rem;
    padding: 1.25rem;
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
