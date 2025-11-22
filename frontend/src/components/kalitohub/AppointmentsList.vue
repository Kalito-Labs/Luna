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
  border-bottom: 1px solid rgba(139, 92, 246, 0.2);
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
  background: linear-gradient(135deg, rgba(139, 92, 246, 1) 0%, rgba(196, 181, 253, 1) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
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
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 16px;
  padding: 24px;
  position: relative;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.appointment-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, rgba(139, 92, 246, 0.8) 0%, rgba(196, 181, 253, 0.8) 100%);
  border-radius: 16px 16px 0 0;
}

.appointment-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(139, 92, 246, 0.3);
  border-color: rgba(139, 92, 246, 0.5);
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
  border-bottom: 1px solid rgba(139, 92, 246, 0.2);
}

.appt-header h4 {
  margin: 0;
  color: rgba(255, 255, 255, 0.95);
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
  background: rgba(139, 92, 246, 0.2);
  color: rgba(196, 181, 253, 1);
  border: 1px solid rgba(139, 92, 246, 0.4);
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.2);
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
  color: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
}

.appt-details strong {
  color: rgba(255, 255, 255, 0.9);
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
  border-top: 1px solid rgba(139, 92, 246, 0.2);
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
  color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 16px;
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
  border-radius: 12px;
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
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.8) 0%, rgba(124, 58, 237, 0.9) 100%);
  color: white;
  border: 1px solid rgba(139, 92, 246, 0.5);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(139, 92, 246, 1) 0%, rgba(124, 58, 237, 1) 100%);
  border-color: rgba(139, 92, 246, 0.8);
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.5);
  transform: translateY(-2px);
}

.btn-outline {
  background: rgba(255, 255, 255, 0.06);
  color: rgba(129, 140, 248, 1);
  border: 1px solid rgba(129, 140, 248, 0.4);
  box-shadow: 0 2px 8px rgba(129, 140, 248, 0.1);
}

.btn-outline:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(129, 140, 248, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%);
  border-color: rgba(129, 140, 248, 0.6);
  color: rgba(255, 255, 255, 1);
  box-shadow: 0 4px 20px rgba(129, 140, 248, 0.3);
  transform: translateY(-2px);
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
  box-shadow: 0 8px 24px rgba(239, 68, 68, 0.5);
  transform: translateY(-2px);
}

/* Touch device improvements */
@media (hover: none) and (pointer: coarse) {
  .btn:hover {
    transform: none !important;
  }
}
</style>