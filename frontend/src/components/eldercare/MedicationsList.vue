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
  border-bottom: var(--border);
}

.list-header h3 {
  margin: 0;
  color: var(--text-heading);
  font-size: 1.5rem;
  font-weight: 600;
}

.medications-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.medication-card {
  background: var(--bg-glass);
  backdrop-filter: var(--blur);
  border: var(--border);
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-soft);
  transition: all 0.2s ease;
}

.medication-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  border-color: var(--accent-blue);
}

.med-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: var(--border);
}

.med-header h4 {
  margin: 0;
  color: var(--text-heading);
  font-weight: 600;
  font-size: 1.1rem;
}

.dosage-badge {
  background: rgba(59, 130, 246, 0.15);
  color: var(--accent-blue);
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid rgba(59, 130, 246, 0.3);
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
}

.med-details {
  margin-bottom: 16px;
}

.med-details p {
  margin: 8px 0;
  font-size: 0.9rem;
  color: var(--text-muted);
  display: flex;
  align-items: center;
}

.med-details strong {
  color: var(--text-heading);
  margin-right: 8px;
  min-width: 120px;
}

.med-actions {
  display: flex;
  gap: 12px;
  padding-top: 16px;
  border-top: var(--border);
  flex-wrap: wrap;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-muted);
}

.empty-state p {
  margin: 0;
  font-size: 1.1rem;
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
  font-size: 0.875rem;
  white-space: nowrap;
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
  padding: 10px 16px;
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
  background: #dc2626;
  box-shadow: 0 4px 8px rgba(239, 68, 68, 0.4);
  transform: translateY(-1px);
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