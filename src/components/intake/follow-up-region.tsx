'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Textarea } from '@/components/ui/textarea'
import { useState, useCallback } from 'react'

interface FollowUpRegionProps {
  followUp: { question: string; answer?: string | null } | null
  isLoading: boolean
  onAnswer: (answer: string) => void
}

function ThinkingDots() {
  return (
    <div className="flex gap-1 items-center text-muted-foreground text-sm py-2">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-violet-400"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
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
    const trimmed = localValue.trim()
    if (!trimmed) return
    setSubmitted(true)
    onAnswer(trimmed)
  }, [localValue, onAnswer])

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
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="overflow-hidden"
        >
          <div className="ml-6 mt-4 pl-4 border-l-[3px] border-violet-400/60 bg-violet-50/50 dark:bg-violet-950/20 rounded-r-lg py-3 pr-4">
            {isLoading && !followUp ? (
              <ThinkingDots />
            ) : followUp ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
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
                    className="text-sm min-h-[2.5rem] bg-white dark:bg-zinc-900"
                    autoFocus
                  />
                )}
              </motion.div>
            ) : null}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
