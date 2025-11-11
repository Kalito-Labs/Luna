<!-- PersonaEditModal.vue - Shared modal for creating/editing personas -->
<template>
  <div class="modal-overlay" v-if="show">
    <div class="modal modal-wide">
      <!-- Modal Header -->
      <div class="modal-header">
        <h2>{{ isEditing ? 'Edit Persona' : 'Create New Persona' }}</h2>
        <button class="close-button" @click="$emit('close')">✕</button>
      </div>

      <!-- Modal Content -->
      <div class="modal-content">
        <form @submit.prevent="handleSubmit">
          <!-- Persona Details -->
          <div class="form-section">
            <h3>Persona Details</h3>
            
            <div class="form-row">
              <div class="form-group">
                <label for="persona-name">Name *</label>
                <input
                  id="persona-name"
                  v-model.trim="formData.name"
                  type="text"
                  placeholder="Enter persona name"
                  required
                  class="form-input"
                  :class="{ error: errors.name }"
                />
                <span v-if="errors.name" class="error-message">{{ errors.name }}</span>
              </div>

              <div class="form-group">
                <label for="persona-icon">Icon</label>
                <input
                  id="persona-icon"
                  v-model.trim="formData.icon"
                  type="text"
                  placeholder="🤖"
                  class="form-input"
                  maxlength="2"
                />
              </div>
            </div>

            <div class="form-group">
              <label for="persona-category">Category *</label>
              <select
                id="persona-category"
                v-model="formData.category"
                class="form-select"
                required
              >
                <option value="cloud">🚀 Cloud Models</option>
                <option value="local">⚡ Local Models</option>
              </select>
            </div>

            <div class="form-group">
              <label for="persona-description">Description</label>
              <textarea
                id="persona-description"
                v-model.trim="formData.description"
                placeholder="Brief description of this persona's purpose"
                class="form-textarea"
                rows="2"
              />
            </div>
          </div>

          <!-- System Prompt -->
          <div class="form-section">
            <h3>System Prompt *</h3>
            <div class="form-group">
              <textarea
                id="persona-prompt"
                v-model.trim="formData.prompt"
                placeholder="Enter the system prompt that defines this persona's behavior..."
                class="form-textarea prompt-textarea"
                rows="8"
                required
                :class="{ error: errors.prompt }"
              />
              <span v-if="errors.prompt" class="error-message">{{ errors.prompt }}</span>
              <div class="character-count">{{ formData.prompt.length }} characters</div>
            </div>
          </div>

          <!-- Model Settings -->
          <div class="form-section">
            <h3>Model Settings</h3>
            <p class="section-description">
              Configure how the AI model behaves with this persona. Leave empty to use system defaults.
            </p>

            <!-- Temperature -->
            <div class="setting-group">
              <div class="setting-header">
                <label>Temperature</label>
                <span class="setting-value">{{ formData.temperature ?? 'Default' }}</span>
              </div>
              <div class="glass-slider">
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  v-model.number="formData.temperature"
                  class="slider"
                />
                <div class="slider-track">
                  <div
                    class="slider-fill"
                    :style="{ width: `${((formData.temperature ?? 0.7) / 2) * 100}%` }"
                  ></div>
                </div>
              </div>
              <div class="setting-description">
                Controls randomness. Lower = more focused, Higher = more creative
              </div>
            </div>

            <!-- Max Tokens -->
            <div class="setting-group">
              <div class="setting-header">
                <label>Max Tokens</label>
                <span class="setting-value">{{ formData.maxTokens ?? 'Default' }}</span>
              </div>
              <div class="glass-slider">
                <input
                  type="range"
                  min="1"
                  max="4000"
                  step="100"
                  v-model.number="formData.maxTokens"
                  class="slider"
                />
                <div class="slider-track">
                  <div
                    class="slider-fill"
                    :style="{ width: `${((formData.maxTokens ?? 1000) / 4000) * 100}%` }"
                  ></div>
                </div>
              </div>
              <div class="setting-description">
                Maximum length of the response
              </div>
            </div>

            <!-- Top P -->
            <div class="setting-group">
              <div class="setting-header">
                <label>Top P</label>
                <span class="setting-value">{{ formData.topP ?? 'Default' }}</span>
              </div>
              <div class="glass-slider">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  v-model.number="formData.topP"
                  class="slider"
                />
                <div class="slider-track">
                  <div
                    class="slider-fill"
                    :style="{ width: `${((formData.topP ?? 0.9) / 1) * 100}%` }"
                  ></div>
                </div>
              </div>
              <div class="setting-description">
                Nucleus sampling. Controls diversity of word choices
              </div>
            </div>

            <!-- Repeat Penalty -->
            <div class="setting-group">
              <div class="setting-header">
                <label>Repeat Penalty</label>
                <span class="setting-value">{{ formData.repeatPenalty ?? 'Default' }}</span>
              </div>
              <div class="glass-slider">
                <input
                  type="range"
                  min="0.8"
                  max="1.5"
                  step="0.05"
                  v-model.number="formData.repeatPenalty"
                  class="slider"
                />
                <div class="slider-track">
                  <div
                    class="slider-fill"
                    :style="{ width: `${(((formData.repeatPenalty ?? 1.1) - 0.8) / 0.7) * 100}%` }"
                  ></div>
                </div>
              </div>
              <div class="setting-description">
                Penalizes repetition. Higher = less repetitive responses
              </div>
            </div>
          </div>

          <!-- Modal Actions (inside form so Enter submits) -->
          <div class="form-actions">
            <button type="button" class="secondary-button" @click="$emit('close')">
              Cancel
            </button>
            <button
              type="submit"
              class="primary-button"
              :disabled="submitting || !isFormValid"
            >
              {{ submitting ? 'Saving...' : (isEditing ? 'Update Persona' : 'Create Persona') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import type { Persona, PersonaCategory } from '../../../../backend/types/personas'

// Props
const props = defineProps<{
  show: boolean
  isEditing: boolean
  editingPersona?: Persona | null
}>()

// Emits
const emit = defineEmits<{
  close: []
  save: [personaData: {
    name: string
    icon: string
    category: PersonaCategory
    description: string
    prompt: string
    settings?: Partial<{
      temperature: number
      maxTokens: number
      topP: number
      repeatPenalty: number
    }>
  }]
}>()

// State
const submitting = ref(false)

// Form data
const formData = reactive({
  name: '',
  icon: '🤖',
  category: 'cloud' as PersonaCategory,
  description: '',
  prompt: '',
  temperature: null as number | null,
  maxTokens: null as number | null,
  topP: null as number | null,
  repeatPenalty: null as number | null,
})

// Validation
const errors = reactive({
  name: '',
  prompt: ''
})

// Computed
const isFormValid = computed(() => {
  return Boolean(formData.name.trim() && formData.prompt.trim() && !errors.name && !errors.prompt)
})

// Functions
function validateForm() {
  errors.name = ''
  errors.prompt = ''
  if (!formData.name.trim()) errors.name = 'Name is required'
  if (!formData.prompt.trim()) errors.prompt = 'System prompt is required'
}

function resetForm() {
  Object.assign(formData, {
    name: '',
    icon: '🤖',
    category: 'cloud' as PersonaCategory,
    description: '',
    prompt: '',
    temperature: null as number | null,
    maxTokens: null as number | null,
    topP: null as number | null,
    repeatPenalty: null as number | null,
  })
  errors.name = ''
  errors.prompt = ''
}

async function handleSubmit() {
  validateForm()
  if (!isFormValid.value) return

  submitting.value = true
  try {
    // Build sparse settings object (only include explicitly set values)
    const settings: Record<string, number> = {}
    if (formData.temperature !== null) settings.temperature = formData.temperature
    if (formData.maxTokens !== null)  settings.maxTokens  = formData.maxTokens
    if (formData.topP !== null)       settings.topP       = formData.topP
    if (formData.repeatPenalty !== null) settings.repeatPenalty = formData.repeatPenalty

    const personaData = {
      name: formData.name.trim(),
      icon: formData.icon || '🤖',
      category: formData.category,
      description: formData.description.trim(),
      prompt: formData.prompt.trim(),
      ...(Object.keys(settings).length > 0 && { settings })
    }

    emit('save', personaData)
  } catch (error) {
    console.error('Error submitting form:', error)
  } finally {
    submitting.value = false
  }
}

// Watchers
watch(() => props.show, (newShow) => {
  if (newShow) {
    if (props.isEditing && props.editingPersona) {
      const p = props.editingPersona
      Object.assign(formData, {
        name: p.name,
        icon: p.icon || '🤖',
        category: (p.category || 'cloud') as PersonaCategory,
        description: p.description || '',
        prompt: p.prompt,
        temperature: p.settings?.temperature ?? null,
        maxTokens: p.settings?.maxTokens ?? null,
        topP: p.settings?.topP ?? null,
        repeatPenalty: p.settings?.repeatPenalty ?? null,
      })
    } else {
      resetForm()
    }
  }
})
</script> 


<style scoped>
/* ================================
   PersonaEditModal — Desktop-First (Electron)
   Heavily tuned for large screens, mouse/keyboard, and frameless windows
================================== */

/* Overlay */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(10, 12, 16, 0.72);
  backdrop-filter: blur(6px) saturate(115%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
}

/* Modal Shell */
.modal {
  --surface: var(--bg-main);
  --panel: var(--bg-panel);
  --glass: var(--bg-glass);
  --ring: rgba(74, 144, 226, 0.35);

  background: var(--surface);
  border: var(--border);
  border-radius: 12px;
  width: 1040px;                 /* Desktop-fixed width for predictable layout */
  max-width: calc(100vw - 120px);
  max-height: 85vh;              /* Keep within desktop viewport */
  box-shadow: var(--shadow-strong);
  display: flex;
  flex-direction: column;
  overflow: hidden;              /* Header/actions pinned; content scrolls */
}

/* Optional class already used in template */
.modal.modal-wide {
  width: 1160px;                 /* Wider variant if desired by caller */
  max-width: calc(100vw - 96px);
}

/* Header (Electron feel: draggable) */
.modal-header {
  -webkit-app-region: drag;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.06));
  border-bottom: var(--border);
}

