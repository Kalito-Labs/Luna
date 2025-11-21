// backend/logic/embeddingService.ts
// Service for generating vector embeddings from text chunks

import { DocumentChunk } from './chunkingService'
import { db } from '../db/db'

// Use global fetch in Node.js 18+
declare const fetch: typeof globalThis.fetch

interface DatabaseChunkRow {
  id: string
  dataset_id: string
  chunk_index: number
  content: string
  chunk_type: string
  section_title: string | null
  char_start: number
  char_end: number
  token_count: number
  therapeutic_tags: string
  embedding: Buffer | null
}

export interface EmbeddingOptions {
  model: 'local' | 'openai'
  embedding_model?: string
  normalize: boolean
  batch_size: number
}

export interface EmbeddedChunk extends DocumentChunk {
  embedding: Float32Array
  embedding_model: string
  embedding_dim: number
}

export interface EmbeddingResult {
  dataset_id: string
  embedded_chunks: EmbeddedChunk[]
  total_embeddings: number
  model_used: string
  processing_time_ms: number
}

export class EmbeddingService {
  private readonly defaultOptions: EmbeddingOptions = {
    model: 'local',
    embedding_model: 'all-MiniLM-L6-v2',
    normalize: true,
    batch_size: 10
  }

  /**
   * Generate embeddings for all chunks in a dataset
   */
  async generateEmbeddings(
    chunks: DocumentChunk[],
    options?: Partial<EmbeddingOptions>
  ): Promise<EmbeddingResult> {
    const startTime = Date.now()
    const opts = { ...this.defaultOptions, ...options }

    let embeddedChunks: EmbeddedChunk[]

    if (opts.model === 'local') {
      embeddedChunks = await this.generateLocalEmbeddings(chunks, opts)
    } else if (opts.model === 'openai') {
      embeddedChunks = await this.generateOpenAIEmbeddings(chunks, opts)
    } else {
      throw new Error(`Unknown embedding model: ${opts.model}`)
    }

    const processingTime = Date.now() - startTime

    return {
      dataset_id: chunks[0]?.dataset_id || '',
      embedded_chunks: embeddedChunks,
      total_embeddings: embeddedChunks.length,
      model_used: opts.embedding_model || opts.model,
      processing_time_ms: processingTime
    }
  }

  /**
   * Generate embeddings using local model (privacy-first approach)
   */
  private async generateLocalEmbeddings(
    chunks: DocumentChunk[],
    options: EmbeddingOptions
  ): Promise<EmbeddedChunk[]> {
    console.log(`🧠 Generating local embeddings for ${chunks.length} chunks...`)
    
    // For now, return mock embeddings until we set up @xenova/transformers
    // This is a placeholder implementation
    const embeddedChunks: EmbeddedChunk[] = []
    
    for (const chunk of chunks) {
      // Generate deterministic mock embedding based on content
      const mockEmbedding = this.generateMockEmbedding(chunk.content, 384)
      
      const embeddedChunk: EmbeddedChunk = {
        ...chunk,
        embedding: mockEmbedding,
        embedding_model: options.embedding_model || 'mock-local',
        embedding_dim: 384
      }
      
      embeddedChunks.push(embeddedChunk)
    }

    console.log(`✅ Generated ${embeddedChunks.length} local embeddings`)
    return embeddedChunks
  }

  /**
   * Generate embeddings using OpenAI API (cloud approach)
   */
  private async generateOpenAIEmbeddings(
    chunks: DocumentChunk[],
    options: EmbeddingOptions
  ): Promise<EmbeddedChunk[]> {
    console.log(`☁️ Generating OpenAI embeddings for ${chunks.length} chunks...`)
    
    const embeddedChunks: EmbeddedChunk[] = []
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable not set')
    }

