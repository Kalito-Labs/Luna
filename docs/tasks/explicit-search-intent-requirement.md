# Task: Require Explicit User Intent for Web Search

**Date:** October 29, 2025  
**Status:** ✅ COMPLETED  
**Priority:** High  
**Type:** Feature Enhancement / Security

---

## Problem Statement

### Current Behavior
The AI model has **autonomous decision-making** power over when to perform web searches using the Tavily API. This creates several issues:

1. **Unnecessary API Calls**: The model may search for information it already knows or doesn't need
2. **Cost Implications**: Each Tavily search consumes API quota and costs money
3. **Unpredictable Behavior**: Users don't know when searches will occur
4. **Privacy Concerns**: The model may send queries to external APIs without explicit user consent
5. **Over-reliance**: The model might search online when a local answer would suffice

### How It Currently Works

**Tool Definition** (`backend/logic/tools.ts`):
```typescript
{
  name: 'web_search',
  description: 'Search the internet for current information, news, facts, or research. 
               Use this when you need up-to-date information that may not be in your 
               training data, or when the user explicitly asks you to search online...'
}
```

**Permission Level**:
- Only available to **cloud models** (OpenAI) - Local models (Ollama) don't have access
- Model sees the tool on **every request**
- Model autonomously decides when to call it based on:
  - Its interpretation of user intent
  - Its judgment about what needs "current" information
  - The permissive tool description

**Execution Flow**:
1. User sends a question
2. OpenAI model receives question + available tools list
3. Model decides if it needs `web_search` tool
4. If yes, model generates tool call request
5. Backend executes Tavily search automatically
6. Results injected into new request
7. Final response generated with search context

### Example Problematic Scenarios

**Scenario 1: Overestimating Need**
- User: "Tell me about photosynthesis"
- Model thinks: "Maybe there's new research" → Searches online unnecessarily
- Result: API call wasted on well-known information

**Scenario 2: Ambiguous Intent**
- User: "What's the weather like?"
- Model might search for generic weather info instead of asking for location
- Result: Unhelpful search, wasted API call

**Scenario 3: No Consent**
- User: "Explain carbidopa-levodopa"
- Model searches without user knowing their medical query went to external API
- Result: Privacy concern

---

## Desired Behavior

### Explicit Intent Requirement

The model should **ONLY** perform web searches when the user **explicitly** requests it using clear keywords or phrases.

### Approved Search Triggers

**Explicit Keywords/Phrases:**
- "search online for..."
- "look up..."
- "search for..."
- "find online..."
- "check online..."
- "google..." / "search google..."
- "what is the current..." / "what are the current..."
- "what is the latest..." / "what are the latest..."
- "recent..." / "recently..."
- "today's..." / "this week's..." / "this month's..."
- "up-to-date information about..."
- "real-time..." / "live..."
- "breaking news..."
- "go online and..."
- "browse..." / "web search..."

**Context-Specific Triggers:**
- Questions about current events (if containing temporal keywords)
- Questions explicitly asking for "today" or recent dates
- Questions with phrases like "right now", "at this moment"

### Blocked Scenarios (Should NOT Search)

❌ "Tell me about [topic]" - No explicit request  
❌ "What is [concept]" - Could be answered from training data  
❌ "Explain [thing]" - No temporal urgency  
❌ "How does [X] work" - General knowledge question  
❌ Ambiguous questions without clear need for current data  

---

## Implementation Plan

### Files to Modify

#### 1. `/backend/logic/tools.ts`
**Changes:**
- Rewrite `web_search` tool description to be more restrictive
- Make it explicit that the tool should ONLY be used when user explicitly requests online search
- Remove permissive language about "when you need" and replace with "when user explicitly requests"

**New Tool Description:**
```typescript
description: 'Perform a web search ONLY when the user EXPLICITLY requests to search online. 
              User must use clear keywords like "search online", "look up online", "what is 
              the current/latest", "check online", or similar explicit phrases. DO NOT use 
              this tool for general knowledge questions that can be answered from your training 
              data. DO NOT use this tool unless the user clearly indicates they want real-time 
              or up-to-date information from the internet.'
```

#### 2. `/backend/logic/agentService.ts`
**Changes:**
- Add `hasExplicitSearchIntent()` validation function
- Modify tool execution flow in both `runAgent()` and `runAgentStream()`
- Filter out `web_search` tool from available tools if no explicit intent detected
- Add logging for denied search attempts

