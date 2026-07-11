# Question Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a `/editor` route where users can create, edit, and export question banks as JSON files for use in Boom Bíblico.

**Architecture:** New page `EditorPage` at `/editor`, standalone from the game flow. Uses local component state with `useReducer` for the question list and selected question. Auto-saves to `localStorage` under `bb:editor-draft`. Shares the existing `Question` and `QuestionOption` types from `src/lib/types.ts`.

**Tech Stack:** React 18, TypeScript, Tailwind CSS v3, React Router v7

---

## Data model

Uses existing types from `src/lib/types.ts`:
```ts
interface Question { id: string; chapter: number; question: string; options: QuestionOption[] }
interface QuestionOption { text: string; isCorrect: boolean }
```

IDs are auto-generated with `Math.random().toString(36).slice(2,10)`.

---

## Features

### Layout: master-detail
- **Left panel** (~260px): scrollable list of questions grouped by chapter, count per chapter, "Nueva pregunta" button pinned at top, total question count at bottom.
- **Right panel**: edit form for the selected question (empty state when nothing selected).
- **Top bar**: "Cargar JSON" (file input), "Exportar JSON" (download), "→ Ir al operador" link.

### Question form
- **Capítulo**: number input (min 1)
- **Pregunta**: textarea
- **Opciones**: 2–5 options. Each option has a text input and a radio circle to mark it as the correct answer. `+` button adds an option (disabled at 5). `×` removes an option (disabled at 2). The correct option's circle is green; others are grey.
- **Eliminar pregunta**: red button top-right of form (with confirmation).

### Import/export
- **Cargar JSON**: `<input type="file" accept=".json">` — parses and replaces the current question list.
- **Exportar JSON**: generates a `Blob` and triggers a download of `preguntas.json`.

### Auto-save
- On every state change, serialize questions to `localStorage` under `bb:editor-draft`.
- On mount, load from `bb:editor-draft` if present (and no JSON was loaded via URL/file yet).
- Show "✓ Guardado automáticamente" indicator in the form footer.

### Validation (inline, no submit button)
- Export button is disabled if any question has: empty text, empty chapter, any empty option text, or no correct option marked.
- Show a warning count on the export button: "3 preguntas con errores".

---

## Routing

Add `/editor` to `App.tsx` alongside existing routes. The default redirect `*` stays pointing to `/operator`.
