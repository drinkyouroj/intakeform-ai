import { notFound } from 'next/navigation'
import { getForm } from '@/lib/actions/forms'
import { FormEditor } from '@/components/editor/form-editor'

export default async function FormEditorPage({
  params,
}: {
  params: Promise<{ formId: string }>
}) {
  const { formId } = await params

  let data
  try {
    data = await getForm(formId)
  } catch {
    notFound()
  }

  return (
    <FormEditor
      initialForm={data.form}
      initialQuestions={data.questions}
    />
  )
}
