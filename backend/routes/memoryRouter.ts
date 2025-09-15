// Memory System API Routes
// Date: August 24, 2025
// Provides endpoints for memory management operations

import { Router } from 'express'
import { MemoryManager } from '../logic/memoryManager'
import { validateQuery, validateBody } from '../middleware/validation'
import { z } from 'zod'
import { db } from '../db/db'

const router = Router()
const memoryManager = new MemoryManager()

// Validation schemas
const createSummarySchema = z.object({
  session_id: z.string().min(1),
  start_message_id: z.string(),
  end_message_id: z.string(),
  message_count: z.number().positive()
})

const createPinSchema = z.object({
  session_id: z.string().min(1),
  content: z.string().min(1),
  source_message_id: z.string().optional(),
  importance_score: z.number().min(0).max(1).optional(),
  pin_type: z.enum(['manual', 'auto', 'code', 'concept', 'system']).optional()
})

const contextQuerySchema = z.object({
  maxTokens: z.number().positive().optional()
})

/**
 * GET /api/memory/:sessionId/context
 * Get intelligent memory context for a session
 */
router.get('/:sessionId/context', 
  validateQuery(contextQuerySchema),
  async (req, res) => {
    try {
      const { sessionId } = req.params
      const { maxTokens } = req.query
      
      const context = await memoryManager.buildContext(
        sessionId, 
        maxTokens ? Number(maxTokens) : undefined
      )
      
      res.json({
        success: true,
        data: context
      })
    } catch (error) {
      console.error('Memory context error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to build memory context'
      })
    }
  }
)

/**
 * POST /api/memory/summaries
 * Create a conversation summary
 */
router.post('/summaries',
  validateBody(createSummarySchema),
  async (req, res) => {
    try {
      const summary = await memoryManager.createSummary(req.body)
      
      res.status(201).json({
        success: true,
        data: summary
      })
    } catch (error) {
      console.error('Create summary error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to create summary'
      })
    }
  }
)

/**
 * POST /api/memory/pins
 * Create a semantic pin
 */
router.post('/pins',
  validateBody(createPinSchema),
  async (req, res) => {
    try {
      const pin = memoryManager.createSemanticPin(req.body)
      
      res.status(201).json({
        success: true,
        data: pin
      })
    } catch (error) {
      console.error('Create pin error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to create semantic pin'
      })
    }
  }
)

/**
 * POST /api/memory/:sessionId/score-messages
 * Score all messages in a session for importance
 */
router.post('/:sessionId/score-messages', async (req, res) => {
  try {
    const { sessionId } = req.params
    
    // Get all messages for this session
    const messages = memoryManager['getRecentMessages'](sessionId, 1000) // Get up to 1000 messages
    
    let updatedCount = 0
    for (const message of messages) {
      const importance = memoryManager.scoreMessageImportance(message)
      memoryManager.updateMessageImportance(message.id, importance)
      updatedCount++
    }
    
    res.json({
      success: true,
      data: {
        messagesScored: updatedCount,
        sessionId
      }
    })
  } catch (error) {
    console.error('Score messages error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to score messages'
    })
  }
})

/**
 * GET /api/memory/:sessionId/stats
 * Get memory statistics for a session
 */
router.get('/:sessionId/stats', async (req, res) => {
  try {
    const { sessionId: _sessionId } = req.params
    
    // Get basic stats (this will need database queries)
    // Calculate actual stats for the session
    
    // Get message count and importance stats
    const messageStats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        AVG(importance_score) as avgImportance,
        MIN(created_at) as oldest,
        MAX(created_at) as newest
      FROM messages 
      WHERE session_id = ?
    `).get(_sessionId) as {
      total: number
      avgImportance: number | null
      oldest: string | null
      newest: string | null
    } || { total: 0, avgImportance: null, oldest: null, newest: null }
    
    // Get summary count
    const summaryCount = db.prepare(`
      SELECT COUNT(*) as count 
      FROM conversation_summaries 
      WHERE session_id = ?
    `).get(_sessionId) as { count: number } || { count: 0 }
    
    // Get pin count
    const pinCount = db.prepare(`
      SELECT COUNT(*) as count 
      FROM semantic_pins 
      WHERE session_id = ?
    `).get(_sessionId) as { count: number } || { count: 0 }

    const stats = {
      totalMessages: messageStats.total,
      totalSummaries: summaryCount.count,
      totalPins: pinCount.count,
      oldestMessage: messageStats.oldest || '',
      newestMessage: messageStats.newest || '',
      averageImportanceScore: messageStats.avgImportance || 0
    }
    
    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Memory stats error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get memory statistics'
    })
  }
})

/**
 * GET /api/memory/:sessionId/needs-summarization
 * Check if session needs summarization
 */
router.get('/:sessionId/needs-summarization', async (req, res) => {
  try {
    const { sessionId } = req.params
    const needsSummary = memoryManager.needsSummarization(sessionId)
    
    res.json({
      success: true,
      data: {
        needsSummarization: needsSummary,
        sessionId
      }
    })
  } catch (error) {
    console.error('Check summarization error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to check summarization status'
    })
  }
})

export default router
