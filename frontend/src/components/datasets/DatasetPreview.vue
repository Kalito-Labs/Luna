<template>
  <div class="dataset-preview-modal" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <div>
          <h2>{{ dataset?.name || 'Dataset Preview' }}</h2>
          <p v-if="dataset">{{ dataset.file_name }} • {{ formatFileSize(dataset.file_size) }}</p>
        </div>
        <button class="close-btn" @click="$emit('close')" aria-label="Close">
          <ion-icon name="close-outline"></ion-icon>
        </button>
      </div>

      <div v-if="loading" class="loading-state">
        <ion-icon name="hourglass-outline" class="spinning"></ion-icon>
        <p>Loading chunks...</p>
      </div>

      <div v-else-if="error" class="error-state">
        <ion-icon name="alert-circle-outline"></ion-icon>
        <p>{{ error }}</p>
      </div>

      <div v-else class="preview-content">
        <div class="preview-stats">
          <div class="stat-card">
            <ion-icon name="documents-outline"></ion-icon>
            <div>
              <span class="stat-value">{{ chunks.length }}</span>
              <span class="stat-label">Chunks</span>
            </div>
          </div>
          <div class="stat-card">
            <ion-icon name="code-working-outline"></ion-icon>
            <div>
              <span class="stat-value">{{ dataset?.chunk_count }}</span>
              <span class="stat-label">Total</span>
            </div>
          </div>
          <div v-if="dataset?.therapeutic_category" class="stat-card category">
            <ion-icon name="medkit-outline"></ion-icon>
            <div>
              <span class="stat-value">{{ dataset.therapeutic_category.toUpperCase() }}</span>
              <span class="stat-label">Category</span>
            </div>
          </div>
        </div>

        <div class="chunks-list">
          <div v-for="chunk in chunks" :key="chunk.id" class="chunk-card">
            <div class="chunk-header">
              <span class="chunk-index">Chunk #{{ chunk.chunk_index + 1 }}</span>
              <div class="chunk-meta">
                <span v-if="chunk.section_title" class="meta-item">
                  <ion-icon name="bookmark-outline"></ion-icon>
                  {{ chunk.section_title }}
                </span>
                <span v-if="chunk.page_number" class="meta-item">
                  <ion-icon name="document-outline"></ion-icon>
                  Page {{ chunk.page_number }}
                </span>
                <span v-if="chunk.token_count" class="meta-item">
                  <ion-icon name="text-outline"></ion-icon>
                  {{ chunk.token_count }} tokens
                </span>
              </div>
            </div>

            <div class="chunk-content">
              {{ chunk.content }}
            </div>

            <div v-if="chunk.therapeutic_tags" class="chunk-tags">
              <span
                v-for="tag in parseJSONArray(chunk.therapeutic_tags)"
                :key="tag"
                class="tag"
              >
                {{ tag }}
              </span>
            </div>
          </div>
        </div>

        <div v-if="chunks.length < (dataset?.chunk_count || 0)" class="load-more">
          <p>Showing {{ chunks.length }} of {{ dataset?.chunk_count }} chunks</p>
          <button class="btn-secondary" @click="loadChunks(100)">
            Load All Chunks
          </button>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-secondary" @click="$emit('close')">
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{
  datasetId: string
}>()

const emit = defineEmits(['close'])

// State
const loading = ref(false)
const error = ref('')
const dataset = ref<any>(null)
const chunks = ref<any[]>([])

// Methods
async function loadDataset() {
  try {
    const response = await fetch(`http://localhost:3000/api/datasets/${props.datasetId}`)
    if (!response.ok) throw new Error('Failed to load dataset')
    
    const result = await response.json()
    dataset.value = result.data
  } catch (err: any) {
    error.value = err.message
  }
}

