# Vitals Router Documentation

## Overview

The `vitalsRouter.ts` file implements the vital signs tracking system for eldercare patient monitoring. It manages daily health measurements including weight and blood glucose levels, enabling caregivers and healthcare providers to track patient health trends over time.

**Location**: `/backend/routes/vitalsRouter.ts`

**Mounted At**: `/api/vitals`

**Created**: Part of eldercare schema migration

**Purpose**:
- Track patient vital signs (weight, glucose)
- Monitor health trends over time
- Support diabetes management
- Enable data-driven care decisions
- Provide historical health data
- Alert to concerning changes

**Key Features**:
- **Complete CRUD**: List, get, create, update, delete vital records
- **Patient Association**: Link vitals to specific patients
- **Multi-Metric Support**: Weight and glucose (AM/PM) tracking
- **Date-Based Tracking**: Record vitals by date
- **Soft Delete**: Maintain data integrity with active flag
- **Patient Lookup**: Auto-populate patient names in responses
- **Filtering**: Query vitals by patient
- **Chronological Ordering**: Newest vitals first

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
- **Zod**: Request body validation
- **Database**: Direct SQLite queries
- **API Contract**: Standardized response format
- **Router Helpers**: Error handling and ID generation

---

## Database Schema

### Vitals Table

```sql
CREATE TABLE vitals (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  weight_kg REAL,
  glucose_am INTEGER,
  glucose_pm INTEGER,
  recorded_date TEXT NOT NULL,
  notes TEXT,
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);
```

**Field Explanations**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | TEXT | Yes | Unique vital record identifier (auto-generated) |
| `patient_id` | TEXT | Yes | Foreign key to patients table |
| `weight_kg` | REAL | No | Weight in kilograms |
| `glucose_am` | INTEGER | No | Morning blood glucose (mg/dL) |
| `glucose_pm` | INTEGER | No | Evening blood glucose (mg/dL) |
| `recorded_date` | TEXT | Yes | Date vitals were recorded (ISO date string) |
| `notes` | TEXT | No | Additional observations or context |
| `active` | INTEGER | Yes | Soft delete flag (1 = active, 0 = deleted) |
| `created_at` | TEXT | Yes | Record creation timestamp |
| `updated_at` | TEXT | Yes | Last update timestamp |

**Purpose**: Track daily vital signs for patient health monitoring

**Constraints**:
- `id`: Primary key (auto-generated)
- `patient_id`: Foreign key with CASCADE DELETE
- `active`: Default 1 (active records)

**Related Tables**:
- `patients` (parent, contains patient demographics)

---

## Type Definitions

### Vital Record Type (Inferred)

```typescript
interface VitalRecord {
  id: string
  patient_id: string
  weight_kg: number | null
  glucose_am: number | null
  glucose_pm: number | null
  recorded_date: string  // ISO date string
  notes: string | null
  active: number  // 0 or 1
  created_at: string
  updated_at: string
  patient_name?: string  // Joined from patients table
}
```

**Notes**:
- All vital measurements optional (nullable)
- `recorded_date` is required (when vitals were taken)
- `patient_name` populated via LEFT JOIN in queries

---

## Validation Schemas

### Create Vital Schema

```typescript
const createVitalSchema = z.object({
  patient_id: z.string().min(1),
  weight_kg: z.number().positive().nullable().optional(),
  glucose_am: z.number().int().positive().nullable().optional(),
  glucose_pm: z.number().int().positive().nullable().optional(),
  recorded_date: z.string().min(1),
  notes: z.string().nullable().optional(),
})
```

**Validation Rules**:
- `patient_id`: Required, minimum 1 character
- `weight_kg`: Optional, must be positive number if provided
- `glucose_am`: Optional, must be positive integer if provided
- `glucose_pm`: Optional, must be positive integer if provided
- `recorded_date`: Required, ISO date string
- `notes`: Optional string

**Defaults**:
- `active`: 1 (set in SQL)
- Timestamps: Auto-generated

### Update Vital Schema

```typescript
const updateVitalSchema = createVitalSchema.partial().omit({ patient_id: true })
```

**Validation Rules**:
- All fields optional (partial)
- `patient_id` cannot be changed (omitted)
- Same validation as create schema

---

## Endpoints

### GET /api/vitals

**Purpose**: List vital records, optionally filtered by patient, ordered by date.

#### Path Parameters

None.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `patient_id` | string | No | Filter vitals for specific patient |

#### Implementation

