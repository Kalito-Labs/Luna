// routes/sessionRouter.ts
// Sessions API (only persist when explicitly saved)
// Mount path: /api/sessions

import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { db } from '../db/db'
import { okItem, okList, err } from '../utils/apiContract'
import { handleRouterError } from '../utils/routerHelpers'
import { logError, logInfo } from '../utils/logger'
import { asyncHandler } from '../middleware/errorMiddleware'
import { generalRateLimit } from '../middleware/security'
import { MemoryManager } from '../logic/memoryManager'

const router = Router()
const memory = new MemoryManager()

// Apply general rate limit (skip in tests if you prefer)
if (process.env.NODE_ENV !== 'test') {
  router.use(generalRateLimit)
}

/* ----------------------------------------------------------------------------
 * Schemas
 * -------------------------------------------------------------------------- */
const saveSessionSchema = z.object({
  sessionId: z.string().min(1),
  name: z.string().optional(),
  model: z.string().optional(),
  persona_id: z.string().optional(),
  // Provide a recap to bypass AI summary (optional)
  recap: z.string().optional(),
  // Allow saving an empty session explicitly (false by default)
  allowEmpty: z.boolean().optional(),
})

/* ----------------------------------------------------------------------------
 * Utilities
 * -------------------------------------------------------------------------- */
function nowISO() {
  return new Date().toISOString()
}

function getSessionById(id: string) {
  return db
    .prepare(
      `SELECT id, name, model, recap, persona_id, created_at, updated_at, saved
       FROM sessions WHERE id = ?`
    )
    .get(id) as
    | {
        id: string
        name: string | null
        model: string | null
        recap: string | null
        persona_id: string | null
        created_at: string | null
        updated_at: string | null
        saved: number | null
      }
    | undefined
}

function listSavedSessions() {
  return db
    .prepare(
      `SELECT id, name, model, recap, persona_id, created_at, updated_at, saved
       FROM sessions
       WHERE saved = 1
       ORDER BY COALESCE(updated_at, created_at) DESC`
    )
    .all()
}

/**
 * Build a concise recap using the MemoryManager if caller didn't provide one.
 * Uses all messages in the session (bounded by DB content) to make a single summary,
 * then stores the summary to conversation_summaries and returns its text for the recap.
 */
async function buildRecapWithAI(sessionId: string): Promise<string> {
  // Pull min/max message id and count; fall back to short preview if no messages
  const meta = db
    .prepare(
      `SELECT MIN(id) AS startId, MAX(id) AS endId, COUNT(*) AS count
       FROM messages
       WHERE session_id = ?`
    )
    .get(sessionId) as { startId: number | null; endId: number | null; count: number }

  if (!meta?.count || !meta.startId || !meta.endId) {
    // No messages — return a default recap
    return 'Empty session'
  }

  // Create and persist a summary via MemoryManager, reuse it as recap
  const summary = await memory.createSummary({
    session_id: sessionId,
    start_message_id: String(meta.startId),
    end_message_id: String(meta.endId),
    message_count: meta.count,
  })

  // Trim recap to a friendly length for UI preview (keep full summary in summaries table)
  const recap =
    summary.summary.length > 500 ? summary.summary.slice(0, 500).trimEnd() + '…' : summary.summary

  return recap
}

/* ----------------------------------------------------------------------------
 * GET /api/sessions
 * List only saved sessions (saved = 1), newest first
 * -------------------------------------------------------------------------- */
router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    try {
      const sessions = listSavedSessions()
      return okList(res, sessions)
    } catch (error) {
      return handleRouterError(res, error, 'list sessions')
    }
  })
)

/* ----------------------------------------------------------------------------
 * GET /api/sessions/:id
 * Fetch a single session (saved or not) — useful when loading UI state
 * -------------------------------------------------------------------------- */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    if (!id) return err(res, 400, 'VALIDATION_ERROR', 'Missing session id')

    try {
      const session = getSessionById(id)
      if (!session) return err(res, 404, 'NOT_FOUND', 'Session not found')
      return okItem(res, session)
    } catch (error) {
      return handleRouterError(res, error, 'get session', { id })
    }
  })
)

/* ----------------------------------------------------------------------------
 * GET /api/sessions/:id/messages
 * Convenience endpoint for loading messages (SessionSidebar → ChatPanel)
 * -------------------------------------------------------------------------- */
router.get(
  '/:id/messages',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    if (!id) return err(res, 400, 'VALIDATION_ERROR', 'Missing session id')

    try {
      const rows = db
        .prepare(
          `SELECT id, session_id, role, text, model_id, token_usage, importance_score, created_at
           FROM messages
           WHERE session_id = ?
           ORDER BY created_at ASC`
        )
        .all(id)
      return okList(res, rows)
    } catch (error) {
      return handleRouterError(res, error, 'get messages', { id })
    }
  })
)

/* ----------------------------------------------------------------------------
 * POST /api/sessions/save
 * Mark a session as saved (create/update row + recap)
 * Body: { sessionId, name?, model?, persona_id?, recap?, allowEmpty? }
 * -------------------------------------------------------------------------- */
