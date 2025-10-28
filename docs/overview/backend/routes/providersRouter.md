# Healthcare Providers Router Documentation

## Overview

The `providersRouter.ts` file implements the healthcare provider management system for the eldercare application. It manages contact information and details for doctors, specialists, clinics, and other healthcare professionals involved in patient care.

**Location**: `/backend/routes/providersRouter.ts`

**Mounted At**: `/api/providers`

**Created**: Part of eldercare schema migration

**Purpose**:
- Store healthcare provider contact information
- Track provider specialties and practice details
- Manage preferred provider flags
- Support appointment scheduling and care coordination
- Maintain provider directory for patient care team

**Key Features**:
- **Complete CRUD**: List, get, create, update, delete providers
- **Preferred Providers**: Flag frequently-used providers
- **Smart Ordering**: Preferred providers appear first in lists
- **Contact Management**: Phone, email, address tracking
- **Specialty Tracking**: Medical specialty/focus area
- **Practice Details**: Practice/clinic name and notes

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

### Healthcare Providers Table

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
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

**Field Explanations**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | TEXT | Yes | Unique provider identifier (auto-generated) |
| `name` | TEXT | Yes | Provider's full name (max 200 chars) |
| `specialty` | TEXT | No | Medical specialty (e.g., "Cardiologist", "General Practitioner") |
| `practice_name` | TEXT | No | Name of practice/clinic/hospital |
| `phone` | TEXT | No | Contact phone number |
| `email` | TEXT | No | Email address (validated format) |
| `address` | TEXT | No | Physical address of practice |
| `notes` | TEXT | No | Additional information or special instructions |
| `preferred` | INTEGER | Yes | Preferred provider flag (0 or 1, default 0) |
| `created_at` | TEXT | Yes | Creation timestamp |
| `updated_at` | TEXT | Yes | Last update timestamp |

**Purpose**: Store healthcare provider directory for patient care team

**Constraints**:
- `id`: Primary key (unique, auto-generated)
- `preferred`: 0 = standard, 1 = preferred provider

**Related Tables**:
- `appointments` (provider_id foreign key)
- Potentially `patients` (primary_doctor field references provider name)

---

## Type Definitions

### Provider Type (Inferred)

```typescript
interface HealthcareProvider {
  id: string
  name: string
  specialty?: string | null
  practice_name?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  notes?: string | null
  preferred: number  // 0 or 1
  created_at: string
  updated_at: string
}
```

