# Patients Router Documentation

## Overview

The `patientsRouter.ts` file implements the patient management system for the eldercare application. It provides CRUD endpoints for managing patient profiles including personal information, emergency contacts, primary doctor details, and insurance information.

**Location**: `/backend/routes/patientsRouter.ts`

**Mounted At**: `/api/patients`

**Created**: August 24, 2025

**Purpose**:
- Manage patient profiles (family members receiving care)
- Store demographic and contact information
- Track emergency contacts and primary doctors
- Maintain insurance information
- Provide patient summaries with related data
- Support soft deletion for data retention

**Key Features**:
- **Complete CRUD**: List, get, create, update, delete patients
- **Soft Deletes**: Preserve patient history (set active = 0)
- **Patient Summary**: Aggregated view with medications, appointments, vitals
- **Input Validation**: Zod schemas for all mutations
- **Dynamic Updates**: Only update fields that are provided
- **Relationship Tracking**: Track relationship to caregiver

---

## Architecture

### Dependencies

```typescript
import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db/db'
import { okList, okItem, err } from '../utils/apiContract'
import { handleRouterError, generateId } from '../utils/routerHelpers'
```

**Key Dependencies**:
- **Zod**: Schema validation for request bodies
- **Database**: Direct SQLite queries
- **API Contract**: Standardized response format (`okList`, `okItem`, `err`)
- **Router Helpers**: Error handling and ID generation

---

## Database Schema

### Patients Table

```sql
CREATE TABLE patients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  date_of_birth TEXT,
  relationship TEXT,              -- 'mother', 'father', 'spouse', 'self', etc.
  gender TEXT,
  phone TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  primary_doctor TEXT,
  doctor_address TEXT,
  doctor_phone TEXT,
  insurance_provider TEXT,
  insurance_id TEXT,
  notes TEXT,
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

**Field Explanations**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | TEXT | Yes | Primary key (auto-generated) |
| `name` | TEXT | Yes | Patient's full name |
| `date_of_birth` | TEXT | No | Birth date (ISO 8601 format) |
| `relationship` | TEXT | No | Relationship to caregiver (e.g., 'father', 'mother', 'spouse') |
| `gender` | TEXT | No | Gender ('male', 'female', 'other', etc.) |
| `phone` | TEXT | No | Patient's phone number |
| `emergency_contact_name` | TEXT | No | Emergency contact full name |
| `emergency_contact_phone` | TEXT | No | Emergency contact phone |
| `primary_doctor` | TEXT | No | Primary care physician name |
| `doctor_address` | TEXT | No | Doctor's office address |
| `doctor_phone` | TEXT | No | Doctor's office phone |
| `insurance_provider` | TEXT | No | Insurance company name |
| `insurance_id` | TEXT | No | Insurance policy/member ID |
| `notes` | TEXT | No | Additional notes or medical history |
| `active` | INTEGER | Yes | Soft delete flag (1 = active, 0 = deleted) |
| `created_at` | TEXT | Yes | Creation timestamp (auto-generated) |
| `updated_at` | TEXT | Yes | Last update timestamp |

**Purpose**: Core patient demographic and contact information

**Related Tables**:
- `medications` (patient_id foreign key)
- `appointments` (patient_id foreign key)
- `vitals` (patient_id foreign key)
- `medical_records` (patient_id foreign key)

**Indexes**: None currently (name ordering uses full table scan)

---

## Validation Schemas

### Create Patient Schema

```typescript
const createPatientSchema = z.object({
  name: z.string().min(1).max(200),
  date_of_birth: z.string().nullable().optional(),
  relationship: z.string().nullable().optional(),
  gender: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  emergency_contact_name: z.string().nullable().optional(),
  emergency_contact_phone: z.string().nullable().optional(),
  primary_doctor: z.string().nullable().optional(),
  doctor_address: z.string().nullable().optional(),
  doctor_phone: z.string().nullable().optional(),
  insurance_provider: z.string().nullable().optional(),
  insurance_id: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})
```

**Validation Rules**:
- `name`: Required, 1-200 characters
- All other fields: Optional, nullable

**Defaults**:
- `active`: 1 (always created as active)
- `created_at`: Current timestamp
- `updated_at`: Current timestamp

### Update Patient Schema

```typescript
const updatePatientSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  date_of_birth: z.string().nullable().optional(),
  relationship: z.string().nullable().optional(),
  gender: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  emergency_contact_name: z.string().nullable().optional(),
  emergency_contact_phone: z.string().nullable().optional(),
  primary_doctor: z.string().nullable().optional(),
  doctor_address: z.string().nullable().optional(),
  doctor_phone: z.string().nullable().optional(),
  insurance_provider: z.string().nullable().optional(),
  insurance_id: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  active: z.number().min(0).max(1).optional(),
}).strict()
```

**Validation Rules**:
- All fields: Optional
- `active`: Must be 0 or 1 if provided
- `.strict()`: Rejects unknown fields

**Dynamic Update**: Only provided fields are updated

---

## Endpoints

### GET /api/patients

**Purpose**: List all active patients, sorted by name.

#### Path Parameters

None.

#### Query Parameters

None.

#### Implementation

```typescript
router.get('/', async (req, res) => {
  try {
    const patients = db.prepare(`
      SELECT * FROM patients 
      WHERE active = 1 
      ORDER BY name ASC
    `).all()

    okList(res, patients)
  } catch (error) {
    handleRouterError(res, error, 'Failed to retrieve patients')
  }
})
```

**Query Details**:
- Filters: `active = 1` (excludes soft-deleted patients)
- Ordering: Alphabetical by `name` (ascending)

#### Response Format (Success)

```typescript
{
  data: [
    {
      id: "pat_abc123",
      name: "John Smith",
      date_of_birth: "1950-05-15",
      relationship: "father",
      gender: "male",
      phone: "555-0123",
      emergency_contact_name: "Jane Smith",
      emergency_contact_phone: "555-0124",
      primary_doctor: "Dr. Sarah Johnson",
      doctor_address: "123 Medical Plaza, Suite 200",
      doctor_phone: "555-DOCS",
      insurance_provider: "Medicare",
      insurance_id: "12345-67890-A",
      notes: "Diabetic, takes medication twice daily",
      active: 1,
      created_at: "2024-01-10T09:00:00.000Z",
      updated_at: "2024-01-20T14:30:00.000Z"
    },
    // ... more patients
  ]
}
```

#### Example Request

```typescript
const response = await fetch('/api/patients')
const data = await response.json()

