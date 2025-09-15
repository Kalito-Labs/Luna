// Memory Manager - Core Hybrid Memory System
// Implements rolling buffer, summarization, and semantic pin management

import { db } from '../db/db'
import { runAgent } from './agentService'
import { getModelAdapter } from './modelRegistry'
import type {
  ConversationSummary,
  SemanticPin,
  MessageWithImportance,
  MemoryContext,
  CreateSummaryRequest,
  CreatePinRequest,
} from '../types/memory'

export class MemoryManager {
  private readonly DEFAULT_CONTEXT_LIMIT = 10
  private readonly DEFAULT_TOKEN_LIMIT = 3000
  private readonly SUMMARY_THRESHOLD = 15 // Messages before auto-summarization

  // Query result caching for performance optimization
  private messageCountCache = new Map<string, { count: number; timestamp: number }>()
  private recentMessagesCache = new Map<
    string,
    { messages: MessageWithImportance[]; timestamp: number }
  >()
  private readonly CACHE_TTL = 5000 // 5 seconds cache TTL

  /**
   * Get the model used by a session (for intelligent summarization)
   */
  private getSessionModel(sessionId: string): string | null {
    try {
      const query = `SELECT model FROM sessions WHERE id = ?`
      const result = db.prepare(query).get(sessionId) as { model: string | null } | undefined
      return result?.model || null
    } catch (error) {
      console.error('Error getting session model:', error)
      return null
    }
  }

  /**
   * Check if a model is local or cloud-based
   */
  private isLocalModel(modelId: string): boolean {
    try {
      const adapter = getModelAdapter(modelId)
      return adapter?.type === 'local'
    } catch (error) {
      console.error('Error checking model type:', error)
      return false // Default to cloud behavior for safety
    }
  }

  /**
   * Get the best available model for summarization
   * Prefers session model if it's local, falls back to gpt-4.1-mini for cloud consistency
   */
  private getSummarizationModel(sessionId: string): string {
    const sessionModel = this.getSessionModel(sessionId)
    
    if (sessionModel && this.isLocalModel(sessionModel)) {
      // Use local model for offline capability
      return sessionModel
    }
    
    // Fallback to cloud model for consistency (existing behavior)
    return 'gpt-4.1-mini'
  }

  /**
   * Build smart context for AI conversation including:
   * - Recent messages (last 5-8)
   * - Top semantic pins (3-5)
   * - Recent summaries (2-3)
   */
  async buildContext(
    sessionId: string,
    maxTokens: number = this.DEFAULT_TOKEN_LIMIT
  ): Promise<MemoryContext> {
    try {
      // Get recent messages with importance scores
      const recentMessages = this.getRecentMessages(sessionId, 8)

      // Get top semantic pins for this session
      const semanticPins = this.getTopSemanticPins(sessionId, 5)

      // Get recent conversation summaries
      const summaries = this.getRecentSummaries(sessionId, 3)

      // Calculate total tokens (rough estimation)
      const totalTokens = this.estimateTokens(recentMessages, semanticPins, summaries)

      // If over token limit, implement smart truncation
      if (totalTokens > maxTokens) {
        return this.truncateContext(recentMessages, semanticPins, summaries, maxTokens)
      }

      return {
        recentMessages,
        semanticPins,
        summaries,
        totalTokens,
      }
    } catch (error) {
      console.error('MemoryManager.buildContext error:', error)
      // Fallback to basic recent messages
      return {
        recentMessages: this.getRecentMessages(sessionId, this.DEFAULT_CONTEXT_LIMIT),
        semanticPins: [],
        summaries: [],
        totalTokens: 0,
      }
    }
  }

