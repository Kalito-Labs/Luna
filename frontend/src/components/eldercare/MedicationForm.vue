<template>
  <div class="medication-form">
    <div class="modal-header">
      <h2>{{ isEditing ? 'Edit Medication' : 'Add New Medication' }}</h2>
      <button type="button" @click="$emit('cancel')" class="close-btn">&times;</button>
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

      <!-- Medication Details -->
      <div class="form-section">
        <h3>Medication Information</h3>
        
        <div class="form-row">
          <div class="form-group">
            <label for="name">Medication Name *</label>
            <input 
              id="name"
              v-model="form.name" 
              type="text" 
              required 
              placeholder="e.g., Lisinopril"
            />
          </div>
          
          <div class="form-group">
            <label for="generic_name">Generic Name</label>
            <input 
              id="generic_name"
              v-model="form.generic_name" 
              type="text" 
              placeholder="e.g., ACE inhibitor"
            />
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="dosage">Dosage *</label>
            <input 
              id="dosage"
              v-model="form.dosage" 
              type="text" 
              required 
              placeholder="e.g., 10mg"
            />
          </div>
          
          <div class="form-group">
            <label for="frequency">Frequency *</label>
            <select id="frequency" v-model="form.frequency" required>
              <option value="">Select frequency</option>
              <option value="once_daily">Once daily</option>
              <option value="twice_daily">Twice daily</option>
              <option value="three_times_daily">Three times daily</option>
              <option value="four_times_daily">Four times daily</option>
              <option value="as_needed">As needed</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="route">Route</label>
            <select id="route" v-model="form.route">
              <option value="">Select route</option>
              <option value="oral">Oral</option>
              <option value="topical">Topical</option>
              <option value="injection">Injection</option>
              <option value="inhaled">Inhaled</option>
              <option value="eye_drops">Eye drops</option>
              <option value="nasal">Nasal</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Prescription Details -->
      <div class="form-section">
        <h3>Prescription Details</h3>
        
        <div class="form-row">
          <div class="form-group">
            <label for="prescribing_doctor">Prescribing Doctor</label>
            <input 
              id="prescribing_doctor"
              v-model="form.prescribing_doctor" 
              type="text" 
              placeholder="Dr. Smith"
            />
          </div>
          
          <div class="form-group">
            <label for="pharmacy">Pharmacy</label>
            <input 
              id="pharmacy"
              v-model="form.pharmacy" 
              type="text" 
              placeholder="CVS Pharmacy"
            />
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="start_date">Start Date *</label>
            <input 
              id="start_date"
              v-model="form.start_date" 
              type="date" 
              required
            />
          </div>
          
          <div class="form-group">
            <label for="end_date">End Date</label>
            <input 
              id="end_date"
              v-model="form.end_date" 
              type="date"
            />
          </div>
          
          <div class="form-group">
            <label for="refills_remaining">Refills Remaining</label>
            <input 
              id="refills_remaining"
              v-model.number="form.refills_remaining" 
              type="number" 
              min="0"
              placeholder="0"
            />
          </div>
        </div>
      </div>

      <!-- Additional Information -->
      <div class="form-section">
        <div class="form-group">
          <label for="side_effects">Known Side Effects</label>
          <textarea 
            id="side_effects"
            v-model="form.side_effects" 
            rows="3" 
            placeholder="List any known side effects..."
          ></textarea>
        </div>
        
        <div class="form-group">
          <label for="notes">Additional Notes</label>
          <textarea 
            id="notes"
            v-model="form.notes" 
            rows="3" 
            placeholder="Instructions, warnings, or other notes..."
          ></textarea>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <button type="button" @click="$emit('cancel')" class="btn btn-secondary">
          Cancel
        </button>
        <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
          {{ isSubmitting ? 'Saving...' : (isEditing ? 'Update Medication' : 'Add Medication') }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface MedicationForm {
  patient_id: string
  name: string
  generic_name: string
  dosage: string
  frequency: string
  route: string
  prescribing_doctor: string
  pharmacy: string
  start_date: string
  end_date: string
  refills_remaining: number | null
  side_effects: string
  notes: string
}

interface Props {
  medication?: any
  patients: Array<{ id: string, name: string }>
  isEditing?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isEditing: false
})

const emit = defineEmits<{
  save: [medication: MedicationForm]
  cancel: []
}>()

const isSubmitting = ref(false)

const form = ref<MedicationForm>({
  patient_id: '',
  name: '',
  generic_name: '',
  dosage: '',
  frequency: '',
  route: '',
  prescribing_doctor: '',
  pharmacy: '',
  start_date: '',
  end_date: '',
  refills_remaining: null,
  side_effects: '',
  notes: ''
})

onMounted(() => {
  if (props.medication) {
    Object.assign(form.value, props.medication)
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
.medication-form {
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
  .medication-form {
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
  .medication-form {
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