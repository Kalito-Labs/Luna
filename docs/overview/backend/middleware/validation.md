# Validation Middleware Documentation

## Overview

The `validation.ts` file provides Zod-based validation schemas and middleware for validating request bodies, query parameters, and route parameters. It ensures type safety and data integrity across all API endpoints.

**Location**: `/backend/middleware/validation.ts`

**Purpose**:
- Validate incoming request data
- Transform data types (string → number, etc.)
- Apply default values
- Provide detailed error messages
- Ensure type safety
- Validate environment variables

**Dependencies**:
- `zod` - Schema validation library
- `express` - Request/Response types

---

## Validation Schemas

### Agent Request Schema

```typescript
export const agentRequestSchema = z
  .object({
    input: z
      .string()
      .min(1, 'Input text is required')
      .max(16000, 'Input too long (max 16000 characters)')
      .refine(val => val.trim().length > 0, 'Input text is required'),
    sessionId: z
      .string()
      .optional()
      .refine(val => !val || val.length > 0, 'Session ID cannot be empty string'),
    systemPrompt: z.string().optional().default(''),
    modelName: z.string().optional(),
    mode: z.enum(['single', 'cloud']).optional().default('single'),
    personaId: z.string().optional(),
    settings: z
      .object({
        model: z.string().optional(),
        temperature: z.number().min(0.1).max(1.2).optional(),
        maxTokens: z.number().min(1).max(4000).optional(),
        topP: z.number().min(0).max(1).optional(),
        frequencyPenalty: z.number().min(0).max(2).optional(),
        presencePenalty: z.number().min(0).max(2).optional(),
        outputFormat: z.string().optional(),
      })
      .optional()
      .default({}),
    fileIds: z.array(z.string()).optional().default([]),
    stream: z.boolean().optional().default(false),
  })
  .transform(data => ({
    ...data,
    input: data.input.trim(), // Trim after validation
  }))
```

**Purpose**: Validates AI agent requests for chat/completion endpoints.

**Field Validation Details**:

| Field | Type | Required | Validation Rules | Default |
|-------|------|----------|------------------|---------|
| `input` | string | Yes | Min 1, max 16000 chars, not whitespace-only | - |
| `sessionId` | string | No | Cannot be empty string if provided | - |
| `systemPrompt` | string | No | Any string | `''` |
| `modelName` | string | No | Any string | - |
| `mode` | enum | No | `'single'` or `'cloud'` | `'single'` |
| `personaId` | string | No | Any string | - |
| `settings` | object | No | See settings validation below | `{}` |
| `fileIds` | string[] | No | Array of strings | `[]` |
| `stream` | boolean | No | Boolean value | `false` |

**Settings Object Validation**:

| Field | Type | Range/Rules | Description |
|-------|------|-------------|-------------|
| `model` | string | Any | Model identifier override |
| `temperature` | number | 0.1 - 1.2 | Sampling temperature (creativity) |
| `maxTokens` | number | 1 - 4000 | Maximum response length |
| `topP` | number | 0 - 1 | Nucleus sampling threshold |
| `frequencyPenalty` | number | 0 - 2 | Penalty for token frequency |
| `presencePenalty` | number | 0 - 2 | Penalty for token presence |
| `outputFormat` | string | Any | Response format (e.g., 'json') |

**Transform Logic**:
- Trims whitespace from `input` after validation
- Preserves all other fields as-is

**Example Valid Request**:
```json
{
  "input": "What is the weather today?",
  "sessionId": "session_abc123",
  "mode": "cloud",
  "settings": {
    "temperature": 0.7,
    "maxTokens": 500
  }
}
```

**Example Invalid Request**:
```json
{
  "input": "   ",  // ❌ Whitespace only
  "settings": {
    "temperature": 5  // ❌ Too high (max 1.2)
  }
}
```

---

### Session Schemas

#### Create Session Schema

```typescript
export const createSessionSchema = z.object({
  title: z
    .string()
    .min(1, 'Session title cannot be empty')
    .max(200, 'Session title too long (max 200 characters)')
    .trim()
    .optional(),
})
```

**Purpose**: Validates session creation requests.

**Validation**:
- Optional `title` field
- Minimum 1 character (after trim)
- Maximum 200 characters
- Auto-trims whitespace

**Example Requests**:
```json
// Valid: With title
{ "title": "My Conversation" }

// Valid: Without title (will be auto-generated)
{}

// Invalid: Empty title
{ "title": "   " }  // ❌ Fails after trim
```

