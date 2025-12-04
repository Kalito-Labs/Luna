<template>
  <div class="kalito-hub">
    <!-- Compact Header -->
    <header class="health-header">
      <HamburgerMenu />
      <div class="header-title">
        <h1>Profile Hub</h1>
        <span class="subtitle">Your personal health information</span>
      </div>
    </header>

    <!-- Two-Column Content Container -->
    <div class="content-container">
      <!-- Left Column: Medications -->
      <div class="medications-column">
        <div class="column-header">
          <h2>My Medications</h2>
          <button @click="showMedicationForm = true" class="add-med-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span>Add New</span>
          </button>
        </div>

        <div class="medications-content">
          <MedicationsList 
            :medications="allMedications"
            :patients="patients"
            @add-medication="showMedicationForm = true"
            @edit-medication="editMedication"
            @delete-medication="deleteMedication"
          />
        </div>
      </div>

      <!-- Right Column: Sidebar -->
      <aside class="sidebar">
        <!-- Profile Card -->
        <div class="profile-card">
          <div class="profile-avatar">👤</div>
          <h3>{{ profileName }}</h3>
          <div class="profile-stats">
            <div class="stat-row">
              <span class="stat-label">Age</span>
              <span class="stat-value">{{ profileAge || 'Not set' }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Medications</span>
              <span class="stat-value">{{ allMedications.length }}</span>
            </div>
            <div class="stat-row" v-if="lastUpdated">
              <span class="stat-label">Last Updated</span>
              <span class="stat-value">{{ lastUpdated }}</span>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions">
          <button @click="openProfileEditor" class="action-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
            </svg>
            <span>Edit Profile</span>
          </button>
          <button @click="viewFullProfile" class="action-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>View Full Profile</span>
          </button>
        </div>
      </aside>
    </div>

    <!-- Modals -->
    <!-- Medication Form Modal -->
    <div v-if="showMedicationForm" class="modal-overlay" @click="closeMedicationForm">
      <MedicationForm 
        :medication="editingMedication"
        :is-editing="!!editingMedication"
        :patients="patients"
        @save="saveMedication"
        @cancel="closeMedicationForm"
        @click.stop
      />
    </div>

    <!-- Patient Detail Modal -->
    <div v-if="showPatientDetail" class="modal-overlay" @click="closePatientDetail">
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

    <!-- Success/Error Toast -->
    <transition name="toast">
      <div v-if="message" class="toast-message" :class="messageType">
        <svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle v-if="messageType === 'error'" cx="12" cy="12" r="10" />
          <path v-if="messageType === 'error'" d="M12 8v4M12 16h.01" />
          <path v-if="messageType === 'success'" d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline v-if="messageType === 'success'" points="22 4 12 14.01 9 11.01" />
        </svg>
        <span>{{ message }}</span>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { apiUrl } from '../config/api'
import { usePatient } from '../composables/usePatient'
import HamburgerMenu from '../components/HamburgerMenu.vue'
import MedicationForm from '../components/kalitohub/MedicationForm.vue'
import PatientDetailModal from '../components/kalitohub/PatientDetailModal.vue'
import MedicationsList from '../components/kalitohub/MedicationsList.vue'

const { setPatient } = usePatient()

interface Patient {
  id: string
  name: string
  date_of_birth?: string
  gender?: string
  phone?: string
  city?: string
  state?: string
  occupation?: string
  occupation_description?: string
  languages?: string
  notes?: string
  active?: number
  created_at?: string
  updated_at?: string
}

const patients = ref<Patient[]>([])

const showMedicationForm = ref(false)
const showPatientDetail = ref(false)

const editingMedication = ref<any | null>(null)
const selectedPatient = ref<Patient | null>(null)
const patientMedications = ref<any[]>([])

// Global data
const allMedications = ref<any[]>([])

const message = ref('')
const messageType = ref<'success' | 'error'>('success')

// Computed properties for profile card
const profileName = computed(() => {
  if (patients.value.length > 0 && patients.value[0]) {
    return patients.value[0].name || 'My Profile'
  }
  return 'My Profile'
})

const profileAge = computed(() => {
  if (patients.value.length > 0 && patients.value[0]?.date_of_birth) {
    const dob = new Date(patients.value[0].date_of_birth)
    const today = new Date()
    let age = today.getFullYear() - dob.getFullYear()
    const monthDiff = today.getMonth() - dob.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--
    }
    return age > 0 ? age : null
  }
  return null
})

