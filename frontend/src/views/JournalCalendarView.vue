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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { usePatient } from '../composables/usePatient'
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

const selectedDateFormatted = computed(() => {
  if (!selectedDate.value) return ''
  const date = new Date(selectedDate.value)
  return date.toLocaleDateString('default', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
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
const formatDate = (year: number, month: number, day: number): string => {
  const date = new Date(year, month, day)
  return date.toISOString().split('T')[0]
}

const getEntriesForDate = (date: string): JournalEntry[] => {
  return calendarEntries.value.filter(entry => entry.entry_date === date)
}

const loadCalendarData = async () => {
  loading.value = true
  
  try {
    const url = `/api/journal/calendar/${patientId.value}/${currentYear.value}/${currentMonth.value + 1}`
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
    // Show user-friendly error
    alert('Could not load calendar data. Please check if the backend server is running.')
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
    // Navigate to that month
    if (day.dayNumber > 15) {
      previousMonth()
    } else {
      nextMonth()
    }
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
  min-height: 100vh;
  background: linear-gradient(135deg, #7dd3c0 0%, #7ba3e3 100%);
  display: flex;
  flex-direction: column;
  padding-bottom: 2rem;
}

/* Header */
.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: rgba(0, 0, 0, 0.8);
  color: white;
}

.calendar-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 500;
}

.close-btn {
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  transition: background 0.3s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.close-btn svg {
  width: 24px;
  height: 24px;
}

.today-btn {
  background: rgba(125, 211, 192, 0.3);
  border: 1px solid rgba(125, 211, 192, 0.5);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.today-btn:hover {
  background: rgba(125, 211, 192, 0.5);
  transform: translateY(-2px);
}

/* Month Navigation */
.month-navigation {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  background: rgba(0, 0, 0, 0.6);
  margin: 1rem 1.5rem;
  border-radius: 1rem;
  color: white;
}

.current-month {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 500;
}

.nav-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.75rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.nav-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.nav-btn svg {
  width: 20px;
  height: 20px;
}

/* Calendar Container */
.calendar-container {
  padding: 0 1.5rem;
  margin-bottom: 1rem;
}

.weekday-headers {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.weekday {
  text-align: center;
  padding: 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.5rem;
  background: rgba(0, 0, 0, 0.4);
  padding: 0.5rem;
  border-radius: 1rem;
}

.calendar-day {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid transparent;
  border-radius: 0.75rem;
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;
}

.calendar-day:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

.calendar-day.other-month {
  opacity: 0.3;
}

.calendar-day.today {
  border-color: #7dd3c0;
  background: rgba(125, 211, 192, 0.2);
}

.calendar-day.has-entry {
  background: rgba(125, 211, 192, 0.15);
}

.calendar-day.selected {
  border-color: white;
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.day-number {
  font-size: 0.95rem;
  font-weight: 500;
  color: white;
}

.check-indicator {
  position: absolute;
  bottom: 0.25rem;
  width: 16px;
  height: 16px;
  background: #7dd3c0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.check-indicator svg {
  width: 12px;
  height: 12px;
  color: white;
}

/* Selected Day Panel */
.selected-day-panel {
  background: rgba(255, 255, 255, 0.95);
  margin: 0 1.5rem 1rem;
  padding: 1rem;
  border-radius: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-height: 400px;
  overflow-y: auto;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e9ecef;
}

.panel-header h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 500;
  color: #2c3e50;
}

.clear-btn {
  background: transparent;
  border: none;
  font-size: 1.25rem;
  color: #6c757d;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  transition: all 0.3s ease;
}

.clear-btn:hover {
  background: #f8f9fa;
  color: #2c3e50;
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
  padding: 0 1.5rem;
}

.stat-card {
  background: rgba(255, 255, 255, 0.95);
  padding: 1.25rem;
  border-radius: 1rem;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.85rem;
  color: #6c757d;
  font-weight: 500;
}

/* Loading Overlay */
.loading-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 640px) {
  .calendar-grid {
    gap: 0.25rem;
  }

  .day-number {
    font-size: 0.85rem;
  }

  .monthly-stats {
    grid-template-columns: 1fr;
  }

  .current-month {
    font-size: 1.25rem;
  }
}
</style>
