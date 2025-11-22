<template>
  <div class="library-view">
    <!-- Header -->
    <div class="library-header">
      <div class="header-content">
        <div class="header-text">
          <h1>📚 Knowledge Library</h1>
          <p>Upload and manage your therapeutic documents, worksheets, and reference materials</p>
        </div>
        <button class="btn-upload-primary" @click="showUploadModal = true">
          <ion-icon name="cloud-upload-outline"></ion-icon>
          Upload Document
        </button>
      </div>

      <!-- Stats Overview -->
      <div class="stats-grid">
        <div class="stat-card">
          <ion-icon name="documents-outline" class="stat-icon"></ion-icon>
          <div class="stat-content">
            <span class="stat-value">{{ datasets.length }}</span>
            <span class="stat-label">Total Documents</span>
          </div>
        </div>
        <div class="stat-card">
          <ion-icon name="filing-outline" class="stat-icon"></ion-icon>
          <div class="stat-content">
            <span class="stat-value">{{ totalChunks }}</span>
            <span class="stat-label">Total Chunks</span>
          </div>
        </div>
        <div class="stat-card">
          <ion-icon name="save-outline" class="stat-icon"></ion-icon>
          <div class="stat-content">
            <span class="stat-value">{{ formatTotalSize(totalSize) }}</span>
            <span class="stat-label">Storage Used</span>
          </div>
        </div>
        <div class="stat-card">
          <ion-icon name="link-outline" class="stat-icon"></ion-icon>
          <div class="stat-content">
            <span class="stat-value">{{ linkedCount }}</span>
            <span class="stat-label">Linked to Personas</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Search & Filter Bar -->
    <div class="toolbar">
      <div class="search-box">
        <ion-icon name="search-outline"></ion-icon>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search documents..."
          class="search-input"
        />
      </div>

      <div class="filters">
        <select v-model="filterCategory" class="filter-select">
          <option value="">All Categories</option>
          <option value="cbt">CBT</option>
          <option value="dbt">DBT</option>
          <option value="mindfulness">Mindfulness</option>
          <option value="trauma">Trauma Care</option>
          <option value="anxiety">Anxiety</option>
          <option value="depression">Depression</option>
          <option value="crisis">Crisis</option>
        </select>

        <select v-model="filterType" class="filter-select">
          <option value="">All Types</option>
          <option value="pdf">PDF</option>
          <option value="docx">DOCX</option>
          <option value="txt">TXT</option>
          <option value="md">Markdown</option>
        </select>

        <select v-model="sortBy" class="filter-select">
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="name">Name A-Z</option>
          <option value="size">Size</option>
        </select>
      </div>

      <div class="view-toggle">
        <button
          class="toggle-btn"
          :class="{ active: viewMode === 'grid' }"
          @click="viewMode = 'grid'"
          title="Grid View"
        >
          <ion-icon name="grid-outline"></ion-icon>
        </button>
        <button
          class="toggle-btn"
          :class="{ active: viewMode === 'list' }"
          @click="viewMode = 'list'"
          title="List View"
        >
          <ion-icon name="list-outline"></ion-icon>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <ion-icon name="hourglass-outline" class="spinning"></ion-icon>
      <p>Loading library...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredDatasets.length === 0 && !loading" class="empty-state">
      <ion-icon name="folder-open-outline" class="empty-icon"></ion-icon>
      <h2>{{ searchQuery || filterCategory || filterType ? 'No documents found' : 'Your library is empty' }}</h2>
      <p v-if="searchQuery || filterCategory || filterType">
        Try adjusting your search or filters
      </p>
      <p v-else>
        Upload your first therapeutic document to get started. PDFs, Word docs, text files - anything that can help your personas provide better support.
      </p>
      <button v-if="!searchQuery && !filterCategory && !filterType" class="btn-primary-large" @click="showUploadModal = true">
        <ion-icon name="cloud-upload-outline"></ion-icon>
        Upload Your First Document
      </button>
    </div>

    <!-- Documents Grid/List -->
    <div v-else class="documents-container" :class="viewMode">
      <div
        v-for="dataset in filteredDatasets"
        :key="dataset.id"
        class="document-card"
        :class="viewMode"
      >
        <!-- Document Icon/Preview -->
        <div class="document-visual">
          <div class="file-icon" :class="dataset.file_type">
            <ion-icon :name="getFileIcon(dataset.file_type)"></ion-icon>
          </div>
          <span v-if="dataset.processing_status === 'processing'" class="processing-badge">
            Processing...
          </span>
          <span v-else-if="dataset.processing_status === 'error'" class="error-badge">
            Error
          </span>
        </div>

        <!-- Document Info -->
        <div class="document-info">
          <h3 class="document-name">{{ dataset.name }}</h3>
          <p v-if="dataset.description" class="document-description">
            {{ dataset.description }}
          </p>

          <div class="document-meta">
            <span class="meta-item">
              <ion-icon name="document-text-outline"></ion-icon>
              {{ dataset.file_name }}
            </span>
            <span class="meta-item">
              <ion-icon name="filing-outline"></ion-icon>
              {{ dataset.chunk_count }} chunks
            </span>
            <span class="meta-item">
              <ion-icon name="code-working-outline"></ion-icon>
              {{ formatFileSize(dataset.file_size) }}
            </span>
            <span class="meta-item">
              <ion-icon name="calendar-outline"></ion-icon>
              {{ formatDate(dataset.created_at) }}
            </span>
          </div>

          <div v-if="dataset.therapeutic_category" class="document-tags">
            <span class="tag" :class="dataset.therapeutic_category">
              {{ dataset.therapeutic_category.toUpperCase() }}
            </span>
          </div>

          <!-- Linked Personas Info -->
          <div v-if="getLinkedPersonas(dataset.id).length > 0" class="linked-personas">
            <ion-icon name="people-outline"></ion-icon>
            <span>Linked to {{ getLinkedPersonas(dataset.id).length }} persona(s)</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="document-actions">
          <button class="action-btn preview" @click="previewDataset(dataset.id)" title="Preview">
            <ion-icon name="eye-outline"></ion-icon>
            <span>Preview</span>
          </button>
          <button class="action-btn link" @click="manageLinks(dataset)" title="Link to Personas">
            <ion-icon name="link-outline"></ion-icon>
            <span>Link</span>
          </button>
          <button class="action-btn delete" @click="confirmDelete(dataset)" title="Delete">
            <ion-icon name="trash-outline"></ion-icon>
            <span>Delete</span>
          </button>
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
      :show="confirmDialog.show"
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
import { ref, computed, onMounted, reactive } from 'vue'
import DocumentUpload from '../components/datasets/DocumentUpload.vue'
import DatasetPreview from '../components/datasets/DatasetPreview.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'

