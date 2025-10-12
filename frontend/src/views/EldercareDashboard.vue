<template>
  <div class="eldercare-dashboard">
    <!-- Hamburger button/menu, top left -->
    <div class="hamburger-fixed">
      <HamburgerMenu />
    </div>
    
    <div class="dashboard-header">
      <h1>Family Care Dashboard</h1>
      <p class="subtitle">Your unified hub for managing family health and caregiving</p>
    </div>
    
    <!-- Quick Actions - Main Dashboard -->
    <div class="quick-actions">
      <h2>Dashboard</h2>
      <div class="action-grid">
        <!-- Caregiver Profile -->
        <button @click="openCaregiverProfile" class="action-btn caregiver-btn">
          <div class="btn-icon">👨‍⚕️</div>
          <div class="btn-content">
            <h3>My Caregiver Profile</h3>
            <p>Manage your professional info</p>
          </div>
        </button>
        
        <!-- Add Patient -->
        <button @click="showPatientForm = true" class="action-btn patient-btn">
          <div class="btn-icon">👤</div>
          <div class="btn-content">
            <h3>Add Patient</h3>
            <p>Add a new family member</p>
          </div>
        </button>
        
        <!-- Saved Patients -->
        <button @click="activeView = 'patients'" class="action-btn patients-btn" :class="{ active: activeView === 'patients' }">
          <div class="btn-icon">�</div>
          <div class="btn-content">
            <h3>Saved Patients</h3>
            <p>View all family members</p>
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
        
        <!-- Vitals -->
        <button @click="activeView = 'vitals'" class="action-btn vitals-btn" :class="{ active: activeView === 'vitals' }">
          <div class="btn-icon">�</div>
          <div class="btn-content">
            <h3>Vitals</h3>
            <p>Blood pressure, weight, etc.</p>
          </div>
        </button>
      </div>
    </div>

    <!-- Content Sections -->

    <!-- Patients Overview -->
    <div v-if="activeView === 'patients'" class="patients-overview">
      <h2>Patients</h2>
      <div v-if="patients.length > 0" class="patients-grid">
        <div v-for="patient in patients" :key="patient.id" class="patient-card">
          <div class="patient-header">
            <h3>{{ patient.name }}</h3>
            <span class="relationship-badge">{{ formatRelationship(patient.relationship) }}</span>
          </div>
          <div class="patient-info">
            <p v-if="patient.date_of_birth">
              <strong>Age:</strong> {{ calculateAge(patient.date_of_birth) }}
            </p>
            <p v-if="patient.primary_doctor">
              <strong>Primary Doctor:</strong> {{ patient.primary_doctor }}
            </p>
            <p v-if="patient.phone">
              <strong>Phone:</strong> {{ patient.phone }}
            </p>
          </div>
          <div class="patient-actions">
            <button @click="editPatient(patient)" class="btn btn-sm btn-outline">
              Edit
            </button>
            <button @click="viewPatientDetails(patient)" class="btn btn-sm btn-primary">
              View Details
            </button>
            <button @click="deletePatient(patient)" class="btn btn-sm btn-danger">
              Delete
            </button>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <div class="empty-icon">👥</div>
        <h3>No patients yet</h3>
        <p>Add your first patient using the Quick Actions above</p>
      </div>
    </div>

    <!-- Medications Overview -->
    <div v-if="activeView === 'medications'" class="content-section">
      <MedicationsList 
        :medications="allMedications"
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

    <!-- Vitals Overview -->
    <div v-if="activeView === 'vitals'" class="content-section">
      <VitalsList 
        :vitals="allVitals"
        @add-vitals="showVitalsForm = true"
        @edit-vital="editVital"
        @delete-vital="deleteVital"
      />
    </div>

    <!-- Empty State -->
    <div v-if="patients.length === 0" class="empty-state">
      <div class="empty-icon">👥</div>
      <h3>No Patients Added Yet</h3>
      <p>Start by adding your first patient (like Mom, Dad, or yourself)</p>
      <button @click="showPatientForm = true" class="btn btn-primary btn-lg">
        Add Your First Patient
      </button>
    </div>

    <!-- Modals -->
    <!-- Patient Form Modal -->
    <div v-if="showPatientForm" class="modal-overlay" @click="closePatientForm">
      <PatientForm 
        :patient="editingPatient"
        :is-editing="!!editingPatient"
        @save="savePatient"
        @cancel="closePatientForm"
        @click.stop
      />
    </div>    <div v-if="showMedicationForm" class="modal-overlay" @click="closeMedicationForm">
      <MedicationForm 
        :medication="editingMedication"
        :is-editing="!!editingMedication"
        :patients="patients"
        @save="saveMedication"
        @cancel="closeMedicationForm"
        @click.stop
      />
    </div>
    
    <!-- Vitals Form Modal -->
    <div v-if="showVitalsForm" class="modal-overlay" @click="closeVitalsForm">
      <VitalsForm 
        :patients="patients"
        @save="saveVitals"
        @cancel="closeVitalsForm"
        @click.stop
      />
    </div>        <!-- Appointment Form Modal -->
    <div v-if="showAppointmentForm" class="modal-overlay" @click="closeAppointmentForm">
      <AppointmentForm 
        :patients="patients"
        :providers="providers"
        @save="saveAppointment"
        @cancel="closeAppointmentForm"
        @click.stop
      />
    </div>

    <!-- Patient Detail Modal -->
    <div v-if="showPatientDetail" class="modal-overlay" @click="closePatientDetail">
      <PatientDetailModal 
        v-if="selectedPatient"
        :patient="selectedPatient"
        :medications="patientMedications"
        :appointments="patientAppointments"
        :vitals="patientVitals"
        @close="closePatientDetail"
        @edit-patient="editPatient"
        @add-medication="() => { showPatientDetail = false; showMedicationForm = true }"
        @edit-medication="editMedication"
        @delete-medication="deleteMedication"
        @add-appointment="() => { showPatientDetail = false; showAppointmentForm = true }"
        @edit-appointment="editAppointment"
        @delete-appointment="deleteAppointment"
        @add-vitals="() => { showPatientDetail = false; showVitalsForm = true }"
        @edit-vital="editVital"
        @delete-vital="deleteVital"
        @click.stop
      />
    </div>

    <!-- Caregiver Profile Modal -->
    <div v-if="showCaregiverProfile" class="modal-overlay" @click="closeCaregiverProfile">
      <CaregiverProfile 
        :caregiver="caregiver"
        :is-editing="!!caregiver"
        @close="closeCaregiverProfile" 
        @save="saveCaregiver"
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
import HamburgerMenu from '../components/HamburgerMenu.vue'
import PatientForm from '../components/eldercare/PatientForm.vue'
import MedicationForm from '../components/eldercare/MedicationForm.vue'
import VitalsForm from '../components/eldercare/VitalsForm.vue'
import AppointmentForm from '../components/eldercare/AppointmentForm.vue'
import PatientDetailModal from '../components/eldercare/PatientDetailModal.vue'
import MedicationsList from '../components/eldercare/MedicationsList.vue'
import AppointmentsList from '../components/eldercare/AppointmentsList.vue'
import VitalsList from '../components/eldercare/VitalsList.vue'
import CaregiverProfile from '../components/eldercare/CaregiverProfile.vue'

