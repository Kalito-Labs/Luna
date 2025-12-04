<template>
  <div class="library-view">
    <!-- Compact Header -->
    <header class="library-header">
      <div class="header-content">
        <HamburgerMenu />
        <div class="header-text">
          <h1>📚 The Library</h1>
          <p>Upload and manage your RAG knowledge base</p>
        </div>
      </div>
      <button class="btn-upload-primary" @click="showUploadModal = true">
        <ion-icon name="cloud-upload-outline"></ion-icon>
        <span>Upload Document</span>
      </button>
    </header>

    <!-- Two-Column Content Container -->
    <div class="content-wrapper">
      <!-- Main Content Column -->
      <div class="main-content">
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

        <!-- Documents Grid/List -->
        <div v-if="loading" class="loading-state">
          <ion-icon name="hourglass-outline" class="spinning"></ion-icon>
          <p>Loading your library...</p>
        </div>

        <div v-else-if="filteredDatasets.length === 0" class="empty-state">
          <div class="empty-icon">📚</div>
          <h2>No documents yet</h2>
          <p>Upload your first document to start building your knowledge base</p>
          <button class="btn-primary-large" @click="showUploadModal = true">
            <ion-icon name="cloud-upload-outline"></ion-icon>
            Upload Document
          </button>
        </div>

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
          <div class="document-header-row">
            <h3 class="document-name">{{ dataset.name }}</h3>
            <div class="processing-mode-badge" :class="dataset.processing_mode">
              <ion-icon :name="dataset.processing_mode === 'local' ? 'shield-checkmark-outline' : 'cloud-outline'"></ion-icon>
              <span>{{ dataset.processing_mode === 'local' ? 'Private' : 'Cloud' }}</span>
            </div>
          </div>
          
          <p v-if="dataset.description" class="document-description">
            {{ dataset.description }}
          </p>

          <div class="document-meta">
            <span class="meta-item">
              <ion-icon name="document-text-outline"></ion-icon>
              {{ dataset.file_name }}
            </span>
            <span class="meta-item with-tooltip" :title="`${dataset.chunk_count} text segments for AI context`">
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

          <div class="document-badges">
            <span v-if="dataset.therapeutic_category" class="tag category" :class="dataset.therapeutic_category">
              {{ dataset.therapeutic_category.toUpperCase() }}
            </span>
            <span v-if="dataset.processing_status === 'completed'" class="tag success">
              <ion-icon name="checkmark-circle-outline"></ion-icon>
              Ready
            </span>
          </div>

          <!-- Linked Personas Info -->
          <div v-if="getLinkedPersonas(dataset.id).length > 0" class="linked-personas-list">
            <div class="linked-label">
              <ion-icon name="people-outline"></ion-icon>
              <span>Linked to:</span>
            </div>
            <div class="persona-badges">
              <span 
                v-for="link in getLinkedPersonas(dataset.id).slice(0, 3)" 
                :key="link.persona_id"
                class="persona-badge"
                :class="{ disabled: !link.enabled }"
                :title="link.enabled ? `Active - ${link.persona_name}` : `Disabled - ${link.persona_name}`"
              >
                {{ link.persona_name }}
              </span>
              <span v-if="getLinkedPersonas(dataset.id).length > 3" class="persona-badge more">
                +{{ getLinkedPersonas(dataset.id).length - 3 }}
              </span>
            </div>
          </div>
          <div v-else class="no-personas-hint">
            <ion-icon name="link-outline"></ion-icon>
            <span>Not linked to any personas</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="document-actions">
          <button class="action-btn preview" @click="previewDataset(dataset.id)" title="View chunks and content">
            <ion-icon name="eye-outline"></ion-icon>
            <span>Preview</span>
          </button>
          <button class="action-btn link" @click="openLinkManager(dataset)" title="Link to personas and configure access">
            <ion-icon name="link-outline"></ion-icon>
            <span>{{ getLinkedPersonas(dataset.id).length > 0 ? 'Manage' : 'Link' }}</span>
          </button>
          <button class="action-btn delete" @click="confirmDelete(dataset)" title="Permanently delete document">
            <ion-icon name="trash-outline"></ion-icon>
            <span>Delete</span>
          </button>
        </div>
      </div>
        </div>
      </div>

      <!-- Right Sidebar: Stats Overview -->
      <aside class="stats-grid">
        <div class="stat-card" title="Total number of documents in your knowledge base">
          <ion-icon name="documents-outline" class="stat-icon"></ion-icon>
          <div class="stat-content">
            <span class="stat-label">Total Documents</span>
            <span class="stat-value">{{ datasets.length }}</span>
          </div>
        </div>
        <div class="stat-card" title="Text segments used for AI context retrieval. More chunks = more detailed information.">
          <ion-icon name="filing-outline" class="stat-icon"></ion-icon>
          <div class="stat-content">
            <span class="stat-label">Total Chunks</span>
            <span class="stat-value">{{ totalChunks }}</span>
          </div>
        </div>
        <div class="stat-card" title="Total storage space used by uploaded documents">
          <ion-icon name="save-outline" class="stat-icon"></ion-icon>
          <div class="stat-content">
            <span class="stat-label">Storage Used</span>
            <span class="stat-value">{{ formatTotalSize(totalSize) }}</span>
          </div>
        </div>
        <div class="stat-card" title="Documents connected to AI personas for enhanced conversations">
          <ion-icon name="link-outline" class="stat-icon"></ion-icon>
          <div class="stat-content">
            <span class="stat-label">Linked to Personas</span>
            <span class="stat-value">{{ linkedCount }}</span>
          </div>
        </div>
      </aside>
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

    <!-- Persona Link Manager Modal -->
    <PersonaLinkManager
      v-if="showLinkModal && selectedDataset"
      :dataset="selectedDataset"
      :personas="allPersonas"
      :existing-links="getLinkedPersonas(selectedDataset.id)"
      @close="showLinkModal = false"
      @updated="handleLinksUpdated"
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
import PersonaLinkManager from '../components/datasets/PersonaLinkManager.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'

