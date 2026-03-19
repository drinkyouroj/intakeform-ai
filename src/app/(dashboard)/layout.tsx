import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getDb } from '@/lib/db'
import { providers } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const db = getDb()
  const [provider] = await db
    .select()
    .from(providers)
    .where(eq(providers.clerkUserId, userId))

  if (!provider) {
    redirect('/onboarding/profession')
  }

  const settings = provider.settings as Record<string, unknown> | null
  if (!settings?.onboardingComplete) {
    redirect('/onboarding/profession')
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto py-8">{children}</main>
    </div>
  )
}