```typescript
router.get('/', async (req, res) => {
  try {
    const { patient_id } = req.query
    
    let query = `
      SELECT v.*, p.name as patient_name 
      FROM vitals v
      LEFT JOIN patients p ON v.patient_id = p.id
      WHERE v.active = 1
    `
    const params: string[] = []
    
    if (patient_id) {
      query += ` AND v.patient_id = ?`
      params.push(patient_id as string)
    }
    
    query += ` ORDER BY v.recorded_date DESC, v.created_at DESC`
    
    const vitals = db.prepare(query).all(...params)
    okList(res, vitals)
  } catch (error) {
    handleRouterError(res, error, 'Failed to retrieve vitals')
  }
})
```

**Query Details**:
- Filters: `active = 1` (only active records)
- Optional: Filter by `patient_id`
- JOIN: Includes patient name from patients table
- Ordering: `recorded_date DESC, created_at DESC` (newest first)

#### Response Format (Success)

```typescript
{
  data: [
    {
      id: "vital_abc123",
      patient_id: "pat_xyz789",
      patient_name: "John Smith",
      weight_kg: 75.5,
      glucose_am: 110,
      glucose_pm: 125,
      recorded_date: "2024-10-28",
      notes: "Patient reports feeling well",
      active: 1,
      created_at: "2024-10-28T08:00:00.000Z",
      updated_at: "2024-10-28T08:00:00.000Z"
    },
    {
      id: "vital_def456",
      patient_id: "pat_xyz789",
      patient_name: "John Smith",
      weight_kg: 75.8,
      glucose_am: 115,
      glucose_pm: 130,
      recorded_date: "2024-10-27",
      notes: null,
      active: 1,
      created_at: "2024-10-27T08:00:00.000Z",
      updated_at: "2024-10-27T08:00:00.000Z"
    }
    // ... more vitals
  ]
}
```

#### Example Requests

```typescript
// Get all vitals (all patients)
const allVitals = await fetch('/api/vitals')
const allData = await allVitals.json()
console.log(`Total vitals: ${allData.data.length}`)

// Get vitals for specific patient
const patientVitals = await fetch('/api/vitals?patient_id=pat_xyz789')
const patientData = await patientVitals.json()
console.log(`Patient vitals: ${patientData.data.length}`)

patientData.data.forEach(vital => {
  console.log(`${vital.recorded_date}: Weight ${vital.weight_kg}kg, Glucose AM ${vital.glucose_am}`)
})
```

**Use Case**: Display vital trends, patient health dashboard

---

### GET /api/vitals/:id

**Purpose**: Get a specific vital record by ID.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Vital record ID |

#### Implementation

```typescript
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const vital = db.prepare(`
      SELECT v.*, p.name as patient_name 
      FROM vitals v
      LEFT JOIN patients p ON v.patient_id = p.id
      WHERE v.id = ? AND v.active = 1
    `).get(id)

    if (!vital) {
      return err(res, 404, 'NOT_FOUND', 'Vital record not found')
    }

    okItem(res, vital)
  } catch (error) {
    handleRouterError(res, error, 'Failed to retrieve vital record')
  }
})
```

#### Response Format (Success)

```typescript
{
  data: {
    id: "vital_abc123",
    patient_id: "pat_xyz789",
    patient_name: "John Smith",
    weight_kg: 75.5,
    glucose_am: 110,
    glucose_pm: 125,
    recorded_date: "2024-10-28",
    notes: "Patient reports feeling well",
    active: 1,
    created_at: "2024-10-28T08:00:00.000Z",
    updated_at: "2024-10-28T08:00:00.000Z"
  }
}
```

#### Response Format (Not Found)

```typescript
{
  success: false,
  error: {
    code: "NOT_FOUND",
    message: "Vital record not found"
  }
}
```

**HTTP Status**: 404

#### Example Request

```typescript
const response = await fetch('/api/vitals/vital_abc123')
const data = await response.json()

if (data.data) {
  console.log(`Patient: ${data.data.patient_name}`)
  console.log(`Date: ${data.data.recorded_date}`)
  console.log(`Weight: ${data.data.weight_kg}kg`)
  console.log(`Glucose AM: ${data.data.glucose_am} mg/dL`)
  console.log(`Glucose PM: ${data.data.glucose_pm} mg/dL`)
}
```

---

### POST /api/vitals

**Purpose**: Create a new vital record for a patient.

#### Request Body

