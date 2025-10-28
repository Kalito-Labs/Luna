# api.ts - API Contract Type Definitions

## Overview
`api.ts` defines the core TypeScript types for Kalito's standardized API response format. These types ensure consistent error handling and data envelope structures across all backend endpoints.

---

## Constants

### API_CONTRACT_VERSION (Line 2)

```typescript
export const API_CONTRACT_VERSION = '1' as const
```

**What it is:** Version identifier for the API contract

**Purpose:**
- Track API breaking changes
- Enable backward compatibility
- Client-side version detection

**Type:** `'1'` (literal type, not just `string`)

**Why `as const`?**
```typescript
// Without 'as const'
const version = '1'  // Type: string

// With 'as const'
const version = '1' as const  // Type: '1' (literal)
```

**Benefits:**
- TypeScript knows exact value
- Can't accidentally change to '2'
- Type guards work better

**Usage:**
```typescript
// Client checks version
const response = await fetch('/api/patients')
const data = await response.json()

if (data.version !== API_CONTRACT_VERSION) {
  console.warn('API version mismatch!')
}
```

---

## Error Types

### ApiErrorCode (Lines 4-9)

```typescript
export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'FORBIDDEN'
  | 'INTERNAL'
```

**What it is:** Union type of all possible error codes

**Purpose:**
- Type-safe error handling
- Consistent error categorization
- Frontend error routing

---

#### Error Code Reference

| Code | HTTP Status | Meaning | Example |
|------|-------------|---------|---------|
| **VALIDATION_ERROR** | 400 | Invalid input data | Missing required field, wrong type |
| **NOT_FOUND** | 404 | Resource doesn't exist | Patient ID doesn't exist |
| **CONFLICT** | 409 | Resource state conflict | Duplicate email, constraint violation |
| **FORBIDDEN** | 403 | Insufficient permissions | User can't delete this resource |
| **INTERNAL** | 500 | Server error | Database crash, unhandled exception |

---

#### VALIDATION_ERROR

**When to use:**
- Zod schema validation fails
- Missing required fields
- Invalid data types
- Format errors (email, phone, date)

**Example:**
```typescript
// Request:
POST /api/patients
{
  "name": "",
  "age": -5
}

// Response:
{
  "version": "1",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      { "path": ["name"], "message": "String must contain at least 1 character" },
      { "path": ["age"], "message": "Number must be greater than 0" }
    ]
  }
}
```

---

#### NOT_FOUND

**When to use:**
- Resource doesn't exist
- Invalid ID
- Deleted resource

**Example:**
```typescript
// Request:
GET /api/patients/nonexistent-id

// Response:
{
  "version": "1",
  "error": {
    "code": "NOT_FOUND",
    "message": "Patient not found"
  }
}
```

---

#### CONFLICT

**When to use:**
- Duplicate unique fields (email, ID)
- SQLite constraint violations
- Concurrent modification conflicts

**Example:**
```typescript
// Request:
POST /api/patients
{
  "email": "existing@example.com"  // Already exists
}

// Response:
{
  "version": "1",
  "error": {
    "code": "CONFLICT",
    "message": "Resource conflict (duplicate or constraint violation)"
  }
}
```

---

#### FORBIDDEN

**When to use:**
- User lacks permissions
- Action not allowed in current state
- Authorization failures (not authentication)

**Example:**
```typescript
// Request:
DELETE /api/patients/123  // User is not admin

// Response:
{
  "version": "1",
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions to delete patient"
  }
}
```

**Note:** Currently not heavily used in Kalito (no complex auth), but reserved for future use.

---

#### INTERNAL

**When to use:**
- Database errors
- Unexpected exceptions
- Third-party API failures
- File system errors

**Example:**
```typescript
// Database connection lost
{
  "version": "1",
  "error": {
    "code": "INTERNAL",
    "message": "Database connection failed"
  }
}
```

