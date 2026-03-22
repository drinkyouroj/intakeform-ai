'use client'

import { useState, useCallback } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'
import { FollowUpRegion } from './follow-up-region'

type QuestionType = 'text' | 'select' | 'multiselect' | 'date' | 'scale'

interface FollowUpData {
  question: string
  answer?: string | null
}

interface QuestionDisplayProps {
  index: number
  questionId: string
  prompt: string
  type: QuestionType
  options?: string[] | null
  currentAnswer?: string
  followUps: FollowUpData[]
  pendingFollowUp: boolean
  onAnswer: (questionId: string, answer: string) => void
  onFollowUpAnswer: (questionId: string, answer: string) => void
  onReset: (questionId: string) => void
}

export function QuestionDisplay({
  index,
  questionId,
  prompt,
  type,
  options,
  currentAnswer,
  followUps,
  pendingFollowUp,
  onAnswer,
  onFollowUpAnswer,
  onReset,
}: QuestionDisplayProps) {
  const [localTextValue, setLocalTextValue] = useState(currentAnswer ?? '')
  const answered = currentAnswer !== undefined && currentAnswer !== ''
  // Lock the input once answered — user must click "Redo" to change
  const locked = answered

  const handleTextBlur = useCallback(() => {
    const trimmed = localTextValue.trim()
    if (trimmed && trimmed !== currentAnswer) {
      onAnswer(questionId, trimmed)
    }
  }, [localTextValue, currentAnswer, questionId, onAnswer])

  const handleTextKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleTextBlur()
      }
    },
    [handleTextBlur],
  )

  const handleSelectChange = useCallback(
    (value: string) => {
      if (value) {
        onAnswer(questionId, value)
      }
    },
    [questionId, onAnswer],
  )

  const handleDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.value) {
        onAnswer(questionId, e.target.value)
      }
    },
    [questionId, onAnswer],
  )

  // Determine latest follow-up for the region
  const latestFollowUp =
    followUps.length > 0 ? followUps[followUps.length - 1] : null

  return (
    <div className="py-6">
      {/* Question header */}
      <div className="mb-3">
        <div className="flex items-baseline justify-between gap-2">
          <div>
            <span className="text-sm font-medium text-primary">
              {index + 1}.
            </span>
            <h3 className="text-lg font-medium text-foreground mt-1">
              {prompt}
            </h3>
          </div>
          {answered && !pendingFollowUp && (
            <button
              type="button"
              onClick={() => onReset(questionId)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              Redo
            </button>
          )}
        </div>
      </div>

      {/* Input area */}
      <div className="mt-2">
        {type === 'text' && (
          <Textarea
            value={localTextValue}
            onChange={(e) => setLocalTextValue(e.target.value)}
            onBlur={handleTextBlur}
            onKeyDown={handleTextKeyDown}
            placeholder="Type your answer..."
            rows={3}
            className="max-h-48"
            readOnly={locked}
          />
        )}

        {type === 'select' && options && (
          <RadioGroup
            value={currentAnswer ?? undefined}
            onValueChange={locked ? undefined : handleSelectChange}
            disabled={locked}
          >
            {(options as string[]).map((option) => (
              <label
                key={option}
                className={cn(
                  'flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors',
                  locked ? 'cursor-default' : 'cursor-pointer hover:bg-muted',
                  currentAnswer === option &&
                    'border-violet-300 bg-violet-50/50 dark:border-violet-700 dark:bg-violet-950/30',
                )}
              >
                <RadioGroupItem value={option} disabled={locked} />
                <span className="text-sm text-foreground">
                  {option}
                </span>
              </label>
            ))}
          </RadioGroup>
        )}

        {type === 'multiselect' && options && (
          <MultiselectInput
            options={options as string[]}
            currentAnswer={currentAnswer}
            onConfirm={(val) => onAnswer(questionId, val)}
            locked={locked}
          />
        )}

        {type === 'date' && (
          <Input
            type="date"
            value={currentAnswer ?? ''}
            onChange={handleDateChange}
            className="max-w-xs h-10"
            readOnly={locked}
          />
        )}

        {type === 'scale' && (
          <ScaleInput
            currentAnswer={currentAnswer}
            onAnswer={(val) => onAnswer(questionId, val)}
            disabled={locked}
          />
        )}
      </div>

      {/* Answered follow-ups (read-only) */}
      {followUps.slice(0, -1).map((fu, i) => (
        <FollowUpRegion
          key={`${questionId}-fu-${i}`}
          followUp={fu}
          isLoading={false}
          onAnswer={() => {}} // Already answered, no-op
        />
      ))}

      {/* Latest follow-up (may be loading or awaiting answer) */}
      <FollowUpRegion
        key={`${questionId}-fu-latest-${followUps.length}`}
        followUp={latestFollowUp}
        isLoading={pendingFollowUp && !latestFollowUp}
        onAnswer={(ans) => onFollowUpAnswer(questionId, ans)}
      />
    </div>
  )
}

