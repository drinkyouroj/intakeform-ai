import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { sessions } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export async function POST(req: Request) {
  const { sessionId, questionId, version } = await req.json()

  if (!sessionId || !version) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 },
    )
  }

  const db = getDb()

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

  const currentState = session.state as Record<string, unknown>
  const answers =
    (currentState.answers as Array<Record<string, unknown>>) ?? []

  let newAnswers: Array<Record<string, unknown>>

  if (questionId) {
    // Reset a single question: remove its answer entry entirely
    newAnswers = answers.filter(
      (a: Record<string, unknown>) => a.questionId !== questionId,
    )
  } else {
    // Reset entire session: clear all answers
    newAnswers = []
  }

  const newState = {
    ...currentState,
    answers: newAnswers,
    currentIndex: newAnswers.length,
  }

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
    return NextResponse.json(
      { error: 'Session was updated elsewhere. Please refresh.' },
      { status: 409 },
    )
  }

  return NextResponse.json({
    success: true,
    version: result[0].version,
  })
}
