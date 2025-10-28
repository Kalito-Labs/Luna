# Caregiver Profile Router Documentation

## Overview

The `caregiversRouter.ts` file implements a **singleton caregiver profile system** for the eldercare application. This is your personal profile that provides context about yourself (the caregiver) to AI models.

**Location**: `/backend/routes/caregiversRouter.ts`

**Mounted At**: `/api/caregiver`

**Purpose**:
- Store your personal caregiver profile (singular - only one record)
- Provide context about yourself to AI models
- Track basic contact information and relationship to patients
- Simple profile management without professional caregiver features

**Key Characteristics**:
- **Singleton Pattern**: Only ONE caregiver profile can exist (you)
- **No Professional Features**: No scheduling, clock tracking, certifications, or hourly rates
- **Simple Profile**: Basic contact info, relationship (e.g., "son"), emergency contacts, and notes
- **Context for AI**: The `notes` field is perfect for adding details about yourself that help AI understand your role

---

## Architecture

### Dependencies

```typescript
import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db/db'
import { okItem, err } from '../utils/apiContract'
import { handleRouterError, generateId } from '../utils/routerHelpers'
import type {
  Caregiver,
  CreateCaregiverRequest,
  UpdateCaregiverRequest,
} from '../types/caregiver'
```

**Key Dependencies**:
- **Types**: Simplified caregiver type definitions from `/types/caregiver.ts`
- **Zod**: Runtime validation for all inputs
- **API Contract**: Standardized response formats (`okItem`, `err`)
- **Router Helpers**: ID generation and error handling

**Note**: No `okList` import - we don't have list endpoints for singleton pattern

---

## Database Schema

### Caregivers Table (Singleton)

```sql
CREATE TABLE caregivers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  date_of_birth TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  relationship TEXT,                   -- e.g., "son", "daughter", "spouse"
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  notes TEXT,                          -- Context about yourself for AI models
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_caregivers_relationship 
  ON caregivers(relationship);
```

**Field Explanations**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | TEXT | Yes | Primary key (generated via `generateId()`) |
| `name` | TEXT | Yes | Your full name |
| `date_of_birth` | TEXT | No | ISO date string (e.g., "1985-05-15") |
| `email` | TEXT | No | Your email address |
| `phone` | TEXT | No | Your contact phone number |
| `address` | TEXT | No | Your physical address |
| `relationship` | TEXT | No | Your relationship to patients (e.g., "son", "daughter", "spouse") |
| `emergency_contact_name` | TEXT | No | Emergency contact person name |
| `emergency_contact_phone` | TEXT | No | Emergency contact phone |
| `notes` | TEXT | No | **Important**: Add context about yourself here for AI models |
| `created_at` | TEXT | Yes | Record creation timestamp |
| `updated_at` | TEXT | Yes | Last update timestamp |

**Database Constraints**:
- Only ONE record should exist in this table (enforced by application logic)
- No soft delete flag - you can't delete yourself!
- No JSON fields - all simple text values

**Index**:
- `idx_caregivers_relationship`: Fast lookup by relationship type (though only one record exists)

---

## Validation Schemas

### Create Caregiver Schema

```typescript
const createCaregiverSchema = z.object({
  name: z.string().min(1).max(200),
  date_of_birth: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  relationship: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  notes: z.string().optional(),
})
```

**Validation Rules**:
- `name`: Required, 1-200 characters
- `email`: Optional, must be valid email format if provided
- All other fields: Optional text fields

### Update Caregiver Schema

```typescript
const updateCaregiverSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  date_of_birth: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  relationship: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  notes: z.string().optional(),
})
```

**Differences from Create**:
- All fields optional (allows partial updates)
- Same validation rules apply to fields that are provided

---

## Endpoints

### GET /api/caregiver

**Purpose**: Retrieve your caregiver profile (singleton).

#### Implementation

```typescript
router.get('/', async (req, res) => {
  try {
    const caregiver = db.prepare(`
      SELECT * FROM caregivers LIMIT 1
    `).get() as Caregiver | undefined

    if (!caregiver) {
      return err(res, 404, 'NOT_FOUND', 'Caregiver profile not found')
    }

    return okItem(res, caregiver)
  } catch (error) {
    return handleRouterError(res, error, 'Failed to retrieve caregiver profile')
  }
})
```

**SQL Details**:
- **LIMIT 1**: Only retrieves the single caregiver record
- No WHERE clause needed - there's only one record
- Simple and fast query