```typescript
{
  patient_id: string;           // Required
  weight_kg?: number | null;    // Optional (positive)
  glucose_am?: number | null;   // Optional (positive integer)
  glucose_pm?: number | null;   // Optional (positive integer)
  recorded_date: string;        // Required (ISO date)
  notes?: string | null;        // Optional
}
```

#### Implementation

```typescript
router.post('/', async (req, res) => {
  try {
    const validatedData = createVitalSchema.parse(req.body)
    
    // Verify patient exists
    const patient = db.prepare(`
      SELECT id FROM patients WHERE id = ? AND active = 1
    `).get(validatedData.patient_id)
    
    if (!patient) {
      return err(res, 404, 'NOT_FOUND', 'Patient not found')
    }
    
    const vitalId = generateId()
    const now = new Date().toISOString()
    
    const insertVital = db.prepare(`
      INSERT INTO vitals (
        id, patient_id, weight_kg, glucose_am, glucose_pm,
        recorded_date, notes, active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `)

    insertVital.run(
      vitalId,
      validatedData.patient_id,
      validatedData.weight_kg ?? null,
      validatedData.glucose_am ?? null,
      validatedData.glucose_pm ?? null,
      validatedData.recorded_date,
      validatedData.notes ?? null,
      now,
      now
    )

    const createdVital = db.prepare(`
      SELECT v.*, p.name as patient_name 
      FROM vitals v
      LEFT JOIN patients p ON v.patient_id = p.id
      WHERE v.id = ?
    `).get(vitalId)

    okItem(res, createdVital, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return err(res, 400, 'VALIDATION_ERROR', 'Invalid vital data', { issues: error.errors })
    }
    handleRouterError(res, error, 'Failed to create vital record')
  }
})
```

**Auto-Generated Fields**:
- `id`: Generated via `generateId()` helper
- `active`: Set to 1
- `created_at`: Current timestamp
- `updated_at`: Current timestamp

**Patient Validation**: Checks patient exists and is active before creating vital

#### Response Format (Success)

```typescript
{
  data: {
    id: "vital_new123",
    patient_id: "pat_xyz789",
    patient_name: "John Smith",
    weight_kg: 75.5,
    glucose_am: 110,
    glucose_pm: 125,
    recorded_date: "2024-10-28",
    notes: "Patient reports feeling well",
    active: 1,
    created_at: "2024-10-28T16:00:00.000Z",
    updated_at: "2024-10-28T16:00:00.000Z"
  }
}
```

**HTTP Status**: 201 Created

#### Response Format (Patient Not Found)

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

#### Response Format (Validation Error)

```typescript
{
  success: false,
  error: {
    code: "VALIDATION_ERROR",
    message: "Invalid vital data",
    details: {
      issues: [
        {
          path: ["weight_kg"],
          message: "Number must be greater than 0"
        }
      ]
    }
  }
}
```

**HTTP Status**: 400

#### Example Requests

```typescript
// Minimal vital (weight only)
const weight = await fetch('/api/vitals', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    patient_id: 'pat_xyz789',
    recorded_date: '2024-10-28',
    weight_kg: 75.5
  })
})

// Complete vital (all measurements)
const complete = await fetch('/api/vitals', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    patient_id: 'pat_xyz789',
    recorded_date: '2024-10-28',
    weight_kg: 75.5,
    glucose_am: 110,
    glucose_pm: 125,
    notes: 'Patient reports feeling well. Stable readings.'
  })
})

// Glucose only (for diabetic monitoring)
const glucose = await fetch('/api/vitals', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    patient_id: 'pat_xyz789',
    recorded_date: '2024-10-28',
    glucose_am: 110,
    glucose_pm: 125
  })
})

const data = await complete.json()
console.log('Created vital:', data.data.id)
```

---

### PUT /api/vitals/:id

**Purpose**: Update an existing vital record.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Vital record ID to update |

#### Request Body

All fields optional. Only provided fields will be updated.

```typescript
{
  weight_kg?: number | null;
  glucose_am?: number | null;
  glucose_pm?: number | null;
  recorded_date?: string;
  notes?: string | null;
}
```

**Note**: `patient_id` cannot be changed (omitted from update schema)

#### Implementation

```typescript
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const validatedData = updateVitalSchema.parse(req.body)
    
    const existingVital = db.prepare(`
      SELECT * FROM vitals WHERE id = ? AND active = 1
    `).get(id)

    if (!existingVital) {
      return err(res, 404, 'NOT_FOUND', 'Vital record not found')
    }

    // Build dynamic update query
    const updates: string[] = []
    const values: (string | number | null)[] = []

    if (validatedData.weight_kg !== undefined) {
      updates.push('weight_kg = ?')
      values.push(validatedData.weight_kg)
    }
    if (validatedData.glucose_am !== undefined) {
      updates.push('glucose_am = ?')
      values.push(validatedData.glucose_am)
    }
    if (validatedData.glucose_pm !== undefined) {
      updates.push('glucose_pm = ?')
      values.push(validatedData.glucose_pm)
    }
    if (validatedData.recorded_date !== undefined) {
      updates.push('recorded_date = ?')
      values.push(validatedData.recorded_date)
    }
    if (validatedData.notes !== undefined) {
      updates.push('notes = ?')
      values.push(validatedData.notes)
    }

    if (updates.length === 0) {
      return err(res, 400, 'VALIDATION_ERROR', 'No fields to update')
    }

    updates.push('updated_at = ?')
    values.push(new Date().toISOString())
    values.push(id)

    db.prepare(`
      UPDATE vitals 
      SET ${updates.join(', ')} 
      WHERE id = ?
    `).run(...values)

    const updatedVital = db.prepare(`
      SELECT v.*, p.name as patient_name 
      FROM vitals v
      LEFT JOIN patients p ON v.patient_id = p.id
      WHERE v.id = ?
    `).get(id)

    okItem(res, updatedVital)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return err(res, 400, 'VALIDATION_ERROR', 'Invalid vital data', { issues: error.errors })
    }
    handleRouterError(res, error, 'Failed to update vital record')
  }
})
```

**Dynamic Update Logic**:
1. Parse request body with schema
2. Check vital exists and is active
3. Build SQL with only provided fields
4. Auto-update `updated_at` timestamp
5. Return updated vital

#### Response Format (Success)

```typescript
{
  data: {
    id: "vital_abc123",
    patient_id: "pat_xyz789",
    patient_name: "John Smith",
    weight_kg: 75.3,  // Updated
    glucose_am: 110,
    glucose_pm: 125,
    recorded_date: "2024-10-28",
    notes: "Weight corrected after recalibration",  // Updated
    active: 1,
    created_at: "2024-10-28T08:00:00.000Z",
    updated_at: "2024-10-28T16:30:00.000Z"  // Updated
  }
}
```

#### Response Format (Not Found)

```typescript
{
  success: false,
  error: {
    code: "NOT_FOUND",
    message: "Vital record not found"
  }
}
```

**HTTP Status**: 404

#### Example Requests

```typescript
// Update weight only
await fetch('/api/vitals/vital_abc123', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    weight_kg: 75.3
  })
})

// Update glucose readings
await fetch('/api/vitals/vital_abc123', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    glucose_am: 105,
    glucose_pm: 120
  })
})

// Update multiple fields
await fetch('/api/vitals/vital_abc123', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    weight_kg: 75.3,
    notes: 'Weight corrected after recalibration'
  })
})
```

---

### DELETE /api/vitals/:id

**Purpose**: Soft delete a vital record (set active=0).

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Vital record ID to delete |

#### Implementation

```typescript
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const existingVital = db.prepare(`
      SELECT * FROM vitals WHERE id = ? AND active = 1
    `).get(id)

    if (!existingVital) {
      return err(res, 404, 'NOT_FOUND', 'Vital record not found')
    }

    // Soft delete
    db.prepare(`
      UPDATE vitals 
      SET active = 0, updated_at = ? 
      WHERE id = ?
    `).run(new Date().toISOString(), id)

    okItem(res, { id, message: 'Vital record deleted successfully' })
  } catch (error) {
    handleRouterError(res, error, 'Failed to delete vital record')
  }
})
```

**Delete Behavior**:
- Soft delete (sets `active = 0`)
- Updates `updated_at` timestamp
- Data remains in database for audit trail
- Deleted records excluded from queries (WHERE active = 1)

#### Response Format (Success)

```typescript
{
  data: {
    id: "vital_abc123",
    message: "Vital record deleted successfully"
  }
}
```

#### Response Format (Not Found)

```typescript
{
  success: false,
  error: {
    code: "NOT_FOUND",
    message: "Vital record not found"
  }
}
```

**HTTP Status**: 404

#### Example Request

```typescript
const response = await fetch('/api/vitals/vital_abc123', {
  method: 'DELETE'
})

const data = await response.json()

if (data.data) {
  console.log(data.data.message)  // "Vital record deleted successfully"
}
```

**Use Case**: Remove erroneous entries while maintaining audit trail

---

## Usage Examples

### Track Daily Vitals

```typescript
async function recordDailyVitals(patientId: string, measurements: any) {
  const today = new Date().toISOString().split('T')[0]  // YYYY-MM-DD
  
  const response = await fetch('/api/vitals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patient_id: patientId,
      recorded_date: today,
      ...measurements
    })
  })
  
  const data = await response.json()
  
  if (data.data) {
    console.log('✅ Vitals recorded for', data.data.patient_name)
    return data.data
  } else {
    console.error('❌ Failed:', data.error.message)
    return null
  }
}

// Usage
await recordDailyVitals('pat_xyz789', {
  weight_kg: 75.5,
  glucose_am: 110,
  glucose_pm: 125,
  notes: 'Patient feeling well'
})
```

### Display Vital Trends

```typescript
async function displayVitalTrends(patientId: string, days: number = 7) {
  const response = await fetch(`/api/vitals?patient_id=${patientId}`)
  const data = await response.json()
  
  // Get last N days
  const recent = data.data.slice(0, days)
  
  console.log(`📊 Vital Trends (Last ${days} days)`)
  console.log('─────────────────────────────────────')
  
  recent.forEach(vital => {
    console.log(`\n${vital.recorded_date}`)
    
    if (vital.weight_kg) {
      console.log(`  Weight: ${vital.weight_kg} kg`)
    }
    
    if (vital.glucose_am || vital.glucose_pm) {
      const am = vital.glucose_am || 'N/A'
      const pm = vital.glucose_pm || 'N/A'
      console.log(`  Glucose: ${am} (AM) / ${pm} (PM) mg/dL`)
    }
    
    if (vital.notes) {
      console.log(`  Notes: ${vital.notes}`)
    }
  })
  
  return recent
}
```

### Calculate Averages

```typescript
async function calculateVitalAverages(patientId: string, days: number = 30) {
  const response = await fetch(`/api/vitals?patient_id=${patientId}`)
  const data = await response.json()
  
  const recent = data.data.slice(0, days)
  
  // Calculate averages
  const weights = recent.filter(v => v.weight_kg).map(v => v.weight_kg)
  const glucoseAM = recent.filter(v => v.glucose_am).map(v => v.glucose_am)
  const glucosePM = recent.filter(v => v.glucose_pm).map(v => v.glucose_pm)
  
  const avgWeight = weights.reduce((a, b) => a + b, 0) / weights.length
  const avgGlucoseAM = glucoseAM.reduce((a, b) => a + b, 0) / glucoseAM.length
  const avgGlucosePM = glucosePM.reduce((a, b) => a + b, 0) / glucosePM.length
  
  return {
    period: `${days} days`,
    weight: {
      avg: avgWeight.toFixed(1),
      min: Math.min(...weights).toFixed(1),
      max: Math.max(...weights).toFixed(1),
      readings: weights.length
    },
    glucose_am: {
      avg: avgGlucoseAM.toFixed(0),
      min: Math.min(...glucoseAM),
      max: Math.max(...glucoseAM),
      readings: glucoseAM.length
    },
    glucose_pm: {
      avg: avgGlucosePM.toFixed(0),
      min: Math.min(...glucosePM),
      max: Math.max(...glucosePM),
      readings: glucosePM.length
    }
  }
}

// Usage
const stats = await calculateVitalAverages('pat_xyz789', 30)
console.log('30-day averages:', stats)
```

### Glucose Monitoring

```typescript
async function checkGlucoseLevels(patientId: string) {
  const response = await fetch(`/api/vitals?patient_id=${patientId}`)
  const data = await response.json()
  
  const latest = data.data[0]  // Most recent
  
  const NORMAL_RANGE = { min: 70, max: 130 }  // mg/dL (fasting)
  
  const alerts = []
  
  if (latest.glucose_am) {
    if (latest.glucose_am < NORMAL_RANGE.min) {
      alerts.push(`⚠️ Low AM glucose: ${latest.glucose_am} mg/dL (below ${NORMAL_RANGE.min})`)
    } else if (latest.glucose_am > NORMAL_RANGE.max) {
      alerts.push(`⚠️ High AM glucose: ${latest.glucose_am} mg/dL (above ${NORMAL_RANGE.max})`)
    }
  }
  
  if (latest.glucose_pm) {
    if (latest.glucose_pm < NORMAL_RANGE.min) {
      alerts.push(`⚠️ Low PM glucose: ${latest.glucose_pm} mg/dL (below ${NORMAL_RANGE.min})`)
    } else if (latest.glucose_pm > NORMAL_RANGE.max) {
      alerts.push(`⚠️ High PM glucose: ${latest.glucose_pm} mg/dL (above ${NORMAL_RANGE.max})`)
    }
  }
  
  if (alerts.length > 0) {
    console.log('🚨 Glucose Alerts:')
    alerts.forEach(alert => console.log(alert))
  } else {
    console.log('✅ Glucose levels within normal range')
  }
  
  return {
    latest,
    alerts,
    inRange: alerts.length === 0
  }
}
```

### Export Vitals to CSV

```typescript
async function exportVitalsToCSV(patientId: string) {
  const response = await fetch(`/api/vitals?patient_id=${patientId}`)
  const data = await response.json()
  
  // CSV header
  let csv = 'Date,Weight (kg),Glucose AM (mg/dL),Glucose PM (mg/dL),Notes\n'
  
  // Data rows
  data.data.forEach(vital => {
    csv += [
      vital.recorded_date,
      vital.weight_kg || '',
      vital.glucose_am || '',
      vital.glucose_pm || '',
      `"${vital.notes || ''}"`.replace(/"/g, '""')  // Escape quotes
    ].join(',') + '\n'
  })
  
  // Download file
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `vitals-${patientId}-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  
  return csv
}
```

---

## Best Practices

### 1. Record Vitals Consistently

```typescript
// ✅ GOOD: Daily vitals at consistent times
async function morningVitals(patientId: string) {
  const today = new Date().toISOString().split('T')[0]
  
  return await fetch('/api/vitals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patient_id: patientId,
      recorded_date: today,
      weight_kg: 75.5,
      glucose_am: 110
    })
  })
}

