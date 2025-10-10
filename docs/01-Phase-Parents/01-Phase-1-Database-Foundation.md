# Phase 1: Database Foundation & Schema Extension

## Overview

Phase 1 focuses on extending the existing SQLite database to support eldercare management while maintaining backward compatibility with the current chat system.

## 🎯 **Goals**

- Add eldercare-specific tables to existing database
- Maintain all current functionality
- Establish proper relationships and constraints
- Create migration scripts for smooth transition
- Preserve existing data integrity

## 📊 **New Database Schema**

### **Core Eldercare Tables**

#### 1. **patients** - Core patient information
```sql
CREATE TABLE patients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  date_of_birth TEXT,
  relationship TEXT, -- 'mother', 'father', 'spouse', etc.
  gender TEXT,
  phone TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  primary_doctor TEXT,
  insurance_provider TEXT,
  insurance_id TEXT,
  notes TEXT,
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. **medical_records** - Comprehensive health records
```sql
CREATE TABLE medical_records (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  record_type TEXT NOT NULL, -- 'diagnosis', 'treatment', 'test_result', 'incident', 'note'
  title TEXT NOT NULL,
  description TEXT,
  date_recorded TEXT NOT NULL,
  provider_name TEXT,
  location TEXT,
  importance_score REAL DEFAULT 0.7,
  tags TEXT, -- JSON array of tags
  attachments TEXT, -- JSON array of file paths
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);
```

#### 3. **medications** - Medication tracking
```sql
CREATE TABLE medications (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  name TEXT NOT NULL,
  generic_name TEXT,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL, -- 'daily', 'twice_daily', 'as_needed', etc.
  route TEXT, -- 'oral', 'topical', 'injection', etc.
  prescribing_doctor TEXT,
  pharmacy TEXT,
  start_date TEXT NOT NULL,
  end_date TEXT,
  refills_remaining INTEGER,
  side_effects TEXT,
  notes TEXT,
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);
```

#### 4. **healthcare_providers** - Doctor and provider directory
```sql
CREATE TABLE healthcare_providers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  specialty TEXT,
  practice_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  preferred INTEGER DEFAULT 0, -- Mark preferred providers
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

#### 5. **appointments** - Appointment management
```sql
CREATE TABLE appointments (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  provider_id TEXT,
  appointment_date TEXT NOT NULL,
  appointment_time TEXT,
  appointment_type TEXT, -- 'routine', 'follow_up', 'emergency', 'specialist'
  location TEXT,
  notes TEXT,
  preparation_notes TEXT, -- What to bring, prep instructions
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled', 'rescheduled'
  outcome_summary TEXT, -- Post-appointment notes
  follow_up_required INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (provider_id) REFERENCES healthcare_providers(id)
);
```

#### 6. **vitals** - Vital signs and measurements
```sql
CREATE TABLE vitals (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  measurement_type TEXT NOT NULL, -- 'blood_pressure', 'weight', 'temperature', 'heart_rate', 'blood_sugar'
  systolic INTEGER, -- For blood pressure
  diastolic INTEGER, -- For blood pressure
  value REAL, -- For single-value measurements
  unit TEXT, -- 'lbs', 'kg', 'F', 'C', 'bpm', 'mg/dL'
  notes TEXT,
  measured_at TEXT NOT NULL,
  measured_by TEXT, -- Who took the measurement
  location TEXT, -- Where measured (home, doctor's office)
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);
```

#### 7. **medication_logs** - Medication adherence tracking
```sql
CREATE TABLE medication_logs (
  id TEXT PRIMARY KEY,
  medication_id TEXT NOT NULL,
  patient_id TEXT NOT NULL,
  scheduled_time TEXT NOT NULL,
  actual_time TEXT,
  status TEXT NOT NULL, -- 'taken', 'missed', 'late', 'skipped'
  notes TEXT,
  reminder_sent INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (medication_id) REFERENCES medications(id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);
```

#### 8. **Note: care_plans table removed** - Will be handled in future phases

## 🔄 **Existing Table Extensions**

### **Extend sessions table for care sessions**
```sql
-- Add eldercare-specific columns to existing sessions table
ALTER TABLE sessions ADD COLUMN session_type TEXT DEFAULT 'chat'; -- 'chat', 'care_planning', 'medical_review', 'medication_check'
ALTER TABLE sessions ADD COLUMN patient_id TEXT;
ALTER TABLE sessions ADD COLUMN related_record_id TEXT; -- Link to specific medical record, appointment, etc.
ALTER TABLE sessions ADD COLUMN care_category TEXT; -- 'general', 'medication', 'appointment', 'emergency'

-- Add foreign key constraint (will be handled in migration)
-- FOREIGN KEY (patient_id) REFERENCES patients(id)
```

