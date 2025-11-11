<template>
  <div class="vitals-form">
    <div class="modal-header">
      <h2>{{ isEditing ? 'Edit Vital Record' : 'Add New Vital Record' }}</h2>
      <button type="button" @click="$emit('cancel')" class="close-btn">&times;</button>
    </div>
    
    <form @submit.prevent="submitForm" class="form-container">
      <!-- Patient Selection -->
      <div class="form-section">
        <h3>Patient</h3>
        <div class="form-group">
          <label for="patient_id">Select Patient *</label>
          <select id="patient_id" v-model="form.patient_id" required :disabled="isEditing">
            <option value="">Choose a patient</option>
            <option v-for="patient in patients" :key="patient.id" :value="patient.id">
              {{ patient.name }}
            </option>
          </select>
        </div>
      </div>

      <!-- Vital Measurements -->
      <div class="form-section">
        <h3>Vital Measurements</h3>
        
        <div class="form-row">
          <div class="form-group">
            <label for="recorded_date">Date Recorded *</label>
            <input 
              id="recorded_date"
              v-model="form.recorded_date" 
              type="date" 
              required 
            />
          </div>
          
          <div class="form-group">
            <label for="weight_lbs">Weight (lbs)</label>
            <input 
              id="weight_lbs"
              v-model.number="form.weight_lbs" 
              type="number" 
              step="0.1"
              min="0"
              placeholder="e.g., 165.0"
            />
            <small class="field-note">Check weekly</small>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="glucose_am">Glucose AM (mg/dL)</label>
            <input 
              id="glucose_am"
              v-model.number="form.glucose_am" 
              type="number" 
              min="0"
              placeholder="Morning reading"
            />
            <small class="field-note">Morning (fasting)</small>
          </div>
          
          <div class="form-group">
            <label for="glucose_pm">Glucose PM (mg/dL)</label>
            <input 
              id="glucose_pm"
              v-model.number="form.glucose_pm" 
              type="number" 
              min="0"
              placeholder="Evening reading"
            />
            <small class="field-note">Before bed</small>
          </div>
        </div>
      </div>

      <!-- Additional Notes -->
      <div class="form-section">
        <div class="form-group">
          <label for="notes">Notes</label>
          <textarea 
            id="notes"
            v-model="form.notes" 
            rows="3" 
            placeholder="Any observations or notes about these measurements..."
          ></textarea>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <button type="button" @click="$emit('cancel')" class="btn btn-secondary">
          Cancel
        </button>
        <button type="submit" class="btn btn-primary">
          {{ isEditing ? 'Update' : 'Add' }} Vital Record
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Vital {
  id?: string
  patient_id: string
  weight_lbs?: number | null
  glucose_am?: number | null
  glucose_pm?: number | null
  recorded_date: string
  notes?: string
}

interface Patient {
  id: string
  name: string
}

interface Props {
  vital?: Vital | null
  isEditing: boolean
  patients: Patient[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  save: [vital: Vital]
  cancel: []
}>()

const form = ref<Vital>({
  patient_id: '',
  weight_lbs: null,
  glucose_am: null,
  glucose_pm: null,
  recorded_date: new Date().toISOString().split('T')[0] || '', // Today's date
  notes: '',
})

// Populate form when editing
watch(() => props.vital, (vital) => {
  if (vital) {
    form.value = {
      patient_id: vital.patient_id,
      weight_lbs: vital.weight_lbs ?? null,
      glucose_am: vital.glucose_am ?? null,
      glucose_pm: vital.glucose_pm ?? null,
      recorded_date: vital.recorded_date,
      notes: vital.notes || '',
    }
  }
}, { immediate: true })

function submitForm() {
  // Convert empty strings to null for optional fields
  // Use ?? instead of || to handle 0 as a valid value
  const vitalData: Vital = {
    patient_id: form.value.patient_id,
    weight_lbs: form.value.weight_lbs ?? null,
    glucose_am: form.value.glucose_am ?? null,
    glucose_pm: form.value.glucose_pm ?? null,
    recorded_date: form.value.recorded_date,
    notes: form.value.notes || undefined,
  }
  
  emit('save', vitalData)
}
</script>

<style scoped>
.vitals-form {
  background: var(--bg-main);
  border: var(--border);
  border-radius: 12px;
  max-width: 800px;
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

.field-note {
  display: block;
  margin-top: 4px;
  font-size: 0.85rem;
  color: var(--text-muted);
  font-style: italic;
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
  .vitals-form {
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
  .vitals-form {
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
