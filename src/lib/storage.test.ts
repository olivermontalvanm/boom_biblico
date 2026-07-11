import { describe, it, expect, beforeEach } from 'vitest'
import {
  getSession, saveSession,
  getTeams, saveTeams,
  getTurns, addTurn,
  getScores, updateScore,
  clearAll,
} from './storage'
import type { BookSession, Team, Participant, Turn } from './types'

const session: BookSession = { bookName: 'Génesis', todayChapters: [1, 2, 3], startDate: '2026-07-10', isActive: true }

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
    updateScore('p1', 't1', true)
    clearAll()
    expect(getSession()).toBeNull()
    expect(getTeams()).toEqual([])
    expect(getTurns()).toEqual([])
    expect(getScores()).toEqual([])
  })
})