### **Extend personas for eldercare specialists**
```sql
-- Add eldercare-specific columns to existing personas table
ALTER TABLE personas ADD COLUMN eldercare_specialty TEXT; -- 'medication', 'documentation', 'scheduling', 'emergency'
ALTER TABLE personas ADD COLUMN patient_context INTEGER DEFAULT 0; -- Whether this persona should have patient context
```

### **Extend semantic_pins for medical pins**
```sql
-- Add medical-specific columns to existing semantic_pins table
ALTER TABLE semantic_pins ADD COLUMN medical_category TEXT; -- 'allergy', 'medication', 'emergency', 'preference'
ALTER TABLE semantic_pins ADD COLUMN patient_id TEXT;
ALTER TABLE semantic_pins ADD COLUMN urgency_level TEXT DEFAULT 'normal'; -- 'low', 'normal', 'high', 'critical'

-- FOREIGN KEY (patient_id) REFERENCES patients(id)
```

## 📈 **Indexes for Performance**

```sql
-- Patient-related indexes
CREATE INDEX idx_medical_records_patient_date ON medical_records(patient_id, date_recorded DESC);
CREATE INDEX idx_medications_patient_active ON medications(patient_id, active, start_date DESC);
CREATE INDEX idx_appointments_patient_date ON appointments(patient_id, appointment_date ASC);
CREATE INDEX idx_vitals_patient_type_date ON vitals(patient_id, measurement_type, measured_at DESC);
CREATE INDEX idx_medication_logs_patient_scheduled ON medication_logs(patient_id, scheduled_time DESC);

-- Search and filtering indexes
CREATE INDEX idx_medical_records_type_date ON medical_records(record_type, date_recorded DESC);
CREATE INDEX idx_appointments_status_date ON appointments(status, appointment_date ASC);

-- Enhanced existing indexes for eldercare
CREATE INDEX idx_sessions_patient_type ON sessions(patient_id, session_type, updated_at DESC);
CREATE INDEX idx_semantic_pins_patient_medical ON semantic_pins(patient_id, medical_category, importance_score DESC);
```

## 🛠️ **Migration Strategy**

### **Migration Script Structure**
```typescript
// backend/db/migrations/001-eldercare-schema.ts

export function migrateToEldercare(db: Database) {
  const migrations = [
    // 1. Create new tables
    createPatientsTable,
    createMedicalRecordsTable,
    createMedicationsTable,
    createHealthcareProvidersTable,
    createAppointmentsTable,
    createVitalsTable,
    createMedicationLogsTable,
    
    // 2. Extend existing tables
    extendSessionsTable,
    extendPersonasTable,
    extendSemanticPinsTable,
    
    // 3. Create indexes
    createElderCareIndexes,
    
    // 4. Seed default data
    seedElderCarePersonas,
    seedDefaultPatients
  ]
  
  db.transaction(() => {
    migrations.forEach(migration => migration(db))
  })()
}
```

### **Safe Migration Process**
1. **Backup existing database**
2. **Run schema additions** (new tables first)
3. **Extend existing tables** (backward compatible)
4. **Create performance indexes**
5. **Seed default eldercare data**
6. **Verify data integrity**

## 🎯 **Default Data Seeding**

### **Default Eldercare Personas**
```sql
INSERT INTO personas (
  id, name, prompt, description, icon, category,
  eldercare_specialty, patient_context, temperature, maxTokens, is_default
) VALUES 
(
  'medical-documentation',
  'Medical Documentation Assistant',
  'You are a medical documentation specialist. Help create clear, organized summaries of patient information, doctor visits, and care plans. Always maintain medical accuracy and patient privacy.',
  'Specialized in creating medical summaries and documentation',
  '📋',
  'local',
  'documentation',
  1,
  0.3,
  1000,
  1
),
(
  'medication-manager',
  'Medication Manager',
  'You are a medication management assistant. Help track medications, identify potential interactions, create dosing schedules, and remind about medication adherence. Always prioritize patient safety.',
  'Focused on medication tracking and safety',
  '💊',
  'local',
  'medication',
  1,
  0.2,
  800,
  1
),
(
  'care-coordinator',
  'Care Coordinator',
  'You are a care coordination assistant. Help organize appointments, communicate with healthcare providers, manage care logistics, and ensure continuity of care.',
  'Specialized in care coordination and scheduling',
  '🗓️',
  'cloud',
  'scheduling',
  1,
  0.4,
  1200,
  1
),
(
  'emergency-assistant',
  'Emergency Information Assistant',
  'You are an emergency preparedness assistant. Provide quick access to critical medical information, emergency contacts, and important care instructions. Always prioritize accuracy and speed.',
  'Quick access to emergency medical information',
  '🚨',
  'local',
  'emergency',
  1,
  0.1,
  500,
  1
);
```