**Notes**:
- All contact fields optional (nullable)
- `preferred` is numeric (SQLite doesn't have boolean)
- Timestamps are ISO 8601 strings

---

## Validation Schemas

### Create Provider Schema

```typescript
const createProviderSchema = z.object({
  name: z.string().min(1).max(200),
  specialty: z.string().optional(),
  practice_name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  preferred: z.number().min(0).max(1).optional(),
})
```

**Validation Rules**:
- `name`: Required, 1-200 characters
- `specialty`: Optional string
- `practice_name`: Optional string
- `phone`: Optional string (no format validation)
- `email`: Optional, must be valid email format if provided
- `address`: Optional string
- `notes`: Optional string
- `preferred`: Optional, must be 0 or 1

**Defaults**:
- `preferred`: 0 (not preferred)
- Other optional fields: null if not provided

### Update Provider Schema

```typescript
const updateProviderSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  specialty: z.string().optional(),
  practice_name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  preferred: z.number().min(0).max(1).optional(),
})
```

**Validation Rules**:
- All fields optional (including `name`)
- Same validation as create schema
- Dynamic update (only provided fields changed)

---

## Endpoints

### GET /api/providers

**Purpose**: List all healthcare providers, ordered by preference and name.

#### Path Parameters

None.

#### Query Parameters

None.

#### Implementation

```typescript
router.get('/', async (req, res) => {
  try {
    const providers = db.prepare(`
      SELECT * FROM healthcare_providers 
      ORDER BY preferred DESC, name ASC
    `).all()

    okList(res, providers)
  } catch (error) {
    handleRouterError(res, error, 'Failed to retrieve healthcare providers')
  }
})
```

**Query Details**:
- No filters (returns all providers)
- Ordering: 
  1. `preferred DESC` - Preferred providers first (1 before 0)
  2. `name ASC` - Alphabetically by name

#### Response Format (Success)

```typescript
{
  data: [
    {
      id: "prov_123abc",
      name: "Dr. Sarah Johnson",
      specialty: "Cardiologist",
      practice_name: "Heart & Vascular Clinic",
      phone: "(555) 123-4567",
      email: "sjohnson@heartclinic.com",
      address: "123 Medical Plaza, Suite 200, Springfield, MA 01101",
      notes: "Accepts Medicare. Parking available on-site.",
      preferred: 1,
      created_at: "2024-01-15T10:00:00.000Z",
      updated_at: "2024-01-15T10:00:00.000Z"
    },
    {
      id: "prov_456def",
      name: "Dr. Michael Chen",
      specialty: "General Practitioner",
      practice_name: "Springfield Family Medicine",
      phone: "(555) 987-6543",
      email: "mchen@sfm.com",
      address: "456 Oak Street, Springfield, MA 01102",
      notes: null,
      preferred: 1,
      created_at: "2024-01-10T14:30:00.000Z",
      updated_at: "2024-01-10T14:30:00.000Z"
    },
    {
      id: "prov_789ghi",
      name: "Dr. Emily Rodriguez",
      specialty: "Neurologist",
      practice_name: "Neurology Associates",
      phone: "(555) 555-1212",
      email: null,
      address: "789 Brain Boulevard, Springfield, MA 01103",
      notes: "Referral required",
      preferred: 0,
      created_at: "2024-02-01T09:00:00.000Z",
      updated_at: "2024-02-01T09:00:00.000Z"
    }
    // ... more providers
  ]
}
```

**Ordering**: Preferred providers (Dr. Johnson, Dr. Chen) appear first, followed by others alphabetically.

#### Example Request

```typescript
const response = await fetch('/api/providers')
const data = await response.json()

console.log(`Total providers: ${data.data.length}`)

// Group by preference
const preferred = data.data.filter(p => p.preferred === 1)
const other = data.data.filter(p => p.preferred === 0)

console.log(`⭐ Preferred: ${preferred.length}`)
console.log(`📋 Other: ${other.length}`)

preferred.forEach(p => {
  console.log(`  - ${p.name} (${p.specialty || 'General'})`)
})
```

**Use Case**: Populate provider selector, display care team directory

---

### GET /api/providers/:id

**Purpose**: Get detailed information about a specific healthcare provider.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Provider ID |

#### Implementation

```typescript
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const provider = db.prepare(`
      SELECT * FROM healthcare_providers 
      WHERE id = ?
    `).get(id)

    if (!provider) {
      return err(res, 404, 'NOT_FOUND', 'Healthcare provider not found')
    }

    okItem(res, provider)
  } catch (error) {
    handleRouterError(res, error, 'Failed to retrieve healthcare provider')
  }
})
```

#### Response Format (Success)

```typescript
{
  data: {
    id: "prov_123abc",
    name: "Dr. Sarah Johnson",
    specialty: "Cardiologist",
    practice_name: "Heart & Vascular Clinic",
    phone: "(555) 123-4567",
    email: "sjohnson@heartclinic.com",
    address: "123 Medical Plaza, Suite 200, Springfield, MA 01101",
    notes: "Accepts Medicare. Parking available on-site.",
    preferred: 1,
    created_at: "2024-01-15T10:00:00.000Z",
    updated_at: "2024-01-15T10:00:00.000Z"
  }
}
```

#### Response Format (Not Found)

```typescript
{
  success: false,
  error: {
    code: "NOT_FOUND",
    message: "Healthcare provider not found"
  }
}
```

**HTTP Status**: 404

#### Example Request

```typescript
const response = await fetch('/api/providers/prov_123abc')
const data = await response.json()

if (data.data) {
  const provider = data.data
  console.log(`Provider: ${provider.name}`)
  console.log(`Specialty: ${provider.specialty}`)
  console.log(`Practice: ${provider.practice_name}`)
  console.log(`Phone: ${provider.phone}`)
  console.log(`Preferred: ${provider.preferred ? '⭐ Yes' : 'No'}`)
}
```

---

### POST /api/providers

**Purpose**: Create a new healthcare provider record.

#### Request Body

```typescript
{
  name: string;                  // Required (1-200 chars)
  specialty?: string;            // Optional
  practice_name?: string;        // Optional
  phone?: string;                // Optional
  email?: string;                // Optional (validated email format)
  address?: string;              // Optional
  notes?: string;                // Optional
  preferred?: number;            // Optional (0 or 1)
}
```

#### Implementation

```typescript
router.post('/', async (req, res) => {
  try {
    const validatedData = createProviderSchema.parse(req.body)
    
    const providerId = generateId()
    const now = new Date().toISOString()
    
    const insertProvider = db.prepare(`
      INSERT INTO healthcare_providers (
        id, name, specialty, practice_name, phone, email, 
        address, notes, preferred, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    insertProvider.run(
      providerId,
      validatedData.name,
      validatedData.specialty || null,
      validatedData.practice_name || null,
      validatedData.phone || null,
      validatedData.email || null,
      validatedData.address || null,
      validatedData.notes || null,
      validatedData.preferred || 0,
      now,
      now
    )

    const createdProvider = db.prepare(`
      SELECT * FROM healthcare_providers WHERE id = ?
    `).get(providerId)

    okItem(res, createdProvider, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return err(res, 400, 'VALIDATION_ERROR', 'Invalid provider data', { issues: error.errors })
    }
    handleRouterError(res, error, 'Failed to create healthcare provider')
  }
})
```

**Auto-Generated Fields**:
- `id`: Generated via `generateId()` helper
- `created_at`: Current timestamp
- `updated_at`: Current timestamp
- `preferred`: Defaults to 0 if not provided

#### Response Format (Success)

```typescript
{
  data: {
    id: "prov_newid123",
    name: "Dr. Robert Martinez",
    specialty: "Orthopedic Surgeon",
    practice_name: "Springfield Orthopedics",
    phone: "(555) 444-3333",
    email: "rmartinez@springfieldortho.com",
    address: "321 Joint Avenue, Springfield, MA 01104",
    notes: "Specializes in hip and knee replacements",
    preferred: 0,
    created_at: "2024-10-28T15:30:00.000Z",
    updated_at: "2024-10-28T15:30:00.000Z"
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
    message: "Invalid provider data",
    details: {
      issues: [
        {
          path: ["email"],
          message: "Invalid email"
        }
      ]
    }
  }
}
```

**HTTP Status**: 400

#### Example Requests

```typescript
// Minimal provider (required fields only)
const minimal = await fetch('/api/providers', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Dr. Simple'
  })
})

