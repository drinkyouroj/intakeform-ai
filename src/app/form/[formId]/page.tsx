import { getDb } from '@/lib/db'
import { forms } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { IntakeForm } from '@/components/intake/intake-form'
import { Toaster } from '@/components/ui/sonner'

export default async function FormPage({
  params,
}: {
  params: Promise<{ formId: string }>
}) {
  const { formId } = await params
  const db = getDb()
  const [form] = await db.select().from(forms).where(eq(forms.id, formId))

  if (!form || !form.isActive) notFound()

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950" data-theme="light">
      <IntakeForm
        formId={formId}
        formTitle={form.title}
        formDescription={form.description}
      />
      <Toaster />
    </div>
  )
}
