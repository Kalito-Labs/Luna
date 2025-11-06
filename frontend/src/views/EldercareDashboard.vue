<template>
  <div class="eldercare-dashboard">
    <div class="dashboard-header">
      <!-- Hamburger button/menu in header -->
      <div class="hamburger-header">
        <HamburgerMenu />
      </div>
      <h1>Family Dashboard</h1>
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
        
        <!-- Patients -->
        <button @click="activeView = 'patients'" class="action-btn patients-btn" :class="{ active: activeView === 'patients' }">
          <div class="btn-icon">👥</div>
          <div class="btn-content">
            <h3>Patients</h3>
            <p>Manage family members</p>
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
          <div class="btn-icon">📊</div>
          <div class="btn-content">
            <h3>Vital Signs</h3>
            <p>Weight & glucose tracking</p>
          </div>
        </button>
        
        <!-- Healthcare Providers -->
        <button @click="activeView = 'providers'" class="action-btn providers-btn" :class="{ active: activeView === 'providers' }">
          <div class="btn-icon">🏥</div>
          <div class="btn-content">
            <h3>Healthcare Providers</h3>
            <p>Doctors & specialists</p>
          </div>
        </button>
      </div>
    </div>

    <!-- Content Sections -->

    <!-- Patients Overview -->
    <div v-if="activeView === 'patients'" class="content-section">
      <PatientsList 
        :patients="patients"
        :providers="providers"
        @add-patient="showPatientForm = true"
        @view-details="viewPatientDetails"
        @edit-patient="editPatient"
        @delete-patient="deletePatient"
      />
    </div>

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

    <!-- Vitals Overview -->
    <div v-if="activeView === 'vitals'" class="content-section">
      <VitalsList 
        :vitals="allVitals"
        :patients="patients"
        @add-vital="showVitalsForm = true"
        @edit-vital="editVital"
        @delete-vital="deleteVital"
      />
    </div>

    <!-- Healthcare Providers Overview -->
    <div v-if="activeView === 'providers'" class="content-section">
      <ProvidersList 
        :providers="allProviders"
        @add-provider="showProviderForm = true"
        @edit-provider="editProvider"
        @delete-provider="deleteProvider"
      />
    </div>

    <!-- Modals -->
    <!-- Patient Form Modal -->
    <div v-if="showPatientForm" class="modal-overlay">
      <PatientForm 
        :patient="editingPatient"
        :is-editing="!!editingPatient"
        :providers="providers"
        @save="savePatient"
        @cancel="closePatientForm"
        @click.stop
      />
    </div>        <!-- Medication Form Modal -->
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
    
    <!-- Vitals Form Modal -->
    <div v-if="showVitalsForm" class="modal-overlay">
      <VitalsForm 
        :vital="editingVital"
        :is-editing="!!editingVital"
        :patients="patients"
        @save="saveVital"
        @cancel="closeVitalsForm"
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
  :appointments="patientAppointments"
    @close="closePatientDetail"
    @edit-patient="editPatient"
    @add-medication="() => { showPatientDetail = false; showMedicationForm = true }"
    @edit-medication="editMedication"
    @delete-medication="deleteMedication"
    @add-appointment="() => { showPatientDetail = false; showAppointmentForm = true }"
    @edit-appointment="editAppointment"
    @delete-appointment="deleteAppointment"
    @click.stop
  />
    </div>

    <!-- Caregiver Profile Modal -->
    <div v-if="showCaregiverProfile" class="modal-overlay">
      <CaregiverProfile 
        :caregiver="caregiver"
        :is-editing="!!caregiver"
        @close="closeCaregiverProfile" 
        @save="saveCaregiver"
        @click.stop
      />
    </div>

    <!-- Provider Form Modal -->
    <div v-if="showProviderForm" class="modal-overlay">
      <ProviderForm 
        :provider="editingProvider"
        :isEditing="!!editingProvider"
        :patients="patients"
        @save="saveProvider"
        @cancel="closeProviderForm"
        @close="closeProviderForm"
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
import PatientForm from '../components/eldercare/PatientForm.vue'
import PatientsList from '../components/eldercare/PatientsList.vue'
import MedicationForm from '../components/eldercare/MedicationForm.vue'
import VitalsForm from '../components/eldercare/VitalsForm.vue'
import AppointmentForm from '../components/eldercare/AppointmentForm.vue'
import PatientDetailModal from '../components/eldercare/PatientDetailModal.vue'
import MedicationsList from '../components/eldercare/MedicationsList.vue'
import AppointmentsList from '../components/eldercare/AppointmentsList.vue'
import VitalsList from '../components/eldercare/VitalsList.vue'
import CaregiverProfile from '../components/eldercare/CaregiverProfile.vue'
import ProviderForm from '../components/eldercare/ProviderForm.vue'
import ProvidersList from '../components/eldercare/ProvidersList.vue'

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
const showProviderForm = ref(false)

