/**
 * Ollama Adapter Exports
 * 
 * Clean interface for Ollama factory pattern exports.
 */

// Factory function and types
export { createOllamaAdapter } from './factory'
export type { OllamaAdapterConfig } from './factory'

// Pre-built adapter instances
export {
  phi3MiniAdapter,
  ollamaAdapters,
  getOllamaAdapterIds,
} from './adapters'
