import type { LLMAdapter } from '../types/models'

// Re-export LLMAdapter for adapters to import
export type { LLMAdapter }

// The registry storing all adapters by lookup key (canonical IDs and aliases)
const modelRegistry: Record<string, LLMAdapter> = Object.create(null)

// ---------- Adapters ----------
import { 
  gpt41MiniAdapter, 
  gpt41NanoAdapter,
  gpt5MiniAdapter,
  gpt5NanoAdapter
} from './adapters/openai'
import { claudeAdapter } from './adapters/claudeAdapter'
import { qwen25CoderAdapter } from './adapters/qwen25CoderAdapter'
import { phi3MiniAdapter } from './adapters/phi3MiniAdapter'
import { neuralChatAdapter } from './adapters/neuralChatAdapter'

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

// OpenAI (primary implementations)
registerAdapter(gpt41MiniAdapter)
registerAdapter(gpt41NanoAdapter)

// GPT-5 models with Responses API
registerAdapter(gpt5MiniAdapter, [
  'gpt5-mini', // alternative format
])
registerAdapter(gpt5NanoAdapter, [
  'gpt5-nano', // alternative format
])

// Non-OpenAI
registerAdapter(claudeAdapter, [
  'claude-opus-4.1', // exact match
  'claude-opus',      // short alias
  'claude-4-sonnet',  // legacy alias for backward compatibility
  'claude-sonnet',    // legacy short alias
]) // 'claude-opus-4.1'

// Local models
registerAdapter(qwen25CoderAdapter, [
  'qwen25-coder',
  'qwen25', // short alias (now points to coder variant)
  'qwen', // even shorter alias
])
registerAdapter(phi3MiniAdapter, [
  'phi3',      // short alias
  'phi-3',     // alternative format
])
registerAdapter(neuralChatAdapter, [
  'neural-chat',  // alternative format
  'neuralchat',   // no hyphen version
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
