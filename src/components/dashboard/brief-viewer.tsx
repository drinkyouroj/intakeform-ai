'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { markBriefReviewed } from '@/lib/actions/briefs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageResponse } from '@/components/ai-elements/message'
import { CheckCircle2, Clock } from 'lucide-react'

interface KeyFlag {
  label: string
  severity: string
  evidence: string
}

interface BriefStructured {
  situationSummary: string
  keyFlags: KeyFlag[]
  firstCallQuestions: string[]
  backgroundContext?: string
}

interface BriefViewerProps {
  briefId: string
  content: string
  structured: BriefStructured
  isReviewed: boolean
}

function FlagBadge({ flag }: { flag: KeyFlag }) {
  const severityClasses: Record<string, string> = {
    risk: '',
    complexity: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
    info: 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
  }

  const variant = flag.severity === 'risk' ? 'destructive' : 'secondary'
  const customClass = severityClasses[flag.severity] ?? severityClasses.info

  return (
    <div className="flex flex-col gap-1">
      <Badge
        variant={variant}
        className={flag.severity !== 'risk' ? customClass : undefined}
      >
        {flag.label}
      </Badge>
      {flag.evidence && (
        <p className="text-xs text-muted-foreground pl-1">{flag.evidence}</p>
      )}
    </div>
  )
}

export function BriefViewer({
  briefId,
  content,
  structured,
  isReviewed,
}: BriefViewerProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleMarkReviewed() {
    startTransition(async () => {
      await markBriefReviewed(briefId)
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Pre-Read Brief</h1>
          {isReviewed && (
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2 className="size-3" />
              Reviewed
            </Badge>
          )}
        </div>
        {!isReviewed && (
          <Button
            onClick={handleMarkReviewed}
            disabled={isPending}
            variant="default"
            size="sm"
          >
            {isPending ? (
              <>
                <Clock className="size-4 animate-spin" />
                Marking...
              </>
            ) : (
              <>
                <CheckCircle2 className="size-4" />
                Mark Reviewed
              </>
            )}
          </Button>
        )}
      </div>

      {/* Brief Content */}
      <Card>
        <CardContent>
          <article className="prose prose-sm dark:prose-invert max-w-none">
            <MessageResponse>{content}</MessageResponse>
          </article>
        </CardContent>
      </Card>

      {/* Key Flags */}
      {structured.keyFlags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Key Flags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {structured.keyFlags.map((flag, i) => (
                <FlagBadge key={`${flag.label}-${i}`} flag={flag} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* First Call Questions */}
      {structured.firstCallQuestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>First Call Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              {structured.firstCallQuestions.map((question, i) => (
                <li key={i} className="leading-relaxed">
                  {question}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
