# Medications Router Documentation

## Overview

The `medicationsRouter.ts` file implements **medication management endpoints** for tracking patient medications in the eldercare system. It provides complete CRUD operations for managing prescription and over-the-counter medications.

**Location**: `/backend/routes/medicationsRouter.ts`

**Mounted At**: `/api/medications`

**Purpose**:
- Track all medications for patients
- Record prescription details (prescribing doctor, pharmacy, Rx number)
- Monitor dosage, frequency, and administration route
- Document potential side effects and notes
- Support medication history through soft deletes
- Enable filtering by patient

**Key Features**:
- **Patient Association**: Each medication linked to a specific patient (required)
- **Comprehensive Details**: Generic names, dosage, frequency, route, prescribing info
- **Pharmacy Tracking**: Store pharmacy name and prescription numbers
- **Side Effect Monitoring**: Document known or observed side effects
- **Soft Deletes**: Maintain medication history when medications are discontinued
- **Query Filtering**: List all medications or filter by specific patient

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
- **Zod**: Runtime validation for medication data
- **API Contract**: Standardized response formats (`okList`, `okItem`, `err`)
- **Router Helpers**: ID generation and error handling
- **Database**: SQLite connection for data persistence

---

## Database Schema

### Medications Table

```sql
CREATE TABLE IF NOT EXISTS "medications" (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  name TEXT NOT NULL,
  generic_name TEXT,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  route TEXT,
  prescribing_doctor TEXT,
  pharmacy TEXT,
  rx_number TEXT,
  side_effects TEXT,
  notes TEXT,
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

CREATE INDEX idx_medications_patient ON medications(patient_id);
CREATE INDEX idx_medications_active ON medications(active);
```

**Field Explanations**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | TEXT | Yes | Primary key (generated via `generateId()`) |
| `patient_id` | TEXT | Yes | Foreign key to patients table (CASCADE delete) |
| `name` | TEXT | Yes | Brand/common medication name (e.g., "Tylenol", "Lipitor") |
| `generic_name` | TEXT | No | Generic/chemical name (e.g., "acetaminophen", "atorvastatin") |
| `dosage` | TEXT | Yes | Dosage amount (e.g., "10mg", "500mg", "1 tablet") |
| `frequency` | TEXT | Yes | How often taken (e.g., "twice daily", "every 6 hours", "as needed") |
| `route` | TEXT | No | Administration route (e.g., "oral", "topical", "injection") |
| `prescribing_doctor` | TEXT | No | Name of doctor who prescribed |
| `pharmacy` | TEXT | No | Pharmacy name/location |
| `rx_number` | TEXT | No | Prescription number for refills |
| `side_effects` | TEXT | No | Known or observed side effects |
| `notes` | TEXT | No | Additional notes (timing, food requirements, etc.) |
| `active` | INTEGER | Yes | 1 = active medication, 0 = discontinued (default: 1) |
| `created_at` | TEXT | Yes | Record creation timestamp |
| `updated_at` | TEXT | Yes | Last update timestamp |

**Foreign Key Constraints**:
- `patient_id` → `patients(id)` ON DELETE CASCADE
  - When a patient is deleted, all their medications are automatically deleted
  - Ensures referential integrity

**Indexes**:
- `idx_medications_patient`: Fast queries for all medications of a specific patient
- `idx_medications_active`: Fast filtering of active vs discontinued medications

**Soft Delete Pattern**:
- `active = 1`: Current/active medication
- `active = 0`: Discontinued medication (preserved for history)

---

## Validation Schemas

### Create Medication Schema

```typescript
const createMedicationSchema = z.object({
  patient_id: z.string().min(1),
  name: z.string().min(1).max(200),
  generic_name: z.string().nullable().optional(),
  dosage: z.string().min(1).max(100),
  frequency: z.string().min(1),
  route: z.string().nullable().optional(),
  prescribing_doctor: z.string().nullable().optional(),
  pharmacy: z.string().nullable().optional(),
  rx_number: z.string().nullable().optional(),
  side_effects: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})
```

**Validation Rules**:
- `patient_id`: Required, non-empty string
- `name`: Required, 1-200 characters (brand/common name)
- `generic_name`: Optional, can be null
- `dosage`: Required, 1-100 characters (e.g., "10mg")
- `frequency`: Required, non-empty string (e.g., "twice daily")
- `route`: Optional, can be null (e.g., "oral", "injection")
- `prescribing_doctor`: Optional, can be null
- `pharmacy`: Optional, can be null
- `rx_number`: Optional, can be null
- `side_effects`: Optional, can be null
- `notes`: Optional, can be null

**Why `.nullable().optional()`**:
- `.optional()`: Field can be omitted from request body
- `.nullable()`: Field can explicitly be set to `null`
- Supports both `{}` (field omitted) and `{ generic_name: null }` (field null)

### Update Medication Schema

```typescript
const updateMedicationSchema = createMedicationSchema.partial().omit({ patient_id: true })
```

