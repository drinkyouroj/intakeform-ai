import { notFound } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { getDb } from '@/lib/db'
import { briefs, sessions, forms, providers } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { BriefViewer } from '@/components/dashboard/brief-viewer'
import { BriefSidebar } from '@/components/dashboard/brief-sidebar'

export default async function BriefViewerPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params

  const { userId } = await auth()
  if (!userId) notFound()

  const db = getDb()

  // Fetch the brief
  const [brief] = await db
    .select()
    .from(briefs)
    .where(eq(briefs.sessionId, sessionId))

  if (!brief) notFound()

  // Fetch the session
  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, sessionId))

  if (!session) notFound()

  // Fetch the form
  const [form] = await db
    .select()
    .from(forms)
    .where(eq(forms.id, session.formId))

  if (!form) notFound()

  // Verify the authenticated provider owns this data
  const [provider] = await db
    .select()
    .from(providers)
    .where(eq(providers.clerkUserId, userId))

  if (!provider || form.providerId !== provider.id) notFound()

  const metadata = brief.metadata as Record<string, unknown> | null
  const isReviewed = metadata?.reviewed === true

  const state = (session.state ?? {}) as {
    answers?: Record<string, { value: string | string[]; followUps?: Array<{ question: string; answer: string }> }>
  }

  const answerCount = state.answers ? Object.keys(state.answers).length : 0
  const followUpCount = state.answers
    ? Object.values(state.answers).reduce(
        (sum, a) => sum + (a.followUps?.length ?? 0),
        0
      )
    : 0

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <BriefViewer
          briefId={brief.id}
          content={brief.content}
          structured={brief.structured as {
            situationSummary: string
            keyFlags: Array<{ label: string; severity: string; evidence: string }>
            firstCallQuestions: string[]
            backgroundContext?: string
          }}
          isReviewed={isReviewed}
        />
      </div>
      <div>
        <BriefSidebar
          formName={form.title}
          completedAt={session.completedAt}
          createdAt={session.createdAt}
          answerCount={answerCount}
          followUpCount={followUpCount}
          briefCreatedAt={brief.createdAt}
        />
      </div>
    </div>
  )
}
