<template>
  <div class="persona-link-manager-modal" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <div>
          <h2>🔗 Link to Personas</h2>
          <p>Configure which AI personas can access "{{ dataset.name }}"</p>
        </div>
        <button class="close-btn" @click="$emit('close')" aria-label="Close">
          <ion-icon name="close-outline"></ion-icon>
        </button>
      </div>

      <div class="modal-body">
        <!-- RAG Explanation -->
        <div class="info-banner">
          <ion-icon name="information-circle-outline"></ion-icon>
          <div class="info-content">
            <strong>How linking works:</strong>
            <p>When you link this document to a persona, the AI will have access to its content during conversations. This enables evidence-based therapeutic guidance.</p>
          </div>
        </div>

        <!-- Dataset Info -->
        <div class="dataset-summary">
          <div class="summary-item">
            <ion-icon name="filing-outline"></ion-icon>
            <span>{{ dataset.chunk_count }} chunks</span>
          </div>
          <div class="summary-item">
            <ion-icon :name="dataset.processing_mode === 'local' ? 'shield-checkmark-outline' : 'cloud-outline'"></ion-icon>
            <span>{{ dataset.processing_mode === 'local' ? 'Private' : 'Cloud' }} processing</span>
          </div>
          <div v-if="dataset.therapeutic_category" class="summary-item">
            <ion-icon name="medkit-outline"></ion-icon>
            <span>{{ dataset.therapeutic_category.toUpperCase() }}</span>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="loading-state">
          <ion-icon name="hourglass-outline" class="spinning"></ion-icon>
          <p>Loading personas...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="personas.length === 0" class="empty-state">
          <ion-icon name="people-outline"></ion-icon>
          <p>No personas available. Create a persona first.</p>
        </div>

        <!-- Personas List -->
        <div v-else class="personas-list">
          <div 
            v-for="persona in personas" 
            :key="persona.id"
            class="persona-item"
            :class="{ linked: isLinked(persona.id), disabled: !isEnabled(persona.id) }"
          >
            <div class="persona-info">
              <div class="persona-header">
                <h3>{{ persona.name }}</h3>
                <div class="toggle-switch">
                  <input 
                    :id="`toggle-${persona.id}`"
                    type="checkbox" 
                    :checked="isLinked(persona.id)"
                    @change="toggleLink(persona.id, $event)"
                  />
                  <label :for="`toggle-${persona.id}`"></label>
                </div>
              </div>
              <p v-if="persona.description" class="persona-description">{{ persona.description }}</p>
              
              <!-- Link Settings (shown when linked) -->
              <div v-if="isLinked(persona.id)" class="link-settings">
                <div class="setting-group">
                  <label>Access Level</label>
                  <select 
                    :value="getLinkSettings(persona.id)?.access_level || 'read'"
                    @change="updateAccessLevel(persona.id, $event)"
                    class="setting-select"
                  >
                    <option value="read">Full Read Access</option>
                    <option value="summary">Summary Only (Coming Soon)</option>
                    <option value="reference_only">Reference Only (Coming Soon)</option>
                  </select>
                  <span class="setting-hint">Controls what content the AI can see</span>
                </div>

                <div class="setting-group">
                  <label>Priority Weight</label>
                  <div class="weight-control">
                    <input 
                      type="range" 
                      min="0.1" 
                      max="2.0" 
                      step="0.1"
                      :value="getLinkSettings(persona.id)?.weight || 1.0"
                      @input="updateWeight(persona.id, $event)"
                      class="weight-slider"
                    />
                    <span class="weight-value">{{ (getLinkSettings(persona.id)?.weight || 1.0).toFixed(1) }}×</span>
                  </div>
                  <span class="setting-hint">Higher weight = higher priority in AI context</span>
                </div>

                <div class="setting-group checkbox-group">
                  <label>
                    <input 
                      type="checkbox"
                      :checked="isEnabled(persona.id)"
                      @change="toggleEnabled(persona.id, $event)"
                    />
                    <span>Enabled for conversations</span>
                  </label>
                  <span class="setting-hint">Temporarily disable without unlinking</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <div class="footer-info">
          <ion-icon name="checkmark-circle-outline"></ion-icon>
          <span>{{ linkedCount }} persona{{ linkedCount !== 1 ? 's' : '' }} linked</span>
        </div>
        <button class="btn-primary" @click="saveAndClose">
          Done
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const props = defineProps<{
  dataset: any
  personas: any[]
  existingLinks: any[]
}>()

const emit = defineEmits(['close', 'updated'])

// State
const loading = ref(false)
const linkStates = ref<Record<string, any>>({})

