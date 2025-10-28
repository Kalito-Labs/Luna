# Appointments Router Documentation

## Overview

The `appointmentsRouter.ts` file implements **appointment management endpoints** for the eldercare system. It provides CRUD operations for scheduling, tracking, and managing medical appointments between patients and healthcare providers.

**Location**: `/backend/routes/appointmentsRouter.ts`

**Mounted At**: `/api/appointments`

**Purpose**:
- Schedule appointments between patients and healthcare providers
- Track appointment status (scheduled, completed, cancelled, rescheduled)
- Manage appointment details (date, time, location, notes)
- Support filtering by patient
- Maintain appointment history with soft deletes

**Key Features**:
- **Foreign Key Validation**: Ensures patients and providers exist before creating appointments
- **Soft Deletes**: Appointments are marked inactive (not permanently deleted)
- **Dynamic Updates**: Partial updates with validation
- **Relational Queries**: Joins with patients and healthcare_providers for enriched responses
- **Status Tracking**: Monitor appointment lifecycle (scheduled → completed/cancelled)

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
- **Router**: Express router for endpoint definitions
- **Zod**: Runtime schema validation
- **db**: Shared SQLite database connection
- **API Contract**: Standardized response formats (`okList`, `okItem`, `err`)
- **Router Helpers**: Error handling and ID generation utilities

---

## Database Schema

### Appointments Table

```sql
CREATE TABLE appointments (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  provider_id TEXT,
  appointment_date TEXT NOT NULL,
  appointment_time TEXT,
  appointment_type TEXT,          -- 'routine', 'follow_up', 'emergency', 'specialist'
  location TEXT,
  notes TEXT,
  preparation_notes TEXT,         -- What to bring, prep instructions
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled', 'rescheduled'
  outcome_summary TEXT,           -- Post-appointment notes
  follow_up_required INTEGER DEFAULT 0,
  duration_minutes INTEGER,       -- Added by router logic
  reason TEXT,                    -- Added by router logic
  active INTEGER DEFAULT 1,       -- Soft delete flag
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (provider_id) REFERENCES healthcare_providers(id)
);

CREATE INDEX idx_appointments_patient_date 
  ON appointments(patient_id, appointment_date ASC);

CREATE INDEX idx_appointments_status_date 
  ON appointments(status, appointment_date ASC);
```

**Field Explanations**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | TEXT | Yes | Primary key (generated via `generateId()`) |
| `patient_id` | TEXT | Yes | Foreign key to patients table |
| `provider_id` | TEXT | No | Foreign key to healthcare_providers table |
| `appointment_date` | TEXT | Yes | ISO date string (e.g., "2024-01-15") |
| `appointment_time` | TEXT | No | Time string (e.g., "14:30") |
| `appointment_type` | TEXT | No | Type: routine, follow_up, emergency, specialist |
| `location` | TEXT | No | Where appointment takes place |
| `notes` | TEXT | No | General appointment notes |
| `preparation_notes` | TEXT | No | What patient should bring/do beforehand |
| `status` | TEXT | Yes | scheduled, completed, cancelled, rescheduled |
| `outcome_summary` | TEXT | No | Post-appointment summary |
| `follow_up_required` | INTEGER | No | Boolean flag (0 or 1) |
| `duration_minutes` | INTEGER | No | Appointment duration (1-480 minutes) |
| `reason` | TEXT | No | Reason for appointment |
| `active` | INTEGER | Yes | Soft delete flag (1 = active, 0 = deleted) |

**Indexes**:
- `idx_appointments_patient_date`: Fast queries by patient + date
- `idx_appointments_status_date`: Fast queries by status + date (e.g., upcoming scheduled)

### Healthcare Providers Table (Referenced)

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
  preferred INTEGER DEFAULT 0,
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

**Used For**: Provider information joined in appointment responses.

---

## Validation Schemas

### Create Appointment Schema

```typescript
const createAppointmentSchema = z.object({
  patient_id: z.string().min(1),
  provider_id: z.string().min(1),
  appointment_type: z.string().min(1).max(100),
  appointment_date: z.string().min(1),
  duration_minutes: z.number().int().min(1).max(480),
  status: z.string().optional().default('scheduled'),
  location: z.string().optional(),
  notes: z.string().optional(),
  reason: z.string().optional(),
})
```

