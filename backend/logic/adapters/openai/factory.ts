// backend/logic/adapters/openai/factory.ts

import OpenAI from 'openai'
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import type { LLMAdapter } from '../../modelRegistry'
import type { 
  OpenAIAdapterOptions, 
  OpenAIUsage, 
  OpenAIGenerateResult,
  OpenAIStreamChunk
} from './types'

/**
 * Default OpenAI client instance
 * Uses environment variable for API key
 */
const defaultClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-xxx',
})

/**
 * Estimate cost based on token usage and pricing
 */
function estimateCost(
  usage: OpenAIUsage | undefined,
  pricing?: { input: number; output: number }
): number {
  if (!pricing || !usage) return 0

  const inputTokens = usage.prompt_tokens ?? usage.input_tokens ?? 0
  const outputTokens = usage.completion_tokens ?? usage.output_tokens ?? 0
  
  return (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000
}

/**
 * Handle OpenAI API errors with specific error types
 */
function handleOpenAIError(error: unknown, modelName: string): never {
  const err = error as { status?: number; message?: string }
  
  console.error(`[${modelName}] OpenAI API error:`, error)
  
  if (err?.status === 429) {
    throw new Error('Rate limit exceeded. Please try again shortly.')
  }
  
  if (err?.status === 401) {
    throw new Error('OpenAI API authentication failed. Please check your API key.')
  }
  
  if (err?.status === 404) {
    throw new Error(`Model "${modelName}" not found or not accessible.`)
  }
  
  if (err?.status) {
    throw new Error(`OpenAI API error (${err.status}): ${err.message || 'Unknown error'}`)
  }
  
  throw error as Error
}

/**
 * Generate response using Chat Completions API
 */
async function generateWithChatAPI(
  client: OpenAI,
  modelName: string,
  messages: { role: string; content: string }[],
  maxTokens: number,
  temperature: number,
  pricing?: { input: number; output: number },
  settings?: Record<string, unknown>
): Promise<OpenAIGenerateResult> {
  const castMessages = messages as ChatCompletionMessageParam[]
  
  // Build OpenAI API parameters with additional settings
  const completion = await client.chat.completions.create({
    model: modelName,
    messages: castMessages,
    max_tokens: maxTokens,
    temperature,
    top_p: settings?.topP as number | undefined,
    frequency_penalty: settings?.frequencyPenalty as number | undefined,
    presence_penalty: settings?.presencePenalty as number | undefined,
  })
  
  const reply = completion.choices[0]?.message?.content ?? ''
  const usage = completion.usage
  
  return {
    reply,
    tokenUsage: usage?.total_tokens,
    estimatedCost: estimateCost(usage, pricing),
  }
}

/**
 * Generate streaming response using Chat Completions API
 */
async function* generateStreamWithChatAPI(
  client: OpenAI,
  modelName: string,
  messages: { role: string; content: string }[],
  maxTokens: number,
  temperature: number,
  pricing?: { input: number; output: number },
  settings?: Record<string, unknown>
): AsyncGenerator<OpenAIStreamChunk> {
  const castMessages = messages as ChatCompletionMessageParam[]
  
  const stream = await client.chat.completions.create({
    model: modelName,
    messages: castMessages,
    max_tokens: maxTokens,
    temperature,
    stream: true,
    stream_options: { include_usage: true },
    top_p: settings?.topP as number | undefined,
    frequency_penalty: settings?.frequencyPenalty as number | undefined,
    presence_penalty: settings?.presencePenalty as number | undefined,
  })
  
  let finalUsage: OpenAIUsage | undefined
  
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content ?? ''
    
    if (delta) {
      yield { delta }
    }
    
    // Capture final usage information
    if (chunk.usage) {
      finalUsage = chunk.usage
    }
  }
  
  // Yield completion with final metrics
  yield {
    delta: '',
    done: true,
    tokenUsage: finalUsage?.total_tokens,
    estimatedCost: estimateCost(finalUsage, pricing),
  }
}

/**
 * Generate response using Responses API (if available and configured)
 */
async function generateWithResponsesAPI(
  client: OpenAI,
  modelName: string,
  messages: { role: string; content: string }[],
  maxTokens: number,
  temperature: number,
  pricing?: { input: number; output: number }
): Promise<OpenAIGenerateResult> {
  // Responses API doesn't support temperature parameter
  const response = await (client as unknown as { responses: { create: (_params: unknown) => Promise<{ output_text?: string; usage?: OpenAIUsage }> } }).responses.create({
    model: modelName,
    input: messages,
    max_output_tokens: maxTokens,
    // Note: temperature not supported in Responses API
  })
  
  const reply = response.output_text ?? ''
  const usage = response.usage
  
  return {
    reply,
    tokenUsage: usage?.total_tokens,
    estimatedCost: estimateCost(usage, pricing),
  }
}

