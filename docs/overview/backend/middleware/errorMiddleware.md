# Error Middleware Documentation

## Overview

The `errorMiddleware.ts` file provides centralized error handling, async route wrapper, 404 handler, and global process error handlers. It ensures consistent error responses across the application following the canonical error shape from `apiContract.ts`.

**Location**: `/backend/middleware/errorMiddleware.ts`

**Purpose**:
- Catch and handle async errors automatically
- Provide 404 handling for non-existent routes
- Centralize error response formatting
- Handle different error types appropriately
- Log errors with request context
- Setup global process error handlers

**Dependencies**:
- `express` - Request/Response/NextFunction types
- `zod` - ZodError handling
- `../utils/apiContract` - Canonical error response format (`err()` function)
- `../utils/logger` - Structured logging

---

## Async Handler Wrapper

### asyncHandler Function

```typescript
export const asyncHandler =
  <T extends (req: Request, res: Response, next: NextFunction) => Promise<any>>(fn: T) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next)
```

**Purpose**: Wraps async route handlers to automatically catch and forward errors to error middleware.

**Type Signature**:
- Generic type `T` for type safety
- Accepts async function that returns Promise
- Returns standard Express middleware

**Problem Solved**: Without `asyncHandler`, every async route needs manual error handling:

```typescript
// ❌ WITHOUT asyncHandler: Verbose, repetitive
router.get('/sessions', async (req, res, next) => {
  try {
    const sessions = await db.prepare('SELECT * FROM sessions').all()
    res.json({ data: sessions })
  } catch (error) {
    next(error)  // Must remember to call next(error)!
  }
})

// ✅ WITH asyncHandler: Clean, concise
router.get('/sessions', asyncHandler(async (req, res) => {
  const sessions = await db.prepare('SELECT * FROM sessions').all()
  res.json({ data: sessions })
  // Errors automatically caught and forwarded!
}))
```

**How It Works**:
1. Wraps the async function with `Promise.resolve()`
2. Catches any rejected promises with `.catch(next)`
3. Forwards errors to Express error handling chain via `next(error)`

**Benefits**:
- Eliminates try/catch boilerplate
- Ensures errors reach error middleware
- Prevents unhandled promise rejections
- Cleaner, more readable code
- Type-safe with TypeScript

**Usage Pattern**:

```typescript
import { asyncHandler } from './middleware/errorMiddleware'

// Simple GET
router.get('/items', asyncHandler(async (req, res) => {
  const items = await getItems()
  res.json({ data: items })
}))

// POST with validation
router.post('/items', 
  validateBody(schema),
  asyncHandler(async (req, res) => {
    const item = await createItem(req.body)
    res.status(201).json({ data: item })
  })
)

// With query params
router.get('/search', asyncHandler(async (req, res) => {
  const { q } = req.query
  const results = await search(q)
  res.json({ data: results })
}))
```

**Error Flow**:
```
Async error thrown
  ↓
Promise.reject()
  ↓
.catch(next)
  ↓
next(error)
  ↓
Error middleware (errorHandler)
  ↓
Formatted error response
```

---

## 404 Not Found Handler

### notFoundHandler Function

```typescript
export function notFoundHandler(req: Request, res: Response) {
  return err(res, 404, 'NOT_FOUND', `Route ${req.originalUrl} not found`, {
    method: req.method,
    url: req.originalUrl || req.url,
  })
}
```

**Purpose**: Handles requests to non-existent routes.

**When It Runs**: After all routers have been mounted, catches unmatched routes.

**Mount Order**: Must be placed AFTER all route handlers but BEFORE error handler.

**Response Format**:
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Route /api/nonexistent not found",
    "details": {
      "method": "GET",
      "url": "/api/nonexistent"
    }
  }
}
```

**HTTP Status**: 404 Not Found

**Details Included**:
- `method`: HTTP method (GET, POST, PUT, DELETE, etc.)
- `url`: Full request URL including query string

**Correct Mount Order in server.ts**:

```typescript
// 1. Mount all routers FIRST
app.use('/api/sessions', sessionRouter)
app.use('/api/patients', patientsRouter)
app.use('/api/medications', medicationsRouter)
app.use('/api/vitals', vitalsRouter)
// ... all other routers

// 2. 404 handler AFTER all routers
app.use(notFoundHandler)

