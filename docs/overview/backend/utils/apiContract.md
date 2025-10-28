# apiContract.ts - Standardized API Response System

## Overview
`apiContract.ts` provides a **canonical contract** for all API responses in the Kalito backend. It ensures every endpoint returns responses in a consistent, predictable format that the frontend can reliably parse.

---

## Core Philosophy

### Why a Standardized Contract?

**Without a contract:**
```typescript
// Endpoint 1 returns:
{ patient: {...} }

// Endpoint 2 returns:
{ data: {...} }

// Endpoint 3 returns:
{ result: {...} }

// Frontend has to handle 3 different formats!
```

**With apiContract:**
```typescript
// ALL endpoints return:
{
  version: "v1",
  data: {...}  // Success responses
}

// OR
{
  version: "v1",
  error: {
    code: "NOT_FOUND",
    message: "Patient not found"
  }
}

// Frontend knows exactly what to expect!
```

---

## API Version (Lines 1-15)

```typescript
import {
  API_CONTRACT_VERSION,
  type ApiErrorPayload,
  type ApiErrorResponse,
  type ApiSuccessItem,
  type ApiSuccessList,
  type ApiDeleted,
} from '../types/api'

export const API_VERSION = API_CONTRACT_VERSION
```

**What it does:**
- Imports the version constant from type definitions
- Re-exports it for use across the codebase
- Every response includes this version for future API evolution

**Why versioning matters:**
- Allows frontend to detect API version mismatches
- Enables gradual migration when API changes
- Mobile apps can show "please update" messages if version too old

**Example use case:**
```typescript
// Frontend checks version
if (response.version !== EXPECTED_VERSION) {
  showUpdatePrompt()
}
```

---

## Success Response Helpers

### 1. okItem() - Single Resource Response (Lines 18-23)

```typescript
export function okItem<T>(res: Response, data: T, status = 200): Response<ApiSuccessItem<T> & { data: T }> {
  return res.status(status).json({
    version: API_VERSION,
    data,
  })
}
```

**What it does:**
- Returns a single resource (one patient, one medication, one appointment)
- Wraps the data in standardized envelope
- Allows custom HTTP status (defaults to 200 OK)

**Type safety:**
- Generic `<T>` ensures data type is preserved
- TypeScript knows the exact shape of what's being returned
- Frontend gets full autocomplete on response.data

**Usage examples:**

```typescript
// Get single patient
app.get('/api/patients/:id', (req, res) => {
  const patient = db.getPatient(req.params.id)
  return okItem(res, patient)
})

// Response:
{
  "version": "v1",
  "data": {
    "id": "patient-123",
    "name": "John Doe",
    "age": 75
  }
}

// Create new medication (201 Created)
app.post('/api/medications', (req, res) => {
  const medication = db.createMedication(req.body)
  return okItem(res, medication, 201)  // 201 = Created
})
```

**When to use:**
- GET /resource/:id (fetch single item)
- POST /resource (create new item)
- PUT /resource/:id (update item)
- Any endpoint returning ONE thing

---

### 2. okList() - Collection Response (Lines 25-30)

```typescript
export function okList<T>(res: Response, data: T[], status = 200): Response<ApiSuccessList<T> & { data: T[] }> {
  return res.status(status).json({
    version: API_VERSION,
    data,
  })
}
```

**What it does:**
- Returns an array of resources (list of patients, medications, appointments)
- Enforces `data` is an array with `T[]` type
- Same standardized envelope as okItem

**Usage examples:**

```typescript
// Get all patients
app.get('/api/patients', (req, res) => {
  const patients = db.getAllPatients()
  return okList(res, patients)
})

// Response:
{
  "version": "v1",
  "data": [
    { "id": "patient-123", "name": "John Doe" },
    { "id": "patient-456", "name": "Jane Smith" }
  ]
}

// Get patient's medications (filtered)
app.get('/api/medications', (req, res) => {
  const meds = db.getMedicationsByPatient(req.query.patient_id)
  return okList(res, meds)
})

// Response with empty array (still valid!)
{
  "version": "v1",
  "data": []
}
```