console.log(`Found ${data.data.length} active patients`)
data.data.forEach(patient => {
  console.log(`- ${patient.name} (${patient.relationship})`)
})
```

**Use Case**: Display patient list in sidebar, dropdown, or dashboard

---

### GET /api/patients/:id

**Purpose**: Get detailed information about a specific patient.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Patient ID |

#### Implementation

```typescript
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const patient = db.prepare(`
      SELECT * FROM patients 
      WHERE id = ? AND active = 1
    `).get(id)

    if (!patient) {
      return err(res, 404, 'NOT_FOUND', 'Patient not found')
    }

    okItem(res, patient)
  } catch (error) {
    handleRouterError(res, error, 'Failed to retrieve patient')
  }
})
```

#### Response Format (Success)

```typescript
{
  data: {
    id: "pat_abc123",
    name: "John Smith",
    date_of_birth: "1950-05-15",
    relationship: "father",
    gender: "male",
    phone: "555-0123",
    emergency_contact_name: "Jane Smith",
    emergency_contact_phone: "555-0124",
    primary_doctor: "Dr. Sarah Johnson",
    doctor_address: "123 Medical Plaza, Suite 200",
    doctor_phone: "555-DOCS",
    insurance_provider: "Medicare",
    insurance_id: "12345-67890-A",
    notes: "Diabetic, takes medication twice daily",
    active: 1,
    created_at: "2024-01-10T09:00:00.000Z",
    updated_at: "2024-01-20T14:30:00.000Z"
  }
}
```

#### Response Format (Not Found)

```typescript
{
  success: false,
  error: {
    code: "NOT_FOUND",
    message: "Patient not found"
  }
}
```

**HTTP Status**: 404

#### Example Request

```typescript
const response = await fetch('/api/patients/pat_abc123')
const data = await response.json()

if (data.data) {
  console.log(`Patient: ${data.data.name}`)
  console.log(`Doctor: ${data.data.primary_doctor}`)
  console.log(`Emergency Contact: ${data.data.emergency_contact_name}`)
}
```

---

### POST /api/patients

**Purpose**: Create a new patient profile.

#### Request Body

```typescript
{
  name: string;                        // Required (1-200 chars)
  date_of_birth?: string | null;       // Optional
  relationship?: string | null;        // Optional
  gender?: string | null;              // Optional
  phone?: string | null;               // Optional
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  primary_doctor?: string | null;
  doctor_address?: string | null;
  doctor_phone?: string | null;
  insurance_provider?: string | null;
  insurance_id?: string | null;
  notes?: string | null;
}
```

#### Implementation

```typescript
router.post('/', async (req, res) => {
  try {
    const validatedData = createPatientSchema.parse(req.body)
    
    const patientId = generateId()
    const now = new Date().toISOString()
    
    const insertPatient = db.prepare(`
      INSERT INTO patients (
        id, name, date_of_birth, relationship, gender, phone,
        emergency_contact_name, emergency_contact_phone, primary_doctor,
        doctor_address, doctor_phone,
        insurance_provider, insurance_id, notes, active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `)

    insertPatient.run(
      patientId,
      validatedData.name,
      validatedData.date_of_birth || null,
      validatedData.relationship || null,
      validatedData.gender || null,
      validatedData.phone || null,
      validatedData.emergency_contact_name || null,
      validatedData.emergency_contact_phone || null,
      validatedData.primary_doctor || null,
      validatedData.doctor_address || null,
      validatedData.doctor_phone || null,
      validatedData.insurance_provider || null,
      validatedData.insurance_id || null,
      validatedData.notes || null,
      now,
      now
    )

    // Retrieve the created patient
    const createdPatient = db.prepare(`
      SELECT * FROM patients WHERE id = ?
    `).get(patientId)

    okItem(res, createdPatient, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return err(res, 400, 'VALIDATION_ERROR', 'Invalid patient data', { issues: error.errors })
    }
    handleRouterError(res, error, 'Failed to create patient')
  }
})
```

**Auto-Generated Fields**:
- `id`: Generated using `generateId()`
- `active`: Always set to 1 (active)
- `created_at`: Current timestamp
- `updated_at`: Current timestamp

#### Response Format (Success)

```typescript
{
  data: {
    id: "pat_new456",
    name: "Mary Johnson",
    date_of_birth: "1948-03-22",
    relationship: "mother",
    gender: "female",
    phone: "555-9876",
    emergency_contact_name: "Robert Johnson",
    emergency_contact_phone: "555-9877",
    primary_doctor: "Dr. Michael Chen",
    doctor_address: "456 Health Center Blvd",
    doctor_phone: "555-HLTH",
    insurance_provider: "Blue Cross",
    insurance_id: "BC-987654-B",
    notes: "Hypertension, regular checkups needed",
    active: 1,
    created_at: "2024-01-20T15:00:00.000Z",
    updated_at: "2024-01-20T15:00:00.000Z"
  }
}
```

**HTTP Status**: 201 Created

#### Response Format (Validation Error)

```typescript
{
  success: false,
  error: {
    code: "VALIDATION_ERROR",
    message: "Invalid patient data",
    details: {
      issues: [
        {
          path: ["name"],
          message: "String must contain at least 1 character(s)"
        }
      ]
    }
  }
}
```

**HTTP Status**: 400

#### Example Requests

```typescript
// Minimal patient (name only)
const minimal = await fetch('/api/patients', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'John Doe'
  })
})

