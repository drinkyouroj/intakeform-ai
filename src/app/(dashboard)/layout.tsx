import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getDb } from '@/lib/db'
import { providers } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { SidebarNav, MobileHeader } from '@/components/dashboard/sidebar-nav'
import { SubscriptionBanner } from '@/components/dashboard/subscription-banner'

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
    <div className="flex h-screen bg-background">
      {/* Desktop sidebar */}
      <SidebarNav />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Mobile header with hamburger */}
        <MobileHeader />

        {/* Subscription banner */}
        <SubscriptionBanner
          status={provider.subscriptionStatus}
          trialEndsAt={provider.trialEndsAt}
        />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