// Complete provider with all fields
const complete = await fetch('/api/providers', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Dr. Sarah Johnson',
    specialty: 'Cardiologist',
    practice_name: 'Heart & Vascular Clinic',
    phone: '(555) 123-4567',
    email: 'sjohnson@heartclinic.com',
    address: '123 Medical Plaza, Suite 200, Springfield, MA 01101',
    notes: 'Accepts Medicare. Parking available on-site.',
    preferred: 1
  })
})

const data = await complete.json()
console.log('Created provider:', data.data.id)
```

---

### PUT /api/providers/:id

**Purpose**: Update an existing healthcare provider's information.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Provider ID to update |

#### Request Body

All fields optional. Only provided fields will be updated.

```typescript
{
  name?: string;                 // 1-200 chars
  specialty?: string;
  practice_name?: string;
  phone?: string;
  email?: string;                // Validated email format
  address?: string;
  notes?: string;
  preferred?: number;            // 0 or 1
}
```

#### Implementation

```typescript
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const validatedData = updateProviderSchema.parse(req.body)
    
    const existingProvider = db.prepare(`
      SELECT * FROM healthcare_providers WHERE id = ?
    `).get(id)

    if (!existingProvider) {
      return err(res, 404, 'NOT_FOUND', 'Healthcare provider not found')
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
      UPDATE healthcare_providers 
      SET ${updateFields.join(', ')} 
      WHERE id = ?
    `

    db.prepare(updateQuery).run(...updateValues)

    const updatedProvider = db.prepare(`
      SELECT * FROM healthcare_providers WHERE id = ?
    `).get(id)

    okItem(res, updatedProvider)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return err(res, 400, 'VALIDATION_ERROR', 'Invalid provider data', { issues: error.errors })
    }
    handleRouterError(res, error, 'Failed to update healthcare provider')
  }
})
```

**Dynamic Update Logic**:
1. Parse request body with schema
2. Check provider exists
3. Build SQL with only provided fields
4. Auto-update `updated_at` timestamp
5. Return updated provider

#### Response Format (Success)

```typescript
{
  data: {
    id: "prov_123abc",
    name: "Dr. Sarah Johnson",
    specialty: "Cardiologist",
    practice_name: "Heart & Vascular Clinic",
    phone: "(555) 123-9999",  // Updated
    email: "sjohnson@heartclinic.com",
    address: "123 Medical Plaza, Suite 200, Springfield, MA 01101",
    notes: "Accepts Medicare. Parking available on-site. New evening hours.",  // Updated
    preferred: 1,
    created_at: "2024-01-15T10:00:00.000Z",
    updated_at: "2024-10-28T16:00:00.000Z"  // Updated
  }
}
```

#### Response Format (Not Found)

```typescript
{
  success: false,
  error: {
    code: "NOT_FOUND",
    message: "Healthcare provider not found"
  }
}
```

**HTTP Status**: 404

#### Example Requests

```typescript
// Update phone number only
await fetch('/api/providers/prov_123abc', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phone: '(555) 123-9999'
  })
})

// Mark as preferred
await fetch('/api/providers/prov_456def', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    preferred: 1
  })
})

// Update multiple fields
await fetch('/api/providers/prov_123abc', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phone: '(555) 123-9999',
    notes: 'Accepts Medicare. Parking available on-site. New evening hours.',
    address: '123 Medical Plaza, Suite 300, Springfield, MA 01101'  // Moved to Suite 300
  })
})
```

---

### DELETE /api/providers/:id

**Purpose**: Delete a healthcare provider record.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Provider ID to delete |

#### Implementation

```typescript
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const existingProvider = db.prepare(`
      SELECT * FROM healthcare_providers WHERE id = ?
    `).get(id)

    if (!existingProvider) {
      return err(res, 404, 'NOT_FOUND', 'Healthcare provider not found')
    }

    db.prepare(`
      DELETE FROM healthcare_providers WHERE id = ?
    `).run(id)

    okItem(res, { message: 'Healthcare provider deleted successfully' })
  } catch (error) {
    handleRouterError(res, error, 'Failed to delete healthcare provider')
  }
})
```

**Delete Behavior**:
- Hard delete (permanent removal)
- No soft delete mechanism
- Appointments may reference deleted providers (foreign key should be considered)

#### Response Format (Success)

```typescript
{
  data: {
    message: "Healthcare provider deleted successfully"
  }
}
```

#### Response Format (Not Found)

```typescript
{
  success: false,
  error: {
    code: "NOT_FOUND",
    message: "Healthcare provider not found"
  }
}
```

**HTTP Status**: 404

#### Example Request

```typescript
const response = await fetch('/api/providers/prov_789ghi', {
  method: 'DELETE'
})

const data = await response.json()

if (data.data) {
  console.log(data.data.message)  // "Healthcare provider deleted successfully"
}
```

**⚠️ Warning**: Deleting a provider may leave orphaned references in appointments table if foreign key constraints aren't properly configured.

---

## Usage Examples

### Build Provider Directory

```typescript
async function displayProviderDirectory() {
  const response = await fetch('/api/providers')
  const data = await response.json()
  
  // Group by preference
  const preferred = data.data.filter(p => p.preferred === 1)
  const other = data.data.filter(p => p.preferred === 0)
  
  console.log('⭐ PREFERRED PROVIDERS')
  console.log('─────────────────────────────')
  preferred.forEach(p => {
    console.log(`${p.name}`)
    console.log(`  ${p.specialty || 'General Practice'}`)
    console.log(`  ${p.practice_name || 'Private Practice'}`)
    console.log(`  📞 ${p.phone || 'No phone'}`)
    console.log('')
  })
  
  console.log('📋 OTHER PROVIDERS')
  console.log('─────────────────────────────')
  other.forEach(p => {
    console.log(`${p.name} - ${p.specialty || 'General'}`)
  })
}
```

### Create Provider with Validation

```typescript
async function createProviderWithValidation(providerData: any) {
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (providerData.email && !emailRegex.test(providerData.email)) {
    console.error('Invalid email format')
    return null
  }
  
  // Validate name length
  if (!providerData.name || providerData.name.length > 200) {
    console.error('Name is required and must be under 200 characters')
    return null
  }
  
  const response = await fetch('/api/providers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(providerData)
  })
  
  if (response.ok) {
    const data = await response.json()
    console.log(`✅ Created provider: ${data.data.name}`)
    return data.data
  } else {
    const error = await response.json()
    console.error('❌ Error:', error.error.message)
    return null
  }
}

// Usage
await createProviderWithValidation({
  name: 'Dr. Sarah Johnson',
  specialty: 'Cardiologist',
  practice_name: 'Heart & Vascular Clinic',
  phone: '(555) 123-4567',
  email: 'sjohnson@heartclinic.com',
  preferred: 1
})
```

### Find Provider by Specialty

```typescript
async function findProvidersBySpecialty(specialty: string) {
  const response = await fetch('/api/providers')
  const data = await response.json()
  
  const matches = data.data.filter(p => 
    p.specialty?.toLowerCase().includes(specialty.toLowerCase())
  )
  
  console.log(`Found ${matches.length} ${specialty} providers:`)
  matches.forEach(p => {
    console.log(`- ${p.name} at ${p.practice_name || 'Private Practice'}`)
  })
  
  return matches
}

// Usage
await findProvidersBySpecialty('Cardio')  // Matches "Cardiologist"
```

### Toggle Preferred Status

```typescript
async function togglePreferred(providerId: string) {
  // Get current provider
  const getResponse = await fetch(`/api/providers/${providerId}`)
  const getData = await getResponse.json()
  
  const currentPreferred = getData.data.preferred
  const newPreferred = currentPreferred === 1 ? 0 : 1
  
  // Update
  const updateResponse = await fetch(`/api/providers/${providerId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      preferred: newPreferred
    })
  })
  
  const updateData = await updateResponse.json()
  console.log(`${updateData.data.name} is now ${newPreferred === 1 ? 'preferred ⭐' : 'not preferred'}`)
  
  return updateData.data
}
```

### Bulk Import Providers

```typescript
async function bulkImportProviders(providers: any[]) {
  const results = {
    success: [],
    failed: []
  }
  
  for (const provider of providers) {
    try {
      const response = await fetch('/api/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(provider)
      })
      
      if (response.ok) {
        const data = await response.json()
        results.success.push(data.data)
      } else {
        const error = await response.json()
        results.failed.push({ provider, error: error.error.message })
      }
    } catch (error) {
      results.failed.push({ provider, error: 'Network error' })
    }
  }
  
  console.log(`✅ Imported: ${results.success.length}`)
  console.log(`❌ Failed: ${results.failed.length}`)
  
  return results
}

