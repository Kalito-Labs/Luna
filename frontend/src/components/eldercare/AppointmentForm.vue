<template>
  <div class="appointment-form">
    <h2>{{ isEditing ? 'Edit Appointment' : 'Schedule New Appointment' }}</h2>
    
    <form @submit.prevent="submitForm" class="form-container">
      <!-- Patient Selection -->
      <div class="form-section">
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

      <!-- Appointment Details -->
      <div class="form-section">
        <h3>Appointment Details</h3>
        
        <div class="form-row">
          <div class="form-group">
            <label for="appointment_date">Date *</label>
            <input 
              id="appointment_date"
              v-model="form.appointment_date" 
              type="date" 
              required
            />
          </div>
          
          <div class="form-group">
            <label for="appointment_time">Time</label>
            <input 
              id="appointment_time"
              v-model="form.appointment_time" 
              type="time"
            />
          </div>
          
          <div class="form-group">
            <label for="appointment_type">Type</label>
            <select id="appointment_type" v-model="form.appointment_type">
              <option value="">Select appointment type</option>
              <option value="routine">Routine Check-up</option>
              <option value="follow_up">Follow-up</option>
              <option value="specialist">Specialist Consultation</option>
              <option value="emergency">Emergency</option>
              <option value="procedure">Procedure</option>
              <option value="lab_work">Lab Work</option>
              <option value="imaging">Imaging</option>
            </select>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="provider_id">Healthcare Provider</label>
            <select id="provider_id" v-model="form.provider_id">
              <option value="">Select provider</option>
              <option v-for="provider in providers" :key="provider.id" :value="provider.id">
                {{ provider.name }} - {{ provider.specialty }}
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="location">Location</label>
            <input 
              id="location"
              v-model="form.location" 
              type="text" 
              placeholder="Clinic name or address"
            />
          </div>
        </div>
      </div>

      <!-- Preparation & Notes -->
      <div class="form-section">
        <h3>Preparation & Notes</h3>
        
        <div class="form-group">
          <label for="preparation_notes">Preparation Instructions</label>
          <textarea 
            id="preparation_notes"
            v-model="form.preparation_notes" 
            rows="3" 
            placeholder="What to bring, fasting requirements, medications to take/avoid..."
          ></textarea>
        </div>
        
        <div class="form-group">
          <label for="notes">Additional Notes</label>
          <textarea 
            id="notes"
            v-model="form.notes" 
            rows="3" 
            placeholder="Reason for visit, symptoms to discuss, questions to ask..."
          ></textarea>
        </div>
      </div>

      <!-- Status (for editing existing appointments) -->
      <div v-if="isEditing" class="form-section">
        <h3>Appointment Status</h3>
        
        <div class="form-row">
          <div class="form-group">
            <label for="status">Status</label>
            <select id="status" v-model="form.status">
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="rescheduled">Rescheduled</option>
            </select>
          </div>
        </div>
        
        <div v-if="form.status === 'completed'" class="form-group">
          <label for="outcome_summary">Appointment Summary</label>
          <textarea 
            id="outcome_summary"
            v-model="form.outcome_summary" 
            rows="4" 
            placeholder="Summary of what happened during the appointment..."
          ></textarea>
        </div>
        
        <div class="form-group">
          <label for="follow_up_required">Follow-up Required</label>
          <input 
            id="follow_up_required"
            v-model="form.follow_up_required" 
            type="checkbox"
          />
        </div>
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <button type="button" @click="$emit('cancel')" class="btn btn-secondary">
          Cancel
        </button>
        <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
          {{ isSubmitting ? 'Saving...' : (isEditing ? 'Update Appointment' : 'Schedule Appointment') }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface AppointmentForm {
  patient_id: string
  provider_id: string
  appointment_date: string
  appointment_time: string
  appointment_type: string
  location: string
  notes: string
  preparation_notes: string
  status: string
  outcome_summary: string
  follow_up_required: boolean
}

interface Props {
  appointment?: any
  patients: Array<{ id: string, name: string }>
  providers: Array<{ id: string, name: string, specialty: string }>
  isEditing?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isEditing: false
})

const emit = defineEmits<{
  save: [appointment: AppointmentForm]
  cancel: []
}>()

const isSubmitting = ref(false)

const form = ref<AppointmentForm>({
  patient_id: '',
  provider_id: '',
  appointment_date: '',
  appointment_time: '',
  appointment_type: '',
  location: '',
  notes: '',
  preparation_notes: '',
  status: 'scheduled',
  outcome_summary: '',
  follow_up_required: false
})

onMounted(() => {
  if (props.appointment) {
    Object.assign(form.value, props.appointment)
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
.appointment-form {
  max-width: 800px;
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

.form-group input[type="checkbox"] {
  width: auto;
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