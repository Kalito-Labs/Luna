<template>
  <div class="vitals-list">
    <div class="list-header">
      <h3>Vital Signs</h3>
      <button @click="$emit('add-vital')" class="btn btn-sm btn-primary">
        Add Vital Record
      </button>
    </div>
    
    <!-- Patient Filter Buttons -->
    <div class="patient-filters">
      <button 
        @click="selectedPatientId = null" 
        :class="['filter-btn', { active: selectedPatientId === null }]"
      >
        All Records
        <span class="count-badge">{{ vitals.length }}</span>
      </button>
      <button 
        v-for="patient in patients" 
        :key="patient.id"
        @click="selectedPatientId = patient.id" 
        :class="['filter-btn', { active: selectedPatientId === patient.id }]"
      >
        {{ patient.name }}'s Vitals
        <span class="count-badge">{{ getPatientVitalsCount(patient.id) }}</span>
      </button>
    </div>
    
    <div v-if="filteredVitals.length === 0" class="empty-state">
      <p>{{ selectedPatientId ? 'No vitals recorded for this patient' : 'No vitals recorded yet' }}</p>
    </div>
    
    <div v-else class="vitals-grid">
      <div v-for="vital in filteredVitals" :key="vital.id" class="vital-card">
        <div class="vital-header">
          <div class="vital-title">
            <h4>{{ formatDate(vital.recorded_date) }}</h4>
            <span class="patient-badge">{{ vital.patient_name }}</span>
          </div>
        </div>
        
        <div class="vital-details">
          <div class="vital-metrics">
            <div v-if="vital.weight_kg" class="metric-item">
              <div class="metric-icon">⚖️</div>
              <div class="metric-content">
                <span class="metric-label">Weight</span>
                <span class="metric-value">{{ vital.weight_kg }} kg</span>
              </div>
            </div>
            
            <div v-if="vital.glucose_am" class="metric-item">
              <div class="metric-icon">🌅</div>
              <div class="metric-content">
                <span class="metric-label">Glucose AM</span>
                <span class="metric-value" :class="getGlucoseClass(vital.glucose_am)">
                  {{ vital.glucose_am }} mg/dL
                </span>
              </div>
            </div>
            
            <div v-if="vital.glucose_pm" class="metric-item">
              <div class="metric-icon">🌙</div>
              <div class="metric-content">
                <span class="metric-label">Glucose PM</span>
                <span class="metric-value" :class="getGlucoseClass(vital.glucose_pm)">
                  {{ vital.glucose_pm }} mg/dL
                </span>
              </div>
            </div>
          </div>
          
          <p v-if="vital.notes" class="vital-notes">
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
import { ref, computed } from 'vue'

interface Vital {
  id: string
  patient_id: string
  patient_name: string
  weight_kg?: number | null
  glucose_am?: number | null
  glucose_pm?: number | null
  recorded_date: string
  notes?: string
}

interface Patient {
  id: string
  name: string
}

interface Props {
  vitals: Vital[]
  patients: Patient[]
}

const props = defineProps<Props>()

defineEmits<{
  'add-vital': []
  'edit-vital': [vital: Vital]
  'delete-vital': [vital: Vital]
}>()

const selectedPatientId = ref<string | null>(null)

const filteredVitals = computed(() => {
  if (selectedPatientId.value === null) {
    return props.vitals
  }
  return props.vitals.filter(vital => vital.patient_id === selectedPatientId.value)
})

function getPatientVitalsCount(patientId: string): number {
  return props.vitals.filter(vital => vital.patient_id === patientId).length
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  })
}

function getGlucoseClass(value: number): string {
  // Normal fasting glucose: 70-100 mg/dL
  // Prediabetes: 100-125 mg/dL
  // Diabetes: 126+ mg/dL
  if (value < 70) return 'glucose-low'
  if (value <= 100) return 'glucose-normal'
  if (value <= 125) return 'glucose-elevated'
  return 'glucose-high'
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

/* Patient Filter Buttons */
.patient-filters {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 12px 20px;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-glass);
  backdrop-filter: var(--blur);
  color: var(--text-main);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
}

.filter-btn:hover {
  border-color: var(--accent-blue);
  background: var(--bg-panel);
  transform: translateY(-1px);
}

.filter-btn.active {
  background: var(--accent-blue);
  color: white;
  border-color: var(--accent-blue);
  box-shadow: var(--glow-blue);
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
  background: rgba(255, 255, 255, 0.25);
}

.filter-btn:not(.active) .count-badge {
  background: rgba(59, 130, 246, 0.15);
  color: var(--accent-blue);
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

.vitals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
}

.vital-card {
  background: var(--bg-glass);
  backdrop-filter: var(--blur);
  border: var(--border);
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-soft);
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.vital-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  border-color: var(--accent-blue);
}

.vital-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 12px;
  border-bottom: var(--border);
}

.vital-title h4 {
  margin: 0 0 8px 0;
  color: var(--text-heading);
  font-size: 1.1rem;
  font-weight: 600;
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

.vital-details {
  flex: 1;
}

.vital-metrics {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.metric-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--bg-main);
  border-radius: 8px;
  border: var(--border);
  transition: all 0.2s ease;
}

.metric-item:hover {
  background: var(--bg-panel);
  transform: translateX(2px);
}

.metric-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.metric-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.metric-label {
  font-size: 0.85rem;
  color: var(--text-muted);
  font-weight: 500;
}

.metric-value {
  font-size: 1.1rem;
  color: var(--text-heading);
  font-weight: 600;
}

.glucose-low {
  color: var(--led-red);
}

.glucose-normal {
  color: #10b981;
}

.glucose-elevated {
  color: #f59e0b;
}

.glucose-high {
  color: var(--led-red);
}

.vital-notes {
  margin-top: 12px;
  padding: 12px;
  background: rgba(245, 158, 11, 0.1);
  border-left: 3px solid #f59e0b;
  border-radius: 4px;
  font-size: 0.9rem;
  color: var(--text-muted);
  line-height: 1.4;
}

.vital-notes strong {
  color: var(--text-heading);
}

.vital-actions {
  display: flex;
  gap: 12px;
  padding-top: 16px;
  border-top: var(--border);
  flex-wrap: wrap;
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
  background: #dc2626;
  box-shadow: 0 4px 8px rgba(239, 68, 68, 0.4);
  transform: translateY(-1px);
}

/* Responsive Design */
@media (max-width: 1200px) {
  .vitals-grid {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 20px;
  }
}

@media (max-width: 1024px) {
  .vitals-grid {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
  }
  
  .vital-card {
    padding: 20px;
  }
}

@media (max-width: 768px) {
  .vitals-grid {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 16px;
  }
  
  .vital-card {
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
  
  .vital-actions {
    gap: 8px;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .vitals-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .vital-card {
    padding: 16px;
  }
  
  .patient-filters {
    flex-direction: column;
    gap: 8px;
  }
  
  .filter-btn {
    width: 100%;
  }
  
  .vital-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .vital-actions {
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
  .vital-card:hover {
    transform: none;
    box-shadow: var(--shadow-soft);
  }
  
  .metric-item:hover {
    transform: none;
    background: var(--bg-main);
  }
  
  .btn:hover {
    transform: none !important;
  }
}
</style>
