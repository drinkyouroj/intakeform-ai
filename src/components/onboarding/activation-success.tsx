'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { CheckCircle2, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { staggerContainer, staggerChild, celebrationBurst } from '@/lib/motion'

interface ActivationSuccessProps {
  shareLink: string
  formId: string
}

export function ActivationSuccess({
  shareLink,
  formId,
}: ActivationSuccessProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(shareLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      className="space-y-8 text-center"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      <motion.div className="space-y-3" variants={staggerChild}>
        <motion.div
          initial={celebrationBurst.initial}
          animate={celebrationBurst.animate}
        >
          <CheckCircle2 className="mx-auto size-16 text-green-500" />
        </motion.div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Your form is live!
        </h1>
        <p className="text-muted-foreground">
          Share the link below with your clients to start collecting intake
          responses.
        </p>
      </motion.div>

      <motion.div variants={staggerChild}>
        <Card>
          <CardContent className="flex items-center gap-2">
            <code className="flex-1 truncate rounded bg-muted px-3 py-2 text-sm text-foreground">
              {shareLink}
            </code>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopy}
              aria-label="Copy share link"
            >
              {copied ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={staggerChild}>
        <Card>
          <CardContent>
            <ol className="space-y-3 text-left text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                  1
                </span>
                <span className="pt-0.5">Share this link with your clients</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                  2
                </span>
                <span className="pt-0.5">
                  Clients fill out the form with AI-guided follow-ups
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                  3
                </span>
                <span className="pt-0.5">
                  You get a pre-read brief before each session
                </span>
              </li>
            </ol>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        className="flex items-center justify-center gap-3"
        variants={staggerChild}
      >
        <Button size="lg" render={<Link href="/dashboard" />}>
          Go to Dashboard
        </Button>
        <Button
          variant="outline"
          size="lg"
          render={<Link href={`/dashboard/forms/${formId}`} />}
        >
          Edit Form
        </Button>
      </motion.div>
    </motion.div>
  )
}
