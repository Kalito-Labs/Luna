<template>
  <div class="document-upload-modal" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h2>📚 Upload Document</h2>
        <p>Add therapeutic materials, worksheets, or reference documents</p>
        <button class="close-btn" @click="$emit('close')" aria-label="Close">
          &times;
        </button>
      </div>

      <div class="modal-body">
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
          <button class="btn btn-secondary" @click="$emit('close')" :disabled="isUploading">
            Cancel
          </button>
          <button
            class="btn btn-primary"
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
  padding: 1.5rem;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
}

.modal-content {
  background: linear-gradient(135deg, 
    rgba(30, 41, 59, 0.95) 0%, 
    rgba(15, 23, 42, 0.98) 100%);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 1.25rem;
  max-width: 1000px;
  width: 90vw;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(20px);
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
  background: transparent;
}

.modal-body::-webkit-scrollbar {
  width: 6px;
}

.modal-body::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}

.modal-body::-webkit-scrollbar-thumb {
  background: rgba(139, 92, 246, 0.4);
  border-radius: 10px;
  transition: background 0.3s ease;
}

.modal-body::-webkit-scrollbar-thumb:hover {
  background: rgba(139, 92, 246, 0.6);
}

.modal-header {
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(139, 92, 246, 0.15);
  background: rgba(30, 41, 59, 0.6);
  backdrop-filter: blur(20px);
  position: relative;
}

.modal-header h2 {
  margin: 0 0 0.5rem 0;
  color: rgba(255, 255, 255, 0.95);
  font-size: 1.5rem;
  font-weight: 600;
  text-align: center;
}

.modal-header p {
  color: rgba(196, 181, 253, 0.8);
  font-size: 0.95rem;
  text-align: center;
  margin: 0;
}

.close-btn {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  background: none;
  border: none;
  font-size: 1.75rem;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.6);
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.75rem;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 1);
  transform: rotate(90deg);
}

.upload-area {
  margin-bottom: 1.5rem;
}

.drop-zone {
  border: 2px dashed rgba(139, 92, 246, 0.3);
  border-radius: 1rem;
  padding: 3rem 2rem;
  text-align: center;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(20px);
  cursor: pointer;
  position: relative;
}

.upload-area.drag-active .drop-zone,
.drop-zone:hover {
  border-color: rgba(139, 92, 246, 0.5);
  background: rgba(139, 92, 246, 0.08);
  transform: translateY(-2px);
}

.drop-zone::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, rgba(139, 92, 246, 0.8) 0%, rgba(196, 181, 253, 0.6) 100%);
  border-radius: 1rem 1rem 0 0;
}

.upload-icon {
  font-size: 3rem;
  margin-bottom: 16px;
  color: rgba(139, 92, 246, 0.8);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.drop-zone h3 {
  font-size: 1.25rem;
  color: rgba(255, 255, 255, 0.92);
  margin-bottom: 8px;
  font-weight: 600;
}

.drop-zone p {
  color: rgba(196, 181, 253, 0.8);
  margin-bottom: 24px;
  font-size: 0.9rem;
  line-height: 1.5;
}

.browse-btn {
  background: linear-gradient(135deg, 
    rgba(139, 92, 246, 0.9) 0%, 
    rgba(124, 58, 237, 0.95) 100%);
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 0.75rem;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.browse-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.5);
}

.file-info {
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-radius: 1rem;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
  transition: all 0.3s ease;
  position: relative;
}

.file-info::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, rgba(139, 92, 246, 0.8) 0%, rgba(196, 181, 253, 0.6) 100%);
  border-radius: 1rem 1rem 0 0;
}

.file-info:hover {
  border-color: rgba(139, 92, 246, 0.3);
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
  color: rgba(255, 255, 255, 0.92);
  font-size: 0.95rem;
}

.file-size {
  color: rgba(196, 181, 253, 0.7);
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
  background: rgba(255, 255, 255, 0.04);
  border-radius: 1rem;
  padding: 1.5rem;
  border: 1px solid rgba(139, 92, 246, 0.15);
  backdrop-filter: blur(20px);
  margin-bottom: 1.5rem;
  position: relative;
  transition: all 0.3s ease;
}

.form-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, rgba(139, 92, 246, 0.8) 0%, rgba(196, 181, 253, 0.6) 100%);
  border-radius: 1rem 1rem 0 0;
}

.form-section:hover {
  border-color: rgba(139, 92, 246, 0.3);
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.875rem;
}

