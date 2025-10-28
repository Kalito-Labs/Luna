# server.ts - Backend Server Entry Point

## Overview
`server.ts` is the main entry point for the Kalito backend server. It initializes and configures an Express.js application with comprehensive security, routing, error handling, and lifecycle management.

---

## File Structure & Flow

### 1. Environment Configuration (Lines 1-16)
```typescript
import dotenv from 'dotenv'

// Load main .env first
dotenv.config({ path: '../.env' })

// Load environment-specific configuration
const nodeEnv = process.env.NODE_ENV || 'development'
const envFile = nodeEnv === 'test' ? '../.env.test' : ...
dotenv.config({ path: envFile })
```

**What it does:**
- Loads environment variables in two stages:
  1. First loads the main `.env` file (shared config)
  2. Then loads environment-specific file (`.env.development`, `.env.test`, or `.env.production`)
- This allows environment-specific overrides while maintaining base configuration
- Defaults to `'development'` if `NODE_ENV` is not set

**Why this matters:**
- Different environments need different configurations (API keys, database URLs, ports)
- Staging/production can override development defaults
- Keeps sensitive data out of source code

---

### 2. Router Imports (Lines 18-31)
```typescript
import agentRouter from './routes/agentRouter'
import sessionRouter from './routes/sessionRouter'
// ... etc
```

**What it does:**
- Imports all API route handlers before the server starts
- Each router handles a specific domain of functionality

**Router breakdown:**
- **agentRouter**: AI chat/inference endpoints
- **sessionRouter**: Chat session persistence
- **personasRouter**: AI persona management (CRUD)
- **modelsRouter**: AI model registry
- **memoryRouter**: Context/pins/summaries system
- **patientsRouter**: Patient management (eldercare)
- **providersRouter**: Healthcare provider management
- **medicationsRouter**: Medication tracking
- **vitalsRouter**: Vital signs tracking (weight, glucose)
- **appointmentsRouter**: Appointment scheduling
- **caregiversRouter**: Caregiver profile management
- **searchRouter**: Web search integration (Tavily API)

---

### 3. Database Initialization (Line 33-34)
```typescript
import './db/init'
```

**What it does:**
- Executes `db/init.ts` immediately on import
- Creates/migrates database tables
- Seeds default personas
- Sets up foreign keys and indexes

**Critical detail:**
- This runs **before** the server starts listening
- Ensures database is ready before accepting requests
- If this fails, the entire server startup fails (intentional safety)

---

### 4. Middleware Imports (Lines 36-49)
```typescript
import {
  corsMiddleware,
  helmetMiddleware,
  generalRateLimit,
  securityLogger,
  requestTimeout,
  requestSizeLimit,
} from './middleware/security'
```

**What it does:**
- Imports pre-configured middleware for security and error handling
- Security middleware protects against common web vulnerabilities
- Error middleware provides consistent error responses

---

### 5. Server Configuration (Lines 51-58)
```typescript
const app = express()
const PORT = Number(process.env.PORT) || 3000

if (process.env.TRUST_PROXY === '1' || nodeEnv === 'production') {
  app.set('trust proxy', 1)
}
```

**What it does:**
- Creates the Express application instance
- Sets port from environment variable or defaults to 3000
- Configures proxy trust for production environments

**Trust Proxy explanation:**
- When behind a reverse proxy (nginx, Cloudflare, fly.io), the real client IP is in `X-Forwarded-For` headers
- Without this setting, Express sees all requests coming from the proxy's IP
- Critical for rate limiting and security logging to work correctly
- Only enabled in production or when explicitly set

---

### 6. Security Middleware Application (Lines 60-72)
```typescript
app.use(helmetMiddleware)
app.use(corsMiddleware)
app.use(securityLogger)
app.use(requestTimeout())
app.use(generalRateLimit)
app.use(express.json(requestSizeLimit.json))
app.use(express.urlencoded(requestSizeLimit.urlencoded))
```

**Execution order matters!** Middleware runs top-to-bottom:

1. **helmetMiddleware**: Sets security HTTP headers (XSS protection, content security policy, etc.)
2. **corsMiddleware**: Handles Cross-Origin Resource Sharing (allows frontend to call API)
3. **securityLogger**: Logs all incoming requests with timestamps and details
4. **requestTimeout()**: Prevents requests from hanging forever
5. **generalRateLimit**: Limits request frequency per IP (prevents abuse/DoS)
6. **express.json()**: Parses JSON request bodies with size limits
7. **express.urlencoded()**: Parses URL-encoded form data with size limits

**Why size limits matter:**
- Prevents attackers from sending massive payloads to crash the server
- Default limits are set in `requestSizeLimit` object

---

### 7. Health Check Endpoint (Lines 74-82)
```typescript
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    environment: nodeEnv,
    version: process.env.APP_VERSION || 'dev',
  })
})
```

**What it does:**
- Simple endpoint to check if server is alive
- Returns current time, environment, and version

**Use cases:**
- Load balancers use this to check if instance is healthy
- Monitoring systems ping this to detect downtime
- DevOps can verify deployment succeeded
- No authentication required (public health status)

---

### 8. Model Status Endpoint (Lines 84-121)
```typescript
app.get('/api/models/status', async (req, res) => {
  try {
    const { fetch } = await import('undici')
    const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434'
    
    // Check if Ollama is running
    const healthResponse = await fetch(`${ollamaUrl}/api/tags`, { method: 'GET' })
      .catch(() => null)
    
    if (!healthResponse?.ok) {
      return res.json({
        ollama: { status: 'offline', message: 'Ollama service not accessible' },
        models: [],
      })
    }
    
    // Get loaded models
    const modelsResponse = await fetch(`${ollamaUrl}/api/ps`, { method: 'GET' })
      .catch(() => null)
    
    let loadedModels: string[] = []
    if (modelsResponse?.ok) {
      const data = await modelsResponse.json() as { models?: Array<{ name: string }> }
      loadedModels = data.models?.map(m => m.name) || []
    }
    
    res.json({
      ollama: { status: 'online', url: ollamaUrl },
      models: {
        loaded: loadedModels,
        total: loadedModels.length,
      },
    })
  } catch (error) {
    res.status(500).json({
      error: 'Failed to check model status',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})
```

**What it does:**
- Checks if Ollama (local AI server) is running
- Returns which AI models are currently loaded in memory
- Provides diagnostic information for troubleshooting

**Technical details:**
1. **Dynamic import of `undici`**: Modern fetch implementation for Node.js
2. **Two API calls to Ollama**:
   - `/api/tags`: Check if Ollama is accessible
   - `/api/ps`: Get list of loaded models
3. **Graceful failure**: Returns offline status instead of crashing if Ollama is down
4. **Error handling**: Catches network failures and returns structured error response

**Use cases:**
- Frontend can show which models are available
- Admins can verify Ollama is running
- Debugging local AI integration issues

---

### 9. API Router Registration (Lines 123-148)
```typescript
// --- Routers ---
// Chat & inference
app.use('/api/agent', agentRouter)

// Session persistence
app.use('/api/sessions', sessionRouter)

// Persona management
app.use('/api/personas', personasRouter)

// Model registry
app.use('/api/models', modelsRouter)

// Memory system
app.use('/api/memory', memoryRouter)

// Eldercare management
app.use('/api/patients', patientsRouter)
app.use('/api/providers', providersRouter)
app.use('/api/medications', medicationsRouter)
app.use('/api/vitals', vitalsRouter)
app.use('/api/appointments', appointmentsRouter)
app.use('/api/caregivers', caregiversRouter)
app.use('/api/search', searchRouter)
```

**What it does:**
- Mounts each router at its designated path
- All routes in `agentRouter` will be prefixed with `/api/agent`
- All routes in `patientsRouter` will be prefixed with `/api/patients`
- etc.