#### Update Session Schema

```typescript
export const updateSessionSchema = z.object({
  title: z
    .string()
    .min(1, 'Session title cannot be empty')
    .max(200, 'Session title too long (max 200 characters)')
    .trim()
    .optional(),
  archived: z.boolean().optional(),
})
```

**Purpose**: Validates session update requests.

**Validation**:
- Optional `title` (same rules as create)
- Optional `archived` boolean flag

**Example Requests**:
```json
// Update title only
{ "title": "Updated Title" }

// Archive session
{ "archived": true }

// Update both
{ "title": "Archived Chat", "archived": true }
```

---

### Pagination Schema

```typescript
export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val, 10) : 1))
    .refine(val => val > 0, 'Page must be greater than 0'),
  limit: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val, 10) : 20))
    .refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
})
```

**Purpose**: Validates and transforms pagination query parameters.

**Validation & Transformation**:

| Field | Input Type | Output Type | Default | Range |
|-------|------------|-------------|---------|-------|
| `page` | string | number | 1 | > 0 |
| `limit` | string | number | 20 | 1-100 |

**Why Transform?**
Query parameters are always strings in HTTP requests. This schema converts them to numbers for database queries.

**Example Transformations**:

```typescript
// Input: ?page=2&limit=50
// Output: { page: 2, limit: 50 }

// Input: ?page=abc&limit=50
// Output: { page: NaN, limit: 50 }  // ❌ Fails validation (NaN > 0 is false)

// Input: (no query params)
// Output: { page: 1, limit: 20 }  // Defaults applied

// Input: ?limit=200
// Output: Error - "Limit must be between 1 and 100"
```

**Usage**:
```typescript
router.get('/sessions', validateQuery(paginationSchema), async (req, res) => {
  const { page, limit } = req.query  // Now numbers!
  const offset = (page - 1) * limit
  
  const sessions = db.prepare(`
    SELECT * FROM sessions 
    LIMIT ? OFFSET ?
  `).all(limit, offset)
})
```

---

### Common Schemas

```typescript
export const commonSchemas = {
  uuid: z.string().uuid('Invalid UUID format'),
  positiveInteger: z.number().int().positive('Must be a positive integer'),
  nonEmptyString: z.string().min(1, 'Cannot be empty').trim(),
  email: z.string().email('Invalid email format'),
}
```

**Purpose**: Reusable validators for common data types.

**Available Validators**:

| Schema | Type | Validation | Example Valid | Example Invalid |
|--------|------|------------|---------------|-----------------|
| `uuid` | string | RFC 4122 UUID | `'550e8400-e29b-41d4-a716-446655440000'` | `'not-a-uuid'` |
| `positiveInteger` | number | Integer > 0 | `42` | `0`, `-1`, `3.14` |
| `nonEmptyString` | string | Min 1 char (trimmed) | `'hello'` | `''`, `'   '` |
| `email` | string | Valid email format | `'user@example.com'` | `'not-an-email'` |

**Usage Examples**:

```typescript
// User schema
const userSchema = z.object({
  id: commonSchemas.uuid,
  email: commonSchemas.email,
  age: commonSchemas.positiveInteger,
  name: commonSchemas.nonEmptyString,
})

// Route param schema
const idParamSchema = z.object({
  id: commonSchemas.uuid
})

router.get('/users/:id', validateParams(idParamSchema), async (req, res) => {
  const { id } = req.params  // Validated as UUID
})
```

---

### Environment Variable Schema

```typescript
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val, 10) : 3000))
    .refine(val => val > 0 && val < 65536, 'Port must be between 1 and 65535'),
  DB_PATH: z.string().optional().default('./db/kalito.db'),
  OPENAI_API_KEY: z.string().optional(),
})

export const env = envSchema.parse(process.env)
```

**Purpose**: Validate environment variables at application startup.

**Environment Variables**:

| Variable | Type | Default | Validation | Required |
|----------|------|---------|------------|----------|
| `NODE_ENV` | string | `'development'` | Must be 'development', 'production', or 'test' | No |
| `PORT` | number | `3000` | 1-65535 | No |
| `DB_PATH` | string | `'./db/kalito.db'` | Any string | No |
| `OPENAI_API_KEY` | string | - | Any string | No |

**Why Validate Environment Variables?**
- Fail fast on startup if config is invalid
- Provide clear error messages
- Apply defaults consistently
- Type-safe environment access