**Transformations**:
- `.partial()`: Makes all fields optional (allows partial updates)
- `.omit({ patient_id: true })`: Removes `patient_id` (can't change patient association after creation)

**Result**: All fields optional except `patient_id` is excluded

**Example Valid Update**:
```typescript
{
  dosage: "20mg",        // Only updating dosage
  frequency: "once daily" // and frequency
}
// All other fields remain unchanged
```

---

## Endpoints

### GET /api/medications

**Purpose**: List all active medications, optionally filtered by patient.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `patient_id` | string | No | Filter medications by specific patient ID |

#### Implementation

```typescript
router.get('/', async (req, res) => {
  try {
    const { patient_id } = req.query
    
    let query = `
      SELECT m.*, p.name as patient_name 
      FROM medications m
      LEFT JOIN patients p ON m.patient_id = p.id
      WHERE m.active = 1
    `
    const params: string[] = []
    
    if (patient_id) {
      query += ` AND m.patient_id = ?`
      params.push(patient_id as string)
    }
    
    query += ` ORDER BY m.created_at DESC`
    
    const medications = db.prepare(query).all(...params)
    okList(res, medications)
  } catch (error) {
    handleRouterError(res, error, 'Failed to retrieve medications')
  }
})
```

**SQL Details**:
- **LEFT JOIN patients**: Enriches each medication with `patient_name` field
- **WHERE active = 1**: Only returns active medications (excludes discontinued)
- **Dynamic Filtering**: Adds `patient_id` filter if query parameter provided
- **ORDER BY created_at DESC**: Newest medications first

**Query Optimization**:
- Uses `idx_medications_active` index for `active = 1` filter
- Uses `idx_medications_patient` index when `patient_id` parameter provided

#### Response Format

```typescript
{
  data: [
    {
      id: "med_abc123",
      patient_id: "pat_xyz789",
      patient_name: "John Smith",        // Enriched from JOIN
      name: "Lipitor",
      generic_name: "atorvastatin",
      dosage: "10mg",
      frequency: "once daily at bedtime",
      route: "oral",
      prescribing_doctor: "Dr. Sarah Johnson",
      pharmacy: "CVS Pharmacy - Main St",
      rx_number: "RX12345678",
      side_effects: "Mild muscle aches initially",
      notes: "Take with food. Monitor cholesterol levels monthly.",
      active: 1,
      created_at: "2024-01-15T10:00:00.000Z",
      updated_at: "2024-01-15T10:00:00.000Z"
    },
    {
      id: "med_def456",
      patient_id: "pat_xyz789",
      patient_name: "John Smith",
      name: "Metformin",
      generic_name: "metformin hydrochloride",
      dosage: "500mg",
      frequency: "twice daily with meals",
      route: "oral",
      prescribing_doctor: "Dr. Michael Chen",
      pharmacy: "Walgreens - Oak Ave",
      rx_number: "RX87654321",
      side_effects: null,
      notes: "For type 2 diabetes management",
      active: 1,
      created_at: "2024-01-10T14:30:00.000Z",
      updated_at: "2024-01-10T14:30:00.000Z"
    }
  ]
}
```

**Enriched Fields**:
- `patient_name`: Added via LEFT JOIN (not stored in medications table)

#### Example Requests

```typescript
// Get all active medications (all patients)
const allMeds = await fetch('/api/medications')
const allData = await allMeds.json()
console.log(`Total medications: ${allData.data.length}`)

// Get medications for specific patient
const patientMeds = await fetch('/api/medications?patient_id=pat_xyz789')
const patientData = await patientMeds.json()
console.log(`John's medications: ${patientData.data.length}`)

// Frontend filtering example
const allData = await fetch('/api/medications').then(r => r.json())
const prescribedByDrJohnson = allData.data.filter(m => 
  m.prescribing_doctor?.includes('Johnson')
)
```

---

### GET /api/medications/:id

**Purpose**: Retrieve detailed information for a specific medication.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Medication ID |

#### Implementation

```typescript
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const medication = db.prepare(`
      SELECT m.*, p.name as patient_name 
      FROM medications m
      LEFT JOIN patients p ON m.patient_id = p.id
      WHERE m.id = ? AND m.active = 1
    `).get(id)

    if (!medication) {
      return err(res, 404, 'NOT_FOUND', 'Medication not found')
    }

    okItem(res, medication)
  } catch (error) {
    handleRouterError(res, error, 'Failed to retrieve medication')
  }
})
```

**SQL Details**:
- **LEFT JOIN patients**: Enriches medication with patient name
- **WHERE m.id = ?**: Primary key lookup (very fast)
- **AND m.active = 1**: Only returns if medication is active

**Edge Cases**:
- Returns 404 if medication doesn't exist
- Returns 404 if medication is discontinued (`active = 0`)

#### Response Format (Success)

```typescript
{
  data: {
    id: "med_abc123",
    patient_id: "pat_xyz789",
    patient_name: "John Smith",
    name: "Lipitor",
    generic_name: "atorvastatin",
    dosage: "10mg",
    frequency: "once daily at bedtime",
    route: "oral",
    prescribing_doctor: "Dr. Sarah Johnson",
    pharmacy: "CVS Pharmacy - Main St",
    rx_number: "RX12345678",
    side_effects: "Mild muscle aches initially",
    notes: "Take with food. Monitor cholesterol levels monthly.",
    active: 1,
    created_at: "2024-01-15T10:00:00.000Z",
    updated_at: "2024-01-15T10:00:00.000Z"
  }
}
```

#### Response Format (Not Found)

```typescript
{
  error: {
    code: "NOT_FOUND",
    message: "Medication not found"
  }
}
```

**HTTP Status**: 404

#### Example Request

```typescript
const response = await fetch('/api/medications/med_abc123')

if (response.ok) {
  const data = await response.json()
  console.log(`${data.data.name} (${data.data.generic_name})`)
  console.log(`Dosage: ${data.data.dosage}`)
  console.log(`Frequency: ${data.data.frequency}`)
  console.log(`Prescribed by: ${data.data.prescribing_doctor}`)
} else if (response.status === 404) {
  console.log('Medication not found or discontinued')
}
```

---

### POST /api/medications

**Purpose**: Create a new medication record for a patient.

#### Request Body

```typescript
{
  patient_id: string;           // Required
  name: string;                 // Required (1-200 chars)
  generic_name?: string | null;
  dosage: string;               // Required (1-100 chars)
  frequency: string;            // Required
  route?: string | null;
  prescribing_doctor?: string | null;
  pharmacy?: string | null;
  rx_number?: string | null;
  side_effects?: string | null;
  notes?: string | null;
}
```

#### Implementation Flow

**1. Validate Request Body**

```typescript
const validatedData = createMedicationSchema.parse(req.body)
```

**Validation Checks**:
- All required fields present (`patient_id`, `name`, `dosage`, `frequency`)
- String length constraints met
- Type correctness (strings vs nulls)

**2. Verify Patient Exists**

```typescript
const patient = db.prepare(`
  SELECT id FROM patients WHERE id = ? AND active = 1
`).get(validatedData.patient_id)

