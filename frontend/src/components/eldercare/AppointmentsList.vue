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
  const date = new Date(dateString)
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

.appointments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1rem;
}

.appointment-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s;
}

.appointment-card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.appt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.appt-header h4 {
  margin: 0;
  color: #1f2937;
  font-weight: 600;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge.scheduled {
  background: #dbeafe;
  color: #1d4ed8;
}

.status-badge.completed {
  background: #dcfce7;
  color: #166534;
}

.status-badge.cancelled {
  background: #fee2e2;
  color: #dc2626;
}

.status-badge.rescheduled {
  background: #fef3c7;
  color: #d97706;
}

.appt-details {
  margin-bottom: 1rem;
}

.appt-details p {
  margin: 0.25rem 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.appt-actions {
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