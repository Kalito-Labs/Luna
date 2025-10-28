# logger.ts - Structured Logging System

## Overview
`logger.ts` provides a centralized, production-ready logging system using Winston. It automatically adapts logging format, level, and output destinations based on the environment (development, test, production).

---

## Why Structured Logging?

### Console.log vs Logger

**❌ Using console.log:**
```typescript
console.log('User created')  // When? Which user? From where?
console.log('Error:', error)  // No context, no structure
console.log('Processing...', userId, action)  // Hard to parse
```

**✅ Using structured logger:**
```typescript
logger.info('User created', {
  userId: '123',
  email: 'user@example.com',
  source: 'registration',
  timestamp: '2025-10-28T10:30:00Z'
})
```

**Benefits:**
- **Searchable**: Can query logs by user ID, action type, etc.
- **Parseable**: JSON format works with log aggregation tools (Datadog, Splunk, CloudWatch)
- **Contextual**: Includes metadata automatically (timestamp, service name, level)
- **Filterable**: Can show only errors, or only production logs

---

## Log Levels (Lines 6-10)

```typescript
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
} as const
```

**What it does:**
- Defines severity hierarchy (lower number = more critical)
- Winston only shows logs at or below configured level

**Level hierarchy:**
```
error (0)  ← Most critical, always shown
  ↓
warn (1)   ← Warnings, shown unless level is 'error'
  ↓
info (2)   ← General information, shown in dev/prod
  ↓
debug (3)  ← Detailed debugging, only in development
```

**Example filtering:**
```typescript
// If level is set to 'info' (2):
logger.error('Critical!')  // ✅ Shown (0 ≤ 2)
logger.warn('Warning!')    // ✅ Shown (1 ≤ 2)
logger.info('Info!')       // ✅ Shown (2 ≤ 2)
logger.debug('Details')    // ❌ Hidden (3 > 2)
```

---

## Dynamic Log Level (Lines 12-17)

```typescript
const getLogLevel = (): keyof typeof logLevels => {
  if (process.env.NODE_ENV === 'production') return 'info'
  if (process.env.NODE_ENV === 'test') return 'error'
  return 'debug'
}
```

**What it does:**
- Automatically chooses appropriate log level for environment
- No manual configuration needed

**Environment-specific levels:**

| Environment | Level | Rationale |
|-------------|-------|-----------|
| **production** | `info` | Show normal operations + warnings + errors (not debug spam) |
| **test** | `error` | Only show errors (tests should be quiet unless failing) |
| **development** | `debug` | Show everything (helps debugging) |

**Real-world impact:**

```typescript
// In development:
logger.debug('Query params:', req.query)  // ✅ Shown
logger.info('User logged in')              // ✅ Shown
logger.error('DB connection failed')       // ✅ Shown

// In production (level: info):
logger.debug('Query params:', req.query)  // ❌ Hidden (too noisy)
logger.info('User logged in')              // ✅ Shown
logger.error('DB connection failed')       // ✅ Shown

// In tests (level: error):
logger.debug('Query params:', req.query)  // ❌ Hidden
logger.info('User logged in')              // ❌ Hidden
logger.error('DB connection failed')       // ✅ Shown (test fails!)
```

---

## Development Format (Lines 19-26)

```typescript
const devFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
    return `${timestamp} [${level}]: ${message} ${metaStr}`
  })
)
```

**What it does:**
- Formats logs for **human readability** in terminal
- Adds colors for easy visual scanning
- Pretty-prints metadata

**Output example:**
```
10:30:45 [info]: User created {
  "userId": "123",
  "email": "user@example.com"
}

10:30:46 [error]: Database error {
  "code": "SQLITE_ERROR",
  "message": "Connection lost"
}
```

**Format pipeline:**
1. **timestamp({ format: 'HH:mm:ss' })**: Adds short timestamp
2. **colorize()**: Colors the level (red for error, yellow for warn, etc.)
3. **printf()**: Custom format string

**Color scheme:**
- 🔴 Red: error
- 🟡 Yellow: warn
- 🟢 Green: info
- 🔵 Blue: debug

**Why this format for dev?**
- Quick to scan in terminal
- Timestamp helps correlate events
- Colors make errors jump out
- Pretty JSON for complex metadata