## ✅ **Validation & Testing**

### **Data Integrity Checks**
```sql
-- Verify foreign key constraints
PRAGMA foreign_key_check;

-- Check for orphaned records
SELECT 'orphaned_medical_records' as issue, count(*) as count
FROM medical_records mr
LEFT JOIN patients p ON mr.patient_id = p.id
WHERE p.id IS NULL;

-- Verify indexes were created
SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%';
```

### **Performance Benchmarks**
- Patient data retrieval: < 100ms
- Medical record queries: < 200ms
- Medication schedule generation: < 50ms
- Appointment listing: < 150ms

## 📋 **Phase 1 Deliverables**

1. ✅ **Extended Database Schema** - 7 eldercare tables created
2. ✅ **Migration Scripts** - Safe, repeatable database updates
3. ✅ **Performance Indexes** - Optimized query performance
4. ✅ **Default Eldercare Personas** - Ready-to-use AI assistants
5. ✅ **Data Integrity Validation** - Comprehensive testing scripts
6. ✅ **Backup Procedures** - Enhanced backup for medical data
7. ✅ **Vue.js Form Components** - Ready-to-use frontend forms for data entry

## 🎨 **Frontend Vue.js Components**

### **Component Overview**
Create Vue.js components for each major data entry form to provide immediate UI for entering eldercare data:

#### 1. **PatientForm.vue** - Core patient information entry
```vue
<template>
  <div class="patient-form">
    <h2>{{ isEditing ? 'Edit Patient' : 'Add New Patient' }}</h2>
    
    <form @submit.prevent="submitForm" class="form-container">
      <!-- Basic Information -->
      <div class="form-section">
        <h3>Basic Information</h3>
        
        <div class="form-group">
          <label for="name">Full Name *</label>
          <input 
            id="name"
            v-model="form.name" 
            type="text" 
            required 
            placeholder="Enter patient's full name"
          />
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="date_of_birth">Date of Birth</label>
            <input 
              id="date_of_birth"
              v-model="form.date_of_birth" 
              type="date"
            />
          </div>
          
          <div class="form-group">
            <label for="relationship">Relationship</label>
            <select id="relationship" v-model="form.relationship">
              <option value="">Select relationship</option>
              <option value="mother">Mother</option>
              <option value="father">Father</option>
              <option value="spouse">Spouse</option>
              <option value="self">Self</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="gender">Gender</label>
            <select id="gender" v-model="form.gender">
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Contact Information -->
      <div class="form-section">
        <h3>Contact Information</h3>
        
        <div class="form-row">
          <div class="form-group">
            <label for="phone">Phone Number</label>
            <input 
              id="phone"
              v-model="form.phone" 
              type="tel" 
              placeholder="(555) 123-4567"
            />
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="emergency_contact_name">Emergency Contact Name</label>
            <input 
              id="emergency_contact_name"
              v-model="form.emergency_contact_name" 
              type="text" 
              placeholder="Emergency contact full name"
            />
          </div>
          
          <div class="form-group">
            <label for="emergency_contact_phone">Emergency Contact Phone</label>
            <input 
              id="emergency_contact_phone"
              v-model="form.emergency_contact_phone" 
              type="tel" 
              placeholder="(555) 987-6543"
            />
          </div>
        </div>
      </div>

      <!-- Medical Information -->
      <div class="form-section">
        <h3>Medical Information</h3>
        
        <div class="form-row">
          <div class="form-group">
            <label for="primary_doctor">Primary Doctor</label>
            <input 
              id="primary_doctor"
              v-model="form.primary_doctor" 
              type="text" 
              placeholder="Dr. Smith"
            />
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="insurance_provider">Insurance Provider</label>
            <input 
              id="insurance_provider"
              v-model="form.insurance_provider" 
              type="text" 
              placeholder="Insurance company name"
            />
          </div>
          
          <div class="form-group">
            <label for="insurance_id">Insurance ID</label>
            <input 
              id="insurance_id"
              v-model="form.insurance_id" 
              type="text" 
              placeholder="Insurance member ID"
            />
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div class="form-section">
        <div class="form-group">
          <label for="notes">Additional Notes</label>
          <textarea 
            id="notes"
            v-model="form.notes" 
            rows="4" 
            placeholder="Any additional information about the patient..."
          ></textarea>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <button type="button" @click="$emit('cancel')" class="btn btn-secondary">
          Cancel
        </button>
        <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
          {{ isSubmitting ? 'Saving...' : (isEditing ? 'Update Patient' : 'Add Patient') }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface PatientForm {
  name: string
  date_of_birth: string
  relationship: string
  gender: string
  phone: string
  emergency_contact_name: string
  emergency_contact_phone: string
  primary_doctor: string
  insurance_provider: string
  insurance_id: string
  notes: string
}

interface Props {
  patient?: any
  isEditing?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isEditing: false
})

const emit = defineEmits<{
  save: [patient: PatientForm]
  cancel: []
}>()

const isSubmitting = ref(false)

const form = ref<PatientForm>({
  name: '',
  date_of_birth: '',
  relationship: '',
  gender: '',
  phone: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  primary_doctor: '',
  insurance_provider: '',
  insurance_id: '',
  notes: ''
})

onMounted(() => {
  if (props.patient) {
    Object.assign(form.value, props.patient)
  }
})

async function submitForm() {
  isSubmitting.value = true
  
  try {
    emit('save', { ...form.value })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.patient-form {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.form-container {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.form-section {
  margin-bottom: 32px;
}

.form-section h3 {
  margin: 0 0 16px 0;
  color: #2d3748;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 8px;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
  color: #4a5568;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e2e8f0;
}

.btn {
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  border: none;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-primary:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background: #e5e7eb;
}
</style>
```

