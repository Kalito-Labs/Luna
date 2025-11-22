<template>
  <div class="medications-list">
    <div class="list-header">
      <h3>Medications</h3>
      <button v-if="!readonly" @click="$emit('add-medication')" class="btn btn-sm btn-primary">
        Add Medication
      </button>
    </div>
    
    <!-- Patient Filter Buttons - Only show when multiple patients -->
    <div v-if="patients.length > 1" class="patient-filters">
      <button 
        @click="selectedPatientId = null" 
        :class="['filter-btn', { active: selectedPatientId === null }]"
      >
        All Medications
        <span class="count-badge">{{ medications.length }}</span>
      </button>
      <button 
        v-for="patient in patients" 
        :key="patient.id"
        @click="selectedPatientId = patient.id" 
        :class="['filter-btn', { active: selectedPatientId === patient.id }]"
      >
        {{ patient.name }}'s Meds
        <span class="count-badge">{{ getPatientMedicationCount(patient.id) }}</span>
      </button>
    </div>
    
    <div v-if="filteredMedications.length === 0" class="empty-state">
      <p>{{ selectedPatientId ? 'No medications recorded for this patient' : 'No medications recorded yet' }}</p>
    </div>
    
    <div v-else class="medications-grid">
      <div v-for="medication in filteredMedications" :key="medication.id" class="medication-card">
        <div class="med-header">
          <div class="med-title">
            <h4>{{ medication.name }}</h4>
            <span class="patient-badge">{{ medication.patient_name }}</span>
          </div>
          <span class="dosage-badge">{{ medication.dosage }}</span>
        </div>
        
        <div class="med-details">
          <p v-if="medication.generic_name">
            <strong>Generic:</strong> {{ medication.generic_name }}
          </p>
          <p><strong>Frequency:</strong> {{ formatFrequency(medication.frequency) }}</p>
          <p v-if="medication.route">
            <strong>Route:</strong> {{ formatRoute(medication.route) }}
          </p>
          <p v-if="medication.prescribing_doctor">
            <strong>Prescribed by:</strong> {{ medication.prescribing_doctor }}
          </p>
          <p v-if="medication.pharmacy">
            <strong>Pharmacy:</strong> {{ medication.pharmacy }}
          </p>
          <p v-if="medication.rx_number">
            <strong>Rx Number:</strong> {{ medication.rx_number }}
          </p>
        </div>
        
        <div v-if="!readonly" class="med-actions">
          <button @click="$emit('edit-medication', medication)" class="btn btn-xs btn-outline">
            Edit
          </button>
          <button @click="$emit('delete-medication', medication)" class="btn btn-xs btn-danger">
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Medication {
  id: string
  patient_id: string
  patient_name: string
  name: string
  generic_name?: string
  dosage: string
  frequency: string
  route?: string
  prescribing_doctor?: string
  pharmacy?: string
  rx_number?: string
  side_effects?: string
  notes?: string
}

interface Patient {
  id: string
  name: string
}

interface Props {
  medications: Medication[]
  patients: Patient[]
  readonly?: boolean
}

const props = defineProps<Props>()

defineEmits<{
  'add-medication': []
  'edit-medication': [medication: Medication]
  'delete-medication': [medication: Medication]
}>()

const selectedPatientId = ref<string | null>(null)

const filteredMedications = computed(() => {
  if (selectedPatientId.value === null) {
    return props.medications
  }
  return props.medications.filter(med => med.patient_id === selectedPatientId.value)
})

function getPatientMedicationCount(patientId: string): number {
  return props.medications.filter(med => med.patient_id === patientId).length
}

function formatFrequency(frequency: string): string {
  const frequencies: Record<string, string> = {
    'once_daily': 'Once daily',
    'twice_daily': 'Twice daily',
    'three_times_daily': 'Three times daily',
    'four_times_daily': 'Four times daily',
    'as_needed': 'As needed',
    'weekly': 'Weekly',
    'monthly': 'Monthly'
  }
  return frequencies[frequency] || frequency
}

function formatRoute(route: string): string {
  const routes: Record<string, string> = {
    'oral': 'Oral',
    'topical': 'Topical',
    'injection': 'Injection',
    'inhaled': 'Inhaled',
    'eye_drops': 'Eye drops',
    'nasal': 'Nasal'
  }
  return routes[route] || route
}
</script>

<style scoped>
.medications-list {
  margin-bottom: 2rem;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(139, 92, 246, 0.2);
}

.list-header h3 {
  margin: 0;
  background: linear-gradient(135deg, rgba(139, 92, 246, 1) 0%, rgba(196, 181, 253, 1) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 1.5rem;
  font-weight: 600;
}

/* Patient Filter Buttons */
.patient-filters {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 12px 20px;
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(20px);
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
}

.filter-btn:hover {
  border-color: rgba(139, 92, 246, 0.3);
  background: rgba(255, 255, 255, 0.08);
  transform: translateY(-3px);
  box-shadow: 0 8px 32px rgba(139, 92, 246, 0.25);
}

.filter-btn.active {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.9) 0%, rgba(124, 58, 237, 0.95) 100%);
  color: white;
  border-color: rgba(139, 92, 246, 0.4);
  box-shadow: 0 4px 20px rgba(139, 92, 246, 0.35);
}