---

## Production Format (Lines 28-32)

```typescript
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
)
```

**What it does:**
- Formats logs for **machine parsing** (log aggregation systems)
- Full ISO timestamp (not just time)
- Includes stack traces
- One JSON object per line

**Output example:**
```json
{"level":"info","message":"User created","userId":"123","email":"user@example.com","timestamp":"2025-10-28T10:30:45.123Z","service":"kalito-backend"}

{"level":"error","message":"Database error","code":"SQLITE_ERROR","stack":"Error: Connection lost\n  at Database.connect (db.ts:45)\n  at ...","timestamp":"2025-10-28T10:30:46.456Z","service":"kalito-backend"}
```

**Format pipeline:**
1. **timestamp()**: Full ISO 8601 timestamp with milliseconds
2. **errors({ stack: true })**: Captures stack traces from Error objects
3. **json()**: Converts everything to JSON

**Why JSON for production?**
- **Parseable**: Log aggregation tools can parse JSON natively
- **Searchable**: Can search by any field (level, userId, etc.)
- **Structured**: Maintains data types (numbers stay numbers)
- **Machine-readable**: Can feed into analytics pipelines

**Log aggregation example (CloudWatch Insights):**
```sql
fields @timestamp, message, userId, error.code
| filter level = "error"
| filter error.code = "SQLITE_ERROR"
| sort @timestamp desc
| limit 20
```

---

## Logger Configuration (Lines 34-44)

```typescript
const logger = winston.createLogger({
  levels: logLevels,
  level: getLogLevel(),
  format: process.env.NODE_ENV === 'production' ? prodFormat : devFormat,
  defaultMeta: { service: 'kalito-backend' },
  transports: [
    new winston.transports.Console({
      stderrLevels: ['error'],
    }),
  ],
})
```

**What it does:**
- Creates the main logger instance
- Configures environment-specific behavior
- Sets up console output

**Configuration breakdown:**

### levels: logLevels
- Uses custom level hierarchy (error, warn, info, debug)

### level: getLogLevel()
- Dynamically sets threshold based on NODE_ENV

### format: prodFormat vs devFormat
- Production: JSON (machine-readable)
- Development/Test: Pretty (human-readable)

### defaultMeta: { service: 'kalito-backend' }
- Automatically adds `service` field to every log
- Useful when aggregating logs from multiple services

**Example:**
```json
{
  "level": "info",
  "message": "User created",
  "userId": "123",
  "service": "kalito-backend"  // ← Automatically added
}
```

### transports: [Console]
- **Transport** = output destination
- Console transport writes to stdout/stderr
- Can add multiple transports (file, database, remote service)

### stderrLevels: ['error']
- Errors go to **stderr** (standard error stream)
- Info/warn/debug go to **stdout** (standard output stream)

**Why separate stderr?**
- Unix convention: errors on stderr, normal output on stdout
- Allows separate redirection: `app 2> errors.log 1> output.log`
- Some monitoring tools only watch stderr for errors

---

## File Logging (Production Only) (Lines 46-72)

```typescript
if (process.env.NODE_ENV === 'production') {
  const logDir = path.join(process.cwd(), 'logs')
  try {
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true })
  } catch {
    // If we can't create logs dir, console transport still works.
  }

  logger.add(
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
    })
  )

  logger.add(
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
    })
  )
}
```

**What it does:**
- In production, writes logs to files in addition to console
- Creates two log files: errors-only and all logs
- Implements log rotation (max size + file count)

### Directory Creation (Lines 47-51)
```typescript
const logDir = path.join(process.cwd(), 'logs')
try {
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true })
} catch {
  // Fail silently - console logging still works
}
```

**What it does:**
- Creates `/logs` directory in project root
- `recursive: true` creates parent directories if needed
- Fails gracefully if can't create (e.g., read-only filesystem)

**Why try-catch?**
- Some deployment environments have read-only filesystems
- Cloud functions (Lambda, Cloud Run) may not allow file writes
- Console logging still works if file creation fails

### Error Log File (Lines 53-59)
```typescript
logger.add(
  new winston.transports.File({
    filename: path.join(logDir, 'error.log'),
    level: 'error',
    maxsize: 5 * 1024 * 1024,  // 5 MB
    maxFiles: 5,
  })
)
```

