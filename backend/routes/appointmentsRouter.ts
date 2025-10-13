// backend/routes/appointmentsRouter.ts

import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db/db'
import { okList, okItem, err } from '../utils/apiContract'
import { handleRouterError, generateId } from '../utils/routerHelpers'

const router = Router()

/* -------------------------------- Schemas -------------------------------- */

const createAppointmentSchema = z.object({
  patient_id: z.string().min(1),
  provider_id: z.string().min(1),
  appointment_type: z.string().min(1).max(100),
  appointment_date: z.string().min(1),
  duration_minutes: z.number().int().min(1).max(480),
  status: z.string().optional().default('scheduled'),
  location: z.string().optional(),
  notes: z.string().optional(),
  reason: z.string().optional(),
})

const updateAppointmentSchema = createAppointmentSchema.partial().omit({ patient_id: true })

/* ------------------------------- Routes ---------------------------------- */

// GET /api/appointments - List appointments (optionally filtered by patient)
router.get('/', async (req, res) => {
  try {
    const { patient_id } = req.query
    
    let query = `
      SELECT a.*, 
             p.name as patient_name,
             hp.name as provider_name
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN healthcare_providers hp ON a.provider_id = hp.id
      WHERE 1=1
    `
    const params: string[] = []
    
    if (patient_id) {
      query += ` AND a.patient_id = ?`
      params.push(patient_id as string)
    }
    
    query += ` ORDER BY a.appointment_date DESC`
    
    const appointments = db.prepare(query).all(...params)
    okList(res, appointments)
  } catch (error) {
    handleRouterError(res, error, 'Failed to retrieve appointments')
  }
})

// GET /api/appointments/:id - Get a specific appointment
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const appointment = db.prepare(`
      SELECT a.*, 
             p.name as patient_name,
             hp.name as provider_name
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN healthcare_providers hp ON a.provider_id = hp.id
      WHERE a.id = ?
    `).get(id)

    if (!appointment) {
      return err(res, 404, 'NOT_FOUND', 'Appointment not found')
    }

    okItem(res, appointment)
  } catch (error) {
    handleRouterError(res, error, 'Failed to retrieve appointment')
  }
})

// POST /api/appointments - Create a new appointment
router.post('/', async (req, res) => {
  try {
    const validatedData = createAppointmentSchema.parse(req.body)
    
    // Verify patient exists
    const patient = db.prepare(`
      SELECT id FROM patients WHERE id = ? AND active = 1
    `).get(validatedData.patient_id)
    
    if (!patient) {
      return err(res, 404, 'NOT_FOUND', 'Patient not found')
    }
    
    // Verify provider exists
    const provider = db.prepare(`
      SELECT id FROM healthcare_providers WHERE id = ? AND active = 1
    `).get(validatedData.provider_id)
    
    if (!provider) {
      return err(res, 404, 'NOT_FOUND', 'Provider not found')
    }
    
    const appointmentId = generateId()
    const now = new Date().toISOString()
    
    const insertAppointment = db.prepare(`
      INSERT INTO appointments (
        id, patient_id, provider_id, appointment_type, appointment_date,
        duration_minutes, status, location, notes, reason,
        created_at, updated_at, active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `)
    
    insertAppointment.run(
      appointmentId,
      validatedData.patient_id,
      validatedData.provider_id,
      validatedData.appointment_type,
      validatedData.appointment_date,
      validatedData.duration_minutes,
      validatedData.status || 'scheduled',
      validatedData.location || null,
      validatedData.notes || null,
      validatedData.reason || null,
      now,
      now
    )
    
    // Return the created appointment
    const newAppointment = db.prepare(`
      SELECT a.*, 
             p.name as patient_name,
             hp.name as provider_name
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN healthcare_providers hp ON a.provider_id = hp.id
      WHERE a.id = ?
    `).get(appointmentId)
    
    okItem(res, newAppointment)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return err(res, 400, 'VALIDATION_ERROR', 'Invalid appointment data', {
        issues: error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      })
    }
    
    handleRouterError(res, error, 'Failed to create appointment')
  }
})

// PUT /api/appointments/:id - Update an appointment
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const validatedData = updateAppointmentSchema.parse(req.body)
    
    // Check if appointment exists
    const existingAppointment = db.prepare(`
      SELECT id FROM appointments WHERE id = ? AND active = 1
    `).get(id)
    
    if (!existingAppointment) {
      return err(res, 404, 'NOT_FOUND', 'Appointment not found')
    }
    
    // Verify provider exists if being updated
    if (validatedData.provider_id) {
      const provider = db.prepare(`
        SELECT id FROM healthcare_providers WHERE id = ? AND active = 1
      `).get(validatedData.provider_id)
      
      if (!provider) {
        return err(res, 404, 'NOT_FOUND', 'Provider not found')
      }
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
      UPDATE appointments 
      SET ${updates.join(', ')} 
      WHERE id = ? AND active = 1
    `
    
    const result = db.prepare(updateQuery).run(...values)
    
    if (result.changes === 0) {
      return err(res, 404, 'NOT_FOUND', 'Appointment not found')
    }
    
    // Return updated appointment
    const updatedAppointment = db.prepare(`
      SELECT a.*, 
             p.name as patient_name,
             hp.name as provider_name
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN healthcare_providers hp ON a.provider_id = hp.id
      WHERE a.id = ?
    `).get(id)
    
    okItem(res, updatedAppointment)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return err(res, 400, 'VALIDATION_ERROR', 'Invalid appointment data', {
        issues: error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      })
    }
    
    handleRouterError(res, error, 'Failed to update appointment')
  }
})

// DELETE /api/appointments/:id - Soft delete an appointment
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const result = db.prepare(`
      UPDATE appointments 
      SET active = 0, updated_at = ? 
      WHERE id = ? AND active = 1
    `).run(new Date().toISOString(), id)
    
    if (result.changes === 0) {
      return err(res, 404, 'NOT_FOUND', 'Appointment not found')
    }
    
    okItem(res, { message: 'Appointment deleted successfully' })
  } catch (error) {
    handleRouterError(res, error, 'Failed to delete appointment')
  }
})

export { router as appointmentsRouter }