**Router organization:**
- **Core AI features**: agent, sessions, personas, models, memory
- **Eldercare features**: patients, providers, medications, vitals, appointments, caregivers
- **Utilities**: search

**Example routing:**
- `agentRouter` defines `POST /chat` → becomes `POST /api/agent/chat`
- `patientsRouter` defines `GET /` → becomes `GET /api/patients`
- `patientsRouter` defines `GET /:id` → becomes `GET /api/patients/:id`

---

### 10. Error Handlers (Lines 150-155)
```typescript
// --- 404 handler ---
app.use(notFoundHandler)

// --- Global error handler (must be last) ---
app.use(errorHandler)
```

**What it does:**
- **notFoundHandler**: Catches requests to non-existent routes
- **errorHandler**: Catches all errors from previous middleware/routes

**Critical ordering:**
- These must be registered **after** all routes
- Express processes middleware in order
- If no route matches, it falls through to 404 handler
- If any route throws an error, it falls through to error handler

**Example flow:**
```
Request: GET /api/nonexistent
→ Checks all routers (no match)
→ Falls through to notFoundHandler
→ Returns 404 JSON response

Request: GET /api/patients (throws database error)
→ Error thrown in patientsRouter
→ Caught by errorHandler
→ Returns 500 JSON response with error details
```

---

### 11. Process Error Handlers (Line 157-158)
```typescript
setupGlobalErrorHandlers()
```

**What it does:**
- Sets up Node.js process-level error handlers
- Catches unhandled promise rejections
- Catches uncaught exceptions
- Prevents silent crashes

**Defined in `errorMiddleware.ts`**:
- Logs error details for debugging
- Attempts graceful shutdown on fatal errors
- Prevents server from running in corrupted state

---

### 12. Server Startup (Lines 160-177)
```typescript
const server = app.listen(PORT, async () => {
  logger.info('Server started successfully', {
    service: 'kalito-backend',
    port: PORT,
    environment: nodeEnv,
  })

  // Keep-alive heartbeat
  const heartbeat = setInterval(() => {
    console.log(`💓 Server heartbeat - ${new Date().toISOString()}`)
  }, 60_000)

  server.on('close', () => {
    clearInterval(heartbeat)
    console.log('🔴 Server closed')
  })
})
```

**What it does:**
1. **Starts listening** on configured port (3000 by default)
2. **Logs startup** with structured logging (includes port, environment)
3. **Starts heartbeat** that logs every 60 seconds
4. **Registers close handler** to clean up heartbeat timer

**Heartbeat purpose:**
- Keeps process "warm" on certain cloud hosts (prevents hibernation)
- Provides visible confirmation server is still running
- Helps with debugging (can see if server froze)

**Callback timing:**
- The callback only runs **after** the server successfully binds to the port
- If port is already in use, this callback never runs and an error is thrown

---

### 13. Server Error Logging (Lines 179-184)
```typescript
server.on('error', error => {
  console.error('🔥 Server error:', error)
  console.error('Stack trace:', (error as any).stack)
})
```

**What it does:**
- Catches server-level errors (port already in use, permission denied, etc.)
- Logs full error details including stack trace
- Does **not** crash the process (allows graceful handling)

**Common errors caught here:**
- `EADDRINUSE`: Port 3000 already in use
- `EACCES`: Permission denied (trying to use port < 1024 without sudo)
- Network interface errors

---

### 14. Process Lifecycle Logging (Lines 186-195)
```typescript
process.on('exit', code => {
  console.log(`🚪 Process exiting with code: ${code}`)
})

process.on('beforeExit', code => {
  console.log(`⚠️  Process about to exit with code: ${code}`)
})
```

**What it does:**
- Logs when Node.js process is shutting down
- `beforeExit` fires before cleanup begins
- `exit` fires as last event before process terminates

**Exit codes:**
- `0`: Normal shutdown (successful)
- `1`: General error
- `2`: Misuse of shell command
- `3+`: Application-specific errors

