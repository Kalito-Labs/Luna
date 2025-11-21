<template>
  <div class="dataset-manager">
    <div class="manager-header">
      <h3>📚 Knowledge Base</h3>
      <p>Manage documents and data sources for this persona</p>
    </div>

    <!-- Builtin Luna Data Access -->
    <div class="builtin-data-section">
      <h4>
        <ion-icon name="server-outline"></ion-icon>
        Luna System Data
      </h4>
      <p class="section-description">Allow this persona to access your Luna data</p>
      
      <div class="data-access-grid">
        <label class="data-access-item">
          <input type="checkbox" v-model="dataAccess.journal_entries" @change="saveDataAccess" />
          <div class="access-info">
            <div class="access-label">
              <ion-icon name="book-outline"></ion-icon>
              <span>Journal Entries</span>
            </div>
            <p>Access your personal journal reflections</p>
          </div>
        </label>

        <label class="data-access-item">
          <input type="checkbox" v-model="dataAccess.mood_data" @change="saveDataAccess" />
          <div class="access-info">
            <div class="access-label">
              <ion-icon name="happy-outline"></ion-icon>
              <span>Mood Tracking</span>
            </div>
            <p>View your mood history and patterns</p>
          </div>
        </label>

        <label class="data-access-item">
          <input type="checkbox" v-model="dataAccess.appointments" @change="saveDataAccess" />
          <div class="access-info">
            <div class="access-label">
              <ion-icon name="calendar-outline"></ion-icon>
              <span>Appointments</span>
            </div>
            <p>Know about your scheduled sessions</p>
          </div>
        </label>

        <label class="data-access-item">
          <input type="checkbox" v-model="dataAccess.medications" @change="saveDataAccess" />
          <div class="access-info">
            <div class="access-label">
              <ion-icon name="medical-outline"></ion-icon>
              <span>Medications</span>
            </div>
            <p>Access your medication information</p>
          </div>
        </label>
      </div>
    </div>

    <!-- Uploaded Documents -->
    <div class="datasets-section">
      <div class="section-header">
        <h4>
          <ion-icon name="documents-outline"></ion-icon>
          Uploaded Documents
        </h4>
        <button class="btn-upload" @click="showUploadModal = true">
          <ion-icon name="add-outline"></ion-icon>
          Upload Document
        </button>
      </div>

      <div v-if="loading" class="loading-state">
        <ion-icon name="hourglass-outline" class="spinning"></ion-icon>
        <p>Loading datasets...</p>
      </div>

      <div v-else-if="datasets.length === 0" class="empty-state">
        <ion-icon name="folder-open-outline" class="empty-icon"></ion-icon>
        <h3>No Documents Yet</h3>
        <p>Upload therapeutic materials, worksheets, or reference documents to enhance this persona's knowledge.</p>
        <button class="btn-primary" @click="showUploadModal = true">
          <ion-icon name="cloud-upload-outline"></ion-icon>
          Upload First Document
        </button>
      </div>

      <div v-else class="datasets-list">
        <div v-for="item in datasets" :key="item.dataset.id" class="dataset-card">
          <div class="dataset-header">
            <div class="dataset-icon">
              <ion-icon :name="getFileIcon(item.dataset.file_type)"></ion-icon>
            </div>
            <div class="dataset-info">
              <h5>{{ item.dataset.name }}</h5>
              <div class="dataset-meta">
                <span class="meta-item">
                  <ion-icon name="document-text-outline"></ion-icon>
                  {{ item.dataset.chunk_count }} chunks
                </span>
                <span class="meta-item">
                  <ion-icon name="code-working-outline"></ion-icon>
                  {{ formatFileSize(item.dataset.file_size) }}
                </span>
                <span v-if="item.dataset.therapeutic_category" class="category-badge">
                  {{ item.dataset.therapeutic_category.toUpperCase() }}
                </span>
              </div>
            </div>
            <label class="toggle-switch">
              <input
                type="checkbox"
                :checked="item.enabled"
                @change="toggleDataset(item.dataset.id, !item.enabled)"
              />
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div v-if="item.dataset.description" class="dataset-description">
            {{ item.dataset.description }}
          </div>

          <div class="dataset-controls">
            <div class="control-group">
              <label>Relevance Weight</label>
              <div class="weight-control">
                <input
                  type="range"
                  min="0.1"
                  max="2.0"
                  step="0.1"
                  :value="item.weight"
                  @change="updateWeight(item.dataset.id, $event)"
                  :disabled="!item.enabled"
                />
                <span class="weight-value">{{ item.weight.toFixed(1) }}x</span>
              </div>
            </div>

            <div class="control-group">
              <label>Access Level</label>
              <select
                :value="item.access_level"
                @change="updateAccessLevel(item.dataset.id, $event)"
                :disabled="!item.enabled"
                class="access-select"
              >
                <option value="read">Full Access</option>
                <option value="summary">Summary Only</option>
                <option value="reference_only">Reference Only</option>
              </select>
            </div>
          </div>

          <div class="dataset-stats">
            <span v-if="item.usage_count > 0" class="stat-item">
              <ion-icon name="eye-outline"></ion-icon>
              Used {{ item.usage_count }} times
            </span>
            <span v-if="item.last_used_at" class="stat-item">
              <ion-icon name="time-outline"></ion-icon>
              Last used {{ formatDate(item.last_used_at) }}
            </span>
          </div>

          <div class="dataset-actions">
            <button class="btn-preview" @click="previewDataset(item.dataset.id)">
              <ion-icon name="eye-outline"></ion-icon>
              Preview
            </button>
            <button class="btn-unlink" @click="unlinkDataset(item.dataset.id)">
              <ion-icon name="unlink-outline"></ion-icon>
              Unlink
            </button>
            <button class="btn-delete" @click="deleteDataset(item.dataset.id)">
              <ion-icon name="trash-outline"></ion-icon>
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Upload Modal -->
    <DocumentUpload
      v-if="showUploadModal"
      @close="showUploadModal = false"
      @uploaded="handleUpload"
    />

    <!-- Preview Modal -->
    <DatasetPreview
      v-if="showPreviewModal && selectedDatasetId"
      :dataset-id="selectedDatasetId"
      @close="showPreviewModal = false"
    />

    <!-- Confirm Dialog -->
    <ConfirmDialog
      v-if="confirmDialog.show"
      :title="confirmDialog.title"
      :message="confirmDialog.message"
      :confirm-text="confirmDialog.confirmText"
      :cancel-text="confirmDialog.cancelText"
      @confirm="confirmDialog.onConfirm"
      @cancel="confirmDialog.show = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import DocumentUpload from './DocumentUpload.vue'
