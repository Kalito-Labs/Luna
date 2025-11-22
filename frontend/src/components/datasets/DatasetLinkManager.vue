<template>
  <div class="dataset-link-manager">
    <div class="manager-header">
      <div>
        <h3>📚 Linked Documents</h3>
        <p>Select which documents from your Library this persona can access</p>
      </div>
      <button class="btn-open-library" @click="openLibrary">
        <ion-icon name="library-outline"></ion-icon>
        Open Library
      </button>
    </div>

    <!-- Success/Error Message -->
    <transition name="fade">
      <div v-if="message.show" class="message" :class="message.type">
        {{ message.text }}
      </div>
    </transition>

    <!-- Loading -->
    <div v-if="loading" class="loading">
      <ion-icon name="hourglass-outline" class="spinning"></ion-icon>
      <span>Loading documents...</span>
    </div>

    <!-- Document List -->
    <div v-else-if="availableDatasets.length > 0" class="datasets-list">
      <div
        v-for="dataset in availableDatasets"
        :key="dataset.id"
        class="dataset-item"
        :class="{ linked: isLinked(dataset.id) }"
      >
        <div class="dataset-icon" :class="dataset.file_type">
          <ion-icon :name="getFileIcon(dataset.file_type)"></ion-icon>
        </div>

        <div class="dataset-info">
          <h4>{{ dataset.name }}</h4>
          <p v-if="dataset.description" class="description">{{ dataset.description }}</p>
          <div class="meta">
            <span>
              <ion-icon name="document-text-outline"></ion-icon>
              {{ dataset.file_name }}
            </span>
            <span>
              <ion-icon name="filing-outline"></ion-icon>
              {{ dataset.chunk_count }} chunks
            </span>
          </div>
          <span v-if="dataset.therapeutic_category" class="tag" :class="dataset.therapeutic_category">
            {{ dataset.therapeutic_category.toUpperCase() }}
          </span>
        </div>

        <div class="dataset-controls">
          <label class="toggle-switch">
            <input
              type="checkbox"
              :checked="isLinked(dataset.id)"
              @change="toggleLink(dataset.id, $event)"
            />
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <ion-icon name="folder-open-outline"></ion-icon>
      <h4>No documents in your library</h4>
      <p>Upload documents to your Library first, then link them to this persona.</p>
      <button class="btn-primary" @click="openLibrary">
        <ion-icon name="library-outline"></ion-icon>
        Go to Library
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps<{
  personaId: string
}>()

const emit = defineEmits<{
  updated: []
}>()

const router = useRouter()
const loading = ref(false)
const availableDatasets = ref<any[]>([])
const linkedDatasetIds = ref<string[]>([])
const message = ref({ show: false, text: '', type: 'success' as 'success' | 'error' })

async function loadDatasets() {
  loading.value = true
  try {
    // Load all datasets from library
    const datasetsRes = await fetch('http://localhost:3000/api/datasets')
    const datasetsData = await datasetsRes.json()
    availableDatasets.value = datasetsData.data

    // Load which datasets are linked to this persona
    const linksRes = await fetch(`http://localhost:3000/api/personas/${props.personaId}/datasets`)
    const linksData = await linksRes.json()
    linkedDatasetIds.value = linksData.data.datasets.map((d: any) => d.dataset.id)
  } catch (error) {
    console.error('Failed to load datasets:', error)
  } finally {
    loading.value = false
  }
}

function isLinked(datasetId: string): boolean {
  return linkedDatasetIds.value.includes(datasetId)
}

