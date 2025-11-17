// server.ts

import dotenv from 'dotenv'

// Load main .env first
dotenv.config({ path: '../.env' })

// Load environment-specific configuration
const nodeEnv = process.env.NODE_ENV || 'development'
const envFile =
  nodeEnv === 'test'
    ? '../.env.test'
    : nodeEnv === 'production'
      ? '../.env.production'
      : '../.env.development'

dotenv.config({ path: envFile })

import express from 'express'
import agentRouter from './routes/agentRouter'
import sessionRouter from './routes/sessionRouter'
import personasRouter from './routes/personasRouter'
import modelsRouter from './routes/modelsRouter'
import memoryRouter from './routes/memoryRouter'
import patientsRouter from './routes/patientsRouter'
import medicationsRouter from './routes/medicationsRouter'
import vitalsRouter from './routes/vitalsRouter'
import journalRouter from './routes/journalRouter'
import { appointmentsRouter } from './routes/appointmentsRouter'
import { searchRouter } from './routes/searchRouter'

// Initialize / migrate DB (creates tables, columns, triggers, indexes, seeds personas, etc.)
import './db/init'

// Security and middleware
import {
  corsMiddleware,
  helmetMiddleware,
  generalRateLimit,
  securityLogger,
  requestTimeout,
  requestSizeLimit,
} from './middleware/security'
import {
  notFoundHandler,
  errorHandler,
  setupGlobalErrorHandlers,
} from './middleware/errorMiddleware'
import { logger } from './utils/logger'

const app = express()
const PORT = Number(process.env.PORT) || 3000
const HOST = process.env.HOST || '0.0.0.0' // Bind to all network interfaces

// If running behind a reverse proxy (nginx, fly.io, render, etc.)
// this lets Express trust X-Forwarded-* headers so rate-limits/IPs are accurate.
if (process.env.TRUST_PROXY === '1' || nodeEnv === 'production') {
  app.set('trust proxy', 1)
}

// --- Security middleware (apply early) ---
app.use(helmetMiddleware)
app.use(corsMiddleware)
app.use(securityLogger)
app.use(requestTimeout())

// --- Rate limiting ---
app.use(generalRateLimit)

// --- Body parsers with size limits ---
app.use(express.json(requestSizeLimit.json))
app.use(express.urlencoded(requestSizeLimit.urlencoded))

// --- Health check ---
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    environment: nodeEnv,
    version: process.env.APP_VERSION || 'dev',
  })
})

// --- Model status endpoint ---
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

// --- Routers ---
// Chat & inference (no persistence decisions here)
app.use('/api/agent', agentRouter)

// Session persistence (save-only policy, recap, listing/deleting saved sessions)
app.use('/api/sessions', sessionRouter)

// Persona management (CRUD + defaults)
app.use('/api/personas', personasRouter)

// Model registry / availability
app.use('/api/models', modelsRouter)

// Memory system (context, pins, summaries)
app.use('/api/memory', memoryRouter)

// Patient management routes
app.use('/api/patients', patientsRouter)
app.use('/api/medications', medicationsRouter)
app.use('/api/vitals', vitalsRouter)
app.use('/api/appointments', appointmentsRouter)

// Journal and mood tracking
app.use('/api/journal', journalRouter)

// Search
app.use('/api/search', searchRouter)

// --- 404 handler ---
app.use(notFoundHandler)

// --- Global error handler (must be last) ---
app.use(errorHandler)

// --- Process-level error handlers ---
setupGlobalErrorHandlers()

// --- Start the server ---
const server = app.listen(PORT, HOST, async () => {
  logger.info('Server started successfully', {
    service: 'kalito-backend',
    host: HOST,
    port: PORT,
    environment: nodeEnv,
    networkUrl: `http://192.168.1.96:${PORT}`,
  })

  // Keep-alive heartbeat (helps some hosts keep process warm)
  const heartbeat = setInterval(() => {
    // eslint-disable-next-line no-console
    console.log(`💓 Server heartbeat - ${new Date().toISOString()}`)
  }, 60_000)

  server.on('close', () => {
    clearInterval(heartbeat)
    // eslint-disable-next-line no-console
    console.log('🔴 Server closed')
  })
})

// --- Server error logging ---
server.on('error', error => {
  // eslint-disable-next-line no-console
  console.error('🔥 Server error:', error)
  // eslint-disable-next-line no-console
  console.error('Stack trace:', (error as any).stack)
})

// --- Process lifecycle logging ---
process.on('exit', code => {
  // eslint-disable-next-line no-console
  console.log(`🚪 Process exiting with code: ${code}`)
})

process.on('beforeExit', code => {
  // eslint-disable-next-line no-console
  console.log(`⚠️  Process about to exit with code: ${code}`)
})

// --- Graceful shutdown ---
function shutdown(signal: string) {
  // eslint-disable-next-line no-console
  console.log(`${signal} received, shutting down gracefully`)
  server.close(() => {
    // eslint-disable-next-line no-console
    console.log('Server closed')
    process.exit(0)
  })
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
