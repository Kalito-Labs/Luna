/**
 * Journal Router
 * REST API endpoints for Luna's journaling and mood tracking system
 */

import { Router } from 'express'
import { z } from 'zod'
import { validateBody, validateQuery } from '../middleware/validation'
import { journalService } from '../logic/journalService'

const journalRouter = Router()

// ---------------------------------------------------------------------
// Zod Schemas for Validation
// ---------------------------------------------------------------------

const moodTypeSchema = z.enum([
  'happy', 'excited', 'grateful', 'relaxed', 'content',
  'tired', 'unsure', 'bored', 'anxious', 'angry',
  'stressed', 'sad', 'desperate'
])

const journalTypeSchema = z.enum(['free', 'prompted', 'mood_check'])
const privacyLevelSchema = z.enum(['private', 'shared_with_therapist'])

const createJournalEntrySchema = z.object({
  patient_id: z.string().min(1, 'Patient ID is required'),
  session_id: z.string().optional(),
  title: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  entry_time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)').optional(),
  mood: moodTypeSchema.optional(),
  emotions: z.array(moodTypeSchema).optional(),
  journal_type: journalTypeSchema.optional(),
  prompt_used: z.string().optional(),
  privacy_level: privacyLevelSchema.optional()
})

const updateJournalEntrySchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1).optional(),
  entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  entry_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  mood: moodTypeSchema.optional(),
  emotions: z.array(moodTypeSchema).optional(),
  journal_type: journalTypeSchema.optional(),
  prompt_used: z.string().optional(),
  privacy_level: privacyLevelSchema.optional(),
  favorite: z.boolean().optional()
})

const queryOptionsSchema = z.object({
  limit: z.coerce.number().int().positive().optional(),
  offset: z.coerce.number().int().min(0).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  mood: moodTypeSchema.optional(),
  journal_type: journalTypeSchema.optional(),
  favorite: z.coerce.boolean().optional(),
  sortBy: z.enum(['entry_date', 'created_at', 'updated_at']).optional(),
  sortOrder: z.enum(['ASC', 'DESC']).optional()
})

// ---------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------

/**
 * POST /api/journal
 * Create a new journal entry
 */
journalRouter.post('/', validateBody(createJournalEntrySchema), (req, res) => {
  try {
    const entry = journalService.createEntry(req.body)
    res.status(201).json(entry)
  } catch (error) {
    console.error('Error creating journal entry:', error)
    res.status(500).json({ 
      error: 'Failed to create journal entry',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * GET /api/journal/:id
 * Get a specific journal entry by ID
 */
journalRouter.get('/:id', (req, res) => {
  try {
    const entry = journalService.getEntry(req.params.id)
    
    if (!entry) {
      return res.status(404).json({ error: 'Journal entry not found' })
    }
    
    res.json(entry)
  } catch (error) {
    console.error('Error retrieving journal entry:', error)
    res.status(500).json({ 
      error: 'Failed to retrieve journal entry',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * PUT /api/journal/:id
 * Update an existing journal entry
 */
journalRouter.put('/:id', validateBody(updateJournalEntrySchema), (req, res) => {
  try {
    const entry = journalService.updateEntry(req.params.id, req.body)
    res.json(entry)
  } catch (error) {
    console.error('Error updating journal entry:', error)
    
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({ error: 'Journal entry not found' })
    }
    
    res.status(500).json({ 
      error: 'Failed to update journal entry',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * DELETE /api/journal/:id
 * Delete a journal entry
 */
journalRouter.delete('/:id', (req, res) => {
  try {
    const deleted = journalService.deleteEntry(req.params.id)
    
    if (!deleted) {
      return res.status(404).json({ error: 'Journal entry not found' })
    }
    
    res.status(204).send()
  } catch (error) {
    console.error('Error deleting journal entry:', error)
    res.status(500).json({ 
      error: 'Failed to delete journal entry',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * GET /api/journal/patient/:patientId
 * Get all journal entries for a patient with optional filtering
 */
journalRouter.get('/patient/:patientId', validateQuery(queryOptionsSchema), (req, res) => {
  try {
    const entries = journalService.getEntriesByPatient(req.params.patientId, req.query)
    res.json(entries)
  } catch (error) {
    console.error('Error retrieving journal entries:', error)
    res.status(500).json({ 
      error: 'Failed to retrieve journal entries',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * GET /api/journal/patient/:patientId/recent
 * Get recent journal entries for dashboard
 */
journalRouter.get('/patient/:patientId/recent', (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 3
    const entries = journalService.getRecentEntries(req.params.patientId, limit)
    res.json(entries)
  } catch (error) {
    console.error('Error retrieving recent entries:', error)
    res.status(500).json({ 
      error: 'Failed to retrieve recent entries',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * GET /api/journal/patient/:patientId/favorites
 * Get favorite journal entries
 */
journalRouter.get('/patient/:patientId/favorites', (req, res) => {
  try {
    const entries = journalService.getFavoriteEntries(req.params.patientId)
    res.json(entries)
  } catch (error) {
    console.error('Error retrieving favorite entries:', error)
    res.status(500).json({ 
      error: 'Failed to retrieve favorite entries',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * GET /api/journal/calendar/:patientId/:year/:month
 * Get journal entries organized by date for calendar view
 */
journalRouter.get('/calendar/:patientId/:year/:month', (req, res) => {
  try {
    const year = parseInt(req.params.year)
    const month = parseInt(req.params.month)
    
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return res.status(400).json({ error: 'Invalid year or month' })
    }
    
    const calendarEntries = journalService.getEntriesForMonth(
      req.params.patientId,
      year,
      month
    )
    
    res.json(calendarEntries)
  } catch (error) {
    console.error('Error retrieving calendar entries:', error)
    res.status(500).json({ 
      error: 'Failed to retrieve calendar entries',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * GET /api/journal/insights/:patientId
 * Get mood statistics and insights
 */
journalRouter.get('/insights/:patientId', (req, res) => {
  try {
    const { startDate, endDate } = req.query
    
    const dateRange = (startDate && endDate) ? {
      start: startDate as string,
      end: endDate as string
    } : undefined
    
    const stats = journalService.getMoodStatistics(req.params.patientId, dateRange)
    res.json(stats)
  } catch (error) {
    console.error('Error retrieving mood insights:', error)
    res.status(500).json({ 
      error: 'Failed to retrieve mood insights',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * GET /api/journal/search/:patientId
 * Search journal entries by content
 */
journalRouter.get('/search/:patientId', (req, res) => {
  try {
    const searchTerm = req.query.q as string
    
    if (!searchTerm) {
      return res.status(400).json({ error: 'Search term is required (query parameter: q)' })
    }
    
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20
    const entries = journalService.searchEntries(req.params.patientId, searchTerm, limit)
    
    res.json(entries)
  } catch (error) {
    console.error('Error searching journal entries:', error)
    res.status(500).json({ 
      error: 'Failed to search journal entries',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * POST /api/journal/:id/favorite
 * Toggle favorite status of an entry
 */
journalRouter.post('/:id/favorite', (req, res) => {
  try {
    const entry = journalService.toggleFavorite(req.params.id)
    res.json(entry)
  } catch (error) {
    console.error('Error toggling favorite:', error)
    
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({ error: 'Journal entry not found' })
    }
    
    res.status(500).json({ 
      error: 'Failed to toggle favorite',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default journalRouter
