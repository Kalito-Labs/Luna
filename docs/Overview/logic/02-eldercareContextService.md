# eldercareContextService.ts - Database Context Provider for AI

## Purpose

`eldercareContextService.ts` is the **critical bridge** between your eldercare database and AI models. It provides AI with full read-only access to patient data, medications, appointments, vitals, and caregivers, enabling context-aware, personalized responses.

## Why This Matters

**Without this service:** AI is blind to your eldercare data
```
User: "How many medications is dad taking?"
AI: "I don't have access to that information."
```

**With this service:** AI has complete context
```
User: "How many medications is dad taking?"
AI: "Basilio Sanchez (Father) is currently taking 2 medications:
     1. Farxiga 10mg - once daily for diabetes
     2. Janumet 50/1000mg - twice daily for diabetes"
```

---

## Core Architecture

```
User Query: "What meds is dad taking?"
    ↓
eldercareContextService.generateContextualPrompt(adapter, query)
    ↓
[Analyze Query]
    ├── Detect "dad" → findPatientByReference('dad')
    ├── Found: Basilio Sanchez (Father, ID: abc123)
    └── Get context for patient: abc123
    ↓
getEldercareContext(adapter, patientId='abc123')
    ├── getPatients() → Basilio Sanchez
    ├── getMedications(patientId) → 2 medications
    ├── getRecentAppointments(patientId) → Upcoming cardiology
    ├── getRecentVitals(patientId) → Blood pressure readings
    └── getCaregivers() → Active caregivers
    ↓
generateContextSummary(context)
    ↓
Return formatted context to agentService
    ↓
AI receives complete eldercare context
```

---

## Key Classes & Interfaces

### **EldercareContext** - Complete Context Object
```typescript
interface EldercareContext {
  patients: PatientContext[]        // All active patients
  medications: MedicationContext[]   // Current medications
  recentAppointments: AppointmentContext[]  // Next 30 days
  recentVitals: VitalContext[]      // Last 30 days
  caregivers: CaregiverContext[]    // Active caregivers
  summary: string                    // Human-readable summary
}
```

### **PatientContext** - Patient Information
```typescript
interface PatientContext {
  id: string
  name: string                // "Basilio Sanchez"
  relationship?: string       // "Father"
  age?: number               // 72
  gender?: string            // "Male"
  primaryDoctor?: string     // "Dr. Smith" (trusted models only)
  emergencyContact?: string  // "Maria" (trusted models only)
  notes?: string            // Care notes (trusted models only)
}
```

### **MedicationContext** - Medication Details
```typescript
interface MedicationContext {
  id: string
  name: string               // "Farxiga"
  genericName?: string       // "Dapagliflozin"
  dosage: string            // "10mg"
  frequency: string         // "Once daily"
  route?: string            // "Oral"
  prescribingDoctor?: string // "Dr. Johnson" (trusted models only)
  pharmacy?: string          // "CVS Pharmacy" (trusted models only)
  rxNumber?: string          // "RX123456" (trusted models only)
  sideEffects?: string       // "Dizziness" (trusted models only)
  notes?: string            // Additional notes (trusted models only)
}
```

### **AppointmentContext** - Appointment Information
```typescript
interface AppointmentContext {
  id: string
  appointmentDate: string    // "2025-10-20"
  appointmentTime?: string   // "10:30 AM"
  appointmentType?: string   // "Cardiology Follow-up"
  location?: string          // "Memorial Hospital" (trusted models only)
  status: string            // "scheduled"
  preparationNotes?: string  // "Fasting required" (trusted models only)
  notes?: string            // Additional notes (trusted models only)
}
```

### **VitalContext** - Vital Sign Measurement
```typescript
interface VitalContext {
  id: string
  measurementType: string    // "blood_pressure"
  systolic?: number         // 120 (for BP)
  diastolic?: number        // 80 (for BP)
  value?: number            // For other types
  unit?: string             // "mmHg", "lbs", etc.
  measuredAt: string        // Timestamp
  measuredBy?: string        // "Nurse Jane" (trusted models only)
  location?: string          // "Home" (trusted models only)
  notes?: string            // Additional notes (trusted models only)
}
```

