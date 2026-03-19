import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface BriefSidebarProps {
  formName: string
  completedAt: Date | null
  createdAt: Date | null
  answerCount: number
  followUpCount: number
  briefCreatedAt: Date | null
}

function formatDate(date: Date | null): string {
  if (!date) return '--'
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function MetaRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-mono text-sm">{value}</span>
    </div>
  )
}

export function BriefSidebar({
  formName,
  completedAt,
  createdAt,
  answerCount,
  followUpCount,
  briefCreatedAt,
}: BriefSidebarProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Session Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <MetaRow label="Form" value={formName} />
        <Separator />
        <MetaRow
          label="Date completed"
          value={formatDate(completedAt ?? createdAt)}
        />
        <Separator />
        <MetaRow label="Total answers" value={answerCount} />
        <Separator />
        <MetaRow label="Follow-ups asked" value={followUpCount} />
        <Separator />
        <MetaRow label="Brief generated" value={formatDate(briefCreatedAt)} />
      </CardContent>
    </Card>
  )
}