const activeView = ref<'patients' | 'medications' | 'vitals' | 'appointments' | 'providers'>('patients')

const editingPatient = ref<Patient | null>(null)
const editingMedication = ref<any | null>(null)
const editingVital = ref<any | null>(null)
const editingAppointment = ref<any | null>(null)
const editingProvider = ref<any | null>(null)
const selectedPatient = ref<Patient | null>(null)
const patientMedications = ref<any[]>([])
const patientAppointments = ref<any[]>([])
const patientVitals = ref<any[]>([])

// Global data for all tabs
const allMedications = ref<any[]>([])
const allAppointments = ref<any[]>([])
const allVitals = ref<any[]>([])
const allProviders = ref<any[]>([])

const message = ref('')
const messageType = ref<'success' | 'error'>('success')

onMounted(async () => {
  await loadPatients()
  await loadProviders()
  await loadAllMedications()
  await loadAllAppointments()
  await loadAllVitals()
  await loadAllProviders()
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

async function loadProviders() {
  try {
    const response = await fetch(apiUrl('/api/providers'))
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

async function loadAllVitals() {
  try {
    const response = await fetch(apiUrl('/api/vitals'))
    if (response.ok) {
      const result = await response.json()
      allVitals.value = result.data || []
    }
  } catch (error) {
    console.error('Failed to load vitals:', error)
  }
}

async function loadAllProviders() {
  try {
    const response = await fetch(apiUrl('/api/providers'))
    if (response.ok) {
      const result = await response.json()
      allProviders.value = result.data || []
    }
  } catch (error) {
    console.error('Failed to load providers:', error)
  }
}

function editPatient(patient: Patient) {
  editingPatient.value = patient
  showPatientForm.value = true
}

async function deletePatient(patient: Patient) {
  if (confirm(`Are you sure you want to delete ${patient.name}? This action cannot be undone.`)) {
    try {
      const response = await fetch(apiUrl(`/api/patients/${patient.id}`), {
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
      fetch(apiUrl(`/api/medications?patient_id=${patientId}`)),
      fetch(apiUrl(`/api/appointments?patient_id=${patientId}`)),
      fetch(apiUrl(`/api/vitals?patient_id=${patientId}`))
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
    
    console.log('Sending patient data:', JSON.stringify(patientData, null, 2))
    
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

// saveVitals function removed

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

function editVital(vital: any) {
  editingVital.value = vital
  showVitalsForm.value = true
}

function closeVitalsForm() {
  showVitalsForm.value = false
  editingVital.value = null
}

async function saveVital(vitalData: any) {
  try {
    const url = editingVital.value ? `/api/vitals/${editingVital.value.id}` : '/api/vitals'
    const method = editingVital.value ? 'PUT' : 'POST'
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(vitalData)
    })
    
    if (response.ok) {
      closeVitalsForm()
      showMessage(
        editingVital.value ? 'Vital record updated successfully!' : 'Vital record added successfully!',
        'success'
      )
      await loadAllVitals()
      // Reload patient data if we're viewing a patient detail
      if (selectedPatient.value) {
        await loadPatientData(selectedPatient.value.id)
      }
    } else {
      throw new Error('Failed to save vital record')
    }
  } catch (error) {
    console.error('Error saving vital record:', error)
    showMessage('Failed to save vital record. Please try again.', 'error')
  }
}

async function deleteVital(vital: any) {
  if (!confirm('Are you sure you want to delete this vital record?')) {
    return
  }
  
  try {
    const response = await fetch(apiUrl(`/api/vitals/${vital.id}`), {
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
      throw new Error('Failed to delete vital record')
    }
  } catch (error) {
    console.error('Error deleting vital record:', error)
    showMessage('Failed to delete vital record. Please try again.', 'error')
  }
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

// closeVitalsForm removed

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

// editVital and deleteVital removed

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
    const response = await fetch(apiUrl('/api/caregiver'))
    if (response.ok) {
      const result = await response.json()
      // Get the singleton caregiver profile
      if (result.data) {
        caregiver.value = result.data
        console.log('Loaded caregiver profile:', result.data)
      }
    } else if (response.status === 404) {
      // No profile exists yet, that's fine
      caregiver.value = null
      console.log('No caregiver profile found')
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
    // Always use PUT - backend handles create or update automatically
    const response = await fetch(apiUrl('/api/caregiver'), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(caregiverData)
    })
    
    if (response.ok) {
      await loadCaregiver() // Refresh the caregiver data
      showMessage('Caregiver profile saved successfully!', 'success')
      // Don't close the form - keep it open so user can see their saved data
    } else {
      const errorData = await response.json()
      showMessage(errorData.message || 'Failed to save caregiver profile', 'error')
    }
  } catch (error) {
    console.error('Error saving caregiver:', error)
    showMessage('Failed to save caregiver profile', 'error')
  }
}

// Provider Management Functions
function editProvider(provider: any) {
  editingProvider.value = provider
  showProviderForm.value = true
}

function closeProviderForm() {
  showProviderForm.value = false
  editingProvider.value = null
}

async function saveProvider(providerData: any) {
  try {
    const url = editingProvider.value 
      ? `/api/providers/${editingProvider.value.id}` 
      : '/api/providers'
    const method = editingProvider.value ? 'PUT' : 'POST'
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(providerData)
    })
    
    if (response.ok) {
      await loadAllProviders()
      closeProviderForm()
      showMessage(
        editingProvider.value 
          ? 'Provider updated successfully!' 
          : 'Provider added successfully!', 
        'success'
      )
    } else {
      throw new Error('Failed to save provider')
    }
  } catch (error) {
    console.error('Error saving provider:', error)
    showMessage('Failed to save provider. Please try again.', 'error')
  }
}

async function deleteProvider(provider: any) {
  if (!confirm(`Are you sure you want to delete ${provider.name}?`)) {
    return
  }
  
  try {
    const response = await fetch(apiUrl(`/api/providers/${provider.id}`), {
      method: 'DELETE'
    })
    
    if (response.ok) {
      await loadAllProviders()
      showMessage('Provider deleted successfully!', 'success')
    } else {
      throw new Error('Failed to delete provider')
    }
  } catch (error) {
    console.error('Error deleting provider:', error)
    showMessage('Failed to delete provider. Please try again.', 'error')
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
  max-height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  background: var(--bg-main);
  color: var(--text-main);
  box-sizing: border-box;
}

/* Tablet: 769px - 1024px */
@media (max-width: 1024px) {
  .eldercare-dashboard {
    padding: 24px;
  }
}

/* Mobile: <= 768px */
@media (max-width: 768px) {
  .eldercare-dashboard {
    padding: 16px;
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

/* Hamburger menu in header */
.hamburger-header {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 100; /* Below modals (1000+) but above regular content */
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
.eldercare-dashboard::-webkit-scrollbar {
  width: 12px;
}

.eldercare-dashboard::-webkit-scrollbar-track {
  background: rgba(30, 30, 35, 0.4);
  border-radius: 6px;
  margin: 4px;
}

.eldercare-dashboard::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, rgba(60, 60, 70, 0.9), rgba(80, 80, 90, 0.9));
  border-radius: 6px;
  border: 2px solid transparent;
  background-clip: padding-box;
  transition: all 0.3s ease;
}

.eldercare-dashboard::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, rgba(90, 90, 100, 0.95), rgba(110, 110, 120, 0.95));
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.3);
}

.eldercare-dashboard::-webkit-scrollbar-thumb:active {
  background: rgba(120, 120, 130, 1);
}

/* Child elements scrollbars */
.eldercare-dashboard *::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.eldercare-dashboard *::-webkit-scrollbar-track {
  background: rgba(30, 30, 35, 0.3);
  border-radius: 5px;
}

.eldercare-dashboard *::-webkit-scrollbar-thumb {
  background: rgba(70, 70, 80, 0.8);
  border-radius: 5px;
  border: 2px solid transparent;
  background-clip: padding-box;
  transition: all 0.3s ease;
}

.eldercare-dashboard *::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 100, 110, 0.9);
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.2);
}

.eldercare-dashboard *::-webkit-scrollbar-thumb:active {
  background: rgba(110, 110, 120, 1);
}

/* Firefox scrollbar styling */
.eldercare-dashboard {
  scrollbar-width: thin;
  scrollbar-color: rgba(80, 80, 90, 0.9) rgba(30, 30, 35, 0.4);
}

.eldercare-dashboard * {
  scrollbar-width: thin;
  scrollbar-color: rgba(70, 70, 80, 0.8) rgba(30, 30, 35, 0.3);
}

/* Mobile: <= 768px - Thinner scrollbars */
@media (max-width: 768px) {
  .eldercare-dashboard::-webkit-scrollbar {
    width: 8px;
  }
  
  .eldercare-dashboard *::-webkit-scrollbar {
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