import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { sessions } from '@/lib/db/schema'
import { eq, and, lt, or } from 'drizzle-orm'
import { generateBriefForSession } from '@/lib/actions/briefs'

export async function GET(req: Request) {
  // Verify CRON_SECRET
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = getDb()
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000)

  // Find sessions that need brief retry:
  // - briefStatus = 'failed' (any time)
  // - briefStatus = 'pending' AND updatedAt > 5 min ago (stuck)
  const needsRetry = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(
      and(
        eq(sessions.status, 'completed'),
        or(
          eq(sessions.briefStatus, 'failed'),
          and(
            eq(sessions.briefStatus, 'pending'),
            lt(sessions.updatedAt, fiveMinAgo)
          )
        )
      )
    )
    .limit(10) // Process max 10 at a time

  let retried = 0
  for (const session of needsRetry) {
    try {
      await generateBriefForSession(session.id)
      retried++
    } catch (error) {
      console.error(`[cron/retry-briefs] Failed for session ${session.id}:`, error)
    }
  }

  return NextResponse.json({
    found: needsRetry.length,
    retried,
    timestamp: new Date().toISOString(),
  })
}
