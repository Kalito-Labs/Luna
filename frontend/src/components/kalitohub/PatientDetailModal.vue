<template>
  <div class="patient-detail-modal">
    <div class="modal-header">
      <h2>{{ isEditing ? 'Edit My Profile' : 'My Profile' }}</h2>
      <div class="modal-actions">
        <button v-if="!isEditing" @click="toggleEdit" class="btn btn-sm btn-primary edit-btn" title="Edit profile information">
          ✏️<span class="btn-text"> Edit</span>
        </button>
        <button v-if="isEditing" @click="saveChanges" class="btn btn-sm btn-success save-btn" title="Save changes">
          💾<span class="btn-text"> Save</span>
        </button>
        <button v-if="isEditing" @click="cancelEdit" class="btn btn-sm btn-secondary cancel-btn" title="Cancel editing">
          ❌<span class="btn-text"> Cancel</span>
        </button>
        <button v-if="!isEditing" @click="printModal" class="btn btn-sm btn-outline print-btn" title="Print patient information">
          🖨️<span class="btn-text"> Print</span>
        </button>
        <button @click="$emit('close')" class="close-btn">&times;</button>
      </div>
    </div>
    
    <div class="modal-body">
      <!-- Patient Basic Info -->
      <div class="patient-info-section">
        <div class="section-header">
          <h3>Patient Information</h3>
        </div>
        
        <!-- View Mode -->
        <div v-if="!isEditing" class="info-grid">
          <div class="info-item">
            <label>Name:</label>
            <span>{{ patient.name }}</span>
          </div>
          <div class="info-item" v-if="patient.date_of_birth">
            <label>Age:</label>
            <span>{{ calculateAge(patient.date_of_birth) }} years old</span>
          </div>
          <div class="info-item" v-if="patient.gender">
            <label>Gender:</label>
            <span>{{ patient.gender }}</span>
          </div>
          <div class="info-item" v-if="patient.phone">
            <label>Phone:</label>
            <span>{{ patient.phone }}</span>
          </div>
          <div class="info-item" v-if="patient.city || patient.state">
            <label>Location:</label>
            <span>{{ [patient.city, patient.state].filter(Boolean).join(', ') }}</span>
          </div>
          <div class="info-item" v-if="patient.occupation">
            <label>Occupation:</label>
            <span>{{ patient.occupation }}</span>
          </div>
          <div class="info-item" v-if="patient.languages">
            <label>Languages:</label>
            <span>{{ patient.languages }}</span>
          </div>
        </div>
        
        <!-- Edit Mode -->
        <div v-if="isEditing" class="edit-form">
          <form class="form-container">
            <div class="form-section">
              <h4>Basic Information</h4>
              
              <div class="form-group">
                <label for="edit-name">Full Name *</label>
                <input 
                  id="edit-name"
                  v-model="editForm.name" 
                  type="text" 
                  required 
                  placeholder="Enter your full name"
                />
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label for="edit-date_of_birth">Date of Birth</label>
                  <input 
                    id="edit-date_of_birth"
                    v-model="editForm.date_of_birth" 
                    type="date"
                  />
                </div>
                
                <div class="form-group">
                  <label for="edit-gender">Gender</label>
                  <select id="edit-gender" v-model="editForm.gender">
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div class="form-section">
              <h4>Contact Information</h4>
              
              <div class="form-row">
                <div class="form-group">
                  <label for="edit-phone">Phone Number</label>
                  <input 
                    id="edit-phone"
                    v-model="editForm.phone" 
                    type="tel" 
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label for="edit-city">City</label>
                  <input 
                    id="edit-city"
                    v-model="editForm.city" 
                    type="text" 
                    placeholder="Enter city"
                  />
                </div>
                
                <div class="form-group">
                  <label for="edit-state">State</label>
                  <input 
                    id="edit-state"
                    v-model="editForm.state" 
                    type="text" 
                    placeholder="Enter state"
                  />
                </div>
              </div>
            </div>
            
            <div class="form-section">
              <h4>Professional & Languages</h4>
              
              <div class="form-group">
                <label for="edit-occupation">Occupation</label>
                <input 
                  id="edit-occupation"
                  v-model="editForm.occupation" 
                  type="text" 
                  placeholder="Enter your occupation"
                />
              </div>
              
              <div class="form-group">
                <label for="edit-occupation_description">Occupation Description</label>
                <textarea 
                  id="edit-occupation_description"
                  v-model="editForm.occupation_description" 
                  rows="3" 
                  placeholder="Describe your job, responsibilities, work environment..."
                ></textarea>
              </div>
              
              <div class="form-group">
                <label for="edit-languages">Languages</label>
                <input 
                  id="edit-languages"
                  v-model="editForm.languages" 
                  type="text" 
                  placeholder="e.g., English, Spanish"
                />
              </div>
            </div>
            
            <div class="form-section">
              <div class="form-group">
                <label for="edit-notes">Notes</label>
                <textarea 
                  id="edit-notes"
                  v-model="editForm.notes" 
                  rows="4" 
                  placeholder="Enter any additional notes..."
                ></textarea>
              </div>
            </div>
          </form>
        </div>
        
        <div v-if="patient.occupation_description && !isEditing" class="notes-section">
          <label>Occupation Details:</label>
          <p>{{ patient.occupation_description }}</p>
        </div>
        
        <div v-if="patient.notes && !isEditing" class="notes-section">
          <label>Notes:</label>
          <p>{{ patient.notes }}</p>
        </div>
      </div>
      
      <!-- Medications Section -->
      <MedicationsList 
        :medications="medications"
        :patients="[patient]"
        :readonly="true"
      />
    </div>

    <!-- Hidden Printable Component - Only for printing -->
    <div class="print-only-wrapper">
      <PrintablePatientReport 
        ref="printComponent"
        :patient="patient"
        :medications="medications"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MedicationsList from './MedicationsList.vue'
