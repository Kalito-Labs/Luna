# Search Router Documentation

## Overview

The `searchRouter.ts` file implements web search and content extraction capabilities using the **Tavily API**. Tavily is an AI-powered search engine optimized for LLM applications, providing accurate, real-time web information with built-in summarization.

**Location**: `/backend/routes/searchRouter.ts`

**Mounted At**: `/api/search`

**Created**: Part of search integration feature

**Purpose**:
- Perform web searches with AI-generated answers
- Extract content from specific URLs
- Provide real-time information for AI conversations
- Support fact-checking and research queries
- Enable context-aware search with domain filtering

**Key Features**:
- **AI-Powered Search**: Tavily provides AI-optimized search results
- **Answer Generation**: Get direct answers to questions
- **Content Extraction**: Extract clean text from web pages
- **Advanced Options**: Control search depth, result count, domain filters
- **Rate Limiting**: Prevent API quota exhaustion
- **Validation**: Comprehensive input validation
- **Error Handling**: Graceful error handling with detailed logging

---

## Architecture

### Dependencies

```typescript
import { Router, type Request, type Response } from 'express'
import { searchWeb, extractContent, getStatus } from '../logic/tavilyService'
import { validateBody } from '../middleware/validation'
import { generalRateLimit } from '../middleware/security'
import { asyncHandler } from '../middleware/errorMiddleware'
import { logInfo } from '../utils/logger'
import type { SearchRequest, ExtractRequest } from '../types/search'
import { z } from 'zod'
```

**Key Dependencies**:
- **Tavily Service**: Core search and extraction logic
- **Zod**: Request body validation
- **Middleware**: Rate limiting, validation, error handling
- **Logger**: Request logging and monitoring

**External Service**:
- **Tavily API** (`@tavily/core`): Third-party search API
- Requires `TAVILY_API_KEY` environment variable

---

## Service Layer Architecture

### Tavily Service (`tavilyService.ts`)

**Location**: `/backend/logic/tavilyService.ts`

**Functions**:
- `searchWeb(query, options)`: Perform web search
- `extractContent(url)`: Extract content from URL
- `getStatus()`: Check API configuration status
- `isConfigured()`: Check if API key is valid

**Default Configuration**:
```typescript
const DEFAULT_SEARCH_OPTIONS = {
  search_depth: 'basic',
  max_results: 5,
  include_raw_content: false,
  include_images: false,
  include_answer: true,
}
```

**Limits**:
- Max query length: 400 characters
- Max results: 20 (enforced in service)
- API key format: Must start with `tvly-`

---

## Type Definitions

### Search Types

**Location**: `/backend/types/search.ts`

```typescript
// Search depth options
type SearchDepth = 'basic' | 'advanced'

// Search options
interface SearchOptions {
  search_depth?: SearchDepth         // 'basic' or 'advanced'
  max_results?: number               // 1-20, default 5
  include_raw_content?: boolean      // Include HTML, default false
  include_images?: boolean           // Include images, default false
  include_answer?: boolean           // Include AI answer, default true
  include_domains?: string[]         // Whitelist domains
  exclude_domains?: string[]         // Blacklist domains
}

// Individual search result
interface SearchResult {
  title: string                      // Page title
  url: string                        // Page URL
  content: string                    // Extracted snippet
  score: number                      // Relevance score (0-1)
  raw_content?: string               // HTML (if requested)
}

// Search image result
interface SearchImage {
  url: string                        // Image URL
  description: string                // Alt text/description
}

// Complete search response
interface SearchResponse {
  answer?: string                    // AI-generated answer
  results: SearchResult[]            // Search results array
  images?: SearchImage[]             // Images (if requested)
  query: string                      // Original query
  results_count: number              // Number of results
  response_time?: number             // Processing time (ms)
}

// Content extraction response
interface ExtractResponse {
  url: string                        // URL extracted
  content: string                    // Extracted text
  title?: string                     // Page title
  status_code: number                // HTTP status
  success: boolean                   // Success flag
  error?: string                     // Error message (if failed)
}
```

