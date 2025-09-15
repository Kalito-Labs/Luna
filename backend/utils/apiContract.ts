// backend/utils/apiContract.ts
// Canonical API response contract helpers for Express

import type { Response } from 'express'
import { ZodError } from 'zod'

import {
  API_CONTRACT_VERSION,
  type ApiErrorPayload,
  type ApiErrorResponse,
  type ApiSuccessItem,
  type ApiSuccessList,
  type ApiDeleted,
} from '../types/api'

export const API_VERSION = API_CONTRACT_VERSION

/* ------------------------- Success helpers ------------------------- */

export function okItem<T>(res: Response, data: T, status = 200): Response<ApiSuccessItem<T> & { data: T }> {
  return res.status(status).json({
    version: API_VERSION,
    data,
  })
}

export function okList<T>(res: Response, data: T[], status = 200): Response<ApiSuccessList<T> & { data: T[] }> {
  return res.status(status).json({
    version: API_VERSION,
    data,
  })
}

export function okDeleted(res: Response): Response<ApiDeleted> {
  return res.status(200).json({
    version: API_VERSION,
    ok: true,
  })
}

/* -------------------------- Error helpers -------------------------- */

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'FORBIDDEN'
  | 'INTERNAL'

export function err(
  res: Response,
  httpStatus: number,
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>
): Response<ApiErrorResponse> {
  const payload: ApiErrorPayload = { code, message, ...(details ? { details } : {}) }
  return res.status(httpStatus).json({
    version: API_VERSION,
    error: payload,
  })
}

/**
 * Normalize thrown errors to our contract.
 * Accepts optional `details` so callers can pass context.
 */
export function handleCaughtError(
  res: Response,
  error: unknown,
  details?: Record<string, unknown>
): Response<ApiErrorResponse> {
  if (error instanceof ZodError) {
    return err(res, 400, 'VALIDATION_ERROR', 'Invalid request payload', {
      issues: error.issues,
      ...(details || {}),
    })
  }

  if (isSqliteConstraint(error)) {
    return err(res, 409, 'CONFLICT', 'Resource conflict', {
      cause: 'constraint_violation',
      raw: errorToJSON(error),
      ...(details || {}),
    })
  }

  if (error instanceof Error) {
    return err(res, 500, 'INTERNAL', error.message, details)
  }

  return err(res, 500, 'INTERNAL', 'Unexpected error', details)
}

/* --------------------------- Small utils --------------------------- */

function isSqliteConstraint(e: unknown): boolean {
  const code = (e as any)?.code
  return code === 'SQLITE_CONSTRAINT' || code === 'SQLITE_CONSTRAINT_UNIQUE'
}

function errorToJSON(e: unknown) {
  if (!e || typeof e !== 'object') return { message: String(e) }
  const anyErr = e as any
  return {
    name: anyErr.name,
    message: anyErr.message,
    code: anyErr.code,
    stack: anyErr.stack,
  }
}
