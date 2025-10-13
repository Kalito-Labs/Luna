import { z } from 'zod'
import { Request, Response, NextFunction } from 'express'

/**
 * Agent request validation schema
 */
export const agentRequestSchema = z
  .object({
    input: z
      .string()
      .min(1, 'Input text is required')
      .max(16000, 'Input too long (max 16000 characters)')
      .refine(val => val.trim().length > 0, 'Input text is required'),
    sessionId: z
      .string()
      .optional()
      .refine(val => !val || val.length > 0, 'Session ID cannot be empty string'),
    systemPrompt: z.string().optional().default(''),
    modelName: z.string().optional(), // Remove strict validation for now
    // This can be extended with other modes if needed in the future
    mode: z.enum(['single', 'cloud']).optional().default('single'),
    personaId: z.string().optional(), // Add persona support
    settings: z
      .object({
        model: z.string().optional(),
        temperature: z.number().min(0.1).max(1.2).optional(),
        maxTokens: z.number().min(1).max(4000).optional(),
        topP: z.number().min(0).max(1).optional(),
        frequencyPenalty: z.number().min(0).max(2).optional(),
        presencePenalty: z.number().min(0).max(2).optional(),
        outputFormat: z.string().optional(),
      })
      .optional()
      .default({}),
    fileIds: z.array(z.string()).optional().default([]),
    stream: z.boolean().optional().default(false),
  })
  .transform(data => ({
    ...data,
    input: data.input.trim(), // Trim after validation
  }))

/**
 * Session creation validation schema
 */
export const createSessionSchema = z.object({
  title: z
    .string()
    .min(1, 'Session title cannot be empty')
    .max(200, 'Session title too long (max 200 characters)')
    .trim()
    .optional(),
})

/**
 * Session update validation schema
 */
export const updateSessionSchema = z.object({
  title: z
    .string()
    .min(1, 'Session title cannot be empty')
    .max(200, 'Session title too long (max 200 characters)')
    .trim()
    .optional(),
  archived: z.boolean().optional(),
})

/**
 * Pagination validation schema
 */
export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val, 10) : 1))
    .refine(val => val > 0, 'Page must be greater than 0'),
  limit: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val, 10) : 20))
    .refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
})

/**
 * Common validation schemas
 */
export const commonSchemas = {
  uuid: z.string().uuid('Invalid UUID format'),
  positiveInteger: z.number().int().positive('Must be a positive integer'),
  nonEmptyString: z.string().min(1, 'Cannot be empty').trim(),
  email: z.string().email('Invalid email format'),
}

/**
 * Environment variable validation schema
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val, 10) : 3000))
    .refine(val => val > 0 && val < 65536, 'Port must be between 1 and 65535'),
  DB_PATH: z.string().optional().default('./db/kalito.db'),
  OPENAI_API_KEY: z.string().optional(),
  // Add more environment variables as needed
})

// Export validated environment variables
export const env = envSchema.parse(process.env)

/**
 * Middleware to validate request body against a schema
 */
export const validateBody = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('🔍 VALIDATION INPUT:', JSON.stringify(req.body, null, 2))
      req.body = schema.parse(req.body)
      console.log('✅ VALIDATION SUCCESS')
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.log('❌ VALIDATION FAILED:', error.issues)
        const validationErrors = error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }))

        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid request data',
          details: validationErrors,
        })
      }
      next(error)
    }
  }
}

/**
 * Middleware to validate query parameters against a schema
 */
export const validateQuery = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedQuery = schema.parse(req.query)
      // Safely assign the validated query back
      Object.assign(req.query, validatedQuery)
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors = error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }))

        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid query parameters',
          details: validationErrors,
        })
      }
      next(error)
    }
  }
}

/**
 * Middleware to validate route parameters against a schema
 */
export const validateParams = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedParams = schema.parse(req.params)
      // Safely assign the validated params back
      Object.assign(req.params, validatedParams)
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors = error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }))

        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid route parameters',
          details: validationErrors,
        })
      }
      next(error)
    }
  }
}
