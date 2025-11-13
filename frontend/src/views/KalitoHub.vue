<template>
  <div class="kalito-hub">
    <div class="dashboard-header">
      <HamburgerMenu />
      <h1>Kalito Hub</h1>
    </div>
    
    <!-- Quick Actions - Main Dashboard -->
    <div class="quick-actions">
      <h2>Dashboard</h2>
      <div class="action-grid">
        <!-- My Profile -->
        <button @click="openMyProfile" class="action-btn patients-btn">
          <div class="btn-icon">�</div>
          <div class="btn-content">
            <h3>My Profile</h3>
            <p>Personal information & health records</p>
          </div>
        </button>
        
        <!-- Medications -->
        <button @click="activeView = 'medications'" class="action-btn medications-btn" :class="{ active: activeView === 'medications' }">
          <div class="btn-icon">�</div>
          <div class="btn-content">
            <h3>Medications</h3>
            <p>Track medications & dosages</p>
          </div>
        </button>
        
        <!-- Appointments -->
        <button @click="activeView = 'appointments'" class="action-btn appointments-btn" :class="{ active: activeView === 'appointments' }">
          <div class="btn-icon">📅</div>
          <div class="btn-content">
            <h3>Appointments</h3>
            <p>Doctor visits & checkups</p>
          </div>
        </button>
      </div>
    </div>

    <!-- Content Sections -->

    <!-- Medications Overview -->
    <div v-if="activeView === 'medications'" class="content-section">
      <MedicationsList 
        :medications="allMedications"
        :patients="patients"
        @add-medication="showMedicationForm = true"
        @edit-medication="editMedication"
        @delete-medication="deleteMedication"
      />
    </div>

    <!-- Appointments Overview -->
    <div v-if="activeView === 'appointments'" class="content-section">
      <AppointmentsList 
        :appointments="allAppointments"
        @add-appointment="showAppointmentForm = true"
        @edit-appointment="editAppointment"
        @delete-appointment="deleteAppointment"
      />
    </div>

    <!-- Modals -->
    <!-- Medication Form Modal -->
    <div v-if="showMedicationForm" class="modal-overlay">
      <MedicationForm 
        :medication="editingMedication"
        :is-editing="!!editingMedication"
        :patients="patients"
        @save="saveMedication"
        @cancel="closeMedicationForm"
        @click.stop
      />
    </div>
    
    <!-- Appointment Form Modal -->
    <div v-if="showAppointmentForm" class="modal-overlay">
      <AppointmentForm 
        :patients="patients"
        :appointment="editingAppointment"
        :isEditing="!!editingAppointment"
        @save="saveAppointment"
        @cancel="closeAppointmentForm"
        @click.stop
      />
    </div>

    <!-- Patient Detail Modal -->
    <div v-if="showPatientDetail" class="modal-overlay">
  <PatientDetailModal 
    v-if="selectedPatient"
    :patient="selectedPatient"
    :medications="patientMedications"
    @close="closePatientDetail"
    @save-patient="savePatient"
    @add-medication="() => { showPatientDetail = false; showMedicationForm = true }"
    @edit-medication="editMedication"
    @delete-medication="deleteMedication"
    @click.stop
  />
    </div>

    <!-- Success/Error Messages -->
    <div v-if="message" class="message" :class="messageType">
      {{ message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { apiUrl } from '../config/api'
import HamburgerMenu from '../components/HamburgerMenu.vue'
import MedicationForm from '../components/kalitohub/MedicationForm.vue'
import AppointmentForm from '../components/kalitohub/AppointmentForm.vue'
import PatientDetailModal from '../components/kalitohub/PatientDetailModal.vue'
import MedicationsList from '../components/kalitohub/MedicationsList.vue'
import AppointmentsList from '../components/kalitohub/AppointmentsList.vue'

interface Patient {
  id: string
  name: string
  date_of_birth?: string
  relationship?: string
  phone?: string
  primary_doctor?: string
}

const patients = ref<Patient[]>([])

const showMedicationForm = ref(false)
const showAppointmentForm = ref(false)
const showPatientDetail = ref(false)

const activeView = ref<'patients' | 'medications' | 'appointments'>('medications')

const editingMedication = ref<any | null>(null)
const editingAppointment = ref<any | null>(null)
const selectedPatient = ref<Patient | null>(null)
const patientMedications = ref<any[]>([])
const patientAppointments = ref<any[]>([])

// Global data for all tabs
const allMedications = ref<any[]>([])
const allAppointments = ref<any[]>([])

const message = ref('')
const messageType = ref<'success' | 'error'>('success')

onMounted(async () => {
  await loadPatients()
  await loadAllMedications()
  await loadAllAppointments()
})

async function loadPatients() {
  try {
    const response = await fetch(apiUrl('/api/patients'))
    if (response.ok) {
      const result = await response.json()
      patients.value = result.data || []
      console.log('Loaded patients:', patients.value)
    }
  } catch (error) {
    console.error('Failed to load patients:', error)
  }
}

async function loadAllMedications() {
  try {
    const response = await fetch(apiUrl('/api/medications'))
    if (response.ok) {
      const result = await response.json()
      allMedications.value = result.data || []
    }
  } catch (error) {
    console.error('Failed to load medications:', error)
  }
}

async function loadAllAppointments() {
  try {
    const response = await fetch(apiUrl('/api/appointments'))
    if (response.ok) {
      const result = await response.json()
      allAppointments.value = result.data || []
    }
  } catch (error) {
    console.error('Failed to load appointments:', error)
  }
}

async function viewPatientDetails(patient: Patient) {
  // Reset data arrays first to prevent stale data
  patientMedications.value = []
  patientAppointments.value = []
  
  // Load patient data BEFORE showing modal
  await loadPatientData(patient.id)
  
  // Now set the patient and show modal
  selectedPatient.value = patient
  showPatientDetail.value = true
}

async function openMyProfile() {
  // Load or create a default patient for single-user mode
  if (patients.value.length === 0) {
    // If no patients exist, create a default patient
    const defaultPatient: Patient = {
      id: '1',
      name: 'My Profile',
      date_of_birth: '',
      relationship: 'Self',
      phone: '',
      primary_doctor: ''
    }
    patients.value = [defaultPatient]
    selectedPatient.value = defaultPatient
  } else {
    // Use the first patient as the profile (single-user approach)
    const firstPatient = patients.value[0]
    if (firstPatient) {
      selectedPatient.value = firstPatient
      // Load their data
      await loadPatientData(firstPatient.id)
    }
  }
  
  // Show the patient detail modal
  showPatientDetail.value = true
}

async function loadPatientData(patientId: string) {
  try {
    // Load patient's medications and appointments
    const [medicationsRes, appointmentsRes] = await Promise.all([
      fetch(apiUrl(`/api/medications?patient_id=${patientId}`)),
      fetch(apiUrl(`/api/appointments?patient_id=${patientId}`))
    ])

    if (medicationsRes.ok) {
      const data = await medicationsRes.json()
      patientMedications.value = data.data || []
    } else {
      patientMedications.value = []
    }
    
    if (appointmentsRes.ok) {
      const data = await appointmentsRes.json()
      patientAppointments.value = data.data || []
    } else {
      patientAppointments.value = []
    }
  } catch (error) {
    console.error('Failed to load patient data:', error)
    // Set empty arrays as fallback
    patientMedications.value = []
    patientAppointments.value = []
  }
}

async function savePatient(patientData: any) {
  try {
    // Determine if we're editing based on whether the patient has an id
    const isEditing = patientData.id && patientData.id !== ''
    const url = isEditing ? apiUrl(`/api/patients/${patientData.id}`) : apiUrl('/api/patients')
    const method = isEditing ? 'PUT' : 'POST'
    
    // Only send fields that the API accepts (strip out id, created_at, updated_at, etc.)
    const allowedFields = {
      name: patientData.name,
      date_of_birth: patientData.date_of_birth,
      relationship: patientData.relationship,
      gender: patientData.gender,
      phone: patientData.phone,
      city: patientData.city,
      state: patientData.state,
      occupation: patientData.occupation,
      occupation_description: patientData.occupation_description,
      languages: patientData.languages,
      emergency_contact_name: patientData.emergency_contact_name,
      emergency_contact_phone: patientData.emergency_contact_phone,
      primary_doctor_id: patientData.primary_doctor_id,
      insurance_provider: patientData.insurance_provider,
      insurance_id: patientData.insurance_id,
      notes: patientData.notes,
      active: patientData.active
    }
    
    console.log('Sending patient data:', JSON.stringify(allowedFields, null, 2))
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(allowedFields)
    })
    
    if (response.ok) {
      await loadPatients()
      
      // Update the selectedPatient if we're editing the current patient
      if (isEditing && selectedPatient.value?.id === patientData.id) {
        // Find the updated patient from the refreshed list
        const updatedPatient = patients.value.find(p => p.id === patientData.id)
        if (updatedPatient) {
          selectedPatient.value = updatedPatient
        }
      }
      
      showMessage(
        isEditing ? 'Profile updated successfully!' : 'Patient added successfully!',
        'success'
      )
    } else {
      const errorData = await response.json()
      console.error('Server error response:', JSON.stringify(errorData, null, 2))
      showMessage(errorData.message || 'Failed to save patient. Please check console for details.', 'error')
      throw new Error(errorData.message || 'Failed to save patient')
    }
  } catch (error) {
    console.error('Error saving patient:', error)
    if (!(error instanceof Error && error.message.includes('Failed to save patient'))) {
      showMessage('Failed to save patient. Please try again.', 'error')
    }
  }
}

