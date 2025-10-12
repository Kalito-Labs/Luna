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
/* ================================================================ */
/* BASE LAYOUT - Desktop First, Fluid Responsive                   */
/* ================================================================ */

.eldercare-dashboard {
  max-width: 1600px;
  width: 100%;
  margin: 0 auto;
  padding: 32px;
  min-height: 100vh;
  background: var(--bg-main);
  color: var(--text-main);
  box-sizing: border-box;
}

/* Fixed hamburger placement */
.hamburger-fixed {
  position: fixed;
  top: 32px;
  left: 32px;
  z-index: 100; /* Below modals (1000+) but above regular content */
}

/* ================================================================ */
/* LARGE DESKTOP (1600px+)                                         */
/* ================================================================ */
@media (min-width: 1600px) {
  .eldercare-dashboard {
    padding: 40px;
  }
}

/* ================================================================ */
/* DESKTOP (1280px - 1599px)                                       */
/* ================================================================ */
@media (max-width: 1599px) {
  .eldercare-dashboard {
    max-width: 1400px;
    padding: 28px;
  }
}

@media (max-width: 1439px) {
  .eldercare-dashboard {
    max-width: 1280px;
    padding: 24px;
  }
}

/* ================================================================ */
/* LAPTOP (1024px - 1279px)                                        */
/* ================================================================ */
@media (max-width: 1279px) {
  .eldercare-dashboard {
    max-width: 100%;
    padding: 24px;
  }
}

/* ================================================================ */
/* IPAD PRO & LARGE TABLETS (834px - 1023px)                       */
/* ================================================================ */
@media (max-width: 1023px) {
  .eldercare-dashboard {
    padding: 20px 24px;
  }
  
  .hamburger-fixed {
    top: 24px;
    left: 24px;
  }
}

/* ================================================================ */
/* IPAD & TABLETS LANDSCAPE (768px - 833px)                        */
/* ================================================================ */
@media (max-width: 833px) {
  .eldercare-dashboard {
    padding: 20px;
  }
}

/* ================================================================ */
/* IPAD MINI & TABLETS PORTRAIT (600px - 767px)                    */
/* ================================================================ */
@media (max-width: 767px) {
  .eldercare-dashboard {
    padding: 16px;
  }
  
  .hamburger-fixed {
    top: 20px;
    left: 20px;
  }
}

/* ================================================================ */
/* LARGE PHONES & SMALL TABLETS (480px - 599px)                    */
/* ================================================================ */
@media (max-width: 599px) {
  .eldercare-dashboard {
    padding: 16px 12px;
  }
}

/* ================================================================ */
/* PHONES (375px - 479px)                                          */
/* ================================================================ */
@media (max-width: 479px) {
  .eldercare-dashboard {
    padding: 12px;
  }
  
  .hamburger-fixed {
    top: 16px;
    left: 16px;
  }
}

/* ================================================================ */
/* SMALL PHONES (320px - 374px)                                    */
/* ================================================================ */
@media (max-width: 374px) {
  .eldercare-dashboard {
    padding: 10px 8px;
  }
  
  .hamburger-fixed {
    top: 12px;
    left: 12px;
  }
}

/* ================================================================ */
/* DASHBOARD HEADER                                                 */
/* ================================================================ */

.dashboard-header {
  text-align: center;
  margin-bottom: 48px;
  padding-bottom: 1.5rem;
  border-bottom: var(--border);
}

