import type { Team, Score } from '../../lib/types'
import { rankTeams, rankParticipants } from '../../lib/scoring'

interface Props {
  title: string
  teams: Team[]
  scores: Score[]
}

const TEAM_MEDALS: Record<number, { emoji: string; border: string; text: string }> = {
  1: { emoji: '🥇', border: 'border-yellow-400', text: 'text-yellow-300' },
  2: { emoji: '🥈', border: 'border-slate-300', text: 'text-slate-200' },
  3: { emoji: '🥉', border: 'border-amber-600', text: 'text-amber-400' },
}

const PARTICIPANT_MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

export function ResultsBoard({ title, teams, scores }: Props) {
  const rankedTeams = rankTeams(teams, scores)
  const rankedParticipants = rankParticipants(teams, scores)

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-10 px-8 py-10 overflow-y-auto">
      <h2 className="text-5xl font-bold text-yellow-400 text-center">{title}</h2>

      <div className="flex gap-6 flex-wrap justify-center items-end">
        {rankedTeams.map(({ item: team, score, rank }) => {
          const medal = TEAM_MEDALS[rank]
          return (
            <div
              key={team.id}
              className={`bg-[#1e1e3a] border-2 rounded-2xl text-center flex flex-col items-center gap-1 px-10 py-7
                ${medal ? medal.border : 'border-gray-700'}`}
            >
              {medal
                ? <span className="text-5xl leading-none mb-1">{medal.emoji}</span>
                : <span className="text-gray-600 text-xl font-bold mb-1">{rank}°</span>
              }
              <p className="text-gray-300 text-xl font-semibold">{team.name}</p>
              <p className={`font-bold mt-1 text-5xl ${medal ? medal.text : 'text-white'}`}>{score}</p>
            </div>
          )
        })}
      </div>

      {rankedParticipants.length > 0 && (
        <div className="w-full max-w-2xl bg-[#1e1e3a] rounded-2xl p-6">
          <p className="text-gray-400 text-sm uppercase tracking-widest mb-3 text-center">Por participante</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {rankedParticipants.map(({ item: { participant, team }, score, rank }) => (
              <div key={participant.id} className="flex items-center gap-3 bg-[#161628] rounded-xl px-4 py-2.5">
                <span className="w-7 text-center text-lg leading-none shrink-0">
                  {PARTICIPANT_MEDALS[rank] ?? <span className="text-gray-600 text-sm font-bold">{rank}°</span>}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{participant.name}</p>
                  <p className="text-indigo-300 text-xs truncate">{team.name}</p>
                </div>
                <span className="text-white font-bold text-lg tabular-nums shrink-0">{score}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