---

## Validation Schemas

### Search Request Schema

```typescript
const searchRequestSchema = z.object({
  query: z.string().min(1).max(400),
  options: z.object({
    search_depth: z.enum(['basic', 'advanced']).optional(),
    max_results: z.number().int().min(1).max(20).optional(),
    include_raw_content: z.boolean().optional(),
    include_images: z.boolean().optional(),
    include_answer: z.boolean().optional(),
    include_domains: z.array(z.string()).optional(),
    exclude_domains: z.array(z.string()).optional(),
  }).optional(),
})
```

**Validation Rules**:
- `query`: Required, 1-400 characters
- `search_depth`: Optional, must be 'basic' or 'advanced'
- `max_results`: Optional, 1-20 (service enforces max 20)
- Boolean flags: All optional
- Domain arrays: Optional string arrays

### Extract Request Schema

```typescript
const extractRequestSchema = z.object({
  url: z.string().url(),
})
```

**Validation Rules**:
- `url`: Required, must be valid URL format
- Protocol: Service enforces HTTP/HTTPS only

---

## Middleware

### Rate Limiting

```typescript
if (process.env.NODE_ENV !== 'test') {
  router.use(generalRateLimit)
}
```

**Purpose**: Prevent API quota exhaustion and abuse

**Behavior**:
- Applied to all search endpoints
- Disabled in test environment
- Uses `generalRateLimit` from security middleware

**Recommendation**: Configure appropriate limits based on Tavily API quota

---

## Endpoints

### GET /api/search/status

**Purpose**: Check Tavily API configuration status.

#### Path Parameters

None.

#### Query Parameters

None.

#### Implementation

```typescript
router.get('/status', (_req: Request, res: Response) => {
  const status = getStatus()
  res.json(status)
})
```

**Behavior**:
- Checks if `TAVILY_API_KEY` environment variable is set
- Validates API key format (should start with `tvly-`)
- Returns configuration status

#### Response Format

```typescript
{
  configured: boolean,           // Overall configuration status
  api_key_present: boolean,      // API key environment variable exists
  api_key_format_valid: boolean  // API key has correct format
}
```

#### Example Response (Configured)

```typescript
{
  configured: true,
  api_key_present: true,
  api_key_format_valid: true
}
```

#### Example Response (Not Configured)

```typescript
{
  configured: false,
  api_key_present: false,
  api_key_format_valid: false
}
```

#### Example Request

```typescript
const response = await fetch('/api/search/status')
const status = await response.json()

if (status.configured) {
  console.log('✅ Tavily search is ready')
} else {
  console.log('❌ Tavily API key not configured')
  if (!status.api_key_present) {
    console.log('  - TAVILY_API_KEY environment variable missing')
  }
  if (!status.api_key_format_valid) {
    console.log('  - API key format invalid (should start with tvly-)')
  }
}
```

**Use Case**: Check if search functionality is available before showing search UI

---

### POST /api/search

**Purpose**: Perform a web search with AI-generated answers.

#### Request Body

```typescript
{
  query: string;                   // Required (1-400 chars)
  options?: {
    search_depth?: 'basic' | 'advanced';
    max_results?: number;          // 1-20
    include_raw_content?: boolean;
    include_images?: boolean;
    include_answer?: boolean;
    include_domains?: string[];
    exclude_domains?: string[];
  }
}
```

#### Implementation

```typescript
router.post(
  '/',
  validateBody(searchRequestSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { query, options } = req.body as SearchRequest

    logInfo('Processing web search request', {
      query: query.substring(0, 100),
      has_options: !!options,
    })

    const results = await searchWeb(query, options)

    res.json(results)
  })
)
```

**Search Depth**:
- **`basic`**: Quick search (default, faster, lower cost)
- **`advanced`**: Comprehensive search (slower, more thorough, higher cost)

