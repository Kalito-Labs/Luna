// backend/routes/patientsRouter.ts

import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db/db'
import { okList, okItem, err } from '../utils/apiContract'
import { handleRouterError, generateId } from '../utils/routerHelpers'

const router = Router()

/* -------------------------------- Schemas -------------------------------- */

const createPatientSchema = z.object({
  name: z.string().min(1).max(200),
  date_of_birth: z.string().nullable().optional(),
  relationship: z.string().nullable().optional(),
  gender: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  emergency_contact_name: z.string().nullable().optional(),
  emergency_contact_phone: z.string().nullable().optional(),
  primary_doctor: z.string().nullable().optional(),
  doctor_address: z.string().nullable().optional(),
  doctor_phone: z.string().nullable().optional(),
  insurance_provider: z.string().nullable().optional(),
  insurance_id: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

const updatePatientSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  date_of_birth: z.string().nullable().optional(),
  relationship: z.string().nullable().optional(),
  gender: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  emergency_contact_name: z.string().nullable().optional(),
  emergency_contact_phone: z.string().nullable().optional(),
  primary_doctor: z.string().nullable().optional(),
  doctor_address: z.string().nullable().optional(),
  doctor_phone: z.string().nullable().optional(),
  insurance_provider: z.string().nullable().optional(),
  insurance_id: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  active: z.number().min(0).max(1).optional(),
}).strict()

/* ------------------------------- Routes ---------------------------------- */

// GET /api/patients - List all active patients
router.get('/', async (req, res) => {
  try {
    const patients = db.prepare(`
      SELECT * FROM patients 
      WHERE active = 1 
      ORDER BY name ASC
    `).all()

    okList(res, patients)
  } catch (error) {
    handleRouterError(res, error, 'Failed to retrieve patients')
  }
})

// GET /api/patients/:id - Get a specific patient
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const patient = db.prepare(`
      SELECT * FROM patients 
      WHERE id = ? AND active = 1
    `).get(id)

    if (!patient) {
      return err(res, 404, 'NOT_FOUND', 'Patient not found')
    }

    okItem(res, patient)
  } catch (error) {
    handleRouterError(res, error, 'Failed to retrieve patient')
  }
})

// POST /api/patients - Create a new patient
router.post('/', async (req, res) => {
  try {
    const validatedData = createPatientSchema.parse(req.body)
    
    const patientId = generateId()
    const now = new Date().toISOString()
    
    const insertPatient = db.prepare(`
      INSERT INTO patients (
        id, name, date_of_birth, relationship, gender, phone,
        emergency_contact_name, emergency_contact_phone, primary_doctor,
        doctor_address, doctor_phone,
        insurance_provider, insurance_id, notes, active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `)

    insertPatient.run(
      patientId,
      validatedData.name,
      validatedData.date_of_birth || null,
      validatedData.relationship || null,
      validatedData.gender || null,
      validatedData.phone || null,
      validatedData.emergency_contact_name || null,
      validatedData.emergency_contact_phone || null,
      validatedData.primary_doctor || null,
      validatedData.doctor_address || null,
      validatedData.doctor_phone || null,
      validatedData.insurance_provider || null,
      validatedData.insurance_id || null,
      validatedData.notes || null,
      now,
      now
    )

    // Retrieve the created patient
    const createdPatient = db.prepare(`
      SELECT * FROM patients WHERE id = ?
    `).get(patientId)

    okItem(res, createdPatient, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return err(res, 400, 'VALIDATION_ERROR', 'Invalid patient data', { issues: error.errors })
    }
    handleRouterError(res, error, 'Failed to create patient')
  }
})

// PUT /api/patients/:id - Update a patient
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const validatedData = updatePatientSchema.parse(req.body)
    
    // Check if patient exists
    const existingPatient = db.prepare(`
      SELECT * FROM patients WHERE id = ? AND active = 1
    `).get(id)

    if (!existingPatient) {
      return err(res, 404, 'NOT_FOUND', 'Patient not found')
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
      UPDATE patients 
      SET ${updateFields.join(', ')} 
      WHERE id = ?
    `

    db.prepare(updateQuery).run(...updateValues)

    // Retrieve the updated patient
    const updatedPatient = db.prepare(`
      SELECT * FROM patients WHERE id = ?
    `).get(id)

    okItem(res, updatedPatient)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return err(res, 400, 'VALIDATION_ERROR', 'Invalid patient data', { issues: error.errors })
    }
    handleRouterError(res, error, 'Failed to update patient')
  }
})

// DELETE /api/patients/:id - Soft delete a patient (set active = 0)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const existingPatient = db.prepare(`
      SELECT * FROM patients WHERE id = ? AND active = 1
    `).get(id)

    if (!existingPatient) {
      return err(res, 404, 'NOT_FOUND', 'Patient not found')
    }

    // Soft delete by setting active = 0
    db.prepare(`
      UPDATE patients 
      SET active = 0, updated_at = ? 
      WHERE id = ?
    `).run(new Date().toISOString(), id)

    okItem(res, { message: 'Patient deleted successfully' })
  } catch (error) {
    handleRouterError(res, error, 'Failed to delete patient')
  }
})

// GET /api/patients/:id/summary - Get patient summary with related data
router.get('/:id/summary', async (req, res) => {
  try {
    const { id } = req.params
    
    // Get patient basic info
    const patient = db.prepare(`
      SELECT * FROM patients WHERE id = ? AND active = 1
    `).get(id)

    if (!patient) {
      return err(res, 404, 'NOT_FOUND', 'Patient not found')
    }

    // Get recent medications
    const medications = db.prepare(`
      SELECT * FROM medications 
      WHERE patient_id = ? AND active = 1 
      ORDER BY start_date DESC 
      LIMIT 5
    `).all(id)

    // Get recent appointments
    const appointments = db.prepare(`
      SELECT * FROM appointments 
      WHERE patient_id = ? 
      ORDER BY appointment_date DESC 
      LIMIT 5
    `).all(id)

    // Get recent vitals
    const vitals = db.prepare(`
      SELECT * FROM vitals 
      WHERE patient_id = ? 
      ORDER BY measured_at DESC 
      LIMIT 10
    `).all(id)

    // Get recent medical records
    const medicalRecords = db.prepare(`
      SELECT * FROM medical_records 
      WHERE patient_id = ? 
      ORDER BY date_recorded DESC 
      LIMIT 5
    `).all(id)

    const summary = {
      patient,
      medications,
      appointments,
      vitals,
      medicalRecords,
    }

    okItem(res, summary)
  } catch (error) {
    handleRouterError(res, error, 'Failed to retrieve patient summary')
  }
})

export default router