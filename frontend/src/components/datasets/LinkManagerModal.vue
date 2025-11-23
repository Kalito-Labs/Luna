<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content link-manager">
      <!-- Header -->
      <div class="modal-header">
        <div>
          <h2>Link to Personas</h2>
          <p class="subtitle">Manage which personas can access "{{ dataset.name }}"</p>
        </div>
        <button class="close-btn" @click="$emit('close')">
          <ion-icon name="close-outline"></ion-icon>
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading">
        <ion-icon name="hourglass-outline" class="spinning"></ion-icon>
        <span>Loading personas...</span>
      </div>

      <!-- Personas List -->
      <div v-else class="personas-list">
        <div
          v-for="persona in personas"
          :key="persona.id"
          class="persona-item"
          :class="{ linked: isLinked(persona.id) }"
        >
          <div class="persona-info">
            <div class="persona-icon" :style="{ background: persona.color || '#8b5cf6' }">
              {{ persona.name.charAt(0).toUpperCase() }}
            </div>
            <div>
              <h3>{{ persona.name }}</h3>
            </div>
          </div>

          <div class="persona-controls">
            <!-- Link Toggle -->
            <label class="toggle-switch">
              <input
                type="checkbox"
                :checked="isLinked(persona.id)"
                @change="toggleLink(persona.id, $event)"
              />
              <span class="toggle-slider"></span>
            </label>

            <!-- Advanced Settings (show if linked) -->
            <button
              v-if="isLinked(persona.id)"
              class="settings-btn"
              @click="toggleSettings(persona.id)"
              title="Advanced Settings"
            >
              <ion-icon :name="showSettings[persona.id] ? 'chevron-up-outline' : 'cog-outline'"></ion-icon>
            </button>
          </div>

          <!-- Settings Panel -->
          <div v-if="isLinked(persona.id) && showSettings[persona.id]" class="settings-panel">
            <div class="setting-row">
              <label>
                Weight
                <span class="help-text">How much Luna should prioritize this document (0.0 - 2.0)</span>
              </label>
              <input
                type="number"
                min="0"
                max="2"
                step="0.1"
                :value="getLink(persona.id)?.weight || 1.0"
                @change="updateWeight(persona.id, $event)"
                class="weight-input"
              />
            </div>

            <div class="setting-row">
              <label>
                Access Level
                <span class="help-text">What Luna can learn from this document</span>
              </label>
              <select
                :value="getLink(persona.id)?.access_level || 'read'"
                @change="updateAccessLevel(persona.id, $event)"
                class="access-select"
              >
                <option value="read">Read (Full Access)</option>
                <option value="summary">Summary (Overview Only)</option>
                <option value="reference_only">Reference Only (Context)</option>
              </select>
            </div>

            <div class="setting-row">
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  :checked="getLink(persona.id)?.enabled !== false"
                  @change="updateEnabled(persona.id, $event)"
                />
                <span>Enable Luna data access for this document</span>
                <span class="help-text">Luna can retrieve chunks from this document during conversations</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="personas.length === 0" class="empty-personas">
          <ion-icon name="person-add-outline"></ion-icon>
          <p>No personas found. Create a persona first to link documents.</p>
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <button class="btn-secondary" @click="$emit('close')">
          Done
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'

const props = defineProps<{
  dataset: any
}>()

const emit = defineEmits<{
  close: []
  updated: []
}>()

const loading = ref(false)
const personas = ref<any[]>([])
const links = ref<any[]>([])
const showSettings = reactive<Record<string, boolean>>({})

async function loadData() {
  loading.value = true
  try {
    // Load all personas
    const personasRes = await fetch('http://localhost:3000/api/personas')
    const personasData = await personasRes.json()
    personas.value = personasData.data

    // For each persona, check if this dataset is linked
    const allLinks: any[] = []
    for (const persona of personas.value) {
      try {
        const linksRes = await fetch(`http://localhost:3000/api/personas/${persona.id}/datasets`)
        const linksData = await linksRes.json()
        
        const link = linksData.data.datasets.find((d: any) => d.dataset.id === props.dataset.id)
        if (link) {
          allLinks.push({
            persona_id: persona.id,
            dataset_id: props.dataset.id,
            enabled: link.enabled,
            weight: link.weight,
            access_level: link.access_level
          })
        }
      } catch (err) {
        console.error(`Failed to load links for persona ${persona.id}:`, err)
      }
    }
    
    links.value = allLinks
  } catch (error) {
    console.error('Failed to load data:', error)
  } finally {
    loading.value = false
  }
}

function isLinked(personaId: string): boolean {
  return links.value.some(link => link.persona_id === personaId)
}

function getLink(personaId: string) {
  return links.value.find(link => link.persona_id === personaId)
}

function toggleSettings(personaId: string) {
  showSettings[personaId] = !showSettings[personaId]
}

async function toggleLink(personaId: string, event: Event) {
  const checkbox = event.target as HTMLInputElement
  const shouldLink = checkbox.checked

  try {
    if (shouldLink) {
      // Create link
      await fetch(`http://localhost:3000/api/personas/${personaId}/datasets/${props.dataset.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: true,
          weight: 1.0,
          access_level: 'read'
        })
      })
      
      // Add to local state
      links.value.push({
        persona_id: personaId,
        dataset_id: props.dataset.id,
        enabled: true,
        weight: 1.0,
        access_level: 'read'
      })
    } else {
      // Remove link
      await fetch(`http://localhost:3000/api/personas/${personaId}/datasets/${props.dataset.id}`, {
        method: 'DELETE'
      })
      
      // Remove from local state
      links.value = links.value.filter(link => link.persona_id !== personaId)
      delete showSettings[personaId]
    }
    
    emit('updated')
  } catch (error) {
    console.error('Failed to toggle link:', error)
    // Revert checkbox
    checkbox.checked = !shouldLink
  }
}

