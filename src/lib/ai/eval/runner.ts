/**
 * Model Evaluation Runner
 *
 * Runs eval fixtures against the follow-up generation pipeline for a given model.
 *
 * Usage:
 *   npx tsx src/lib/ai/eval/runner.ts groq/llama-3.3-70b-versatile
 *   npx tsx src/lib/ai/eval/runner.ts openai/gpt-5.4
 *
 * Output: writes JSON results to src/lib/ai/eval/results/<model-slug>-<timestamp>.json
 */

import { generateText } from 'ai'
import { gateway } from '@ai-sdk/gateway'
import { z } from 'zod'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { evalFixtures, type EvalFixture } from './fixtures'
import { buildFollowUpPrompt } from '../prompts/follow-up'

const __dirname = dirname(fileURLToPath(import.meta.url))

const followUpSchema = z.object({
  ask_followup: z.boolean(),
  question: z.string().nullable(),
})

// ── Cost estimates per 1M tokens (USD) ───────────────────────────────
// Used for rough cost calculation. Add models as needed.
const COST_PER_1M_TOKENS: Record<string, { input: number; output: number }> = {
  'groq/llama-3.3-70b-versatile': { input: 0.59, output: 0.79 },
  'groq/llama-3.1-8b-instant': { input: 0.05, output: 0.08 },
  'groq/qwen-qwq-32b': { input: 0.29, output: 0.39 },
  'openai/gpt-5.4': { input: 2.50, output: 10.0 },
  'openai/gpt-oss-120b': { input: 0.0, output: 0.0 },
  'openai/gpt-oss-20b': { input: 0.0, output: 0.0 },
  'anthropic/claude-sonnet-4.6': { input: 3.0, output: 15.0 },
}

const DEFAULT_COST = { input: 1.0, output: 3.0 }

function parseJsonFromText(text: string): unknown {
  let cleaned = text.trim()
  // Strip markdown code fences
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '')
  }
  // Try direct parse first
  try {
    return JSON.parse(cleaned)
  } catch {
    // Fall back: extract first JSON object from the text
    const match = cleaned.match(/\{[\s\S]*?\}/)
    if (match) {
      return JSON.parse(match[0])
    }
    throw new Error('No JSON object found in response')
  }
}

function estimateCost(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const rates = COST_PER_1M_TOKENS[model] ?? DEFAULT_COST
  return (promptTokens * rates.input + completionTokens * rates.output) / 1_000_000
}

export interface EvalResult {
  fixtureId: string
  category: EvalFixture['category']
  expectedBehavior: EvalFixture['expectedBehavior']
  actualBehavior: 'should-follow-up' | 'should-not-follow-up'
  correct: boolean
  followUpQuestion: string | null
  latencyMs: number
  promptTokens: number
  completionTokens: number
  estimatedCostUsd: number
  rawResponse: string
  parseError: boolean
}

export interface EvalRunSummary {
  model: string
  timestamp: string
  fixtureCount: number
  accuracy: number
  precision: number
  recall: number
  avgLatencyMs: number
  avgCostUsd: number
  totalCostUsd: number
  results: EvalResult[]
}

async function runFixture(
  fixture: EvalFixture,
  model: string
): Promise<EvalResult> {
  const prompt = buildFollowUpPrompt({
    question: fixture.questionPrompt,
    answer: fixture.clientAnswer,
    personaContext: 'General professional service client',
    followUpCount: 0,
  })

  const startTime = Date.now()
  let rawResponse = ''
  let promptTokens = 0
  let completionTokens = 0
  let parseError = false
  let askFollowUp = false
  let followUpQuestion: string | null = null

  try {
    const { text, usage } = await generateText({
      model: gateway(model),
      prompt,
    })

    rawResponse = text
    promptTokens = usage?.inputTokens ?? 0
    completionTokens = usage?.outputTokens ?? 0

    try {
      const parsed = parseJsonFromText(text)
      const validated = followUpSchema.parse(parsed)
      askFollowUp = validated.ask_followup
      followUpQuestion = validated.question
    } catch {
      parseError = true
      // If we can't parse, treat as no follow-up (matches production behavior)
      askFollowUp = false
      followUpQuestion = null
    }
  } catch (err) {
    rawResponse = `ERROR: ${err instanceof Error ? err.message : String(err)}`
    parseError = true
  }

  const latencyMs = Date.now() - startTime
  const actualBehavior: EvalResult['actualBehavior'] = askFollowUp
    ? 'should-follow-up'
    : 'should-not-follow-up'

  return {
    fixtureId: fixture.id,
    category: fixture.category,
    expectedBehavior: fixture.expectedBehavior,
    actualBehavior,
    correct: actualBehavior === fixture.expectedBehavior,
    followUpQuestion,
    latencyMs,
    promptTokens,
    completionTokens,
    estimatedCostUsd: estimateCost(model, promptTokens, completionTokens),
    rawResponse,
    parseError,
  }
}

