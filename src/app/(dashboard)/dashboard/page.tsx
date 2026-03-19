import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getDb } from '@/lib/db'
import { providers, forms, sessions, generations } from '@/lib/db/schema'
import { eq, and, sql, desc, inArray } from 'drizzle-orm'
import { MetricsRow } from '@/components/dashboard/metrics-row'
import { IntakesTable } from '@/components/dashboard/intakes-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, FileText, Settings } from 'lucide-react'

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const db = getDb()

  const [provider] = await db
    .select()
    .from(providers)
    .where(eq(providers.clerkUserId, userId))

  if (!provider) redirect('/onboarding/profession')

  // Get provider's forms
  const providerForms = await db
    .select()
    .from(forms)
    .where(eq(forms.providerId, provider.id))

  const formIds = providerForms.map((f) => f.id)
  const activeForms = providerForms.filter((f) => f.isActive)

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  let totalIntakesThisMonth = 0
  let completionRate = 0
  let aiCostThisMonth = 0
  let recentIntakeRows: {
    sessionId: string
    formTitle: string
    clientName: string
    status: string
    briefStatus: string
    date: Date
  }[] = []

  if (formIds.length > 0) {
    // Total intakes this month
    const [intakeCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(sessions)
      .where(
        and(
          inArray(sessions.formId, formIds),
          sql`${sessions.createdAt} >= ${startOfMonth.toISOString()}`
        )
      )
    totalIntakesThisMonth = intakeCount?.count ?? 0

    // Completion rate: completed / (completed + abandoned)
    const [completedCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(sessions)
      .where(
        and(
          inArray(sessions.formId, formIds),
          eq(sessions.status, 'completed')
        )
      )
    const [abandonedCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(sessions)
      .where(
        and(
          inArray(sessions.formId, formIds),
          eq(sessions.status, 'abandoned')
        )
      )
    const completed = completedCount?.count ?? 0
    const abandoned = abandonedCount?.count ?? 0
    const total = completed + abandoned
    completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    // AI cost this month
    const sessionIdsResult = await db
      .select({ id: sessions.id })
      .from(sessions)
      .where(inArray(sessions.formId, formIds))
    const sessionIds = sessionIdsResult.map((s) => s.id)

    if (sessionIds.length > 0) {
      const [costResult] = await db
        .select({
          total: sql<number>`coalesce(sum(${generations.estimatedCostMicrocents}), 0)::int`,
        })
        .from(generations)
        .where(
          and(
            inArray(generations.sessionId, sessionIds),
            sql`${generations.createdAt} >= ${startOfMonth.toISOString()}`
          )
        )
      aiCostThisMonth = costResult?.total ?? 0
    }

    // Recent intakes (last 10)
    const recentSessions = await db
      .select({
        id: sessions.id,
        formId: sessions.formId,
        status: sessions.status,
        briefStatus: sessions.briefStatus,
        clientMeta: sessions.clientMeta,
        createdAt: sessions.createdAt,
      })
      .from(sessions)
      .where(inArray(sessions.formId, formIds))
      .orderBy(desc(sessions.createdAt))
      .limit(10)

    const formMap = new Map(providerForms.map((f) => [f.id, f.title]))

    recentIntakeRows = recentSessions.map((s) => {
      const meta = s.clientMeta as Record<string, unknown> | null
      const clientName =
        (meta?.name as string) || (meta?.email as string) || 'Anonymous'
      return {
        sessionId: s.id,
        formTitle: formMap.get(s.formId) ?? 'Unknown Form',
        clientName,
        status: s.status ?? 'active',
        briefStatus: s.briefStatus ?? 'none',
        date: s.createdAt ? new Date(s.createdAt) : new Date(),
      }
    })
  }

  // Format AI cost: microcents -> dollars
  const costDollars = (aiCostThisMonth / 100_000_000).toFixed(2)

  const metrics = [
    { label: 'Intakes This Month', value: String(totalIntakesThisMonth) },
    { label: 'Active Forms', value: String(activeForms.length) },
    { label: 'Completion Rate', value: `${completionRate}%` },
    { label: 'AI Cost This Month', value: `$${costDollars}` },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, {provider.name}.
        </p>
      </div>

      <MetricsRow metrics={metrics} />

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button render={<Link href="/dashboard/forms/new" />}>
          <Plus data-icon="inline-start" />
          Create Form
        </Button>
        <Button variant="outline" render={<Link href="/dashboard/briefs" />}>
          <FileText data-icon="inline-start" />
          View All Briefs
        </Button>
        <Button variant="outline" render={<Link href="/dashboard/settings" />}>
          <Settings data-icon="inline-start" />
          Manage Billing
        </Button>
      </div>

      {/* Recent Intakes */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Intakes</CardTitle>
        </CardHeader>
        <CardContent>
          <IntakesTable rows={recentIntakeRows} />
        </CardContent>
      </Card>
    </div>
  )
}