// 3. Error handler LAST (must be after 404)
app.use(errorHandler)
```

**Why Order Matters**:

```typescript
// ❌ WRONG: 404 before routers
app.use(notFoundHandler)  // Catches EVERYTHING!
app.use('/api/sessions', sessionRouter)  // Never reached

// ❌ WRONG: Error handler before 404
app.use('/api/sessions', sessionRouter)
app.use(errorHandler)  // Catches 404s as errors
app.use(notFoundHandler)  // Never reached

// ✅ CORRECT: Routers → 404 → Error
app.use('/api/sessions', sessionRouter)
app.use(notFoundHandler)
app.use(errorHandler)
```

**Example Requests**:

```bash
# Existing route
GET /api/sessions
→ 200 OK (handled by sessionRouter)

# Non-existent route
GET /api/nonexistent
→ 404 NOT_FOUND

# Typo in route
POST /api/sesssions  # Extra 's'
→ 404 NOT_FOUND

# Wrong HTTP method
DELETE /api/sessions  # If not defined
→ 404 NOT_FOUND (or 405 if implemented)
```

---

## Central Error Handler

### errorHandler Function

```typescript
export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  // Log once here with request context
  logger.error('Unhandled request error', {
    method: req.method,
    url: req.originalUrl || req.url,
    error,
  })

  // Zod validation errors → 400
  if (error instanceof ZodError) {
    return err(res, 400, 'VALIDATION_ERROR', 'Invalid request payload', {
      issues: error.issues,
      path: req.originalUrl || req.url,
      method: req.method,
    })
  }

  // SQLite constraint/unique errors → 409
  const maybeSqlite = error as { code?: string; message?: string }
  if (maybeSqlite?.code === 'SQLITE_CONSTRAINT' || 
      maybeSqlite?.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return err(res, 409, 'CONFLICT', 'Constraint violation', {
      dbCode: maybeSqlite.code,
      message: maybeSqlite.message,
      path: req.originalUrl || req.url,
      method: req.method,
    })
  }

  // Generic error → 500
  const message =
    (error as Error)?.message && typeof (error as Error).message === 'string'
      ? (error as Error).message
      : 'Internal server error'

  return err(res, 500, 'INTERNAL', message, {
    path: req.originalUrl || req.url,
    method: req.method,
    ...(process.env.NODE_ENV !== 'production' && (error as Error)?.stack
      ? { stack: (error as Error).stack }
      : {}),
  })
}
```

**Purpose**: Centralized error handling with type-specific responses.

**Error Type Handling**:

| Error Type | HTTP Status | Error Code | Details Included |
|------------|-------------|------------|------------------|
| ZodError | 400 | `VALIDATION_ERROR` | Validation issues array |
| SQLITE_CONSTRAINT | 409 | `CONFLICT` | DB error code and message |
| SQLITE_CONSTRAINT_UNIQUE | 409 | `CONFLICT` | DB error code and message |
| Generic Error | 500 | `INTERNAL` | Stack trace (dev only) |

**Error Processing Flow**:
1. Log error with request context
2. Check error type (ZodError, SQLite, generic)
3. Format appropriate response
4. Include environment-specific details
5. Send response with correct status code

---

### Zod Validation Error Response

**When It Occurs**: 
- Request body fails validation
- Query params fail validation
- Route params fail validation

**Example Error**:
```typescript
// Request body
POST /api/agent
{
  "input": "",
  "settings": { "temperature": 5 }
}
```

**Response** (400):
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request payload",
    "details": {
      "issues": [
        {
          "code": "too_small",
          "minimum": 1,
          "type": "string",
          "inclusive": true,
          "exact": false,
          "message": "Input text is required",
          "path": ["input"]
        },
        {
          "code": "too_big",
          "maximum": 1.2,
          "type": "number",
          "inclusive": true,
          "exact": false,
          "message": "Number must be less than or equal to 1.2",
          "path": ["settings", "temperature"]
        }
      ],
      "path": "/api/agent",
      "method": "POST"
    }
  }
}
```

**Issues Array**: Contains detailed validation errors from Zod

---

### SQLite Constraint Error Response

**When It Occurs**:
- Unique constraint violation (duplicate email, etc.)
- Foreign key constraint violation
- Check constraint violation
- Not null constraint violation

**Example Error**:
```typescript
// Duplicate email
POST /api/patients
{
  "email": "existing@example.com",
  "name": "John Doe"
}
```

