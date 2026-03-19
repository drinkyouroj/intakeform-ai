import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled'

interface SubscriptionBannerProps {
  status: SubscriptionStatus | null
  trialEndsAt: Date | string | null
}

function getDaysRemaining(trialEndsAt: Date | string): number {
  const end = new Date(trialEndsAt)
  const now = new Date()
  const diff = end.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

const bannerConfig: Record<
  Exclude<SubscriptionStatus, 'active'>,
  {
    className: string
    getMessage: (daysRemaining?: number) => string
    cta: string
  }
> = {
  trialing: {
    className:
      'bg-yellow-500/15 text-yellow-700 border-yellow-500/25 dark:text-yellow-400 dark:border-yellow-500/30',
    getMessage: (days) =>
      days !== undefined
        ? `Trial ends in ${days} day${days !== 1 ? 's' : ''}`
        : 'Your trial is active',
    cta: 'Upgrade now',
  },
  past_due: {
    className:
      'bg-red-500/15 text-red-700 border-red-500/25 dark:text-red-400 dark:border-red-500/30',
    getMessage: () => 'Payment failed \u2014 update billing to continue',
    cta: 'Update billing',
  },
  canceled: {
    className:
      'bg-orange-500/15 text-orange-700 border-orange-500/25 dark:text-orange-400 dark:border-orange-500/30',
    getMessage: () => 'Subscription canceled. Your forms are inactive.',
    cta: 'Resubscribe',
  },
}

export function SubscriptionBanner({
  status,
  trialEndsAt,
}: SubscriptionBannerProps) {
  if (!status || status === 'active') return null

  const config = bannerConfig[status]
  const daysRemaining =
    status === 'trialing' && trialEndsAt
      ? getDaysRemaining(trialEndsAt)
      : undefined

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 border-b px-4 py-2.5 text-sm',
        config.className
      )}
    >
      <p className="font-medium">{config.getMessage(daysRemaining)}</p>
      <Button
        variant="outline"
        size="sm"
        className="shrink-0"
        render={<Link href="/dashboard/settings?tab=billing" />}
      >
        {config.cta}
      </Button>
    </div>
  )
}
