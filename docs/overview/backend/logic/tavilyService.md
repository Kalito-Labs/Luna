# Tavily Service Documentation

## Overview

The `tavilyService.ts` file implements a **web search and content extraction service** using the Tavily API, providing AI agents with real-time web access capabilities.

**Location**: `/backend/logic/tavilyService.ts`

**Primary Responsibilities**:
- Web search with AI-powered answers (Tavily API)
- URL content extraction and scraping
- Search result ranking and filtering
- API quota management and rate limiting
- Comprehensive input validation
- Structured error handling

**Key Features**:
- **AI-Generated Answers**: Direct answers to questions (not just links)
- **Smart Search**: Relevance scoring for results
- **Content Extraction**: Full text extraction from URLs
- **Image Search**: Optional image results
- **Deep Search**: Basic vs advanced search depths
- **Safety**: Input validation, quota limits, error recovery

**Integration Points**:
- Called by `tools.ts` for web search tool functionality
- Used by agents when user requests web information
- Provides real-time data for eldercare appointments, medications, providers

---

## Architecture Overview

### Service Flow

```
User Query: "What are the side effects of metformin?"
       ↓
Agent detects need for web search
       ↓
tools.ts calls searchWeb()
       ↓
┌────────────────────────────────────┐
│   Tavily Service                   │
├────────────────────────────────────┤
│ 1. Validate API key                │
│ 2. Validate query                  │
│ 3. Validate options                │
│ 4. Call Tavily API                 │
│ 5. Transform response              │
│ 6. Log metrics                     │
└────────────────────────────────────┘
       ↓
Tavily API (external)
       ↓
SearchResponse {
  answer: "Metformin side effects include...",
  results: [
    { title: "WebMD - Metformin", url: "...", content: "...", score: 0.95 },
    { title: "Mayo Clinic", url: "...", content: "...", score: 0.89 }
  ],
  query: "What are the side effects of metformin?",
  results_count: 2,
  response_time: 847
}
       ↓
Return to agent → User
```

### Component Dependencies

```typescript
// External dependency
import { tavily } from '@tavily/core'

// Internal utilities
import { logInfo, logError, logWarn } from '../utils/logger'

// Type definitions
import type {
  SearchOptions,
  SearchResponse,
  SearchImage,
  ExtractResponse,
} from '../types/search'
```

**External Service**: Tavily API (https://tavily.com)
- Requires API key (environment variable)
- Paid service with quota limits
- Provides search + extraction

---

## Configuration & Setup

### Environment Variables

```bash
# .env file
TAVILY_API_KEY=tvly-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Format Requirements**:
- Must start with `tvly-`
- Obtained from Tavily dashboard
- Keep secret (never commit to version control)

**Validation**:
```typescript
function validateApiKey(): void {
  if (!process.env.TAVILY_API_KEY) {
    throw new Error('TAVILY_API_KEY environment variable is not configured')
  }

  if (!process.env.TAVILY_API_KEY.startsWith('tvly-')) {
    logWarn('Tavily API key format appears invalid (should start with tvly-)')
  }
}
```

### Tavily Client Initialization

```typescript
/**
 * Tavily API client instance
 * Initialized with API key from environment variables
 */
const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY || '' })
```

**Initialization Timing**: Module load (singleton pattern).

**Empty String Fallback**: If API key missing, client initialized with empty string:
- Allows module to load without errors
- API calls will fail at runtime with validation error
- Better for development/testing environments

---

## Configuration Constants

### Default Search Options

```typescript
const DEFAULT_SEARCH_OPTIONS: SearchOptions = {
  search_depth: 'basic',
  max_results: 5,
  include_raw_content: false,
  include_images: false,
  include_answer: true,
}
```

**Option Details**:

| Option | Default | Purpose |
|--------|---------|---------|
| `search_depth` | `'basic'` | Search thoroughness (`'basic'` or `'advanced'`) |
| `max_results` | `5` | Number of search results to return |
| `include_raw_content` | `false` | Include full page HTML (expensive) |
| `include_images` | `false` | Include image results |
| `include_answer` | `true` | Include AI-generated direct answer |

**Why These Defaults?**

1. **`search_depth: 'basic'`**: 
   - Faster responses (< 1 second)
   - Lower cost per query
   - Sufficient for most use cases
   - `'advanced'`: Deeper crawling, slower, more expensive

2. **`max_results: 5`**:
   - Balance between coverage and token usage
   - 5 results typically provide sufficient context
   - More results = more tokens in agent context

3. **`include_raw_content: false`**:
   - Raw HTML is verbose and rarely needed
   - Cleaned content is more useful for LLMs
   - Reduces response size significantly

4. **`include_images: false`**:
   - Most queries don't need images
   - Reduces response size
   - Enable explicitly when needed

5. **`include_answer: true`**:
   - **Most valuable feature**: Direct AI answer
   - Saves agent from parsing results
   - Often sufficient without reading full articles

### Quota Limits

```typescript
/**
 * Maximum allowed results to prevent API quota exhaustion
 */