async function loadChunks(limit: number = 50) {
  loading.value = true
  error.value = ''
  
  try {
    const response = await fetch(
      `http://localhost:3000/api/datasets/${props.datasetId}/chunks?limit=${limit}`
    )
    
    if (!response.ok) throw new Error('Failed to load chunks')
    
    const result = await response.json()
    chunks.value = result.data.chunks
  } catch (err: any) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

function formatFileSize(bytes: number): string {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 10) / 10 + ' ' + sizes[i]
}

function parseJSONArray(jsonString: string): string[] {
  try {
    return JSON.parse(jsonString)
  } catch {
    return []
  }
}

onMounted(async () => {
  await loadDataset()
  await loadChunks()
})
</script>

<style scoped>
.dataset-preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  border-radius: 1rem;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 2rem;
  border-bottom: 1px solid var(--border-light, #e0e0e0);
}

.modal-header h2 {
  font-size: 1.5rem;
  color: var(--text-primary, #1a1a1a);
  margin: 0 0 0.5rem 0;
}

.modal-header p {
  color: var(--text-secondary, #666);
  margin: 0;
  font-size: 0.9rem;
}

.close-btn {
  background: var(--bg-light, #f5f5f5);
  border: 1px solid var(--border-light, #e0e0e0);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.close-btn:hover {
  background: #ef4444;
  color: white;
  border-color: #ef4444;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
}

.loading-state ion-icon,
.error-state ion-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.6;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.error-state {
  color: #ef4444;
}

.preview-content {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
}

.preview-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--bg-light, #f5f5f5);
  border-radius: 0.75rem;
}

.stat-card ion-icon {
  font-size: 2rem;
  color: #8b5cf6;
}

.stat-card.category ion-icon {
  color: #10b981;
}

.stat-value {
  display: block;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary, #1a1a1a);
  line-height: 1.2;
}

.stat-label {
  display: block;
  font-size: 0.85rem;
  color: var(--text-secondary, #666);
}

.chunks-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.chunk-card {
  background: white;
  border: 1px solid var(--border-light, #e0e0e0);
  border-radius: 0.75rem;
  padding: 1.25rem;
  transition: all 0.3s;
}

.chunk-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chunk-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  gap: 1rem;
}

.chunk-index {
  font-size: 0.85rem;
  font-weight: 700;
  color: #8b5cf6;
  background: rgba(139, 92, 246, 0.1);
  padding: 0.25rem 0.75rem;
  border-radius: 0.5rem;
}

.chunk-meta {
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

.chunk-content {
  background: var(--bg-light, #f5f5f5);
  padding: 1rem;
  border-radius: 0.5rem;
  line-height: 1.6;
  color: var(--text-primary, #1a1a1a);
  white-space: pre-wrap;
  word-wrap: break-word;
  font-size: 0.95rem;
  font-family: system-ui, -apple-system, sans-serif;
}

.chunk-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
}

.tag {
  background: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
  padding: 0.25rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.8rem;
  font-weight: 500;
}

.load-more {
  text-align: center;
  padding: 2rem 1rem;
  border-top: 1px solid var(--border-light, #e0e0e0);
  margin-top: 2rem;
}

.load-more p {
  color: var(--text-secondary, #666);
  margin-bottom: 1rem;
}

.modal-footer {
  padding: 1.5rem 2rem;
  border-top: 1px solid var(--border-light, #e0e0e0);
  display: flex;
  justify-content: flex-end;
}

.btn-secondary {
  padding: 0.75rem 1.5rem;
  background: white;
  border: 1px solid var(--border-light, #e0e0e0);
  border-radius: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-secondary:hover {
  background: var(--bg-light, #f5f5f5);
}

@media (max-width: 640px) {
  .modal-content {
    max-height: 95vh;
  }

  .modal-header,
  .preview-content,
  .modal-footer {
    padding: 1.5rem;
  }

  .chunk-header {
    flex-direction: column;
  }

  .chunk-meta {
    width: 100%;
  }
}
</style>
