import type { Participant, Team, Score } from './types'

export interface RankedEntry<T> {
  item: T
  score: number
  rank: number
}

export interface ParticipantResult {
  participant: Participant
  team: Team
}

function rankByScore<T>(entries: { item: T; score: number }[]): RankedEntry<T>[] {
  const sorted = [...entries].sort((a, b) => b.score - a.score)
  let currentRank = 0
  let prevScore: number | null = null
  return sorted.map((entry, i) => {
    if (prevScore === null || entry.score !== prevScore) {
      currentRank = i + 1
      prevScore = entry.score
    }
    return { ...entry, rank: currentRank }
  })
}

export function rankTeams(teams: Team[], scores: Score[]): RankedEntry<Team>[] {
  return rankByScore(teams.map(team => ({
    item: team,
    score: scores.filter(s => s.teamId === team.id).reduce((sum, s) => sum + s.correct, 0),
  })))
}

export function rankParticipants(teams: Team[], scores: Score[]): RankedEntry<ParticipantResult>[] {
  const all = teams.flatMap(team => team.members.map(participant => ({ participant, team })))
  return rankByScore(all.map(pr => ({
    item: pr,
    score: scores.find(s => s.participantId === pr.participant.id)?.correct ?? 0,
  })))
}
