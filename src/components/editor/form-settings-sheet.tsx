'use client'

import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Copy, Check, Link } from 'lucide-react'
import { toggleFormActive } from '@/lib/actions/forms'

interface FormSettingsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: {
    id: string
    title: string
    description: string | null
    isActive: boolean | null
  }
  onUpdate: (data: { title?: string; description?: string | null }) => void
  onActiveChange: (active: boolean) => void
}

export function FormSettingsSheet({
  open,
  onOpenChange,
  form,
  onUpdate,
  onActiveChange,
}: FormSettingsSheetProps) {
  const [copied, setCopied] = useState(false)
  const [activeError, setActiveError] = useState<string | null>(null)

  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/form/${form.id}`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleToggleActive = async (checked: boolean) => {
    setActiveError(null)
    try {
      await toggleFormActive(form.id, checked)
      onActiveChange(checked)
    } catch (err) {
      setActiveError(err instanceof Error ? err.message : 'Failed to update')
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto p-6">
        <SheetHeader className="mb-6">
          <SheetTitle>Form Settings</SheetTitle>
          <SheetDescription>
            Configure your form details and sharing options.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="form-title">Title</Label>
            <Input
              id="form-title"
              value={form.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="form-description">Description</Label>
            <Textarea
              id="form-description"
              value={form.description ?? ''}
              onChange={(e) =>
                onUpdate({ description: e.target.value || null })
              }
              placeholder="Describe the purpose of this form..."
              rows={3}
              className="resize-none"
            />
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>Active</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Only active forms can accept intakes.
                </p>
              </div>
              <Switch
                checked={form.isActive ?? false}
                onCheckedChange={handleToggleActive}
              />
            </div>
            {activeError && (
              <p className="text-xs text-destructive">{activeError}</p>
            )}
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Link className="size-4 text-muted-foreground" />
              <Label>Share Link</Label>
            </div>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={shareUrl}
                className="text-xs"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
              >
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Embed Code</Label>
            <p className="text-sm text-muted-foreground">
              Embed code coming soon (Phase 5).
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