**Security note:** Don't leak sensitive details (stack traces, SQL queries) in production.

---

### Type Safety Benefits

```typescript
// ✅ TypeScript enforces valid codes
const error: ApiErrorCode = 'VALIDATION_ERROR'  // OK
const error: ApiErrorCode = 'INVALID_CODE'      // ❌ Error

// ✅ Exhaustive switch handling
function handleError(code: ApiErrorCode) {
  switch (code) {
    case 'VALIDATION_ERROR':
      return showValidationErrors()
    case 'NOT_FOUND':
      return show404Page()
    case 'CONFLICT':
      return showConflictDialog()
    case 'FORBIDDEN':
      return show403Page()
    case 'INTERNAL':
      return showErrorPage()
    // TypeScript ensures all cases covered
  }
}
```

---

## Error Response Types

### ApiErrorPayload (Lines 11-15)

```typescript
export interface ApiErrorPayload {
  code: ApiErrorCode
  message: string
  details?: Record<string, unknown>
}
```

**What it is:** The error object embedded in error responses

---

#### Property: code
```typescript
code: ApiErrorCode
```

**What it is:** Machine-readable error category

**Example:**
```typescript
code: "VALIDATION_ERROR"
```

**Use cases:**
- Frontend error routing (switch on code)
- Analytics (group errors by code)
- Internationalization (map code to translated message)

---

#### Property: message
```typescript
message: string
```

**What it is:** Human-readable error description

**Example:**
```typescript
message: "Invalid request data"
```

**Best practices:**
- Clear, actionable messages
- Don't expose internal details
- Consider user-facing language

---

#### Property: details
```typescript
details?: Record<string, unknown>
```

**What it is:** Optional structured error context

**Example 1: Zod validation errors**
```typescript
details: [
  { path: ["email"], message: "Invalid email format" },
  { path: ["age"], message: "Number must be positive" }
]
```

**Example 2: Custom context**
```typescript
details: {
  field: "email",
  value: "invalid-email",
  constraint: "unique",
  suggestion: "Use a different email address"
}
```

**Use cases:**
- Field-specific validation errors
- Multi-field forms (show errors next to inputs)
- Debugging (additional context)

---

### ApiErrorResponse (Lines 17-20)

```typescript
export interface ApiErrorResponse {
  version: typeof API_CONTRACT_VERSION
  error: ApiErrorPayload
}
```

**What it is:** Complete error response envelope

**Structure:**
```typescript
{
  version: "1",           // API version
  error: {                // Error payload
    code: "...",
    message: "...",
    details: { ... }
  }
}
```

**Example:**
```typescript
const errorResponse: ApiErrorResponse = {
  version: "1",
  error: {
    code: "VALIDATION_ERROR",
    message: "Invalid patient data",
    details: [
      { path: ["name"], message: "Required" },
      { path: ["email"], message: "Invalid email" }
    ]
  }
}
```

---

## Success Response Types

### ApiSuccessItem<T> (Lines 22-25)

```typescript
export interface ApiSuccessItem<T> {
  version: typeof API_CONTRACT_VERSION
  data: T
}
```

**What it is:** Response envelope for **single resource**

**Generic parameter `<T>`:** The resource type

**Example:**
```typescript
// GET /api/patients/123
const response: ApiSuccessItem<Patient> = {
  version: "1",
  data: {
    id: "123",
    name: "John Doe",
    email: "john@example.com",
    age: 75
  }
}
```

**Use cases:**
- GET single resource (`/api/patients/:id`)
- POST create resource (`/api/patients`)
- PUT update resource (`/api/patients/:id`)

---

#### Generic Type Example

```typescript
// Patient type
interface Patient {
  id: string
  name: string
  email: string
}

// Response type is inferred
const response: ApiSuccessItem<Patient> = {
  version: "1",
  data: {
    id: "123",
    name: "John Doe",
    email: "john@example.com"
  }
}

// TypeScript knows data.name is a string
console.log(response.data.name.toUpperCase())  // ✅ OK
console.log(response.data.age)  // ❌ Error: Property 'age' doesn't exist
```

