<template>
  <div class="patients-list">
    <div class="list-header">
      <h3>Patients</h3>
      <button @click="$emit('add-patient')" class="btn btn-sm btn-primary">
        Add Patient
      </button>
    </div>
    
    <div v-if="patients.length === 0" class="empty-state">
      <p>No patients added yet</p>
    </div>
    
    <div v-else class="patients-grid">
      <div 
        v-for="patient in patients" 
        :key="patient.id" 
        class="patient-card"
      >
        <div class="patient-header">
          <div class="header-content">
            <h4>{{ patient.name }}</h4>
            <span v-if="patient.relationship" class="relationship-badge">
              {{ formatRelationship(patient.relationship) }}
            </span>
          </div>
        </div>
        
        <div class="patient-details">
          <p v-if="patient.date_of_birth">
            <strong>Age:</strong> {{ calculateAge(patient.date_of_birth) }} years old
          </p>
          <p v-if="patient.gender">
            <strong>Gender:</strong> {{ patient.gender }}
          </p>
          <p v-if="getPrimaryDoctorName(patient.primary_doctor_id)">
            <strong>Primary Doctor:</strong> {{ getPrimaryDoctorName(patient.primary_doctor_id) }}
          </p>
          <p v-if="patient.phone">
            <strong>Phone:</strong> {{ patient.phone }}
          </p>
          <p v-if="patient.emergency_contact_name">
            <strong>Emergency Contact:</strong> {{ patient.emergency_contact_name }}
          </p>
          <p v-if="patient.notes" class="notes">
            <strong>Notes:</strong> {{ patient.notes }}
          </p>
        </div>
        
        <div class="patient-actions">
          <button @click="$emit('view-details', patient)" class="btn btn-xs btn-primary">
            View Details
          </button>
          <button @click="$emit('edit-patient', patient)" class="btn btn-xs btn-outline">
            Edit
          </button>
          <button @click="$emit('delete-patient', patient)" class="btn btn-xs btn-danger">
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Patient {
  id: string
  name: string
  date_of_birth?: string
  relationship?: string
  gender?: string
  phone?: string
  primary_doctor_id?: string
  emergency_contact_name?: string
  notes?: string
}

interface Provider {
  id: string
  name: string
  specialty?: string
}

interface Props {
  patients: Patient[]
  providers: Provider[]
}

const props = defineProps<Props>()

function getPrimaryDoctorName(patientDoctorId?: string): string {
  if (!patientDoctorId) return ''
  const doctor = props.providers.find(p => p.id === patientDoctorId)
  return doctor ? `${doctor.name}${doctor.specialty ? ` (${doctor.specialty})` : ''}` : ''
}

defineEmits<{
  'add-patient': []
  'view-details': [patient: Patient]
  'edit-patient': [patient: Patient]
  'delete-patient': [patient: Patient]
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
.patients-list {
  margin-bottom: 40px;
}

@media (max-width: 768px) {
  .patients-list {
    margin-bottom: 30px;
  }
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: var(--border);
}

.list-header .btn {
  flex: 0 0 auto;
}

@media (max-width: 480px) {
  .list-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
}

.list-header h3 {
  margin: 0;
  color: var(--text-heading);
  font-weight: 600;
  font-size: 1.5rem;
}

@media (max-width: 480px) {
  .list-header h3 {
    font-size: 1.25rem;
  }
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-muted);
}

.empty-state p {
  font-size: 1.1rem;
  margin: 0;
}

.patients-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
}

@media (max-width: 1200px) {
  .patients-grid {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .patients-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

.patient-card {
  background: var(--bg-glass);
  backdrop-filter: var(--blur);
  border: var(--border);
  border-radius: 12px;
  padding: 20px;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.patient-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-soft);
  border-color: var(--accent-blue);
}

.patient-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.patient-header h4 {
  margin: 0;
  color: var(--text-heading);
  font-size: 1.25rem;
  font-weight: 600;
  flex: 1;
}

.relationship-badge {
  background: var(--accent-blue);
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  white-space: nowrap;
  flex-shrink: 0;
}

.patient-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.patient-details p {
  margin: 0;
  color: var(--text-main);
  font-size: 0.95rem;
  line-height: 1.4;
}

.patient-details strong {
  color: var(--text-muted);
  font-weight: 600;
}

.patient-details .notes {
  margin-top: 8px;
  padding-top: 12px;
  border-top: var(--border);
  color: var(--text-main);
  font-size: 0.9rem;
  line-height: 1.5;
}

.patient-actions {
  display: flex;
  gap: 8px;
  margin-top: auto;
  padding-top: 12px;
  border-top: var(--border);
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  flex: 1;
  text-align: center;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-xs {
  padding: 6px 12px;
  font-size: 0.8rem;
}

.btn-sm {
  padding: 8px 16px;
  font-size: 0.875rem;
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

.btn-outline {
  background: transparent;
  color: var(--accent-blue);
  border: 2px solid var(--accent-blue);
}

.btn-outline:hover:not(:disabled) {
  background: var(--accent-blue);
  color: white;
  box-shadow: var(--glow-blue);
  transform: translateY(-1px);
}

.btn-danger {
  background: var(--red-600);
  color: white;
  box-shadow: 0 2px 4px rgba(239, 68, 68, 0.2);
}

.btn-danger:hover:not(:disabled) {
  background: var(--red-700);
  box-shadow: 0 4px 8px rgba(239, 68, 68, 0.4);
  transform: translateY(-1px);
}

/* Touch device improvements */
@media (hover: none) and (pointer: coarse) {
  .patient-card:hover {
    transform: none;
  }
}
</style>
