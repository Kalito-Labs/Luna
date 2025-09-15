// backend/routes/personasRouter.ts

import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db/db'
import type { Persona } from '../types/personas'
import { okList, okItem, okDeleted, err, handleCaughtError } from '../utils/apiContract'

const router = Router()

/* -------------------------------- Schemas -------------------------------- */

const createPersonaSchema = z.object({
  id: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  prompt: z.string().min(1),
  description: z.string().optional(),
  icon: z.string().optional(),
  category: z.enum(['cloud', 'local']).optional(),
  settings: z.object({
    temperature: z.number().min(0.1).max(2.0).optional(),
    maxTokens: z.number().min(50).max(4000).optional(),
    topP: z.number().min(0.0).max(1.0).optional(),
    repeatPenalty: z.number().min(0.8).max(2.0).optional(),
  }).optional(),
})

const updatePersonaSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  prompt: z.string().min(1).optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  category: z.enum(['cloud', 'local']).optional(),
  settings: z.object({
    temperature: z.number().min(0.1).max(2.0).optional(),
    maxTokens: z.number().min(50).max(4000).optional(),
    topP: z.number().min(0.0).max(1.0).optional(),
    repeatPenalty: z.number().min(0.8).max(2.0).optional(),
  }).optional(),
})

/* ------------------------------- Utilities -------------------------------- */

function toPersonaWithSettings(row: any) {
  return {
    id: row.id,
    name: row.name,
    prompt: row.prompt,
    description: row.description,
    icon: row.icon,
    category: row.category,
    is_default: !!row.is_default,
    settings: {
      temperature: row.temperature ?? 0.7,
      maxTokens: row.maxTokens ?? 1000,
      topP: row.topP ?? 0.9,
      repeatPenalty: row.repeatPenalty ?? 1.1,
    },
    created_at: row.created_at,
    updated_at: row.updated_at,
  } as Persona & {
    is_default: boolean
    settings: Required<NonNullable<Persona['settings']>>
  }
}

function getCategoryDefaultPersonaId(category: 'cloud' | 'local'): string {
  const row = db
    .prepare(
      `SELECT id FROM personas WHERE category = ? AND is_default = 1 LIMIT 1`
    )
    .get(category) as { id: string } | undefined

  return row?.id ?? (category === 'cloud' ? 'default-cloud' : 'default-local')
}

/* --------------------------------- Routes --------------------------------- */

// GET /api/personas - List all personas
router.get('/', (_req, res) => {
  try {
    const raw = db.prepare(
      `
      SELECT id, name, prompt, description, icon, category, is_default,
             temperature, maxTokens, topP, repeatPenalty, created_at, updated_at
      FROM personas
      ORDER BY created_at ASC
      `
    ).all()

    const personas = raw.map(toPersonaWithSettings)
    return okList(res, personas)
  } catch (e) {
    return handleCaughtError(res, e)
  }
})

// GET /api/personas/:id - Get a specific persona
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params
    const row = db.prepare(
      `
      SELECT id, name, prompt, description, icon, category, is_default,
             temperature, maxTokens, topP, repeatPenalty, created_at, updated_at
      FROM personas
      WHERE id = ?
      `
    ).get(id)

    if (!row) {
      return err(res, 404, 'NOT_FOUND', 'Persona not found')
    }

    return okItem(res, toPersonaWithSettings(row))
  } catch (e) {
    return handleCaughtError(res, e)
  }
})

// POST /api/personas - Create a new persona
router.post('/', (req, res) => {
  try {
    const validated = createPersonaSchema.parse(req.body)

    // Prevent duplicate IDs
    const exists = db.prepare('SELECT 1 FROM personas WHERE id = ?').get(validated.id)
    if (exists) {
      return err(res, 409, 'CONFLICT', 'Persona with this ID already exists')
    }

    db.prepare(
      `
      INSERT INTO personas (
        id, name, prompt, description, icon, category,
        temperature, maxTokens, topP, repeatPenalty,
        created_at, updated_at, is_default
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0)
      `
    ).run(
      validated.id,
      validated.name,
      validated.prompt,
      validated.description ?? null,
      validated.icon ?? null,
      validated.category ?? null,
      validated.settings?.temperature ?? 0.7,
      validated.settings?.maxTokens ?? 1000,
      validated.settings?.topP ?? 0.9,
      validated.settings?.repeatPenalty ?? 1.1
    )

    const row = db.prepare(
      `
      SELECT id, name, prompt, description, icon, category, is_default,
             temperature, maxTokens, topP, repeatPenalty, created_at, updated_at
      FROM personas
      WHERE id = ?
      `
    ).get(validated.id)

    return okItem(res, toPersonaWithSettings(row), 201)
  } catch (e) {
    return handleCaughtError(res, e)
  }
})