### **CaregiverContext** - Caregiver Information
```typescript
interface CaregiverContext {
  id: string
  name: string              // "Maria Rodriguez"
  relationship?: string     // "Home Health Aide"
  specialties: string[]     // ["diabetes care", "mobility"]
  certifications: string[]  // ["CNA", "CPR"]
  isCurrentlyWorking: boolean
  clockedInSince?: string   // Timestamp if currently working
  totalHoursWorked: number  // 240.5
  availabilityToday?: string // "9:00 AM - 5:00 PM"
  notes?: string           // Care notes (trusted models only)
}
```

---

## Privacy & Security Model

### Trusted vs. Untrusted Models

```typescript
private readonly TRUSTED_MODELS = [
  'gpt-4.1-nano',  // Your controlled OpenAI API key
]

private isTrustedModel(adapter: LLMAdapter): boolean {
  // Local models: ALWAYS trusted (data never leaves your machine)
  if (adapter.type === 'local') return true
  
  // Cloud models: Check if in trusted list
  if (this.TRUSTED_MODELS.includes(adapter.id)) return true
  
  // Unknown cloud models: NOT trusted
  return false
}
```

### Data Access Levels

**Trusted Models** (Local + GPT-4.1 Nano):
- ✅ Patient names, relationships, ages
- ✅ All medication details (prescribing doctor, pharmacy, Rx numbers, side effects)
- ✅ Appointment details (locations, preparation notes)
- ✅ Vital measurement details (who measured, where, notes)
- ✅ Caregiver details (specialties, notes)

**Untrusted Models** (hypothetical future cloud models):
- ✅ Patient names, relationships, ages
- ✅ Basic medication info (name, dosage, frequency)
- ✅ Basic appointment info (date, time, type)
- ✅ Basic vital readings (type, values, timestamps)
- ❌ No sensitive details (doctors, pharmacies, locations, notes)

### Why This Approach?

**Your controlled API keys = Trusted**
- You own the OpenAI API key
- Data sent to OpenAI stays within your account
- No public sharing or third-party access
- Same trust level as local processing

**Future unknown providers = Untrusted**
- If you add a new cloud provider later
- Only basic info shared until explicitly trusted
- Privacy-conscious by default

---

## Core Methods

### 1. `generateContextualPrompt()` - Smart Context Injection

**Purpose:** Analyzes user query and injects relevant eldercare context

**Process:**
```typescript
generateContextualPrompt(adapter: LLMAdapter, userQuery: string): string
```

**Step 1: Patient Detection**
```typescript
// Check for family keywords
const keywords = ['dad', 'father', 'mom', 'mother', 'parent']
if (queryLower.includes('dad')) {
  foundPatient = findPatientByReference('dad')
  // Result: Basilio Sanchez (Father)
}
```

**Step 2: Name Extraction**
```typescript
// If no keywords, try names
const words = userQuery.split(/\s+/)
for (const word of words) {
  if (word.length > 2) {
    const patient = findPatientByReference(word)  // "Basilio"
    if (patient) break
  }
}
```

**Step 3: Context Retrieval**
```typescript
const context = this.getEldercareContext(adapter, foundPatient?.id)
// Gets all relevant data for that patient
```

**Step 4: Format for AI**
```typescript
let contextPrompt = "\n\n## Available Eldercare Information\n\n"
contextPrompt += context.summary
contextPrompt += "\n## Instructions for AI Assistant\n"
contextPrompt += "- Use eldercare info for relevant responses\n"
contextPrompt += "- Reference patients by name naturally\n"
contextPrompt += "- Always recommend consulting healthcare pros\n"
return contextPrompt
```