interface Patient {
  id: string
  name: string
  date_of_birth?: string
  relationship?: string
  phone?: string
  primary_doctor?: string
}

interface Provider {
  id: string
  name: string
  specialty: string
}

const patients = ref<Patient[]>([])
const providers = ref<Provider[]>([])
const caregiver = ref<any>(null)

const showPatientForm = ref(false)
const showMedicationForm = ref(false)
const showVitalsForm = ref(false)
const showAppointmentForm = ref(false)
const showPatientDetail = ref(false)
const showCaregiverProfile = ref(false)

const activeView = ref<'patients' | 'medications' | 'appointments' | 'vitals'>('patients')

const editingPatient = ref<Patient | null>(null)
const editingMedication = ref<any | null>(null)
const selectedPatient = ref<Patient | null>(null)
const patientMedications = ref<any[]>([])
const patientAppointments = ref<any[]>([])
const patientVitals = ref<any[]>([])

// Global data for all tabs
const allMedications = ref<any[]>([])
const allAppointments = ref<any[]>([])
const allVitals = ref<any[]>([])

const message = ref('')
const messageType = ref<'success' | 'error'>('success')

onMounted(async () => {
  await loadPatients()
  await loadProviders()
  await loadAllMedications()
  await loadAllAppointments()
  await loadAllVitals()
})

