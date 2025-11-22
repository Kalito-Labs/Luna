<template>
  <div class="journal-home">
    <!-- Header Section with Hamburger Menu -->
    <header class="journal-header">
      <div class="header-top">
        <HamburgerMenu />
      </div>
      <div class="header-content">
        <h1 class="welcome-message">Welcome back, {{ patientName }} ✨</h1>
        <h2 class="prompt-message">What's on your mind today?</h2>
        <p class="header-subtitle">Take a moment to reflect and share your thoughts</p>
      </div>
    </header>

    <!-- Quick Stats Cards -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon">📝</div>
        <div class="stat-content">
          <span class="stat-number">{{ recentEntries.length }}</span>
          <span class="stat-label">Today's entries</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🌟</div>
        <div class="stat-content">
          <span class="stat-number">7</span>
          <span class="stat-label">Day streak</span>
        </div>
      </div>
    </div>

    <!-- Primary Action Buttons -->
    <div class="action-buttons">
      <button @click="goToInsights" class="action-btn secondary-btn">
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 3v18h18M7 16l4-4 4 4 6-6" />
        </svg>
        <span>View Insights</span>
      </button>
    </div>

    <!-- Floating Action Button -->
    <button @click="startNewEntry" class="fab">
      <svg class="fab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M12 5v14M5 12h14" />
      </svg>
      <span class="fab-tooltip">Start new entry</span>
    </button>

    <!-- Insights Section -->
    <section class="insights-section">
      <div class="section-header">
        <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 3v18h18M7 16l4-4 4 4 6-6" />
        </svg>
        <h3>Insights</h3>
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
        <div class="empty-illustration">
          <div class="empty-icon">📖</div>
          <div class="empty-sparkles">✨</div>
        </div>
        <h3>Your journal awaits</h3>
        <p>Start your first entry to begin tracking your thoughts and moods</p>
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
    const response = await fetch(apiUrl(`/api/journal/patient/${patientId.value}?startDate=${today}&endDate=${today}`))
    
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
  background: linear-gradient(135deg, 
    rgba(15, 23, 42, 0.98) 0%, 
    rgba(30, 41, 59, 0.95) 50%,
    rgba(67, 56, 202, 0.1) 100%);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  color: rgba(255, 255, 255, 0.92);
  position: relative;
  overflow-x: hidden;
}

/* Enhanced Header */
.journal-header {
  margin-bottom: 0.5rem;
}

.header-top {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 1rem;
}

.header-content {
  text-align: center;
  animation: fadeInUp 0.6s ease-out;
}

.welcome-message {
  font-size: 1.75rem;
  font-weight: 300;
  margin: 0 0 0.75rem 0;
  color: rgba(255, 255, 255, 0.85);
  letter-spacing: -0.02em;
}

.prompt-message {
  font-size: 2.25rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  line-height: 1.15;
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.98) 0%, 
    rgba(196, 181, 253, 0.9) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-subtitle {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
  font-weight: 400;
  letter-spacing: 0.01em;
}