/**
 * Generate streaming response using Responses API (if available and configured)
 */
async function* generateStreamWithResponsesAPI(
  client: OpenAI,
  modelName: string,
  messages: { role: string; content: string }[],
  maxTokens: number,
  temperature: number,
  pricing?: { input: number; output: number }
): AsyncGenerator<OpenAIStreamChunk> {
  // Responses API doesn't support temperature parameter
  const stream = await (client as unknown as { responses: { stream: (_params: unknown) => AsyncGenerator<{ type: string; delta?: string; response?: { usage?: OpenAIUsage } }> } }).responses.stream({
    model: modelName,
    input: messages,
    max_output_tokens: maxTokens,
    // Note: temperature not supported in Responses API
  })
  
  let finalUsage: OpenAIUsage | undefined
  
  for await (const event of stream) {
    if (event.type === 'response.output_text.delta' && event.delta) {
      yield { delta: event.delta }
    }
    
    if (event.type === 'response.completed' && event.response?.usage) {
      finalUsage = event.response.usage
    }
  }
  
  yield {
    delta: '',
    done: true,
    tokenUsage: finalUsage?.total_tokens,
    estimatedCost: estimateCost(finalUsage, pricing),
  }
}

/**
 * Creates an OpenAI LLM adapter using the factory pattern
 * 
 * This factory eliminates code duplication across OpenAI models and provides
 * a consistent interface while supporting both Chat Completions and Responses APIs.
 */
export function createOpenAIAdapter(options: OpenAIAdapterOptions): LLMAdapter {
  const { config, client = defaultClient } = options
  const adapterId = options.id ?? config.model
  const adapterName = options.name ?? config.name
  
  // Type assertion for OpenAI client
  const openaiClient = client as OpenAI
  
  console.log(`[${adapterId}] Creating OpenAI adapter with ${config.apiMode} API mode`)
  
  return {
    id: adapterId,
    name: adapterName,
    type: 'cloud',
    contextWindow: config.contextWindow,
    
    async generate({
      messages,
      settings = {},
    }: {
      messages: { role: string; content: string }[]
      settings?: Record<string, unknown>
    }): Promise<{ reply: string; tokenUsage: number | null }> {
      const maxTokens = (settings.maxTokens as number) ?? config.defaultMaxTokens
      const temperature = (settings.temperature as number) ?? config.defaultTemperature
      
      try {
        let result: OpenAIGenerateResult
        
        if (config.apiMode === 'responses') {
          result = await generateWithResponsesAPI(
            openaiClient,
            config.model,
            messages,
            maxTokens,
            temperature,
            config.pricing
          )
        } else {
          result = await generateWithChatAPI(
            openaiClient,
            config.model,
            messages,
            maxTokens,
            temperature,
            config.pricing,
            settings
          )
        }
        
        console.log(`[${adapterId}] Generation successful:`, {
          replyLength: result.reply.length,
          tokenUsage: result.tokenUsage,
          estimatedCost: result.estimatedCost ? `$${result.estimatedCost.toFixed(6)}` : 'N/A'
        })
        
        return {
          reply: result.reply,
          tokenUsage: result.tokenUsage ?? null,
        }
        
      } catch (error) {
        handleOpenAIError(error, adapterId)
      }
    },
    
    async *generateStream({
      messages,
      settings = {},
    }: {
      messages: { role: string; content: string }[]
      settings?: Record<string, unknown>
    }): AsyncGenerator<{ delta: string; done?: boolean; tokenUsage?: number }> {
      const maxTokens = (settings.maxTokens as number) ?? config.defaultMaxTokens
      const temperature = (settings.temperature as number) ?? config.defaultTemperature
      
      try {
        if (config.apiMode === 'responses') {
          for await (const chunk of generateStreamWithResponsesAPI(
            openaiClient,
            config.model,
            messages,
            maxTokens,
            temperature,
            config.pricing
          )) {
            yield {
              delta: chunk.delta,
              done: chunk.done,
              tokenUsage: chunk.tokenUsage,
            }
          }
        } else {
          for await (const chunk of generateStreamWithChatAPI(
            openaiClient,
            config.model,
            messages,
            maxTokens,
            temperature,
            config.pricing,
            settings
          )) {
            yield {
              delta: chunk.delta,
              done: chunk.done,
              tokenUsage: chunk.tokenUsage,
            }
          }
        }
        
      } catch (error) {
        handleOpenAIError(error, adapterId)
      }
    },
  }
}