.modal-header h2 {
  margin: 0;
  color: var(--text-heading);
  font-size: 18px;
  letter-spacing: 0.2px;
  font-weight: 600;
}

/* Close Button (non-draggable region) */
.close-button {
  -webkit-app-region: no-drag;
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-muted);
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 8px;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease, transform 0.06s ease;
}

.close-button:hover {
  background: var(--panel);
  color: var(--text-main);
  border-color: var(--panel);
  transform: translateY(-1px);
}

.close-button:active {
  transform: translateY(0);
}

/* Scrollable Content */
.modal-content {
  padding: 18px;
  overflow: auto;
  overscroll-behavior: contain;
}

/* Desktop Scrollbar (WebKit + Firefox) */
.modal-content::-webkit-scrollbar {
  width: 12px;
}
.modal-content::-webkit-scrollbar-track {
  background: transparent;
}
.modal-content::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.12);
  border: 3px solid transparent;
  background-clip: padding-box;
  border-radius: 8px;
}
.modal-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255,255,255,0.18);
  border: 3px solid transparent;
}
.modal-content {
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.18) transparent;
}

/* Sections */
.form-section {
  padding: 14px 12px 18px 12px;
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(255,255,255,0.015), rgba(0,0,0,0.04));
  margin-bottom: 16px;
}

