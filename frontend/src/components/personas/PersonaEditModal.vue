<!-- PersonaEditModal.vue - Shared modal for creating/editing personas -->
<template>
  <div class="modal-overlay" v-if="show">
    <div class="modal modal-wide">
      <!-- Modal Header -->
      <div class="modal-header">
        <h2>{{ isEditing ? 'Edit Persona' : 'Create New Persona' }}</h2>
        <button class="close-button" @click="$emit('close')">✕</button>
      </div>

      <!-- Tabs Navigation -->
      <div class="tabs-nav">
        <button
          type="button"
          class="tab-button"
          :class="{ active: activeTab === 'details' }"
          @click="activeTab = 'details'"
        >
          <ion-icon name="person-outline"></ion-icon>
          Details
        </button>
        <button
          v-if="isEditing"
          type="button"
          class="tab-button"
          :class="{ active: activeTab === 'datasets' }"
          @click="activeTab = 'datasets'"
        >
          <ion-icon name="documents-outline"></ion-icon>
          Datasets
        </button>
      </div>

      <!-- Modal Content -->
      <div class="modal-content">
        <!-- Details Tab -->
        <form v-show="activeTab === 'details'" @submit.prevent="handleSubmit">
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
              <label for="persona-category">Model Type *</label>
              <select
                id="persona-category"
                v-model="formData.category"
                class="form-select"
                required
              >
                <option value="cloud">☁️ Cloud Models</option>
                <option value="local">💻 Local Models</option>
              </select>
            </div>

            <!-- Therapeutic Specialty (optional for all personas) -->
            <div class="form-group">
              <label for="persona-specialty">Specialty (Optional)</label>
              <input
                id="persona-specialty"
                v-model.trim="formData.specialty"
                type="text"
                placeholder="e.g., CBT, DBT, Mindfulness..."
                class="form-input"
              />
            </div>

            <!-- Therapeutic Focus (optional for all personas) -->
            <div class="form-group">
              <label for="persona-focus">Therapeutic Focus (Optional)</label>
              <textarea
                id="persona-focus"
                v-model.trim="formData.therapeutic_focus"
                placeholder="Describe the specific therapeutic focus and approach..."
                class="form-textarea"
                rows="2"
              />
            </div>

            <!-- Color Theme -->
            <div class="form-group">
              <label for="persona-color">Color Theme</label>
              <div class="color-picker-group">
                <input
                  id="persona-color"
                  v-model="formData.color_theme"
                  type="color"
                  class="color-input"
                />
                <input
                  v-model="formData.color_theme"
                  type="text"
                  placeholder="#6366f1"
                  class="form-input color-text"
                />
              </div>
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

        <!-- Datasets Tab -->
        <div v-show="activeTab === 'datasets'" class="datasets-tab">
          <DatasetLinkManager
            v-if="isEditing && editingPersona"
            :persona-id="editingPersona.id"
            @updated="handleDatasetsUpdated"
          />
          
          <!-- Datasets Tab Actions -->
          <div class="datasets-actions">
            <div class="datasets-info">
              <ion-icon name="checkmark-circle-outline"></ion-icon>
              <span>Changes are saved automatically</span>
            </div>
            <button type="button" class="primary-button" @click="$emit('close')">
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import type { Persona, PersonaCategory } from '../../../../backend/types/personas'
import DatasetLinkManager from '../datasets/DatasetLinkManager.vue'

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
    // Enhanced fields
    specialty?: string
    therapeutic_focus?: string
    color_theme?: string
    tags?: string
    settings?: Partial<{
      temperature: number
      maxTokens: number
      topP: number
      repeatPenalty: number
    }>
  }]
  datasetsUpdated: []
}>()

// State
const submitting = ref(false)
const activeTab = ref<'details' | 'datasets'>('details')