**Usage**:
```typescript
import { env } from './middleware/validation'

// Type-safe, validated environment variables
const server = app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`)
  console.log(`Environment: ${env.NODE_ENV}`)
  console.log(`Database: ${env.DB_PATH}`)
})
```

**Startup Validation**:
```bash
# Missing OPENAI_API_KEY (optional, so no error)
$ node server.ts
✅ Server running on port 3000

# Invalid PORT
$ PORT=99999 node server.ts
❌ Error: Port must be between 1 and 65535

# Invalid NODE_ENV
$ NODE_ENV=staging node server.ts
❌ Error: Invalid enum value. Expected 'development' | 'production' | 'test'
```

---

## Validation Middleware

### Validate Request Body

```typescript
export const validateBody = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('🔍 VALIDATION INPUT:', JSON.stringify(req.body, null, 2))
      req.body = schema.parse(req.body)
      console.log('✅ VALIDATION SUCCESS')
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.log('❌ VALIDATION FAILED:', error.issues)
        const validationErrors = error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }))

        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid request data',
          details: validationErrors,
        })
      }
      next(error)
    }
  }
}
```

**Purpose**: Middleware to validate and transform request body.

**Functionality**:
1. Logs incoming request body (development debugging)
2. Validates with provided Zod schema
3. Transforms data (type conversions, defaults, etc.)
4. Updates `req.body` with validated/transformed data
5. Returns 400 with detailed errors on validation failure
6. Calls `next()` on success

**Response on Success**:
- Calls `next()`, request proceeds
- `req.body` contains validated/transformed data

**Response on Failure** (HTTP 400):
```json
{
  "error": "Validation Error",
  "message": "Invalid request data",
  "details": [
    {
      "field": "input",
      "message": "Input text is required",
      "code": "too_small"
    },
    {
      "field": "settings.temperature",
      "message": "Number must be less than or equal to 1.2",
      "code": "too_big"
    }
  ]
}
```

**Error Details Structure**:
- `field`: JSON path to invalid field (e.g., `"settings.temperature"`)
- `message`: Human-readable error message
- `code`: Zod error code (e.g., `"too_small"`, `"invalid_type"`)

**Usage Example**:
```typescript
import { validateBody, agentRequestSchema } from './middleware/validation'

router.post('/agent', validateBody(agentRequestSchema), async (req, res) => {
  // req.body is now validated and typed
  const { input, sessionId, settings } = req.body
  
  // Use validated data safely
  const response = await processAgent(input, settings)
  res.json({ data: response })
})
```

**Logging Output**:
```
🔍 VALIDATION INPUT: {
  "input": "Hello",
  "settings": {
    "temperature": 0.7
  }
}
✅ VALIDATION SUCCESS
```

---

### Validate Query Parameters

```typescript
export const validateQuery = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedQuery = schema.parse(req.query)
      Object.assign(req.query, validatedQuery)
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors = error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }))

        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid query parameters',
          details: validationErrors,
        })
      }
      next(error)
    }
  }
}
```

**Purpose**: Middleware to validate and transform query parameters.

**Functionality**:
1. Validates query string parameters
2. Transforms types (e.g., string `"10"` → number `10`)
3. Applies default values
4. Updates `req.query` with validated/transformed data
5. Returns 400 with detailed errors on validation failure

**Common Use Case**: Pagination

```typescript
import { validateQuery, paginationSchema } from './middleware/validation'

router.get('/sessions', validateQuery(paginationSchema), async (req, res) => {
  const { page, limit } = req.query  // Now numbers with defaults
  const offset = (page - 1) * limit
  
  const sessions = db.prepare(`
    SELECT * FROM sessions 
    LIMIT ? OFFSET ?
  `).all(limit, offset)
  
  res.json({ data: sessions })
})
```

**Request Examples**:

```bash
# Valid with params
GET /api/sessions?page=2&limit=50
→ req.query = { page: 2, limit: 50 }

# Valid with defaults
GET /api/sessions
→ req.query = { page: 1, limit: 20 }

# Invalid page
GET /api/sessions?page=0
→ 400 "Page must be greater than 0"

