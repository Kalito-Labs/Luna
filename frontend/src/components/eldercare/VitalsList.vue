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
  margin-bottom: 32px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: var(--border);
}

.list-header h3 {
  margin: 0;
  color: var(--text-heading);
  font-size: 1.5rem;
  font-weight: 600;
}

.vitals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.vital-card {
  background: var(--bg-glass);
  backdrop-filter: var(--blur);
  border: var(--border);
  border-radius: 12px;
  padding: 20px;
  box-shadow: var(--shadow-soft);
  transition: all 0.2s ease;
}

.vital-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-strong);
}

.vital-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: var(--border);
}

.vital-header h4 {
  margin: 0;
  color: var(--text-heading);
  font-weight: 600;
  font-size: 1.1rem;
}

.date-badge {
  background: rgba(59, 130, 246, 0.1);
  color: var(--accent-blue);
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
}

.vital-value {
  text-align: center;
  margin-bottom: 16px;
  padding: 16px;
  background: var(--bg-panel);
  border-radius: 8px;
  border: var(--border);
}

.value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--accent-blue);
}

.unit {
  font-size: 1rem;
  color: var(--text-muted);
  margin-left: 6px;
  font-weight: 500;
}

.vital-details {
  margin-bottom: 16px;
}

.vital-details p {
  margin: 8px 0;
  font-size: 0.9rem;
  color: var(--text-main);
  line-height: 1.5;
}

.vital-details strong {
  color: var(--text-heading);
  font-weight: 600;
}

.vital-actions {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  border-top: var(--border);
}

.empty-state {
  text-align: center;
  padding: 48px 24px;
  color: var(--text-muted);
  background: var(--bg-glass);
  backdrop-filter: var(--blur);
  border: var(--border);
  border-radius: 12px;
}

.empty-state p {
  margin: 0;
  font-size: 1rem;
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
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
}

.btn-outline:hover:not(:disabled) {
  background: var(--accent-blue);
  color: white;
  box-shadow: var(--glow-blue);
  transform: translateY(-1px);
}

.btn-danger {
  background: var(--led-red);
  color: white;
  box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
}

.btn-danger:hover:not(:disabled) {
  background: var(--red-600);
  box-shadow: 0 4px 8px rgba(239, 68, 68, 0.4);
  transform: translateY(-1px);
}

/* Responsive Design */
@media (max-width: 1024px) {
  .vitals-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }
  
  .vital-card {
    padding: 18px;
  }
}

@media (max-width: 768px) {
  .list-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .list-header h3 {
    font-size: 1.3rem;
  }
  
  .vitals-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .vital-card {
    padding: 16px;
  }
  
  .vital-value {
    padding: 12px;
  }
  
  .value {
    font-size: 1.75rem;
  }
}

@media (max-width: 480px) {
  .vitals-list {
    margin-bottom: 24px;
  }
  
  .list-header {
    margin-bottom: 16px;
    padding-bottom: 12px;
  }
  
  .list-header h3 {
    font-size: 1.2rem;
  }
  
  .vital-card {
    padding: 16px;
  }
  
  .vital-header h4 {
    font-size: 1rem;
  }
  
  .date-badge {
    font-size: 0.75rem;
    padding: 3px 8px;
  }
  
  .value {
    font-size: 1.5rem;
  }
  
  .vital-details p {
    font-size: 0.85rem;
  }
  
  .vital-actions {
    flex-direction: column;
  }
  
  .btn-xs {
    width: 100%;
  }
}

/* Touch device improvements */
@media (hover: none) and (pointer: coarse) {
  .vital-card:hover {
    transform: none;
  }
  
  .btn:hover {
    transform: none !important;
  }
}
</style>