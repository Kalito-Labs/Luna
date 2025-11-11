<template>
  <div class="provider-form">
    <div class="form-header">
      <h2>{{ isEditing ? 'Edit Healthcare Provider' : 'Add Healthcare Provider' }}</h2>
      <button type="button" @click="closeForm" class="close-btn" aria-label="Close">×</button>
    </div>
    
    <form @submit.prevent="submitForm" class="form-container">
      <!-- Patient Selection -->
      <div class="form-section">
        <h3>Patient</h3>
        <div class="form-group">
          <label for="patient_id">Select Patient *</label>
          <select id="patient_id" v-model="form.patient_id" required>
            <option value="">Choose a patient</option>
            <option v-for="patient in patients" :key="patient.id" :value="patient.id">
              {{ patient.name }}
            </option>
          </select>
        </div>
      </div>

      <!-- Basic Information -->
      <div class="form-section">
        <h3>Basic Information</h3>
        
        <div class="form-group">
          <label for="name">Provider Name *</label>
          <input 
            id="name"
            v-model="form.name" 
            type="text" 
            required 
            placeholder="Dr. John Smith"
          />
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="specialty">Specialty</label>
            <input 
              id="specialty"
              v-model="form.specialty" 
              type="text" 
              placeholder="e.g., Cardiologist, Primary Care"
            />
          </div>
          
          <div class="form-group">
            <label for="practice_name">Practice/Clinic Name</label>
            <input 
              id="practice_name"
              v-model="form.practice_name" 
              type="text" 
              placeholder="Medical Center Name"
            />
          </div>
        </div>
      </div>

      <!-- Contact Information -->
      <div class="form-section">
        <h3>Contact Information</h3>
        
        <div class="form-row">
          <div class="form-group">
            <label for="phone">Phone Number</label>
            <input 
              id="phone"
              v-model="form.phone" 
              type="tel" 
              placeholder="(555) 123-4567"
            />
          </div>
          
          <div class="form-group">
            <label for="email">Email Address</label>
            <input 
              id="email"
              v-model="form.email" 
              type="email" 
              placeholder="doctor@clinic.com"
            />
          </div>
        </div>
        
        <div class="form-group">
          <label for="address">Office Address</label>
          <textarea 
            id="address"
            v-model="form.address" 
            rows="2"
            placeholder="Street address, city, state, zip"
          ></textarea>
        </div>
      </div>

      <!-- Additional Details -->
      <div class="form-section">
        <h3>Additional Details</h3>
        
        <div class="form-group">
          <label for="notes">Notes</label>
          <textarea 
            id="notes"
            v-model="form.notes" 
            rows="4"
            placeholder="Office hours, parking info, special instructions..."
          ></textarea>
        </div>
        
        <div class="form-group checkbox-group">
          <label>
            <input 
              id="preferred"
              v-model="form.preferred" 
              type="checkbox"
            />
            <span>Mark as Preferred Provider</span>
          </label>
          <p class="help-text">Preferred providers appear at the top of your list</p>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <button type="button" @click="closeForm" class="btn btn-outline">
          Cancel
        </button>
        <button type="submit" class="btn btn-primary" :disabled="saving">
          {{ saving ? 'Saving...' : (isEditing ? 'Update Provider' : 'Add Provider') }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface ProviderForm {
  patient_id: string
  name: string
  specialty: string
  practice_name: string
  phone: string
  email: string
  address: string
  notes: string
  preferred: boolean
}

interface Provider {
  id: string
  patient_id?: string
  name: string
  specialty?: string
  practice_name?: string
  phone?: string
  email?: string
  address?: string
  notes?: string
  preferred?: boolean
  created_at: string
  updated_at: string
}

interface Props {
  provider?: Provider
  patients: Array<{ id: string, name: string }>
  isEditing?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isEditing: false
})

const emit = defineEmits<{
  save: [providerData: any]
  cancel: []
  close: []
}>()

const saving = ref(false)

