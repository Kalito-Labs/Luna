# Search Types Documentation

## Overview

The `search.ts` file defines TypeScript interfaces for integrating with the **Tavily Search API**, a web search service optimized for AI applications. These types support configurable web searches, result retrieval, and content extraction from URLs.

**Location**: `/backend/types/search.ts`

**Purpose**:
- Type-safe Tavily API integration
- Configure search depth and filtering options
- Process search results with relevance scoring
- Extract clean content from web pages

**Key Capabilities**:
- Basic vs advanced search modes
- Domain filtering (include/exclude)
- Answer extraction from search results
- Image search results
- Raw content extraction from URLs

---

## Core Types

### SearchDepth

```typescript
export type SearchDepth = 'basic' | 'advanced';
```

**Purpose**: Controls the thoroughness of Tavily search operations.

**Values**:

| Depth | Description | Use Case |
|-------|-------------|----------|
| `'basic'` | Faster, lightweight search | Quick lookups, broad queries |
| `'advanced'` | More comprehensive, slower | Research, detailed information |

**When to Use**:
- **Basic**: User asks quick factual questions ("What's the capital of France?")
- **Advanced**: User needs comprehensive research ("Explain quantum computing developments in 2024")

**Example**:
```typescript
const searchOptions: SearchOptions = {
  search_depth: 'advanced', // Use thorough search for research queries
  max_results: 10
};
```

---

### SearchOptions

```typescript
export interface SearchOptions {
  api_key: string;
  query: string;
  search_depth?: SearchDepth;
  max_results?: number;
  include_answer?: boolean;
  include_images?: boolean;
  include_raw_content?: boolean;
  include_domains?: string[];
  exclude_domains?: string[];
}
```

**Purpose**: Configures Tavily search API requests with filtering and content options.

#### Properties

##### `api_key: string`
- **Required**: Yes
- **Description**: Tavily API authentication key
- **Example**: `"tvly-abc123xyz789"`

##### `query: string`
- **Required**: Yes
- **Description**: Search query text
- **Example**: `"latest developments in eldercare technology"`

##### `search_depth?: SearchDepth`
- **Required**: No (defaults to `'basic'`)
- **Description**: Search thoroughness level
- **Example**: `'advanced'`

##### `max_results?: number`
- **Required**: No
- **Description**: Maximum number of search results to return
- **Default**: Typically 5 (Tavily default)
- **Example**: `10`

##### `include_answer?: boolean`
- **Required**: No
- **Description**: Whether Tavily should generate a direct answer to the query
- **Default**: `false`
- **Use Case**: Enable when you want Tavily to synthesize an answer from search results
- **Example**: `true`

##### `include_images?: boolean`
- **Required**: No
- **Description**: Whether to include image results in the response
- **Default**: `false`
- **Use Case**: Enable for visual queries or when images add value
- **Example**: `true`

##### `include_raw_content?: boolean`
- **Required**: No
- **Description**: Whether to include full page content in results (not just snippets)
- **Default**: `false`
- **Use Case**: Enable when you need complete page text for analysis
- **Example**: `true`

##### `include_domains?: string[]`
- **Required**: No
- **Description**: Whitelist of domains to search within
- **Example**: `["cdc.gov", "nih.gov"]` (only search medical authorities)

##### `exclude_domains?: string[]`
- **Required**: No
- **Description**: Blacklist of domains to exclude from results
- **Example**: `["pinterest.com", "instagram.com"]` (avoid image-heavy sites)

#### Complete Example

```typescript
const searchOptions: SearchOptions = {
  api_key: process.env.TAVILY_API_KEY!,
  query: "dementia care best practices 2024",
  search_depth: 'advanced',
  max_results: 15,
  include_answer: true,
  include_images: false,
  include_raw_content: true,
  include_domains: ["alz.org", "nia.nih.gov", "dementia.org"],
  exclude_domains: ["youtube.com", "tiktok.com"]
};
```

---

### SearchResult

```typescript
export interface SearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
  raw_content?: string;
}
```

**Purpose**: Represents a single search result from Tavily.

#### Properties

##### `title: string`
- **Description**: Page title or headline
- **Example**: `"10 Evidence-Based Dementia Care Techniques"`

##### `url: string`
- **Description**: Full URL to the source page
- **Example**: `"https://www.alz.org/care/dementia-care-techniques"`