**When to use:**
- GET /resources (fetch all items)
- GET /resources?filter=value (fetch filtered items)
- Any endpoint returning MULTIPLE things

**Note on pagination:**
- Current implementation returns full array
- Future enhancement: Add `meta` field with pagination info
```typescript
{
  version: "v1",
  data: [...],
  meta: {
    total: 100,
    page: 1,
    perPage: 20
  }
}
```

---

### 3. okDeleted() - Deletion Confirmation (Lines 32-37)

```typescript
export function okDeleted(res: Response): Response<ApiDeleted> {
  return res.status(200).json({
    version: API_VERSION,
    ok: true,
  })
}
```

**What it does:**
- Confirms successful deletion
- Returns minimal payload (just `ok: true`)
- Uses 200 OK (not 204 No Content) to include JSON body

**Usage examples:**

```typescript
// Delete patient
app.delete('/api/patients/:id', (req, res) => {
  db.deletePatient(req.params.id)
  return okDeleted(res)
})

// Response:
{
  "version": "v1",
  "ok": true
}
```

**Why not 204 No Content?**
- 204 means "no response body" - browser can't read JSON
- Harder to handle in frontend (need to check status code)
- Inconsistent with other endpoints that return JSON
- 200 + `ok: true` is more frontend-friendly

**When to use:**
- DELETE /resource/:id
- Any destructive operation that doesn't return data

---

## Error Response Helper

### err() - Standardized Error Response (Lines 41-60)

```typescript
export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'FORBIDDEN'
  | 'INTERNAL'

export function err(
  res: Response,
  httpStatus: number,
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>
): Response<ApiErrorResponse> {
  const payload: ApiErrorPayload = { code, message, ...(details ? { details } : {}) }
  return res.status(httpStatus).json({
    version: API_VERSION,
    error: payload,
  })
}
```

**What it does:**
- Returns standardized error response
- Includes both HTTP status AND application error code
- Optional `details` object for extra context

**Error Code Mapping:**

| ErrorCode | HTTP Status | Meaning | Example |
|-----------|-------------|---------|---------|
| `VALIDATION_ERROR` | 400 | Bad request data | Missing required field |
| `NOT_FOUND` | 404 | Resource doesn't exist | Patient ID not in DB |
| `CONFLICT` | 409 | Constraint violation | Duplicate email |
| `FORBIDDEN` | 403 | Not authorized | Can't delete other user's data |
| `INTERNAL` | 500 | Server error | Database connection failed |

**Why both HTTP status AND error code?**
- **HTTP status**: Standard protocol for browsers/proxies
- **Error code**: Application-level detail for frontend logic

**Usage examples:**

```typescript
// Patient not found
app.get('/api/patients/:id', (req, res) => {
  const patient = db.getPatient(req.params.id)
  if (!patient) {
    return err(res, 404, 'NOT_FOUND', 'Patient not found')
  }
  return okItem(res, patient)
})

// Response:
{
  "version": "v1",
  "error": {
    "code": "NOT_FOUND",
    "message": "Patient not found"
  }
}

// Validation error with details
app.post('/api/patients', (req, res) => {
  if (!req.body.name) {
    return err(res, 400, 'VALIDATION_ERROR', 'Missing required fields', {
      missing: ['name']
    })
  }
  // ...create patient
})

// Response:
{
  "version": "v1",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Missing required fields",
    "details": {
      "missing": ["name"]
    }
  }
}

// Database constraint violation
app.post('/api/patients', (req, res) => {
  try {
    db.createPatient(req.body)
  } catch (e) {
    if (e.code === 'SQLITE_CONSTRAINT') {
      return err(res, 409, 'CONFLICT', 'Email already exists', {
        field: 'email'
      })
    }
  }
})
```