async function saveMedication(medicationData: any) {
  try {
    const url = editingMedication.value ? `/api/medications/${editingMedication.value.id}` : '/api/medications'
    const method = editingMedication.value ? 'PUT' : 'POST'
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(medicationData)
    })
    
    if (response.ok) {
      closeMedicationForm()
      showMessage(
        editingMedication.value ? 'Medication updated successfully!' : 'Medication added successfully!',
        'success'
      )
      // Reload patient data if we're viewing a patient detail
      if (selectedPatient.value) {
        await loadPatientData(selectedPatient.value.id)
      }
    } else {
      throw new Error('Failed to save medication')
    }
  } catch (error) {
    console.error('Error saving medication:', error)
    showMessage('Failed to save medication. Please try again.', 'error')
  }
}

async function saveAppointment(appointmentData: any) {
  try {
    const url = editingAppointment.value 
      ? `/api/appointments/${editingAppointment.value.id}` 
      : '/api/appointments'
    const method = editingAppointment.value ? 'PUT' : 'POST'
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(appointmentData)
    })
    
    if (response.ok) {
      await loadAllAppointments()
      if (selectedPatient.value) {
        await loadPatientData(selectedPatient.value.id)
      }
      closeAppointmentForm()
      showMessage(
        editingAppointment.value 
          ? 'Appointment updated successfully!' 
          : 'Appointment scheduled successfully!', 
        'success'
      )
    } else {
      throw new Error('Failed to save appointment')
    }
  } catch (error) {
    console.error('Error saving appointment:', error)
    showMessage('Failed to save appointment. Please try again.', 'error')
  }
}