router.post(
  '/save',
  asyncHandler(async (req: Request, res: Response) => {
    // Validate input
    const parse = saveSessionSchema.safeParse(req.body)
    if (!parse.success) {
      return err(res, 400, 'VALIDATION_ERROR', parse.error.flatten().formErrors.join('; '))
    }
    const { sessionId, name, model, persona_id, recap: providedRecap, allowEmpty } = parse.data

    // Ensure there are messages unless allowEmpty=true
    const messageCount = (
      db
        .prepare(`SELECT COUNT(*) as c FROM messages WHERE session_id = ?`)
        .get(sessionId) as { c: number }
    )?.c

    if (!allowEmpty && (!messageCount || messageCount === 0)) {
      return err(res, 400, 'VALIDATION_ERROR', 'Cannot save an empty session (no messages)')
    }

    // Build recap if not provided
    let recap = providedRecap
    try {
      if (!recap) {
        recap = await buildRecapWithAI(sessionId)
      }
    } catch (summaryErr) {
      // If the AI summary fails, fall back to last assistant reply snippet
      logError('AI recap failed, falling back to last assistant message', summaryErr as Error, {
        sessionId,
      })
      const lastAssistant = db
        .prepare(
          `SELECT text FROM messages
           WHERE session_id = ? AND role = 'assistant'
           ORDER BY created_at DESC
           LIMIT 1`
        )
        .get(sessionId) as { text?: string } | undefined
      const fallback = lastAssistant?.text || 'Conversation saved'
      recap = fallback.length > 500 ? fallback.slice(0, 500).trimEnd() + '…' : fallback
    }

    // Upsert session row and set saved=1
    const existing = getSessionById(sessionId)
    const timestamp = nowISO()
    const finalName =
      (typeof name === 'string' && name.trim()) ||
      existing?.name ||
      'Untitled Chat' // UI-friendly default

    try {
      if (existing) {
        db.prepare(
          `UPDATE sessions
             SET name = COALESCE(?, name),
                 model = COALESCE(?, model),
                 persona_id = COALESCE(?, persona_id),
                 recap = ?,
                 saved = 1,
                 updated_at = ?
           WHERE id = ?`
        ).run(finalName, model ?? null, persona_id ?? null, recap, timestamp, sessionId)
      } else {
        db.prepare(
          `INSERT INTO sessions (id, name, model, recap, persona_id, created_at, updated_at, saved)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1)`
        ).run(sessionId, finalName, model ?? null, recap, persona_id ?? null, timestamp, timestamp)
      }

      const savedSession = getSessionById(sessionId)
      logInfo('Session saved', { sessionId, name: savedSession?.name, messages: messageCount })
      return okItem(res, savedSession)
    } catch (error) {
      return handleRouterError(res, error, 'save session', { sessionId })
    }
  })
)

/* ----------------------------------------------------------------------------
 * DELETE /api/sessions/:id
 * Delete a session and all its data (messages, summaries, pins, doc usage)
 * NOTE: messages has no FK; must delete explicitly.
 * -------------------------------------------------------------------------- */
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    if (!id) return err(res, 400, 'VALIDATION_ERROR', 'Missing session id')

    try {
      const exists = getSessionById(id)
      if (!exists) return err(res, 404, 'NOT_FOUND', 'Session not found')

      const trx = db.transaction(() => {
        // Delete messages (no foreign key constraint)
        db.prepare(`DELETE FROM messages WHERE session_id = ?`).run(id)
        
        // Delete from conversation_summaries and semantic_pins if they exist
        try {
          db.prepare(`DELETE FROM conversation_summaries WHERE session_id = ?`).run(id)
        } catch (err) {
          // Table might not exist or have a different schema, continue anyway
        }
        
        try {
          db.prepare(`DELETE FROM semantic_pins WHERE session_id = ?`).run(id)
        } catch (err) {
          // Table might not exist or have a different schema, continue anyway
        }
        
        // Finally delete the session itself
        db.prepare(`DELETE FROM sessions WHERE id = ?`).run(id)
      })
      trx()

      logInfo('Session deleted', { sessionId: id })
      return okItem(res, { id, deleted: true })
    } catch (error) {
      return handleRouterError(res, error, 'delete session', { id })
    }
  })
)

/* ----------------------------------------------------------------------------
 * POST /api/sessions/cleanup-orphans
 * OPTIONAL: backfill messages with invalid/NULL session_id into a placeholder.
 * Useful once during migration; safe to keep behind an env flag if desired.
 * -------------------------------------------------------------------------- */
router.post(
  '/cleanup-orphans',
  asyncHandler(async (_req: Request, res: Response) => {
    try {
      const orphanCount = (
        db
          .prepare(
            `SELECT COUNT(*) as c FROM messages
             WHERE session_id IS NULL
                OR session_id NOT IN (SELECT id FROM sessions)`
          )
          .get() as { c: number }
      ).c

      if (orphanCount === 0) {
        return okItem(res, { updated: 0, note: 'No orphan messages found' })
      }

      const ts = nowISO()
      db.prepare(
        `INSERT INTO sessions (id, name, model, recap, persona_id, created_at, updated_at, saved)
         SELECT 'orphan-cleanup', 'Orphaned Messages', 'unknown',
                'Backfilled orphaned messages', NULL, ?, ?, 0
         WHERE NOT EXISTS (SELECT 1 FROM sessions WHERE id = 'orphan-cleanup')`
      ).run(ts, ts)

      const updated = db
        .prepare(
          `UPDATE messages
           SET session_id = 'orphan-cleanup'
           WHERE session_id IS NULL
              OR session_id NOT IN (SELECT id FROM sessions)`
        )
        .run().changes

      logInfo('Orphan cleanup complete', { updated })
      return okItem(res, { updated })
    } catch (error) {
      return handleRouterError(res, error, 'cleanup orphans')
    }
  })
)

export default router
