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
        @add-medication="$emit('add-medication')"
        @edit-medication="$emit('edit-medication', $event)"
        @delete-medication="$emit('delete-medication', $event)"
      />
    </div>

    <!-- Hidden Printable Component - Only for printing -->
    <div class="print-only-wrapper">
      <PrintablePatientReport 
        ref="printComponent"
        :patient="patient"
        :medications="medications"
        :appointments="[]"
        :providers="providers"
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
  relationship?: string
  gender?: string
  phone?: string
  city?: string
  state?: string
  occupation?: string
  occupation_description?: string
  languages?: string
  primary_doctor_id?: string
  insurance_provider?: string
  insurance_id?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  notes?: string
}

interface Provider {
  id: string
  name: string
  specialty?: string
  phone?: string
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
  providers: Provider[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  'add-medication': []
  'edit-medication': [medication: Medication]
  'delete-medication': [medication: Medication]
  'save-patient': [patient: Patient]
}>()

// Edit mode state
const isEditing = ref(false)
const editForm = ref<Patient>({
  id: '',
  name: '',
  date_of_birth: '',
  relationship: '',
  gender: '',
  phone: '',
  primary_doctor_id: '',
  insurance_provider: '',
  insurance_id: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
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
  background: var(--bg-main);
  border: var(--border);
  border-radius: 12px;
  max-width: 1000px;
  width: 90vw;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-strong);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: var(--border);
  background: var(--bg-panel);
}

.modal-header h2 {
  margin: 0;
  color: var(--text-heading);
  font-size: 1.75rem;
  font-weight: 600;
}

.modal-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.print-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.875rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: var(--text-muted);
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: var(--bg-hover);
  color: var(--text-heading);
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
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
  margin-bottom: 32px;
  padding: 24px;
  background: var(--bg-glass);
  backdrop-filter: var(--blur);
  border: var(--border);
  border-radius: 12px;
  transition: all 0.2s ease;
}

.patient-info-section:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-soft);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: var(--border);
}

.section-header h3 {
  margin: 0;
  color: var(--text-heading);
  font-size: 1.25rem;
  font-weight: 600;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item label {
  font-weight: 600;
  color: var(--text-muted);
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-item span {
  color: var(--text-main);
  font-size: 1rem;
}

.notes-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: var(--border);
}

.notes-section label {
  font-weight: 600;
  color: var(--text-heading);
  margin-bottom: 8px;
  display: block;
}

.notes-section p {
  margin: 0;
  color: var(--text-main);
  line-height: 1.6;
}

/* Edit Form Styles */
.edit-form {
  margin-top: 20px;
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-section {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid var(--border-light);
}

.form-section h4 {
  margin: 0 0 16px 0;
  color: var(--text-heading);
  font-size: 1.1rem;
  font-weight: 600;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-weight: 600;
  color: var(--text-heading);
  font-size: 0.9rem;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 0.95rem;
  background: var(--bg-main);
  color: var(--text-main);
  transition: border-color 0.2s ease;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-alpha);
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
  line-height: 1.5;
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
  white-space: nowrap;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.btn-sm {
  padding: 8px 16px;
  font-size: 0.875rem;
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

.btn-primary {
  background: var(--primary);
  color: white;
  border: 2px solid var(--primary);
  box-shadow: 0 2px 4px rgba(99, 102, 241, 0.2);
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-hover, #5b21b6);
  border-color: var(--primary-hover, #5b21b6);
  box-shadow: var(--glow-purple);
  transform: translateY(-1px);
}

.btn-success {
  background: #10b981;
  color: white;
  border: 2px solid #10b981;
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
}

.btn-success:hover:not(:disabled) {
  background: #059669;
  border-color: #059669;
  box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
  transform: translateY(-1px);
}

.btn-secondary {
  background: #6b7280;
  color: white;
  border: 2px solid #6b7280;
  box-shadow: 0 2px 4px rgba(107, 114, 128, 0.2);
}

.btn-secondary:hover:not(:disabled) {
  background: #4b5563;
  border-color: #4b5563;
  box-shadow: 0 4px 8px rgba(107, 114, 128, 0.3);
  transform: translateY(-1px);
}

/* Responsive Design */
@media (max-width: 1024px) {
  .patient-detail-modal {
    width: 95vw;
  }
  
  .modal-body {
    padding: 20px;
  }
  
  .patient-info-section {
    padding: 20px;
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
    padding: 20px;
  }
  
  .modal-header h2 {
    font-size: 1.5rem;
  }
  
  .modal-actions {
    gap: 8px;
  }
  
  .print-btn {
    font-size: 0.8rem;
    padding: 6px 12px;
  }
  
  .modal-body {
    padding: 16px;
  }
  
  .patient-info-section {
    padding: 16px;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .modal-header {
    padding: 12px;
    gap: 8px;
  }
  
  .modal-header h2 {
    font-size: 1.1rem;
    flex: 1;
  }
  
  .modal-actions {
    flex-direction: row;
    gap: 6px;
    flex-shrink: 0;
  }
  
  .modal-actions .btn {
    padding: 8px 10px;
    font-size: 1.2rem;
    min-width: auto;
  }
  
  .modal-actions .btn .btn-text {
    display: none;
  }
  
  .close-btn {
    font-size: 1.5rem;
    width: 32px;
    height: 32px;
  }
  
  .modal-body {
    padding: 12px;
  }
  
  .patient-info-section {
    padding: 16px;
    margin-bottom: 24px;
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
    box-shadow: none;
  }
  
  .btn:hover {
    transform: none !important;
  }
  
  .close-btn:hover {
    background: var(--bg-hover);
  }
}
</style>