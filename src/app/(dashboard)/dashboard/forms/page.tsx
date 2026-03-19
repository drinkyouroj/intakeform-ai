import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getDb } from '@/lib/db'
import { providers, forms, sessions } from '@/lib/db/schema'
import { eq, desc, sql, inArray } from 'drizzle-orm'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, FileText, Pencil, Copy, ExternalLink } from 'lucide-react'

export default async function FormsListPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const db = getDb()

  const [provider] = await db
    .select()
    .from(providers)
    .where(eq(providers.clerkUserId, userId))

  if (!provider) redirect('/onboarding/profession')

  const providerForms = await db
    .select()
    .from(forms)
    .where(eq(forms.providerId, provider.id))
    .orderBy(desc(forms.updatedAt))

  const formIds = providerForms.map((f) => f.id)

  // Get intake counts per form
  let intakeCounts = new Map<string, number>()
  let lastUsedDates = new Map<string, Date | null>()

  if (formIds.length > 0) {
    const counts = await db
      .select({
        formId: sessions.formId,
        count: sql<number>`count(*)::int`,
        lastUsed: sql<string>`max(${sessions.createdAt})`,
      })
      .from(sessions)
      .where(inArray(sessions.formId, formIds))
      .groupBy(sessions.formId)

    for (const row of counts) {
      intakeCounts.set(row.formId, row.count)
      lastUsedDates.set(
        row.formId,
        row.lastUsed ? new Date(row.lastUsed) : null
      )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Forms</h1>
          <p className="text-muted-foreground mt-1">
            Manage your intake forms
          </p>
        </div>
        <Button render={<Link href="/dashboard/forms/new" />}>
          <Plus data-icon="inline-start" />
          Create Form
        </Button>
      </div>

      {providerForms.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <FileText className="size-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No forms yet</h2>
          <p className="text-muted-foreground mb-4">
            Create your first intake form to get started.
          </p>
          <Button render={<Link href="/dashboard/forms/new" />}>
            <Plus data-icon="inline-start" />
            Create Form
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {providerForms.map((form) => {
            const count = intakeCounts.get(form.id) ?? 0
            const lastUsed = lastUsedDates.get(form.id)

            return (
              <Card key={form.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="min-w-0">
                    <h3 className="font-medium truncate">{form.title}</h3>
                    {form.description && (
                      <p className="text-sm text-muted-foreground truncate mt-0.5">
                        {form.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5">
                      {form.templateSlug && (
                        <Badge variant="secondary" className="text-xs">
                          {form.templateSlug}
                        </Badge>
                      )}
                      <span className="flex items-center gap-1">
                        <span
                          className={`inline-block size-2 rounded-full ${
                            form.isActive ? 'bg-green-500' : 'bg-muted-foreground/40'
                          }`}
                        />
                        <span className="text-xs text-muted-foreground">
                          {form.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {count} {count === 1 ? 'intake' : 'intakes'}
                      </span>
                      {lastUsed && (
                        <span className="text-xs text-muted-foreground">
                          Last used {lastUsed.toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    render={<Link href={`/form/${form.id}`} target="_blank" />}
                    title="Preview form"
                  >
                    <ExternalLink />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    render={<Link href={`/dashboard/forms/${form.id}/edit`} />}
                  >
                    <Pencil data-icon="inline-start" />
                    Edit
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