// Computed
const linkedCount = computed(() => {
  return Object.values(linkStates.value).filter((link: any) => link.linked).length
})

// Methods
function isLinked(personaId: string): boolean {
  return linkStates.value[personaId]?.linked || false
}

function isEnabled(personaId: string): boolean {
  return linkStates.value[personaId]?.enabled !== false
}

function getLinkSettings(personaId: string) {
  return linkStates.value[personaId]
}

async function toggleLink(personaId: string, event: Event) {
  const checked = (event.target as HTMLInputElement).checked
  
  if (checked) {
    // Create new link
    linkStates.value[personaId] = {
      linked: true,
      enabled: true,
      access_level: 'read',
      weight: 1.0
    }
    
    try {
      await fetch(`http://localhost:3000/api/personas/${personaId}/datasets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataset_id: props.dataset.id,
          enabled: true,
          access_level: 'read',
          weight: 1.0
        })
      })
    } catch (error) {
      console.error('Failed to link dataset:', error)
    }
  } else {
    // Remove link
    linkStates.value[personaId] = { linked: false }
    
    try {
      await fetch(`http://localhost:3000/api/personas/${personaId}/datasets/${props.dataset.id}`, {
        method: 'DELETE'
      })
    } catch (error) {
      console.error('Failed to unlink dataset:', error)
    }
  }
}

async function toggleEnabled(personaId: string, event: Event) {
  const checked = (event.target as HTMLInputElement).checked
  linkStates.value[personaId].enabled = checked
  
  try {
    await fetch(`http://localhost:3000/api/personas/${personaId}/datasets/${props.dataset.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: checked })
    })
  } catch (error) {
    console.error('Failed to update enabled state:', error)
  }
}

async function updateAccessLevel(personaId: string, event: Event) {
  const accessLevel = (event.target as HTMLSelectElement).value
  linkStates.value[personaId].access_level = accessLevel
  
  try {
    await fetch(`http://localhost:3000/api/personas/${personaId}/datasets/${props.dataset.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_level: accessLevel })
    })
  } catch (error) {
    console.error('Failed to update access level:', error)
  }
}

