# routerHelpers.ts - Router Utilities

## Overview
`routerHelpers.ts` provides essential utilities for Express route handlers, focusing on centralized error handling and unique ID generation. These helpers ensure consistent error responses and enable request tracing across the application.

---

## File Contents (Lines 1-100)

```typescript
import type { Response } from 'express'
import { ZodError } from 'zod'
import { err } from './apiContract'

/**
 * Centralized error handling for route handlers.
 * Automatically detects error types and returns appropriate HTTP responses.
 */
export function handleRouterError(res: Response, error: unknown): Response {
  // Zod validation errors
  if (error instanceof ZodError) {
    return err(res, 'VALIDATION_ERROR', 'Invalid request data', error.errors)
  }

  // SQLite constraint violations (UNIQUE, FOREIGN KEY, etc.)
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error.code === 'SQLITE_CONSTRAINT' || error.code === 'SQLITE_CONSTRAINT_UNIQUE')
  ) {
    return err(res, 'CONFLICT', 'Resource conflict (duplicate or constraint violation)')
  }

  // Generic errors
  if (error instanceof Error) {
    return err(res, 'INTERNAL', error.message)
  }

  // Unknown error type
  return err(res, 'INTERNAL', 'An unexpected error occurred')
}

/**
 * Generates unique IDs for database records and request tracking.
 * Format: timestamp + random string
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}
```

---

## Part 1: handleRouterError()

### Purpose (Lines 6-11)
```typescript
/**
 * Centralized error handling for route handlers.
 * Automatically detects error types and returns appropriate HTTP responses.
 */
export function handleRouterError(res: Response, error: unknown): Response
```

**What it does:**
- Single function to handle **all** router errors
- Detects error type and maps to appropriate HTTP status
- Returns standardized API error response

**Why it matters:**
- **Consistency**: All routes handle errors the same way
- **DRY**: No duplicate error handling in every route
- **Type safety**: Detects specific error types (Zod, SQLite)

**Without handleRouterError:**
```typescript
// Every route needs this boilerplate:
try {
  const patient = await createPatient(data)
  return okItem(res, patient)
} catch (error) {
  if (error instanceof ZodError) {
    return err(res, 'VALIDATION_ERROR', 'Invalid data', error.errors)
  }
  if (error.code === 'SQLITE_CONSTRAINT') {
    return err(res, 'CONFLICT', 'Duplicate record')
  }
  if (error instanceof Error) {
    return err(res, 'INTERNAL', error.message)
  }
  return err(res, 'INTERNAL', 'Unknown error')
}
```

**With handleRouterError:**
```typescript
// Clean and consistent:
try {
  const patient = await createPatient(data)
  return okItem(res, patient)
} catch (error) {
  return handleRouterError(res, error)
}
```

---

### Error Detection Logic

The function uses a **waterfall pattern** - checks specific errors first, falls back to generic handling.

---

#### Detection 1: Zod Validation Errors (Lines 13-15)

```typescript
if (error instanceof ZodError) {
  return err(res, 'VALIDATION_ERROR', 'Invalid request data', error.errors)
}
```

**What it detects:**
- Errors from Zod schema validation
- Triggered by `.parse()` or `.safeParse()` in route handlers

**When it triggers:**
```typescript
const createPatientSchema = z.object({
  name: z.string().min(1),
  age: z.number().int().positive()
})

// User sends: { name: "", age: -5 }
const validated = createPatientSchema.parse(req.body)  // Throws ZodError
```

**ZodError structure:**
```typescript
{
  name: "ZodError",
  issues: [
    {
      code: "too_small",
      minimum: 1,
      type: "string",
      path: ["name"],
      message: "String must contain at least 1 character(s)"
    },
    {
      code: "too_small",
      minimum: 0,
      type: "number",
      path: ["age"],
      message: "Number must be greater than 0"
    }
  ]
}
```