**Frontend handling:**
```typescript
const response = await fetch('/api/patients/123')
const data = await response.json()

if (data.error) {
  switch (data.error.code) {
    case 'NOT_FOUND':
      showNotification('Patient not found')
      break
    case 'VALIDATION_ERROR':
      showErrors(data.error.details.issues)
      break
    case 'INTERNAL':
      showNotification('Server error, please try again')
      break
  }
}
```

---

## Automatic Error Handler

### handleCaughtError() - Smart Error Detection (Lines 62-90)

```typescript
export function handleCaughtError(
  res: Response,
  error: unknown,
  details?: Record<string, unknown>
): Response<ApiErrorResponse> {
  if (error instanceof ZodError) {
    return err(res, 400, 'VALIDATION_ERROR', 'Invalid request payload', {
      issues: error.issues,
      ...(details || {}),
    })
  }

  if (isSqliteConstraint(error)) {
    return err(res, 409, 'CONFLICT', 'Resource conflict', {
      cause: 'constraint_violation',
      raw: errorToJSON(error),
      ...(details || {}),
    })
  }

  if (error instanceof Error) {
    return err(res, 500, 'INTERNAL', error.message, details)
  }

  return err(res, 500, 'INTERNAL', 'Unexpected error', details)
}
```

**What it does:**
- Automatically detects error type
- Maps to appropriate HTTP status and error code
- Extracts useful details from the error

**Decision flow:**
```
1. Is it a ZodError?
   → 400 VALIDATION_ERROR with validation issues

2. Is it a SQLite constraint error?
   → 409 CONFLICT with constraint details

3. Is it a standard Error object?
   → 500 INTERNAL with error message

4. Is it something else? (string, null, undefined, etc.)
   → 500 INTERNAL with generic message
```

**Usage in routers:**

```typescript
// Manual error handling (tedious!)
app.post('/api/patients', (req, res) => {
  try {
    const patient = createPatientSchema.parse(req.body)  // Zod validation
    db.createPatient(patient)
  } catch (error) {
    if (error instanceof ZodError) {
      return err(res, 400, 'VALIDATION_ERROR', 'Invalid data', { issues: error.issues })
    }
    if (error.code === 'SQLITE_CONSTRAINT') {
      return err(res, 409, 'CONFLICT', 'Constraint violation')
    }
    return err(res, 500, 'INTERNAL', 'Unknown error')
  }
})

// With handleCaughtError (clean!)
app.post('/api/patients', (req, res) => {
  try {
    const patient = createPatientSchema.parse(req.body)
    db.createPatient(patient)
  } catch (error) {
    return handleCaughtError(res, error, { operation: 'create_patient' })
  }
})
```

**Error examples:**

**Zod validation error:**
```typescript
// Input: { name: 123 }  (should be string)
// Response:
{
  "version": "v1",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request payload",
    "details": {
      "issues": [
        {
          "path": ["name"],
          "message": "Expected string, received number"
        }
      ]
    }
  }
}
```

**SQLite constraint error:**
```typescript
// Trying to insert duplicate email
// Response:
{
  "version": "v1",
  "error": {
    "code": "CONFLICT",
    "message": "Resource conflict",
    "details": {
      "cause": "constraint_violation",
      "raw": {
        "code": "SQLITE_CONSTRAINT_UNIQUE",
        "message": "UNIQUE constraint failed: patients.email"
      }
    }
  }
}
```

**Generic error:**
```typescript
// Database connection lost
// Response:
{
  "version": "v1",
  "error": {
    "code": "INTERNAL",
    "message": "Connection refused",
    "details": {
      "operation": "create_patient"
    }
  }
}
```

---

## Utility Functions

### isSqliteConstraint() (Lines 94-97)

```typescript
function isSqliteConstraint(e: unknown): boolean {
  const code = (e as any)?.code
  return code === 'SQLITE_CONSTRAINT' || code === 'SQLITE_CONSTRAINT_UNIQUE'
}
```

