<template>
  <transition name="modal-fade">
    <div v-if="isOpen" class="modal-overlay" @click="closeModal">
      <div class="modal-container" @click.stop>
        <!-- Header -->
        <header class="modal-header">
          <h3>{{ formattedDateWithCount }}</h3>
          <button @click="closeModal" class="close-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </header>

        <!-- Entries List -->
        <div class="modal-body">
          <div v-if="entries.length === 0" class="empty-state">
            <p>No entries for this day</p>
          </div>

          <div v-else class="entries-list">
            <div
              v-for="entry in entries"
              :key="entry.id"
              class="entry-card"
              @click="viewEntry(entry.id)"
            >
              <div class="entry-header">
                <h4 class="entry-title">
                  {{ entry.title || 'Untitled Entry' }}
                </h4>
                <span v-if="entry.entry_time" class="entry-time">
                  {{ formatTime(entry.entry_time) }}
                </span>
              </div>

              <p class="entry-preview">
                {{ truncateContent(entry.content) }}
              </p>

              <div class="entry-footer">
                <MoodBadge v-if="entry.mood" :mood="entry.mood" />
                <span class="word-count">{{ getWordCount(entry.content) }} words</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <footer class="modal-footer">
          <button @click="createNewEntry" class="btn-new-entry">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New Entry for This Day
          </button>
        </footer>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import MoodBadge from './MoodBadge.vue'
import type { JournalEntry } from '../../types/journal'

const router = useRouter()

interface Props {
  isOpen: boolean
  date: string | null
  entries: JournalEntry[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

// Computed
const formattedDate = computed(() => {
  if (!props.date) return ''
  const date = new Date(props.date)
  return date.toLocaleDateString('default', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

const formattedDateWithCount = computed(() => {
  const count = props.entries.length
  const entryText = count === 1 ? 'entry' : 'entries'
  return `${count} ${entryText} on ${formattedDate.value}`
})

// Methods
const closeModal = () => {
  emit('close')
}

const viewEntry = (entryId: string) => {
  router.push(`/journal/${entryId}/edit`)
}

const createNewEntry = () => {
  // Navigate to new entry with pre-filled date
  router.push({
    path: '/journal/new',
    query: { date: props.date || undefined }
  })
}

const truncateContent = (content: string, maxLength = 200): string => {
  if (content.length <= maxLength) return content
  return content.substring(0, maxLength) + '...'
}

const formatTime = (time: string): string => {
  // Convert 24h format to 12h format
  const [hours, minutes] = time.split(':')
  if (!hours || !minutes) return time
  const hour = parseInt(hours, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minutes} ${ampm}`
}

const getWordCount = (content: string): number => {
  return content.trim().split(/\s+/).length
}
</script>

<style scoped>
/* Modal Overlay */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

/* Modal Container */
.modal-container {
  background: rgba(30, 41, 59, 0.95);
  border: 1px solid rgba(139, 92, 246, 0.2);
  backdrop-filter: blur(30px);
  border-radius: 1.75rem;
  max-width: 650px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.6);
  overflow: hidden;
  position: relative;
}

.modal-container::before {
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

/* Modal Header */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.75rem;
  border-bottom: 1px solid rgba(139, 92, 246, 0.2);
  background: linear-gradient(135deg, 
    rgba(139, 92, 246, 0.12) 0%, 
    rgba(124, 58, 237, 0.08) 100%);
  color: rgba(255, 255, 255, 0.95);
  position: relative;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.close-btn {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  padding: 0.75rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.close-btn svg {
  width: 20px;
  height: 20px;
}

/* Modal Body */
.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: rgba(255, 255, 255, 0.6);
}

.entries-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Entry Card */
.entry-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(139, 92, 246, 0.15);
  backdrop-filter: blur(20px);
  border-radius: 1.25rem;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.entry-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, 
    transparent, 
    rgba(139, 92, 246, 0.1), 
    transparent);
  transition: left 0.5s ease;
}

.entry-card:hover::before {
  left: 100%;
}

.entry-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(139, 92, 246, 0.4);
  transform: translateY(-3px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
}

.entry-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 0.75rem;
  gap: 1rem;
}

.entry-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  flex: 1;
}

.entry-time {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
  white-space: nowrap;
}

.entry-preview {
  margin: 0 0 1rem 0;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;
  font-size: 0.95rem;
}

.entry-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(139, 92, 246, 0.15);
}

.word-count {
  font-size: 0.85rem;
  color: rgba(196, 181, 253, 0.7);
  font-weight: 500;
}

/* Modal Footer */
.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(15, 23, 42, 0.6);
}

.btn-new-entry {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1.25rem;
  background: linear-gradient(135deg, 
    rgba(139, 92, 246, 0.2) 0%, 
    rgba(124, 58, 237, 0.25) 100%);
  border: 1px solid rgba(139, 92, 246, 0.4);
  color: rgba(255, 255, 255, 0.95);
  border-radius: 1rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
  letter-spacing: 0.01em;
}

.btn-new-entry:hover {
  background: linear-gradient(135deg, 
    rgba(139, 92, 246, 0.35) 0%, 
    rgba(124, 58, 237, 0.4) 100%);
  border-color: rgba(139, 92, 246, 0.6);
  transform: translateY(-3px);
  box-shadow: 0 12px 32px rgba(139, 92, 246, 0.4);
}

.btn-new-entry svg {
  width: 20px;
  height: 20px;
}

/* Transitions */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .modal-container,
.modal-fade-leave-active .modal-container {
  transition: transform 0.3s ease;
}

.modal-fade-enter-from .modal-container {
  transform: scale(0.9) translateY(-20px);
}

.modal-fade-leave-to .modal-container {
  transform: scale(0.9) translateY(20px);
}

/* Scrollbar Styling */
.modal-body::-webkit-scrollbar {
  width: 10px;
}

.modal-body::-webkit-scrollbar-track {
  background: rgba(30, 30, 35, 0.4);
  border-radius: 10px;
}

.modal-body::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, rgba(60, 60, 70, 0.9), rgba(80, 80, 90, 0.9));
  border-radius: 10px;
  border: 2px solid transparent;
  background-clip: padding-box;
  transition: all 0.3s ease;
}

.modal-body::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, rgba(90, 90, 100, 0.95), rgba(110, 110, 120, 0.95));
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.3);
}

/* Responsive */
@media (max-width: 640px) {
  .modal-container {
    max-height: 95vh;
    border-radius: 1rem 1rem 0 0;
    margin-top: auto;
  }

  .entry-header {
    flex-direction: column;
    align-items: start;
  }

  .entry-footer {
    flex-direction: column;
    align-items: start;
  }
}
</style>