#### 2. **MedicationForm.vue** - Medication entry and management
```vue
<template>
  <div class="medication-form">
    <h2>{{ isEditing ? 'Edit Medication' : 'Add New Medication' }}</h2>
    
    <form @submit.prevent="submitForm" class="form-container">
      <!-- Patient Selection -->
      <div class="form-section">
        <h3>Patient</h3>
        <div class="form-group">
          <label for="patient_id">Select Patient *</label>
          <select id="patient_id" v-model="form.patient_id" required>
            <option value="">Choose a patient</option>
            <option v-for="patient in patients" :key="patient.id" :value="patient.id">
              {{ patient.name }}
            </option>
          </select>
        </div>
      </div>

      <!-- Medication Details -->
      <div class="form-section">
        <h3>Medication Information</h3>
        
        <div class="form-row">
          <div class="form-group">
            <label for="name">Medication Name *</label>
            <input 
              id="name"
              v-model="form.name" 
              type="text" 
              required 
              placeholder="e.g., Lisinopril"
            />
          </div>
          
          <div class="form-group">
            <label for="generic_name">Generic Name</label>
            <input 
              id="generic_name"
              v-model="form.generic_name" 
              type="text" 
              placeholder="e.g., ACE inhibitor"
            />
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="dosage">Dosage *</label>
            <input 
              id="dosage"
              v-model="form.dosage" 
              type="text" 
              required 
              placeholder="e.g., 10mg"
            />
          </div>
          
          <div class="form-group">
            <label for="frequency">Frequency *</label>
            <select id="frequency" v-model="form.frequency" required>
              <option value="">Select frequency</option>
              <option value="once_daily">Once daily</option>
              <option value="twice_daily">Twice daily</option>
              <option value="three_times_daily">Three times daily</option>
              <option value="four_times_daily">Four times daily</option>
              <option value="as_needed">As needed</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="route">Route</label>
            <select id="route" v-model="form.route">
              <option value="">Select route</option>
              <option value="oral">Oral</option>
              <option value="topical">Topical</option>
              <option value="injection">Injection</option>
              <option value="inhaled">Inhaled</option>
              <option value="eye_drops">Eye drops</option>
              <option value="nasal">Nasal</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Prescription Details -->
      <div class="form-section">
        <h3>Prescription Details</h3>
        
        <div class="form-row">
          <div class="form-group">
            <label for="prescribing_doctor">Prescribing Doctor</label>
            <input 
              id="prescribing_doctor"
              v-model="form.prescribing_doctor" 
              type="text" 
              placeholder="Dr. Smith"
            />
          </div>
          
          <div class="form-group">
            <label for="pharmacy">Pharmacy</label>
            <input 
              id="pharmacy"
              v-model="form.pharmacy" 
              type="text" 
              placeholder="CVS Pharmacy"
            />
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="start_date">Start Date *</label>
            <input 
              id="start_date"
              v-model="form.start_date" 
              type="date" 
              required
            />
          </div>
          
          <div class="form-group">
            <label for="end_date">End Date</label>
            <input 
              id="end_date"
              v-model="form.end_date" 
              type="date"
            />
          </div>
          
          <div class="form-group">
            <label for="refills_remaining">Refills Remaining</label>
            <input 
              id="refills_remaining"
              v-model.number="form.refills_remaining" 
              type="number" 
              min="0"
              placeholder="0"
            />
          </div>
        </div>
      </div>

      <!-- Additional Information -->
      <div class="form-section">
        <div class="form-group">
          <label for="side_effects">Known Side Effects</label>
          <textarea 
            id="side_effects"
            v-model="form.side_effects" 
            rows="3" 
            placeholder="List any known side effects..."
          ></textarea>
        </div>
        
        <div class="form-group">
          <label for="notes">Additional Notes</label>
          <textarea 
            id="notes"
            v-model="form.notes" 
            rows="3" 
            placeholder="Instructions, warnings, or other notes..."
          ></textarea>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <button type="button" @click="$emit('cancel')" class="btn btn-secondary">
          Cancel
        </button>
        <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
          {{ isSubmitting ? 'Saving...' : (isEditing ? 'Update Medication' : 'Add Medication') }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface MedicationForm {
  patient_id: string
  name: string
  generic_name: string
  dosage: string
  frequency: string
  route: string
  prescribing_doctor: string
  pharmacy: string
  start_date: string
  end_date: string
  refills_remaining: number | null
  side_effects: string
  notes: string
}

interface Props {
  medication?: any
  patients: Array<{ id: string, name: string }>
  isEditing?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isEditing: false
})

const emit = defineEmits<{
  save: [medication: MedicationForm]
  cancel: []
}>()

const isSubmitting = ref(false)

const form = ref<MedicationForm>({
  patient_id: '',
  name: '',
  generic_name: '',
  dosage: '',
  frequency: '',
  route: '',
  prescribing_doctor: '',
  pharmacy: '',
  start_date: '',
  end_date: '',
  refills_remaining: null,
  side_effects: '',
  notes: ''
})

onMounted(() => {
  if (props.medication) {
    Object.assign(form.value, props.medication)
  }
})

async function submitForm() {
  isSubmitting.value = true
  
  try {
    emit('save', { ...form.value })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
/* Reuse the same styles as PatientForm.vue */
.medication-form {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.form-container {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.form-section {
  margin-bottom: 32px;
}

.form-section h3 {
  margin: 0 0 16px 0;
  color: #2d3748;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 8px;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
  color: #4a5568;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e2e8f0;
}

.btn {
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  border: none;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-primary:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background: #e5e7eb;
}
</style>
```

