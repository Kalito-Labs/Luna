<template>
  <div class="journal-home">
    <!-- Header Section -->
    <header class="journal-header">
      <h1 class="welcome-message">Welcome, {{ patientName }}</h1>
      <h2 class="prompt-message">Is there something on your mind?</h2>
    </header>

    <!-- Primary Action Buttons -->
    <div class="action-buttons">
      <button @click="startNewEntry" class="action-btn primary-btn">
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14" />
        </svg>
        <span>Start a new entry</span>
      </button>
    </div>

    <!-- Insights Section -->
    <section class="insights-section">
      <div class="section-header">
        <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 3v18h18M7 16l4-4 4 4 6-6" />
        </svg>
        <h3>Insights</h3>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading your entries...</p>
      </div>

      <div v-else-if="!hasEntries" class="empty-state">
        <p>Start journaling to see insights here.</p>
        <p class="empty-subtitle">Your thoughts and moods will appear as beautiful insights</p>
      </div>

      <div v-else class="entries-grid">
        <JournalPreviewCard 
          v-for="entry in recentEntries" 
          :key="entry.id" 
          :entry="entry"
          @click="openEntry(entry.id)"
        />
      </div>

      <button v-if="hasEntries" @click="viewAllEntries" class="view-all-btn">
        View All Entries
      </button>
    </section>

    <!-- Bottom Navigation -->
    <nav class="bottom-nav">
      <button @click="goHome" class="nav-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        </svg>
        <span>Home</span>
      </button>

      <button @click="goToInsights" class="nav-item active">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 3v18h18M7 16l4-4 4 4 6-6" />
        </svg>
        <span>Insights</span>
      </button>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePatient } from '../composables/usePatient'
import JournalPreviewCard from '../components/journal/JournalPreviewCard.vue'
import type { JournalEntry } from '../types/journal'

const router = useRouter()
const { getPatientName, getPatientId, loadPatient } = usePatient()

// State
const loading = ref(true)
const recentEntries = ref<JournalEntry[]>([])
const patientName = computed(() => getPatientName())
const patientId = computed(() => getPatientId())

// Computed
const hasEntries = computed(() => recentEntries.value.length > 0)

// Methods
const fetchRecentEntries = async () => {
  try {
    loading.value = true
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0]
    const response = await fetch(`/api/journal/patient/${patientId.value}/date/${today}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch entries')
    }
    
    recentEntries.value = await response.json()
  } catch (error) {
    console.error('Error fetching recent entries:', error)
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

const goHome = () => {
  router.push('/')
}

const goToInsights = () => {
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
  background: linear-gradient(135deg, #7dd3c0 0%, #7ba3e3 100%);
  padding: 2rem 1.5rem 5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Header */
.journal-header {
  color: white;
  margin-bottom: 1rem;
}

.welcome-message {
  font-size: 1.5rem;
  font-weight: 400;
  margin: 0 0 0.5rem 0;
}

.prompt-message {
  font-size: 2rem;
  font-weight: 600;
  margin: 0;
  line-height: 1.2;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border: none;
  border-radius: 2rem;
  font-size: 1.1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.primary-btn {
  background: rgba(255, 255, 255, 0.95);
  color: #2c3e50;
}

.primary-btn:hover {
  background: white;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

.btn-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

/* Insights Section */
.insights-section {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 1.5rem;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.section-icon {
  width: 24px;
  height: 24px;
  color: #7ba3e3;
}

.section-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #2c3e50;
}

/* Loading & Empty States */
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
  color: #6c757d;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e9ecef;
  border-top-color: #7ba3e3;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-subtitle {
  font-size: 0.9rem;
  margin-top: 0.5rem;
  opacity: 0.7;
}

/* Entries Grid */
.entries-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow-y: auto;
  flex: 1;
  padding-right: 0.5rem;
}

/* Custom scrollbar for entries grid */
.entries-grid::-webkit-scrollbar {
  width: 6px;
}

.entries-grid::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 10px;
}

.entries-grid::-webkit-scrollbar-thumb {
  background: #7ba3e3;
  border-radius: 10px;
}

.entries-grid::-webkit-scrollbar-thumb:hover {
  background: #6a93d3;
}

.view-all-btn {
  width: 100%;
  margin-top: 1rem;
  padding: 0.75rem;
  border: 2px solid #7ba3e3;
  background: transparent;
  color: #7ba3e3;
  border-radius: 0.75rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.view-all-btn:hover {
  background: #7ba3e3;
  color: white;
}

/* Bottom Navigation */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 0.75rem 0;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem;
  color: #6c757d;
  text-decoration: none;
  font-size: 0.75rem;
  transition: color 0.3s ease;
  background: none;
  border: none;
  cursor: pointer;
}

.nav-item svg {
  width: 24px;
  height: 24px;
}

.nav-item.active {
  color: #7ba3e3;
}

.nav-item:hover {
  color: #7ba3e3;
}

/* Responsive */
@media (max-width: 640px) {
  .journal-home {
    padding: 1.5rem 1rem 5rem;
  }

  .welcome-message {
    font-size: 1.25rem;
  }

  .prompt-message {
    font-size: 1.75rem;
  }
}
</style>
