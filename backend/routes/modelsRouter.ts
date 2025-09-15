import { Router } from 'express'
import { listModelAdapters } from '../logic/modelRegistry'
import { handleRouterError } from '../utils/routerHelpers'

const router = Router()

/**
 * GET /api/models
 * Returns list of available AI models
 */
router.get('/', (req, res) => {
  try {
    const adapters = listModelAdapters()
    
    // Deduplicate by adapter instance (aliases point to same adapter object)
    const uniqueAdapters = Array.from(new Set(adapters))
    
    const models = uniqueAdapters.map(adapter => ({
      key: adapter.id, // Frontend expects 'key' property
      id: adapter.id, // Keep 'id' for backward compatibility
      name: adapter.name,
      type: adapter.type,
    }))

    res.json({
      success: true,
      models,
    })
  } catch (error) {
    return handleRouterError(res, error, 'fetch available models')
  }
})

export default router
