'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { Sparkles } from 'lucide-react'

interface PreviewQuestion {
  id: string
  prompt: string
  type: 'text' | 'select' | 'multiselect' | 'date' | 'scale'
  options: string[] | null
  aiFollowUp: { enabled: boolean; maxFollowUps: number; systemPrompt?: string } | null
}

interface FormPreviewProps {
  questions: PreviewQuestion[]
  formTitle: string
}

export function FormPreview({ questions, formTitle }: FormPreviewProps) {
  const total = questions.length

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      {/* Title */}
      <h2 className="mb-6 text-2xl font-bold">{formTitle}</h2>

      {/* Questions */}
      <div className="flex flex-col gap-6">
        {questions.map((q, idx) => (
          <Card key={q.id} className="bg-muted/30">
            <CardContent className="flex flex-col gap-3">
              {/* Progress indicator */}
              <p className="text-xs text-muted-foreground">
                Question {idx + 1} of {total}
              </p>

              {/* Prompt */}
              <div className="flex items-start gap-2">
                <span className="mt-0.5 text-sm font-semibold text-muted-foreground">
                  {idx + 1}.
                </span>
                <p className="text-sm font-medium">{q.prompt}</p>
              </div>

              {/* AI follow-up badge */}
              {q.aiFollowUp?.enabled && (
                <Badge variant="secondary" className="w-fit">
                  <Sparkles data-icon="inline-start" />
                  AI follow-up active
                </Badge>
              )}

              {/* Input by type */}
              <div className="mt-1">
                <QuestionInput question={q} index={idx} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Submit button */}
      {total > 0 && (
        <div className="mt-8 flex justify-center">
          <Button size="lg" disabled>
            Submit (disabled in preview)
          </Button>
        </div>
      )}
    </div>
  )
}

function QuestionInput({
  question,
  index,
}: {
  question: PreviewQuestion
  index: number
}) {
  const options = question.options ?? []

  switch (question.type) {
    case 'text':
      return (
        <Textarea
          placeholder="Type your answer here..."
          disabled
          rows={3}
        />
      )

    case 'select':
      return (
        <RadioGroup aria-label={`Question ${index + 1}`}>
          {options.length > 0 ? (
            options.map((opt) => (
              <div key={opt} className="flex items-center gap-2">
                <RadioGroupItem value={opt} disabled />
                <Label className="text-sm font-normal">{opt}</Label>
              </div>
            ))
          ) : (
            <p className="text-xs italic text-muted-foreground">No options defined</p>
          )}
        </RadioGroup>
      )

    case 'multiselect':
      return (
        <div className="flex flex-col gap-2">
          {options.length > 0 ? (
            options.map((opt) => (
              <label key={opt} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  disabled
                  className="size-4 rounded border border-input accent-primary"
                />
                <span className="text-sm">{opt}</span>
              </label>
            ))
          ) : (
            <p className="text-xs italic text-muted-foreground">No options defined</p>
          )}
        </div>
      )

    case 'date':
      return <Input type="date" disabled />

    case 'scale':
      return (
        <div className="flex gap-2">
          {(options.length > 0
            ? options
            : ['1', '2', '3', '4', '5']
          ).map((val) => (
            <Button key={val} variant="outline" size="sm" disabled>
              {val}
            </Button>
          ))}
        </div>
      )

    default:
      return (
        <Input placeholder="Type your answer..." disabled />
      )
  }
}
