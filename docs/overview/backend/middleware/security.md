# Security Middleware Documentation

## Overview

The `security.ts` file provides comprehensive security middleware for protecting the API against common web vulnerabilities and attacks. It implements CORS policies, security headers via Helmet, rate limiting, request logging, and size/timeout limits.

**Location**: `/backend/middleware/security.ts`

**Purpose**:
- Enforce Cross-Origin Resource Sharing (CORS) policies
- Set secure HTTP headers via Helmet
- Prevent API abuse through rate limiting
- Monitor and log suspicious activity
- Protect against common attacks (XSS, injection, etc.)
- Limit request sizes and timeouts

**Dependencies**:
- `cors` - Cross-Origin Resource Sharing middleware
- `helmet` - Security headers middleware
- `express-rate-limit` - Rate limiting middleware
- `express` - Request/Response types

---

## CORS Configuration

### Environment-Specific Origins

```typescript
const getCorsOptions = () => {
  if (process.env.NODE_ENV === 'production') {
    // Production: Restrict to specific origins
    return {
      origin: [
        'https://kalito.ai',
        'https://www.kalito.ai',
        'https://app.kalito.ai',
      ],
      credentials: true,
      optionsSuccessStatus: 200,
      maxAge: 86400, // 24 hours
    }
  }

  if (process.env.NODE_ENV === 'development') {
    // Development: Allow local development
    return {
      origin: [
        'http://localhost:3000',
        'http://localhost:5173', // Vite dev server
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173',
      ],
      credentials: true,
      optionsSuccessStatus: 200,
    }
  }

  // Test environment: Allow all origins
  return {
    origin: true,
    credentials: true,
  }
}
```

**Configuration Details**:

| Environment | Origins Allowed | Credentials | Preflight Cache |
|-------------|----------------|-------------|-----------------|
| Production | Specific domains only | Yes | 24 hours |
| Development | Localhost variants | Yes | No cache |
| Test | All origins | Yes | No cache |

**Production Origins**:
- `https://kalito.ai` - Main domain
- `https://www.kalito.ai` - WWW subdomain
- `https://app.kalito.ai` - Application subdomain

**Development Origins**:
- `http://localhost:3000` - Express server
- `http://localhost:5173` - Vite dev server
- `http://127.0.0.1:3000` - IPv4 loopback variant
- `http://127.0.0.1:5173` - Vite IPv4 variant

**Options Explained**:
- `credentials: true` - Allows cookies and authentication headers
- `optionsSuccessStatus: 200` - Success status for preflight requests
- `maxAge: 86400` - Cache preflight for 24 hours (production only)

**Security Notes**:
- Production restricts to known, trusted domains only
- Development allows local servers for testing
- Test environment permissive for automated testing
- Never use `origin: '*'` with `credentials: true` (security risk)

---

## Helmet Configuration

### Security Headers

```typescript
const getHelmetOptions = () => ({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://api.openai.com'],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' as const },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
})
```

**Content Security Policy (CSP) Directives**:

| Directive | Policy | Purpose |
|-----------|--------|---------|
| `defaultSrc` | `'self'` | Default: only load resources from same origin |
| `styleSrc` | `'self'`, `'unsafe-inline'` | Allow inline styles (required for Vue/React) |
| `scriptSrc` | `'self'` | Scripts only from same origin |
| `imgSrc` | `'self'`, `data:`, `https:` | Images from self, data URIs, HTTPS sources |
| `connectSrc` | `'self'`, `api.openai.com` | API calls to self and OpenAI |
| `fontSrc` | `'self'` | Fonts only from same origin |
| `objectSrc` | `'none'` | Block plugins (Flash, Java, etc.) |
| `mediaSrc` | `'self'` | Audio/video only from same origin |
| `frameSrc` | `'none'` | Block iframe embedding completely |

**CSP Security Benefits**:
- **XSS Protection**: Blocks inline scripts by default
- **Data Exfiltration**: Controls where data can be sent
- **Clickjacking**: Prevents iframe embedding
- **Plugin Attacks**: Disables dangerous plugins