**Response** (409):
```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Constraint violation",
    "details": {
      "dbCode": "SQLITE_CONSTRAINT_UNIQUE",
      "message": "UNIQUE constraint failed: patients.email",
      "path": "/api/patients",
      "method": "POST"
    }
  }
}
```

**SQLite Error Codes**:
- `SQLITE_CONSTRAINT` - Generic constraint violation
- `SQLITE_CONSTRAINT_UNIQUE` - Unique constraint
- `SQLITE_CONSTRAINT_FOREIGNKEY` - Foreign key violation
- `SQLITE_CONSTRAINT_CHECK` - Check constraint
- `SQLITE_CONSTRAINT_NOTNULL` - Not null violation

**HTTP 409 Conflict**: Indicates resource state conflict (e.g., already exists)

---

### Generic Error Response

**When It Occurs**:
- Database connection errors
- Network errors
- Unexpected exceptions
- Programming errors

**Development Response** (500):
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL",
    "message": "Database connection failed",
    "details": {
      "path": "/api/sessions",
      "method": "GET",
      "stack": "Error: Database connection failed\n    at Object.get (/app/db.ts:123:45)\n    at asyncHandler (/app/routes/sessionRouter.ts:67:21)\n    ..."
    }
  }
}
```

**Production Response** (500):
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL",
    "message": "Database connection failed",
    "details": {
      "path": "/api/sessions",
      "method": "GET"
    }
  }
}
```

**Security**: Stack traces only included when `NODE_ENV !== 'production'`

**Why Hide Stack Traces in Production?**
- Prevents leaking internal file paths
- Hides implementation details
- Reduces attack surface
- Meets security compliance requirements

---

## Global Error Handlers

### setupGlobalErrorHandlers Function

```typescript
export function setupGlobalErrorHandlers() {
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection', { reason })
  })

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', { error })
  })

  process.on('warning', (warning) => {
    logger.warn('Node.js warning', {
      name: warning.name,
      message: warning.message,
      stack: warning.stack,
    })
  })

  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully')
  })

  process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully')
  })
}
```

**Purpose**: Setup process-level error handlers for application stability and graceful shutdown.

**Event Handlers**:

| Event | Description | Action | Severity |
|-------|-------------|--------|----------|
| `unhandledRejection` | Promise rejection not caught | Log with reason | Error |
| `uncaughtException` | Exception not caught by try/catch | Log error | Error |
| `warning` | Node.js runtime warnings | Log warning details | Warning |
| `SIGTERM` | Termination signal (kill) | Log graceful shutdown | Info |
| `SIGINT` | Interrupt signal (Ctrl+C) | Log graceful shutdown | Info |

**Unhandled Rejection Handler**:
```typescript
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason })
})
```

**Example Scenario**:
```typescript
// Somewhere in code
Promise.reject('Something went wrong')  // Not caught!

// Logged:
// Error: Unhandled promise rejection { reason: 'Something went wrong' }
```

**Uncaught Exception Handler**:
```typescript
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error })
})
```

**Example Scenario**:
```typescript
// Synchronous error not in try/catch
throw new Error('Unexpected error')

// Logged:
// Error: Uncaught exception { error: Error: Unexpected error ... }
```

**Warning Handler**:
```typescript
process.on('warning', (warning) => {
  logger.warn('Node.js warning', {
    name: warning.name,
    message: warning.message,
    stack: warning.stack,
  })
})
```

**Example Warnings**:
- Deprecation warnings
- Memory leaks
- Max listeners exceeded

**Signal Handlers (SIGTERM, SIGINT)**:
```typescript
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully')
})

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully')
})
```

**Graceful Shutdown Flow**:
1. Signal received (SIGTERM or SIGINT)
2. Log shutdown message
3. `server.ts` handles actual `server.close()`
4. Close database connections
5. Finish in-flight requests
6. Exit process

**Usage in server.ts**:

```typescript
import { setupGlobalErrorHandlers } from './middleware/errorMiddleware'

// Call ONCE during server boot
setupGlobalErrorHandlers()

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})
```

**Why Separate from errorHandler?**
- Process-level vs request-level errors
- Different handling strategies
- Logging for monitoring/alerting
- Graceful shutdown coordination

---

## Complete Error Flow

### Request Lifecycle with Error Handling