#### Response Format (Success)

```typescript
{
  data: {
    id: "1760203908740-1kpxjto0ei6i",
    name: "John Smith",
    date_of_birth: "1985-05-15",
    email: "john@example.com",
    phone: "555-1234",
    address: "123 Main St",
    relationship: "son",
    emergency_contact_name: "Jane Smith",
    emergency_contact_phone: "555-5678",
    notes: "I'm the primary caregiver for my parents. I work from home which allows flexibility. Medical background as a former EMT.",
    created_at: "2024-01-01T10:00:00.000Z",
    updated_at: "2024-01-15T08:00:00.000Z"
  }
}
```

#### Response Format (Not Found)

```typescript
{
  error: {
    code: "NOT_FOUND",
    message: "Caregiver profile not found"
  }
}
```

**When does this happen?**: When no profile has been created yet (first time setup)

#### Example Request

```typescript
const response = await fetch('/api/caregiver')
const data = await response.json()

if (data.data) {
  console.log(`Caregiver: ${data.data.name}`)
  console.log(`Relationship: ${data.data.relationship}`)
} else {
  console.log('No profile yet - need to create one')
}
```

---

### POST /api/caregiver

**Purpose**: Create your caregiver profile (can only be done once).

#### Request Body

```typescript
{
  name: string;                        // Required
  date_of_birth?: string;              // ISO date: "1985-05-15"
  email?: string;                      // Must be valid email
  phone?: string;
  address?: string;
  relationship?: string;               // e.g., "son", "daughter", "spouse"
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  notes?: string;                      // Add context about yourself for AI
}
```

#### Implementation Flow

**1. Check for Existing Profile**

```typescript
const existingCaregiver = db.prepare('SELECT id FROM caregivers LIMIT 1').get()
if (existingCaregiver) {
  return err(res, 409, 'CONFLICT', 'Caregiver profile already exists. Use PUT to update.')
}
```

**Conflict Prevention**: Returns 409 if profile already exists - enforces singleton pattern

**2. Validate Request Body**

```typescript
const validatedData = createCaregiverSchema.parse(req.body) as CreateCaregiverRequest
const id = generateId()
```

**3. Insert Profile**

```typescript
const insertCaregiver = db.prepare(`
  INSERT INTO caregivers (
    id, name, date_of_birth, email, phone, address, relationship,
    emergency_contact_name, emergency_contact_phone, notes, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

const now = new Date().toISOString()

insertCaregiver.run(
  id,
  validatedData.name,
  validatedData.date_of_birth || null,
  validatedData.email || null,
  validatedData.phone || null,
  validatedData.address || null,
  validatedData.relationship || null,
  validatedData.emergency_contact_name || null,
  validatedData.emergency_contact_phone || null,
  validatedData.notes || null,
  now,
  now
)
```

**4. Retrieve and Return Created Profile**

```typescript
const newCaregiver = db.prepare('SELECT * FROM caregivers WHERE id = ?').get(id) as Caregiver
return okItem(res, newCaregiver, 201)
```

**Status Code**: `201 Created`

#### Response Format (Success)

```typescript
{
  data: {
    id: "1760203908740-1kpxjto0ei6i",
    name: "John Smith",
    relationship: "son",
    email: "john@example.com",
    phone: "555-1234",
    notes: "Primary caregiver for both parents. Former EMT with medical knowledge.",
    created_at: "2024-01-20T15:30:00.000Z",
    updated_at: "2024-01-20T15:30:00.000Z"
  }
}
```

#### Response Format (Conflict)

```typescript
{
  error: {
    code: "CONFLICT",
    message: "Caregiver profile already exists. Use PUT to update."
  }
}
```

**HTTP Status**: 409 Conflict

#### Example Request

```typescript
const response = await fetch('/api/caregiver', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: "John Smith",
    date_of_birth: "1985-05-15",
    email: "john@example.com",
    phone: "555-1234",
    address: "123 Main St, Springfield",
    relationship: "son",
    emergency_contact_name: "Jane Smith",
    emergency_contact_phone: "555-5678",
    notes: "Primary caregiver for both parents. I work from home which provides flexibility. Former EMT with medical knowledge - comfortable with medications and basic health monitoring."
  })
})