**Domain Filtering**:
- `include_domains`: Whitelist specific domains (only search these)
- `exclude_domains`: Blacklist domains (exclude from results)

#### Response Format (Success)

```typescript
{
  answer: "AI-generated answer to the query",
  results: [
    {
      title: "Page Title",
      url: "https://example.com/page",
      content: "Relevant excerpt from the page...",
      score: 0.95,
      raw_content: "<html>...</html>"  // If include_raw_content: true
    },
    // ... more results
  ],
  images: [  // If include_images: true
    {
      url: "https://example.com/image.jpg",
      description: "Image description"
    }
  ],
  query: "original search query",
  results_count: 5,
  response_time: 1234  // milliseconds
}
```

#### Response Format (Error)

```typescript
{
  success: false,
  error: {
    code: "VALIDATION_ERROR",
    message: "Search query is too long (max 400 characters)"
  }
}
```

**HTTP Status**: 400 (validation error), 500 (server error)

#### Example Requests

```typescript
// Minimal search (uses defaults)
const minimal = await fetch('/api/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'What is the capital of France?'
  })
})

const minimalData = await minimal.json()
console.log('Answer:', minimalData.answer)  // "The capital of France is Paris"
console.log('Results:', minimalData.results_count)  // 5 (default)

// Advanced search with options
const advanced = await fetch('/api/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'TypeScript best practices',
    options: {
      search_depth: 'advanced',
      max_results: 10,
      include_answer: true,
      include_images: false,
      exclude_domains: ['w3schools.com']  // Exclude specific domain
    }
  })
})

const advancedData = await advanced.json()
console.log('Answer:', advancedData.answer)
console.log('Results:', advancedData.results.length)  // Up to 10

// Medical search (whitelist trusted domains)
const medical = await fetch('/api/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'Side effects of aspirin',
    options: {
      max_results: 5,
      include_domains: [
        'mayoclinic.org',
        'webmd.com',
        'nih.gov',
        'cdc.gov'
      ]
    }
  })
})

// Search with images
const withImages = await fetch('/api/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'Eiffel Tower',
    options: {
      include_images: true,
      max_results: 3
    }
  })
})

const imageData = await withImages.json()
console.log('Images:', imageData.images?.length)
imageData.images?.forEach(img => {
  console.log(`- ${img.description}: ${img.url}`)
})
```

**Use Case**: Provide real-time information to AI conversations, fact-checking, research

---

### POST /api/search/extract

**Purpose**: Extract clean text content from a specific URL.

#### Request Body

```typescript
{
  url: string  // Required (valid URL)
}
```

#### Implementation

```typescript
router.post(
  '/extract',
  validateBody(extractRequestSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { url } = req.body as ExtractRequest

    logInfo('Processing content extraction request', {
      url: url.substring(0, 100),
    })

    const result = await extractContent(url)

    res.json(result)
  })
)
```

**Behavior**:
- Validates URL format (HTTP/HTTPS only)
- Extracts main text content (removes HTML, ads, navigation)
- Returns clean, readable text
- Graceful error handling (returns error response instead of throwing)

#### Response Format (Success)

```typescript
{
  url: "https://example.com/article",
  content: "Extracted text content from the page...",
  title: "Article Title",
  status_code: 200,
  success: true
}
```

#### Response Format (Error)

```typescript
{
  url: "https://example.com/article",
  content: "",
  status_code: 500,
  success: false,
  error: "Content extraction failed: Network timeout"
}
```

**Note**: Extract endpoint returns 200 even on extraction failures (check `success` field)

#### Example Requests

```typescript
// Extract article content
const extract = await fetch('/api/search/extract', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://en.wikipedia.org/wiki/Paris'
  })
})

const data = await extract.json()

if (data.success) {
  console.log('Title:', data.title)
  console.log('Content length:', data.content.length)
  console.log('First 100 chars:', data.content.substring(0, 100))
} else {
  console.error('Extraction failed:', data.error)
}

// Extract with error handling
async function extractWithRetry(url: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    const response = await fetch('/api/search/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    })
    
    const data = await response.json()
    
    if (data.success) {
      return data.content
    }
    
    console.log(`Attempt ${i + 1} failed: ${data.error}`)
    await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
  }
  
  throw new Error('Extraction failed after retries')
}
```

