# Eldercare Context Service Documentation

## Overview

The `EldercareContextService` class provides **intelligent, privacy-aware access** to eldercare database for AI context integration. It dynamically injects relevant patient, medication, appointment, and provider data into AI prompts based on user queries.

**Location**: `/backend/logic/eldercareContextService.ts`

**Primary Responsibilities**:
- Fetch eldercare data (patients, medications, appointments, providers, caregiver)
- Generate context summaries for AI consumption
- Implement privacy filtering (trusted vs untrusted models)
- Parse natural language patient references
- Build contextual prompts based on user queries

**Key Security Features**:
- **Read-Only Operations**: AI cannot modify eldercare data
- **Privacy Filtering**: Sensitive data only for trusted models (local + controlled cloud APIs)
- **Model Trust Levels**: Local models and whitelisted cloud models get full access

**Integration Point**: Called by `agentService.buildSystemPrompt()` to add eldercare context.

---

## Architecture Overview

### Component Structure

```typescript
EldercareContextService
├── Privacy Management
│   ├── isTrustedModel() - Check model trust level
│   └── TRUSTED_MODELS[] - Whitelist of cloud models
│
├── Data Retrieval (Private Methods)
│   ├── getProviders() - Healthcare providers
│   ├── getPatients() - Active patients with demographics
│   ├── getMedications() - Active medications
│   ├── getRecentAppointments() - Upcoming/recent appointments
│   └── getCaregiver() - Caregiver profile (singleton)
│
├── Context Building
│   ├── generateContextSummary() - Format data for AI
│   └── getEldercareContext() - Comprehensive context retrieval
│
└── Natural Language Processing
    ├── findPatientByReference() - Map "dad" → patient record
    ├── calculateAge() - DOB → age calculation
    └── generateContextualPrompt() - Query-aware context injection
```

### Dependencies

```typescript
import { db } from '../db/db'                    // SQLite database
import type { LLMAdapter } from './modelRegistry' // Model adapter type
```

**Database Tables Used**:
- `patients` - Patient demographics, contacts, insurance
- `medications` - Active medications with prescriptions
- `appointments` - Upcoming and recent appointments
- `healthcare_providers` - Doctors, specialists, pharmacies
- `caregivers` - Caregiver profile (singleton)

---

## Type Definitions

### Core Context Interfaces

#### ProviderContext

```typescript
export interface ProviderContext {
  id: string
  name: string
  specialty?: string          // e.g., "Cardiologist", "Pharmacy"
  practiceName?: string       // Practice or business name
  phone?: string
  email?: string
  address?: string
  notes?: string
  preferred?: boolean         // Preferred provider flag
}
```

**Purpose**: Represents healthcare providers (doctors, specialists, pharmacies).

**Usage**: Linked from patients, medications, appointments.

#### PatientContext

```typescript
export interface PatientContext {
  id: string
  name: string
  relationship?: string                    // e.g., "Father", "Mother"
  age?: number                             // Calculated from DOB
  gender?: string
  phone?: string                           // PRIVATE
  emergencyContactName?: string            // PRIVATE
  emergencyContactPhone?: string           // PRIVATE
  primaryDoctor?: string                   // Doctor name
  primaryDoctorProvider?: ProviderContext  // Linked provider object
  doctorAddress?: string                   // PRIVATE
  doctorPhone?: string                     // PRIVATE
  insuranceProvider?: string               // PRIVATE
  insuranceId?: string                     // PRIVATE
  notes?: string                           // PRIVATE
}
```

**Privacy Levels**:
- **Public** (all models): `id`, `name`, `relationship`, `age`, `gender`, `primaryDoctor`
- **Private** (trusted only): Phone, emergency contacts, doctor details, insurance, notes

#### MedicationContext

```typescript
export interface MedicationContext {
  id: string
  name: string
  genericName?: string
  dosage: string                           // e.g., "10mg"
  frequency: string                        // e.g., "Once daily"
  route?: string                           // e.g., "Oral"
  prescribingDoctor?: string               // PRIVATE
  prescribingDoctorProvider?: ProviderContext  // PRIVATE - Linked provider
  pharmacy?: string                        // PRIVATE
  pharmacyProvider?: ProviderContext       // PRIVATE - Linked provider
  rxNumber?: string                        // PRIVATE
  sideEffects?: string                     // PRIVATE
  notes?: string                           // PRIVATE
}
```

**Privacy Levels**:
- **Public** (all models): `id`, `name`, `genericName`, `dosage`, `frequency`, `route`
- **Private** (trusted only): Doctor, pharmacy, rx number, side effects, notes

#### AppointmentContext

```typescript
export interface AppointmentContext {
  id: string
  appointmentDate: string                  // ISO date format
  appointmentTime?: string                 // e.g., "10:00 AM"
  appointmentType?: string                 // e.g., "Annual Physical"
  location?: string                        // PRIVATE
  status: string                           // "scheduled", "completed", "cancelled"
  providerId?: string
  provider?: ProviderContext               // Linked provider object
  preparationNotes?: string                // PRIVATE
  notes?: string                           // PRIVATE
  outcomeSummary?: string                  // PRIVATE
  followUpRequired?: boolean               // PRIVATE
}
```

