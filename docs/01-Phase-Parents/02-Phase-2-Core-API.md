# Phase 2: Core API Development

## Overview

Phase 2 focuses on building the REST API endpoints and backend services to support eldercare management functionality while maintaining the existing chat system.

## 🎯 **Goals**

- Create comprehensive CRUD APIs for all eldercare entities
- Maintain existing chat/session APIs
- Implement proper validation and error handling
- Add specialized eldercare business logic
- Ensure data security and privacy

## 🔗 **New API Endpoints**

### **Patient Management** (`/api/patients`)

#### **GET /api/patients** - List all patients
```typescript
Response: {
  patients: Patient[],
  total: number
}

interface Patient {
  id: string
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
  active: boolean
  created_at: string
  updated_at: string
}
```

#### **POST /api/patients** - Create new patient
```typescript
Request: {
  name: string
  date_of_birth: string
  relationship: string
  gender?: string
  phone?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  primary_doctor?: string
  insurance_provider?: string
  insurance_id?: string
  notes?: string
}

Response: Patient
```

#### **GET /api/patients/:id** - Get patient details
```typescript
Response: Patient & {
  recent_vitals: Vital[]
  active_medications: Medication[]
  upcoming_appointments: Appointment[]
  care_plans: CarePlan[]
}
```

#### **PUT /api/patients/:id** - Update patient
#### **DELETE /api/patients/:id** - Deactivate patient

---

### **Medical Records** (`/api/patients/:patientId/medical-records`)

#### **GET /api/patients/:patientId/medical-records** - List medical records
```typescript
Query Parameters:
- type?: string (filter by record type)
- from_date?: string
- to_date?: string
- importance_min?: number
- tags?: string[] (filter by tags)
- limit?: number
- offset?: number

Response: {
  records: MedicalRecord[],
  total: number,
  pagination: {
    page: number,
    per_page: number,
    total_pages: number
  }
}
```

#### **POST /api/patients/:patientId/medical-records** - Create medical record
```typescript
Request: {
  record_type: 'diagnosis' | 'treatment' | 'test_result' | 'incident' | 'note'
  title: string
  description: string
  date_recorded: string
  provider_name?: string
  location?: string
  importance_score?: number
  tags?: string[]
  attachments?: string[]
}

Response: MedicalRecord
```

#### **GET /api/patients/:patientId/medical-records/:id** - Get specific record
#### **PUT /api/patients/:patientId/medical-records/:id** - Update record
#### **DELETE /api/patients/:patientId/medical-records/:id** - Delete record

---

### **Medication Management** (`/api/patients/:patientId/medications`)

#### **GET /api/patients/:patientId/medications** - List medications
```typescript
Query Parameters:
- active?: boolean (default: true)
- due_today?: boolean
- overdue?: boolean

Response: {
  medications: Medication[],
  adherence_stats: {
    compliance_rate: number,
    missed_doses_last_week: number,
    upcoming_refills: Medication[]
  }
}
```

#### **POST /api/patients/:patientId/medications** - Add medication
```typescript
Request: {
  name: string
  generic_name?: string
  dosage: string
  frequency: string
  route?: string
  prescribing_doctor?: string
  pharmacy?: string
  start_date: string
  end_date?: string
  refills_remaining?: number
  side_effects?: string
  notes?: string
}

Response: Medication
```

#### **POST /api/patients/:patientId/medications/:id/log** - Log medication taken
```typescript
Request: {
  scheduled_time: string
  actual_time?: string
  status: 'taken' | 'missed' | 'late' | 'skipped'
  notes?: string
}

Response: MedicationLog
```

#### **GET /api/patients/:patientId/medications/schedule** - Get medication schedule
```typescript
Query Parameters:
- date?: string (default: today)
- days?: number (default: 1)

Response: {
  date: string,
  schedule: {
    time: string,
    medications: {
      medication: Medication,
      log_status?: 'taken' | 'missed' | 'pending'
    }[]
  }[]
}
```

---

### **Vital Signs** (`/api/patients/:patientId/vitals`)

#### **GET /api/patients/:patientId/vitals** - List vital signs
```typescript
Query Parameters:
- type?: string (filter by measurement type)
- from_date?: string
- to_date?: string
- limit?: number

Response: {
  vitals: Vital[],
  trends: {
    [measurement_type: string]: {
      current: number,
      previous: number,
      trend: 'up' | 'down' | 'stable',
      change_percentage: number
    }
  }
}
```

#### **POST /api/patients/:patientId/vitals** - Record vital signs
```typescript
Request: {
  measurement_type: string
  systolic?: number
  diastolic?: number
  value?: number
  unit: string
  notes?: string
  measured_at: string
  measured_by?: string
  location?: string
}

Response: Vital
```

---

### **Appointments** (`/api/patients/:patientId/appointments`)

