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

export function updateScore(participantId: string, teamId: string, correct: boolean, points = 1): Score[] {
  const scores = getScores()
  const existing = scores.find(s => s.participantId === participantId)
  if (existing) {
    if (correct) existing.correct += points
    else existing.incorrect += 1
  } else {
    scores.push({ participantId, teamId, correct: correct ? points : 0, incorrect: correct ? 0 : 1 })
  }
  saveScores(scores)
  return scores
}

export function setScore(participantId: string, teamId: string, correct: number, incorrect: number): Score[] {
  const scores = getScores()
  const existing = scores.find(s => s.participantId === participantId)
  if (existing) {
    existing.correct = correct
    existing.incorrect = incorrect
  } else {
    scores.push({ participantId, teamId, correct, incorrect })
  }
  saveScores(scores)
  return scores
}

export function clearAll(): void {
  Object.values(KEYS).forEach(k => localStorage.removeItem(k))
}