if (!patient) {
  return err(res, 404, 'NOT_FOUND', 'Patient not found')
}
```

**Why**: Prevents orphaned medications (referential integrity check before INSERT)

**3. Generate ID and Insert**

```typescript
const medicationId = generateId()
const now = new Date().toISOString()

const insertMedication = db.prepare(`
  INSERT INTO medications (
    id, patient_id, name, generic_name, dosage, frequency, route,
    prescribing_doctor, pharmacy, rx_number,
    side_effects, notes, active, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
`)

insertMedication.run(
  medicationId,
  validatedData.patient_id,
  validatedData.name,
  validatedData.generic_name || null,
  validatedData.dosage,
  validatedData.frequency,
  validatedData.route || null,
  validatedData.prescribing_doctor || null,
  validatedData.pharmacy || null,
  validatedData.rx_number || null,
  validatedData.side_effects || null,
  validatedData.notes || null,
  now,
  now
)
```

**Null Handling**: `validatedData.field || null` ensures undefined values become SQL NULL

**Active Flag**: Always set to `1` for new medications (active by default)

**4. Retrieve and Return Created Medication**

```typescript
const createdMedication = db.prepare(`
  SELECT m.*, p.name as patient_name 
  FROM medications m
  LEFT JOIN patients p ON m.patient_id = p.id
  WHERE m.id = ?
`).get(medicationId)

okItem(res, createdMedication, 201)
```

**Why Re-Fetch**: Returns enriched data with `patient_name` field

**Status Code**: `201 Created`

#### Response Format (Success)

```typescript
{
  data: {
    id: "med_new123",
    patient_id: "pat_xyz789",
    patient_name: "John Smith",
    name: "Aspirin",
    generic_name: "acetylsalicylic acid",
    dosage: "81mg",
    frequency: "once daily in the morning",
    route: "oral",
    prescribing_doctor: "Dr. Emily Brown",
    pharmacy: "Rite Aid - 5th Street",
    rx_number: "RX99887766",
    side_effects: null,
    notes: "Baby aspirin for heart health. Take with food.",
    active: 1,
    created_at: "2024-01-20T15:30:00.000Z",
    updated_at: "2024-01-20T15:30:00.000Z"
  }
}
```

**HTTP Status**: 201 Created

#### Response Format (Validation Error)

```typescript
{
  error: {
    code: "VALIDATION_ERROR",
    message: "Invalid medication data",
    details: {
      issues: [
        {
          code: "too_small",
          minimum: 1,
          type: "string",
          inclusive: true,
          message: "String must contain at least 1 character(s)",
          path: ["name"]
        }
      ]
    }
  }
}
```

**HTTP Status**: 400 Bad Request

#### Response Format (Patient Not Found)

```typescript
{
  error: {
    code: "NOT_FOUND",
    message: "Patient not found"
  }
}
```

**HTTP Status**: 404 Not Found

#### Example Request

```typescript
const response = await fetch('/api/medications', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    patient_id: "pat_xyz789",
    name: "Aspirin",
    generic_name: "acetylsalicylic acid",
    dosage: "81mg",
    frequency: "once daily in the morning",
    route: "oral",
    prescribing_doctor: "Dr. Emily Brown",
    pharmacy: "Rite Aid - 5th Street",
    rx_number: "RX99887766",
    notes: "Baby aspirin for heart health. Take with food to reduce stomach upset."
  })
})

if (response.status === 201) {
  const data = await response.json()
  console.log(`Created medication: ${data.data.id}`)
} else if (response.status === 404) {
  console.error('Patient not found')
} else if (response.status === 400) {
  const error = await response.json()
  console.error('Validation errors:', error.error.details.issues)
}
```

---

### PUT /api/medications/:id

**Purpose**: Update an existing medication record (partial update).

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Medication ID to update |

#### Request Body

All fields optional (partial update):

```typescript
{
  name?: string;
  generic_name?: string | null;
  dosage?: string;
  frequency?: string;
  route?: string | null;
  prescribing_doctor?: string | null;
  pharmacy?: string | null;
  rx_number?: string | null;
  side_effects?: string | null;
  notes?: string | null;
}
```

**Note**: `patient_id` cannot be changed after creation (omitted from update schema)

#### Implementation Flow

**1. Validate Request**

```typescript
const validatedData = updateMedicationSchema.parse(req.body)

const existingMedication = db.prepare(`
  SELECT * FROM medications WHERE id = ? AND active = 1
`).get(id)

if (!existingMedication) {
  return err(res, 404, 'NOT_FOUND', 'Medication not found')
}
```

**2. Build Dynamic UPDATE Query**

```typescript
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
```

**Dynamic Query Building**:
- Only updates fields present in request body
- Skips `undefined` values
- Always updates `updated_at` timestamp
- Prevents empty updates (returns 400 if no fields)

**3. Execute Update**

```typescript
const updateQuery = `
  UPDATE medications 
  SET ${updateFields.join(', ')} 
  WHERE id = ?
`

