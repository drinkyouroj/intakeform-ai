/**
 * Eval Report Generator
 *
 * Reads eval result JSON files and generates a markdown comparison table.
 * When multiple runs exist for the same model, keeps only the best clean run.
 *
 * Usage:
 *   npx tsx src/lib/ai/eval/report.ts           # all results, deduplicated
 *   npx tsx src/lib/ai/eval/report.ts --all      # all results, no dedup
 *   npx tsx src/lib/ai/eval/report.ts results/groq--llama-3.3-70b-versatile-*.json
 */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { EvalRunSummary } from './runner'

const __dirname = dirname(fileURLToPath(import.meta.url))

// A run with >25% rate-limited fixtures is considered unreliable
const RATE_LIMIT_THRESHOLD = 0.25

function loadResults(paths: string[]): EvalRunSummary[] {
  return paths.map((p) => {
    const raw = readFileSync(p, 'utf-8')
    return JSON.parse(raw) as EvalRunSummary
  })
}

function findResultFiles(): string[] {
  const resultsDir = join(__dirname, 'results')
  try {
    const files = readdirSync(resultsDir)
      .filter((f) => f.endsWith('.json'))
      .sort()
    return files.map((f) => join(resultsDir, f))
  } catch {
    return []
  }
}

function getRateLimitedRatio(s: EvalRunSummary): number {
  const rateLimited = s.results.filter((r) => r.rateLimited).length
  return s.fixtureCount > 0 ? rateLimited / s.fixtureCount : 0
}

/**
 * Deduplicate runs: for each model, pick the best clean run.
 * "Clean" = less than 25% rate-limited fixtures.
 * "Best" = highest accuracy among clean runs, ties broken by most recent.
 */
function deduplicateByModel(summaries: EvalRunSummary[]): {
  kept: EvalRunSummary[]
  dropped: { model: string; timestamp: string; reason: string }[]
} {
  const byModel = new Map<string, EvalRunSummary[]>()
  for (const s of summaries) {
    const list = byModel.get(s.model) ?? []
    list.push(s)
    byModel.set(s.model, list)
  }

  const kept: EvalRunSummary[] = []
  const dropped: { model: string; timestamp: string; reason: string }[] = []

  for (const [model, runs] of byModel) {
    const clean = runs.filter((r) => getRateLimitedRatio(r) < RATE_LIMIT_THRESHOLD)
    const tainted = runs.filter((r) => getRateLimitedRatio(r) >= RATE_LIMIT_THRESHOLD)

    for (const t of tainted) {
      const pct = (getRateLimitedRatio(t) * 100).toFixed(0)
      dropped.push({
        model,
        timestamp: t.timestamp,
        reason: `${pct}% rate-limited`,
      })
    }

    if (clean.length === 0) {
      // No clean runs — pick least-tainted
      const best = runs.sort((a, b) => getRateLimitedRatio(a) - getRateLimitedRatio(b))[0]
      kept.push(best)
      // Drop the rest
      for (const r of runs.filter((r) => r !== best)) {
        dropped.push({ model, timestamp: r.timestamp, reason: 'superseded' })
      }
    } else if (clean.length === 1) {
      kept.push(clean[0])
    } else {
      // Multiple clean runs — pick highest accuracy, break ties by most recent
      const sorted = clean.sort((a, b) => {
        if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      })
      kept.push(sorted[0])
      for (const r of sorted.slice(1)) {
        dropped.push({ model, timestamp: r.timestamp, reason: 'superseded by better run' })
      }
    }
  }

  // Sort kept by accuracy descending
  kept.sort((a, b) => b.accuracy - a.accuracy)

  return { kept, dropped }
}