// State
const loading = ref(false)
const datasets = ref<any[]>([])
const personaLinks = ref<any[]>([])
const allPersonas = ref<any[]>([])
const searchQuery = ref('')
const filterCategory = ref('')
const filterType = ref('')
const sortBy = ref('newest')
const viewMode = ref<'grid' | 'list'>('grid')
const showUploadModal = ref(false)
const showPreviewModal = ref(false)
const showLinkModal = ref(false)
const selectedDatasetId = ref<string | null>(null)
const selectedDataset = ref<any | null>(null)
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
    
    // Load all personas and their dataset links
    await Promise.all([
      loadPersonaLinks(),
      loadAllPersonas()
    ])
  } catch (error) {
    console.error('Failed to load library:', error)
  } finally {
    loading.value = false
  }
}

async function loadAllPersonas() {
  try {
    const response = await fetch('http://localhost:3000/api/personas')
    const result = await response.json()
    allPersonas.value = result.data
  } catch (error) {
    console.error('Failed to load personas:', error)
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

function openLinkManager(dataset: any) {
  selectedDataset.value = dataset
  showLinkModal.value = true
}

function handleLinksUpdated() {
  showLinkModal.value = false
  loadPersonaLinks()
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
  height: 100vh;
  background: linear-gradient(135deg, 
    rgba(15, 23, 42, 0.98) 0%, 
    rgba(30, 41, 59, 0.95) 50%,
    rgba(67, 56, 202, 0.1) 100%);
  display: flex;
  flex-direction: column;
  color: rgba(255, 255, 255, 0.92);
  position: relative;
  overflow: hidden;
}

/* ================================================================ */
/* COMPACT HEADER - Matching JournalView Pattern                   */
/* ================================================================ */

.library-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: rgba(30, 41, 59, 0.6);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(139, 92, 246, 0.15);
  flex-shrink: 0;
  position: relative;
  z-index: 100;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.header-text h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  line-height: 1;
}

.header-text p {
  display: block;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 0.25rem;
  font-weight: 400;
}

.btn-upload-primary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: linear-gradient(135deg, 
    rgba(139, 92, 246, 0.9) 0%, 
    rgba(124, 58, 237, 0.95) 100%);
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
  flex-shrink: 0;
}