.form-input,
.form-textarea,
.form-select {
  padding: 0.75rem;
  border: 1px solid rgba(139, 92, 246, 0.25);
  border-radius: 0.75rem;
  font-size: 0.95rem;
  background: rgba(30, 41, 59, 0.6);
  color: rgba(255, 255, 255, 0.95);
  transition: all 0.3s ease;
  backdrop-filter: blur(20px);
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: rgba(196, 181, 253, 0.5);
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: rgba(139, 92, 246, 0.5);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.15);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
  line-height: 1.5;
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.radio-option {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(20px);
}

.radio-option:hover {
  border-color: rgba(139, 92, 246, 0.3);
  background: rgba(139, 92, 246, 0.08);
}

.radio-option input[type='radio'] {
  margin-top: 4px;
  accent-color: rgba(139, 92, 246, 1);
}

.radio-option input[type='radio']:checked + .radio-content {
  color: rgba(139, 92, 246, 1);
}

.radio-content {
  flex: 1;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  margin-bottom: 4px;
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.92);
}

.radio-description {
  font-size: 0.85rem;
  color: rgba(196, 181, 253, 0.7);
  margin: 0;
  line-height: 1.5;
}

.upload-progress {
  margin-bottom: 1.5rem;
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-radius: 0.75rem;
  padding: 1.25rem;
}

.progress-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 0.75rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, 
    rgba(139, 92, 246, 0.9) 0%, 
    rgba(124, 58, 237, 0.95) 100%);
  transition: width 0.3s ease;
  border-radius: 999px;
}

.progress-text {
  text-align: center;
  font-size: 0.9rem;
  color: rgba(196, 181, 253, 0.8);
  margin: 0;
  font-weight: 500;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: rgba(239, 68, 68, 0.15);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
  backdrop-filter: blur(20px);
}

.error-message ion-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding: 1.5rem;
  border-top: 1px solid rgba(139, 92, 246, 0.15);
  background: rgba(30, 41, 59, 0.6);
  backdrop-filter: blur(20px);
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  white-space: nowrap;
  font-size: 0.95rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(139, 92, 246, 0.2);
}

.btn-secondary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(139, 92, 246, 0.3);
}

.btn-primary {
  background: linear-gradient(135deg, 
    rgba(139, 92, 246, 0.9) 0%, 
    rgba(124, 58, 237, 0.95) 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.5);
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

/* Responsive Design */
@media (max-width: 1024px) {
  .document-upload-modal {
    padding: 1.25rem;
  }
  
  .modal-content {
    width: 95vw;
  }
  
  .modal-body {
    padding: 1.25rem;
  }
  
  .drop-zone {
    padding: 2.5rem 1.5rem;
  }
  
  .form-section {
    padding: 1.25rem;
  }
}

@media (max-width: 768px) {
  .document-upload-modal {
    padding: 1rem;
  }
  
  .modal-content {
    width: 100vw;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
  }
  
  .modal-header {
    padding: 1.25rem;
  }
  
  .modal-header h2 {
    font-size: 1.5rem;
  }
  
  .close-btn {
    top: 1.25rem;
    right: 1.25rem;
  }
  
  .modal-body {
    padding: 1rem;
  }
  
  .drop-zone {
    padding: 2rem 1rem;
  }
  
  .form-section {
    padding: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .modal-actions {
    padding: 1.25rem;
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .modal-header {
    padding: 1rem;
  }
  
  .modal-header h2 {
    font-size: 1.25rem;
  }
  
  .modal-header p {
    font-size: 0.85rem;
  }
  
  .close-btn {
    top: 1rem;
    right: 1rem;
  }
  
  .modal-body {
    padding: 0.75rem;
  }
  
  .drop-zone {
    padding: 1.5rem 0.75rem;
  }
  
  .drop-zone h3 {
    font-size: 1.1rem;
  }
  
  .drop-zone p {
    font-size: 0.85rem;
  }
  
  .upload-icon {
    font-size: 2.5rem;
  }
  
  .form-section {
    padding: 1rem;
    margin-bottom: 1.25rem;
  }
  
  .modal-actions {
    padding: 1rem;
  }
  
  .btn {
    padding: 0.875rem 1.25rem;
    font-size: 0.9rem;
  }
}

/* Touch device improvements */
@media (hover: none) and (pointer: coarse) {
  .drop-zone:hover,
  .file-info:hover,
  .form-section:hover,
  .radio-option:hover {
    transform: none;
  }
  
  .btn:hover {
    transform: none !important;
  }
  
  .browse-btn:hover {
    transform: none !important;
  }
}
</style>
