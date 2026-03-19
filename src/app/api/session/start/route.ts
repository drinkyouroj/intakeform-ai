import { NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { getDb } from '@/lib/db'
import { sessions, forms, questions } from '@/lib/db/schema'
import { eq, asc } from 'drizzle-orm'

export async function POST(req: Request) {
  const { formId } = await req.json()

  if (!formId) {
    return NextResponse.json({ error: 'formId is required' }, { status: 400 })
  }

  const db = getDb()

  // Verify form exists and is active
  const [form] = await db.select().from(forms).where(eq(forms.id, formId))
  if (!form || !form.isActive) {
    return NextResponse.json(
      { error: 'Form not found or inactive' },
      { status: 404 },
    )
  }

  // Get questions for initial state
  const formQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.formId, formId))
    .orderBy(asc(questions.sortOrder))

  const resumeToken = nanoid()

  const [session] = await db
    .insert(sessions)
    .values({
      formId,
      status: 'active',
      briefStatus: 'none',
      version: 1,
      resumeToken,
      state: {
        currentIndex: 0,
        answers: [],
        totalQuestions: formQuestions.length,
      },
      clientMeta: {},
    })
    .returning()

  return NextResponse.json({
    sessionId: session.id,
    resumeToken,
    questions: formQuestions.map((q) => ({
      id: q.id,
      prompt: q.prompt,
      type: q.type,
      options: q.options,
      sortOrder: q.sortOrder,
      aiFollowUp: q.aiFollowUp,
    })),
  })
}