// --- Multiselect with checkboxes ---

function MultiselectInput({
  options,
  currentAnswer,
  onConfirm,
  locked,
}: {
  options: string[]
  currentAnswer?: string
  onConfirm: (value: string) => void
  locked?: boolean
}) {
  const committed: string[] = currentAnswer ? currentAnswer.split('||') : []
  const [localSelected, setLocalSelected] = useState<string[]>(committed)
  const hasLocalChanges =
    !locked && localSelected.length > 0 &&
    (localSelected.length !== committed.length ||
      localSelected.some((s) => !committed.includes(s)))

  const toggle = (option: string) => {
    if (locked) return
    setLocalSelected((prev) =>
      prev.includes(option)
        ? prev.filter((s) => s !== option)
        : [...prev, option],
    )
  }

  const handleConfirm = () => {
    if (localSelected.length > 0) {
      onConfirm(localSelected.join('||'))
    }
  }

  return (
    <div>
      <div className="grid gap-2">
        {options.map((option) => {
          const isChecked = locked
            ? committed.includes(option)
            : localSelected.includes(option)
          return (
            <label
              key={option}
              className={cn(
                'flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors',
                locked ? 'cursor-default' : 'cursor-pointer hover:bg-muted',
                isChecked &&
                  'border-violet-300 bg-violet-50/50 dark:border-violet-700 dark:bg-violet-950/30',
              )}
            >
              <div
                className={cn(
                  'flex items-center justify-center size-4 shrink-0 rounded border transition-colors',
                  isChecked
                    ? 'bg-violet-500 border-violet-500 text-white'
                    : 'border-input',
                )}
                onClick={() => toggle(option)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    toggle(option)
                  }
                }}
                role="checkbox"
                aria-checked={isChecked}
                aria-disabled={locked}
                tabIndex={locked ? -1 : 0}
              >
                {isChecked && (
                  <svg
                    className="size-3"
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M2.5 6L5 8.5L9.5 3.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              <span className="text-sm text-foreground">
                {option}
              </span>
            </label>
          )
        })}
      </div>
      {hasLocalChanges && (
        <button
          type="button"
          onClick={handleConfirm}
          className="mt-3 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Confirm selection
        </button>
      )}
    </div>
  )
}

// --- Scale (1-10) ---

function ScaleInput({
  currentAnswer,
  onAnswer,
  disabled,
}: {
  currentAnswer?: string
  onAnswer: (value: string) => void
  disabled?: boolean
}) {
  const currentValue = currentAnswer ? parseInt(currentAnswer, 10) : null

  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => !disabled && onAnswer(String(n))}
          disabled={disabled}
          className={cn(
            'size-10 rounded-lg border text-sm font-medium transition-colors',
            disabled ? '' : 'hover:bg-muted',
            currentValue === n
              ? 'bg-violet-500 border-violet-500 text-white'
              : 'border-input text-foreground',
          )}
        >
          {n}
        </button>
      ))}
    </div>
  )
}
