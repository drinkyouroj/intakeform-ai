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

  const state = (session.state ?? {}) as {
    answers?: Array<Record<string, unknown>> | Record<string, unknown>
  }

  const answersArray = Array.isArray(state.answers) ? state.answers : Object.values(state.answers ?? {})
  const answerCount = answersArray.length
  const followUpCount = answersArray.reduce<number>(
    (sum, a) => {
      const fups = (a as Record<string, unknown>).followUps
      return sum + (Array.isArray(fups) ? fups.length : 0)
    },
    0
  )

  // Brief not yet generated — show pending state
  if (!brief) {
    const briefStatus = session.briefStatus ?? 'pending'
    return (
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-lg border bg-card p-8 text-center space-y-4">
            {briefStatus === 'failed' ? (
              <>
                <div className="text-destructive text-lg font-medium">Brief Generation Failed</div>
                <p className="text-muted-foreground">
                  The AI was unable to generate a brief for this session. The system will retry automatically, or you can contact support.
                </p>
              </>
            ) : (
              <>
                <div className="flex justify-center">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <span key={i} className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
                    ))}
                  </div>
                </div>
                <div className="text-lg font-medium">Generating Brief...</div>
                <p className="text-muted-foreground">
                  The AI is synthesizing the intake session into a structured brief. This usually takes 10-30 seconds. Refresh the page to check progress.
                </p>
              </>
            )}
          </div>
        </div>
        <div>
          <BriefSidebar
            formName={form.title}
            completedAt={session.completedAt}
            createdAt={session.createdAt}
            answerCount={answerCount}
            followUpCount={followUpCount}
            briefCreatedAt={null}
          />
        </div>
      </div>
    )
  }

  const metadata = brief.metadata as Record<string, unknown> | null
  const isReviewed = metadata?.reviewed === true

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
