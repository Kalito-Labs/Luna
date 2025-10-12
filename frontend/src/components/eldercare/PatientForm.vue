<template>
  <div class="patient-form">
    <div class="modal-header">
      <h2>{{ isEditing ? 'Edit Patient' : 'Add New Patient' }}</h2>
      <button type="button" @click="$emit('cancel')" class="close-btn">&times;</button>
    </div>
    
    <form @submit.prevent="submitForm" class="form-container">
      <!-- Basic Information -->
      <div class="form-section">
        <h3>Basic Information</h3>
        
        <div class="form-group">
          <label for="name">Full Name *</label>
          <input 
            id="name"
            v-model="form.name" 
            type="text" 
            required 
            placeholder="Enter patient's full name"
          />
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="date_of_birth">Date of Birth</label>
            <input 
              id="date_of_birth"
              v-model="form.date_of_birth" 
              type="date"
            />
          </div>
          
          <div class="form-group">
            <label for="relationship">Relationship</label>
            <select id="relationship" v-model="form.relationship">
              <option value="">Select relationship</option>
              <option value="mother">Mother</option>
              <option value="father">Father</option>
              <option value="spouse">Spouse</option>
              <option value="self">Self</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="gender">Gender</label>
            <select id="gender" v-model="form.gender">
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
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
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="emergency_contact_name">Emergency Contact Name</label>
            <input 
              id="emergency_contact_name"
              v-model="form.emergency_contact_name" 
              type="text" 
              placeholder="Emergency contact full name"
            />
          </div>
          
          <div class="form-group">
            <label for="emergency_contact_phone">Emergency Contact Phone</label>
            <input 
              id="emergency_contact_phone"
              v-model="form.emergency_contact_phone" 
              type="tel" 
              placeholder="(555) 987-6543"
            />
          </div>
        </div>
      </div>

      <!-- Medical Information -->
      <div class="form-section">
        <h3>Medical Information</h3>
        
        <div class="form-row">
          <div class="form-group">
            <label for="primary_doctor">Primary Doctor</label>
            <input 
              id="primary_doctor"
              v-model="form.primary_doctor" 
              type="text" 
              placeholder="Dr. Smith"
            />
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="insurance_provider">Insurance Provider</label>
            <input 
              id="insurance_provider"
              v-model="form.insurance_provider" 
              type="text" 
              placeholder="Insurance company name"
            />
          </div>
          
          <div class="form-group">
            <label for="insurance_id">Insurance ID</label>
            <input 
              id="insurance_id"
              v-model="form.insurance_id" 
              type="text" 
              placeholder="Insurance member ID"
            />
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div class="form-section">
        <div class="form-group">
          <label for="notes">Additional Notes</label>
          <textarea 
            id="notes"
            v-model="form.notes" 
            rows="4" 
            placeholder="Any additional information about the patient..."
          ></textarea>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <button type="button" @click="$emit('cancel')" class="btn btn-secondary">
          Cancel
        </button>
        <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
          {{ isSubmitting ? 'Saving...' : (isEditing ? 'Update Patient' : 'Add Patient') }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface PatientForm {
  name: string
  date_of_birth: string
  relationship: string
  gender: string
  phone: string
  emergency_contact_name: string
  emergency_contact_phone: string
  primary_doctor: string
  insurance_provider: string
  insurance_id: string
  notes: string
}

interface Props {
  patient?: any
  isEditing?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isEditing: false
})

const emit = defineEmits<{
  save: [patient: PatientForm]
  cancel: []
}>()

const isSubmitting = ref(false)

const form = ref<PatientForm>({
  name: '',
  date_of_birth: '',
  relationship: '',
  gender: '',
  phone: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  primary_doctor: '',
  insurance_provider: '',
  insurance_id: '',
  notes: ''
})

onMounted(() => {
  if (props.patient) {
    Object.assign(form.value, props.patient)
  }
})

async function submitForm() {
  isSubmitting.value = true
  
  try {
    emit('save', { ...form.value })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.patient-form {
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

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: var(--border);
  background: var(--bg-panel);
}

.modal-header h2 {
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
  margin-bottom: 0;
  transition: all 0.2s ease;
}

.form-section:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-soft);
}

.form-section h3 {
  margin: 0 0 20px 0;
  color: var(--text-heading);
  border-bottom: var(--border);
  padding-bottom: 12px;
  font-size: 1.25rem;
  font-weight: 600;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: var(--text-heading);
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

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--accent-blue);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-actions {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
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

.btn-secondary {
  background: transparent;
  color: var(--accent-blue);
  border: 2px solid var(--accent-blue);
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--accent-blue);
  color: white;
  box-shadow: var(--glow-blue);
  transform: translateY(-1px);
}

/* Responsive Design */
@media (max-width: 1024px) {
  .patient-form {
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
  .patient-form {
    width: 100vw;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
  }
  
  .modal-header {
    padding: 20px;
  }
  
  .modal-header h2 {
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
  .modal-header {
    padding: 16px;
  }
  
  .modal-header h2 {
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