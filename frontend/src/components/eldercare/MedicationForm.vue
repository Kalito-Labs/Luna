<template>
  <div class="medication-form">
    <h2>{{ isEditing ? 'Edit Medication' : 'Add New Medication' }}</h2>
    
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