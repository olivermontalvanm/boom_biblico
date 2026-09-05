import type { Participant, Team } from './types'

export function isPresent(participant: Participant): boolean {
  return participant.present !== false
}

export function presentMembers(team: Team): Participant[] {
  return team.members.filter(isPresent)
}