**What it does:**
- Checks if error is from SQLite constraint violation
- Handles both generic constraint and unique constraint errors
- Type-safe with `unknown` parameter

**SQLite constraint types:**
- `SQLITE_CONSTRAINT`: General constraint (foreign key, check, etc.)
- `SQLITE_CONSTRAINT_UNIQUE`: Unique constraint (duplicate value)

**Why detect this specifically?**
- Constraint violations are **user errors**, not server errors
- Should return 409 Conflict (not 500 Internal Error)
- Frontend can show helpful message: "Email already exists"

---

### errorToJSON() (Lines 101-110)

```typescript
function errorToJSON(e: unknown) {
  if (!e || typeof e !== 'object') return { message: String(e) }
  const anyErr = e as any
  return {
    name: anyErr.name,
    message: anyErr.message,
    code: anyErr.code,
    stack: anyErr.stack,
  }
}
```

**What it does:**
- Safely converts Error objects to plain JSON
- Extracts key properties (name, message, code, stack)
- Handles non-object errors (strings, numbers, null)

**Why needed?**
- Error objects don't serialize to JSON correctly:
```typescript
JSON.stringify(new Error('test'))
// Result: "{}"  😱 All info lost!

errorToJSON(new Error('test'))
// Result: { name: 'Error', message: 'test', stack: '...' } ✅
```

**Use in error responses:**
```typescript
{
  "error": {
    "code": "CONFLICT",
    "details": {
      "raw": {
        "name": "SqliteError",
        "message": "UNIQUE constraint failed",
        "code": "SQLITE_CONSTRAINT_UNIQUE",
        "stack": "SqliteError: UNIQUE constraint...\n  at Database.prepare..."
      }
    }
  }
}
```

**Security note:**
- Stack traces included in error details
- In production, consider stripping stacks to prevent information leakage
- Could add environment check: `stack: process.env.NODE_ENV === 'development' ? anyErr.stack : undefined`

---

## Complete Usage Example

### Router using all helpers:

```typescript
import { Router } from 'express'
import { z } from 'zod'
import { okItem, okList, okDeleted, err, handleCaughtError } from '../utils/apiContract'

const router = Router()

// Schema
const patientSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().min(0).max(150)
})

// GET /api/patients (list)
router.get('/', (req, res) => {
  try {
    const patients = db.getAllPatients()
    return okList(res, patients)  // Returns array
  } catch (error) {
    return handleCaughtError(res, error)
  }
})

// GET /api/patients/:id (single)
router.get('/:id', (req, res) => {
  try {
    const patient = db.getPatient(req.params.id)
    
    if (!patient) {
      return err(res, 404, 'NOT_FOUND', 'Patient not found')  // Manual error
    }
    
    return okItem(res, patient)  // Returns single object
  } catch (error) {
    return handleCaughtError(res, error)
  }
})

// POST /api/patients (create)
router.post('/', (req, res) => {
  try {
    const validated = patientSchema.parse(req.body)  // Zod validates
    const patient = db.createPatient(validated)
    return okItem(res, patient, 201)  // 201 Created
  } catch (error) {
    return handleCaughtError(res, error)  // Handles ZodError + SQLite
  }
})

// DELETE /api/patients/:id
router.delete('/:id', (req, res) => {
  try {
    const exists = db.getPatient(req.params.id)
    
    if (!exists) {
      return err(res, 404, 'NOT_FOUND', 'Patient not found')
    }
    
    db.deletePatient(req.params.id)
    return okDeleted(res)  // Returns ok: true
  } catch (error) {
    return handleCaughtError(res, error)
  }
})
```

---

## Response Format Summary

### Success Responses

**Single item:**
```json
{
  "version": "v1",
  "data": { "id": "123", "name": "John" }
}
```