// Form data
const formData = reactive({
  name: '',
  icon: '🤖',
  category: 'cloud' as PersonaCategory,
  description: '',
  prompt: '',
  // Enhanced therapeutic fields
  specialty: '',
  therapeutic_focus: '',
  color_theme: '#6366f1',
  tags: '',
  // Model settings
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
    specialty: '',
    therapeutic_focus: '',
    color_theme: '#6366f1',
    tags: '',
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
      // Enhanced therapeutic fields
      ...(formData.specialty && { specialty: formData.specialty }),
      ...(formData.therapeutic_focus && { therapeutic_focus: formData.therapeutic_focus.trim() }),
      ...(formData.color_theme && { color_theme: formData.color_theme }),
      ...(formData.tags && { tags: formData.tags.trim() }),
      ...(Object.keys(settings).length > 0 && { settings })
    }

    emit('save', personaData)
  } catch (error) {
    console.error('Error submitting form:', error)
  } finally {
    submitting.value = false
  }
}

function handleDatasetsUpdated() {
  emit('datasetsUpdated')
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
        specialty: p.specialty || '',
        therapeutic_focus: p.therapeutic_focus || '',
        color_theme: p.color_theme || '#6366f1',
        tags: p.tags || '',
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
   PersonaEditModal — Purple Gradient Theme
   Unified design system matching Luna's modern interface
================================== */

/* Overlay */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(12px) saturate(180%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
}

/* Modal Shell */
.modal {
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.95) 50%, rgba(67, 56, 202, 0.08) 100%);
  backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 16px;
  width: 1040px;
  max-width: calc(100vw - 120px);
  max-height: 85vh;
  box-shadow: 0 20px 60px rgba(139, 92, 246, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal.modal-wide {
  width: 1160px;
  max-width: calc(100vw - 96px);
}

/* Header */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 1.75rem;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(139, 92, 246, 0.04) 100%);
  border-bottom: 1px solid rgba(139, 92, 246, 0.3);
  box-shadow: 0 2px 12px rgba(139, 92, 246, 0.1);
}

.modal-header h2 {
  margin: 0;
  background: linear-gradient(135deg, rgba(139, 92, 246, 1) 0%, rgba(196, 181, 253, 1) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 1.5rem;
  letter-spacing: 0.02em;
  font-weight: 700;
}

/* Close Button */
.close-button {
  background: rgba(139, 92, 246, 0.15);
  border: 1px solid rgba(139, 92, 246, 0.3);
  color: rgba(196, 181, 253, 1);
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
  padding: 0.5rem 0.75rem;
  border-radius: 10px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.close-button:hover {
  background: rgba(139, 92, 246, 0.25);
  color: white;
  border-color: rgba(139, 92, 246, 0.5);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
}

.close-button:active {
  transform: translateY(0);
}

/* Tabs Navigation */
.tabs-nav {
  display: flex;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(139, 92, 246, 0.2);
}

.tab-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: transparent;
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 12px;
  color: rgba(196, 181, 253, 0.7);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.tab-button ion-icon {
  font-size: 1.1rem;
}

.tab-button:hover {
  background: rgba(139, 92, 246, 0.1);
  color: rgba(196, 181, 253, 1);
  border-color: rgba(139, 92, 246, 0.4);
}

.tab-button.active {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.8) 0%, rgba(124, 58, 237, 0.9) 100%);
  color: white;
  border-color: rgba(139, 92, 246, 0.5);
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.4);
}

/* Datasets Tab */
.datasets-tab {
  padding: 1.5rem;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.datasets-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(139, 92, 246, 0.2);
  margin-top: auto;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(139, 92, 246, 0.02) 100%);
  border-radius: 0 0 16px 16px;
}

.datasets-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(196, 181, 253, 0.8);
  font-size: 0.9rem;
}

.datasets-info ion-icon {
  font-size: 1.25rem;
  color: #10b981;
}

/* Modal Content */
.modal-content {
  padding: 1.5rem;
  overflow: auto;
  overscroll-behavior: contain;
}

