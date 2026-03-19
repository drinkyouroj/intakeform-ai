import { getDb } from '@/lib/db'
import { forms } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { IntakeForm } from '@/components/intake/intake-form'
import { Toaster } from '@/components/ui/sonner'

export default async function EmbedFormPage({
  params,
}: {
  params: Promise<{ formId: string }>
}) {
  const { formId } = await params
  const db = getDb()
  const [form] = await db.select().from(forms).where(eq(forms.id, formId))

  if (!form || !form.isActive) notFound()

  const styleConfig = (form.styleConfig ?? {}) as { accentColor?: string }
  const accentColor = styleConfig.accentColor ?? '#7c3aed'

  return (
    <div
      className="min-h-screen bg-white"
      style={{ '--accent-color': accentColor } as React.CSSProperties}
    >
      <IntakeForm
        formId={formId}
        formTitle={form.title}
        formDescription={form.description}
      />
      <Toaster />
    </div>
  )
}
