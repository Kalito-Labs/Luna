<template>
  <div class="medications-list">
    <div class="list-header">
      <h3>Medications</h3>
      <button @click="$emit('add-medication')" class="btn btn-sm btn-primary">
        Add Medication
      </button>
    </div>
    
    <div v-if="medications.length === 0" class="empty-state">
      <p>No medications recorded yet</p>
    </div>
    
    <div v-else class="medications-grid">
      <div v-for="medication in medications" :key="medication.id" class="medication-card">
        <div class="med-header">
          <h4>{{ medication.name }}</h4>
          <span class="dosage-badge">{{ medication.dosage }}</span>
        </div>
        
        <div class="med-details">
          <p><strong>Frequency:</strong> {{ formatFrequency(medication.frequency) }}</p>
          <p v-if="medication.prescribing_doctor">
            <strong>Prescribed by:</strong> {{ medication.prescribing_doctor }}
          </p>
          <p v-if="medication.start_date">
            <strong>Started:</strong> {{ formatDate(medication.start_date) }}
          </p>
          <p v-if="medication.refills_remaining !== null">
            <strong>Refills:</strong> {{ medication.refills_remaining }}
          </p>
        </div>
        
        <div class="med-actions">
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
interface Medication {
  id: string
  name: string
  dosage: string
  frequency: string
  prescribing_doctor?: string
  start_date?: string
  refills_remaining?: number
}

interface Props {
  medications: Medication[]
}

defineProps<Props>()

defineEmits<{
  'add-medication': []
  'edit-medication': [medication: Medication]
  'delete-medication': [medication: Medication]
}>()

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

function formatDate(dateString: string): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString()
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
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e5e7eb;
}

.list-header h3 {
  margin: 0;
  color: #1f2937;
}

.medications-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.medication-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s;
}

.medication-card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.med-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.med-header h4 {
  margin: 0;
  color: #1f2937;
  font-weight: 600;
}

.dosage-badge {
  background: #dbeafe;
  color: #1d4ed8;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.med-details {
  margin-bottom: 1rem;
}

.med-details p {
  margin: 0.25rem 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.med-actions {
  display: flex;
  gap: 0.5rem;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
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

.btn-xs {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-outline {
  background: transparent;
  color: #374151;
  border-color: #d1d5db;
}

.btn-outline:hover {
  background: #f9fafb;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}
</style>