function editMedication(medication: any) {
  editingMedication.value = medication
  showMedicationForm.value = true
}

function closeMedicationForm() {
  showMedicationForm.value = false
  editingMedication.value = null
}

async function deleteMedication(medication: any) {
  if (!confirm(`Are you sure you want to delete ${medication.name}?`)) {
    return
  }
  
  try {
    const response = await fetch(apiUrl(`/api/medications/${medication.id}`), {
      method: 'DELETE'
    })
    
    if (response.ok) {
      showMessage('Medication deleted successfully!', 'success')
      
      // Reload appropriate data based on context
      if (selectedPatient.value) {
        // If viewing patient detail, reload patient data
        await loadPatientData(selectedPatient.value.id)
      } else if (activeView.value === 'medications') {
        // If viewing medications tab, reload all medications
        await loadAllMedications()
      }
    } else {
      throw new Error('Failed to delete medication')
    }
  } catch (error) {
    console.error('Error deleting medication:', error)
    showMessage('Failed to delete medication. Please try again.', 'error')
  }
}

function closeAppointmentForm() {
  showAppointmentForm.value = false
  editingAppointment.value = null
}

function editAppointment(appointment: any) {
  editingAppointment.value = appointment
  showAppointmentForm.value = true
}

async function deleteAppointment(appointment: any) {
  if (!confirm('Are you sure you want to delete this appointment?')) {
    return
  }
  
  try {
    const response = await fetch(apiUrl(`/api/appointments/${appointment.id}`), {
      method: 'DELETE'
    })
    
    if (response.ok) {
      showMessage('Appointment deleted successfully!', 'success')
      
      // Reload appropriate data based on context
      if (selectedPatient.value) {
        // If viewing patient detail, reload patient data
        await loadPatientData(selectedPatient.value.id)
      } else if (activeView.value === 'appointments') {
        // If viewing appointments tab, reload all appointments
        await loadAllAppointments()
      }
    } else {
      throw new Error('Failed to delete appointment')
    }
  } catch (error) {
    console.error('Error deleting appointment:', error)
    showMessage('Failed to delete appointment. Please try again.', 'error')
  }
}

