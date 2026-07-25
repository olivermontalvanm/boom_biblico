import { describe, it, expect } from 'vitest'
import { moveParticipantToTeam, moveScoreToTeam } from './teams'
import type { Team, Score } from './types'

const t1: Team = { id: 't1', name: 'Alfa', captainId: 'p1', members: [
  { id: 'p1', name: 'María', teamId: 't1' },
  { id: 'p2', name: 'Carlos', teamId: 't1' },
] }
const t2: Team = { id: 't2', name: 'Beta', captainId: 'p3', members: [
  { id: 'p3', name: 'Ana', teamId: 't2' },
] }
const teams = [t1, t2]

describe('moveParticipantToTeam', () => {
  it('moves a participant out of their old team and into the new one', () => {
    const result = moveParticipantToTeam(teams, 'p2', 't2')
    const alfa = result.find(t => t.id === 't1')!
    const beta = result.find(t => t.id === 't2')!
    expect(alfa.members.map(m => m.id)).toEqual(['p1'])
    expect(beta.members.map(m => m.id)).toEqual(['p3', 'p2'])
  })

  it('updates the moved participant teamId to the new team', () => {
    const result = moveParticipantToTeam(teams, 'p2', 't2')
    const beta = result.find(t => t.id === 't2')!
    expect(beta.members.find(m => m.id === 'p2')?.teamId).toBe('t2')
  })

  it('reassigns captain when the captain moves away', () => {
    const result = moveParticipantToTeam(teams, 'p1', 't2')
    const alfa = result.find(t => t.id === 't1')!
    expect(alfa.captainId).toBe('p2')
  })

  it('keeps captainId as-is when a non-captain moves', () => {
    const result = moveParticipantToTeam(teams, 'p2', 't2')
    const alfa = result.find(t => t.id === 't1')!
    expect(alfa.captainId).toBe('p1')
  })

  it('is a no-op when moving to the team the participant is already on', () => {
    const result = moveParticipantToTeam(teams, 'p1', 't1')
    expect(result).toEqual(teams)
  })

  it('is a no-op when the participant does not exist', () => {
    const result = moveParticipantToTeam(teams, 'nope', 't2')
    expect(result).toEqual(teams)
  })
})

describe('moveScoreToTeam', () => {
  it('reassigns the score teamId for the given participant', () => {
    const scores: Score[] = [
      { participantId: 'p1', teamId: 't1', correct: 3, incorrect: 1 },
      { participantId: 'p2', teamId: 't1', correct: 1, incorrect: 0 },
    ]
    const result = moveScoreToTeam(scores, 'p1', 't2')
    expect(result).toEqual([
      { participantId: 'p1', teamId: 't2', correct: 3, incorrect: 1 },
      { participantId: 'p2', teamId: 't1', correct: 1, incorrect: 0 },
    ])
  })

  it('leaves scores unchanged when the participant has no score yet', () => {
    const scores: Score[] = [{ participantId: 'p2', teamId: 't1', correct: 1, incorrect: 0 }]
    expect(moveScoreToTeam(scores, 'p1', 't2')).toEqual(scores)
  })
})