#### **GET /api/patients/:patientId/appointments** - List appointments
```typescript
Query Parameters:
- status?: string
- from_date?: string
- to_date?: string
- upcoming?: boolean

Response: {
  appointments: Appointment[],
  upcoming_count: number,
  overdue_count: number
}
```

#### **POST /api/patients/:patientId/appointments** - Schedule appointment
```typescript
Request: {
  provider_id?: string
  appointment_date: string
  appointment_time: string
  appointment_type: string
  location?: string
  notes?: string
  preparation_notes?: string
}

Response: Appointment
```

#### **PUT /api/patients/:patientId/appointments/:id** - Update appointment
#### **DELETE /api/patients/:patientId/appointments/:id** - Cancel appointment

---

### **Healthcare Providers** (`/api/providers`)

#### **GET /api/providers** - List healthcare providers
#### **POST /api/providers** - Add provider
#### **PUT /api/providers/:id** - Update provider
#### **DELETE /api/providers/:id** - Remove provider

---

### **Care Plans** (`/api/patients/:patientId/care-plans`)

#### **GET /api/patients/:patientId/care-plans** - List care plans
#### **POST /api/patients/:patientId/care-plans** - Create care plan
#### **PUT /api/patients/:patientId/care-plans/:id** - Update care plan
#### **DELETE /api/patients/:patientId/care-plans/:id** - Delete care plan

---

## 🤖 **Enhanced AI Integration**

### **AI-Powered Document Generation** (`/api/ai/generate`)

#### **POST /api/ai/generate/medical-summary** - Generate medical summary
```typescript
Request: {
  patient_id: string
  include_periods?: string[] // 'last_month', 'last_3_months', 'last_year'
  include_types?: string[] // 'medications', 'vitals', 'appointments'
  format?: 'brief' | 'detailed' | 'doctor_letter'
}

Response: {
  summary: string
  token_count: number
  model_used: string
  generated_at: string
}
```

#### **POST /api/ai/generate/doctor-letter** - Generate letter for doctor
```typescript
Request: {
  patient_id: string
  purpose: string // 'consultation', 'referral', 'medication_review'
  include_recent_changes: boolean
  specific_concerns?: string[]
}

Response: {
  letter: string
  subject_line: string
  recipient_suggestions: string[]
  attachments_needed: string[]
}
```

#### **POST /api/ai/generate/medication-analysis** - Analyze medications
```typescript
Request: {
  patient_id: string
  include_interactions: boolean
  include_adherence: boolean
}

Response: {
  analysis: string
  interactions_found: {
    medication_1: string
    medication_2: string
    severity: 'mild' | 'moderate' | 'severe'
    description: string
  }[]
  adherence_concerns: string[]
  recommendations: string[]
}
```

### **Enhanced Care Sessions** (`/api/care-sessions`)

#### **POST /api/care-sessions** - Start care planning session
```typescript
Request: {
  patient_id: string
  session_type: 'care_planning' | 'medical_review' | 'medication_check' | 'emergency'
  care_category: 'general' | 'medication' | 'appointment' | 'emergency'
  persona_id?: string
}

Response: {
  session_id: string
  context_loaded: {
    recent_records: number
    active_medications: number
    upcoming_appointments: number
    critical_pins: number
  }
}
```

---

## 🔧 **Backend Service Layer**

### **PatientService** - Core patient management
```typescript
class PatientService {
  async createPatient(data: CreatePatientRequest): Promise<Patient>
  async getPatient(id: string): Promise<Patient | null>
  async getPatientSummary(id: string): Promise<PatientSummary>
  async updatePatient(id: string, data: UpdatePatientRequest): Promise<Patient>
  async deactivatePatient(id: string): Promise<void>
  async searchPatients(query: string): Promise<Patient[]>
}
```

### **MedicalRecordService** - Medical record management
```typescript
class MedicalRecordService {
  async createRecord(patientId: string, data: CreateRecordRequest): Promise<MedicalRecord>
  async getRecords(patientId: string, filters: RecordFilters): Promise<PaginatedRecords>
  async getRecordsByType(patientId: string, type: string): Promise<MedicalRecord[]>
  async updateRecord(id: string, data: UpdateRecordRequest): Promise<MedicalRecord>
  async deleteRecord(id: string): Promise<void>
  async searchRecords(patientId: string, query: string): Promise<MedicalRecord[]>
}
```

### **MedicationService** - Medication tracking
```typescript
class MedicationService {
  async addMedication(patientId: string, data: CreateMedicationRequest): Promise<Medication>
  async getMedications(patientId: string, activeOnly: boolean): Promise<Medication[]>
  async getMedicationSchedule(patientId: string, date: string): Promise<MedicationSchedule>
  async logMedication(medicationId: string, log: MedicationLogData): Promise<MedicationLog>
  async checkInteractions(patientId: string): Promise<DrugInteraction[]>
  async getAdherenceStats(patientId: string): Promise<AdherenceStats>
}
```

