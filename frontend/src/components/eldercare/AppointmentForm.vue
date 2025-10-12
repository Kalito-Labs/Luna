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
}

.form-section {
  background: var(--bg-glass);
  backdrop-filter: var(--blur);
  border: var(--border);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  transition: all 0.2s ease;
}

.form-section:last-child {
  margin-bottom: 0;
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

.form-group input[type="checkbox"] {
  width: auto;
  cursor: pointer;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--accent-blue);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
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