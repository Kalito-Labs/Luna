<template>
  <div class="patient-form">
    <h2>{{ isEditing ? 'Edit Patient' : 'Add New Patient' }}</h2>
    
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
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.form-container {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.form-section {
  margin-bottom: 32px;
}

.form-section h3 {
  margin: 0 0 16px 0;
  color: #2d3748;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 8px;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
  color: #4a5568;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e2e8f0;
}

.btn {
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  border: none;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-primary:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background: #e5e7eb;
}
</style>