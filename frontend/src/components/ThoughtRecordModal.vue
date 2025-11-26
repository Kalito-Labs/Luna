<template>
  <div v-if="isOpen" class="modal-overlay" @click="closeModal">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h2 class="modal-title">📝 Thought Record</h2>
        <button @click="closeModal" class="close-button">✕</button>
      </div>
      
      <div class="modal-content">
        <p class="modal-description">
          A structured way to examine and challenge your thoughts. Take your time with each step.
        </p>
        
        <form @submit.prevent="saveThoughtRecord" class="thought-record-form">
          <div class="form-group">
            <label>1. Situation - What happened?</label>
            <textarea 
              v-model="thoughtRecord.situation"
              placeholder="Describe the situation that triggered your thoughts..."
              rows="3"
              class="custom-textarea"
            ></textarea>
          </div>

          <div class="form-group">
            <label>2. Automatic Thought - What went through your mind?</label>
            <textarea 
              v-model="thoughtRecord.automaticThought"
              placeholder="What was your immediate thought?"
              rows="3"
              class="custom-textarea"
            ></textarea>
          </div>

          <div class="form-group">
            <label>3. Emotion & Intensity (0-100)</label>
            <div class="emotion-input">
              <input 
                v-model="thoughtRecord.emotion"
                placeholder="e.g., Anxious, Sad, Angry"
                class="custom-input"
              />
              <div class="slider-container">
                <label class="slider-label">0</label>
                <input 
                  v-model="thoughtRecord.emotionIntensity"
                  type="range"
                  min="0" 
                  max="100"
                  step="10"
                  class="emotion-slider"
                />
                <label class="slider-label">100</label>
              </div>
              <div class="slider-value">{{ thoughtRecord.emotionIntensity }}</div>
            </div>
          </div>

          <div class="form-group">
            <label>4. Evidence For - What supports this thought?</label>
            <textarea 
              v-model="thoughtRecord.evidenceFor"
              placeholder="What facts or evidence support this thought?"
              rows="3"
              class="custom-textarea"
            ></textarea>
          </div>

          <div class="form-group">
            <label>5. Evidence Against - What contradicts this thought?</label>
            <textarea 
              v-model="thoughtRecord.evidenceAgainst"
              placeholder="What facts or evidence contradict this thought?"
              rows="3"
              class="custom-textarea"
            ></textarea>
          </div>

          <div class="form-group">
            <label>6. Alternative Thought - What's a more balanced perspective?</label>
            <textarea 
              v-model="thoughtRecord.alternativeThought"
              placeholder="What would you tell a friend in this situation?"
              rows="3"
              class="custom-textarea"
            ></textarea>
          </div>

          <div class="form-group">
            <label>7. New Emotion & Intensity (0-100)</label>
            <div class="emotion-input">
              <input 
                v-model="thoughtRecord.newEmotion"
                placeholder="How do you feel now?"
                class="custom-input"
              />
              <div class="slider-container">
                <label class="slider-label">0</label>
                <input 
                  v-model="thoughtRecord.newEmotionIntensity"
                  type="range"
                  min="0" 
                  max="100"
                  step="10"
                  class="emotion-slider"
                />
                <label class="slider-label">100</label>
              </div>
              <div class="slider-value">{{ thoughtRecord.newEmotionIntensity }}</div>
            </div>
          </div>

          <div class="form-actions">
            <button @click="clearThoughtRecord" type="button" class="clear-button">
              Clear Form
            </button>
            <button type="submit" class="save-button">
              Save Thought Record
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'vue'

interface ThoughtRecord {
  id?: string
  situation: string
  automaticThought: string
  emotion: string
  emotionIntensity: number
  evidenceFor: string
  evidenceAgainst: string
  alternativeThought: string
  newEmotion: string
  newEmotionIntensity: number
  createdAt?: string
}

