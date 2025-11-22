<template>
  <div class="appointment-form">
    <div class="modal-header">
      <h2>{{ isEditing ? 'Edit Appointment' : 'Schedule New Appointment' }}</h2>
      <button type="button" @click="$emit('cancel')" class="close-btn">&times;</button>
    </div>
    
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
            <label for="provider_name">Healthcare Provider</label>
            <input 
              id="provider_name"
              v-model="form.provider_name" 
              type="text" 
              placeholder="Doctor's name or clinic name"
            />
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
  provider_name: string
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
  provider_name: '',
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
    // Load all fields from the appointment being edited
    Object.assign(form.value, {
      patient_id: props.appointment.patient_id || '',
      provider_name: props.appointment.provider_name || '',
      appointment_date: props.appointment.appointment_date || '',
      appointment_time: props.appointment.appointment_time || '',
      appointment_type: props.appointment.appointment_type || '',
      location: props.appointment.location || '',
      notes: props.appointment.notes || '',
      preparation_notes: props.appointment.preparation_notes || '',
      status: props.appointment.status || 'scheduled',
      outcome_summary: props.appointment.outcome_summary || '',
      follow_up_required: props.appointment.follow_up_required || false
    })
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
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.95) 50%, rgba(67, 56, 202, 0.1) 100%);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 16px;
  max-width: 1000px;
  width: 90vw;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(20px);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid rgba(139, 92, 246, 0.2);
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
}

.modal-header h2 {
  margin: 0;
  background: linear-gradient(135deg, rgba(139, 92, 246, 1) 0%, rgba(196, 181, 253, 1) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 1.75rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.6);
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.close-btn:hover {
  background: rgba(139, 92, 246, 0.15);
  color: rgba(255, 255, 255, 1);
  transform: rotate(90deg);
}

.form-container {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
  background: rgba(0, 0, 0, 0.1);
}

.form-section {
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.form-section:last-child {
  margin-bottom: 0;
}

.form-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, rgba(139, 92, 246, 0.8) 0%, rgba(196, 181, 253, 0.8) 100%);
  border-radius: 16px 16px 0 0;
}

.form-section:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(139, 92, 246, 0.2);
  border-color: rgba(139, 92, 246, 0.4);
}

.form-section h3 {
  margin: 0 0 20px 0;
  background: linear-gradient(135deg, rgba(139, 92, 246, 1) 0%, rgba(196, 181, 253, 1) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  border-bottom: 1px solid rgba(139, 92, 246, 0.2);
  padding-bottom: 12px;
  font-weight: 600;
  font-size: 1.25rem;
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
  color: rgba(255, 255, 255, 0.9);
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.6);
  color: rgba(255, 255, 255, 0.9);
  font-size: 1rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.form-group input[type="checkbox"] {
  width: auto;
  cursor: pointer;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: rgba(139, 92, 246, 0.6);
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
  background: rgba(15, 23, 42, 0.8);
}

.form-group input:disabled,
.form-group select:disabled,
.form-group textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-actions {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  padding-top: 20px;
  border-top: 1px solid rgba(139, 92, 246, 0.2);
}

.btn {
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 0.95rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.8) 0%, rgba(124, 58, 237, 0.9) 100%);
  color: white;
  border: 1px solid rgba(139, 92, 246, 0.5);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(139, 92, 246, 1) 0%, rgba(124, 58, 237, 1) 100%);
  border-color: rgba(139, 92, 246, 0.8);
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.5);
  transform: translateY(-2px);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.06);
  color: rgba(129, 140, 248, 1);
  border: 1px solid rgba(129, 140, 248, 0.4);
  box-shadow: 0 2px 8px rgba(129, 140, 248, 0.1);
}

.btn-secondary:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(129, 140, 248, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%);
  border-color: rgba(129, 140, 248, 0.6);
  color: rgba(255, 255, 255, 1);
  box-shadow: 0 4px 20px rgba(129, 140, 248, 0.3);
  transform: translateY(-2px);
}

/* Responsive Design */
@media (max-width: 1024px) {
  .appointment-form {
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
  .appointment-form {
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
  
  .form-section h3 {
    font-size: 1.1rem;
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
    margin-bottom: 16px;
  }
  
  .form-section h3 {
    font-size: 1rem;
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