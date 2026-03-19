import { generateText } from 'ai'
import { gateway } from '@ai-sdk/gateway'
import { z } from 'zod'
import { nanoid } from 'nanoid'
import { getAIModels } from './config'
import { buildBriefPrompt, type BriefPromptInput } from './prompts/brief'

const briefSchema = z.object({
  situationSummary: z.string(),
  keyFlags: z.array(
    z.object({
      label: z.string(),
      severity: z.enum(['risk', 'complexity', 'info']),
      evidence: z.string(),
    })
  ),
  firstCallQuestions: z.array(z.string()),
  backgroundContext: z.string(),
})

export type BriefData = z.infer<typeof briefSchema>

export interface BriefGenerationResult {
  generationId: string
  result: BriefData
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

export async function generateBrief(
  input: BriefPromptInput
): Promise<BriefGenerationResult> {
  const models = getAIModels()
  const generationId = nanoid()
  const startTime = Date.now()

  const prompt = buildBriefPrompt(input)

  // Use plain generateText (not Output.object) because Groq models
  // don't support json_schema response format. Parse JSON from text instead.
  const { text, usage } = await generateText({
    model: gateway(models.brief),
    prompt,
  })

  const latencyMs = Date.now() - startTime

  // Parse and validate the JSON response
  let result: BriefData
  try {
    const parsed = parseJsonFromText(text)
    result = briefSchema.parse(parsed)
  } catch {
    console.error('[brief] Failed to parse AI response as JSON:', text.slice(0, 300))
    // Return a minimal fallback brief
    result = {
      situationSummary: 'Unable to generate brief summary. Please review the intake session directly.',
      keyFlags: [],
      firstCallQuestions: [],
      backgroundContext: '',
    }
  }

  return {
    generationId,
    result,
    usage: {
      promptTokens: usage?.inputTokens ?? 0,
      completionTokens: usage?.outputTokens ?? 0,
    },
    latencyMs,
    model: models.brief,
  }
}
