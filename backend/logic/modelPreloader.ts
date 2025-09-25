/**
 * modelPreloader.ts
 * 
 * Preloads local models on backend startup to eliminate "cold start" delays.
 * Keeps Ollama models warm and ready for instant responses.
 */

import { fetch } from 'undici'
import { logInfo, logError } from '../utils/logger'

interface PreloadConfig {
  model: string
  displayName: string
  maxRetries: number
  retryDelayMs: number
}

interface OllamaResponse {
  message?: {
    content?: string
  }
  done?: boolean
}

interface OllamaModelsResponse {
  models?: Array<{ name: string }>
}

// Models to preload on startup
const MODELS_TO_PRELOAD: PreloadConfig[] = [
  {
    model: 'qwen2.5-coder:3b',
    displayName: 'Qwen 2.5 Coder 3B',
    maxRetries: 3,
    retryDelayMs: 2000,
  },
]

const OLLAMA_BASE_URL = process.env.OLLAMA_URL || 'http://localhost:11434'

/**
 * Create a timeout promise for fetch requests
 */
function createTimeout(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Request timeout after ${ms}ms`)), ms)
  })
}

/**
 * Check if Ollama is running and accessible
 */
async function checkOllamaHealth(): Promise<boolean> {
  try {
    const response = await Promise.race([
      fetch(`${OLLAMA_BASE_URL}/api/tags`, { method: 'GET' }),
      createTimeout(5000)
    ])
    return response.ok
  } catch (error) {
    logError('Ollama health check failed', error instanceof Error ? error : new Error(String(error)))
    return false
  }
}

/**
 * Get list of models currently loaded in Ollama
 */
async function getLoadedModels(): Promise<string[]> {
  try {
    const response = await Promise.race([
      fetch(`${OLLAMA_BASE_URL}/api/ps`, { method: 'GET' }),
      createTimeout(5000)
    ])

    if (!response.ok) {
      return []
    }

    const data = await response.json() as OllamaModelsResponse
    return data.models?.map(m => m.name) || []
  } catch (error) {
    logError('Failed to get loaded models', error instanceof Error ? error : new Error(String(error)))
    return []
  }
}

/**
 * Preload a single model by sending a minimal chat request
 */
async function preloadModel(config: PreloadConfig): Promise<boolean> {
  const { model, displayName, maxRetries, retryDelayMs } = config

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logInfo(`🔄 Preloading ${displayName} (attempt ${attempt}/${maxRetries})...`)

      const startTime = Date.now()
      
      // Send a minimal chat request to load the model into memory
      const response = await Promise.race([
        fetch(`${OLLAMA_BASE_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: 'system',
                content: 'You are being preloaded. Respond with just "Ready".',
              },
              {
                role: 'user',
                content: 'Status?',
              },
            ],
            stream: false,
            options: {
              num_predict: 1, // Generate only 1 token to minimize time
              temperature: 0, // Deterministic for consistency
            },
          }),
        }),
        createTimeout(60000) // 60 second timeout for model loading
      ])

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json() as OllamaResponse
      const loadTime = Date.now() - startTime

      if (data.message?.content) {
        logInfo(`✅ ${displayName} preloaded successfully in ${loadTime}ms`)
        return true
      } else {
        throw new Error('No response content received')
      }
    } catch (error) {
      logError(`❌ Failed to preload ${displayName} (attempt ${attempt})`, error instanceof Error ? error : new Error(String(error)))

      if (attempt < maxRetries) {
        logInfo(`⏳ Retrying in ${retryDelayMs}ms...`)
        await new Promise(resolve => setTimeout(resolve, retryDelayMs))
      }
    }
  }

  logError(`💥 Failed to preload ${displayName} after ${maxRetries} attempts`, new Error('Max retries exceeded'))
  return false
}

/**
 * Preload all configured local models
 */
export async function preloadLocalModels(): Promise<{
  success: boolean
  loaded: string[]
  failed: string[]
  totalTime: number
}> {
  const startTime = Date.now()
  logInfo('🚀 Starting local model preloading...')

  // Check if Ollama is running
  const isOllamaHealthy = await checkOllamaHealth()
  if (!isOllamaHealthy) {
    logError('❌ Ollama is not running or not accessible. Skipping model preloading', new Error('Ollama not accessible'))
    return {
      success: false,
      loaded: [],
      failed: MODELS_TO_PRELOAD.map(m => m.displayName),
      totalTime: Date.now() - startTime,
    }
  }

  logInfo('✅ Ollama is healthy, proceeding with model preloading')

  // Check which models are already loaded
  const alreadyLoaded = await getLoadedModels()
  if (alreadyLoaded.length > 0) {
    logInfo(`📋 Models already loaded: ${alreadyLoaded.join(', ')}`)
  }

  const results = {
    loaded: [] as string[],
    failed: [] as string[],
  }

  // Preload models sequentially to avoid overwhelming the system
  for (const config of MODELS_TO_PRELOAD) {
    // Skip if already loaded
    if (alreadyLoaded.includes(config.model)) {
      logInfo(`⏭️  ${config.displayName} already loaded, skipping`)
      results.loaded.push(config.displayName)
      continue
    }

    const success = await preloadModel(config)
    if (success) {
      results.loaded.push(config.displayName)
    } else {
      results.failed.push(config.displayName)
    }
  }

  const totalTime = Date.now() - startTime
  const overallSuccess = results.failed.length === 0

  if (overallSuccess) {
    logInfo(`🎉 All models preloaded successfully in ${totalTime}ms`)
    logInfo(`✅ Ready models: ${results.loaded.join(', ')}`)
  } else {
    logError(`⚠️  Model preloading completed with errors in ${totalTime}ms`, new Error('Some models failed to preload'))
    logInfo(`✅ Loaded: ${results.loaded.join(', ') || 'none'}`)
    logError(`❌ Failed: ${results.failed.join(', ') || 'none'}`, new Error('Model preloading failures'))
  }

  return {
    success: overallSuccess,
    loaded: results.loaded,
    failed: results.failed,
    totalTime,
  }
}

/**
 * Keep models warm by sending periodic health checks
 * This prevents Ollama from unloading models due to inactivity
 */
export async function startModelWarming(intervalMinutes: number = 4): Promise<() => void> {
  const intervalMs = intervalMinutes * 60 * 1000

  const warmupInterval = setInterval(async () => {
    try {
      const loadedModels = await getLoadedModels()
      
      if (loadedModels.length === 0) {
        logInfo('🔄 No models loaded, skipping warmup')
        return
      }

      logInfo(`🌡️  Warming ${loadedModels.length} loaded models...`)

      // Send minimal requests to keep models active
      for (const modelName of loadedModels) {
        try {
          await Promise.race([
            fetch(`${OLLAMA_BASE_URL}/api/chat`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model: modelName,
                messages: [{ role: 'user', content: 'ping' }],
                stream: false,
                options: { num_predict: 1, temperature: 0 },
              }),
            }),
            createTimeout(10000)
          ])
        } catch {
          // Silent fail for warmup requests - don't spam logs
        }
      }
    } catch (error) {
      logError('Model warming error', error instanceof Error ? error : new Error(String(error)))
    }
  }, intervalMs)

  logInfo(`🌡️  Model warming started (every ${intervalMinutes} minutes)`)

  // Return cleanup function
  return () => {
    clearInterval(warmupInterval)
    logInfo('🌡️  Model warming stopped')
  }
}