'use server'

import { getDb } from '@/lib/db'
import { sessions } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { waitUntil } from '@vercel/functions'
import { generateBriefForSession } from './briefs'

export async function completeSession(sessionId: string) {
  const db = getDb()

  const [updated] = await db
    .update(sessions)
    .set({
      status: 'completed',
      briefStatus: 'pending',
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(sessions.id, sessionId))
    .returning()

  // Trigger brief generation async (non-blocking)
  waitUntil(generateBriefForSession(sessionId))

  return updated
}

export async function getSession(sessionId: string) {
  const db = getDb()
  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, sessionId))
  return session ?? null
}