// Usage
const providersToImport = [
  {
    name: 'Dr. Sarah Johnson',
    specialty: 'Cardiologist',
    phone: '(555) 123-4567',
    preferred: 1
  },
  {
    name: 'Dr. Michael Chen',
    specialty: 'General Practitioner',
    phone: '(555) 987-6543',
    preferred: 1
  }
]

await bulkImportProviders(providersToImport)
```

---

## Best Practices

### 1. Use Descriptive Provider Names

```typescript
// ✅ GOOD: Full name with title
await createProvider({
  name: 'Dr. Sarah Johnson, MD'
})

await createProvider({
  name: 'Springfield General Hospital'
})

// ❌ BAD: Abbreviated or unclear
await createProvider({
  name: 'S Johnson'  // Missing title and unclear
})
```

### 2. Always Include Contact Information

```typescript
// ✅ GOOD: Multiple contact methods
await createProvider({
  name: 'Dr. Sarah Johnson',
  phone: '(555) 123-4567',
  email: 'sjohnson@heartclinic.com',
  address: '123 Medical Plaza, Suite 200'
})

// ⚠️ OKAY: Minimal contact info
await createProvider({
  name: 'Dr. Sarah Johnson',
  phone: '(555) 123-4567'
})

// ❌ BAD: No contact information
await createProvider({
  name: 'Dr. Sarah Johnson'
})
```

### 3. Use Preferred Flag Strategically

```typescript
// ✅ GOOD: Mark frequently-used providers
await createProvider({
  name: 'Dr. Michael Chen',
  specialty: 'Primary Care Physician',
  preferred: 1  // Patient sees regularly
})