/* Purple Scrollbar */
.modal-content::-webkit-scrollbar {
  width: 8px;
}
.modal-content::-webkit-scrollbar-track {
  background: transparent;
}
.modal-content::-webkit-scrollbar-thumb {
  background: rgba(139, 92, 246, 0.3);
  border-radius: 4px;
}
.modal-content::-webkit-scrollbar-thumb:hover {
  background: rgba(139, 92, 246, 0.5);
}

/* Form Sections */
.form-section {
  padding: 1.5rem;
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.02) 100%);
  backdrop-filter: blur(20px);
  margin-bottom: 1.5rem;
  position: relative;
}

.form-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, rgba(139, 92, 246, 0.8) 0%, rgba(196, 181, 253, 0.4) 100%);
  border-radius: 16px 16px 0 0;
}

.form-section h3 {
  background: linear-gradient(135deg, rgba(139, 92, 246, 1) 0%, rgba(196, 181, 253, 1) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  font-weight: 700;
}

.section-description {
  color: rgba(196, 181, 253, 0.7);
  margin: 0 0 1.25rem 0;
  font-size: 0.9rem;
  line-height: 1.5;
}

/* Layout: Desktop grid */
.form-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1rem;
}

/* Form Groups */
.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: rgba(196, 181, 253, 1);
  font-size: 0.9rem;
  font-weight: 600;
}

/* Form Inputs */
.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 1px solid rgba(139, 92, 246, 0.25);
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%);
  backdrop-filter: blur(20px) saturate(150%);
  color: rgba(255, 255, 255, 0.95);
  font-size: 0.95rem;
  line-height: 1.5;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.form-select {
  height: 44px;
}

.form-input {
  height: 44px;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: rgba(139, 92, 246, 0.5);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.15), 0 8px 24px rgba(139, 92, 246, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.08);
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%);
}

.form-input:hover,
.form-select:hover,
.form-textarea:hover {
  border-color: rgba(139, 92, 246, 0.35);
}

.form-input.error,
.form-textarea.error {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
}

.error-message {
  color: #ef4444;
  font-size: 0.85rem;
  margin-top: 0.5rem;
  display: block;
}

/* Textarea */
.form-textarea {
  min-height: 100px;
  resize: vertical;
}

.prompt-textarea {
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
  font-size: 0.9rem;
  line-height: 1.6;
  min-height: 200px;
}

::selection {
  background: rgba(139, 92, 246, 0.4);
  color: white;
}

/* Character counter */
.character-count {
  text-align: right;
  color: rgba(196, 181, 253, 0.6);
  font-size: 0.85rem;
  margin-top: 0.5rem;
}

/* Settings Group */
.setting-group {
  margin-bottom: 1.5rem;
}

.setting-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.setting-header label {
  color: rgba(196, 181, 253, 1);
  font-weight: 600;
  font-size: 0.95rem;
  margin: 0;
}

.setting-value {
  color: rgba(139, 92, 246, 1);
  font-weight: 700;
  font-size: 0.9rem;
}

/* Glass Slider */
.glass-slider {
  position: relative;
  margin-bottom: 0.75rem;
}

.slider {
  width: 100%;
  height: 32px;
  appearance: none;
  background: transparent;
  cursor: pointer;
  position: relative;
  z-index: 2;
}

/* Track */
.slider::-webkit-slider-runnable-track {
  height: 8px;
  background: rgba(30, 41, 59, 0.8);
  border-radius: 999px;
  border: 1px solid rgba(139, 92, 246, 0.2);
}

.slider::-moz-range-track {
  height: 8px;
  background: rgba(30, 41, 59, 0.8);
  border-radius: 999px;
  border: 1px solid rgba(139, 92, 246, 0.2);
}

/* Thumb */
.slider::-webkit-slider-thumb {
  appearance: none;
  width: 20px;
  height: 20px;
  margin-top: -6px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(139, 92, 246, 1) 0%, rgba(124, 58, 237, 1) 100%);
  cursor: pointer;
  border: 2px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.5);
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(139, 92, 246, 1) 0%, rgba(124, 58, 237, 1) 100%);
  cursor: pointer;
  border: 2px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.5);
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.slider:active::-webkit-slider-thumb,
.slider:active::-moz-range-thumb {
  transform: scale(1.1);
}

