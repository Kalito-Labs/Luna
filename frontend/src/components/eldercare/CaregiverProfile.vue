<template>
  <div class="caregiver-form">
    <div class="form-header">
      <h2>{{ isEditing ? 'Edit Caregiver Profile' : 'My Caregiver Profile' }}</h2>
      <button type="button" @click="closeForm" class="close-btn" aria-label="Close">×</button>
    </div>
    
    <form @submit.prevent="submitForm" class="form-container">
      <!-- Basic Information -->
      <div class="form-section">
        <h3>Basic Information</h3>
        
        <div class="form-group">
          <label for="name">Full Name *</label>
          <input 
            id="name"
            v-model="form.name" 
            type="text" 
            required 
            placeholder="Enter your full name"
          />
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="date_of_birth">Date of Birth</label>
            <input 
              id="date_of_birth"
              v-model="form.date_of_birth" 
              type="date"
            />
          </div>
          
          <div class="form-group">
            <label for="relationship">Relationship to Patients</label>
            <select id="relationship" v-model="form.relationship">
              <option value="">Select relationship</option>
              <option value="family">Family Member</option>
              <option value="professional">Professional Caregiver</option>
              <option value="friend">Friend</option>
              <option value="volunteer">Volunteer</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Contact Information -->
      <div class="form-section">
        <h3>Contact Information</h3>
        
        <div class="form-row">
          <div class="form-group">
            <label for="email">Email Address</label>
            <input 
              id="email"
              v-model="form.email" 
              type="email" 
              placeholder="your.email@example.com"
            />
          </div>
          
          <div class="form-group">
            <label for="phone">Phone Number</label>
            <input 
              id="phone"
              v-model="form.phone" 
              type="tel" 
              placeholder="(555) 123-4567"
            />
          </div>
        </div>
        
        <div class="form-group">
          <label for="address">Address</label>
          <textarea 
            id="address"
            v-model="form.address" 
            rows="2"
            placeholder="Enter your full address"
          ></textarea>
        </div>
      </div>

      <!-- Emergency Contact -->
      <div class="form-section">
        <h3>Emergency Contact</h3>
        
        <div class="form-row">
          <div class="form-group">
            <label for="emergency_contact_name">Emergency Contact Name</label>
            <input 
              id="emergency_contact_name"
              v-model="form.emergency_contact_name" 
              type="text" 
              placeholder="Contact person's name"
            />
          </div>
          
          <div class="form-group">
            <label for="emergency_contact_phone">Emergency Contact Phone</label>
            <input 
              id="emergency_contact_phone"
              v-model="form.emergency_contact_phone" 
              type="tel" 
              placeholder="(555) 123-4567"
            />
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div class="form-section">
        <h3>Personal Notes</h3>
        <div class="form-group">
          <label for="notes">Notes</label>
          <textarea 
            id="notes"
            v-model="form.notes" 
            rows="4"
            placeholder="Add any personal notes, preferences, or important information about yourself..."
          ></textarea>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <button type="button" @click="closeForm" class="btn btn-outline">
          Cancel
        </button>
        <button type="submit" class="btn btn-primary" :disabled="saving">
          {{ saving ? 'Saving...' : 'Save Profile' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'

interface CaregiverScheduleDay {
  start: string
  end: string
  available: boolean
}

interface CaregiverSchedule {
  monday: CaregiverScheduleDay
  tuesday: CaregiverScheduleDay
  wednesday: CaregiverScheduleDay
  thursday: CaregiverScheduleDay
  friday: CaregiverScheduleDay
  saturday: CaregiverScheduleDay
  sunday: CaregiverScheduleDay
}

interface Caregiver {
  id: string
  name: string
  date_of_birth?: string
  email?: string
  phone?: string
  address?: string
  relationship?: string
  specialties: string[]
  certifications: string[]
  availability_schedule: CaregiverSchedule
  emergency_contact_name?: string
  emergency_contact_phone?: string
  notes?: string
  clock_in_time?: string
  clock_out_time?: string
  is_active: number
  last_clock_in?: string
  last_clock_out?: string
  total_hours_worked: number
  hourly_rate?: number
  created_at: string
  updated_at: string
}

interface Props {
  caregiver?: Caregiver
  isEditing?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isEditing: false
})

const emit = defineEmits<{
  save: [caregiverData: any]
  cancel: []
  close: []
}>()

const saving = ref(false)

const form = reactive({
  name: '',
  date_of_birth: '',
  email: '',
  phone: '',
  address: '',
  relationship: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  notes: ''
})

onMounted(() => {
  if (props.caregiver) {
    Object.assign(form, {
      name: props.caregiver.name,
      date_of_birth: props.caregiver.date_of_birth || '',
      email: props.caregiver.email || '',
      phone: props.caregiver.phone || '',
      address: props.caregiver.address || '',
      relationship: props.caregiver.relationship || '',
      emergency_contact_name: props.caregiver.emergency_contact_name || '',
      emergency_contact_phone: props.caregiver.emergency_contact_phone || '',
      notes: props.caregiver.notes || ''
    })
  }
})

function closeForm() {
  emit('close')
}

async function submitForm() {
  saving.value = true
  
  try {
    const caregiverData = {
      name: form.name,
      date_of_birth: form.date_of_birth || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      address: form.address || undefined,
      relationship: form.relationship || undefined,
      emergency_contact_name: form.emergency_contact_name || undefined,
      emergency_contact_phone: form.emergency_contact_phone || undefined,
      notes: form.notes || undefined
    }
    
    emit('save', caregiverData)
  } catch (error) {
    console.error('Error submitting form:', error)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.caregiver-form {
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

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: var(--border);
  background: var(--bg-panel);
}

.form-header h2 {
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
  gap: 30px;
}

.form-section {
  background: var(--bg-glass);
  backdrop-filter: var(--blur);
  border: var(--border);
  border-radius: 12px;
  padding: 24px;
  transition: all 0.2s ease;
}

.form-section:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-soft);
}

.form-section h3 {
  color: var(--text-heading);
  margin: 0 0 20px 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.section-description {
  color: var(--text-muted);
  margin: -10px 0 20px 0;
  font-size: 0.9rem;
}

.form-group {
  margin-bottom: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: var(--text-heading);
  font-weight: 600;
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

/* Form Actions */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
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
  background: var(--text-muted);
  color: white;
  box-shadow: 0 2px 4px rgba(107, 114, 128, 0.3);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--gray-600);
  box-shadow: 0 4px 8px rgba(107, 114, 128, 0.4);
  transform: translateY(-1px);
}

.btn-outline {
  background: transparent;
  color: var(--accent-blue);
  border: 2px solid var(--accent-blue);
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
}

.btn-outline:hover:not(:disabled) {
  background: var(--accent-blue);
  color: white;
  box-shadow: var(--glow-blue);
  transform: translateY(-1px);
}

/* Responsive Design */
@media (max-width: 1024px) {
  .caregiver-form {
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
  .caregiver-form {
    width: 100vw;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
  }
  
  .form-header {
    padding: 20px;
  }
  
  .form-header h2 {
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
  
  .status-card {
    flex-direction: column;
    align-items: stretch;
  }
  
  .form-actions {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .form-header {
    padding: 16px;
  }
  
  .form-header h2 {
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