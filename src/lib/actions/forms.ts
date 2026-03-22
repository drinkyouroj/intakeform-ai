'use server'

import { auth } from '@clerk/nextjs/server'
import { getDb } from '@/lib/db'
import { forms, questions, providers } from '@/lib/db/schema'
import { eq, and, asc, count } from 'drizzle-orm'

// ---------- helpers ----------

async function getAuthenticatedProviderId() {
  const { userId } = await auth()
  if (!userId) throw new Error('Not authenticated')

  const db = getDb()
  const [provider] = await db
    .select({ id: providers.id })
    .from(providers)
    .where(eq(providers.clerkUserId, userId))

  if (!provider) throw new Error('Provider not found')
  return provider.id
}

async function verifyFormOwnership(formId: string) {
  const providerId = await getAuthenticatedProviderId()
  const db = getDb()
  const [form] = await db
    .select()
    .from(forms)
    .where(and(eq(forms.id, formId), eq(forms.providerId, providerId)))

  if (!form) throw new Error('Form not found or access denied')
  return { form, providerId, db }
}

// ---------- reads ----------

export async function getForm(formId: string) {
  const { form, db } = await verifyFormOwnership(formId)

  const formQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.formId, formId))
    .orderBy(asc(questions.sortOrder))

  return { form, questions: formQuestions }
}

export async function getProviderForms() {
  const providerId = await getAuthenticatedProviderId()
  const db = getDb()

  const providerForms = await db
    .select()
    .from(forms)
    .where(eq(forms.providerId, providerId))
    .orderBy(asc(forms.createdAt))

  return providerForms
}

// ---------- form creation ----------

export async function createForm(data?: { title?: string; description?: string }) {
  const providerId = await getAuthenticatedProviderId()
  const db = getDb()

  const [form] = await db
    .insert(forms)
    .values({
      providerId,
      title: data?.title ?? 'Untitled Form',
      description: data?.description ?? null,
      isActive: false,
    })
    .returning()

  // Add one starter question
  await db.insert(questions).values({
    formId: form.id,
    prompt: 'What brings you in today?',
    type: 'text',
    sortOrder: 1,
    aiFollowUp: { enabled: true, maxFollowUps: 2 },
  })

  return form
}

// ---------- form mutations ----------

export async function updateForm(
  formId: string,
  data: {
    title?: string
    description?: string | null
    isActive?: boolean
    styleConfig?: Record<string, unknown>
    updatedAt?: string // ISO string for concurrent-tab detection
  }
) {
  const { form, db } = await verifyFormOwnership(formId)

  // Concurrent-tab detection: if caller sends updatedAt, check it matches
  if (data.updatedAt && form.updatedAt) {
    const clientTimestamp = new Date(data.updatedAt).getTime()
    const serverTimestamp = new Date(form.updatedAt).getTime()
    if (clientTimestamp !== serverTimestamp) {
      throw new Error('Form was modified in another tab. Please refresh.')
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { updatedAt, ...updateData } = data
  const [updated] = await db
    .update(forms)
    .set({ ...updateData, updatedAt: new Date() })
    .where(eq(forms.id, formId))
    .returning()

  return updated
}

export async function toggleFormActive(formId: string, active: boolean) {
  const { db } = await verifyFormOwnership(formId)

  if (active) {
    // Validate all questions have non-empty prompts before activating
    const formQuestions = await db
      .select()
      .from(questions)
      .where(eq(questions.formId, formId))

    const emptyPrompts = formQuestions.filter((q) => !q.prompt.trim())
    if (emptyPrompts.length > 0) {
      throw new Error('All questions must have non-empty prompts before activating the form.')
    }
    if (formQuestions.length === 0) {
      throw new Error('Form must have at least one question before activating.')
    }
  }

  const [updated] = await db
    .update(forms)
    .set({ isActive: active, updatedAt: new Date() })
    .where(eq(forms.id, formId))
    .returning()

  return updated
}

// ---------- question mutations ----------

export async function updateQuestion(
  questionId: string,
  data: {
    prompt?: string
    type?: 'text' | 'select' | 'multiselect' | 'date' | 'scale'
    options?: string[] | null
    aiFollowUp?: { enabled: boolean; maxFollowUps: number; systemPrompt?: string }
  }
) {
  const db = getDb()

  // First get the question to find its formId
  const [question] = await db
    .select()
    .from(questions)
    .where(eq(questions.id, questionId))

  if (!question) throw new Error('Question not found')

  // Verify ownership through the form
  await verifyFormOwnership(question.formId)

  const [updated] = await db
    .update(questions)
    .set(data)
    .where(eq(questions.id, questionId))
    .returning()

  return updated
}

export async function reorderQuestions(formId: string, orderedIds: string[]) {
  const { db } = await verifyFormOwnership(formId)

  // Bulk update sortOrder based on array position
  const updates = orderedIds.map((id, index) =>
    db
      .update(questions)
      .set({ sortOrder: index + 1 })
      .where(and(eq(questions.id, id), eq(questions.formId, formId)))
  )

  await Promise.all(updates)

  // Update form timestamp
  await db
    .update(forms)
    .set({ updatedAt: new Date() })
    .where(eq(forms.id, formId))
}

export async function addQuestion(
  formId: string,
  data: {
    prompt?: string
    type?: 'text' | 'select' | 'multiselect' | 'date' | 'scale'
  }
) {
  const { db } = await verifyFormOwnership(formId)

  // Get the next sortOrder
  const existingQuestions = await db
    .select({ sortOrder: questions.sortOrder })
    .from(questions)
    .where(eq(questions.formId, formId))
    .orderBy(asc(questions.sortOrder))

  const maxOrder = existingQuestions.length > 0
    ? Math.max(...existingQuestions.map((q) => q.sortOrder))
    : 0

  const [newQuestion] = await db
    .insert(questions)
    .values({
      formId,
      prompt: data.prompt ?? 'New question',
      type: data.type ?? 'text',
      sortOrder: maxOrder + 1,
      aiFollowUp: { enabled: false, maxFollowUps: 1 },
    })
    .returning()

  // Update form timestamp
  await db
    .update(forms)
    .set({ updatedAt: new Date() })
    .where(eq(forms.id, formId))

  return newQuestion
}

export async function deleteQuestion(questionId: string) {
  const db = getDb()

  // Get the question to find its formId
  const [question] = await db
    .select()
    .from(questions)
    .where(eq(questions.id, questionId))

  if (!question) throw new Error('Question not found')

  // Verify ownership
  await verifyFormOwnership(question.formId)

  // Delete the question
  await db.delete(questions).where(eq(questions.id, questionId))

  // Check if this was the last question
  const [remaining] = await db
    .select({ total: count() })
    .from(questions)
    .where(eq(questions.formId, question.formId))

  if (remaining.total === 0) {
    // Auto-deactivate form if no questions left
    await db
      .update(forms)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(forms.id, question.formId))
  } else {
    // Update form timestamp
    await db
      .update(forms)
      .set({ updatedAt: new Date() })
      .where(eq(forms.id, question.formId))
  }

  return { deleted: true, remainingCount: remaining.total }
}
