'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { activateForm } from '@/lib/actions/onboarding'

interface Question {
  id: string
  prompt: string
  type: string
  options: string[] | null
  aiFollowUp: { enabled: boolean; maxFollowUps: number } | null
}

interface TemplatePreviewProps {
  form: {
    id: string
    title: string
    description: string | null
  }
  questions: Question[]
}

export function TemplatePreview({ form, questions }: TemplatePreviewProps) {
  const [isPending, startTransition] = useTransition()

  function handleActivate() {
    startTransition(async () => {
      await activateForm(form.id)
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{form.title}</CardTitle>
          {form.description && (
            <CardDescription>{form.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <ol className="space-y-4">
            {questions.map((q, i) => (
              <li key={q.id} className="flex items-start gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                  {i + 1}
                </span>
                <div className="flex-1 space-y-1">
                  <p className="text-sm text-foreground">{q.prompt}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{q.type}</Badge>
                    {q.aiFollowUp?.enabled && (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Sparkles className="size-3" />
                        AI follow-up
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <div className="flex items-center justify-center gap-3">
        <Button
          size="lg"
          disabled={isPending}
          onClick={handleActivate}
        >
          {isPending ? 'Activating...' : 'Activate this form'}
        </Button>
        <Button
          variant="outline"
          size="lg"
          render={<Link href="/dashboard/forms" />}
        >
          Customize first
        </Button>
      </div>
    </div>
  )
}