**Use Case**: Read articles, extract documentation, analyze web content for AI processing

---

## Usage Examples

### Search Integration in Chat

```typescript
async function searchAndRespond(userQuery: string) {
  // 1. Perform search
  const searchResponse = await fetch('/api/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: userQuery,
      options: {
        max_results: 5,
        include_answer: true
      }
    })
  })
  
  const searchData = await searchResponse.json()
  
  // 2. Build context for AI
  const context = `
Based on current web search:

Question: ${userQuery}

Answer: ${searchData.answer}

Sources:
${searchData.results.map((r, i) => `${i + 1}. ${r.title} - ${r.url}\n   ${r.content.substring(0, 200)}...`).join('\n\n')}
`
  
  // 3. Send to AI with context
  const aiResponse = await fetch('/api/agent/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: 'session_123',
      message: context
    })
  })
  
  return aiResponse.json()
}
```

### Medical Information Search

```typescript
async function searchMedicalInfo(query: string) {
  const trustedSources = [
    'mayoclinic.org',
    'webmd.com',
    'nih.gov',
    'cdc.gov',
    'who.int',
    'hopkinsmedicine.org'
  ]
  
  const response = await fetch('/api/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: query,
      options: {
        search_depth: 'advanced',
        max_results: 5,
        include_domains: trustedSources,
        include_answer: true
      }
    })
  })
  
  const data = await response.json()
  
  return {
    answer: data.answer,
    sources: data.results.map(r => ({
      title: r.title,
      url: r.url,
      excerpt: r.content,
      trustScore: r.score
    }))
  }
}

// Usage
const info = await searchMedicalInfo('side effects of lisinopril')
console.log('Medical Answer:', info.answer)
console.log('Trusted Sources:', info.sources.length)
```

### Multi-Source Content Extraction

```typescript
async function extractMultipleUrls(urls: string[]) {
  const results = await Promise.allSettled(
    urls.map(url => 
      fetch('/api/search/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      }).then(r => r.json())
    )
  )
  
  const successful = results
    .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
    .map(r => r.value)
    .filter(data => data.success)
  
  const failed = results
    .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
    .map(r => r.value)
    .filter(data => !data.success)
  
  console.log(`✅ Extracted: ${successful.length}`)
  console.log(`❌ Failed: ${failed.length}`)
  
  return {
    successful: successful.map(s => ({
      url: s.url,
      title: s.title,
      content: s.content
    })),
    failed: failed.map(f => ({
      url: f.url,
      error: f.error
    }))
  }
}

// Usage
const urls = [
  'https://example.com/article1',
  'https://example.com/article2',
  'https://example.com/article3'
]

const extracted = await extractMultipleUrls(urls)
```

### Search with Caching

```typescript
// Simple in-memory cache
const searchCache = new Map<string, { data: any, timestamp: number }>()
const CACHE_TTL = 60 * 60 * 1000  // 1 hour

async function cachedSearch(query: string, options?: any) {
  const cacheKey = JSON.stringify({ query, options })
  
  // Check cache
  const cached = searchCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('Cache hit:', query)
    return cached.data
  }
  
  // Perform search
  const response = await fetch('/api/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, options })
  })
  
  const data = await response.json()
  
  // Store in cache
  searchCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  })
  
  return data
}
```

---

## Best Practices

### 1. Use Appropriate Search Depth

```typescript
// ✅ GOOD: Use basic for simple queries
await search({
  query: 'What time is it in Paris?',
  options: { search_depth: 'basic' }  // Fast, sufficient for simple questions
})

// ✅ GOOD: Use advanced for complex research
await search({
  query: 'Comparative analysis of OAuth 2.0 vs OIDC',
  options: { search_depth: 'advanced' }  // More comprehensive
})

// ❌ BAD: Always use advanced
// Wastes API quota and increases latency
```

