// backend/routes/personasRouter.ts

import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db/db'
import type { Persona, PersonaTemplate } from '../types/personas'
import { okList, okItem, err } from '../utils/apiContract'
import { handleRouterError } from '../utils/routerHelpers'

const router = Router()

/* -------------------------------- Schemas -------------------------------- */

const createPersonaSchema = z.object({
  id: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  prompt: z.string().min(1),
  description: z.string().optional(),
  icon: z.string().optional(),
  category: z.enum(['cloud', 'local', 'general', 'therapy']).optional(),
  // Enhanced therapeutic fields
  specialty: z.string().optional(),
  therapeutic_focus: z.string().optional(),
  template_id: z.string().optional(),
  created_from: z.enum(['template', 'duplicate', 'manual']).optional(),
  tags: z.string().optional(), // JSON array
  color_theme: z.string().optional(),
  builtin_data_access: z.string().optional(), // JSON object
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
  category: z.enum(['cloud', 'local', 'general', 'therapy']).optional(),
  // Enhanced therapeutic fields
  specialty: z.string().optional(),
  therapeutic_focus: z.string().optional(),
  tags: z.string().optional(),
  color_theme: z.string().optional(),
  is_favorite: z.boolean().optional(),
  builtin_data_access: z.string().optional(),
  settings: z.object({
    temperature: z.number().min(0.1).max(2.0).optional(),
    maxTokens: z.number().min(50).max(4000).optional(),
    topP: z.number().min(0.0).max(1.0).optional(),
    repeatPenalty: z.number().min(0.8).max(2.0).optional(),
  }).optional(),
})

