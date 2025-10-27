/**
 * tavilyService.ts
 * Service layer for Tavily web search integration
 * Provides web search and content extraction capabilities
 */

import { tavily } from '@tavily/core'
import { logInfo, logError, logWarn } from '../utils/logger'
import type {
  SearchOptions,
  SearchResponse,
  SearchImage,
  ExtractResponse,
} from '../types/search'

/**
 * Tavily API client instance
 * Initialized with API key from environment variables
 */
const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY || '' })

/**
 * Default search options following Tavily best practices
 */
const DEFAULT_SEARCH_OPTIONS: SearchOptions = {
  search_depth: 'basic',
  max_results: 5,
  include_raw_content: false,
  include_images: false,
  include_answer: true,
}

/**
 * Maximum allowed results to prevent API quota exhaustion
 */
const MAX_RESULTS_LIMIT = 20

/**
 * Validates API key is configured
 * @throws Error if TAVILY_API_KEY is not set
 */
function validateApiKey(): void {
  if (!process.env.TAVILY_API_KEY) {
    throw new Error('TAVILY_API_KEY environment variable is not configured')
  }

  if (!process.env.TAVILY_API_KEY.startsWith('tvly-')) {
    logWarn('Tavily API key format appears invalid (should start with tvly-)')
  }
}

/**
 * Validates and sanitizes search options
 * @param options - User-provided search options
 * @returns Validated and merged options with defaults
 */
function validateSearchOptions(options?: SearchOptions): SearchOptions {
  const merged = { ...DEFAULT_SEARCH_OPTIONS, ...options }

  // Enforce max results limit
  if (merged.max_results && merged.max_results > MAX_RESULTS_LIMIT) {
    logWarn(`Requested max_results (${merged.max_results}) exceeds limit, capping at ${MAX_RESULTS_LIMIT}`)
    merged.max_results = MAX_RESULTS_LIMIT
  }

  // Ensure positive number
  if (merged.max_results && merged.max_results < 1) {
    logWarn(`Invalid max_results (${merged.max_results}), using default`)
    merged.max_results = DEFAULT_SEARCH_OPTIONS.max_results
  }

  // Validate search depth
  if (merged.search_depth && !['basic', 'advanced'].includes(merged.search_depth)) {
    logWarn(`Invalid search_depth (${merged.search_depth}), using default`)
    merged.search_depth = DEFAULT_SEARCH_OPTIONS.search_depth
  }

  return merged
}

/**
 * Validates search query
 * @param query - User-provided search query
 * @throws Error if query is invalid
 */
function validateQuery(query: string): void {
  if (!query || typeof query !== 'string') {
    throw new Error('Search query is required and must be a string')
  }

  if (query.trim().length === 0) {
    throw new Error('Search query cannot be empty')
  }

  if (query.length > 400) {
    throw new Error('Search query is too long (max 400 characters)')
  }
}

/**
 * Validates URL format
 * @param url - URL to validate
 * @throws Error if URL is invalid
 */