const MAX_RESULTS_LIMIT = 20
```

**Purpose**: Prevent excessive API usage from user/agent requests.

**Enforcement**:
```typescript
if (merged.max_results && merged.max_results > MAX_RESULTS_LIMIT) {
  logWarn(`Requested max_results (${merged.max_results}) exceeds limit, capping at ${MAX_RESULTS_LIMIT}`)
  merged.max_results = MAX_RESULTS_LIMIT
}
```

**Rationale**:
- Tavily charges per search result
- 20 results = 20x cost of 1 result
- Protects budget from runaway queries
- 20 results is more than sufficient for LLM context

---

## Core Type Definitions

### SearchOptions

```typescript
interface SearchOptions {
  search_depth?: 'basic' | 'advanced'
  max_results?: number
  include_raw_content?: boolean
  include_images?: boolean
  include_answer?: boolean
  include_domains?: string[]
  exclude_domains?: string[]
}
```

**Field Descriptions**:

**`search_depth`**: 
- `'basic'` (default): Fast, surface-level search
- `'advanced'`: Deep crawl, slower, more comprehensive

**`max_results`**: 
- Number of search results (1-20)
- Default: 5
- Capped at MAX_RESULTS_LIMIT (20)

**`include_raw_content`**: 
- Include full HTML of pages
- Expensive, rarely needed
- Default: false

**`include_images`**: 
- Include image search results
- Useful for visual queries
- Default: false

**`include_answer`**: 
- Include AI-generated direct answer
- **Highly recommended** for LLM agents
- Default: true

**`include_domains`**: 
- Whitelist specific domains
- Example: `['nih.gov', 'mayoclinic.org']`
- Only search these domains

**`exclude_domains`**: 
- Blacklist specific domains
- Example: `['social-media.com']`
- Exclude from results

### SearchResponse

```typescript
interface SearchResponse {
  answer?: string                // AI-generated direct answer
  results: SearchResult[]        // Array of search results
  images?: SearchImage[]         // Image results (if requested)
  query: string                  // Original search query
  results_count: number          // Number of results returned
  response_time: number          // Response time in milliseconds
}
```

**Example Response**:
```json
{
  "answer": "The capital of France is Paris, located in the north-central part of the country.",
  "results": [
    {
      "title": "Paris - Wikipedia",
      "url": "https://en.wikipedia.org/wiki/Paris",
      "content": "Paris is the capital and most populous city of France...",
      "score": 0.98,
      "raw_content": null
    },
    {
      "title": "Visit Paris - Official Tourism Site",
      "url": "https://en.parisinfo.com/",
      "content": "Paris, the capital of France, is a major European city...",
      "score": 0.92,
      "raw_content": null
    }
  ],
  "query": "What is the capital of France?",
  "results_count": 2,
  "response_time": 687
}
```

### SearchResult

```typescript
interface SearchResult {
  title: string           // Page title
  url: string             // Page URL
  content: string         // Cleaned/extracted text content
  score: number           // Relevance score (0-1)
  raw_content?: string    // Full HTML (if requested)
}
```

**Score Interpretation**:
- `0.9 - 1.0`: Highly relevant (exact match)
- `0.7 - 0.9`: Very relevant
- `0.5 - 0.7`: Moderately relevant
- `< 0.5`: Less relevant (rarely returned)

### SearchImage

```typescript
interface SearchImage {
  url: string             // Image URL
  description: string     // Image description/alt text
}
```

### ExtractResponse

```typescript
interface ExtractResponse {
  url: string             // Source URL
  content: string         // Extracted text content
  title?: string          // Page title
  status_code: number     // HTTP status code
  success: boolean        // Extraction success flag
  error?: string          // Error message (if failed)
}
```

**Example Success Response**:
```json
{
  "url": "https://example.com/article",
  "content": "Full article text content goes here...",
  "title": "Article Title",
  "status_code": 200,
  "success": true
}
```

**Example Error Response**:
```json
{
  "url": "https://example.com/broken",
  "content": "",
  "status_code": 500,
  "success": false,
  "error": "Failed to fetch URL: Connection timeout"
}
```

---

## Validation Functions

### validateApiKey

```typescript
function validateApiKey(): void {
  if (!process.env.TAVILY_API_KEY) {
    throw new Error('TAVILY_API_KEY environment variable is not configured')
  }

  if (!process.env.TAVILY_API_KEY.startsWith('tvly-')) {
    logWarn('Tavily API key format appears invalid (should start with tvly-)')
  }
}
```

**Purpose**: Ensure API key is configured before making requests.

**Validation Levels**:
1. **Presence Check**: Key exists (throws error if missing)
2. **Format Check**: Key starts with `tvly-` (logs warning if invalid)

**Why Warning vs Error?**
- Format check is non-fatal (key might still work)
- Allows flexibility for test/dev environments
- User informed of potential issue

**Called By**: 
- `searchWeb()` - Before every search
- `extractContent()` - Before every extraction

### validateQuery

```typescript
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
```

**Validation Rules**:

1. **Type Check**: Must be string
   ```typescript
   validateQuery(null)      // ❌ Error
   validateQuery(undefined) // ❌ Error
   validateQuery(123)       // ❌ Error
   ```

2. **Empty Check**: Cannot be empty/whitespace
   ```typescript
   validateQuery('')        // ❌ Error
   validateQuery('   ')     // ❌ Error
   validateQuery('paris')   // ✅ Valid
   ```

3. **Length Check**: Max 400 characters
   ```typescript
   const longQuery = 'a'.repeat(401)
   validateQuery(longQuery) // ❌ Error
   ```

**Why 400 Character Limit?**
- Tavily API recommendations
- Prevents excessive token usage
- Most meaningful queries are < 100 characters
- Protects against accidental large inputs

### validateSearchOptions

```typescript
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
```

**Purpose**: Merge user options with defaults and enforce constraints.

**Validation Steps**:

**Step 1: Merge with Defaults**
```typescript
const merged = { ...DEFAULT_SEARCH_OPTIONS, ...options }
// User options override defaults
```

**Step 2: Cap max_results**
```typescript
// User requests 50 results → cap at 20
if (merged.max_results > MAX_RESULTS_LIMIT) {
  merged.max_results = MAX_RESULTS_LIMIT
}
```

**Step 3: Ensure Positive Number**
```typescript
// User requests -5 or 0 → use default (5)
if (merged.max_results < 1) {
  merged.max_results = DEFAULT_SEARCH_OPTIONS.max_results
}
```

**Step 4: Validate Enum Values**
```typescript
// User requests 'super-deep' → use default ('basic')
if (!['basic', 'advanced'].includes(merged.search_depth)) {
  merged.search_depth = DEFAULT_SEARCH_OPTIONS.search_depth
}
```

**Philosophy**: **Graceful Degradation**
- Invalid options → fallback to defaults
- Log warnings (for debugging)
- Never throw errors for options
- Ensures requests always succeed (if query valid)

### validateUrl

```typescript
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
```

**Purpose**: Validate URL format before content extraction.

**Validation Rules**:

1. **Type Check**: Must be string
2. **Format Check**: Must be valid URL
3. **Protocol Check**: Must be http/https

**Examples**:
```typescript
validateUrl('https://example.com')        // ✅ Valid
validateUrl('http://example.com/article') // ✅ Valid
validateUrl('ftp://example.com')          // ❌ Error (wrong protocol)
validateUrl('not-a-url')                  // ❌ Error (invalid format)
validateUrl('file:///etc/passwd')         // ❌ Error (wrong protocol)
```

**Security**: Protocol check prevents:
- File system access (`file://`)
- Arbitrary protocols (`javascript:`, `data:`)
- Local network scanning