**Example Output:**
```markdown
## Available Eldercare Information

### Patients (1)
- **Basilio Sanchez** (Father), age 72, Male

### Active Medications (2)
- Farxiga 10mg (Once daily)
- Janumet 50/1000mg (Twice daily)

### Upcoming Appointments (1)
- 2025-10-20 at 10:30 AM (Cardiology Follow-up)

### Recent Vitals (last 30 days)
- **blood_pressure**: 120/80 (10/13/2025)
- **blood_sugar**: 110 mg/dL (10/13/2025)

## Instructions for AI Assistant
- Use the eldercare information above for relevant responses
- Reference patients by name naturally
- Always recommend consulting healthcare professionals
- Maintain compassionate, family-focused tone
```

---

### 2. `getEldercareContext()` - Fetch Complete Context

**Purpose:** Retrieves all eldercare data for AI

**Signature:**
```typescript
getEldercareContext(adapter: LLMAdapter, patientId?: string): EldercareContext
```

**Process:**
```typescript
// Determine trust level
const includePrivateData = this.isLocalModel(adapter)

// Query all data sources
const patients = this.getPatients(includePrivateData)
const medications = this.getMedications(patientId, includePrivateData)
const appointments = this.getRecentAppointments(patientId, includePrivateData)
const vitals = this.getRecentVitals(patientId, includePrivateData)
const caregivers = this.getCaregivers(includePrivateData)

// Generate summary
const context = { patients, medications, appointments, vitals, caregivers, summary: '' }
context.summary = this.generateContextSummary(context)

return context
```

**Optional Patient Filtering:**
```typescript
// Get context for specific patient
getEldercareContext(adapter, patientId='abc123')
// Returns: Only meds, appointments, vitals for Basilio

// Get context for all patients
getEldercareContext(adapter)
// Returns: All patients' data
```

---

### 3. `findPatientByReference()` - Natural Language Patient Lookup

**Purpose:** Find patient by nickname or name fragment

**SQL Query:**
```sql
SELECT id, name, relationship, date_of_birth, gender
FROM patients 
WHERE active = 1 
AND (LOWER(name) LIKE LOWER(?) OR LOWER(relationship) LIKE LOWER(?))
ORDER BY 
  CASE 
    WHEN LOWER(name) = LOWER(?) THEN 1        -- Exact name match (highest priority)
    WHEN LOWER(relationship) = LOWER(?) THEN 2 -- Exact relationship match
    WHEN LOWER(name) LIKE LOWER(?) THEN 3      -- Partial name match
    ELSE 4
  END
LIMIT 1
```

**Examples:**
```typescript
findPatientByReference('dad')
// Returns: { name: "Basilio Sanchez", relationship: "Father", ... }

findPatientByReference('Basilio')
// Returns: { name: "Basilio Sanchez", relationship: "Father", ... }

findPatientByReference('mother')
// Returns: { name: "Maria Sanchez", relationship: "Mother", ... }

findPatientByReference('bas')
// Returns: { name: "Basilio Sanchez", ... } (partial match)
```

---

### 4. `getPatients()` - Retrieve All Active Patients

**SQL Query:**
```sql
SELECT id, name, date_of_birth, relationship, gender, 
       primary_doctor, emergency_contact_name, notes
FROM patients 
WHERE active = 1 
ORDER BY name ASC
```

**Trust-Based Filtering:**
```typescript
// Trusted models get everything
if (includePrivateData) {
  context.primaryDoctor = row.primary_doctor || undefined
  context.emergencyContact = row.emergency_contact_name || undefined
  context.notes = row.notes || undefined
}
```

**Example Return:**
```typescript
[
  {
    id: "abc123",
    name: "Basilio Sanchez",
    relationship: "Father",
    age: 72,
    gender: "Male",
    primaryDoctor: "Dr. Smith",     // Trusted only
    emergencyContact: "Maria",      // Trusted only
    notes: "Diabetic, mobility..."  // Trusted only
  }
]
```

---

### 5. `getMedications()` - Retrieve Active Medications

**SQL Query:**
```sql
SELECT id, patient_id, name, generic_name, dosage, frequency, route,
       prescribing_doctor, pharmacy, rx_number,
       side_effects, notes
FROM medications 
WHERE active = 1
  AND patient_id = ?  -- Optional patient filter
ORDER BY created_at DESC 
LIMIT 50
```

