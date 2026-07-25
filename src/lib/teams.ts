import type { Team, Participant, Score } from './types'

export function moveParticipantToTeam(teams: Team[], participantId: string, toTeamId: string): Team[] {
  let moved: Participant | null = null

  const withoutParticipant = teams.map(team => {
    const member = team.members.find(m => m.id === participantId)
    if (!member || team.id === toTeamId) return team
    moved = { ...member, teamId: toTeamId }
    const members = team.members.filter(m => m.id !== participantId)
    const captainId = team.captainId === participantId ? (members[0]?.id ?? '') : team.captainId
    return { ...team, members, captainId }
  })

  if (!moved) return teams

  return withoutParticipant.map(team =>
    team.id === toTeamId ? { ...team, members: [...team.members, moved as Participant] } : team
  )
}

export function moveScoreToTeam(scores: Score[], participantId: string, toTeamId: string): Score[] {
  return scores.map(s => s.participantId === participantId ? { ...s, teamId: toTeamId } : s)
}
