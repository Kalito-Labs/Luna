<template>
  <div class="vitals-list">
    <div class="list-header">
      <h3>Recent Vitals</h3>
      <button @click="$emit('add-vitals')" class="btn btn-sm btn-primary">
        Record Vitals
      </button>
    </div>
    
    <div v-if="vitals.length === 0" class="empty-state">
      <p>No vitals recorded yet</p>
    </div>
    
    <div v-else class="vitals-grid">
      <div v-for="vital in vitals" :key="vital.id" class="vital-card">
        <div class="vital-header">
          <h4>{{ formatMeasurementType(vital.measurement_type) }}</h4>
          <span class="date-badge">{{ formatDate(vital.measured_at) }}</span>
        </div>
        
        <div class="vital-value">
          <span class="value">{{ formatValue(vital) }}</span>
          <span v-if="vital.unit" class="unit">{{ vital.unit }}</span>
        </div>
        
        <div class="vital-details">
          <p v-if="vital.measured_by">
            <strong>Measured by:</strong> {{ vital.measured_by }}
          </p>
          <p v-if="vital.location">
            <strong>Location:</strong> {{ formatLocation(vital.location) }}
          </p>
          <p v-if="vital.notes">
            <strong>Notes:</strong> {{ vital.notes }}
          </p>
        </div>
        
        <div class="vital-actions">
          <button @click="$emit('edit-vital', vital)" class="btn btn-xs btn-outline">
            Edit
          </button>
          <button @click="$emit('delete-vital', vital)" class="btn btn-xs btn-danger">
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
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
  vitals: Vital[]
}

defineProps<Props>()

defineEmits<{
  'add-vitals': []
  'edit-vital': [vital: Vital]
  'delete-vital': [vital: Vital]
}>()

function formatMeasurementType(type: string): string {
  const types: Record<string, string> = {
    'blood_pressure': 'Blood Pressure',
    'weight': 'Weight',
    'temperature': 'Temperature',
    'heart_rate': 'Heart Rate',
    'blood_sugar': 'Blood Sugar',
    'oxygen_saturation': 'Oxygen Saturation'
  }
  return types[type] || type
}

function formatValue(vital: Vital): string {
  if (vital.measurement_type === 'blood_pressure') {
    return `${vital.systolic}/${vital.diastolic}`
  }
  return vital.value?.toString() || 'N/A'
}

function formatLocation(location: string): string {
  const locations: Record<string, string> = {
    'home': 'Home',
    'doctors_office': "Doctor's Office",
    'hospital': 'Hospital',
    'pharmacy': 'Pharmacy',
    'other': 'Other'
  }
  return locations[location] || location
}

function formatDate(dateString: string): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString()
}
</script>

<style scoped>
.vitals-list {
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

.vitals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.vital-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s;
}

.vital-card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.vital-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.vital-header h4 {
  margin: 0;
  color: #1f2937;
  font-weight: 600;
}

.date-badge {
  background: #f3f4f6;
  color: #374151;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.vital-value {
  text-align: center;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 6px;
}

.value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
}

.unit {
  font-size: 0.875rem;
  color: #6b7280;
  margin-left: 0.25rem;
}

.vital-details {
  margin-bottom: 1rem;
}

.vital-details p {
  margin: 0.25rem 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.vital-actions {
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