async function updateWeight(personaId: string, event: Event) {
  const weight = parseFloat((event.target as HTMLInputElement).value)
  linkStates.value[personaId].weight = weight
  
  try {
    await fetch(`http://localhost:3000/api/personas/${personaId}/datasets/${props.dataset.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weight })
    })
  } catch (error) {
    console.error('Failed to update weight:', error)
  }
}

function saveAndClose() {
  emit('updated')
  emit('close')
}

onMounted(() => {
  // Initialize link states from existing links
  props.personas.forEach(persona => {
    const existingLink = props.existingLinks.find(link => link.persona_id === persona.id)
    
    if (existingLink) {
      linkStates.value[persona.id] = {
        linked: true,
        enabled: existingLink.enabled,
        access_level: existingLink.access_level || 'read',
        weight: existingLink.weight || 1.0
      }
    } else {
      linkStates.value[persona.id] = {
        linked: false,
        enabled: true,
        access_level: 'read',
        weight: 1.0
      }
    }
  })
})
</script>

<style scoped>
.persona-link-manager-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
}

.modal-content {
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.95) 100%);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 24px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 2rem;
  border-bottom: 1px solid rgba(139, 92, 246, 0.2);
  background: rgba(255, 255, 255, 0.04);
}

.modal-header h2 {
  font-size: 1.75rem;
  background: linear-gradient(135deg, rgba(139, 92, 246, 1) 0%, rgba(196, 181, 253, 1) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 0.5rem 0;
  font-weight: 700;
}

.modal-header p {
  color: rgba(196, 181, 253, 0.8);
  margin: 0;
  font-size: 0.95rem;
}

.close-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 10px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1.5rem;
  color: rgba(255, 255, 255, 0.7);
  flex-shrink: 0;
}

.close-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.4);
  color: #ef4444;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem 2rem;
}

.modal-body::-webkit-scrollbar {
  width: 8px;
}

.modal-body::-webkit-scrollbar-track {
  background: rgba(139, 92, 246, 0.05);
  border-radius: 12px;
}

.modal-body::-webkit-scrollbar-thumb {
  background: rgba(139, 92, 246, 0.3);
  border-radius: 12px;
}

.modal-body::-webkit-scrollbar-thumb:hover {
  background: rgba(139, 92, 246, 0.5);
}

/* Info Banner */
.info-banner {
  display: flex;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 12px;
  margin-bottom: 1.5rem;
}

.info-banner ion-icon {
  font-size: 1.5rem;
  color: #93c5fd;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.info-content {
  flex: 1;
}

.info-content strong {
  display: block;
  color: #93c5fd;
  margin-bottom: 0.375rem;
  font-size: 0.9rem;
}

.info-content p {
  color: rgba(196, 181, 253, 0.8);
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.5;
}

/* Dataset Summary */
.dataset-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-radius: 12px;
  margin-bottom: 1.5rem;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(196, 181, 253, 0.9);
  font-size: 0.875rem;
}

.summary-item ion-icon {
  font-size: 1.125rem;
  color: rgba(139, 92, 246, 0.8);
}

/* Loading/Empty States */
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
}

.loading-state ion-icon,
.empty-state ion-icon {
  font-size: 3rem;
  opacity: 0.5;
  margin-bottom: 1rem;
  color: rgba(139, 92, 246, 1);
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Personas List */
.personas-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.persona-item {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 12px;
  padding: 1.25rem;
  transition: all 0.3s ease;
}

.persona-item.linked {
  background: rgba(139, 92, 246, 0.08);
  border-color: rgba(139, 92, 246, 0.4);
}

.persona-item.disabled {
  opacity: 0.6;
}

.persona-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.persona-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.persona-header h3 {
  margin: 0;
  font-size: 1.125rem;
  color: rgba(196, 181, 253, 1);
  font-weight: 600;
}

.persona-description {
  margin: 0;
  font-size: 0.875rem;
  color: rgba(196, 181, 253, 0.7);
  line-height: 1.5;
}

/* Toggle Switch */
.toggle-switch {
  position: relative;
  width: 52px;
  height: 28px;
  flex-shrink: 0;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-switch label {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(100, 100, 100, 0.3);
  border: 1px solid rgba(100, 100, 100, 0.4);
  border-radius: 28px;
  transition: all 0.3s ease;
}

.toggle-switch label::before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 4px;
  bottom: 3px;
  background: white;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.toggle-switch input:checked + label {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.8) 0%, rgba(124, 58, 237, 0.9) 100%);
  border-color: rgba(139, 92, 246, 0.6);
}

.toggle-switch input:checked + label::before {
  transform: translateX(24px);
}

/* Link Settings */
.link-settings {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background: rgba(139, 92, 246, 0.05);
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-radius: 10px;
  margin-top: 0.5rem;
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.setting-group label {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgba(196, 181, 253, 0.9);
}

.setting-select {
  padding: 0.625rem 1rem;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.95);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.setting-select:hover {
  border-color: rgba(139, 92, 246, 0.5);
}

.setting-select:focus {
  outline: none;
  border-color: rgba(139, 92, 246, 0.6);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.15);
}

.setting-select option {
  background: rgba(15, 23, 42, 0.98);
  color: rgba(255, 255, 255, 0.95);
}

.weight-control {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.weight-slider {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: rgba(139, 92, 246, 0.2);
  outline: none;
  -webkit-appearance: none;
}

.weight-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(139, 92, 246, 1) 0%, rgba(124, 58, 237, 1) 100%);
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.4);
}

.weight-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(139, 92, 246, 1) 0%, rgba(124, 58, 237, 1) 100%);
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.4);
}

.weight-value {
  min-width: 40px;
  text-align: right;
  font-weight: 600;
  color: rgba(139, 92, 246, 1);
  font-size: 0.875rem;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: 500;
}

.checkbox-group input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.setting-hint {
  font-size: 0.75rem;
  color: rgba(196, 181, 253, 0.6);
  font-style: italic;
}

/* Modal Footer */
.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-top: 1px solid rgba(139, 92, 246, 0.2);
  background: rgba(255, 255, 255, 0.02);
}

.footer-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(196, 181, 253, 0.8);
  font-size: 0.875rem;
}

.footer-info ion-icon {
  font-size: 1.125rem;
  color: #6ee7b7;
}

.btn-primary {
  padding: 0.75rem 2rem;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.8) 0%, rgba(124, 58, 237, 0.9) 100%);
  color: white;
  border: 1px solid rgba(139, 92, 246, 0.5);
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
}

.btn-primary:hover {
  background: linear-gradient(135deg, rgba(139, 92, 246, 1) 0%, rgba(124, 58, 237, 1) 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.4);
}

/* Responsive */
@media (max-width: 768px) {
  .modal-content {
    max-height: 95vh;
    border-radius: 16px;
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 1.25rem;
  }

  .modal-header h2 {
    font-size: 1.5rem;
  }

  .personas-list {
    gap: 0.75rem;
  }

  .persona-item {
    padding: 1rem;
  }

  .link-settings {
    padding: 0.75rem;
  }
}
</style>