const form = ref<ProviderForm>({
  patient_id: '',
  name: '',
  specialty: '',
  practice_name: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
  preferred: false
})

onMounted(() => {
  if (props.provider) {
    Object.assign(form.value, props.provider)
  }
})

function closeForm() {
  emit('close')
}

async function submitForm() {
  saving.value = true
  
  try {
    const providerData = {
      patient_id: form.value.patient_id,
      name: form.value.name,
      specialty: form.value.specialty || undefined,
      practice_name: form.value.practice_name || undefined,
      phone: form.value.phone || undefined,
      email: form.value.email || undefined,
      address: form.value.address || undefined,
      notes: form.value.notes || undefined,
      preferred: form.value.preferred ? 1 : 0
    }
    
    emit('save', providerData)
  } catch (error) {
    console.error('Error submitting form:', error)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.provider-form {
  background: var(--bg-main);
  border: var(--border);
  border-radius: 12px;
  max-width: 1000px;
  width: 90vw;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-strong);
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: var(--border);
  background: var(--bg-panel);
}

.form-header h2 {
  margin: 0;
  color: var(--text-heading);
  font-size: 1.75rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: var(--text-muted);
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: var(--bg-hover);
  color: var(--text-heading);
}

.form-container {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-section {
  background: var(--bg-glass);
  backdrop-filter: var(--blur);
  border: var(--border);
  border-radius: 12px;
  padding: 24px;
  transition: all 0.2s ease;
}

.form-section:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-soft);
}

.form-section h3 {
  color: var(--text-heading);
  margin: 0 0 20px 0;
  font-size: 1.25rem;
  font-weight: 600;
  border-bottom: var(--border);
  padding-bottom: 12px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.form-row:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: var(--text-heading);
  font-weight: 600;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  margin-bottom: 8px;
}

.checkbox-group input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.checkbox-group span {
  color: var(--text-heading);
}

.help-text {
  color: var(--text-muted);
  font-size: 0.875rem;
  margin: 0;
  padding-left: 30px;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 12px;
  border: var(--border);
  border-radius: 8px;
  background: var(--bg-main);
  color: var(--text-main);
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.form-group input[type="checkbox"] {
  width: auto;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--accent-blue);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  padding-top: 20px;
  border-top: var(--border);
}

.btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
  font-size: 0.95rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--accent-blue);
  color: white;
  box-shadow: var(--glow-blue);
}

.btn-primary:hover:not(:disabled) {
  background: var(--blue-600);
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4);
  transform: translateY(-1px);
}

.btn-outline {
  background: transparent;
  color: var(--accent-blue);
  border: 2px solid var(--accent-blue);
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
}

.btn-outline:hover:not(:disabled) {
  background: var(--accent-blue);
  color: white;
  box-shadow: var(--glow-blue);
  transform: translateY(-1px);
}

/* Responsive Design */
@media (max-width: 1024px) {
  .provider-form {
    width: 95vw;
  }
  
  .form-container {
    padding: 20px;
  }
  
  .form-section {
    padding: 20px;
  }
}

@media (max-width: 768px) {
  .provider-form {
    width: 100vw;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
  }
  
  .form-header {
    padding: 20px;
  }
  
  .form-header h2 {
    font-size: 1.5rem;
  }
  
  .form-container {
    padding: 16px;
  }
  
  .form-section {
    padding: 16px;
  }
  
  .form-row {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .form-actions {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .form-header {
    padding: 16px;
  }
  
  .form-header h2 {
    font-size: 1.25rem;
  }
  
  .form-container {
    padding: 12px;
  }
  
  .form-section {
    padding: 16px;
  }
  
  .form-section h3 {
    font-size: 1.1rem;
  }
}

/* Touch device improvements */
@media (hover: none) and (pointer: coarse) {
  .form-section:hover {
    transform: none;
    box-shadow: none;
  }
  
  .btn:hover {
    transform: none !important;
  }
}
</style>
