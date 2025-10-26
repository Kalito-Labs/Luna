# Internet Search Capability for AI Models

## Overview
Enable Kalito to intelligently search the internet for real-time health information, medication updates, doctor recommendations, and eldercare resources using **OpenAI Function Calling** paired with **Tavily AI Search**.

## Architecture Decision

**Chosen Approach:** 
- **Layer 1 (Intelligence)**: OpenAI Function Calling - AI decides when to search
- **Layer 2 (Execution)**: Tavily AI Search API - Actually performs the search

### Why This Combination?

**OpenAI Function Calling:**
- ✅ AI intelligently decides when search is needed (no manual keyword detection)
- ✅ AI formulates optimal search queries
- ✅ Minimal code (~50 lines vs 200+ for manual detection)
- ✅ Self-maintaining (no regex patterns to update)
- ✅ Same API cost (included with OpenAI)

**Tavily AI Search:**
- ✅ **Free tier: 1,000 searches/month** (perfect for testing and early use)
- ✅ Built specifically for AI/LLM applications
- ✅ Pre-formatted results optimized for AI consumption
- ✅ Easy 5-minute setup (no credit card required)
- ✅ Can filter by trusted health domains
- ✅ Upgrade path: $50/month for 10,000 searches

## Use Cases

### Primary Use Cases
1. **Medication Research**: Look up new medications, drug interactions, recent FDA warnings
2. **Symptom Information**: Research symptoms or conditions mentioned by the family
3. **Health News**: Get updates on treatments, research, or health advisories
4. **Medical Supply Info**: Find availability and pricing for medical equipment or supplies
5. **Insurance/Medicare Info**: Look up coverage details, forms, or procedures

### Example Scenarios
- "What are the latest side effects reported for Gabapentin?"
- "Is there a recall on blood pressure monitors?"
- "What are symptoms of a UTI in elderly patients?"
- "Recent FDA warnings about medications for elderly patients"
- "Latest research on managing hypertension in seniors"

### What Searches Are NOT Needed For
- ❌ "When is Dad's appointment?" → Database has this
- ❌ "What medications does Mom take?" → Database has this
- ❌ "What's the doctor's phone number?" → Database has this
- ❌ Finding local doctors → Database already has provider contacts

**AI will automatically determine** which questions need internet search vs. database lookup.

## Implementation

### Step 1: Sign Up for Tavily (5 Minutes)

1. Go to https://tavily.com/
2. Sign up for free account (no credit card required)
3. Get your API key from the dashboard
4. Add to your `.env` file:

```bash
TAVILY_API_KEY=tvly-your-api-key-here
```

**Free Tier:** 1,000 searches/month (33 per day)  
**Upgrade:** $50/month for 10,000 searches (if needed later)

---

## Backend Architecture (OpenAI Function Calling + Tavily)

```
┌─────────────────────────────────────────────────────┐
│            User Message to Chat API                  │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│         Agent Service (Modified)                     │
│  - Get eldercare context from database              │
│  - Send to OpenAI with search_internet tool         │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│         OpenAI Function Calling (NEW)                │
│  - AI decides: "Do I need internet search?"         │
│  - If YES: Calls search_internet function           │
│  - AI formulates optimal search query               │
│  - AI categorizes search type automatically         │
└─────────────────────────────────────────────────────┘
                        ↓ (if search needed)
┌─────────────────────────────────────────────────────┐
│         Tavily Search Service (NEW)                  │
│  - Receives query from function call                │
│  - Filters by trusted health domains                │
│  - Returns AI-optimized results                     │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│         Back to OpenAI (with search results)         │
│  - AI receives search results                       │
│  - Generates final response combining:              │
│    * Eldercare database context                     │
│    * Internet search results                        │
│    * Medical knowledge                              │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│         Response to User                             │
└─────────────────────────────────────────────────────┘
```

**Key Benefits:**
- ✅ AI decides when to search (no manual keyword detection needed)
- ✅ AI formulates better queries than manual detection
- ✅ Minimal code (~180 lines total vs. ~430 for manual approach)
- ✅ Self-maintaining (AI adapts to new query patterns)

### File Structure

```
backend/
├── logic/
│   ├── searchTools.ts            (NEW - Function calling tool definitions)
│   ├── tavilySearchService.ts    (NEW - Tavily API integration)
│   └── agentService.ts           (MODIFY - Add function calling support)
└── types/
    └── search.ts                 (NEW - Search type definitions)
```