**Response sent:**
```json
{
  "version": 1,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      {
        "code": "too_small",
        "minimum": 1,
        "type": "string",
        "path": ["name"],
        "message": "String must contain at least 1 character(s)"
      },
      {
        "code": "too_small",
        "minimum": 0,
        "type": "number",
        "path": ["age"],
        "message": "Number must be greater than 0"
      }
    ]
  }
}
```

**HTTP status:** 400 Bad Request

**Why this matters:**
- Frontend can show **field-specific** errors
- User knows exactly what to fix
- No need to guess from generic "validation failed" message

---

#### Detection 2: SQLite Constraint Violations (Lines 17-24)

```typescript
if (
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  (error.code === 'SQLITE_CONSTRAINT' || error.code === 'SQLITE_CONSTRAINT_UNIQUE')
) {
  return err(res, 'CONFLICT', 'Resource conflict (duplicate or constraint violation)')
}
```

**What it detects:**
- SQLite database constraint violations
- UNIQUE constraint (duplicate email, ID)
- FOREIGN KEY constraint (invalid reference)
- CHECK constraint (business rule violation)

**Type guard breakdown:**

```typescript
typeof error === 'object'  // Error is an object
error !== null             // Error is not null (null is typeof 'object'!)
'code' in error            // Error has a 'code' property
error.code === 'SQLITE_CONSTRAINT'  // Generic constraint violation
error.code === 'SQLITE_CONSTRAINT_UNIQUE'  // Specific: duplicate key
```

**Why so verbose?**
- SQLite errors are plain objects, not Error instances
- TypeScript doesn't know the shape of `unknown` errors
- Type guards make it safe to access `error.code`

**When it triggers:**

**Example 1: UNIQUE constraint**
```sql
CREATE TABLE patients (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE  -- Can't have duplicate emails
)
```

```typescript
// First user
db.exec(`INSERT INTO patients (id, email) VALUES ('1', 'john@example.com')`)

// Second user with same email
db.exec(`INSERT INTO patients (id, email) VALUES ('2', 'john@example.com')`)
// Throws: { code: 'SQLITE_CONSTRAINT_UNIQUE', message: '...' }
```

**Example 2: FOREIGN KEY constraint**
```sql
CREATE TABLE vitals (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
)
```

```typescript
// Try to add vitals for non-existent patient
db.exec(`INSERT INTO vitals (id, patient_id, weight_kg) VALUES ('1', 'invalid', 70)`)
// Throws: { code: 'SQLITE_CONSTRAINT', message: 'FOREIGN KEY constraint failed' }
```

**Example 3: CHECK constraint**
```sql
CREATE TABLE vitals (
  weight_kg REAL CHECK(weight_kg > 0)  -- Weight must be positive
)
```

```typescript
db.exec(`INSERT INTO vitals (id, weight_kg) VALUES ('1', -5)`)
// Throws: { code: 'SQLITE_CONSTRAINT', message: 'CHECK constraint failed' }
```

**Response sent:**
```json
{
  "version": 1,
  "error": {
    "code": "CONFLICT",
    "message": "Resource conflict (duplicate or constraint violation)"
  }
}
```

**HTTP status:** 409 Conflict

**Why this matters:**
- **Semantic HTTP status**: 409 means resource state conflict
- Frontend can show "Email already exists" message
- Distinguishes from validation errors (400) and server errors (500)

---

#### Detection 3: Generic Error Objects (Lines 26-29)

```typescript
if (error instanceof Error) {
  return err(res, 'INTERNAL', error.message)
}
```

**What it detects:**
- Standard JavaScript Error objects
- Custom error classes extending Error
- Errors from libraries (fs, http, etc.)

**When it triggers:**
```typescript
// File system error
fs.readFileSync('/nonexistent/file.txt')
// Throws: Error: ENOENT: no such file or directory

// Manual error
throw new Error('Database connection failed')

// Custom error class
class PaymentError extends Error {}
throw new PaymentError('Insufficient funds')
```

**Response sent:**
```json
{
  "version": 1,
  "error": {
    "code": "INTERNAL",
    "message": "Database connection failed"
  }
}
```