if (response.status === 201) {
  const data = await response.json()
  console.log(`Profile created: ${data.data.id}`)
} else if (response.status === 409) {
  console.log('Profile already exists - use update instead')
}
```

---

### PUT /api/caregiver

**Purpose**: Update your caregiver profile (partial update).

#### Request Body

All fields optional - only send what you want to update:

```typescript
{
  name?: string;
  date_of_birth?: string;
  email?: string;
  phone?: string;
  address?: string;
  relationship?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  notes?: string;
}
```

#### Implementation Flow

**1. Validate Request**

```typescript
const validatedData = updateCaregiverSchema.parse(req.body) as UpdateCaregiverRequest

// Get existing profile
const existingCaregiver = db.prepare('SELECT * FROM caregivers LIMIT 1').get() as Caregiver | undefined
if (!existingCaregiver) {
  return err(res, 404, 'NOT_FOUND', 'Caregiver profile not found')
}
```

**2. Build Dynamic UPDATE Query**

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
values.push(existingCaregiver.id)
```

**Dynamic Query Building**: Only updates fields that are provided in request

**3. Execute Update**

```typescript
const updateQuery = `UPDATE caregivers SET ${updates.join(', ')} WHERE id = ?`
db.prepare(updateQuery).run(...values)
```

**Example Built Query**:
```sql
UPDATE caregivers 
SET notes = ?, email = ?, updated_at = ? 
WHERE id = ?
-- values: ['Updated notes...', 'newemail@example.com', '2024-01-20T16:00:00.000Z', '1760203908740-1kpxjto0ei6i']
```

**4. Retrieve and Return Updated Profile**

```typescript
const updatedCaregiver = db.prepare('SELECT * FROM caregivers WHERE id = ?').get(existingCaregiver.id) as Caregiver
return okItem(res, updatedCaregiver)
```

#### Response Format (Success)

```typescript
{
  data: {
    id: "1760203908740-1kpxjto0ei6i",
    name: "John Smith",
    email: "newemail@example.com",  // Updated
    notes: "Updated context about myself...",  // Updated
    // ... all other fields
    updated_at: "2024-01-20T16:00:00.000Z"
  }
}
```

#### Response Format (Not Found)

```typescript
{
  error: {
    code: "NOT_FOUND",
    message: "Caregiver profile not found"
  }
}
```

#### Example Requests

```typescript
// Update notes (perfect for adding AI context)
await fetch('/api/caregiver', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    notes: "Primary caregiver for parents (ages 78 and 82). Dad has early dementia, Mom has mobility issues. I work from home as a software developer, which provides flexibility. Former EMT so comfortable with medical tasks. Main concerns are medication management and fall prevention."
  })
})

// Update contact info
await fetch('/api/caregiver', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: "newemail@example.com",
    phone: "555-9999"
  })
})

// Update relationship description
await fetch('/api/caregiver', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    relationship: "son (primary caregiver)"
  })
})
```

---

## Usage Examples

### Create Your Caregiver Profile (First Time Setup)

```typescript
async function setupProfile() {
  const response = await fetch('/api/caregiver', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: "John Smith",
      date_of_birth: "1985-05-15",
      email: "john@example.com",
      phone: "555-1234",
      address: "123 Main St, Springfield",
      relationship: "son",
      emergency_contact_name: "Jane Smith (sister)",
      emergency_contact_phone: "555-9876",
      notes: `Primary caregiver for both parents (Dad: 78, early dementia; Mom: 82, mobility issues).
      
Work: Software developer, work from home - provides flexibility for caregiving.
Background: Former EMT - comfortable with medical tasks, medications, and health monitoring.
Key concerns: Medication management, fall prevention, cognitive decline monitoring.
Availability: Generally available during business hours, can respond to emergencies 24/7.`
    })
  })

  const data = await response.json()
  console.log('Profile created:', data.data.id)
  return data.data
}
```

### Get Your Profile

```typescript
async function getMyProfile() {
  const response = await fetch('/api/caregiver')
  const data = await response.json()
  
  if (data.data) {
    console.log(`Name: ${data.data.name}`)
    console.log(`Relationship: ${data.data.relationship}`)
    console.log(`Notes: ${data.data.notes}`)
    return data.data
  } else {
    console.log('No profile found - need to create one')
    return null
  }
}
```

### Update Your Context for AI

