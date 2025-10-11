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

      <!-- Professional Information -->
      <div class="form-section">
        <h3>Professional Information</h3>
        
        <div class="form-group">
          <label for="specialties">Specialties</label>
          <div class="tags-input">
            <div class="tags">
              <span 
                v-for="(specialty, index) in form.specialties" 
                :key="index" 
                class="tag"
              >
                {{ specialty }}
                <button type="button" @click="removeSpecialty(index)" class="tag-remove">×</button>
              </span>
            </div>
            <input 
              v-model="newSpecialty"
              @keydown.enter.prevent="addSpecialty"
              @keydown.comma.prevent="addSpecialty"
              placeholder="Type a specialty and press Enter"
              class="tag-input"
            />
          </div>
          <small class="help-text">e.g., Dementia Care, Physical Therapy, Medication Management</small>
        </div>
        
        <div class="form-group">
          <label for="certifications">Certifications</label>
          <div class="tags-input">
            <div class="tags">
              <span 
                v-for="(cert, index) in form.certifications" 
                :key="index" 
                class="tag"
              >
                {{ cert }}
                <button type="button" @click="removeCertification(index)" class="tag-remove">×</button>
              </span>
            </div>
            <input 
              v-model="newCertification"
              @keydown.enter.prevent="addCertification"
              @keydown.comma.prevent="addCertification"
              placeholder="Type a certification and press Enter"
              class="tag-input"
            />
          </div>
          <small class="help-text">e.g., CNA, RN, CPR Certified, First Aid</small>
        </div>
        
        <div class="form-group">
          <label for="hourly_rate">Hourly Rate ($)</label>
          <input 
            id="hourly_rate"
            v-model.number="form.hourly_rate" 
            type="number" 
            min="0" 
            step="0.01"
            placeholder="25.00"
          />
        </div>
      </div>

      <!-- Availability Schedule -->
      <div class="form-section">
        <h3>Availability Schedule</h3>
        <p class="section-description">Set your typical availability for each day of the week</p>
        
        <div class="schedule-grid">
          <div 
            v-for="day in daysOfWeek" 
            :key="day.key" 
            class="schedule-day"
          >
            <div class="day-header">
              <label class="day-label">{{ day.label }}</label>
              <input 
                v-model="form.availability_schedule[day.key].available"
                type="checkbox" 
                class="availability-checkbox"
              />
            </div>
            
            <div 
              v-if="form.availability_schedule[day.key].available" 
              class="time-inputs"
            >
              <input 
                v-model="form.availability_schedule[day.key].start"
                type="time" 
                class="time-input"
              />
              <span class="time-separator">to</span>
              <input 
                v-model="form.availability_schedule[day.key].end"
                type="time" 
                class="time-input"
              />
            </div>
          </div>
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

      <!-- Clock In/Out Status -->
      <div v-if="isEditing && caregiver" class="form-section">
        <h3>Current Status</h3>
        
        <div class="status-card">
          <div class="status-info">
            <div class="status-row">
              <span class="status-label">Current Status:</span>
              <span :class="['status-badge', clockedIn ? 'clocked-in' : 'clocked-out']">
                {{ clockedIn ? 'Clocked In' : 'Clocked Out' }}
              </span>
            </div>
            
            <div v-if="clockedIn && caregiver.clock_in_time" class="status-row">
              <span class="status-label">Clocked in since:</span>
              <span class="status-value">{{ formatDateTime(caregiver.clock_in_time) }}</span>
            </div>
            
            <div class="status-row">
              <span class="status-label">Total hours worked:</span>
              <span class="status-value">{{ caregiver.total_hours_worked?.toFixed(1) || '0' }} hours</span>
            </div>
          </div>
          
          <div class="clock-actions">
            <button 
              v-if="!clockedIn"
              type="button" 
              @click="clockIn" 
              class="btn btn-primary clock-btn"
              :disabled="clockingIn"
            >
              {{ clockingIn ? 'Clocking In...' : 'Clock In' }}
            </button>
            
            <button 
              v-if="clockedIn"
              type="button" 
              @click="clockOut" 
              class="btn btn-secondary clock-btn"
              :disabled="clockingOut"
            >
              {{ clockingOut ? 'Clocking Out...' : 'Clock Out' }}
            </button>
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
        <button type="button" @click="$emit('cancel')" class="btn btn-outline">
          Cancel
        </button>
        <button type="submit" class="btn btn-primary" :disabled="saving">
          {{ saving ? 'Saving...' : (isEditing ? 'Update Profile' : 'Create Profile') }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'

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
const clockingIn = ref(false)
const clockingOut = ref(false)
const newSpecialty = ref('')
const newCertification = ref('')

const daysOfWeek = [
  { key: 'monday' as keyof CaregiverSchedule, label: 'Monday' },
  { key: 'tuesday' as keyof CaregiverSchedule, label: 'Tuesday' },
  { key: 'wednesday' as keyof CaregiverSchedule, label: 'Wednesday' },
  { key: 'thursday' as keyof CaregiverSchedule, label: 'Thursday' },
  { key: 'friday' as keyof CaregiverSchedule, label: 'Friday' },
  { key: 'saturday' as keyof CaregiverSchedule, label: 'Saturday' },
  { key: 'sunday' as keyof CaregiverSchedule, label: 'Sunday' }
]

const defaultScheduleDay = (): CaregiverScheduleDay => ({
  start: '09:00',
  end: '17:00',
  available: false
})

const form = reactive({
  name: '',
  date_of_birth: '',
  email: '',
  phone: '',
  address: '',
  relationship: '',
  specialties: [] as string[],
  certifications: [] as string[],
  availability_schedule: {
    monday: defaultScheduleDay(),
    tuesday: defaultScheduleDay(),
    wednesday: defaultScheduleDay(),
    thursday: defaultScheduleDay(),
    friday: defaultScheduleDay(),
    saturday: defaultScheduleDay(),
    sunday: defaultScheduleDay()
  } as CaregiverSchedule,
  emergency_contact_name: '',
  emergency_contact_phone: '',
  notes: '',
  hourly_rate: undefined as number | undefined
})

const clockedIn = computed(() => {
  return props.caregiver?.clock_in_time && !props.caregiver?.clock_out_time
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
      specialties: [...props.caregiver.specialties],
      certifications: [...props.caregiver.certifications],
      availability_schedule: { ...props.caregiver.availability_schedule },
      emergency_contact_name: props.caregiver.emergency_contact_name || '',
      emergency_contact_phone: props.caregiver.emergency_contact_phone || '',
      notes: props.caregiver.notes || '',
      hourly_rate: props.caregiver.hourly_rate
    })
  }
})