**HTTP status:** 500 Internal Server Error

**Why use error.message?**
- Preserves original error context
- Helps debugging (message explains what failed)
- Still safe (doesn't leak stack traces to client)

---

#### Detection 4: Unknown Errors (Lines 31-33)

```typescript
return err(res, 'INTERNAL', 'An unexpected error occurred')
```

**What it catches:**
- Non-Error objects thrown as errors
- Null/undefined thrown
- Primitive values thrown (strings, numbers)
- Malformed error objects

**When it triggers:**
```typescript
// Bad practices that some libraries do:
throw "Something went wrong"  // String, not Error
throw 404                     // Number
throw null                    // Null
throw { msg: 'error' }        // Plain object without Error prototype
```

**Response sent:**
```json
{
  "version": 1,
  "error": {
    "code": "INTERNAL",
    "message": "An unexpected error occurred"
  }
}
```

**HTTP status:** 500 Internal Server Error

**Why generic message?**
- Unknown error types are unpredictable
- Can't safely extract meaningful message
- Prevents leaking unexpected data to client

---

### Complete Error Handling Flow

```
Error thrown
     ↓
handleRouterError(res, error)
     ↓
Is ZodError? ───YES──→ 400 VALIDATION_ERROR (with field details)
     ↓ NO
Is SQLite constraint? ───YES──→ 409 CONFLICT (duplicate/constraint)
     ↓ NO
Is Error instance? ───YES──→ 500 INTERNAL (with error.message)
     ↓ NO
Unknown type ───────────────→ 500 INTERNAL (generic message)
```

---

### Real-World Usage Examples

#### Example 1: Create Patient Route

```typescript
import { handleRouterError } from '../utils/routerHelpers'
import { okItem, err } from '../utils/apiContract'

const createPatientSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().int().positive()
})

router.post('/api/patients', async (req, res) => {
  try {
    // Validation (can throw ZodError)
    const validated = createPatientSchema.parse(req.body)
    
    // Database insert (can throw SQLite constraint error)
    const patient = db.prepare(
      'INSERT INTO patients (id, name, email, age) VALUES (?, ?, ?, ?)'
    ).run(generateId(), validated.name, validated.email, validated.age)
    
    return okItem(res, patient, 201)
  } catch (error) {
    return handleRouterError(res, error)  // Handles all error types!
  }
})
```

**Possible error scenarios:**

1. **Invalid input** (missing name):
   ```json
   POST /api/patients
   { "email": "user@example.com", "age": 30 }
   
   Response: 400 VALIDATION_ERROR
   {
     "error": {
       "code": "VALIDATION_ERROR",
       "details": [{ "path": ["name"], "message": "Required" }]
     }
   }
   ```

2. **Duplicate email**:
   ```json
   POST /api/patients
   { "name": "John", "email": "existing@example.com", "age": 30 }
   
   Response: 409 CONFLICT
   {
     "error": {
       "code": "CONFLICT",
       "message": "Resource conflict (duplicate or constraint violation)"
     }
   }
   ```

3. **Database connection error**:
   ```json
   POST /api/patients
   { "name": "John", "email": "john@example.com", "age": 30 }
   
   Response: 500 INTERNAL
   {
     "error": {
       "code": "INTERNAL",
       "message": "Database connection lost"
     }
   }
   ```

---

#### Example 2: Update Patient Route

```typescript
router.put('/api/patients/:id', async (req, res) => {
  try {
    const validated = updatePatientSchema.parse(req.body)
    
    const result = db.prepare(
      'UPDATE patients SET name = ?, email = ? WHERE id = ?'
    ).run(validated.name, validated.email, req.params.id)
    
    if (result.changes === 0) {
      return err(res, 'NOT_FOUND', 'Patient not found')
    }
    
    return okItem(res, { id: req.params.id, ...validated })
  } catch (error) {
    return handleRouterError(res, error)
  }
})
```

**Error scenarios:**
- Validation error → 400
- Duplicate email → 409
- Database error → 500
- Patient not found → 404 (manually handled, not thrown)

---

#### Example 3: Delete Patient Route

```typescript
router.delete('/api/patients/:id', async (req, res) => {
  try {
    const result = db.prepare(
      'DELETE FROM patients WHERE id = ?'
    ).run(req.params.id)
    
    if (result.changes === 0) {
      return err(res, 'NOT_FOUND', 'Patient not found')
    }
    
    return okDeleted(res)
  } catch (error) {
    return handleRouterError(res, error)
  }
})
```

**Error scenarios:**
- Foreign key constraint (has vitals) → 409 CONFLICT
- Database error → 500 INTERNAL

---

## Part 2: generateId()

### Purpose (Lines 35-40)

```typescript
/**
 * Generates unique IDs for database records and request tracking.
 * Format: timestamp + random string
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}
```

**What it does:**
- Creates unique string IDs for database records
- Combines timestamp (sortable) + randomness (collision-resistant)

**Format breakdown:**
```
1698501234567-k3j2h9f8d
│            │ │
│            │ └─ Random string (9 chars)
│            └─ Separator
└─ Unix timestamp (milliseconds)
```

---

### How It Works

#### Part 1: Timestamp (Date.now())
```typescript
Date.now()  // Returns: 1698501234567 (milliseconds since 1970)
```

**Why timestamp?**
- **Sortable**: IDs created later have higher values
- **Unique**: Two IDs created in same millisecond differ by random part
- **Traceable**: Can extract creation time from ID

**Sorting example:**
```typescript
const id1 = generateId()  // "1698501234567-abc123xyz"
// ... 1 second later ...
const id2 = generateId()  // "1698502234567-def456uvw"

// IDs are naturally sorted by creation time
[id2, id1].sort()  // ["1698501234567-abc123xyz", "1698502234567-def456uvw"]
```

---

#### Part 2: Random String (Math.random().toString(36).substr(2, 9))

Let's break down this cryptic line:

##### Step 1: Math.random()
```typescript
Math.random()  // Returns: 0.123456789 (random between 0-1)
```

##### Step 2: .toString(36)
```typescript
0.123456789.toString(36)  // Returns: "0.4fzyo82mvyr"
```

**What is base 36?**
- Base 10: digits 0-9
- Base 16 (hex): 0-9, a-f
- **Base 36**: 0-9, a-z (all digits + lowercase letters)

**Why base 36?**
- More compact than base 10
- URL-safe (no special characters)
- Human-readable (no uppercase confusion)

##### Step 3: .substr(2, 9)
```typescript
"0.4fzyo82mvyr".substr(2, 9)  // Returns: "4fzyo82mv"
//  ^^
//  Skip "0." prefix
```

**What it does:**
- Skips first 2 characters (`"0."`)
- Takes next 9 characters
- Result: 9-character random string

**Full example:**
```typescript
Math.random()               // 0.123456789
  .toString(36)             // "0.4fzyo82mvyr"
  .substr(2, 9)             // "4fzyo82mv"
```

---

### Complete ID Generation

```typescript
Date.now()                    // 1698501234567
  .toString()                 // "1698501234567"

Math.random()                 // 0.987654321
  .toString(36)               // "0.zx9k8j7h6g"
  .substr(2, 9)               // "zx9k8j7h6"

// Combine:
`${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
// Result: "1698501234567-zx9k8j7h6"
```

---

### ID Properties

#### Uniqueness
**Collision probability:**
- Timestamp: 1 millisecond precision
- Random: 36^9 = 101,559,956,668,416 possibilities
- **Extremely unlikely** to collide even with millions of IDs

**Collision scenarios:**
```typescript
// Same millisecond, different random
generateId()  // "1698501234567-abc123xyz"
generateId()  // "1698501234567-def456uvw"  ← Different!

// High-frequency generation
for (let i = 0; i < 10000; i++) {
  generateId()  // All unique (random part differs)
}
```

#### Sortability
```typescript
const ids = [
  "1698501237000-k3j2h9f8d",  // Created later
  "1698501234567-zx9k8j7h6",  // Created earlier
]

ids.sort()  // Automatically sorted by timestamp
// ["1698501234567-zx9k8j7h6", "1698501237000-k3j2h9f8d"]
```

#### Traceability
```typescript
function getIdTimestamp(id: string): Date {
  const timestamp = parseInt(id.split('-')[0])
  return new Date(timestamp)
}

const id = "1698501234567-zx9k8j7h6"
getIdTimestamp(id)  // 2023-10-28T14:53:54.567Z
```

---

### Usage Examples

#### Example 1: Database Inserts
```typescript
import { generateId } from '../utils/routerHelpers'

router.post('/api/patients', (req, res) => {
  const id = generateId()  // "1698501234567-zx9k8j7h6"
  
  db.prepare(
    'INSERT INTO patients (id, name, email) VALUES (?, ?, ?)'
  ).run(id, req.body.name, req.body.email)
  
  return okItem(res, { id, ...req.body }, 201)
})
```

#### Example 2: Request Tracking
```typescript
import { generateId } from '../utils/routerHelpers'

app.use((req, res, next) => {
  req.id = generateId()  // Attach unique ID to request
  logger.info('Request received', { requestId: req.id, path: req.path })
  next()
})

// Later in route:
router.post('/api/patients', (req, res) => {
  logger.info('Creating patient', { requestId: req.id })
  // ... create patient ...
  logger.info('Patient created', { requestId: req.id, patientId: patient.id })
})
```

**Log output:**
```json
{"level":"info","message":"Request received","requestId":"1698501234567-abc123","path":"/api/patients"}
{"level":"info","message":"Creating patient","requestId":"1698501234567-abc123"}
{"level":"info","message":"Patient created","requestId":"1698501234567-abc123","patientId":"1698501235000-def456"}
```

**Benefits:**
- Trace all logs for a single request (filter by requestId)
- Correlate frontend errors with backend logs
- Debug complex request flows

#### Example 3: Batch Operations
```typescript
router.post('/api/patients/bulk', (req, res) => {
  const patients = req.body.patients.map(p => ({
    ...p,
    id: generateId(),
    created_at: new Date().toISOString()
  }))
  
  db.transaction(() => {
    for (const patient of patients) {
      db.prepare(
        'INSERT INTO patients (id, name, email) VALUES (?, ?, ?)'
      ).run(patient.id, patient.name, patient.email)
    }
  })
  
  return okList(res, patients, 201)
})
```

---

### Comparison with Alternatives

#### UUID v4
```typescript
// UUID: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
// generateId: "1698501234567-zx9k8j7h6"
```

**Pros of generateId:**
- ✅ Shorter (23 chars vs 36 chars)
- ✅ Sortable by creation time
- ✅ No external dependency
- ✅ Extractable timestamp

**Cons of generateId:**
- ❌ Slightly less collision-resistant than UUID
- ❌ Not RFC-compliant (if needed for integrations)

#### Auto-increment Integer
```typescript
// Integer: 1, 2, 3, 4, ...
// generateId: "1698501234567-zx9k8j7h6"
```

**Pros of generateId:**
- ✅ No coordination needed (distributed systems)
- ✅ Hard to guess (no sequential enumeration)
- ✅ No database lock contention

**Cons of generateId:**
- ❌ Longer (23 chars vs 1-10 chars)
- ❌ Slightly slower lookups (string index vs int)

#### Timestamp-only
```typescript
// Timestamp: "1698501234567"
// generateId: "1698501234567-zx9k8j7h6"
```

**Pros of generateId:**
- ✅ Collision-resistant (random part prevents duplicates)
- ✅ Multiple IDs per millisecond

**Cons of timestamp-only:**
- ❌ Collisions in high-frequency scenarios
- ❌ Can't generate multiple IDs in same millisecond

---

## Integration Patterns

### Pattern 1: Consistent Error Handling

All routers use the same pattern:

```typescript
// patientsRouter.ts
router.post('/api/patients', async (req, res) => {
  try {
    // Route logic...
  } catch (error) {
    return handleRouterError(res, error)
  }
})

// medicationsRouter.ts
router.post('/api/medications', async (req, res) => {
  try {
    // Route logic...
  } catch (error) {
    return handleRouterError(res, error)
  }
})

// vitalsRouter.ts
router.post('/api/vitals', async (req, res) => {
  try {
    // Route logic...
  } catch (error) {
    return handleRouterError(res, error)
  }
})
```

**Benefits:**
- Consistency across all routes
- Easy to update error handling globally
- New developers follow established pattern

---

### Pattern 2: ID Generation Convention

All routes use generateId() for primary keys:

```typescript
// Create routes
router.post('/api/patients', (req, res) => {
  const patient = { id: generateId(), ...req.body }
  // ...
})

router.post('/api/medications', (req, res) => {
  const medication = { id: generateId(), ...req.body }
  // ...
})

router.post('/api/vitals', (req, res) => {
  const vital = { id: generateId(), ...req.body }
  // ...
})
```

**Benefits:**
- Consistent ID format across tables
- No database-specific ID generation
- Easy to switch databases (SQLite → PostgreSQL)

---

### Pattern 3: Combined Usage

```typescript
import { handleRouterError, generateId } from '../utils/routerHelpers'
import { okItem, okList, okDeleted, err } from '../utils/apiContract'

router.post('/api/patients', async (req, res) => {
  try {
    const validated = createPatientSchema.parse(req.body)
    const id = generateId()
    
    const patient = db.prepare(
      'INSERT INTO patients (id, name, email) VALUES (?, ?, ?) RETURNING *'
    ).get(id, validated.name, validated.email)
    
    return okItem(res, patient, 201)
  } catch (error) {
    return handleRouterError(res, error)
  }
})
```

**Flow:**
1. Validate input (Zod) → throws ZodError if invalid
2. Generate unique ID
3. Insert to database → throws SQLite error if constraint violation
4. Return success response
5. Catch any errors → handleRouterError detects type and responds

---

## Testing

### Testing handleRouterError

```typescript
import { handleRouterError } from '../utils/routerHelpers'
import { ZodError } from 'zod'

describe('handleRouterError', () => {
  it('handles ZodError', () => {
    const res = mockResponse()
    const error = new ZodError([
      { code: 'invalid_type', path: ['name'], message: 'Required' }
    ])
    
    handleRouterError(res, error)
    
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      version: 1,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: [{ code: 'invalid_type', path: ['name'], message: 'Required' }]
      }
    })
  })
  
  it('handles SQLite constraint', () => {
    const res = mockResponse()
    const error = { code: 'SQLITE_CONSTRAINT_UNIQUE' }
    
    handleRouterError(res, error)
    
    expect(res.status).toHaveBeenCalledWith(409)
    expect(res.json).toHaveBeenCalledWith({
      version: 1,
      error: {
        code: 'CONFLICT',
        message: 'Resource conflict (duplicate or constraint violation)'
      }
    })
  })
  
  it('handles generic Error', () => {
    const res = mockResponse()
    const error = new Error('Database connection failed')
    
    handleRouterError(res, error)
    
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({
      version: 1,
      error: {
        code: 'INTERNAL',
        message: 'Database connection failed'
      }
    })
  })
})
```

### Testing generateId

```typescript
import { generateId } from '../utils/routerHelpers'