---

## Public API Methods

### searchWeb

```typescript
export async function searchWeb(
  query: string,
  options?: SearchOptions
): Promise<SearchResponse>
```

**Purpose**: Perform web search with AI-generated answer.

**Parameters**:
- `query` - Search query string (1-400 characters)
- `options` - Optional search configuration

**Returns**: `SearchResponse` with answer and results.

**Throws**: Error if API key not configured or search fails.

#### Implementation Flow

**Step 1: Validate Inputs**
```typescript
validateApiKey()
validateQuery(query)
const validatedOptions = validateSearchOptions(options)
```

**Step 2: Log Request**
```typescript
logInfo('Initiating Tavily web search', {
  query: query.substring(0, 100), // Log truncated query for privacy
  options: validatedOptions,
})
```

**Why Truncate Query?**
- Privacy: Queries might contain sensitive info
- Log size: Prevents massive log entries
- Sufficient for debugging (100 chars usually enough)

**Step 3: Call Tavily API**
```typescript
const response = await tavilyClient.search(query, validatedOptions)
```

**Step 4: Transform Response**
```typescript
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
```

**Transformation Logic**:
- Normalize field names (camelCase → snake_case in some cases)
- Handle undefined values (provide defaults)
- Calculate metrics (results_count, response_time)
- Ensure type safety

**Step 5: Log Success**
```typescript
logInfo('Tavily search completed successfully', {
  query: query.substring(0, 100),
  results_count: response.results?.length || 0,
  has_answer: !!response.answer,
  response_time_ms: responseTime,
})
```

**Step 6: Error Handling**
```typescript
catch (error) {
  logError('Tavily search failed', error, {
    query: query.substring(0, 100),
    response_time_ms: responseTime,
  })

  // Re-throw with context
  if (error instanceof Error) {
    throw new Error(`Web search failed: ${error.message}`)
  }
  throw new Error('Web search failed: Unknown error')
}
```

**Error Strategy**: **Fail Fast**
- Don't return partial results
- Throw descriptive error
- Let caller handle error (agent can retry or inform user)

#### Usage Examples

**Example 1: Simple Search**
```typescript
const results = await searchWeb('What is the capital of France?')

console.log(results.answer)
// "The capital of France is Paris, located in the north-central part of the country."

console.log(results.results[0])
// {
//   title: "Paris - Wikipedia",
//   url: "https://en.wikipedia.org/wiki/Paris",
//   content: "Paris is the capital and most populous city...",
//   score: 0.98
// }
```

**Example 2: Custom Options**
```typescript
const results = await searchWeb(
  'metformin side effects',
  {
    search_depth: 'advanced',     // Deep search
    max_results: 10,              // More results
    include_domains: [            // Medical sources only
      'nih.gov',
      'mayoclinic.org',
      'webmd.com'
    ]
  }
)

console.log(results.results_count) // 10
console.log(results.response_time) // ~2000ms (advanced is slower)
```

**Example 3: Image Search**
```typescript
const results = await searchWeb(
  'healthy meal ideas',
  {
    include_images: true,
    max_results: 3
  }
)

console.log(results.images?.length) // ~10 images
console.log(results.images[0])
// {
//   url: "https://example.com/image.jpg",
//   description: "Healthy salad bowl with vegetables"
// }
```

**Example 4: Error Handling**
```typescript
try {
  const results = await searchWeb('python tutorial')
} catch (error) {
  if (error.message.includes('TAVILY_API_KEY')) {
    console.error('API key not configured')
  } else if (error.message.includes('quota')) {
    console.error('API quota exceeded')
  } else {
    console.error('Search failed:', error.message)
  }
}
```

