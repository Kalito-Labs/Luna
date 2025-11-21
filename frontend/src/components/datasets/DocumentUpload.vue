<template>
  <div class="document-upload-modal" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h2>📚 Upload Document</h2>
        <p>Add therapeutic materials, worksheets, or reference documents</p>
        <button class="close-btn" @click="$emit('close')" aria-label="Close">
          <ion-icon name="close-outline"></ion-icon>
        </button>
      </div>

      <div class="upload-area" :class="{ 'drag-active': isDragging }">
        <div
          class="drop-zone"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
          @click="triggerFileInput"
        >
          <ion-icon name="cloud-upload-outline" class="upload-icon"></ion-icon>
          <h3>Drag & Drop or Click to Browse</h3>
          <p>Supported formats: PDF, DOCX, TXT, MD (max 50MB)</p>
          <button class="browse-btn" type="button">Browse Files</button>
          <input
            ref="fileInput"
            type="file"
            accept=".pdf,.docx,.txt,.md"
            @change="handleFileSelect"
            style="display: none"
          />
        </div>
      </div>

      <div v-if="selectedFile" class="file-info">
        <div class="file-details">
          <ion-icon :name="getFileIcon(selectedFile.type)" class="file-icon"></ion-icon>
          <div class="file-meta">
            <span class="file-name">{{ selectedFile.name }}</span>
            <span class="file-size">{{ formatFileSize(selectedFile.size) }}</span>
          </div>
          <button class="remove-file-btn" @click="clearFile" aria-label="Remove file">
            <ion-icon name="close-circle-outline"></ion-icon>
          </button>
        </div>
      </div>

      <div class="form-section">
        <div class="form-group">
          <label for="dataset-name">Dataset Name</label>
          <input
            id="dataset-name"
            v-model="datasetName"
            type="text"
            placeholder="e.g., CBT Worksheets"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="dataset-description">Description (optional)</label>
          <textarea
            id="dataset-description"
            v-model="description"
            placeholder="Describe what this document contains..."
            class="form-textarea"
            rows="3"
          ></textarea>
        </div>

        <div class="form-group">
          <label for="therapeutic-category">Therapeutic Category</label>
          <select id="therapeutic-category" v-model="therapeuticCategory" class="form-select">
            <option value="">General</option>
            <option value="cbt">Cognitive Behavioral Therapy (CBT)</option>
            <option value="dbt">Dialectical Behavior Therapy (DBT)</option>
            <option value="mindfulness">Mindfulness & Meditation</option>
            <option value="trauma">Trauma-Informed Care</option>
            <option value="anxiety">Anxiety Management</option>
            <option value="depression">Depression Support</option>
            <option value="crisis">Crisis Intervention</option>
          </select>
        </div>

        <div class="form-group">
          <label>Processing Mode</label>
          <div class="radio-group">
            <label class="radio-option">
              <input v-model="processingMode" type="radio" value="local" />
              <div class="radio-content">
                <div class="radio-label">
                  <ion-icon name="shield-checkmark-outline"></ion-icon>
                  <span>🔒 Privacy Mode (Local)</span>
                </div>
                <p class="radio-description">
                  Processing happens on your device. Complete privacy, no data leaves your computer.
                </p>
              </div>
            </label>
            <label class="radio-option">
              <input v-model="processingMode" type="radio" value="cloud" />
              <div class="radio-content">
                <div class="radio-label">
                  <ion-icon name="cloud-outline"></ion-icon>
                  <span>☁️ Cloud Mode</span>
                </div>
                <p class="radio-description">
                  Higher quality embeddings using OpenAI. Text is sent to cloud (anonymized).
                </p>
              </div>
            </label>
          </div>
        </div>
      </div>

      <div v-if="isUploading" class="upload-progress">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${uploadProgress}%` }"></div>
        </div>
        <p class="progress-text">{{ uploadStatusText }}</p>
      </div>

      <div v-if="uploadError" class="error-message">
        <ion-icon name="alert-circle-outline"></ion-icon>
        <span>{{ uploadError }}</span>
      </div>

      <div class="modal-actions">
        <button class="btn-secondary" @click="$emit('close')" :disabled="isUploading">
          Cancel
        </button>
        <button
          class="btn-primary"
          @click="handleUpload"
          :disabled="!canUpload || isUploading"
        >
          <ion-icon v-if="!isUploading" name="cloud-upload-outline"></ion-icon>
          <ion-icon v-else name="hourglass-outline" class="spinning"></ion-icon>
          {{ isUploading ? 'Uploading...' : 'Upload Document' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const emit = defineEmits(['close', 'uploaded'])

// State
const isDragging = ref(false)
const selectedFile = ref<File | null>(null)
const datasetName = ref('')
const description = ref('')
const therapeuticCategory = ref('')
const processingMode = ref('local')
const isUploading = ref(false)
const uploadProgress = ref(0)
const uploadStatusText = ref('')
const uploadError = ref('')
const fileInput = ref<HTMLInputElement>()

// Computed
const canUpload = computed(() => {
  return selectedFile.value && datasetName.value.trim().length > 0
})

// Methods
function triggerFileInput() {
  fileInput.value?.click()
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    selectFile(target.files[0])
  }
}

function handleDrop(event: DragEvent) {
  isDragging.value = false
  if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
    selectFile(event.dataTransfer.files[0])
  }
}

function selectFile(file: File) {
  // Validate file type
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown'
  ]
  const allowedExtensions = ['.pdf', '.docx', '.txt', '.md']
  const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))

  if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
    uploadError.value = 'Unsupported file type. Please upload PDF, DOCX, TXT, or MD files.'
    return
  }

  // Validate file size (50MB max)
  if (file.size > 50 * 1024 * 1024) {
    uploadError.value = 'File too large. Maximum size is 50MB.'
    return
  }

  selectedFile.value = file
  uploadError.value = ''

  // Auto-fill dataset name from filename
  if (!datasetName.value) {
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '')
    datasetName.value = nameWithoutExt.replace(/[_-]/g, ' ')
  }
}

function clearFile() {
  selectedFile.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

async function handleUpload() {
  if (!selectedFile.value || !canUpload.value) return

  isUploading.value = true
  uploadProgress.value = 0
  uploadStatusText.value = 'Uploading file...'
  uploadError.value = ''

  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    formData.append('name', datasetName.value)
    formData.append('description', description.value || datasetName.value)
    formData.append('therapeutic_category', therapeuticCategory.value)
    formData.append('processing_mode', processingMode.value)

    // Simulate progress for file upload
    uploadProgress.value = 30
    uploadStatusText.value = 'Extracting text...'

    const response = await fetch('http://localhost:3000/api/datasets/upload', {
      method: 'POST',
      body: formData
    })

    uploadProgress.value = 60

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error?.message || 'Upload failed')
    }

    uploadStatusText.value = 'Processing document...'
    uploadProgress.value = 80

    const result = await response.json()

    uploadProgress.value = 100
    uploadStatusText.value = 'Upload complete!'

    // Wait a moment to show completion
    await new Promise(resolve => setTimeout(resolve, 500))

    emit('uploaded', result.data)
    emit('close')
  } catch (error: any) {
    uploadError.value = error.message || 'Failed to upload document'
    uploadProgress.value = 0
  } finally {
    isUploading.value = false
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

function getFileIcon(type: string): string {
  if (type.includes('pdf')) return 'document-text-outline'
  if (type.includes('word')) return 'document-outline'
  return 'document-outline'
}
</script>

<style scoped>
.document-upload-modal {
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
  padding: 2rem;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  text-align: center;
  margin-bottom: 2rem;
  position: relative;
}

.modal-header h2 {
  font-size: 1.75rem;
  color: var(--text-primary, #1a1a1a);
  margin-bottom: 0.5rem;
}

.modal-header p {
  color: var(--text-secondary, #666);
  font-size: 0.95rem;
}

.close-btn {
  position: absolute;
  top: -0.5rem;
  right: -0.5rem;
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
}

.close-btn:hover {
  background: #ef4444;
  color: white;
  border-color: #ef4444;
}

.upload-area {
  margin-bottom: 1.5rem;
}

.drop-zone {
  border: 2px dashed var(--border-light, #e0e0e0);
  border-radius: 1rem;
  padding: 3rem 2rem;
  text-align: center;
  transition: all 0.3s ease;
  background: var(--bg-light, #f5f5f5);
  cursor: pointer;
}

.upload-area.drag-active .drop-zone,
.drop-zone:hover {
  border-color: #8b5cf6;
  background: rgba(139, 92, 246, 0.05);
  transform: scale(1.02);
}

.upload-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.6;
  color: #8b5cf6;
}

.drop-zone h3 {
  font-size: 1.25rem;
  color: var(--text-primary, #1a1a1a);
  margin-bottom: 0.5rem;
}

.drop-zone p {
  color: var(--text-secondary, #666);
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
}

.browse-btn {
  background: #8b5cf6;
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.browse-btn:hover {
  background: #7c3aed;
  transform: translateY(-1px);
}

.file-info {
  background: var(--bg-light, #f5f5f5);
  border-radius: 0.75rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.file-details {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.file-icon {
  font-size: 2rem;
  color: #8b5cf6;
}

.file-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.file-name {
  font-weight: 600;
  color: var(--text-primary, #1a1a1a);
  font-size: 0.95rem;
}

.file-size {
  color: var(--text-secondary, #666);
  font-size: 0.85rem;
}

.remove-file-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #ef4444;
  cursor: pointer;
  transition: transform 0.2s;
}

.remove-file-btn:hover {
  transform: scale(1.1);
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text-primary, #1a1a1a);
  font-size: 0.95rem;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-light, #e0e0e0);
  border-radius: 0.5rem;
  font-size: 0.95rem;
  transition: border-color 0.3s;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: #8b5cf6;
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.radio-option {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  border: 2px solid var(--border-light, #e0e0e0);
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.3s;
}

.radio-option:hover {
  border-color: #8b5cf6;
  background: rgba(139, 92, 246, 0.05);
}

.radio-option input[type='radio'] {
  margin-top: 0.25rem;
}

.radio-option input[type='radio']:checked + .radio-content {
  color: #8b5cf6;
}

.radio-content {
  flex: 1;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  font-size: 0.95rem;
}

.radio-description {
  font-size: 0.85rem;
  color: var(--text-secondary, #666);
  margin: 0;
}

.upload-progress {
  margin-bottom: 1.5rem;
}

.progress-bar {
  height: 8px;
  background: var(--bg-light, #f5f5f5);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6, #7c3aed);
  transition: width 0.3s ease;
}

.progress-text {
  text-align: center;
  font-size: 0.9rem;
  color: var(--text-secondary, #666);
  margin: 0;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #fee2e2;
  color: #dc2626;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
}

.error-message ion-icon {
  font-size: 1.25rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.btn-secondary,
.btn-primary {
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
}

.btn-secondary {
  background: white;
  border: 1px solid var(--border-light, #e0e0e0);
  color: var(--text-primary, #1a1a1a);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--bg-light, #f5f5f5);
}

.btn-primary {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  border: none;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.btn-primary:disabled,
.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 640px) {
  .modal-content {
    padding: 1.5rem;
  }

  .drop-zone {
    padding: 2rem 1rem;
  }

  .modal-actions {
    flex-direction: column;
  }

  .btn-secondary,
  .btn-primary {
    width: 100%;
    justify-content: center;
  }
}
</style>
