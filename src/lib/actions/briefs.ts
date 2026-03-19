'use server'

import { getDb } from '@/lib/db'
import { sessions, briefs, questions, forms, providers } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { generateBrief, type BriefData } from '@/lib/ai/brief'
import { generateFlags } from '@/lib/ai/flags'
import { trackGeneration } from '@/lib/ai/track'
import { sendBriefCompletionEmail } from './email'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface SessionAnswerArray {
  questionId: string
  answer: string
  followUps?: Array<{ question: string; answer?: string | null }>
}

interface SessionState {
  answers?: SessionAnswerArray[] | Record<string, unknown>
  [key: string]: unknown
}

/**
 * Build a human-readable transcript from session state + questions.
 * Handles both array format [{questionId, answer, followUps}] and
 * record format {questionId: {value, followUps}}.
 */
async function buildTranscript(
  formId: string,
  state: SessionState
): Promise<string> {
  const db = getDb()

  // Fetch questions for the form, ordered by sortOrder
  const formQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.formId, formId))
    .orderBy(questions.sortOrder)

  // Normalize answers to a Map keyed by questionId
  const answerMap = new Map<string, SessionAnswerArray>()
  const rawAnswers = state.answers
  if (Array.isArray(rawAnswers)) {
    // Array format: [{questionId, answer, followUps}]
    for (const a of rawAnswers) {
      const entry = a as SessionAnswerArray
      if (entry.questionId) {
        answerMap.set(entry.questionId, entry)
      }
    }
  } else if (rawAnswers && typeof rawAnswers === 'object') {
    // Record format: {questionId: {value, followUps}}
    for (const [qId, val] of Object.entries(rawAnswers)) {
      const v = val as Record<string, unknown>
      answerMap.set(qId, {
        questionId: qId,
        answer: String(v.value ?? v.answer ?? ''),
        followUps: (v.followUps as SessionAnswerArray['followUps']) ?? [],
      })
    }
  }

  const lines: string[] = []

  for (let i = 0; i < formQuestions.length; i++) {
    const q = formQuestions[i]
    const answer = answerMap.get(q.id)
    const num = i + 1

    lines.push(`Q${num}: ${q.prompt}`)

    if (answer) {
      lines.push(`A${num}: ${answer.answer}`)

      if (answer.followUps?.length) {
        for (const fu of answer.followUps) {
          lines.push(`  Follow-up: ${fu.question}`)
          lines.push(`  Answer: ${fu.answer ?? '(no answer)'}`)
        }
      }
    } else {
      lines.push(`A${num}: (no answer)`)
    }

    lines.push('') // blank line between questions
  }

  return lines.join('\n').trim()
}

/**
 * Convert structured brief data to markdown for the content column.
 */
function briefToMarkdown(data: BriefData): string {
  const sections: string[] = []

  sections.push('## Client Situation Summary')
  sections.push(data.situationSummary)

  if (data.keyFlags.length > 0) {
    sections.push('')
    sections.push('## Key Flags')
    for (const flag of data.keyFlags) {
      sections.push(`- **${flag.label}** (${flag.severity}): ${flag.evidence}`)
    }
  }

  if (data.firstCallQuestions.length > 0) {
    sections.push('')
    sections.push('## Questions to Ask in First Call')
    for (let i = 0; i < data.firstCallQuestions.length; i++) {
      sections.push(`${i + 1}. ${data.firstCallQuestions[i]}`)
    }
  }

  if (data.backgroundContext) {
    sections.push('')
    sections.push('## Background Context')
    sections.push(data.backgroundContext)
  }

  return sections.join('\n')
}

// ---------------------------------------------------------------------------
// Main pipeline
// ---------------------------------------------------------------------------

