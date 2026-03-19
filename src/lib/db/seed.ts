import { getDb } from './index'
import { forms, questions } from './schema'
import { TEMPLATES } from './templates'

export async function seedTemplatesForProvider(providerId: string) {
  const db = getDb()

  for (const template of TEMPLATES) {
    const [form] = await db.insert(forms).values({
      providerId,
      title: template.title,
      description: template.description,
      templateSlug: template.slug,
      isActive: false,
    }).returning()

    await db.insert(questions).values(
      template.questions.map(q => ({
        formId: form.id,
        type: q.type,
        prompt: q.prompt,
        options: q.options ?? null,
        sortOrder: q.sortOrder,
        aiFollowUp: q.aiFollowUp,
      }))
    )
  }
}
