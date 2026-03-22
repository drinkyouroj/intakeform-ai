'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Textarea } from '@/components/ui/textarea'
import { useState, useCallback } from 'react'
import { followUpReveal, thinkingDot } from '@/lib/motion'

interface FollowUpRegionProps {
  followUp: { question: string; answer?: string | null } | null
  isLoading: boolean
  onAnswer: (answer: string) => void
}

function ThinkingDots() {
  return (
    <div
      className="flex gap-1.5 items-center py-2 pl-1"
      role="status"
      aria-label="AI is thinking"
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-[var(--ai-thinking,theme(colors.violet.400))]"
          variants={thinkingDot(i)}
          initial="initial"
          animate="animate"
          exit="exit"
        />
      ))}
      <span className="sr-only">AI is processing your answer</span>
    </div>
  )
}

export function FollowUpRegion({
  followUp,
  isLoading,
  onAnswer,
}: FollowUpRegionProps) {
  const [localValue, setLocalValue] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = useCallback(() => {
    if (submitted) return
    const trimmed = localValue.trim()
    if (!trimmed) return
    setSubmitted(true)
    onAnswer(trimmed)
  }, [localValue, onAnswer, submitted])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit],
  )

  const showRegion = isLoading || followUp !== null

  return (
    <AnimatePresence>
      {showRegion && (
        <motion.div
          variants={followUpReveal}
          initial="initial"
          animate="animate"
          exit="exit"
          className="overflow-hidden"
        >
          <div className="ml-6 mt-4 pl-4 border-l-[3px] border-[var(--ai-connector,theme(colors.violet.400/60%))] bg-violet-50/50 dark:bg-violet-950/20 rounded-r-lg py-3 pr-4">
            <AnimatePresence mode="wait">
              {isLoading && !followUp ? (
                <ThinkingDots key="thinking" />
              ) : followUp ? (
                <motion.div
                  key="followup"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.35,
                    ease: [0.16, 1, 0.3, 1],
                    delay: 0.1,
                  }}
                >
                  <p className="text-sm font-medium text-foreground mb-2">
                    {followUp.question}
                  </p>
                  {followUp.answer || submitted ? (
                    <p className="text-sm text-muted-foreground">
                      {followUp.answer || localValue}
                    </p>
                  ) : (
                    <Textarea
                      value={localValue}
                      onChange={(e) => setLocalValue(e.target.value)}
                      onBlur={handleSubmit}
                      onKeyDown={handleKeyDown}
                      placeholder="Type your response..."
                      rows={2}
                      className="text-sm min-h-[2.5rem] bg-background"
                      autoFocus
                      aria-label="Follow-up response"
                    />
                  )}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
