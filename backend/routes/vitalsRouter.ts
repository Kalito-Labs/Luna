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
  measurement_date: z.string().min(1),
  systolic_bp: z.number().optional(),
  diastolic_bp: z.number().optional(),
  heart_rate: z.number().optional(),
  temperature: z.number().optional(),
  respiratory_rate: z.number().optional(),
  oxygen_saturation: z.number().optional(),
  weight: z.number().optional(),
  height: z.number().optional(),
  blood_glucose: z.number().optional(),
  pain_level: z.number().int().min(0).max(10).optional(),
  notes: z.string().optional(),
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
      WHERE 1=1
    `
    const params: string[] = []
    
    if (patient_id) {
      query += ` AND v.patient_id = ?`
      params.push(patient_id as string)
    }
    
    query += ` ORDER BY v.measurement_date DESC`
    
    const vitals = db.prepare(query).all(...params)
    okList(res, vitals)
  } catch (error) {
    handleRouterError(res, error, 'Failed to retrieve vitals')
  }
})

// GET /api/vitals/:id - Get a specific vital
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const vital = db.prepare(`
      SELECT v.*, p.name as patient_name 
      FROM vitals v
      LEFT JOIN patients p ON v.patient_id = p.id
      WHERE v.id = ?
    `).get(id)

    if (!vital) {
      return err(res, 404, 'NOT_FOUND', 'Vital record not found')
    }

    okItem(res, vital)
  } catch (error) {
    handleRouterError(res, error, 'Failed to retrieve vital')
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
        id, patient_id, measurement_date, systolic_bp, diastolic_bp,
        heart_rate, temperature, respiratory_rate, oxygen_saturation,
        weight, height, blood_glucose, pain_level, notes,
        created_at, updated_at, active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `)
    
    insertVital.run(
      vitalId,
      validatedData.patient_id,
      validatedData.measurement_date,
      validatedData.systolic_bp || null,
      validatedData.diastolic_bp || null,
      validatedData.heart_rate || null,
      validatedData.temperature || null,
      validatedData.respiratory_rate || null,
      validatedData.oxygen_saturation || null,
      validatedData.weight || null,
      validatedData.height || null,
      validatedData.blood_glucose || null,
      validatedData.pain_level || null,
      validatedData.notes || null,
      now,
      now
    )
    
    // Return the created vital
    const newVital = db.prepare(`
      SELECT v.*, p.name as patient_name 
      FROM vitals v
      LEFT JOIN patients p ON v.patient_id = p.id
      WHERE v.id = ?
    `).get(vitalId)
    
    okItem(res, newVital)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return err(res, 400, 'VALIDATION_ERROR', 'Invalid vital data', {
        issues: error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      })
    }
    
    handleRouterError(res, error, 'Failed to create vital record')
  }
})

// PUT /api/vitals/:id - Update a vital record
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const validatedData = updateVitalSchema.parse(req.body)
    
    // Check if vital exists
    const existingVital = db.prepare(`
      SELECT id FROM vitals WHERE id = ? AND active = 1
    `).get(id)
    
    if (!existingVital) {
      return err(res, 404, 'NOT_FOUND', 'Vital record not found')
    }
    
    // Build dynamic update query
    const updates: string[] = []
    const values: (string | number | null)[] = []
    
    Object.entries(validatedData).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`${key} = ?`)
        values.push(value)
      }
    })
    
    if (updates.length === 0) {
      return err(res, 400, 'VALIDATION_ERROR', 'No valid fields to update')
    }
    
    updates.push('updated_at = ?')
    values.push(new Date().toISOString())
    values.push(id)
    
    const updateQuery = `
      UPDATE vitals 
      SET ${updates.join(', ')} 
      WHERE id = ? AND active = 1
    `
    
    const result = db.prepare(updateQuery).run(...values)
    
    if (result.changes === 0) {
      return err(res, 404, 'NOT_FOUND', 'Vital record not found')
    }
    
    // Return updated vital
    const updatedVital = db.prepare(`
      SELECT v.*, p.name as patient_name 
      FROM vitals v
      LEFT JOIN patients p ON v.patient_id = p.id
      WHERE v.id = ?
    `).get(id)
    
    okItem(res, updatedVital)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return err(res, 400, 'VALIDATION_ERROR', 'Invalid vital data', {
        issues: error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      })
    }
    
    handleRouterError(res, error, 'Failed to update vital record')
  }
})

// DELETE /api/vitals/:id - Soft delete a vital record
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const result = db.prepare(`
      UPDATE vitals 
      SET active = 0, updated_at = ? 
      WHERE id = ? AND active = 1
    `).run(new Date().toISOString(), id)
    
    if (result.changes === 0) {
      return err(res, 404, 'NOT_FOUND', 'Vital record not found')
    }
    
    okItem(res, { message: 'Vital record deleted successfully' })
  } catch (error) {
    handleRouterError(res, error, 'Failed to delete vital record')
  }
})

export { router as vitalsRouter }