**That's it!** No complex intent detection, no multiple search providers, no hybrid orchestration. Just ~180 lines of clean code.

---

## Complete Implementation Code

### 1. Define the Search Function Tool

```typescript
// backend/logic/searchTools.ts

export const SEARCH_TOOL = {
  type: "function" as const,
  function: {
    name: "search_internet",
    description: "Search the internet for current medical information, medication updates, FDA warnings, or health news. Use this ONLY when the question requires up-to-date information not available in the eldercare database. The database already contains patient medications, appointments, doctors, and care notes.",
    parameters: {
      type: "object",
      properties: {
        query: { 
          type: "string", 
          description: "Optimized search query for finding medical/health information. Be specific and include relevant medical terms." 
        },
        focus: {
          type: "string",
          enum: ["medication", "symptom", "health_news", "general"],
          description: "Category of health information to prioritize trusted sources: medication (FDA, NIH, Drugs.com), symptom (Mayo Clinic, CDC), health_news (medical journals), general (broad health sources)"
        }
      },
      required: ["query"]
    }
  }
}
```

### 2. Tavily Search Service

```typescript
// backend/logic/tavilySearchService.ts

import axios from 'axios'

export interface SearchResult {
  title: string
  url: string
  content: string
  score: number
}

export interface TavilySearchResponse {
  answer: string  // AI-generated summary from Tavily
  results: SearchResult[]
  images?: string[]
  response_time: number
}

export class TavilySearchService {
  private apiKey = process.env.TAVILY_API_KEY
  private baseUrl = 'https://api.tavily.com/search'

  // Trusted health domains by category
  private readonly healthDomains = {
    medication: ['nih.gov', 'fda.gov', 'drugs.com', 'medlineplus.gov'],
    symptom: ['mayoclinic.org', 'cdc.gov', 'nih.gov', 'clevelandclinic.org'],
    health_news: ['nih.gov', 'cdc.gov', 'nejm.org', 'thelancet.com'],
    general: ['nih.gov', 'mayoclinic.org', 'cdc.gov', 'medicare.gov']
  }

  async search(query: string, focus: string = 'general'): Promise<TavilySearchResponse> {
    try {
      const response = await axios.post(this.baseUrl, {
        api_key: this.apiKey,
        query: query,
        search_depth: 'basic', // 'basic' is faster, 'advanced' for complex queries
        include_answer: true,   // Get AI-generated summary
        include_images: false,  // Don't need images for health info
        include_domains: this.healthDomains[focus] || this.healthDomains.general,
        max_results: 5
      })

      return {
        answer: response.data.answer || '',
        results: response.data.results || [],
        response_time: response.data.response_time || 0
      }
    } catch (error) {
      console.error('Tavily search error:', error)
      throw new Error('Failed to perform internet search')
    }
  }
}
```

### 3. Modified Agent Service (Add Function Calling)

```typescript
// backend/logic/agentService.ts

import { SEARCH_TOOL } from './searchTools'
import { TavilySearchService } from './tavilySearchService'
import type { ChatCompletionMessageParam } from 'openai/resources/chat'

export class AgentService {
  private tavilySearch: TavilySearchService
  private openai: OpenAI

  constructor() {
    this.tavilySearch = new TavilySearchService()
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }

  async chat(sessionId: string, userMessage: string, modelId: string) {
    // Get eldercare context (existing)
    const eldercareContext = this.eldercareService.getEldercareContext(adapter)
    
    // Build messages array
    const messages: ChatCompletionMessageParam[] = [
      { 
        role: "system", 
        content: `${systemPrompt}\n\n${eldercareContext.summary}` 
      },
      ...conversationHistory, // Your existing conversation history
      { role: "user", content: userMessage }
    ]

    // Call OpenAI with search tool enabled
    const response = await this.openai.chat.completions.create({
      model: modelId, // "gpt-4" or your chosen model
      messages: messages,
      tools: [SEARCH_TOOL],  // Enable search function
      tool_choice: "auto"     // Let AI decide when to search
    })

    const message = response.choices[0].message

    // Check if AI wants to search
    if (message.tool_calls && message.tool_calls.length > 0) {
      const toolCall = message.tool_calls[0]
      
      if (toolCall.function.name === "search_internet") {
        // Parse search parameters
        const args = JSON.parse(toolCall.function.arguments)
        const query = args.query
        const focus = args.focus || 'general'

        console.log(`🔍 AI requesting search: "${query}" (${focus})`)

        // Execute Tavily search
        const searchResults = await this.tavilySearch.search(query, focus)

        // Format results for AI
        const formattedResults = this.formatSearchResults(searchResults)

        // Add function call and results to conversation
        messages.push(message) // AI's request to search
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: formattedResults
        })

        // Get final response with search results
        const finalResponse = await this.openai.chat.completions.create({
          model: modelId,
          messages: messages
        })

        return finalResponse.choices[0].message.content
      }
    }

    // No search needed, return direct response
    return message.content
  }

  private formatSearchResults(tavilyResponse: TavilySearchResponse): string {
    let formatted = ''

    // Include Tavily's AI-generated summary
    if (tavilyResponse.answer) {
      formatted += `**Summary:** ${tavilyResponse.answer}\n\n`
    }

    // Include source details
    if (tavilyResponse.results.length > 0) {
      formatted += `**Sources:**\n\n`
      tavilyResponse.results.forEach((result, idx) => {
        formatted += `${idx + 1}. **${result.title}**\n`
        formatted += `   ${result.content.substring(0, 200)}...\n`
        formatted += `   Source: ${result.url}\n\n`
      })
    }

    return formatted
  }
}
```