**New Function:**
```typescript
/**
 * Checks if user input contains explicit intent to search online
 */
function hasExplicitSearchIntent(input: string): boolean {
  const lowerInput = input.toLowerCase()
  
  const explicitTriggers = [
    'search online', 'search for', 'look up', 'find online', 
    'check online', 'google', 'search google',
    'what is the current', 'what are the current',
    'what is the latest', 'what are the latest',
    'recent ', 'recently', 'today\'s', 'this week',
    'up-to-date', 'real-time', 'live ',
    'breaking news', 'go online', 'browse', 'web search'
  ]
  
  return explicitTriggers.some(trigger => lowerInput.includes(trigger))
}
```

**Modified Tool Availability:**
```typescript
// Only provide tools if explicit search intent detected
const tools: ChatCompletionTool[] | undefined = 
  adapter.type === 'cloud' && hasExplicitSearchIntent(input)
    ? ([...AVAILABLE_TOOLS] as unknown as ChatCompletionTool[])
    : undefined
```

#### 3. `/backend/logic/tavilyService.ts`
**Changes:** None required - this file only executes searches, doesn't control when they happen

---

## Implementation Steps

### Phase 1: Add Intent Detection
1. Create `hasExplicitSearchIntent()` function in `agentService.ts`
2. Add comprehensive test coverage for various user inputs
3. Log when searches are blocked vs allowed

### Phase 2: Update Tool Description
1. Rewrite `web_search` description in `tools.ts`
2. Make it more restrictive and explicit about requirements
3. Remove ambiguous "when you need" language

### Phase 3: Integrate Gatekeeper
1. Modify `runAgent()` to check intent before providing tools
2. Modify `runAgentStream()` to check intent before providing tools
3. Add logging for transparency

### Phase 4: Testing
1. Test with explicit search requests (should work)
2. Test with general questions (should NOT search)
3. Test with edge cases
4. Verify logging output

---

## Testing Scenarios

### Should ALLOW Search ✅

| User Input | Reason |
|------------|--------|
| "Search online for latest Parkinson's research" | Explicit "search online" |
| "What is the current weather in Paris?" | "current" + temporal context |
| "Look up recent news about AI" | "look up" + "recent" |
| "Find online information about..." | "find online" |
| "What's the latest update on..." | "latest update" |
| "Go online and find..." | "go online" |

### Should BLOCK Search ❌

| User Input | Reason |
|------------|--------|
| "Tell me about photosynthesis" | General knowledge, no explicit request |
| "What is carbidopa-levodopa?" | Medical info, but no temporal need |
| "Explain how engines work" | General explanation, no current data needed |
| "What causes earthquakes?" | Scientific knowledge, not time-sensitive |
| "How do I treat a headache?" | General medical advice, not explicitly requesting search |

---

## Expected Outcomes

### Benefits
1. **Reduced API Costs**: Only search when actually needed
2. **Better User Control**: Users know exactly when external APIs are called
3. **Improved Privacy**: No unexpected external data transmission
4. **More Predictable Behavior**: Clear rules about when searches occur
5. **Encourages Model Knowledge**: Model uses training data first

### Potential Issues
1. **False Negatives**: Some legitimate search needs might not trigger
2. **User Education**: Users need to know the magic keywords
3. **Edge Cases**: Ambiguous requests might be frustrating

### Mitigation
- Clear documentation of search trigger keywords
- Helpful error messages when model can't search
- Option to add more trigger phrases based on usage patterns

---

## Configuration Options (Future Enhancement)

Consider adding user/persona-level settings:

```typescript
interface SearchSettings {
  requireExplicitIntent: boolean  // Default: true
  allowedTriggers: string[]       // Customizable keyword list
  autoSearchForCurrent: boolean   // Auto-search for "current" questions
  maxSearchesPerSession: number   // Rate limiting
}
```

---

## Rollback Plan

If issues arise:
1. Revert changes to `agentService.ts` and `tools.ts`
2. Original behavior is restored
3. Tool description reverts to permissive version
4. Model regains autonomous search control

---

## Documentation Updates Needed

After implementation:
1. Update API documentation with search trigger keywords
2. Add user guide section on "How to Search Online"
3. Update persona configuration docs (if search settings added)
4. Add examples to chat interface help text

---

## Success Metrics

Track after implementation:
- Number of searches per day (should decrease)
- API cost reduction percentage
- User feedback about search functionality
- False negative reports (searches that should have happened but didn't)
- Search success rate (searches that were helpful vs unhelpful)

---

## Notes

- This change only affects **cloud models** (OpenAI) - local models never had search access
- Tavily API key must still be configured for searches to work
- This is a gatekeeper approach - the tool is still technically available, just conditionally
- Future enhancement: Allow per-persona override of this behavior