# Invalid limit
GET /api/sessions?limit=200
→ 400 "Limit must be between 1 and 100"
```

**Response on Failure** (HTTP 400):
```json
{
  "error": "Validation Error",
  "message": "Invalid query parameters",
  "details": [
    {
      "field": "limit",
      "message": "Limit must be between 1 and 100",
      "code": "custom"
    }
  ]
}
```

---

### Validate Route Parameters

```typescript
export const validateParams = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedParams = schema.parse(req.params)
      Object.assign(req.params, validatedParams)
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors = error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }))

        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid route parameters',
          details: validationErrors,
        })
      }
      next(error)
    }
  }
}
```

**Purpose**: Middleware to validate route parameters (e.g., `:id`).

**Functionality**:
1. Validates URL path parameters
2. Transforms types if needed
3. Updates `req.params` with validated data
4. Returns 400 with detailed errors on validation failure

**Common Use Case**: UUID Validation

```typescript
import { validateParams, commonSchemas } from './middleware/validation'

const idParamSchema = z.object({
  id: commonSchemas.uuid
})

router.get('/sessions/:id', validateParams(idParamSchema), async (req, res) => {
  const { id } = req.params  // Validated as UUID format
  
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(id)
  
  if (!session) {
    return res.status(404).json({ error: 'Session not found' })
  }
  
  res.json({ data: session })
})
```

**Request Examples**:

```bash
# Valid UUID
GET /api/sessions/550e8400-e29b-41d4-a716-446655440000
→ Proceeds to handler

# Invalid UUID
GET /api/sessions/not-a-uuid
→ 400 "Invalid UUID format"

# Empty ID
GET /api/sessions/
→ 404 (route not matched)
```

**Response on Failure** (HTTP 400):
```json
{
  "error": "Validation Error",
  "message": "Invalid route parameters",
  "details": [
    {
      "field": "id",
      "message": "Invalid UUID format",
      "code": "invalid_string"
    }
  ]
}
```

---

## Validation Best Practices

### 1. Always Validate Inputs

```typescript
// ✅ GOOD: Validate all inputs
router.post(
  '/patients',
  validateBody(createPatientSchema),
  validateQuery(paginationSchema),
  async (req, res) => { /* ... */ }
)

// ❌ BAD: No validation
router.post('/patients', async (req, res) => {
  const { name } = req.body  // Could be anything!
  // Vulnerable to injection, type errors, etc.
})
```

### 2. Provide Specific Error Messages

```typescript
// ✅ GOOD: Descriptive messages
z.string()
  .min(1, 'Input text is required')
  .max(16000, 'Input too long (max 16000 characters)')

// ⚠️ OKAY: Generic messages
z.string().min(1).max(16000)  // Uses default "too_small", "too_big"

// ❌ BAD: No validation
// User gets cryptic database or runtime errors
```

### 3. Transform Data Types Appropriately

```typescript
// ✅ GOOD: Transform string to number
page: z.string().transform(val => parseInt(val, 10))

// ⚠️ OKAY: Accept both types
page: z.union([z.string(), z.number()])

// ❌ BAD: Expect number (query params are always strings!)
page: z.number()  // Will always fail!
```

### 4. Set Reasonable Defaults

```typescript
// ✅ GOOD: Sensible defaults
mode: z.enum(['single', 'cloud']).default('single')
stream: z.boolean().default(false)
limit: z.number().default(20)

// ⚠️ OKAY: No default (forces user to specify)
mode: z.enum(['single', 'cloud'])

// ❌ BAD: Wrong default
temperature: z.number().default(10)  // Way too high!
```

### 5. Use Refine for Complex Validation

```typescript
// ✅ GOOD: Custom validation logic
z.string().refine(
  val => val.trim().length > 0,
  'Input cannot be only whitespace'
)

// ✅ GOOD: Cross-field validation
z.object({
  startDate: z.string(),
  endDate: z.string()
}).refine(
  data => new Date(data.endDate) > new Date(data.startDate),
  'End date must be after start date'
)

// ❌ BAD: No business logic validation
z.object({
  startDate: z.string(),
  endDate: z.string()
})  // Allows end before start!
```

### 6. Validate at the Right Layer

```typescript
// ✅ GOOD: Validate early (middleware)
router.post('/patients', validateBody(schema), handler)

// ⚠️ OKAY: Validate in handler
router.post('/patients', async (req, res) => {
  const result = schema.safeParse(req.body)
  if (!result.success) { /* ... */ }
})

// ❌ BAD: Validate in database layer
// Errors come too late, harder to debug
```

---

## Complete Validation Examples

### Example 1: Complex Nested Object

```typescript
// Define schema
const vitalSchema = z.object({
  patient_id: z.string().min(1),
  measurements: z.object({
    weight_kg: z.number().positive().optional(),
    glucose: z.object({
      am: z.number().int().positive().optional(),
      pm: z.number().int().positive().optional(),
    }).optional(),
  }),
  recorded_date: z.string().min(1),
  notes: z.string().optional(),
})

