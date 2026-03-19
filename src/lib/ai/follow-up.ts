import { generateText } from 'ai'
import { gateway } from '@ai-sdk/gateway'
import { z } from 'zod'
import { nanoid } from 'nanoid'
import { getAIModels } from './config'
import { buildFollowUpPrompt, type FollowUpPromptInput } from './prompts/follow-up'

const followUpSchema = z.object({
  ask_followup: z.boolean(),
  question: z.string().nullable(),
})

export type FollowUpResult = z.infer<typeof followUpSchema>

export interface FollowUpGenerationResult {
  generationId: string
  result: FollowUpResult
  usage: { promptTokens: number; completionTokens: number }
  latencyMs: number
  model: string
}

/**
 * Parse JSON from LLM text response, handling markdown code fences and whitespace.
 */
function parseJsonFromText(text: string): unknown {
  // Strip markdown code fences if present
  let cleaned = text.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '')
  }
  return JSON.parse(cleaned)
}

export async function generateFollowUp(
  input: FollowUpPromptInput
): Promise<FollowUpGenerationResult> {
  // Short-circuit if max follow-ups reached
  if (input.followUpCount >= 2) {
    return {
      generationId: nanoid(),
      result: { ask_followup: false, question: null },
      usage: { promptTokens: 0, completionTokens: 0 },
      latencyMs: 0,
      model: 'none',
    }
  }

  const models = getAIModels()
  const generationId = nanoid()
  const startTime = Date.now()

  const prompt = buildFollowUpPrompt(input)

  // Use plain generateText (not Output.object) because many Groq models
  // don't support json_schema response format. Parse JSON from text instead.
  const { text, usage } = await generateText({
    model: gateway(models.followUp),
    prompt,
  })

  const latencyMs = Date.now() - startTime

  // Parse and validate the JSON response
  let result: FollowUpResult
  try {
    const parsed = parseJsonFromText(text)
    result = followUpSchema.parse(parsed)
  } catch {
    // If parsing fails, default to no follow-up
    console.warn('[follow-up] Failed to parse AI response as JSON:', text.slice(0, 200))
    result = { ask_followup: false, question: null }
  }

  return {
    generationId,
    result,
    usage: {
      promptTokens: usage?.inputTokens ?? 0,
      completionTokens: usage?.outputTokens ?? 0,
    },
    latencyMs,
    model: models.followUp,
  }
}
