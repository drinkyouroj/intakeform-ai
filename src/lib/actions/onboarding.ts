'use server'

import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { getDb } from '@/lib/db'
import { providers, forms, questions } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { TEMPLATES } from '@/lib/db/templates'

export async function selectProfession(profession: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('Not authenticated')

  const db = getDb()

  // Check if provider exists
  const [provider] = await db
    .select()
    .from(providers)
    .where(eq(providers.clerkUserId, userId))

  if (!provider) {
    throw new Error('Provider record not found')
  }

  // Update profession immediately (survives page refresh)
  await db
    .update(providers)
    .set({ profession })
    .where(eq(providers.id, provider.id))

  // Create the matching template form for this profession
  const template =
    TEMPLATES.find((t) => t.profession === profession) ?? TEMPLATES[0]

  const [form] = await db
    .insert(forms)
    .values({
      providerId: provider.id,
      title: template.title,
      description: template.description,
      templateSlug: template.slug,
      isActive: false,
    })
    .returning()

  await db.insert(questions).values(
    template.questions.map((q) => ({
      formId: form.id,
      type: q.type,
      prompt: q.prompt,
      options: q.options ?? null,
      sortOrder: q.sortOrder,
      aiFollowUp: q.aiFollowUp,
    }))
  )

  redirect('/onboarding/preview')
}

export async function activateForm(formId: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('Not authenticated')

  const db = getDb()

  const [provider] = await db
    .select()
    .from(providers)
    .where(eq(providers.clerkUserId, userId))
  if (!provider) throw new Error('Provider not found')

  // Verify the form belongs to this provider before activating
  await db
    .update(forms)
    .set({ isActive: true })
    .where(and(eq(forms.id, formId), eq(forms.providerId, provider.id)))

  await db
    .update(providers)
    .set({
      settings: {
        ...((provider.settings as Record<string, unknown>) ?? {}),
        onboardingComplete: true,
      },
    })
    .where(eq(providers.id, provider.id))

  redirect('/onboarding/success')
}