.count-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 700;
  min-width: 24px;
  text-align: center;
}

.filter-btn.active .count-badge {
  background: rgba(255, 255, 255, 0.3);
}

.filter-btn:not(.active) .count-badge {
  background: rgba(139, 92, 246, 0.2);
  color: rgba(196, 181, 253, 1);
}

.medications-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.medication-card {
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(30px);
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-radius: 20px;
  padding: 24px;
  position: relative;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(139, 92, 246, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.medication-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, rgba(139, 92, 246, 0.8) 0%, rgba(196, 181, 253, 0.8) 100%);
  border-radius: 16px 16px 0 0;
}

.medication-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15), 0 4px 16px rgba(139, 92, 246, 0.25);
  border-color: rgba(139, 92, 246, 0.3);
}

.med-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(139, 92, 246, 0.15);
  gap: 12px;
}

.med-title {
  flex: 1;
  min-width: 0;
}

.med-header h4 {
  margin: 0 0 8px 0;
  color: rgba(255, 255, 255, 0.95);
  font-weight: 600;
  font-size: 1.1rem;
}

.patient-badge {
  display: inline-block;
  background: rgba(107, 114, 128, 0.15);
  color: var(--text-muted);
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid rgba(107, 114, 128, 0.2);
}

.dosage-badge {
  background: rgba(139, 92, 246, 0.15);
  color: rgba(196, 181, 253, 1);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid rgba(139, 92, 246, 0.25);
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.15);
}

.med-details {
  margin-bottom: 16px;
}

.med-details p {
  margin: 8px 0;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
}

.med-details strong {
  color: rgba(255, 255, 255, 0.9);
  margin-right: 8px;
  min-width: 120px;
}

.med-actions {
  display: flex;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid rgba(139, 92, 246, 0.15);
  flex-wrap: wrap;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: rgba(255, 255, 255, 0.6);
}

.empty-state p {
  margin: 0;
  font-size: 1.1rem;
}

.btn {
  padding: 10px 18px;
  border-radius: 16px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 0.875rem;
  white-space: nowrap;
  backdrop-filter: blur(20px);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.btn-xs {
  padding: 8px 14px;
  font-size: 0.8rem;
}

.btn-sm {
  padding: 8px 16px;
  font-size: 0.875rem;
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

.btn-outline {
  background: rgba(255, 255, 255, 0.04);
  color: rgba(129, 140, 248, 1);
  border: 1px solid rgba(129, 140, 248, 0.3);
  box-shadow: 0 2px 8px rgba(129, 140, 248, 0.1);
}

.btn-outline:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(129, 140, 248, 0.4);
  color: rgba(255, 255, 255, 1);
  box-shadow: 0 8px 32px rgba(129, 140, 248, 0.3);
  transform: translateY(-3px);
}

.btn-danger {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.8) 0%, rgba(220, 38, 38, 0.9) 100%);
  color: white;
  border: 1px solid rgba(239, 68, 68, 0.5);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.btn-danger:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(239, 68, 68, 1) 0%, rgba(220, 38, 38, 1) 100%);
  border-color: rgba(239, 68, 68, 0.8);
  box-shadow: 0 12px 40px rgba(239, 68, 68, 0.5);
  transform: translateY(-3px);
}

/* Responsive Design */
@media (max-width: 1200px) {
  .medications-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
  }
}

@media (max-width: 1024px) {
  .medications-grid {
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 20px;
  }
  
  .medication-card {
    padding: 20px;
  }
}

@media (max-width: 768px) {
  .medications-grid {
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 16px;
  }
  
  .medication-card {
    padding: 16px;
  }
  
  .list-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .patient-filters {
    width: 100%;
    gap: 8px;
  }
  
  .filter-btn {
    flex: 1;
    min-width: 0;
    justify-content: center;
    padding: 10px 16px;
    font-size: 0.875rem;
  }
  
  .med-actions {
    gap: 8px;
    justify-content: center;
  }
  
  .med-details strong {
    min-width: 100px;
    font-size: 0.85rem;
  }
}

@media (max-width: 480px) {
  .medications-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .medication-card {
    padding: 16px;
  }
  
  .patient-filters {
    flex-direction: column;
    gap: 8px;
  }
  
  .filter-btn {
    width: 100%;
  }
  
  .med-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .med-actions {
    flex-direction: column;
    gap: 6px;
  }
  
  .btn-xs,
  .btn-sm {
    width: 100%;
  }
}

/* Touch device improvements */
@media (hover: none) and (pointer: coarse) {
  .medication-card:hover {
    transform: none;
    box-shadow: var(--shadow-soft);
  }
  
  .btn:hover {
    transform: none !important;
  }
}
</style>