// State
const loading = ref(false)
const datasets = ref<any[]>([])
const personaLinks = ref<any[]>([])
const searchQuery = ref('')
const filterCategory = ref('')
const filterType = ref('')
const sortBy = ref('newest')
const viewMode = ref<'grid' | 'list'>('grid')
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

// Computed
const totalChunks = computed(() => {
  return datasets.value.reduce((sum, d) => sum + (d.chunk_count || 0), 0)
})

const totalSize = computed(() => {
  return datasets.value.reduce((sum, d) => sum + (d.file_size || 0), 0)
})

const linkedCount = computed(() => {
  return datasets.value.filter(d => getLinkedPersonas(d.id).length > 0).length
})

const filteredDatasets = computed(() => {
  let filtered = [...datasets.value]

  // Search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(d =>
      d.name.toLowerCase().includes(query) ||
      d.description?.toLowerCase().includes(query) ||
      d.file_name.toLowerCase().includes(query)
    )
  }

  // Filter by category
  if (filterCategory.value) {
    filtered = filtered.filter(d => d.therapeutic_category === filterCategory.value)
  }

  // Filter by type
  if (filterType.value) {
    filtered = filtered.filter(d => d.file_type === filterType.value)
  }

  // Sort
  filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      case 'name':
        return a.name.localeCompare(b.name)
      case 'size':
        return b.file_size - a.file_size
      default:
        return 0
    }
  })

  return filtered
})

// Methods
async function loadLibrary() {
  loading.value = true
  try {
    const response = await fetch('http://localhost:3000/api/datasets')
    const result = await response.json()
    datasets.value = result.data
    
    // Load all persona links to show which datasets are linked
    await loadPersonaLinks()
  } catch (error) {
    console.error('Failed to load library:', error)
  } finally {
    loading.value = false
  }
}