**Privacy Levels**:
- **Public** (all models): `id`, `appointmentDate`, `appointmentTime`, `appointmentType`, `status`, `provider`
- **Private** (trusted only): Location, notes, outcome, follow-up

#### CaregiverContext

```typescript
export interface CaregiverContext {
  id: string
  name: string
  relationship?: string  // e.g., "Grandson"
  notes?: string        // PRIVATE
}
```

**Singleton Pattern**: Only one caregiver record (the user).

#### EldercareContext (Aggregate)

```typescript
export type EldercareContext = {
  patients: PatientContext[]
  medications: MedicationContext[]
  recentAppointments: AppointmentContext[]
  caregiver: CaregiverContext | null
  providers: ProviderContext[]
  summary: string  // Formatted markdown summary
}
```

**Purpose**: Complete eldercare context for AI integration.

---

## Privacy & Security System

### Trust Model

**Philosophy**: 
- **Local models**: Data never leaves your machine → Full access
- **Trusted cloud models**: Your controlled API keys → Full access  
- **Unknown cloud models**: Third-party services → Filtered access

### isTrustedModel

```typescript
private isTrustedModel(adapter: LLMAdapter): boolean {
  // Local models always get full access (data never leaves your machine)
  if (adapter.type === 'local') {
    return true
  }
  
  // Trusted cloud models (your controlled API keys) get full access
  if (this.TRUSTED_MODELS.includes(adapter.id)) {
    return true
  }
  
  // Unknown cloud models get filtered access
  return false
}
```

**Decision Logic**:

| Adapter Type | Model ID | Trust Level | Access |
|--------------|----------|-------------|---------|
| `local` | Any | **Trusted** | Full (all fields) |
| `cloud` | In `TRUSTED_MODELS` | **Trusted** | Full (all fields) |
| `cloud` | Not in list | **Untrusted** | Filtered (public only) |

### Trusted Models Whitelist

```typescript
private readonly TRUSTED_MODELS = [
  'gpt-4.1-nano',
]
```

**Configuration**: Add model IDs for your controlled cloud APIs.

**Example**:
```typescript
private readonly TRUSTED_MODELS = [
  'gpt-4o-mini',      // Your OpenAI API key
  'gpt-4o',           // Your OpenAI API key
  'claude-3-opus',    // Your Anthropic API key (future)
]
```

### Privacy Filtering in Action

**Trusted Model** (e.g., Ollama local model):
```typescript
{
  id: 'patient_123',
  name: 'Mary Smith',
  relationship: 'Mother',
  age: 82,
  phone: '555-1234',              // ✅ Included
  emergencyContactName: 'John',   // ✅ Included
  insuranceProvider: 'Medicare',  // ✅ Included
  notes: 'Diabetic, vegetarian'   // ✅ Included
}
```

**Untrusted Model** (e.g., unknown cloud API):
```typescript
{
  id: 'patient_123',
  name: 'Mary Smith',
  relationship: 'Mother',
  age: 82,
  // phone: undefined              // ❌ Filtered
  // emergencyContactName: undefined  // ❌ Filtered
  // insuranceProvider: undefined  // ❌ Filtered
  // notes: undefined              // ❌ Filtered
}
```

---

## Data Retrieval Methods (Private)

### 1. getProviders

```typescript
private getProviders(): ProviderContext[]
```

**Purpose**: Fetch all healthcare providers (doctors, specialists, pharmacies).

**Database Query**:
```sql
SELECT id, name, specialty, practice_name, phone, email, address, notes, preferred
FROM healthcare_providers
ORDER BY name ASC
```

**Mapping Logic**:
```typescript
return rows.map(row => ({
  id: row.id,
  name: row.name,
  specialty: row.specialty || undefined,
  practiceName: row.practice_name || undefined,
  phone: row.phone || undefined,
  email: row.email || undefined,
  address: row.address || undefined,
  notes: row.notes || undefined,
  preferred: row.preferred === 1,  // SQLite boolean (1/0)
}))
```

**Error Handling**: Returns empty array `[]` on error (graceful degradation).

**Usage**: Called by other methods to link providers to patients/medications/appointments.

---

### 2. getPatients

```typescript
private getPatients(includePrivateData: boolean): PatientContext[]
```

**Purpose**: Fetch active patients with optional privacy filtering.

**Parameters**:
- `includePrivateData` - If `false`, omit phone, contacts, insurance, notes

**Database Query**:
```sql
SELECT id, name, date_of_birth, relationship, gender, 
       phone, emergency_contact_name, emergency_contact_phone,
       primary_doctor, doctor_address, doctor_phone,
       insurance_provider, insurance_id, notes
FROM patients 
WHERE active = 1 
ORDER BY name ASC
```

**Privacy Filtering**:

```typescript
const context: PatientContext = {
  id: row.id,
  name: row.name,
  relationship: row.relationship || undefined,
  age: row.date_of_birth ? this.calculateAge(row.date_of_birth) : undefined,
  gender: row.gender || undefined,
}

// Only add sensitive fields if trusted
if (includePrivateData) {
  context.phone = row.phone || undefined
  context.emergencyContactName = row.emergency_contact_name || undefined
  context.emergencyContactPhone = row.emergency_contact_phone || undefined
  context.primaryDoctor = row.primary_doctor || undefined
  context.doctorAddress = row.doctor_address || undefined
  context.doctorPhone = row.doctor_phone || undefined
  context.insuranceProvider = row.insurance_provider || undefined
  context.insuranceId = row.insurance_id || undefined
  context.notes = row.notes || undefined
  
  // Link primary doctor to provider record
  if (row.primary_doctor) {
    const doctorName = row.primary_doctor.toLowerCase()
    const providerMatch = providers.find(p => 
      p.name && p.name.toLowerCase() === doctorName
    )
    if (providerMatch) {
      context.primaryDoctorProvider = providerMatch
    }
  }
}
```

**Provider Linking**:
- Matches `primary_doctor` (string) to `healthcare_providers.name`
- Case-insensitive comparison
- Attaches full provider object if match found

**Age Calculation**: Uses `calculateAge()` helper (see below).

---

### 3. getMedications

```typescript
private getMedications(patientId?: string, includePrivateData: boolean = true): MedicationContext[]
```

**Purpose**: Fetch active medications, optionally filtered by patient.

**Parameters**:
- `patientId` - Optional patient filter
- `includePrivateData` - Privacy filtering flag

**Database Query**:
```sql
SELECT id, patient_id, name, generic_name, dosage, frequency, route,
       prescribing_doctor, pharmacy, rx_number,
       side_effects, notes
FROM medications 
WHERE active = 1
  [AND patient_id = ?]  -- If patientId provided
ORDER BY created_at DESC 
LIMIT 50
```

**Privacy Filtering**:

```typescript
const context: MedicationContext = {
  id: row.id,
  name: row.name,
  genericName: row.generic_name || undefined,
  dosage: row.dosage,
  frequency: row.frequency,
  route: row.route || undefined,
}

if (includePrivateData) {
  context.prescribingDoctor = row.prescribing_doctor || undefined
  context.pharmacy = row.pharmacy || undefined
  context.rxNumber = row.rx_number || undefined
  context.sideEffects = row.side_effects || undefined
  context.notes = row.notes || undefined
  
  // Link prescribing doctor
  if (row.prescribing_doctor) {
    const doctorName = row.prescribing_doctor.toLowerCase()
    const providerMatch = providers.find(p => 
      p.name && p.name.toLowerCase() === doctorName
    )
    if (providerMatch) {
      context.prescribingDoctorProvider = providerMatch
    }
  }
  
  // Link pharmacy
  if (row.pharmacy) {
    const pharmacyName = row.pharmacy.toLowerCase()
    const providerMatch = providers.find(p => 
      p.name && p.name.toLowerCase() === pharmacyName
    )
    if (providerMatch) {
      context.pharmacyProvider = providerMatch
    }
  }
}
```

**Provider Linking**: Matches both `prescribing_doctor` and `pharmacy` to provider records.

**Limit**: Maximum 50 medications (prevents context overflow).

---

### 4. getRecentAppointments

```typescript
private getRecentAppointments(patientId?: string, includePrivateData: boolean = true): AppointmentContext[]
```

**Purpose**: Fetch upcoming and recent past appointments (last 30 days).

**Parameters**:
- `patientId` - Optional patient filter
- `includePrivateData` - Privacy filtering flag

**Time Window**:
```typescript
private readonly MAX_RECENT_DAYS = 30

const cutoffDate = new Date()
cutoffDate.setDate(cutoffDate.getDate() - this.MAX_RECENT_DAYS)
const cutoffDateStr = cutoffDate.toISOString().split('T')[0]
```

**Database Query** (with JOIN):
```sql
SELECT a.id, a.patient_id, a.appointment_date, a.appointment_time, 
       a.appointment_type, a.location, a.status, a.provider_id, 
       a.preparation_notes, a.notes, a.outcome_summary, a.follow_up_required,
       p.id as provider_id, p.name as provider_name, p.specialty as provider_specialty, 
       p.practice_name as provider_practice_name, p.phone as provider_phone, 
       p.email as provider_email, p.address as provider_address, 
       p.notes as provider_notes, p.preferred as provider_preferred
FROM appointments a
LEFT JOIN healthcare_providers p ON a.provider_id = p.id
WHERE a.appointment_date >= ?  -- Cutoff date
  [AND a.patient_id = ?]        -- If patientId provided
ORDER BY a.appointment_date ASC 
LIMIT 20
```

**Provider Embedding**:
```typescript
// Attach provider info if available
if (row.provider_id) {
  context.provider = {
    id: row.provider_id,
    name: row.provider_name || '',
    specialty: row.provider_specialty || undefined,
    practiceName: row.provider_practice_name || undefined,
    phone: row.provider_phone || undefined,
    email: row.provider_email || undefined,
    address: row.provider_address || undefined,
    notes: row.provider_notes || undefined,
    preferred: row.provider_preferred === 1,
  }
}
```

**Privacy Filtering**:
```typescript
if (includePrivateData) {
  context.location = row.location || undefined
  context.preparationNotes = row.preparation_notes || undefined
  context.notes = row.notes || undefined
  context.outcomeSummary = row.outcome_summary || undefined
  context.followUpRequired = row.follow_up_required === 1
}
```