const createFromTemplateSchema = z.object({
  template_id: z.string().min(1),
  persona_id: z.string().min(1).max(50),
  name: z.string().optional(),
  description: z.string().optional(),
  customizations: z.object({
    prompt_modifications: z.string().optional(),
    temperature: z.number().min(0.1).max(2.0).optional(),
    maxTokens: z.number().min(50).max(4000).optional(),
    topP: z.number().min(0.0).max(1.0).optional(),
    repeatPenalty: z.number().min(0.8).max(2.0).optional(),
    color_theme: z.string().optional(),
    tags: z.string().optional(),
    builtin_data_access: z.string().optional(),
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
    // Enhanced therapeutic fields
    specialty: row.specialty,
    therapeutic_focus: row.therapeutic_focus,
    template_id: row.template_id,
    created_from: row.created_from,
    tags: row.tags,
    color_theme: row.color_theme,
    is_favorite: !!row.is_favorite,
    usage_count: row.usage_count || 0,
    last_used_at: row.last_used_at,
    builtin_data_access: row.builtin_data_access,
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
             specialty, therapeutic_focus, template_id, created_from,
             tags, color_theme, is_favorite, usage_count, last_used_at, builtin_data_access,
             temperature, maxTokens, topP, repeatPenalty, created_at, updated_at
      FROM personas
      ORDER BY created_at ASC
      `
    ).all()

    const personas = raw.map(toPersonaWithSettings)
    return okList(res, personas)
  } catch (error) {
    return handleRouterError(res, error, 'list personas')
  }
})

// GET /api/personas/templates - List all available persona templates
router.get('/templates', (_req, res) => {
  try {
    const templates = db.prepare(`
      SELECT id, name, description, icon, color_theme, specialty, therapeutic_focus,
             category, prompt_template, temperature, maxTokens, topP, repeatPenalty,
             tags, key_features, best_for, therapeutic_approaches, 
             is_system, is_active, usage_count, created_at, updated_at
      FROM persona_templates 
      WHERE is_active = 1
      ORDER BY is_system DESC, name ASC
    `).all() as PersonaTemplate[]

    return okList(res, templates)
  } catch (error) {
    return handleRouterError(res, error, 'list persona templates')
  }
})

// POST /api/personas/from-template - Create a persona from a template
router.post('/from-template', (req, res) => {
  try {
    const data = createFromTemplateSchema.parse(req.body)
    
    // Get the template
    const template = db.prepare(`
      SELECT * FROM persona_templates WHERE id = ? AND is_active = 1
    `).get(data.template_id) as PersonaTemplate | undefined

    if (!template) {
      return err(res, 404, 'NOT_FOUND', 'Template not found')
    }

    // Check if persona ID already exists
    const existing = db.prepare('SELECT id FROM personas WHERE id = ?').get(data.persona_id)
    if (existing) {
      return err(res, 409, 'CONFLICT', 'Persona with this ID already exists')
    }

    // Build the persona from template with customizations
    const customizations = data.customizations || {}
    const personaName = data.name || template.name
    const personaDescription = data.description || template.description
    
    // Apply prompt modifications if provided
    let finalPrompt = template.prompt_template
    if (customizations.prompt_modifications) {
      finalPrompt += '\\n\\n' + customizations.prompt_modifications
    }

    // Create persona with template data + customizations
    const now = new Date().toISOString()
    const insertResult = db.prepare(`
      INSERT INTO personas (
        id, name, prompt, description, icon, category,
        temperature, maxTokens, topP, repeatPenalty,
        specialty, therapeutic_focus, template_id, created_from,
        tags, color_theme, builtin_data_access,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.persona_id,
      personaName,
      finalPrompt,
      personaDescription,
      template.icon,
      template.category,
      customizations.temperature || template.temperature,
      customizations.maxTokens || template.maxTokens,
      customizations.topP || template.topP,
      customizations.repeatPenalty || template.repeatPenalty,
      template.specialty,
      template.therapeutic_focus,
      template.id,
      'template',
      customizations.tags || template.tags,
      customizations.color_theme || template.color_theme,
      customizations.builtin_data_access || '{"journal_entries": true, "mood_data": false}',
      now,
      now
    )

    // Update template usage count
    db.prepare('UPDATE persona_templates SET usage_count = usage_count + 1 WHERE id = ?')
      .run(template.id)

    // Fetch the created persona
    const createdPersona = db.prepare(`
      SELECT id, name, prompt, description, icon, category, is_default,
             specialty, therapeutic_focus, template_id, created_from,
             tags, color_theme, is_favorite, usage_count, last_used_at, builtin_data_access,
             temperature, maxTokens, topP, repeatPenalty, created_at, updated_at
      FROM personas WHERE id = ?
    `).get(data.persona_id)

    return okItem(res, {
      persona: toPersonaWithSettings(createdPersona),
      template: template
    })
  } catch (error) {
    return handleRouterError(res, error, 'create persona from template')
  }
})

// GET /api/personas/:id - Get a specific persona
router.get('/:id', (req, res) => {
  const { id } = req.params
  try {
    const row = db.prepare(
      `
      SELECT id, name, prompt, description, icon, category, is_default,
             specialty, therapeutic_focus, template_id, created_from,
             tags, color_theme, is_favorite, usage_count, last_used_at, builtin_data_access,
             temperature, maxTokens, topP, repeatPenalty, created_at, updated_at
      FROM personas
      WHERE id = ?
      `
    ).get(id)

    if (!row) {
      return err(res, 404, 'NOT_FOUND', 'Persona not found')
    }

    return okItem(res, toPersonaWithSettings(row))
  } catch (error) {
    return handleRouterError(res, error, 'get persona', { id })
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
  } catch (error) {
    return handleRouterError(res, error, 'create persona')
  }
})

// PUT /api/personas/:id - Update an existing persona
router.put('/:id', (req, res) => {
  const { id } = req.params
  try {
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
  } catch (error) {
    return handleRouterError(res, error, 'update persona', { id })
  }
})

// DELETE /api/personas/:id - Delete a persona (with safe reassignment)
router.delete('/:id', (req, res) => {
  const { id } = req.params
  try {

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
  } catch (error) {
    return handleRouterError(res, error, 'delete persona', { id })
  }
})

/* -------------------------- Template Routes ------------------------- */

// GET /api/personas/templates - List all available persona templates
router.get('/templates', (_req, res) => {
  try {
    const templates = db.prepare(`
      SELECT id, name, description, icon, color_theme, specialty, therapeutic_focus,
             category, prompt_template, temperature, maxTokens, topP, repeatPenalty,
             tags, key_features, best_for, therapeutic_approaches, 
             is_system, is_active, usage_count, created_at, updated_at
      FROM persona_templates 
      WHERE is_active = 1
      ORDER BY is_system DESC, name ASC
    `).all() as PersonaTemplate[]

    return okList(res, templates)
  } catch (error) {
    return handleRouterError(res, error, 'list persona templates')
  }
})

// POST /api/personas/from-template - Create a persona from a template
router.post('/from-template', (req, res) => {
  try {
    const data = createFromTemplateSchema.parse(req.body)
    
    // Get the template
    const template = db.prepare(`
      SELECT * FROM persona_templates WHERE id = ? AND is_active = 1
    `).get(data.template_id) as PersonaTemplate | undefined

    if (!template) {
      return err(res, 404, 'NOT_FOUND', 'Template not found')
    }

    // Check if persona ID already exists
    const existing = db.prepare('SELECT id FROM personas WHERE id = ?').get(data.persona_id)
    if (existing) {
      return err(res, 409, 'CONFLICT', 'Persona with this ID already exists')
    }

    // Build the persona from template with customizations
    const customizations = data.customizations || {}
    const personaName = data.name || template.name
    const personaDescription = data.description || template.description
    
    // Apply prompt modifications if provided
    let finalPrompt = template.prompt_template
    if (customizations.prompt_modifications) {
      finalPrompt += '\\n\\n' + customizations.prompt_modifications
    }

    // Create persona with template data + customizations
    const now = new Date().toISOString()
    const insertResult = db.prepare(`
      INSERT INTO personas (
        id, name, prompt, description, icon, category,
        temperature, maxTokens, topP, repeatPenalty,
        specialty, therapeutic_focus, template_id, created_from,
        tags, color_theme, builtin_data_access,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.persona_id,
      personaName,
      finalPrompt,
      personaDescription,
      template.icon,
      template.category,
      customizations.temperature || template.temperature,
      customizations.maxTokens || template.maxTokens,
      customizations.topP || template.topP,
      customizations.repeatPenalty || template.repeatPenalty,
      template.specialty,
      template.therapeutic_focus,
      template.id,
      'template',
      customizations.tags || template.tags,
      customizations.color_theme || template.color_theme,
      customizations.builtin_data_access || '{"journal_entries": true, "mood_data": false}',
      now,
      now
    )

    // Update template usage count
    db.prepare('UPDATE persona_templates SET usage_count = usage_count + 1 WHERE id = ?')
      .run(template.id)

    // Fetch the created persona
    const createdPersona = db.prepare(`
      SELECT id, name, prompt, description, icon, category, is_default,
             specialty, therapeutic_focus, template_id, created_from,
             tags, color_theme, builtin_data_access,
             temperature, maxTokens, topP, repeatPenalty, created_at, updated_at
      FROM personas WHERE id = ?
    `).get(data.persona_id)

    return okItem(res, {
      persona: toPersonaWithSettings(createdPersona),
      template: template
    })
  } catch (error) {
    return handleRouterError(res, error, 'create persona from template')
  }
})

export default router
