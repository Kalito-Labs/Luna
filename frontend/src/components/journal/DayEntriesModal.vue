<template>
  <transition name="modal-fade">
    <div v-if="isOpen" class="modal-overlay" @click="closeModal">
      <div class="modal-container" @click.stop>
        <!-- Header -->
        <header class="modal-header">
          <h3>{{ formattedDate }}</h3>
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
                <div v-if="entry.mood" class="mood-tag">
                  <span class="mood-emoji">{{ getMoodEmoji(entry.mood) }}</span>
                  <span class="mood-label">{{ entry.mood }}</span>
                </div>
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
import type { JournalEntry, MoodType } from '../../types/journal'

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

const truncateContent = (content: string, maxLength = 120): string => {
  if (content.length <= maxLength) return content
  return content.substring(0, maxLength) + '...'
}

const formatTime = (time: string): string => {
  // Convert 24h format to 12h format
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minutes} ${ampm}`
}

const getWordCount = (content: string): number => {
  return content.trim().split(/\s+/).length
}

const getMoodEmoji = (mood: MoodType): string => {
  const moodEmojis: Record<MoodType, string> = {
    happy: '😊',
    excited: '🎉',
    grateful: '🙏',
    relaxed: '😌',
    content: '😊',
    tired: '😴',
    unsure: '🤔',
    bored: '😑',
    anxious: '😰',
    angry: '😠',
    stressed: '😫',
    sad: '😢',
    desperate: '😭'
  }
  return moodEmojis[mood] || '😊'
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
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-radius: 1.5rem;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
  overflow: hidden;
}

/* Modal Header */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(59, 130, 246, 0.15);
  color: rgba(255, 255, 255, 0.95);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.close-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
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
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 1rem;
  padding: 1.25rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.entry-card:hover {
  background: rgba(15, 23, 42, 0.8);
  border-color: rgba(59, 130, 246, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
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
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.mood-tag {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  font-size: 0.85rem;
}

.mood-emoji {
  font-size: 1rem;
}

.mood-label {
  color: rgba(255, 255, 255, 0.8);
  text-transform: capitalize;
  font-weight: 500;
}

.word-count {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
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
  gap: 0.5rem;
  padding: 1rem;
  background: rgba(59, 130, 246, 0.2);
  border: 1px solid rgba(59, 130, 246, 0.5);
  color: rgba(255, 255, 255, 0.9);
  border-radius: 0.75rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-new-entry:hover {
  background: rgba(59, 130, 246, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
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
