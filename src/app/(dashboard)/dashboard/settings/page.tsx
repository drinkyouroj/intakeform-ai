import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getDb } from '@/lib/db'
import { providers, forms } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { SettingsTabs } from '@/components/dashboard/settings-tabs'

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const db = getDb()

  const [provider] = await db
    .select()
    .from(providers)
    .where(eq(providers.clerkUserId, userId))

  if (!provider) redirect('/onboarding/profession')

  const providerForms = await db
    .select({
      id: forms.id,
      title: forms.title,
      isActive: forms.isActive,
    })
    .from(forms)
    .where(eq(forms.providerId, provider.id))
    .orderBy(desc(forms.updatedAt))

  const params = await searchParams
  const defaultTab = typeof params.tab === 'string' ? params.tab : undefined

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account, billing, and preferences
        </p>
      </div>

      <SettingsTabs
        provider={{
          id: provider.id,
          name: provider.name,
          email: provider.email,
          profession: provider.profession,
          subscriptionStatus: provider.subscriptionStatus,
        }}
        forms={providerForms}
        defaultTab={defaultTab}
      />
    </div>
  )
}