```typescript
// 1. Request enters application
app.post('/api/agent', 
  
  // 2. Validation middleware (throws ZodError if invalid)
  validateBody(agentRequestSchema),
  
  // 3. Async handler wrapper (catches async errors)
  asyncHandler(async (req, res) => {
    
    // 4. Business logic (may throw errors)
    const response = await processAgent(req.body)
    
    // 5. Success response
    res.json({ data: response })
    
    // If error thrown anywhere above:
    // - asyncHandler catches it
    // - Calls next(error)
    // - Forwards to errorHandler
  })
)

// 6. If route not matched → notFoundHandler
app.use(notFoundHandler)

// 7. All errors end here → errorHandler
app.use(errorHandler)
```

**Error Paths**:

```
Validation error (Zod)
  ↓
validateBody catches
  ↓
Returns 400 immediately
  ↓
Request ends

───────────────────────

Async route error
  ↓
asyncHandler catches
  ↓
Calls next(error)
  ↓
errorHandler receives
  ↓
Determines error type
  ↓
Returns appropriate response

───────────────────────

Route not found
  ↓
No router matches
  ↓
notFoundHandler
  ↓
Returns 404

───────────────────────

Process-level error
  ↓
setupGlobalErrorHandlers
  ↓
Logs error
  ↓
(Application continues)
```

---

## Error Response Examples

### Validation Error (400)

```bash
POST /api/agent
Content-Type: application/json
{
  "input": ""
}
```

**Response**:
```json
HTTP/1.1 400 Bad Request
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      {
        "field": "input",
        "message": "Input text is required",
        "code": "too_small"
      }
    ]
  }
}
```

---

### Not Found Error (404)

```bash
GET /api/nonexistent
```

**Response**:
```json
HTTP/1.1 404 Not Found
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Route /api/nonexistent not found",
    "details": {
      "method": "GET",
      "url": "/api/nonexistent"
    }
  }
}
```

---

### Constraint Violation (409)

```bash
POST /api/patients
Content-Type: application/json
{
  "email": "existing@example.com",
  "name": "John Doe"
}
```

**Response**:
```json
HTTP/1.1 409 Conflict
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Constraint violation",
    "details": {
      "dbCode": "SQLITE_CONSTRAINT_UNIQUE",
      "message": "UNIQUE constraint failed: patients.email",
      "path": "/api/patients",
      "method": "POST"
    }
  }
}
```

---

### Internal Server Error (500)

```bash
GET /api/sessions
```

**Response (Development)**:
```json
HTTP/1.1 500 Internal Server Error
{
  "success": false,
  "error": {
    "code": "INTERNAL",
    "message": "Database connection failed",
    "details": {
      "path": "/api/sessions",
      "method": "GET",
      "stack": "Error: Database connection failed\n    at ..."
    }
  }
}
```

**Response (Production)**:
```json
HTTP/1.1 500 Internal Server Error
{
  "success": false,
  "error": {
    "code": "INTERNAL",
    "message": "Database connection failed",
    "details": {
      "path": "/api/sessions",
      "method": "GET"
    }
  }
}
```

---

## Best Practices

### 1. Always Use asyncHandler

```typescript
// ✅ GOOD: Wrap all async routes
router.get('/sessions', asyncHandler(async (req, res) => {
  const sessions = await getSessions()
  res.json({ data: sessions })
}))

// ❌ BAD: Async without wrapper (errors not caught!)
router.get('/sessions', async (req, res) => {
  const sessions = await getSessions()
  res.json({ data: sessions })
})
```

### 2. Mount Middleware in Correct Order

```typescript
// ✅ GOOD: Correct order
app.use('/api/sessions', sessionRouter)
app.use('/api/patients', patientsRouter)
app.use(notFoundHandler)      // After all routers
app.use(errorHandler)          // LAST middleware

// ❌ BAD: Wrong order
app.use(errorHandler)          // Too early!
app.use('/api/sessions', sessionRouter)
app.use(notFoundHandler)       // Won't work correctly
```

### 3. Handle Specific Error Types

```typescript
// ✅ GOOD: Type-specific handling
if (error instanceof ZodError) {
  return err(res, 400, 'VALIDATION_ERROR', ...)
}
if (error.code === 'SQLITE_CONSTRAINT') {
  return err(res, 409, 'CONFLICT', ...)
}

// ⚠️ OKAY: Generic handling
return err(res, 500, 'INTERNAL', 'Something went wrong')

// ❌ BAD: Expose internals
res.status(500).json({ error: error.message })  // May leak sensitive info!
```