**What it does:**
- Writes **only errors** to `logs/error.log`
- Rotates when file reaches 5 MB
- Keeps max 5 old files (error.log.1, error.log.2, etc.)

**File rotation example:**
```
logs/
  error.log        ← Current (4.8 MB)
  error.log.1      ← Previous (5 MB, rotated)
  error.log.2      ← Older (5 MB, rotated)
  error.log.3      ← Even older (5 MB, rotated)
  error.log.4      ← Oldest (5 MB, rotated)
```

When `error.log` reaches 5 MB:
1. error.log.4 is deleted
2. error.log.3 → error.log.4
3. error.log.2 → error.log.3
4. error.log.1 → error.log.2
5. error.log → error.log.1
6. New error.log is created

**Why separate error log?**
- Quick access to errors without scrolling through all logs
- Can set up monitoring alerts based on error.log size
- Easier to review failures

### Combined Log File (Lines 61-67)
```typescript
logger.add(
  new winston.transports.File({
    filename: path.join(logDir, 'combined.log'),
    maxsize: 5 * 1024 * 1024,  // 5 MB
    maxFiles: 5,
  })
)
```

**What it does:**
- Writes **all logs** (error, warn, info) to `combined.log`
- Same rotation settings as error.log
- No `level` specified = captures everything

**Use cases:**
- Full audit trail of server activity
- Debugging issues by seeing context around errors
- Compliance requirements (log retention)

**Why both files?**
- error.log: Quick error review
- combined.log: Full context for investigation

---

## Exported Functions

### Main Logger Export (Line 74)

```typescript
export { logger }
```

**Direct usage:**
```typescript
import { logger } from './utils/logger'

logger.info('Server started', { port: 3000 })
logger.error('Database error', { error: dbError })
```

---

### Helper Functions (Lines 76-93)

These are **convenience wrappers** for cleaner syntax.

### logError() (Lines 76-85)
```typescript
export const logError = (message: string, error: Error, context?: Record<string, unknown>) => {
  logger.error(message, {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    ...context,
  })
}
```

**What it does:**
- Specialized function for logging Error objects
- Automatically extracts error properties (name, message, stack)
- Merges with additional context

**Usage:**
```typescript
try {
  db.connect()
} catch (error) {
  logError('Database connection failed', error, {
    host: 'localhost',
    port: 5432,
    database: 'kalito'
  })
}
```

**Output:**
```json
{
  "level": "error",
  "message": "Database connection failed",
  "error": {
    "name": "ConnectionError",
    "message": "ECONNREFUSED",
    "stack": "ConnectionError: ECONNREFUSED\n  at ..."
  },
  "host": "localhost",
  "port": 5432,
  "database": "kalito",
  "timestamp": "2025-10-28T10:30:45.123Z",
  "service": "kalito-backend"
}
```

**Why a separate function?**
- Error objects don't serialize well (lose stack trace)
- Consistent error logging across codebase
- Type-safe (enforces Error type)

---

### logInfo() (Lines 87-89)
```typescript
export const logInfo = (message: string, context?: Record<string, unknown>) => {
  logger.info(message, context)
}
```

**Usage:**
```typescript
logInfo('User logged in', {
  userId: '123',
  email: 'user@example.com',
  ip: '192.168.1.1'
})
```

**Output:**
```json
{
  "level": "info",
  "message": "User logged in",
  "userId": "123",
  "email": "user@example.com",
  "ip": "192.168.1.1",
  "timestamp": "2025-10-28T10:30:45.123Z",
  "service": "kalito-backend"
}
```

---

### logWarn() (Lines 91-93)
```typescript
export const logWarn = (message: string, context?: Record<string, unknown>) => {
  logger.warn(message, context)
}
```

**Usage:**
```typescript
logWarn('Rate limit approaching', {
  userId: '123',
  requests: 95,
  limit: 100
})
```

**When to use warnings:**
- Degraded performance (slow query)
- Approaching limits (disk space, rate limits)
- Deprecated feature usage
- Recoverable errors

---

### logDebug() (Lines 95-97)
```typescript
export const logDebug = (message: string, context?: Record<string, unknown>) => {
  logger.debug(message, context)
}
```

