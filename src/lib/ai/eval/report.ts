/**
 * Eval Report Generator
 *
 * Reads eval result JSON files and generates a markdown comparison table.
 *
 * Usage:
 *   npx tsx src/lib/ai/eval/report.ts
 *   npx tsx src/lib/ai/eval/report.ts results/groq--llama-3.3-70b-versatile-*.json
 *
 * If no args, reads all JSON files from src/lib/ai/eval/results/
 */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { EvalRunSummary } from './runner'

const __dirname = dirname(fileURLToPath(import.meta.url))

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

function generateMarkdown(summaries: EvalRunSummary[]): string {
  const lines: string[] = []

  lines.push('# IntakeForm.ai Model Evaluation Report')
  lines.push('')
  lines.push(`Generated: ${new Date().toISOString()}`)
  lines.push('')

  // ── Summary Table ──────────────────────────────────────────────────
  lines.push('## Model Comparison')
  lines.push('')
  lines.push(
    '| Model | Accuracy | Precision | Recall | Avg Latency | Avg Cost | Total Cost |'
  )
  lines.push(
    '|-------|----------|-----------|--------|-------------|----------|------------|'
  )

  for (const s of summaries) {
    lines.push(
      `| ${s.model} | ${(s.accuracy * 100).toFixed(1)}% | ${(s.precision * 100).toFixed(1)}% | ${(s.recall * 100).toFixed(1)}% | ${s.avgLatencyMs}ms | $${s.avgCostUsd.toFixed(6)} | $${s.totalCostUsd.toFixed(6)} |`
    )
  }

  lines.push('')

  // ── Per-Category Breakdown ─────────────────────────────────────────
  for (const s of summaries) {
    lines.push(`## ${s.model}`)
    lines.push('')
    lines.push(`Run: ${s.timestamp} | Fixtures: ${s.fixtureCount}`)
    lines.push('')

    const categories = ['vague', 'complete', 'risk', 'multi-topic', 'adversarial', 'short'] as const
    lines.push('### Per-Category Accuracy')
    lines.push('')
    lines.push('| Category | Correct | Total | Accuracy |')
    lines.push('|----------|---------|-------|----------|')

    for (const cat of categories) {
      const catResults = s.results.filter((r) => r.category === cat)
      if (catResults.length === 0) continue
      const correct = catResults.filter((r) => r.correct).length
      const acc = ((correct / catResults.length) * 100).toFixed(0)
      lines.push(`| ${cat} | ${correct} | ${catResults.length} | ${acc}% |`)
    }

    lines.push('')

    // Failures detail
    const failures = s.results.filter((r) => !r.correct)
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

    // Parse errors
    const parseErrors = s.results.filter((r) => r.parseError)
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
  let filePaths: string[]

  if (process.argv.length > 2) {
    filePaths = process.argv.slice(2)
  } else {
    filePaths = findResultFiles()
  }

  if (filePaths.length === 0) {
    console.error('No result files found. Run the eval runner first:')
    console.error('  npx tsx src/lib/ai/eval/runner.ts groq/llama-3.3-70b-versatile')
    process.exit(1)
  }

  console.log(`Loading ${filePaths.length} result file(s)...`)
  const summaries = loadResults(filePaths)

  const markdown = generateMarkdown(summaries)

  const outputPath = join(__dirname, 'results', 'report.md')
  writeFileSync(outputPath, markdown)
  console.log(`Report written to: ${outputPath}`)

  // Also print to stdout
  console.log('')
  console.log(markdown)
}

main()
