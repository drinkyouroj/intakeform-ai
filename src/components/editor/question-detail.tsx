'use client'

import { useState, useEffect } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { AIConfigPanel } from './ai-config-panel'
import { Plus, X } from 'lucide-react'

type QuestionType = 'text' | 'select' | 'multiselect' | 'date' | 'scale'

interface AIConfig {
  enabled: boolean
  maxFollowUps: number
  systemPrompt?: string
}

interface QuestionData {
  id: string
  prompt: string
  type: QuestionType
  options: string[] | null
  aiFollowUp: AIConfig
}

interface QuestionDetailProps {
  question: QuestionData
  onChange: (questionId: string, data: Partial<QuestionData>) => void
}

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'select', label: 'Single Select' },
  { value: 'multiselect', label: 'Multi Select' },
  { value: 'date', label: 'Date' },
  { value: 'scale', label: 'Scale (1-10)' },
]

export function QuestionDetail({ question, onChange }: QuestionDetailProps) {
  const [prompt, setPrompt] = useState(question.prompt)
  const [options, setOptions] = useState<string[]>(
    (question.options as string[] | null) ?? []
  )

  // Sync state when question changes (different question selected)
  useEffect(() => {
    setPrompt(question.prompt)
    setOptions((question.options as string[] | null) ?? [])
  }, [question.id, question.prompt, question.options])

  const showOptions = question.type === 'select' || question.type === 'multiselect'

  const handlePromptChange = (value: string) => {
    setPrompt(value)
    onChange(question.id, { prompt: value })
  }

  const handleTypeChange = (type: QuestionType) => {
    const newData: Partial<QuestionData> = { type }
    // If switching to a type that needs options and has none, initialise
    if ((type === 'select' || type === 'multiselect') && options.length === 0) {
      const defaults = ['Option 1', 'Option 2']
      setOptions(defaults)
      newData.options = defaults
    }
    // If switching away from options type, clear options
    if (type !== 'select' && type !== 'multiselect') {
      newData.options = null
    }
    onChange(question.id, newData)
  }

  const handleOptionChange = (index: number, value: string) => {
    const updated = [...options]
    updated[index] = value
    setOptions(updated)
    onChange(question.id, { options: updated })
  }

  const addOption = () => {
    const updated = [...options, `Option ${options.length + 1}`]
    setOptions(updated)
    onChange(question.id, { options: updated })
  }

  const removeOption = (index: number) => {
    const updated = options.filter((_, i) => i !== index)
    setOptions(updated)
    onChange(question.id, { options: updated })
  }

  const handleAIConfigChange = (config: AIConfig) => {
    onChange(question.id, { aiFollowUp: config })
  }

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <Label htmlFor="question-prompt">Question Prompt</Label>
        <Textarea
          id="question-prompt"
          value={prompt}
          onChange={(e) => handlePromptChange(e.target.value)}
          placeholder="Enter your question..."
          maxLength={500}
          rows={3}
          className="resize-none"
        />
        {prompt.length >= 400 && (
          <p className="text-xs text-muted-foreground text-right">
            {prompt.length}/500
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Question Type</Label>
        <Select
          value={question.type}
          onValueChange={(val: string | null) => {
            if (val) handleTypeChange(val as QuestionType)
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {QUESTION_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showOptions && (
        <div className="space-y-3">
          <Label>Options</Label>
          <div className="space-y-2">
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  className="flex-1"
                />
                {options.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeOption(index)}
                  >
                    <X className="size-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={addOption}>
            <Plus data-icon="inline-start" />
            Add Option
          </Button>
        </div>
      )}

      <Separator />

      <AIConfigPanel
        config={question.aiFollowUp}
        onChange={handleAIConfigChange}
      />
    </div>
  )
}