.btn-upload-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.5);
}

.btn-upload-primary ion-icon {
  font-size: 1.125rem;
}

/* ================================================================ */
/* TWO-COLUMN LAYOUT - Content Container                            */
/* ================================================================ */

.content-wrapper {
  display: flex;
  gap: 1.5rem;
  flex: 1;
  padding: 1.5rem;
  overflow: hidden;
  min-height: 0;
  position: relative;
  z-index: 1;
}

/* Stats Grid - Sidebar Style */
.stats-grid {
  width: 320px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex-shrink: 0;
}

.stat-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-radius: 1rem;
  transition: all 0.3s ease;
  cursor: help;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.stat-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(139, 92, 246, 0.3);
  transform: translateX(4px);
}

.stat-icon {
  font-size: 1.125rem;
  color: rgba(139, 92, 246, 0.7);
  margin-right: 0.75rem;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
  flex: 1;
}

.stat-value {
  font-size: 0.95rem;
  font-weight: 600;
  color: rgba(196, 181, 253, 0.95);
}

/* ================================================================ */
/* MAIN CONTENT COLUMN                                              */
/* ================================================================ */

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-radius: 1.25rem;
  overflow: hidden;
  position: relative;
  z-index: auto;
}

/* Toolbar */
.toolbar {
  display: flex;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(139, 92, 246, 0.15);
  background: rgba(255, 255, 255, 0.02);
  flex-wrap: wrap;
  align-items: center;
  flex-shrink: 0;
}

.search-box {
  flex: 1;
  min-width: 250px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.search-box:focus-within {
  border-color: rgba(139, 92, 246, 0.5);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.15), 0 8px 24px rgba(139, 92, 246, 0.25);
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
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(139, 92, 246, 0.25);
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.95);
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.15);
}

.filter-select:hover {
  border-color: rgba(139, 92, 246, 0.4);
}

.filter-select:focus {
  outline: none;
  border-color: rgba(139, 92, 246, 0.5);
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
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 12px;
  padding: 0.25rem;
  backdrop-filter: blur(10px);
}

.toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: rgba(196, 181, 253, 0.6);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 1.25rem;
}

.toggle-btn:hover {
  background: rgba(139, 92, 246, 0.15);
  color: rgba(196, 181, 253, 1);
}

.toggle-btn.active {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.8) 0%, rgba(124, 58, 237, 0.9) 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
}

/* Loading/Empty States */
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  text-align: center;
  flex: 1;
}

.loading-state ion-icon {
  font-size: 3rem;
  color: rgba(139, 92, 246, 0.8);
  margin-bottom: 1.5rem;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loading-state p {
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-state h2 {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
  color: rgba(255, 255, 255, 0.9);
}

.empty-state p {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.6);
  margin: 0 0 1.5rem 0;
  line-height: 1.6;
}

.btn-primary-large {
  padding: 0.75rem 1.5rem;
  background: rgba(139, 92, 246, 0.2);
  color: rgba(196, 181, 253, 0.95);
  border: 1px solid rgba(139, 92, 246, 0.4);
  border-radius: 0.75rem;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary-large:hover {
  background: rgba(139, 92, 246, 0.3);
  border-color: rgba(139, 92, 246, 0.6);
  transform: translateY(-2px);
  color: white;
}

/* Documents Container */
.documents-container {
  display: grid;
  gap: 1rem;
  padding: 1rem;
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.documents-container::-webkit-scrollbar {
  width: 6px;
}

.documents-container::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}

.documents-container::-webkit-scrollbar-thumb {
  background: rgba(139, 92, 246, 0.4);
  border-radius: 10px;
}

.documents-container::-webkit-scrollbar-thumb:hover {
  background: rgba(139, 92, 246, 0.6);
}

.documents-container.grid {
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  align-items: start;
}

.documents-container.list {
  grid-template-columns: 1fr;
}

/* Document Card */
.document-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.03) 100%);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 16px;
  padding: 1.25rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.15);
  position: relative;
  height: fit-content;
  max-height: 400px;
  min-height: 200px;
}