// PUT /api/personas/:id - Update an existing persona
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params
    const validated = updatePersonaSchema.parse(req.body)

    const existing = db.prepare('SELECT * FROM personas WHERE id = ?').get(id)
    if (!existing) {
      return err(res, 404, 'NOT_FOUND', 'Persona not found')
    }

    const updateFields: string[] = []
    const updateValues: any[] = []

    if (validated.name !== undefined) { updateFields.push('name = ?'); updateValues.push(validated.name) }
    if (validated.prompt !== undefined) { updateFields.push('prompt = ?'); updateValues.push(validated.prompt) }
    if (validated.description !== undefined) { updateFields.push('description = ?'); updateValues.push(validated.description) }
    if (validated.icon !== undefined) { updateFields.push('icon = ?'); updateValues.push(validated.icon) }
    if (validated.category !== undefined) { updateFields.push('category = ?'); updateValues.push(validated.category) }
    if (validated.settings?.temperature !== undefined) { updateFields.push('temperature = ?'); updateValues.push(validated.settings.temperature) }
    if (validated.settings?.maxTokens !== undefined) { updateFields.push('maxTokens = ?'); updateValues.push(validated.settings.maxTokens) }
    if (validated.settings?.topP !== undefined) { updateFields.push('topP = ?'); updateValues.push(validated.settings.topP) }
    if (validated.settings?.repeatPenalty !== undefined) { updateFields.push('repeatPenalty = ?'); updateValues.push(validated.settings.repeatPenalty) }

    if (updateFields.length === 0) {
      return err(res, 400, 'VALIDATION_ERROR', 'No valid fields to update')
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP')
    updateValues.push(id)

    db.prepare(`UPDATE personas SET ${updateFields.join(', ')} WHERE id = ?`).run(...updateValues)

    const row = db.prepare(
      `
      SELECT id, name, prompt, description, icon, category, is_default,
             temperature, maxTokens, topP, repeatPenalty, created_at, updated_at
      FROM personas
      WHERE id = ?
      `
    ).get(id)

    return okItem(res, toPersonaWithSettings(row))
  } catch (e) {
    return handleCaughtError(res, e)
  }
})

// DELETE /api/personas/:id - Delete a persona (with safe reassignment)
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params

    const persona = db.prepare(
      `SELECT id, category, is_default FROM personas WHERE id = ?`
    ).get(id) as { id: string; category: 'cloud' | 'local' | null; is_default: number } | undefined

    if (!persona) {
      return err(res, 404, 'NOT_FOUND', 'Persona not found')
    }

    // Block deleting defaults
    if (persona.is_default === 1) {
      return err(res, 403, 'FORBIDDEN', 'Cannot delete default persona')
    }

    const category: 'cloud' | 'local' = (persona.category as any) || 'cloud'
    const fallbackPersonaId = getCategoryDefaultPersonaId(category)

    // Manual transaction for safety
    db.prepare('BEGIN').run()
    try {
      // Reassign sessions referencing this persona
      db.prepare(`UPDATE sessions SET persona_id = ? WHERE persona_id = ?`)
        .run(fallbackPersonaId, id)

      // Delete persona
      const result = db.prepare(`DELETE FROM personas WHERE id = ?`).run(id)

      if (result.changes === 0) {
        db.prepare('ROLLBACK').run()
        return err(res, 404, 'NOT_FOUND', 'Persona not found')
      }

      db.prepare('COMMIT').run()
      // Return deletion + where any sessions were reassigned
      return okItem(res, { ok: true, reassigned_to: fallbackPersonaId })
      // If you prefer a minimal deletion shape, use: return okDeleted(res)
    } catch (inner) {
      db.prepare('ROLLBACK').run()
      throw inner
    }
  } catch (e) {
    return handleCaughtError(res, e)
  }
})

export default router
