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

      <!-- Medication Information -->
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
              placeholder="e.g., Zestril"
            />
          </div>
          
          <div class="form-group">
            <label for="generic_name">Generic Name</label>
            <input 
              id="generic_name"
              v-model="form.generic_name" 
              type="text" 
              placeholder="e.g., Lisinopril"
            />
          </div>
          
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

      <!-- Known Side Effects -->
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
      </div>

      <!-- Additional Notes -->
      <div class="form-section">
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
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98));
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 1.25rem;
  max-width: 62.5rem;
  width: 90vw;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(30px);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(139, 92, 246, 0.15);
  background: rgba(30, 41, 59, 0.6);
  backdrop-filter: blur(20px);
}

.modal-header h2 {
  margin: 0;
  color: rgba(255, 255, 255, 0.95);
  font-size: 1.5rem;
  font-weight: 600;
}

.close-btn {
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
  border-radius: 0.5rem;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 1);
  transform: rotate(90deg);
}

.form-container {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-container::-webkit-scrollbar {
  width: 6px;
}

.form-container::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.form-container::-webkit-scrollbar-thumb {
  background: rgba(139, 92, 246, 0.4);
  border-radius: 3px;
}

.form-container::-webkit-scrollbar-thumb:hover {
  background: rgba(139, 92, 246, 0.6);
}

.form-section {
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(30px);
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 0;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
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
  border-color: rgba(139, 92, 246, 0.3);
}

.form-section h3 {
  margin: 0 0 1.25rem 0;
  color: rgba(255, 255, 255, 0.95);
  border-bottom: 1px solid rgba(139, 92, 246, 0.15);
  padding-bottom: 0.75rem;
  font-size: 1.125rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(13.75rem, 1fr));
  gap: 1.25rem;
  margin-bottom: 1.25rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 0.75rem;
  background: rgba(30, 41, 59, 0.6);
  color: rgba(255, 255, 255, 0.95);
  font-size: 0.875rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: rgba(139, 92, 246, 0.5);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.15);
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid rgba(139, 92, 246, 0.15);
  background: rgba(30, 41, 59, 0.6);
  backdrop-filter: blur(20px);
  margin: 0 -1.5rem -1.5rem -1.5rem;
}

.btn {
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 0.875rem;
  backdrop-filter: blur(20px);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.9) 0%, rgba(124, 58, 237, 0.95) 100%);
  color: white;
  border: 1px solid rgba(139, 92, 246, 0.3);
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(139, 92, 246, 1) 0%, rgba(124, 58, 237, 1) 100%);
  border-color: rgba(139, 92, 246, 0.5);
  transform: translateY(-2px);
}

.btn-secondary {
  background: rgba(107, 114, 128, 0.2);
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(107, 114, 128, 0.3);
}

.btn-secondary:hover:not(:disabled) {
  background: rgba(107, 114, 128, 0.3);
  border-color: rgba(107, 114, 128, 0.5);
  transform: translateY(-2px);
}

/* Responsive Design */
@media (max-width: 1024px) {
  .medication-form {
    width: 95vw;
  }
  
  .form-container {
    padding: 1.25rem;
  }
  
  .form-section {
    padding: 1.25rem;
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
    padding: 1.25rem;
  }
  
  .modal-header h2 {
    font-size: 1.25rem;
  }
  
  .form-container {
    padding: 1rem;
  }
  
  .form-section {
    padding: 1rem;
  }
  
  .form-row {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .form-actions {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .modal-header {
    padding: 1rem;
  }
  
  .modal-header h2 {
    font-size: 1rem;
  }
  
  .form-container {
    padding: 0.75rem;
  }
  
  .form-section {
    padding: 1rem;
  }
  
  .form-section h3 {
    font-size: 1rem;
  }
}

/* Touch device improvements */
@media (hover: none) and (pointer: coarse) {
  .form-section:hover {
    transform: none;
    border-color: rgba(139, 92, 246, 0.15);
  }
  
  .btn:hover {
    transform: none !important;
  }
  
  .close-btn:hover {
    transform: none !important;
  }
}
</style>