// Complete patient profile
const complete = await fetch('/api/patients', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Mary Johnson',
    date_of_birth: '1948-03-22',
    relationship: 'mother',
    gender: 'female',
    phone: '555-9876',
    emergency_contact_name: 'Robert Johnson',
    emergency_contact_phone: '555-9877',
    primary_doctor: 'Dr. Michael Chen',
    doctor_address: '456 Health Center Blvd',
    doctor_phone: '555-HLTH',
    insurance_provider: 'Blue Cross',
    insurance_id: 'BC-987654-B',
    notes: 'Hypertension, regular checkups needed'
  })
})

const data = await complete.json()
console.log('Created patient:', data.data.id)
```

---

### PUT /api/patients/:id

**Purpose**: Update an existing patient's information.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Patient ID to update |

#### Request Body

All fields optional. Only provided fields will be updated.

```typescript
{
  name?: string;                       // Optional (1-200 chars if provided)
  date_of_birth?: string | null;
  relationship?: string | null;
  gender?: string | null;
  phone?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  primary_doctor?: string | null;
  doctor_address?: string | null;
  doctor_phone?: string | null;
  insurance_provider?: string | null;
  insurance_id?: string | null;
  notes?: string | null;
  active?: number;                     // Optional (0 or 1)
}
```

#### Implementation

```typescript
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const validatedData = updatePatientSchema.parse(req.body)
    
    // Check if patient exists
    const existingPatient = db.prepare(`
      SELECT * FROM patients WHERE id = ? AND active = 1
    `).get(id)

    if (!existingPatient) {
      return err(res, 404, 'NOT_FOUND', 'Patient not found')
    }

    // Build dynamic update query
    const updateFields = []
    const updateValues = []
    
    for (const [key, value] of Object.entries(validatedData)) {
      if (value !== undefined) {
        updateFields.push(`${key} = ?`)
        updateValues.push(value)
      }
    }
    
    if (updateFields.length === 0) {
      return err(res, 400, 'VALIDATION_ERROR', 'No fields to update')
    }

    updateFields.push('updated_at = ?')
    updateValues.push(new Date().toISOString())
    updateValues.push(id)

    const updateQuery = `
      UPDATE patients 
      SET ${updateFields.join(', ')} 
      WHERE id = ?
    `

    db.prepare(updateQuery).run(...updateValues)

    // Retrieve the updated patient
    const updatedPatient = db.prepare(`
      SELECT * FROM patients WHERE id = ?
    `).get(id)

    okItem(res, updatedPatient)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return err(res, 400, 'VALIDATION_ERROR', 'Invalid patient data', { issues: error.errors })
    }
    handleRouterError(res, error, 'Failed to update patient')
  }
})
```

**Dynamic Update Logic**:
1. Parse request body with schema
2. Check patient exists
3. Build SQL with only provided fields
4. Auto-update `updated_at` timestamp
5. Return updated patient

#### Response Format (Success)

```typescript
{
  data: {
    id: "pat_abc123",
    name: "John Smith",
    date_of_birth: "1950-05-15",
    relationship: "father",
    gender: "male",
    phone: "555-0123-NEW",  // Updated
    // ... other fields
    updated_at: "2024-01-21T10:30:00.000Z"  // Updated
  }
}
```

#### Response Format (Not Found)

```typescript
{
  success: false,
  error: {
    code: "NOT_FOUND",
    message: "Patient not found"
  }
}
```

**HTTP Status**: 404

#### Response Format (No Fields)

```typescript
{
  success: false,
  error: {
    code: "VALIDATION_ERROR",
    message: "No fields to update"
  }
}
```

**HTTP Status**: 400

#### Example Requests

```typescript
// Update phone number only
await fetch('/api/patients/pat_abc123', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phone: '555-0123-NEW'
  })
})

// Update multiple fields
await fetch('/api/patients/pat_abc123', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    primary_doctor: 'Dr. Emily Brown',
    doctor_address: '789 Wellness Way',
    doctor_phone: '555-WELL',
    notes: 'Switched to new primary care physician'
  })
})

