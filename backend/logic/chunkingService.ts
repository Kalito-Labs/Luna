// backend/logic/chunkingService.ts
// Service for breaking documents into semantic chunks for RAG processing

import { v4 as uuidv4 } from 'uuid'

export interface ChunkingOptions {
  strategy: 'fixed' | 'semantic' | 'therapeutic_aware'
  chunk_size: number // Target tokens per chunk
  overlap: number // Overlap tokens between chunks
  preserve_structure: boolean // Respect headers, sections, etc.
  min_chunk_size: number // Minimum viable chunk size
  max_chunk_size: number // Maximum chunk size
}

export interface DocumentChunk {
  id: string
  dataset_id: string
  chunk_index: number
  content: string
  chunk_type: 'header' | 'body' | 'instruction' | 'example' | 'exercise'
  section_title?: string
  page_number?: number
  char_start: number
  char_end: number
  token_count: number
  therapeutic_tags?: string[]
  metadata?: Record<string, string | number | boolean>
}

export interface ChunkedDocument {
  dataset_id: string
  chunks: DocumentChunk[]
  total_chunks: number
  strategy_used: string
  processing_time_ms: number
}

export class ChunkingService {
  private readonly defaultOptions: ChunkingOptions = {
    strategy: 'semantic',
    chunk_size: 512, // Tokens
    overlap: 50, // Tokens
    preserve_structure: true,
    min_chunk_size: 100,
    max_chunk_size: 1000
  }

  /**
   * Main chunking method - routes to appropriate strategy
   */
  async chunkDocument(
    dataset_id: string,
    content: string,
    options?: Partial<ChunkingOptions>
  ): Promise<ChunkedDocument> {
    const startTime = Date.now()
    const opts = { ...this.defaultOptions, ...options }

    let chunks: DocumentChunk[]

    switch (opts.strategy) {
      case 'fixed':
        chunks = await this.fixedSizeChunking(dataset_id, content, opts)
        break
      case 'semantic':
        chunks = await this.semanticChunking(dataset_id, content, opts)
        break
      case 'therapeutic_aware':
        chunks = await this.therapeuticAwareChunking(dataset_id, content, opts)
        break
      default:
        throw new Error(`Unknown chunking strategy: ${opts.strategy}`)
    }

    const processingTime = Date.now() - startTime

    return {
      dataset_id,
      chunks,
      total_chunks: chunks.length,
      strategy_used: opts.strategy,
      processing_time_ms: processingTime
    }
  }

  /**
   * Fixed-size chunking: Simple sliding window approach
   */
  private async fixedSizeChunking(
    dataset_id: string,
    content: string,
    options: ChunkingOptions
  ): Promise<DocumentChunk[]> {
    const chunks: DocumentChunk[] = []
    
    // Simple token estimation (rough approximation: 1 token ≈ 4 characters)
    const chunkSizeChars = options.chunk_size * 4
    const overlapChars = options.overlap * 4

    let start = 0
    let chunkIndex = 0

    while (start < content.length) {
      const end = Math.min(start + chunkSizeChars, content.length)
      const chunkContent = content.slice(start, end)
      
      // Skip chunks that are too small (unless it's the last chunk)
      if (chunkContent.length < options.min_chunk_size * 4 && end < content.length) {
        start += chunkSizeChars - overlapChars
        continue
      }

      chunks.push({
        id: uuidv4(),
        dataset_id,
        chunk_index: chunkIndex++,
        content: chunkContent.trim(),
        chunk_type: 'body',
        char_start: start,
        char_end: end,
        token_count: this.estimateTokenCount(chunkContent),
        therapeutic_tags: []
      })

      // Move to next chunk with overlap
      start += chunkSizeChars - overlapChars
    }

    return chunks
  }

