<template>
  <div class="library-view">
    <!-- Hamburger Menu -->
    <div class="hamburger-wrapper">
      <HamburgerMenu />
    </div>

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
import HamburgerMenu from '../components/HamburgerMenu.vue'
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
/* ================================
   LibraryView — Purple Gradient Theme
   Luna's unified design system
================================== */

.library-view {
  min-height: 100vh;
  background: linear-gradient(135deg, rgba(15, 23, 42, 1) 0%, rgba(30, 41, 59, 0.98) 50%, rgba(67, 56, 202, 0.15) 100%);
  padding: 2rem;
  position: relative;
}

/* Hamburger Menu */
.hamburger-wrapper {
  position: fixed;
  top: 1.5rem;
  left: 1.5rem;
  z-index: 1000;
}

/* Header */
.library-header {
  margin-bottom: 2rem;
  padding-top: 1rem;
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
  background: linear-gradient(135deg, rgba(139, 92, 246, 1) 0%, rgba(196, 181, 253, 1) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
}

.header-text p {
  font-size: 1.125rem;
  color: rgba(196, 181, 253, 0.8);
  margin: 0;
  line-height: 1.5;
}

.btn-upload-primary {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.8) 0%, rgba(124, 58, 237, 0.9) 100%);
  color: white;
  border: 1px solid rgba(139, 92, 246, 0.5);
  border-radius: 16px;
  font-size: 1.125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
  flex-shrink: 0;
}

.btn-upload-primary:hover {
  background: linear-gradient(135deg, rgba(139, 92, 246, 1) 0%, rgba(124, 58, 237, 1) 100%);
  transform: translateY(-3px);
  box-shadow: 0 12px 40px rgba(139, 92, 246, 0.5);
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
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(30px) saturate(180%);
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-radius: 20px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(139, 92, 246, 0.1);
}

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(139, 92, 246, 0.2);
  border-color: rgba(139, 92, 246, 0.25);
}

.stat-icon {
  font-size: 2.5rem;
  color: rgba(139, 92, 246, 1);
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, rgba(139, 92, 246, 1) 0%, rgba(196, 181, 253, 1) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.9rem;
  color: rgba(196, 181, 253, 0.7);
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
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(30px) saturate(180%);
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-radius: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.search-box:focus-within {
  border-color: rgba(139, 92, 246, 0.4);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.15), 0 4px 20px rgba(0, 0, 0, 0.15);
}

.search-box ion-icon {
  font-size: 1.25rem;
  color: rgba(196, 181, 253, 0.6);
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.95);
  background: transparent;
}

.search-input::placeholder {
  color: rgba(196, 181, 253, 0.4);
}

.filters {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.filter-select {
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(30px);
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-radius: 16px;
  color: rgba(255, 255, 255, 0.92);
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.filter-select:hover {
  border-color: rgba(139, 92, 246, 0.25);
}

.filter-select:focus {
  outline: none;
  border-color: rgba(139, 92, 246, 0.4);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.15);
}

.filter-select option {
  background: rgba(15, 23, 42, 0.98);
  color: rgba(255, 255, 255, 0.95);
}

.view-toggle {
  display: flex;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-radius: 16px;
  padding: 0.25rem;
  backdrop-filter: blur(20px);
}

.toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: transparent;
  border: none;
  border-radius: 12px;
  color: rgba(196, 181, 253, 0.6);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 1.25rem;
}

.toggle-btn:hover {
  background: rgba(139, 92, 246, 0.12);
  color: rgba(196, 181, 253, 1);
}

.toggle-btn.active {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.8) 0%, rgba(124, 58, 237, 0.9) 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
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
  opacity: 0.5;
  margin-bottom: 1.5rem;
  color: rgba(139, 92, 246, 1);
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
  background: linear-gradient(135deg, rgba(139, 92, 246, 1) 0%, rgba(196, 181, 253, 1) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.empty-state p {
  font-size: 1.125rem;
  color: rgba(196, 181, 253, 0.8);
  max-width: 600px;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.btn-primary-large {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.8) 0%, rgba(124, 58, 237, 0.9) 100%);
  color: white;
  border: 1px solid rgba(139, 92, 246, 0.5);
  border-radius: 16px;
  font-size: 1.125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
}

.btn-primary-large:hover {
  background: linear-gradient(135deg, rgba(139, 92, 246, 1) 0%, rgba(124, 58, 237, 1) 100%);
  transform: translateY(-3px);
  box-shadow: 0 12px 40px rgba(139, 92, 246, 0.5);
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
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(30px) saturate(180%);
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-radius: 20px;
  padding: 1.5rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(139, 92, 246, 0.1);
  position: relative;
}

.document-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, rgba(139, 92, 246, 0.6) 0%, rgba(196, 181, 253, 0.4) 100%);
  border-radius: 20px 20px 0 0;
}

.document-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(139, 92, 246, 0.2);
  border-color: rgba(139, 92, 246, 0.25);
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
  border-radius: 16px;
  font-size: 2rem;
  background: rgba(139, 92, 246, 0.15);
  color: rgba(139, 92, 246, 1);
  border: 1px solid rgba(139, 92, 246, 0.25);
}

.file-icon.pdf {
  background: rgba(239, 68, 68, 0.12);
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.2);
}

