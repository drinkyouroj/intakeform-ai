import { describe, it, expect } from 'vitest'
import { TEMPLATES } from '../templates'

describe('starter templates', () => {
  it('has exactly 5 templates', () => {
    expect(TEMPLATES).toHaveLength(5)
  })

  it('each template has 8-15 questions', () => {
    TEMPLATES.forEach(t => {
      expect(t.questions.length).toBeGreaterThanOrEqual(8)
      expect(t.questions.length).toBeLessThanOrEqual(15)
    })
  })

  it('each question has required fields', () => {
    TEMPLATES.forEach(t => {
      t.questions.forEach((q, i) => {
        expect(q.prompt).toBeTruthy()
        expect(q.type).toBeTruthy()
        expect(q.sortOrder).toBe(i + 1)
        expect(q.aiFollowUp).toBeDefined()
        expect(typeof q.aiFollowUp.enabled).toBe('boolean')
        expect(q.aiFollowUp.maxFollowUps).toBeGreaterThanOrEqual(1)
        expect(q.aiFollowUp.maxFollowUps).toBeLessThanOrEqual(2)
      })
    })
  })

  it('each template has a unique slug', () => {
    const slugs = TEMPLATES.map(t => t.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('question types are valid', () => {
    const validTypes = ['text', 'select', 'multiselect', 'date', 'scale']
    TEMPLATES.forEach(t => {
      t.questions.forEach(q => {
        expect(validTypes).toContain(q.type)
      })
    })
  })

  it('select/multiselect questions have options', () => {
    TEMPLATES.forEach(t => {
      t.questions.forEach(q => {
        if (q.type === 'select' || q.type === 'multiselect') {
          expect(q.options).toBeDefined()
          expect(Array.isArray(q.options)).toBe(true)
          expect(q.options!.length).toBeGreaterThan(0)
        }
      })
    })
  })
})
