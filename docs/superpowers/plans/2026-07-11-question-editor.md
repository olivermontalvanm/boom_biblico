# Question Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/editor` route where the user can create, edit, and export question banks as JSON files for Boom Bíblico.

**Architecture:** New `EditorPage` at `/editor` with a master-detail layout (question list left, edit form right). Pure utility functions extracted to `src/lib/editor-utils.ts`. State managed with `useReducer` inside `EditorPage`. Auto-saves to `localStorage` under `bb:editor-draft` on every state change.

**Tech Stack:** React 18, TypeScript, Tailwind CSS v3, React Router v7, Vitest

---

## File structure

| File | Action | Purpose |
|---|---|---|
| `src/App.tsx` | Modify | Add `/editor` route |
| `src/lib/editor-utils.ts` | Create | `generateId`, `validateQuestion`, `groupByChapter`, `saveEditorDraft`, `loadEditorDraft` |
| `src/lib/editor-utils.test.ts` | Create | Tests for all utilities |
| `src/pages/EditorPage.tsx` | Create | Full editor page (reducer + UI) |

---

## Task 1: Add `/editor` route + EditorPage shell

**Files:**
- Modify: `src/App.tsx`
- Create: `src/pages/EditorPage.tsx`

- [ ] **Step 1: Create EditorPage placeholder**

```tsx
// src/pages/EditorPage.tsx
export function EditorPage() {
  return (
    <div className="h-screen bg-[#0f0f1a] text-white flex items-center justify-center">
      <p className="text-gray-400">Editor — en construcción</p>
    </div>
  )
}
```

- [ ] **Step 2: Add route to App.tsx**

Replace the full content of `src/App.tsx` with:

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { OperatorPage } from './pages/OperatorPage'
import { DisplayPage } from './pages/DisplayPage'
import { EditorPage } from './pages/EditorPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/operator" element={<OperatorPage />} />
        <Route path="/display" element={<DisplayPage />} />
        <Route path="/editor" element={<EditorPage />} />
        <Route path="*" element={<Navigate to="/operator" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 3: Verify route works**

Open `http://localhost:5173/editor`. Should show "Editor — en construcción" on dark background.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/pages/EditorPage.tsx
git commit -m "feat: add /editor route with placeholder page"
```

---

## Task 2: Editor utilities + tests

**Files:**
- Create: `src/lib/editor-utils.ts`
- Create: `src/lib/editor-utils.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// src/lib/editor-utils.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { validateQuestion, groupByChapter, saveEditorDraft, loadEditorDraft } from './editor-utils'
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
```

- [ ] **Step 2: Run tests — expect them to fail**

```bash
npm run test:run 2>&1 | tail -20
```

Expected: FAIL — `editor-utils` not found.

- [ ] **Step 3: Implement editor-utils.ts**

```ts
// src/lib/editor-utils.ts
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
```

- [ ] **Step 4: Run tests — expect all to pass**

```bash
npm run test:run 2>&1 | tail -10
```

Expected: all tests pass (previous 21 + 11 new = 32 total).

- [ ] **Step 5: Commit**

```bash
git add src/lib/editor-utils.ts src/lib/editor-utils.test.ts
git commit -m "feat: add editor utilities (validateQuestion, groupByChapter, draft storage)"
```

---

## Task 3: Full EditorPage implementation

**Files:**
- Modify: `src/pages/EditorPage.tsx`

This task replaces the placeholder with the complete page: reducer, auto-save, top bar, left panel, and right panel (question form) all in one file.

- [ ] **Step 1: Replace EditorPage.tsx with full implementation**

```tsx
// src/pages/EditorPage.tsx
import { useReducer, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import type { Question } from '../lib/types'
import {
  generateId, validateQuestion, groupByChapter,
  saveEditorDraft, loadEditorDraft,
} from '../lib/editor-utils'

// ── State ────────────────────────────────────────────────────────────────────

interface EditorState {
  questions: Question[]
  selectedId: string | null
}

type EditorAction =
  | { type: 'LOAD'; questions: Question[] }
  | { type: 'ADD' }
  | { type: 'SELECT'; id: string }
  | { type: 'SET_CHAPTER'; id: string; chapter: number }
  | { type: 'SET_TEXT'; id: string; text: string }
  | { type: 'SET_OPTION_TEXT'; id: string; index: number; text: string }
  | { type: 'SET_CORRECT'; id: string; index: number }
  | { type: 'ADD_OPTION'; id: string }
  | { type: 'REMOVE_OPTION'; id: string; index: number }
  | { type: 'DELETE'; id: string }

function reducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'LOAD':
      return { questions: action.questions, selectedId: action.questions[0]?.id ?? null }
    case 'ADD': {
      const q: Question = {
        id: generateId(),
        chapter: 1,
        question: '',
        options: [
          { text: '', isCorrect: true },
          { text: '', isCorrect: false },
        ],
      }
      return { questions: [...state.questions, q], selectedId: q.id }
    }
    case 'SELECT':
      return { ...state, selectedId: action.id }
    case 'SET_CHAPTER':
      return {
        ...state,
        questions: state.questions.map(q =>
          q.id === action.id ? { ...q, chapter: action.chapter } : q
        ),
      }
    case 'SET_TEXT':
      return {
        ...state,
        questions: state.questions.map(q =>
          q.id === action.id ? { ...q, question: action.text } : q
        ),
      }
    case 'SET_OPTION_TEXT':
      return {
        ...state,
        questions: state.questions.map(q =>
          q.id === action.id
            ? { ...q, options: q.options.map((o, i) => i === action.index ? { ...o, text: action.text } : o) }
            : q
        ),
      }
    case 'SET_CORRECT':
      return {
        ...state,
        questions: state.questions.map(q =>
          q.id === action.id
            ? { ...q, options: q.options.map((o, i) => ({ ...o, isCorrect: i === action.index })) }
            : q
        ),
      }
    case 'ADD_OPTION':
      return {
        ...state,
        questions: state.questions.map(q =>
          q.id === action.id && q.options.length < 5
            ? { ...q, options: [...q.options, { text: '', isCorrect: false }] }
            : q
        ),
      }
    case 'REMOVE_OPTION':
      return {
        ...state,
        questions: state.questions.map(q => {
          if (q.id !== action.id || q.options.length <= 2) return q
          const newOptions = q.options.filter((_, i) => i !== action.index)
          if (!newOptions.some(o => o.isCorrect)) newOptions[0] = { ...newOptions[0], isCorrect: true }
          return { ...q, options: newOptions }
        }),
      }
    case 'DELETE': {
      const newQuestions = state.questions.filter(q => q.id !== action.id)
      const idx = state.questions.findIndex(q => q.id === action.id)
      const newSelectedId = newQuestions[Math.min(idx, newQuestions.length - 1)]?.id ?? null
      return { questions: newQuestions, selectedId: newSelectedId }
    }
    default:
      return state
  }
}

