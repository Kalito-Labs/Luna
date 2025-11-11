<template>
  <div class="appointments-list">
    <div class="list-header">
      <h3>Appointments</h3>
      <button @click="$emit('add-appointment')" class="btn btn-sm btn-primary">
        Schedule Appointment
      </button>
    </div>
    
    <div v-if="appointments.length === 0" class="empty-state">
      <p>No appointments scheduled yet</p>
    </div>
    
    <div v-else class="appointments-grid">
      <div v-for="appointment in appointments" :key="appointment.id" class="appointment-card">
        <div class="appt-header">
          <h4>{{ formatAppointmentType(appointment.appointment_type) }}</h4>
          <span class="status-badge" :class="appointment.status">
            {{ formatStatus(appointment.status) }}
          </span>
        </div>
        
        <div class="appt-details">
          <p><strong>Date:</strong> {{ formatDate(appointment.appointment_date) }}</p>
          <p v-if="appointment.appointment_time">
            <strong>Time:</strong> {{ formatTime(appointment.appointment_time) }}
          </p>
          <p v-if="appointment.provider_name">
            <strong>Provider:</strong> {{ appointment.provider_name }}
          </p>
          <p v-if="appointment.location">
            <strong>Location:</strong> {{ appointment.location }}
          </p>
          <p v-if="appointment.notes">
            <strong>Notes:</strong> {{ appointment.notes }}
          </p>
        </div>
        
        <div class="appt-actions">
          <button @click="$emit('edit-appointment', appointment)" class="btn btn-xs btn-outline">
            Edit
          </button>
          <button @click="$emit('delete-appointment', appointment)" class="btn btn-xs btn-danger">
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Appointment {
  id: string
  appointment_date: string
  appointment_time?: string
  appointment_type?: string
  provider_name?: string
  location?: string
  notes?: string
  status: string
}

interface Props {
  appointments: Appointment[]
}

defineProps<Props>()

defineEmits<{
  'add-appointment': []
  'edit-appointment': [appointment: Appointment]
  'delete-appointment': [appointment: Appointment]
}>()

function formatAppointmentType(type?: string): string {
  if (!type) return 'Appointment'
  const types: Record<string, string> = {
    'routine': 'Routine Check-up',
    'follow_up': 'Follow-up',
    'specialist': 'Specialist',
    'emergency': 'Emergency',
    'procedure': 'Procedure',
    'lab_work': 'Lab Work',
    'imaging': 'Imaging'
  }
  return types[type] || type
}

function formatStatus(status: string): string {
  const statuses: Record<string, string> = {
    'scheduled': 'Scheduled',
    'completed': 'Completed',
    'cancelled': 'Cancelled',
    'rescheduled': 'Rescheduled'
  }
  return statuses[status] || status
}

function formatDate(dateString: string): string {
  if (!dateString) return ''
  // Parse date string directly to avoid timezone issues
  // dateString format: 'YYYY-MM-DD'
  const parts = dateString.split('-')
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return dateString
  const year = parseInt(parts[0])
  const month = parseInt(parts[1])
  const day = parseInt(parts[2])
  const date = new Date(year, month - 1, day) // month is 0-indexed
  return date.toLocaleDateString()
}

function formatTime(timeString: string): string {
  if (!timeString) return ''
  const [hours, minutes] = timeString.split(':')
  if (!hours || !minutes) return timeString
  const date = new Date()
  date.setHours(parseInt(hours), parseInt(minutes))
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.appointments-list {
  margin-bottom: 40px;
}

/* Responsive */
@media (max-width: 768px) {
  .appointments-list {
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

/* Responsive header */
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

/* Responsive header title */
@media (max-width: 480px) {
  .list-header h3 {
    font-size: 1.25rem;
  }
}

.appointments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
}

/* Responsive grid */
@media (max-width: 1200px) {
  .appointments-grid {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .appointments-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }
}

@media (max-width: 480px) {
  .appointments-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

.appointment-card {
  background: var(--bg-glass);
  backdrop-filter: var(--blur);
  border: var(--border);
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-soft);
  transition: all 0.2s ease;
}

.appointment-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-strong);
  border-color: var(--accent-blue);
}

/* Responsive cards */
@media (max-width: 768px) {
  .appointment-card {
    padding: 20px;
  }
}

@media (max-width: 480px) {
  .appointment-card {
    padding: 16px;
  }
}

/* Touch devices */
@media (hover: none) and (pointer: coarse) {
  .appointment-card:hover {
    transform: none;
    box-shadow: var(--shadow-soft);
  }
}

.appt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: var(--border);
}

.appt-header h4 {
  margin: 0;
  color: var(--text-heading);
  font-weight: 600;
  font-size: 1.1rem;
}

/* Responsive header */
@media (max-width: 480px) {
  .appt-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .appt-header h4 {
    font-size: 1rem;
  }
}

.status-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.status-badge.scheduled {
  background: rgba(59, 130, 246, 0.15);
  color: var(--accent-blue);
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
}

.status-badge.completed {
  background: rgba(16, 185, 129, 0.15);
  color: var(--led-green);
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
}

.status-badge.cancelled {
  background: rgba(239, 68, 68, 0.15);
  color: var(--led-red);
  box-shadow: 0 2px 4px rgba(239, 68, 68, 0.2);
}

.status-badge.rescheduled {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
  box-shadow: 0 2px 4px rgba(245, 158, 11, 0.2);
}

.appt-details {
  margin-bottom: 16px;
}

.appt-details p {
  margin: 8px 0;
  font-size: 0.95rem;
  color: var(--text-muted);
  display: flex;
  align-items: center;
}

.appt-details strong {
  color: var(--text-heading);
  margin-right: 8px;
  min-width: 80px;
}

/* Responsive details */
@media (max-width: 480px) {
  .appt-details p {
    font-size: 0.9rem;
  }
  
  .appt-details strong {
    min-width: 70px;
  }
}

.appt-actions {
  display: flex;
  gap: 12px;
  padding-top: 12px;
  border-top: var(--border);
}

/* Responsive actions */
@media (max-width: 480px) {
  .appt-actions {
    flex-direction: column;
    gap: 8px;
  }
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
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

/* Responsive empty state */
@media (max-width: 480px) {
  .empty-state {
    padding: 40px 16px;
  }
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
  padding: 6px 12px;
  font-size: 0.75rem;
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

/* Touch device improvements */
@media (hover: none) and (pointer: coarse) {
  .btn:hover {
    transform: none !important;
  }
}
</style>