**Trust-Based Filtering:**
```typescript
// Always included (basic info)
const context = {
  id: row.id,
  name: row.name,            // "Farxiga"
  genericName: row.generic_name,  // "Dapagliflozin"
  dosage: row.dosage,        // "10mg"
  frequency: row.frequency,  // "Once daily"
  route: row.route          // "Oral"
}

// Trusted models only (sensitive info)
if (includePrivateData) {
  context.prescribingDoctor = row.prescribing_doctor  // "Dr. Johnson"
  context.pharmacy = row.pharmacy                    // "CVS"
  context.rxNumber = row.rx_number                   // "RX123456"
  context.sideEffects = row.side_effects            // "Dizziness"
  context.notes = row.notes                         // Additional notes
}
```

**Example Return (Trusted):**
```typescript
[
  {
    id: "med1",
    name: "Farxiga",
    genericName: "Dapagliflozin",
    dosage: "10mg",
    frequency: "Once daily",
    route: "Oral",
    prescribingDoctor: "Dr. Johnson",
    pharmacy: "CVS Pharmacy",
    rxNumber: "RX123456",
    sideEffects: "May cause dizziness",
    notes: "Take in morning with breakfast"
  }
]
```

---

### 6. `getRecentAppointments()` - Fetch Upcoming/Recent Appointments

**SQL Query:**
```sql
SELECT id, patient_id, appointment_date, appointment_time, 
       appointment_type, location, status, preparation_notes, notes
FROM appointments 
WHERE appointment_date >= ?  -- Last 30 days
  AND patient_id = ?         -- Optional
ORDER BY appointment_date ASC 
LIMIT 20
```

**Date Range:**
```typescript
private readonly MAX_RECENT_DAYS = 30

const cutoffDate = new Date()
cutoffDate.setDate(cutoffDate.getDate() - 30)
// Gets appointments from 30 days ago to future
```

**Example Return (Trusted):**
```typescript
[
  {
    id: "apt1",
    appointmentDate: "2025-10-20",
    appointmentTime: "10:30 AM",
    appointmentType: "Cardiology Follow-up",
    location: "Memorial Hospital",
    status: "scheduled",
    preparationNotes: "Fasting required after midnight",
    notes: "Bring recent EKG results"
  }
]
```

---

### 7. `getRecentVitals()` - Fetch Recent Measurements

**SQL Query:**
```sql
SELECT id, patient_id, measurement_type, systolic, diastolic, 
       value, unit, measured_at, measured_by, location, notes
FROM vitals 
WHERE measured_at >= ?  -- Last 30 days
  AND patient_id = ?    -- Optional
ORDER BY measured_at DESC 
LIMIT 50
```

**Measurement Types:**
- `blood_pressure` - Uses systolic/diastolic fields
- `blood_sugar`, `weight`, `temperature`, `heart_rate` - Use value field

**Example Return (Trusted):**
```typescript
[
  {
    id: "vital1",
    measurementType: "blood_pressure",
    systolic: 120,
    diastolic: 80,
    unit: "mmHg",
    measuredAt: "2025-10-13T09:30:00Z",
    measuredBy: "Nurse Jane",
    location: "Home",
    notes: "Patient rested 5 minutes before measurement"
  },
  {
    id: "vital2",
    measurementType: "blood_sugar",
    value: 110,
    unit: "mg/dL",
    measuredAt: "2025-10-13T08:00:00Z",
    measuredBy: "Self",
    location: "Home",
    notes: "Fasting measurement"
  }
]
```

---

### 8. `getCaregivers()` - Retrieve Active Caregivers

**SQL Query:**
```sql
SELECT id, name, relationship, specialties, certifications, 
       clock_in_time, clock_out_time, total_hours_worked, 
       availability_schedule, notes
FROM caregivers 
WHERE is_active = 1 
ORDER BY name ASC
```

