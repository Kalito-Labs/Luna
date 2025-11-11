<template>
  <Transition name="dialog" appear>
    <div v-if="show" class="dialog-overlay" @click.self="onCancel">
      <div class="dialog-content" @click.stop>
        <div class="dialog-header">
          <h3>{{ title }}</h3>
        </div>
        <div class="dialog-body">
          <p>{{ message }}</p>
        </div>
        <div class="dialog-actions">
          <button 
            class="dialog-btn dialog-btn-cancel" 
            @click="onCancel"
          >
            {{ cancelText }}
          </button>
          <button 
            class="dialog-btn dialog-btn-confirm" 
            @click="onConfirm"
          >
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
interface Props {
  show: boolean
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
}

interface Emits {
  (e: 'confirm'): void
  (e: 'cancel'): void
}

withDefaults(defineProps<Props>(), {
  title: 'Confirm',
  confirmText: 'OK',
  cancelText: 'Cancel'
})

const emit = defineEmits<Emits>()

function onConfirm() {
  emit('confirm')
}

function onCancel() {
  emit('cancel')
}
</script>

<style scoped>
/* ============================================================================
   Modern Modal Dialog Component
   ============================================================================ */

/* === Transitions === */
.dialog-enter-active,
.dialog-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}

.dialog-enter-from .dialog-content,
.dialog-leave-to .dialog-content {
  transform: scale(0.95) translateY(-10px);
  opacity: 0;
}

.dialog-enter-active .dialog-content,
.dialog-leave-active .dialog-content {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

/* === Overlay === */
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 1rem;
}

/* === Dialog Container === */
.dialog-content {
  background: white;
  border-radius: 1rem;
  width: 100%;
  max-width: 420px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(0, 0, 0, 0.05);
  transform: translateZ(0);
}

/* === Header === */
.dialog-header {
  padding: 1.5rem 1.5rem 0.5rem;
  text-align: center;
}

.dialog-header h3 {
  margin: 0;
  color: #111827;
  font-size: 1.125rem;
  font-weight: 600;
  line-height: 1.5;
}

/* === Body === */
.dialog-body {
  padding: 0.5rem 1.5rem 1.5rem;
}

.dialog-body p {
  margin: 0;
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.6;
  text-align: center;
}

/* === Actions === */
.dialog-actions {
  padding: 1rem 1.5rem 1.5rem;
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

/* === Buttons === */
.dialog-btn {
  padding: 0.625rem 1rem;
  border: 1px solid transparent;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 4rem;
  outline: none;
  position: relative;
}

.dialog-btn:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Cancel Button */
.dialog-btn-cancel {
  background: #f9fafb;
  border-color: #d1d5db;
  color: #374151;
}

.dialog-btn-cancel:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.dialog-btn-cancel:active {
  background: #e5e7eb;
  transform: scale(0.98);
}

/* Confirm Button */
.dialog-btn-confirm {
  background: #3b82f6;
  color: white;
}

.dialog-btn-confirm:hover {
  background: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.dialog-btn-confirm:active {
  background: #1d4ed8;
  transform: scale(0.98);
}

/* === Responsive === */
@media (max-width: 480px) {
  .dialog-overlay {
    padding: 1rem;
  }

  .dialog-content {
    max-width: 100%;
  }
  
  .dialog-actions {
    flex-direction: column-reverse;
    gap: 0.5rem;
  }
  
  .dialog-btn {
    width: 100%;
    justify-content: center;
  }
}

/* === Dark Mode Support === */
@media (prefers-color-scheme: dark) {
  .dialog-content {
    background: #0e131ac5;
    box-shadow: 
      0 25px 50px -12px rgba(0, 0, 0, 0.5),
      0 0 0 1px rgba(255, 255, 255, 0.1);
  }

  .dialog-header h3 {
    color: #f9fafb;
  }

  .dialog-body p {
    color: #9ca3af;
  }

  .dialog-btn-cancel {
    background: #374151;
    border-color: #4b5563;
    color: #d1d5db;
  }

  .dialog-btn-cancel:hover {
    background: #4b5563;
    border-color: #6b7280;
  }

  .dialog-btn-cancel:active {
    background: #6b7280;
  }
}
</style>