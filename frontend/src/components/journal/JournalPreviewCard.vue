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
  const date = new Date(props.entry.entry_date)
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  })
})
</script>

<style scoped>
.journal-card {
  background: white;
  border-radius: 1rem;
  padding: 1.25rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e9ecef;
}

.journal-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #7ba3e3;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
  gap: 1rem;
}

.card-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-date {
  font-size: 0.875rem;
  color: #6c757d;
  white-space: nowrap;
}

.card-preview {
  margin: 0 0 1rem 0;
  color: #495057;
  line-height: 1.5;
  font-size: 0.95rem;
}

.card-footer {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.word-count {
  font-size: 0.875rem;
  color: #6c757d;
  margin-left: auto;
}

.favorite-icon {
  width: 18px;
  height: 18px;
  color: #ff6b6b;
}
</style>