function addSpecialty() {
  if (newSpecialty.value.trim() && !form.specialties.includes(newSpecialty.value.trim())) {
    form.specialties.push(newSpecialty.value.trim())
    newSpecialty.value = ''
  }
}

function removeSpecialty(index: number) {
  form.specialties.splice(index, 1)
}

function addCertification() {
  if (newCertification.value.trim() && !form.certifications.includes(newCertification.value.trim())) {
    form.certifications.push(newCertification.value.trim())
    newCertification.value = ''
  }
}

function removeCertification(index: number) {
  form.certifications.splice(index, 1)
}

async function clockIn() {
  if (!props.caregiver?.id) return
  
  clockingIn.value = true
  try {
    const response = await fetch(`/api/caregivers/${props.caregiver.id}/clock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'clock_in'
      })
    })
    
    if (response.ok) {
      // Emit event to parent to refresh data
      emit('save', null)
    }
  } catch (error) {
    console.error('Error clocking in:', error)
  } finally {
    clockingIn.value = false
  }
}

async function clockOut() {
  if (!props.caregiver?.id) return
  
  clockingOut.value = true
  try {
    const response = await fetch(`/api/caregivers/${props.caregiver.id}/clock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'clock_out'
      })
    })
    
    if (response.ok) {
      // Emit event to parent to refresh data
      emit('save', null)
    }
  } catch (error) {
    console.error('Error clocking out:', error)
  } finally {
    clockingOut.value = false
  }
}

