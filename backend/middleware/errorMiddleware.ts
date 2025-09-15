// backend/middleware/errorMiddleware.ts
import type { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { err } from '../utils/apiContract'
import { logger } from '../utils/logger'

/**
 * Wrap async handlers to forward errors to next()
 * Usage: router.get('/', asyncHandler(async (req,res)=>{ ... }))
 */
export const asyncHandler =
  <T extends (req: Request, res: Response, next: NextFunction) => Promise<any>>(fn: T) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next)

/**
 * 404 – Not Found handler (mount AFTER all routers)
 */
export function notFoundHandler(req: Request, res: Response) {
  return err(res, 404, 'NOT_FOUND', `Route ${req.originalUrl} not found`, {
    method: req.method,
    url: req.originalUrl || req.url,
  })
}

/**
 * Central error handler (MUST be the last middleware)
 * Normalizes all responses to the canonical error shape.
 */
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
  if (maybeSqlite?.code === 'SQLITE_CONSTRAINT' || maybeSqlite?.code === 'SQLITE_CONSTRAINT_UNIQUE') {
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

/**
 * Process-level error handlers – call once during server boot
 */
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
    // Let server.ts handle actual server.close() if needed.
  })

  process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully')
    // Let server.ts handle actual server.close() if needed.
  })
}
