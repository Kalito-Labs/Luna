// routes/agentRouter.ts
// Express router for /api/agent endpoints: chat + models
// Sessions are managed via /api/sessions (save-only policy)

import express from 'express'
import type { Request, Response } from 'express'
import { runAgent, runAgentStream } from '../logic/agentService'
import { db } from '../db/db'
import { listModelAdapters } from '../logic/modelRegistry'
import { MemoryManager } from '../logic/memoryManager'

// Security and validation
import { agentRateLimit } from '../middleware/security'
import { validateBody, agentRequestSchema } from '../middleware/validation'
import { asyncHandler } from '../middleware/errorMiddleware'

// API helpers + logging
import { okItem, okList, err } from '../utils/apiContract'
import { handleRouterError } from '../utils/routerHelpers'
import { logError, logInfo } from '../utils/logger'

const agentRouter = express.Router()
const memoryManager = new MemoryManager()

// Rate limiting (disabled in tests)
if (process.env.NODE_ENV !== 'test') {
  agentRouter.use(agentRateLimit)
}

/* ----------------------------- SSE helpers ----------------------------- */

function setSSEHeaders(res: Response) {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  // Prevent proxy buffering
  res.setHeader('X-Accel-Buffering', 'no')
  ;(res as any).flushHeaders?.()
}

function sseSend(res: Response, data: unknown) {
  res.write(`data: ${JSON.stringify(data)}\n\n`)
}

/* ----------------------- Transient session helpers ---------------------- */

/**
 * Ensure a persistent session row exists (saved = 1).
 * Auto-save model: all sessions are immediately persistent and appear in sidebar.
 */
function ensurePersistentSession(sessionId: string, modelId?: string) {
  const now = new Date().toISOString()
  const existing = db
    .prepare(`SELECT id FROM sessions WHERE id = ?`)
    .get(sessionId) as { id: string } | undefined

  if (!existing) {
    db.prepare(
      `INSERT INTO sessions (id, name, model, recap, persona_id, created_at, updated_at, saved)
       VALUES (?, ?, ?, NULL, NULL, ?, ?, 1)`
    ).run(sessionId, 'New Chat', modelId ?? null, now, now)
  } else {
    db.prepare(`UPDATE sessions SET updated_at = ? WHERE id = ?`).run(now, sessionId)
  }
}

/* ---------------------------------------------------------------------- */
/* POST /api/agent  — Standard chat endpoint (classic or streaming)       */
/* ---------------------------------------------------------------------- */