.document-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, rgba(139, 92, 246, 0.8) 0%, rgba(196, 181, 253, 0.6) 100%);
  border-radius: 16px 16px 0 0;
}

.document-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.3);
  border-color: rgba(139, 92, 246, 0.4);
}

.document-card.list {
  flex-direction: row;
  align-items: center;
}

.document-visual {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-shrink: 0;
}

.file-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  font-size: 1.5rem;
  background: rgba(139, 92, 246, 0.2);
  color: rgba(139, 92, 246, 1);
  border: 1px solid rgba(139, 92, 246, 0.3);
  flex-shrink: 0;
}

.file-icon.pdf {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.3);
}

.file-icon.docx {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
  border-color: rgba(59, 130, 246, 0.3);
}

.file-icon.txt {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
  border-color: rgba(34, 197, 94, 0.3);
}

.file-icon.md {
  background: rgba(168, 85, 247, 0.15);
  color: #a855f7;
  border-color: rgba(168, 85, 247, 0.3);
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
  gap: 0.625rem;
  min-height: 0;
  overflow: hidden;
}

.document-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.document-name {
  font-size: 1rem;
  font-weight: 600;
  background: linear-gradient(135deg, rgba(139, 92, 246, 1) 0%, rgba(196, 181, 253, 1) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  line-height: 1.3;
  flex: 1;
}

.processing-mode-badge {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.625rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  flex-shrink: 0;
}

.processing-mode-badge.local {
  background: rgba(16, 185, 129, 0.15);
  color: #6ee7b7;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.processing-mode-badge.cloud {
  background: rgba(59, 130, 246, 0.15);
  color: #93c5fd;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.processing-mode-badge ion-icon {
  font-size: 0.875rem;
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

.meta-item.with-tooltip {
  cursor: help;
  position: relative;
}

.meta-item ion-icon {
  font-size: 1rem;
  color: rgba(139, 92, 246, 0.8);
}

.document-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.tag {
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  background: rgba(139, 92, 246, 0.2);
  color: rgba(196, 181, 253, 1);
  border: 1px solid rgba(139, 92, 246, 0.3);
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.tag.success {
  background: rgba(16, 185, 129, 0.15);
  color: #6ee7b7;
  border-color: rgba(16, 185, 129, 0.3);
}

.tag.success ion-icon {
  font-size: 0.875rem;
}

.tag.cbt { 
  background: rgba(59, 130, 246, 0.2); 
  color: #93c5fd;
  border-color: rgba(59, 130, 246, 0.4);
}

.tag.dbt { 
  background: rgba(139, 92, 246, 0.2); 
  color: rgba(196, 181, 253, 1);
  border-color: rgba(139, 92, 246, 0.4);
}

.tag.mindfulness { 
  background: rgba(16, 185, 129, 0.2); 
  color: #6ee7b7;
  border-color: rgba(16, 185, 129, 0.4);
}

.tag.trauma { 
  background: rgba(236, 72, 153, 0.2); 
  color: #f9a8d4;
  border-color: rgba(236, 72, 153, 0.4);
}

.tag.anxiety {
  background: rgba(245, 158, 11, 0.2);
  color: #fcd34d;
  border-color: rgba(245, 158, 11, 0.4);
}

.tag.depression {
  background: rgba(129, 140, 248, 0.2);
  color: #a5b4fc;
  border-color: rgba(129, 140, 248, 0.4);
}

.tag.crisis {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
  border-color: rgba(239, 68, 68, 0.4);
}

.linked-personas-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.625rem;
  background: rgba(139, 92, 246, 0.08);
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-radius: 10px;
}

.linked-label {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  color: rgba(196, 181, 253, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.linked-label ion-icon {
  font-size: 0.875rem;
}

.persona-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.persona-badge {
  padding: 0.25rem 0.625rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  background: rgba(139, 92, 246, 0.2);
  color: rgba(196, 181, 253, 1);
  border: 1px solid rgba(139, 92, 246, 0.35);
  transition: all 0.2s ease;
  cursor: help;
}

.persona-badge:hover {
  background: rgba(139, 92, 246, 0.3);
  border-color: rgba(139, 92, 246, 0.5);
}

.persona-badge.disabled {
  background: rgba(100, 100, 100, 0.15);
  color: rgba(150, 150, 150, 0.7);
  border-color: rgba(100, 100, 100, 0.25);
  text-decoration: line-through;
  opacity: 0.6;
}

.persona-badge.more {
  background: rgba(196, 181, 253, 0.15);
  color: rgba(196, 181, 253, 0.9);
  border-color: rgba(196, 181, 253, 0.3);
}

.no-personas-hint {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.625rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px dashed rgba(139, 92, 246, 0.2);
  border-radius: 8px;
  font-size: 0.8rem;
  color: rgba(196, 181, 253, 0.6);
  font-style: italic;
}

.no-personas-hint ion-icon {
  font-size: 0.875rem;
  opacity: 0.6;
}

.document-actions {
  display: flex;
  gap: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(139, 92, 246, 0.2);
  flex-shrink: 0;
  margin-top: auto;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: rgba(196, 181, 253, 0.9);
}

.action-btn ion-icon {
  font-size: 1.125rem;
}

.action-btn.preview {
  border-color: rgba(59, 130, 246, 0.4);
  color: #93c5fd;
}

.action-btn.preview:hover {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.3));
  border-color: rgba(59, 130, 246, 0.6);
  color: white;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
}

.action-btn.link {
  border-color: rgba(139, 92, 246, 0.4);
  color: rgba(196, 181, 253, 1);
}

.action-btn.link:hover {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(124, 58, 237, 0.3));
  border-color: rgba(139, 92, 246, 0.6);
  color: white;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
}

.action-btn.delete {
  border-color: rgba(239, 68, 68, 0.4);
  color: #fca5a5;
}

.action-btn.delete:hover {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.3));
  border-color: rgba(239, 68, 68, 0.6);
  color: white;
  box-shadow: 0 4px 16px rgba(239, 68, 68, 0.3);
}

/* Animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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

/* ================================================================ */
/* RESPONSIVE DESIGN                                                */
/* ================================================================ */

@media (max-width: 1024px) {
  .content-wrapper {
    flex-direction: column;
  }
  
  .stats-grid {
    width: 100%;
    order: -1;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
  }
  
  .documents-container.grid {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  }
}

@media (max-width: 640px) {
  .library-header {
    flex-direction: column;
    gap: 0.75rem;
    align-items: stretch;
  }
  
  .header-content {
    justify-content: space-between;
  }
  
  .btn-upload-primary {
    width: 100%;
    justify-content: center;
  }
  
  .content-wrapper {
    padding: 1rem;
    gap: 1rem;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-box {
    min-width: 100%;
  }
  
  .filters {
    width: 100%;
    flex-direction: column;
  }
  
  .filter-select {
    flex: 1;
  }
  
  .view-toggle {
    width: 100%;
    justify-content: center;
  }
  
  .documents-container.grid {
    grid-template-columns: 1fr;
  }
  
  .document-card.list {
    flex-direction: column;
  }
  
  .document-actions {
    flex-direction: row;
  }
  
  .action-btn {
    font-size: 0.8rem;
  }
  
  .action-btn span {
    display: none;
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
    box-shadow: none;
  }
  
  .action-link:hover {
    transform: none;
  }
}
</style>