.file-icon.docx {
  background: rgba(59, 130, 246, 0.12);
  color: #3b82f6;
  border-color: rgba(59, 130, 246, 0.2);
}

.file-icon.txt {
  background: rgba(34, 197, 94, 0.12);
  color: #22c55e;
  border-color: rgba(34, 197, 94, 0.2);
}

.file-icon.md {
  background: rgba(168, 85, 247, 0.12);
  color: #a855f7;
  border-color: rgba(168, 85, 247, 0.2);
}

.processing-badge,
.error-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  padding: 0.25rem 0.625rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.processing-badge {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
}

.error-badge {
  background: linear-gradient(135deg, #ef4444, #dc2626);
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
  background: linear-gradient(135deg, rgba(139, 92, 246, 1) 0%, rgba(196, 181, 253, 1) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  line-height: 1.3;
}

.document-description {
  font-size: 0.95rem;
  color: rgba(196, 181, 253, 0.8);
  margin: 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.document-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.85rem;
  color: rgba(196, 181, 253, 0.7);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.meta-item ion-icon {
  font-size: 1rem;
  color: rgba(139, 92, 246, 0.8);
}

.document-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  background: rgba(139, 92, 246, 0.15);
  color: rgba(196, 181, 253, 1);
  border: 1px solid rgba(139, 92, 246, 0.25);
}

.tag.cbt { 
  background: rgba(59, 130, 246, 0.15); 
  color: #93c5fd;
  border-color: rgba(59, 130, 246, 0.25);
}

.tag.dbt { 
  background: rgba(139, 92, 246, 0.15); 
  color: rgba(196, 181, 253, 1);
  border-color: rgba(139, 92, 246, 0.25);
}

.tag.mindfulness { 
  background: rgba(16, 185, 129, 0.15); 
  color: #6ee7b7;
  border-color: rgba(16, 185, 129, 0.25);
}

.tag.trauma { 
  background: rgba(236, 72, 153, 0.15); 
  color: #f9a8d4;
  border-color: rgba(236, 72, 153, 0.25);
}

.tag.anxiety {
  background: rgba(245, 158, 11, 0.15);
  color: #fcd34d;
  border-color: rgba(245, 158, 11, 0.25);
}

.tag.depression {
  background: rgba(129, 140, 248, 0.15);
  color: #a5b4fc;
  border-color: rgba(129, 140, 248, 0.25);
}

.tag.crisis {
  background: rgba(239, 68, 68, 0.15);
  color: #fca5a5;
  border-color: rgba(239, 68, 68, 0.25);
}

.linked-personas {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: rgba(16, 185, 129, 0.12);
  color: #6ee7b7;
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 999px;
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
  border-top: 1px solid rgba(139, 92, 246, 0.15);
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 16px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: rgba(196, 181, 253, 0.9);
}

.action-btn ion-icon {
  font-size: 1.125rem;
}

.action-btn.preview {
  border-color: rgba(59, 130, 246, 0.25);
  color: #93c5fd;
}

.action-btn.preview:hover {
  background: rgba(59, 130, 246, 0.15);
  border-color: rgba(59, 130, 246, 0.4);
  transform: translateY(-2px);
  color: white;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.25);
}

.action-btn.link {
  border-color: rgba(139, 92, 246, 0.25);
  color: rgba(196, 181, 253, 1);
}

.action-btn.link:hover {
  background: rgba(139, 92, 246, 0.15);
  border-color: rgba(139, 92, 246, 0.4);
  transform: translateY(-2px);
  color: white;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.25);
}

.action-btn.delete {
  border-color: rgba(239, 68, 68, 0.25);
  color: #fca5a5;
}

.action-btn.delete:hover {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.4);
  transform: translateY(-2px);
  color: white;
  box-shadow: 0 4px 16px rgba(239, 68, 68, 0.25);
}

/* Responsive Design */
@media (max-width: 1024px) {
  .library-view {
    padding: 1.5rem;
  }
  
  .documents-container.grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
}

@media (max-width: 768px) {
  .library-view {
    padding: 1rem;
    padding-top: 5rem;
  }
  
  .hamburger-wrapper {
    top: 1rem;
    left: 1rem;
  }

  .header-content {
    flex-direction: column;
    gap: 1rem;
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
    gap: 0.75rem;
  }

  .search-box,
  .filters,
  .view-toggle {
    width: 100%;
  }
  
  .filters {
    flex-direction: column;
  }
  
  .filter-select {
    width: 100%;
  }

  .documents-container.grid {
    grid-template-columns: 1fr;
  }

  .document-card.list {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .library-view {
    padding: 0.75rem;
    padding-top: 4.5rem;
  }
  
  .header-text h1 {
    font-size: 2rem;
  }
  
  .header-text p {
    font-size: 1rem;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .stat-card {
    padding: 1rem;
  }
  
  .stat-icon {
    font-size: 2rem;
  }
  
  .stat-value {
    font-size: 1.5rem;
  }
  
  .document-actions {
    flex-direction: column;
  }
  
  .action-btn span {
    display: none;
  }
  
  .action-btn {
    padding: 0.75rem;
  }
}

/* Touch device improvements */
@media (hover: none) and (pointer: coarse) {
  .stat-card:hover {
    transform: none;
  }
  
  .document-card:hover {
    transform: none;
  }
  
  .action-btn:hover {
    transform: none;
  }
}
</style>