### 2. Limit Results Appropriately

```typescript
// ✅ GOOD: Request only what you need
await search({
  query: 'Quick fact about Paris',
  options: { max_results: 3 }  // Enough for simple answer
})

// ⚠️ OKAY: More results for research
await search({
  query: 'TypeScript design patterns',
  options: { max_results: 10 }  // Comprehensive research
})

// ❌ BAD: Always request maximum
await search({
  query: 'Quick fact',
  options: { max_results: 20 }  // Overkill for simple query
})
```

### 3. Filter Domains for Sensitive Topics

```typescript
// ✅ GOOD: Whitelist trusted medical sources
await search({
  query: 'Medication side effects',
  options: {
    include_domains: ['mayoclinic.org', 'webmd.com', 'nih.gov']
  }
})

// ✅ GOOD: Blacklist unreliable sources
await search({
  query: 'Scientific research',
  options: {
    exclude_domains: ['wikipedia.org', 'answers.com']
  }
})

// ❌ BAD: No filtering for medical info
await search({
  query: 'Medical advice'
  // Could return unreliable sources
})
```

### 4. Handle Errors Gracefully

```typescript
// ✅ GOOD: Comprehensive error handling
async function safeSearch(query: string) {
  try {
    const response = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    })
    
    if (!response.ok) {
      const error = await response.json()
      console.error('Search failed:', error.error.message)
      return { success: false, error: error.error.message }
    }
    
    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    console.error('Network error:', error)
    return { success: false, error: 'Network error' }
  }
}

// ❌ BAD: No error handling
const data = await fetch('/api/search', { /* ... */ }).then(r => r.json())
// Will crash on network error or API failure
```

### 5. Check Configuration Before Use

```typescript
// ✅ GOOD: Verify API is configured
async function ensureSearchAvailable() {
  const status = await fetch('/api/search/status').then(r => r.json())
  
  if (!status.configured) {
    throw new Error('Tavily API not configured')
  }
  
  return true
}

// Use in UI
async function showSearchButton() {
  try {
    await ensureSearchAvailable()
    document.getElementById('search-btn').style.display = 'block'
  } catch (error) {
    console.log('Search not available:', error)
    document.getElementById('search-btn').style.display = 'none'
  }
}

// ❌ BAD: Assume search is always available
// Will fail for users without API key configured
```

### 6. Respect Rate Limits

```typescript
// ✅ GOOD: Debounce search requests
let searchTimeout: NodeJS.Timeout
function debouncedSearch(query: string) {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(async () => {
    await performSearch(query)
  }, 500)  // Wait 500ms after last keystroke
}

// ✅ GOOD: Cache results
const cache = new Map()
async function cachedSearch(query: string) {
  if (cache.has(query)) {
    return cache.get(query)
  }
  const result = await performSearch(query)
  cache.set(query, result)
  return result
}

// ❌ BAD: Search on every keystroke
input.addEventListener('input', (e) => {
  performSearch(e.target.value)  // Excessive API calls
})
```

---

## Frontend Integration

### Vue Search Component

