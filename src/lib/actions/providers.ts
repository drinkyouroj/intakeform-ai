'use server'

import { auth } from '@clerk/nextjs/server'
import { getDb } from '@/lib/db'
import { providers } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function getProvider() {
  const { userId } = await auth()
  if (!userId) throw new Error('Not authenticated')

  const db = getDb()
  const [provider] = await db
    .select()
    .from(providers)
    .where(eq(providers.clerkUserId, userId))
  return provider ?? null
}

export async function createProvider(data: { email: string; name: string }) {
  const { userId } = await auth()
  if (!userId) throw new Error('Not authenticated')

  const db = getDb()
  const [provider] = await db
    .insert(providers)
    .values({
      clerkUserId: userId,
      email: data.email,
      name: data.name,
    })
    .returning()
  return provider
}

export async function updateProvider(
  data: Partial<{
    name: string
    profession: string
    settings: Record<string, unknown>
  }>
) {
  const { userId } = await auth()
  if (!userId) throw new Error('Not authenticated')

  const db = getDb()
  const [updated] = await db
    .update(providers)
    .set(data)
    .where(eq(providers.clerkUserId, userId))
    .returning()
  return updated
}