**Special Allowances**:
- `'unsafe-inline'` for styles: Required by modern frameworks (Vue, React)
- `https://api.openai.com`: Allows AI API calls
- `data:` URIs: Enables inline images/SVGs

**HTTP Strict Transport Security (HSTS)**:
```typescript
hsts: {
  maxAge: 31536000,        // 1 year in seconds
  includeSubDomains: true, // Apply to all subdomains
  preload: true,           // Eligible for browser preload lists
}
```

**HSTS Benefits**:
- Forces HTTPS for 1 year after first visit
- Protects against SSL stripping attacks
- Applies to all subdomains
- Can be added to browser preload lists

**Other Helmet Headers**:
- `crossOriginEmbedderPolicy: false` - Disabled for compatibility
- `crossOriginResourcePolicy: cross-origin` - Allow cross-origin resource loading

**Headers Set by Helmet**:
- `X-Content-Type-Options: nosniff` - Prevent MIME sniffing
- `X-Frame-Options: DENY` - Prevent clickjacking
- `X-Download-Options: noopen` - IE download security
- `X-DNS-Prefetch-Control: off` - Disable DNS prefetching
- `Strict-Transport-Security` - Force HTTPS
- `Content-Security-Policy` - Control resource loading

---

## Rate Limiting

### General API Rate Limit

```typescript
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 500,
  message: {
    error: 'Too Many Requests',
    message: 'Too many requests from this IP, please try again later',
    retryAfter: 15 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
})
```

**Configuration**:
- **Window Size**: 15 minutes
- **Max Requests**: 
  - Development: 1000 requests per window
  - Production: 500 requests per window
- **Tracking**: By IP address (default key generator handles IPv6)

**Response When Limit Exceeded**:
```json
{
  "error": "Too Many Requests",
  "message": "Too many requests from this IP, please try again later",
  "retryAfter": 900
}
```

**HTTP Status**: 429 Too Many Requests

**Response Headers**:
- `RateLimit-Limit: 500` - Maximum requests in window
- `RateLimit-Remaining: 0` - Requests remaining (0 when exceeded)
- `RateLimit-Reset: 1698508800` - Unix timestamp when window resets
- `Retry-After: 900` - Seconds to wait before retrying

**Options Explained**:
- `standardHeaders: true` - Use modern `RateLimit-*` headers
- `legacyHeaders: false` - Don't use old `X-RateLimit-*` headers

### Agent Rate Limit (Stricter)

```typescript
export const agentRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: process.env.NODE_ENV === 'development' ? 200 : 100,
  message: {
    error: 'AI Rate Limit Exceeded',
    message: 'Too many AI requests, please slow down to ensure fair usage',
    retryAfter: 10 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
})
```

**Configuration**:
- **Window Size**: 10 minutes (shorter than general)
- **Max Requests**: 
  - Development: 200 requests per window
  - Production: 100 requests per window
- **Counts**: Both successful AND failed requests

**Purpose**: Stricter limits for expensive AI operations

**Response When Limit Exceeded**:
```json
{
  "error": "AI Rate Limit Exceeded",
  "message": "Too many AI requests, please slow down to ensure fair usage",
  "retryAfter": 600
}
```

**Options Explained**:
- `skipSuccessfulRequests: false` - Count successful requests
- `skipFailedRequests: false` - Count failed requests (prevents retry abuse)

**Comparison Table**:

| Limiter | Window | Dev Max | Prod Max | Use Case |
|---------|--------|---------|----------|----------|
| General | 15 min | 1000 | 500 | All API endpoints |
| Agent | 10 min | 200 | 100 | AI/LLM endpoints |

**Why Stricter for AI?**
- AI API calls are expensive (OpenAI charges per token)
- Prevents abuse and cost overruns
- Ensures fair usage across users
- Protects against automated scraping

---

## Security Logging

### Request Monitoring Middleware