.dashboard-header h1 {
  color: var(--text-heading);
  margin: 0 0 12px 0;
  font-size: 2.5rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.subtitle {
  color: var(--text-muted);
  font-size: 1.1rem;
  margin: 0;
  line-height: 1.5;
}

/* IPAD PRO & LARGE TABLETS */
@media (max-width: 1023px) {
  .dashboard-header {
    margin-bottom: 40px;
    padding-bottom: 1.25rem;
  }
  
  .dashboard-header h1 {
    font-size: 2.25rem;
  }
  
  .subtitle {
    font-size: 1.05rem;
  }
}

/* IPAD & TABLETS */
@media (max-width: 833px) {
  .dashboard-header {
    margin-bottom: 36px;
  }
  
  .dashboard-header h1 {
    font-size: 2.1rem;
  }
}

/* IPAD MINI & SMALL TABLETS */
@media (max-width: 767px) {
  .dashboard-header {
    margin-bottom: 32px;
    padding-bottom: 1rem;
  }
  
  .dashboard-header h1 {
    font-size: 2rem;
    margin-bottom: 10px;
  }
  
  .subtitle {
    font-size: 1rem;
  }
}

/* LARGE PHONES */
@media (max-width: 599px) {
  .dashboard-header {
    margin-bottom: 28px;
  }
  
  .dashboard-header h1 {
    font-size: 1.85rem;
  }
  
  .subtitle {
    font-size: 0.95rem;
  }
}

/* PHONES */
@media (max-width: 479px) {
  .dashboard-header {
    margin-bottom: 24px;
    padding-bottom: 0.875rem;
  }
  
  .dashboard-header h1 {
    font-size: 1.75rem;
    margin-bottom: 8px;
  }
  
  .subtitle {
    font-size: 0.9rem;
  }
}

/* SMALL PHONES */
@media (max-width: 374px) {
  .dashboard-header h1 {
    font-size: 1.6rem;
  }
  
  .subtitle {
    font-size: 0.85rem;
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

/* DESKTOP - 2 columns */
@media (max-width: 1279px) {
  .action-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
}

/* IPAD PRO & LARGE TABLETS - 2 columns */
@media (max-width: 1023px) {
  .quick-actions {
    margin-bottom: 40px;
  }
  
  .quick-actions h2 {
    font-size: 1.65rem;
    margin-bottom: 20px;
  }
  
  .action-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* IPAD & TABLETS LANDSCAPE - 2 columns, smaller */
@media (max-width: 833px) {
  .quick-actions {
    margin-bottom: 36px;
  }
  
  .quick-actions h2 {
    font-size: 1.5rem;
  }
  
  .action-grid {
    gap: 16px;
  }
}

/* IPAD MINI & TABLETS PORTRAIT - still 2 columns */
@media (max-width: 767px) {
  .quick-actions {
    margin-bottom: 32px;
  }
  
  .quick-actions h2 {
    font-size: 1.4rem;
    margin-bottom: 18px;
  }
}

/* LARGE PHONES - single column */
@media (max-width: 599px) {
  .quick-actions {
    margin-bottom: 28px;
  }
  
  .quick-actions h2 {
    font-size: 1.35rem;
    margin-bottom: 16px;
  }
  
  .action-grid {
    grid-template-columns: 1fr;
    gap: 14px;
  }
}

/* PHONES - single column, tighter spacing */
@media (max-width: 479px) {
  .quick-actions {
    margin-bottom: 24px;
  }
  
  .quick-actions h2 {
    font-size: 1.3rem;
    margin-bottom: 14px;
  }
  
  .action-grid {
    gap: 12px;
  }
}

/* SMALL PHONES */
@media (max-width: 374px) {
  .quick-actions h2 {
    font-size: 1.2rem;
  }
  
  .action-grid {
    gap: 10px;
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

/* IPAD PRO & LARGE TABLETS */
@media (max-width: 1023px) {
  .action-btn {
    padding: 20px;
    min-height: 110px;
  }
}

/* IPAD & TABLETS */
@media (max-width: 833px) {
  .action-btn {
    padding: 18px;
    min-height: 100px;
  }
}

/* IPAD MINI & SMALL TABLETS */
@media (max-width: 767px) {
  .action-btn {
    padding: 16px;
    min-height: 95px;
  }
}

/* LARGE PHONES - full width, adjusted height */
@media (max-width: 599px) {
  .action-btn {
    padding: 16px 18px;
    min-height: 90px;
  }
}

/* PHONES */
@media (max-width: 479px) {
  .action-btn {
    padding: 14px 16px;
    min-height: 85px;
    border-radius: 10px;
  }
}

/* SMALL PHONES */
@media (max-width: 374px) {
  .action-btn {
    padding: 12px 14px;
    min-height: 80px;
  }
}

/* Action button states */
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

/* IPAD PRO & LARGE TABLETS */
@media (max-width: 1023px) {
  .btn-icon {
    font-size: 2.3rem;
    margin-right: 16px;
  }
  
  .btn-content h3 {
    font-size: 1.1rem;
  }
  
  .btn-content p {
    font-size: 0.9rem;
  }
}

/* IPAD & TABLETS */
@media (max-width: 833px) {
  .btn-icon {
    font-size: 2.2rem;
    margin-right: 14px;
  }
  
  .btn-content h3 {
    font-size: 1.05rem;
  }
}

/* IPAD MINI & SMALL TABLETS */
@media (max-width: 767px) {
  .btn-icon {
    font-size: 2.1rem;
    margin-right: 14px;
  }
  
  .btn-content h3 {
    font-size: 1.05rem;
    margin-bottom: 5px;
  }
  
  .btn-content p {
    font-size: 0.875rem;
  }
}

/* LARGE PHONES */
@media (max-width: 599px) {
  .btn-icon {
    font-size: 2rem;
    margin-right: 12px;
  }
  
  .btn-content h3 {
    font-size: 1rem;
  }
  
  .btn-content p {
    font-size: 0.85rem;
  }
}

/* PHONES */
@media (max-width: 479px) {
  .btn-icon {
    font-size: 1.9rem;
    margin-right: 12px;
  }
  
  .btn-content h3 {
    font-size: 0.95rem;
    margin-bottom: 4px;
  }
  
  .btn-content p {
    font-size: 0.8rem;
  }
}

/* SMALL PHONES */
@media (max-width: 374px) {
  .btn-icon {
    font-size: 1.8rem;
    margin-right: 10px;
  }
  
  .btn-content h3 {
    font-size: 0.9rem;
  }
  
  .btn-content p {
    font-size: 0.75rem;
  }
}

/* ================================================================ */
/* NAVIGATION TABS                                                  */
/* ================================================================ */

.navigation-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 32px;
  border-bottom: var(--border);
  padding-bottom: 0;
  overflow-x: auto;
  scrollbar-width: thin;
  -webkit-overflow-scrolling: touch;
}

/* IPAD PRO & LARGE TABLETS */
@media (max-width: 1023px) {
  .navigation-tabs {
    margin-bottom: 28px;
  }
}

/* IPAD & TABLETS */
@media (max-width: 833px) {
  .navigation-tabs {
    gap: 3px;
    margin-bottom: 24px;
  }
}

/* IPAD MINI & SMALL TABLETS */
@media (max-width: 767px) {
  .navigation-tabs {
    gap: 2px;
    margin-bottom: 22px;
  }
}

/* LARGE PHONES */
@media (max-width: 599px) {
  .navigation-tabs {
    margin-bottom: 20px;
  }
}

/* PHONES */
@media (max-width: 479px) {
  .navigation-tabs {
    gap: 1px;
    margin-bottom: 18px;
    padding: 0 4px;
  }
}

/* SMALL PHONES */
@media (max-width: 374px) {
  .navigation-tabs {
    margin-bottom: 16px;
  }
}

/* ================================================================ */
/* NAVIGATION TAB BUTTONS                                           */
/* ================================================================ */

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
  min-height: 44px; /* Touch-friendly minimum */
}

/* IPAD PRO & LARGE TABLETS */
@media (max-width: 1023px) {
  .nav-tab {
    padding: 11px 18px;
    font-size: 0.93rem;
  }
}

/* IPAD & TABLETS */
@media (max-width: 833px) {
  .nav-tab {
    padding: 10px 16px;
    font-size: 0.9rem;
  }
}

/* IPAD MINI & SMALL TABLETS */
@media (max-width: 767px) {
  .nav-tab {
    padding: 10px 14px;
    font-size: 0.88rem;
  }
}

/* LARGE PHONES */
@media (max-width: 599px) {
  .nav-tab {
    padding: 9px 12px;
    font-size: 0.86rem;
  }
}

/* PHONES */
@media (max-width: 479px) {
  .nav-tab {
    padding: 8px 12px;
    font-size: 0.85rem;
  }
}

/* SMALL PHONES */
@media (max-width: 374px) {
  .nav-tab {
    padding: 8px 10px;
    font-size: 0.82rem;
  }
}

/* Tab Hover State */
.nav-tab:hover {
  background: var(--bg-panel);
  color: var(--text-main);
}

/* Active Tab State */
.nav-tab.active {
  background: var(--accent-blue);
  color: white;
  box-shadow: var(--glow-blue);
}

/* Active Tab Indicator Line */
.nav-tab.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--accent-blue);
}

/* ================================================================ */
/* CONTENT SECTIONS                                                 */
/* ================================================================ */

.content-section {
  margin-bottom: 40px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

/* IPAD PRO & LARGE TABLETS */
@media (max-width: 1023px) {
  .content-section {
    margin-bottom: 36px;
  }
}

/* IPAD & TABLETS */
@media (max-width: 833px) {
  .content-section {
    margin-bottom: 32px;
  }
}

/* IPAD MINI & SMALL TABLETS */
@media (max-width: 767px) {
  .content-section {
    margin-bottom: 28px;
  }
}

/* LARGE PHONES */
@media (max-width: 599px) {
  .content-section {
    margin-bottom: 24px;
  }
}

/* PHONES */
@media (max-width: 479px) {
  .content-section {
    margin-bottom: 20px;
  }
}

/* SMALL PHONES */
@media (max-width: 374px) {
  .content-section {
    margin-bottom: 18px;
  }
}

/* ================================================================ */
/* PATIENTS OVERVIEW SECTION                                        */
/* ================================================================ */

.patients-overview {
  margin-bottom: 40px;
}

.patients-overview h2 {
  color: var(--text-heading);
  margin: 0 0 24px 0;
  font-weight: 600;
  font-size: 1.75rem;
}

/* IPAD PRO & LARGE TABLETS */
@media (max-width: 1023px) {
  .patients-overview {
    margin-bottom: 36px;
  }
  
  .patients-overview h2 {
    font-size: 1.65rem;
    margin: 0 0 22px 0;
  }
}

/* IPAD & TABLETS */
@media (max-width: 833px) {
  .patients-overview {
    margin-bottom: 32px;
  }
  
  .patients-overview h2 {
    font-size: 1.55rem;
    margin: 0 0 20px 0;
  }
}

/* IPAD MINI & SMALL TABLETS */
@media (max-width: 767px) {
  .patients-overview {
    margin-bottom: 28px;
  }
  
  .patients-overview h2 {
    font-size: 1.45rem;
    margin: 0 0 18px 0;
  }
}

/* LARGE PHONES */
@media (max-width: 599px) {
  .patients-overview {
    margin-bottom: 24px;
  }
  
  .patients-overview h2 {
    font-size: 1.35rem;
    margin: 0 0 16px 0;
  }
}

/* PHONES */
@media (max-width: 479px) {
  .patients-overview {
    margin-bottom: 20px;
  }
  
  .patients-overview h2 {
    font-size: 1.25rem;
    margin: 0 0 14px 0;
  }
}

/* SMALL PHONES */
@media (max-width: 374px) {
  .patients-overview h2 {
    font-size: 1.15rem;
    margin: 0 0 12px 0;
  }
}

/* ================================================================ */
/* PATIENTS GRID                                                    */
/* ================================================================ */

.patients-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 24px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

/* LARGE DESKTOP & ABOVE */
@media (min-width: 1600px) {
  .patients-grid {
    grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
    gap: 28px;
  }
}

/* DESKTOP */
@media (max-width: 1599px) and (min-width: 1280px) {
  .patients-grid {
    grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
    gap: 22px;
  }
}

/* LAPTOP */
@media (max-width: 1279px) and (min-width: 1024px) {
  .patients-grid {
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 20px;
  }
}

/* IPAD PRO & LARGE TABLETS */
@media (max-width: 1023px) {
  .patients-grid {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 18px;
  }
}

/* IPAD & TABLETS */
@media (max-width: 833px) {
  .patients-grid {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 16px;
  }
}

/* IPAD MINI & SMALL TABLETS */
@media (max-width: 767px) {
  .patients-grid {
    grid-template-columns: 1fr;
    gap: 14px;
  }
}

/* LARGE PHONES */
@media (max-width: 599px) {
  .patients-grid {
    gap: 12px;
  }
}

/* PHONES */
@media (max-width: 479px) {
  .patients-grid {
    gap: 10px;
  }
}

/* SMALL PHONES */
@media (max-width: 374px) {
  .patients-grid {
    gap: 8px;
  }
}

/* ================================================================ */
/* PATIENT CARDS                                                    */
/* ================================================================ */

.patient-card {
  background: var(--bg-glass);
  backdrop-filter: var(--blur);
  border: var(--border);
  border-radius: 12px;
  padding: 24px;
  transition: all 0.2s ease;
  cursor: pointer;
}

/* IPAD PRO & LARGE TABLETS */
@media (max-width: 1023px) {
  .patient-card {
    padding: 22px;
  }
}

/* IPAD & TABLETS */
@media (max-width: 833px) {
  .patient-card {
    padding: 20px;
  }
}

/* IPAD MINI & SMALL TABLETS */
@media (max-width: 767px) {
  .patient-card {
    padding: 18px;
  }
}

/* LARGE PHONES */
@media (max-width: 599px) {
  .patient-card {
    padding: 16px;
  }
}

/* PHONES */
@media (max-width: 479px) {
  .patient-card {
    padding: 14px;
  }
}

/* SMALL PHONES */
@media (max-width: 374px) {
  .patient-card {
    padding: 12px;
  }
}

/* Patient Card Hover State */
.patient-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-soft);
  border-color: var(--accent-blue);
}

/* Mobile: Reduce hover effect for touch devices */
@media (max-width: 767px) {
  .patient-card:hover {
    transform: translateY(-1px);
  }
}

/* ================================================================ */
/* PATIENT CARD HEADER                                              */
/* ================================================================ */

.patient-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: var(--border);
  flex-wrap: wrap;
  gap: 8px;
}

/* PHONES & BELOW */
@media (max-width: 479px) {
  .patient-header {
    margin-bottom: 14px;
    padding-bottom: 10px;
    gap: 6px;
  }
}

/* Patient Name Heading */
.patient-header h3 {
  margin: 0;
  color: var(--text-heading);
  font-size: 1.25rem;
  font-weight: 600;
}

/* IPAD & TABLETS */
@media (max-width: 833px) {
  .patient-header h3 {
    font-size: 1.15rem;
  }
}

/* PHONES */
@media (max-width: 479px) {
  .patient-header h3 {
    font-size: 1.1rem;
  }
}

/* SMALL PHONES */
@media (max-width: 374px) {
  .patient-header h3 {
    font-size: 1.05rem;
  }
}

/* Relationship Badge */
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
  white-space: nowrap;
}

/* PHONES */
@media (max-width: 479px) {
  .relationship-badge {
    padding: 5px 10px;
    font-size: 0.7rem;
  }
}

/* SMALL PHONES */
@media (max-width: 374px) {
  .relationship-badge {
    padding: 4px 8px;
    font-size: 0.65rem;
  }
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