**Validation Rules**:
- `patient_id`: Required, non-empty string
- `provider_id`: Required, non-empty string
- `appointment_type`: Required, 1-100 characters (e.g., "routine", "follow_up")
- `appointment_date`: Required, non-empty string (should be ISO date)
- `duration_minutes`: Required, integer 1-480 (8 hours max)
- `status`: Optional, defaults to "scheduled"
- `location`, `notes`, `reason`: Optional strings

**Note**: Schema doesn't validate date format - relies on database or application logic.

### Update Appointment Schema

```typescript
const updateAppointmentSchema = createAppointmentSchema
  .partial()
  .omit({ patient_id: true })
```

**Differences from Create**:
- All fields optional (`.partial()`)
- `patient_id` cannot be changed (`.omit({ patient_id: true })`)

**Rationale**: Patient assignment is immutable once created (prevents data integrity issues).

---

## Endpoints

### GET /api/appointments

**Purpose**: Retrieve all appointments, optionally filtered by patient.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `patient_id` | string | No | Filter appointments for specific patient |

#### Implementation

```typescript
router.get('/', async (req, res) => {
  try {
    const { patient_id } = req.query
    
    let query = `
      SELECT a.*, 
             p.name as patient_name,
             hp.name as provider_name
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN healthcare_providers hp ON a.provider_id = hp.id
      WHERE 1=1
    `
    const params: string[] = []
    
    if (patient_id) {
      query += ` AND a.patient_id = ?`
      params.push(patient_id as string)
    }
    
    query += ` ORDER BY a.appointment_date DESC`
    
    const appointments = db.prepare(query).all(...params)
    okList(res, appointments)
  } catch (error) {
    handleRouterError(res, error, 'Failed to retrieve appointments')
  }
})
```

**SQL Details**:
- **LEFT JOIN patients**: Include patient name in response
- **LEFT JOIN healthcare_providers**: Include provider name in response
- **WHERE 1=1**: Base condition for dynamic query building
- **Dynamic Filtering**: Adds `patient_id` filter if provided
- **Ordering**: Descending by appointment_date (newest first)

**No Active Filter**: Returns all appointments regardless of `active` flag (includes soft-deleted).

#### Response Format

```typescript
{
  data: [
    {
      id: "appt_abc123",
      patient_id: "pat_xyz789",
      provider_id: "prov_def456",
      appointment_date: "2024-01-15",
      appointment_time: "14:30",
      appointment_type: "routine",
      location: "Main Clinic",
      notes: "Regular checkup",
      status: "scheduled",
      duration_minutes: 30,
      reason: "Annual physical",
      patient_name: "John Doe",
      provider_name: "Dr. Smith",
      created_at: "2024-01-01T10:00:00.000Z",
      updated_at: "2024-01-01T10:00:00.000Z",
      active: 1
    },
    // ... more appointments
  ]
}
```

**Enriched Fields**:
- `patient_name`: From patients table
- `provider_name`: From healthcare_providers table

#### Example Requests

```typescript
// Get all appointments
const response = await fetch('/api/appointments')
const data = await response.json()
console.log(`Found ${data.data.length} appointments`)

// Get appointments for specific patient
const patientAppts = await fetch('/api/appointments?patient_id=pat_xyz789')
const patientData = await patientAppts.json()
```

---

### GET /api/appointments/:id

**Purpose**: Retrieve a single appointment by ID.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Appointment ID |

#### Implementation

```typescript
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const appointment = db.prepare(`
      SELECT a.*, 
             p.name as patient_name,
             hp.name as provider_name
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN healthcare_providers hp ON a.provider_id = hp.id
      WHERE a.id = ?
    `).get(id)

    if (!appointment) {
      return err(res, 404, 'NOT_FOUND', 'Appointment not found')
    }

    okItem(res, appointment)
  } catch (error) {
    handleRouterError(res, error, 'Failed to retrieve appointment')
  }
})
```

**SQL Details**:
- Same JOINs as list endpoint for enriched data
- No `active` filter (returns soft-deleted appointments)

#### Response Format (Success)

```typescript
{
  data: {
    id: "appt_abc123",
    patient_id: "pat_xyz789",
    provider_id: "prov_def456",
    appointment_date: "2024-01-15",
    appointment_time: "14:30",
    appointment_type: "follow_up",
    location: "Cardiology Wing",
    notes: "Post-surgery checkup",
    patient_name: "John Doe",
    provider_name: "Dr. Smith",
    // ... all fields
  }
}
```

#### Response Format (Not Found)

```typescript
{
  error: {
    code: "NOT_FOUND",
    message: "Appointment not found"
  }
}
```