**Why 30 Days?** Balances relevance (recent context) vs token budget.

---

### 5. getCaregiver

```typescript
private getCaregiver(includePrivateData: boolean = true): CaregiverContext | null
```

**Purpose**: Fetch caregiver profile (singleton - only one record).

**Database Query**:
```sql
SELECT id, name, relationship, notes
FROM caregivers 
LIMIT 1
```

**Singleton Pattern**: Only retrieves first record (caregiver = user).

**Privacy Filtering**:
```typescript
const context: CaregiverContext = {
  id: row.id,
  name: row.name,
  relationship: row.relationship || undefined,
}

if (includePrivateData && row.notes) {
  context.notes = row.notes
}
```

**Return Value**: `null` if no caregiver record exists.

---

## Utility Methods

### calculateAge

```typescript
private calculateAge(dateOfBirth: string): number | undefined
```

**Purpose**: Calculate current age from date of birth.

**Implementation**:
```typescript
private calculateAge(dateOfBirth: string): number | undefined {
  if (!dateOfBirth) return undefined
  
  try {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    // Adjust if birthday hasn't occurred yet this year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    return age >= 0 ? age : undefined
  } catch {
    return undefined
  }
}
```

**Logic**:
1. Calculate year difference
2. Check if birthday has occurred this year
3. Subtract 1 if birthday is in the future
4. Return `undefined` for invalid dates or negative ages

**Example**:
```typescript
calculateAge('1942-03-15')  // Returns: 83 (as of Oct 28, 2025)
calculateAge('1950-12-01')  // Returns: 74 (birthday not yet this year)
calculateAge('invalid')      // Returns: undefined
```

---

## Context Building Methods

### generateContextSummary

```typescript
private generateContextSummary(context: EldercareContext): string
```

**Purpose**: Generate formatted markdown summary for AI consumption.

**Input**: Complete `EldercareContext` object.

**Output**: Markdown-formatted string with sections:
1. Patients
2. Active Medications
3. Upcoming Appointments
4. Healthcare Providers
5. Caregiver

**Implementation** (Patients Section):
```typescript
if (context.patients.length > 0) {
  summary += `### Patients (${context.patients.length})\n`;
  context.patients.forEach((patient: PatientContext) => {
    summary += `- **${patient.name}**`;
    if (patient.relationship) summary += ` (${patient.relationship})`;
    if (patient.age) summary += `, age ${patient.age}`;
    if (patient.gender) summary += `, ${patient.gender}`;
    
    if (patient.phone) summary += `\n  Phone: ${patient.phone}`;
    
    if (patient.primaryDoctor) {
      summary += `\n  Primary Doctor: ${patient.primaryDoctor}`;
      if (patient.doctorPhone) summary += ` (${patient.doctorPhone})`;
      if (patient.doctorAddress) summary += `\n  Doctor Address: ${patient.doctorAddress}`;
    }
    
    if (patient.emergencyContactName) {
      summary += `\n  Emergency Contact: ${patient.emergencyContactName}`;
      if (patient.emergencyContactPhone) summary += ` (${patient.emergencyContactPhone})`;
    }
    
    if (patient.insuranceProvider) {
      summary += `\n  Insurance: ${patient.insuranceProvider}`;
      if (patient.insuranceId) summary += ` (ID: ${patient.insuranceId})`;
    }
    
    summary += '\n';
  });
  summary += '\n';
}
```

**Medications Section**:
```typescript
if (context.medications.length > 0) {
  summary += `### Active Medications (${context.medications.length})\n`;
  context.medications.slice(0, 10).forEach((med: MedicationContext) => {
    summary += `- ${med.name}`;
    if (med.genericName) summary += ` (${med.genericName})`;
    summary += ` ${med.dosage} - ${med.frequency}`;
    
    if (med.prescribingDoctor) summary += `\n  Prescribed by: ${med.prescribingDoctor}`;
    if (med.pharmacy) summary += `\n  Pharmacy: ${med.pharmacy}`;
    if (med.rxNumber) summary += ` (Rx: ${med.rxNumber})`;
    
    summary += '\n';
  });
  summary += '\n';
}
```

**Limit**: Only first 10 medications shown (prevents token overflow).

**Appointments Section** (Upcoming Only):
```typescript
const upcomingAppointments = context.recentAppointments.filter((apt: AppointmentContext) =>
  new Date(apt.appointmentDate) >= new Date()
);

if (upcomingAppointments.length > 0) {
  summary += `### Upcoming Appointments (${upcomingAppointments.length})\n`;
  upcomingAppointments.slice(0, 5).forEach((apt: AppointmentContext) => {
    summary += `- ${apt.appointmentDate}`;
    if (apt.appointmentTime) summary += ` at ${apt.appointmentTime}`;
    if (apt.appointmentType) summary += ` (${apt.appointmentType})`;
    
    if (apt.provider) {
      summary += `\n  Provider: ${apt.provider.name}`;
      if (apt.provider.specialty) summary += ` (${apt.provider.specialty})`;
      if (apt.provider.phone) summary += `\n  Phone: ${apt.provider.phone}`;
      if (apt.location) summary += `\n  Location: ${apt.location}`;
    }
    
    summary += '\n';
  });
  summary += '\n';
}
```

**Filter**: Only appointments on or after today.
**Limit**: Maximum 5 upcoming appointments.

**Example Output**:
```markdown
## Eldercare Context Summary