.form-section h3 {
  color: var(--text-heading);
  margin: 0 0 10px 0;
  font-size: 15px;
  font-weight: 600;
}

.section-description {
  color: var(--text-muted);
  margin: 0 0 12px 0;
  font-size: 13px;
}

/* Layout: Desktop grid */
.form-row {
  display: grid;
  grid-template-columns: 2fr 1fr; /* Name grows; Icon compact */
  gap: 14px;
}

/* Groups */
.form-group {
  margin-bottom: 12px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  color: var(--text-main);
  font-size: 13px;
  font-weight: 600;
}

/* Inputs */
.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
  background: var(--glass);
  color: var(--text-main);
  font-size: 14px;
  line-height: 1.25;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.2s ease, transform 0.02s ease;
}

.form-select {
  height: 40px;
}

.form-input {
  height: 40px;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--accent-blue);
  box-shadow: 0 0 0 3px var(--ring);
  background: color-mix(in oklab, var(--glass) 85%, white 15%);
}

.form-input:hover,
.form-select:hover,
.form-textarea:hover {
  border-color: rgba(255,255,255,0.12);
}

.form-input.error,
.form-textarea.error {
  border-color: var(--led-red);
  box-shadow: 0 0 0 3px rgba(255, 82, 82, 0.15);
}

.error-message {
  color: var(--led-red);
  font-size: 12px;
  margin-top: 6px;
  display: block;
}

/* Typing comfort & selection */
.form-textarea {
  min-height: 88px;
  resize: vertical;
}
.prompt-textarea {
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.35;
  min-height: 200px;
}

::selection {
  background: rgba(74, 144, 226, 0.28);
}

/* Character counter */
.character-count {
  text-align: right;
  color: var(--text-muted);
  font-size: 12px;
  margin-top: 6px;
}

/* Settings Grid (desktop: two-up where space allows) */
.setting-group {
  margin-bottom: 16px;
}
@container modal-content (min-width: 840px) {
  .settings-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }
}

/* Setting header/value */
.setting-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.setting-header label {
  color: var(--text-main);
  font-weight: 600;
  font-size: 13px;
  margin: 0;
}
.setting-value {
  color: var(--accent-blue);
  font-weight: 700;
  font-size: 12px;
}

/* Desktop Range (Glass Slider) */
.glass-slider {
  position: relative;
  margin-bottom: 6px;
}