async function updateWeight(personaId: string, event: Event) {
  const input = event.target as HTMLInputElement
  const weight = parseFloat(input.value)
  
  try {
    await fetch(`http://localhost:3000/api/personas/${personaId}/datasets/${props.dataset.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weight })
    })
    
    // Update local state
    const link = getLink(personaId)
    if (link) link.weight = weight
    
    emit('updated')
  } catch (error) {
    console.error('Failed to update weight:', error)
  }
}

async function updateAccessLevel(personaId: string, event: Event) {
  const select = event.target as HTMLSelectElement
  const access_level = select.value
  
  try {
    await fetch(`http://localhost:3000/api/personas/${personaId}/datasets/${props.dataset.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_level })
    })
    
    // Update local state
    const link = getLink(personaId)
    if (link) link.access_level = access_level
    
    emit('updated')
  } catch (error) {
    console.error('Failed to update access level:', error)
  }
}

async function updateEnabled(personaId: string, event: Event) {
  const checkbox = event.target as HTMLInputElement
  const enabled = checkbox.checked
  
  try {
    await fetch(`http://localhost:3000/api/personas/${personaId}/datasets/${props.dataset.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled })
    })
    
    // Update local state
    const link = getLink(personaId)
    if (link) link.enabled = enabled
    
    emit('updated')
  } catch (error) {
    console.error('Failed to update enabled:', error)
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  border-radius: 1.25rem;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.2);
  max-width: 700px;
  width: 90vw;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 2rem;
  border-bottom: 1px solid var(--border-light, #e0e0e0);
}

.modal-header h2 {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary, #1a1a1a);
  margin: 0 0 0.5rem 0;
}

.subtitle {
  font-size: 0.95rem;
  color: var(--text-secondary, #666);
  margin: 0;
}

.close-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 1.5rem;
  color: var(--text-muted, #999);
}

.close-btn:hover {
  background: var(--bg-light, #f5f5f5);
  color: var(--text-primary, #1a1a1a);
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  gap: 1rem;
  color: var(--text-secondary, #666);
}

.spinning {
  font-size: 2.5rem;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.personas-list {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.persona-item {
  background: white;
  border: 2px solid var(--border-light, #e0e0e0);
  border-radius: 1rem;
  padding: 1.25rem;
  transition: all 0.3s;
}

.persona-item:hover {
  border-color: #8b5cf6;
}

.persona-item.linked {
  background: rgba(139, 92, 246, 0.05);
  border-color: #8b5cf6;
}

.persona-item > div:first-child {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.persona-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.persona-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.75rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.persona-info h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary, #1a1a1a);
  margin: 0;
}

.persona-info p {
  font-size: 0.9rem;
  color: var(--text-secondary, #666);
  margin: 0.25rem 0 0 0;
}

.persona-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.toggle-switch {
  position: relative;
  width: 52px;
  height: 28px;
  cursor: pointer;
}

.toggle-switch input {
  display: none;
}

.toggle-slider {
  position: absolute;
  inset: 0;
  background: var(--border-light, #e0e0e0);
  border-radius: 28px;
  transition: all 0.3s;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  width: 22px;
  height: 22px;
  left: 3px;
  top: 3px;
  background: white;
  border-radius: 50%;
  transition: all 0.3s;
}

.toggle-switch input:checked + .toggle-slider {
  background: #8b5cf6;
}

.toggle-switch input:checked + .toggle-slider::before {
  transform: translateX(24px);
}

.settings-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--border-light, #e0e0e0);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 1.25rem;
  color: #8b5cf6;
}

.settings-btn:hover {
  background: rgba(139, 92, 246, 0.1);
  border-color: #8b5cf6;
}

.settings-panel {
  margin-top: 1.25rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--border-light, #e0e0e0);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.setting-row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.setting-row label {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary, #1a1a1a);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.help-text {
  font-size: 0.85rem;
  font-weight: 400;
  color: var(--text-secondary, #666);
}

.weight-input,
.access-select {
  padding: 0.75rem;
  background: white;
  border: 1px solid var(--border-light, #e0e0e0);
  border-radius: 0.5rem;
  font-size: 0.95rem;
  transition: all 0.3s;
}

.weight-input:focus,
.access-select:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.checkbox-label {
  display: flex;
  flex-direction: row !important;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.checkbox-label > span:first-of-type {
  font-size: 0.95rem;
  font-weight: 500;
}

.empty-personas {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
  color: var(--text-secondary, #666);
}

.empty-personas ion-icon {
  font-size: 3rem;
  opacity: 0.4;
  margin-bottom: 1rem;
}

.modal-footer {
  padding: 1.5rem 2rem;
  border-top: 1px solid var(--border-light, #e0e0e0);
  display: flex;
  justify-content: flex-end;
}

.btn-secondary {
  padding: 0.75rem 2rem;
  background: white;
  border: 1px solid var(--border-light, #e0e0e0);
  border-radius: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  color: var(--text-primary, #1a1a1a);
}

.btn-secondary:hover {
  background: var(--bg-light, #f5f5f5);
  border-color: #8b5cf6;
}
</style>