#### 3. **VitalsForm.vue** - Quick vital signs entry
```vue
<template>
  <div class="vitals-form">
    <h2>Record Vital Signs</h2>
    
    <form @submit.prevent="submitForm" class="form-container">
      <!-- Patient Selection -->
      <div class="form-section">
        <div class="form-group">
          <label for="patient_id">Select Patient *</label>
          <select id="patient_id" v-model="form.patient_id" required>
            <option value="">Choose a patient</option>
            <option v-for="patient in patients" :key="patient.id" :value="patient.id">
              {{ patient.name }}
            </option>
          </select>
        </div>
      </div>

      <!-- Measurement Type -->
      <div class="form-section">
        <div class="form-group">
          <label for="measurement_type">Measurement Type *</label>
          <select id="measurement_type" v-model="form.measurement_type" required @change="resetValues">
            <option value="">Select measurement type</option>
            <option value="blood_pressure">Blood Pressure</option>
            <option value="weight">Weight</option>
            <option value="temperature">Temperature</option>
            <option value="heart_rate">Heart Rate</option>
            <option value="blood_sugar">Blood Sugar</option>
            <option value="oxygen_saturation">Oxygen Saturation</option>
          </select>
        </div>
      </div>

      <!-- Dynamic Value Input Based on Type -->
      <div class="form-section">
        <h3>Measurement Values</h3>
        
        <!-- Blood Pressure -->
        <div v-if="form.measurement_type === 'blood_pressure'" class="form-row">
          <div class="form-group">
            <label for="systolic">Systolic *</label>
            <input 
              id="systolic"
              v-model.number="form.systolic" 
              type="number" 
              required 
              placeholder="120"
              min="60"
              max="300"
            />
          </div>
          
          <div class="form-group">
            <label for="diastolic">Diastolic *</label>
            <input 
              id="diastolic"
              v-model.number="form.diastolic" 
              type="number" 
              required 
              placeholder="80"
              min="40"
              max="200"
            />
          </div>
        </div>
        
        <!-- Single Value Measurements -->
        <div v-else-if="form.measurement_type" class="form-row">
          <div class="form-group">
            <label for="value">{{ getValueLabel() }} *</label>
            <input 
              id="value"
              v-model.number="form.value" 
              type="number" 
              step="0.1"
              required 
              :placeholder="getValuePlaceholder()"
            />
          </div>
          
          <div class="form-group">
            <label for="unit">Unit</label>
            <select id="unit" v-model="form.unit">
              <option v-for="unit in getUnitsForType()" :key="unit" :value="unit">
                {{ unit }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Measurement Details -->
      <div class="form-section">
        <h3>Measurement Details</h3>
        
        <div class="form-row">
          <div class="form-group">
            <label for="measured_at">Date & Time *</label>
            <input 
              id="measured_at"
              v-model="form.measured_at" 
              type="datetime-local" 
              required
            />
          </div>
          
          <div class="form-group">
            <label for="measured_by">Measured By</label>
            <input 
              id="measured_by"
              v-model="form.measured_by" 
              type="text" 
              placeholder="Who took the measurement"
            />
          </div>
          
          <div class="form-group">
            <label for="location">Location</label>
            <select id="location" v-model="form.location">
              <option value="">Select location</option>
              <option value="home">Home</option>
              <option value="doctors_office">Doctor's Office</option>
              <option value="hospital">Hospital</option>
              <option value="pharmacy">Pharmacy</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        
        <div class="form-group">
          <label for="notes">Notes</label>
          <textarea 
            id="notes"
            v-model="form.notes" 
            rows="3" 
            placeholder="Any additional observations or notes..."
          ></textarea>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <button type="button" @click="$emit('cancel')" class="btn btn-secondary">
          Cancel
        </button>
        <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
          {{ isSubmitting ? 'Saving...' : 'Record Vital Signs' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface VitalsForm {
  patient_id: string
  measurement_type: string
  systolic: number | null
  diastolic: number | null
  value: number | null
  unit: string
  notes: string
  measured_at: string
  measured_by: string
  location: string
}

interface Props {
  patients: Array<{ id: string, name: string }>
}

const props = defineProps<Props>()

const emit = defineEmits<{
  save: [vitals: VitalsForm]
  cancel: []
}>()

const isSubmitting = ref(false)

const form = ref<VitalsForm>({
  patient_id: '',
  measurement_type: '',
  systolic: null,
  diastolic: null,
  value: null,
  unit: '',
  notes: '',
  measured_at: '',
  measured_by: '',
  location: ''
})

onMounted(() => {
  // Set default date/time to now
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  form.value.measured_at = now.toISOString().slice(0, 16)
})

function resetValues() {
  form.value.systolic = null
  form.value.diastolic = null
  form.value.value = null
  form.value.unit = getDefaultUnit()
}

function getValueLabel(): string {
  const labels: Record<string, string> = {
    weight: 'Weight',
    temperature: 'Temperature',
    heart_rate: 'Heart Rate',
    blood_sugar: 'Blood Sugar Level',
    oxygen_saturation: 'Oxygen Saturation'
  }
  return labels[form.value.measurement_type] || 'Value'
}

function getValuePlaceholder(): string {
  const placeholders: Record<string, string> = {
    weight: '150',
    temperature: '98.6',
    heart_rate: '72',
    blood_sugar: '100',
    oxygen_saturation: '98'
  }
  return placeholders[form.value.measurement_type] || ''
}

function getUnitsForType(): string[] {
  const units: Record<string, string[]> = {
    weight: ['lbs', 'kg'],
    temperature: ['°F', '°C'],
    heart_rate: ['bpm'],
    blood_sugar: ['mg/dL', 'mmol/L'],
    oxygen_saturation: ['%']
  }
  return units[form.value.measurement_type] || ['']
}

function getDefaultUnit(): string {
  const defaults: Record<string, string> = {
    weight: 'lbs',
    temperature: '°F',
    heart_rate: 'bpm',
    blood_sugar: 'mg/dL',
    oxygen_saturation: '%'
  }
  return defaults[form.value.measurement_type] || ''
}

async function submitForm() {
  isSubmitting.value = true
  
  try {
    emit('save', { ...form.value })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
/* Same styling as previous components */
.vitals-form {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.form-container {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.form-section {
  margin-bottom: 32px;
}

.form-section h3 {
  margin: 0 0 16px 0;
  color: #2d3748;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 8px;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
  color: #4a5568;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e2e8f0;
}

.btn {
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  border: none;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-primary:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background: #e5e7eb;
}
</style>
```