#### Example Request

```typescript
const response = await fetch('/api/appointments/appt_abc123')
if (response.ok) {
  const data = await response.json()
  console.log(`Appointment with ${data.data.provider_name}`)
} else {
  console.error('Appointment not found')
}
```

---

### POST /api/appointments

**Purpose**: Create a new appointment.

#### Request Body

```typescript
{
  patient_id: string;           // Required
  provider_id: string;          // Required
  appointment_type: string;     // Required (1-100 chars)
  appointment_date: string;     // Required (ISO date)
  duration_minutes: number;     // Required (1-480)
  status?: string;              // Optional (default: "scheduled")
  location?: string;            // Optional
  notes?: string;               // Optional
  reason?: string;              // Optional
}
```

#### Implementation Flow

**1. Validate Request Body**

```typescript
const validatedData = createAppointmentSchema.parse(req.body)
```

Throws `z.ZodError` if validation fails.

**2. Verify Patient Exists**

```typescript
const patient = db.prepare(`
  SELECT id FROM patients WHERE id = ? AND active = 1
`).get(validatedData.patient_id)

if (!patient) {
  return err(res, 404, 'NOT_FOUND', 'Patient not found')
}
```

**Why**: Ensure foreign key integrity before insert.

**Active Check**: Only allows active patients (prevents appointments for deleted patients).

**3. Verify Provider Exists**

```typescript
const provider = db.prepare(`
  SELECT id FROM healthcare_providers WHERE id = ? AND active = 1
`).get(validatedData.provider_id)

if (!provider) {
  return err(res, 404, 'NOT_FOUND', 'Provider not found')
}
```

**4. Generate ID and Insert**

