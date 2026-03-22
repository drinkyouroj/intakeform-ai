'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { MoreHorizontal, Pencil, ExternalLink, Trash2 } from 'lucide-react'
import { deleteForm } from '@/lib/actions/forms'

interface FormCardActionsProps {
  formId: string
  formTitle: string
  hasIntakes: boolean
}

export function FormCardActions({ formId, formTitle, hasIntakes }: FormCardActionsProps) {
  const router = useRouter()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteForm(formId)
        setDeleteOpen(false)
        router.refresh()
      } catch {
        alert('Failed to delete form. Please try again.')
        setDeleteOpen(false)
      }
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon-xs" />}
        >
          <MoreHorizontal />
          <span className="sr-only">Form actions</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => window.open(`/form/${formId}`, '_blank')}
          >
            <ExternalLink />
            Preview
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => router.push(`/dashboard/forms/${formId}/edit`)}
          >
            <Pencil />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{formTitle}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              {hasIntakes
                ? 'This form has existing intake sessions. Deleting it will remove the form and all its questions. Existing session and brief data will be preserved.'
                : 'This will permanently delete the form and all its questions. This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
