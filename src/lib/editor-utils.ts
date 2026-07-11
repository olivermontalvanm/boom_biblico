import type { Question } from './types'

const EDITOR_KEY = 'bb:editor-draft'

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10)
}

export function validateQuestion(q: Question): boolean {
  return (
    q.question.trim().length > 0 &&
    q.chapter >= 1 &&
    q.options.length >= 2 &&
    q.options.length <= 5 &&
    q.options.every(o => o.text.trim().length > 0) &&
    q.options.some(o => o.isCorrect)
  )
}

export function groupByChapter(questions: Question[]): { chapter: number; questions: Question[] }[] {
  const map = new Map<number, Question[]>()
  for (const q of questions) {
    if (!map.has(q.chapter)) map.set(q.chapter, [])
    map.get(q.chapter)!.push(q)
  }
  return [...map.entries()]
    .sort(([a], [b]) => a - b)
    .map(([chapter, questions]) => ({ chapter, questions }))
}

export function saveEditorDraft(questions: Question[]): void {
  localStorage.setItem(EDITOR_KEY, JSON.stringify(questions))
}

export function loadEditorDraft(): Question[] | null {
  const raw = localStorage.getItem(EDITOR_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as Question[]
  } catch {
    return null
  }
}
