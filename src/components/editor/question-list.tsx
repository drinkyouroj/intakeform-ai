'use client'

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { GripVertical, Sparkles, Trash2, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

type QuestionType = 'text' | 'select' | 'multiselect' | 'date' | 'scale'

interface QuestionItem {
  id: string
  prompt: string
  type: QuestionType
  aiFollowUp: { enabled: boolean; maxFollowUps: number; systemPrompt?: string } | null
}

interface QuestionListProps {
  questions: QuestionItem[]
  selectedId: string | null
  onSelect: (id: string) => void
  onReorder: (orderedIds: string[]) => void
  onAdd: () => void
  onDelete: (id: string) => void
}

function SortableQuestion({
  question,
  isSelected,
  onSelect,
  onDelete,
}: {
  question: QuestionItem
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const aiEnabled =
    question.aiFollowUp &&
    typeof question.aiFollowUp === 'object' &&
    (question.aiFollowUp as { enabled?: boolean }).enabled

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors cursor-pointer',
        isSelected
          ? 'border-primary bg-primary/5'
          : 'border-transparent hover:bg-muted/50',
        isDragging && 'opacity-50'
      )}
      onClick={onSelect}
    >
      <button
        className="shrink-0 cursor-grab touch-none text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>

      <span className="flex-1 truncate">{question.prompt}</span>

      <div className="flex items-center gap-1.5 shrink-0">
        {aiEnabled && (
          <Sparkles className="size-3.5 text-amber-500" />
        )}
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
          {question.type}
        </Badge>
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                variant="ghost"
                size="icon-xs"
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                onClick={(e) => e.stopPropagation()}
              />
            }
          >
            <Trash2 className="size-3.5" />
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete question?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove this question from your form. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}

export function QuestionList({
  questions,
  selectedId,
  onSelect,
  onReorder,
  onAdd,
  onDelete,
}: QuestionListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = questions.findIndex((q) => q.id === active.id)
    const newIndex = questions.findIndex((q) => q.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    const reordered = [...questions]
    const [moved] = reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, moved)

    onReorder(reordered.map((q) => q.id))
  }

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-1">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={questions.map((q) => q.id)}
              strategy={verticalListSortingStrategy}
            >
              {questions.map((question) => (
                <SortableQuestion
                  key={question.id}
                  question={question}
                  isSelected={selectedId === question.id}
                  onSelect={() => onSelect(question.id)}
                  onDelete={() => onDelete(question.id)}
                />
              ))}
            </SortableContext>
          </DndContext>

          {questions.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No questions yet. Add one to get started.
            </p>
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t">
        <Button variant="outline" className="w-full" onClick={onAdd}>
          <Plus data-icon="inline-start" />
          Add Question
        </Button>
      </div>
    </div>
  )
}