async function loadPatients() {
  try {
    const response = await fetch('/api/patients')
    if (response.ok) {
      const result = await response.json()
      patients.value = result.data || []
      console.log('Loaded patients:', patients.value)
    }
  } catch (error) {
    console.error('Failed to load patients:', error)
  }
}

async function loadProviders() {
  try {
    const response = await fetch('/api/providers')
    if (response.ok) {
      const result = await response.json()
      providers.value = result.data || []
    }
  } catch (error) {
    console.error('Failed to load providers:', error)
  }
}

async function loadAllMedications() {
  try {
    const response = await fetch('/api/medications')
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
    const response = await fetch('/api/appointments')
    if (response.ok) {
      const result = await response.json()
      allAppointments.value = result.data || []
    }
  } catch (error) {
    console.error('Failed to load appointments:', error)
  }
}

async function loadAllVitals() {
  try {
    const response = await fetch('/api/vitals')
    if (response.ok) {
      const result = await response.json()
      allVitals.value = result.data || []
    }
  } catch (error) {
    console.error('Failed to load vitals:', error)
  }
}

function formatRelationship(relationship?: string): string {
  if (!relationship) return ''
  return relationship.charAt(0).toUpperCase() + relationship.slice(1)
}

function calculateAge(dateOfBirth: string): number {
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  
  return age
}

function editPatient(patient: Patient) {
  editingPatient.value = patient
  showPatientForm.value = true
}

