'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { staggerContainer, staggerChild } from '@/lib/motion'

interface Metric {
  label: string
  value: string
}

export function MetricsRow({ metrics }: { metrics: Metric[] }) {
  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {metrics.map((metric) => (
        <motion.div key={metric.label} variants={staggerChild}>
          <Card className="transition-shadow duration-200 hover:shadow-md">
            <CardContent>
              <p className="text-sm text-muted-foreground">{metric.label}</p>
              <p className="text-2xl font-bold font-mono mt-1">{metric.value}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  )
}
