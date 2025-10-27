/**
 * search.ts
 * TypeScript type definitions for Tavily web search functionality
 */

/**
 * Search depth options for Tavily API
 */
export type SearchDepth = 'basic' | 'advanced'

/**
 * Options for Tavily search requests
 */
export interface SearchOptions {
  /**
   * Search depth - 'basic' for quick results, 'advanced' for comprehensive search
   * @default 'basic'
   */
  search_depth?: SearchDepth

  /**
   * Maximum number of search results to return
   * @default 5
   * @min 1
   * @max 20
   */
  max_results?: number

  /**
   * Include raw HTML content in results
   * @default false
   */
  include_raw_content?: boolean

  /**
   * Include images in search results
   * @default false
   */
  include_images?: boolean

  /**
   * Include answer summary in results
   * @default true
   */
  include_answer?: boolean

  /**
   * List of domains to include in search (whitelist)
   */
  include_domains?: string[]

  /**
   * List of domains to exclude from search (blacklist)
   */
  exclude_domains?: string[]
}

/**
 * Individual search result from Tavily
 */
export interface SearchResult {
  /**
   * Title of the search result
   */
  title: string

  /**
   * URL of the search result
   */
  url: string

  /**
   * Extracted content/snippet from the page
   */
  content: string

  /**
   * Relevance score (0-1)
   */
  score: number

  /**
   * Raw HTML content (if requested)
   */
  raw_content?: string
}

/**
 * Image result from search
 */
export interface SearchImage {
  /**
   * URL of the image
   */
  url: string

  /**
   * Description/alt text of the image
   */
  description: string
}

/**
 * Complete search response from Tavily
 */
export interface SearchResponse {
  /**
   * AI-generated answer to the query
   */
  answer?: string

  /**
   * Array of search results
   */
  results: SearchResult[]

  /**
   * Array of image results (if requested)
   */
  images?: SearchImage[]

  /**
   * Original query
   */
  query: string

  /**
   * Number of results returned
   */
  results_count: number

  /**
   * Time taken to process request (ms)
   */
  response_time?: number
}

/**
 * Request body for search endpoint
 */
export interface SearchRequest {
  /**
   * Search query string
   */
  query: string

  /**
   * Optional search options
   */
  options?: SearchOptions
}

/**
 * Request body for URL content extraction
 */
export interface ExtractRequest {
  /**
   * URL to extract content from
   */
  url: string
}

/**
 * Response from URL content extraction
 */
export interface ExtractResponse {
  /**
   * URL that was extracted
   */
  url: string

  /**
   * Extracted text content
   */
  content: string

  /**
   * Page title
   */
  title?: string

  /**
   * HTTP status code
   */
  status_code: number

  /**
   * Success indicator
   */
  success: boolean

  /**
   * Error message if extraction failed
   */
  error?: string
}
