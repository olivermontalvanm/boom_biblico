import { describe, it, expect } from 'vitest'
import { isPresent, presentMembers } from './attendance'
import type { Team } from './types'

describe('isPresent', () => {
  it('treats a participant with no present field as present', () => {
    expect(isPresent({ id: 'p1', name: 'Ana', teamId: 't1' })).toBe(true)
  })

  it('treats present: true as present', () => {
    expect(isPresent({ id: 'p1', name: 'Ana', teamId: 't1', present: true })).toBe(true)
  })

  it('treats present: false as absent', () => {
    expect(isPresent({ id: 'p1', name: 'Ana', teamId: 't1', present: false })).toBe(false)
  })
})

describe('presentMembers', () => {
  const team: Team = {
    id: 't1',
    name: 'Alfa',
    captainId: 'p1',
    members: [
      { id: 'p1', name: 'Ana', teamId: 't1' },
      { id: 'p2', name: 'Beto', teamId: 't1', present: false },
      { id: 'p3', name: 'Caro', teamId: 't1', present: true },
    ],
  }

  it('filters out participants marked absent', () => {
    expect(presentMembers(team).map(m => m.id)).toEqual(['p1', 'p3'])
  })

  it('returns an empty array when everyone is absent', () => {
    const allAbsent: Team = { ...team, members: team.members.map(m => ({ ...m, present: false })) }
    expect(presentMembers(allAbsent)).toEqual([])
  })
})