#### Integration with Tools

**In tools.ts**:
```typescript
import { searchWeb } from './tavilyService'

export const webSearchTool = {
  type: 'function' as const,
  function: {
    name: 'web_search',
    description: 'Search the web for current information',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query'
        }
      },
      required: ['query']
    }
  },
  execute: async (args: { query: string }) => {
    const results = await searchWeb(args.query, {
      max_results: 5,
      include_answer: true
    })
    
    // Format for agent
    return {
      answer: results.answer,
      sources: results.results.map(r => ({
        title: r.title,
        url: r.url,
        snippet: r.content.substring(0, 200)
      }))
    }
  }
}
```

---

### extractContent

```typescript
export async function extractContent(url: string): Promise<ExtractResponse>
```

**Purpose**: Extract clean text content from a specific URL.

**Parameters**:
- `url` - URL to extract content from (must be http/https)

**Returns**: `ExtractResponse` with extracted content.

**Never Throws**: Returns error response instead of throwing.

#### Implementation Flow

**Step 1: Validate Inputs**
```typescript
validateApiKey()
validateUrl(url)
```

**Step 2: Log Request**
```typescript
logInfo('Initiating Tavily content extraction', {
  url: url.substring(0, 100), // Truncate URL for logging
})
```

**Step 3: Call Tavily API**
```typescript
const response = await tavilyClient.extract([url])
const extractedData = response.results?.[0] || null
```

**Why Array Parameter?**
- Tavily `extract()` accepts array of URLs
- Can extract multiple URLs in one call
- We only use single URL extraction
- Batch extraction could be added later

**Step 4: Validate Response**
```typescript
if (!extractedData) {
  throw new Error('No content extracted from URL')
}
```

**Step 5: Transform Response**
```typescript
const extractResponse: ExtractResponse = {
  url,
  content: extractedData.rawContent || '',
  title: extractedData.url || undefined,
  status_code: 200,
  success: true,
}
```

**Step 6: Error Handling (Different from searchWeb)**
```typescript
catch (error) {
  logError('Tavily content extraction failed', error, {
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
```

**Why Different Error Strategy?**
- **searchWeb**: Throws errors (search is critical)
- **extractContent**: Returns error response (extraction is optional)
- Allows caller to gracefully handle failed extractions
- Agent can continue without extraction content

#### Usage Examples

**Example 1: Successful Extraction**
```typescript
const result = await extractContent('https://example.com/article')

if (result.success) {
  console.log('Title:', result.title)
  console.log('Content length:', result.content.length)
  console.log('Preview:', result.content.substring(0, 200))
}
```

**Example 2: Failed Extraction**
```typescript
const result = await extractContent('https://broken-site.com/page')

if (!result.success) {
  console.error('Extraction failed:', result.error)
  console.log('Status:', result.status_code)
  // Continue without content
}
```

**Example 3: Agent Integration**
```typescript
// Agent wants to read full article
const searchResults = await searchWeb('climate change effects')
const topResult = searchResults.results[0]

// Extract full content
const content = await extractContent(topResult.url)

if (content.success) {
  // Use full article content for detailed analysis
  const summary = await agent.summarize(content.content)
} else {
  // Fall back to search snippet
  const summary = await agent.summarize(topResult.content)
}
```

**Example 4: Batch Extraction (Future)**
```typescript
// Current: One URL at a time
const content1 = await extractContent(url1)
const content2 = await extractContent(url2)

// Future: Batch extraction
async function extractMultiple(urls: string[]): Promise<ExtractResponse[]> {
  const response = await tavilyClient.extract(urls)
  return response.results.map((data, i) => ({
    url: urls[i],
    content: data.rawContent || '',
    success: !!data.rawContent,
    status_code: 200,
  }))
}
```

---

### isConfigured

```typescript
export function isConfigured(): boolean
```

**Purpose**: Check if Tavily API is properly configured.

**Returns**: `true` if API key present and valid format, `false` otherwise.

**Use Cases**:
1. **Startup Validation**: Check configuration on server start
2. **Feature Availability**: Disable web search UI if not configured
3. **Tool Registration**: Only register web search tool if configured

#### Implementation

```typescript
export function isConfigured(): boolean {
  return !!(process.env.TAVILY_API_KEY && process.env.TAVILY_API_KEY.startsWith('tvly-'))
}
```

**Logic**:
- Check key exists
- Check key format (starts with `tvly-`)
- Double negation (`!!`) converts to boolean

#### Usage Examples

**Example 1: Conditional Tool Registration**
```typescript
import { isConfigured } from './tavilyService'

const tools = []

// Only add web search if configured
if (isConfigured()) {
  tools.push(webSearchTool)
  tools.push(urlExtractTool)
}

export default tools
```

**Example 2: Startup Validation**
```typescript
// server.ts
import { isConfigured } from './logic/tavilyService'

if (!isConfigured()) {
  logWarn('Tavily API not configured - web search disabled')
} else {
  logInfo('Tavily API configured - web search enabled')
}
```

**Example 3: API Endpoint Guard**
```typescript
router.post('/search', async (req, res) => {
  if (!isConfigured()) {
    return res.status(503).json({
      error: 'Web search not available',
      message: 'Tavily API is not configured'
    })
  }

  const results = await searchWeb(req.body.query)
  res.json(results)
})
```

---

### getStatus

```typescript
export function getStatus(): {
  configured: boolean
  api_key_present: boolean
  api_key_format_valid: boolean
}
```

