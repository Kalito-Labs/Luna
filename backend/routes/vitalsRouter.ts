// backend/routes/vitalsRouter.ts

import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db/db'
import { okList, okItem, err } from '../utils/apiContract'
import { handleRouterError, generateId } from '../utils/routerHelpers'

const router = Router()

/* -------------------------------- Schemas -------------------------------- */

const createVitalSchema = z.object({
  patient_id: z.string().min(1),
  weight_lbs: z.number().positive().nullable().optional(),
  glucose_am: z.number().int().positive().nullable().optional(),
  glucose_pm: z.number().int().positive().nullable().optional(),
  recorded_date: z.string().min(1), // ISO date string
  notes: z.string().nullable().optional(),
})

const updateVitalSchema = createVitalSchema.partial().omit({ patient_id: true })

/* ------------------------------- Routes ---------------------------------- */

// GET /api/vitals - List vitals (optionally filtered by patient)
router.get('/', async (req, res) => {
  try {
    const { patient_id } = req.query
    
    let query = `
      SELECT v.*, p.name as patient_name 
      FROM vitals v
      LEFT JOIN patients p ON v.patient_id = p.id
      WHERE v.active = 1
    `
    const params: string[] = []
    
    if (patient_id) {
      query += ` AND v.patient_id = ?`
      params.push(patient_id as string)
    }
    
    query += ` ORDER BY v.recorded_date DESC, v.created_at DESC`
    
    const vitals = db.prepare(query).all(...params)
    okList(res, vitals)
  } catch (error) {
    handleRouterError(res, error, 'Failed to retrieve vitals')
  }
})

// GET /api/vitals/:id - Get a specific vital record
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const vital = db.prepare(`
      SELECT v.*, p.name as patient_name 
      FROM vitals v
      LEFT JOIN patients p ON v.patient_id = p.id
      WHERE v.id = ? AND v.active = 1
    `).get(id)

    if (!vital) {
      return err(res, 404, 'NOT_FOUND', 'Vital record not found')
    }

    okItem(res, vital)
  } catch (error) {
    handleRouterError(res, error, 'Failed to retrieve vital record')
  }
})

// POST /api/vitals - Create a new vital record
router.post('/', async (req, res) => {
  try {
    const validatedData = createVitalSchema.parse(req.body)
    
    // Verify patient exists
    const patient = db.prepare(`
      SELECT id FROM patients WHERE id = ? AND active = 1
    `).get(validatedData.patient_id)
    
    if (!patient) {
      return err(res, 404, 'NOT_FOUND', 'Patient not found')
    }
    
    const vitalId = generateId()
    const now = new Date().toISOString()
    
    const insertVital = db.prepare(`
      INSERT INTO vitals (
        id, patient_id, weight_lbs, glucose_am, glucose_pm,
        recorded_date, notes, active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `)

    insertVital.run(
      vitalId,
      validatedData.patient_id,
      validatedData.weight_lbs ?? null,
      validatedData.glucose_am ?? null,
      validatedData.glucose_pm ?? null,
      validatedData.recorded_date,
      validatedData.notes ?? null,
      now,
      now
    )

    // Retrieve the created vital record
    const createdVital = db.prepare(`
      SELECT v.*, p.name as patient_name 
      FROM vitals v
      LEFT JOIN patients p ON v.patient_id = p.id
      WHERE v.id = ?
    `).get(vitalId)

    okItem(res, createdVital, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return err(res, 400, 'VALIDATION_ERROR', 'Invalid vital data', { issues: error.errors })
    }
    handleRouterError(res, error, 'Failed to create vital record')
  }
})

// PUT /api/vitals/:id - Update a vital record
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const validatedData = updateVitalSchema.parse(req.body)
    
    // Check if vital record exists
    const existingVital = db.prepare(`
      SELECT * FROM vitals WHERE id = ? AND active = 1
    `).get(id)

    if (!existingVital) {
      return err(res, 404, 'NOT_FOUND', 'Vital record not found')
    }

    // Build update query dynamically
    const updates: string[] = []
    const values: (string | number | null)[] = []

    if (validatedData.weight_lbs !== undefined) {
      updates.push('weight_lbs = ?')
      values.push(validatedData.weight_lbs)
    }
    if (validatedData.glucose_am !== undefined) {
      updates.push('glucose_am = ?')
      values.push(validatedData.glucose_am)
    }
    if (validatedData.glucose_pm !== undefined) {
      updates.push('glucose_pm = ?')
      values.push(validatedData.glucose_pm)
    }
    if (validatedData.recorded_date !== undefined) {
      updates.push('recorded_date = ?')
      values.push(validatedData.recorded_date)
    }
    if (validatedData.notes !== undefined) {
      updates.push('notes = ?')
      values.push(validatedData.notes)
    }

    if (updates.length === 0) {
      return err(res, 400, 'VALIDATION_ERROR', 'No fields to update')
    }

    updates.push('updated_at = ?')
    values.push(new Date().toISOString())
    values.push(id)

    const updateVital = db.prepare(`
      UPDATE vitals 
      SET ${updates.join(', ')} 
      WHERE id = ?
    `)

    updateVital.run(...values)

    // Retrieve updated vital record
    const updatedVital = db.prepare(`
      SELECT v.*, p.name as patient_name 
      FROM vitals v
      LEFT JOIN patients p ON v.patient_id = p.id
      WHERE v.id = ?
    `).get(id)

    okItem(res, updatedVital)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return err(res, 400, 'VALIDATION_ERROR', 'Invalid vital data', { issues: error.errors })
    }
    handleRouterError(res, error, 'Failed to update vital record')
  }
})

// DELETE /api/vitals/:id - Soft delete a vital record
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const existingVital = db.prepare(`
      SELECT * FROM vitals WHERE id = ? AND active = 1
    `).get(id)

    if (!existingVital) {
      return err(res, 404, 'NOT_FOUND', 'Vital record not found')
    }

    // Soft delete
    db.prepare(`
      UPDATE vitals 
      SET active = 0, updated_at = ? 
      WHERE id = ?
    `).run(new Date().toISOString(), id)

    okItem(res, { id, message: 'Vital record deleted successfully' })
  } catch (error) {
    handleRouterError(res, error, 'Failed to delete vital record')
  }
})

export default router
