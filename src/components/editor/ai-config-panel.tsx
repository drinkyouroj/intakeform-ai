'use client'

import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface AIConfig {
  enabled: boolean
  maxFollowUps: number
  systemPrompt?: string
}

interface AIConfigPanelProps {
  config: AIConfig
  onChange: (config: AIConfig) => void
}

export function AIConfigPanel({ config, onChange }: AIConfigPanelProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-amber-500" />
          <Label className="text-sm font-medium">AI Follow-up</Label>
        </div>
        <Switch
          checked={config.enabled}
          onCheckedChange={(checked: boolean) =>
            onChange({ ...config, enabled: checked })
          }
        />
      </div>

      <AnimatePresence initial={false}>
        {config.enabled && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label className="text-sm">Max follow-ups</Label>
                <Select
                  value={String(config.maxFollowUps)}
                  onValueChange={(val: string | null) => {
                    if (val) onChange({ ...config, maxFollowUps: Number(val) })
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 follow-up</SelectItem>
                    <SelectItem value="2">2 follow-ups</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Prompt hint (optional)</Label>
                <Textarea
                  value={config.systemPrompt ?? ''}
                  onChange={(e) =>
                    onChange({ ...config, systemPrompt: e.target.value || undefined })
                  }
                  placeholder="Guide the AI to ask about..."
                  maxLength={200}
                  rows={3}
                  className="resize-none text-sm"
                />
                {(config.systemPrompt?.length ?? 0) >= 160 && (
                  <p className="text-xs text-muted-foreground text-right">
                    {config.systemPrompt?.length ?? 0}/200
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
