# GPT-5 Integration Guide

## Overview

This document details the successful integration of GPT-5 models (`gpt-5-mini` and `gpt-5-nano`) into the Kalito project, including the challenges encountered and solutions implemented.

## Background

The Kalito project originally supported OpenAI's Chat Completions API for GPT-4.1 models. With the introduction of GPT-5, OpenAI introduced a new **Responses API** that provides enhanced capabilities including reasoning tokens and improved response quality.

## The Challenge

### 1. API Incompatibility
GPT-5 models use OpenAI's **Responses API** instead of the traditional Chat Completions API. This required:
- Different endpoint (`/responses` vs `/chat/completions`)
- Different parameter names and structure
- Different response format and streaming events

### 2. Parameter Differences
Key parameter differences between Chat Completions API and Responses API:

| Chat Completions API | Responses API | Notes |
|---------------------|---------------|-------|
| `max_tokens` | `max_output_tokens` | Token limit parameter |
| `temperature` | ❌ Not supported | Temperature control removed |
| `messages` array | `input` string/object | Input format changed |
| Standard streaming | Custom streaming events | Different event types |

### 3. Error Messages Encountered

#### Initial Error: "Cannot read properties of undefined (reading 'create')"
```
AI Model: Cannot read properties of undefined (reading 'create')
```
**Cause**: Attempting to access `client.beta.responses.create()` when the correct path is `client.responses.create()`

#### Temperature Parameter Error
```
AI Model: OpenAI API error (400): 400 Unsupported parameter: 'temperature' is not supported with this mode
```
**Cause**: Responses API doesn't support the `temperature` parameter that Chat Completions API uses

#### Max Tokens Parameter Error
```
AI Model: OpenAI API error (400): 400 Unsupported parameter: 'max_tokens' is not supported with this model. Use 'max_completion_tokens' instead.
```
**Cause**: GPT-5 models require `max_completion_tokens` instead of `max_tokens`

#### Frontend Type Error
```
TypeError: msg.text.includes is not a function
```
**Cause**: Backend error responses were returning objects `{error: {code, message}}` but frontend expected error strings

## The Solution

### 1. Factory Pattern Implementation

We implemented a factory pattern that supports both APIs:

```typescript
// backend/logic/adapters/openai/factory.ts

export function createOpenAIAdapter(options: OpenAIAdapterOptions): LLMAdapter {
  const { config } = options
  
  if (config.apiMode === 'responses') {
    // Use Responses API for GPT-5 models
    return createResponsesAPIAdapter(options)
  } else {
    // Use Chat Completions API for GPT-4.1 models
    return createChatAPIAdapter(options)
  }
}
```

### 2. Model Configuration

Each model is configured with its appropriate API mode:

```typescript
// backend/logic/adapters/openai/models.ts

export const OPENAI_MODELS: Record<string, OpenAIModelConfig> = {
  'gpt-4.1-mini': {
    model: 'gpt-4.1-mini',
    name: 'GPT-4.1 Mini',
    apiMode: 'chat', // Uses Chat Completions API
    // ...
  },
  'gpt-5-mini': {
    model: 'gpt-5-mini',
    name: 'GPT-5 Mini',
    apiMode: 'responses', // Uses Responses API
    // ...
  }
}
```

### 3. Responses API Implementation (No Fallbacks)

**Industry Standard Approach** - Direct Responses API usage:

```typescript
async function generateWithResponsesAPI(
  client: OpenAI,
  modelName: string,
  messages: { role: string; content: string }[],
  maxTokens: number,
  temperature: number,
  pricing?: { input: number; output: number },
  settings?: OpenAIAdapterSettings
): Promise<OpenAIGenerateResult> {
  // Convert messages to simple input format
  const input = messages.map(msg => msg.content).join('\n\n')

  const response = await client.responses.create({
    model: modelName,
    input,
    max_output_tokens: maxTokens, // Correct parameter name
    reasoning: {
      effort: settings?.reasoning_effort ?? 'medium'
    }
    // Note: No temperature parameter - not supported
  })

  const reply = response.output_text || ''
  const usage = response.usage

  return {
    reply,
    tokenUsage: usage?.total_tokens,
    estimatedCost: estimateCost(usage, pricing),
  }
}
```

### 4. Streaming Implementation

Responses API uses different streaming events:

```typescript
async function* generateStreamWithResponsesAPI(
  // ... parameters
): AsyncGenerator<OpenAIStreamChunk> {
  const stream = await client.responses.create({
    model: modelName,
    input,
    max_output_tokens: maxTokens,
    reasoning: {
      effort: settings?.reasoning_effort ?? 'medium'
    },
    stream: true
  })
    
  let finalUsage: OpenAIUsage | undefined
  
  for await (const chunk of stream) {
    // Handle different types of stream events generically
    if ('delta' in chunk && chunk.delta) {
      const delta = String(chunk.delta)
      if (delta) {
        yield { delta }
      }
    }
    
    // Handle response completion
    if ('response' in chunk && chunk.response) {
      finalUsage = (chunk.response as { usage?: OpenAIUsage }).usage
    }
  }
  
  yield {
    delta: '',
    done: true,
    tokenUsage: finalUsage?.total_tokens,
    estimatedCost: estimateCost(finalUsage, pricing),
  }
}
```

### 5. Frontend Error Handling Fix

Fixed frontend to properly handle backend error response format:

```typescript
// frontend/src/core.ts

for (const line of lines) {
  if (line.startsWith('data: ')) {
    try {
      const data = JSON.parse(line.slice(6))
      
      // Handle backend error response format
      if (data.error && typeof data.error === 'object' && data.error.message) {
        yield { error: data.error.message } // Convert object to string
      } else {
        yield data
      }
    } catch (err) {
      console.error('Failed to parse SSE data:', err)
    }
  }
}
```

## Final Architecture

### Model Support Matrix

| Model | API Mode | Endpoint | Parameters |
|-------|----------|----------|------------|
| `gpt-4.1-mini` | `chat` | `/chat/completions` | `max_tokens`, `temperature` |
| `gpt-4.1-nano` | `chat` | `/chat/completions` | `max_tokens`, `temperature` |
| `gpt-5-mini` | `responses` | `/responses` | `max_output_tokens`, `reasoning.effort` |
| `gpt-5-nano` | `responses` | `/responses` | `max_output_tokens`, `reasoning.effort` |

### Type System

```typescript
export type OpenAIModel = 
  | 'gpt-4.1-mini'
  | 'gpt-4.1-nano'
  | 'gpt-5-mini'
  | 'gpt-5-nano'

export type APIMode = 'chat' | 'responses'

export interface OpenAIAdapterSettings {
  temperature?: number // For Chat API models
  topP?: number
  maxTokens?: number
  max_output_tokens?: number
  // GPT-5 specific settings for Responses API:
  reasoning_effort?: 'low' | 'medium' | 'high'
  verbosity?: 'brief' | 'full'
}
```

## Key Success Factors

### 1. **No Fallbacks Policy**
- Implemented clean, industry-standard approach
- Each model uses its native API without fallback mechanisms
- Eliminates complexity and potential error sources

### 2. **Proper API Research**
- Studied OpenAI's official SDK source code on GitHub
- Understood the correct API endpoints and parameter names
- Followed official OpenAI documentation patterns

### 3. **Type Safety**
- Strong TypeScript typing throughout the system
- Clear separation between Chat and Responses API parameters
- Compile-time error detection

### 4. **Factory Pattern**
- Clean abstraction that handles API differences internally
- Consistent interface for both API modes
- Easy to extend for future models

## Testing and Validation

The integration was validated through:
1. **Compilation Tests**: TypeScript compilation without errors
2. **Runtime Tests**: Backend starts successfully with all 4 models
3. **API Tests**: Successful requests to both GPT-4.1 and GPT-5 models
4. **Error Handling**: Proper error message formatting and display

## Console Output Confirmation

```
[gpt-4.1-mini] Creating OpenAI adapter with chat API mode
[gpt-4.1-nano] Creating OpenAI adapter with chat API mode
[gpt-5-mini] Creating OpenAI adapter with responses API mode
[gpt-5-nano] Creating OpenAI adapter with responses API mode
```

## Lessons Learned

1. **API Evolution**: Major model releases may introduce new APIs with breaking changes
2. **Parameter Compatibility**: New APIs may not support all parameters from previous APIs
3. **Documentation Gaps**: Sometimes the official SDK source code is more reliable than documentation
4. **Error Message Analysis**: Careful analysis of error messages leads to faster problem resolution
5. **Industry Standards**: Following established patterns (no fallbacks, clean separation) leads to more maintainable code

## Future Considerations

1. **Model Updates**: Monitor OpenAI for new models and API changes
2. **Parameter Evolution**: New Responses API parameters may be added
3. **Performance Optimization**: Consider caching and connection pooling
4. **Monitoring**: Add metrics for API usage and error rates

## Conclusion

The successful GPT-5 integration demonstrates the importance of:
- Understanding API differences at a deep level
- Implementing clean, industry-standard solutions
- Avoiding complex fallback mechanisms
- Strong type safety and error handling
- Thorough testing and validation

The final implementation provides a robust, maintainable foundation for both current and future OpenAI model integrations.