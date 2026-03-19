import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getDb } from '@/lib/db'
import { providers, forms, sessions, briefs } from '@/lib/db/schema'
import { eq, desc, inArray } from 'drizzle-orm'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Eye, FileText } from 'lucide-react'

function briefStatusVariant(status: string) {
  switch (status) {
    case 'ready':
    case 'sent':
      return 'default' as const
    case 'generating':
      return 'secondary' as const
    case 'error':
      return 'destructive' as const
    default:
      return 'outline' as const
  }
}

export default async function BriefsListPage() {
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

  let completedSessions: {
    sessionId: string
    formTitle: string
    clientName: string
    briefStatus: string
    hasBrief: boolean
    completedAt: Date
  }[] = []

  if (formIds.length > 0) {
    const rows = await db
      .select({
        sessionId: sessions.id,
        formId: sessions.formId,
        clientMeta: sessions.clientMeta,
        briefStatus: sessions.briefStatus,
        completedAt: sessions.completedAt,
        createdAt: sessions.createdAt,
        briefId: briefs.id,
      })
      .from(sessions)
      .leftJoin(briefs, eq(briefs.sessionId, sessions.id))
      .where(
        inArray(sessions.formId, formIds)
      )
      .orderBy(desc(sessions.completedAt), desc(sessions.createdAt))

    const formMap = new Map(providerForms.map((f) => [f.id, f.title]))

    // Only show completed sessions or sessions with briefs
    completedSessions = rows
      .filter((r) => r.briefStatus !== 'none' || r.briefId)
      .map((r) => {
        const meta = r.clientMeta as Record<string, unknown> | null
        const clientName =
          (meta?.name as string) || (meta?.email as string) || 'Anonymous'
        return {
          sessionId: r.sessionId,
          formTitle: formMap.get(r.formId) ?? 'Unknown Form',
          clientName,
          briefStatus: r.briefStatus ?? 'none',
          hasBrief: !!r.briefId,
          completedAt: r.completedAt
            ? new Date(r.completedAt)
            : r.createdAt
              ? new Date(r.createdAt)
              : new Date(),
        }
      })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Briefs</h1>
        <p className="text-muted-foreground mt-1">
          View generated briefs from completed intakes.
        </p>
      </div>

      {completedSessions.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <FileText className="size-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No briefs yet</h2>
          <p className="text-muted-foreground">
            Completed intakes will appear here.
          </p>
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Form</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Brief Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {completedSessions.map((row) => (
              <TableRow key={row.sessionId}>
                <TableCell className="font-medium">
                  {row.clientName}
                </TableCell>
                <TableCell>{row.formTitle}</TableCell>
                <TableCell>
                  {row.completedAt.toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Badge variant={briefStatusVariant(row.briefStatus)}>
                    {row.briefStatus}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    render={
                      <Link href={`/dashboard/briefs/${row.sessionId}`} />
                    }
                  >
                    <Eye data-icon="inline-start" />
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