```typescript
const appointmentId = generateId()
const now = new Date().toISOString()

const insertAppointment = db.prepare(`
  INSERT INTO appointments (
    id, patient_id, provider_id, appointment_type, appointment_date,
    duration_minutes, status, location, notes, reason,
    created_at, updated_at, active
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
`)

insertAppointment.run(
  appointmentId,
  validatedData.patient_id,
  validatedData.provider_id,
  validatedData.appointment_type,
  validatedData.appointment_date,
  validatedData.duration_minutes,
  validatedData.status || 'scheduled',
  validatedData.location || null,
  validatedData.notes || null,
  validatedData.reason || null,
  now,
  now
)
```

**ID Generation**: `generateId()` creates unique ID (likely UUID or custom format).

**Timestamps**: Both `created_at` and `updated_at` set to current time.

**Active Flag**: Always `1` (active) on creation.

**5. Retrieve and Return Created Appointment**

```typescript
const newAppointment = db.prepare(`
  SELECT a.*, 
         p.name as patient_name,
         hp.name as provider_name
  FROM appointments a
  LEFT JOIN patients p ON a.patient_id = p.id
  LEFT JOIN healthcare_providers hp ON a.provider_id = hp.id
  WHERE a.id = ?
`).get(appointmentId)

okItem(res, newAppointment)
```

**Why Re-Fetch**: Returns enriched data with patient/provider names (same format as GET).

#### Response Format (Success)

```typescript
{
  data: {
    id: "appt_new123",
    patient_id: "pat_xyz789",
    provider_id: "prov_def456",
    appointment_date: "2024-02-15",
    appointment_type: "routine",
    duration_minutes: 30,
    status: "scheduled",
    patient_name: "John Doe",
    provider_name: "Dr. Smith",
    created_at: "2024-01-20T15:30:00.000Z",
    updated_at: "2024-01-20T15:30:00.000Z",
    active: 1
    // ... all fields
  }
}
```

#### Response Format (Validation Error)

```typescript
{
  error: {
    code: "VALIDATION_ERROR",
    message: "Invalid appointment data",
    details: {
      issues: [
        {
          field: "duration_minutes",
          message: "Number must be greater than or equal to 1"
        }
      ]
    }
  }
}
```

#### Response Format (Patient/Provider Not Found)

```typescript
{
  error: {
    code: "NOT_FOUND",
    message: "Patient not found"  // or "Provider not found"
  }
}
```

#### Example Request

```typescript
const response = await fetch('/api/appointments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    patient_id: "pat_xyz789",
    provider_id: "prov_def456",
    appointment_type: "routine",
    appointment_date: "2024-02-15",
    duration_minutes: 30,
    location: "Main Clinic - Room 5",
    notes: "Annual checkup",
    reason: "Regular health assessment"
  })
})

const data = await response.json()
console.log(`Created appointment: ${data.data.id}`)
```

---

### PUT /api/appointments/:id

**Purpose**: Update an existing appointment (partial update).

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Appointment ID to update |

#### Request Body

All fields optional (partial update):

```typescript
{
  provider_id?: string;
  appointment_type?: string;
  appointment_date?: string;
  duration_minutes?: number;
  status?: string;
  location?: string;
  notes?: string;
  reason?: string;
}
```

**Cannot Update**: `patient_id` (omitted from schema)

#### Implementation Flow

**1. Validate Request Body**

```typescript
const validatedData = updateAppointmentSchema.parse(req.body)
```

**2. Check Appointment Exists**

```typescript
const existingAppointment = db.prepare(`
  SELECT id FROM appointments WHERE id = ? AND active = 1
`).get(id)

if (!existingAppointment) {
  return err(res, 404, 'NOT_FOUND', 'Appointment not found')
}
```

**Active Filter**: Only allows updating active appointments.

**3. Verify Provider (if being updated)**

```typescript
if (validatedData.provider_id) {
  const provider = db.prepare(`
    SELECT id FROM healthcare_providers WHERE id = ? AND active = 1
  `).get(validatedData.provider_id)
  
  if (!provider) {
    return err(res, 404, 'NOT_FOUND', 'Provider not found')
  }
}
```

**Conditional Check**: Only validates provider if `provider_id` is in request body.

**4. Build Dynamic UPDATE Query**

```typescript
const updates: string[] = []
const values: (string | number | null)[] = []

Object.entries(validatedData).forEach(([key, value]) => {
  if (value !== undefined) {
    updates.push(`${key} = ?`)
    values.push(value)
  }
})

if (updates.length === 0) {
  return err(res, 400, 'VALIDATION_ERROR', 'No valid fields to update')
}

updates.push('updated_at = ?')
values.push(new Date().toISOString())
values.push(id)

const updateQuery = `
  UPDATE appointments 
  SET ${updates.join(', ')} 
  WHERE id = ? AND active = 1
`
```

**Dynamic Query Building**:
- Iterates over validated fields
- Only includes fields present in request body
- Always updates `updated_at` timestamp
- Filters by `id` and `active = 1`

**Example Built Query**:
```sql
UPDATE appointments 
SET status = ?, notes = ?, updated_at = ? 
WHERE id = ? AND active = 1
-- values: ['completed', 'Patient did well', '2024-01-20T16:00:00.000Z', 'appt_abc123']
```

**5. Execute Update**

```typescript
const result = db.prepare(updateQuery).run(...values)

if (result.changes === 0) {
  return err(res, 404, 'NOT_FOUND', 'Appointment not found')
}
```

**Changes Check**: Ensures appointment existed and was updated.

**6. Retrieve and Return Updated Appointment**

```typescript
const updatedAppointment = db.prepare(`
  SELECT a.*, 
         p.name as patient_name,
         hp.name as provider_name
  FROM appointments a
  LEFT JOIN patients p ON a.patient_id = p.id
  LEFT JOIN healthcare_providers hp ON a.provider_id = hp.id
  WHERE a.id = ?
`).get(id)

okItem(res, updatedAppointment)
```

#### Response Format (Success)

```typescript
{
  data: {
    id: "appt_abc123",
    // ... all fields with updates applied
    status: "completed",  // Updated field
    notes: "Patient did well",  // Updated field
    updated_at: "2024-01-20T16:00:00.000Z"  // Updated timestamp
  }
}
```

#### Response Format (No Fields Provided)

```typescript
{
  error: {
    code: "VALIDATION_ERROR",
    message: "No valid fields to update"
  }
}
```

#### Example Request

```typescript
// Update status to completed with outcome notes
const response = await fetch('/api/appointments/appt_abc123', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    status: "completed",
    notes: "Patient reports feeling better. No complications."
  })
})

const data = await response.json()
console.log(`Updated appointment: ${data.data.status}`)
```

---

### DELETE /api/appointments/:id

**Purpose**: Soft delete an appointment (mark as inactive).

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Appointment ID to delete |

#### Implementation

```typescript
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const result = db.prepare(`
      UPDATE appointments 
      SET active = 0, updated_at = ? 
      WHERE id = ? AND active = 1
    `).run(new Date().toISOString(), id)
    
    if (result.changes === 0) {
      return err(res, 404, 'NOT_FOUND', 'Appointment not found')
    }
    
    okItem(res, { message: 'Appointment deleted successfully' })
  } catch (error) {
    handleRouterError(res, error, 'Failed to delete appointment')
  }
})
```

**Soft Delete**:
- Sets `active = 0` instead of DELETE
- Updates `updated_at` timestamp
- Only affects active appointments (`WHERE active = 1`)

**Why Soft Delete**:
- Preserve historical data
- Allow undelete/restore functionality
- Maintain foreign key relationships
- Audit trail for compliance

**No Cascade**: Does not delete related records (intentional data preservation).

#### Response Format (Success)

```typescript
{
  data: {
    message: "Appointment deleted successfully"
  }
}
```

#### Response Format (Not Found)

```typescript
{
  error: {
    code: "NOT_FOUND",
    message: "Appointment not found"
  }
}
```

**Not Found When**:
- Appointment ID doesn't exist
- Appointment already soft-deleted (`active = 0`)

#### Example Request

```typescript
const response = await fetch('/api/appointments/appt_abc123', {
  method: 'DELETE'
})

if (response.ok) {
  const data = await response.json()
  console.log(data.data.message)  // "Appointment deleted successfully"
}
```

---

## Error Handling

### Validation Errors (Zod)

**Trigger**: Request body doesn't match schema

**Handler**:
```typescript
catch (error) {
  if (error instanceof z.ZodError) {
    return err(res, 400, 'VALIDATION_ERROR', 'Invalid appointment data', {
      issues: error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message
      }))
    })
  }
  
  handleRouterError(res, error, 'Failed to create appointment')
}
```

**Example Error Response**:
```typescript
{
  error: {
    code: "VALIDATION_ERROR",
    message: "Invalid appointment data",
    details: {
      issues: [
        { field: "patient_id", message: "String must contain at least 1 character(s)" },
        { field: "duration_minutes", message: "Number must be less than or equal to 480" }
      ]
    }
  }
}
```

### Foreign Key Violations

**Scenarios**:
1. Patient not found during creation
2. Provider not found during creation/update
3. Patient/provider inactive (soft-deleted)

**Example**:
```typescript
{
  error: {
    code: "NOT_FOUND",
    message: "Patient not found"
  }
}
```

### Not Found Errors

**Scenarios**:
1. GET by ID - appointment doesn't exist
2. UPDATE - appointment doesn't exist or inactive
3. DELETE - appointment doesn't exist or already deleted

**Response**:
```typescript
{
  error: {
    code: "NOT_FOUND",
    message: "Appointment not found"
  }
}
```

### Generic Errors

**Handler**: `handleRouterError(res, error, contextMessage)`

**Example**:
- Database connection errors
- Unexpected runtime errors

**Response**:
```typescript
{
  error: {
    code: "INTERNAL",
    message: "Failed to create appointment"
  }
}
```

---

## Usage Examples

### Create Appointment Workflow

```typescript
async function scheduleAppointment(
  patientId: string,
  providerId: string,
  date: string,
  type: string
) {
  const response = await fetch('/api/appointments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patient_id: patientId,
      provider_id: providerId,
      appointment_type: type,
      appointment_date: date,
      duration_minutes: 30,
      status: 'scheduled',
      location: 'Main Clinic',
      notes: 'Regular checkup'
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error.message)
  }

  const data = await response.json()
  return data.data
}

// Usage
const appointment = await scheduleAppointment(
  'pat_xyz789',
  'prov_def456',
  '2024-03-15',
  'routine'
)
console.log(`Scheduled with ${appointment.provider_name} on ${appointment.appointment_date}`)
```

### Update Appointment Status

```typescript
async function completeAppointment(appointmentId: string, outcome: string) {
  const response = await fetch(`/api/appointments/${appointmentId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'completed',
      notes: outcome
    })
  })

  const data = await response.json()
  return data.data
}

