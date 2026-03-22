import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getDb } from '@/lib/db'
import { providers } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { TEMPLATES } from '@/lib/db/templates'
import { TemplatePicker } from '@/components/dashboard/template-picker'

export default async function NewFormPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const db = getDb()
  const [provider] = await db
    .select()
    .from(providers)
    .where(eq(providers.clerkUserId, userId))

  if (!provider) redirect('/onboarding/profession')

  const templates = TEMPLATES.map((t) => ({
    slug: t.slug,
    title: t.title,
    description: t.description,
    profession: t.profession,
    questionCount: t.questions.length,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create a New Form</h1>
        <p className="text-muted-foreground mt-1">
          Start from a template or create a blank form.
        </p>
      </div>
      <TemplatePicker templates={templates} />
    </div>
  )
}