/* Quick Stats Cards */
.stats-cards {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.stat-card {
  flex: 1;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(139, 92, 246, 0.2);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.stat-card:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(139, 92, 246, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(139, 92, 246, 0.15);
}

.stat-icon {
  font-size: 1.5rem;
  filter: grayscale(20%);
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.stat-number {
  font-size: 1.25rem;
  font-weight: 700;
  color: rgba(196, 181, 253, 0.95);
}

.stat-label {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 500;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.875rem 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(20px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.action-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, 
    transparent, 
    rgba(255, 255, 255, 0.1), 
    transparent);
  transition: left 0.6s ease;
}

.action-btn:hover::before {
  left: 100%;
}

.secondary-btn {
  color: rgba(129, 140, 248, 0.9);
  border-color: rgba(129, 140, 248, 0.3);
  background: rgba(129, 140, 248, 0.08);
}

.secondary-btn:hover {
  background: rgba(129, 140, 248, 0.15);
  border-color: rgba(129, 140, 248, 0.5);
  transform: translateY(-3px);
  box-shadow: 0 12px 40px rgba(129, 140, 248, 0.25);
  color: rgba(129, 140, 248, 1);
}

.btn-icon {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

/* Floating Action Button */
.fab {
  position: fixed;
  bottom: 3rem;
  right: 3rem;
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, 
    rgba(139, 92, 246, 0.9) 0%, 
    rgba(124, 58, 237, 0.95) 100%);
  border: none;
  border-radius: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 32px rgba(139, 92, 246, 0.4);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 100;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.fab:hover {
  transform: translateY(-4px) scale(1.05);
  box-shadow: 0 16px 48px rgba(139, 92, 246, 0.6);
  background: linear-gradient(135deg, 
    rgba(139, 92, 246, 1) 0%, 
    rgba(124, 58, 237, 1) 100%);
}

.fab:hover .fab-tooltip {
  opacity: 1;
  transform: translateX(-50%) translateY(-8px);
}

.fab:active {
  transform: translateY(-2px) scale(1.02);
}

.fab-icon {
  width: 28px;
  height: 28px;
  color: white;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.fab-tooltip {
  position: absolute;
  bottom: calc(100% + 1rem);
  left: 50%;
  transform: translateX(-50%) translateY(4px);
  background: rgba(30, 30, 40, 0.95);
  color: white;
  padding: 0.5rem 0.875rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
  opacity: 0;
  transition: all 0.3s ease;
  pointer-events: none;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* Enhanced Insights Section */
.insights-section {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(139, 92, 246, 0.15);
  backdrop-filter: blur(30px);
  border-radius: 24px;
  padding: 1.75rem;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.15);
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
  position: relative;
}

.insights-section::before {
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
  border-radius: 2px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.section-icon {
  width: 24px;
  height: 24px;
  color: rgba(139, 92, 246, 0.8);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.section-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.92);
  letter-spacing: -0.01em;
}

/* Enhanced Loading & Empty States */
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
  flex: 1;
}

/* New Loading Animation */
.loading-animation {
  margin-bottom: 2rem;
}

.loading-dots {
  display: flex;
  gap: 0.5rem;
}

.dot {
  width: 12px;
  height: 12px;
  background: linear-gradient(135deg, 
    rgba(139, 92, 246, 0.8), 
    rgba(196, 181, 253, 0.6));
  border-radius: 50%;
  animation: loadingPulse 1.5s ease-in-out infinite;
}

.dot:nth-child(2) {
  animation-delay: 0.2s;
}

.dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes loadingPulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.3);
    opacity: 1;
  }
}

/* Enhanced Empty State */
.empty-illustration {
  position: relative;
  margin-bottom: 2rem;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  filter: grayscale(10%);
  animation: float 3s ease-in-out infinite;
}

.empty-sparkles {
  position: absolute;
  top: -10px;
  right: -10px;
  font-size: 1.5rem;
  animation: sparkle 2s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

@keyframes sparkle {
  0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.7; }
  50% { transform: scale(1.2) rotate(180deg); opacity: 1; }
}

.empty-state h3 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  color: rgba(255, 255, 255, 0.9);
}

.empty-state p {
  font-size: 1rem;
  margin: 0 0 2rem 0;
  color: rgba(255, 255, 255, 0.6);
  max-width: 280px;
  line-height: 1.5;
}

.empty-cta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  background: linear-gradient(135deg, 
    rgba(139, 92, 246, 0.2), 
    rgba(124, 58, 237, 0.3));
  color: rgba(196, 181, 253, 0.95);
  border: 1px solid rgba(139, 92, 246, 0.4);
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.empty-cta:hover {
  background: linear-gradient(135deg, 
    rgba(139, 92, 246, 0.3), 
    rgba(124, 58, 237, 0.4));
  border-color: rgba(139, 92, 246, 0.6);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.3);
  color: white;
}

.empty-cta svg {
  width: 18px;
  height: 18px;
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

/* Enhanced scrollbar */
.entries-grid::-webkit-scrollbar {
  width: 8px;
}

.entries-grid::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}

.entries-grid::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, 
    rgba(139, 92, 246, 0.6), 
    rgba(124, 58, 237, 0.7));
  border-radius: 10px;
  transition: all 0.3s ease;
}

.entries-grid::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, 
    rgba(139, 92, 246, 0.8), 
    rgba(124, 58, 237, 0.9));
}

.view-all-btn {
  width: 100%;
  margin-top: 1.25rem;
  padding: 0.875rem;
  border: 1px solid rgba(129, 140, 248, 0.4);
  background: rgba(129, 140, 248, 0.1);
  color: rgba(129, 140, 248, 0.95);
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.view-all-btn:hover {
  background: rgba(129, 140, 248, 0.2);
  border-color: rgba(129, 140, 248, 0.6);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(129, 140, 248, 0.3);
}

/* Animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Enhanced Responsive */
@media (max-width: 640px) {
  .journal-home {
    width: 100vw;
    max-width: 100vw;
    margin: 0 auto;
    padding: 2rem;
  }

  .header-content {
    text-align: center;
  }

  .welcome-message {
    font-size: 1.5rem;
  }

  .prompt-message {
    font-size: 1.875rem;
  }

  .stats-cards {
    flex-direction: column;
    gap: 0.75rem;
  }

  .stat-card {
    justify-content: center;
  }

  .fab {
    bottom: 1.5rem;
    right: 1.5rem;
    width: 56px;
    height: 56px;
  }

  .fab-icon {
    width: 24px;
    height: 24px;
  }

  .insights-section {
    padding: 1.25rem;
  }

  .empty-state {
    padding: 2rem 1rem;
  }

  .empty-icon {
    font-size: 3rem;
  }
}

@media (min-width: 768px) {
  .journal-home {
    width: 100vw;
    max-width: 100vw;
    margin: 0 auto;
    padding: 2rem;
  }

  .action-buttons {
    flex-direction: row;
  }

  .stats-cards {
    margin-bottom: 1rem;
  }
}
</style>
