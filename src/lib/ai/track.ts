import { getDb } from '@/lib/db'
import { generations } from '@/lib/db/schema'

interface TrackGenerationInput {
  id: string
  sessionId: string
  task: 'followup' | 'brief' | 'flags'
  model: string
  promptTokens: number
  completionTokens: number
  latencyMs: number
}

// Cost estimation in microcents (1 microcent = $0.000001)
function estimateCostMicrocents(model: string, promptTokens: number, completionTokens: number): number {
  // Groq Llama 3.3 70B: $0.00006/1K input, $0.00006/1K output
  if (model.includes('groq/')) {
    return Math.round((promptTokens * 0.06 + completionTokens * 0.06) / 1000 * 100)
  }
  // Anthropic Claude Sonnet: $0.003/1K input, $0.015/1K output
  if (model.includes('anthropic/')) {
    return Math.round((promptTokens * 3 + completionTokens * 15) / 1000 * 100)
  }
  // OpenAI GPT-5.4: $2.50/1M input, $10/1M output
  if (model.includes('openai/')) {
    return Math.round((promptTokens * 0.25 + completionTokens * 1) / 1000 * 100)
  }
  // Default estimate
  return Math.round((promptTokens * 0.1 + completionTokens * 0.3) / 1000 * 100)
}

export async function trackGeneration(input: TrackGenerationInput) {
  const db = getDb()
  await db.insert(generations).values({
    id: input.id,
    sessionId: input.sessionId,
    task: input.task,
    model: input.model,
    promptTokens: input.promptTokens,
    completionTokens: input.completionTokens,
    estimatedCostMicrocents: estimateCostMicrocents(input.model, input.promptTokens, input.completionTokens),
    latencyMs: input.latencyMs,
  })
}