---

### ApiSuccessList<T> (Lines 27-30)

```typescript
export interface ApiSuccessList<T> {
  version: typeof API_CONTRACT_VERSION
  data: T[]
}
```

**What it is:** Response envelope for **collections/arrays**

**Generic parameter `<T>`:** The resource type (array of T)

**Example:**
```typescript
// GET /api/patients
const response: ApiSuccessList<Patient> = {
  version: "1",
  data: [
    { id: "123", name: "John Doe", email: "john@example.com" },
    { id: "456", name: "Jane Smith", email: "jane@example.com" }
  ]
}
```

**Use cases:**
- GET list resources (`/api/patients`)
- GET filtered results (`/api/patients?age_gt=65`)
- Bulk operations (`POST /api/patients/bulk`)

---

#### Array Methods Work

```typescript
const response: ApiSuccessList<Patient> = {
  version: "1",
  data: [...]
}

// ✅ TypeScript knows data is an array
response.data.forEach(patient => console.log(patient.name))
response.data.filter(p => p.age > 70)
response.data.map(p => p.email)

console.log(response.data.length)  // ✅ OK
```

---

### ApiDeleted (Lines 32-35)

```typescript
export interface ApiDeleted {
  version: typeof API_CONTRACT_VERSION
  ok: true
}
```

**What it is:** Response envelope for **delete operations**

**Example:**
```typescript
// DELETE /api/patients/123
const response: ApiDeleted = {
  version: "1",
  ok: true
}
```

**Why `ok: true`?**
- Confirmation of successful deletion
- Distinguishes from error responses
- Consistent response shape

**Alternative approaches (not used in Kalito):**
```typescript
// Some APIs return 204 No Content (empty body)
// Some return the deleted resource
// Kalito uses { ok: true } for consistency
```

---

## Complete Usage Examples

### Example 1: GET Single Resource

```typescript
// Backend
router.get('/api/patients/:id', (req, res) => {
  const patient = db.getPatient(req.params.id)
  
  if (!patient) {
    const error: ApiErrorResponse = {
      version: API_CONTRACT_VERSION,
      error: {
        code: 'NOT_FOUND',
        message: 'Patient not found'
      }
    }
    return res.status(404).json(error)
  }
  
  const success: ApiSuccessItem<Patient> = {
    version: API_CONTRACT_VERSION,
    data: patient
  }
  return res.status(200).json(success)
})
```

```typescript
// Frontend
async function getPatient(id: string): Promise<Patient> {
  const response = await fetch(`/api/patients/${id}`)
  const data: ApiSuccessItem<Patient> | ApiErrorResponse = await response.json()
  
  if ('error' in data) {
    throw new Error(data.error.message)
  }
  
  return data.data
}
```

---

### Example 2: GET List

```typescript
// Backend
router.get('/api/patients', (req, res) => {
  const patients = db.getAllPatients()
  
  const success: ApiSuccessList<Patient> = {
    version: API_CONTRACT_VERSION,
    data: patients
  }
  return res.status(200).json(success)
})
```

```typescript
// Frontend
async function getPatients(): Promise<Patient[]> {
  const response = await fetch('/api/patients')
  const data: ApiSuccessList<Patient> = await response.json()
  return data.data
}
```

---

### Example 3: POST Create

```typescript
// Backend
router.post('/api/patients', (req, res) => {
  try {
    const validated = createPatientSchema.parse(req.body)
    const patient = db.createPatient(validated)
    
    const success: ApiSuccessItem<Patient> = {
      version: API_CONTRACT_VERSION,
      data: patient
    }
    return res.status(201).json(success)
  } catch (error) {
    if (error instanceof ZodError) {
      const errorResponse: ApiErrorResponse = {
        version: API_CONTRACT_VERSION,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid patient data',
          details: error.errors
        }
      }
      return res.status(400).json(errorResponse)
    }
    throw error
  }
})
```

