import { Card, CardContent } from '@/components/ui/card'

interface Metric {
  label: string
  value: string
}

export function MetricsRow({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => (
        <Card key={metric.label}>
          <CardContent>
            <p className="text-sm text-muted-foreground">{metric.label}</p>
            <p className="text-2xl font-bold font-mono mt-1">{metric.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