async function loadPersonaLinks() {
  try {
    // Get all personas
    const personasRes = await fetch('http://localhost:3000/api/personas')
    const personasData = await personasRes.json()
    
    // For each persona, get their datasets
    const allLinks: any[] = []
    for (const persona of personasData.data) {
      const linksRes = await fetch(`http://localhost:3000/api/personas/${persona.id}/datasets`)
      const linksData = await linksRes.json()
      
      linksData.data.datasets.forEach((link: any) => {
        allLinks.push({
          persona_id: persona.id,
          persona_name: persona.name,
          dataset_id: link.dataset.id,
          enabled: link.enabled
        })
      })
    }
    
    personaLinks.value = allLinks
  } catch (error) {
    console.error('Failed to load persona links:', error)
  }
}

function getLinkedPersonas(datasetId: string) {
  return personaLinks.value.filter(link => link.dataset_id === datasetId)
}

function handleUpload() {
  showUploadModal.value = false
  loadLibrary()
}

function previewDataset(datasetId: string) {
  selectedDatasetId.value = datasetId
  showPreviewModal.value = true
}

function manageLinks(dataset: any) {
  // Navigate to personas page - user can link documents from Persona Edit modal
  alert(`To link "${dataset.name}" to a persona:\n\n1. Go to Personas page\n2. Edit a persona\n3. Go to Datasets tab\n4. Toggle on this document\n\nOr use the Datasets tab when editing any persona!`)
}

function confirmDelete(dataset: any) {
  confirmDialog.title = 'Delete Document?'
  confirmDialog.message = `Permanently delete "${dataset.name}"? This will remove it from all personas and cannot be undone.`
  confirmDialog.confirmText = 'Delete'
  confirmDialog.onConfirm = async () => {
    try {
      await fetch(`http://localhost:3000/api/datasets/${dataset.id}`, {
        method: 'DELETE'
      })
      
      await loadLibrary()
      confirmDialog.show = false
    } catch (error) {
      console.error('Failed to delete dataset:', error)
    }
  }
  confirmDialog.show = true
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

function formatFileSize(bytes: number): string {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 10) / 10 + ' ' + sizes[i]
}

function formatTotalSize(bytes: number): string {
  if (!bytes) return '0 MB'
  const mb = bytes / (1024 * 1024)
  if (mb < 1) return '<1 MB'
  return Math.round(mb * 10) / 10 + ' MB'
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  return date.toLocaleDateString()
}

onMounted(() => {
  loadLibrary()
})
</script>

<style scoped>
.library-view {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

/* Header */
.library-header {
  margin-bottom: 2rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  gap: 2rem;
}

.header-text h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text-primary, #1a1a1a);
  margin-bottom: 0.5rem;
}

.header-text p {
  font-size: 1.125rem;
  color: var(--text-secondary, #666);
  margin: 0;
}

.btn-upload-primary {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-size: 1.125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
  flex-shrink: 0;
}

.btn-upload-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.4);
}