---

### Example 4: DELETE

```typescript
// Backend
router.delete('/api/patients/:id', (req, res) => {
  const result = db.deletePatient(req.params.id)
  
  if (result.changes === 0) {
    const error: ApiErrorResponse = {
      version: API_CONTRACT_VERSION,
      error: {
        code: 'NOT_FOUND',
        message: 'Patient not found'
      }
    }
    return res.status(404).json(error)
  }
  
  const success: ApiDeleted = {
    version: API_CONTRACT_VERSION,
    ok: true
  }
  return res.status(200).json(success)
})
```

```typescript
// Frontend
async function deletePatient(id: string): Promise<void> {
  const response = await fetch(`/api/patients/${id}`, { method: 'DELETE' })
  const data: ApiDeleted | ApiErrorResponse = await response.json()
  
  if ('error' in data) {
    throw new Error(data.error.message)
  }
  
  // Success - data.ok === true
}
```

---

## Type Guards

### Checking Response Type

```typescript
function isErrorResponse(data: unknown): data is ApiErrorResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'error' in data &&
    'version' in data
  )
}

function isSuccessItem<T>(data: unknown): data is ApiSuccessItem<T> {
  return (
    typeof data === 'object' &&
    data !== null &&
    'data' in data &&
    'version' in data &&
    !Array.isArray((data as any).data)
  )
}

function isSuccessList<T>(data: unknown): data is ApiSuccessList<T> {
  return (
    typeof data === 'object' &&
    data !== null &&
    'data' in data &&
    'version' in data &&
    Array.isArray((data as any).data)
  )
}
```

**Usage:**
```typescript
const response = await fetch('/api/patients')
const data = await response.json()

if (isErrorResponse(data)) {
  console.error(data.error.message)
} else if (isSuccessList<Patient>(data)) {
  console.log(`Found ${data.data.length} patients`)
}
```

---

## Integration with apiContract.ts

These types are used by the helper functions in `apiContract.ts`:

```typescript
// apiContract.ts uses these types internally
import type { ApiSuccessItem, ApiSuccessList, ApiDeleted, ApiErrorResponse } from './types/api'

export function okItem<T>(res: Response, item: T, statusCode = 200): Response {
  const response: ApiSuccessItem<T> = {
    version: API_CONTRACT_VERSION,
    data: item
  }
  return res.status(statusCode).json(response)
}

export function okList<T>(res: Response, items: T[], statusCode = 200): Response {
  const response: ApiSuccessList<T> = {
    version: API_CONTRACT_VERSION,
    data: items
  }
  return res.status(statusCode).json(response)
}

export function okDeleted(res: Response): Response {
  const response: ApiDeleted = {
    version: API_CONTRACT_VERSION,
    ok: true
  }
  return res.status(200).json(response)
}

export function err(
  res: Response,
  code: ApiErrorCode,
  message: string,
  details?: Record<string, unknown>
): Response {
  const response: ApiErrorResponse = {
    version: API_CONTRACT_VERSION,
    error: { code, message, details }
  }
  const statusCode = errorCodeToStatus(code)
  return res.status(statusCode).json(response)
}
```

---

## Best Practices

### 1. Always Include Version
```typescript
// ✅ Good
{
  version: "1",
  data: { ... }
}

// ❌ Bad
{
  data: { ... }
}
```

### 2. Use Appropriate Error Codes
```typescript
// ✅ Good - specific error codes
if (!patient) return err(res, 'NOT_FOUND', 'Patient not found')
if (duplicateEmail) return err(res, 'CONFLICT', 'Email already exists')

// ❌ Bad - generic error code
if (!patient) return err(res, 'INTERNAL', 'Error')
```