### 4. Type Definitions

```typescript
// backend/types/search.ts

export interface SearchResult {
  title: string
  url: string
  content: string
  score: number
}

export interface TavilySearchResponse {
  answer: string
  results: SearchResult[]
  images?: string[]
  response_time: number
}

export type SearchFocus = 'medication' | 'symptom' | 'health_news' | 'general'
```

---

## Security & Privacy Considerations

### 1. AI-Managed Privacy
**Good news:** OpenAI Function Calling provides natural privacy protection.

The AI:
- ✅ Formulates search queries without patient names
- ✅ Uses medical terms instead of personal identifiers
- ✅ Won't include SSNs, insurance IDs, or full names in searches

Example:
- ❌ Bad: "side effects for John Smith's Gabapentin"
- ✅ Good: "Gabapentin side effects elderly patients"

The AI automatically generalizes queries to protect privacy.

### 2. Trusted Source Filtering

Tavily is configured to only search trusted health domains:

```typescript
include_domains: [
  'nih.gov',        // National Institutes of Health
  'cdc.gov',        // CDC
  'fda.gov',        // FDA
  'mayoclinic.org', // Mayo Clinic
  'medicare.gov',   // Medicare
  'drugs.com'       // Drug information database
]
```

### 3. Rate Limiting (Built-in)

Tavily free tier: 1,000 searches/month (~33/day)
- Natural rate limiting through API quota
- Prevents abuse
- For family use, you'll likely use 5-10 searches/day

### 4. No PII Logging

Tavily searches don't log:
- Patient names
- Addresses
- Phone numbers
- Insurance details

Searches are generic medical queries only.

---

## Cost Analysis

### Tavily Pricing (Your Choice)

| Usage Level | Monthly Searches | Monthly Cost | Daily Average |
|-------------|-----------------|--------------|---------------|
| **Free Tier** | 1,000 | **$0** | 33 searches/day |
| Pro Tier | 10,000 | $50 | 333 searches/day |

### Realistic Family Usage Estimate

```
Testing phase (Month 1-2):
- 5-10 searches/day while testing features
- ~150-300 searches/month
- Cost: $0 (within free tier) ✅

Normal family use (Month 3+):
- 3-5 searches/day for medication updates, health info
- ~100-150 searches/month  
- Cost: $0 (within free tier) ✅

Heavy usage:
- 10-20 searches/day
- ~300-600 searches/month
- Cost: $0 (still within free tier!) ✅
```

**Bottom line:** You'll likely **never exceed the free tier** for family use.

### Cost Comparison vs. Alternatives

| Service | Free Tier | Paid Cost | Your Likely Cost |
|---------|-----------|-----------|------------------|
| **Tavily** ⭐ | 1,000/mo | $50/mo | **$0** |
| Brave API | None | $5/mo | $5 |
| SerpAPI | 100/mo | $50/mo | $50 |
| Google Cloud | 3,000/mo | Complex | $0-20 |

**Winner: Tavily** - Free tier is more than enough for family use.

---

## Testing Strategy

### Manual Testing Approach