/* Visual fill layer */
.slider-track {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 8px;
  background: rgba(30, 41, 59, 0.8);
  border-radius: 999px;
  transform: translateY(-50%);
  z-index: 1;
  border: 1px solid rgba(139, 92, 246, 0.2);
  overflow: hidden;
}

.slider-fill {
  height: 100%;
  background: linear-gradient(90deg, rgba(139, 92, 246, 0.8) 0%, rgba(196, 181, 253, 0.6) 100%);
  border-radius: 999px;
  transition: width 0.15s ease-out;
}

.setting-description {
  color: rgba(196, 181, 253, 0.7);
  font-size: 0.85rem;
  line-height: 1.4;
}

/* Color Picker */
.color-picker-group {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.color-input {
  width: 56px;
  height: 44px;
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 12px;
  cursor: pointer;
  background: none;
  padding: 4px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.color-input:hover {
  border-color: rgba(139, 92, 246, 0.5);
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
}

.color-text {
  flex: 1;
  font-family: 'SF Mono', 'Monaco', monospace;
  font-size: 0.9rem;
}

/* Stop Sequences */
.stop-sequences {
  margin-bottom: 0.75rem;
}

.stop-sequence-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.stop-sequence-tag {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.8) 0%, rgba(124, 58, 237, 0.9) 100%);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 999px;
  font-size: 0.85rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid rgba(139, 92, 246, 0.5);
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
}

.remove-tag {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0;
  font-size: 1rem;
  line-height: 1;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.remove-tag:hover {
  opacity: 0.8;
  transform: scale(1.1);
}

/* Template Grid */
.template-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 1rem;
}

.template-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 12px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: center;
}

.template-card:hover {
  border-color: rgba(139, 92, 246, 0.5);
  background: rgba(139, 92, 246, 0.1);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.3);
}

.template-card.selected {
  border-color: rgba(139, 92, 246, 0.8);
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(124, 58, 237, 0.15) 100%);
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.4);
}

.template-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.template-name {
  font-weight: 700;
  color: rgba(196, 181, 253, 1);
  margin-bottom: 0.25rem;
  font-size: 0.9rem;
}

.template-category {
  font-size: 0.8rem;
  color: rgba(196, 181, 253, 0.6);
}

/* Form Actions */
.form-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid rgba(139, 92, 246, 0.2);
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(139, 92, 246, 0.02) 100%);
}

.primary-button,
.secondary-button {
  height: 44px;
  padding: 0 1.5rem;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 600;
  border: 1px solid transparent;
  font-size: 0.95rem;
}

.primary-button {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.8) 0%, rgba(124, 58, 237, 0.9) 100%);
  border-color: rgba(139, 92, 246, 0.5);
  color: white;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.4);
}

.primary-button:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(139, 92, 246, 1) 0%, rgba(124, 58, 237, 1) 100%);
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.5);
  transform: translateY(-2px);
}

.primary-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

.secondary-button {
  background: rgba(129, 140, 248, 0.15);
  border: 1px solid rgba(129, 140, 248, 0.4);
  color: rgba(129, 140, 248, 1);
}

.secondary-button:hover {
  background: rgba(129, 140, 248, 0.25);
  border-color: rgba(129, 140, 248, 0.6);
  color: white;
  box-shadow: 0 4px 20px rgba(129, 140, 248, 0.3);
  transform: translateY(-2px);
}

/* Focus states for accessibility */
.primary-button:focus-visible,
.secondary-button:focus-visible,
.close-button:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.4);
}

/* Responsive adjustments */
@media (max-width: 1024px) {
  .modal {
    max-width: calc(100vw - 48px);
  }
  .template-grid {
    grid-template-columns: repeat(4, 1fr);
  }
  .form-row {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 820px) {
  .template-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
