// backend/routes/caregiversRouter.ts
// Singleton caregiver profile - manages the single caregiver (you)

import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db/db'
import { okItem, err } from '../utils/apiContract'
import { handleRouterError, generateId } from '../utils/routerHelpers'
import type {
  Caregiver,
  CreateCaregiverRequest,
} from '../types/caregiver'

const router = Router()

/* -------------------------------- Schemas -------------------------------- */

const caregiverSchema = z.object({
  name: z.string().min(1).max(200),
  date_of_birth: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  relationship: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  notes: z.string().optional(),
})

/* ------------------------------- Routes ---------------------------------- */

// GET /api/caregiver - Get your caregiver profile (singleton)
router.get('/', async (req, res) => {
  try {
    const caregiver = db.prepare(`
      SELECT * FROM caregivers LIMIT 1
    `).get() as Caregiver | undefined

    if (!caregiver) {
      return err(res, 404, 'NOT_FOUND', 'Caregiver profile not found. Please create your profile first.')
    }

    return okItem(res, caregiver)
  } catch (error) {
    return handleRouterError(res, error, 'Failed to retrieve caregiver profile')
  }
})

// PUT /api/caregiver - Save (create or update) your caregiver profile (true upsert)
router.put('/', async (req, res) => {
  try {
    const validatedData = caregiverSchema.parse(req.body) as CreateCaregiverRequest

    // Check if profile exists
    const existingCaregiver = db.prepare('SELECT id FROM caregivers LIMIT 1').get() as { id: string } | undefined
    const now = new Date().toISOString()

    if (existingCaregiver) {
      // UPDATE existing profile
      const updates: string[] = []
      const values: (string | number | null)[] = []

      // Add all fields from validated data
      Object.entries(validatedData).forEach(([key, value]) => {
        updates.push(`${key} = ?`)
        values.push(value !== undefined ? value : null)
      })

      // Add updated_at
      updates.push('updated_at = ?')
      values.push(now)
      values.push(existingCaregiver.id)

      const updateQuery = `UPDATE caregivers SET ${updates.join(', ')} WHERE id = ?`
      db.prepare(updateQuery).run(...values)

      // Return updated profile
      const updatedCaregiver = db.prepare('SELECT * FROM caregivers WHERE id = ?').get(existingCaregiver.id) as Caregiver
      return okItem(res, updatedCaregiver)
    } else {
      // CREATE new profile
      const id = generateId()

      const insertCaregiver = db.prepare(`
        INSERT INTO caregivers (
          id, name, date_of_birth, email, phone, address, relationship,
          emergency_contact_name, emergency_contact_phone, notes,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      insertCaregiver.run(
        id,
        validatedData.name,
        validatedData.date_of_birth || null,
        validatedData.email || null,
        validatedData.phone || null,
        validatedData.address || null,
        validatedData.relationship || null,
        validatedData.emergency_contact_name || null,
        validatedData.emergency_contact_phone || null,
        validatedData.notes || null,
        now,
        now
      )

      // Return the created profile
      const newCaregiver = db.prepare('SELECT * FROM caregivers WHERE id = ?').get(id) as Caregiver
      return okItem(res, newCaregiver, 201)
    }
  } catch (error) {
    return handleRouterError(res, error, 'Failed to save caregiver profile')
  }
})

export default router