**Purpose**: Get detailed configuration status for debugging.

**Returns**: Object with configuration details.

#### Implementation

```typescript
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
```

**Status Fields**:

| Field | Description | Example |
|-------|-------------|---------|
| `configured` | Overall status (ready to use) | `true` |
| `api_key_present` | Key exists in environment | `true` |
| `api_key_format_valid` | Key format correct | `true` |

#### Status Combinations

**Fully Configured** ✅:
```json
{
  "configured": true,
  "api_key_present": true,
  "api_key_format_valid": true
}
```

**Missing API Key** ❌:
```json
{
  "configured": false,
  "api_key_present": false,
  "api_key_format_valid": false
}
```

**Invalid Format** ⚠️:
```json
{
  "configured": false,
  "api_key_present": true,
  "api_key_format_valid": false
}
```

#### Usage Examples

**Example 1: Health Check Endpoint**
```typescript
router.get('/health/tavily', (req, res) => {
  const status = getStatus()
  
  if (status.configured) {
    res.json({ status: 'healthy', ...status })
  } else {
    res.status(503).json({ status: 'unavailable', ...status })
  }
})
```

**Example 2: Debugging**
```typescript
import { getStatus } from './tavilyService'

console.log('Tavily Status:', getStatus())

if (!getStatus().api_key_format_valid) {
  console.error('API key format invalid - should start with "tvly-"')
}
```

**Example 3: Admin Dashboard**
```typescript
// Show configuration status in admin UI
const tavilyStatus = getStatus()

<ServiceStatus
  name="Tavily API"
  configured={tavilyStatus.configured}
  details={tavilyStatus}
/>
```

---

## Logging & Metrics

### Request Logging

**Search Request**:
```typescript
logInfo('Initiating Tavily web search', {
  query: query.substring(0, 100),
  options: validatedOptions,
})
```

**Success Logging**:
```typescript
logInfo('Tavily search completed successfully', {
  query: query.substring(0, 100),
  results_count: response.results?.length || 0,
  has_answer: !!response.answer,
  response_time_ms: responseTime,
})
```

**Error Logging**:
```typescript
logError('Tavily search failed', error, {
  query: query.substring(0, 100),
  response_time_ms: responseTime,
})
```

### Logged Metrics

**Performance Metrics**:
- `response_time_ms` - API call duration
- `results_count` - Number of results returned

**Result Metrics**:
- `has_answer` - Whether AI answer was generated
- `content_length` - Size of extracted content

**Privacy Protection**:
- Queries truncated to 100 characters
- URLs truncated to 100 characters
- Never log full API keys

### Response Time Tracking

```typescript
const startTime = Date.now()

try {
  // ... API call ...
  
  const responseTime = Date.now() - startTime
  
  logInfo('Completed', {
    response_time_ms: responseTime
  })
} catch (error) {
  const responseTime = Date.now() - startTime
  
  logError('Failed', error, {
    response_time_ms: responseTime  // Log even on error
  })
}
```

**Why Track Failed Requests?**
- Identify slow failures (timeouts)
- Monitor API performance issues
- Debugging (slow = network, fast = validation)

---

## Error Handling Strategies

### Strategy 1: Fail Fast (searchWeb)

```typescript
export async function searchWeb(
  query: string,
  options?: SearchOptions
): Promise<SearchResponse> {
  try {
    validateApiKey()
    validateQuery(query)
    // ... perform search ...
    return searchResponse
  } catch (error) {
    logError('Tavily search failed', error)
    throw new Error(`Web search failed: ${error.message}`)
  }
}
```

**Why Throw?**
- Search is critical operation
- No point continuing without results
- Agent needs to know search failed
- Can retry with different query

**Caller Handling**:
```typescript
try {
  const results = await searchWeb(query)
  // Use results
} catch (error) {
  // Inform user search failed
  return "I couldn't search the web at this time."
}
```

### Strategy 2: Graceful Degradation (extractContent)

```typescript
export async function extractContent(url: string): Promise<ExtractResponse> {
  try {
    validateApiKey()
    validateUrl(url)
    // ... extract content ...
    return { success: true, content, ... }
  } catch (error) {
    logError('Tavily content extraction failed', error)
    
    // Return error response instead of throwing
    return {
      url,
      content: '',
      status_code: 500,
      success: false,
      error: error.message,
    }
  }
}
```

**Why Return Error?**
- Extraction is optional operation
- Agent can continue without full content
- Still have search result snippet
- Better UX (partial failure)

**Caller Handling**:
```typescript
const content = await extractContent(url)

if (content.success) {
  // Use full content
  analyzeFullArticle(content.content)
} else {
  // Use snippet from search results
  analyzeSnippet(searchResult.content)
}
```

### Strategy 3: Validation Errors (Immediate)

```typescript
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
```

**Why Throw Immediately?**
- Invalid input = programmer error
- No point making API call
- Fast feedback
- Clear error messages

### Strategy 4: Option Validation (Graceful)

```typescript
function validateSearchOptions(options?: SearchOptions): SearchOptions {
  const merged = { ...DEFAULT_SEARCH_OPTIONS, ...options }

  if (merged.max_results && merged.max_results > MAX_RESULTS_LIMIT) {
    logWarn(`Requested max_results exceeds limit, capping`)
    merged.max_results = MAX_RESULTS_LIMIT
  }

  // Don't throw - just fix and continue
  return merged
}
```

