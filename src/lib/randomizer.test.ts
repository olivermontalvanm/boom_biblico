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
    // All went today. p1's most-recent turn is 10:00, p2 is 11:00, p3 is 12:00.
    // The old 2020 turn for p2 should NOT affect the result — last-turn is the max date.
    // p1 went least recently (10:00 < 11:00 < 12:00), so p1 should be picked.
    const turns = [
      makeTurn('p1', `${today}T10:00:00.000Z`),
      makeTurn('p2', `${today}T11:00:00.000Z`),
      makeTurn('p3', `${today}T12:00:00.000Z`),
      makeTurn('p2', '2020-01-01T10:00:00.000Z'),
    ]
    const result = pickParticipant(all, turns)
    expect(result.id).toBe('p1')
  })
})

describe('pickQuestion', () => {
  const q1: Question = { id: 'q1', chapter: 1, question: 'Q1', options: [] }
  const q2: Question = { id: 'q2', chapter: 2, question: 'Q2', options: [] }
  const q3: Question = { id: 'q3', chapter: 3, question: 'Q3', options: [] }
  const allChapters = [1, 2, 3]

  it('does not pick a question already used', () => {
    const turns = [makeTurn('p1', `${today}T10:00:00.000Z`)]
    const result = pickQuestion([q1, q2, q3], turns, allChapters)
    expect(result?.id).not.toBe('q1')
  })

  it('returns null when all questions are used', () => {
    const turns = [
      { ...makeTurn('p1', `${today}T10:00:00.000Z`), questionId: 'q1' },
      { ...makeTurn('p2', `${today}T11:00:00.000Z`), questionId: 'q2' },
      { ...makeTurn('p3', `${today}T12:00:00.000Z`), questionId: 'q3' },
    ]
    expect(pickQuestion([q1, q2, q3], turns, allChapters)).toBeNull()
  })

  it('returns any question when none are used', () => {
    const result = pickQuestion([q1, q2, q3], [], allChapters)
    expect(['q1', 'q2', 'q3']).toContain(result?.id)
  })

  it('only picks questions from today chapters', () => {
    const result = pickQuestion([q1, q2, q3], [], [1])
    expect(result?.id).toBe('q1')
  })

  it('returns null when no questions match today chapters', () => {
    expect(pickQuestion([q1, q2], [], [3])).toBeNull()
  })
})