function closePatientDetail() {
  showPatientDetail.value = false
  selectedPatient.value = null
  patientMedications.value = []
  patientAppointments.value = []
}

function showMessage(text: string, type: 'success' | 'error') {
  message.value = text
  messageType.value = type
  
  setTimeout(() => {
    message.value = ''
  }, 5000)
}
</script>

<style scoped>
/* ================================================================ */
/* BASE LAYOUT - Desktop First, Fluid Responsive                   */
/* ================================================================ */

.kalito-hub {
  max-width: 1600px;
  width: 100%;
  margin: 0 auto;
  padding: 32px;
  min-height: 100vh;
  max-height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  background: var(--bg-main);
  color: var(--text-main);
  box-sizing: border-box;
}

/* Tablet: 769px - 1024px */
@media (max-width: 1024px) {
  .kalito-hub {
    padding: 24px;
  }

  .hamburger-fixed {
    top: 24px;
    left: 24px;
  }
}

/* Mobile: <= 768px */
@media (max-width: 768px) {
  .kalito-hub {
    padding: 16px;
  }

  .hamburger-fixed {
    top: 20px;
    left: 20px;
  }
}

/* ================================================================ */
/* DASHBOARD HEADER                                                 */
/* ================================================================ */

.dashboard-header {
  position: relative;
  text-align: center;
  margin-bottom: 48px;
  padding-bottom: 1.5rem;
  border-bottom: var(--border);
}

.dashboard-header :deep(.hamburger-menu) {
  position: absolute;
  top: 0;
  left: 0;
}

.dashboard-header h1 {
  color: var(--text-heading);
  margin: 0 0 12px 0;
  font-size: 2.5rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}


/* Tablet: 769px - 1024px */
@media (max-width: 1024px) {
  .dashboard-header {
    margin-bottom: 36px;
    padding-bottom: 1.25rem;
  }
  
  .dashboard-header h1 {
    font-size: 2.1rem;
  }
  
}

/* Mobile: <= 768px */
@media (max-width: 768px) {
  .dashboard-header {
    margin-bottom: 28px;
    padding-bottom: 1rem;
  }
  
  .dashboard-header h1 {
    font-size: 1.75rem;
    margin-bottom: 8px;
  }
  
}

/* ================================================================ */
/* QUICK ACTIONS SECTION                                            */
/* ================================================================ */