**Usage:**
```typescript
logDebug('Processing request', {
  method: 'POST',
  path: '/api/patients',
  body: req.body,
  headers: req.headers
})
```

**When to use debug:**
- Request/response details
- Query parameters
- Internal state changes
- Performance measurements

**Note:** Debug logs only show in development (hidden in production)

---

## Complete Usage Examples

### Example 1: Router Logging

```typescript
import { logger, logError, logInfo } from '../utils/logger'

router.post('/api/patients', async (req, res) => {
  logInfo('Creating patient', {
    requestId: req.id,
    body: req.body
  })

  try {
    const patient = await db.createPatient(req.body)
    
    logInfo('Patient created successfully', {
      patientId: patient.id,
      name: patient.name
    })
    
    return okItem(res, patient, 201)
  } catch (error) {
    logError('Failed to create patient', error, {
      requestId: req.id,
      body: req.body
    })
    
    return handleCaughtError(res, error)
  }
})
```

### Example 2: Server Startup

```typescript
import { logInfo } from './utils/logger'

const server = app.listen(PORT, () => {
  logInfo('Server started successfully', {
    port: PORT,
    environment: process.env.NODE_ENV,
    nodeVersion: process.version
  })
})
```

### Example 3: Database Operations

```typescript
import { logDebug, logWarn, logError } from '../utils/logger'

function queryDatabase(sql: string, params: any[]) {
  const startTime = Date.now()
  
  logDebug('Executing query', { sql, params })
  
  try {
    const result = db.prepare(sql).all(...params)
    const duration = Date.now() - startTime
    
    if (duration > 1000) {
      logWarn('Slow query detected', {
        sql,
        duration,
        rowCount: result.length
      })
    }
    
    return result
  } catch (error) {
    logError('Query failed', error, { sql, params })
    throw error
  }
}
```

### Example 4: Background Tasks

```typescript
import { logInfo, logError } from '../utils/logger'

async function cleanupOldSessions() {
  logInfo('Starting session cleanup task')
  
  try {
    const deleted = await db.deleteOldSessions()
    
    logInfo('Session cleanup completed', {
      deletedCount: deleted,
      duration: '5s'
    })
  } catch (error) {
    logError('Session cleanup failed', error)
  }
}

setInterval(cleanupOldSessions, 3600000)  // Every hour
```

---

## Log Aggregation & Monitoring

### In Development (Terminal)
```
10:30:45 [info]: Server started successfully {
  "port": 3000,
  "environment": "development"
}

10:30:50 [debug]: Processing request {
  "method": "POST",
  "path": "/api/patients"
}

10:30:51 [info]: Patient created successfully {
  "patientId": "123"
}
```

### In Production (JSON Files)

**combined.log:**
```json
{"level":"info","message":"Server started","port":3000,"timestamp":"2025-10-28T10:30:45.123Z","service":"kalito-backend"}
{"level":"info","message":"User logged in","userId":"123","timestamp":"2025-10-28T10:30:50.456Z","service":"kalito-backend"}
{"level":"warn","message":"Slow query","duration":1200,"timestamp":"2025-10-28T10:31:00.789Z","service":"kalito-backend"}
```

**error.log:**
```json
{"level":"error","message":"Database error","error":{"name":"SqliteError","message":"Connection lost","stack":"..."},"timestamp":"2025-10-28T10:32:00.123Z","service":"kalito-backend"}
```

### With Log Aggregation Tools

**CloudWatch Logs Insights:**
```sql
fields @timestamp, message, userId, error.message
| filter level = "error"
| sort @timestamp desc
| limit 100
```

**Datadog:**
```
service:kalito-backend status:error
```

**Splunk:**
```
index=production source="kalito-backend" level="error"
```

---

## Performance Considerations

### Log Volume
```typescript
// ❌ Bad: Logging in tight loop
for (const item of millionItems) {
  logger.debug('Processing item', { item })  // Creates 1M log entries!
}

// ✅ Good: Batch logging
logger.debug('Processing items', { count: millionItems.length })
// ... process items ...
logger.info('Items processed', { count: millionItems.length })
```

