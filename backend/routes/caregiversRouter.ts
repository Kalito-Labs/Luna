// backend/routes/caregiversRouter.ts

import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db/db'
import { okList, okItem, err } from '../utils/apiContract'
import { handleRouterError, generateId } from '../utils/routerHelpers'
import type {
  Caregiver,
  CaregiverDbRow,
  CreateCaregiverRequest,
  UpdateCaregiverRequest,
  ClockInOutRequest,
  CaregiverSchedule,
  CaregiverScheduleDay,
  CaregiverScheduleResponse
} from '../types/caregiver'

const router = Router()

/* -------------------------------- Schemas -------------------------------- */

const caregiverScheduleDaySchema = z.object({
  start: z.string(),
  end: z.string(),
  available: z.boolean()
})

const caregiverScheduleSchema = z.object({
  monday: caregiverScheduleDaySchema.optional(),
  tuesday: caregiverScheduleDaySchema.optional(),
  wednesday: caregiverScheduleDaySchema.optional(),
  thursday: caregiverScheduleDaySchema.optional(),
  friday: caregiverScheduleDaySchema.optional(),
  saturday: caregiverScheduleDaySchema.optional(),
  sunday: caregiverScheduleDaySchema.optional(),
})

const createCaregiverSchema = z.object({
  name: z.string().min(1).max(200),
  date_of_birth: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  relationship: z.string().optional(),
  specialties: z.array(z.string()).optional().default([]),
  certifications: z.array(z.string()).optional().default([]),
  availability_schedule: caregiverScheduleSchema.optional().default({}),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  notes: z.string().optional(),
  hourly_rate: z.number().min(0).optional(),
})

const updateCaregiverSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  date_of_birth: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  relationship: z.string().optional(),
  specialties: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  availability_schedule: caregiverScheduleSchema.optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  notes: z.string().optional(),
  hourly_rate: z.number().min(0).optional(),
  is_active: z.number().min(0).max(1).optional(),
})

const clockInOutSchema = z.object({
  action: z.enum(['clock_in', 'clock_out']),
  timestamp: z.string().optional(),
})

/* --------------------------- Helper Functions ---------------------------- */

function parseDbRowToCaregiver(row: CaregiverDbRow): Caregiver {
  return {
    id: row.id,
    name: row.name,
    date_of_birth: row.date_of_birth || undefined,
    email: row.email || undefined,
    phone: row.phone || undefined,
    address: row.address || undefined,
    relationship: row.relationship || undefined,
    specialties: row.specialties ? JSON.parse(row.specialties) : [],
    certifications: row.certifications ? JSON.parse(row.certifications) : [],
    availability_schedule: row.availability_schedule ? JSON.parse(row.availability_schedule) : {},
    emergency_contact_name: row.emergency_contact_name || undefined,
    emergency_contact_phone: row.emergency_contact_phone || undefined,
    notes: row.notes || undefined,
    clock_in_time: row.clock_in_time || undefined,
    clock_out_time: row.clock_out_time || undefined,
    is_active: row.is_active,
    last_clock_in: row.last_clock_in || undefined,
    last_clock_out: row.last_clock_out || undefined,
    total_hours_worked: row.total_hours_worked,
    hourly_rate: row.hourly_rate || undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

/* ------------------------------- Routes ---------------------------------- */

// GET /api/caregivers - List all active caregivers
router.get('/', async (req, res) => {
  try {
    const caregivers = db.prepare(`
      SELECT * FROM caregivers 
      WHERE is_active = 1 
      ORDER BY name ASC
    `).all() as CaregiverDbRow[]

    const parsedCaregivers = caregivers.map(parseDbRowToCaregiver)
    return okList(res, parsedCaregivers)
  } catch (error) {
    return handleRouterError(res, error, 'Failed to retrieve caregivers')
  }
})

// GET /api/caregivers/:id - Get specific caregiver
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const caregiver = db.prepare(`
      SELECT * FROM caregivers WHERE id = ?
    `).get(id) as CaregiverDbRow | undefined

    if (!caregiver) {
      return err(res, 404, 'NOT_FOUND', 'Caregiver not found')
    }

    const parsedCaregiver = parseDbRowToCaregiver(caregiver)
    return okItem(res, parsedCaregiver)
  } catch (error) {
    return handleRouterError(res, error, 'Failed to retrieve caregiver')
  }
})