// ⚠️ OKAY: Sporadic measurements
// Less useful for trend analysis
```

### 2. Use Appropriate Units

```typescript
// ✅ GOOD: Consistent units
await createVital({
  weight_kg: 75.5,        // Kilograms
  glucose_am: 110,        // mg/dL
  glucose_pm: 125         // mg/dL
})

// ❌ BAD: Mixed units
await createVital({
  weight_kg: 165,         // This looks like pounds!
  glucose_am: 6.1         // This looks like mmol/L!
})
```

### 3. Add Contextual Notes

```typescript
// ✅ GOOD: Informative notes
await createVital({
  patient_id: 'pat_xyz',
  recorded_date: '2024-10-28',
  glucose_am: 145,
  notes: 'Patient ate breakfast before test (should be fasting)'
})

// ⚠️ OKAY: Basic notes
await createVital({
  patient_id: 'pat_xyz',
  recorded_date: '2024-10-28',
  glucose_am: 145,
  notes: 'High reading'
})

// ❌ BAD: No notes on abnormal readings
await createVital({
  patient_id: 'pat_xyz',
  recorded_date: '2024-10-28',
  glucose_am: 145  // Why is this high? No context!
})
```

### 4. Validate Before Recording

```typescript
// ✅ GOOD: Validate measurements
async function recordVitalsSafely(measurements: any) {
  // Check weight range
  if (measurements.weight_kg && (measurements.weight_kg < 20 || measurements.weight_kg > 300)) {
    console.error('Weight out of reasonable range')
    return null
  }
  
  // Check glucose range
  if (measurements.glucose_am && (measurements.glucose_am < 20 || measurements.glucose_am > 600)) {
    console.error('Glucose reading out of reasonable range')
    return null
  }
  
  return await fetch('/api/vitals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(measurements)
  })
}