#### 4. **AppointmentForm.vue** - Appointment scheduling
```vue
<template>
  <div class="appointment-form">
    <h2>{{ isEditing ? 'Edit Appointment' : 'Schedule New Appointment' }}</h2>
    
    <form @submit.prevent="submitForm" class="form-container">
      <!-- Patient Selection -->
      <div class="form-section">
        <div class="form-group">
          <label for="patient_id">Select Patient *</label>
          <select id="patient_id" v-model="form.patient_id" required>
            <option value="">Choose a patient</option>
            <option v-for="patient in patients" :key="patient.id" :value="patient.id">
              {{ patient.name }}
            </option>
          </select>
        </div>
      </div>

      <!-- Appointment Details -->
      <div class="form-section">
        <h3>Appointment Details</h3>
        
        <div class="form-row">
          <div class="form-group">
            <label for="appointment_date">Date *</label>
            <input 
              id="appointment_date"
              v-model="form.appointment_date" 
              type="date" 
              required
            />
          </div>
          
          <div class="form-group">
            <label for="appointment_time">Time</label>
            <input 
              id="appointment_time"
              v-model="form.appointment_time" 
              type="time"
            />
          </div>
          
          <div class="form-group">
            <label for="appointment_type">Type</label>
            <select id="appointment_type" v-model="form.appointment_type">
              <option value="">Select appointment type</option>
              <option value="routine">Routine Check-up</option>
              <option value="follow_up">Follow-up</option>
              <option value="specialist">Specialist Consultation</option>
              <option value="emergency">Emergency</option>
              <option value="procedure">Procedure</option>
              <option value="lab_work">Lab Work</option>
              <option value="imaging">Imaging</option>
            </select>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="provider_id">Healthcare Provider</label>
            <select id="provider_id" v-model="form.provider_id">
              <option value="">Select provider</option>
              <option v-for="provider in providers" :key="provider.id" :value="provider.id">
                {{ provider.name }} - {{ provider.specialty }}
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="location">Location</label>
            <input 
              id="location"
              v-model="form.location" 
              type="text" 
              placeholder="Clinic name or address"
            />
          </div>
        </div>
      </div>

      <!-- Preparation & Notes -->
      <div class="form-section">
        <h3>Preparation & Notes</h3>
        
        <div class="form-group">
          <label for="preparation_notes">Preparation Instructions</label>
          <textarea 
            id="preparation_notes"
            v-model="form.preparation_notes" 
            rows="3" 
            placeholder="What to bring, fasting requirements, medications to take/avoid..."
          ></textarea>
        </div>
        
        <div class="form-group">
          <label for="notes">Additional Notes</label>
          <textarea 
            id="notes"
            v-model="form.notes" 
            rows="3" 
            placeholder="Reason for visit, symptoms to discuss, questions to ask..."
          ></textarea>
        </div>
      </div>

      <!-- Status (for editing existing appointments) -->
      <div v-if="isEditing" class="form-section">
        <h3>Appointment Status</h3>
        
        <div class="form-row">
          <div class="form-group">
            <label for="status">Status</label>
            <select id="status" v-model="form.status">
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="rescheduled">Rescheduled</option>
            </select>
          </div>
        </div>
        
        <div v-if="form.status === 'completed'" class="form-group">
          <label for="outcome_summary">Appointment Summary</label>
          <textarea 
            id="outcome_summary"
            v-model="form.outcome_summary" 
            rows="4" 
            placeholder="Summary of what happened during the appointment..."
          ></textarea>
        </div>
        
        <div class="form-group">
          <label for="follow_up_required">Follow-up Required</label>
          <input 
            id="follow_up_required"
            v-model="form.follow_up_required" 
            type="checkbox"
          />
        </div>
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <button type="button" @click="$emit('cancel')" class="btn btn-secondary">
          Cancel
        </button>
        <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
          {{ isSubmitting ? 'Saving...' : (isEditing ? 'Update Appointment' : 'Schedule Appointment') }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface AppointmentForm {
  patient_id: string
  provider_id: string
  appointment_date: string
  appointment_time: string
  appointment_type: string
  location: string
  notes: string
  preparation_notes: string
  status: string
  outcome_summary: string
  follow_up_required: boolean
}

interface Props {
  appointment?: any
  patients: Array<{ id: string, name: string }>
  providers: Array<{ id: string, name: string, specialty: string }>
  isEditing?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isEditing: false
})

const emit = defineEmits<{
  save: [appointment: AppointmentForm]
  cancel: []
}>()

const isSubmitting = ref(false)

const form = ref<AppointmentForm>({
  patient_id: '',
  provider_id: '',
  appointment_date: '',
  appointment_time: '',
  appointment_type: '',
  location: '',
  notes: '',
  preparation_notes: '',
  status: 'scheduled',
  outcome_summary: '',
  follow_up_required: false
})

onMounted(() => {
  if (props.appointment) {
    Object.assign(form.value, props.appointment)
  }
})

async function submitForm() {
  isSubmitting.value = true
  
  try {
    emit('save', { ...form.value })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
/* Same styling pattern as other forms */
.appointment-form {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.form-container {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.form-section {
  margin-bottom: 32px;
}

.form-section h3 {
  margin: 0 0 16px 0;
  color: #2d3748;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 8px;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
  color: #4a5568;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
}

.form-group input[type="checkbox"] {
  width: auto;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e2e8f0;
}

.btn {
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  border: none;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-primary:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background: #e5e7eb;
}
</style>
```