await createProvider({
  name: 'Dr. Sarah Johnson',
  specialty: 'Cardiologist',
  preferred: 1  // Key specialist
})

// ❌ BAD: Mark all providers as preferred
// Defeats purpose of highlighting important providers
```

### 4. Store Structured Address Information

```typescript
// ✅ GOOD: Complete, formatted address
await createProvider({
  name: 'Dr. Sarah Johnson',
  address: '123 Medical Plaza, Suite 200, Springfield, MA 01101'
})

// ⚠️ OKAY: Basic address
await createProvider({
  name: 'Dr. Sarah Johnson',
  address: '123 Medical Plaza'
})

// ❌ BAD: Unstructured address
await createProvider({
  name: 'Dr. Sarah Johnson',
  address: 'near the mall'
})
```

### 5. Use Notes for Important Details

```typescript
// ✅ GOOD: Actionable information
await createProvider({
  name: 'Dr. Sarah Johnson',
  notes: 'Accepts Medicare. Parking on 2nd floor. Referral required for new patients.'
})

// ⚠️ OKAY: Basic notes
await createProvider({
  name: 'Dr. Sarah Johnson',
  notes: 'Accepts Medicare'
})

// ❌ BAD: Redundant or obvious information
await createProvider({
  name: 'Dr. Sarah Johnson',
  notes: 'This is a doctor'
})
```

### 6. Validate Before Deletion

```typescript
// ✅ GOOD: Check for dependencies before deleting
async function safeDeleteProvider(id: string) {
  // Check if provider has appointments
  const appointments = await fetch(`/api/appointments?provider_id=${id}`)
  const appointmentsData = await appointments.json()
  
  if (appointmentsData.data.length > 0) {
    console.warn(`Provider has ${appointmentsData.data.length} appointments`)
    const confirm = window.confirm('Delete anyway?')
    if (!confirm) return false
  }
  
  await fetch(`/api/providers/${id}`, { method: 'DELETE' })
  return true
}

