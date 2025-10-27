/**
 * tools.ts
 * Function calling tools for AI agents
 * Defines tools that the AI model can invoke to perform actions like web search
 */

import { searchWeb } from './tavilyService'
import type { SearchOptions } from '../types/search'

/**
 * OpenAI function calling tool definitions
 * These tell the model what tools are available and how to use them
 */
export const AVAILABLE_TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'web_search',
      description: 'Search the internet for current information, news, facts, or research. Use this when you need up-to-date information that may not be in your training data, or when the user explicitly asks you to search online or look something up. Returns AI-generated answer along with source URLs.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query. Be specific and clear. Examples: "latest research on carbidopa-levodopa side effects", "current treatment guidelines for Parkinson\'s disease"',
          },
          max_results: {
            type: 'number',
            description: 'Maximum number of search results to return (1-10). Default is 5.',
            minimum: 1,
            maximum: 10,
          },
          include_answer: {
            type: 'boolean',
            description: 'Whether to include an AI-generated answer based on search results. Highly recommended. Default is true.',
          },
          search_depth: {
            type: 'string',
            enum: ['basic', 'advanced'],
            description: 'Search depth: "basic" for quick results, "advanced" for more comprehensive search. Default is "basic".',
          },
        },
        required: ['query'],
      },
    },
  },
] as const

/**
 * Execute a tool call based on the function name and arguments
 */
export async function executeToolCall(
  functionName: string,
  functionArgs: Record<string, unknown>
): Promise<string> {
  console.log(`[Tools] Executing tool: ${functionName}`, functionArgs)

  switch (functionName) {
    case 'web_search': {
      const { query, max_results, include_answer, search_depth } = functionArgs as {
        query: string
        max_results?: number
        include_answer?: boolean
        search_depth?: 'basic' | 'advanced'
      }

      if (!query || typeof query !== 'string') {
        return JSON.stringify({
          error: 'Invalid query parameter. Query must be a non-empty string.',
        })
      }

      try {
        const options: SearchOptions = {
          max_results: max_results ?? 5,
          include_answer: include_answer ?? true,
          search_depth: search_depth ?? 'basic',
        }

        const results = await searchWeb(query, options)

        // Format results for the AI model
        const formattedResults = {
          query: results.query,
          answer: results.answer,
          sources: results.results.map((r) => ({
            title: r.title,
            url: r.url,
            excerpt: r.content.substring(0, 300), // Limit excerpt length
          })),
          results_count: results.results_count,
        }

        return JSON.stringify(formattedResults, null, 2)
      } catch (error) {
        console.error('[Tools] Web search failed:', error)
        return JSON.stringify({
          error: `Web search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        })
      }
    }

    default:
      return JSON.stringify({
        error: `Unknown tool: ${functionName}`,
      })
  }
}