function formatDateTime(dateTime: string): string {
  return new Date(dateTime).toLocaleString()
}

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
      specialties: form.specialties,
      certifications: form.certifications,
      availability_schedule: form.availability_schedule,
      emergency_contact_name: form.emergency_contact_name || undefined,
      emergency_contact_phone: form.emergency_contact_phone || undefined,
      notes: form.notes || undefined,
      hourly_rate: form.hourly_rate
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
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--border);
}

.form-header h2 {
  margin: 0;
  color: var(--text-heading);
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-muted);
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
  line-height: 1;
}

.close-btn:hover {
  background: var(--bg-hover);
  color: var(--text-heading);
}

.caregiver-form h2 {
  color: var(--text-heading);
  margin-bottom: 30px;
  text-align: center;
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.form-section {
  background: var(--bg-glass);
  border: var(--border);
  border-radius: 12px;
  padding: 24px;
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

.help-text {
  display: block;
  margin-top: 6px;
  color: var(--text-muted);
  font-size: 0.85rem;
}

/* Tags Input */
.tags-input {
  border: var(--border);
  border-radius: 8px;
  padding: 8px;
  background: var(--bg-main);
  min-height: 50px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--accent-blue);
  color: white;
  padding: 4px 8px;
  border-radius: 16px;
  font-size: 0.85rem;
  font-weight: 500;
}

.tag-remove {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 1.2rem;
  line-height: 1;
  padding: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tag-remove:hover {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
}

.tag-input {
  border: none;
  outline: none;
  background: transparent;
  color: var(--text-main);
  flex: 1;
  min-width: 150px;
  padding: 4px;
}

/* Schedule Grid */
.schedule-grid {
  display: grid;
  gap: 16px;
}

.schedule-day {
  background: var(--bg-panel);
  border: var(--border);
  border-radius: 8px;
  padding: 16px;
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.day-label {
  font-weight: 600;
  color: var(--text-heading);
  margin: 0;
}

.availability-checkbox {
  width: auto;
  margin: 0;
}

.time-inputs {
  display: flex;
  align-items: center;
  gap: 12px;
}

.time-input {
  flex: 1;
  max-width: 120px;
}

.time-separator {
  color: var(--text-muted);
  font-weight: 500;
}

/* Status Card */
.status-card {
  background: var(--bg-panel);
  border: var(--border);
  border-radius: 8px;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.status-info {
  flex: 1;
}

.status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.status-row:last-child {
  margin-bottom: 0;
}

.status-label {
  font-weight: 600;
  color: var(--text-muted);
}

.status-value {
  color: var(--text-main);
}

.status-badge {
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 0.85rem;
  font-weight: 600;
}

.status-badge.clocked-in {
  background: var(--led-green);
  color: white;
}

.status-badge.clocked-out {
  background: var(--text-muted);
  color: white;
}

.clock-actions {
  display: flex;
  gap: 12px;
}

.clock-btn {
  min-width: 120px;
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
}

.btn-primary:hover:not(:disabled) {
  background: var(--blue-600);
  transform: translateY(-1px);
}

.btn-secondary {
  background: var(--text-muted);
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #6b7280;
  transform: translateY(-1px);
}

.btn-outline {
  background: transparent;
  color: var(--accent-blue);
  border: 2px solid var(--accent-blue);
}

.btn-outline:hover:not(:disabled) {
  background: var(--accent-blue);
  color: white;
  transform: translateY(-1px);
}

/* Responsive Design */
@media (max-width: 768px) {
  .caregiver-form {
    padding: 16px;
  }
  
  .form-section {
    padding: 20px;
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
  
  .time-inputs {
    flex-direction: column;
    gap: 8px;
  }
  
  .time-input {
    max-width: none;
  }
}

@media (max-width: 480px) {
  .caregiver-form {
    padding: 12px;
  }
  
  .form-section {
    padding: 16px;
  }
  
  .form-section h3 {
    font-size: 1.1rem;
  }
}
</style>