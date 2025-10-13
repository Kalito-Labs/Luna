import type { LLMAdapter } from '../types/models'

// Re-export LLMAdapter for adapters to import
export type { LLMAdapter }

// The registry storing all adapters by lookup key (canonical IDs and aliases)
const modelRegistry: Record<string, LLMAdapter> = Object.create(null)

// ---------- Adapters ----------
import { 
  gpt41NanoAdapter,
} from './adapters/openai'
import {
  phi3MiniAdapter,
} from './adapters/ollama'

// ---------- Registration helper ----------

/**
 * Registers an adapter under its canonical id and any provided aliases.
 * Aliases resolve to the same adapter instance.
 */
function registerAdapter(adapter: LLMAdapter, aliases: string[] = []) {
  // Canonical
  modelRegistry[adapter.id] = adapter
  // Aliases
  for (const alias of aliases) {
    if (!alias) continue
    modelRegistry[alias] = adapter
  }
}

// ---------- Register all adapters + aliases ----------

// Cloud model - GPT-4.1 Nano (sole cloud model, excellent context understanding)
registerAdapter(gpt41NanoAdapter, [
  'gpt-4.1-nano', // exact match
  'gpt-4-nano',   // short alias
])

// Local model - Phi3 Mini (fast local inference)
registerAdapter(phi3MiniAdapter, [
  'phi3',      // short alias
  'phi-3',     // alternative format
])

/**
 * Get adapter by ID (supports canonical ids and aliases).
 */
export function getModelAdapter(id: string): LLMAdapter | undefined {
  if (!id) return undefined
  const key = typeof id === 'string' ? id.trim() : id
  return modelRegistry[key]
}

/**
 * List all registered adapters, **unique by canonical adapter.id** and **sorted**.
 * This avoids duplicates from alias entries.
 */
export function listModelAdapters(): LLMAdapter[] {
  const seen = new Set<string>()
  const unique: LLMAdapter[] = []

  for (const adapter of Object.values(modelRegistry)) {
    if (!adapter?.id) continue
    if (seen.has(adapter.id)) continue
    seen.add(adapter.id)
    unique.push(adapter)
  }

  // Ensure stable, deterministic ordering in APIs/UI
  unique.sort((a, b) => {
    const ta = a.type || ''
    const tb = b.type || ''
    if (ta !== tb) return ta < tb ? -1 : 1
    if (a.name !== b.name) return a.name < b.name ? -1 : 1
    return a.id < b.id ? -1 : 1
  })

  return unique
}