```vue
<template>
  <div class="search-panel">
    <h3>Web Search</h3>
    
    <div v-if="!searchAvailable" class="warning">
      ⚠️ Search functionality not configured
    </div>
    
    <div v-else class="search-form">
      <input 
        v-model="query" 
        @keyup.enter="performSearch"
        placeholder="Enter search query..."
        :disabled="loading"
      />
      
      <div class="search-options">
        <label>
          <input type="checkbox" v-model="options.include_answer" />
          Include AI Answer
        </label>
        
        <label>
          <input type="checkbox" v-model="options.include_images" />
          Include Images
        </label>
        
        <select v-model="options.search_depth">
          <option value="basic">Basic Search</option>
          <option value="advanced">Advanced Search</option>
        </select>
        
        <input 
          v-model.number="options.max_results" 
          type="number"
          min="1"
          max="20"
          placeholder="Results (1-20)"
        />
      </div>
      
      <button @click="performSearch" :disabled="loading || !query">
        {{ loading ? 'Searching...' : 'Search' }}
      </button>
    </div>
    
    <div v-if="results" class="search-results">
      <div v-if="results.answer" class="answer">
        <h4>Answer</h4>
        <p>{{ results.answer }}</p>
      </div>
      
      <div class="results-list">
        <h4>Results ({{ results.results_count }})</h4>
        <div 
          v-for="(result, index) in results.results" 
          :key="index"
          class="result-item"
        >
          <h5>{{ result.title }}</h5>
          <a :href="result.url" target="_blank">{{ result.url }}</a>
          <p>{{ result.content }}</p>
          <span class="score">Score: {{ (result.score * 100).toFixed(0) }}%</span>
        </div>
      </div>
      
      <div v-if="results.images?.length" class="images">
        <h4>Images</h4>
        <div class="image-grid">
          <div v-for="(img, index) in results.images" :key="index">
            <img :src="img.url" :alt="img.description" />
            <p>{{ img.description }}</p>
          </div>
        </div>
      </div>
      
      <p class="response-time">
        Search completed in {{ results.response_time }}ms
      </p>
    </div>
    
    <div v-if="error" class="error">
      ❌ {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const query = ref('')
const loading = ref(false)
const searchAvailable = ref(false)
const results = ref<any>(null)
const error = ref('')

const options = ref({
  search_depth: 'basic',
  max_results: 5,
  include_answer: true,
  include_images: false
})

async function checkSearchStatus() {
  const response = await fetch('/api/search/status')
  const status = await response.json()
  searchAvailable.value = status.configured
}

async function performSearch() {
  if (!query.value.trim()) return
  
  loading.value = true
  error.value = ''
  results.value = null
  
  try {
    const response = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: query.value,
        options: options.value
      })
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error.message)
    }
    
    results.value = await response.json()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Search failed'
  } finally {
    loading.value = false
  }
}

onMounted(checkSearchStatus)
</script>

<style scoped>
.search-panel {
  padding: 1rem;
}

.warning {
  background: #fff3cd;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.search-form input,
.search-form select,
.search-form button {
  margin: 0.5rem 0;
}

.search-options {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin: 0.5rem 0;
}

.answer {
  background: #e7f3ff;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.result-item {
  border: 1px solid #ddd;
  padding: 1rem;
  margin-bottom: 0.5rem;
  border-radius: 4px;
}

.result-item h5 {
  margin: 0 0 0.5rem 0;
}

.result-item a {
  color: #0066cc;
  font-size: 0.9rem;
  display: block;
  margin-bottom: 0.5rem;
}

.score {
  font-size: 0.85rem;
  color: #666;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.image-grid img {
  width: 100%;
  border-radius: 4px;
}

.error {
  background: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 4px;
  margin-top: 1rem;
}

.response-time {
  text-align: right;
  font-size: 0.85rem;
  color: #666;
  margin-top: 1rem;
}
</style>
```

---

## Performance Considerations

### 1. Search Latency

**Factors**:
- `search_depth`: Advanced is slower than basic
- `max_results`: More results = longer processing
- Network latency to Tavily API

**Optimization**:
- Use `basic` for simple queries
- Limit results to minimum needed
- Cache frequent queries

### 2. API Quota Management

**Tavily Pricing**: Based on API calls and search depth

**Strategies**:
- Implement rate limiting (already included)
- Cache search results
- Use basic search when possible
- Monitor usage via logs

### 3. Content Extraction Performance

**Considerations**:
- Extraction can be slow for large pages
- Some sites may block extraction
- Network timeouts possible

**Optimization**:
- Set appropriate timeout limits
- Implement retry logic
- Cache extracted content

---

## Security Considerations

### 1. API Key Protection

**Status**: ✅ Protected via environment variables