// Update to null (clear field)
await fetch('/api/patients/pat_abc123', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    insurance_id: null  // Clear insurance ID
  })
})
```

---

### DELETE /api/patients/:id

**Purpose**: Soft delete a patient (preserves data, sets active = 0).

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Patient ID to delete |

#### Implementation

```typescript
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const existingPatient = db.prepare(`
      SELECT * FROM patients WHERE id = ? AND active = 1
    `).get(id)

    if (!existingPatient) {
      return err(res, 404, 'NOT_FOUND', 'Patient not found')
    }

    // Soft delete by setting active = 0
    db.prepare(`
      UPDATE patients 
      SET active = 0, updated_at = ? 
      WHERE id = ?
    `).run(new Date().toISOString(), id)

    okItem(res, { message: 'Patient deleted successfully' })
  } catch (error) {
    handleRouterError(res, error, 'Failed to delete patient')
  }
})
```

**Soft Delete Behavior**:
- Sets `active = 0` (patient hidden from lists)
- Updates `updated_at` timestamp
- Preserves all patient data
- Related records (medications, appointments) remain accessible

**Note**: Hard delete not implemented (data preservation for medical/legal reasons)

#### Response Format (Success)

```typescript
{
  data: {
    message: "Patient deleted successfully"
  }
}
```

#### Response Format (Not Found)

```typescript
{
  success: false,
  error: {
    code: "NOT_FOUND",
    message: "Patient not found"
  }
}
```

**HTTP Status**: 404

#### Example Request

```typescript
const response = await fetch('/api/patients/pat_abc123', {
  method: 'DELETE'
})

if (response.ok) {
  console.log('Patient soft deleted')
  // Patient will no longer appear in GET /api/patients
  // But data remains in database with active = 0
}
```

---

### GET /api/patients/:id/summary

**Purpose**: Get comprehensive patient summary with related medical data.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Patient ID |

#### Implementation

```typescript
router.get('/:id/summary', async (req, res) => {
  try {
    const { id } = req.params
    
    // Get patient basic info
    const patient = db.prepare(`
      SELECT * FROM patients WHERE id = ? AND active = 1
    `).get(id)

    if (!patient) {
      return err(res, 404, 'NOT_FOUND', 'Patient not found')
    }

    // Get recent medications
    const medications = db.prepare(`
      SELECT * FROM medications 
      WHERE patient_id = ? AND active = 1 
      ORDER BY start_date DESC 
      LIMIT 5
    `).all(id)

    // Get recent appointments
    const appointments = db.prepare(`
      SELECT * FROM appointments 
      WHERE patient_id = ? 
      ORDER BY appointment_date DESC 
      LIMIT 5
    `).all(id)

    // Get recent vitals
    const vitals = db.prepare(`
      SELECT * FROM vitals 
      WHERE patient_id = ? 
      ORDER BY measured_at DESC 
      LIMIT 10
    `).all(id)

    // Get recent medical records
    const medicalRecords = db.prepare(`
      SELECT * FROM medical_records 
      WHERE patient_id = ? 
      ORDER BY date_recorded DESC 
      LIMIT 5
    `).all(id)

    const summary = {
      patient,
      medications,
      appointments,
      vitals,
      medicalRecords,
    }

    okItem(res, summary)
  } catch (error) {
    handleRouterError(res, error, 'Failed to retrieve patient summary')
  }
})
```

**Data Aggregation**:
- Patient: Full profile
- Medications: Last 5 active medications
- Appointments: Last 5 appointments (upcoming and past)
- Vitals: Last 10 vital sign recordings
- Medical Records: Last 5 records

#### Response Format (Success)

```typescript
{
  data: {
    patient: {
      id: "pat_abc123",
      name: "John Smith",
      date_of_birth: "1950-05-15",
      relationship: "father",
      // ... all patient fields
    },
    medications: [
      {
        id: "med_xyz789",
        patient_id: "pat_abc123",
        brand_name: "Lisinopril",
        generic_name: "lisinopril",
        dosage: "10mg",
        frequency: "Once daily",
        // ... medication fields
      },
      // ... up to 5 medications
    ],
    appointments: [
      {
        id: "appt_def456",
        patient_id: "pat_abc123",
        title: "Annual Physical",
        appointment_date: "2024-02-15T10:00:00.000Z",
        // ... appointment fields
      },
      // ... up to 5 appointments
    ],
    vitals: [
      {
        id: "vital_ghi123",
        patient_id: "pat_abc123",
        blood_pressure_systolic: 120,
        blood_pressure_diastolic: 80,
        heart_rate: 72,
        measured_at: "2024-01-20T09:00:00.000Z",
        // ... vital fields
      },
      // ... up to 10 vitals
    ],
    medicalRecords: [
      {
        id: "rec_jkl456",
        patient_id: "pat_abc123",
        title: "Lab Results - Blood Work",
        date_recorded: "2024-01-15",
        // ... medical record fields
      },
      // ... up to 5 records
    ]
  }
}
```

#### Example Request

```typescript
const response = await fetch('/api/patients/pat_abc123/summary')
const data = await response.json()