// Usage
await completeAppointment('appt_abc123', 'Patient doing well, no concerns')
```

### Get Patient's Upcoming Appointments

```typescript
async function getUpcomingAppointments(patientId: string) {
  const response = await fetch(`/api/appointments?patient_id=${patientId}`)
  const data = await response.json()
  
  const today = new Date().toISOString().split('T')[0]
  
  return data.data.filter(appt => 
    appt.status === 'scheduled' && 
    appt.appointment_date >= today
  ).sort((a, b) => 
    a.appointment_date.localeCompare(b.appointment_date)
  )
}

// Usage
const upcoming = await getUpcomingAppointments('pat_xyz789')
console.log(`${upcoming.length} upcoming appointments`)
```

### Reschedule Appointment

```typescript
async function rescheduleAppointment(
  appointmentId: string,
  newDate: string,
  newTime?: string
) {
  const updates: any = {
    appointment_date: newDate,
    status: 'rescheduled'
  }
  
  if (newTime) {
    updates.appointment_time = newTime
  }

  const response = await fetch(`/api/appointments/${appointmentId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  })

  const data = await response.json()
  return data.data
}

// Usage
const rescheduled = await rescheduleAppointment('appt_abc123', '2024-04-01', '10:00')
```

### Cancel Appointment

```typescript
async function cancelAppointment(appointmentId: string, reason: string) {
  // First update status to cancelled
  await fetch(`/api/appointments/${appointmentId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'cancelled',
      notes: `Cancelled: ${reason}`
    })
  })

  // Then soft delete
  const response = await fetch(`/api/appointments/${appointmentId}`, {
    method: 'DELETE'
  })

  return response.ok
}