export default defineComponent({
  name: 'ThoughtRecordModal',
  props: {
    isOpen: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'save'],
  setup(props, { emit }) {
    const thoughtRecord = ref<ThoughtRecord>({
      situation: '',
      automaticThought: '',
      emotion: '',
      emotionIntensity: 50,
      evidenceFor: '',
      evidenceAgainst: '',
      alternativeThought: '',
      newEmotion: '',
      newEmotionIntensity: 50
    })

    // Simple toast function
    const showToast = (message: string, isSuccess: boolean = true) => {
      const toastDiv = document.createElement('div')
      toastDiv.textContent = message
      toastDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${isSuccess ? 'rgba(34, 197, 94, 0.9)' : 'rgba(239, 68, 68, 0.9)'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        z-index: 2000;
        font-weight: 500;
        backdrop-filter: blur(10px);
        transition: all 0.3s ease;
      `
      document.body.appendChild(toastDiv)
      
      setTimeout(() => {
        toastDiv.style.opacity = '0'
        toastDiv.style.transform = 'translateX(100%)'
        setTimeout(() => document.body.removeChild(toastDiv), 300)
      }, 3000)
    }

    const closeModal = () => {
      emit('close')
    }

    const saveThoughtRecord = () => {
      const recordToSave = {
        ...thoughtRecord.value,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      }
      
      emit('save', recordToSave)
      showToast('Thought record saved successfully!', true)
      clearThoughtRecord()
      closeModal()
    }

    const clearThoughtRecord = () => {
      thoughtRecord.value = {
        situation: '',
        automaticThought: '',
        emotion: '',
        emotionIntensity: 50,
        evidenceFor: '',
        evidenceAgainst: '',
        alternativeThought: '',
        newEmotion: '',
        newEmotionIntensity: 50
      }
    }

    // Clear form when modal closes
    watch(() => props.isOpen, (newVal) => {
      if (!newVal) {
        setTimeout(() => clearThoughtRecord(), 300) // Wait for close animation
      }
    })

    return {
      thoughtRecord,
      closeModal,
      saveThoughtRecord,
      clearThoughtRecord
    }
  }
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1500;
  padding: 20px;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-container {
  background: linear-gradient(135deg, 
    rgba(15, 23, 42, 0.98) 0%,
    rgba(30, 41, 59, 0.95) 100%);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.5),
    0 8px 32px rgba(139, 92, 246, 0.2);
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 32px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(139, 92, 246, 0.05);
}

.modal-title {
  background: linear-gradient(135deg, rgba(196, 181, 253, 1) 0%, rgba(139, 92, 246, 1) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0;
}

.close-button {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.2rem;
  transition: all 0.3s ease;
}

.close-button:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.4);
  color: rgba(248, 113, 113, 1);
}

.modal-content {
  padding: 32px;
  overflow-y: auto;
  max-height: calc(90vh - 100px);
  color: rgba(255, 255, 255, 0.9);
  
  /* Custom scrollbar */
  scrollbar-width: thin;
  scrollbar-color: rgba(139, 92, 246, 0.6) rgba(255, 255, 255, 0.1);
}

.modal-content::-webkit-scrollbar {
  width: 6px;
}

.modal-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

.modal-content::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, 
    rgba(139, 92, 246, 0.6) 0%, 
    rgba(129, 140, 248, 0.6) 100%);
  border-radius: 3px;
}

.modal-content::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, 
    rgba(139, 92, 246, 0.8) 0%, 
    rgba(129, 140, 248, 0.8) 100%);
}

.modal-description {
  color: rgba(196, 181, 253, 0.8);
  font-size: 1.1rem;
  margin-bottom: 32px;
  text-align: center;
  line-height: 1.6;
}

.thought-record-form {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  color: rgba(196, 181, 253, 1);
  font-weight: 600;
  margin-bottom: 12px;
  font-size: 1.05rem;
}

.custom-textarea,
.custom-input {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 14px 18px;
  font-size: 1rem;
  line-height: 1.5;
  resize: vertical;
  transition: all 0.3s ease;
  font-family: inherit;
}

.custom-textarea:focus,
.custom-input:focus {
  outline: none;
  border-color: rgba(139, 92, 246, 0.6);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
  background: rgba(255, 255, 255, 0.08);
}

.custom-textarea::placeholder,
.custom-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.emotion-input {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.slider-container {
  display: flex;
  align-items: center;
  gap: 16px;
}

.slider-label {
  color: rgba(196, 181, 253, 0.8);
  font-weight: 500;
  min-width: 24px;
  text-align: center;
}

.emotion-slider {
  flex: 1;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  outline: none;
  appearance: none;
  -webkit-appearance: none;
}

.emotion-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(139, 92, 246, 1) 0%, rgba(129, 140, 248, 1) 100%);
  cursor: pointer;
  border: 2px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
}

.emotion-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(139, 92, 246, 1) 0%, rgba(129, 140, 248, 1) 100%);
  cursor: pointer;
  border: 2px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
}

.slider-value {
  color: rgba(139, 92, 246, 1);
  font-weight: 600;
  font-size: 1.1rem;
  text-align: center;
  padding: 8px 12px;
  background: rgba(139, 92, 246, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(139, 92, 246, 0.3);
  min-width: 60px;
}

.form-actions {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.clear-button {
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.clear-button:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.5);
  color: rgba(255, 255, 255, 0.9);
}

.save-button {
  background: linear-gradient(135deg, rgba(139, 92, 246, 1) 0%, rgba(129, 140, 248, 1) 100%);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 12px 32px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(139, 92, 246, 0.3);
  transition: all 0.3s ease;
}

.save-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(139, 92, 246, 0.4);
}

.save-button:active {
  transform: translateY(0);
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .modal-container {
    margin: 10px;
    max-width: calc(100% - 20px);
    border-radius: 16px;
  }
  
  .modal-header {
    padding: 20px 24px;
  }
  
  .modal-title {
    font-size: 1.5rem;
  }
  
  .modal-content {
    padding: 24px;
  }
  
  .form-actions {
    flex-direction: column;
    gap: 12px;
  }
  
  .clear-button,
  .save-button {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .modal-header {
    padding: 16px 20px;
  }
  
  .modal-content {
    padding: 20px;
  }
  
  .thought-record-form {
    gap: 24px;
  }
  
  .custom-textarea,
  .custom-input {
    padding: 12px 16px;
  }
}
</style>