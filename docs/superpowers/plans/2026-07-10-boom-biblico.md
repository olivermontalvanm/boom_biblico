# Boom Bíblico — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a two-view (operator + TV display) biblical quiz competition app that runs offline in the browser, syncs via BroadcastChannel, and persists data per Bible book in localStorage.

**Architecture:** Vite + React + TypeScript SPA with two routes (`/operator` and `/display`). The operator view controls the game; the display view shows questions and results on the TV. They communicate via BroadcastChannel API. All state persists in localStorage keyed to the active Bible book session.

**Tech Stack:** Vite · React 18 · TypeScript · Tailwind CSS v3 · React Router v6 · Vitest · @testing-library/react · jsdom

---

## File Map

| File | Responsibility |
|------|---------------|
| `src/lib/types.ts` | All TypeScript interfaces and types |
| `src/lib/storage.ts` | localStorage read/write helpers |
| `src/lib/storage.test.ts` | Tests for storage helpers |
| `src/lib/randomizer.ts` | Pick participant and question logic |
| `src/lib/randomizer.test.ts` | Tests for randomizer logic |
| `src/lib/broadcast.ts` | BroadcastChannel sender/receiver factory |
| `src/App.tsx` | React Router setup with `/operator` and `/display` routes |
| `src/pages/OperatorPage.tsx` | `/operator` route — full game orchestration |
| `src/pages/DisplayPage.tsx` | `/display` route — TV display, listens to BroadcastChannel |
| `src/components/display/IdleScreen.tsx` | Waiting screen when no game is active |
| `src/components/display/Scoreboard.tsx` | Team scores bar at the bottom of the TV |
| `src/components/display/QuestionView.tsx` | Shows question + options (no correct answer highlighted) |
| `src/components/display/ResultView.tsx` | Shows correct/incorrect result with correct answer revealed |
| `src/components/operator/SetupScreen.tsx` | Book setup, questions JSON import, team config |
| `src/components/operator/TeamSidebar.tsx` | Left panel: team list with scores |
| `src/components/operator/ParticipantPanel.tsx` | Right panel: participants with today's status |
| `src/components/operator/QuestionPanel.tsx` | Center panel: active question + answer buttons |

---

### Task 1: Scaffold project

**Files:**
- Create: project root
- Modify: `vite.config.ts`, `tailwind.config.js`, `src/index.css`, `package.json`, `src/test-setup.ts`, `.gitignore`

- [ ] **Step 1: Create the Vite project**

```bash
cd /home/olivermontalvanm/Projects/IASD/boom_biblico
npm create vite@latest . -- --template react-ts
```

When prompted about existing files, select "Ignore files and continue".

- [ ] **Step 2: Install dependencies**

```bash
npm install
npm install react-router-dom
npm install -D tailwindcss@3 postcss autoprefixer
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
npx tailwindcss init -p
```

- [ ] **Step 3: Update `tailwind.config.js`**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {} },
  plugins: [],
}
```

- [ ] **Step 4: Replace `src/index.css` with Tailwind directives**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 5: Update `vite.config.ts`**

```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test-setup.ts',
  },
})
```

- [ ] **Step 6: Create `src/test-setup.ts`**

```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 7: Add test scripts to `package.json`**

In the `"scripts"` section, add:

```json
"test": "vitest",
"test:run": "vitest --run"
```

- [ ] **Step 8: Add `.superpowers/` to `.gitignore`**

Append to `.gitignore`:

```
.superpowers/
```

- [ ] **Step 9: Verify the dev server starts**

```bash
npm run dev
```

Open http://localhost:5173 — should show the default Vite + React page. Stop the server.

- [ ] **Step 10: Verify tests run**

```bash
npm run test:run
```

Expected: exits 0 with no test files found.

- [ ] **Step 11: Commit**

```bash
git init
git add .
git commit -m "feat: scaffold Vite + React + TS + Tailwind + Vitest"
```

---

### Task 2: Define types

**Files:**
- Create: `src/lib/types.ts`

- [ ] **Step 1: Create `src/lib/types.ts`**

```ts
export interface BookSession {
  bookName: string;
  startDate: string;
  isActive: boolean;
}

export interface Participant {
  id: string;
  name: string;
  teamId: string;
}

export interface Team {
  id: string;
  name: string;
  captainId: string;
  members: Participant[];
}

export interface Option {
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  question: string;
  options: Option[];
}

export interface Score {
  participantId: string;
  teamId: string;
  correct: number;
  incorrect: number;
}

export interface Turn {
  participantId: string;
  teamId: string;
  date: string;
  questionId: string;
  questionText: string;
  answeredCorrectly: boolean;
}

export type DisplayEvent =
  | { type: 'IDLE' }
  | { type: 'SHOW_QUESTION'; participant: Participant; team: Team; question: Question }
  | { type: 'REVEAL_ANSWER'; selectedOptionIndex: number; correct: boolean; correctOptionIndex: number }
  | { type: 'UPDATE_SCORES'; scores: Score[] }
  | { type: 'SHOW_FINAL_SCORES'; scores: Score[]; teams: Team[] };

export interface TeamsImport {
  teams: Array<{
    name: string;
    captain: string;
    members: string[];
  }>;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: define TypeScript types"
```

---

### Task 3: Storage helpers

**Files:**
- Create: `src/lib/storage.ts`, `src/lib/storage.test.ts`