.btn-upload-primary ion-icon {
  font-size: 1.5rem;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1.5rem;
  background: white;
  border: 1px solid var(--border-light, #e0e0e0);
  border-radius: 1rem;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  font-size: 2.5rem;
  color: #8b5cf6;
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary, #1a1a1a);
  line-height: 1;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.9rem;
  color: var(--text-secondary, #666);
  font-weight: 500;
}

/* Toolbar */
.toolbar {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  align-items: center;
}

.search-box {
  flex: 1;
  min-width: 250px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  background: white;
  border: 1px solid var(--border-light, #e0e0e0);
  border-radius: 0.75rem;
  transition: all 0.3s;
}

.search-box:focus-within {
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.search-box ion-icon {
  font-size: 1.25rem;
  color: var(--text-muted, #999);
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 1rem;
  color: var(--text-primary, #1a1a1a);
}

.search-input::placeholder {
  color: var(--text-muted, #999);
}

.filters {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.filter-select {
  padding: 0.75rem 1rem;
  background: white;
  border: 1px solid var(--border-light, #e0e0e0);
  border-radius: 0.75rem;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s;
}

.filter-select:hover {
  border-color: #8b5cf6;
}

.filter-select:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.view-toggle {
  display: flex;
  gap: 0.5rem;
  background: white;
  border: 1px solid var(--border-light, #e0e0e0);
  border-radius: 0.75rem;
  padding: 0.25rem;
}

.toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: transparent;
  border: none;
  border-radius: 0.5rem;
  color: var(--text-muted, #999);
  cursor: pointer;
  transition: all 0.3s;
  font-size: 1.25rem;
}

.toggle-btn:hover {
  background: var(--bg-light, #f5f5f5);
  color: var(--text-primary, #1a1a1a);
}

.toggle-btn.active {
  background: #8b5cf6;
  color: white;
}

/* Loading/Empty States */
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.loading-state ion-icon,
.empty-icon {
  font-size: 4rem;
  opacity: 0.4;
  margin-bottom: 1.5rem;
  color: #8b5cf6;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.empty-state h2 {
  font-size: 1.75rem;
  margin-bottom: 0.75rem;
  color: var(--text-primary, #1a1a1a);
}

.empty-state p {
  font-size: 1.125rem;
  color: var(--text-secondary, #666);
  max-width: 600px;
  margin-bottom: 2rem;
}

.btn-primary-large {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-size: 1.125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary-large:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.4);
}

/* Documents Container */
.documents-container {
  display: grid;
  gap: 1.5rem;
}

.documents-container.grid {
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
}

.documents-container.list {
  grid-template-columns: 1fr;
}

/* Document Card */
.document-card {
  background: white;
  border: 1px solid var(--border-light, #e0e0e0);
  border-radius: 1rem;
  padding: 1.5rem;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.document-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  border-color: #8b5cf6;
}

.document-card.list {
  flex-direction: row;
  align-items: center;
}

.document-visual {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-icon {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.75rem;
  font-size: 2rem;
  background: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
}

.file-icon.pdf {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.file-icon.docx {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.file-icon.txt {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.processing-badge,
.error-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  padding: 0.25rem 0.625rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.processing-badge {
  background: #f59e0b;
  color: white;
}

.error-badge {
  background: #ef4444;
  color: white;
}

.document-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.document-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary, #1a1a1a);
  margin: 0;
  line-height: 1.3;
}

.document-description {
  font-size: 0.95rem;
  color: var(--text-secondary, #666);
  margin: 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.document-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.85rem;
  color: var(--text-secondary, #666);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.meta-item ion-icon {
  font-size: 1rem;
}

.document-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  padding: 0.25rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  background: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
}

.tag.cbt { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
.tag.dbt { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
.tag.mindfulness { background: rgba(16, 185, 129, 0.1); color: #10b981; }
.tag.trauma { background: rgba(236, 72, 153, 0.1); color: #ec4899; }

.linked-personas {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
  border-radius: 0.5rem;
  font-size: 0.85rem;
  font-weight: 500;
  width: fit-content;
}

.linked-personas ion-icon {
  font-size: 1rem;
}

.document-actions {
  display: flex;
  gap: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--border-light, #e0e0e0);
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: white;
  border: 1px solid var(--border-light, #e0e0e0);
  border-radius: 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.action-btn ion-icon {
  font-size: 1.125rem;
}

.action-btn.preview {
  color: #3b82f6;
  border-color: #3b82f6;
}

.action-btn.preview:hover {
  background: #3b82f6;
  color: white;
}

.action-btn.link {
  color: #8b5cf6;
  border-color: #8b5cf6;
}

.action-btn.link:hover {
  background: #8b5cf6;
  color: white;
}

.action-btn.delete {
  color: #ef4444;
  border-color: #ef4444;
}

.action-btn.delete:hover {
  background: #ef4444;
  color: white;
}

@media (max-width: 768px) {
  .library-view {
    padding: 1rem;
  }

  .header-content {
    flex-direction: column;
  }

  .btn-upload-primary {
    width: 100%;
    justify-content: center;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .toolbar {
    flex-direction: column;
  }

  .search-box,
  .filters,
  .view-toggle {
    width: 100%;
  }

  .documents-container.grid {
    grid-template-columns: 1fr;
  }

  .document-card.list {
    flex-direction: column;
  }
}
</style>