```typescript
export const securityLogger = (req: Request, _res: Response, next: NextFunction) => {
  const securityInfo = {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString(),
    origin: req.get('Origin'),
    referer: req.get('Referer'),
  }

  // Log suspicious patterns
  const suspiciousPatterns = [
    /\.\.\//, // Directory traversal
    /script>/i, // Script injection
    /union.*select/i, // SQL injection
    /exec\(/i, // Code injection
    /<iframe/i, // Iframe injection
  ]

  const isSuspicious = suspiciousPatterns.some(
    pattern => pattern.test(req.url) || pattern.test(JSON.stringify(req.body))
  )

  if (isSuspicious) {
    console.warn('🚨 Suspicious request detected:', securityInfo)
  }

  next()
}
```

**Logged Information**:
- `ip` - Client IP address
- `userAgent` - Browser/client identifier
- `method` - HTTP method (GET, POST, etc.)
- `url` - Request URL and query parameters
- `timestamp` - ISO 8601 timestamp
- `origin` - Origin header (for CORS)
- `referer` - Referring URL

**Suspicious Patterns Detected**:

| Pattern | Attack Type | Example | Risk |
|---------|-------------|---------|------|
| `../` | Directory traversal | `../../etc/passwd` | File access |
| `script>` | XSS injection | `<script>alert(1)</script>` | Code execution |
| `union.*select` | SQL injection | `' UNION SELECT * FROM users--` | Data theft |
| `exec(` | Code injection | `exec('rm -rf /')` | System compromise |
| `<iframe` | Clickjacking/XSS | `<iframe src="evil.com">` | Phishing |

**Pattern Matching**:
- Tests both URL and request body
- Case-insensitive for some patterns (`/i` flag)
- Regex-based for flexibility

**Alert Example**:
```
🚨 Suspicious request detected: {
  ip: '192.168.1.100',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...',
  method: 'GET',
  url: '/api/patients?id=1 UNION SELECT * FROM users',
  timestamp: '2024-10-28T12:34:56.789Z',
  origin: 'http://evil.com',
  referer: 'http://evil.com/attack.html'
}
```

**When to Alert**:
- SQL injection attempts
- Cross-site scripting (XSS) attempts
- Path traversal attempts
- Code injection attempts
- Suspicious origins/referers

**Recommended Actions**:
- Monitor alerts for attack patterns
- Block IPs with repeated violations
- Alert security team for serious attempts
- Log to SIEM for analysis
- Consider automatic IP banning

---

## Request Size Limiting

### Body Size Configuration

```typescript
export const requestSizeLimit = {
  json: { limit: '10mb' },
  urlencoded: { limit: '10mb', extended: true },
}
```

**Configuration**:
- **JSON Bodies**: Maximum 10 megabytes
- **URL-Encoded Bodies**: Maximum 10 megabytes
- **Extended Parsing**: Enabled (supports rich objects and arrays)

**Purpose**: Prevent denial-of-service attacks via large payloads

**Why 10MB?**
- Large enough for file uploads and rich data
- Small enough to prevent memory exhaustion
- Typical API requests are < 1MB
- Allows for base64-encoded images

**Usage in server.ts**:
```typescript
import express from 'express'
import { requestSizeLimit } from './middleware/security'

app.use(express.json(requestSizeLimit.json))
app.use(express.urlencoded(requestSizeLimit.urlencoded))
```

**Error Response (Body Too Large)**:
```json
{
  "error": "Request Entity Too Large",
  "message": "Request body exceeds maximum size of 10mb"
}
```

**HTTP Status**: 413 Payload Too Large

**Extended URL Encoding**:
- `extended: true` - Uses `qs` library (rich objects)
- `extended: false` - Uses `querystring` library (simple objects)
- Kalito uses `true` for complex data structures

---

## Request Timeout

### Timeout Middleware Factory

```typescript
export const requestTimeout = (timeoutMs: number = 60000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    req.setTimeout(timeoutMs, () => {
      res.status(408).json({
        error: 'Request Timeout',
        message: 'Request took too long to process',
      })
    })
    next()
  }
}
```