  /**
   * Get recent messages with importance scores (cached for performance)
   * NOTE: OFFSET 1 excludes the newest row (current user input) to avoid echoing it.
   */
  private getRecentMessages(sessionId: string, limit: number): MessageWithImportance[] {
    // Check cache first
    const cacheKey = `${sessionId}:${limit}`
    const cached = this.recentMessagesCache.get(cacheKey)
    const now = Date.now()

    if (cached && now - cached.timestamp < this.CACHE_TTL) {
      return cached.messages
    }

    const query = `
      SELECT * FROM (
        SELECT id, session_id, role, text, model_id, token_usage, created_at, importance_score
        FROM messages
        WHERE session_id = ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET 1
      ) ORDER BY created_at ASC
    `

    const messages = db.prepare(query).all(sessionId, limit) as MessageWithImportance[]

    // Cache the result
    this.recentMessagesCache.set(cacheKey, { messages, timestamp: now })

    return messages
  }

  /**
   * Get top semantic pins by importance score
   */
  private getTopSemanticPins(sessionId: string, limit: number): SemanticPin[] {
    const query = `
      SELECT * FROM semantic_pins
      WHERE session_id = ?
      ORDER BY importance_score DESC, created_at DESC
      LIMIT ?
    `

    return db.prepare(query).all(sessionId, limit) as SemanticPin[]
  }

  /**
   * Get recent conversation summaries
   */
  private getRecentSummaries(sessionId: string, limit: number): ConversationSummary[] {
    const query = `
      SELECT * FROM conversation_summaries
      WHERE session_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `

    return db.prepare(query).all(sessionId, limit) as ConversationSummary[]
  }

  /**
   * Invalidate cache when new messages are added (public method)
   */
  public invalidateSessionCache(sessionId: string): void {
    this.invalidateCache(sessionId)
  }

  /**
   * Invalidate cache when new messages are added
   */
  private invalidateCache(sessionId: string): void {
    // Clear message count cache for this session
    this.messageCountCache.delete(sessionId)

    // Clear recent messages cache for this session (all limits)
    for (const key of this.recentMessagesCache.keys()) {
      if (key.startsWith(`${sessionId}:`)) {
        this.recentMessagesCache.delete(key)
      }
    }
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now()

    // Clean message count cache
    for (const [key, value] of this.messageCountCache.entries()) {
      if (now - value.timestamp >= this.CACHE_TTL) {
        this.messageCountCache.delete(key)
      }
    }

    // Clean recent messages cache
    for (const [key, value] of this.recentMessagesCache.entries()) {
      if (now - value.timestamp >= this.CACHE_TTL) {
        this.recentMessagesCache.delete(key)
      }
    }
  }

  /**
   * Score message importance based on content and context
   */
  scoreMessageImportance(message: MessageWithImportance): number {
    let score = 0.5 // Base score

    const text = message.text.toLowerCase()

    // Higher importance for questions
    if (
      text.includes('?') ||
      text.startsWith('what') ||
      text.startsWith('how') ||
      text.startsWith('why')
    ) {
      score += 0.2
    }

    // Higher importance for code blocks or technical content
    if (text.includes('```') || text.includes('function') || text.includes('class')) {
      score += 0.15
    }

    // Higher importance for error messages or issues
    if (text.includes('error') || text.includes('problem') || text.includes('issue')) {
      score += 0.1
    }

    // Higher importance for longer messages (more content)
    if (text.length > 200) {
      score += 0.1
    }

    // Higher importance for assistant responses (they contain answers)
    if (message.role === 'assistant') {
      score += 0.05
    }

    // Cap at 1.0
    return Math.min(score, 1.0)
  }

  /**
   * Update message importance score in database
   */
  updateMessageImportance(messageId: number, importanceScore: number): void {
    const query = `UPDATE messages SET importance_score = ? WHERE id = ?`
    db.prepare(query).run(importanceScore, messageId)
  }

