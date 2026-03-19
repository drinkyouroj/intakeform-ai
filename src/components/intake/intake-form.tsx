'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { completeSession } from '@/lib/actions/sessions'
import { QuestionDisplay } from './question-display'
import { ProgressBar } from './progress-bar'
import { CompletionScreen } from './completion-screen'
import { Button } from '@/components/ui/button'

interface Question {
  id: string
  prompt: string
  type: 'text' | 'select' | 'multiselect' | 'date' | 'scale'
  options: string[] | null
  sortOrder: number
  aiFollowUp: { enabled: boolean; maxFollowUps: number } | null
}

interface FollowUpData {
  question: string
  answer?: string | null
}

interface AnswerEntry {
  answer: string
  followUps: FollowUpData[]
}

interface IntakeFormProps {
  formId: string
  formTitle: string
  formDescription: string | null
}

const STORAGE_KEY = (formId: string) => `intakeform_resume_${formId}`

export function IntakeForm({
  formId,
  formTitle,
  formDescription,
}: IntakeFormProps) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [version, setVersion] = useState(1)
  const [answers, setAnswers] = useState<Record<string, AnswerEntry>>({})
  const [pendingFollowUp, setPendingFollowUp] = useState<string | null>(null)
  const [isComplete, setIsComplete] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const versionRef = useRef(1)

  // Keep version ref in sync
  useEffect(() => {
    versionRef.current = version
  }, [version])

  // Initialize session on mount
  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        // Check for existing resume token
        const storedToken = localStorage.getItem(STORAGE_KEY(formId))

        if (storedToken) {
          // Try to resume
          const res = await fetch(
            `/api/session/resume?token=${encodeURIComponent(storedToken)}`,
          )
          if (res.ok) {
            const data = await res.json()
            if (!cancelled) {
              setSessionId(data.sessionId)
              setVersion(data.version ?? 1)
              versionRef.current = data.version ?? 1

              // Restore answers from state
              const state = data.state as Record<string, unknown>
              const savedAnswers =
                (state?.answers as Array<Record<string, unknown>>) ?? []
              const restored: Record<string, AnswerEntry> = {}
              for (const entry of savedAnswers) {
                const qId = entry.questionId as string
                restored[qId] = {
                  answer: entry.answer as string,
                  followUps: (entry.followUps as FollowUpData[]) ?? [],
                }
              }
              setAnswers(restored)

              // We still need questions — start a new session fetch for the questions list
              // Actually, resume doesn't return questions, so we need to fetch them
              await fetchQuestions(data.formId ?? formId, cancelled)
              return
            }
          } else {
            // Token invalid, remove it
            localStorage.removeItem(STORAGE_KEY(formId))
          }
        }

        // Start a new session
        const res = await fetch('/api/session/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ formId }),
        })

        if (!res.ok) {
          throw new Error('Failed to start session')
        }

        const data = await res.json()
        if (!cancelled) {
          setSessionId(data.sessionId)
          setVersion(1)
          versionRef.current = 1
          setQuestions(data.questions ?? [])
          if (data.resumeToken) {
            localStorage.setItem(STORAGE_KEY(formId), data.resumeToken)
          }
        }
      } catch (err) {
        console.error('[IntakeForm] Init failed:', err)
        if (!cancelled) {
          toast.error('Failed to load the form. Please try refreshing.')
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    async function fetchQuestions(fId: string, isCancelled: boolean) {
      // Start a throwaway session just to get the question list
      // In production, we'd have a dedicated questions endpoint
      const res = await fetch('/api/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formId: fId }),
      })
      if (res.ok) {
        const data = await res.json()
        if (!isCancelled) {
          setQuestions(data.questions ?? [])
        }
      }
    }

    init()
    return () => {
      cancelled = true
    }
  }, [formId])

  // Submit an answer for a primary question
  const handleAnswer = useCallback(
    async (questionId: string, answer: string) => {
      if (!sessionId) return

      // Optimistically set the answer
      setAnswers((prev) => ({
        ...prev,
        [questionId]: {
          answer,
          followUps: prev[questionId]?.followUps ?? [],
        },
      }))

      setPendingFollowUp(questionId)

      try {
        const res = await fetch('/api/session/answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            questionId,
            answer,
            version: versionRef.current,
          }),
        })

        if (res.status === 409) {
          toast.error('Session updated elsewhere. Please refresh.')
          setPendingFollowUp(null)
          return
        }

        if (!res.ok) {
          throw new Error('Failed to submit answer')
        }

        const data = await res.json()

        setVersion(data.version)
        versionRef.current = data.version

        if (data.followUp?.question) {
          setAnswers((prev) => ({
            ...prev,
            [questionId]: {
              ...prev[questionId],
              followUps: [
                ...(prev[questionId]?.followUps ?? []),
                { question: data.followUp.question, answer: null },
              ],
            },
          }))
        }
      } catch (err) {
        console.error('[IntakeForm] Answer submission failed:', err)
        toast.error('Failed to save your answer. Please try again.')
      } finally {
        setPendingFollowUp(null)
      }
    },
    [sessionId],
  )

  // Submit an answer for a follow-up question
  const handleFollowUpAnswer = useCallback(
    async (questionId: string, answer: string) => {
      if (!sessionId) return

      // Optimistically update the follow-up answer
      setAnswers((prev) => {
        const entry = prev[questionId]
        if (!entry) return prev
        const fups = [...entry.followUps]
        if (fups.length > 0) {
          fups[fups.length - 1] = { ...fups[fups.length - 1], answer }
        }
        return { ...prev, [questionId]: { ...entry, followUps: fups } }
      })

      setPendingFollowUp(questionId)

      try {
        const res = await fetch('/api/session/answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            questionId,
            answer,
            version: versionRef.current,
          }),
        })

        if (res.status === 409) {
          toast.error('Session updated elsewhere. Please refresh.')
          setPendingFollowUp(null)
          return
        }

        if (!res.ok) {
          throw new Error('Failed to submit follow-up answer')
        }

        const data = await res.json()

        setVersion(data.version)
        versionRef.current = data.version

        if (data.followUp?.question) {
          setAnswers((prev) => ({
            ...prev,
            [questionId]: {
              ...prev[questionId],
              followUps: [
                ...(prev[questionId]?.followUps ?? []),
                { question: data.followUp.question, answer: null },
              ],
            },
          }))
        }
      } catch (err) {
        console.error('[IntakeForm] Follow-up answer failed:', err)
        toast.error('Failed to save your answer. Please try again.')
      } finally {
        setPendingFollowUp(null)
      }
    },
    [sessionId],
  )

  // Complete the session
  const handleComplete = useCallback(async () => {
    if (!sessionId) return
    setIsSubmitting(true)
    try {
      await completeSession(sessionId)
      localStorage.removeItem(STORAGE_KEY(formId))
      setIsComplete(true)
    } catch (err) {
      console.error('[IntakeForm] Completion failed:', err)
      toast.error('Failed to submit the form. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }, [sessionId, formId])

  // Count answered primary questions
  const answeredCount = questions.filter(
    (q) => answers[q.id]?.answer,
  ).length
  const totalCount = questions.length
  const allAnswered = totalCount > 0 && answeredCount === totalCount

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-zinc-100 dark:bg-zinc-800 rounded w-2/3" />
          <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-1/2" />
          <div className="space-y-8 mt-12">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <div className="h-5 bg-zinc-100 dark:bg-zinc-800 rounded w-3/4" />
                <div className="h-12 bg-zinc-100 dark:bg-zinc-800 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (isComplete) {
    return (
      <div className="max-w-2xl mx-auto px-4">
        <CompletionScreen />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          {formTitle}
        </h1>
        {formDescription && (
          <p className="text-muted-foreground mt-2 leading-relaxed">
            {formDescription}
          </p>
        )}
      </motion.header>

      {/* Progress */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm py-3 -mx-4 px-4 mb-4">
        <ProgressBar answered={answeredCount} total={totalCount} />
      </div>

      {/* Questions */}
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
        {questions.map((q, i) => (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
          >
            <QuestionDisplay
              index={i}
              questionId={q.id}
              prompt={q.prompt}
              type={q.type}
              options={q.options as string[] | null}
              currentAnswer={answers[q.id]?.answer}
              followUps={answers[q.id]?.followUps ?? []}
              pendingFollowUp={pendingFollowUp === q.id}
              onAnswer={handleAnswer}
              onFollowUpAnswer={handleFollowUpAnswer}
            />
          </motion.div>
        ))}
      </div>

      {/* Submit button */}
      {allAnswered && !pendingFollowUp && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-8 pb-16"
        >
          <Button
            onClick={handleComplete}
            disabled={isSubmitting}
            className="w-full h-12 text-base font-medium bg-violet-600 hover:bg-violet-700 text-white"
          >
            {isSubmitting ? 'Submitting...' : 'Complete'}
          </Button>
        </motion.div>
      )}
    </div>
  )
}