**JSON Field Parsing:**
```typescript
const specialties = row.specialties ? JSON.parse(row.specialties) : []
// ["diabetes care", "mobility assistance"]

const certifications = row.certifications ? JSON.parse(row.certifications) : []
// ["CNA", "CPR", "First Aid"]

const availability = row.availability_schedule ? JSON.parse(row.availability_schedule) : {}
// { monday: { available: true, start: "9:00 AM", end: "5:00 PM" }, ... }
```

**Work Status Detection:**
```typescript
isCurrentlyWorking: !!row.clock_in_time && !row.clock_out_time
// TRUE if clocked in without clock out
```

**Example Return (Trusted):**
```typescript
[
  {
    id: "cg1",
    name: "Maria Rodriguez",
    relationship: "Home Health Aide",
    specialties: ["diabetes care", "mobility assistance"],
    certifications: ["CNA", "CPR"],
    isCurrentlyWorking: true,
    clockedInSince: "2025-10-13T08:00:00Z",
    totalHoursWorked: 240.5,
    availabilityToday: "8:00 AM - 4:00 PM",
    notes: "Preferred caregiver for Mr. Sanchez"
  }
]
```

---

### 9. `generateContextSummary()` - Create Human-Readable Summary

**Purpose:** Format eldercare context into markdown summary for AI

**Structure:**
```markdown
## Eldercare Context Summary

### Patients (count)
- **Name** (Relationship), age X, gender

### Active Medications (count)
- Name dosage (frequency)

### Upcoming Appointments (count)
- Date at time (type)

### Recent Vitals (last 30 days)
- **Type**: value (date)

### Active Caregivers (count)
- **Name** (Relationship) - Status | Specialties
```

**Example Output:**
```markdown
## Eldercare Context Summary

### Patients (1)
- **Basilio Sanchez** (Father), age 72, Male

### Active Medications (2)
- Farxiga 10mg (Once daily)
- Janumet 50/1000mg (Twice daily)

### Upcoming Appointments (1)
- 2025-10-20 at 10:30 AM (Cardiology Follow-up)

### Recent Vitals (last 30 days)
- **blood_pressure**: 120/80 (10/13/2025)
- **blood_sugar**: 110 mg/dL (10/13/2025)

### Active Caregivers (1)
- **Maria Rodriguez** (Home Health Aide) - Currently Working (2.5h) | Specialties: diabetes care, mobility assistance
```

---

## Helper Methods

### `calculateAge()` - Age from Date of Birth
```typescript
private calculateAge(dateOfBirth: string): number | undefined {
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  
  // Adjust if birthday hasn't occurred this year
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  
  return age >= 0 ? age : undefined
}
```

**Example:**
```typescript
calculateAge('1953-03-15')
// Returns: 72 (as of Oct 2025)
```

---

## Usage Examples

### Example 1: Simple Query
```typescript
const service = new EldercareContextService()
const adapter = getModelAdapter('gpt-4.1-nano')

// User asks: "Hello"
const context = service.generateContextualPrompt(adapter, "Hello")
// Returns: "" (no eldercare keywords detected)
```

### Example 2: Patient-Specific Query
```typescript
// User asks: "How many medications is dad taking?"
const context = service.generateContextualPrompt(adapter, "How many medications is dad taking?")
// Returns: Full context summary focused on "dad" (Basilio)
```

### Example 3: Direct Context Access
```typescript
const adapter = getModelAdapter('gpt-4.1-nano')
const patientId = 'abc123'

const fullContext = service.getEldercareContext(adapter, patientId)
// Returns: EldercareContext with all data for patient abc123

console.log(fullContext.medications.length)  // 2
console.log(fullContext.recentAppointments.length)  // 1
console.log(fullContext.summary)  // Markdown summary
```

### Example 4: Patient Lookup
```typescript
const patient = service.findPatientByReference('father')
// Returns: { id: 'abc123', name: 'Basilio Sanchez', relationship: 'Father', ... }

const samePerson = service.findPatientByReference('Basilio')
// Returns: Same patient (matches name)
```

---

## Performance Considerations