// ❌ BAD: Accept any values
// Could record impossible measurements
```

### 5. Handle Missing Data Gracefully

```typescript
// ✅ GOOD: Check for null values
function displayVitals(vital: any) {
  console.log(`Date: ${vital.recorded_date}`)
  console.log(`Weight: ${vital.weight_kg ? `${vital.weight_kg} kg` : 'Not recorded'}`)
  console.log(`Glucose AM: ${vital.glucose_am ? `${vital.glucose_am} mg/dL` : 'Not recorded'}`)
  console.log(`Glucose PM: ${vital.glucose_pm ? `${vital.glucose_pm} mg/dL` : 'Not recorded'}`)
}

// ❌ BAD: Assume all fields present
function displayVitals(vital: any) {
  console.log(`Weight: ${vital.weight_kg} kg`)  // Crashes if null
}
```

### 6. Use Soft Delete

```typescript
// ✅ GOOD: Soft delete maintains audit trail
await fetch(`/api/vitals/${vitalId}`, { method: 'DELETE' })
// Record still in database with active=0

// ⚠️ NOTE: Hard delete would be:
// db.prepare('DELETE FROM vitals WHERE id = ?').run(id)
// This loses data permanently
```

---

## Frontend Integration

### Vue Vitals Chart Component

```vue
<template>
  <div class="vitals-chart">
    <h2>{{ patientName }} - Vital Trends</h2>
    
    <div class="date-range">
      <label>Show last:</label>
      <select v-model="daysToShow" @change="loadVitals">
        <option :value="7">7 days</option>
        <option :value="14">14 days</option>
        <option :value="30">30 days</option>
        <option :value="90">90 days</option>
      </select>
    </div>
    
    <div v-if="loading" class="loading">Loading vitals...</div>
    
    <div v-else-if="vitals.length === 0" class="empty">
      No vital records found
    </div>
    
    <div v-else class="charts">
      <!-- Weight Chart -->
      <div class="chart-section">
        <h3>Weight Trend</h3>
        <div class="chart-container">
          <canvas ref="weightChart"></canvas>
        </div>
        <div class="stats">
          <span>Avg: {{ weightStats.avg }} kg</span>
          <span>Min: {{ weightStats.min }} kg</span>
          <span>Max: {{ weightStats.max }} kg</span>
        </div>
      </div>
      
      <!-- Glucose Chart -->
      <div class="chart-section">
        <h3>Glucose Levels</h3>
        <div class="chart-container">
          <canvas ref="glucoseChart"></canvas>
        </div>
        <div class="stats">
          <span>AM Avg: {{ glucoseStats.amAvg }} mg/dL</span>
          <span>PM Avg: {{ glucoseStats.pmAvg }} mg/dL</span>
        </div>
      </div>
    </div>
    
    <!-- Recent Vitals Table -->
    <div class="vitals-table">
      <h3>Recent Readings</h3>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Weight</th>
            <th>Glucose AM</th>
            <th>Glucose PM</th>
            <th>Notes</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="vital in vitals" :key="vital.id">
            <td>{{ formatDate(vital.recorded_date) }}</td>
            <td>{{ vital.weight_kg ? `${vital.weight_kg} kg` : '-' }}</td>
            <td :class="getGlucoseClass(vital.glucose_am)">
              {{ vital.glucose_am || '-' }}
            </td>
            <td :class="getGlucoseClass(vital.glucose_pm)">
              {{ vital.glucose_pm || '-' }}
            </td>
            <td class="notes">{{ vital.notes || '-' }}</td>
            <td>
              <button @click="editVital(vital)" class="btn-icon">✏️</button>
              <button @click="deleteVital(vital)" class="btn-icon">🗑️</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const props = defineProps<{
  patientId: string
  patientName: string
}>()

