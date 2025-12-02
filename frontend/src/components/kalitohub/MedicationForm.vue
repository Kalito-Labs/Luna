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
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 24px;
  max-width: 1000px;
  width: 90vw;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3), 0 8px 24px rgba(139, 92, 246, 0.2);
  backdrop-filter: blur(30px);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid rgba(139, 92, 246, 0.15);
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(20px);
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
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 1);
  transform: rotate(90deg);
}

.form-container {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
  background: rgba(0, 0, 0, 0.05);
}

.form-section {
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(30px);
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 0;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
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
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1), 0 4px 16px rgba(139, 92, 246, 0.2);
  border-color: rgba(139, 92, 246, 0.25);
}

.form-section h3 {
  margin: 0 0 20px 0;
  background: linear-gradient(135deg, rgba(139, 92, 246, 1) 0%, rgba(196, 181, 253, 1) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  border-bottom: 1px solid rgba(139, 92, 246, 0.15);
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
  color: rgba(255, 255, 255, 0.9);
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.9);
  font-size: 1rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: rgba(139, 92, 246, 0.4);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.15);
  background: rgba(255, 255, 255, 0.06);
}

.form-actions {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  padding-top: 20px;
  border-top: 1px solid rgba(139, 92, 246, 0.15);
}

.btn {
  padding: 12px 24px;
  border-radius: 16px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 0.95rem;
  backdrop-filter: blur(20px);
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
  box-shadow: 0 12px 40px rgba(139, 92, 246, 0.5);
  transform: translateY(-3px);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.04);
  color: rgba(129, 140, 248, 1);
  border: 1px solid rgba(129, 140, 248, 0.3);
  box-shadow: 0 2px 8px rgba(129, 140, 248, 0.1);
}

.btn-secondary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(129, 140, 248, 0.4);
  color: rgba(255, 255, 255, 1);
  box-shadow: 0 8px 32px rgba(129, 140, 248, 0.3);
  transform: translateY(-3px);
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