### Query Limits
```typescript
// Medications: LIMIT 50
// Appointments: LIMIT 20
// Vitals: LIMIT 50
```
**Why:** Prevents excessive data in context, reduces token usage

### Time Windows
```typescript
private readonly MAX_RECENT_DAYS = 30
```
**Why:** Recent data more relevant than historical data

### Indexed Queries
All queries use indexed columns:
- `patients.active`
- `medications.active`, `medications.patient_id`
- `appointments.appointment_date`, `appointments.patient_id`
- `vitals.measured_at`, `vitals.patient_id`
- `caregivers.is_active`

---

## Security Features

### 1. Read-Only Access
- No INSERT, UPDATE, DELETE operations
- AI cannot modify eldercare data
- All methods are `SELECT` queries only

### 2. Trust-Based Filtering
- Local models: Full access (runs on your machine)
- Trusted cloud: Full access (your API keys)
- Unknown cloud: Limited access (privacy protection)

### 3. Data Sanitization
```typescript
const context: PatientContext = {
  id: row.id,
  name: row.name,
  relationship: row.relationship || undefined,  // null → undefined
  age: row.date_of_birth ? this.calculateAge(row.date_of_birth) : undefined
}
```
**Why:** Clean undefined instead of null, consistent data structure

---

## Common Patterns

### Pattern 1: Context Injection in Agent Service
```typescript
// agentService.ts
function buildSystemPrompt(adapter, userInput, personaId) {
  const personaPrompt = getPersonaPrompt(personaId)
  const eldercareContext = eldercareContextService.generateContextualPrompt(adapter, userInput)
  
  return [personaPrompt, eldercareContext].filter(Boolean).join('\n\n')
}
```

### Pattern 2: Patient-Focused Queries
```typescript
// User: "What medications is dad taking?"
const patient = service.findPatientByReference('dad')
const context = service.getEldercareContext(adapter, patient.id)
// Returns: Only dad's medications, appointments, vitals
```

### Pattern 3: Family Overview
```typescript
// User: "Give me a family health overview"
const context = service.getEldercareContext(adapter)
// Returns: All patients' data
```

---

## Future Enhancements

### 1. Caching
```typescript
// Cache patient lookups
private patientCache: Map<string, PatientContext> = new Map()

findPatientByReference(reference: string) {
  if (this.patientCache.has(reference)) {
    return this.patientCache.get(reference)
  }
  // ... query database ...
  this.patientCache.set(reference, patient)
}
```

### 2. Contextual Relevance Scoring
```typescript
// Score how relevant each data type is to the query
generateContextualPrompt(adapter, userQuery) {
  const scores = {
    medications: this.calculateRelevance(userQuery, 'medication'),
    appointments: this.calculateRelevance(userQuery, 'appointment'),
    vitals: this.calculateRelevance(userQuery, 'vitals')
  }
  // Include only highly relevant data
}
```

### 3. Dynamic Trust Levels
```typescript
// Allow runtime trust configuration for cloud models
setTrustedModel(modelId: string, trusted: boolean) {
  if (trusted) {
    this.TRUSTED_MODELS.push(modelId)
  }
}

// Note: Local models (type === 'local') are automatically trusted
```

---

## Related Files

- `agentService.ts` - Consumes eldercare context
- `modelRegistry.ts` - Provides adapter for trust checking
- `../db/db.ts` - Database connection
- `../types/models.ts` - LLMAdapter type definition

---

## Quick Reference

**Get full context:**
```typescript
const context = service.getEldercareContext(adapter, patientId)
```

**Get smart context from query:**
```typescript
const contextPrompt = service.generateContextualPrompt(adapter, userQuery)
```

**Find patient:**
```typescript
const patient = service.findPatientByReference('dad')
```

**Add trusted cloud model:**
```typescript
// In TRUSTED_MODELS array
private readonly TRUSTED_MODELS = [
  'gpt-4.1-nano',
  'new-model-id',  // Add here
]

// Note: Local models (type === 'local') are automatically trusted
```
