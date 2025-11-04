import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { Request, Response, NextFunction } from 'express'

/**
 * Environment-specific CORS configuration
 */
const getCorsOptions = () => {
  if (process.env.NODE_ENV === 'production') {
    // Production: Restrict to specific origins
    return {
      origin: [
        'https://kalito.ai',
        'https://www.kalito.ai',
        'https://app.kalito.ai',
        // Add your production domains
      ],
      credentials: true,
      optionsSuccessStatus: 200,
      maxAge: 86400, // 24 hours
    }
  }

  if (process.env.NODE_ENV === 'development') {
    // Development: Allow local development + Android app
    return {
      origin: [
        'http://localhost:3000',
        'http://localhost:5173', // Vite dev server
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173',
        'http://192.168.1.96:5173', // Network IP for mobile testing
        'https://192.168.1.96:5173', // HTTPS network access
        'capacitor://localhost', // Android app (Capacitor)
        'http://localhost', // Android WebView fallback
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

/**
 * Helmet configuration for security headers
 */
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

/**
 * General API rate limiting
 */
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 500, // More lenient in development
  message: {
    error: 'Too Many Requests',
    message: 'Too many requests from this IP, please try again later',
    retryAfter: 15 * 60, // 15 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use default key generator to handle IPv6 properly
})

/**
 * Stricter rate limiting for AI agent endpoints
 */
export const agentRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: process.env.NODE_ENV === 'development' ? 200 : 100, // More lenient in development
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

/**
 * Export configured middleware
 */
export const corsMiddleware = cors(getCorsOptions())
export const helmetMiddleware = helmet(getHelmetOptions())

/**
 * Request logging middleware for security monitoring
 */
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

/**
 * Request size limiter
 */
export const requestSizeLimit = {
  json: { limit: '10mb' },
  urlencoded: { limit: '10mb', extended: true },
}

/**
 * Timeout middleware
 */
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