```typescript
async function updateAIContext(additionalContext: string) {
  // Get current profile
  const current = await fetch('/api/caregiver')
  const currentData = await current.json()
  
  // Append new context to existing notes
  const updatedNotes = currentData.data.notes 
    ? `${currentData.data.notes}\n\n${additionalContext}`
    : additionalContext
  
  // Update profile
  await fetch('/api/caregiver', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      notes: updatedNotes
    })
  })
  
  console.log('AI context updated')
}

// Usage
await updateAIContext(`Update: Dad started new medication (Aricept) for dementia as of Jan 2024. 
Need to monitor for side effects. Mom now using walker full-time after fall scare in December.`)
```

### Update Contact Information

```typescript
async function updateContactInfo() {
  await fetch('/api/caregiver', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: "newemail@example.com",
      phone: "555-9999",
      address: "456 Oak Ave, Springfield"
    })
  })
  
  console.log('Contact info updated')
}
```

---

## Best Practices

### 1. Use the Notes Field for AI Context

```typescript
// ✅ GOOD: Rich context about yourself for AI models
notes: `Primary caregiver for both parents (Dad: 78, early dementia; Mom: 82, mobility issues).

Work: Software developer, work from home - provides flexibility.
Background: Former EMT - comfortable with medical tasks.
Key concerns: Medication management, fall prevention, cognitive decline.
Preferences: Prefer natural/holistic approaches when possible. Religious considerations for end-of-life care.
Support network: Sister lives nearby (30 min), available for backup care.`

// ❌ BAD: Minimal or no context
notes: "Taking care of parents"
```

### 2. Keep Profile Updated

```typescript
// ✅ GOOD: Update when circumstances change
async function updateContext() {
  const updates = {
    notes: `... existing context ...
    
    Update (Jan 2024): Dad started Aricept for dementia. Monitoring for side effects.
    Mom now using walker full-time after December fall. Home safety assessment completed.`
  }
  
  await fetch('/api/caregiver', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  })
}
```

### 3. Handle Profile Not Found on First Load

```typescript
// ✅ GOOD: Check if profile exists, create if needed
async function ensureProfile() {
  const response = await fetch('/api/caregiver')
  
  if (response.status === 404) {
    // No profile yet - redirect to setup
    router.push('/setup')
  } else {
    const data = await response.json()
    return data.data
  }
}
```

### 4. Prevent Duplicate Profile Creation

```typescript
// ✅ GOOD: Handle 409 conflict gracefully
async function createProfile(profileData) {
  const response = await fetch('/api/caregiver', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profileData)
  })
  
  if (response.status === 409) {
    console.warn('Profile already exists - using UPDATE instead')
    // Redirect to update flow
    return updateProfile(profileData)
  }
  
  return response.json()
}
```

### 5. Validate Email Format

```typescript
// ✅ GOOD: Email validated by Zod schema
await fetch('/api/caregiver', {
  method: 'PUT',
  body: JSON.stringify({
    email: "valid@example.com"  // Will pass validation
  })
})

// ❌ BAD: Invalid email will be rejected
await fetch('/api/caregiver', {
  method: 'PUT',
  body: JSON.stringify({
    email: "not-an-email"  // Will return 400 validation error
  })
})
```

---

## Frontend Integration

### Profile Display Component

```vue
<template>
  <div class="caregiver-profile">
    <div v-if="profile">
      <h2>Your Caregiver Profile</h2>
      
      <div class="profile-card">
        <div class="field">
          <label>Name:</label>
          <span>{{ profile.name }}</span>
        </div>
        
        <div class="field">
          <label>Relationship:</label>
          <span>{{ profile.relationship || 'Not specified' }}</span>
        </div>
        
        <div class="field">
          <label>Email:</label>
          <span>{{ profile.email || 'Not provided' }}</span>
        </div>
        
        <div class="field">
          <label>Phone:</label>
          <span>{{ profile.phone || 'Not provided' }}</span>
        </div>
        
        <div class="field">
          <label>Emergency Contact:</label>
          <span>
            {{ profile.emergency_contact_name || 'Not provided' }}
            <span v-if="profile.emergency_contact_phone">
              ({{ profile.emergency_contact_phone }})
            </span>
          </span>
        </div>
        
        <div class="field notes">
          <label>AI Context Notes:</label>
          <p class="notes-text">{{ profile.notes || 'No notes added yet' }}</p>
        </div>
      </div>
      
      <button @click="editProfile" class="btn-primary">Edit Profile</button>
    </div>
    
    <div v-else-if="loading">
      <p>Loading profile...</p>
    </div>
    
    <div v-else>
      <p>No profile found. Create your caregiver profile to get started.</p>
      <button @click="createProfile" class="btn-primary">Create Profile</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Caregiver } from '@/types/caregiver'
import { useRouter } from 'vue-router'

const router = useRouter()
const profile = ref<Caregiver | null>(null)
const loading = ref(true)

async function loadProfile() {
  try {
    const response = await fetch('/api/caregiver')
    
    if (response.ok) {
      const data = await response.json()
      profile.value = data.data
    } else if (response.status === 404) {
      profile.value = null
    }
  } catch (error) {
    console.error('Failed to load profile:', error)
  } finally {
    loading.value = false
  }
}

function editProfile() {
  router.push('/caregiver/edit')
}

function createProfile() {
  router.push('/caregiver/create')
}

onMounted(loadProfile)
</script>

<style scoped>
.profile-card {
  background: #f5f5f5;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.field {
  margin-bottom: 1rem;
}

.field label {
  font-weight: bold;
  display: block;
  margin-bottom: 0.25rem;
}

.notes {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #ddd;
}

.notes-text {
  white-space: pre-wrap;
  background: white;
  padding: 1rem;
  border-radius: 4px;
  border: 1px solid #ddd;
}
</style>
```