**Use cases:**
- Debugging unexpected crashes
- Verifying graceful shutdowns
- Audit logging

---

### 15. Graceful Shutdown Handler (Lines 197-212)
```typescript
function shutdown(signal: string) {
  console.log(`${signal} received, shutting down gracefully`)
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
```

**What it does:**
- Handles termination signals from operating system
- Stops accepting new connections
- Waits for in-flight requests to complete
- Exits cleanly once all requests finish

**Signals explained:**
- **SIGTERM**: "Please terminate" (polite, sent by Docker, k8s, systemd)
- **SIGINT**: Ctrl+C in terminal (user initiated)

**Graceful shutdown flow:**
1. Signal received (e.g., `docker stop` sends SIGTERM)
2. `server.close()` called - stops accepting new connections
3. Existing connections kept alive to finish their requests
4. Once all connections closed, callback fires
5. `process.exit(0)` terminates process with success code

**Why this matters:**
- In-flight requests don't get dropped mid-processing
- Database transactions can complete
- Users don't get unexpected errors
- Logs are flushed before exit

**Without graceful shutdown:**
- Database writes could be lost
- Users would see "connection reset" errors
- Logs might not be written to disk
- Could leave database in inconsistent state

---

## Complete Request Flow Example

Let's trace a request through the entire system:

### Example: `POST /api/patients` (Create new patient)

1. **Network Layer**: Request arrives at port 3000
2. **Trust Proxy**: Express reads real client IP from X-Forwarded-For
3. **Helmet**: Sets security headers on response
4. **CORS**: Checks if origin is allowed
5. **Security Logger**: Logs request details
6. **Request Timeout**: Starts 30-second timer
7. **Rate Limiter**: Checks if IP has exceeded request limit
8. **Body Parser**: Parses JSON body into req.body
9. **Router Matching**: Express finds `/api/patients` matches patientsRouter
10. **Route Handler**: patientsRouter validates and saves patient to database
11. **Response Sent**: Returns 201 Created with patient data
12. **Cleanup**: Request timer cleared, connection released

### Example: `GET /api/nonexistent` (404 error)

1. Steps 1-9 same as above
2. **Router Matching**: No router matches `/api/nonexistent`
3. **404 Handler**: notFoundHandler catches and returns 404 JSON
4. **Response Sent**: Returns 404 with error message

### Example: Database error during request

1. Steps 1-9 same as above
2. **Route Handler**: Throws database connection error
3. **Error Handler**: errorHandler catches error
4. **Error Logging**: Logs error details with stack trace
5. **Response Sent**: Returns 500 with sanitized error message

---

## Key Design Patterns

### 1. **Separation of Concerns**
- Routers handle business logic
- Middleware handles cross-cutting concerns (security, logging)
- Server.ts is just configuration and wiring

### 2. **Defense in Depth**
- Multiple security layers (helmet, CORS, rate limiting, size limits)
- If one fails, others still protect

### 3. **Fail-Safe Defaults**
- Port defaults to 3000
- Environment defaults to development
- Trust proxy off by default (safer)

### 4. **Graceful Degradation**
- Ollama offline? Return offline status instead of crashing
- Database error? Return 500 instead of crashing
- Invalid route? Return 404 instead of crashing

### 5. **Observability**
- Health check endpoint
- Request logging
- Error logging
- Process lifecycle logging
- Heartbeat for liveness

---

## Environment Variables Used

| Variable | Default | Purpose |
|----------|---------|---------|
| `NODE_ENV` | `'development'` | Environment mode |
| `PORT` | `3000` | Server listening port |
| `TRUST_PROXY` | `undefined` | Enable proxy trust |
| `APP_VERSION` | `'dev'` | Version string for health check |
| `OLLAMA_URL` | `'http://localhost:11434'` | Ollama API endpoint |

Plus any variables used by imported routers (API keys, database URLs, etc.)

---

## Critical Dependencies

### Production Dependencies
- **express**: Web framework
- **dotenv**: Environment variable loading
- **undici**: Modern HTTP client for Node.js