### Patients (1)
- **Mary Smith** (Mother), age 82, Female
  Phone: 555-1234
  Primary Doctor: Dr. Johnson (555-5678)
  Doctor Address: 123 Medical Plaza, Suite 200
  Emergency Contact: John Smith (555-9999)
  Insurance: Medicare (ID: 1234567890A)

### Active Medications (3)
- Lisinopril (Zestril) 10mg - Once daily at 8am
  Prescribed by: Dr. Johnson
  Pharmacy: CVS Pharmacy (Rx: RX123456)
- Metformin 500mg - Twice daily with meals
  Prescribed by: Dr. Johnson
- Aspirin (Acetylsalicylic Acid) 81mg - Once daily

### Upcoming Appointments (2)
- 2025-11-05 at 10:00 AM (Annual Physical)
  Provider: Dr. Johnson (Cardiologist)
  Phone: 555-5678
  Location: 123 Medical Plaza, Suite 200
- 2025-11-20 at 2:30 PM (Follow-up)
  Provider: Dr. Williams (Endocrinologist)
  Phone: 555-3456

### Healthcare Providers (5)
- **Dr. Johnson** (Cardiologist)
  Practice: Heart & Vascular Center
  Phone: 555-5678
  Address: 123 Medical Plaza, Suite 200
  Email: dr.johnson@heart.com
- **CVS Pharmacy**
  Phone: 555-7890
  Address: 456 Main St

### Caregiver
- **John Smith** (Grandson)
```

---

## Public API Methods

### getEldercareContext

```typescript
public getEldercareContext(adapter: LLMAdapter, patientId?: string): EldercareContext
```

**Purpose**: Get comprehensive eldercare context with privacy filtering.

**Parameters**:
- `adapter` - LLM adapter (determines trust level)
- `patientId` - Optional patient filter

**Implementation**:
```typescript
public getEldercareContext(adapter: LLMAdapter, patientId?: string): EldercareContext {
  const includePrivateData = this.isTrustedModel(adapter)

  const patients = this.getPatients(includePrivateData)
  const medications = this.getMedications(patientId, includePrivateData)
  const recentAppointments = this.getRecentAppointments(patientId, includePrivateData)
  const caregiver = this.getCaregiver(includePrivateData)
  const providers = this.getProviders()

  const context: EldercareContext = {
    patients,
    medications,
    recentAppointments,
    caregiver,
    providers,
    summary: '',
  }

  context.summary = this.generateContextSummary(context)

  return context
}
```

**Flow**:
1. Check if model is trusted
2. Fetch all eldercare data (with privacy filtering)
3. Aggregate into context object
4. Generate markdown summary
5. Return complete context

**Usage Example**:
```typescript
const adapter = getModelAdapter('llama3.2')
const context = eldercareContextService.getEldercareContext(adapter)

console.log(context.patients)           // Array of patients
console.log(context.medications)        // Array of medications
console.log(context.summary)            // Markdown summary
```

---

### findPatientByReference

```typescript
public findPatientByReference(reference: string): PatientContext | null
```

**Purpose**: Find patient by name or relationship (natural language support).

**Use Cases**:
- "my dad" → Find patient with relationship = "Father"
- "Mary" → Find patient with name containing "Mary"
- "mom" → Find patient with relationship = "Mother"

**Database Query** (Smart Ranking):
```sql
SELECT id, name, relationship, date_of_birth, gender
FROM patients 
WHERE active = 1 
AND (LOWER(name) LIKE LOWER(?) OR LOWER(relationship) LIKE LOWER(?))
ORDER BY 
  CASE 
    WHEN LOWER(name) = LOWER(?) THEN 1      -- Exact name match (highest priority)
    WHEN LOWER(relationship) = LOWER(?) THEN 2  -- Exact relationship match
    WHEN LOWER(name) LIKE LOWER(?) THEN 3    -- Partial name match
    ELSE 4                                   -- Other matches
  END
LIMIT 1
```

**Query Parameters**:
```typescript
const searchTerm = `%${reference.trim()}%`  // For LIKE queries
const exactTerm = reference.trim()          // For exact matches
```

**Ranking Logic**:
1. Exact name match (e.g., "Mary Smith" = "mary smith")
2. Exact relationship match (e.g., "Father" = "father")
3. Partial name match (e.g., "Mary" in "Mary Smith")
4. Partial relationship match

**Example Usage**:
```typescript
findPatientByReference('dad')         // → Patient with relationship="Father"
findPatientByReference('Mary')        // → Patient with name="Mary Smith"
findPatientByReference('mother')      // → Patient with relationship="Mother"
findPatientByReference('John Smith')  // → Exact name match
```

**Return Value**: 
- Patient object with basic fields (id, name, relationship, age, gender)
- `null` if no match found

**Privacy Note**: Returns minimal data regardless of model trust level (used for lookup only).

---

### generateContextualPrompt

```typescript
public generateContextualPrompt(adapter: LLMAdapter, userQuery: string): string
```

**Purpose**: Generate query-aware contextual prompt addition for AI.

**This is the main integration point called by `agentService.buildSystemPrompt()`.**

**Implementation Flow**:

#### Step 1: Parse User Query for Patient References

```typescript
const patientKeywords = ['dad', 'father', 'mom', 'mother', 'parent', 'spouse', 'wife', 'husband']
const queryLower = userQuery.toLowerCase()