**Best Practices**:
- Never commit API keys to git
- Use `.env` file (in `.gitignore`)
- Rotate keys periodically
- Monitor usage for abuse

### 2. Input Validation

**Status**: ✅ Protected via Zod schemas

**Validates**:
- Query length (max 400 chars)
- URL format (HTTP/HTTPS only)
- Numeric ranges (max_results 1-20)
- Enum values (search_depth)

### 3. Rate Limiting

**Status**: ✅ Enabled via middleware

**Protection**:
- Prevents API quota exhaustion
- Mitigates abuse
- Per-IP rate limiting

### 4. Content Sanitization

**Recommendation**: Sanitize extracted content before displaying

```typescript
import DOMPurify from 'dompurify'

const cleanContent = DOMPurify.sanitize(extractedContent)
```

---

## Testing Considerations

### Unit Test Scenarios

```typescript
describe('Search Router', () => {
  describe('GET /api/search/status', () => {
    it('should return configuration status', async () => {
      const response = await request(app).get('/api/search/status')
      
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('configured')
      expect(response.body).toHaveProperty('api_key_present')
      expect(response.body).toHaveProperty('api_key_format_valid')
    })
  })
  
  describe('POST /api/search', () => {
    it('should perform search with valid query', async () => {
      const response = await request(app)
        .post('/api/search')
        .send({ query: 'test query' })
      
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('results')
      expect(response.body).toHaveProperty('query', 'test query')
    })
    
    it('should reject empty query', async () => {
      const response = await request(app)
        .post('/api/search')
        .send({ query: '' })
      
      expect(response.status).toBe(400)
    })
    
    it('should reject query over 400 chars', async () => {
      const longQuery = 'a'.repeat(401)
      const response = await request(app)
        .post('/api/search')
        .send({ query: longQuery })
      
      expect(response.status).toBe(400)
    })
    
    it('should respect max_results limit', async () => {
      const response = await request(app)
        .post('/api/search')
        .send({
          query: 'test',
          options: { max_results: 3 }
        })
      
      expect(response.body.results.length).toBeLessThanOrEqual(3)
    })
  })
  
  describe('POST /api/search/extract', () => {
    it('should extract content from valid URL', async () => {
      const response = await request(app)
        .post('/api/search/extract')
        .send({ url: 'https://example.com' })
      
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('content')
      expect(response.body).toHaveProperty('success')
    })
    
    it('should reject invalid URL', async () => {
      const response = await request(app)
        .post('/api/search/extract')
        .send({ url: 'not-a-url' })
      
      expect(response.status).toBe(400)
    })
  })
})
```

---

## Environment Configuration

### Required Environment Variables

```bash
# .env file
TAVILY_API_KEY=tvly-your-api-key-here
```

**Getting an API Key**:
1. Visit https://tavily.com
2. Sign up for an account
3. Generate API key from dashboard
4. Add to `.env` file

**API Key Format**: Must start with `tvly-`

---

## Summary

The **Search Router** provides AI-powered web search and content extraction:

**Endpoints (3 total)**:
- **GET /api/search/status** - Check API configuration status
- **POST /api/search** - Perform web search with AI answers
- **POST /api/search/extract** - Extract content from URL

**Key Features**:
- AI-generated answers via Tavily
- Advanced search options (depth, result count, domain filtering)
- Content extraction from web pages
- Rate limiting for API protection
- Comprehensive validation
- Graceful error handling

**Search Options**:
- Search depth: basic (fast) or advanced (comprehensive)
- Max results: 1-20 (default 5)
- Include raw content, images, AI answer
- Domain whitelist/blacklist

**Use Cases**:
- Provide real-time information to AI
- Fact-checking and verification
- Research assistance
- Medical information lookup (with trusted domains)
- Content summarization
- News and current events

**Integration**:
Search functionality enhances AI conversations by providing access to current web information. Essential for eldercare scenarios requiring up-to-date medical information, medication details, or health guidelines.
