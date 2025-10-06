// backend/utils/routerHelpers.ts
import type { Response } from 'express'
import { ZodError } from 'zod'
import { err, handleCaughtError } from './apiContract'
import { logger } from './logger'

/**
 * Centralized error handling for router endpoints.
 * Uses the canonical API contract (err/handleCaughtError).
 */
export function handleRouterError(
  res: Response,
  error: unknown,
  operation: string,
  extraDetails?: Record<string, unknown>
): void {
  // Zod validation → 400 VALIDATION_ERROR
  if (error instanceof ZodError) {
    err(res, 400, 'VALIDATION_ERROR', 'Invalid request payload', {
      operation,
      issues: error.issues,
      ...(extraDetails || {}),
    })
    return
  }

  // Common SQLite unique/constraint violation → 409 CONFLICT
  // (better-sqlite3 puts code on the error object)
  const maybeSqlite = error as { code?: string; message?: string }
  if (maybeSqlite?.code === 'SQLITE_CONSTRAINT') {
    err(res, 409, 'CONFLICT', 'Constraint violation', {
      operation,
      dbCode: maybeSqlite.code,
      message: maybeSqlite.message,
      ...(extraDetails || {}),
    })
    return
  }

  // Unknown/unhandled → 500 INTERNAL_ERROR (with logging)
  logger.error(`Unhandled router error during ${operation}`, { error })
  handleCaughtError(res, error, { operation, ...(extraDetails || {}) })
}
