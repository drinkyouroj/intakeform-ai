'use client'

import { useState, useTransition } from 'react'
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
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {PROFESSIONS.map(({ label, value, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => setSelected(value)}
            className="text-left"
          >
            <Card
              className={cn(
                'cursor-pointer transition-colors hover:ring-primary/50',
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
        ))}
      </div>
      <div className="flex justify-center">
        <Button
          size="lg"
          disabled={!selected || isPending}
          onClick={handleContinue}
        >
          {isPending ? 'Setting up...' : 'Continue'}
        </Button>
      </div>
    </div>
  )
}
