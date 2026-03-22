import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Eye, FileText } from 'lucide-react'

interface IntakeRow {
  sessionId: string
  formId: string
  formTitle: string
  clientName: string
  status: string
  briefStatus: string
  date: Date
}

function statusVariant(status: string) {
  switch (status) {
    case 'completed':
      return 'default' as const
    case 'active':
      return 'secondary' as const
    case 'abandoned':
      return 'destructive' as const
    default:
      return 'outline' as const
  }
}

export function IntakesTable({ rows }: { rows: IntakeRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No recent intakes yet.
      </p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Client</TableHead>
          <TableHead>Form</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.sessionId}>
            <TableCell className="font-medium">{row.clientName}</TableCell>
            <TableCell>{row.formTitle}</TableCell>
            <TableCell>
              <Badge variant={statusVariant(row.status)}>
                {row.status}
              </Badge>
            </TableCell>
            <TableCell>{row.date.toLocaleDateString()}</TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-1">
                {row.status === 'completed' && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    render={<Link href={`/dashboard/briefs/${row.sessionId}`} />}
                    title="View brief"
                  >
                    <Eye />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon-xs"
                  render={<Link href={`/form/${row.formId}`} target="_blank" />}
                  title="View form"
                >
                  <FileText />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
