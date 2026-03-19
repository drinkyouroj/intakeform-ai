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
}: QuestionDisplayProps) {
  const [localTextValue, setLocalTextValue] = useState(currentAnswer ?? '')
  const answered = currentAnswer !== undefined && currentAnswer !== ''

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
        <span className="text-sm font-medium text-violet-500 dark:text-violet-400">
          {index + 1}.
        </span>
        <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mt-1">
          {prompt}
        </h3>
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
            disabled={answered && pendingFollowUp}
          />
        )}

        {type === 'select' && options && (
          <RadioGroup
            value={currentAnswer ?? undefined}
            onValueChange={handleSelectChange}
          >
            {(options as string[]).map((option) => (
              <label
                key={option}
                className={cn(
                  'flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-colors',
                  'hover:bg-zinc-50 dark:hover:bg-zinc-900',
                  currentAnswer === option &&
                    'border-violet-300 bg-violet-50/50 dark:border-violet-700 dark:bg-violet-950/30',
                )}
              >
                <RadioGroupItem value={option} />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
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
            onAnswer={(val) => onAnswer(questionId, val)}
          />
        )}

        {type === 'date' && (
          <Input
            type="date"
            value={currentAnswer ?? ''}
            onChange={handleDateChange}
            className="max-w-xs h-10"
          />
        )}

        {type === 'scale' && (
          <ScaleInput
            currentAnswer={currentAnswer}
            onAnswer={(val) => onAnswer(questionId, val)}
          />
        )}
      </div>

      {/* Follow-up regions */}
      {followUps.slice(0, -1).map((fu, i) => (
        <FollowUpRegion
          key={i}
          followUp={fu}
          isLoading={false}
          onAnswer={(ans) => onFollowUpAnswer(questionId, ans)}
        />
      ))}

      {/* Latest follow-up (may be loading) */}
      <FollowUpRegion
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
  onAnswer,
}: {
  options: string[]
  currentAnswer?: string
  onAnswer: (value: string) => void
}) {
  const selected: string[] = currentAnswer ? currentAnswer.split('||') : []

  const toggle = (option: string) => {
    const next = selected.includes(option)
      ? selected.filter((s) => s !== option)
      : [...selected, option]
    if (next.length > 0) {
      onAnswer(next.join('||'))
    }
  }

  return (
    <div className="grid gap-2">
      {options.map((option) => {
        const isChecked = selected.includes(option)
        return (
          <label
            key={option}
            className={cn(
              'flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-colors',
              'hover:bg-zinc-50 dark:hover:bg-zinc-900',
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
              tabIndex={0}
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
            <span className="text-sm text-zinc-700 dark:text-zinc-300">
              {option}
            </span>
          </label>
        )
      })}
    </div>
  )
}

// --- Scale (1-10) ---

function ScaleInput({
  currentAnswer,
  onAnswer,
}: {
  currentAnswer?: string
  onAnswer: (value: string) => void
}) {
  const currentValue = currentAnswer ? parseInt(currentAnswer, 10) : null

  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onAnswer(String(n))}
          className={cn(
            'size-10 rounded-lg border text-sm font-medium transition-colors',
            'hover:bg-zinc-50 dark:hover:bg-zinc-900',
            currentValue === n
              ? 'bg-violet-500 border-violet-500 text-white hover:bg-violet-600'
              : 'border-input text-zinc-700 dark:text-zinc-300',
          )}
        >
          {n}
        </button>
      ))}
    </div>
  )
}