    // Process in batches to avoid rate limits
    for (let i = 0; i < chunks.length; i += options.batch_size) {
      const batch = chunks.slice(i, i + options.batch_size)
      const texts = batch.map(chunk => chunk.content)

      try {
        const response = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: options.embedding_model || 'text-embedding-3-small',
            input: texts,
            encoding_format: 'float'
          })
        })

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        
        // Process each embedding in the batch
        for (let j = 0; j < batch.length; j++) {
          const chunk = batch[j]
          const embedding = new Float32Array(data.data[j].embedding)

          const embeddedChunk: EmbeddedChunk = {
            ...chunk,
            embedding: options.normalize ? this.normalizeEmbedding(embedding) : embedding,
            embedding_model: options.embedding_model || 'text-embedding-3-small',
            embedding_dim: embedding.length
          }

          embeddedChunks.push(embeddedChunk)
        }

        console.log(`📊 Processed batch ${Math.floor(i / options.batch_size) + 1}/${Math.ceil(chunks.length / options.batch_size)}`)

        // Rate limiting delay
        if (i + options.batch_size < chunks.length) {
          await this.delay(100) // 100ms between batches
        }

      } catch (error) {
        console.error(`❌ Failed to generate embeddings for batch starting at ${i}:`, error)
        throw error
      }
    }

    console.log(`✅ Generated ${embeddedChunks.length} OpenAI embeddings`)
    return embeddedChunks
  }

  /**
   * Store embeddings in database
   */
  async storeEmbeddings(embeddedChunks: EmbeddedChunk[]): Promise<void> {
    console.log(`💾 Storing ${embeddedChunks.length} embeddings in database...`)
    
    const stmt = db.prepare(`
      UPDATE document_chunks 
      SET embedding = ?, embedding_dim = ?, embedding_model = ?
      WHERE id = ?
    `)

    for (const chunk of embeddedChunks) {
      // Convert Float32Array to Buffer for storage
      const embeddingBuffer = Buffer.from(chunk.embedding.buffer)
      
      stmt.run(
        embeddingBuffer,
        chunk.embedding_dim,
        chunk.embedding_model,
        chunk.id
      )
    }

    console.log(`✅ Stored ${embeddedChunks.length} embeddings`)
  }

  /**
   * Generate embeddings for a query (for similarity search)
   */
  async generateQueryEmbedding(
    query: string,
    options?: Partial<EmbeddingOptions>
  ): Promise<Float32Array> {
    const opts = { ...this.defaultOptions, ...options }

    if (opts.model === 'local') {
      return this.generateMockEmbedding(query, 384)
    } else {
      const apiKey = process.env.OPENAI_API_KEY
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY environment variable not set')
      }

      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: opts.embedding_model || 'text-embedding-3-small',
          input: query,
          encoding_format: 'float'
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const embedding = new Float32Array(data.data[0].embedding)
      
      return opts.normalize ? this.normalizeEmbedding(embedding) : embedding
    }
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  cosineSimilarity(a: Float32Array, b: Float32Array): number {
    if (a.length !== b.length) {
      throw new Error('Embeddings must have the same dimension')
    }

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }

    const norm = Math.sqrt(normA) * Math.sqrt(normB)
    return norm === 0 ? 0 : dotProduct / norm
  }

  /**
   * Find similar chunks using vector similarity
   */
  async findSimilarChunks(
    queryEmbedding: Float32Array,
    datasetIds: string[],
    limit: number = 5,
    threshold: number = 0.7
  ): Promise<Array<{ chunk: DocumentChunk; similarity: number }>> {
    const placeholders = datasetIds.map(() => '?').join(',')
    
    const stmt = db.prepare(`
      SELECT id, dataset_id, chunk_index, content, chunk_type, section_title,
             char_start, char_end, token_count, therapeutic_tags, embedding
      FROM document_chunks 
      WHERE dataset_id IN (${placeholders}) 
        AND embedding IS NOT NULL
      ORDER BY chunk_index
    `)

    const rows = stmt.all(...datasetIds) as DatabaseChunkRow[]
    const results: Array<{ chunk: DocumentChunk; similarity: number }> = []

    for (const row of rows) {
      // Convert Buffer back to Float32Array
      const embeddingBuffer = row.embedding as Buffer
      const embedding = new Float32Array(embeddingBuffer.buffer.slice(
        embeddingBuffer.byteOffset,
        embeddingBuffer.byteOffset + embeddingBuffer.byteLength
      ))

      const similarity = this.cosineSimilarity(queryEmbedding, embedding)

      if (similarity >= threshold) {
        const chunk: DocumentChunk = {
          id: row.id,
          dataset_id: row.dataset_id,
          chunk_index: row.chunk_index,
          content: row.content,
          chunk_type: row.chunk_type as DocumentChunk['chunk_type'],
          section_title: row.section_title || undefined,
          char_start: row.char_start,
          char_end: row.char_end,
          token_count: row.token_count,
          therapeutic_tags: JSON.parse(row.therapeutic_tags || '[]') as string[]
        }

        results.push({ chunk, similarity })
      }
    }

    // Sort by similarity descending and limit results
    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
  }

  /**
   * Normalize embedding vector to unit length
   */
  private normalizeEmbedding(embedding: Float32Array): Float32Array {
    let norm = 0
    for (let i = 0; i < embedding.length; i++) {
      norm += embedding[i] * embedding[i]
    }
    norm = Math.sqrt(norm)

    if (norm === 0) return embedding

    const normalized = new Float32Array(embedding.length)
    for (let i = 0; i < embedding.length; i++) {
      normalized[i] = embedding[i] / norm
    }
    return normalized
  }

  /**
   * Generate deterministic mock embedding for testing
   */
  private generateMockEmbedding(text: string, dimension: number): Float32Array {
    // Simple hash-based mock embedding for consistent results
    const embedding = new Float32Array(dimension)
    
    // Generate deterministic values based on text content
    let hash = 0
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash + text.charCodeAt(i)) & 0xffffffff
    }

    // Fill embedding with pseudo-random values based on hash
    for (let i = 0; i < dimension; i++) {
      hash = ((hash * 1664525) + 1013904223) & 0xffffffff
      embedding[i] = (hash / 0xffffffff - 0.5) * 2 // Range: -1 to 1
    }

    return this.normalizeEmbedding(embedding)
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Export singleton instance
export const embeddingService = new EmbeddingService()