### 3. Provide Helpful Error Messages
```typescript
// ✅ Good - actionable
message: "Patient not found. Please check the ID and try again."

// ❌ Bad - vague
message: "Error"
```

### 4. Include Details for Validation Errors
```typescript
// ✅ Good - field-specific details
error: {
  code: 'VALIDATION_ERROR',
  message: 'Invalid patient data',
  details: [
    { path: ["email"], message: "Invalid email format" },
    { path: ["age"], message: "Must be a positive number" }
  ]
}

// ❌ Bad - no context
error: {
  code: 'VALIDATION_ERROR',
  message: 'Invalid data'
}
```

### 5. Type Frontend Responses
```typescript
// ✅ Good - type-safe
async function fetchPatient(id: string): Promise<Patient> {
  const response = await fetch(`/api/patients/${id}`)
  const data: ApiSuccessItem<Patient> | ApiErrorResponse = await response.json()
  
  if ('error' in data) {
    throw new Error(data.error.message)
  }
  
  return data.data  // TypeScript knows this is Patient
}

// ❌ Bad - untyped
async function fetchPatient(id: string): Promise<any> {
  const response = await fetch(`/api/patients/${id}`)
  return await response.json()  // No type safety!
}
```

---

## Frontend Error Handling

### Centralized Error Handler

```typescript
async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options)
  const data: ApiSuccessItem<T> | ApiSuccessList<T> | ApiErrorResponse = await response.json()
  
  if ('error' in data) {
    switch (data.error.code) {
      case 'VALIDATION_ERROR':
        throw new ValidationError(data.error.message, data.error.details)
      case 'NOT_FOUND':
        throw new NotFoundError(data.error.message)
      case 'CONFLICT':
        throw new ConflictError(data.error.message)
      case 'FORBIDDEN':
        throw new ForbiddenError(data.error.message)
      case 'INTERNAL':
        throw new InternalError(data.error.message)
    }
  }
  
  return 'data' in data ? data.data : (data as any)
}

// Usage
try {
  const patient = await apiRequest<Patient>('/api/patients/123')
  console.log(patient.name)
} catch (error) {
  if (error instanceof NotFoundError) {
    showNotFoundPage()
  } else if (error instanceof ValidationError) {
    showValidationErrors(error.details)
  }
}
```

---

## Migration & Versioning

### When to Bump API Version

**Bump version (1 → 2) when:**
- Changing response structure (e.g., removing `data` envelope)
- Renaming fields in responses
- Changing error code semantics

**Don't bump version when:**
- Adding optional fields
- Adding new error codes
- Improving error messages

### Supporting Multiple Versions

```typescript
// Backend: Support v1 and v2
router.get('/api/patients/:id', (req, res) => {
  const patient = db.getPatient(req.params.id)
  const apiVersion = req.headers['api-version'] || '1'
  
  if (apiVersion === '1') {
    return res.json({
      version: '1',
      data: patient
    })
  } else if (apiVersion === '2') {
    return res.json({
      version: '2',
      patient: patient  // Different structure
    })
  }
})
```

---

## Summary

**api.ts defines Kalito's core API contract:**

### Constants
- **API_CONTRACT_VERSION**: Version tracking ('1')

### Error Types
- **ApiErrorCode**: 5 error categories (VALIDATION_ERROR, NOT_FOUND, CONFLICT, FORBIDDEN, INTERNAL)
- **ApiErrorPayload**: Error structure (code, message, details)
- **ApiErrorResponse**: Error envelope

### Success Types
- **ApiSuccessItem<T>**: Single resource envelope
- **ApiSuccessList<T>**: Collection envelope
- **ApiDeleted**: Deletion confirmation

**Benefits:**
- Consistent response format across all endpoints
- Type-safe error handling
- Easy frontend integration
- Versioning support
- Clear error categorization

**All responses follow the pattern:**
```typescript
{
  version: "1",
  data: T | T[] | ok: true | error: { ... }
}
```
