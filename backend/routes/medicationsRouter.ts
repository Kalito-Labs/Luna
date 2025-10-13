// backend/routes/medicationsRouter.ts

import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db/db'
import { okList, okItem, err } from '../utils/apiContract'
import { handleRouterError, generateId } from '../utils/routerHelpers'

const router = Router()

/* -------------------------------- Schemas -------------------------------- */

const createMedicationSchema = z.object({
  patient_id: z.string().min(1),
  name: z.string().min(1).max(200),
  generic_name: z.string().optional(),
  dosage: z.string().min(1).max(100),
  frequency: z.string().min(1),
  route: z.string().optional(),
  prescribing_doctor: z.string().optional(),
  pharmacy: z.string().optional(),
  rx_number: z.string().optional(),
  side_effects: z.string().optional(),
  notes: z.string().optional(),
})

const updateMedicationSchema = createMedicationSchema.partial().omit({ patient_id: true })

/* ------------------------------- Routes ---------------------------------- */

// GET /api/medications - List medications (optionally filtered by patient)
router.get('/', async (req, res) => {
  try {
    const { patient_id } = req.query
    
    let query = `
      SELECT m.*, p.name as patient_name 
      FROM medications m
      LEFT JOIN patients p ON m.patient_id = p.id
      WHERE m.active = 1
    `
    const params: string[] = []
    
    if (patient_id) {
      query += ` AND m.patient_id = ?`
      params.push(patient_id as string)
    }
    
    query += ` ORDER BY m.created_at DESC`
    
    const medications = db.prepare(query).all(...params)
    okList(res, medications)
  } catch (error) {
    handleRouterError(res, error, 'Failed to retrieve medications')
  }
})

// GET /api/medications/:id - Get a specific medication
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const medication = db.prepare(`
      SELECT m.*, p.name as patient_name 
      FROM medications m
      LEFT JOIN patients p ON m.patient_id = p.id
      WHERE m.id = ? AND m.active = 1
    `).get(id)

    if (!medication) {
      return err(res, 404, 'NOT_FOUND', 'Medication not found')
    }

    okItem(res, medication)
  } catch (error) {
    handleRouterError(res, error, 'Failed to retrieve medication')
  }
})

// POST /api/medications - Create a new medication
router.post('/', async (req, res) => {
  try {
    const validatedData = createMedicationSchema.parse(req.body)
    
    // Verify patient exists
    const patient = db.prepare(`
      SELECT id FROM patients WHERE id = ? AND active = 1
    `).get(validatedData.patient_id)
    
    if (!patient) {
      return err(res, 404, 'NOT_FOUND', 'Patient not found')
    }
    
    const medicationId = generateId()
    const now = new Date().toISOString()
    
    const insertMedication = db.prepare(`
      INSERT INTO medications (
        id, patient_id, name, generic_name, dosage, frequency, route,
        prescribing_doctor, pharmacy, rx_number,
        side_effects, notes, active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `)

    insertMedication.run(
      medicationId,
      validatedData.patient_id,
      validatedData.name,
      validatedData.generic_name || null,
      validatedData.dosage,
      validatedData.frequency,
      validatedData.route || null,
      validatedData.prescribing_doctor || null,
      validatedData.pharmacy || null,
      validatedData.rx_number || null,
      validatedData.side_effects || null,
      validatedData.notes || null,
      now,
      now
    )

    // Retrieve the created medication
    const createdMedication = db.prepare(`
      SELECT m.*, p.name as patient_name 
      FROM medications m
      LEFT JOIN patients p ON m.patient_id = p.id
      WHERE m.id = ?
    `).get(medicationId)

    okItem(res, createdMedication, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return err(res, 400, 'VALIDATION_ERROR', 'Invalid medication data', { issues: error.errors })
    }
    handleRouterError(res, error, 'Failed to create medication')
  }
})

// PUT /api/medications/:id - Update a medication
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const validatedData = updateMedicationSchema.parse(req.body)
    
    // Check if medication exists
    const existingMedication = db.prepare(`
      SELECT * FROM medications WHERE id = ? AND active = 1
    `).get(id)

    if (!existingMedication) {
      return err(res, 404, 'NOT_FOUND', 'Medication not found')
    }

    // Build dynamic update query
    const updateFields = []
    const updateValues = []
    
    for (const [key, value] of Object.entries(validatedData)) {
      if (value !== undefined) {
        updateFields.push(`${key} = ?`)
        updateValues.push(value)
      }
    }
    
    if (updateFields.length === 0) {
      return err(res, 400, 'VALIDATION_ERROR', 'No fields to update')
    }

    updateFields.push('updated_at = ?')
    updateValues.push(new Date().toISOString())
    updateValues.push(id)

    const updateQuery = `
      UPDATE medications 
      SET ${updateFields.join(', ')} 
      WHERE id = ?
    `

    db.prepare(updateQuery).run(...updateValues)

    // Retrieve the updated medication
    const updatedMedication = db.prepare(`
      SELECT m.*, p.name as patient_name 
      FROM medications m
      LEFT JOIN patients p ON m.patient_id = p.id
      WHERE m.id = ?
    `).get(id)

    okItem(res, updatedMedication)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return err(res, 400, 'VALIDATION_ERROR', 'Invalid medication data', { issues: error.errors })
    }
    handleRouterError(res, error, 'Failed to update medication')
  }
})

// DELETE /api/medications/:id - Soft delete a medication
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const existingMedication = db.prepare(`
      SELECT * FROM medications WHERE id = ? AND active = 1
    `).get(id)

    if (!existingMedication) {
      return err(res, 404, 'NOT_FOUND', 'Medication not found')
    }

    // Soft delete by setting active = 0
    db.prepare(`
      UPDATE medications 
      SET active = 0, updated_at = ? 
      WHERE id = ?
    `).run(new Date().toISOString(), id)

    okItem(res, { message: 'Medication deleted successfully' })
  } catch (error) {
    handleRouterError(res, error, 'Failed to delete medication')
  }
})

export default router