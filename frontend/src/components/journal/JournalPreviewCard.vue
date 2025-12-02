<template>
  <div class="journal-card" @click="$emit('click')">
    <div class="card-header">
      <h4 class="card-title">{{ displayTitle }}</h4>
      <span class="card-date">{{ formattedDate }}</span>
    </div>

    <p class="card-preview">{{ truncatedContent }}</p>

    <div class="card-footer">
      <MoodBadge v-if="entry.mood" :mood="entry.mood" />
      <span class="word-count">{{ wordCount }} words</span>
      <svg 
        v-if="entry.favorite === 1" 
        class="favorite-icon"
        viewBox="0 0 24 24" 
        fill="currentColor"
      >
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MoodBadge from './MoodBadge.vue'
import type { JournalEntry } from '../../types/journal'

interface Props {
  entry: JournalEntry
}

const props = defineProps<Props>()

defineEmits<{
  click: []
}>()

const displayTitle = computed(() => {
  return props.entry.title || 'Untitled Entry'
})

const truncatedContent = computed(() => {
  const maxLength = 120
  if (props.entry.content.length <= maxLength) {
    return props.entry.content
  }
  return props.entry.content.substring(0, maxLength) + '...'
})

const wordCount = computed(() => {
  return props.entry.content.trim().split(/\s+/).length
})

const formattedDate = computed(() => {
  const entryDate = new Date(props.entry.entry_date)
  const today = new Date()
  
  // Reset time to midnight for accurate day comparison
  today.setHours(0, 0, 0, 0)
  const entryDateMidnight = new Date(entryDate)
  entryDateMidnight.setHours(0, 0, 0, 0)
  
  const daysDiff = Math.floor((today.getTime() - entryDateMidnight.getTime()) / (1000 * 60 * 60 * 24))
  
  // Relative dates for recent entries
  if (daysDiff === 0) {
    return 'Today'
  } else if (daysDiff === 1) {
    return 'Yesterday'
  } else if (daysDiff > 1 && daysDiff <= 6) {
    return `${daysDiff} days ago`
  }
  
  // Absolute dates for older entries
  return entryDate.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: entryDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
  })
})
</script>

<style scoped>
.journal-card {
  background: rgba(255, 255, 255, 0.06);
  border-radius: 1.25rem;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(139, 92, 246, 0.15);
  backdrop-filter: blur(25px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: hidden;
}

.journal-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, 
    transparent, 
    rgba(139, 92, 246, 0.08), 
    transparent);
  transition: left 0.6s ease;
}

.journal-card:hover::before {
  left: 100%;
}

.journal-card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.35);
  border-color: rgba(139, 92, 246, 0.4);
  background: rgba(255, 255, 255, 0.08);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  gap: 1rem;
}

.card-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: -0.01em;
}

.card-date {
  font-size: 0.875rem;
  color: rgba(196, 181, 253, 0.75);
  white-space: nowrap;
  font-weight: 500;
}

.card-preview {
  margin: 0 0 1.25rem 0;
  color: rgba(255, 255, 255, 0.75);
  line-height: 1.6;
  font-size: 0.95rem;
  font-weight: 400;
}

.card-footer {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(139, 92, 246, 0.15);
}

.word-count {
  font-size: 0.875rem;
  color: rgba(196, 181, 253, 0.7);
  margin-left: auto;
  font-weight: 500;
}

.favorite-icon {
  width: 20px;
  height: 20px;
  color: rgba(239, 68, 68, 0.9);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  transition: all 0.3s ease;
}

.journal-card:hover .favorite-icon {
  color: rgba(239, 68, 68, 1);
  transform: scale(1.1);
}
</style>