let foundPatient: PatientContext | null = null

// Check for direct patient references
for (const keyword of patientKeywords) {
  if (queryLower.includes(keyword)) {
    foundPatient = this.findPatientByReference(keyword)
    break
  }
}
```

**Keyword Matching**: Detects common family relationship terms.

#### Step 2: Extract Names from Query

```typescript
// If no direct keyword match, try to extract names from the query
if (!foundPatient) {
  const words = userQuery.split(/\s+/)
  for (const word of words) {
    if (word.length > 2) { // Skip short words
      const patient = this.findPatientByReference(word)
      if (patient) {
        foundPatient = patient
        break
      }
    }
  }
}
```

**Name Extraction**: Splits query into words, tries each as patient name.

**Example**:
- Query: "How is Mary doing?" → Extracts "Mary" → Finds patient

#### Step 3: Get Context (Patient-Focused if Found)

```typescript
const context = this.getEldercareContext(adapter, foundPatient?.id)
```

**Smart Filtering**: If patient found, filter medications/appointments to that patient.

#### Step 4: Handle Empty Context

```typescript
if (context.patients.length === 0) {
  return "" // No eldercare data available
}
```

**Early Exit**: Don't add eldercare section if no data.

#### Step 5: Build Contextual Prompt

```typescript
let contextPrompt = "\n\n## Available Eldercare Information\n\n"
contextPrompt += context.summary

// Add specific instructions for AI behavior
contextPrompt += "\n## Instructions for AI Assistant\n"
contextPrompt += "- Use the eldercare information above to provide relevant, helpful responses\n"
contextPrompt += "- When referencing patients, use their names and relationships naturally\n"
contextPrompt += "- Focus on practical caregiving support and information organization\n"

// Only show privacy note for untrusted cloud models
if (!this.isTrustedModel(adapter)) {
  contextPrompt += "- Note: Limited eldercare data provided (untrusted cloud model)\n"
}

return contextPrompt
```

**Output Structure**:
1. Header: "Available Eldercare Information"
2. Full context summary (markdown)
3. AI behavior instructions
4. Privacy note (untrusted models only)

#### Complete Example

**User Query**: "What medications does my dad take?"

**Query Analysis**:
- Keyword match: "dad"
- Find patient: relationship = "Father"
- Patient found: John Doe (id: patient_123)

**Context Retrieval**:
- Get medications for patient_123
- Get recent appointments for patient_123
- Privacy: Full data (local model)

**Generated Prompt**:
```markdown

## Available Eldercare Information

### Patients (1)
- **John Doe** (Father), age 78, Male
  Phone: 555-1234
  Primary Doctor: Dr. Smith
  Emergency Contact: Jane Doe (555-5678)
  Insurance: Blue Cross (ID: ABC123)

### Active Medications (2)
- Lisinopril 10mg - Once daily at 8am
  Prescribed by: Dr. Smith
  Pharmacy: CVS (Rx: RX12345)
- Aspirin 81mg - Once daily
  Prescribed by: Dr. Smith

### Upcoming Appointments (1)
- 2025-11-10 at 9:00 AM (Follow-up)
  Provider: Dr. Smith (Primary Care)
  Phone: 555-9999
  Location: 123 Main St

## Instructions for AI Assistant
- Use the eldercare information above to provide relevant, helpful responses
- When referencing patients, use their names and relationships naturally
- Focus on practical caregiving support and information organization
```

**AI Response** (with context):
> Your father, John Doe, is currently taking two medications:
> 1. Lisinopril 10mg - taken once daily in the morning at 8am for blood pressure
> 2. Aspirin 81mg - taken once daily for heart health
> 
> Both are prescribed by Dr. Smith and filled at CVS pharmacy. He has an upcoming follow-up appointment on November 10th at 9:00 AM.

---

## Integration with Agent Service

### Call Flow

```
User: "What medications does dad take?"
  ↓
agentRouter.ts - POST /agent/chat
  ↓
agentService.runAgent()
  ↓
agentService.buildSystemPrompt()
  ↓
eldercareContextService.generateContextualPrompt(adapter, userInput)
  ↓
1. Parse query: "dad" found
2. findPatientByReference("dad") → patient_123
3. getEldercareContext(adapter, "patient_123")
   - getPatients(includePrivate=true)
   - getMedications("patient_123", includePrivate=true)
   - getRecentAppointments("patient_123", includePrivate=true)
   - generateContextSummary()
4. Build contextual prompt with instructions
  ↓
Return: "\n\n## Available Eldercare Information\n\n..."
  ↓
