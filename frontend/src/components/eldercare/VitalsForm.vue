<template>
  <div class="vitals-form">
    <div class="modal-header">
      <h2>Record Vital Signs</h2>
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

      <!-- Measurement Type -->
      <div class="form-section">
        <div class="form-group">
          <label for="measurement_type">Measurement Type *</label>
          <select id="measurement_type" v-model="form.measurement_type" required @change="resetValues">
            <option value="">Select measurement type</option>
            <option value="blood_pressure">Blood Pressure</option>
            <option value="weight">Weight</option>
            <option value="temperature">Temperature</option>
            <option value="heart_rate">Heart Rate</option>
            <option value="blood_sugar">Blood Sugar</option>
          </select>
        </div>
      </div>

      <!-- Dynamic Value Input Based on Type -->
      <div class="form-section">
        <h3>Measurement Values</h3>
        
        <!-- Blood Pressure -->
        <div v-if="form.measurement_type === 'blood_pressure'" class="form-row">
          <div class="form-group">
            <label for="systolic">Systolic *</label>
            <input 
              id="systolic"
              v-model.number="form.systolic" 
              type="number" 
              required 
              placeholder="120"
              min="60"
              max="300"
            />
          </div>
          
          <div class="form-group">
            <label for="diastolic">Diastolic *</label>
            <input 
              id="diastolic"
              v-model.number="form.diastolic" 
              type="number" 
              required 
              placeholder="80"
              min="40"
              max="200"
            />
          </div>
        </div>
        
        <!-- Single Value Measurements -->
        <div v-else-if="form.measurement_type" class="form-row">
          <div class="form-group">
            <label for="value">{{ getValueLabel() }} *</label>
            <input 
              id="value"
              v-model.number="form.value" 
              type="number" 
              step="0.1"
              required 
              :placeholder="getValuePlaceholder()"
            />
          </div>
          
          <div class="form-group">
            <label for="unit">Unit</label>
            <select id="unit" v-model="form.unit">
              <option v-for="unit in getUnitsForType()" :key="unit" :value="unit">
                {{ unit }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Measurement Details -->
      <div class="form-section">
        <h3>Measurement Details</h3>
        
        <div class="form-row">
          <div class="form-group">
            <label for="measured_at">Date & Time *</label>
            <input 
              id="measured_at"
              v-model="form.measured_at" 
              type="datetime-local" 
              required
            />
          </div>
          
          <div class="form-group">
            <label for="measured_by">Measured By</label>
            <input 
              id="measured_by"
              v-model="form.measured_by" 
              type="text" 
              placeholder="Who took the measurement"
            />
          </div>
          
          <div class="form-group">
            <label for="location">Location</label>
            <select id="location" v-model="form.location">
              <option value="">Select location</option>
              <option value="home">Home</option>
              <option value="doctors_office">Doctor's Office</option>
              <option value="hospital">Hospital</option>
              <option value="pharmacy">Pharmacy</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        
        <div class="form-group">
          <label for="notes">Notes</label>
          <textarea 
            id="notes"
            v-model="form.notes" 
            rows="3" 
            placeholder="Any additional observations or notes..."
          ></textarea>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <button type="button" @click="$emit('cancel')" class="btn btn-secondary">
          Cancel
        </button>
        <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
          {{ isSubmitting ? 'Saving...' : 'Record Vital Signs' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface VitalsForm {
  patient_id: string
  measurement_type: string
  systolic: number | null
  diastolic: number | null
  value: number | null
  unit: string
  notes: string
  measured_at: string
  measured_by: string
  location: string
}

interface Props {
  patients: Array<{ id: string, name: string }>
}

defineProps<Props>()

const emit = defineEmits<{
  save: [vitals: VitalsForm]
  cancel: []
}>()

const isSubmitting = ref(false)

const form = ref<VitalsForm>({
  patient_id: '',
  measurement_type: '',
  systolic: null,
  diastolic: null,
  value: null,
  unit: '',
  notes: '',
  measured_at: '',
  measured_by: '',
  location: ''
})

onMounted(() => {
  // Set default date/time to now
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  form.value.measured_at = now.toISOString().slice(0, 16)
})

function resetValues() {
  form.value.systolic = null
  form.value.diastolic = null
  form.value.value = null
  form.value.unit = getDefaultUnit()
}

function getValueLabel(): string {
  const labels: Record<string, string> = {
    weight: 'Weight',
    temperature: 'Temperature',
    heart_rate: 'Heart Rate',
    blood_sugar: 'Blood Sugar Level'
  }
  return labels[form.value.measurement_type] || 'Value'
}

function getValuePlaceholder(): string {
  const placeholders: Record<string, string> = {
    weight: '150',
    temperature: '98.6',
    heart_rate: '72',
    blood_sugar: '100'
  }
  return placeholders[form.value.measurement_type] || ''
}

function getUnitsForType(): string[] {
  const units: Record<string, string[]> = {
    weight: ['lbs', 'kg'],
    temperature: ['°F', '°C'],
    heart_rate: ['bpm'],
    blood_sugar: ['mg/dL', 'mmol/L']
  }
  return units[form.value.measurement_type] || ['']
}

function getDefaultUnit(): string {
  const defaults: Record<string, string> = {
    weight: 'lbs',
    temperature: '°F',
    heart_rate: 'bpm',
    blood_sugar: 'mg/dL'
  }
  return defaults[form.value.measurement_type] || ''
}

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
.vitals-form {
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