**Why Not Throw?**
- Options are optional
- Can automatically fix invalid options
- Better UX (request succeeds)
- User still gets results

---

## Best Practices

### 1. Always Validate API Key First

```typescript
// ✅ GOOD: Validate before API call
export async function searchWeb(query: string) {
  validateApiKey()  // Throws if not configured
  validateQuery(query)
  // ... API call ...
}

// ❌ BAD: Skip validation
export async function searchWeb(query: string) {
  // API call will fail with cryptic error
  const response = await tavilyClient.search(query)
}
```

### 2. Use include_answer for LLM Agents

```typescript
// ✅ GOOD: Get AI answer (most useful for agents)
const results = await searchWeb(query, {
  include_answer: true,  // Default, but explicit is better
  max_results: 3
})

if (results.answer) {
  return results.answer  // Direct answer, no parsing needed
}

// ⚠️ ACCEPTABLE: Parse results manually
const results = await searchWeb(query, {
  include_answer: false,
  max_results: 5
})

// Agent must parse results[0].content
```

### 3. Limit Results for Token Efficiency

```typescript
// ✅ GOOD: Request only what you need
const results = await searchWeb(query, {
  max_results: 3  // Usually sufficient
})

// ❌ BAD: Request too many
const results = await searchWeb(query, {
  max_results: 20  // Wastes tokens and money
})
```

**Token Impact**:
- 1 result ≈ 200-500 tokens
- 5 results ≈ 1000-2500 tokens
- 20 results ≈ 4000-10000 tokens (might exceed context!)

### 4. Use Domain Filtering for Reliability

```typescript
// ✅ GOOD: Medical query - restrict to trusted sources
const results = await searchWeb('metformin side effects', {
  include_domains: [
    'nih.gov',
    'mayoclinic.org',
    'webmd.com',
    'drugs.com'
  ]
})

// ✅ GOOD: Technical query - exclude forums
const results = await searchWeb('python asyncio tutorial', {
  exclude_domains: [
    'stackoverflow.com',  // Exclude if you want official docs
    'reddit.com'
  ]
})
```

### 5. Handle Extraction Failures Gracefully

```typescript
// ✅ GOOD: Check success, fallback to snippet
const fullContent = await extractContent(url)

if (fullContent.success) {
  processContent(fullContent.content)
} else {
  // Use search result snippet as fallback
  processContent(searchResult.content)
}

// ❌ BAD: Assume success
const fullContent = await extractContent(url)
processContent(fullContent.content)  // Might be empty!
```

### 6. Log Truncated Queries for Privacy

```typescript
// ✅ GOOD: Truncate sensitive data
logInfo('Search request', {
  query: query.substring(0, 100),  // Truncate
  user_id: userId
})

// ❌ BAD: Log full query
logInfo('Search request', {
  query: query,  // Might contain PII!
  user_id: userId
})
```

### 7. Monitor Response Times

```typescript
// ✅ GOOD: Track performance
const startTime = Date.now()

const results = await searchWeb(query)

const responseTime = Date.now() - startTime

if (responseTime > 5000) {
  logWarn('Slow search', { response_time_ms: responseTime })
}
```

**Expected Response Times**:
- Basic search: 500-1500ms
- Advanced search: 1500-3000ms
- Extraction: 1000-2000ms
- > 5000ms: Investigate (network issues?)

---

## Integration Patterns

### Pattern 1: Tool Calling (Primary Use Case)

```typescript
// tools.ts
import { searchWeb } from './tavilyService'

export const webSearchTool = {
  type: 'function' as const,
  function: {
    name: 'web_search',
    description: 'Search the web for current information. Use this when you need up-to-date facts, news, or information not in your training data.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query. Be specific and concise.'
        }
      },
      required: ['query']
    }
  },
  execute: async (args: { query: string }) => {
    try {
      const results = await searchWeb(args.query, {
        max_results: 5,
        include_answer: true
      })
      
      // Format for agent consumption
      return {
        answer: results.answer || 'No direct answer available',
        sources: results.results.slice(0, 3).map(r => ({
          title: r.title,
          url: r.url,
          snippet: r.content.substring(0, 200) + '...',
          score: r.score
        })),
        search_time: results.response_time
      }
    } catch (error) {
      return {
        error: 'Web search failed',
        message: error.message
      }
    }
  }
}
```

**Agent Flow**:
```
User: "What are the side effects of metformin?"
  ↓
Agent decides to use web_search tool
  ↓
Tool calls searchWeb('metformin side effects')
  ↓
Tavily returns answer + sources
  ↓
Tool formats response for agent
  ↓
Agent: "According to WebMD, metformin side effects include..."
```

### Pattern 2: Direct Route Endpoint

```typescript
// routes/searchRouter.ts
import { searchWeb, extractContent } from '../logic/tavilyService'

router.post('/search', async (req, res) => {
  try {
    const { query, options } = req.body
    
    const results = await searchWeb(query, options)
    
    res.json(results)
  } catch (error) {
    res.status(500).json({
      error: 'Search failed',
      message: error.message
    })
  }
})

router.post('/extract', async (req, res) => {
  const { url } = req.body
  
  const result = await extractContent(url)
  
  if (result.success) {
    res.json(result)
  } else {
    res.status(result.status_code).json(result)
  }
})
```

### Pattern 3: Eldercare Context Enhancement