##### `content: string`
- **Description**: Relevant excerpt/snippet from the page
- **Example**: `"Recent studies show that music therapy significantly reduces agitation in patients with dementia..."`

##### `score: number`
- **Description**: Relevance score (0-1 scale, higher is more relevant)
- **Example**: `0.92`
- **Usage**: Sort results by score to prioritize most relevant content

##### `raw_content?: string`
- **Description**: Full page text content (only present if `include_raw_content: true`)
- **Example**: `"Full article text with thousands of characters..."`

#### Example Usage

```typescript
// Process search results sorted by relevance
const topResults = searchResponse.results
  .sort((a, b) => b.score - a.score)
  .slice(0, 5);

topResults.forEach(result => {
  console.log(`[${result.score.toFixed(2)}] ${result.title}`);
  console.log(`${result.url}`);
  console.log(`${result.content}\n`);
});
```

---

### SearchImage

```typescript
export interface SearchImage {
  url: string;
  description: string;
}
```

**Purpose**: Represents an image result from Tavily search.

#### Properties

##### `url: string`
- **Description**: Direct URL to the image file
- **Example**: `"https://example.com/images/eldercare-diagram.jpg"`

##### `description: string`
- **Description**: Alt text or caption describing the image
- **Example**: `"Diagram showing stages of Alzheimer's disease progression"`

#### Example

```typescript
if (searchResponse.images && searchResponse.images.length > 0) {
  console.log("Related images:");
  searchResponse.images.forEach(img => {
    console.log(`- ${img.description}: ${img.url}`);
  });
}
```

---

### SearchResponse

```typescript
export interface SearchResponse {
  answer?: string;
  results: SearchResult[];
  images?: SearchImage[];
  query: string;
  response_time?: number;
  results_count?: number;
}
```

**Purpose**: Complete response from Tavily search API.

#### Properties

##### `answer?: string`
- **Description**: AI-generated direct answer to the query (if `include_answer: true`)
- **Example**: `"The best practices for dementia care in 2024 include person-centered approaches, music therapy, structured routines, and minimizing environmental triggers..."`

##### `results: SearchResult[]`
- **Description**: Array of search results with relevance scoring
- **Always Present**: Yes (may be empty array)

##### `images?: SearchImage[]`
- **Description**: Array of related images (if `include_images: true`)
- **Example**: `[{url: "...", description: "..."}, ...]`

##### `query: string`
- **Description**: Echo of the original query text
- **Example**: `"dementia care best practices 2024"`

##### `response_time?: number`
- **Description**: API response time in milliseconds
- **Example**: `342`

##### `results_count?: number`
- **Description**: Total number of results returned
- **Example**: `15`

#### Complete Example

```typescript
const response: SearchResponse = {
  answer: "The capital of France is Paris, located in the north-central part of the country.",
  results: [
    {
      title: "Paris - Wikipedia",
      url: "https://en.wikipedia.org/wiki/Paris",
      content: "Paris is the capital and most populous city of France...",
      score: 0.98
    },
    {
      title: "France Facts - National Geographic",
      url: "https://www.nationalgeographic.com/france",
      content: "France's capital city, Paris, is known for...",
      score: 0.87
    }
  ],
  query: "What is the capital of France?",
  response_time: 156,
  results_count: 2
};
```

---

### SearchRequest

```typescript
export interface SearchRequest {
  query: string;
  max_results?: number;
  search_depth?: SearchDepth;
  include_answer?: boolean;
  include_images?: boolean;
  include_domains?: string[];
  exclude_domains?: string[];
}
```

**Purpose**: API request body for `/api/search` endpoint (simplified version without API key).

**Differences from SearchOptions**:
- No `api_key` field (handled server-side)
- No `include_raw_content` (for security/bandwidth reasons)

**Example**:
```typescript
// Frontend sends simplified request
const searchRequest: SearchRequest = {
  query: "eldercare appointment scheduling software",
  max_results: 10,
  search_depth: 'advanced',
  include_answer: true,
  include_domains: ["healthcare.gov", "cms.gov"]
};

const response = await fetch('/api/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(searchRequest)
});
```

---

### ExtractRequest

```typescript
export interface ExtractRequest {
  urls: string[];
}
```

**Purpose**: Request to extract clean content from specific URLs.

**Use Case**: When you have URLs and want full page content without making multiple search queries.