agentRouter.post(
  '/',
  validateBody(agentRequestSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const {
      input,
      sessionId,
      systemPrompt = '',
      modelName,
      settings = {},
      fileIds = [],
      stream = false,
      personaId,
    } = req.body

    logInfo('Agent request received', {
      sessionId,
      modelName,
      stream,
      personaId,
      hasSystemPrompt: !!systemPrompt,
      inputLength: input?.length ?? 0,
      ip: req.ip,
    })

    // Validate model name
    if (!modelName || typeof modelName !== 'string') {
      return err(res, 400, 'VALIDATION_ERROR', 'Invalid or missing model name')
    }

    // Use or generate a session id (transient until explicitly saved)
    const usedSessionId =
      typeof sessionId === 'string' && sessionId.length > 0 ? sessionId : Date.now().toString()

    // Make sure a transient session row exists and bump updated_at
    try {
      ensurePersistentSession(usedSessionId, modelName)
    } catch (e) {
      logError('Failed to ensure transient session', e as Error, { sessionId: usedSessionId })
      return err(res, 500, 'INTERNAL', 'Failed to initialize session')
    }

    // Save the user message with intelligent importance scoring
    try {
      const userMessage = {
        id: 0,
        session_id: usedSessionId,
        role: 'user' as const,
        text: String(input ?? '').trim(),
        model_id: modelName,
        token_usage: 0,
        created_at: new Date().toISOString(),
        importance_score: 0.5,
      }

      const importanceScore = memoryManager.scoreMessageImportance(userMessage)

      db.prepare(
        `
        INSERT INTO messages (session_id, role, text, model_id, importance_score, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `
      ).run(
        usedSessionId,
        'user',
        String(input ?? '').trim(),
        modelName,
        importanceScore,
        new Date().toISOString()
      )

      // touch session.updated_at
      db.prepare(`UPDATE sessions SET updated_at = ? WHERE id = ?`).run(
        new Date().toISOString(),
        usedSessionId
      )
    } catch (saveErr) {
      logError('Failed to save user message', saveErr as Error, { sessionId: usedSessionId })
      return err(res, 500, 'INTERNAL', 'Failed to save message to database')
    }

    /* ------------------------- Streaming branch (SSE) ------------------------- */
    if (stream) {
      setSSEHeaders(res)

      const heartbeat = setInterval(() => {
        try {
          res.write(': keep-alive\n\n')
        } catch {
          // ignore write errors; cleanup happens below
        }
      }, 20000)

      try {
        let agentReply = ''
        let totalTokens: number | undefined

        for await (const chunk of runAgentStream({
          input,
          systemPrompt,
          modelName,
          // enforce model authority: modelName wins
          settings: { ...settings, model: modelName },
          fileIds,
          sessionId: usedSessionId,
          personaId,
        })) {
          if (chunk.delta) {
            agentReply += chunk.delta
            sseSend(res, { delta: chunk.delta })
          }
          if (typeof chunk.tokenUsage === 'number') {
            totalTokens = chunk.tokenUsage
            sseSend(res, { tokenUsage: totalTokens })
          }
          if (chunk.done) {
            // persist assistant message
            try {
              const assistantMessage = {
                id: 0,
                session_id: usedSessionId,
                role: 'assistant' as const,
                text: agentReply,
                model_id: modelName,
                token_usage: totalTokens || 0,
                created_at: new Date().toISOString(),
                importance_score: 0.6, // placeholder before scoring
              }
              const importanceScore = memoryManager.scoreMessageImportance(assistantMessage)

              db.prepare(
                `
                INSERT INTO messages (session_id, role, text, model_id, token_usage, importance_score, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
              `
              ).run(
                usedSessionId,
                'assistant',
                agentReply,
                modelName,
                totalTokens || 0,
                importanceScore,
                new Date().toISOString()
              )

              // touch session.updated_at
              db.prepare(`UPDATE sessions SET updated_at = ? WHERE id = ?`).run(
                new Date().toISOString(),
                usedSessionId
              )

              // Fire-and-forget summarization if needed (kept as-is; summaries are fine for saved/unsaved)
              setTimeout(async () => {
                try {
                  if (memoryManager.needsSummarization(usedSessionId)) {
                    await memoryManager.autoSummarizeSession(usedSessionId)
                  }
                } catch (autoErr) {
                  logError('Auto-summarization failed', autoErr as Error, { sessionId: usedSessionId })
                }
              }, 0)
            } catch (saveErr) {
              logError('Failed to save agent message', saveErr as Error, { sessionId: usedSessionId })
            }

            sseSend(res, { done: true, tokenUsage: totalTokens || 0 })
          }
        }
        res.end()
      } catch (error) {
        logError('Streaming error', error as Error, { sessionId: usedSessionId, modelName })
        // Send error message in SSE format instead of throwing
        const message = (error as Error)?.message || 'Unknown streaming error'
        sseSend(res, { error: { code: 'INTERNAL', message: `AI Model: ${message}` }, done: true })
        res.end()
        return
      } finally {
        clearInterval(heartbeat)
      }
      return
    }

    /* --------------------------- Non-streaming branch -------------------------- */
    try {
      const result = await runAgent({
        input,
        systemPrompt,
        modelName,
        // enforce model authority: modelName wins
        settings: { ...settings, model: modelName },
        fileIds,
        sessionId: usedSessionId,
        personaId,
      })

      // Save assistant message
      try {
        const assistantMessage = {
          id: 0,
          session_id: usedSessionId,
          role: 'assistant' as const,
          text: result.reply,
          model_id: modelName,
          token_usage: result.tokenUsage || 0,
          created_at: new Date().toISOString(),
          importance_score: 0.6, // placeholder before scoring
        }

        const importanceScore = memoryManager.scoreMessageImportance(assistantMessage)

        db.prepare(
          `
          INSERT INTO messages (session_id, role, text, model_id, token_usage, importance_score, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `
        ).run(
          usedSessionId,
          'assistant',
          result.reply,
          modelName,
          result.tokenUsage || 0,
          importanceScore,
          new Date().toISOString()
        )

        // touch session.updated_at
        db.prepare(`UPDATE sessions SET updated_at = ? WHERE id = ?`).run(
          new Date().toISOString(),
          usedSessionId
        )

        // Fire-and-forget summarization if needed (same as streaming branch)
        setTimeout(async () => {
          try {
            if (memoryManager.needsSummarization(usedSessionId)) {
              const summary = await memoryManager.autoSummarizeSession(usedSessionId)
              // Update session recap if we generated a new summary
              if (summary) {
                db.prepare(`UPDATE sessions SET recap = ? WHERE id = ?`).run(summary.summary, usedSessionId)
              }
            }
          } catch (autoErr) {
            logError('Auto-summarization failed', autoErr as Error, { sessionId: usedSessionId })
          }
        }, 0)
      } catch (saveErr) {
        logError('Failed to save agent message', saveErr as Error, { sessionId: usedSessionId })
      }

      logInfo('Agent response sent', {
        sessionId: usedSessionId,
        tokenUsage: result.tokenUsage,
        replyLength: result.reply?.length ?? 0,
      })

      return okItem(res, {
        reply: typeof result.reply === 'string' ? result.reply : '[No response]',
        tokenUsage: typeof result.tokenUsage === 'number' ? result.tokenUsage : 0,
      })
    } catch (error) {
      logError('Agent processing error', error as Error, { sessionId: usedSessionId })
      return handleRouterError(res, error, 'run agent')
    }
  })
)

/* ---------------------------------------------------------------------- */
/* GET /api/agent/models — List available model adapters                  */
/* ---------------------------------------------------------------------- */

agentRouter.get(
  '/models',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const models = listModelAdapters().map(({ id, name, type }) => ({
        id,
        name,
        type,
      }))

      logInfo('Models list requested', { count: models.length, ip: req.ip })
      return okList(res, models)
    } catch (error) {
      logError('Failed to list models', error as Error)
      return handleRouterError(res, error, 'list models')
    }
  })
)

/* ---------------------------------------------------------------------- */
/* NOTE: session + messages endpoints have moved to /api/sessions         */
/*  - GET /api/sessions                    (list saved only)              */
/*  - POST /api/sessions/save              (save with recap)              */
/*  - GET  /api/sessions/:id               (one session)                  */
/*  - GET  /api/sessions/:id/messages      (thread)                       */
/*  - DELETE /api/sessions/:id             (delete)                       */
/* ---------------------------------------------------------------------- */

export default agentRouter
