/**
 * Therapy Records Router
 * REST API endpoints for managing CBT, ACT, and DBT therapy records
 */

import { Router } from 'express'
import { z } from 'zod'
import { validateBody, validateQuery } from '../middleware/validation'
import { therapyRecordsService } from '../logic/therapyRecordsService'

const therapyRecordsRouter = Router()

// ---------------------------------------------------------------------
// Zod Schemas for Validation
// ---------------------------------------------------------------------

const therapyTypeSchema = z.enum(['cbt', 'act', 'dbt'])

// CBT Thought Record validation schema
const cbtThoughtRecordSchema = z.object({
  situation: z.string().min(1, 'Situation is required'),
  automaticThought: z.string().min(1, 'Automatic thought is required'),
  emotion: z.string().min(1, 'Emotion is required'),
  emotionIntensity: z.number().int().min(0).max(100),
  evidenceFor: z.string().min(1, 'Evidence for is required'),
  evidenceAgainst: z.string().min(1, 'Evidence against is required'),
  alternativeThought: z.string().min(1, 'Alternative thought is required'),
  newEmotion: z.string().min(1, 'New emotion is required'),
  newEmotionIntensity: z.number().int().min(0).max(100)
})

// Create therapy record request schema
const createTherapyRecordSchema = z.object({
  patient_id: z.string().min(1, 'Patient ID is required'),
  session_id: z.string().optional(),
  therapy_type: therapyTypeSchema,
  data: z.union([
    cbtThoughtRecordSchema,
    z.record(z.unknown()) // Flexible for ACT/DBT for now
  ])
})

// Query options schema
const queryOptionsSchema = z.object({
  limit: z.coerce.number().int().positive().optional(),
  offset: z.coerce.number().int().min(0).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  therapy_type: therapyTypeSchema.optional(),
  sortOrder: z.enum(['ASC', 'DESC']).optional()
})

// ---------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------

/**
 * POST /api/therapy-records
 * Create a new therapy record
 */
therapyRecordsRouter.post('/', validateBody(createTherapyRecordSchema), (req, res) => {
  try {
    console.log('📥 Received POST /api/therapy-records request:', {
      patient_id: req.body.patient_id,
      therapy_type: req.body.therapy_type,
      session_id: req.body.session_id,
      has_data: !!req.body.data
    })
    
    const record = therapyRecordsService.createRecord(req.body)
    
    console.log('✅ Successfully created therapy record:', {
      id: record.id,
      therapy_type: record.therapy_type,
      patient_id: record.patient_id
    })
    
    res.status(201).json(record)
  } catch (error) {
    console.error('❌ Error creating therapy record:', error)
    res.status(500).json({
      error: 'Failed to create therapy record',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * GET /api/therapy-records/:id
 * Get a specific therapy record by ID
 */
therapyRecordsRouter.get('/:id', (req, res) => {
  try {
    const record = therapyRecordsService.getRecord(req.params.id)
    
    if (!record) {
      return res.status(404).json({ error: 'Therapy record not found' })
    }
    
    res.json(record)
  } catch (error) {
    console.error('Error retrieving therapy record:', error)
    res.status(500).json({
      error: 'Failed to retrieve therapy record',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * GET /api/therapy-records
 * Get all therapy records with optional filtering
 */
therapyRecordsRouter.get('/', validateQuery(queryOptionsSchema), (req, res) => {
  try {
    const records = therapyRecordsService.getRecords(req.query)
    res.json(records)
  } catch (error) {
    console.error('Error retrieving therapy records:', error)
    res.status(500).json({
      error: 'Failed to retrieve therapy records',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * GET /api/therapy-records/patient/:patientId
 * Get all therapy records for a specific patient
 */
therapyRecordsRouter.get('/patient/:patientId', validateQuery(queryOptionsSchema), (req, res) => {
  try {
    const records = therapyRecordsService.getRecordsByPatient(
      req.params.patientId,
      req.query
    )
    res.json(records)
  } catch (error) {
    console.error('Error retrieving patient therapy records:', error)
    res.status(500).json({
      error: 'Failed to retrieve patient therapy records',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * GET /api/therapy-records/session/:sessionId
 * Get all therapy records for a specific session
 */
therapyRecordsRouter.get('/session/:sessionId', (req, res) => {
  try {
    const records = therapyRecordsService.getRecordsBySession(req.params.sessionId)
    res.json(records)
  } catch (error) {
    console.error('Error retrieving session therapy records:', error)
    res.status(500).json({
      error: 'Failed to retrieve session therapy records',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * DELETE /api/therapy-records/:id
 * Delete a therapy record by ID
 */
therapyRecordsRouter.delete('/:id', (req, res) => {
  try {
    const success = therapyRecordsService.deleteRecord(req.params.id)
    
    if (!success) {
      return res.status(404).json({ error: 'Therapy record not found' })
    }
    
    res.json({ message: 'Therapy record deleted successfully' })
  } catch (error) {
    console.error('Error deleting therapy record:', error)
    res.status(500).json({
      error: 'Failed to delete therapy record',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * GET /api/therapy-records/stats (with optional patientId query param)
 * Get therapy record statistics by type
 */
therapyRecordsRouter.get('/stats', (req, res) => {
  try {
    const patientId = req.query.patientId as string | undefined
    const stats = therapyRecordsService.getRecordStats(patientId)
    res.json(stats)
  } catch (error) {
    console.error('Error retrieving therapy record stats:', error)
    res.status(500).json({
      error: 'Failed to retrieve therapy record stats',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * GET /api/therapy-records/stats/:patientId
 * Get therapy record statistics by type for specific patient
 */
therapyRecordsRouter.get('/stats/:patientId', (req, res) => {
  try {
    const stats = therapyRecordsService.getRecordStats(req.params.patientId)
    res.json(stats)
  } catch (error) {
    console.error('Error retrieving therapy record stats:', error)
    res.status(500).json({
      error: 'Failed to retrieve therapy record stats',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default therapyRecordsRouter
