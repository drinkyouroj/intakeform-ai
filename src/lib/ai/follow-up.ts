import { generateText, Output } from 'ai'
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

  const { output, usage } = await generateText({
    model: models.followUp,
    output: Output.object({ schema: followUpSchema }),
    prompt,
  })

  const latencyMs = Date.now() - startTime

  return {
    generationId,
    result: output ?? { ask_followup: false, question: null },
    usage: {
      promptTokens: usage?.inputTokens ?? 0,
      completionTokens: usage?.outputTokens ?? 0,
    },
    latencyMs,
    model: models.followUp,
  }
}