**List of items:**
```json
{
  "version": "v1",
  "data": [
    { "id": "123", "name": "John" },
    { "id": "456", "name": "Jane" }
  ]
}
```

**Deletion confirmation:**
```json
{
  "version": "v1",
  "ok": true
}
```

### Error Responses

**Minimal error:**
```json
{
  "version": "v1",
  "error": {
    "code": "NOT_FOUND",
    "message": "Patient not found"
  }
}
```

**Error with details:**
```json
{
  "version": "v1",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request payload",
    "details": {
      "issues": [
        { "path": ["email"], "message": "Invalid email format" }
      ]
    }
  }
}
```

---

## Benefits of This System

### 1. **Consistency**
- Every endpoint speaks the same language
- Frontend knows exactly what shape to expect
- No special cases or exceptions

### 2. **Type Safety**
- TypeScript ensures correct usage
- Can't accidentally send wrong format
- Autocomplete on error codes

### 3. **Error Handling**
- Automatic detection of common errors
- Consistent error codes across app
- Rich context for debugging

### 4. **Versioning**
- Can evolve API without breaking clients
- Clients can detect version mismatches
- Gradual migration path

### 5. **Developer Experience**
- Simple, obvious functions
- Self-documenting code
- Less boilerplate in routers

### 6. **Frontend Friendly**
- Predictable response shape
- Easy to parse and handle
- Clear error messages

---

## Common Patterns

### Pattern 1: Try-Catch with Auto-Handle
```typescript
router.post('/', (req, res) => {
  try {
    // Validation + DB operation
    const data = schema.parse(req.body)
    const result = db.create(data)
    return okItem(res, result, 201)
  } catch (error) {
    return handleCaughtError(res, error)  // Handles everything!
  }
})
```

### Pattern 2: Explicit Error Checks
```typescript
router.get('/:id', (req, res) => {
  const item = db.get(req.params.id)
  
  if (!item) {
    return err(res, 404, 'NOT_FOUND', 'Item not found')  // Explicit
  }
  
  return okItem(res, item)
})
```

### Pattern 3: Business Logic Errors
```typescript
router.post('/transfer', (req, res) => {
  const { amount, from, to } = req.body
  
  if (from.balance < amount) {
    return err(res, 400, 'VALIDATION_ERROR', 'Insufficient funds', {
      balance: from.balance,
      requested: amount
    })
  }
  
  // Proceed with transfer...
})
```

---

## Future Enhancements

### 1. **Pagination Support**
```typescript
export function okListPaginated<T>(
  res: Response,
  data: T[],
  meta: { total: number; page: number; perPage: number }
) {
  return res.status(200).json({
    version: API_VERSION,
    data,
    meta
  })
}
```

### 2. **More Error Codes**
```typescript
type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'FORBIDDEN'
  | 'UNAUTHORIZED'      // New: Not logged in
  | 'RATE_LIMITED'      // New: Too many requests
  | 'SERVICE_UNAVAILABLE'  // New: External service down
  | 'INTERNAL'
```

### 3. **Warning Messages**
```typescript
// Success with warnings
{
  "version": "v1",
  "data": {...},
  "warnings": [
    { "code": "DEPRECATION", "message": "This field will be removed in v2" }
  ]
}
```

### 4. **Request IDs**
```typescript
// Every response includes request ID for tracing
{
  "version": "v1",
  "requestId": "req-123-456-789",
  "data": {...}
}
```

---

## Summary

**apiContract.ts is the communication protocol** between backend and frontend:

- **3 success helpers**: okItem, okList, okDeleted
- **1 error helper**: err (with 5 standard error codes)
- **1 smart handler**: handleCaughtError (auto-detects error types)
- **2 utilities**: isSqliteConstraint, errorToJSON

All responses follow the same structure:
- Include version
- Wrap data in predictable envelope
- Provide machine-readable error codes
- Include debugging details when needed

This creates a **reliable contract** that both backend and frontend can trust.