// POST /api/caregivers - Create new caregiver
router.post('/', async (req, res) => {
  try {
    const validatedData = createCaregiverSchema.parse(req.body) as CreateCaregiverRequest
    const id = generateId()

    const insertCaregiver = db.prepare(`
      INSERT INTO caregivers (
        id, name, date_of_birth, email, phone, address, relationship,
        specialties, certifications, availability_schedule, emergency_contact_name,
        emergency_contact_phone, notes, hourly_rate, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const now = new Date().toISOString()

    insertCaregiver.run(
      id,
      validatedData.name,
      validatedData.date_of_birth || null,
      validatedData.email || null,
      validatedData.phone || null,
      validatedData.address || null,
      validatedData.relationship || null,
      JSON.stringify(validatedData.specialties),
      JSON.stringify(validatedData.certifications),
      JSON.stringify(validatedData.availability_schedule),
      validatedData.emergency_contact_name || null,
      validatedData.emergency_contact_phone || null,
      validatedData.notes || null,
      validatedData.hourly_rate || null,
      now,
      now
    )

    // Return the created caregiver
    const newCaregiver = db.prepare('SELECT * FROM caregivers WHERE id = ?').get(id) as CaregiverDbRow
    const parsedCaregiver = parseDbRowToCaregiver(newCaregiver)

    return okItem(res, parsedCaregiver, 201)
  } catch (error) {
    return handleRouterError(res, error, 'Failed to create caregiver')
  }
})

// PUT /api/caregivers/:id - Update caregiver
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const validatedData = updateCaregiverSchema.parse(req.body) as UpdateCaregiverRequest

    // Check if caregiver exists
    const existingCaregiver = db.prepare('SELECT id FROM caregivers WHERE id = ?').get(id)
    if (!existingCaregiver) {
      return err(res, 404, 'NOT_FOUND', 'Caregiver not found')
    }

    // Build dynamic update query
    const updates: string[] = []
    const values: (string | number | null)[] = []

    Object.entries(validatedData).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'specialties' || key === 'certifications' || key === 'availability_schedule') {
          updates.push(`${key} = ?`)
          values.push(JSON.stringify(value))
        } else {
          updates.push(`${key} = ?`)
          values.push(value)
        }
      }
    })

    if (updates.length === 0) {
      return err(res, 400, 'VALIDATION_ERROR', 'No valid fields to update')
    }

    // Add updated_at
    updates.push('updated_at = ?')
    values.push(new Date().toISOString())
    values.push(id)

    const updateQuery = `UPDATE caregivers SET ${updates.join(', ')} WHERE id = ?`
    db.prepare(updateQuery).run(...values)

    // Return updated caregiver
    const updatedCaregiver = db.prepare('SELECT * FROM caregivers WHERE id = ?').get(id) as CaregiverDbRow
    const parsedCaregiver = parseDbRowToCaregiver(updatedCaregiver)

    return okItem(res, parsedCaregiver)
  } catch (error) {
    return handleRouterError(res, error, 'Failed to update caregiver')
  }
})

// DELETE /api/caregivers/:id - Soft delete caregiver
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const existingCaregiver = db.prepare('SELECT id FROM caregivers WHERE id = ?').get(id)
    if (!existingCaregiver) {
      return err(res, 404, 'NOT_FOUND', 'Caregiver not found')
    }

    // Soft delete by setting is_active to 0
    db.prepare('UPDATE caregivers SET is_active = 0, updated_at = ? WHERE id = ?')
      .run(new Date().toISOString(), id)

    return okItem(res, { message: 'Caregiver deleted successfully' })
  } catch (error) {
    return handleRouterError(res, error, 'Failed to delete caregiver')
  }
})

// POST /api/caregivers/:id/clock - Clock in/out endpoint
router.post('/:id/clock', async (req, res) => {
  try {
    const { id } = req.params
    const validatedData = clockInOutSchema.parse(req.body) as ClockInOutRequest

    const existingCaregiver = db.prepare('SELECT * FROM caregivers WHERE id = ?').get(id) as CaregiverDbRow | undefined
    if (!existingCaregiver) {
      return err(res, 404, 'NOT_FOUND', 'Caregiver not found')
    }

    const timestamp = validatedData.timestamp || new Date().toISOString()
    const updates: { [key: string]: string | number | null } = { updated_at: timestamp }

    if (validatedData.action === 'clock_in') {
      updates.clock_in_time = timestamp
      updates.last_clock_in = timestamp
      // Clear clock_out_time when clocking in
      updates.clock_out_time = null
    } else if (validatedData.action === 'clock_out') {
      updates.clock_out_time = timestamp
      updates.last_clock_out = timestamp
      
      // Calculate hours worked if there's a clock_in_time
      if (existingCaregiver.clock_in_time) {
        const clockInTime = new Date(existingCaregiver.clock_in_time)
        const clockOutTime = new Date(timestamp)
        const hoursWorked = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60)
        updates.total_hours_worked = (existingCaregiver.total_hours_worked || 0) + hoursWorked
      }
      
      // Clear clock_in_time when clocking out
      updates.clock_in_time = null
    }

    // Build update query
    const updateFields = Object.keys(updates).map(key => `${key} = ?`).join(', ')
    const updateValues = Object.values(updates)
    updateValues.push(id)

    db.prepare(`UPDATE caregivers SET ${updateFields} WHERE id = ?`).run(...updateValues)

    // Return updated caregiver
    const updatedCaregiver = db.prepare('SELECT * FROM caregivers WHERE id = ?').get(id) as CaregiverDbRow
    const parsedCaregiver = parseDbRowToCaregiver(updatedCaregiver)

    return okItem(res, parsedCaregiver)
  } catch (error) {
    return handleRouterError(res, error, 'Failed to clock in/out')
  }
})

// GET /api/caregivers/:id/schedule - Get caregiver schedule
router.get('/:id/schedule', async (req, res) => {
  try {
    const { id } = req.params
    
    const caregiver = db.prepare(`
      SELECT availability_schedule, clock_in_time, clock_out_time 
      FROM caregivers WHERE id = ?
    `).get(id) as Pick<CaregiverDbRow, 'availability_schedule' | 'clock_in_time' | 'clock_out_time'> | undefined

    if (!caregiver) {
      return err(res, 404, 'NOT_FOUND', 'Caregiver not found')
    }

    const schedule: CaregiverScheduleResponse = {
      availability: caregiver.availability_schedule ? JSON.parse(caregiver.availability_schedule) : {},
      currentShift: {
        clockedIn: !!caregiver.clock_in_time,
        clockInTime: caregiver.clock_in_time,
        clockOutTime: caregiver.clock_out_time,
      }
    }

    return okItem(res, schedule)
  } catch (error) {
    return handleRouterError(res, error, 'Failed to retrieve caregiver schedule')
  }
})

export default router