import DatasetPreview from './DatasetPreview.vue'
import ConfirmDialog from '../ConfirmDialog.vue'

const props = defineProps<{
  personaId: string
}>()

const emit = defineEmits(['updated'])

// State
const loading = ref(false)
const datasets = ref<any[]>([])
const dataAccess = reactive({
  journal_entries: false,
  mood_data: false,
  appointments: false,
  medications: false
})
const showUploadModal = ref(false)
const showPreviewModal = ref(false)
const selectedDatasetId = ref<string | null>(null)
const confirmDialog = reactive({
  show: false,
  title: '',
  message: '',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  onConfirm: () => {}
})

// Methods
async function loadDatasets() {
  loading.value = true
  try {
    const response = await fetch(`http://localhost:3000/api/personas/${props.personaId}/datasets`)
    const result = await response.json()
    
    datasets.value = result.data.datasets
    
    // Load builtin data access
    if (result.data.builtin_data_access) {
      Object.assign(dataAccess, result.data.builtin_data_access)
    }
  } catch (error) {
    console.error('Failed to load datasets:', error)
  } finally {
    loading.value = false
  }
}

async function saveDataAccess() {
  try {
    await fetch(`http://localhost:3000/api/personas/${props.personaId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        builtin_data_access: JSON.stringify(dataAccess)
      })
    })
    emit('updated')
  } catch (error) {
    console.error('Failed to save data access:', error)
  }
}

async function handleUpload(dataset: any) {
  // Link the uploaded dataset to this persona
  try {
    await fetch(`http://localhost:3000/api/personas/${props.personaId}/datasets/${dataset.dataset_id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        enabled: true,
        weight: 1.0,
        access_level: 'read'
      })
    })
    
    // Reload datasets
    await loadDatasets()
    emit('updated')
  } catch (error) {
    console.error('Failed to link dataset:', error)
  }
}