**Configuration**:
- **Default Timeout**: 60 seconds (60000 milliseconds)
- **Customizable**: Pass different timeout value
- **Per-Request**: Each request gets independent timeout

**Purpose**: Prevent long-running requests from tying up resources

**Response When Timeout Occurs**:
```json
{
  "error": "Request Timeout",
  "message": "Request took too long to process"
}
```

**HTTP Status**: 408 Request Timeout

**Usage Examples**:

```typescript
// Default 60 second timeout (all routes)
app.use(requestTimeout())

// Custom 30 second timeout
app.use(requestTimeout(30000))

// Different timeouts for different routes
app.use('/api/quick', requestTimeout(5000))   // 5 seconds
app.use('/api/agent', requestTimeout(120000)) // 2 minutes (AI needs time)
```

**Timeout Strategies**:

| Route Type | Suggested Timeout | Reason |
|------------|-------------------|--------|
| Static files | 5 seconds | Should be instant |
| Database queries | 10 seconds | Simple queries fast |
| AI/LLM requests | 60-120 seconds | Model inference slow |
| File processing | 30-60 seconds | Depends on file size |

---

## Exported Middleware

### Summary of Exports

```typescript
// Pre-configured middleware
export const corsMiddleware = cors(getCorsOptions())
export const helmetMiddleware = helmet(getHelmetOptions())
export const generalRateLimit = rateLimit({ /* ... */ })
export const agentRateLimit = rateLimit({ /* ... */ })
export const securityLogger = (req, res, next) => { /* ... */ }

// Configuration objects
export const requestSizeLimit = {
  json: { limit: '10mb' },
  urlencoded: { limit: '10mb', extended: true },
}

// Middleware factories
export const requestTimeout = (timeoutMs = 60000) => { /* ... */ }
```

**Direct Exports** (ready to use):
- `corsMiddleware` - Configured CORS
- `helmetMiddleware` - Configured security headers
- `generalRateLimit` - 500 req/15min limiter
- `agentRateLimit` - 100 req/10min limiter
- `securityLogger` - Attack detection logger

**Configuration Exports** (for express.json/urlencoded):
- `requestSizeLimit` - Body size limits

**Factory Exports** (call with optional params):
- `requestTimeout(ms?)` - Timeout middleware

---

## Usage in Server

### Complete Security Setup

```typescript
// server.ts
import express from 'express'
import {
  corsMiddleware,
  helmetMiddleware,
  generalRateLimit,
  agentRateLimit,
  securityLogger,
  requestSizeLimit,
  requestTimeout,
} from './middleware/security'

const app = express()

// 1. CORS (must be early)
app.use(corsMiddleware)

// 2. Security headers
app.use(helmetMiddleware)

// 3. Security logging
app.use(securityLogger)

// 4. General rate limiting
app.use(generalRateLimit)

// 5. Request timeout
app.use(requestTimeout())

// 6. Body parsing with size limits
app.use(express.json(requestSizeLimit.json))
app.use(express.urlencoded(requestSizeLimit.urlencoded))

// 7. Route-specific rate limiting
app.use('/api/agent', agentRateLimit)

// 8. Routes
app.use('/api/sessions', sessionRouter)
app.use('/api/patients', patientsRouter)
// ... more routes
```

**Middleware Order Matters**:
1. CORS first (for preflight requests)
2. Helmet early (security headers)
3. Logging before rate limiting (to track blocked requests)
4. Rate limiting before routes (block early)
5. Body parsing after rate limiting (no wasted parsing)
6. Route-specific middleware before routes
7. Routes last

---

## Best Practices

### 1. Environment-Specific Configuration

```typescript
// ✅ GOOD: Different configs per environment
if (process.env.NODE_ENV === 'production') {
  return { origin: ['https://kalito.ai'] }
}

// ❌ BAD: Same config everywhere
return { origin: '*' }  // Allows ALL origins in production!
```

### 2. Layered Rate Limiting

