import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getDb } from '@/lib/db'
import { providers } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { ProfessionCards } from '@/components/onboarding/profession-cards'

export default async function ProfessionPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const db = getDb()

  // Check if provider already exists
  let [provider] = await db
    .select()
    .from(providers)
    .where(eq(providers.clerkUserId, userId))

  // If not, create one from Clerk user data
  if (!provider) {
    const user = await currentUser()
    if (!user) redirect('/sign-in')

    const [created] = await db
      .insert(providers)
      .values({
        clerkUserId: userId,
        email:
          user.emailAddresses[0]?.emailAddress ?? `${userId}@placeholder.com`,
        name:
          [user.firstName, user.lastName].filter(Boolean).join(' ') ||
          'Provider',
      })
      .returning()
    provider = created
  }

  // If provider already completed onboarding, redirect to dashboard
  const settings = provider.settings as Record<string, unknown> | null
  if (settings?.onboardingComplete) {
    redirect('/dashboard')
  }

  return (
    <>
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          What best describes your practice?
        </h1>
        <p className="text-muted-foreground">
          We will set up a tailored intake form template for you.
        </p>
      </div>
      <ProfessionCards />
    </>
  )
}