// Usage
await cancelAppointment('appt_abc123', 'Patient requested cancellation')
```

---

## Best Practices

### 1. Always Validate Foreign Keys

```typescript
// ✅ GOOD: Verify patient exists before creating appointment
const patient = db.prepare(`
  SELECT id FROM patients WHERE id = ? AND active = 1
`).get(validatedData.patient_id)

if (!patient) {
  return err(res, 404, 'NOT_FOUND', 'Patient not found')
}

// ❌ BAD: Relying on database FK constraint (obscure error messages)
// Just insert and let DB throw error
```

**Why**: Provides clear, user-friendly error messages instead of database constraint errors.

### 2. Use Soft Deletes for Appointments

```typescript
// ✅ GOOD: Soft delete (preserve history)
UPDATE appointments SET active = 0, updated_at = ? WHERE id = ?

// ❌ BAD: Hard delete (lose historical data)
DELETE FROM appointments WHERE id = ?
```

**Why**: 
- Preserve appointment history
- Maintain referential integrity
- Enable "undelete" functionality
- Regulatory compliance (healthcare data retention)

### 3. Always Update Timestamps

```typescript
// ✅ GOOD: Update updated_at on every change
updates.push('updated_at = ?')
values.push(new Date().toISOString())

// ❌ BAD: Forget to update timestamp
// No way to track when appointment was last modified
```

**Why**: Track modification history for auditing and debugging.

### 4. Return Enriched Data After Mutations

```typescript
// ✅ GOOD: Re-fetch with JOINs to include patient/provider names
const newAppointment = db.prepare(`
  SELECT a.*, p.name as patient_name, hp.name as provider_name
  FROM appointments a
  LEFT JOIN patients p ON a.patient_id = p.id
  LEFT JOIN healthcare_providers hp ON a.provider_id = hp.id
  WHERE a.id = ?
`).get(appointmentId)

// ❌ BAD: Return only inserted data (missing joined fields)
okItem(res, { id: appointmentId, ...validatedData })
```

**Why**: Consistent response format across all endpoints, reduces frontend requests.

### 5. Validate Duration Constraints

```typescript
// ✅ GOOD: Enforce reasonable duration limits
duration_minutes: z.number().int().min(1).max(480)  // 8 hours max

// ❌ BAD: No upper limit
duration_minutes: z.number().int().min(1)
```

**Why**: Prevents data entry errors (e.g., entering 30000 instead of 30).

### 6. Use Dynamic Query Building for Updates

```typescript
// ✅ GOOD: Only update provided fields
Object.entries(validatedData).forEach(([key, value]) => {
  if (value !== undefined) {
    updates.push(`${key} = ?`)
    values.push(value)
  }
})

// ❌ BAD: Update all fields (overwrites with null/undefined)
UPDATE appointments SET 
  provider_id = ?, location = ?, notes = ?
WHERE id = ?
```

**Why**: Partial updates preserve unchanged fields, more flexible API.

---

## Integration with Frontend

### Appointment List Component

```vue
<template>
  <div class="appointments-list">
    <h2>Appointments for {{ patientName }}</h2>
    
    <div v-for="appt in appointments" :key="appt.id" class="appointment-card">
      <h3>{{ appt.appointment_type }}</h3>
      <p>Date: {{ formatDate(appt.appointment_date) }}</p>
      <p>Time: {{ appt.appointment_time }}</p>
      <p>Provider: {{ appt.provider_name }}</p>
      <p>Location: {{ appt.location }}</p>
      <p>Status: <span :class="`status-${appt.status}`">{{ appt.status }}</span></p>
      
      <button @click="editAppointment(appt.id)">Edit</button>
      <button @click="cancelAppointment(appt.id)">Cancel</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{ patientId: string; patientName: string }>()