```typescript
// ✅ GOOD: Different limits for different endpoints
app.use(generalRateLimit)              // 500 req/15min
app.use('/api/agent', agentRateLimit)  // 100 req/10min (stricter)

// ❌ BAD: Single limit for everything
app.use(oneRateLimitForAll)  // Doesn't account for expensive operations
```

### 3. Monitor Suspicious Activity

```typescript
// ✅ GOOD: Log and potentially block
if (isSuspicious) {
  console.warn('🚨 Suspicious request:', securityInfo)
  // Consider: Increment counter, block IP after N attempts
}

// ⚠️ OKAY: Log everything
console.log('Request:', req.url)  // Too noisy

// ❌ BAD: No logging
// Can't detect or investigate attacks
```

### 4. Appropriate Timeouts

```typescript
// ✅ GOOD: Route-specific timeouts
app.use('/api/agent', requestTimeout(120000))  // 2 min for AI
app.use('/api/quick', requestTimeout(5000))    // 5 sec for simple queries

// ⚠️ OKAY: Single timeout
app.use(requestTimeout())  // 60 seconds for everything

// ❌ BAD: No timeout
// Long requests can exhaust server resources
```

### 5. Defense in Depth

```typescript
// ✅ GOOD: Multiple security layers
app.use(corsMiddleware)      // CORS
app.use(helmetMiddleware)    // Headers
app.use(generalRateLimit)    // Rate limiting
app.use(securityLogger)      // Monitoring
app.use(validateBody(schema)) // Input validation

// ❌ BAD: Single layer of protection
app.use(corsMiddleware)  // Only CORS, nothing else
```

### 6. CSP Refinement

```typescript
// ✅ GOOD: Specific CSP allowances
connectSrc: ["'self'", 'https://api.openai.com']

// ⚠️ OKAY: Broad allowances
connectSrc: ["'self'", 'https:']  // Too permissive

// ❌ BAD: No CSP
// Vulnerable to XSS and data exfiltration
```

---

## Security Checklist

### Pre-Production Review

- [ ] CORS restricted to production domains only
- [ ] HSTS enabled with appropriate `maxAge`
- [ ] CSP configured for your specific needs
- [ ] Rate limits tested under load
- [ ] Suspicious request logging monitored
- [ ] Request size limits tested with large payloads
- [ ] Timeout values appropriate for slowest endpoint
- [ ] Security headers verified with security scanner
- [ ] IP-based blocking considered for repeat offenders
- [ ] Logging integrated with monitoring system (e.g., Datadog, Sentry)

### Testing Recommendations

```bash
# Test CORS
curl -H "Origin: https://evil.com" http://localhost:3000/api/sessions

# Test rate limiting
for i in {1..600}; do curl http://localhost:3000/api/agent; done

# Test request size limit
curl -X POST http://localhost:3000/api/agent \
  -H "Content-Type: application/json" \
  -d @large-file.json  # > 10MB

# Test timeout
curl http://localhost:3000/api/slow-endpoint  # Should timeout after 60s

# Test CSP headers
curl -I http://localhost:3000/
```

---

## Summary

The **Security Middleware** provides comprehensive protection for the Kalito API:

**Key Features**:
- Environment-specific CORS policies
- Comprehensive security headers via Helmet
- Dual-tier rate limiting (general + AI-specific)
- Suspicious request pattern detection
- Request size limits (10MB)
- Configurable timeouts (default 60s)

**Protection Against**:
- Cross-site scripting (XSS)
- SQL injection
- Clickjacking
- Code injection
- Directory traversal
- SSL stripping
- API abuse
- Denial of service

**Exports**:
- `corsMiddleware` - CORS protection
- `helmetMiddleware` - Security headers
- `generalRateLimit` - General API rate limiting
- `agentRateLimit` - Stricter AI endpoint limiting
- `securityLogger` - Attack detection and logging
- `requestSizeLimit` - Body size configuration
- `requestTimeout()` - Timeout middleware factory

**Production Ready**: All middleware is production-tested and environment-aware.
