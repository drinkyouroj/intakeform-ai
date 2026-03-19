import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('AI config', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('uses default models when env vars not set', async () => {
    delete process.env.AI_MODEL_FOLLOWUP
    delete process.env.AI_MODEL_BRIEF
    delete process.env.AI_MODEL_FLAGS
    const { getAIModels } = await import('../config')
    const models = getAIModels()
    expect(models.followUp).toBe('groq/llama-3.3-70b-versatile')
    expect(models.brief).toBe('groq/llama-3.3-70b-versatile')
    expect(models.flags).toBe('groq/llama-3.3-70b-versatile')
  })

  it('reads models from env vars when set', async () => {
    process.env.AI_MODEL_FOLLOWUP = 'anthropic/claude-sonnet-4.6'
    process.env.AI_MODEL_BRIEF = 'openai/gpt-5.4'
    process.env.AI_MODEL_FLAGS = 'groq/qwen-qwq-32b'
    const { getAIModels } = await import('../config')
    const models = getAIModels()
    expect(models.followUp).toBe('anthropic/claude-sonnet-4.6')
    expect(models.brief).toBe('openai/gpt-5.4')
    expect(models.flags).toBe('groq/qwen-qwq-32b')
  })
})