const vitals = ref<any[]>([])
const loading = ref(true)
const daysToShow = ref(30)

const weightStats = computed(() => {
  const weights = vitals.value.filter(v => v.weight_kg).map(v => v.weight_kg)
  if (weights.length === 0) return { avg: 0, min: 0, max: 0 }
  
  return {
    avg: (weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(1),
    min: Math.min(...weights).toFixed(1),
    max: Math.max(...weights).toFixed(1)
  }
})

const glucoseStats = computed(() => {
  const am = vitals.value.filter(v => v.glucose_am).map(v => v.glucose_am)
  const pm = vitals.value.filter(v => v.glucose_pm).map(v => v.glucose_pm)
  
  return {
    amAvg: am.length ? (am.reduce((a, b) => a + b, 0) / am.length).toFixed(0) : 0,
    pmAvg: pm.length ? (pm.reduce((a, b) => a + b, 0) / pm.length).toFixed(0) : 0
  }
})

async function loadVitals() {
  loading.value = true
  const response = await fetch(`/api/vitals?patient_id=${props.patientId}`)
  const data = await response.json()
  vitals.value = data.data.slice(0, daysToShow.value)
  loading.value = false
}

function getGlucoseClass(glucose: number | null) {
  if (!glucose) return ''
  if (glucose < 70) return 'glucose-low'
  if (glucose > 130) return 'glucose-high'
  return 'glucose-normal'
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString()
}

async function deleteVital(vital: any) {
  const confirmed = window.confirm(
    `Delete vital record from ${vital.recorded_date}?`
  )
  
  if (!confirmed) return
  
  await fetch(`/api/vitals/${vital.id}`, { method: 'DELETE' })
  await loadVitals()
}

function editVital(vital: any) {
  // Open edit dialog
  console.log('Edit vital:', vital)
}

onMounted(loadVitals)
</script>

<style scoped>
.vitals-chart {
  padding: 1rem;
}

.charts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
  margin: 2rem 0;
}

