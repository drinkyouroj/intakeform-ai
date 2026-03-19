import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { sessions } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 })
  }

  const db = getDb()
  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.resumeToken, token))

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  if (session.status !== 'active') {
    return NextResponse.json(
      { error: 'Session is no longer active', status: session.status },
      { status: 410 },
    )
  }

  return NextResponse.json({
    sessionId: session.id,
    formId: session.formId,
    state: session.state,
    version: session.version,
  })
}
