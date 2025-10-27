/**
 * searchRouter.ts
 * API routes for Tavily web search and content extraction
 */

import { Router, type Request, type Response } from 'express'
import { searchWeb, extractContent, getStatus } from '../logic/tavilyService'
import { validateBody } from '../middleware/validation'
import { generalRateLimit } from '../middleware/security'
import { asyncHandler } from '../middleware/errorMiddleware'
import { logInfo } from '../utils/logger'
import type { SearchRequest, ExtractRequest } from '../types/search'
import { z } from 'zod'

const router = Router()

/**
 * Validation schemas for search endpoints
 */
const searchRequestSchema = z.object({
  query: z.string().min(1).max(400),
  options: z
    .object({
      search_depth: z.enum(['basic', 'advanced']).optional(),
      max_results: z.number().int().min(1).max(20).optional(),
      include_raw_content: z.boolean().optional(),
      include_images: z.boolean().optional(),
      include_answer: z.boolean().optional(),
      include_domains: z.array(z.string()).optional(),
      exclude_domains: z.array(z.string()).optional(),
    })
    .optional(),
})

const extractRequestSchema = z.object({
  url: z.string().url(),
})

/**
 * Apply rate limiting to all search endpoints
 * Prevents API quota exhaustion and abuse
 */
if (process.env.NODE_ENV !== 'test') {
  router.use(generalRateLimit)
}

/**
 * GET /api/search/status
 * Check Tavily API configuration status
 * 
 * Response: { configured: boolean, api_key_present: boolean, api_key_format_valid: boolean }
 */
router.get('/status', (_req: Request, res: Response) => {
  const status = getStatus()
  res.json(status)
})

/**
 * POST /api/search
 * Perform a web search using Tavily API
 * 
 * Request body:
 * {
 *   "query": "search query string",
 *   "options": {
 *     "search_depth": "basic" | "advanced",
 *     "max_results": 1-20,
 *     "include_raw_content": boolean,
 *     "include_images": boolean,
 *     "include_answer": boolean,
 *     "include_domains": string[],
 *     "exclude_domains": string[]
 *   }
 * }
 * 
 * Response: SearchResponse (see types/search.ts)
 */
router.post(
  '/',
  validateBody(searchRequestSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { query, options } = req.body as SearchRequest

    logInfo('Processing web search request', {
      query: query.substring(0, 100),
      has_options: !!options,
    })

    const results = await searchWeb(query, options)

    res.json(results)
  })
)

/**
 * POST /api/search/extract
 * Extract content from a specific URL using Tavily
 * 
 * Request body:
 * {
 *   "url": "https://example.com/page"
 * }
 * 
 * Response: ExtractResponse (see types/search.ts)
 */
router.post(
  '/extract',
  validateBody(extractRequestSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { url } = req.body as ExtractRequest

    logInfo('Processing content extraction request', {
      url: url.substring(0, 100),
    })

    const result = await extractContent(url)

    res.json(result)
  })
)

export { router as searchRouter }