  /**
   * Semantic chunking: Split on sentences and paragraphs
   */
  private async semanticChunking(
    dataset_id: string,
    content: string,
    options: ChunkingOptions
  ): Promise<DocumentChunk[]> {
    const chunks: DocumentChunk[] = []
    
    // Split content into sentences first
    const sentences = this.splitIntoSentences(content)
    
    let currentChunk = ''
    let currentTokens = 0
    let chunkIndex = 0
    let charStart = 0

    for (const sentence of sentences) {
      const sentenceTokens = this.estimateTokenCount(sentence)
      
      // If adding this sentence would exceed max size, finish current chunk
      if (currentTokens + sentenceTokens > options.chunk_size && currentChunk.length > 0) {
        const chunk = this.createChunk(
          dataset_id,
          chunkIndex++,
          currentChunk.trim(),
          charStart,
          charStart + currentChunk.length,
          'semantic'
        )
        chunks.push(chunk)
        
        // Start new chunk with overlap (keep last sentence if small enough)
        if (sentenceTokens < options.overlap) {
          currentChunk = sentence + ' '
          currentTokens = sentenceTokens
        } else {
          currentChunk = ''
          currentTokens = 0
        }
        charStart += currentChunk.length
      }

      currentChunk += sentence + ' '
      currentTokens += sentenceTokens
    }

    // Add final chunk if there's content
    if (currentChunk.trim().length > 0) {
      const chunk = this.createChunk(
        dataset_id,
        chunkIndex,
        currentChunk.trim(),
        charStart,
        charStart + currentChunk.length,
        'semantic'
      )
      chunks.push(chunk)
    }

    return chunks
  }

  /**
   * Therapeutic-aware chunking: Preserve therapeutic content structure
   */
  private async therapeuticAwareChunking(
    dataset_id: string,
    content: string,
    options: ChunkingOptions
  ): Promise<DocumentChunk[]> {
    const chunks: DocumentChunk[] = []
    let chunkIndex = 0
    
    // Analyze document structure for therapeutic patterns
    const sections = this.analyzeTherapeuticStructure(content)
    
    for (const section of sections) {
      // If section is small enough, keep it as one chunk
      if (this.estimateTokenCount(section.content) <= options.chunk_size) {
        const chunk: DocumentChunk = {
          id: uuidv4(),
          dataset_id,
          chunk_index: chunkIndex++,
          content: section.content.trim(),
          chunk_type: section.type,
          section_title: section.title,
          char_start: section.start,
          char_end: section.end,
          token_count: this.estimateTokenCount(section.content),
          therapeutic_tags: section.tags
        }
        chunks.push(chunk)
      } else {
        // Section is too large, break it down while preserving context
        const subChunks = await this.semanticChunking(dataset_id, section.content, {
          ...options,
          preserve_structure: false
        })
        
        // Update chunk indices and add section context
        for (const subChunk of subChunks) {
          subChunk.chunk_index = chunkIndex++
          subChunk.section_title = section.title
          subChunk.chunk_type = section.type
          subChunk.therapeutic_tags = section.tags
          chunks.push(subChunk)
        }
      }
    }

    return chunks
  }

  /**
   * Analyze document structure to identify therapeutic content patterns
   */
  private analyzeTherapeuticStructure(content: string): Array<{
    type: DocumentChunk['chunk_type']
    title?: string
    content: string
    start: number
    end: number
    tags: string[]
  }> {
    const sections: Array<{
      type: DocumentChunk['chunk_type']
      title?: string
      content: string
      start: number
      end: number
      tags: string[]
    }> = []

    // Split by paragraphs first
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0)
    let currentPos = 0

    for (const paragraph of paragraphs) {
      const start = content.indexOf(paragraph, currentPos)
      const end = start + paragraph.length
      
      // Analyze paragraph type
      const analysis = this.analyzeTherapeuticContent(paragraph)
      
      sections.push({
        type: analysis.type,
        title: analysis.title,
        content: paragraph.trim(),
        start,
        end,
        tags: analysis.tags
      })

      currentPos = end
    }

