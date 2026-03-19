import { NextResponse } from 'next/server'
import { generateBriefForSession } from '@/lib/actions/briefs'

/**
 * Manual trigger for brief generation.
 * POST /api/brief/generate { sessionId }
 * Used for retrying failed briefs and debugging.
 */
export async function POST(req: Request) {
  const { sessionId } = await req.json()

  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId required' }, { status: 400 })
  }

  try {
    await generateBriefForSession(sessionId)
    return NextResponse.json({ success: true, sessionId })
  } catch (error) {
    console.error('[api/brief/generate] Failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