### Profile Edit Component

```vue
<template>
  <div class="edit-profile">
    <h2>{{ isCreate ? 'Create' : 'Edit' }} Your Profile</h2>
    
    <form @submit.prevent="saveProfile">
      <div class="form-group">
        <label>Name *</label>
        <input v-model="form.name" type="text" required />
      </div>
      
      <div class="form-group">
        <label>Date of Birth</label>
        <input v-model="form.date_of_birth" type="date" />
      </div>
      
      <div class="form-group">
        <label>Email</label>
        <input v-model="form.email" type="email" />
      </div>
      
      <div class="form-group">
        <label>Phone</label>
        <input v-model="form.phone" type="tel" />
      </div>
      
      <div class="form-group">
        <label>Address</label>
        <textarea v-model="form.address" rows="2"></textarea>
      </div>
      
      <div class="form-group">
        <label>Relationship to Patients</label>
        <input v-model="form.relationship" type="text" placeholder="e.g., son, daughter, spouse" />
      </div>
      
      <div class="form-group">
        <label>Emergency Contact Name</label>
        <input v-model="form.emergency_contact_name" type="text" />
      </div>
      
      <div class="form-group">
        <label>Emergency Contact Phone</label>
        <input v-model="form.emergency_contact_phone" type="tel" />
      </div>
      
      <div class="form-group">
        <label>Notes (Context for AI)</label>
        <textarea 
          v-model="form.notes" 
          rows="6"
          placeholder="Add details about yourself that will help AI understand your role and provide better assistance..."
        ></textarea>
        <small>
          Example: Work schedule, medical background, key concerns, preferences, support network, etc.
        </small>
      </div>
      
      <div class="form-actions">
        <button type="submit" class="btn-primary">
          {{ isCreate ? 'Create Profile' : 'Save Changes' }}
        </button>
        <button type="button" @click="cancel" class="btn-secondary">Cancel</button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { Caregiver, CreateCaregiverRequest, UpdateCaregiverRequest } from '@/types/caregiver'

const router = useRouter()
const isCreate = ref(true)
const form = ref<CreateCaregiverRequest>({
  name: '',
  date_of_birth: undefined,
  email: undefined,
  phone: undefined,
  address: undefined,
  relationship: undefined,
  emergency_contact_name: undefined,
  emergency_contact_phone: undefined,
  notes: undefined,
})

async function loadProfile() {
  try {
    const response = await fetch('/api/caregiver')
    
    if (response.ok) {
      const data = await response.json()
      const profile: Caregiver = data.data
      
      // Populate form with existing data
      form.value = {
        name: profile.name,
        date_of_birth: profile.date_of_birth,
        email: profile.email,
        phone: profile.phone,
        address: profile.address,
        relationship: profile.relationship,
        emergency_contact_name: profile.emergency_contact_name,
        emergency_contact_phone: profile.emergency_contact_phone,
        notes: profile.notes,
      }
      
      isCreate.value = false
    } else if (response.status === 404) {
      isCreate.value = true
    }
  } catch (error) {
    console.error('Failed to load profile:', error)
  }
}

async function saveProfile() {
  try {
    const url = '/api/caregiver'
    const method = isCreate.value ? 'POST' : 'PUT'
    
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    })
    
    if (response.ok) {
      router.push('/caregiver')
    } else if (response.status === 409) {
      alert('Profile already exists. Refreshing...')
      await loadProfile()
    } else {
      const error = await response.json()
      alert(`Error: ${error.error.message}`)
    }
  } catch (error) {
    console.error('Failed to save profile:', error)
    alert('Failed to save profile')
  }
}

function cancel() {
  router.push('/caregiver')
}

onMounted(loadProfile)
</script>
```