function computeSummary(model: string, results: EvalResult[]): EvalRunSummary {
  const correct = results.filter((r) => r.correct).length
  const accuracy = correct / results.length

  // Precision: of all predicted follow-ups, how many were correct?
  const predictedFollowUp = results.filter(
    (r) => r.actualBehavior === 'should-follow-up'
  )
  const truePositives = predictedFollowUp.filter((r) => r.correct).length
  const precision =
    predictedFollowUp.length > 0 ? truePositives / predictedFollowUp.length : 1

  // Recall: of all expected follow-ups, how many were predicted?
  const expectedFollowUp = results.filter(
    (r) => r.expectedBehavior === 'should-follow-up'
  )
  const detectedFollowUp = expectedFollowUp.filter((r) => r.correct).length
  const recall =
    expectedFollowUp.length > 0 ? detectedFollowUp / expectedFollowUp.length : 1

  const totalLatency = results.reduce((sum, r) => sum + r.latencyMs, 0)
  const totalCost = results.reduce((sum, r) => sum + r.estimatedCostUsd, 0)

  return {
    model,
    timestamp: new Date().toISOString(),
    fixtureCount: results.length,
    accuracy: Math.round(accuracy * 1000) / 1000,
    precision: Math.round(precision * 1000) / 1000,
    recall: Math.round(recall * 1000) / 1000,
    avgLatencyMs: Math.round(totalLatency / results.length),
    avgCostUsd: totalCost / results.length,
    totalCostUsd: totalCost,
    results,
  }
}

async function main() {
  const model = process.argv[2]
  if (!model) {
    console.error('Usage: npx tsx src/lib/ai/eval/runner.ts <model-name>')
    console.error('Example: npx tsx src/lib/ai/eval/runner.ts groq/llama-3.3-70b-versatile')
    process.exit(1)
  }

  console.log(`\n=== IntakeForm.ai Model Evaluation ===`)
  console.log(`Model: ${model}`)
  console.log(`Fixtures: ${evalFixtures.length}`)
  console.log(`Started: ${new Date().toISOString()}\n`)

  const results: EvalResult[] = []

  for (const fixture of evalFixtures) {
    process.stdout.write(`  [${fixture.id}] ${fixture.category.padEnd(12)} `)

    const result = await runFixture(fixture, model)
    results.push(result)

    const status = result.correct ? 'PASS' : 'FAIL'
    const icon = result.correct ? '\u2713' : '\u2717'
    const parseFlag = result.parseError ? ' (PARSE ERROR)' : ''
    console.log(
      `${icon} ${status} | ${result.latencyMs}ms | expected=${result.expectedBehavior}, got=${result.actualBehavior}${parseFlag}`
    )
  }

  const summary = computeSummary(model, results)

  console.log(`\n=== Results ===`)
  console.log(`Accuracy:    ${(summary.accuracy * 100).toFixed(1)}%`)
  console.log(`Precision:   ${(summary.precision * 100).toFixed(1)}%`)
  console.log(`Recall:      ${(summary.recall * 100).toFixed(1)}%`)
  console.log(`Avg Latency: ${summary.avgLatencyMs}ms`)
  console.log(`Total Cost:  $${summary.totalCostUsd.toFixed(6)}`)

  // Write results JSON
  const resultsDir = join(__dirname, 'results')
  mkdirSync(resultsDir, { recursive: true })

  const modelSlug = model.replace(/\//g, '--')
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const outputPath = join(resultsDir, `${modelSlug}-${timestamp}.json`)

  writeFileSync(outputPath, JSON.stringify(summary, null, 2))
  console.log(`\nResults written to: ${outputPath}`)
}

main().catch((err) => {
  console.error('Eval runner failed:', err)
  process.exit(1)
})