### **Component Usage Instructions**

1. **Add to your Vue.js router** in `frontend/src/router/index.ts`:
```typescript
// Add routes for eldercare forms
{
  path: '/eldercare',
  name: 'EldercareDashboard',
  component: () => import('../views/EldercareDashboard.vue')
},
{
  path: '/patients/new',
  name: 'NewPatient',
  component: () => import('../components/eldercare/PatientForm.vue')
},
{
  path: '/medications/new',
  name: 'NewMedication',
  component: () => import('../components/eldercare/MedicationForm.vue')
}
```

2. **Create eldercare components directory**:
```bash
mkdir -p frontend/src/components/eldercare
```

3. **Create an EldercareDashboard.vue** to tie everything together:
```vue
<template>
  <div class="eldercare-dashboard">
    <h1>Eldercare Management</h1>
    
    <div class="quick-actions">
      <button @click="showPatientForm = true" class="action-btn">
        👤 Add Patient
      </button>
      <button @click="showMedicationForm = true" class="action-btn">
        💊 Add Medication
      </button>
      <button @click="showVitalsForm = true" class="action-btn">
        📊 Record Vitals
      </button>
      <button @click="showAppointmentForm = true" class="action-btn">
        📅 Schedule Appointment
      </button>
    </div>
    
    <!-- Patient Form Modal -->
    <PatientForm 
      v-if="showPatientForm"
      @save="savePatient"
      @cancel="showPatientForm = false"
    />
    
    <!-- Medication Form Modal -->
    <MedicationForm 
      v-if="showMedicationForm"
      :patients="patients"
      @save="saveMedication"
      @cancel="showMedicationForm = false"
    />
    
    <!-- Vitals Form Modal -->
    <VitalsForm 
      v-if="showVitalsForm"
      :patients="patients"
      @save="saveVitals"
      @cancel="showVitalsForm = false"
    />
    
    <!-- Appointment Form Modal -->
    <AppointmentForm 
      v-if="showAppointmentForm"
      :patients="patients"
      :providers="providers"
      @save="saveAppointment"
      @cancel="showAppointmentForm = false"
    />
  </div>
</template>
```

## 🔄 **Phase 1 Success Criteria**

- [ ] All new tables created without errors
- [ ] Existing functionality remains intact
- [ ] Migration completes in < 30 seconds
- [ ] All foreign key constraints working
- [ ] Performance indexes functioning
- [ ] Default personas accessible
- [ ] Database integrity checks pass

---

**Next Phase**: [Phase 2 - Core API Development](./02-Phase-2-Core-API.md)