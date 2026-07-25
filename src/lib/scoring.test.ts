import { describe, it, expect } from 'vitest'
import { rankTeams, rankParticipants } from './scoring'
import type { Team, Score } from './types'

const t1: Team = { id: 't1', name: 'Alfa', captainId: 'p1', members: [
  { id: 'p1', name: 'María', teamId: 't1' },
  { id: 'p2', name: 'Carlos', teamId: 't1' },
] }
const t2: Team = { id: 't2', name: 'Beta', captainId: 'p3', members: [
  { id: 'p3', name: 'Ana', teamId: 't2' },
] }
const teams = [t1, t2]

describe('rankTeams', () => {
  it('ranks teams by total correct answers, descending', () => {
    const scores: Score[] = [
      { participantId: 'p1', teamId: 't1', correct: 3, incorrect: 0 },
      { participantId: 'p3', teamId: 't2', correct: 1, incorrect: 0 },
    ]
    const ranked = rankTeams(teams, scores)
    expect(ranked.map(r => r.item.id)).toEqual(['t1', 't2'])
    expect(ranked.map(r => r.rank)).toEqual([1, 2])
  })

  it('gives tied teams the same rank and skips the next rank', () => {
    const scores: Score[] = [
      { participantId: 'p1', teamId: 't1', correct: 2, incorrect: 0 },
      { participantId: 'p3', teamId: 't2', correct: 2, incorrect: 0 },
    ]
    const ranked = rankTeams(teams, scores)
    expect(ranked.every(r => r.rank === 1)).toBe(true)
  })

  it('treats teams with no scores as zero', () => {
    const ranked = rankTeams(teams, [])
    expect(ranked.every(r => r.score === 0 && r.rank === 1)).toBe(true)
  })
})

describe('rankParticipants', () => {
  it('ranks individual participants across teams by correct answers', () => {
    const scores: Score[] = [
      { participantId: 'p1', teamId: 't1', correct: 1, incorrect: 0 },
      { participantId: 'p2', teamId: 't1', correct: 3, incorrect: 0 },
      { participantId: 'p3', teamId: 't2', correct: 2, incorrect: 0 },
    ]
    const ranked = rankParticipants(teams, scores)
    expect(ranked.map(r => r.item.participant.id)).toEqual(['p2', 'p3', 'p1'])
    expect(ranked.map(r => r.rank)).toEqual([1, 2, 3])
  })

  it('gives tied participants the same rank and skips the next rank', () => {
    const scores: Score[] = [
      { participantId: 'p1', teamId: 't1', correct: 2, incorrect: 0 },
      { participantId: 'p2', teamId: 't1', correct: 2, incorrect: 0 },
      { participantId: 'p3', teamId: 't2', correct: 1, incorrect: 0 },
    ]
    const ranked = rankParticipants(teams, scores)
    const [first, second, third] = ranked
    expect(first.rank).toBe(1)
    expect(second.rank).toBe(1)
    expect(third.rank).toBe(3)
  })
})