.slider {
  width: 100%;
  height: 28px;
  appearance: none;
  background: transparent;
  cursor: pointer;
  position: relative;
  z-index: 2;
}

/* Track */
.slider::-webkit-slider-runnable-track {
  height: 8px;
  background: var(--panel);
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.08);
}
.slider::-moz-range-track {
  height: 8px;
  background: var(--panel);
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.08);
}

/* Thumb */
.slider::-webkit-slider-thumb {
  appearance: none;
  width: 18px;
  height: 18px;
  margin-top: -5px; /* centers on 8px track */
  border-radius: 50%;
  background: var(--accent-blue);
  cursor: pointer;
  border: 2px solid var(--surface);
  box-shadow: var(--glow-blue);
  transition: transform 0.06s ease;
}
.slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--accent-blue);
  cursor: pointer;
  border: 2px solid var(--surface);
  box-shadow: var(--glow-blue);
  transition: transform 0.06s ease;
}
.slider:active::-webkit-slider-thumb,
.slider:active::-moz-range-thumb {
  transform: scale(0.96);
}

/* Visual fill layer (progress) */
.slider-track {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 8px;
  background: var(--panel);
  border-radius: 999px;
  transform: translateY(-50%);
  z-index: 1;
  border: 1px solid rgba(255,255,255,0.08);
}

.slider-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-blue), var(--accent-teal));
  border-radius: 999px;
  transition: width 0.08s ease-out;
}

.setting-description {
  color: var(--text-muted);
  font-size: 12px;
}

/* Stop Sequences */
.stop-sequences {
  margin-bottom: 6px;
}

.stop-sequence-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.stop-sequence-tag {
  background: linear-gradient(180deg, var(--accent-blue), color-mix(in oklab, var(--accent-blue) 80%, black 20%));
  color: white;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(255,255,255,0.1);
}

.remove-tag {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0;
  font-size: 14px;
  line-height: 1;
  transition: transform 0.06s ease, opacity 0.15s ease;
}
.remove-tag:hover { opacity: 0.9; transform: scale(1.06); }

/* Template Grid (desktop density) */
.template-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
}
.template-card {
  background: var(--glass);
  border: var(--border);
  border-radius: 12px;
  padding: 12px;
  cursor: pointer;
  transition: transform 0.12s ease, border-color 0.12s ease, box-shadow 0.12s ease;
  text-align: center;
}
.template-card:hover {
  border-color: var(--accent-blue);
  transform: translateY(-2px);
}
.template-card.selected {
  border-color: var(--accent-blue);
  background: var(--panel);
  box-shadow: var(--glow-blue);
}
.template-icon { font-size: 28px; margin-bottom: 6px; }
.template-name {
  font-weight: 700;
  color: var(--text-heading);
  margin-bottom: 2px;
  font-size: 13px;
}
.template-category {
  font-size: 12px;
  color: var(--text-muted);
}

/* Actions (Pinned footer) */
.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding: 14px 18px;
  border-top: var(--border);
  background: linear-gradient(180deg, rgba(0,0,0,0.02), rgba(0,0,0,0.08));
}

.primary-button,
.secondary-button {
  -webkit-app-region: no-drag;
  height: 40px;
  padding: 0 16px;
  border-radius: 10px;
  cursor: pointer;
  transition: transform 0.08s ease, box-shadow 0.12s ease, background 0.12s ease, border-color 0.12s ease;
  font-weight: 600;
  border: 1px solid transparent;
  font-size: 14px;
}

.primary-button {
  background: linear-gradient(180deg, var(--accent-blue), color-mix(in oklab, var(--accent-blue) 85%, black 15%));
  color: white;
  box-shadow: var(--glow-blue);
}
.primary-button:hover:not(:disabled) {
  transform: translateY(-1px);
}
.primary-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
}

.secondary-button {
  background: var(--glass);
  border: var(--border);
  color: var(--text-main);
}
.secondary-button:hover {
  background: var(--panel);
}

/* Keyboard focus for buttons (accessibility) */
.primary-button:focus-visible,
.secondary-button:focus-visible,
.close-button:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--ring);
}

/* Desktop-only minor responsive guard (kept narrow for Electron resizes) */
@media (max-width: 1024px) {
  .modal { max-width: calc(100vw - 48px); }
  .template-grid { grid-template-columns: repeat(4, 1fr); }
  .form-row { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 820px) {
  .template-grid { grid-template-columns: repeat(3, 1fr); }
  .form-row { grid-template-columns: 1fr; }
}

/* Optional container query to enhance desktop behavior when supported */
@container style(--supports-container: true) {
  .form-row { grid-template-columns: 2fr 1fr; }
}


</style>