  /**
   * Create a conversation summary from a range of messages
   */
  async createSummary(request: CreateSummaryRequest): Promise<ConversationSummary> {
    // Get messages in range
    const messages = this.getMessagesInRange(
      request.session_id,
      request.start_message_id,
      request.end_message_id
    )

    // Generate summary using AI with session-aware model selection
    const summary = await this.generateAISummary(messages, request.session_id)

    // Create summary record
    const summaryId = `summary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const summaryRecord: ConversationSummary = {
      id: summaryId,
      session_id: request.session_id,
      summary,
      message_count: request.message_count,
      start_message_id: request.start_message_id,
      end_message_id: request.end_message_id,
      importance_score: 0.7, // Summaries are generally important
      created_at: new Date().toISOString(),
    }

    // Store in database
    this.storeSummary(summaryRecord)

    return summaryRecord
  }

  /**
   * Create a semantic pin
   */
  createSemanticPin(request: CreatePinRequest): SemanticPin {
    const pinId = `pin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const pin: SemanticPin = {
      id: pinId,
      session_id: request.session_id,
      content: request.content,
      source_message_id: request.source_message_id,
      importance_score: request.importance_score || 0.8,
      pin_type: request.pin_type || 'manual',
      created_at: new Date().toISOString(),
    }

    this.storeSemanticPin(pin)
    return pin
  }

  /**
   * Check if conversation needs summarization
   */
  needsSummarization(sessionId: string): boolean {
    const messageCount = this.getSessionMessageCount(sessionId)
    const lastSummary = this.getLastSummary(sessionId)

    if (!lastSummary) {
      return messageCount >= this.SUMMARY_THRESHOLD
    }

    // Check messages since last summary
    const messagesSinceLastSummary = this.getMessageCountSince(sessionId, lastSummary.created_at)
    return messagesSinceLastSummary >= this.SUMMARY_THRESHOLD
  }

  /**
   * Automatically summarize session if needed
   */
  async autoSummarizeSession(sessionId: string): Promise<ConversationSummary | null> {
    try {
      const lastSummary = this.getLastSummary(sessionId)

      if (!lastSummary) {
        // No previous summary - get messages from the beginning
        const allMessages = this.getAllMessagesForSession(sessionId)
        if (allMessages.length < this.SUMMARY_THRESHOLD) {
          return null // Not enough messages yet
        }

        // Take the first 15 messages for initial summary
        const messagesToSummarize = allMessages.slice(0, this.SUMMARY_THRESHOLD)
        const firstMessageId = messagesToSummarize[0].id.toString()
        const lastMessageId = messagesToSummarize[messagesToSummarize.length - 1].id.toString()

        return await this.createSummary({
          session_id: sessionId,
          start_message_id: firstMessageId,
          end_message_id: lastMessageId,
          message_count: messagesToSummarize.length,
        })
      } else {
        // Summarize messages since last summary
        const messagesSinceLastSummary = this.getMessagesSinceLastSummary(
          sessionId,
          lastSummary.created_at
        )
        if (messagesSinceLastSummary.length < this.SUMMARY_THRESHOLD) {
          return null // Not enough new messages
        }

        const startMessageId = messagesSinceLastSummary[0].id.toString()
        const endMessageId = messagesSinceLastSummary[messagesSinceLastSummary.length - 1].id.toString()

        return await this.createSummary({
          session_id: sessionId,
          start_message_id: startMessageId,
          end_message_id: endMessageId,
          message_count: messagesSinceLastSummary.length,
        })
      }
    } catch (error) {
      console.error('autoSummarizeSession error:', error)
      return null
    }
  }

  // ---------- Private helper methods ----------

  private getMessagesInRange(
    sessionId: string,
    startId: string,
    endId: string
  ): MessageWithImportance[] {
    const query = `
      SELECT * FROM messages
      WHERE session_id = ?
      AND id BETWEEN ? AND ?
      ORDER BY created_at ASC
    `
    return db.prepare(query).all(sessionId, startId, endId) as MessageWithImportance[]
  }

