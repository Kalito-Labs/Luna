<template>
  <div :class="['mood-badge', moodClass]">
    <component :is="moodIcon" class="mood-icon" />
    <span class="mood-label">{{ moodLabel }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed, h } from 'vue'
import type { MoodType } from '../../types/journal'

interface Props {
  mood: MoodType
  showLabel?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showLabel: true
})

// Mood configuration
const moodConfig: Record<MoodType, { label: string; color: string; icon: string }> = {
  happy: { label: 'Happy', color: '#FFD700', icon: '😊' },
  excited: { label: 'Excited', color: '#FF69B4', icon: '🎉' },
  grateful: { label: 'Grateful', color: '#FFB6C1', icon: '🙏' },
  relaxed: { label: 'Relaxed', color: '#87CEEB', icon: '🌴' },
  content: { label: 'Content', color: '#90EE90', icon: '😌' },
  tired: { label: 'Tired', color: '#D3D3D3', icon: '😴' },
  unsure: { label: 'Unsure', color: '#DDA0DD', icon: '🤔' },
  bored: { label: 'Bored', color: '#C0C0C0', icon: '😑' },
  anxious: { label: 'Anxious', color: '#FFA500', icon: '😰' },
  angry: { label: 'Angry', color: '#DC143C', icon: '😠' },
  stressed: { label: 'Stressed', color: '#FF6347', icon: '😫' },
  sad: { label: 'Sad', color: '#6495ED', icon: '😢' },
  desperate: { label: 'Desperate', color: '#8B0000', icon: '😭' }
}

const config = computed(() => moodConfig[props.mood])

const moodLabel = computed(() => config.value.label)

const moodClass = computed(() => `mood-${props.mood}`)

const moodIcon = computed(() => {
  // Return a functional component that renders the emoji
  return () => h('span', { class: 'emoji-icon' }, config.value.icon)
})
</script>

<style scoped>
.mood-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  background: rgba(123, 163, 227, 0.1);
  color: #2c3e50;
  border: 1px solid rgba(123, 163, 227, 0.2);
}

.mood-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.emoji-icon) {
  font-size: 14px;
}

.mood-label {
  font-size: 0.8125rem;
}

/* Mood-specific colors */
.mood-happy {
  background: rgba(255, 215, 0, 0.15);
  border-color: rgba(255, 215, 0, 0.3);
  color: #d4af00;
}

.mood-excited {
  background: rgba(255, 105, 180, 0.15);
  border-color: rgba(255, 105, 180, 0.3);
  color: #e63994;
}

.mood-grateful {
  background: rgba(255, 182, 193, 0.15);
  border-color: rgba(255, 182, 193, 0.3);
  color: #d97b8a;
}

.mood-relaxed {
  background: rgba(135, 206, 235, 0.15);
  border-color: rgba(135, 206, 235, 0.3);
  color: #5b96b8;
}

.mood-content {
  background: rgba(144, 238, 144, 0.15);
  border-color: rgba(144, 238, 144, 0.3);
  color: #5ca65c;
}

.mood-tired {
  background: rgba(211, 211, 211, 0.15);
  border-color: rgba(211, 211, 211, 0.3);
  color: #6c757d;
}

.mood-unsure {
  background: rgba(221, 160, 221, 0.15);
  border-color: rgba(221, 160, 221, 0.3);
  color: #a173a1;
}

.mood-bored {
  background: rgba(192, 192, 192, 0.15);
  border-color: rgba(192, 192, 192, 0.3);
  color: #6c757d;
}

.mood-anxious {
  background: rgba(255, 165, 0, 0.15);
  border-color: rgba(255, 165, 0, 0.3);
  color: #cc8400;
}

.mood-angry {
  background: rgba(220, 20, 60, 0.15);
  border-color: rgba(220, 20, 60, 0.3);
  color: #b01030;
}

.mood-stressed {
  background: rgba(255, 99, 71, 0.15);
  border-color: rgba(255, 99, 71, 0.3);
  color: #cc4f3a;
}

.mood-sad {
  background: rgba(100, 149, 237, 0.15);
  border-color: rgba(100, 149, 237, 0.3);
  color: #4a74b0;
}

.mood-desperate {
  background: rgba(139, 0, 0, 0.15);
  border-color: rgba(139, 0, 0, 0.3);
  color: #8b0000;
}
</style>