export async function generateBriefForSession(sessionId: string) {
  const db = getDb()

  // 1. Set briefStatus = 'generating'
  await db
    .update(sessions)
    .set({ briefStatus: 'generating', updatedAt: new Date() })
    .where(eq(sessions.id, sessionId))

  try {
    // 2. Read full session state
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId))

    if (!session) {
      throw new Error(`Session ${sessionId} not found`)
    }

    const state = (session.state ?? {}) as SessionState

    // 3. Build transcript
    const transcript = await buildTranscript(session.formId, state)

    // 4. Call generateBrief + generateFlags in parallel
    const [briefResult, flagResult] = await Promise.all([
      generateBrief({
        providerType: 'therapist', // TODO: derive from provider.profession
        sessionTranscript: transcript,
      }),
      generateFlags({
        sessionTranscript: transcript,
      }),
    ])

    // 5. Merge flags from the dedicated flag pipeline into the brief
    const mergedBrief: BriefData = {
      ...briefResult.result,
      keyFlags: [
        ...briefResult.result.keyFlags,
        // Add flags from the flag pipeline that aren't already in the brief
        ...flagResult.result.flags.filter(
          (f) => !briefResult.result.keyFlags.some((bf) => bf.label === f.label)
        ),
      ],
    }

    // 6. Generate markdown content
    const content = briefToMarkdown(mergedBrief)

    // 7. Insert brief into database
    await db.insert(briefs).values({
      sessionId,
      content,
      structured: mergedBrief,
      metadata: {
        briefGenerationId: briefResult.generationId,
        flagGenerationId: flagResult.generationId,
        briefModel: briefResult.model,
        flagModel: flagResult.model,
        briefLatencyMs: briefResult.latencyMs,
        flagLatencyMs: flagResult.latencyMs,
        reviewed: false,
      },
    })

    // 8. Track both generations
    await Promise.all([
      trackGeneration({
        id: briefResult.generationId,
        sessionId,
        task: 'brief',
        model: briefResult.model,
        promptTokens: briefResult.usage.promptTokens,
        completionTokens: briefResult.usage.completionTokens,
        latencyMs: briefResult.latencyMs,
      }),
      trackGeneration({
        id: flagResult.generationId,
        sessionId,
        task: 'flags',
        model: flagResult.model,
        promptTokens: flagResult.usage.promptTokens,
        completionTokens: flagResult.usage.completionTokens,
        latencyMs: flagResult.latencyMs,
      }),
    ])

    // 9. Set briefStatus = 'completed'
    await db
      .update(sessions)
      .set({ briefStatus: 'completed', updatedAt: new Date() })
      .where(eq(sessions.id, sessionId))

    // 10. Send email notification to the provider
    try {
      const [form] = await db.select().from(forms).where(eq(forms.id, session.formId))
      if (form) {
        const [provider] = await db.select().from(providers).where(eq(providers.id, form.providerId))
        if (provider?.email) {
          await sendBriefCompletionEmail({
            providerEmail: provider.email,
            providerName: provider.name,
            formTitle: form.title,
            sessionId,
            briefSummary: mergedBrief.situationSummary,
          })
        }
      }
    } catch (emailError) {
      console.error('[briefs] Failed to send notification email:', emailError)
      // Non-fatal — brief is already saved
    }
  } catch (error) {
    console.error(`[briefs] Failed to generate brief for session ${sessionId}:`, error)

    // Set briefStatus = 'failed'
    await db
      .update(sessions)
      .set({ briefStatus: 'failed', updatedAt: new Date() })
      .where(eq(sessions.id, sessionId))
  }
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getBrief(sessionId: string) {
  const db = getDb()
  const [brief] = await db
    .select()
    .from(briefs)
    .where(eq(briefs.sessionId, sessionId))
  return brief ?? null
}

export async function markBriefReviewed(briefId: string) {
  const db = getDb()

  // Fetch existing metadata, then merge reviewed flag
  const [existing] = await db
    .select({ metadata: briefs.metadata })
    .from(briefs)
    .where(eq(briefs.id, briefId))

  if (!existing) return null

  const meta = (existing.metadata ?? {}) as Record<string, unknown>

  const [updated] = await db
    .update(briefs)
    .set({
      metadata: { ...meta, reviewed: true, reviewedAt: new Date().toISOString() },
    })
    .where(eq(briefs.id, briefId))
    .returning()

  return updated
}