.quick-actions {
  margin-bottom: 48px;
}

.quick-actions h2 {
  color: var(--text-heading);
  margin: 0 0 24px 0;
  font-size: 1.75rem;
  font-weight: 600;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

/* Tablet: 769px - 1024px */
@media (max-width: 1024px) {
  .quick-actions {
    margin-bottom: 36px;
  }
  
  .quick-actions h2 {
    font-size: 1.5rem;
    margin-bottom: 20px;
  }
  
  .action-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
}

/* Mobile: <= 768px */
@media (max-width: 768px) {
  .quick-actions {
    margin-bottom: 28px;
  }
  
  .quick-actions h2 {
    font-size: 1.3rem;
    margin-bottom: 16px;
  }
  
  .action-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

/* ================================================================ */
/* ACTION BUTTONS                                                   */
/* ================================================================ */

.action-btn {
  display: flex;
  align-items: center;
  padding: 24px;
  border: var(--border);
  border-radius: 12px;
  background: var(--bg-glass);
  backdrop-filter: var(--blur);
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  min-height: 120px;
  width: 100%;
  box-sizing: border-box;
}

/* Tablet: 769px - 1024px */
@media (max-width: 1024px) {
  .action-btn {
    padding: 20px;
    min-height: 100px;
  }
}

/* Mobile: <= 768px */
@media (max-width: 768px) {
  .action-btn {
    padding: 16px;
    min-height: 85px;
    border-radius: 10px;
  }
}

/* Action button states */
.action-btn:hover:not(:disabled) {
  border-color: var(--accent-blue);
  transform: translateY(-2px);
  box-shadow: var(--shadow-soft);
}

.action-btn.active {
  background: linear-gradient(145deg, 
    rgba(59, 130, 246, 0.15), 
    rgba(59, 130, 246, 0.08));
  border-color: var(--accent-blue);
  box-shadow: 
    0 0 0 2px rgba(59, 130, 246, 0.2) inset,
    0 4px 12px rgba(59, 130, 246, 0.15);
}

.action-btn.active .btn-content h3 {
  color: white;
}

.action-btn.active .btn-content p {
  color: rgba(255, 255, 255, 0.8);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ================================================================ */
/* BUTTON ICON & CONTENT                                            */
/* ================================================================ */

.btn-icon {
  font-size: 2.5rem;
  margin-right: 18px;
  flex-shrink: 0;
}

.btn-content {
  flex: 1;
  min-width: 0;
}

.btn-content h3 {
  margin: 0 0 6px 0;
  color: var(--text-heading);
  font-size: 1.15rem;
  font-weight: 600;
  line-height: 1.3;
}

.btn-content p {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.95rem;
  line-height: 1.4;
}

/* Tablet: 769px - 1024px */
@media (max-width: 1024px) {
  .btn-icon {
    font-size: 2.2rem;
    margin-right: 14px;
  }
  
  .btn-content h3 {
    font-size: 1.05rem;
  }
  
  .btn-content p {
    font-size: 0.9rem;
  }
}

/* Mobile: <= 768px */
@media (max-width: 768px) {
  .btn-icon {
    font-size: 1.9rem;
    margin-right: 12px;
  }
  
  .btn-content h3 {
    font-size: 0.95rem;
    margin-bottom: 4px;
  }
  
  .btn-content p {
    font-size: 0.85rem;
  }
}

/* ================================================================ */
/* CONTENT SECTIONS                                                 */
/* ================================================================ */

.content-section {
  margin-bottom: 40px;
  overflow-x: auto;
  overflow-y: auto;
  max-height: calc(100vh - 300px); /* Allow scrolling with enough space for header */
  -webkit-overflow-scrolling: touch;
}

/* Tablet: 769px - 1024px */
@media (max-width: 1024px) {
  .content-section {
    margin-bottom: 32px;
  }
}

/* Mobile: <= 768px */
@media (max-width: 768px) {
  .content-section {
    margin-bottom: 24px;
  }
}

/* ================================================================ */
/* PATIENTS OVERVIEW SECTION                                        */
/* ================================================================ */

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-muted);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 16px;
}

.empty-state h3 {
  color: var(--text-heading);
  margin: 0 0 8px 0;
}

.empty-state p {
  margin: 0 0 24px 0;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(10, 12, 16, 0.72);
  backdrop-filter: blur(6px) saturate(115%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

/* Tablet: 769px - 1024px */
@media (max-width: 1024px) {
  .modal-overlay {
    padding: 16px;
  }
}

/* Mobile: <= 768px */
@media (max-width: 768px) {
  .modal-overlay {
  padding: 0;
    align-items: stretch;
  }
}

.modal-content {
  background: var(--bg-main);
  border: var(--border);
  border-radius: 12px;
  width: 70vw;
  max-width: 95vw;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: var(--shadow-strong);
}

/* Tablet: 769px - 1024px */
@media (max-width: 1024px) {
  .modal-content {
    width: 85vw;
  }
}

/* Mobile: <= 768px */
@media (max-width: 768px) {
  .modal-content {
    width: 100vw;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
    margin: 0;
  }
}

.message {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 12px 20px;
  border-radius: 6px;
  font-weight: 500;
  z-index: 1001;
}

.message.success {
  background: var(--led-green);
  color: white;
}

.message.error {
  background: var(--led-red);
  color: white;
}

.btn {
  padding: 10px 18px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.btn-sm {
  padding: 8px 14px;
  font-size: 0.8rem;
}

.btn-lg {
  padding: 14px 28px;
  font-size: 1rem;
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

/* Custom Scrollbars - Modern Dark Gray Design */

/* Main dashboard scrollbar */
.kalito-hub::-webkit-scrollbar {
  width: 12px;
}

.kalito-hub::-webkit-scrollbar-track {
  background: rgba(30, 30, 35, 0.4);
  border-radius: 6px;
  margin: 4px;
}

.kalito-hub::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, rgba(60, 60, 70, 0.9), rgba(80, 80, 90, 0.9));
  border-radius: 6px;
  border: 2px solid transparent;
  background-clip: padding-box;
  transition: all 0.3s ease;
}

.kalito-hub::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, rgba(90, 90, 100, 0.95), rgba(110, 110, 120, 0.95));
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.3);
}