// ❌ BAD: Delete without checking dependencies
await fetch(`/api/providers/${id}`, { method: 'DELETE' })
```

---

## Frontend Integration

### Vue Provider Selector Component

```vue
<template>
  <div class="provider-selector">
    <label>Healthcare Provider</label>
    <select v-model="selectedProvider" @change="handleChange">
      <option value="">Select a provider...</option>
      
      <optgroup label="⭐ Preferred Providers" v-if="preferredProviders.length > 0">
        <option 
          v-for="provider in preferredProviders" 
          :key="provider.id"
          :value="provider.id"
        >
          {{ provider.name }} - {{ provider.specialty || 'General' }}
        </option>
      </optgroup>
      
      <optgroup label="Other Providers" v-if="otherProviders.length > 0">
        <option 
          v-for="provider in otherProviders" 
          :key="provider.id"
          :value="provider.id"
        >
          {{ provider.name }} - {{ provider.specialty || 'General' }}
        </option>
      </optgroup>
    </select>
    
    <div v-if="selectedProviderData" class="provider-details">
      <p><strong>{{ selectedProviderData.practice_name }}</strong></p>
      <p>📞 {{ selectedProviderData.phone }}</p>
      <p>✉️ {{ selectedProviderData.email }}</p>
      <p>📍 {{ selectedProviderData.address }}</p>
      <p v-if="selectedProviderData.notes" class="notes">
        💡 {{ selectedProviderData.notes }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const emit = defineEmits<{
  providerChanged: [providerId: string]
}>()

const providers = ref<any[]>([])
const selectedProvider = ref<string>('')

const preferredProviders = computed(() => 
  providers.value.filter(p => p.preferred === 1)
)

const otherProviders = computed(() => 
  providers.value.filter(p => p.preferred === 0)
)

const selectedProviderData = computed(() => 
  providers.value.find(p => p.id === selectedProvider.value)
)

async function loadProviders() {
  const response = await fetch('/api/providers')
  const data = await response.json()
  providers.value = data.data
}

function handleChange() {
  emit('providerChanged', selectedProvider.value)
}

onMounted(loadProviders)
</script>

<style scoped>
.provider-selector {
  margin-bottom: 1rem;
}

select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.provider-details {
  background: #f5f5f5;
  padding: 1rem;
  border-radius: 4px;
  margin-top: 0.5rem;
}

.provider-details p {
  margin: 0.25rem 0;
}

.notes {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #ddd;
  font-style: italic;
}
</style>
```

### Provider Form Component

```vue
<template>
  <form @submit.prevent="handleSubmit" class="provider-form">
    <h3>{{ isEdit ? 'Edit' : 'Add New' }} Healthcare Provider</h3>
    
    <div class="form-group">
      <label>Name *</label>
      <input 
        v-model="form.name" 
        placeholder="Dr. John Smith"
        required
        maxlength="200"
      />
    </div>
    
    <div class="form-row">
      <div class="form-group">
        <label>Specialty</label>
        <input 
          v-model="form.specialty" 
          placeholder="Cardiologist"
        />
      </div>
      
      <div class="form-group">
        <label>Practice Name</label>
        <input 
          v-model="form.practice_name" 
          placeholder="Heart & Vascular Clinic"
        />
      </div>
    </div>
    
    <div class="form-row">
      <div class="form-group">
        <label>Phone</label>
        <input 
          v-model="form.phone" 
          type="tel"
          placeholder="(555) 123-4567"
        />
      </div>
      
      <div class="form-group">
        <label>Email</label>
        <input 
          v-model="form.email" 
          type="email"
          placeholder="doctor@clinic.com"
        />
      </div>
    </div>
    
    <div class="form-group">
      <label>Address</label>
      <input 
        v-model="form.address" 
        placeholder="123 Medical Plaza, Suite 200, City, State ZIP"
      />
    </div>
    
    <div class="form-group">
      <label>Notes</label>
      <textarea 
        v-model="form.notes" 
        rows="3"
        placeholder="Accepts Medicare, parking info, special instructions..."
      ></textarea>
    </div>
    
    <div class="form-group checkbox">
      <label>
        <input 
          v-model="form.preferred" 
          type="checkbox"
          :true-value="1"
          :false-value="0"
        />
        ⭐ Mark as Preferred Provider
      </label>
    </div>
    
    <div class="form-actions">
      <button type="submit" class="btn-primary">
        {{ isEdit ? 'Update' : 'Create' }} Provider
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
  providerId?: string
}>()