### Middleware (from ./middleware/)
- **security.ts**: CORS, Helmet, rate limiting, timeouts, size limits
- **errorMiddleware.ts**: 404 handler, error handler, process handlers

### Routers (from ./routes/)
- 12 total routers for different API domains

### Database (from ./db/)
- **init.ts**: Database setup (runs on import)

---

## Startup Sequence

```
1. Load .env files
2. Import all dependencies
3. Run database initialization (./db/init)
4. Create Express app
5. Configure trust proxy (if needed)
6. Apply security middleware
7. Register health check endpoint
8. Register model status endpoint
9. Register all API routers
10. Register 404 handler
11. Register error handler
12. Setup process error handlers
13. Start listening on port
14. Start heartbeat timer
15. Setup shutdown handlers
16. ✅ Server ready to accept requests
```

---

## Security Features

1. **Helmet**: Sets HTTP headers to prevent common attacks
2. **CORS**: Prevents unauthorized cross-origin requests
3. **Rate Limiting**: Prevents abuse and DoS attacks
4. **Size Limits**: Prevents memory exhaustion from large payloads
5. **Request Timeout**: Prevents resource exhaustion from slow requests
6. **Trust Proxy**: Correctly identifies client IPs behind proxies
7. **Error Sanitization**: Doesn't leak sensitive details in error responses
8. **Process Error Handlers**: Prevents crashes from unhandled errors

---

## Production Considerations

### Scaling
- This server is **stateless** (no in-memory session storage)
- Can run multiple instances behind a load balancer
- Database is shared resource (all instances connect to same DB)

### Monitoring
- Health check at `/api/health` for load balancers
- Structured logging for log aggregation
- Heartbeat for liveness detection
- Model status endpoint for diagnostic

### Deployment
- Graceful shutdown ensures zero-downtime deployments
- Trust proxy setting required for most cloud platforms
- Environment-specific .env files for config management

### Error Recovery
- Unhandled errors logged but don't crash server
- Database init errors **do** crash server (intentional - fail fast)
- Network errors to external services handled gracefully

---

## Common Issues & Solutions

### Issue: Server won't start
**Symptom**: Process exits immediately after startup
**Likely cause**: Database initialization failed
**Solution**: Check database file permissions, check init.ts for errors

### Issue: Rate limiting too aggressive
**Symptom**: Legitimate requests getting 429 errors
**Solution**: Adjust rate limit in security.ts middleware

### Issue: CORS errors in browser
**Symptom**: Frontend can't call API, "blocked by CORS policy"
**Solution**: Check CORS configuration in security.ts, ensure frontend origin is allowed

### Issue: "Port 3000 already in use"
**Symptom**: EADDRINUSE error on startup
**Solution**: Kill existing process on port 3000 or set different PORT in .env

### Issue: Real client IPs showing as proxy IP
**Symptom**: All requests logged with same IP
**Solution**: Enable `trust proxy` setting (set `TRUST_PROXY=1` in .env)

---

## Future Enhancement Opportunities

1. **Metrics endpoint**: Add `/api/metrics` with Prometheus-style metrics
2. **WebSocket support**: Add socket.io for real-time features
3. **API versioning**: Add `/api/v1/` prefix for version management
4. **Request ID tracking**: Add correlation IDs for request tracing
5. **Health check improvements**: Check database connectivity, external service status
6. **Rate limit per-user**: Current rate limit is per-IP, could be per-auth-token
7. **Request replay protection**: Add nonce checking for critical endpoints
8. **API documentation**: Add Swagger/OpenAPI endpoint at `/api/docs`

---

## Summary

**server.ts is the orchestrator** - it doesn't contain business logic, but rather:
- Configures the environment
- Applies security layers
- Routes requests to appropriate handlers
- Handles errors gracefully
- Manages server lifecycle
- Provides operational endpoints

It follows the **"configuration over convention"** pattern - everything is explicit and configurable through environment variables and middleware composition.
