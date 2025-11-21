// backend/routes/vectorSearchRouter.ts
// API routes for vector search functionality

import { Router } from 'express'
import { vectorSearchService, SearchQuery } from '../logic/vectorSearchService'
import { okItem, err } from '../utils/apiContract'
import { handleRouterError } from '../utils/routerHelpers'

const router = Router()

/**
 * POST /api/vector-search/search
 * Perform semantic search across document chunks
 */
router.post('/search', async (req, res) => {
  try {
    const { 
      query, 
      persona_id, 
      dataset_ids, 
      therapeutic_tags, 
      limit, 
      similarity_threshold 
    } = req.body

    // Validate required fields
    if (!query || typeof query !== 'string') {
      return err(res, 400, 'VALIDATION_ERROR', 'Query text is required and must be a string')
    }

    const searchQuery: SearchQuery = {
      text: query,
      persona_id,
      dataset_ids,
      therapeutic_tags,
      limit: limit ? parseInt(limit) : undefined,
      similarity_threshold: similarity_threshold ? parseFloat(similarity_threshold) : undefined
    }

    const results = await vectorSearchService.search(searchQuery)
    return okItem(res, results)

  } catch (error) {
    return handleRouterError(res, error, 'vector-search')
  }
})

/**
 * POST /api/vector-search/context
 * Get context for RAG generation
 */
router.post('/context', async (req, res) => {
  try {
    const { query, persona_id, max_tokens } = req.body

    // Validate required fields
    if (!query || typeof query !== 'string') {
      return err(res, 400, 'VALIDATION_ERROR', 'Query text is required and must be a string')
    }

    const context = await vectorSearchService.getContextForQuery(
      query,
      persona_id,
      max_tokens ? parseInt(max_tokens) : 2000
    )

    return okItem(res, context)

  } catch (error) {
    return handleRouterError(res, error, 'context-retrieval')
  }
})

export { router as vectorSearchRouter }