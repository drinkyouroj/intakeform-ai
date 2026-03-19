'use client'

import {
  Progress,
  ProgressTrack,
  ProgressIndicator,
} from '@/components/ui/progress'

interface ProgressBarProps {
  answered: number
  total: number
}

export function ProgressBar({ answered, total }: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((answered / total) * 100) : 0

  return (
    <div className="flex items-center gap-3">
      <Progress value={percentage} className="flex-1">
        <ProgressTrack className="h-1.5">
          <ProgressIndicator className="bg-violet-500" />
        </ProgressTrack>
      </Progress>
      <span className="text-sm tabular-nums text-muted-foreground whitespace-nowrap">
        {answered} of {total}
      </span>
    </div>
  )
}
