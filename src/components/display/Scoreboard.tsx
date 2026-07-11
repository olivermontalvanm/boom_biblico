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