### Sensitive Data
```typescript
// ❌ Bad: Logging passwords/tokens
logger.info('User login', {
  email: user.email,
  password: req.body.password  // NEVER log passwords!
})

// ✅ Good: Sanitize sensitive data
logger.info('User login', {
  email: user.email,
  hasPassword: !!req.body.password  // Just confirm it exists
})
```

### Log Level Control
```typescript
// In production, debug logs are free (not executed)
logger.debug('Expensive operation', JSON.parse(hugeString))  // Only runs in dev

// But this always runs:
const parsed = JSON.parse(hugeString)
logger.debug('Expensive operation', parsed)  // Parses even if not logged!

// Better:
if (logger.isDebugEnabled()) {  // Winston provides this
  logger.debug('Expensive operation', JSON.parse(hugeString))
}
```

---

## Best Practices

### 1. **Use Appropriate Levels**
```typescript
logger.error('...')  // System failures, unhandled errors
logger.warn('...')   // Degraded performance, approaching limits
logger.info('...')   // Normal operations, business events
logger.debug('...')  // Development debugging only
```

### 2. **Include Context**
```typescript
// ❌ Bad
logger.error('Error occurred')

// ✅ Good
logger.error('Failed to create patient', {
  userId: req.user.id,
  requestId: req.id,
  patientData: req.body
})
```

### 3. **Use Helper Functions for Errors**
```typescript
// ❌ Bad
logger.error('Error', { error: error.toString() })  // Loses stack trace

// ✅ Good
logError('Database connection failed', error, { host: 'localhost' })
```

### 4. **Log Important Events**
```typescript
// Business events worth logging:
logInfo('User registered', { userId, email })
logInfo('Payment processed', { orderId, amount })
logInfo('Data exported', { userId, recordCount })
```

### 5. **Don't Over-Log**
```typescript
// ❌ Too verbose
logger.debug('Entering function')
logger.debug('Validating input')
logger.debug('Calling database')
logger.debug('Returning result')

// ✅ Just right
logger.debug('Processing request', { operation: 'createPatient', userId })
```

---

## Troubleshooting

### Issue: Logs not showing in development
**Cause:** Log level too high
**Solution:** Check `getLogLevel()` returns 'debug'

### Issue: Logs not writing to files
**Cause:** Can't create logs directory
**Solution:** Check write permissions, or use console-only logging

### Issue: Log files growing too large
**Cause:** Max file size too high or not rotating
**Solution:** Reduce `maxsize` or decrease `maxFiles`

### Issue: Sensitive data in logs
**Cause:** Logging request/response bodies directly
**Solution:** Sanitize before logging, use allowlists

---

## Future Enhancements

### 1. **Remote Logging**
```typescript
// Send logs to external service
logger.add(new winston.transports.Http({
  host: 'logs.example.com',
  port: 443,
  ssl: true
}))
```

### 2. **Request ID Tracking**
```typescript
// Add request ID to all logs in a request
app.use((req, res, next) => {
  req.logger = logger.child({ requestId: generateId() })
  next()
})

// In routes:
req.logger.info('Processing request')  // Includes requestId automatically
```

### 3. **Performance Monitoring**
```typescript
export const logPerformance = (operation: string, duration: number) => {
  if (duration > 1000) {
    logWarn('Slow operation', { operation, duration })
  } else {
    logDebug('Operation completed', { operation, duration })
  }
}
```

### 4. **Error Rate Monitoring**
```typescript
// Track error rates
let errorCount = 0
setInterval(() => {
  if (errorCount > 100) {
    logWarn('High error rate', { errorsPerMinute: errorCount })
  }
  errorCount = 0
}, 60000)
```

---

## Summary

**logger.ts provides production-ready logging:**

- **Environment-aware**: Adapts format and level automatically
- **Structured**: JSON in production, pretty in dev
- **Persistent**: Files in production (with rotation)
- **Type-safe**: Helper functions with clear signatures
- **Flexible**: Easy to add transports (files, remote services)

**Key functions:**
- `logger.info/warn/error/debug()` - Direct logging
- `logError()` - Error-specific logging with stack traces
- `logInfo/Warn/Debug()` - Convenience wrappers

**Best practices:**
- Use appropriate log levels
- Include context in every log
- Don't log sensitive data
- Monitor log volume in production
