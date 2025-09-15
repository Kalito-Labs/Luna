// backend/utils/logger.ts
import winston from 'winston'
import fs from 'fs'
import path from 'path'

const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
} as const

const getLogLevel = (): keyof typeof logLevels => {
  if (process.env.NODE_ENV === 'production') return 'info'
  if (process.env.NODE_ENV === 'test') return 'error'
  return 'debug'
}

const devFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
    return `${timestamp} [${level}]: ${message} ${metaStr}`
  })
)

const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
)

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

export { logger }

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

export const logInfo = (message: string, context?: Record<string, unknown>) => {
  logger.info(message, context)
}

export const logWarn = (message: string, context?: Record<string, unknown>) => {
  logger.warn(message, context)
}

export const logDebug = (message: string, context?: Record<string, unknown>) => {
  logger.debug(message, context)
}