function validateUrl(url: string): void {
  if (!url || typeof url !== 'string') {
    throw new Error('URL is required and must be a string')
  }

  try {
    // Node.js URL validation
    const parsedUrl = new globalThis.URL(url)
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('URL must use HTTP or HTTPS protocol')
    }
  } catch (error) {
    throw new Error(`Invalid URL format: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Performs a web search using Tavily API
 * 
 * @param query - Search query string
 * @param options - Optional search parameters
 * @returns Search results with answer and sources
 * @throws Error if API key is not configured or search fails
 * 
 * @example
 * ```typescript
 * const results = await searchWeb('What is the capital of France?', {
 *   max_results: 3,
 *   include_answer: true
 * })
 * console.log(results.answer) // "The capital of France is Paris"
 * console.log(results.results) // [{ title: '...', url: '...', content: '...' }]
 * ```
 */
export async function searchWeb(
  query: string,
  options?: SearchOptions
): Promise<SearchResponse> {
  const startTime = Date.now()

  try {
    // Validate inputs
    validateApiKey()
    validateQuery(query)
    const validatedOptions = validateSearchOptions(options)

    logInfo('Initiating Tavily web search', {
      query: query.substring(0, 100), // Log truncated query for privacy
      options: validatedOptions,
    })

    // Perform search via Tavily API
    const response = await tavilyClient.search(query, validatedOptions)

    const responseTime = Date.now() - startTime

    logInfo('Tavily search completed successfully', {
      query: query.substring(0, 100),
      results_count: response.results?.length || 0,
      has_answer: !!response.answer,
      response_time_ms: responseTime,
    })

    // Transform response to match our interface
    const searchResponse: SearchResponse = {
      answer: response.answer || undefined,
      results: (response.results || []).map((result) => ({
        title: result.title || '',
        url: result.url || '',
        content: result.content || '',
        score: result.score || 0,
        raw_content: result.rawContent || undefined,
      })),
      images: response.images?.map((img): SearchImage => ({
        url: img.url,
        description: img.description || '',
      })),
      query,
      results_count: response.results?.length || 0,
      response_time: responseTime,
    }

    return searchResponse
  } catch (error) {
    const responseTime = Date.now() - startTime

    logError('Tavily search failed', error instanceof Error ? error : new Error('Unknown search error'), {
      query: query.substring(0, 100),
      response_time_ms: responseTime,
    })

    // Re-throw with context
    if (error instanceof Error) {
      throw new Error(`Web search failed: ${error.message}`)
    }
    throw new Error('Web search failed: Unknown error')
  }
}

/**
 * Extracts content from a specific URL using Tavily
 * 
 * @param url - URL to extract content from
 * @returns Extracted content and metadata
 * @throws Error if API key is not configured or extraction fails
 * 
 * @example
 * ```typescript
 * const content = await extractContent('https://example.com/article')
 * console.log(content.title) // "Article Title"
 * console.log(content.content) // "Article text content..."
 * ```
 */
export async function extractContent(url: string): Promise<ExtractResponse> {
  const startTime = Date.now()

  try {
    // Validate inputs
    validateApiKey()
    validateUrl(url)

    logInfo('Initiating Tavily content extraction', {
      url: url.substring(0, 100), // Truncate URL for logging
    })

    // Extract content via Tavily API
    const response = await tavilyClient.extract([url])

    const responseTime = Date.now() - startTime

    // Tavily extract returns an array, get first result
    const extractedData = response.results?.[0] || null

    if (!extractedData) {
      throw new Error('No content extracted from URL')
    }

    logInfo('Tavily content extraction completed', {
      url: url.substring(0, 100),
      content_length: extractedData.rawContent?.length || 0,
      response_time_ms: responseTime,
    })

    const extractResponse: ExtractResponse = {
      url,
      content: extractedData.rawContent || '',
      title: extractedData.url || undefined,
      status_code: 200,
      success: true,
    }

    return extractResponse
  } catch (error) {
    const responseTime = Date.now() - startTime

    logError('Tavily content extraction failed', error instanceof Error ? error : new Error('Unknown extraction error'), {
      url: url.substring(0, 100),
      response_time_ms: responseTime,
    })

    // Return error response instead of throwing
    const errorResponse: ExtractResponse = {
      url,
      content: '',
      status_code: 500,
      success: false,
      error: error instanceof Error ? error.message : 'Content extraction failed',
    }

    return errorResponse
  }
}

/**
 * Checks if Tavily API is properly configured and accessible
 * 
 * @returns True if API key is configured, false otherwise
 */
export function isConfigured(): boolean {
  return !!(process.env.TAVILY_API_KEY && process.env.TAVILY_API_KEY.startsWith('tvly-'))
}

/**
 * Gets current Tavily service configuration status
 * 
 * @returns Configuration status object
 */
export function getStatus(): {
  configured: boolean
  api_key_present: boolean
  api_key_format_valid: boolean
} {
  const apiKeyPresent = !!process.env.TAVILY_API_KEY
  const apiKeyFormatValid = apiKeyPresent && process.env.TAVILY_API_KEY!.startsWith('tvly-')

  return {
    configured: apiKeyPresent && apiKeyFormatValid,
    api_key_present: apiKeyPresent,
    api_key_format_valid: apiKeyFormatValid,
  }
}