  private async generateAISummary(messages: MessageWithImportance[], sessionId: string): Promise<string> {
    if (messages.length === 0) {
      return 'No messages to summarize'
    }

    try {
      // Get the best model for summarization (session model if local, cloud fallback)
      const modelToUse = this.getSummarizationModel(sessionId)
      const isLocal = this.isLocalModel(modelToUse)

      // Prepare conversation text for summarization
      const conversationText = messages.map(msg => `${msg.role}: ${msg.text}`).join('\n')

      // Enhanced prompts - especially improved for local models
      const systemPrompt = isLocal 
        ? `TASK: Create a brief summary of the conversation below. Focus ONLY on what was discussed, not generating new content.

FORMAT: 1-2 sentences describing the key topics and outcomes.
EXAMPLE: "User asked about poetry types, discussed sonnets and free verse, then collaborated on writing original poems with simple themes."

DO NOT: Create new poems, stories, or content. Only summarize what was already discussed.`
        : `You are a conversation summarizer. Create a concise summary of the following conversation that preserves:
1. Key topics discussed
2. Important decisions made
3. Facts or information shared
4. Current context/state

Keep the summary under 200 words and focus on what's most relevant for continuing the conversation.`

      const input = isLocal 
        ? `Conversation to summarize:\n${conversationText}\n\nProvide only the summary:`
        : `Please summarize this conversation:\n\n${conversationText}`

      // Use session-aware model selection
      const result = await runAgent({
        modelName: modelToUse,
        input,
        systemPrompt,
        settings: {
          model: modelToUse,
          temperature: 0.1,      // Even lower temperature for local models to reduce creativity
          maxTokens: isLocal ? 100 : 300, // Stricter token limit for local models
        },
        sessionId, // Pass session context
      })

      const summary = result.reply.trim()

      // Validate summary doesn't contain generated content (especially for local models)
      if (isLocal && this.isInvalidSummary(summary, messages)) {
        console.warn(`🚨 Local model generated content instead of summary: "${summary.substring(0, 100)}..."`)
        return this.createFallbackSummary(messages)
      }

      return summary
    } catch (error) {
      console.error('Error generating AI summary:', error)
      
      // Enhanced fallback logic
      const messageCount = messages.length
      const firstMessage = messages[0]?.text.substring(0, 50) || 'N/A'
      const lastMessage = messages[messages.length - 1]?.text.substring(0, 50) || 'N/A'
      
      // Check if this is likely a network error (for offline scenarios)
      const errorMessage = String(error)
      const isNetworkError = errorMessage.includes('ECONNREFUSED') || 
                            errorMessage.includes('ENOTFOUND') || 
                            errorMessage.includes('ETIMEDOUT') ||
                            errorMessage.includes('fetch failed')

      if (isNetworkError) {
        return `📱 Offline summary: ${messageCount} messages. Started: "${firstMessage}..." Recent: "${lastMessage}..."`
      }

      return this.createFallbackSummary(messages)
    }
  }