describe('generateId', () => {
  it('generates unique IDs', () => {
    const id1 = generateId()
    const id2 = generateId()
    
    expect(id1).not.toBe(id2)
  })
  
  it('generates sortable IDs', () => {
    const id1 = generateId()
    // Wait 1ms
    const id2 = generateId()
    
    expect([id2, id1].sort()).toEqual([id1, id2])
  })
  
  it('has correct format', () => {
    const id = generateId()
    
    expect(id).toMatch(/^\d{13}-[a-z0-9]{9}$/)
    // 13-digit timestamp + dash + 9-char random
  })
  
  it('embeds current timestamp', () => {
    const before = Date.now()
    const id = generateId()
    const after = Date.now()
    
    const timestamp = parseInt(id.split('-')[0])
    
    expect(timestamp).toBeGreaterThanOrEqual(before)
    expect(timestamp).toBeLessThanOrEqual(after)
  })
})
```

---

## Best Practices

### 1. Always Use handleRouterError in Routes
```typescript
// ✅ Good
try {
  // route logic
} catch (error) {
  return handleRouterError(res, error)
}

// ❌ Bad
try {
  // route logic
} catch (error) {
  return res.status(500).json({ error: 'Something went wrong' })
}
```

### 2. Let Errors Propagate
```typescript
// ✅ Good - Let ZodError throw naturally
const validated = schema.parse(req.body)