#### Properties

##### `urls: string[]`
- **Description**: Array of URLs to extract content from
- **Limit**: Typically 5-10 URLs per request (check Tavily limits)
- **Example**: 
  ```typescript
  {
    urls: [
      "https://www.alz.org/alzheimers-dementia/what-is-alzheimers",
      "https://www.nia.nih.gov/health/alzheimers-disease-fact-sheet"
    ]
  }
  ```

#### Example Usage

```typescript
// Extract content from specific research papers
const extractRequest: ExtractRequest = {
  urls: [
    "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9876543/",
    "https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(23)12345-6/fulltext"
  ]
};

const response = await fetch('/api/extract', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(extractRequest)
});

const data: ExtractResponse = await response.json();
```

---

### ExtractResponse

```typescript
export interface ExtractResponse {
  results: Array<{
    url: string;
    raw_content: string;
  }>;
  failed_results: Array<{
    url: string;
    error: string;
  }>;
}
```

**Purpose**: Response from content extraction API.

#### Properties

##### `results: Array<{url, raw_content}>`
- **Description**: Successfully extracted content
- **Structure**:
  - `url`: The source URL
  - `raw_content`: Full cleaned text from the page

##### `failed_results: Array<{url, error}>`
- **Description**: URLs that failed to extract
- **Structure**:
  - `url`: The failed URL
  - `error`: Error message explaining why extraction failed

#### Example

```typescript
const extractResponse: ExtractResponse = {
  results: [
    {
      url: "https://www.alz.org/alzheimers-dementia/what-is-alzheimers",
      raw_content: "Alzheimer's disease is a brain disorder that slowly destroys memory and thinking skills..."
    }
  ],
  failed_results: [
    {
      url: "https://example.com/blocked-page",
      error: "403 Forbidden - Access denied"
    }
  ]
};

// Process successful extractions
extractResponse.results.forEach(result => {
  console.log(`Content from ${result.url}:`);
  console.log(result.raw_content.substring(0, 500) + "...");
});

// Handle failures
if (extractResponse.failed_results.length > 0) {
  console.error("Failed to extract:", extractResponse.failed_results);
}
```

---

## Usage Patterns

### Basic Search Flow

```typescript
import { SearchOptions, SearchResponse } from '@/types/search';

async function searchWeb(userQuery: string): Promise<SearchResponse> {
  const options: SearchOptions = {
    api_key: process.env.TAVILY_API_KEY!,
    query: userQuery,
    search_depth: 'basic',
    max_results: 5,
    include_answer: true
  };

  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options)
  });

  return await response.json();
}
```

### Advanced Research Search

```typescript
async function researchTopic(topic: string): Promise<string> {
  const options: SearchOptions = {
    api_key: process.env.TAVILY_API_KEY!,
    query: topic,
    search_depth: 'advanced',
    max_results: 20,
    include_answer: true,
    include_raw_content: true,
    include_domains: ["edu", "gov", "org"] // Prioritize authoritative sources
  };

  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options)
  });

  const data: SearchResponse = await response.json();

  // Combine answer with top sources
  let report = data.answer || "No direct answer available.";
  report += "\n\nTop Sources:\n";
  
  data.results
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .forEach((result, i) => {
      report += `\n${i + 1}. ${result.title} [Score: ${result.score.toFixed(2)}]\n`;
      report += `   ${result.url}\n`;
      report += `   ${result.content}\n`;
    });

  return report;
}
```

### Domain-Filtered Medical Search

```typescript
async function searchMedicalInfo(condition: string): Promise<SearchResponse> {
  const options: SearchOptions = {
    api_key: process.env.TAVILY_API_KEY!,
    query: `${condition} symptoms treatment guidelines`,
    search_depth: 'advanced',
    max_results: 10,
    include_answer: true,
    include_domains: [
      "cdc.gov",
      "nih.gov",
      "mayoclinic.org",
      "hopkinsmedicine.org",
      "clevelandclinic.org"
    ],
    exclude_domains: [
      "healthline.com", // Consumer health sites (prefer medical institutions)
      "webmd.com"
    ]
  };

  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options)
  });

  return await response.json();
}
```

### Content Extraction from URLs