const appointments = ref([])

async function loadAppointments() {
  const response = await fetch(`/api/appointments?patient_id=${props.patientId}`)
  const data = await response.json()
  appointments.value = data.data
}

async function cancelAppointment(id: string) {
  if (!confirm('Cancel this appointment?')) return
  
  await fetch(`/api/appointments/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'cancelled' })
  })
  
  await loadAppointments()
}

onMounted(loadAppointments)
</script>
```

### Appointment Form Component

```vue
<template>
  <form @submit.prevent="saveAppointment">
    <label>
      Provider:
      <select v-model="form.provider_id" required>
        <option v-for="p in providers" :key="p.id" :value="p.id">
          {{ p.name }} - {{ p.specialty }}
        </option>
      </select>
    </label>
    
    <label>
      Date:
      <input type="date" v-model="form.appointment_date" required />
    </label>
    
    <label>
      Type:
      <select v-model="form.appointment_type" required>
        <option value="routine">Routine</option>
        <option value="follow_up">Follow-up</option>
        <option value="emergency">Emergency</option>
        <option value="specialist">Specialist</option>
      </select>
    </label>
    
    <label>
      Duration (minutes):
      <input type="number" v-model="form.duration_minutes" min="1" max="480" required />
    </label>
    
    <label>
      Location:
      <input type="text" v-model="form.location" />
    </label>
    
    <label>
      Notes:
      <textarea v-model="form.notes"></textarea>
    </label>
    
    <button type="submit">{{ isEdit ? 'Update' : 'Create' }} Appointment</button>
  </form>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{ 
  patientId: string
  appointmentId?: string 
}>()

const emit = defineEmits<{ saved: [] }>()

const form = ref({
  provider_id: '',
  appointment_date: '',
  appointment_type: 'routine',
  duration_minutes: 30,
  location: '',
  notes: ''
})

const providers = ref([])
const isEdit = computed(() => !!props.appointmentId)

async function loadProviders() {
  const response = await fetch('/api/providers')
  const data = await response.json()
  providers.value = data.data
}

async function loadAppointment() {
  if (!props.appointmentId) return
  
  const response = await fetch(`/api/appointments/${props.appointmentId}`)
  const data = await response.json()
  Object.assign(form.value, data.data)
}

async function saveAppointment() {
  const url = isEdit.value 
    ? `/api/appointments/${props.appointmentId}`
    : '/api/appointments'
  
  const method = isEdit.value ? 'PUT' : 'POST'
  
  const body = isEdit.value 
    ? form.value 
    : { ...form.value, patient_id: props.patientId }

  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })

  if (response.ok) {
    emit('saved')
  }
}

onMounted(async () => {
  await loadProviders()
  await loadAppointment()
})
</script>
```

---

## Performance Considerations

### 1. Indexes

**Existing Indexes**:
- `idx_appointments_patient_date`: Fast patient appointment lookups
- `idx_appointments_status_date`: Fast status-based queries

**Query Patterns Optimized**:
```sql
-- Fast: Uses idx_appointments_patient_date
SELECT * FROM appointments WHERE patient_id = ? ORDER BY appointment_date

-- Fast: Uses idx_appointments_status_date
SELECT * FROM appointments WHERE status = 'scheduled' AND appointment_date > ?
```

### 2. JOIN Performance

**Current JOINs**: `LEFT JOIN patients`, `LEFT JOIN healthcare_providers`

**Performance**: Acceptable for small-to-medium datasets (< 100k appointments)

**Optimization Needed If**: 
- Slow queries with large datasets
- Consider materialized views or caching

### 3. Soft Delete Filtering

**Impact**: All queries should filter `active = 1` for production data

**Missing Filter**: Current implementation doesn't filter by `active` in GET endpoints

**Recommendation**:
```typescript
// Add to WHERE clause
WHERE a.active = 1 AND ...
```

---

## Security Considerations

### 1. SQL Injection Protection

**Status**: ✅ Protected

**Method**: Parameterized queries via `db.prepare().run(...params)`

```typescript
// Safe: Parameters prevent injection
db.prepare(`SELECT * FROM appointments WHERE id = ?`).get(id)

// Vulnerable (not used): String concatenation
db.exec(`SELECT * FROM appointments WHERE id = '${id}'`)
```

### 2. Authorization

**Missing**: No patient-level authorization checks

**Recommendation**: Add middleware to verify user can access patient's appointments

```typescript
// Example authorization middleware
async function authorizePatientAccess(req, res, next) {
  const { patient_id } = req.query || req.body
  const userId = req.user.id  // From auth middleware
  
  // Check if user has access to this patient
  const access = db.prepare(`
    SELECT 1 FROM patient_access 
    WHERE patient_id = ? AND user_id = ?
  `).get(patient_id, userId)
  
  if (!access) {
    return err(res, 403, 'FORBIDDEN', 'Access denied')
  }
  
  next()
}
```

### 3. Input Validation

**Status**: ✅ Strong validation with Zod schemas

**Coverage**:
- Type checking (string, number)
- Range validation (1-480 minutes)
- Required field enforcement

---

## Testing Considerations

### Unit Test Scenarios

```typescript
describe('Appointments Router', () => {
  describe('POST /api/appointments', () => {
    it('should create appointment with valid data', async () => {
      // Test successful creation
    })
    
    it('should reject when patient not found', async () => {
      // Test 404 error for invalid patient_id
    })
    
    it('should reject when provider not found', async () => {
      // Test 404 error for invalid provider_id
    })
    
    it('should reject invalid duration', async () => {
      // Test validation error for duration_minutes > 480
    })
  })
  
  describe('PUT /api/appointments/:id', () => {
    it('should update appointment fields', async () => {
      // Test partial update
    })
    
    it('should reject patient_id change', async () => {
      // Test schema omits patient_id
    })
    
    it('should update only provided fields', async () => {
      // Test dynamic query building
    })
  })
  
  describe('DELETE /api/appointments/:id', () => {
    it('should soft delete appointment', async () => {
      // Test active = 0 set
    })
    
    it('should not double-delete', async () => {
      // Test 404 when already deleted
    })
  })
})
```

### Integration Test Example

```typescript
test('Full appointment lifecycle', async () => {
  // 1. Create patient and provider
  const patient = await createPatient({ name: 'Test Patient' })
  const provider = await createProvider({ name: 'Dr. Test' })
  
  // 2. Create appointment
  const createRes = await fetch('/api/appointments', {
    method: 'POST',
    body: JSON.stringify({
      patient_id: patient.id,
      provider_id: provider.id,
      appointment_type: 'routine',
      appointment_date: '2024-03-15',
      duration_minutes: 30
    })
  })
  const created = await createRes.json()
  expect(created.data.status).toBe('scheduled')
  
  // 3. Update to completed
  const updateRes = await fetch(`/api/appointments/${created.data.id}`, {
    method: 'PUT',
    body: JSON.stringify({ status: 'completed' })
  })
  const updated = await updateRes.json()
  expect(updated.data.status).toBe('completed')
  
  // 4. Delete
  const deleteRes = await fetch(`/api/appointments/${created.data.id}`, {
    method: 'DELETE'
  })
  expect(deleteRes.ok).toBe(true)
  
  // 5. Verify soft delete
  const getRes = await fetch(`/api/appointments/${created.data.id}`)
  const deleted = await getRes.json()
  expect(deleted.data.active).toBe(0)
})
```

---

## Summary

The **appointmentsRouter** provides complete CRUD operations for medical appointment management:

- **GET /api/appointments**: List all or filter by patient
- **GET /api/appointments/:id**: Retrieve single appointment
- **POST /api/appointments**: Create new appointment with validation
- **PUT /api/appointments/:id**: Update appointment (partial, dynamic)
- **DELETE /api/appointments/:id**: Soft delete appointment

**Key Features**:
- Foreign key validation (patients, providers)
- Soft delete pattern (preserve history)
- Dynamic partial updates
- Enriched responses (JOIN patient/provider names)
- Comprehensive validation (Zod schemas)
- Proper error handling with standard API contract

**Data Integrity**:
- Patient assignment immutable after creation
- Active-only foreign key checks
- Timestamp tracking (created_at, updated_at)
- Soft delete for historical preservation

**Future Enhancements**:
- Add authorization middleware
- Filter by `active = 1` in GET endpoints
- Add appointment conflict detection
- Implement reminder notifications
- Support recurring appointments