async function toggleDataset(datasetId: string, enabled: boolean) {
  try {
    await fetch(`http://localhost:3000/api/personas/${props.personaId}/datasets/${datasetId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled })
    })
    
    await loadDatasets()
    emit('updated')
  } catch (error) {
    console.error('Failed to toggle dataset:', error)
  }
}

async function updateWeight(datasetId: string, event: Event) {
  const weight = parseFloat((event.target as HTMLInputElement).value)
  try {
    await fetch(`http://localhost:3000/api/personas/${props.personaId}/datasets/${datasetId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weight })
    })
    
    await loadDatasets()
    emit('updated')
  } catch (error) {
    console.error('Failed to update weight:', error)
  }
}

async function updateAccessLevel(datasetId: string, event: Event) {
  const access_level = (event.target as HTMLSelectElement).value
  try {
    await fetch(`http://localhost:3000/api/personas/${props.personaId}/datasets/${datasetId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_level })
    })
    
    await loadDatasets()
    emit('updated')
  } catch (error) {
    console.error('Failed to update access level:', error)
  }
}

function previewDataset(datasetId: string) {
  selectedDatasetId.value = datasetId
  showPreviewModal.value = true
}

function unlinkDataset(datasetId: string) {
  const dataset = datasets.value.find(d => d.dataset.id === datasetId)
  confirmDialog.title = 'Unlink Dataset?'
  confirmDialog.message = `Remove "${dataset?.dataset.name}" from this persona? The document will still be available for other personas.`
  confirmDialog.confirmText = 'Unlink'
  confirmDialog.onConfirm = async () => {
    try {
      await fetch(`http://localhost:3000/api/personas/${props.personaId}/datasets/${datasetId}`, {
        method: 'DELETE'
      })
      
      await loadDatasets()
      emit('updated')
      confirmDialog.show = false
    } catch (error) {
      console.error('Failed to unlink dataset:', error)
    }
  }
  confirmDialog.show = true
}

function deleteDataset(datasetId: string) {
  const dataset = datasets.value.find(d => d.dataset.id === datasetId)
  confirmDialog.title = 'Delete Dataset?'
  confirmDialog.message = `Permanently delete "${dataset?.dataset.name}"? This will remove it from all personas and cannot be undone.`
  confirmDialog.confirmText = 'Delete'
  confirmDialog.onConfirm = async () => {
    try {
      await fetch(`http://localhost:3000/api/datasets/${datasetId}`, {
        method: 'DELETE'
      })
      
      await loadDatasets()
      emit('updated')
      confirmDialog.show = false
    } catch (error) {
      console.error('Failed to delete dataset:', error)
    }
  }
  confirmDialog.show = true
}

function getFileIcon(fileType: string): string {
  if (fileType === 'pdf') return 'document-text-outline'
  if (fileType === 'docx') return 'document-outline'
  if (fileType === 'txt') return 'document-text-outline'
  if (fileType === 'md') return 'code-outline'
  return 'document-outline'
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 10) / 10 + ' ' + sizes[i]
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

onMounted(() => {
  loadDatasets()
})
</script>