---

## Security Considerations

### 1. SQL Injection Protection

**Status**: ✅ Protected via parameterized queries

```typescript
// Safe - parameterized query
db.prepare('SELECT * FROM caregivers LIMIT 1').get()
db.prepare('UPDATE caregivers SET name = ? WHERE id = ?').run(name, id)

// Vulnerable (not used in this router)
db.exec(`UPDATE caregivers SET name = '${name}'`)
```

### 2. Authorization

**Current State**: No authentication/authorization implemented

**Recommendation**: Add authentication middleware to ensure only the profile owner can access/modify their profile

```typescript
// Example: Verify user owns this profile
async function authorizeCaregiverAccess(req, res, next) {
  const userId = req.user?.id  // From auth middleware
  
  const caregiver = db.prepare('SELECT id FROM caregivers LIMIT 1').get()
  
  if (!caregiver) {
    return next()  // Allow creation
  }
  
  // Check if user ID matches caregiver owner (would need user_id field)
  // For now, assume single-user system
  next()
}
```

**Future**: Consider adding `user_id` field if supporting multiple users

### 3. Email Validation

**Status**: ✅ Protected by Zod schema

```typescript
email: z.string().email().optional()
// Rejects: "not-an-email", "missing@domain", etc.
```

### 4. Input Sanitization

**Status**: Validation only, no HTML sanitization

**Recommendation**: Sanitize `notes` field if displaying as HTML

```typescript
import DOMPurify from 'dompurify'

// When displaying notes
const sanitizedNotes = DOMPurify.sanitize(profile.notes)
```

### 5. Rate Limiting

**Missing**: No rate limiting on profile updates

**Recommendation**: Add rate limiting middleware to prevent abuse

```typescript
import rateLimit from 'express-rate-limit'

const profileUpdateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 10  // Max 10 updates per 15 minutes
})

router.put('/', profileUpdateLimiter, async (req, res) => { ... })
```

---

## Performance Considerations

### 1. Singleton Query Optimization

**Current**: Simple `LIMIT 1` query - extremely fast

```sql
SELECT * FROM caregivers LIMIT 1
-- No WHERE clause needed
-- No index lookup required
-- Single row scan
```

**Performance**: Sub-millisecond query time for single-record table

### 2. No JSON Parsing Overhead

**Advantage**: No JSON fields means no serialization/deserialization overhead

**Before** (multi-caregiver system):
```typescript
// Had to parse JSON on every read
specialties: JSON.parse(row.specialties)
certifications: JSON.parse(row.certifications)
availability_schedule: JSON.parse(row.availability_schedule)
```

**Now** (singleton):
```typescript
// Direct field access - no parsing
name: row.name
email: row.email
notes: row.notes
```

### 3. Index Usage

**Current Index**: `idx_caregivers_relationship`

**Note**: Index not needed for singleton pattern (only 1 row), but kept for potential future queries

**Recommendation**: Index provides minimal value - could be removed if absolutely minimizing storage

### 4. Caching Strategy

**Recommendation**: Cache profile on frontend to avoid repeated API calls

```typescript
// Frontend caching
const profileCache = ref<Caregiver | null>(null)
const cacheExpiry = ref<number>(0)
const CACHE_DURATION = 5 * 60 * 1000  // 5 minutes

async function getProfile(useCache = true) {
  const now = Date.now()
  
  if (useCache && profileCache.value && now < cacheExpiry.value) {
    return profileCache.value
  }
  
  const response = await fetch('/api/caregiver')
  const data = await response.json()
  
  profileCache.value = data.data
  cacheExpiry.value = now + CACHE_DURATION
  
  return data.data
}
```

---

## Testing Considerations

### Unit Test Scenarios