import PrintablePatientReport from './PrintablePatientReport.vue'

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

interface Medication {
  id: string
  name: string
  dosage: string
  frequency: string
  prescribing_doctor?: string
  start_date?: string
  refills_remaining?: number
  notes?: string
}

interface Props {
  patient: Patient
  medications: Medication[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  'save-patient': [patient: Patient]
}>()

// Edit mode state
const isEditing = ref(false)
const editForm = ref<Patient>({
  id: '',
  name: '',
  date_of_birth: '',
  gender: '',
  phone: '',
  city: '',
  state: '',
  occupation: '',
  occupation_description: '',
  languages: '',
  notes: ''
})

const printComponent = ref<InstanceType<typeof PrintablePatientReport> | null>(null)

function calculateAge(dateOfBirth: string): number {
  if (!dateOfBirth) return 0
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  
  return age
}

function printModal() {
  if (printComponent.value) {
    printComponent.value.printReport()
  }
}

// Edit mode functions
function toggleEdit() {
  isEditing.value = true
  // Copy current patient data to edit form
  editForm.value = { ...props.patient }
}

function cancelEdit() {
  isEditing.value = false
  // Reset form to original patient data
  editForm.value = { ...props.patient }
}

function saveChanges() {
  // Emit the save event with the edited patient data
  emit('save-patient', editForm.value)
  isEditing.value = false
}
</script>

<style scoped>
.patient-detail-modal {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98));
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 1.25rem;
  max-width: 62.5rem;
  width: 90vw;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(30px);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(139, 92, 246, 0.15);
  background: rgba(30, 41, 59, 0.6);
  backdrop-filter: blur(20px);
}

.modal-header h2 {
  margin: 0;
  color: rgba(255, 255, 255, 0.95);
  font-size: 1.5rem;
  font-weight: 600;
}

.modal-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.print-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.75rem;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.6);
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 1);
  transform: rotate(90deg);
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
  background: rgba(0, 0, 0, 0.05);
}

.print-only-wrapper {
  display: none !important;
  position: absolute !important;
  left: -99999px !important;
  top: -99999px !important;
}

@media print {
  /* CRITICAL: Reset and clean the entire page for printing */
  :root,
  html,
  body {
    background: white !important;
    margin: 0 !important;
    padding: 0 !important;
    width: 100% !important;
    height: auto !important;
    overflow: visible !important;
  }
  
  /* Hide the entire application */
  body * {
    visibility: hidden !important;
  }
  
  /* Show only the modal overlay and its contents */
  .modal-overlay,
  .modal-overlay * {
    visibility: visible !important;
  }
  
  /* Reset modal overlay to be a clean container */
  .modal-overlay {
    position: static !important;
    background: white !important;
    backdrop-filter: none !important;
    padding: 0 !important;
    margin: 0 !important;
    width: 100% !important;
    height: auto !important;
    display: block !important;
  }
  
  /* Reset modal container */
  .patient-detail-modal {
    position: static !important;
    width: 100% !important;
    max-width: 100% !important;
    height: auto !important;
    max-height: none !important;
    margin: 0 !important;
    padding: 0 !important;
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    background: white !important;
    overflow: visible !important;
    display: block !important;
  }
  
  /* Hide modal UI elements */
  .modal-header,
  .modal-body,
  .patient-info-section,
  .close-btn,
  .print-btn {
    display: none !important;
    visibility: hidden !important;
  }
  
  /* Show only the printable report */
  .print-only-wrapper {
    display: block !important;
    visibility: visible !important;
    position: static !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    height: auto !important;
  }
}

.print-header {
  display: none;
}

.patient-info-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-radius: 1rem;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.patient-info-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, 
    transparent, 
    rgba(139, 92, 246, 0.6), 
    transparent);
  border-radius: 2px;
}

.patient-info-section:hover {
  transform: translateY(-2px);
  border-color: rgba(139, 92, 246, 0.3);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(139, 92, 246, 0.15);
}