console.log(`Patient: ${data.data.patient.name}`)
console.log(`Active Medications: ${data.data.medications.length}`)
console.log(`Upcoming Appointments: ${data.data.appointments.length}`)
console.log(`Recent Vitals: ${data.data.vitals.length}`)
console.log(`Medical Records: ${data.data.medicalRecords.length}`)
```

**Use Case**: Dashboard overview, patient detail page, quick summary modal

---

## Usage Examples

### Create Patient Workflow

```typescript
async function createPatientWorkflow() {
  // 1. Create patient
  const createRes = await fetch('/api/patients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'John Smith',
      date_of_birth: '1950-05-15',
      relationship: 'father',
      gender: 'male',
      phone: '555-0123',
      emergency_contact_name: 'Jane Smith',
      emergency_contact_phone: '555-0124',
      primary_doctor: 'Dr. Sarah Johnson',
      insurance_provider: 'Medicare',
      insurance_id: '12345-67890-A'
    })
  })
  
  const patient = await createRes.json()
  console.log('Created patient:', patient.data.id)
  
  // 2. Add first medication
  await fetch('/api/medications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patient_id: patient.data.id,
      brand_name: 'Lisinopril',
      dosage: '10mg',
      frequency: 'Once daily'
    })
  })
  
  // 3. Schedule first appointment
  await fetch('/api/appointments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patient_id: patient.data.id,
      title: 'Initial Consultation',
      appointment_date: '2024-02-01T10:00:00.000Z',
      doctor: 'Dr. Sarah Johnson'
    })
  })
  
  return patient.data
}
```

### Update Patient Information

```typescript
async function updatePatientDoctor(patientId: string, newDoctor: {
  name: string,
  address: string,
  phone: string
}) {
  const response = await fetch(`/api/patients/${patientId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      primary_doctor: newDoctor.name,
      doctor_address: newDoctor.address,
      doctor_phone: newDoctor.phone,
      notes: `Switched to ${newDoctor.name} on ${new Date().toLocaleDateString()}`
    })
  })
  
  const data = await response.json()
  console.log('Updated patient doctor:', data.data.primary_doctor)
  
  return data.data
}
```

### Display Patient List

```typescript
async function displayPatientList() {
  const response = await fetch('/api/patients')
  const data = await response.json()
  
  console.log('Active Patients:')
  data.data.forEach(patient => {
    const age = calculateAge(patient.date_of_birth)
    console.log(`- ${patient.name} (${patient.relationship}, age ${age})`)
    console.log(`  Phone: ${patient.phone || 'N/A'}`)
    console.log(`  Doctor: ${patient.primary_doctor || 'N/A'}`)
    console.log('')
  })
}

function calculateAge(dateOfBirth: string | null): number {
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
```

### Patient Dashboard Summary

```typescript
async function displayPatientDashboard(patientId: string) {
  const response = await fetch(`/api/patients/${patientId}/summary`)
  const data = await response.json()
  
  const { patient, medications, appointments, vitals } = data.data
  
  console.log('=== Patient Dashboard ===')
  console.log(`Name: ${patient.name}`)
  console.log(`Relationship: ${patient.relationship}`)
  console.log(`Age: ${calculateAge(patient.date_of_birth)}`)
  console.log('')
  
  console.log('Emergency Contact:')
  console.log(`  ${patient.emergency_contact_name || 'N/A'}`)
  console.log(`  ${patient.emergency_contact_phone || 'N/A'}`)
  console.log('')
  
  console.log('Primary Care:')
  console.log(`  ${patient.primary_doctor || 'N/A'}`)
  console.log(`  ${patient.doctor_phone || 'N/A'}`)
  console.log('')
  
  console.log(`Active Medications: ${medications.length}`)
  medications.forEach(med => {
    console.log(`  - ${med.brand_name} ${med.dosage} (${med.frequency})`)
  })
  console.log('')
  
  console.log(`Upcoming Appointments: ${appointments.length}`)
  appointments.slice(0, 3).forEach(appt => {
    console.log(`  - ${appt.title} on ${new Date(appt.appointment_date).toLocaleDateString()}`)
  })
  console.log('')
  
  if (vitals.length > 0) {
    const latest = vitals[0]
    console.log('Latest Vitals:')
    console.log(`  BP: ${latest.blood_pressure_systolic}/${latest.blood_pressure_diastolic}`)
    console.log(`  HR: ${latest.heart_rate} bpm`)
    console.log(`  Measured: ${new Date(latest.measured_at).toLocaleDateString()}`)
  }
}
```

---

## Best Practices

### 1. Always Provide Patient Name

```typescript
// ✅ GOOD: Name is always required
await fetch('/api/patients', {
  method: 'POST',
  body: JSON.stringify({
    name: 'John Smith',
    relationship: 'father'
  })
})

// ❌ BAD: Missing required name field
await fetch('/api/patients', {
  method: 'POST',
  body: JSON.stringify({
    relationship: 'father'
  })
})
// Returns 400 validation error
```

### 2. Use Summary Endpoint for Dashboards

```typescript
// ✅ GOOD: Single request gets all related data
const summary = await fetch(`/api/patients/${id}/summary`)
  .then(r => r.json())

// Display patient + medications + appointments + vitals

// ❌ INEFFICIENT: Multiple requests
const patient = await fetch(`/api/patients/${id}`).then(r => r.json())
const medications = await fetch(`/api/medications?patient_id=${id}`).then(r => r.json())
const appointments = await fetch(`/api/appointments?patient_id=${id}`).then(r => r.json())
const vitals = await fetch(`/api/vitals?patient_id=${id}`).then(r => r.json())
// 4 requests instead of 1
```

### 3. Handle Soft Deletes Properly

```typescript
// ✅ GOOD: Understand soft delete behavior
async function deletePatient(id: string) {
  await fetch(`/api/patients/${id}`, { method: 'DELETE' })
  
  // Patient hidden from GET /api/patients
  // But related data (medications, appointments) still accessible
  // Use for archiving patients who are no longer in care
}

// ❌ MISUNDERSTANDING: Thinking delete removes all data
// Soft delete preserves data for historical/legal reasons
```

### 4. Update Only Changed Fields

```typescript
// ✅ GOOD: Send only changed fields
async function updatePhone(patientId: string, newPhone: string) {
  await fetch(`/api/patients/${patientId}`, {
    method: 'PUT',
    body: JSON.stringify({ phone: newPhone })
  })
}

// ⚠️ WORKS BUT WASTEFUL: Sending all fields every time
async function updatePhone(patientId: string, patient: Patient, newPhone: string) {
  await fetch(`/api/patients/${patientId}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: patient.name,
      date_of_birth: patient.date_of_birth,
      relationship: patient.relationship,
      // ... all 13 fields even though only phone changed
      phone: newPhone
    })
  })
}
```

### 5. Store Emergency Contacts

```typescript
// ✅ GOOD: Always capture emergency contact when possible
await fetch('/api/patients', {
  method: 'POST',
  body: JSON.stringify({
    name: 'John Smith',
    emergency_contact_name: 'Jane Smith',
    emergency_contact_phone: '555-0124',
    // Critical for medical emergencies
  })
})

