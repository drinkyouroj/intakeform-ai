import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { sessions } from '@/lib/db/schema'
import { eq, and, lt } from 'drizzle-orm'

export async function GET(req: Request) {
  // Verify CRON_SECRET
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = getDb()
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago

  const result = await db
    .update(sessions)
    .set({ status: 'abandoned', updatedAt: new Date() })
    .where(
      and(
        eq(sessions.status, 'active'),
        lt(sessions.updatedAt, cutoff)
      )
    )
    .returning({ id: sessions.id })

  return NextResponse.json({
    abandoned: result.length,
    timestamp: new Date().toISOString(),
  })
}