async function toggleLink(datasetId: string, event: Event) {
  const checkbox = event.target as HTMLInputElement
  const shouldLink = checkbox.checked
  const dataset = availableDatasets.value.find(d => d.id === datasetId)
  const datasetName = dataset?.name || 'Document'

  try {
    if (shouldLink) {
      // Create link
      const response = await fetch(`http://localhost:3000/api/personas/${props.personaId}/datasets/${datasetId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: true,
          weight: 1.0,
          access_level: 'read'
        })
      })
      
      if (!response.ok) throw new Error('Failed to link dataset')
      
      linkedDatasetIds.value.push(datasetId)
      showMessage(`✓ Linked "${datasetName}"`, 'success')
    } else {
      // Remove link
      const response = await fetch(`http://localhost:3000/api/personas/${props.personaId}/datasets/${datasetId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to unlink dataset')
      
      linkedDatasetIds.value = linkedDatasetIds.value.filter(id => id !== datasetId)
      showMessage(`✓ Unlinked "${datasetName}"`, 'success')
    }
    
    emit('updated')
  } catch (error) {
    console.error('Failed to toggle link:', error)
    checkbox.checked = !shouldLink
    showMessage(`✗ Failed to ${shouldLink ? 'link' : 'unlink'} "${datasetName}"`, 'error')
  }
}

function showMessage(text: string, type: 'success' | 'error') {
  message.value = { show: true, text, type }
  setTimeout(() => {
    message.value.show = false
  }, 3000)
}

function getFileIcon(fileType: string): string {
  const icons: Record<string, string> = {
    pdf: 'document-text-outline',
    docx: 'document-outline',
    txt: 'document-text-outline',
    md: 'code-outline'
  }
  return icons[fileType] || 'document-outline'
}

function openLibrary() {
  router.push({ name: 'library' })
}

onMounted(() => {
  loadDatasets()
})

watch(() => props.personaId, () => {
  loadDatasets()
})
</script>

<style scoped>
.dataset-link-manager {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.manager-header > div {
  flex: 1;
}

.manager-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary, #1a1a1a);
  margin: 0 0 0.25rem 0;
}

.manager-header p {
  font-size: 0.9rem;
  color: var(--text-secondary, #666);
  margin: 0;
}

.btn-open-library {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: white;
  border: 1px solid #8b5cf6;
  color: #8b5cf6;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  flex-shrink: 0;
}

.btn-open-library:hover {
  background: #8b5cf6;
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

/* Message Toast */
.message {
  padding: 0.875rem 1.25rem;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.message.success {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.message.error {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem;
  color: var(--text-secondary, #666);
}

.spinning {
  font-size: 1.5rem;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.datasets-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 400px;
  overflow-y: auto;
  padding: 0.25rem;
}

.dataset-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: white;
  border: 2px solid var(--border-light, #e0e0e0);
  border-radius: 0.75rem;
  transition: all 0.3s;
}

.dataset-item:hover {
  border-color: #8b5cf6;
}

.dataset-item.linked {
  background: rgba(139, 92, 246, 0.05);
  border-color: #8b5cf6;
}

.dataset-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  font-size: 1.5rem;
  background: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
  flex-shrink: 0;
}

.dataset-icon.pdf {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.dataset-icon.docx {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.dataset-icon.txt {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.dataset-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.dataset-info h4 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary, #1a1a1a);
  margin: 0;
}

.description {
  font-size: 0.85rem;
  color: var(--text-secondary, #666);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  font-size: 0.8rem;
  color: var(--text-secondary, #666);
  margin-top: 0.25rem;
}

.meta span {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.meta ion-icon {
  font-size: 0.9rem;
}

.tag {
  display: inline-block;
  padding: 0.25rem 0.625rem;
  border-radius: 0.375rem;
  font-size: 0.7rem;
  font-weight: 600;
  background: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
  width: fit-content;
  margin-top: 0.25rem;
}

.tag.cbt { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
.tag.dbt { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
.tag.mindfulness { background: rgba(16, 185, 129, 0.1); color: #10b981; }
.tag.trauma { background: rgba(236, 72, 153, 0.1); color: #ec4899; }

.dataset-controls {
  flex-shrink: 0;
}

.toggle-switch {
  position: relative;
  width: 52px;
  height: 28px;
  cursor: pointer;
  display: block;
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

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  text-align: center;
  background: var(--bg-light, #f9f9f9);
  border-radius: 0.75rem;
  border: 2px dashed var(--border-light, #e0e0e0);
}

.empty-state ion-icon {
  font-size: 3rem;
  color: var(--text-muted, #999);
  margin-bottom: 1rem;
}

.empty-state h4 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary, #1a1a1a);
  margin: 0 0 0.5rem 0;
}

.empty-state p {
  font-size: 0.9rem;
  color: var(--text-secondary, #666);
  margin: 0 0 1.5rem 0;
  max-width: 400px;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(139, 92, 246, 0.4);
}
</style>
