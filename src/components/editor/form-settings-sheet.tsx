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
import { Copy, Check, Link, Code } from 'lucide-react'
import { toggleFormActive, updateForm } from '@/lib/actions/forms'

const COLOR_PRESETS = [
  { name: 'Violet', value: '#7c3aed' },
  { name: 'Blue', value: '#2563eb' },
  { name: 'Green', value: '#059669' },
  { name: 'Orange', value: '#ea580c' },
  { name: 'Rose', value: '#e11d48' },
  { name: 'Slate', value: '#475569' },
]

interface FormSettingsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: {
    id: string
    title: string
    description: string | null
    isActive: boolean | null
    styleConfig?: { accentColor?: string } | null
  }
  onUpdate: (data: { title?: string; description?: string | null }) => void
  onActiveChange: (active: boolean) => void
  onStyleConfigChange?: (styleConfig: { accentColor?: string }) => void
}

export function FormSettingsSheet({
  open,
  onOpenChange,
  form,
  onUpdate,
  onActiveChange,
  onStyleConfigChange,
}: FormSettingsSheetProps) {
  const [copied, setCopied] = useState(false)
  const [embedCopied, setEmbedCopied] = useState(false)
  const [activeError, setActiveError] = useState<string | null>(null)

  const currentAccentColor = form.styleConfig?.accentColor ?? '#7c3aed'
  const [customHex, setCustomHex] = useState(currentAccentColor)

  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/form/${form.id}`
  const appUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const embedSnippet = `<script src="${appUrl}/api/embed.js" data-intakeform-id="${form.id}" async></script>`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyEmbed = async () => {
    await navigator.clipboard.writeText(embedSnippet)
    setEmbedCopied(true)
    setTimeout(() => setEmbedCopied(false), 2000)
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

  const handleAccentColorChange = async (color: string) => {
    setCustomHex(color)
    const newStyleConfig = { ...form.styleConfig, accentColor: color }
    onStyleConfigChange?.(newStyleConfig)
    try {
      await updateForm(form.id, { styleConfig: newStyleConfig })
    } catch (err) {
      console.error('Failed to save accent color:', err)
    }
  }

  const handleCustomHexBlur = () => {
    // Validate hex color
    if (/^#[0-9a-fA-F]{6}$/.test(customHex)) {
      handleAccentColorChange(customHex)
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

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Code className="size-4 text-muted-foreground" />
              <Label>Embed Code</Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Paste this snippet into any webpage to embed your form.
            </p>
            <div className="flex items-start gap-2">
              <Input
                readOnly
                value={embedSnippet}
                className="text-xs font-mono"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={handleCopyEmbed}
              >
                {embedCopied ? <Check className="size-4" /> : <Copy className="size-4" />}
              </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Embed Styling</Label>
            <p className="text-xs text-muted-foreground">
              Choose an accent color for your embedded form.
            </p>
            <div className="flex items-center gap-2">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  title={preset.name}
                  onClick={() => handleAccentColorChange(preset.value)}
                  className="size-8 rounded-full border-2 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{
                    backgroundColor: preset.value,
                    borderColor: currentAccentColor === preset.value ? '#000' : 'transparent',
                  }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="custom-hex" className="text-xs text-muted-foreground shrink-0">
                Custom
              </Label>
              <Input
                id="custom-hex"
                value={customHex}
                onChange={(e) => setCustomHex(e.target.value)}
                onBlur={handleCustomHexBlur}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCustomHexBlur()
                }}
                placeholder="#7c3aed"
                className="text-xs font-mono w-28"
                maxLength={7}
              />
              <div
                className="size-8 rounded border shrink-0"
                style={{ backgroundColor: /^#[0-9a-fA-F]{6}$/.test(customHex) ? customHex : '#ccc' }}
              />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
