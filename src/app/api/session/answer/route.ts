import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { sessions, questions } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { generateFollowUp } from '@/lib/ai/follow-up'
import { trackGeneration } from '@/lib/ai/track'
import { waitUntil } from '@vercel/functions'

export async function POST(req: Request) {
  const { sessionId, questionId, answer, version } = await req.json()

  // Input validation
  if (!sessionId || !questionId || answer === undefined || !version) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 },
    )
  }

  if (typeof answer === 'string' && answer.length > 5000) {
    return NextResponse.json(
      { error: 'Answer exceeds 5000 character limit' },
      { status: 400 },
    )
  }

  // Strip HTML tags from answer
  const sanitizedAnswer =
    typeof answer === 'string'
      ? answer.replace(/<[^>]*>/g, '')
      : String(answer)

  const db = getDb()

  // Read session with version check
  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, sessionId))

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }
  if (session.status !== 'active') {
    return NextResponse.json(
      { error: 'Session is not active' },
      { status: 400 },
    )
  }

  // Build new state with the answer appended
  const currentState = session.state as Record<string, unknown>
  const answers =
    (currentState.answers as Array<Record<string, unknown>>) ?? []

  // Find existing answer entry for this question or create new one
  const existingIndex = answers.findIndex(
    (a: Record<string, unknown>) => a.questionId === questionId,
  )
  const existingAnswer = existingIndex >= 0 ? answers[existingIndex] : null
  const followUps =
    (existingAnswer?.followUps as Array<Record<string, unknown>>) ?? []

  // Determine if this is a follow-up answer or a primary answer
  const isFollowUpAnswer =
    existingAnswer !== null && !existingAnswer.followUpPending

  let newAnswers: Array<Record<string, unknown>>

  if (existingAnswer && isFollowUpAnswer) {
    // This is answering a follow-up question — append to followUps
    const updatedFollowUps = [...followUps]
    if (updatedFollowUps.length > 0) {
      updatedFollowUps[updatedFollowUps.length - 1] = {
        ...updatedFollowUps[updatedFollowUps.length - 1],
        answer: sanitizedAnswer,
        answeredAt: new Date().toISOString(),
      }
    }
    newAnswers = [...answers]
    newAnswers[existingIndex] = {
      ...existingAnswer,
      followUps: updatedFollowUps,
    }
  } else {
    // Primary answer
    const newEntry = {
      questionId,
      answer: sanitizedAnswer,
      followUps: [],
      answeredAt: new Date().toISOString(),
    }
    if (existingIndex >= 0) {
      newAnswers = [...answers]
      newAnswers[existingIndex] = newEntry
    } else {
      newAnswers = [...answers, newEntry]
    }
  }

  const newState = {
    ...currentState,
    answers: newAnswers,
    currentIndex: Math.max(
      (currentState.currentIndex as number) ?? 0,
      newAnswers.length,
    ),
  }

  // Optimistic concurrency update
  const result = await db
    .update(sessions)
    .set({
      state: newState,
      version: session.version! + 1,
      updatedAt: new Date(),
    })
    .where(and(eq(sessions.id, sessionId), eq(sessions.version, version)))
    .returning()

  if (result.length === 0) {
    // Version conflict — another request updated the session
    return NextResponse.json(
      { error: 'Session was updated elsewhere. Please refresh.' },
      { status: 409 },
    )
  }

  // Get AI follow-up config for this question
  const answerEntry = newAnswers.find(
    (a: Record<string, unknown>) => a.questionId === questionId,
  )
  const currentFollowUpCount = (
    (answerEntry?.followUps as Array<unknown>) ?? []
  ).length

  // Determine persona context from form (simplified for now)
  const personaContext = 'Professional service intake'

  // Get the question prompt for the AI
  const questionData = await db
    .select()
    .from(questions)
    .where(eq(questions.id, questionId))
    .then((rows) => rows[0] ?? null)

  const aiConfig =
    (questionData?.aiFollowUp as Record<string, unknown>) ?? { enabled: false }

  let followUpResult = null

  if (
    aiConfig.enabled &&
    currentFollowUpCount < ((aiConfig.maxFollowUps as number) ?? 2)
  ) {
    try {
      const generation = await generateFollowUp({
        question: questionData?.prompt ?? '',
        answer: sanitizedAnswer,
        personaContext,
        followUpCount: currentFollowUpCount,
      })

      if (generation.result.ask_followup && generation.result.question) {
        // Add the follow-up question to state
        const updatedAnswers = [...newAnswers]
        const idx = updatedAnswers.findIndex(
          (a: Record<string, unknown>) => a.questionId === questionId,
        )
        if (idx >= 0) {
          const entry = updatedAnswers[idx]
          const fups =
            (entry.followUps as Array<Record<string, unknown>>) ?? []
          fups.push({
            question: generation.result.question,
            answer: null,
            askedAt: new Date().toISOString(),
          })
          updatedAnswers[idx] = { ...entry, followUps: fups }
        }

        // Update session state with the new follow-up
        await db
          .update(sessions)
          .set({
            state: { ...newState, answers: updatedAnswers },
            version: session.version! + 2,
            updatedAt: new Date(),
          })
          .where(eq(sessions.id, sessionId))

        followUpResult = {
          question: generation.result.question,
        }
      }

      // Track generation async (non-blocking)
      waitUntil(
        trackGeneration({
          id: generation.generationId,
          sessionId,
          task: 'followup',
          model: generation.model,
          promptTokens: generation.usage.promptTokens,
          completionTokens: generation.usage.completionTokens,
          latencyMs: generation.latencyMs,
        }),
      )
    } catch (error) {
      // AI failure is non-fatal — continue without follow-up
      console.error('[session/answer] Follow-up generation failed:', error)
    }
  }

  return NextResponse.json({
    success: true,
    version: result[0].version,
    followUp: followUpResult,
  })
}