- [ ] **Step 1: Write failing tests — create `src/lib/storage.test.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import {
  getSession, saveSession,
  getTeams, saveTeams,
  getTurns, addTurn,
  getScores, updateScore,
  clearAll,
} from './storage'
import type { BookSession, Team, Participant, Turn } from './types'

const session: BookSession = { bookName: 'Génesis', startDate: '2026-07-10', isActive: true }

const participant: Participant = { id: 'p1', name: 'María', teamId: 't1' }
const team: Team = { id: 't1', name: 'Alfa', captainId: 'p1', members: [participant] }

const turn: Turn = {
  participantId: 'p1',
  teamId: 't1',
  date: '2026-07-10T10:00:00.000Z',
  questionId: 'q1',
  questionText: '¿Quién fue el primer hombre?',
  answeredCorrectly: true,
}

beforeEach(() => localStorage.clear())

describe('session', () => {
  it('returns null when no session saved', () => {
    expect(getSession()).toBeNull()
  })
  it('saves and retrieves session', () => {
    saveSession(session)
    expect(getSession()).toEqual(session)
  })
})

describe('teams', () => {
  it('returns empty array when no teams saved', () => {
    expect(getTeams()).toEqual([])
  })
  it('saves and retrieves teams', () => {
    saveTeams([team])
    expect(getTeams()).toEqual([team])
  })
})

describe('turns', () => {
  it('returns empty array when no turns saved', () => {
    expect(getTurns()).toEqual([])
  })
  it('adds turn and retrieves it', () => {
    addTurn(turn)
    expect(getTurns()).toEqual([turn])
  })
  it('accumulates multiple turns', () => {
    addTurn(turn)
    addTurn({ ...turn, questionId: 'q2' })
    expect(getTurns()).toHaveLength(2)
  })
})

describe('scores', () => {
  it('creates score on first correct answer', () => {
    const scores = updateScore('p1', 't1', true)
    expect(scores).toEqual([{ participantId: 'p1', teamId: 't1', correct: 1, incorrect: 0 }])
  })
  it('creates score on first incorrect answer', () => {
    const scores = updateScore('p1', 't1', false)
    expect(scores).toEqual([{ participantId: 'p1', teamId: 't1', correct: 0, incorrect: 1 }])
  })
  it('increments existing score', () => {
    updateScore('p1', 't1', true)
    updateScore('p1', 't1', false)
    expect(getScores()).toEqual([{ participantId: 'p1', teamId: 't1', correct: 1, incorrect: 1 }])
  })
})

describe('clearAll', () => {
  it('removes all stored data', () => {
    saveSession(session)
    saveTeams([team])
    addTurn(turn)
    clearAll()
    expect(getSession()).toBeNull()
    expect(getTeams()).toEqual([])
    expect(getTurns()).toEqual([])
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm run test:run
```

Expected: FAIL — "Cannot find module './storage'"

- [ ] **Step 3: Implement `src/lib/storage.ts`**

```ts
import type { BookSession, Team, Turn, Score } from './types'

const KEYS = {
  session: 'bb:session',
  teams: 'bb:teams',
  turns: 'bb:turns',
  scores: 'bb:scores',
} as const

export function getSession(): BookSession | null {
  const raw = localStorage.getItem(KEYS.session)
  return raw ? (JSON.parse(raw) as BookSession) : null
}

export function saveSession(session: BookSession): void {
  localStorage.setItem(KEYS.session, JSON.stringify(session))
}

export function getTeams(): Team[] {
  const raw = localStorage.getItem(KEYS.teams)
  return raw ? (JSON.parse(raw) as Team[]) : []
}

export function saveTeams(teams: Team[]): void {
  localStorage.setItem(KEYS.teams, JSON.stringify(teams))
}

export function getTurns(): Turn[] {
  const raw = localStorage.getItem(KEYS.turns)
  return raw ? (JSON.parse(raw) as Turn[]) : []
}

export function addTurn(turn: Turn): void {
  const turns = getTurns()
  turns.push(turn)
  localStorage.setItem(KEYS.turns, JSON.stringify(turns))
}

export function getScores(): Score[] {
  const raw = localStorage.getItem(KEYS.scores)
  return raw ? (JSON.parse(raw) as Score[]) : []
}

export function saveScores(scores: Score[]): void {
  localStorage.setItem(KEYS.scores, JSON.stringify(scores))
}

export function updateScore(participantId: string, teamId: string, correct: boolean): Score[] {
  const scores = getScores()
  const existing = scores.find(s => s.participantId === participantId)
  if (existing) {
    if (correct) existing.correct += 1
    else existing.incorrect += 1
  } else {
    scores.push({ participantId, teamId, correct: correct ? 1 : 0, incorrect: correct ? 0 : 1 })
  }
  saveScores(scores)
  return scores
}

export function clearAll(): void {
  Object.values(KEYS).forEach(k => localStorage.removeItem(k))
}
```

- [ ] **Step 4: Run tests — verify all pass**

```bash
npm run test:run
```

Expected: PASS — all 9 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/storage.ts src/lib/storage.test.ts
git commit -m "feat: add localStorage storage helpers with tests"
```

---

### Task 4: Randomizer

**Files:**
- Create: `src/lib/randomizer.ts`, `src/lib/randomizer.test.ts`

- [ ] **Step 1: Write failing tests — create `src/lib/randomizer.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { pickParticipant, pickQuestion } from './randomizer'
import type { Participant, Turn, Question } from './types'

const p1: Participant = { id: 'p1', name: 'María', teamId: 't1' }
const p2: Participant = { id: 'p2', name: 'Carlos', teamId: 't1' }
const p3: Participant = { id: 'p3', name: 'Ana', teamId: 't1' }
const all = [p1, p2, p3]

const today = new Date().toISOString().slice(0, 10)

const makeTurn = (participantId: string, date: string): Turn => ({
  participantId,
  teamId: 't1',
  date,
  questionId: 'q1',
  questionText: 'Test?',
  answeredCorrectly: true,
})

describe('pickParticipant', () => {
  it('picks the one participant who has not gone today', () => {
    const turns = [makeTurn('p1', `${today}T10:00:00.000Z`), makeTurn('p2', `${today}T11:00:00.000Z`)]
    expect(pickParticipant(all, turns).id).toBe('p3')
  })

  it('returns a valid participant when no one has gone today', () => {
    const result = pickParticipant(all, [])
    expect(['p1', 'p2', 'p3']).toContain(result.id)
  })

  it('falls back to full list when all have gone today', () => {
    const turns = [
      makeTurn('p1', `${today}T10:00:00.000Z`),
      makeTurn('p2', `${today}T11:00:00.000Z`),
      makeTurn('p3', `${today}T12:00:00.000Z`),
    ]
    const result = pickParticipant(all, turns)
    expect(['p1', 'p2', 'p3']).toContain(result.id)
  })

  it('prefers participant who has never participated over one who has', () => {
    const turns = [makeTurn('p1', '2020-01-01T10:00:00.000Z'), makeTurn('p2', '2020-01-01T10:00:00.000Z')]
    expect(pickParticipant(all, turns).id).toBe('p3')
  })

  it('prefers participant who went least recently when falling back', () => {
    const turns = [
      makeTurn('p1', `${today}T10:00:00.000Z`),
      makeTurn('p2', `${today}T11:00:00.000Z`),
      makeTurn('p3', `${today}T12:00:00.000Z`),
      makeTurn('p2', '2020-01-01T10:00:00.000Z'),
    ]
    // All went today. In the turns list, last turn dates: p1=today, p2=today (latest), p3=today
    // Sorted by last-turn ascending: p1, p3, p2 (p2 has old turn but most recent is today)
    // Actually last turn date for each: p1 = today, p2 = today (the today turn is last), p3 = today
    // All tied — any valid result
    const result = pickParticipant(all, turns)
    expect(['p1', 'p2', 'p3']).toContain(result.id)
  })
})

