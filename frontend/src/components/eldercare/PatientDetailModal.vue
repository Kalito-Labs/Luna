<template>
  <div class="patient-detail-modal">
    <div class="modal-header">
      <h2>{{ patient.name }}</h2>
      <button @click="$emit('close')" class="close-btn">&times;</button>
    </div>
    
    <div class="modal-body">
      <!-- Patient Basic Info -->
      <div class="patient-info-section">
        <div class="section-header">
          <h3>Patient Information</h3>
          <button @click="$emit('edit-patient', patient)" class="btn btn-sm btn-outline">
            Edit Patient
          </button>
        </div>
        
        <div class="info-grid">
          <div class="info-item">
            <label>Name:</label>
            <span>{{ patient.name }}</span>
          </div>
          <div class="info-item" v-if="patient.relationship">
            <label>Relationship:</label>
            <span>{{ formatRelationship(patient.relationship) }}</span>
          </div>
          <div class="info-item" v-if="patient.date_of_birth">
            <label>Age:</label>
            <span>{{ calculateAge(patient.date_of_birth) }} years old</span>
          </div>
          <div class="info-item" v-if="patient.gender">
            <label>Gender:</label>
            <span>{{ patient.gender }}</span>
          </div>
          <div class="info-item" v-if="patient.phone">
            <label>Phone:</label>
            <span>{{ patient.phone }}</span>
          </div>
          <div class="info-item" v-if="patient.primary_doctor">
            <label>Primary Doctor:</label>
            <span>{{ patient.primary_doctor }}</span>
          </div>
          <div class="info-item" v-if="patient.insurance_provider">
            <label>Insurance:</label>
            <span>{{ patient.insurance_provider }}</span>
          </div>
          <div class="info-item" v-if="patient.emergency_contact_name">
            <label>Emergency Contact:</label>
            <span>{{ patient.emergency_contact_name }}</span>
          </div>
        </div>
        
        <div v-if="patient.notes" class="notes-section">
          <label>Notes:</label>
          <p>{{ patient.notes }}</p>
        </div>
      </div>
      
      <!-- Medications Section -->
      <MedicationsList 
        :medications="medications"
        @add-medication="$emit('add-medication')"
        @edit-medication="$emit('edit-medication', $event)"
        @delete-medication="$emit('delete-medication', $event)"
      />
      
      <!-- Appointments Section -->
      <AppointmentsList 
        :appointments="appointments"
        @add-appointment="$emit('add-appointment')"
        @edit-appointment="$emit('edit-appointment', $event)"
        @delete-appointment="$emit('delete-appointment', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import MedicationsList from './MedicationsList.vue'
import AppointmentsList from './AppointmentsList.vue'


interface Patient {
  id: string
  name: string
  date_of_birth?: string
  relationship?: string
  gender?: string
  phone?: string
  primary_doctor?: string
  insurance_provider?: string
  emergency_contact_name?: string
  notes?: string
}

interface Medication {
  id: string
  name: string
  dosage: string
  frequency: string
  prescribing_doctor?: string
  start_date?: string
  refills_remaining?: number
}

interface Appointment {
  id: string
  appointment_date: string
  appointment_time?: string
  appointment_type?: string
  location?: string
  notes?: string
  status: string
}

interface Props {
  patient: Patient
  medications: Medication[]
  appointments: Appointment[]
}

defineProps<Props>()

defineEmits<{
  close: []
  'edit-patient': [patient: Patient]
  'add-medication': []
  'edit-medication': [medication: Medication]
  'delete-medication': [medication: Medication]
  'add-appointment': []
  'edit-appointment': [appointment: Appointment]
  'delete-appointment': [appointment: Appointment]
}>()

function formatRelationship(relationship: string): string {
  const relationships: Record<string, string> = {
    'mother': 'Mother',
    'father': 'Father',
    'spouse': 'Spouse',
    'self': 'Self',
    'other': 'Other'
  }
  return relationships[relationship] || relationship
}

function calculateAge(dateOfBirth: string): number {
  if (!dateOfBirth) return 0
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  
  return age
}
</script>

<style scoped>
.patient-detail-modal {
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

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.patient-info-section {
  margin-bottom: 32px;
  padding: 24px;
  background: var(--bg-glass);
  backdrop-filter: var(--blur);
  border: var(--border);
  border-radius: 12px;
  transition: all 0.2s ease;
}

.patient-info-section:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-soft);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: var(--border);
}

.section-header h3 {
  margin: 0;
  color: var(--text-heading);
  font-size: 1.25rem;
  font-weight: 600;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item label {
  font-weight: 600;
  color: var(--text-muted);
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-item span {
  color: var(--text-main);
  font-size: 1rem;
}

.notes-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: var(--border);
}

.notes-section label {
  font-weight: 600;
  color: var(--text-heading);
  margin-bottom: 8px;
  display: block;
}

.notes-section p {
  margin: 0;
  color: var(--text-main);
  line-height: 1.6;
}

.btn {
  padding: 10px 18px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.btn-sm {
  padding: 8px 16px;
  font-size: 0.875rem;
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
  .patient-detail-modal {
    width: 95vw;
  }
  
  .modal-body {
    padding: 20px;
  }
  
  .patient-info-section {
    padding: 20px;
  }
}

@media (max-width: 768px) {
  .patient-detail-modal {
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
  
  .modal-body {
    padding: 16px;
  }
  
  .patient-info-section {
    padding: 16px;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .modal-header {
    padding: 16px;
  }
  
  .modal-header h2 {
    font-size: 1.25rem;
  }
  
  .modal-body {
    padding: 12px;
  }
  
  .patient-info-section {
    padding: 16px;
    margin-bottom: 24px;
  }
  
  .info-item label {
    font-size: 0.8rem;
  }
  
  .info-item span {
    font-size: 0.95rem;
  }
}

/* Touch device improvements */
@media (hover: none) and (pointer: coarse) {
  .patient-info-section:hover {
    transform: none;
    box-shadow: none;
  }
  
  .btn:hover {
    transform: none !important;
  }
  
  .close-btn:hover {
    background: var(--bg-hover);
  }
}
</style>