const emit = defineEmits<{
  saved: [provider: any]
  cancel: []
}>()

const isEdit = !!props.providerId

const form = ref({
  name: '',
  specialty: '',
  practice_name: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
  preferred: 0
})

async function loadProvider() {
  if (!props.providerId) return
  
  const response = await fetch(`/api/providers/${props.providerId}`)
  const data = await response.json()
  form.value = data.data
}

async function handleSubmit() {
  const url = isEdit 
    ? `/api/providers/${props.providerId}`
    : '/api/providers'
  
  const method = isEdit ? 'PUT' : 'POST'
  
  // Remove empty strings
  const payload = Object.fromEntries(
    Object.entries(form.value).filter(([_, v]) => v !== '')
  )
  
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  
  if (response.ok) {
    const data = await response.json()
    emit('saved', data.data)
  } else {
    const error = await response.json()
    alert(error.error.message)
  }
}

onMounted(() => {
  if (isEdit) loadProvider()
})
</script>

<style scoped>
.provider-form {
  max-width: 600px;
  margin: 0 auto;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.checkbox label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: normal;
}

.checkbox input {
  width: auto;
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

### 1. List Query Performance

**Current**: Full table scan with sorting
```sql
SELECT * FROM healthcare_providers 
ORDER BY preferred DESC, name ASC
```

**Performance**: Fast for typical provider counts (< 500)

**Future Optimization**: Add composite index
```sql
CREATE INDEX idx_providers_preferred_name ON healthcare_providers(preferred DESC, name ASC);
```

### 2. Search Optimization

**Recommendation**: Add search endpoint with LIKE queries
```typescript
// Future: GET /api/providers/search?q=cardio
SELECT * FROM healthcare_providers 
WHERE name LIKE ? OR specialty LIKE ?
ORDER BY preferred DESC, name ASC
```

---

## Security Considerations

### 1. SQL Injection Protection

**Status**: ✅ Protected via parameterized queries

```typescript
// Safe
db.prepare('SELECT * FROM healthcare_providers WHERE id = ?').get(id)

// Vulnerable (not used)
db.exec(`SELECT * FROM healthcare_providers WHERE id = '${id}'`)
```

### 2. Input Validation

**Status**: ✅ Protected via Zod schemas

**Validates**:
- Name required and length limited (200 chars)
- Email format validation
- Preferred must be 0 or 1

### 3. Email Privacy

**Recommendation**: Consider masking email addresses in list view
```typescript
// Display: d***@clinic.com instead of doctor@clinic.com
```

---

## Testing Considerations

### Unit Test Scenarios

```typescript
describe('Providers Router', () => {
  describe('GET /api/providers', () => {
    it('should order preferred providers first', async () => {
      await createTestProvider({ name: 'Dr. Z', preferred: 0 })
      await createTestProvider({ name: 'Dr. A', preferred: 1 })
      await createTestProvider({ name: 'Dr. M', preferred: 1 })
      
      const response = await request(app).get('/api/providers')
      const names = response.body.data.map((p: any) => p.name)
      
      expect(names).toEqual(['Dr. A', 'Dr. M', 'Dr. Z'])
    })
  })
  
  describe('POST /api/providers', () => {
    it('should create provider with minimal data', async () => {
      const response = await request(app)
        .post('/api/providers')
        .send({ name: 'Dr. Test' })
      
      expect(response.status).toBe(201)
      expect(response.body.data.name).toBe('Dr. Test')
      expect(response.body.data.preferred).toBe(0)
    })
    
    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/providers')
        .send({
          name: 'Dr. Test',
          email: 'invalid-email'
        })
      
      expect(response.status).toBe(400)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })
  })
  
  describe('DELETE /api/providers/:id', () => {
    it('should delete provider', async () => {
      const provider = await createTestProvider({ name: 'Dr. Delete' })
      
      const response = await request(app)
        .delete(`/api/providers/${provider.id}`)
      
      expect(response.status).toBe(200)
      
      const check = db.prepare('SELECT * FROM healthcare_providers WHERE id = ?')
        .get(provider.id)
      expect(check).toBeUndefined()
    })
  })
})
```

---

## Summary

The **Healthcare Providers Router** manages provider directory for patient care coordination:

**Endpoints (5 total)**:
- **GET /api/providers** - List all providers (preferred first, then alphabetical)
- **GET /api/providers/:id** - Get specific provider details
- **POST /api/providers** - Create new provider record
- **PUT /api/providers/:id** - Update provider information (dynamic fields)
- **DELETE /api/providers/:id** - Delete provider (hard delete)

**Key Features**:
- Preferred provider flagging (0 or 1)
- Smart ordering (preferred first, then alphabetical)
- Complete contact information (phone, email, address)
- Specialty and practice tracking
- Notes field for special instructions
- Auto-generated IDs and timestamps

**Contact Fields**:
- Phone (no format validation)
- Email (validated format)
- Address (free-form text)
- Practice name

**Use Cases**:
- Maintain care team directory
- Schedule appointments with providers
- Track specialist referrals
- Display provider contact information
- Mark frequently-used providers as preferred

**Integration**:
Providers are referenced by appointments (provider_id or provider_name) and may be linked to patient records (primary_doctor field). The preferred flag helps users quickly find their regular healthcare team.
