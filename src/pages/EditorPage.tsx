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