function generateMarkdown(
  summaries: EvalRunSummary[],
  dropped?: { model: string; timestamp: string; reason: string }[]
): string {
  const lines: string[] = []

  lines.push('# IntakeForm.ai Model Evaluation Report')
  lines.push('')
  lines.push(`Generated: ${new Date().toISOString()}`)
  lines.push('')

  // ── Summary Table ──────────────────────────────────────────────────
  lines.push('## Model Comparison')
  lines.push('')
  lines.push(
    '| Model | Accuracy | Precision | Recall | Avg Latency | Avg Cost | Total Cost | Scored |'
  )
  lines.push(
    '|-------|----------|-----------|--------|-------------|----------|------------|--------|'
  )

  for (const s of summaries) {
    const rateLimited = s.results.filter((r) => r.rateLimited).length
    const scored = s.fixtureCount - rateLimited
    lines.push(
      `| ${s.model} | ${(s.accuracy * 100).toFixed(1)}% | ${(s.precision * 100).toFixed(1)}% | ${(s.recall * 100).toFixed(1)}% | ${s.avgLatencyMs}ms | $${s.avgCostUsd.toFixed(6)} | $${s.totalCostUsd.toFixed(6)} | ${scored}/${s.fixtureCount} |`
    )
  }

  lines.push('')

  // ── Dropped runs ───────────────────────────────────────────────────
  if (dropped && dropped.length > 0) {
    lines.push(`<details>`)
    lines.push(`<summary>${dropped.length} run(s) excluded from report</summary>`)
    lines.push('')
    lines.push('| Model | Run Date | Reason |')
    lines.push('|-------|----------|--------|')
    for (const d of dropped) {
      lines.push(`| ${d.model} | ${d.timestamp} | ${d.reason} |`)
    }
    lines.push('')
    lines.push('</details>')
    lines.push('')
  }

  // ── Per-Model Breakdown ────────────────────────────────────────────
  for (const s of summaries) {
    const rateLimited = s.results.filter((r) => r.rateLimited).length
    lines.push(`## ${s.model}`)
    lines.push('')
    lines.push(`Run: ${s.timestamp} | Fixtures: ${s.fixtureCount}${rateLimited > 0 ? ` (${rateLimited} rate-limited)` : ''}`)
    lines.push('')

    const categories = ['vague', 'complete', 'risk', 'multi-topic', 'adversarial', 'short'] as const
    lines.push('### Per-Category Accuracy')
    lines.push('')
    lines.push('| Category | Correct | Total | Accuracy |')
    lines.push('|----------|---------|-------|----------|')

    for (const cat of categories) {
      const catResults = s.results.filter((r) => r.category === cat && !r.rateLimited)
      if (catResults.length === 0) continue
      const correct = catResults.filter((r) => r.correct).length
      const acc = ((correct / catResults.length) * 100).toFixed(0)
      lines.push(`| ${cat} | ${correct} | ${catResults.length} | ${acc}% |`)
    }

    lines.push('')

    // Failures detail (exclude rate-limited)
    const failures = s.results.filter((r) => !r.correct && !r.rateLimited)
    if (failures.length > 0) {
      lines.push('### Failures')
      lines.push('')
      lines.push('| Fixture | Category | Expected | Got | Follow-up Question |')
      lines.push('|---------|----------|----------|-----|--------------------|')
      for (const f of failures) {
        const question = f.followUpQuestion
          ? f.followUpQuestion.replace(/\|/g, '\\|')
          : '-'
        lines.push(
          `| ${f.fixtureId} | ${f.category} | ${f.expectedBehavior} | ${f.actualBehavior} | ${question} |`
        )
      }
      lines.push('')
    }

    // Parse errors (exclude rate-limited)
    const parseErrors = s.results.filter((r) => r.parseError && !r.rateLimited)
    if (parseErrors.length > 0) {
      lines.push('### Parse Errors')
      lines.push('')
      for (const pe of parseErrors) {
        lines.push(`- **${pe.fixtureId}**: \`${pe.rawResponse.slice(0, 120)}\``)
      }
      lines.push('')
    }
  }

  return lines.join('\n')
}

function main() {
  const args = process.argv.slice(2)
  const showAll = args.includes('--all')
  const filePaths = args.filter((a) => !a.startsWith('--'))

  let paths: string[]
  if (filePaths.length > 0) {
    paths = filePaths
  } else {
    paths = findResultFiles()
  }

  if (paths.length === 0) {
    console.error('No result files found. Run the eval runner first:')
    console.error('  pnpm eval groq/llama-3.3-70b-versatile')
    process.exit(1)
  }

  console.log(`Loading ${paths.length} result file(s)...`)
  const allSummaries = loadResults(paths)

  let summaries: EvalRunSummary[]
  let dropped: { model: string; timestamp: string; reason: string }[] | undefined

  if (showAll) {
    summaries = allSummaries.sort((a, b) => b.accuracy - a.accuracy)
  } else {
    const result = deduplicateByModel(allSummaries)
    summaries = result.kept
    dropped = result.dropped
    if (dropped.length > 0) {
      console.log(`Excluded ${dropped.length} run(s) (rate-limited or superseded)`)
    }
  }

  console.log(`Reporting on ${summaries.length} model(s)`)

  const markdown = generateMarkdown(summaries, dropped)

  const outputPath = join(__dirname, 'results', 'report.md')
  writeFileSync(outputPath, markdown)
  console.log(`Report written to: ${outputPath}`)

  // Also print to stdout
  console.log('')
  console.log(markdown)
}

main()