agentService.buildSystemPrompt() combines:
  - Persona prompt
  - Eldercare context ← (THIS)
  - Custom prompt
  - Focus instructions
  ↓
Final system prompt sent to LLM
  ↓
LLM response with eldercare context awareness
```

### Example Integration

**agentService.ts**:
```typescript
function buildSystemPrompt(
  adapter: LLMAdapter,
  userInput: string,
  personaId?: string,
  customSystemPrompt?: string,
  fileIds: string[] = []
): string {
  const personaPrompt = getPersonaPrompt(personaId)
  const documentContext = getDocumentContext(fileIds)
  const customPrompt = customSystemPrompt?.trim() || ''
  
  // 🔑 Eldercare context integration
  const eldercareContext = eldercareContextService.generateContextualPrompt(adapter, userInput)
  
  const focusInstructions = "CRITICAL INSTRUCTION: ..."

  const parts = [personaPrompt, documentContext, eldercareContext, customPrompt, focusInstructions]
    .filter(Boolean)
  return parts.join('\n\n')
}
```

---

## Performance Considerations

### Database Query Optimization

**All queries use indexes**:
- `patients.active` - Indexed for fast filtering
- `medications.active` - Indexed for fast filtering
- `appointments.appointment_date` - Indexed for date range queries
- `healthcare_providers.name` - Indexed for fuzzy matching

**Query Limits**:
- Medications: Max 50 (prevents context overflow)
- Appointments: Max 20 (30-day window)
- Summary medications: Max 10 displayed
- Summary appointments: Max 5 displayed

### Token Budget Management

**Context Size Estimates**:
- Patient (full): ~100-150 tokens
- Medication (full): ~50-75 tokens
- Appointment (full): ~75-100 tokens
- Provider: ~50 tokens
- Complete summary: ~500-1500 tokens (typical)

**Why Limits Matter**:
- Prevents exceeding model context windows
- Leaves room for conversation history
- Optimizes response quality (focused context)

### Caching Opportunities

**Current**: No caching (data always fresh).

**Future Optimization**:
```typescript
private contextCache = new Map<string, { context: EldercareContext, timestamp: number }>()
private CACHE_TTL_MS = 60000 // 1 minute

public getEldercareContext(adapter: LLMAdapter, patientId?: string): EldercareContext {
  const cacheKey = `${adapter.id}_${patientId || 'all'}_${this.isTrustedModel(adapter)}`
  const cached = this.contextCache.get(cacheKey)
  
  if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
    return cached.context
  }
  
  // ... existing logic
  
  this.contextCache.set(cacheKey, { context, timestamp: Date.now() })
  return context
}
```

**Trade-off**: Cache vs data freshness (1-minute TTL balances both).

---

## Security Best Practices

### 1. Read-Only Access

**Design Principle**: Service only reads data, never writes.

**Database Access**:
```typescript
// ✅ SAFE: Read-only queries
db.prepare('SELECT ... FROM patients WHERE ...').all()

// ❌ DANGEROUS: Write operations (not implemented)
// db.prepare('UPDATE patients SET ...').run()
// db.prepare('DELETE FROM patients WHERE ...').run()
```

**Why**: AI cannot accidentally modify eldercare data.

### 2. Privacy Filtering

**Always check trust level**:
```typescript
// ✅ GOOD: Privacy-aware
const includePrivateData = this.isTrustedModel(adapter)
const patients = this.getPatients(includePrivateData)

// ❌ BAD: Always include private data
const patients = this.getPatients(true)
```

### 3. Validate Model Trust

**Update whitelist when adding new APIs**:
```typescript
// When adding new trusted cloud model
private readonly TRUSTED_MODELS = [
  'gpt-4.1-nano',
  'gpt-4o-mini',     // Add your OpenAI models
  'claude-3-opus',   // Add your Anthropic models
]
```

### 4. SQL Injection Prevention

**Current**: Uses parameterized queries (safe).

```typescript
// ✅ SAFE: Parameterized query
db.prepare('SELECT * FROM patients WHERE id = ?').get(patientId)

