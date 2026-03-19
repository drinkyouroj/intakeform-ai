import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getDb } from '@/lib/db'
import { providers, forms, questions } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { TemplatePreview } from '@/components/onboarding/template-preview'

export default async function PreviewPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const db = getDb()

  const [provider] = await db
    .select()
    .from(providers)
    .where(eq(providers.clerkUserId, userId))

  if (!provider) redirect('/onboarding/profession')
  if (!provider.profession) redirect('/onboarding/profession')

  // Find the form created during profession selection (inactive, most recent)
  const [form] = await db
    .select()
    .from(forms)
    .where(
      and(eq(forms.providerId, provider.id), eq(forms.isActive, false))
    )

  if (!form) redirect('/onboarding/profession')

  // Get the questions for the form
  const formQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.formId, form.id))
    .orderBy(questions.sortOrder)

  return (
    <>
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Preview your intake form
        </h1>
        <p className="text-muted-foreground">
          Here is your {provider.profession} template. You can customize it
          later.
        </p>
      </div>
      <TemplatePreview
        form={{
          id: form.id,
          title: form.title,
          description: form.description,
        }}
        questions={formQuestions.map((q) => ({
          id: q.id,
          prompt: q.prompt,
          type: q.type,
          options: q.options as string[] | null,
          aiFollowUp: q.aiFollowUp as {
            enabled: boolean
            maxFollowUps: number
          } | null,
        }))}
      />
    </>
  )
}