```typescript
async function extractArticleContent(urls: string[]): Promise<string[]> {
  const extractRequest: ExtractRequest = { urls };

  const response = await fetch('https://api.tavily.com/extract', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.TAVILY_API_KEY}`
    },
    body: JSON.stringify(extractRequest)
  });

  const data: ExtractResponse = await response.json();

  // Log failures
  if (data.failed_results.length > 0) {
    console.warn("Failed extractions:", data.failed_results);
  }

  // Return successful content
  return data.results.map(r => r.raw_content);
}
```

### AI Agent Integration

```typescript
import { SearchOptions, SearchResponse } from '@/types/search';
import { ChatMessage } from '@/types/messages';

async function aiWithWebSearch(
  userMessage: string,
  conversationHistory: ChatMessage[]
): Promise<string> {
  // 1. Perform web search
  const searchOptions: SearchOptions = {
    api_key: process.env.TAVILY_API_KEY!,
    query: userMessage,
    search_depth: 'advanced',
    max_results: 10,
    include_answer: true
  };

  const searchResponse: SearchResponse = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(searchOptions)
  }).then(r => r.json());

  // 2. Build context from search results
  const searchContext = `
Web Search Results for: "${searchResponse.query}"

${searchResponse.answer ? `Direct Answer: ${searchResponse.answer}\n\n` : ''}

Top Sources:
${searchResponse.results.slice(0, 5).map((r, i) => `
${i + 1}. ${r.title} [Relevance: ${(r.score * 100).toFixed(0)}%]
   ${r.url}
   ${r.content}
`).join('\n')}
`;

  // 3. Send to AI model with search context
  const messages: ChatMessage[] = [
    ...conversationHistory,
    {
      role: 'system',
      content: `You have access to current web search results. Use this information to answer the user's question accurately.\n\n${searchContext}`
    },
    { role: 'user', content: userMessage }
  ];

  // 4. Get AI response (simplified)
  const aiResponse = await callLLM(messages);
  
  return aiResponse;
}
```

---

## Best Practices

### 1. Search Depth Selection

```typescript
// ❌ BAD: Always using advanced search
const options: SearchOptions = {
  api_key: key,
  query: "What time is it?", // Simple query doesn't need advanced
  search_depth: 'advanced' // Wastes time and quota
};

// ✅ GOOD: Match depth to query complexity
function getSearchDepth(query: string): SearchDepth {
  const complexPatterns = [
    /research/i,
    /analysis/i,
    /compare/i,
    /detailed/i,
    /comprehensive/i
  ];
  
  return complexPatterns.some(p => p.test(query)) ? 'advanced' : 'basic';
}

const options: SearchOptions = {
  api_key: key,
  query: userQuery,
  search_depth: getSearchDepth(userQuery)
};
```

### 2. Domain Filtering Strategy

```typescript
// ✅ GOOD: Context-aware domain filtering
function getSearchDomains(context: 'medical' | 'legal' | 'general') {
  const domainMap = {
    medical: {
      include: ["nih.gov", "cdc.gov", "mayoclinic.org"],
      exclude: ["pinterest.com", "instagram.com"]
    },
    legal: {
      include: ["gov", "edu", "law"],
      exclude: ["blog", "forum"]
    },
    general: {
      include: [],
      exclude: ["pinterest.com", "instagram.com", "tiktok.com"]
    }
  };

  return domainMap[context];
}

const domains = getSearchDomains('medical');
const options: SearchOptions = {
  api_key: key,
  query: "diabetes treatment",
  include_domains: domains.include,
  exclude_domains: domains.exclude
};
```

### 3. Result Relevance Filtering

```typescript
// ✅ GOOD: Filter by score threshold
function getHighQualityResults(response: SearchResponse, threshold = 0.7): SearchResult[] {
  return response.results
    .filter(r => r.score >= threshold)
    .sort((a, b) => b.score - a.score);
}

const searchResponse = await searchWeb(query);
const topResults = getHighQualityResults(searchResponse, 0.8);

if (topResults.length === 0) {
  console.warn("No high-quality results found, lowering threshold...");
  const fallbackResults = getHighQualityResults(searchResponse, 0.5);
}
```

### 4. Error Handling

```typescript
// ✅ GOOD: Robust error handling
async function safeSearch(options: SearchOptions): Promise<SearchResponse | null> {
  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    });

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Search failed:", error);
    return null;
  }
}

