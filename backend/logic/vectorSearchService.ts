// backend/logic/vectorSearchService.ts
// Service for performing vector similarity search on document chunks

import { embeddingService } from './embeddingService'
import { DocumentChunk } from './chunkingService'

export interface SearchQuery {
  text: string
  persona_id?: string
  dataset_ids?: string[]
  therapeutic_tags?: string[]
  limit?: number
  similarity_threshold?: number
}

export interface SearchResult {
  chunk: DocumentChunk
  similarity: number
  dataset_name?: string
  file_name?: string
}

export interface VectorSearchResponse {
  query: string
  results: SearchResult[]
  total_results: number
  search_time_ms: number
  embedding_model: string
}

export class VectorSearchService {
  /**
   * Perform semantic search across document chunks
   */
  async search(query: SearchQuery): Promise<VectorSearchResponse> {
    const startTime = Date.now()
    
    // 1. Generate embedding for search query
    console.log(`🔍 Generating query embedding for: "${query.text.substring(0, 50)}..."`)
    const queryEmbedding = await embeddingService.generateQueryEmbedding(query.text)
    
    // 2. Get dataset IDs to search
    const datasetIds = await this.getSearchableDatasets(query.persona_id, query.dataset_ids)
    
    if (datasetIds.length === 0) {
      return {
        query: query.text,
        results: [],
        total_results: 0,
        search_time_ms: Date.now() - startTime,
        embedding_model: 'none'
      }
    }
    
    // 3. Find similar chunks
    const similarChunks = await embeddingService.findSimilarChunks(
      queryEmbedding,
      datasetIds,
      query.limit || 5,
      query.similarity_threshold || 0.7
    )
    
    // 4. Enhance results with dataset metadata
    const enhancedResults = await this.enhanceResults(similarChunks)
    
    // 5. Filter by therapeutic tags if specified
    const filteredResults = query.therapeutic_tags 
      ? this.filterByTherapeuticTags(enhancedResults, query.therapeutic_tags)
      : enhancedResults
    
    const searchTime = Date.now() - startTime
    console.log(`✅ Found ${filteredResults.length} relevant chunks in ${searchTime}ms`)
    
    return {
      query: query.text,
      results: filteredResults,
      total_results: filteredResults.length,
      search_time_ms: searchTime,
      embedding_model: 'local' // TODO: Track actual model used
    }
  }

  /**
   * Get context for RAG generation
   */
  async getContextForQuery(
    query: string,
    persona_id?: string,
    maxTokens: number = 2000
  ): Promise<{ context: string; sources: SearchResult[] }> {
    const searchResults = await this.search({
      text: query,
      persona_id,
      limit: 10,
      similarity_threshold: 0.6
    })
    
    // Build context string within token limit
    let context = ''
    let tokenCount = 0
    const usedSources: SearchResult[] = []
    
    for (const result of searchResults.results) {
      const chunkText = result.chunk.content
      const chunkTokens = this.estimateTokens(chunkText)
      
      if (tokenCount + chunkTokens <= maxTokens) {
        context += `\n\n--- Source: ${result.file_name || 'Unknown'} ---\n${chunkText}`
        tokenCount += chunkTokens
        usedSources.push(result)
      } else {
        break
      }
    }
    
    return {
      context: context.trim(),
      sources: usedSources
    }
  }

  /**
   * Get searchable dataset IDs based on persona and explicit list
   */
  private async getSearchableDatasets(
    persona_id?: string,
    explicit_dataset_ids?: string[]
  ): Promise<string[]> {
    // If explicit dataset IDs provided, use those
    if (explicit_dataset_ids && explicit_dataset_ids.length > 0) {
      return explicit_dataset_ids
    }
    
    // If persona provided, get linked datasets
    if (persona_id) {
      const { db } = await import('../db/db')
      const stmt = db.prepare(`
        SELECT pd.dataset_id 
        FROM persona_datasets pd
        JOIN datasets d ON pd.dataset_id = d.id
        WHERE pd.persona_id = ? AND pd.enabled = 1 AND d.processing_status = 'completed'
        ORDER BY pd.weight DESC, pd.last_used_at DESC
      `)
      
      const rows = stmt.all(persona_id) as Array<{ dataset_id: string }>
      return rows.map(row => row.dataset_id)
    }
    
    // Default: search all available datasets
    const { db } = await import('../db/db')
    const stmt = db.prepare(`
      SELECT id FROM datasets WHERE processing_status = 'completed'
    `)
    
    const rows = stmt.all() as Array<{ id: string }>
    return rows.map(row => row.id)
  }

  /**
   * Enhance search results with dataset metadata
   */
  private async enhanceResults(
    similarChunks: Array<{ chunk: DocumentChunk; similarity: number }>
  ): Promise<SearchResult[]> {
    const { db } = await import('../db/db')
    
    const results: SearchResult[] = []
    
    for (const { chunk, similarity } of similarChunks) {
      // Get dataset metadata
      const stmt = db.prepare(`
        SELECT name, file_name FROM datasets WHERE id = ?
      `)
      
      const dataset = stmt.get(chunk.dataset_id) as { name: string; file_name: string } | undefined
      
      results.push({
        chunk,
        similarity,
        dataset_name: dataset?.name,
        file_name: dataset?.file_name
      })
    }
    
    return results
  }

  /**
   * Filter results by therapeutic tags
   */
  private filterByTherapeuticTags(
    results: SearchResult[],
    requiredTags: string[]
  ): SearchResult[] {
    return results.filter(result => {
      const chunkTags = result.chunk.therapeutic_tags || []
      return requiredTags.some(tag => 
        chunkTags.some(chunkTag => 
          chunkTag.toLowerCase().includes(tag.toLowerCase())
        )
      )
    })
  }

  /**
   * Estimate token count for text (rough approximation)
   */
  private estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4)
  }
}

// Export singleton instance
export const vectorSearchService = new VectorSearchService()