db.prepare(updateQuery).run(...updateValues)
```

**Example Built Query**:
```sql
UPDATE medications 
SET dosage = ?, frequency = ?, notes = ?, updated_at = ? 
WHERE id = ?
-- values: ['20mg', 'twice daily', 'Updated notes...', '2024-01-20T16:00:00.000Z', 'med_abc123']
```

**4. Retrieve and Return Updated Medication**

```typescript
const updatedMedication = db.prepare(`
  SELECT m.*, p.name as patient_name 
  FROM medications m
  LEFT JOIN patients p ON m.patient_id = p.id
  WHERE m.id = ?
`).get(id)

okItem(res, updatedMedication)
```

#### Response Format (Success)

```typescript
{
  data: {
    id: "med_abc123",
    patient_id: "pat_xyz789",
    patient_name: "John Smith",
    name: "Lipitor",
    generic_name: "atorvastatin",
    dosage: "20mg",              // Updated
    frequency: "twice daily",     // Updated
    route: "oral",
    prescribing_doctor: "Dr. Sarah Johnson",
    pharmacy: "CVS Pharmacy - Main St",
    rx_number: "RX12345678",
    side_effects: "Mild muscle aches initially",
    notes: "Increased dosage per doctor's recommendation. Monitor liver function.", // Updated
    active: 1,
    created_at: "2024-01-15T10:00:00.000Z",
    updated_at: "2024-01-20T16:00:00.000Z"  // Updated
  }
}
```

#### Response Format (Not Found)

```typescript
{
  error: {
    code: "NOT_FOUND",
    message: "Medication not found"
  }
}
```

**HTTP Status**: 404

#### Response Format (No Fields to Update)

```typescript
{
  error: {
    code: "VALIDATION_ERROR",
    message: "No fields to update"
  }
}
```

**HTTP Status**: 400

#### Example Requests

```typescript
// Update dosage and frequency
await fetch('/api/medications/med_abc123', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    dosage: "20mg",
    frequency: "twice daily",
    notes: "Increased dosage per doctor's recommendation. Monitor liver function."
  })
})

// Update pharmacy and Rx number (prescription refill)
await fetch('/api/medications/med_abc123', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    pharmacy: "New Pharmacy - Downtown",
    rx_number: "RX11223344"
  })
})

// Document observed side effects
await fetch('/api/medications/med_abc123', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    side_effects: "Mild nausea in the morning. Resolved when taking with food."
  })
})

// Set field to null (clear value)
await fetch('/api/medications/med_abc123', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    side_effects: null  // Clear side effects
  })
})
```

---

### DELETE /api/medications/:id

**Purpose**: Soft delete a medication (mark as discontinued).

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Medication ID to delete |

#### Implementation

```typescript
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const existingMedication = db.prepare(`
      SELECT * FROM medications WHERE id = ? AND active = 1
    `).get(id)

    if (!existingMedication) {
      return err(res, 404, 'NOT_FOUND', 'Medication not found')
    }

    // Soft delete by setting active = 0
    db.prepare(`
      UPDATE medications 
      SET active = 0, updated_at = ? 
      WHERE id = ?
    `).run(new Date().toISOString(), id)

    okItem(res, { message: 'Medication deleted successfully' })
  } catch (error) {
    handleRouterError(res, error, 'Failed to delete medication')
  }
})
```

**Soft Delete Logic**:
- Sets `active = 0` instead of `DELETE FROM medications`
- Updates `updated_at` timestamp to record when discontinued
- Preserves all medication data for historical records

**Why Soft Delete**:
- Maintain complete medication history
- Enable medication timeline reports
- Track medication changes over time
- Audit trail for healthcare providers
- Potential for "reactivating" if medication resumed

#### Response Format (Success)

```typescript
{
  data: {
    message: "Medication deleted successfully"
  }
}
```

**HTTP Status**: 200 OK

#### Response Format (Not Found)

```typescript
{
  error: {
    code: "NOT_FOUND",
    message: "Medication not found"
  }
}
```

**HTTP Status**: 404

**When Does This Happen**:
- Medication ID doesn't exist
- Medication already discontinued (`active = 0`)

#### Example Request

```typescript
const response = await fetch('/api/medications/med_abc123', {
  method: 'DELETE'
})

if (response.ok) {
  console.log('Medication discontinued')
  // Update UI to remove from active medications list
} else if (response.status === 404) {
  console.log('Medication not found or already discontinued')
}
```

---

## Usage Examples

### Track New Prescription

```typescript
async function addNewPrescription(patientId: string, prescriptionData: any) {
  const response = await fetch('/api/medications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patient_id: patientId,
      name: "Lisinopril",
      generic_name: "lisinopril",
      dosage: "10mg",
      frequency: "once daily in the morning",
      route: "oral",
      prescribing_doctor: "Dr. Michael Chen",
      pharmacy: "CVS Pharmacy - Main St",
      rx_number: "RX55443322",
      notes: "For blood pressure management. Take consistently at same time daily."
    })
  })
  
  if (response.status === 201) {
    const data = await response.json()
    console.log(`Added ${data.data.name} to medication list`)
    return data.data
  } else if (response.status === 404) {
    console.error('Patient not found')
  }
}
```

### Get Patient's Medication List

```typescript
async function getPatientMedications(patientId: string) {
  const response = await fetch(`/api/medications?patient_id=${patientId}`)
  const data = await response.json()
  
  console.log(`${data.data.length} active medications:`)
  data.data.forEach(med => {
    console.log(`- ${med.name} (${med.generic_name}): ${med.dosage} ${med.frequency}`)
  })
  
  return data.data
}