### **VitalSignService** - Vitals tracking
```typescript
class VitalSignService {
  async recordVital(patientId: string, data: VitalData): Promise<Vital>
  async getVitals(patientId: string, filters: VitalFilters): Promise<Vital[]>
  async getVitalTrends(patientId: string, type: string): Promise<VitalTrend>
  async getVitalAlerts(patientId: string): Promise<VitalAlert[]>
}
```

### **AppointmentService** - Appointment management
```typescript
class AppointmentService {
  async scheduleAppointment(patientId: string, data: AppointmentData): Promise<Appointment>
  async getAppointments(patientId: string, filters: AppointmentFilters): Promise<Appointment[]>
  async updateAppointment(id: string, data: UpdateAppointmentData): Promise<Appointment>
  async cancelAppointment(id: string, reason: string): Promise<void>
  async getUpcomingAppointments(patientId: string): Promise<Appointment[]>
}
```

### **AIDocumentService** - AI-powered document generation
```typescript
class AIDocumentService {
  async generateMedicalSummary(patientId: string, options: SummaryOptions): Promise<string>
  async generateDoctorLetter(patientId: string, options: LetterOptions): Promise<string>
  async analyzeMedications(patientId: string): Promise<MedicationAnalysis>
  async createCareRecommendations(patientId: string): Promise<string[]>
}
```

---

## 🔐 **Security & Validation**

### **Input Validation**
```typescript
// Zod schemas for request validation
const CreatePatientSchema = z.object({
  name: z.string().min(1).max(100),
  date_of_birth: z.string().refine(isValidDate),
  relationship: z.string().min(1).max(50),
  phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/).optional(),
  // ... other fields
})

const MedicalRecordSchema = z.object({
  record_type: z.enum(['diagnosis', 'treatment', 'test_result', 'incident', 'note']),
  title: z.string().min(1).max(200),
  description: z.string().max(5000),
  date_recorded: z.string().refine(isValidDateTime),
  importance_score: z.number().min(0).max(1).optional(),
  // ... other fields
})
```

### **Data Privacy**
- All patient data encrypted at rest
- Secure API endpoints with proper authentication
- Audit logging for all medical data access
- HIPAA compliance considerations

### **Error Handling**
```typescript
// Standardized error responses
interface APIError {
  error: string
  message: string
  code: number
  details?: any
  timestamp: string
}

// Common error types
class PatientNotFoundError extends Error {}
class MedicationInteractionError extends Error {}
class AppointmentConflictError extends Error {}
```

---

## 📊 **Analytics & Reporting**

### **Dashboard Analytics** (`/api/analytics`)

#### **GET /api/analytics/patient-overview/:id** - Patient dashboard data
```typescript
Response: {
  patient: Patient
  stats: {
    total_medical_records: number
    active_medications: number
    upcoming_appointments: number
    overdue_tasks: number
    last_vital_check: string
    medication_adherence_rate: number
  }
  recent_activity: Activity[]
  alerts: Alert[]
}
```

#### **GET /api/analytics/medication-adherence/:patientId** - Adherence tracking
#### **GET /api/analytics/vital-trends/:patientId** - Vital sign trends
#### **GET /api/analytics/care-summary/:patientId** - Care summary report

---

## ✅ **Testing Strategy**

### **Unit Tests**
- Service layer methods
- Validation schemas
- Business logic functions
- Error handling scenarios

### **Integration Tests**
- API endpoint functionality
- Database operations
- AI service integration
- Authentication flows

### **End-to-End Tests**
- Complete patient management workflows
- Medication tracking scenarios
- Appointment scheduling flows
- Document generation processes

---

## 📋 **Phase 2 Deliverables**

1. ✅ **Complete REST API** - All eldercare endpoints functional
2. ✅ **Service Layer** - Business logic implementation
3. ✅ **Input Validation** - Zod schemas for all requests
4. ✅ **Error Handling** - Comprehensive error management
5. ✅ **AI Integration** - Document generation capabilities
6. ✅ **Security Implementation** - Data protection and validation
7. ✅ **Analytics Endpoints** - Dashboard and reporting data
8. ✅ **Comprehensive Testing** - Unit, integration, and E2E tests

## 🔄 **Phase 2 Success Criteria**

- [ ] All API endpoints respond correctly
- [ ] Input validation prevents invalid data
- [ ] Error handling provides clear feedback
- [ ] AI document generation works reliably
- [ ] Patient data properly secured
- [ ] Performance meets benchmarks (< 200ms avg)
- [ ] Test coverage > 90%

---

**Next Phase**: [Phase 3 - AI Specialization](./03-Phase-3-AI-Specialization.md)