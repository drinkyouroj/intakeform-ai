'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Settings, Check, Loader2, ArrowLeft, Eye } from 'lucide-react'
import { InlineEdit } from './inline-edit'
import { QuestionList } from './question-list'
import { QuestionDetail } from './question-detail'
import { FormSettingsSheet } from './form-settings-sheet'
import {
  updateForm,
  updateQuestion,
  reorderQuestions,
  addQuestion,
  deleteQuestion,
} from '@/lib/actions/forms'
import { cn } from '@/lib/utils'

type SaveStatus = 'saved' | 'saving' | 'unsaved'

interface FormData {
  id: string
  title: string
  description: string | null
  isActive: boolean | null
  updatedAt: Date | null
  templateSlug: string | null
  providerId: string
  styleConfig: unknown
  createdAt: Date | null
}

interface QuestionData {
  id: string
  formId: string
  prompt: string
  type: 'text' | 'select' | 'multiselect' | 'date' | 'scale'
  options: unknown
  sortOrder: number
  aiFollowUp: unknown
  createdAt: Date | null
}

interface FormEditorProps {
  initialForm: FormData
  initialQuestions: QuestionData[]
}

export function FormEditor({ initialForm, initialQuestions }: FormEditorProps) {
  const [form, setForm] = useState(initialForm)
  const [questionsList, setQuestionsList] = useState(initialQuestions)
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    initialQuestions[0]?.id ?? null
  )
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false)

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const selectedQuestion = questionsList.find((q) => q.id === selectedQuestionId) ?? null

  // Debounced save helper
  const debouncedSave = useCallback(
    (saveFn: () => Promise<void>) => {
      setSaveStatus('unsaved')
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(async () => {
        setSaveStatus('saving')
        try {
          await saveFn()
          setSaveStatus('saved')
        } catch (err) {
          console.error('Save failed:', err)
          setSaveStatus('unsaved')
        }
      }, 800)
    },
    []
  )

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  // ---------- Form updates ----------

  const handleFormTitleChange = useCallback(
    (title: string) => {
      setForm((prev) => ({ ...prev, title }))
      debouncedSave(() => updateForm(form.id, { title }).then(() => {}))
    },
    [form.id, debouncedSave]
  )

  const handleFormSettingsUpdate = useCallback(
    (data: { title?: string; description?: string | null }) => {
      setForm((prev) => ({ ...prev, ...data }))
      debouncedSave(() => updateForm(form.id, data).then(() => {}))
    },
    [form.id, debouncedSave]
  )

  const handleActiveChange = useCallback((active: boolean) => {
    setForm((prev) => ({ ...prev, isActive: active }))
  }, [])

  // ---------- Question updates ----------

  const handleQuestionChange = useCallback(
    (questionId: string, data: Record<string, unknown>) => {
      setQuestionsList((prev) =>
        prev.map((q) => (q.id === questionId ? { ...q, ...data } : q))
      )
      debouncedSave(() =>
        updateQuestion(questionId, data as Parameters<typeof updateQuestion>[1]).then(
          () => {}
        )
      )
    },
    [debouncedSave]
  )

  const handleReorder = useCallback(
    (orderedIds: string[]) => {
      setQuestionsList((prev) => {
        const map = new Map(prev.map((q) => [q.id, q]))
        return orderedIds
          .map((id) => map.get(id))
          .filter((q): q is QuestionData => q !== undefined)
      })
      debouncedSave(() => reorderQuestions(form.id, orderedIds))
    },
    [form.id, debouncedSave]
  )

  const handleAddQuestion = useCallback(async () => {
    setSaveStatus('saving')
    try {
      const newQuestion = await addQuestion(form.id, {})
      setQuestionsList((prev) => [...prev, newQuestion])
      setSelectedQuestionId(newQuestion.id)
      setSaveStatus('saved')
    } catch (err) {
      console.error('Add question failed:', err)
      setSaveStatus('unsaved')
    }
  }, [form.id])

  const handleDeleteQuestion = useCallback(
    async (questionId: string) => {
      setSaveStatus('saving')
      try {
        const result = await deleteQuestion(questionId)
        setQuestionsList((prev) => prev.filter((q) => q.id !== questionId))
        if (selectedQuestionId === questionId) {
          setQuestionsList((prev) => {
            setSelectedQuestionId(prev[0]?.id ?? null)
            return prev
          })
        }
        if (result.remainingCount === 0) {
          setForm((prev) => ({ ...prev, isActive: false }))
        }
        setSaveStatus('saved')
      } catch (err) {
        console.error('Delete failed:', err)
        setSaveStatus('unsaved')
      }
    },
    [selectedQuestionId]
  )

  const handleQuestionSelect = useCallback(
    (id: string) => {
      setSelectedQuestionId(id)
      // On mobile, open the detail sheet
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        setMobileDetailOpen(true)
      }
    },
    []
  )

  // Normalise question for detail panel
  const normalizedQuestion = selectedQuestion
    ? {
        id: selectedQuestion.id,
        prompt: selectedQuestion.prompt,
        type: selectedQuestion.type,
        options: selectedQuestion.options as string[] | null,
        aiFollowUp: (selectedQuestion.aiFollowUp as {
          enabled: boolean
          maxFollowUps: number
          systemPrompt?: string
        }) ?? { enabled: false, maxFollowUps: 1 },
      }
    : null

  // Normalise questions for list panel
  const normalizedQuestions = questionsList.map((q) => ({
    id: q.id,
    prompt: q.prompt,
    type: q.type,
    aiFollowUp: q.aiFollowUp as {
      enabled: boolean
      maxFollowUps: number
      systemPrompt?: string
    } | null,
  }))

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col -my-8 -mx-4 sm:-mx-6 lg:-mx-8">
      {/* Toolbar */}
      <div className="flex items-center gap-3 border-b px-4 py-2 shrink-0">
        <Button
          variant="ghost"
          size="icon-sm"
          render={<Link href="/dashboard/forms" />}
        >
          <ArrowLeft className="size-4" />
        </Button>

        <InlineEdit
          value={form.title}
          onSave={handleFormTitleChange}
          as="h1"
          className="text-lg font-semibold"
        />

        <div className="ml-auto flex items-center gap-2">
          <SaveIndicator status={saveStatus} />

          <Button variant="ghost" size="sm" disabled>
            <Eye data-icon="inline-start" />
            <span className="hidden sm:inline">Preview</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings data-icon="inline-start" />
            <span className="hidden sm:inline">Settings</span>
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        {/* Left panel: question list */}
        <div className="w-full lg:w-[400px] lg:shrink-0 border-r flex flex-col">
          <QuestionList
            questions={normalizedQuestions}
            selectedId={selectedQuestionId}
            onSelect={handleQuestionSelect}
            onReorder={handleReorder}
            onAdd={handleAddQuestion}
            onDelete={handleDeleteQuestion}
          />
        </div>

        {/* Right panel: question detail (desktop) */}
        <div className="hidden lg:flex flex-1 flex-col min-h-0">
          {normalizedQuestion ? (
            <ScrollArea className="flex-1">
              <QuestionDetail
                question={normalizedQuestion}
                onChange={handleQuestionChange}
              />
            </ScrollArea>
          ) : (
            <div className="flex flex-1 items-center justify-center text-muted-foreground">
              <p>Select a question to edit its details.</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile detail sheet */}
      <Sheet open={mobileDetailOpen} onOpenChange={setMobileDetailOpen}>
        <SheetContent side="bottom" className="h-[80vh] overflow-y-auto lg:hidden">
          <SheetHeader>
            <SheetTitle>Edit Question</SheetTitle>
          </SheetHeader>
          {normalizedQuestion && (
            <QuestionDetail
              question={normalizedQuestion}
              onChange={handleQuestionChange}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Form settings sheet */}
      <FormSettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        form={{
          id: form.id,
          title: form.title,
          description: form.description,
          isActive: form.isActive,
        }}
        onUpdate={handleFormSettingsUpdate}
        onActiveChange={handleActiveChange}
      />
    </div>
  )
}

// ---------- Save status indicator ----------

function SaveIndicator({ status }: { status: SaveStatus }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      {status === 'saved' && (
        <>
          <Check className="size-3.5 text-green-500" />
          <span className="hidden sm:inline">Saved</span>
        </>
      )}
      {status === 'saving' && (
        <>
          <Loader2 className="size-3.5 animate-spin" />
          <span className="hidden sm:inline">Saving...</span>
        </>
      )}
      {status === 'unsaved' && (
        <>
          <span className="size-2 rounded-full bg-amber-500" />
          <span className="hidden sm:inline">Unsaved changes</span>
        </>
      )}
    </div>
  )
}
