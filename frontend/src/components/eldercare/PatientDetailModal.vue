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
      
      <!-- Vitals Section -->
      <VitalsList 
        :vitals="vitals"
        @add-vitals="$emit('add-vitals')"
        @edit-vital="$emit('edit-vital', $event)"
        @delete-vital="$emit('delete-vital', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import MedicationsList from './MedicationsList.vue'
import AppointmentsList from './AppointmentsList.vue'
import VitalsList from './VitalsList.vue'

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

interface Vital {
  id: string
  measurement_type: string
  systolic?: number
  diastolic?: number
  value?: number
  unit?: string
  measured_at: string
  measured_by?: string
  location?: string
  notes?: string
}

interface Props {
  patient: Patient
  medications: Medication[]
  appointments: Appointment[]
  vitals: Vital[]
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
  'add-vitals': []
  'edit-vital': [vital: Vital]
  'delete-vital': [vital: Vital]
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
  background: white;
  border-radius: 12px;
  max-width: 1000px;
  width: 90vw;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.modal-header h2 {
  margin: 0;
  color: #1f2937;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.close-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.patient-info-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f8fafc;
  border-radius: 8px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-header h3 {
  margin: 0;
  color: #1f2937;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.info-item label {
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.25rem;
  font-size: 0.875rem;
}

.info-item span {
  color: #1f2937;
}

.notes-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.notes-section label {
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
  display: block;
}

.notes-section p {
  margin: 0;
  color: #1f2937;
  line-height: 1.5;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
}

.btn-outline {
  background: transparent;
  color: #374151;
  border-color: #d1d5db;
}

.btn-outline:hover {
  background: #f9fafb;
}
</style>