function init(): EditorState {
  const draft = loadEditorDraft()
  return draft && draft.length > 0
    ? { questions: draft, selectedId: draft[0].id }
    : { questions: [], selectedId: null }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function EditorPage() {
  const [state, dispatch] = useReducer(reducer, undefined, init)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    saveEditorDraft(state.questions)
  }, [state.questions])

  async function handleLoadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const questions = JSON.parse(await file.text()) as Question[]
      dispatch({ type: 'LOAD', questions })
    } catch {
      alert('JSON inválido')
    }
    e.target.value = ''
  }

  function handleExport() {
    const blob = new Blob([JSON.stringify(state.questions, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'preguntas.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const selected = state.questions.find(q => q.id === state.selectedId) ?? null
  const groups = groupByChapter(state.questions)
  const invalidCount = state.questions.filter(q => !validateQuestion(q)).length

  return (
    <div className="h-screen bg-[#0f0f1a] text-white flex flex-col overflow-hidden">

      {/* ── Top bar ── */}
      <div className="bg-[#13131f] border-b border-[#2a2a3e] px-4 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-yellow-400 font-bold text-sm">BOOM BÍBLICO</span>
          <span className="text-indigo-400 text-sm">Editor de preguntas</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            📄 Cargar JSON
          </button>
          <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleLoadFile} />
          <button
            onClick={handleExport}
            disabled={state.questions.length === 0}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:bg-gray-700 disabled:text-gray-500 ${
              invalidCount > 0
                ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            ⬇ Exportar JSON{invalidCount > 0 ? ` (${invalidCount} error${invalidCount === 1 ? '' : 'es'})` : ''}
          </button>
          <Link
            to="/operator"
            className="bg-indigo-800 hover:bg-indigo-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            → Ir al operador
          </Link>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left panel: question list ── */}
        <div className="w-64 bg-[#13131f] border-r border-[#2a2a3e] flex flex-col shrink-0">
          <div className="p-3 shrink-0">
            <button
              onClick={() => dispatch({ type: 'ADD' })}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
            >
              + Nueva pregunta
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-2 pb-2">
            {groups.length === 0 && (
              <p className="text-gray-600 text-xs text-center mt-8 px-4">
                Carga un JSON o crea tu primera pregunta
              </p>
            )}
            {groups.map(({ chapter, questions }) => (
              <div key={chapter}>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest px-2 mt-3 mb-1">
                  Capítulo {chapter} — {questions.length} {questions.length === 1 ? 'pregunta' : 'preguntas'}
                </p>
                {questions.map(q => {
                  const isSelected = q.id === state.selectedId
                  const isInvalid = !validateQuestion(q)
                  return (
                    <button
                      key={q.id}
                      onClick={() => dispatch({ type: 'SELECT', id: q.id })}
                      className={`w-full text-left px-3 py-2 rounded-lg mb-0.5 transition-colors ${
                        isSelected ? 'bg-indigo-900 border-l-2 border-indigo-500' : 'hover:bg-[#1e1e2e]'
                      }`}
                    >
                      <p className={`text-xs font-medium leading-snug line-clamp-2 ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                        {q.question || <span className="italic text-gray-500">Sin texto</span>}
                      </p>
                      <p className={`text-[10px] mt-0.5 ${isInvalid ? 'text-red-400' : 'text-gray-500'}`}>
                        {isInvalid ? '⚠ incompleta' : `${q.options.length} opciones`}
                      </p>
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
          {state.questions.length > 0 && (
            <p className="text-[10px] text-gray-600 text-center py-2 border-t border-[#2a2a3e] shrink-0">
              {state.questions.length} preguntas en total
            </p>
          )}
        </div>

        {/* ── Right panel: question form ── */}
        <div className="flex-1 overflow-y-auto">
          {!selected ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-600 text-sm">Selecciona una pregunta o crea una nueva</p>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto p-6 flex flex-col gap-5">

              {/* Row: index + delete */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Pregunta {state.questions.findIndex(q => q.id === selected.id) + 1} de {state.questions.length}
                </span>
                <button
                  onClick={() => {
                    if (confirm('¿Eliminar esta pregunta?')) dispatch({ type: 'DELETE', id: selected.id })
                  }}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  🗑 Eliminar
                </button>
              </div>

              {/* Chapter */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-400 uppercase tracking-widest">Capítulo</label>
                <input
                  type="number"
                  min={1}
                  value={selected.chapter}
                  onChange={e =>
                    dispatch({ type: 'SET_CHAPTER', id: selected.id, chapter: Math.max(1, parseInt(e.target.value) || 1) })
                  }
                  className="w-20 bg-[#1e1e2e] border border-[#3a3a4e] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Question text */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-400 uppercase tracking-widest">Pregunta</label>
                <textarea
                  rows={3}
                  value={selected.question}
                  onChange={e => dispatch({ type: 'SET_TEXT', id: selected.id, text: e.target.value })}
                  placeholder="Escribe la pregunta..."
                  className="bg-[#1e1e2e] border border-[#3a3a4e] rounded-lg px-3 py-2 text-white text-sm resize-none focus:outline-none focus:border-indigo-500 placeholder-gray-600"
                />
              </div>

              {/* Options */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-gray-400 uppercase tracking-widest">
                  Opciones — marca el círculo de la respuesta correcta
                </label>
                {selected.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <button
                      onClick={() => dispatch({ type: 'SET_CORRECT', id: selected.id, index: i })}
                      title="Marcar como correcta"
                      className={`w-5 h-5 rounded-full border-2 shrink-0 transition-colors ${
                        opt.isCorrect
                          ? 'bg-emerald-500 border-emerald-500'
                          : 'bg-transparent border-gray-500 hover:border-gray-300'
                      }`}
                    />
                    <input
                      type="text"
                      value={opt.text}
                      onChange={e =>
                        dispatch({ type: 'SET_OPTION_TEXT', id: selected.id, index: i, text: e.target.value })
                      }
                      placeholder={`Opción ${i + 1}`}
                      className={`flex-1 bg-[#1e1e2e] border rounded-lg px-3 py-2 text-sm text-white focus:outline-none placeholder-gray-600 transition-colors ${
                        opt.isCorrect
                          ? 'border-emerald-600 focus:border-emerald-400'
                          : 'border-[#3a3a4e] focus:border-indigo-500'
                      }`}
                    />
                    <button
                      onClick={() => dispatch({ type: 'REMOVE_OPTION', id: selected.id, index: i })}
                      disabled={selected.options.length <= 2}
                      className="text-gray-600 hover:text-red-400 disabled:opacity-20 disabled:cursor-not-allowed transition-colors text-xl leading-none"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => dispatch({ type: 'ADD_OPTION', id: selected.id })}
                  disabled={selected.options.length >= 5}
                  className="self-start text-indigo-400 hover:text-indigo-300 disabled:opacity-30 disabled:cursor-not-allowed text-xs mt-1 transition-colors"
                >
                  + Agregar opción
                </button>
              </div>

              <p className="text-[10px] text-gray-600 mt-2">✓ Guardado automáticamente</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit 2>&1
```

Expected: no output (no errors).

- [ ] **Step 3: Run all tests**

```bash
npm run test:run 2>&1 | tail -10
```

Expected: 32 tests pass (21 existing + 11 new from editor-utils).

- [ ] **Step 4: Manually verify in browser**

Open `http://localhost:5173/editor`. Verify:
- Top bar shows "BOOM BÍBLICO | Editor de preguntas" with three buttons
- Clicking "+ Nueva pregunta" adds a question to the left list and opens the form on the right
- Typing in the question field updates the list item preview in real-time
- Clicking the radio circle on an option turns it green and deselects the others
- `×` button is disabled when only 2 options remain
- "+ Agregar opción" is disabled when 5 options exist
- "Exportar JSON" downloads a valid JSON file
- "📄 Cargar JSON" loads `sample-questions.json` and populates the list grouped by chapter
- Reload the page — the draft is restored from localStorage

- [ ] **Step 5: Commit**

```bash
git add src/pages/EditorPage.tsx
git commit -m "feat: implement question editor with master-detail layout and JSON import/export"
```