// ⚠️ RISKY: Skipping emergency contact info
await fetch('/api/patients', {
  method: 'POST',
  body: JSON.stringify({
    name: 'John Smith'
    // No emergency contact - dangerous in eldercare!
  })
})
```

### 6. Validate Phone Numbers on Frontend

```typescript
// ✅ GOOD: Validate format before sending
function formatPhoneNumber(phone: string): string {
  // Remove non-digits
  const digits = phone.replace(/\D/g, '')
  
  // Format as (555) 123-4567
  if (digits.length === 10) {
    return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`
  }
  
  return phone  // Return as-is if invalid
}

const formattedPhone = formatPhoneNumber(userInput)

// ❌ ACCEPTABLE: Backend accepts any format
// But frontend validation improves UX
```

---

## Frontend Integration

### Vue Patient Profile Component

```vue
<template>
  <div class="patient-profile">
    <div class="profile-header">
      <h2>{{ patient.name }}</h2>
      <span class="relationship-badge">{{ patient.relationship }}</span>
    </div>
    
    <div class="profile-sections">
      <!-- Personal Info -->
      <section class="info-section">
        <h3>Personal Information</h3>
        <div class="info-grid">
          <div class="info-item">
            <label>Date of Birth:</label>
            <span>{{ formatDate(patient.date_of_birth) }}</span>
          </div>
          <div class="info-item">
            <label>Age:</label>
            <span>{{ calculateAge(patient.date_of_birth) }}</span>
          </div>
          <div class="info-item">
            <label>Gender:</label>
            <span>{{ patient.gender || 'N/A' }}</span>
          </div>
          <div class="info-item">
            <label>Phone:</label>
            <span>{{ patient.phone || 'N/A' }}</span>
          </div>
        </div>
      </section>
      
      <!-- Emergency Contact -->
      <section class="info-section emergency">
        <h3>🚨 Emergency Contact</h3>
        <div class="info-grid">
          <div class="info-item">
            <label>Name:</label>
            <span>{{ patient.emergency_contact_name || 'N/A' }}</span>
          </div>
          <div class="info-item">
            <label>Phone:</label>
            <span>{{ patient.emergency_contact_phone || 'N/A' }}</span>
          </div>
        </div>
      </section>
      
      <!-- Primary Doctor -->
      <section class="info-section">
        <h3>Primary Care Physician</h3>
        <div class="info-grid">
          <div class="info-item">
            <label>Doctor:</label>
            <span>{{ patient.primary_doctor || 'N/A' }}</span>
          </div>
          <div class="info-item">
            <label>Address:</label>
            <span>{{ patient.doctor_address || 'N/A' }}</span>
          </div>
          <div class="info-item">
            <label>Phone:</label>
            <span>{{ patient.doctor_phone || 'N/A' }}</span>
          </div>
        </div>
      </section>
      
      <!-- Insurance -->
      <section class="info-section">
        <h3>Insurance Information</h3>
        <div class="info-grid">
          <div class="info-item">
            <label>Provider:</label>
            <span>{{ patient.insurance_provider || 'N/A' }}</span>
          </div>
          <div class="info-item">
            <label>Policy ID:</label>
            <span>{{ patient.insurance_id || 'N/A' }}</span>
          </div>
        </div>
      </section>
      
      <!-- Notes -->
      <section class="info-section" v-if="patient.notes">
        <h3>Notes</h3>
        <p class="notes">{{ patient.notes }}</p>
      </section>
    </div>
    
    <div class="profile-actions">
      <button @click="editPatient" class="btn-primary">Edit Profile</button>
      <button @click="viewSummary" class="btn-secondary">View Summary</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{ patientId: string }>()

const patient = ref<any>({})

async function loadPatient() {
  const response = await fetch(`/api/patients/${props.patientId}`)
  const data = await response.json()
  patient.value = data.data
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString()
}

function calculateAge(dateOfBirth: string | null): number {
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

function editPatient() {
  // Navigate to edit form
}

function viewSummary() {
  // Navigate to summary page
}

onMounted(loadPatient)
</script>

<style scoped>
.patient-profile {
  max-width: 900px;
  margin: 0 auto;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.relationship-badge {
  background: #e3f2fd;
  color: #1976d2;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.9rem;
  text-transform: capitalize;
}

.info-section {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.info-section.emergency {
  border-color: #ff6b6b;
  background: #fff5f5;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.info-item label {
  font-weight: 600;
  color: #666;
  display: block;
  margin-bottom: 0.25rem;
}

.notes {
  white-space: pre-wrap;
  color: #333;
}

.profile-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}
</style>
```

### Patient Form Component

```vue
<template>
  <form @submit.prevent="handleSubmit" class="patient-form">
    <h2>{{ isEdit ? 'Edit' : 'Create' }} Patient</h2>
    
    <div class="form-section">
      <h3>Personal Information</h3>
      
      <div class="form-group">
        <label for="name">Full Name *</label>
        <input 
          id="name"
          v-model="form.name" 
          type="text" 
          required
          maxlength="200"
        />
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label for="dob">Date of Birth</label>
          <input 
            id="dob"
            v-model="form.date_of_birth" 
            type="date"
          />
        </div>
        
        <div class="form-group">
          <label for="gender">Gender</label>
          <select id="gender" v-model="form.gender">
            <option value="">Select...</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label for="relationship">Relationship</label>
          <select id="relationship" v-model="form.relationship">
            <option value="">Select...</option>
            <option value="father">Father</option>
            <option value="mother">Mother</option>
            <option value="spouse">Spouse</option>
            <option value="self">Self</option>
            <option value="sibling">Sibling</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="phone">Phone</label>
          <input 
            id="phone"
            v-model="form.phone" 
            type="tel"
            placeholder="(555) 123-4567"
          />
        </div>
      </div>
    </div>
    
    <div class="form-section emergency">
      <h3>🚨 Emergency Contact</h3>
      
      <div class="form-row">
        <div class="form-group">
          <label for="emergency-name">Name</label>
          <input 
            id="emergency-name"
            v-model="form.emergency_contact_name" 
            type="text"
          />
        </div>
        
        <div class="form-group">
          <label for="emergency-phone">Phone</label>
          <input 
            id="emergency-phone"
            v-model="form.emergency_contact_phone" 
            type="tel"
          />
        </div>
      </div>
    </div>
    
    <div class="form-section">
      <h3>Primary Care Physician</h3>
      
      <div class="form-group">
        <label for="doctor">Doctor Name</label>
        <input 
          id="doctor"
          v-model="form.primary_doctor" 
          type="text"
        />
      </div>
      
      <div class="form-group">
        <label for="doctor-address">Office Address</label>
        <input 
          id="doctor-address"
          v-model="form.doctor_address" 
          type="text"
        />
      </div>
      
      <div class="form-group">
        <label for="doctor-phone">Office Phone</label>
        <input 
          id="doctor-phone"
          v-model="form.doctor_phone" 
          type="tel"
        />
      </div>
    </div>
    
    <div class="form-section">
      <h3>Insurance</h3>
      
      <div class="form-row">
        <div class="form-group">
          <label for="insurance-provider">Provider</label>
          <input 
            id="insurance-provider"
            v-model="form.insurance_provider" 
            type="text"
          />
        </div>
        
        <div class="form-group">
          <label for="insurance-id">Policy/Member ID</label>
          <input 
            id="insurance-id"
            v-model="form.insurance_id" 
            type="text"
          />
        </div>
      </div>
    </div>
    
    <div class="form-section">
      <h3>Notes</h3>
      <div class="form-group">
        <textarea 
          v-model="form.notes" 
          rows="4"
          placeholder="Medical history, allergies, special instructions..."
        ></textarea>
      </div>
    </div>
    
    <div class="form-actions">
      <button type="submit" class="btn-primary">
        {{ isEdit ? 'Update' : 'Create' }} Patient
      </button>
      <button type="button" @click="$emit('cancel')" class="btn-secondary">
        Cancel
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{
  patientId?: string
}>()

const emit = defineEmits<{
  saved: [patient: any]
  cancel: []
}>()

const isEdit = !!props.patientId

const form = ref({
  name: '',
  date_of_birth: null,
  relationship: null,
  gender: null,
  phone: null,
  emergency_contact_name: null,
  emergency_contact_phone: null,
  primary_doctor: null,
  doctor_address: null,
  doctor_phone: null,
  insurance_provider: null,
  insurance_id: null,
  notes: null,
})

async function loadPatient() {
  if (!props.patientId) return
  
  const response = await fetch(`/api/patients/${props.patientId}`)
  const data = await response.json()
  form.value = data.data
}

async function handleSubmit() {
  const url = isEdit 
    ? `/api/patients/${props.patientId}`
    : '/api/patients'
  
  const method = isEdit ? 'PUT' : 'POST'
  
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(form.value)
  })
  
  if (response.ok) {
    const data = await response.json()
    emit('saved', data.data)
  }
}

onMounted(() => {
  if (isEdit) loadPatient()
})
</script>

<style scoped>
.patient-form {
  max-width: 800px;
  margin: 0 auto;
}

.form-section {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-section.emergency {
  border-color: #ff6b6b;
  background: #fff5f5;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #333;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}
</style>
```

---

## Performance Considerations

### 1. List Query Optimization

**Current**: Full table scan with WHERE filter
```sql
SELECT * FROM patients WHERE active = 1 ORDER BY name ASC
```

**Recommendation**: Add index for better performance
```sql
CREATE INDEX idx_patients_active_name ON patients(active, name);
```

**Benefit**: Faster list queries, especially with many soft-deleted patients

### 2. Summary Endpoint Queries

**Current**: 5 separate queries (patient + 4 related tables)

**Performance**: Acceptable for typical data volumes (< 1000 records per patient)

**Future Optimization**: Consider single JOIN query if performance becomes an issue

### 3. Soft Delete Impact

**Consideration**: Soft deletes accumulate inactive records

**Mitigation**: Periodic archival or cleanup of very old inactive records

```sql
-- Example: Archive patients inactive for > 5 years
SELECT COUNT(*) FROM patients 
WHERE active = 0 
AND updated_at < date('now', '-5 years');
```

---

## Security Considerations

### 1. SQL Injection Protection

**Status**: ✅ Protected via parameterized queries

```typescript
// Safe
db.prepare('SELECT * FROM patients WHERE id = ?').get(id)

// Vulnerable (not used)
db.exec(`SELECT * FROM patients WHERE id = '${id}'`)
```

### 2. Input Validation

**Status**: ✅ Protected via Zod schemas

**Validates**:
- Required fields (name)
- String lengths (name max 200 chars)
- Data types
- Rejects unknown fields (.strict())

### 3. No Authorization Currently

**Current State**: No user/session authorization checks

**Recommendation**: Add middleware to verify caregiver owns patient

```typescript
async function authorizePatientAccess(req, res, next) {
  const { id } = req.params
  const caregiverId = req.user?.id
  
  // Check if caregiver has access to this patient
  const hasAccess = await checkPatientAccess(caregiverId, id)
  
  if (!hasAccess) {
    return err(res, 403, 'FORBIDDEN', 'Access denied')
  }
  
  next()
}

router.use('/:id', authorizePatientAccess)
```

### 4. Sensitive Data

**Contains**: Medical history, insurance info, emergency contacts

**Protection**: 
- Use HTTPS in production
- Implement proper authentication
- Consider encryption for sensitive fields

---

## Testing Considerations

### Unit Test Scenarios

```typescript
describe('Patients Router', () => {
  describe('GET /api/patients', () => {
    it('should list only active patients', async () => {
      // Create active and inactive patients
      const active = await createTestPatient({ name: 'Active', active: 1 })
      const inactive = await createTestPatient({ name: 'Inactive', active: 0 })
      
      const response = await request(app).get('/api/patients')
      
      expect(response.status).toBe(200)
      expect(response.body.data).toContainEqual(expect.objectContaining({ id: active.id }))
      expect(response.body.data).not.toContainEqual(expect.objectContaining({ id: inactive.id }))
    })
    
    it('should sort patients by name', async () => {
      await createTestPatient({ name: 'Zoe' })
      await createTestPatient({ name: 'Alice' })
      await createTestPatient({ name: 'Bob' })
      
      const response = await request(app).get('/api/patients')
      const names = response.body.data.map((p: any) => p.name)
      
      expect(names).toEqual(['Alice', 'Bob', 'Zoe'])
    })
  })
  
  describe('POST /api/patients', () => {
    it('should create patient with required fields', async () => {
      const response = await request(app)
        .post('/api/patients')
        .send({ name: 'John Smith' })
      
      expect(response.status).toBe(201)
      expect(response.body.data.name).toBe('John Smith')
      expect(response.body.data.id).toBeTruthy()
      expect(response.body.data.active).toBe(1)
    })
    
    it('should reject empty name', async () => {
      const response = await request(app)
        .post('/api/patients')
        .send({ name: '' })
      
      expect(response.status).toBe(400)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })
  })
  
  describe('PUT /api/patients/:id', () => {
    it('should update only provided fields', async () => {
      const patient = await createTestPatient({ name: 'John', phone: '111' })
      
      const response = await request(app)
        .put(`/api/patients/${patient.id}`)
        .send({ phone: '222' })
      
      expect(response.status).toBe(200)
      expect(response.body.data.name).toBe('John')  // Unchanged
      expect(response.body.data.phone).toBe('222')  // Updated
    })
  })
  
  describe('DELETE /api/patients/:id', () => {
    it('should soft delete patient', async () => {
      const patient = await createTestPatient({ name: 'John' })
      
      const deleteRes = await request(app).delete(`/api/patients/${patient.id}`)
      expect(deleteRes.status).toBe(200)
      
      // Verify soft delete
      const dbPatient = db.prepare('SELECT * FROM patients WHERE id = ?').get(patient.id)
      expect(dbPatient.active).toBe(0)
      
      // Verify not in list
      const listRes = await request(app).get('/api/patients')
      expect(listRes.body.data).not.toContainEqual(expect.objectContaining({ id: patient.id }))
    })
  })
  
  describe('GET /api/patients/:id/summary', () => {
    it('should include all related data', async () => {
      const patient = await createTestPatient({ name: 'John' })
      await createTestMedication({ patient_id: patient.id })
      await createTestAppointment({ patient_id: patient.id })
      
      const response = await request(app).get(`/api/patients/${patient.id}/summary`)
      
      expect(response.status).toBe(200)
      expect(response.body.data.patient.id).toBe(patient.id)
      expect(response.body.data.medications).toHaveLength(1)
      expect(response.body.data.appointments).toHaveLength(1)
    })
  })
})
```

---

## Summary

The **Patients Router** provides complete CRUD operations for managing eldercare patient profiles:

**Endpoints (6 total)**:
- **GET /api/patients** - List all active patients (sorted by name)
- **GET /api/patients/:id** - Get specific patient details
- **POST /api/patients** - Create new patient (name required)
- **PUT /api/patients/:id** - Update patient (dynamic field updates)
- **DELETE /api/patients/:id** - Soft delete patient (set active = 0)
- **GET /api/patients/:id/summary** - Get patient with related data

**Key Features**:
- Comprehensive patient profiles (15 fields)
- Emergency contact information
- Primary doctor and insurance details
- Soft deletion for data preservation
- Patient summary with medications, appointments, vitals
- Dynamic updates (only changed fields)
- Zod validation on all mutations

**Database Schema**:
- 15 fields including demographics, contacts, medical, insurance
- Soft delete via `active` flag
- Timestamps for audit trail
- Foreign key relationships with medications, appointments, vitals

**Use Cases**:
- Manage family members receiving eldercare
- Store critical medical contacts
- Track insurance and doctor information
- Generate patient dashboards
- Preserve historical patient data

**Integration**:
Central to eldercare application - patient ID used throughout system for medications, appointments, vitals, and medical records. Summary endpoint provides comprehensive patient overview for dashboards.
