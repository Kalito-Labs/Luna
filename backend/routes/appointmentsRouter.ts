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
  provider_name: z.string().optional(), // Free text provider name
  appointment_type: z.string().optional(),
  appointment_date: z.string().min(1),
  appointment_time: z.string().optional(),
  status: z.string().optional().default('scheduled'),
  location: z.string().optional(),
  notes: z.string().optional(),
  preparation_notes: z.string().optional(),
  outcome_summary: z.string().optional(),
  follow_up_required: z.boolean().optional(),
})

const updateAppointmentSchema = createAppointmentSchema.partial().omit({ patient_id: true })

/* ------------------------------- Routes ---------------------------------- */

// GET /api/appointments - List appointments (optionally filtered by patient)
router.get('/', async (req, res) => {
  try {
    const { patient_id } = req.query
    
    let query = `
      SELECT a.*, 
             p.name as patient_name
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
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
             p.name as patient_name
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
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
      SELECT id FROM patients WHERE id = ?
    `).get(validatedData.patient_id)
    
    if (!patient) {
      return err(res, 404, 'NOT_FOUND', 'Patient not found')
    }
    
    const appointmentId = generateId()
    const now = new Date().toISOString()
    
    const insertAppointment = db.prepare(`
      INSERT INTO appointments (
        id, patient_id, provider_name, appointment_type, appointment_date,
        appointment_time, status, location, notes, preparation_notes,
        outcome_summary, follow_up_required, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    
    insertAppointment.run(
      appointmentId,
      validatedData.patient_id,
      validatedData.provider_name || null,
      validatedData.appointment_type || null,
      validatedData.appointment_date,
      validatedData.appointment_time || null,
      validatedData.status || 'scheduled',
      validatedData.location || null,
      validatedData.notes || null,
      validatedData.preparation_notes || null,
      validatedData.outcome_summary || null,
      validatedData.follow_up_required ? 1 : 0,
      now,
      now
    )
    
    // Return the created appointment
    const newAppointment = db.prepare(`
      SELECT a.*, 
             p.name as patient_name
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
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
      SELECT id FROM appointments WHERE id = ?
    `).get(id)
    
    if (!existingAppointment) {
      return err(res, 404, 'NOT_FOUND', 'Appointment not found')
    }
    
    // Build dynamic update query
    const updates: string[] = []
    const values: (string | number | null)[] = []
    
    Object.entries(validatedData).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`${key} = ?`)
        // Convert boolean to integer for SQLite
        if (key === 'follow_up_required') {
          values.push(value ? 1 : 0)
        } else {
          values.push(value as string | number | null)
        }
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
      WHERE id = ?
    `
    
    const result = db.prepare(updateQuery).run(...values)
    
    if (result.changes === 0) {
      return err(res, 404, 'NOT_FOUND', 'Appointment not found')
    }
    
    // Return updated appointment
    const updatedAppointment = db.prepare(`
      SELECT a.*, 
             p.name as patient_name
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
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

// DELETE /api/appointments/:id - Delete an appointment
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const result = db.prepare(`
      DELETE FROM appointments 
      WHERE id = ?
    `).run(id)
    
    if (result.changes === 0) {
      return err(res, 404, 'NOT_FOUND', 'Appointment not found')
    }
    
    okItem(res, { message: 'Appointment deleted successfully' })
  } catch (error) {
    handleRouterError(res, error, 'Failed to delete appointment')
  }
})

export { router as appointmentsRouter }