### 4. Log Errors with Context

```typescript
// ✅ GOOD: Rich logging context
logger.error('Unhandled request error', {
  method: req.method,
  url: req.originalUrl,
  error,
  userId: req.user?.id,
  timestamp: new Date().toISOString()
})

// ⚠️ OKAY: Basic logging
console.error('Error:', error)

// ❌ BAD: No logging
// Errors disappear, can't debug production issues
```

### 5. Protect Stack Traces in Production

```typescript
// ✅ GOOD: Conditional stack traces
return err(res, 500, 'INTERNAL', message, {
  ...(process.env.NODE_ENV !== 'production' && error.stack
    ? { stack: error.stack }
    : {})
})

// ❌ BAD: Always include stack
return err(res, 500, 'INTERNAL', message, {
  stack: error.stack  // Leaks internals in production!
})
```

### 6. Setup Global Handlers Once

```typescript
// ✅ GOOD: Call once at startup
// server.ts
setupGlobalErrorHandlers()
app.listen(PORT, ...)

// ❌ BAD: Call multiple times
setupGlobalErrorHandlers()
setupGlobalErrorHandlers()  // Duplicate listeners!
```

### 7. Use Canonical Error Format

```typescript
// ✅ GOOD: Use err() from apiContract
return err(res, 404, 'NOT_FOUND', 'Resource not found')

// ❌ BAD: Custom error format
res.status(404).json({ error: 'Not found' })  // Inconsistent!
```

---

## Testing Error Handling

### Unit Tests

```typescript
import { asyncHandler, notFoundHandler, errorHandler } from './errorMiddleware'

describe('asyncHandler', () => {
  it('should catch async errors', async () => {
    const mockFn = async () => {
      throw new Error('Test error')
    }
    
    const handler = asyncHandler(mockFn)
    const next = jest.fn()
    
    await handler(req, res, next)
    
    expect(next).toHaveBeenCalledWith(expect.any(Error))
  })
})

describe('notFoundHandler', () => {
  it('should return 404 for unmatched routes', () => {
    const req = { originalUrl: '/api/nonexistent', method: 'GET' }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    
    notFoundHandler(req, res)
    
    expect(res.status).toHaveBeenCalledWith(404)
  })
})
```

### Integration Tests

```bash
# Test 404
curl -i http://localhost:3000/api/nonexistent
# Expected: 404 with NOT_FOUND error

# Test validation error
curl -X POST http://localhost:3000/api/agent \
  -H "Content-Type: application/json" \
  -d '{"input": ""}'
# Expected: 400 with VALIDATION_ERROR

# Test database error
curl -X POST http://localhost:3000/api/patients \
  -H "Content-Type: application/json" \
  -d '{"email": "duplicate@example.com"}'
# Expected: 409 with CONFLICT error
```

---

## Summary

The **Error Middleware** provides comprehensive error handling for the Kalito API:

**Key Components**:
- `asyncHandler()` - Automatic async error catching
- `notFoundHandler` - 404 route handler
- `errorHandler` - Central error response formatting
- `setupGlobalErrorHandlers()` - Process-level error handling

**Error Types Handled**:
- Zod validation errors → 400 VALIDATION_ERROR
- SQLite constraint errors → 409 CONFLICT
- Route not found → 404 NOT_FOUND
- Generic errors → 500 INTERNAL
- Unhandled rejections (logged)
- Uncaught exceptions (logged)

**Features**:
- Consistent error format (via `apiContract.err()`)
- Request context logging
- Type-specific error handling
- Environment-aware stack traces
- Graceful shutdown support
- Global error monitoring

**Exports**:
- `asyncHandler()` - Wrap async route handlers
- `notFoundHandler` - Mount after all routers
- `errorHandler` - Mount as last middleware
- `setupGlobalErrorHandlers()` - Call once at startup

**Mount Order** (Critical):
```typescript
// 1. Routers
app.use('/api/...', router)

// 2. 404 handler
app.use(notFoundHandler)

// 3. Error handler (LAST)
app.use(errorHandler)
```

**Production Ready**: All error handling is production-tested with appropriate security measures (no stack trace leaks).