.chart-container {
  background: #f5f5f5;
  padding: 1rem;
  border-radius: 8px;
  height: 300px;
}

.stats {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  font-size: 0.9rem;
  color: #666;
}

.vitals-table {
  margin-top: 2rem;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

th {
  background: #f5f5f5;
  font-weight: 600;
}

.glucose-low {
  color: #d32f2f;
  font-weight: 600;
}

.glucose-high {
  color: #f57c00;
  font-weight: 600;
}

.glucose-normal {
  color: #388e3c;
}

.notes {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  opacity: 0.6;
}

.btn-icon:hover {
  opacity: 1;
}

.empty {
  text-align: center;
  color: #999;
  padding: 2rem;
}
</style>
```

---

## Performance Considerations

### 1. Query Performance

**Current**: Filtered query with JOIN
```sql
SELECT v.*, p.name as patient_name 
FROM vitals v
LEFT JOIN patients p ON v.patient_id = p.id
WHERE v.active = 1 AND v.patient_id = ?
ORDER BY v.recorded_date DESC
```

**Performance**: Fast for typical vital counts (< 10,000 per patient)

**Optimization**: Add composite index if needed
```sql
CREATE INDEX idx_vitals_patient_date ON vitals(patient_id, recorded_date DESC);
```

### 2. Date Range Queries

**Recommendation**: Add date filtering for large datasets
```typescript
// Limit to last 90 days
const threeMonthsAgo = new Date()
threeMonthsAgo.setDate(threeMonthsAgo.getDate() - 90)

const vitals = db.prepare(`
  SELECT * FROM vitals 
  WHERE patient_id = ? 
    AND recorded_date >= ?
  ORDER BY recorded_date DESC
`).all(patientId, threeMonthsAgo.toISOString().split('T')[0])
```

---

## Security Considerations

### 1. SQL Injection Protection

**Status**: ✅ Protected via parameterized queries

```typescript
// Safe
db.prepare('SELECT * FROM vitals WHERE patient_id = ?').all(patientId)

// Vulnerable (not used)
db.exec(`SELECT * FROM vitals WHERE patient_id = '${patientId}'`)
```

### 2. Input Validation

**Status**: ✅ Protected via Zod schemas

**Validates**:
- Positive numbers (weight, glucose)
- Required fields (patient_id, recorded_date)
- Data types (number vs string)

### 3. Patient Privacy

**Status**: ⚠️ No access control

**Recommendation**: Add authentication and authorization
```typescript
// Check user has access to this patient's data
if (!userCanAccessPatient(userId, patientId)) {
  return err(res, 403, 'FORBIDDEN', 'Access denied')
}
```

---

## Summary

The **Vitals Router** manages patient vital sign tracking for eldercare monitoring:

**Endpoints (5 total)**:
- **GET /api/vitals** - List vitals (optional patient filter, newest first)
- **GET /api/vitals/:id** - Get specific vital record
- **POST /api/vitals** - Create new vital record (validates patient exists)
- **PUT /api/vitals/:id** - Update vital record (dynamic fields)
- **DELETE /api/vitals/:id** - Soft delete vital record

**Key Features**:
- Multi-metric tracking (weight, glucose AM/PM)
- Patient association with name lookup
- Date-based recording
- Soft delete (audit trail preservation)
- Dynamic updates (only provided fields)
- Patient validation on create

**Vital Measurements**:
- Weight (kg) - positive numbers
- Glucose AM (mg/dL) - morning blood sugar
- Glucose PM (mg/dL) - evening blood sugar
- Notes - contextual information

**Use Cases**:
- Daily health monitoring
- Diabetes management
- Weight tracking
- Trend analysis
- Alert generation for abnormal values
- Healthcare provider reporting
- Patient health dashboards

**Integration**:
Vitals tracking is essential for eldercare applications, enabling caregivers to monitor patient health trends, detect concerning changes early, and provide data-driven care. Particularly important for diabetic patients requiring regular glucose monitoring and weight management.

**Complete!** All 10 router documentations are now finished! 🎉