const lastUpdated = computed(() => {
  if (patients.value.length > 0 && patients.value[0]?.updated_at) {
    const date = new Date(patients.value[0].updated_at)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }
  return null
})

onMounted(async () => {
  await loadPatients()
  await loadAllMedications()
})

async function loadPatients() {
  try {
    const response = await fetch(apiUrl('/api/patients'))
    if (response.ok) {
      const result = await response.json()
      patients.value = result.data || []
      console.log('Loaded patients:', patients.value)
      
      // Set the first patient as the current patient for the app
      if (patients.value.length > 0 && patients.value[0]) {
        setPatient(patients.value[0])
      }
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



async function openProfileEditor() {
  // Load or create a default patient for single-user mode
  if (patients.value.length === 0) {
    // If no patients exist, create a default patient
    const defaultPatient: Patient = {
      id: '1',
      name: 'My Profile',
      date_of_birth: '',
      phone: ''
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

function viewFullProfile() {
  openProfileEditor()
}

async function loadPatientData(patientId: string) {
  try {
    // Load patient's medications
    const medicationsRes = await fetch(apiUrl(`/api/medications?patient_id=${patientId}`))

    if (medicationsRes.ok) {
      const data = await medicationsRes.json()
      patientMedications.value = data.data || []
    } else {
      patientMedications.value = []
    }
  } catch (error) {
    console.error('Failed to load patient data:', error)
    // Set empty array as fallback
    patientMedications.value = []
  }
}

async function savePatient(patientData: any) {
  try {
    // Determine if we're editing based on whether the patient has an id
    const isEditing = patientData.id && patientData.id !== ''
    const url = isEditing ? apiUrl(`/api/patients/${patientData.id}`) : apiUrl('/api/patients')
    const method = isEditing ? 'PUT' : 'POST'
    
    // Only send fields that are actually editable in PatientDetailModal.vue
    const allowedFields = {
      name: patientData.name,
      date_of_birth: patientData.date_of_birth,
      gender: patientData.gender,
      phone: patientData.phone,
      city: patientData.city,
      state: patientData.state,
      occupation: patientData.occupation,
      occupation_description: patientData.occupation_description,
      languages: patientData.languages,
      notes: patientData.notes
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

function closePatientDetail() {
  showPatientDetail.value = false
  selectedPatient.value = null
  patientMedications.value = []
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
/* BASE LAYOUT - Matching JournalView Aesthetic                     */
/* ================================================================ */

.kalito-hub {
  min-height: 100vh;
  height: 100vh;
  background: linear-gradient(135deg, 
    rgba(15, 23, 42, 0.98) 0%, 
    rgba(30, 41, 59, 0.95) 50%,
    rgba(67, 56, 202, 0.1) 100%);
  display: flex;
  flex-direction: column;
  color: rgba(255, 255, 255, 0.92);
  position: relative;
  overflow: hidden;
}

/* ================================================================ */
/* COMPACT HEADER                                                   */
/* ================================================================ */

.health-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: rgba(30, 41, 59, 0.6);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(139, 92, 246, 0.15);
  flex-shrink: 0;
  position: relative;
  z-index: 100;
}

.header-title h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  line-height: 1;
}

.subtitle {
  display: block;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 0.25rem;
  font-weight: 400;
}

/* ================================================================ */
/* TWO-COLUMN LAYOUT                                                */
/* ================================================================ */

.content-container {
  display: flex;
  gap: 1.5rem;
  flex: 1;
  padding: 1.5rem;
  overflow: hidden;
  min-height: 0;
  position: relative;
  z-index: 1;
}

/* Left Column - Medications */
.medications-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-radius: 1.25rem;
  overflow: hidden;
  position: relative;
  z-index: auto;
}

.column-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(139, 92, 246, 0.15);
  background: rgba(255, 255, 255, 0.02);
}

.column-header h2 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
}

.add-med-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, 
    rgba(139, 92, 246, 0.9) 0%, 
    rgba(124, 58, 237, 0.95) 100%);
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.add-med-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.5);
}

.add-med-btn svg {
  width: 16px;
  height: 16px;
}

.medications-content {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.medications-content::-webkit-scrollbar {
  width: 6px;
}

.medications-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}

.medications-content::-webkit-scrollbar-thumb {
  background: rgba(139, 92, 246, 0.4);
  border-radius: 10px;
}

.medications-content::-webkit-scrollbar-thumb:hover {
  background: rgba(139, 92, 246, 0.6);
}

/* ================================================================ */
/* SIDEBAR                                                          */
/* ================================================================ */

.sidebar {
  width: 320px;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  flex-shrink: 0;
}

.profile-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-radius: 1.25rem;
  padding: 1.5rem;
  backdrop-filter: blur(20px);
  text-align: center;
}

.profile-avatar {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, 
    rgba(139, 92, 246, 0.2) 0%, 
    rgba(124, 58, 237, 0.3) 100%);
  border: 2px solid rgba(139, 92, 246, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  margin: 0 auto 1rem;
}

.profile-card h3 {
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
}

.profile-stats {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.stat-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.stat-label {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
}

.stat-value {
  font-size: 0.95rem;
  font-weight: 600;
  color: rgba(196, 181, 253, 0.95);
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.action-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-radius: 1rem;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
}

.action-link:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(139, 92, 246, 0.3);
  color: rgba(255, 255, 255, 1);
  transform: translateX(4px);
}

.action-link svg {
  width: 20px;
  height: 20px;
  color: rgba(139, 92, 246, 0.7);
  flex-shrink: 0;
}

/* ================================================================ */
/* MODALS                                                           */
/* ================================================================ */

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

/* Toast Notification */
.toast-message {
  position: fixed;
  top: 2rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  z-index: 1001;
  font-size: 0.95rem;
  font-weight: 500;
  max-width: 90%;
  animation: slideDown 0.3s ease-out;
}

.toast-message.success {
  background: rgba(34, 197, 94, 0.95);
  color: white;
}

.toast-message.error {
  background: rgba(239, 68, 68, 0.95);
  color: white;
}

.toast-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.toast-enter-active {
  animation: slideDown 0.3s ease-out;
}

.toast-leave-active {
  animation: slideUp 0.3s ease-in;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

@keyframes slideUp {
  from {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
  to {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }
}

/* ================================================================ */
/* RESPONSIVE DESIGN                                                */
/* ================================================================ */

@media (max-width: 1024px) {
  .content-container {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
    order: -1;
  }
  
  .profile-card {
    display: flex;
    align-items: center;
    text-align: left;
    gap: 1.5rem;
  }
  
  .profile-avatar {
    margin: 0;
  }
  
  .profile-stats {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }
  
  .stat-row {
    flex-direction: column;
    align-items: flex-start;
    border-bottom: none;
    background: rgba(255, 255, 255, 0.03);
    padding: 0.75rem;
    border-radius: 0.5rem;
  }
}

@media (max-width: 640px) {
  .health-header {
    gap: 0.75rem;
  }
  
  .content-container {
    padding: 1rem;
    gap: 1rem;
  }
  
  .profile-card {
    flex-direction: column;
    text-align: center;
  }
  
  .profile-avatar {
    margin: 0 auto 1rem;
  }
  
  .profile-stats {
    grid-template-columns: 1fr;
  }
  
  .column-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  
  .add-med-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>