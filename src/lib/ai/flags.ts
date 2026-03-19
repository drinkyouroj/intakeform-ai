import { generateText } from 'ai'
import { gateway } from '@ai-sdk/gateway'
import { z } from 'zod'
import { nanoid } from 'nanoid'
import { getAIModels } from './config'
import { buildFlagPrompt, type FlagPromptInput } from './prompts/flags'

const flagSchema = z.object({
  flags: z.array(
    z.object({
      label: z.string(),
      severity: z.enum(['risk', 'complexity', 'info']),
      evidence: z.string(),
    })
  ),
})

export type FlagResult = z.infer<typeof flagSchema>

export interface FlagGenerationResult {
  generationId: string
  result: FlagResult
  usage: { promptTokens: number; completionTokens: number }
  latencyMs: number
  model: string
}

/**
 * Parse JSON from LLM text response, handling markdown code fences and whitespace.
 */
function parseJsonFromText(text: string): unknown {
  let cleaned = text.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '')
  }
  return JSON.parse(cleaned)
}

export async function generateFlags(
  input: FlagPromptInput
): Promise<FlagGenerationResult> {
  const models = getAIModels()
  const generationId = nanoid()
  const startTime = Date.now()

  const prompt = buildFlagPrompt(input)

  // Use plain generateText (not Output.object) because Groq models
  // don't support json_schema response format. Parse JSON from text instead.
  const { text, usage } = await generateText({
    model: gateway(models.flags),
    prompt,
  })

  const latencyMs = Date.now() - startTime

  // Parse and validate the JSON response
  let result: FlagResult
  try {
    const parsed = parseJsonFromText(text)
    result = flagSchema.parse(parsed)
  } catch {
    console.warn('[flags] Failed to parse AI response as JSON:', text.slice(0, 300))
    result = { flags: [] }
  }

  return {
    generationId,
    result,
    usage: {
      promptTokens: usage?.inputTokens ?? 0,
      completionTokens: usage?.outputTokens ?? 0,
    },
    latencyMs,
    model: models.flags,
  }
}