```typescript
describe('Caregiver Profile Router', () => {
  beforeEach(async () => {
    // Clear caregiver table
    db.prepare('DELETE FROM caregivers').run()
  })
  
  describe('POST /api/caregiver', () => {
    it('should create profile successfully', async () => {
      const response = await request(app)
        .post('/api/caregiver')
        .send({
          name: 'John Smith',
          email: 'john@example.com',
          relationship: 'son'
        })
      
      expect(response.status).toBe(201)
      expect(response.body.data.name).toBe('John Smith')
      expect(response.body.data.email).toBe('john@example.com')
    })
    
    it('should reject duplicate profile creation', async () => {
      // Create first profile
      await request(app)
        .post('/api/caregiver')
        .send({ name: 'John Smith' })
      
      // Attempt second profile
      const response = await request(app)
        .post('/api/caregiver')
        .send({ name: 'Jane Doe' })
      
      expect(response.status).toBe(409)
      expect(response.body.error.code).toBe('CONFLICT')
    })
    
    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/caregiver')
        .send({ email: 'missing-name@example.com' })
      
      expect(response.status).toBe(400)
    })
    
    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/caregiver')
        .send({
          name: 'John Smith',
          email: 'invalid-email'
        })
      
      expect(response.status).toBe(400)
    })
  })
  
  describe('GET /api/caregiver', () => {
    it('should return 404 when no profile exists', async () => {
      const response = await request(app).get('/api/caregiver')
      expect(response.status).toBe(404)
    })
    
    it('should return profile when exists', async () => {
      // Create profile
      await request(app)
        .post('/api/caregiver')
        .send({ name: 'John Smith', relationship: 'son' })
      
      // Retrieve profile
      const response = await request(app).get('/api/caregiver')
      
      expect(response.status).toBe(200)
      expect(response.body.data.name).toBe('John Smith')
      expect(response.body.data.relationship).toBe('son')
    })
  })
  
  describe('PUT /api/caregiver', () => {
    it('should update profile fields', async () => {
      // Create profile
      const createRes = await request(app)
        .post('/api/caregiver')
        .send({ name: 'John Smith', email: 'old@example.com' })
      
      // Update profile
      const updateRes = await request(app)
        .put('/api/caregiver')
        .send({
          email: 'new@example.com',
          notes: 'Updated context'
        })
      
      expect(updateRes.status).toBe(200)
      expect(updateRes.body.data.name).toBe('John Smith')  // Unchanged
      expect(updateRes.body.data.email).toBe('new@example.com')  // Changed
      expect(updateRes.body.data.notes).toBe('Updated context')  // Changed
    })
    
    it('should return 404 when no profile exists', async () => {
      const response = await request(app)
        .put('/api/caregiver')
        .send({ name: 'Updated Name' })
      
      expect(response.status).toBe(404)
    })
    
    it('should reject invalid email on update', async () => {
      // Create profile
      await request(app)
        .post('/api/caregiver')
        .send({ name: 'John Smith' })
      
      // Attempt update with invalid email
      const response = await request(app)
        .put('/api/caregiver')
        .send({ email: 'not-an-email' })
      
      expect(response.status).toBe(400)
    })
  })
})
```

---

## Summary

The **Caregiver Profile Router** provides simple singleton profile management for the primary caregiver:

**Endpoints (3 total)**:
- **GET /api/caregiver**: Retrieve your profile
- **POST /api/caregiver**: Create your profile (one-time, conflict prevention)
- **PUT /api/caregiver**: Update your profile (partial updates)

**Key Features**:
- **Singleton Pattern**: Only ONE profile can exist (enforced via 409 conflict)
- **Simple Data Model**: No JSON fields, no professional features
- **AI Context**: `notes` field perfect for providing context to AI models
- **Validation**: Zod schemas ensure data integrity (email format, required fields)
- **Partial Updates**: PUT only updates provided fields

**Use Cases**:
- First-time profile setup with personal context
- Update contact information as needed
- Add/update AI context notes with caregiving details
- Store emergency contact information
- Track relationship to patients

**Benefits of Singleton Approach**:
- No IDs needed in API calls (always operates on THE profile)
- Simple frontend integration (no lists, no selection)
- Fast queries (LIMIT 1, no filtering)
- Clear semantics (you = the caregiver)
- Perfect for single-user eldercare app

**AI Integration**:
The `notes` field is the key to providing rich context to AI models about:
- Your caregiving situation (who you care for)
- Your background (medical training, work schedule)
- Your concerns (medication management, fall prevention)
- Your preferences (holistic approaches, religious considerations)
- Your support network (backup caregivers, family)