// Usage
const result = await safeSearch(options);
if (!result) {
  // Fallback to cached data or inform user
  return "Search temporarily unavailable. Please try again.";
}
```

### 5. Rate Limiting and Caching

```typescript
// ✅ GOOD: Cache recent searches
const searchCache = new Map<string, { response: SearchResponse; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function cachedSearch(options: SearchOptions): Promise<SearchResponse> {
  const cacheKey = `${options.query}-${options.search_depth}`;
  const cached = searchCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log("Using cached search results");
    return cached.response;
  }

  const response = await searchWeb(options);
  searchCache.set(cacheKey, { response, timestamp: Date.now() });
  
  return response;
}
```

### 6. Content Size Management

```typescript
// ✅ GOOD: Handle large raw_content gracefully
function summarizeResult(result: SearchResult, maxLength = 500): string {
  const content = result.raw_content || result.content;
  
  if (content.length <= maxLength) {
    return content;
  }

  // Truncate at sentence boundary
  const truncated = content.substring(0, maxLength);
  const lastPeriod = truncated.lastIndexOf('.');
  
  return lastPeriod > 0 
    ? truncated.substring(0, lastPeriod + 1)
    : truncated + '...';
}

// Usage
searchResponse.results.forEach(result => {
  console.log(result.title);
  console.log(summarizeResult(result, 300));
});
```

---

## Integration Examples

### Express Route for Search

```typescript
import { Router } from 'express';
import { SearchRequest, SearchResponse } from '@/types/search';

const router = Router();

router.post('/search', async (req, res) => {
  try {
    const searchRequest: SearchRequest = req.body;

    // Validate request
    if (!searchRequest.query || searchRequest.query.trim() === '') {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Add server-side API key
    const options = {
      api_key: process.env.TAVILY_API_KEY!,
      ...searchRequest
    };

    // Call Tavily API
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    });

    if (!response.ok) {
      throw new Error(`Tavily API returned ${response.status}`);
    }

    const searchResponse: SearchResponse = await response.json();

    res.json(searchResponse);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router;
```

### Vue Component for Search UI

```vue
<template>
  <div class="search-container">
    <input 
      v-model="query" 
      @keyup.enter="search"
      placeholder="Search the web..."
    />
    <button @click="search" :disabled="loading">
      {{ loading ? 'Searching...' : 'Search' }}
    </button>

    <div v-if="answer" class="answer-box">
      <h3>Answer</h3>
      <p>{{ answer }}</p>
    </div>

    <div v-if="results.length > 0" class="results">
      <h3>Sources ({{ results.length }})</h3>
      <div v-for="result in results" :key="result.url" class="result-item">
        <div class="result-header">
          <a :href="result.url" target="_blank">{{ result.title }}</a>
          <span class="score">{{ (result.score * 100).toFixed(0) }}%</span>
        </div>
        <p class="result-content">{{ result.content }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { SearchRequest, SearchResponse, SearchResult } from '@/types/search';

const query = ref('');
const loading = ref(false);
const answer = ref('');
const results = ref<SearchResult[]>([]);

async function search() {
  if (!query.value.trim()) return;

  loading.value = true;
  try {
    const searchRequest: SearchRequest = {
      query: query.value,
      max_results: 10,
      search_depth: 'advanced',
      include_answer: true
    };

    const response = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(searchRequest)
    });

    const data: SearchResponse = await response.json();
    
    answer.value = data.answer || '';
    results.value = data.results.sort((a, b) => b.score - a.score);
  } catch (error) {
    console.error('Search failed:', error);
    alert('Search failed. Please try again.');
  } finally {
    loading.value = false;
  }
}
</script>
```

---

## Summary

The **search types** provide type-safe integration with Tavily's AI-optimized search API:

- **SearchDepth**: Controls basic vs advanced search modes
- **SearchOptions**: Configures searches with filtering, answer generation, and content inclusion
- **SearchResult**: Structured search results with relevance scoring
- **SearchResponse**: Complete API response with optional answer and images
- **ExtractRequest/Response**: Direct content extraction from URLs

**Key Benefits**:
- Type-safe Tavily API integration
- Flexible domain filtering (include/exclude)
- AI-generated answers from search results
- Relevance scoring for result prioritization
- Raw content extraction for deep analysis

**Common Use Cases**:
- AI agent web search augmentation
- Research and fact-checking
- Medical/legal information lookup with domain filtering
- Content extraction for knowledge base building