<style scoped>
.dataset-manager {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.manager-header h3 {
  font-size: 1.5rem;
  color: var(--text-primary, #1a1a1a);
  margin-bottom: 0.5rem;
}

.manager-header p {
  color: var(--text-secondary, #666);
  margin: 0;
}

/* Builtin Data Section */
.builtin-data-section {
  background: white;
  border: 1px solid var(--border-light, #e0e0e0);
  border-radius: 1rem;
  padding: 1.5rem;
}

.builtin-data-section h4 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
  color: var(--text-primary, #1a1a1a);
}

.section-description {
  color: var(--text-secondary, #666);
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.data-access-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.data-access-item {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  border: 2px solid var(--border-light, #e0e0e0);
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.3s;
}

.data-access-item:hover {
  border-color: #8b5cf6;
  background: rgba(139, 92, 246, 0.05);
}

.data-access-item input[type='checkbox'] {
  margin-top: 0.25rem;
}

.access-info {
  flex: 1;
}

.access-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  font-size: 0.95rem;
}

.access-info p {
  font-size: 0.85rem;
  color: var(--text-secondary, #666);
  margin: 0;
}

/* Datasets Section */
.datasets-section {
  background: white;
  border: 1px solid var(--border-light, #e0e0e0);
  border-radius: 1rem;
  padding: 1.5rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h4 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
  margin: 0;
}

.btn-upload {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 0.9rem;
}

.btn-upload:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
}

.loading-state ion-icon,
.empty-icon {
  font-size: 3rem;
  opacity: 0.4;
  margin-bottom: 1rem;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.empty-state h3 {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
  color: var(--text-primary, #1a1a1a);
}

.empty-state p {
  color: var(--text-secondary, #666);
  margin-bottom: 1.5rem;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

/* Dataset Cards */
.datasets-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.dataset-card {
  border: 1px solid var(--border-light, #e0e0e0);
  border-radius: 0.75rem;
  padding: 1.25rem;
  transition: all 0.3s;
}

.dataset-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.dataset-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.dataset-icon {
  font-size: 2rem;
  color: #8b5cf6;
}

.dataset-info {
  flex: 1;
}

.dataset-info h5 {
  font-size: 1rem;
  margin: 0 0 0.5rem 0;
  color: var(--text-primary, #1a1a1a);
}

.dataset-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  font-size: 0.85rem;
  color: var(--text-secondary, #666);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.category-badge {
  background: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-weight: 600;
  font-size: 0.75rem;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.4s;
  border-radius: 24px;
}

.toggle-slider:before {
  position: absolute;
  content: '';
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
}

input:checked + .toggle-slider {
  background-color: #8b5cf6;
}

input:checked + .toggle-slider:before {
  transform: translateX(20px);
}

.dataset-description {
  font-size: 0.9rem;
  color: var(--text-secondary, #666);
  margin-bottom: 1rem;
  line-height: 1.5;
}

.dataset-controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.control-group label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text-primary, #1a1a1a);
}

.weight-control {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.weight-control input[type='range'] {
  flex: 1;
}

.weight-value {
  font-weight: 600;
  color: #8b5cf6;
  min-width: 40px;
}

.access-select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--border-light, #e0e0e0);
  border-radius: 0.5rem;
  font-size: 0.9rem;
}

.dataset-stats {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  font-size: 0.85rem;
  color: var(--text-secondary, #666);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.dataset-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn-preview,
.btn-unlink,
.btn-delete {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-light, #e0e0e0);
  border-radius: 0.5rem;
  background: white;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 0.85rem;
  font-weight: 500;
}

.btn-preview {
  color: #3b82f6;
  border-color: #3b82f6;
}

.btn-preview:hover {
  background: #3b82f6;
  color: white;
}

.btn-unlink {
  color: #f59e0b;
  border-color: #f59e0b;
}

.btn-unlink:hover {
  background: #f59e0b;
  color: white;
}

.btn-delete {
  color: #ef4444;
  border-color: #ef4444;
}

.btn-delete:hover {
  background: #ef4444;
  color: white;
}

@media (max-width: 768px) {
  .data-access-grid {
    grid-template-columns: 1fr;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .btn-upload {
    width: 100%;
    justify-content: center;
  }

  .dataset-controls {
    grid-template-columns: 1fr;
  }
}
</style>