async function deletePatient(patient: Patient) {
  if (confirm(`Are you sure you want to delete ${patient.name}? This action cannot be undone.`)) {
    try {
      const response = await fetch(`/api/patients/${patient.id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        // Remove patient from local array
        patients.value = patients.value.filter(p => p.id !== patient.id)
        showMessage('Patient deleted successfully', 'success')
      } else {
        const error = await response.json()
        showMessage(error.message || 'Failed to delete patient', 'error')
      }
    } catch (error) {
      console.error('Error deleting patient:', error)
      showMessage('Failed to delete patient', 'error')
    }
  }
}

async function viewPatientDetails(patient: Patient) {
  selectedPatient.value = patient
  await loadPatientData(patient.id)
  showPatientDetail.value = true
}

async function loadPatientData(patientId: string) {
  try {
    // Load patient's medications, appointments, and vitals
    const [medicationsRes, appointmentsRes, vitalsRes] = await Promise.all([
      fetch(`/api/medications?patient_id=${patientId}`),
      fetch(`/api/appointments?patient_id=${patientId}`),
      fetch(`/api/vitals?patient_id=${patientId}`)
    ])

    if (medicationsRes.ok) {
      const data = await medicationsRes.json()
      patientMedications.value = data.data || []
    }
    
    if (appointmentsRes.ok) {
      const data = await appointmentsRes.json()
      patientAppointments.value = data.data || []
    }
    
    if (vitalsRes.ok) {
      const data = await vitalsRes.json()
      patientVitals.value = data.data || []
    }
  } catch (error) {
    console.error('Failed to load patient data:', error)
    // Set empty arrays as fallback
    patientMedications.value = []
    patientAppointments.value = []
    patientVitals.value = []
  }
}

async function savePatient(patientData: any) {
  try {
    const url = editingPatient.value ? `/api/patients/${editingPatient.value.id}` : '/api/patients'
    const method = editingPatient.value ? 'PUT' : 'POST'
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(patientData)
    })
    
    if (response.ok) {
      await loadPatients()
      closePatientForm()
      showMessage(
        editingPatient.value ? 'Patient updated successfully!' : 'Patient added successfully!',
        'success'
      )
    } else {
      throw new Error('Failed to save patient')
    }
  } catch (error) {
    console.error('Error saving patient:', error)
    showMessage('Failed to save patient. Please try again.', 'error')
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

async function saveVitals(vitalsData: any) {
  try {
    const response = await fetch('/api/vitals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(vitalsData)
    })
    
    if (response.ok) {
      closeVitalsForm()
      showMessage('Vital signs recorded successfully!', 'success')
    } else {
      throw new Error('Failed to save vitals')
    }
  } catch (error) {
    console.error('Error saving vitals:', error)
    showMessage('Failed to save vital signs. Please try again.', 'error')
  }
}

async function saveAppointment(appointmentData: any) {
  try {
    const response = await fetch('/api/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(appointmentData)
    })
    
    if (response.ok) {
      closeAppointmentForm()
      showMessage('Appointment scheduled successfully!', 'success')
    } else {
      throw new Error('Failed to save appointment')
    }
  } catch (error) {
    console.error('Error saving appointment:', error)
    showMessage('Failed to schedule appointment. Please try again.', 'error')
  }
}

function closePatientForm() {
  showPatientForm.value = false
  editingPatient.value = null
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
    const response = await fetch(`/api/medications/${medication.id}`, {
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

function closeVitalsForm() {
  showVitalsForm.value = false
}

function closeAppointmentForm() {
  showAppointmentForm.value = false
}

async function editAppointment(_appointment: any) {
  // TODO: Implement edit appointment
  showMessage('Edit appointment functionality coming soon!', 'success')
}

async function deleteAppointment(appointment: any) {
  if (!confirm('Are you sure you want to delete this appointment?')) {
    return
  }
  
  try {
    const response = await fetch(`/api/appointments/${appointment.id}`, {
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

async function editVital(_vital: any) {
  // TODO: Implement edit vital
  showMessage('Edit vital functionality coming soon!', 'success')
}

async function deleteVital(vital: any) {
  if (!confirm('Are you sure you want to delete this vital record?')) {
    return
  }
  
  try {
    const response = await fetch(`/api/vitals/${vital.id}`, {
      method: 'DELETE'
    })
    
    if (response.ok) {
      showMessage('Vital record deleted successfully!', 'success')
      
      // Reload appropriate data based on context
      if (selectedPatient.value) {
        // If viewing patient detail, reload patient data
        await loadPatientData(selectedPatient.value.id)
      } else if (activeView.value === 'vitals') {
        // If viewing vitals tab, reload all vitals
        await loadAllVitals()
      }
    } else {
      throw new Error('Failed to delete vital')
    }
  } catch (error) {
    console.error('Error deleting vital:', error)
    showMessage('Failed to delete vital. Please try again.', 'error')
  }
}

function closePatientDetail() {
  showPatientDetail.value = false
  selectedPatient.value = null
  patientMedications.value = []
  patientAppointments.value = []
  patientVitals.value = []
}

function closeCaregiverProfile() {
  showCaregiverProfile.value = false
}

async function loadCaregiver() {
  try {
    const response = await fetch('/api/caregivers')
    if (response.ok) {
      const result = await response.json()
      // Get the first (and should be only) caregiver profile
      if (result.data && result.data.length > 0) {
        caregiver.value = result.data[0]
      }
    }
  } catch (error) {
    console.error('Error loading caregiver:', error)
  }
}

async function openCaregiverProfile() {
  await loadCaregiver()
  showCaregiverProfile.value = true
}

async function saveCaregiver(caregiverData: any) {
  try {
    const method = caregiver.value ? 'PUT' : 'POST'
    const url = caregiver.value ? `/api/caregivers/${caregiver.value.id}` : '/api/caregivers'
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(caregiverData)
    })
    
    if (response.ok) {
      await loadCaregiver() // Refresh the caregiver data
      showMessage('Caregiver profile saved successfully!', 'success')
      closeCaregiverProfile()
    } else {
      const errorData = await response.json()
      showMessage(errorData.message || 'Failed to save caregiver profile', 'error')
    }
  } catch (error) {
    console.error('Error saving caregiver:', error)
    showMessage('Failed to save caregiver profile', 'error')
  }
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
.eldercare-dashboard {
  max-width: 1600px; /* Wider for laptop use */
  width: 1500px;
  margin: 0 auto;
  padding: 24px;
  min-height: 100vh;
  overflow-x: auto; /* Handle horizontal overflow */
  background: var(--bg-main);
  color: var(--text-main);
}

/* Fixed hamburger placement */
.hamburger-fixed {
  position: fixed;
  top: 32px;
  left: 32px;
  z-index: 2001;
}

/* Responsive Design */
@media (max-width: 1280px) {
  .eldercare-dashboard {
    max-width: 1200px;
    padding: 20px;
  }
}

@media (max-width: 768px) {
  .eldercare-dashboard {
    max-width: 100%;
    padding: 16px;
    margin: 0;
  }
  
  .hamburger-fixed {
    top: 16px;
    left: 16px;
  }
}

@media (max-width: 480px) {
  .eldercare-dashboard {
    padding: 12px;
  }
  
  .hamburger-fixed {
    top: 12px;
    left: 12px;
  }
}

.dashboard-header {
  text-align: center;
  margin-bottom: 40px;
  padding-bottom: 1rem;
  border-bottom: var(--border);
}

.dashboard-header h1 {
  color: var(--text-heading);
  margin: 0 0 8px 0;
  font-size: 2.5rem;
  font-weight: 600;
}

/* Responsive header */
@media (max-width: 768px) {
  .dashboard-header h1 {
    font-size: 2rem;
  }
  
  .dashboard-header {
    margin-bottom: 30px;
  }
}

@media (max-width: 480px) {
  .dashboard-header h1 {
    font-size: 1.75rem;
  }
  
  .dashboard-header {
    margin-bottom: 24px;
  }
}

.subtitle {
  color: var(--text-muted);
  font-size: 1.1rem;
  margin: 0;
}

.quick-actions {
  margin-bottom: 40px;
}

.quick-actions h2 {
  color: var(--text-heading);
  margin: 0 0 20px 0;
  font-weight: 600;
}

/* Responsive quick actions */
@media (max-width: 768px) {
  .quick-actions {
    margin-bottom: 30px;
  }
  
  .quick-actions h2 {
    font-size: 1.5rem;
    margin: 0 0 16px 0;
  }
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  overflow-x: auto;
  padding-bottom: 8px;
}

/* Responsive action grid */
@media (max-width: 1024px) {
  .action-grid {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .action-grid {
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 16px;
  }
}

@media (max-width: 480px) {
  .action-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

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
}

/* Responsive action buttons */
@media (max-width: 768px) {
  .action-btn {
    padding: 20px;
    min-height: 100px;
  }
}

@media (max-width: 480px) {
  .action-btn {
    padding: 16px;
    min-height: 80px;
    flex-direction: column;
    text-align: center;
  }
}

.action-btn:hover:not(:disabled) {
  border-color: var(--accent-blue);
  transform: translateY(-2px);
  box-shadow: var(--shadow-soft);
}

.action-btn.active {
  background: var(--accent-blue);
  color: white;
  border-color: var(--accent-blue);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
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

.btn-icon {
  font-size: 2.5rem;
  margin-right: 16px;
}

/* Responsive icon */
@media (max-width: 480px) {
  .btn-icon {
    font-size: 2rem;
    margin-right: 0;
    margin-bottom: 8px;
  }
}

.btn-content h3 {
  margin: 0 0 4px 0;
  color: var(--text-heading);
  font-size: 1.1rem;
  font-weight: 600;
}

.btn-content p {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.9rem;
}

/* Responsive button content */
@media (max-width: 480px) {
  .btn-content h3 {
    font-size: 1rem;
  }
  
  .btn-content p {
    font-size: 0.85rem;
  }
}

/* Navigation Tabs */
.navigation-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 30px;
  border-bottom: var(--border);
  padding-bottom: 0;
  overflow-x: auto;
  scrollbar-width: thin;
}

/* Responsive navigation tabs */
@media (max-width: 768px) {
  .navigation-tabs {
    gap: 2px;
    margin-bottom: 24px;
  }
}

@media (max-width: 480px) {
  .navigation-tabs {
    gap: 1px;
    margin-bottom: 20px;
    padding: 0 4px;
  }
}

.nav-tab {
  padding: 12px 20px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-weight: 500;
  cursor: pointer;
  border-radius: 8px 8px 0 0;
  transition: all 0.2s;
  position: relative;
  font-size: 0.95rem;
  white-space: nowrap;
  flex-shrink: 0;
}

/* Responsive nav tabs */
@media (max-width: 768px) {
  .nav-tab {
    padding: 10px 16px;
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .nav-tab {
    padding: 8px 12px;
    font-size: 0.85rem;
  }
}

.nav-tab:hover {
  background: var(--bg-panel);
  color: var(--text-main);
}

.nav-tab.active {
  background: var(--accent-blue);
  color: white;
  box-shadow: var(--glow-blue);
}

.nav-tab.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--accent-blue);
}

/* Content Sections */
.content-section {
  margin-bottom: 40px;
  overflow-x: auto;
}

/* Responsive content sections */
@media (max-width: 768px) {
  .content-section {
    margin-bottom: 30px;
  }
}

.patients-overview {
  margin-bottom: 40px;
}

.patients-overview h2 {
  color: var(--text-heading);
  margin: 0 0 20px 0;
  font-weight: 600;
}

/* Responsive patients overview */
@media (max-width: 768px) {
  .patients-overview {
    margin-bottom: 30px;
  }
  
  .patients-overview h2 {
    font-size: 1.5rem;
    margin: 0 0 16px 0;
  }
}

.patients-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 24px;
  overflow-x: auto;
}

/* Responsive patients grid */
@media (max-width: 1200px) {
  .patients-grid {
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .patients-grid {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 16px;
  }
}

@media (max-width: 480px) {
  .patients-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

.patient-card {
  background: var(--bg-glass);
  backdrop-filter: var(--blur);
  border: var(--border);
  border-radius: 12px;
  padding: 24px;
  transition: all 0.2s ease;
}

/* Responsive patient cards */
@media (max-width: 768px) {
  .patient-card {
    padding: 20px;
  }
}

@media (max-width: 480px) {
  .patient-card {
    padding: 16px;
  }
}

.patient-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-soft);
  border-color: var(--accent-blue);
}

.patient-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: var(--border);
}

.patient-header h3 {
  margin: 0;
  color: var(--text-heading);
  font-size: 1.25rem;
  font-weight: 600;
}

.relationship-badge {
  background: var(--accent-blue);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: var(--glow-blue);
}

.patient-info {
  margin-bottom: 20px;
}

.patient-info p {
  margin: 8px 0;
  color: var(--text-muted);
  font-size: 0.95rem;
  display: flex;
  align-items: center;
}

.patient-info strong {
  color: var(--text-heading);
  margin-right: 8px;
  min-width: 120px;
}

.patient-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: var(--border);
  flex-wrap: wrap;
}

/* Responsive patient actions */
@media (max-width: 768px) {
  .patient-actions {
    gap: 8px;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .patient-actions {
    flex-direction: column;
    gap: 6px;
  }
  
  .patient-info strong {
    min-width: 100px;
    font-size: 0.9rem;
  }
  
  .patient-info {
    font-size: 0.9rem;
  }
}

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

/* Responsive modal overlay */
@media (max-width: 768px) {
  .modal-overlay {
    padding: 16px;
  }
}

@media (max-width: 480px) {
  .modal-overlay {
    padding: 8px;
    align-items: flex-start;
    padding-top: 20px;
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

/* Responsive modal content */
@media (max-width: 1024px) {
  .modal-content {
    width: 85vw;
  }
}

@media (max-width: 768px) {
  .modal-content {
    width: 95vw;
    border-radius: 8px;
  }
}

@media (max-width: 480px) {
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

/* Custom Scrollbars */
.eldercare-dashboard *::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.eldercare-dashboard *::-webkit-scrollbar-track {
  background: var(--bg-panel);
  border-radius: 4px;
}

.eldercare-dashboard *::-webkit-scrollbar-thumb {
  background: var(--text-muted);
  border-radius: 4px;
}

.eldercare-dashboard *::-webkit-scrollbar-thumb:hover {
  background: var(--accent-blue);
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