Test these scenarios to verify Function Calling + Tavily:

```typescript
// Test 1: AI should use database (no search)
User: "When is Dad's next appointment?"
Expected: AI answers from database, no search triggered

// Test 2: AI should search (needs current info)
User: "What are the latest side effects of Gabapentin reported in 2025?"
Expected: AI triggers search_internet function, uses Tavily

// Test 3: AI should search for health news
User: "Any recent FDA warnings about blood pressure medications?"
Expected: AI searches with focus='medication'

// Test 4: AI should generalize queries (privacy)
User: "What are side effects of the medication Aurora takes for pain?"
Expected: AI searches "Gabapentin side effects" (not Aurora's name)

// Test 5: Mixed query (some DB, some search)
User: "Mom takes Lisinopril - are there any new warnings about it?"
Expected: AI gets medication from DB, then searches for warnings
```

### Automated Tests

```typescript
// backend/tests/searchService.test.ts

describe('TavilySearchService', () => {
  it('should return results with AI summary', async () => {
    const results = await tavilySearch.search('Gabapentin side effects', 'medication')
    
    expect(results.answer).toBeDefined()
    expect(results.results.length).toBeGreaterThan(0)
    expect(results.results[0]).toHaveProperty('title')
    expect(results.results[0]).toHaveProperty('url')
  })

  it('should prioritize trusted health domains', async () => {
    const results = await tavilySearch.search('diabetes treatment', 'medication')
    
    const trustedDomains = ['nih.gov', 'cdc.gov', 'mayoclinic.org', 'fda.gov']
    const allFromTrusted = results.results.every(r => 
      trustedDomains.some(domain => r.url.includes(domain))
    )
    
    expect(allFromTrusted).toBe(true)
  })
})
```

---

## Implementation Timeline

### Setup (15 minutes)
- ✅ Sign up for Tavily
- ✅ Get API key
- ✅ Add to .env file

### Development (3-4 hours)
- ✅ Create searchTools.ts with SEARCH_TOOL definition (30 min)
- ✅ Create tavilySearchService.ts (1 hour)
- ✅ Modify agentService.ts to handle function calling (1.5 hours)
- ✅ Create type definitions (15 min)
- ✅ Testing and debugging (1 hour)

### Total Time: ~4 hours from start to working search capability

**Much faster than manual detection approach** which would take 1-2 weeks!

---

## Environment Configuration

```bash
# .env file

# Tavily API (required)
TAVILY_API_KEY=tvly-your-api-key-here

# OpenAI API (you already have this)
OPENAI_API_KEY=sk-your-key-here
```

**That's all you need!** No complex configuration files.

---

## Quick Start Guide

### Step 1: Sign Up for Tavily (5 min)
1. Go to https://tavily.com
2. Create free account
3. Get API key from dashboard
4. Add to `.env`: `TAVILY_API_KEY=tvly-your-key`

### Step 2: Create Search Tools (30 min)
```bash
# Create the file
touch backend/logic/searchTools.ts

# Copy the SEARCH_TOOL definition from above
```

### Step 3: Create Tavily Service (1 hour)
```bash
# Create the file  
touch backend/logic/tavilySearchService.ts

# Copy the TavilySearchService class from above
```

### Step 4: Modify Agent Service (1.5 hours)
```bash
# Edit existing file
code backend/logic/agentService.ts

# Add function calling support as shown above
```

### Step 5: Test! (1 hour)
```bash
# Start your backend
npm run dev

# Test with these queries:
# 1. "When is Dad's appointment?" → Should use DB, no search
# 2. "Latest side effects of Gabapentin?" → Should trigger search
# 3. "Any FDA warnings about Lisinopril?" → Should search FDA
```

### Step 6: Monitor Usage
Check your Tavily dashboard to see:
- Searches performed
- Remaining quota
- When you might need to upgrade (unlikely!)

---

## Summary

**Decision:** OpenAI Function Calling + Tavily AI Search

**Why:**
- ✅ AI decides when to search (smarter than manual detection)
- ✅ Free tier: 1,000 searches/month (more than enough)
- ✅ Minimal code: ~180 lines total
- ✅ Easy setup: 4 hours total implementation
- ✅ Privacy-focused: Trusted health domains only
- ✅ Self-maintaining: AI adapts to new query patterns

**Cost:** $0/month (free tier sufficient for family use)

**Next:** Implement this first, then add bilingual support and voice!