```typescript
// eldercareContextService.ts
import { searchWeb } from './tavilyService'

export async function enhanceWithWebSearch(
  query: string,
  eldercareData: any
): Promise<string> {
  
  // Search for current medical information
  const webResults = await searchWeb(query, {
    max_results: 3,
    include_answer: true,
    include_domains: ['nih.gov', 'mayoclinic.org']
  })
  
  // Combine eldercare data with web search
  return `
Eldercare Context:
${JSON.stringify(eldercareData, null, 2)}

Current Medical Information:
${webResults.answer}

Sources:
${webResults.results.map(r => `- ${r.title}: ${r.url}`).join('\n')}
  `
}
```

**Use Case**: Provider lookup, medication interactions, appointment scheduling.

---

## Testing Strategies

### Unit Tests

```typescript
import { searchWeb, extractContent, isConfigured, getStatus } from './tavilyService'

describe('tavilyService', () => {
  describe('isConfigured', () => {
    it('returns true when API key is valid', () => {
      process.env.TAVILY_API_KEY = 'tvly-test123'
      expect(isConfigured()).toBe(true)
    })

    it('returns false when API key is missing', () => {
      delete process.env.TAVILY_API_KEY
      expect(isConfigured()).toBe(false)
    })

    it('returns false when API key format is invalid', () => {
      process.env.TAVILY_API_KEY = 'invalid-key'
      expect(isConfigured()).toBe(false)
    })
  })

  describe('getStatus', () => {
    it('returns correct status when configured', () => {
      process.env.TAVILY_API_KEY = 'tvly-test123'
      
      const status = getStatus()
      
      expect(status.configured).toBe(true)
      expect(status.api_key_present).toBe(true)
      expect(status.api_key_format_valid).toBe(true)
    })

    it('returns correct status when not configured', () => {
      delete process.env.TAVILY_API_KEY
      
      const status = getStatus()
      
      expect(status.configured).toBe(false)
      expect(status.api_key_present).toBe(false)
      expect(status.api_key_format_valid).toBe(false)
    })
  })

  describe('searchWeb', () => {
    beforeEach(() => {
      process.env.TAVILY_API_KEY = 'tvly-test123'
    })

    it('throws error when query is empty', async () => {
      await expect(searchWeb('')).rejects.toThrow('Search query cannot be empty')
    })

    it('throws error when query is too long', async () => {
      const longQuery = 'a'.repeat(401)
      await expect(searchWeb(longQuery)).rejects.toThrow('Search query is too long')
    })

    it('merges custom options with defaults', async () => {
      // Mock tavilyClient.search
      const mockSearch = jest.spyOn(tavilyClient, 'search').mockResolvedValue({
        results: [],
        answer: 'Test answer'
      })

      await searchWeb('test query', { max_results: 10 })

      expect(mockSearch).toHaveBeenCalledWith(
        'test query',
        expect.objectContaining({
          max_results: 10,
          search_depth: 'basic',  // Default
          include_answer: true,   // Default
        })
      )
    })

    it('caps max_results at limit', async () => {
      const mockSearch = jest.spyOn(tavilyClient, 'search').mockResolvedValue({
        results: []
      })

      await searchWeb('test', { max_results: 50 })

      expect(mockSearch).toHaveBeenCalledWith(
        'test',
        expect.objectContaining({
          max_results: 20  // Capped at MAX_RESULTS_LIMIT
        })
      )
    })
  })

  describe('extractContent', () => {
    beforeEach(() => {
      process.env.TAVILY_API_KEY = 'tvly-test123'
    })

    it('throws error for invalid URL', async () => {
      await expect(extractContent('not-a-url')).rejects.toThrow('Invalid URL format')
    })

    it('throws error for non-http protocol', async () => {
      await expect(extractContent('ftp://example.com')).rejects.toThrow('URL must use HTTP or HTTPS protocol')
    })

    it('returns error response on extraction failure', async () => {
      jest.spyOn(tavilyClient, 'extract').mockRejectedValue(new Error('Network error'))

      const result = await extractContent('https://example.com')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Network error')
      expect(result.status_code).toBe(500)
    })

    it('returns success response on successful extraction', async () => {
      jest.spyOn(tavilyClient, 'extract').mockResolvedValue({
        results: [{
          rawContent: 'Article content here',
          url: 'https://example.com'
        }]
      })

      const result = await extractContent('https://example.com')

      expect(result.success).toBe(true)
      expect(result.content).toBe('Article content here')
      expect(result.status_code).toBe(200)
    })
  })
})
```

### Integration Tests

```typescript
describe('tavilyService integration', () => {
  // Skip if no API key configured
  const skipIfNotConfigured = () => {
    if (!isConfigured()) {
      console.log('Skipping integration tests - Tavily not configured')
      return true
    }
    return false
  }

  it('performs real web search', async () => {
    if (skipIfNotConfigured()) return

    const results = await searchWeb('capital of France', {
      max_results: 3
    })

    expect(results.answer).toBeDefined()
    expect(results.answer).toContain('Paris')
    expect(results.results.length).toBeGreaterThan(0)
    expect(results.results[0].score).toBeGreaterThan(0.7)
  })

  it('extracts content from URL', async () => {
    if (skipIfNotConfigured()) return

    const result = await extractContent('https://example.com')

    expect(result.success).toBe(true)
    expect(result.content.length).toBeGreaterThan(0)
  })

  it('handles advanced search', async () => {
    if (skipIfNotConfigured()) return

    const results = await searchWeb('quantum computing applications', {
      search_depth: 'advanced',
      max_results: 5
    })

    expect(results.results.length).toBeLessThanOrEqual(5)
    expect(results.response_time).toBeGreaterThan(1000) // Advanced is slower
  })
})
```