// Apply validation
router.post('/vitals', validateBody(vitalSchema), async (req, res) => {
  const { patient_id, measurements, recorded_date, notes } = req.body
  
  // All validated and typed!
  const vital = await createVital({
    patient_id,
    weight_kg: measurements.weight_kg,
    glucose_am: measurements.glucose?.am,
    glucose_pm: measurements.glucose?.pm,
    recorded_date,
    notes,
  })
  
  res.json({ data: vital })
})
```

### Example 2: Search Endpoint

```typescript
// Define schema
const searchSchema = z.object({
  q: z.string().min(1, 'Search query required'),
  category: z.enum(['medications', 'patients', 'providers']).optional(),
  limit: z.string().transform(val => parseInt(val, 10)).default('20'),
  page: z.string().transform(val => parseInt(val, 10)).default('1'),
})

// Apply validation
router.get('/search', validateQuery(searchSchema), async (req, res) => {
  const { q, category, limit, page } = req.query
  
  // Perform search with validated params
  const results = await search({
    query: q,
    category,
    limit,
    offset: (page - 1) * limit
  })
  
  res.json({ data: results })
})
```

### Example 3: User Registration

```typescript
// Define schema with custom validation
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .refine(
      val => /[A-Z]/.test(val),
      'Password must contain uppercase letter'
    )
    .refine(
      val => /[0-9]/.test(val),
      'Password must contain number'
    ),
  confirmPassword: z.string(),
  name: z.string().min(1).max(100),
  termsAccepted: z.boolean().refine(val => val === true, 'Must accept terms'),
}).refine(
  data => data.password === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }
)

// Apply validation
router.post('/register', validateBody(registerSchema), async (req, res) => {
  const { email, password, name } = req.body
  
  // Create user with validated data
  const user = await createUser({ email, password, name })
  
  res.status(201).json({ data: user })
})
```

---

## Error Response Examples

### Single Field Error

**Request**:
```json
POST /api/agent
{
  "input": ""
}
```

**Response** (400):
```json
{
  "error": "Validation Error",
  "message": "Invalid request data",
  "details": [
    {
      "field": "input",
      "message": "Input text is required",
      "code": "too_small"
    }
  ]
}
```

### Multiple Field Errors

**Request**:
```json
POST /api/agent
{
  "input": "   ",
  "settings": {
    "temperature": 5,
    "maxTokens": -100
  }
}
```

**Response** (400):
```json
{
  "error": "Validation Error",
  "message": "Invalid request data",
  "details": [
    {
      "field": "input",
      "message": "Input text is required",
      "code": "custom"
    },
    {
      "field": "settings.temperature",
      "message": "Number must be less than or equal to 1.2",
      "code": "too_big"
    },
    {
      "field": "settings.maxTokens",
      "message": "Number must be greater than or equal to 1",
      "code": "too_small"
    }
  ]
}
```

### Type Error

**Request**:
```json
POST /api/agent
{
  "input": "Hello",
  "stream": "yes"
}
```

**Response** (400):
```json
{
  "error": "Validation Error",
  "message": "Invalid request data",
  "details": [
    {
      "field": "stream",
      "message": "Expected boolean, received string",
      "code": "invalid_type"
    }
  ]
}
```

---

## Summary

The **Validation Middleware** provides type-safe request validation for the Kalito API:

**Key Features**:
- Zod-based schema validation
- Type transformations (string → number, etc.)
- Default value application
- Detailed error messages
- Environment variable validation
- Reusable common schemas

**Pre-built Schemas**:
- `agentRequestSchema` - AI request validation (16K char limit, settings validation)
- `createSessionSchema` - Session creation (200 char title limit)
- `updateSessionSchema` - Session updates (title, archived flag)
- `paginationSchema` - Query param pagination (page/limit with defaults)
- `commonSchemas` - UUID, email, positive integer, non-empty string
- `envSchema` - Environment variables (NODE_ENV, PORT, DB_PATH, API keys)

**Middleware Functions**:
- `validateBody(schema)` - Validate request body
- `validateQuery(schema)` - Validate query parameters
- `validateParams(schema)` - Validate route parameters

**Benefits**:
- Type safety at runtime
- Early error detection
- Consistent error format
- Automatic type coercion
- Self-documenting schemas
- Prevents injection attacks

**Export**: `env` object with validated environment variables available throughout the application.