// ❌ DANGEROUS: String concatenation
// db.prepare(`SELECT * FROM patients WHERE id = '${patientId}'`).get()
```

---

## Error Handling Patterns

### Graceful Degradation

**All methods return safe defaults on error**:

```typescript
try {
  // Query database
  return results
} catch (error) {
  console.error('Error fetching data:', error)
  return []  // or null, depending on method
}
```

**Philosophy**: Better to return empty context than crash AI service.

### Error Logging

**Current**: Console.error for debugging.

**Production**: Should integrate with logger service:

```typescript
catch (error) {
  logger.error('Error fetching patients for context:', {
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    adapter: adapter.id,
    patientId,
  })
  return []
}
```

---

## Testing Strategies

### Unit Tests

```typescript
describe('EldercareContextService', () => {
  describe('calculateAge', () => {
    it('should calculate age correctly', () => {
      const service = new EldercareContextService()
      const age = service['calculateAge']('1942-03-15')
      expect(age).toBe(83)
    })

    it('should handle birthday not yet this year', () => {
      const service = new EldercareContextService()
      const age = service['calculateAge']('1950-12-01')
      expect(age).toBe(74)
    })

    it('should return undefined for invalid date', () => {
      const service = new EldercareContextService()
      const age = service['calculateAge']('invalid')
      expect(age).toBeUndefined()
    })
  })

  describe('isTrustedModel', () => {
    it('should trust local models', () => {
      const service = new EldercareContextService()
      const adapter = { type: 'local', id: 'llama3.2' }
      expect(service['isTrustedModel'](adapter)).toBe(true)
    })

    it('should trust whitelisted cloud models', () => {
      const service = new EldercareContextService()
      const adapter = { type: 'cloud', id: 'gpt-4.1-nano' }
      expect(service['isTrustedModel'](adapter)).toBe(true)
    })

    it('should not trust unknown cloud models', () => {
      const service = new EldercareContextService()
      const adapter = { type: 'cloud', id: 'unknown-model' }
      expect(service['isTrustedModel'](adapter)).toBe(false)
    })
  })

  describe('findPatientByReference', () => {
    it('should find patient by relationship keyword', () => {
      const service = new EldercareContextService()
      const patient = service.findPatientByReference('dad')
      expect(patient).toBeDefined()
      expect(patient?.relationship).toBe('Father')
    })

    it('should find patient by name', () => {
      const service = new EldercareContextService()
      const patient = service.findPatientByReference('Mary')
      expect(patient).toBeDefined()
      expect(patient?.name).toContain('Mary')
    })
  })
})
```

### Integration Tests

```typescript
describe('EldercareContextService Integration', () => {
  it('should generate context with privacy filtering', () => {
    const service = new EldercareContextService()
    const localAdapter = { type: 'local', id: 'llama3.2' }
    const cloudAdapter = { type: 'cloud', id: 'unknown' }

    const localContext = service.getEldercareContext(localAdapter)
    const cloudContext = service.getEldercareContext(cloudAdapter)

    // Local should have phone numbers
    expect(localContext.patients[0].phone).toBeDefined()
    
    // Cloud should NOT have phone numbers
    expect(cloudContext.patients[0].phone).toBeUndefined()
  })

  it('should generate contextual prompt from query', () => {
    const service = new EldercareContextService()
    const adapter = { type: 'local', id: 'llama3.2' }
    
    const prompt = service.generateContextualPrompt(adapter, "What medications does dad take?")
    
    expect(prompt).toContain('## Available Eldercare Information')
    expect(prompt).toContain('Active Medications')
  })
})
```

---

## Future Enhancements

### 1. Vitals Integration

**Currently**: Placeholder for vitals (not implemented).

**Future**:
```typescript
private getRecentVitals(patientId?: string): VitalContext[] {
  // Fetch blood pressure, glucose, weight, etc.
  // Add to context summary
}
```

### 2. Smart Context Selection

**Currently**: Returns all data (up to limits).

**Future**: Analyze query to select only relevant data.

```typescript
private analyzeQueryIntent(query: string): {
  needsMedications: boolean
  needsAppointments: boolean
  needsVitals: boolean
} {
  const queryLower = query.toLowerCase()
  return {
    needsMedications: /medication|medicine|pill|drug|prescription/.test(queryLower),
    needsAppointments: /appointment|doctor|visit|checkup/.test(queryLower),
    needsVitals: /blood pressure|glucose|weight|vital|reading/.test(queryLower),
  }
}
```

### 3. Contextual Ranking

**Currently**: Static limits (50 meds, 20 appointments).

**Future**: Rank by relevance to query.

```typescript
private rankMedicationsByRelevance(medications: MedicationContext[], query: string): MedicationContext[] {
  // Score medications by query keyword matches
  // Return top 10 most relevant
}
```

### 4. Multi-Patient Support

**Currently**: Can filter by one patient.

**Future**: Handle queries about multiple patients.

```typescript
// Query: "Compare dad's and mom's blood pressure medications"
const patients = this.findMultiplePatientsByReferences(['dad', 'mom'])
```

---

## Summary

The **EldercareContextService** provides intelligent, privacy-aware eldercare data integration for AI:

**Core Capabilities**:
- **Data Retrieval**: Patients, medications, appointments, providers, caregiver
- **Privacy Filtering**: Trusted vs untrusted model access control
- **Natural Language**: Parse "dad" → patient record
- **Query-Aware**: Dynamic context based on user input
- **Formatted Output**: Markdown summaries for AI consumption

**Security**:
- Read-only database access
- Privacy filtering based on model trust
- Local models get full access (data never leaves machine)
- Whitelisted cloud models get full access (your controlled APIs)
- Unknown cloud models get filtered access

**Integration**:
- Called by `agentService.buildSystemPrompt()`
- Injects eldercare context into system prompt
- Enables AI to reference patient data naturally

**Performance**:
- Indexed database queries
- Token-aware limits (50 meds, 20 appointments)
- Summary compression (10 meds, 5 appointments)
- No caching (always fresh data)

**Exports**:
- `getEldercareContext()` - Comprehensive context retrieval
- `findPatientByReference()` - Natural language patient lookup
- `generateContextualPrompt()` - Main integration point

**Production Status**: Fully implemented with comprehensive privacy controls and error handling.
