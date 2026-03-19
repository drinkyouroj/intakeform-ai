'use client'

import { useState, useTransition } from 'react'
import { motion } from 'framer-motion'
import {
  Heart,
  Target,
  Briefcase,
  TrendingUp,
  Scale,
  MoreHorizontal,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { selectProfession } from '@/lib/actions/onboarding'
import { staggerContainer, staggerChild } from '@/lib/motion'

const PROFESSIONS = [
  { label: 'Therapist', value: 'Therapist', icon: Heart },
  { label: 'Business Coach', value: 'Business Coach', icon: Target },
  { label: 'Consultant', value: 'Consultant', icon: Briefcase },
  { label: 'Financial Advisor', value: 'Financial Advisor', icon: TrendingUp },
  { label: 'Attorney', value: 'Attorney', icon: Scale },
  { label: 'Other', value: 'Other', icon: MoreHorizontal },
] as const

export function ProfessionCards() {
  const [selected, setSelected] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleContinue() {
    if (!selected) return
    startTransition(async () => {
      await selectProfession(selected)
    })
  }

  return (
    <div className="space-y-6">
      <motion.div
        className="grid grid-cols-2 gap-4 sm:grid-cols-3"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {PROFESSIONS.map(({ label, value, icon: Icon }) => (
          <motion.div key={value} variants={staggerChild}>
            <button
              type="button"
              onClick={() => setSelected(value)}
              className="text-left w-full"
            >
              <Card
                className={cn(
                  'cursor-pointer transition-all duration-200 hover:ring-primary/50 hover:-translate-y-0.5 hover:shadow-md',
                  selected === value &&
                    'ring-2 ring-primary bg-primary/5'
                )}
              >
                <CardContent className="flex flex-col items-center gap-3 py-4 text-center">
                  <Icon
                    className={cn(
                      'size-8 text-muted-foreground transition-colors',
                      selected === value && 'text-primary'
                    )}
                  />
                  <span className="text-sm font-medium text-foreground">
                    {label}
                  </span>
                </CardContent>
              </Card>
            </button>
          </motion.div>
        ))}
      </motion.div>
      <motion.div
        className="flex justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Button
          size="lg"
          disabled={!selected || isPending}
          onClick={handleContinue}
        >
          {isPending ? 'Setting up...' : 'Continue'}
        </Button>
      </motion.div>
    </div>
  )
}