// ❌ Bad - Manually checking and responding
const result = schema.safeParse(req.body)
if (!result.success) {
  return err(res, 'VALIDATION_ERROR', 'Invalid data', result.error.errors)
}
```

### 3. Use generateId for All Primary Keys
```typescript
// ✅ Good
const patient = { id: generateId(), ...data }

// ❌ Bad - Inconsistent ID generation
const patient = { id: uuidv4(), ...data }  // Different format
const patient = { id: data.email, ...data }  // Not unique
```

### 4. Don't Catch and Re-throw
```typescript
// ❌ Bad - Unnecessary complexity
try {
  const data = schema.parse(req.body)
  // ...
} catch (error) {
  if (error instanceof ZodError) {
    throw error  // Why catch if you're re-throwing?
  }
}

// ✅ Good - Just let it throw
const data = schema.parse(req.body)
// ...
// Let handleRouterError catch it
```

---

## Future Enhancements

### 1. Enhanced Error Context
```typescript
export function handleRouterError(
  res: Response,
  error: unknown,
  context?: { operation?: string; resource?: string }
): Response {
  // Include operation/resource in error response
  return err(res, 'INTERNAL', `Failed to ${context.operation} ${context.resource}`)
}

// Usage:
catch (error) {
  return handleRouterError(res, error, {
    operation: 'create',
    resource: 'patient'
  })
}
```

### 2. Custom Error Classes
```typescript
class NotFoundError extends Error {
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`)
    this.name = 'NotFoundError'
  }
}

// Detection in handleRouterError:
if (error instanceof NotFoundError) {
  return err(res, 'NOT_FOUND', error.message)
}
```

### 3. ID Generation with Prefix
```typescript
export function generateId(prefix?: string): string {
  const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  return prefix ? `${prefix}_${id}` : id
}

// Usage:
const patientId = generateId('pat')  // "pat_1698501234567-zx9k8j7h6"
const vitalId = generateId('vit')    // "vit_1698501234567-abc123xyz"
```

### 4. Distributed ID Generation (Snowflake-like)
```typescript
// Include machine ID for distributed systems
export function generateDistributedId(machineId: number): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substr(2, 9)
  return `${timestamp}-${machineId}-${random}`
}
```

---

## Summary

**routerHelpers.ts provides two essential utilities:**

### handleRouterError(res, error)
- **Centralized error handling** for all routes
- **Automatic error type detection** (Zod, SQLite, Error, unknown)
- **Consistent HTTP status mapping** (400, 409, 500)
- **Standardized API responses** via apiContract

### generateId()
- **Unique ID generation** (timestamp + random)
- **Sortable by creation time**
- **No external dependencies**
- **Traceable** (can extract timestamp)

**Key benefits:**
- Consistency across all routes
- Less boilerplate code
- Type-safe error handling
- Predictable ID format

**Common pattern:**
```typescript
router.post('/api/resource', async (req, res) => {
  try {
    const validated = schema.parse(req.body)
    const id = generateId()
    
    const resource = db.prepare('INSERT ...').run(id, ...)
    
    return okItem(res, resource, 201)
  } catch (error) {
    return handleRouterError(res, error)
  }
})
```
