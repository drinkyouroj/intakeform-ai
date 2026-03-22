'use client'

import { useTransition } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Plus, Loader2 } from 'lucide-react'
import { createFormFromTemplate } from '@/lib/actions/forms'

interface TemplateInfo {
  slug: string
  title: string
  description: string
  profession: string
  questionCount: number
}

export function TemplatePicker({ templates }: { templates: TemplateInfo[] }) {
  const [isPending, startTransition] = useTransition()

  function handleSelect(slug: string | null) {
    startTransition(async () => {
      await createFormFromTemplate(slug)
    })
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* Blank form card */}
      <button
        onClick={() => handleSelect(null)}
        disabled={isPending}
        className="text-left"
      >
        <Card className="flex flex-col items-center justify-center p-6 h-full border-dashed hover:border-primary/50 hover:bg-muted/50 transition-colors cursor-pointer">
          {isPending ? (
            <Loader2 className="size-8 text-muted-foreground mb-3 animate-spin" />
          ) : (
            <Plus className="size-8 text-muted-foreground mb-3" />
          )}
          <h3 className="font-medium">Blank Form</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Start from scratch
          </p>
        </Card>
      </button>

      {/* Template cards */}
      {templates.map((t) => (
        <button
          key={t.slug}
          onClick={() => handleSelect(t.slug)}
          disabled={isPending}
          className="text-left"
        >
          <Card className="flex flex-col p-6 h-full hover:border-primary/50 hover:bg-muted/50 transition-colors cursor-pointer">
            <div className="flex items-start gap-3 mb-3">
              <FileText className="size-5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="min-w-0">
                <h3 className="font-medium">{t.title}</h3>
                <Badge variant="secondary" className="text-xs mt-1">
                  {t.profession}
                </Badge>
              </div>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {t.description}
            </p>
            <p className="text-xs text-muted-foreground mt-auto pt-3">
              {t.questionCount} questions with AI follow-ups
            </p>
          </Card>
        </button>
      ))}
    </div>
  )
}
