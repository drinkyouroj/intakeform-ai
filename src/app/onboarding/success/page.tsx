import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getDb } from '@/lib/db'
import { providers, forms } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { ActivationSuccess } from '@/components/onboarding/activation-success'

export default async function SuccessPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const db = getDb()

  const [provider] = await db
    .select()
    .from(providers)
    .where(eq(providers.clerkUserId, userId))

  if (!provider) redirect('/onboarding/profession')

  // Find the active form
  const [activeForm] = await db
    .select()
    .from(forms)
    .where(
      and(eq(forms.providerId, provider.id), eq(forms.isActive, true))
    )

  if (!activeForm) redirect('/onboarding/profession')

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const shareLink = `${appUrl}/form/${activeForm.id}`

  return (
    <ActivationSuccess
      shareLink={shareLink}
      formId={activeForm.id}
    />
  )
}