.section-header h3 {
  margin: 0;
  color: rgba(255, 255, 255, 0.95);
  font-size: 1.125rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(15.625rem, 1fr));
  gap: 1.25rem;
  margin-bottom: 1.25rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-item label {
  font-weight: 600;
  color: rgba(139, 92, 246, 0.8);
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-item span {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1rem;
}

.notes-section {
  margin-top: 1.25rem;
  padding-top: 1.25rem;
  border-top: 1px solid rgba(139, 92, 246, 0.15);
}

.notes-section label {
  font-weight: 600;
  color: rgba(139, 92, 246, 0.9);
  margin-bottom: 0.5rem;
  display: block;
}

.notes-section p {
  margin: 0;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.6;
}

/* Edit Form Styles */
.edit-form {
  margin-top: 1.25rem;
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-section {
  background: rgba(255, 255, 255, 0.04);
  border-radius: 1rem;
  padding: 1.5rem;
  border: 1px solid rgba(139, 92, 246, 0.15);
  backdrop-filter: blur(20px);
}

.form-section h4 {
  margin: 0 0 1rem 0;
  color: rgba(255, 255, 255, 0.95);
  font-size: 1.125rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12.5rem, 1fr));
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.form-group label {
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 0.75rem;
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 0.75rem;
  font-size: 0.875rem;
  background: rgba(30, 41, 59, 0.6);
  color: rgba(255, 255, 255, 0.9);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: rgba(139, 92, 246, 0.5);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.15);
}

.form-group textarea {
  resize: vertical;
  min-height: 5rem;
  line-height: 1.5;
}

.btn {
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  backdrop-filter: blur(20px);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

.btn-outline {
  background: rgba(107, 114, 128, 0.2);
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(107, 114, 128, 0.3);
}

.btn-outline:hover:not(:disabled) {
  background: rgba(107, 114, 128, 0.3);
  border-color: rgba(107, 114, 128, 0.5);
  transform: translateY(-2px);
}

.btn-primary {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.9) 0%, rgba(124, 58, 237, 0.95) 100%);
  color: white;
  border: 1px solid rgba(139, 92, 246, 0.3);
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(139, 92, 246, 1) 0%, rgba(124, 58, 237, 1) 100%);
  border-color: rgba(139, 92, 246, 0.5);
  transform: translateY(-2px);
}

.btn-success {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(5, 150, 105, 0.95) 100%);
  color: white;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.btn-success:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(16, 185, 129, 1) 0%, rgba(5, 150, 105, 1) 100%);
  border-color: rgba(16, 185, 129, 0.5);
  transform: translateY(-2px);
}

.btn-secondary {
  background: rgba(107, 114, 128, 0.2);
  color: white;
  border: 1px solid rgba(107, 114, 128, 0.3);
}

.btn-secondary:hover:not(:disabled) {
  background: rgba(107, 114, 128, 0.3);
  border-color: rgba(107, 114, 128, 0.5);
  transform: translateY(-2px);
}

/* Responsive Design */
@media (max-width: 1024px) {
  .patient-detail-modal {
    width: 95vw;
  }
  
  .modal-body {
    padding: 1.25rem;
  }
  
  .patient-info-section {
    padding: 1.25rem;
  }
}

@media (max-width: 768px) {
  .patient-detail-modal {
    width: 100vw;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
  }
  
  .modal-header {
    padding: 1.25rem;
  }
  
  .modal-header h2 {
    font-size: 1.25rem;
  }
  
  .modal-actions {
    gap: 0.5rem;
  }
  
  .print-btn {
    font-size: 0.8rem;
    padding: 0.375rem 0.75rem;
  }
  
  .modal-body {
    padding: 1rem;
  }
  
  .patient-info-section {
    padding: 1rem;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
}

@media (max-width: 480px) {
  .modal-header {
    padding: 0.75rem;
    gap: 0.5rem;
  }
  
  .modal-header h2 {
    font-size: 1.1rem;
    flex: 1;
  }
  
  .modal-actions {
    flex-direction: row;
    gap: 0.375rem;
    flex-shrink: 0;
  }
  
  .modal-actions .btn {
    padding: 0.5rem 0.625rem;
    font-size: 1.2rem;
    min-width: auto;
  }
  
  .modal-actions .btn .btn-text {
    display: none;
  }
  
  .close-btn {
    font-size: 1.5rem;
    width: 2rem;
    height: 2rem;
  }
  
  .modal-body {
    padding: 0.75rem;
  }
  
  .patient-info-section {
    padding: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .info-item label {
    font-size: 0.8rem;
  }
  
  .info-item span {
    font-size: 0.95rem;
  }
}

/* Touch device improvements */
@media (hover: none) and (pointer: coarse) {
  .patient-info-section:hover {
    transform: none;
    border-color: rgba(139, 92, 246, 0.15);
  }
  
  .btn:hover {
    transform: none !important;
  }
  
  .close-btn:hover {
    transform: none;
  }
}
</style>