    return sections
  }

  /**
   * Analyze content to determine therapeutic type and extract tags
   */
  private analyzeTherapeuticContent(text: string): {
    type: DocumentChunk['chunk_type']
    title?: string
    tags: string[]
  } {
    const lowerText = text.toLowerCase()
    const tags: string[] = []
    
    // Check for headers (starts with numbers, bullets, or title case)
    if (/^(\d+\.|[•\-*]|[A-Z][^.!?]*:)/.test(text.trim())) {
      return {
        type: 'header',
        title: text.split('\n')[0].trim(),
        tags: ['section-header']
      }
    }

    // Check for instructions
    if (this.containsInstructionalLanguage(lowerText)) {
      tags.push('instructions')
      return { type: 'instruction', tags }
    }

    // Check for examples
    if (this.containsExampleLanguage(lowerText)) {
      tags.push('example')
      return { type: 'example', tags }
    }

    // Check for exercises/worksheets
    if (this.containsExerciseLanguage(lowerText)) {
      tags.push('exercise', 'worksheet')
      return { type: 'exercise', tags }
    }

    // Identify therapeutic concepts
    this.identifyTherapeuticConcepts(lowerText).forEach(concept => tags.push(concept))

    return { type: 'body', tags }
  }

  /**
   * Check for instructional language patterns
   */
  private containsInstructionalLanguage(text: string): boolean {
    const instructionalPatterns = [
      /try to/g,
      /remember to/g,
      /it is important to/g,
      /you should/g,
      /steps?:/g,
      /follow these/g,
      /first,|second,|third,|next,/g
    ]

    return instructionalPatterns.some(pattern => pattern.test(text))
  }

  /**
   * Check for example language patterns
   */
  private containsExampleLanguage(text: string): boolean {
    const examplePatterns = [
      /for example/g,
      /such as/g,
      /let's say/g,
      /imagine/g,
      /consider/g,
      /example:/g
    ]

    return examplePatterns.some(pattern => pattern.test(text))
  }

  /**
   * Check for exercise/worksheet language
   */
  private containsExerciseLanguage(text: string): boolean {
    const exercisePatterns = [
      /exercise/g,
      /practice/g,
      /homework/g,
      /worksheet/g,
      /fill in/g,
      /write down/g,
      /list/g
    ]

    return exercisePatterns.some(pattern => pattern.test(text))
  }

  /**
   * Identify therapeutic concepts and techniques
   */
  private identifyTherapeuticConcepts(text: string): string[] {
    const concepts: string[] = []

    // CBT concepts
    if (/cognitive|thinking|thought|belief|automatic/.test(text)) {
      concepts.push('cognitive-behavioral')
    }
    if (/distortion|catastrophizing|black.and.white/.test(text)) {
      concepts.push('cognitive-distortions')
    }

    // DBT concepts
    if (/distress.tolerance|wise.mind|emotion.regulation/.test(text)) {
      concepts.push('dialectical-behavioral')
    }
    if (/tipp|distraction|self.soothing/.test(text)) {
      concepts.push('dbt-skills')
    }

    // Mindfulness concepts
    if (/mindfulness|meditation|present.moment|awareness/.test(text)) {
      concepts.push('mindfulness')
    }

    // General therapeutic concepts
    if (/coping|strategy|technique|skill/.test(text)) {
      concepts.push('coping-skills')
    }
    if (/anxiety|depression|stress/.test(text)) {
      concepts.push('mental-health')
    }

    return concepts
  }

  /**
   * Split text into sentences
   */
  private splitIntoSentences(text: string): string[] {
    // Simple sentence splitting - can be improved with better NLP
    return text
      .split(/[.!?]+/)
      .map(sentence => sentence.trim())
      .filter(sentence => sentence.length > 10) // Filter out very short fragments
  }

  /**
   * Estimate token count (rough approximation)
   */
  private estimateTokenCount(text: string): number {
    // Rough approximation: 1 token ≈ 4 characters for English
    // More accurate would use actual tokenizer
    return Math.ceil(text.length / 4)
  }

  /**
   * Create a standardized chunk object
   */
  private createChunk(
    dataset_id: string,
    chunk_index: number,
    content: string,
    char_start: number,
    char_end: number,
    strategy: string
  ): DocumentChunk {
    return {
      id: uuidv4(),
      dataset_id,
      chunk_index,
      content,
      chunk_type: 'body',
      char_start,
      char_end,
      token_count: this.estimateTokenCount(content),
      therapeutic_tags: [],
      metadata: { strategy }
    }
  }
}

// Export singleton instance
export const chunkingService = new ChunkingService()