<template>
  <div class="vitals-form">
    <h2>Record Vital Signs</h2>
    
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
            <option value="oxygen_saturation">Oxygen Saturation</option>
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
    blood_sugar: 'Blood Sugar Level',
    oxygen_saturation: 'Oxygen Saturation'
  }
  return labels[form.value.measurement_type] || 'Value'
}

function getValuePlaceholder(): string {
  const placeholders: Record<string, string> = {
    weight: '150',
    temperature: '98.6',
    heart_rate: '72',
    blood_sugar: '100',
    oxygen_saturation: '98'
  }
  return placeholders[form.value.measurement_type] || ''
}

function getUnitsForType(): string[] {
  const units: Record<string, string[]> = {
    weight: ['lbs', 'kg'],
    temperature: ['°F', '°C'],
    heart_rate: ['bpm'],
    blood_sugar: ['mg/dL', 'mmol/L'],
    oxygen_saturation: ['%']
  }
  return units[form.value.measurement_type] || ['']
}

function getDefaultUnit(): string {
  const defaults: Record<string, string> = {
    weight: 'lbs',
    temperature: '°F',
    heart_rate: 'bpm',
    blood_sugar: 'mg/dL',
    oxygen_saturation: '%'
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