.kalito-hub::-webkit-scrollbar-thumb:active {
  background: rgba(120, 120, 130, 1);
}

/* Child elements scrollbars */
.kalito-hub *::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.kalito-hub *::-webkit-scrollbar-track {
  background: rgba(30, 30, 35, 0.3);
  border-radius: 5px;
}

.kalito-hub *::-webkit-scrollbar-thumb {
  background: rgba(70, 70, 80, 0.8);
  border-radius: 5px;
  border: 2px solid transparent;
  background-clip: padding-box;
  transition: all 0.3s ease;
}

.kalito-hub *::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 100, 110, 0.9);
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.2);
}

.kalito-hub *::-webkit-scrollbar-thumb:active {
  background: rgba(110, 110, 120, 1);
}

/* Firefox scrollbar styling */
.kalito-hub {
  scrollbar-width: thin;
  scrollbar-color: rgba(80, 80, 90, 0.9) rgba(30, 30, 35, 0.4);
}

.kalito-hub * {
  scrollbar-width: thin;
  scrollbar-color: rgba(70, 70, 80, 0.8) rgba(30, 30, 35, 0.3);
}

/* Mobile: <= 768px - Thinner scrollbars */
@media (max-width: 768px) {
  .kalito-hub::-webkit-scrollbar {
    width: 8px;
  }
  
  .kalito-hub *::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
}

/* Touch device improvements */
@media (hover: none) and (pointer: coarse) {
  .action-btn:hover {
    transform: none;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
  }
  
  .patient-card:hover {
    transform: none;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
  
  .btn:hover {
    transform: none !important;
  }
}
</style>