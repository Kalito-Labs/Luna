// backend/routes/providersRouter.ts

import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db/db'
import { okList, okItem, err } from '../utils/apiContract'
import { handleRouterError, generateId } from '../utils/routerHelpers'

const router = Router()

/* -------------------------------- Schemas -------------------------------- */

const createProviderSchema = z.object({
  name: z.string().min(1).max(200),
  specialty: z.string().optional(),
  practice_name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  preferred: z.number().min(0).max(1).optional(),
})

const updateProviderSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  specialty: z.string().optional(),
  practice_name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  preferred: z.number().min(0).max(1).optional(),
})

/* ------------------------------- Routes ---------------------------------- */

// GET /api/providers - List all healthcare providers
router.get('/', async (req, res) => {
  try {
    const providers = db.prepare(`
      SELECT * FROM healthcare_providers 
      ORDER BY preferred DESC, name ASC
    `).all()

    okList(res, providers)
  } catch (error) {
    handleRouterError(res, error, 'Failed to retrieve healthcare providers')
  }
})

// GET /api/providers/:id - Get a specific provider
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const provider = db.prepare(`
      SELECT * FROM healthcare_providers 
      WHERE id = ?
    `).get(id)

    if (!provider) {
      return err(res, 404, 'NOT_FOUND', 'Healthcare provider not found')
    }

    okItem(res, provider)
  } catch (error) {
    handleRouterError(res, error, 'Failed to retrieve healthcare provider')
  }
})

// POST /api/providers - Create a new healthcare provider
router.post('/', async (req, res) => {
  try {
    const validatedData = createProviderSchema.parse(req.body)
    
    const providerId = generateId()
    const now = new Date().toISOString()
    
    const insertProvider = db.prepare(`
      INSERT INTO healthcare_providers (
        id, name, specialty, practice_name, phone, email, 
        address, notes, preferred, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    insertProvider.run(
      providerId,
      validatedData.name,
      validatedData.specialty || null,
      validatedData.practice_name || null,
      validatedData.phone || null,
      validatedData.email || null,
      validatedData.address || null,
      validatedData.notes || null,
      validatedData.preferred || 0,
      now,
      now
    )

    // Retrieve the created provider
    const createdProvider = db.prepare(`
      SELECT * FROM healthcare_providers WHERE id = ?
    `).get(providerId)

    okItem(res, createdProvider, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return err(res, 400, 'VALIDATION_ERROR', 'Invalid provider data', { issues: error.errors })
    }
    handleRouterError(res, error, 'Failed to create healthcare provider')
  }
})

// PUT /api/providers/:id - Update a healthcare provider
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const validatedData = updateProviderSchema.parse(req.body)
    
    // Check if provider exists
    const existingProvider = db.prepare(`
      SELECT * FROM healthcare_providers WHERE id = ?
    `).get(id)

    if (!existingProvider) {
      return err(res, 404, 'NOT_FOUND', 'Healthcare provider not found')
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
      UPDATE healthcare_providers 
      SET ${updateFields.join(', ')} 
      WHERE id = ?
    `

    db.prepare(updateQuery).run(...updateValues)

    // Retrieve the updated provider
    const updatedProvider = db.prepare(`
      SELECT * FROM healthcare_providers WHERE id = ?
    `).get(id)

    okItem(res, updatedProvider)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return err(res, 400, 'VALIDATION_ERROR', 'Invalid provider data', { issues: error.errors })
    }
    handleRouterError(res, error, 'Failed to update healthcare provider')
  }
})

// DELETE /api/providers/:id - Delete a healthcare provider
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const existingProvider = db.prepare(`
      SELECT * FROM healthcare_providers WHERE id = ?
    `).get(id)

    if (!existingProvider) {
      return err(res, 404, 'NOT_FOUND', 'Healthcare provider not found')
    }

    // Delete the provider
    db.prepare(`
      DELETE FROM healthcare_providers WHERE id = ?
    `).run(id)

    okItem(res, { message: 'Healthcare provider deleted successfully' })
  } catch (error) {
    handleRouterError(res, error, 'Failed to delete healthcare provider')
  }
})

export default router