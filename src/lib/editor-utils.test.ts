import { describe, it, expect, beforeEach } from 'vitest'
import { generateId, validateQuestion, groupByChapter, saveEditorDraft, loadEditorDraft } from './editor-utils'
import type { Question } from './types'

const validQ: Question = {
  id: 'q1',
  chapter: 1,
  question: '¿Quién creó el mundo?',
  options: [
    { text: 'Dios', isCorrect: true },
    { text: 'Nadie', isCorrect: false },
  ],
}

beforeEach(() => localStorage.clear())

describe('generateId', () => {
  it('returns a non-empty string', () => {
    expect(generateId()).toBeTruthy()
  })
  it('returns strings of consistent length', () => {
    const id1 = generateId()
    const id2 = generateId()
    expect(id1.length).toBeGreaterThan(0)
    expect(id1.length).toBe(id2.length)
  })
  it('returns different values on repeated calls', () => {
    const ids = new Set(Array.from({ length: 10 }, () => generateId()))
    expect(ids.size).toBe(10)
  })
})

describe('validateQuestion', () => {
  it('returns true for a valid question', () => {
    expect(validateQuestion(validQ)).toBe(true)
  })
  it('returns false when question text is empty', () => {
    expect(validateQuestion({ ...validQ, question: '' })).toBe(false)
  })
  it('returns false when question text is only whitespace', () => {
    expect(validateQuestion({ ...validQ, question: '   ' })).toBe(false)
  })
  it('returns false when chapter is less than 1', () => {
    expect(validateQuestion({ ...validQ, chapter: 0 })).toBe(false)
  })
  it('returns false when no option is marked correct', () => {
    expect(validateQuestion({
      ...validQ,
      options: [{ text: 'Dios', isCorrect: false }, { text: 'Nadie', isCorrect: false }],
    })).toBe(false)
  })
  it('returns false when an option text is empty', () => {
    expect(validateQuestion({
      ...validQ,
      options: [{ text: '', isCorrect: true }, { text: 'Nadie', isCorrect: false }],
    })).toBe(false)
  })
  it('returns false when fewer than 2 options', () => {
    expect(validateQuestion({ ...validQ, options: [{ text: 'Dios', isCorrect: true }] })).toBe(false)
  })
  it('returns false when more than 5 options', () => {
    const options = Array.from({ length: 6 }, (_, i) => ({ text: `opt${i}`, isCorrect: i === 0 }))
    expect(validateQuestion({ ...validQ, options })).toBe(false)
  })
})

describe('groupByChapter', () => {
  it('returns empty array for empty input', () => {
    expect(groupByChapter([])).toEqual([])
  })
  it('groups questions by chapter', () => {
    const q1 = { ...validQ, id: 'q1', chapter: 1 }
    const q2 = { ...validQ, id: 'q2', chapter: 2 }
    const q3 = { ...validQ, id: 'q3', chapter: 1 }
    const result = groupByChapter([q1, q2, q3])
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ chapter: 1, questions: [q1, q3] })
    expect(result[1]).toEqual({ chapter: 2, questions: [q2] })
  })
  it('sorts chapters in ascending order', () => {
    const q3 = { ...validQ, id: 'q3', chapter: 3 }
    const q1 = { ...validQ, id: 'q1', chapter: 1 }
    const q2 = { ...validQ, id: 'q2', chapter: 2 }
    const result = groupByChapter([q3, q1, q2])
    expect(result.map(g => g.chapter)).toEqual([1, 2, 3])
  })
})

describe('saveEditorDraft / loadEditorDraft', () => {
  it('returns null when no draft is saved', () => {
    expect(loadEditorDraft()).toBeNull()
  })
  it('saves and loads the draft', () => {
    saveEditorDraft([validQ])
    expect(loadEditorDraft()).toEqual([validQ])
  })
  it('returns null when stored data is corrupt JSON', () => {
    localStorage.setItem('bb:editor-draft', 'not-json')
    expect(loadEditorDraft()).toBeNull()
  })
})