  /**
   * Validate that AI summary is actually a summary and not generated content
   * Particularly important for local models that may generate poems/stories
   */
  private isInvalidSummary(summary: string, originalMessages: MessageWithImportance[]): boolean {
    // Check for common invalid patterns that indicate content generation
    const invalidPatterns = [
      /^(Here's|Certainly|Let me|I'll create|I can)/i,  // AI response starters
      /```/,                                            // Code blocks
      /^Title:/i,                                       // Poem/story titles
      /^In fields where|^Once upon|^There was/i,        // Story/poem beginnings
      /\*\*[A-Z][^*]+\*\*/,                            // Markdown headings (titles)
      /^Chapter|^Scene|^Act [IVX]+/i,                  // Story structure
      /^\d+\./,                                         // Numbered lists (often creative content)
      /^[A-Z][a-z]+ [A-Z][a-z]+:$/m,                   // Character names with colons
    ]
    
    // Check if summary is too long (likely generated content)
    if (summary.length > 300) {
      console.warn(`Summary too long (${summary.length} chars), likely generated content`)
      return true
    }
    
    // Check if summary is much longer than it should be compared to conversation
    const conversationLength = originalMessages.reduce((acc, msg) => acc + msg.text.length, 0)
    const summaryRatio = summary.length / conversationLength
    if (summaryRatio > 0.3) { // Summary shouldn't be more than 30% of original
      console.warn(`Summary ratio too high (${(summaryRatio * 100).toFixed(1)}%), likely generated content`)
      return true
    }
    
    // Check for invalid patterns
    for (const pattern of invalidPatterns) {
      if (pattern.test(summary)) {
        console.warn(`Invalid summary pattern detected: ${pattern}`)
        return true
      }
    }
    
    // Check if summary contains quotes from the original conversation (good)
    // vs generating entirely new content (bad)
    const summaryWords = summary.toLowerCase().split(/\s+/)
    const conversationText = originalMessages.map(msg => msg.text).join(' ').toLowerCase()
    let matchingWords = 0
    
    for (const word of summaryWords) {
      if (word.length > 3 && conversationText.includes(word)) {
        matchingWords++
      }
    }
    
    const matchRatio = matchingWords / summaryWords.length
    if (matchRatio < 0.1) { // Less than 10% word overlap suggests generated content
      console.warn(`Low word overlap (${(matchRatio * 100).toFixed(1)}%), likely generated content`)
      return true
    }
    
    return false
  }

  /**
   * Create a deterministic fallback summary when AI generation fails
   */
  private createFallbackSummary(messages: MessageWithImportance[]): string {
    const messageCount = messages.length
    const topics = this.extractTopics(messages)
    const userMessages = messages.filter(m => m.role === 'user').length
    const assistantMessages = messages.filter(m => m.role === 'assistant').length
    
    if (topics.length > 0) {
      return `Conversation with ${messageCount} messages (${userMessages} user, ${assistantMessages} assistant) about: ${topics.join(', ')}.`
    }
    
    // Basic fallback with message samples
    const firstUserMsg = messages.find(m => m.role === 'user')?.text.substring(0, 30) || 'N/A'
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.text.substring(0, 30) || 'N/A'
    
    return `Conversation with ${messageCount} messages. Started with: "${firstUserMsg}..." Recent topic: "${lastUserMsg}..."`
  }

  /**
   * Extract key topics from user messages for fallback summaries
   */
  private extractTopics(messages: MessageWithImportance[]): string[] {
    const userMessages = messages.filter(m => m.role === 'user')
    const topics = new Set<string>()
    
    // Simple keyword extraction for common topics
    userMessages.forEach(msg => {
      const text = msg.text.toLowerCase()
      
      // Technical topics
      if (text.includes('code') || text.includes('programming') || text.includes('function')) topics.add('programming')
      if (text.includes('database') || text.includes('sql') || text.includes('table')) topics.add('database')
      if (text.includes('api') || text.includes('endpoint') || text.includes('request')) topics.add('API')
      if (text.includes('bug') || text.includes('error') || text.includes('fix')) topics.add('troubleshooting')
      
      // Creative topics  
      if (text.includes('poetry') || text.includes('poem') || text.includes('verse')) topics.add('poetry')
      if (text.includes('story') || text.includes('narrative') || text.includes('character')) topics.add('creative writing')
      if (text.includes('song') || text.includes('lyrics') || text.includes('music')) topics.add('music')
      
      // General topics
      if (text.includes('help') || text.includes('how to') || text.includes('explain')) topics.add('help/explanation')
      if (text.includes('project') || text.includes('build') || text.includes('create')) topics.add('project work')
      if (text.includes('question') || text.includes('what is') || text.includes('why')) topics.add('Q&A')
    })
    
    return Array.from(topics).slice(0, 3) // Limit to top 3 topics
  }

  private storeSummary(summary: ConversationSummary): void {
    const query = `
      INSERT INTO conversation_summaries
      (id, session_id, summary, message_count, start_message_id, end_message_id, importance_score, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `

    db.prepare(query).run(
      summary.id,
      summary.session_id,
      summary.summary,
      summary.message_count,
      summary.start_message_id,
      summary.end_message_id,
      summary.importance_score,
      summary.created_at
    )
  }

  private storeSemanticPin(pin: SemanticPin): void {
    const query = `
      INSERT INTO semantic_pins
      (id, session_id, content, source_message_id, importance_score, pin_type, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `

    db.prepare(query).run(
      pin.id,
      pin.session_id,
      pin.content,
      pin.source_message_id,
      pin.importance_score,
      pin.pin_type,
      pin.created_at
    )
  }

  private getSessionMessageCount(sessionId: string): number {
    // Check cache first
    const cached = this.messageCountCache.get(sessionId)
    const now = Date.now()

    if (cached && now - cached.timestamp < this.CACHE_TTL) {
      return cached.count
    }

    const query = `SELECT COUNT(*) as count FROM messages WHERE session_id = ?`
    const result = db.prepare(query).get(sessionId) as { count: number }

    // Cache the result
    this.messageCountCache.set(sessionId, { count: result.count, timestamp: now })

    return result.count
  }

  private getLastSummary(sessionId: string): ConversationSummary | null {
    const query = `
      SELECT * FROM conversation_summaries
      WHERE session_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `
    return db.prepare(query).get(sessionId) as ConversationSummary | null
  }

  private getMessageCountSince(sessionId: string, since: string): number {
    const query = `
      SELECT COUNT(*) as count
      FROM messages
      WHERE session_id = ? AND created_at > ?
    `
    const result = db.prepare(query).get(sessionId, since) as { count: number }
    return result.count
  }

  private getMessagesSinceLastSummary(
    sessionId: string,
    since: string
  ): MessageWithImportance[] {
    const query = `
      SELECT id, session_id, role, text, model_id, token_usage, created_at, importance_score
      FROM messages
      WHERE session_id = ? AND created_at > ?
      ORDER BY created_at ASC
    `
    return db.prepare(query).all(sessionId, since) as MessageWithImportance[]
  }

  private getAllMessagesForSession(sessionId: string): MessageWithImportance[] {
    const query = `
      SELECT id, session_id, role, text, model_id, token_usage, created_at, importance_score
      FROM messages
      WHERE session_id = ?
      ORDER BY created_at ASC
    `
    return db.prepare(query).all(sessionId) as MessageWithImportance[]
  }

  private estimateTokens(
    messages: MessageWithImportance[],
    pins: SemanticPin[],
    summaries: ConversationSummary[]
  ): number {
    // Rough token estimation: ~0.75 tokens per character
    let totalChars = 0

    totalChars += messages.reduce((sum, msg) => sum + msg.text.length, 0)
    totalChars += pins.reduce((sum, pin) => sum + pin.content.length, 0)
    totalChars += summaries.reduce((sum, summary) => sum + summary.summary.length, 0)

    return Math.ceil(totalChars * 0.75)
  }

  private truncateContext(
    messages: MessageWithImportance[],
    pins: SemanticPin[],
    summaries: ConversationSummary[],
    maxTokens: number
  ): MemoryContext {
    // Smart truncation: preserve most important content
    // Priority: Recent messages > High importance pins > Recent summaries

    let currentTokens = 0
    const result: MemoryContext = {
      recentMessages: [],
      semanticPins: [],
      summaries: [],
      totalTokens: 0,
    }

    // Always include at least 3 most recent messages
    const minMessages = Math.min(3, messages.length)
    for (let i = messages.length - minMessages; i < messages.length; i++) {
      if (messages[i]) {
        result.recentMessages.push(messages[i])
        currentTokens += Math.ceil(messages[i].text.length * 0.75)
      }
    }

    // Add highest importance pins
    const sortedPins = [...pins].sort((a, b) => b.importance_score - a.importance_score)
    for (const pin of sortedPins) {
      const pinTokens = Math.ceil(pin.content.length * 0.75)
      if (currentTokens + pinTokens < maxTokens) {
        result.semanticPins.push(pin)
        currentTokens += pinTokens
      }
    }

    // Add recent summaries if space allows
    for (const summary of summaries) {
      const summaryTokens = Math.ceil(summary.summary.length * 0.75)
      if (currentTokens + summaryTokens < maxTokens) {
        result.summaries.push(summary)
        currentTokens += summaryTokens
      }
    }

    result.totalTokens = currentTokens
    return result
  }
}
