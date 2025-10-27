// backend/logic/adapters/openai/factory.ts

import OpenAI from 'openai'
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import type { ChatCompletionTool } from 'openai/resources'
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
  settings?: Record<string, unknown>,
  tools?: ChatCompletionTool[]
): Promise<OpenAIGenerateResult & { toolCalls?: Array<{ id: string; name: string; arguments: string }> }> {
  // Function calling enabled for this request
  
  const castMessages = messages as ChatCompletionMessageParam[]
  
  // Build OpenAI API parameters with additional settings
  const apiParams: {
    model: string
    messages: ChatCompletionMessageParam[]
    temperature: number
    top_p?: number
    frequency_penalty?: number
    presence_penalty?: number
    max_tokens: number
    tools?: ChatCompletionTool[]
    tool_choice?: 'auto'
  } = {
    model: modelName,
    messages: castMessages,
    temperature,
    top_p: settings?.topP as number | undefined,
    frequency_penalty: settings?.frequencyPenalty as number | undefined,
    presence_penalty: settings?.presencePenalty as number | undefined,
    max_tokens: maxTokens,
  }
  
  // Add tools if provided
  if (tools && tools.length > 0) {
    apiParams.tools = tools
    apiParams.tool_choice = 'auto'
  }
  
  const completion = await client.chat.completions.create(apiParams)
  
  const message = completion.choices[0]?.message
  const reply = message?.content ?? ''
  const usage = completion.usage
  
  // Extract tool calls if any
  const toolCalls = message?.tool_calls
    ?.filter(tc => tc.type === 'function')
    .map(tc => ({
      id: tc.id,
      name: tc.type === 'function' ? tc.function.name : '',
      arguments: tc.type === 'function' ? tc.function.arguments : '',
    }))
  
  return {
    reply,
    tokenUsage: usage?.total_tokens,
    estimatedCost: estimateCost(usage, pricing),
    toolCalls,
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
 * Factory function for creating OpenAI adapters
 * 
 * This factory eliminates code duplication across OpenAI models and provides
 * a consistent interface using the Chat Completions API.
 */
export function createOpenAIAdapter(options: OpenAIAdapterOptions): LLMAdapter {
  const { config, client = defaultClient } = options
  const adapterId = options.id ?? config.model
  const adapterName = options.name ?? config.name
  
  // Type assertion for OpenAI client
  const openaiClient = client as OpenAI
  
  console.log(`[${adapterId}] Creating OpenAI adapter with Chat Completions API`)
  
  return {
    id: adapterId,
    name: adapterName,
    type: 'cloud',
    contextWindow: config.contextWindow,
    
    async generate({
      messages,
      settings = {},
      tools,
    }: {
      messages: { role: string; content: string }[]
      settings?: Record<string, unknown>
      tools?: ChatCompletionTool[]
    }): Promise<{ reply: string; tokenUsage: number | null; toolCalls?: Array<{ id: string; name: string; arguments: string }> }> {
      const maxTokens = (settings.maxTokens as number) ?? config.defaultMaxTokens
      const temperature = (settings.temperature as number) ?? config.defaultTemperature
      
      try {
        const result = await generateWithChatAPI(
          openaiClient,
          config.model,
          messages,
          maxTokens,
          temperature,
          config.pricing,
          settings,
          tools
        )
        
        console.log(`[${adapterId}] Generation successful:`, {
          replyLength: result.reply.length,
          tokenUsage: result.tokenUsage,
          estimatedCost: result.estimatedCost ? `$${result.estimatedCost.toFixed(6)}` : 'N/A',
          toolCalls: result.toolCalls?.length ?? 0,
        })
        
        return {
          reply: result.reply,
          tokenUsage: result.tokenUsage ?? null,
          toolCalls: result.toolCalls,
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
        
      } catch (error) {
        handleOpenAIError(error, adapterId)
      }
    },
  }
}
