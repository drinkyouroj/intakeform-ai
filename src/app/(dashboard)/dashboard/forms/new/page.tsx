import { redirect } from 'next/navigation'
import { createForm } from '@/lib/actions/forms'

export default async function NewFormPage() {
  const form = await createForm()
  redirect(`/dashboard/forms/${form.id}/edit`)
}