---

## Performance Considerations

### API Costs

**Tavily Pricing** (example - check current pricing):
- Basic search: ~$0.002 per search
- Advanced search: ~$0.005 per search
- Per result: +$0.0004 per result
- Extraction: ~$0.001 per URL

**Cost Examples**:
```typescript
// Low cost (~$0.004)
await searchWeb(query, { 
  search_depth: 'basic',
  max_results: 5
})

// High cost (~$0.013)
await searchWeb(query, {
  search_depth: 'advanced',
  max_results: 20
})
```

### Token Usage

**Search Result Size**:
- Answer: ~50-200 tokens
- Each result: ~200-500 tokens
- Images: ~20-50 tokens per image

**Context Impact**:
```typescript
// Minimal tokens (~750)
const results = await searchWeb(query, {
  max_results: 3,
  include_answer: true,
  include_images: false
})

// Large tokens (~3500)
const results = await searchWeb(query, {
  max_results: 10,
  include_answer: true,
  include_images: true,
  include_raw_content: true
})
```

### Response Times

**Expected Latency**:
- Basic search: 500-1500ms
- Advanced search: 1500-3000ms
- Content extraction: 1000-2000ms
- Batch extraction (5 URLs): 2000-4000ms

**Optimization Strategies**:
1. Use `basic` search depth (default)
2. Limit `max_results` to 3-5
3. Disable `include_raw_content`
4. Cache frequent queries (future enhancement)

---

## Future Enhancements

### 1. Response Caching

```typescript
// Cache search results for common queries
const searchCache = new Map<string, { results: SearchResponse, timestamp: number }>()
const CACHE_TTL = 3600000 // 1 hour

export async function searchWebCached(
  query: string,
  options?: SearchOptions
): Promise<SearchResponse> {
  const cacheKey = `${query}:${JSON.stringify(options)}`
  const cached = searchCache.get(cacheKey)
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.results
  }
  
  const results = await searchWeb(query, options)
  searchCache.set(cacheKey, { results, timestamp: Date.now() })
  
  return results
}
```

### 2. Batch Extraction

```typescript
export async function extractMultipleUrls(urls: string[]): Promise<ExtractResponse[]> {
  // Validate all URLs first
  urls.forEach(validateUrl)
  
  // Tavily supports batch extraction
  const response = await tavilyClient.extract(urls)
  
  return response.results.map((data, i) => ({
    url: urls[i],
    content: data.rawContent || '',
    title: data.url,
    status_code: 200,
    success: !!data.rawContent,
  }))
}
```

### 3. Search Result Filtering

```typescript
export interface FilterOptions {
  minScore?: number       // Minimum relevance score
  maxAge?: number         // Max days old
  requiredTerms?: string[] // Must contain these terms
}

export async function searchWebFiltered(
  query: string,
  options?: SearchOptions,
  filters?: FilterOptions
): Promise<SearchResponse> {
  const results = await searchWeb(query, options)
  
  // Apply filters
  results.results = results.results.filter(result => {
    if (filters?.minScore && result.score < filters.minScore) return false
    if (filters?.requiredTerms) {
      const text = `${result.title} ${result.content}`.toLowerCase()
      if (!filters.requiredTerms.every(term => text.includes(term.toLowerCase()))) {
        return false
      }
    }
    return true
  })
  
  results.results_count = results.results.length
  return results
}
```

### 4. Quota Monitoring

```typescript
let searchCount = 0
let extractCount = 0

export function getQuotaUsage() {
  return {
    searches: searchCount,
    extractions: extractCount,
    estimated_cost: (searchCount * 0.002) + (extractCount * 0.001)
  }
}

export function resetQuotaUsage() {
  searchCount = 0
  extractCount = 0
}

// Track in searchWeb and extractContent
searchCount++
extractCount++
```

---

## Summary

The **Tavily Service** provides web search and content extraction capabilities:

**Core Features**:
- **AI-Powered Search**: Direct answers + ranked results
- **Content Extraction**: Full text from URLs
- **Smart Validation**: Query, URL, options validation
- **Quota Protection**: Max result limits, input constraints
- **Comprehensive Logging**: Metrics, errors, privacy-aware

**Public API** (5 methods):
1. `searchWeb(query, options?)` - Web search with AI answer
2. `extractContent(url)` - Extract content from URL
3. `isConfigured()` - Check if API key configured
4. `getStatus()` - Detailed configuration status
5. `DEFAULT_SEARCH_OPTIONS` - Default configuration

**Configuration**:
- `TAVILY_API_KEY` environment variable (starts with `tvly-`)
- Default: 5 results, basic search, answer included
- Limit: 20 results maximum (quota protection)

**Error Handling**:
- **searchWeb**: Throws errors (fail fast)
- **extractContent**: Returns error response (graceful)
- **Validation**: Immediate errors for invalid input
- **Options**: Automatic fixing with warnings

**Integration**:
- Primary: Tool calling (web_search function)
- Secondary: Direct API endpoints
- Tertiary: Eldercare context enhancement

**Best Practices**:
- Always validate API key first
- Use `include_answer: true` for agents
- Limit results (3-5 sufficient)
- Use domain filtering for reliability
- Handle extraction failures gracefully
- Log truncated queries for privacy

**Production Status**: Fully implemented with comprehensive validation, error handling, and logging. Ready for production use with proper API key configuration.