// Usage
const johnsMeds = await getPatientMedications('pat_xyz789')
```

### Update Dosage After Doctor Visit

```typescript
async function updateMedicationDosage(medicationId: string, newDosage: string, reason: string) {
  const response = await fetch(`/api/medications/${medicationId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dosage: newDosage,
      notes: reason
    })
  })
  
  if (response.ok) {
    const data = await response.json()
    console.log(`Updated ${data.data.name} dosage to ${data.data.dosage}`)
    return data.data
  }
}

// Usage
await updateMedicationDosage(
  'med_abc123',
  '20mg',
  'Increased from 10mg to 20mg per Dr. Johnson. Follow-up in 1 month to check cholesterol levels.'
)
```

### Document Side Effects

```typescript
async function reportSideEffect(medicationId: string, sideEffect: string) {
  // Get current medication to preserve existing side effects
  const current = await fetch(`/api/medications/${medicationId}`).then(r => r.json())
  
  // Append new side effect to existing
  const updatedSideEffects = current.data.side_effects
    ? `${current.data.side_effects}; ${sideEffect}`
    : sideEffect
  
  await fetch(`/api/medications/${medicationId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      side_effects: updatedSideEffects
    })
  })
  
  console.log('Side effect documented')
}

// Usage
await reportSideEffect(
  'med_abc123',
  'Mild dizziness in the morning (first 30 min after taking)'
)
```

### Discontinue Medication

```typescript
async function discontinueMedication(medicationId: string, reason: string) {
  // First, add discontinuation note
  await fetch(`/api/medications/${medicationId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      notes: `DISCONTINUED: ${reason}`
    })
  })
  
  // Then soft delete
  const response = await fetch(`/api/medications/${medicationId}`, {
    method: 'DELETE'
  })
  
  if (response.ok) {
    console.log('Medication discontinued')
  }
}

// Usage
await discontinueMedication(
  'med_abc123',
  'Replaced with different statin due to muscle pain side effects'
)
```

### Generate Medication Report

```typescript
async function generateMedicationReport(patientId: string) {
  const response = await fetch(`/api/medications?patient_id=${patientId}`)
  const data = await response.json()
  
  const report = {
    patient_id: patientId,
    total_medications: data.data.length,
    by_doctor: {},
    by_pharmacy: {},
    medications: data.data.map(med => ({
      name: `${med.name} (${med.generic_name || 'N/A'})`,
      dosage: med.dosage,
      frequency: med.frequency,
      prescribing_doctor: med.prescribing_doctor || 'Unknown',
      pharmacy: med.pharmacy || 'Unknown',
      rx_number: med.rx_number,
      has_side_effects: !!med.side_effects
    }))
  }
  
  // Group by doctor
  data.data.forEach(med => {
    const doctor = med.prescribing_doctor || 'Unknown'
    report.by_doctor[doctor] = (report.by_doctor[doctor] || 0) + 1
  })
  
  // Group by pharmacy
  data.data.forEach(med => {
    const pharmacy = med.pharmacy || 'Unknown'
    report.by_pharmacy[pharmacy] = (report.by_pharmacy[pharmacy] || 0) + 1
  })
  
  return report
}

// Usage
const report = await generateMedicationReport('pat_xyz789')
console.log(`Total: ${report.total_medications} medications`)
console.log('By Doctor:', report.by_doctor)
console.log('By Pharmacy:', report.by_pharmacy)
```

---

## Best Practices

### 1. Always Verify Patient Exists Before Creating

```typescript
// ✅ GOOD: Backend validates patient_id before INSERT
// This is already implemented in POST endpoint

// ❌ BAD: Don't skip validation
// Would result in orphaned medications if patient deleted
```

### 2. Use Generic Names for Better Tracking

```typescript
// ✅ GOOD: Include both brand and generic names
{
  name: "Lipitor",
  generic_name: "atorvastatin"
}

// ⚠️ OKAY: Brand name only (but less searchable)
{
  name: "Lipitor",
  generic_name: null
}
```

**Why**: Generic names help identify equivalent medications from different manufacturers

### 3. Be Specific with Dosage and Frequency

```typescript
// ✅ GOOD: Clear, specific instructions
{
  dosage: "10mg",
  frequency: "once daily at bedtime",
  notes: "Take with food to reduce stomach upset"
}

// ❌ BAD: Vague information
{
  dosage: "1 pill",
  frequency: "daily",
  notes: ""
}
```

### 4. Document Side Effects Consistently

```typescript
// ✅ GOOD: Descriptive and timestamped in notes
{
  side_effects: "Mild nausea (first 2 weeks, now resolved); Occasional dizziness in morning",
  notes: "Side effects started 2024-01-15, nausea resolved by 2024-02-01"
}

// ⚠️ OKAY: Brief but helpful
{
  side_effects: "Mild nausea initially, resolved"
}
```

### 5. Soft Delete Instead of Hard Delete

```typescript
// ✅ GOOD: Use DELETE endpoint (soft delete)
await fetch(`/api/medications/${id}`, { method: 'DELETE' })
// Sets active = 0, preserves history

// ❌ BAD: Never do direct database DELETE
// db.prepare('DELETE FROM medications WHERE id = ?').run(id)
// Loses medication history forever
```

### 6. Update Pharmacy Info When Refilling

```typescript
// ✅ GOOD: Track pharmacy changes
async function refillPrescription(medId: string, newPharmacy: string, newRxNumber: string) {
  await fetch(`/api/medications/${medId}`, {
    method: 'PUT',
    body: JSON.stringify({
      pharmacy: newPharmacy,
      rx_number: newRxNumber,
      notes: `Refilled at ${newPharmacy} on ${new Date().toISOString().split('T')[0]}`
    })
  })
}
```

### 7. Include Prescribing Doctor for Reference

```typescript
// ✅ GOOD: Full doctor information
{
  prescribing_doctor: "Dr. Sarah Johnson, MD - Cardiology"
}

// ⚠️ OKAY: Basic name
{
  prescribing_doctor: "Dr. Johnson"
}

// ❌ BAD: Missing (harder to coordinate care)
{
  prescribing_doctor: null
}
```

---

## Frontend Integration

### Medication List Component

```vue
<template>
  <div class="medications-list">
    <h2>Medications for {{ patientName }}</h2>
    
    <div class="filters">
      <input 
        v-model="searchTerm" 
        placeholder="Search medications..."
        type="text"
      />
      <select v-model="filterDoctor">
        <option value="">All Doctors</option>
        <option v-for="doc in uniqueDoctors" :key="doc">{{ doc }}</option>
      </select>
    </div>
    
    <div class="medication-grid">
      <div 
        v-for="med in filteredMedications" 
        :key="med.id" 
        class="medication-card"
      >
        <h3>{{ med.name }}</h3>
        <p class="generic-name" v-if="med.generic_name">
          ({{ med.generic_name }})
        </p>
        
        <div class="dosage-info">
          <strong>{{ med.dosage }}</strong> - {{ med.frequency }}
        </div>
        
        <div class="details">
          <div v-if="med.route">
            <label>Route:</label> {{ med.route }}
          </div>
          <div v-if="med.prescribing_doctor">
            <label>Prescribed by:</label> {{ med.prescribing_doctor }}
          </div>
          <div v-if="med.pharmacy">
            <label>Pharmacy:</label> {{ med.pharmacy }}
          </div>
          <div v-if="med.rx_number">
            <label>Rx #:</label> {{ med.rx_number }}
          </div>
        </div>
        
        <div v-if="med.side_effects" class="side-effects">
          <label>⚠️ Side Effects:</label>
          <p>{{ med.side_effects }}</p>
        </div>
        
        <div v-if="med.notes" class="notes">
          <label>Notes:</label>
          <p>{{ med.notes }}</p>
        </div>
        
        <div class="actions">
          <button @click="editMedication(med.id)" class="btn-secondary">
            Edit
          </button>
          <button @click="discontinueMedication(med.id)" class="btn-danger">
            Discontinue
          </button>
        </div>
      </div>
    </div>
    
    <button @click="addNewMedication" class="btn-primary add-btn">
      + Add Medication
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

interface Medication {
  id: string
  name: string
  generic_name: string | null
  dosage: string
  frequency: string
  route: string | null
  prescribing_doctor: string | null
  pharmacy: string | null
  rx_number: string | null
  side_effects: string | null
  notes: string | null
}

const props = defineProps<{ patientId: string; patientName: string }>()
const router = useRouter()

const medications = ref<Medication[]>([])
const searchTerm = ref('')
const filterDoctor = ref('')

const uniqueDoctors = computed(() => {
  const doctors = medications.value
    .map(m => m.prescribing_doctor)
    .filter(Boolean) as string[]
  return [...new Set(doctors)]
})

const filteredMedications = computed(() => {
  return medications.value.filter(med => {
    const matchesSearch = !searchTerm.value || 
      med.name.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      med.generic_name?.toLowerCase().includes(searchTerm.value.toLowerCase())
    
    const matchesDoctor = !filterDoctor.value || 
      med.prescribing_doctor === filterDoctor.value
    
    return matchesSearch && matchesDoctor
  })
})

async function loadMedications() {
  const response = await fetch(`/api/medications?patient_id=${props.patientId}`)
  const data = await response.json()
  medications.value = data.data
}

function editMedication(id: string) {
  router.push(`/medications/${id}/edit`)
}

async function discontinueMedication(id: string) {
  if (!confirm('Discontinue this medication?')) return
  
  const response = await fetch(`/api/medications/${id}`, {
    method: 'DELETE'
  })
  
  if (response.ok) {
    await loadMedications()
  }
}

function addNewMedication() {
  router.push(`/patients/${props.patientId}/medications/new`)
}

onMounted(loadMedications)
</script>

<style scoped>
.medication-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  margin: 1.5rem 0;
}

.medication-card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
}

.generic-name {
  color: #666;
  font-style: italic;
  margin-top: -0.5rem;
}

.dosage-info {
  background: #f0f8ff;
  padding: 0.75rem;
  border-radius: 4px;
  margin: 1rem 0;
  font-size: 1.1rem;
}

.side-effects {
  background: #fff3cd;
  padding: 0.75rem;
  border-radius: 4px;
  margin-top: 1rem;
}

.notes {
  background: #f5f5f5;
  padding: 0.75rem;
  border-radius: 4px;
  margin-top: 0.5rem;
}

.actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}
</style>
```

### Add/Edit Medication Form Component

```vue
<template>
  <div class="medication-form">
    <h2>{{ isEdit ? 'Edit' : 'Add' }} Medication</h2>
    
    <form @submit.prevent="saveMedication">
      <div class="form-row">
        <div class="form-group">
          <label>Brand Name *</label>
          <input v-model="form.name" type="text" required />
        </div>
        
        <div class="form-group">
          <label>Generic Name</label>
          <input v-model="form.generic_name" type="text" />
        </div>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label>Dosage *</label>
          <input v-model="form.dosage" type="text" required placeholder="e.g., 10mg, 2 tablets" />
        </div>
        
        <div class="form-group">
          <label>Route</label>
          <select v-model="form.route">
            <option value="">Select route...</option>
            <option value="oral">Oral</option>
            <option value="injection">Injection</option>
            <option value="topical">Topical</option>
            <option value="inhaled">Inhaled</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>
      
      <div class="form-group">
        <label>Frequency *</label>
        <input 
          v-model="form.frequency" 
          type="text" 
          required 
          placeholder="e.g., twice daily with meals, once daily at bedtime"
        />
      </div>
      
      <div class="form-group">
        <label>Prescribing Doctor</label>
        <input v-model="form.prescribing_doctor" type="text" />
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label>Pharmacy</label>
          <input v-model="form.pharmacy" type="text" />
        </div>
        
        <div class="form-group">
          <label>Prescription Number</label>
          <input v-model="form.rx_number" type="text" />
        </div>
      </div>
      
      <div class="form-group">
        <label>Known/Observed Side Effects</label>
        <textarea 
          v-model="form.side_effects" 
          rows="3"
          placeholder="Document any side effects..."
        ></textarea>
      </div>
      
      <div class="form-group">
        <label>Notes</label>
        <textarea 
          v-model="form.notes" 
          rows="4"
          placeholder="Additional instructions, timing, food requirements, etc."
        ></textarea>
      </div>
      
      <div class="form-actions">
        <button type="submit" class="btn-primary">
          {{ isEdit ? 'Save Changes' : 'Add Medication' }}
        </button>
        <button type="button" @click="cancel" class="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const isEdit = ref(false)
const form = ref({
  name: '',
  generic_name: null as string | null,
  dosage: '',
  frequency: '',
  route: null as string | null,
  prescribing_doctor: null as string | null,
  pharmacy: null as string | null,
  rx_number: null as string | null,
  side_effects: null as string | null,
  notes: null as string | null,
})

async function loadMedication() {
  if (route.params.id) {
    isEdit.value = true
    const response = await fetch(`/api/medications/${route.params.id}`)
    const data = await response.json()
    
    form.value = {
      name: data.data.name,
      generic_name: data.data.generic_name,
      dosage: data.data.dosage,
      frequency: data.data.frequency,
      route: data.data.route,
      prescribing_doctor: data.data.prescribing_doctor,
      pharmacy: data.data.pharmacy,
      rx_number: data.data.rx_number,
      side_effects: data.data.side_effects,
      notes: data.data.notes,
    }
  }
}

async function saveMedication() {
  const url = isEdit.value 
    ? `/api/medications/${route.params.id}`
    : '/api/medications'
  
  const method = isEdit.value ? 'PUT' : 'POST'
  
  const body = isEdit.value 
    ? form.value 
    : { ...form.value, patient_id: route.params.patientId }
  
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  
  if (response.ok) {
    router.push(`/patients/${route.params.patientId}/medications`)
  } else {
    const error = await response.json()
    alert(`Error: ${error.error.message}`)
  }
}

function cancel() {
  router.back()
}

onMounted(loadMedication)
</script>
```

---

## Performance Considerations

### 1. Index Usage

**Optimized Queries**:
```sql
-- Uses idx_medications_patient
SELECT * FROM medications WHERE patient_id = ?

-- Uses idx_medications_active
SELECT * FROM medications WHERE active = 1

-- Uses both indexes (compound optimization)
SELECT * FROM medications WHERE patient_id = ? AND active = 1
```

**Query Performance**:
- Patient filtering: O(log n) via index
- Active filtering: O(log n) via index
- Combined: Very fast even with thousands of medications

### 2. LEFT JOIN Impact

**Current JOIN**:
```sql
SELECT m.*, p.name as patient_name 
FROM medications m
LEFT JOIN patients p ON m.patient_id = p.id
```

**Performance**: Minimal overhead (1-2ms typically)
- Patients table is small (typically < 100 records)
- patient_id is indexed
- Only fetches one additional field (name)

**Alternative**: Could omit JOIN and fetch patient name separately if performance becomes issue

### 3. Caching Strategy

**Recommendation**: Cache medication lists on frontend

```typescript
// Frontend caching example
const medicationCache = new Map<string, { data: Medication[], expiry: number }>()
const CACHE_DURATION = 5 * 60 * 1000  // 5 minutes

async function getCachedMedications(patientId: string, useCache = true) {
  const now = Date.now()
  const cached = medicationCache.get(patientId)
  
  if (useCache && cached && now < cached.expiry) {
    return cached.data
  }
  
  const response = await fetch(`/api/medications?patient_id=${patientId}`)
  const data = await response.json()
  
  medicationCache.set(patientId, {
    data: data.data,
    expiry: now + CACHE_DURATION
  })
  
  return data.data
}
```

---

## Security Considerations

### 1. SQL Injection Protection

**Status**: ✅ Protected via parameterized queries

```typescript
// Safe - parameterized
db.prepare('SELECT * FROM medications WHERE patient_id = ?').all(patient_id)

// Vulnerable (not used)
db.exec(`SELECT * FROM medications WHERE patient_id = '${patient_id}'`)
```

### 2. Patient Authorization

**Current State**: No authorization checks

**Recommendation**: Add middleware to verify user can access patient's medications

```typescript
async function authorizePatientAccess(req, res, next) {
  const { patient_id } = req.query || req.body
  const userId = req.user?.id
  
  // Check if user has access to this patient
  const access = db.prepare(`
    SELECT 1 FROM patient_caregivers 
    WHERE patient_id = ? AND caregiver_id = ?
  `).get(patient_id, userId)
  
  if (!access) {
    return err(res, 403, 'FORBIDDEN', 'Access denied')
  }
  
  next()
}
```

### 3. Cascade Delete Protection

**Status**: ✅ Implemented via foreign key

```sql
FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
```

**Effect**: When patient deleted, all medications automatically deleted
- Prevents orphaned medication records
- Maintains data integrity

**Alternative**: Could use SET NULL and soft deletes for patients if you want to preserve medication history even after patient record removed

---

## Testing Considerations

### Unit Test Scenarios

```typescript
describe('Medications Router', () => {
  let testPatientId: string
  
  beforeEach(async () => {
    // Create test patient
    const patient = await request(app)
      .post('/api/patients')
      .send({ name: 'Test Patient' })
    testPatientId = patient.body.data.id
  })
  
  describe('POST /api/medications', () => {
    it('should create medication successfully', async () => {
      const response = await request(app)
        .post('/api/medications')
        .send({
          patient_id: testPatientId,
          name: 'Aspirin',
          generic_name: 'acetylsalicylic acid',
          dosage: '81mg',
          frequency: 'once daily'
        })
      
      expect(response.status).toBe(201)
      expect(response.body.data.name).toBe('Aspirin')
      expect(response.body.data.active).toBe(1)
    })
    
    it('should reject medication for non-existent patient', async () => {
      const response = await request(app)
        .post('/api/medications')
        .send({
          patient_id: 'invalid-patient-id',
          name: 'Aspirin',
          dosage: '81mg',
          frequency: 'once daily'
        })
      
      expect(response.status).toBe(404)
      expect(response.body.error.code).toBe('NOT_FOUND')
    })
    
    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/medications')
        .send({
          patient_id: testPatientId,
          name: 'Aspirin'
          // Missing dosage and frequency
        })
      
      expect(response.status).toBe(400)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })
  })
  
  describe('GET /api/medications', () => {
    it('should filter by patient_id', async () => {
      // Create medications for different patients
      const patient2 = await request(app)
        .post('/api/patients')
        .send({ name: 'Patient 2' })
      
      await request(app)
        .post('/api/medications')
        .send({
          patient_id: testPatientId,
          name: 'Med 1',
          dosage: '10mg',
          frequency: 'daily'
        })
      
      await request(app)
        .post('/api/medications')
        .send({
          patient_id: patient2.body.data.id,
          name: 'Med 2',
          dosage: '20mg',
          frequency: 'daily'
        })
      
      const response = await request(app)
        .get(`/api/medications?patient_id=${testPatientId}`)
      
      expect(response.body.data.length).toBe(1)
      expect(response.body.data[0].name).toBe('Med 1')
    })
    
    it('should include patient_name from JOIN', async () => {
      await request(app)
        .post('/api/medications')
        .send({
          patient_id: testPatientId,
          name: 'Aspirin',
          dosage: '81mg',
          frequency: 'daily'
        })
      
      const response = await request(app).get('/api/medications')
      
      expect(response.body.data[0].patient_name).toBe('Test Patient')
    })
  })
  
  describe('PUT /api/medications/:id', () => {
    it('should update medication fields', async () => {
      const created = await request(app)
        .post('/api/medications')
        .send({
          patient_id: testPatientId,
          name: 'Aspirin',
          dosage: '81mg',
          frequency: 'once daily'
        })
      
      const medId = created.body.data.id
      
      const response = await request(app)
        .put(`/api/medications/${medId}`)
        .send({
          dosage: '162mg',
          notes: 'Doubled dosage per doctor'
        })
      
      expect(response.status).toBe(200)
      expect(response.body.data.dosage).toBe('162mg')
      expect(response.body.data.notes).toBe('Doubled dosage per doctor')
      expect(response.body.data.frequency).toBe('once daily')  // Unchanged
    })
    
    it('should not allow changing patient_id', async () => {
      const created = await request(app)
        .post('/api/medications')
        .send({
          patient_id: testPatientId,
          name: 'Aspirin',
          dosage: '81mg',
          frequency: 'daily'
        })
      
      const response = await request(app)
        .put(`/api/medications/${created.body.data.id}`)
        .send({
          patient_id: 'different-patient-id'
        })
      
      // patient_id should be ignored (not in update schema)
      expect(response.status).toBe(400)
      expect(response.body.error.message).toBe('No fields to update')
    })
  })
  
  describe('DELETE /api/medications/:id', () => {
    it('should soft delete medication', async () => {
      const created = await request(app)
        .post('/api/medications')
        .send({
          patient_id: testPatientId,
          name: 'Aspirin',
          dosage: '81mg',
          frequency: 'daily'
        })
      
      const medId = created.body.data.id
      
      const deleteRes = await request(app)
        .delete(`/api/medications/${medId}`)
      
      expect(deleteRes.status).toBe(200)
      
      // Should not appear in GET (active = 0)
      const getRes = await request(app).get(`/api/medications/${medId}`)
      expect(getRes.status).toBe(404)
      
      // Should still exist in database
      const dbRow = db.prepare('SELECT * FROM medications WHERE id = ?').get(medId)
      expect(dbRow).toBeTruthy()
      expect(dbRow.active).toBe(0)
    })
  })
})
```

---

## Summary

The **Medications Router** provides comprehensive medication management for eldercare:

**Endpoints (5 total)**:
- **GET /api/medications**: List active medications (optional patient filter)
- **GET /api/medications/:id**: Get single medication details
- **POST /api/medications**: Create new medication (validates patient exists)
- **PUT /api/medications/:id**: Update medication (partial, can't change patient)
- **DELETE /api/medications/:id**: Soft delete (discontinue medication)

**Key Features**:
- **Patient Association**: Required foreign key with CASCADE delete
- **Comprehensive Data**: Brand name, generic name, dosage, frequency, route, prescriber, pharmacy, Rx number
- **Side Effect Tracking**: Document known and observed side effects
- **Soft Deletes**: Preserve medication history when discontinued
- **Enriched Responses**: Patient name included via LEFT JOIN
- **Query Filtering**: Get all medications or filter by patient

**Data Integrity**:
- Zod validation on all inputs
- Patient existence check before creation
- Foreign key constraints with CASCADE delete
- Soft delete pattern (`active` flag)
- Automatic timestamp management

**Use Cases**:
- Track current medications for each patient
- Document prescription details for refills
- Monitor and record side effects
- Maintain medication history
- Generate medication lists for healthcare providers
- Coordinate care across multiple doctors/pharmacies

**Best Practices**:
- Include both brand and generic names for better tracking
- Be specific with dosage and frequency instructions
- Document side effects as observed
- Update pharmacy info when refilling prescriptions
- Use soft deletes to preserve history
- Always verify patient exists before creating medications