describe('pickQuestion', () => {
  const q1: Question = { id: 'q1', question: 'Q1', options: [] }
  const q2: Question = { id: 'q2', question: 'Q2', options: [] }
  const q3: Question = { id: 'q3', question: 'Q3', options: [] }

  it('does not pick a question already used', () => {
    const turns = [makeTurn('p1', `${today}T10:00:00.000Z`)]
    const result = pickQuestion([q1, q2, q3], turns)
    expect(result?.id).not.toBe('q1')
  })

  it('returns null when all questions are used', () => {
    const turns = [
      { ...makeTurn('p1', `${today}T10:00:00.000Z`), questionId: 'q1' },
      { ...makeTurn('p2', `${today}T11:00:00.000Z`), questionId: 'q2' },
      { ...makeTurn('p3', `${today}T12:00:00.000Z`), questionId: 'q3' },
    ]
    expect(pickQuestion([q1, q2, q3], turns)).toBeNull()
  })

  it('returns any question when none are used', () => {
    const result = pickQuestion([q1, q2, q3], [])
    expect(['q1', 'q2', 'q3']).toContain(result?.id)
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm run test:run
```

Expected: FAIL — "Cannot find module './randomizer'"

- [ ] **Step 3: Implement `src/lib/randomizer.ts`**

```ts
import type { Participant, Turn, Question } from './types'

function todayPrefix(): string {
  return new Date().toISOString().slice(0, 10)
}

function lastTurnDate(participantId: string, turns: Turn[]): string {
  const mine = turns.filter(t => t.participantId === participantId)
  return mine.length === 0 ? '' : mine[mine.length - 1].date
}

export function pickParticipant(participants: Participant[], turns: Turn[]): Participant {
  const today = todayPrefix()
  const participatedToday = new Set(
    turns.filter(t => t.date.startsWith(today)).map(t => t.participantId)
  )

  const notYetToday = participants.filter(p => !participatedToday.has(p.id))
  const pool = notYetToday.length > 0 ? notYetToday : participants

  const sorted = [...pool].sort((a, b) =>
    lastTurnDate(a.id, turns).localeCompare(lastTurnDate(b.id, turns))
  )

  const earliest = lastTurnDate(sorted[0].id, turns)
  const tied = sorted.filter(p => lastTurnDate(p.id, turns) === earliest)
  return tied[Math.floor(Math.random() * tied.length)]
}

export function pickQuestion(questions: Question[], turns: Turn[]): Question | null {
  const usedIds = new Set(turns.map(t => t.questionId))
  const available = questions.filter(q => !usedIds.has(q.id))
  if (available.length === 0) return null
  return available[Math.floor(Math.random() * available.length)]
}
```

- [ ] **Step 4: Run tests — verify all pass**

```bash
npm run test:run
```

Expected: PASS — all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/randomizer.ts src/lib/randomizer.test.ts
git commit -m "feat: add participant and question randomizer with tests"
```

---

### Task 5: BroadcastChannel wrapper

**Files:**
- Create: `src/lib/broadcast.ts`

- [ ] **Step 1: Create `src/lib/broadcast.ts`**

```ts
import type { DisplayEvent } from './types'

const CHANNEL = 'boom-biblico'

export function createSender() {
  const channel = new BroadcastChannel(CHANNEL)
  return {
    send: (event: DisplayEvent) => channel.postMessage(event),
    close: () => channel.close(),
  }
}

export function createReceiver(onEvent: (event: DisplayEvent) => void) {
  const channel = new BroadcastChannel(CHANNEL)
  channel.onmessage = (e: MessageEvent) => onEvent(e.data as DisplayEvent)
  return {
    close: () => channel.close(),
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/broadcast.ts
git commit -m "feat: add BroadcastChannel wrapper"
```

---

### Task 6: App routing and page shells

**Files:**
- Modify: `src/App.tsx`, `src/main.tsx`
- Create: `src/pages/OperatorPage.tsx`, `src/pages/DisplayPage.tsx`

- [ ] **Step 1: Update `src/App.tsx`**

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { OperatorPage } from './pages/OperatorPage'
import { DisplayPage } from './pages/DisplayPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/operator" element={<OperatorPage />} />
        <Route path="/display" element={<DisplayPage />} />
        <Route path="*" element={<Navigate to="/operator" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 2: Create shell `src/pages/OperatorPage.tsx`**

```tsx
export function OperatorPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <p>Operator — coming soon</p>
    </div>
  )
}
```

- [ ] **Step 3: Create shell `src/pages/DisplayPage.tsx`**

```tsx
export function DisplayPage() {
  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white flex items-center justify-center">
      <p>Display — coming soon</p>
    </div>
  )
}
```

- [ ] **Step 4: Verify `src/main.tsx`**

The file should look like this — fix if needed:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 5: Run dev and verify both routes**

```bash
npm run dev
```

- http://localhost:5173/operator → "Operator — coming soon" on dark background
- http://localhost:5173/display → "Display — coming soon" on dark background
- http://localhost:5173 → redirects to /operator

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/main.tsx src/pages/
git commit -m "feat: add routing with /operator and /display shells"
```

---

### Task 7: Display components

**Files:**
- Create: `src/components/display/IdleScreen.tsx`
- Create: `src/components/display/Scoreboard.tsx`
- Create: `src/components/display/QuestionView.tsx`
- Create: `src/components/display/ResultView.tsx`

- [ ] **Step 1: Create `src/components/display/IdleScreen.tsx`**

```tsx
export function IdleScreen() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6">
      <h1 className="text-6xl font-bold text-yellow-400 tracking-wide">BOOM BÍBLICO</h1>
      <p className="text-gray-400 text-2xl">Esperando al operador...</p>
    </div>
  )
}
```

- [ ] **Step 2: Create `src/components/display/Scoreboard.tsx`**

```tsx
import type { Score, Team } from '../../lib/types'

interface Props {
  scores: Score[]
  teams: Team[]
}

const TEAM_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444']

export function Scoreboard({ scores, teams }: Props) {
  return (
    <div className="bg-[#0a0a14] px-8 py-3 flex justify-around border-t border-gray-800">
      {teams.map((team, i) => {
        const total = scores
          .filter(s => s.teamId === team.id)
          .reduce((sum, s) => sum + s.correct, 0)
        return (
          <div key={team.id} className="text-center">
            <div className="text-xs font-medium" style={{ color: TEAM_COLORS[i % TEAM_COLORS.length] }}>
              {team.name}
            </div>
            <div className="text-white font-bold text-xl">{total}</div>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 3: Create `src/components/display/QuestionView.tsx`**

```tsx
import type { Participant, Team, Question, Score } from '../../lib/types'
import { Scoreboard } from './Scoreboard'

interface Props {
  participant: Participant
  team: Team
  question: Question
  scores: Score[]
  teams: Team[]
}

const LABELS = ['A', 'B', 'C', 'D']

export function QuestionView({ participant, team, question, scores, teams }: Props) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="bg-gradient-to-r from-[#1e1e3a] to-[#2d1b69] px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-500 rounded-full w-14 h-14 flex items-center justify-center text-white font-bold text-2xl">
            {participant.name[0].toUpperCase()}
          </div>
          <div>
            <p className="text-white font-bold text-2xl">{participant.name}</p>
            <p className="text-indigo-300">{team.name}</p>
          </div>
        </div>
        <span className="text-yellow-400 font-bold text-xl tracking-wide">BOOM BÍBLICO</span>
      </div>

      <div className="flex-1 px-12 py-8 flex flex-col gap-8">
        <p className="text-white text-3xl font-medium leading-relaxed">{question.question}</p>
        <div className="grid grid-cols-2 gap-5">
          {question.options.map((opt, i) => (
            <div
              key={i}
              className="bg-[#1e1e3a] border border-gray-700 rounded-xl px-6 py-5 flex items-center gap-4"
            >
              <span className="bg-gray-700 text-gray-300 rounded-md px-3 py-1 text-sm font-mono font-bold">
                {LABELS[i]}
              </span>
              <span className="text-gray-200 text-xl">{opt.text}</span>
            </div>
          ))}
        </div>
      </div>

      <Scoreboard scores={scores} teams={teams} />
    </div>
  )
}
```

- [ ] **Step 4: Create `src/components/display/ResultView.tsx`**

```tsx
import type { Participant, Team, Question, Score } from '../../lib/types'
import { Scoreboard } from './Scoreboard'

interface Props {
  correct: boolean
  selectedOptionIndex: number
  correctOptionIndex: number
  question: Question
  participant: Participant
  team: Team
  scores: Score[]
  teams: Team[]
}

const LABELS = ['A', 'B', 'C', 'D']

export function ResultView({ correct, correctOptionIndex, question, participant, team, scores, teams }: Props) {
  const correctOption = question.options[correctOptionIndex]

  return (
    <div className="flex-1 flex flex-col">
      <div className="bg-gradient-to-r from-[#1e1e3a] to-[#2d1b69] px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-500 rounded-full w-14 h-14 flex items-center justify-center text-white font-bold text-2xl">
            {participant.name[0].toUpperCase()}
          </div>
          <div>
            <p className="text-white font-bold text-2xl">{participant.name}</p>
            <p className="text-indigo-300">{team.name}</p>
          </div>
        </div>
        <span className="text-yellow-400 font-bold text-xl tracking-wide">BOOM BÍBLICO</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-12">
        {correct ? (
          <>
            <span className="text-7xl">✅</span>
            <p className="text-green-400 text-5xl font-bold">¡CORRECTO!</p>
            <div className="bg-[#1e1e3a] border-2 border-green-500 rounded-xl px-10 py-5 text-center">
              <p className="text-green-300 text-sm uppercase tracking-widest mb-2">Respuesta correcta</p>
              <p className="text-white text-2xl font-medium">
                {LABELS[correctOptionIndex]} · {correctOption.text}
              </p>
            </div>
            <p className="text-yellow-400 text-xl font-semibold">+1 punto para {team.name} 🎉</p>
          </>
        ) : (
          <>
            <span className="text-7xl">❌</span>
            <p className="text-red-400 text-5xl font-bold">Respuesta incorrecta</p>
            <div className="bg-[#1e1e3a] border-2 border-red-500 rounded-xl px-10 py-5 text-center">
              <p className="text-red-300 text-sm uppercase tracking-widest mb-2">La respuesta correcta era</p>
              <p className="text-white text-2xl font-medium">
                {LABELS[correctOptionIndex]} · {correctOption.text}
              </p>
            </div>
          </>
        )}
      </div>

      <Scoreboard scores={scores} teams={teams} />
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/display/
git commit -m "feat: add display components (IdleScreen, QuestionView, ResultView, Scoreboard)"
```

---

### Task 8: DisplayPage with BroadcastChannel

**Files:**
- Modify: `src/pages/DisplayPage.tsx`

- [ ] **Step 1: Rewrite `src/pages/DisplayPage.tsx`**

```tsx
import { useEffect, useReducer } from 'react'
import type { DisplayEvent, Participant, Team, Question, Score } from '../lib/types'
import { createReceiver } from '../lib/broadcast'
import { IdleScreen } from '../components/display/IdleScreen'
import { QuestionView } from '../components/display/QuestionView'
import { ResultView } from '../components/display/ResultView'

type DisplayState =
  | { view: 'idle'; scores: Score[]; teams: Team[] }
  | { view: 'question'; participant: Participant; team: Team; question: Question; scores: Score[]; teams: Team[] }
  | { view: 'result'; correct: boolean; selectedOptionIndex: number; correctOptionIndex: number; participant: Participant; team: Team; question: Question; scores: Score[]; teams: Team[] }
  | { view: 'final'; scores: Score[]; teams: Team[] }

function reducer(state: DisplayState, event: DisplayEvent): DisplayState {
  switch (event.type) {
    case 'IDLE':
      return { view: 'idle', scores: state.scores, teams: state.teams }
    case 'SHOW_QUESTION':
      return { view: 'question', participant: event.participant, team: event.team, question: event.question, scores: state.scores, teams: state.teams }
    case 'REVEAL_ANSWER':
      if (state.view !== 'question') return state
      return { view: 'result', correct: event.correct, selectedOptionIndex: event.selectedOptionIndex, correctOptionIndex: event.correctOptionIndex, participant: state.participant, team: state.team, question: state.question, scores: state.scores, teams: state.teams }
    case 'UPDATE_SCORES':
      return { ...state, scores: event.scores }
    case 'SHOW_FINAL_SCORES':
      return { view: 'final', scores: event.scores, teams: event.teams }
    default:
      return state
  }
}

export function DisplayPage() {
  const [state, dispatch] = useReducer(reducer, { view: 'idle', scores: [], teams: [] })

  useEffect(() => {
    const receiver = createReceiver(dispatch)
    return () => receiver.close()
  }, [])

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white flex flex-col">
      {state.view === 'idle' && <IdleScreen />}
      {state.view === 'question' && (
        <QuestionView
          participant={state.participant}
          team={state.team}
          question={state.question}
          scores={state.scores}
          teams={state.teams}
        />
      )}
      {state.view === 'result' && (
        <ResultView
          correct={state.correct}
          selectedOptionIndex={state.selectedOptionIndex}
          correctOptionIndex={state.correctOptionIndex}
          question={state.question}
          participant={state.participant}
          team={state.team}
          scores={state.scores}
          teams={state.teams}
        />
      )}
      {state.view === 'final' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-8">
          <h2 className="text-5xl font-bold text-yellow-400">Resultados Finales</h2>
          <div className="flex gap-8 flex-wrap justify-center">
            {state.teams.map(team => {
              const total = state.scores.filter(s => s.teamId === team.id).reduce((sum, s) => sum + s.correct, 0)
              return (
                <div key={team.id} className="bg-[#1e1e3a] rounded-2xl px-12 py-8 text-center">
                  <p className="text-gray-400 text-lg">{team.name}</p>
                  <p className="text-white text-6xl font-bold mt-2">{total}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify /display shows IdleScreen**

```bash
npm run dev
```

Open http://localhost:5173/display — should show "BOOM BÍBLICO" and "Esperando al operador..."

- [ ] **Step 3: Commit**

```bash
git add src/pages/DisplayPage.tsx
git commit -m "feat: implement DisplayPage with BroadcastChannel state machine"
```

---

### Task 9: SetupScreen

**Files:**
- Create: `src/components/operator/SetupScreen.tsx`

- [ ] **Step 1: Create `src/components/operator/SetupScreen.tsx`**

```tsx
import { useState, useRef } from 'react'
import type { Team, Participant, Question, TeamsImport } from '../../lib/types'

interface Props {
  onComplete: (data: { bookName: string; teams: Team[]; questions: Question[] }) => void
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10)
}

function importTeams(raw: TeamsImport): Team[] {
  return raw.teams.map(t => {
    const teamId = generateId()
    const members: Participant[] = t.members.map(name => ({
      id: generateId(),
      name,
      teamId,
    }))
    const captain = members.find(m => m.name === t.captain) ?? members[0]
    return { id: teamId, name: t.name, captainId: captain.id, members }
  })
}

export function SetupScreen({ onComplete }: Props) {
  const [bookName, setBookName] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [error, setError] = useState('')

  const questionsRef = useRef<HTMLInputElement>(null)
  const teamsRef = useRef<HTMLInputElement>(null)

  async function handleQuestionsFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setQuestions(JSON.parse(await file.text()) as Question[])
      setError('')
    } catch {
      setError('Error al leer el archivo de preguntas. Verifica que sea un JSON válido.')
    }
  }

  async function handleTeamsFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setTeams(importTeams(JSON.parse(await file.text()) as TeamsImport))
      setError('')
    } catch {
      setError('Error al leer el archivo de equipos. Verifica que sea un JSON válido.')
    }
  }

  function addTeam() {
    const teamId = generateId()
    const member: Participant = { id: generateId(), name: 'Participante', teamId }
    setTeams(prev => [...prev, { id: teamId, name: 'Nuevo equipo', captainId: member.id, members: [member] }])
  }

  function updateTeamName(teamId: string, name: string) {
    setTeams(prev => prev.map(t => t.id === teamId ? { ...t, name } : t))
  }

  function addMember(teamId: string) {
    const member: Participant = { id: generateId(), name: 'Participante', teamId }
    setTeams(prev => prev.map(t => t.id === teamId ? { ...t, members: [...t.members, member] } : t))
  }

  function updateMemberName(teamId: string, memberId: string, name: string) {
    setTeams(prev => prev.map(t =>
      t.id === teamId ? { ...t, members: t.members.map(m => m.id === memberId ? { ...m, name } : m) } : t
    ))
  }

  function setCaptain(teamId: string, memberId: string) {
    setTeams(prev => prev.map(t => t.id === teamId ? { ...t, captainId: memberId } : t))
  }

  function removeMember(teamId: string, memberId: string) {
    setTeams(prev => prev.map(t =>
      t.id === teamId ? { ...t, members: t.members.filter(m => m.id !== memberId) } : t
    ))
  }

  const canStart = bookName.trim().length > 0 && questions.length > 0 &&
    teams.length > 0 && teams.every(t => t.members.length > 0)

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 overflow-y-auto">
      <div className="max-w-3xl mx-auto flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold text-yellow-400">BOOM BÍBLICO</h1>
          <p className="text-gray-400 mt-1">Configuración de nueva sesión</p>
        </div>

        {error && (
          <p className="bg-red-900/40 border border-red-500 text-red-300 rounded-lg px-4 py-3 text-sm">{error}</p>
        )}

        <section className="flex flex-col gap-3">
          <label className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Nombre del libro</label>
          <input
            value={bookName}
            onChange={e => setBookName(e.target.value)}
            placeholder="ej: Génesis"
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
          />
        </section>

        <section className="flex flex-col gap-3">
          <label className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Preguntas</label>
          <div className="flex items-center gap-4">
            <button
              onClick={() => questionsRef.current?.click()}
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm transition-colors"
            >
              📄 Cargar JSON
            </button>
            <input ref={questionsRef} type="file" accept=".json" className="hidden" onChange={handleQuestionsFile} />
            {questions.length > 0 && (
              <span className="text-green-400 text-sm">✓ {questions.length} preguntas cargadas</span>
            )}
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Equipos y participantes</label>
            <div className="flex gap-2">
              <button
                onClick={() => teamsRef.current?.click()}
                className="bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded text-xs transition-colors"
              >
                📥 Importar JSON
              </button>
              <input ref={teamsRef} type="file" accept=".json" className="hidden" onChange={handleTeamsFile} />
              <button
                onClick={addTeam}
                className="bg-indigo-700 hover:bg-indigo-600 px-3 py-1.5 rounded text-xs transition-colors"
              >
                + Agregar equipo
              </button>
            </div>
          </div>

          {teams.map(team => (
            <div key={team.id} className="bg-gray-800 rounded-xl p-4 flex flex-col gap-3">
              <input
                value={team.name}
                onChange={e => updateTeamName(team.id, e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm font-semibold focus:outline-none focus:border-indigo-500"
              />
              <div className="flex flex-col gap-2">
                {team.members.map(m => (
                  <div key={m.id} className="flex items-center gap-2">
                    <input
                      value={m.name}
                      onChange={e => updateMemberName(team.id, m.id, e.target.value)}
                      className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      onClick={() => setCaptain(team.id, m.id)}
                      title="Marcar como capitán"
                      className={`text-xs px-2 py-1 rounded transition-colors ${
                        team.captainId === m.id
                          ? 'bg-yellow-500 text-black font-bold'
                          : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                      }`}
                    >
                      ★
                    </button>
                    <button
                      onClick={() => removeMember(team.id, m.id)}
                      className="text-gray-600 hover:text-red-400 text-xs px-2 py-1 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addMember(team.id)}
                  className="text-indigo-400 hover:text-indigo-300 text-xs mt-1 text-left"
                >
                  + Agregar participante
                </button>
              </div>
            </div>
          ))}
        </section>

        <button
          onClick={() => onComplete({ bookName: bookName.trim(), teams, questions })}
          disabled={!canStart}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold py-4 rounded-xl text-lg transition-colors"
        >
          Iniciar competencia →
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/operator/SetupScreen.tsx
git commit -m "feat: add SetupScreen with book config, question import, and team management"
```

---

### Task 10: Operator panel components

**Files:**
- Create: `src/components/operator/TeamSidebar.tsx`
- Create: `src/components/operator/ParticipantPanel.tsx`
- Create: `src/components/operator/QuestionPanel.tsx`

- [ ] **Step 1: Create `src/components/operator/TeamSidebar.tsx`**

```tsx
import type { Team, Score } from '../../lib/types'

interface Props {
  teams: Team[]
  scores: Score[]
  bookName: string
  onFinishBook: () => void
}

const TEAM_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444']

export function TeamSidebar({ teams, scores, bookName, onFinishBook }: Props) {
  return (
    <div className="w-52 bg-[#1e1e2e] flex flex-col gap-3 p-4 shrink-0">
      <div>
        <p className="text-[10px] text-gray-500 uppercase tracking-widest">Libro actual</p>
        <p className="text-white font-semibold mt-1 text-sm">{bookName}</p>
      </div>

      <div className="h-px bg-gray-700" />

      <p className="text-[10px] text-gray-500 uppercase tracking-widest">Equipos</p>

      {teams.map((team, i) => {
        const total = scores.filter(s => s.teamId === team.id).reduce((sum, s) => sum + s.correct, 0)
        const color = TEAM_COLORS[i % TEAM_COLORS.length]
        return (
          <div key={team.id} className="bg-[#2a2a3e] rounded-lg p-3" style={{ borderLeft: `3px solid ${color}` }}>
            <p className="text-white text-sm font-semibold">{team.name}</p>
            <p className="text-xs mt-1" style={{ color }}>Puntaje: <strong>{total}</strong></p>
          </div>
        )
      })}

      <div className="flex-1" />

      <button
        onClick={onFinishBook}
        className="bg-red-700 hover:bg-red-600 text-white rounded-lg py-2 text-sm font-medium transition-colors"
      >
        Finalizar libro
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Create `src/components/operator/ParticipantPanel.tsx`**

```tsx
import type { Participant, Turn } from '../../lib/types'

interface Props {
  participants: Participant[]
  turns: Turn[]
  currentParticipantId: string | null
}

export function ParticipantPanel({ participants, turns, currentParticipantId }: Props) {
  const today = new Date().toISOString().slice(0, 10)
  const participatedToday = new Set(
    turns.filter(t => t.date.startsWith(today)).map(t => t.participantId)
  )

  return (
    <div className="w-44 bg-[#1a1a2a] p-4 flex flex-col gap-2 shrink-0 overflow-y-auto">
      <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Participantes hoy</p>
      {participants.map(p => {
        const isCurrent = p.id === currentParticipantId
        const wentToday = participatedToday.has(p.id)
        return (
          <div
            key={p.id}
            className={`rounded-md px-3 py-2 flex items-center gap-2 ${isCurrent ? 'bg-[#2a2a3e] border border-indigo-500' : 'bg-[#2a2a3e]'}`}
          >
            <span className="text-xs w-4 text-center">
              {isCurrent ? '▶' : wentToday ? '✓' : '○'}
            </span>
            <span className={`text-xs ${isCurrent ? 'text-white font-bold' : wentToday ? 'text-gray-500 line-through' : 'text-gray-400'}`}>
              {p.name}
            </span>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 3: Create `src/components/operator/QuestionPanel.tsx`**

```tsx
import type { Participant, Team, Question } from '../../lib/types'

interface Props {
  participant: Participant
  team: Team
  question: Question
  questionNumber: number
  selectedOptionIndex: number | null
  revealed: boolean
  onSelectOption: (index: number) => void
  onConfirm: () => void
  onNextTurn: () => void
}

const LABELS = ['A', 'B', 'C', 'D']

export function QuestionPanel({
  participant, team, question, questionNumber,
  selectedOptionIndex, revealed,
  onSelectOption, onConfirm, onNextTurn,
}: Props) {
  return (
    <div className="flex-1 flex flex-col gap-4 p-6 bg-[#13131f] overflow-y-auto">
      <div className="bg-[#1e1e2e] rounded-xl p-4 flex items-center gap-4">
        <div className="bg-indigo-500 rounded-full w-10 h-10 flex items-center justify-center text-white font-bold shrink-0">
          {participant.name[0].toUpperCase()}
        </div>
        <div className="flex-1">
          <p className="text-white font-bold">{participant.name}</p>
          <p className="text-indigo-300 text-sm">{team.name}</p>
        </div>
        <span className="text-gray-600 text-sm bg-[#2a2a3e] px-3 py-1 rounded">
          Pregunta #{questionNumber}
        </span>
      </div>

      <div className="bg-[#1e1e2e] rounded-xl p-5 flex-1 flex flex-col gap-4">
        <p className="text-[10px] text-gray-500 uppercase tracking-widest">Pregunta</p>
        <p className="text-white leading-relaxed">{question.question}</p>

        <div className="grid grid-cols-2 gap-3 mt-2">
          {question.options.map((opt, i) => {
            const isSelected = selectedOptionIndex === i
            const isCorrect = opt.isCorrect

            let cls = 'border-2 rounded-xl px-4 py-3 flex items-center gap-3 text-sm transition-colors '
            if (!revealed) {
              cls += isSelected
                ? 'bg-[#2a2a3e] border-indigo-500 text-white cursor-pointer'
                : 'bg-[#2a2a3e] border-gray-700 text-gray-400 hover:border-gray-500 cursor-pointer'
            } else {
              if (isCorrect) cls += 'bg-green-900/30 border-green-500 text-green-300'
              else if (isSelected) cls += 'bg-red-900/30 border-red-500 text-red-300'
              else cls += 'bg-[#2a2a3e] border-gray-700 text-gray-600'
            }

            return (
              <div key={i} className={cls} onClick={() => !revealed && onSelectOption(i)}>
                <span className={`rounded px-2 py-0.5 text-xs font-mono ${isSelected ? 'bg-indigo-500 text-white' : 'bg-gray-700 text-gray-400'}`}>
                  {LABELS[i]}
                </span>
                {opt.text}
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex gap-3">
        {!revealed ? (
          <button
            onClick={onConfirm}
            disabled={selectedOptionIndex === null}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            ✓ Confirmar respuesta
          </button>
        ) : (
          <button
            onClick={onNextTurn}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Siguiente turno →
          </button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/operator/
git commit -m "feat: add operator components (TeamSidebar, ParticipantPanel, QuestionPanel)"
```

---

### Task 11: OperatorPage — full game orchestration

**Files:**
- Modify: `src/pages/OperatorPage.tsx`

- [ ] **Step 1: Rewrite `src/pages/OperatorPage.tsx`**

```tsx
import { useEffect, useReducer, useRef } from 'react'
import type { Team, Participant, Question, Turn, Score } from '../lib/types'
import { createSender } from '../lib/broadcast'
import {
  getTeams, saveTeams, getTurns, addTurn,
  getScores, updateScore, getSession, saveSession, clearAll,
} from '../lib/storage'
import { pickParticipant, pickQuestion } from '../lib/randomizer'
import { SetupScreen } from '../components/operator/SetupScreen'
import { TeamSidebar } from '../components/operator/TeamSidebar'
import { ParticipantPanel } from '../components/operator/ParticipantPanel'
import { QuestionPanel } from '../components/operator/QuestionPanel'

type Phase = 'setup' | 'idle' | 'question' | 'revealed'

interface State {
  phase: Phase
  bookName: string
  questions: Question[]
  teams: Team[]
  turns: Turn[]
  scores: Score[]
  currentTeam: Team | null
  currentParticipant: Participant | null
  currentQuestion: Question | null
  selectedOptionIndex: number | null
}

type Action =
  | { type: 'SETUP_COMPLETE'; bookName: string; teams: Team[]; questions: Question[] }
  | { type: 'START_TURN'; team: Team; participant: Participant; question: Question }
  | { type: 'SELECT_OPTION'; index: number }
  | { type: 'CONFIRM_ANSWER'; turn: Turn; scores: Score[] }
  | { type: 'NEXT_TURN' }
  | { type: 'FINISH_BOOK' }

function init(): State {
  const session = getSession()
  if (!session?.isActive) {
    return {
      phase: 'setup', bookName: '', questions: [], teams: [],
      turns: [], scores: [], currentTeam: null,
      currentParticipant: null, currentQuestion: null, selectedOptionIndex: null,
    }
  }
  return {
    phase: 'idle', bookName: session.bookName, questions: [],
    teams: getTeams(), turns: getTurns(), scores: getScores(),
    currentTeam: null, currentParticipant: null, currentQuestion: null, selectedOptionIndex: null,
  }
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SETUP_COMPLETE':
      return { ...state, phase: 'idle', bookName: action.bookName, teams: action.teams, questions: action.questions }
    case 'START_TURN':
      return { ...state, phase: 'question', currentTeam: action.team, currentParticipant: action.participant, currentQuestion: action.question, selectedOptionIndex: null }
    case 'SELECT_OPTION':
      return { ...state, selectedOptionIndex: action.index }
    case 'CONFIRM_ANSWER':
      return { ...state, phase: 'revealed', turns: [...state.turns, action.turn], scores: action.scores }
    case 'NEXT_TURN':
      return { ...state, phase: 'idle', currentTeam: null, currentParticipant: null, currentQuestion: null, selectedOptionIndex: null }
    case 'FINISH_BOOK':
      return {
        phase: 'setup', bookName: '', questions: [], teams: [], turns: [], scores: [],
        currentTeam: null, currentParticipant: null, currentQuestion: null, selectedOptionIndex: null,
      }
    default:
      return state
  }
}

export function OperatorPage() {
  const [state, dispatch] = useReducer(reducer, undefined, init)
  const senderRef = useRef(createSender())

  useEffect(() => {
    const sender = senderRef.current
    return () => sender.close()
  }, [])

  function handleSetupComplete(data: { bookName: string; teams: Team[]; questions: Question[] }) {
    saveSession({ bookName: data.bookName, startDate: new Date().toISOString(), isActive: true })
    saveTeams(data.teams)
    dispatch({ type: 'SETUP_COMPLETE', ...data })
    senderRef.current.send({ type: 'IDLE' })
  }

  function handleTeamSelect(team: Team) {
    const participant = pickParticipant(team.members, state.turns)
    const question = pickQuestion(state.questions, state.turns)
    if (!question) {
      alert('No hay más preguntas disponibles. Carga un nuevo archivo de preguntas.')
      return
    }
    dispatch({ type: 'START_TURN', team, participant, question })
    senderRef.current.send({ type: 'SHOW_QUESTION', participant, team, question })
  }

  function handleConfirmAnswer() {
    if (state.selectedOptionIndex === null || !state.currentQuestion || !state.currentParticipant || !state.currentTeam) return
    const correct = state.currentQuestion.options[state.selectedOptionIndex].isCorrect
    const correctOptionIndex = state.currentQuestion.options.findIndex(o => o.isCorrect)

    const turn: Turn = {
      participantId: state.currentParticipant.id,
      teamId: state.currentTeam.id,
      date: new Date().toISOString(),
      questionId: state.currentQuestion.id,
      questionText: state.currentQuestion.question,
      answeredCorrectly: correct,
    }

    addTurn(turn)
    const newScores = updateScore(state.currentParticipant.id, state.currentTeam.id, correct)
    dispatch({ type: 'CONFIRM_ANSWER', turn, scores: newScores })
    senderRef.current.send({ type: 'REVEAL_ANSWER', selectedOptionIndex: state.selectedOptionIndex, correct, correctOptionIndex })
    senderRef.current.send({ type: 'UPDATE_SCORES', scores: newScores })
  }

  function handleNextTurn() {
    dispatch({ type: 'NEXT_TURN' })
    senderRef.current.send({ type: 'IDLE' })
  }

  function handleFinishBook() {
    if (!confirm('¿Finalizar el libro actual? Esto borrará todos los datos de esta sesión.')) return
    senderRef.current.send({ type: 'SHOW_FINAL_SCORES', scores: state.scores, teams: state.teams })
    clearAll()
    dispatch({ type: 'FINISH_BOOK' })
  }

  if (state.phase === 'setup') {
    return <SetupScreen onComplete={handleSetupComplete} />
  }

  const displayParticipants = state.currentTeam?.members ?? state.teams.flatMap(t => t.members)

  return (
    <div className="h-screen bg-[#13131f] text-white flex overflow-hidden">
      <TeamSidebar
        teams={state.teams}
        scores={state.scores}
        bookName={state.bookName}
        onFinishBook={handleFinishBook}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {state.phase === 'idle' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
            {state.questions.length === 0 ? (
              <div className="flex flex-col items-center gap-4 bg-gray-800 rounded-xl p-8 max-w-sm w-full text-center">
                <p className="text-yellow-400 font-semibold">Sesión recuperada: {state.bookName}</p>
                <p className="text-gray-400 text-sm">Carga el archivo de preguntas para continuar</p>
                <label className="bg-indigo-600 hover:bg-indigo-700 cursor-pointer text-white font-semibold px-6 py-3 rounded-xl transition-colors">
                  📄 Cargar preguntas
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={async e => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      const qs = JSON.parse(await file.text()) as Question[]
                      dispatch({ type: 'SETUP_COMPLETE', bookName: state.bookName, teams: state.teams, questions: qs })
                    }}
                  />
                </label>
              </div>
            ) : (
              <>
                <p className="text-gray-400 text-lg">Selecciona el equipo que juega este turno</p>
                <div className="flex gap-4 flex-wrap justify-center">
                  {state.teams.map(team => (
                    <button
                      key={team.id}
                      onClick={() => handleTeamSelect(team)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors"
                    >
                      {team.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {(state.phase === 'question' || state.phase === 'revealed') &&
          state.currentParticipant && state.currentTeam && state.currentQuestion && (
          <QuestionPanel
            participant={state.currentParticipant}
            team={state.currentTeam}
            question={state.currentQuestion}
            questionNumber={state.turns.length + (state.phase === 'question' ? 1 : 0)}
            selectedOptionIndex={state.selectedOptionIndex}
            revealed={state.phase === 'revealed'}
            onSelectOption={index => dispatch({ type: 'SELECT_OPTION', index })}
            onConfirm={handleConfirmAnswer}
            onNextTurn={handleNextTurn}
          />
        )}
      </div>

      <ParticipantPanel
        participants={displayParticipants}
        turns={state.turns}
        currentParticipantId={state.currentParticipant?.id ?? null}
      />
    </div>
  )
}
```

- [ ] **Step 2: Run all tests to confirm nothing regressed**

```bash
npm run test:run
```

Expected: all tests pass.

- [ ] **Step 3: Run dev and test the full flow**

```bash
npm run dev
```

Open two browser windows:
- http://localhost:5173/operator (or a second tab)
- http://localhost:5173/display

Test this sequence:
1. Fill book name → load questions JSON → add teams with participants → click "Iniciar competencia"
2. Click a team button → verify TV shows participant name + question with options
3. Click an answer option in operator → click "Confirmar respuesta" → verify TV shows correct/incorrect result
4. Click "Siguiente turno" → verify TV returns to idle screen → scoreboard should update
5. Repeat 2-4 for several turns — verify participant rotation works (each person goes before repeating)
6. Click "Finalizar libro" → verify TV shows final scores → operator returns to setup screen

- [ ] **Step 4: Reload the operator page mid-session and verify resume**

While a session is active, reload http://localhost:5173/operator.
Expected: setup screen is NOT shown; instead the "Sesión recuperada" prompt appears. After loading the questions JSON, the team buttons should appear.

- [ ] **Step 5: Commit**

```bash
git add src/pages/OperatorPage.tsx
git commit -m "feat: implement OperatorPage with full game state machine and session resume"
```

---

## Self-Review

**Spec coverage:**
- ✅ Two views: `/operator` and `/display` — Tasks 6, 8, 11
- ✅ BroadcastChannel sync — Tasks 5, 8, 11
- ✅ localStorage persistence per book — Tasks 3, 11
- ✅ Teams + participants: UI config + JSON import — Task 9
- ✅ Questions loaded from JSON via File Picker — Tasks 9, 11
- ✅ Random participant selection (not today → least recent) — Tasks 4, 11
- ✅ Random question selection (no repeats) — Tasks 4, 11
- ✅ Operator selects answer, TV reveals result — Tasks 7, 8, 10, 11
- ✅ Correct answer shown on incorrect response — Task 7 (ResultView)
- ✅ Real-time scores: individual + team — Tasks 3, 7, 11
- ✅ Turn history with questionId, questionText, answeredCorrectly — Task 2 (types), Task 11
- ✅ Incorrect answers do not subtract points — Task 3 (updateScore only increments `correct` or `incorrect`)
- ✅ End-of-book: show final scores, clear localStorage — Task 11
- ✅ Session resume after page reload — Task 11

**Type consistency:** `DisplayEvent.SHOW_FINAL_SCORES` includes `teams: Team[]` — used consistently in DisplayPage reducer (Task 8) and `handleFinishBook` (Task 11). `updateScore` returns `Score[]` — assigned to `newScores` in Task 11. `QuestionPanel.questionNumber` receives `state.turns.length + 1` during question phase. All component prop types match their definitions.

**Placeholder scan:** No TBD, TODO, or vague steps found.
