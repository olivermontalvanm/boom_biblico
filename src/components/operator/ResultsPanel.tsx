import { useState } from 'react'
import type { Team, Score } from '../../lib/types'
import { rankTeams, rankParticipants } from '../../lib/scoring'

interface Props {
  teams: Team[]
  scores: Score[]
  onUpdateScore: (participantId: string, teamId: string, correct: number, incorrect: number) => void
  onClose: () => void
}

const TEAM_MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

export function ResultsPanel({ teams, scores, onUpdateScore, onClose }: Props) {
  const [editing, setEditing] = useState(false)
  const rankedTeams = rankTeams(teams, scores)
  const rankedParticipants = rankParticipants(teams, scores)

  return (
    <div className="flex-1 flex flex-col gap-5 p-6 overflow-y-auto">
      <div className="flex items-center justify-between">
        <p className="text-gray-400 text-lg">Resultados hasta el momento</p>
        <div className="flex gap-2">
          <button
            onClick={() => setEditing(v => !v)}
            className={`text-sm font-semibold px-4 py-2 rounded-xl transition-colors ${
              editing ? 'bg-yellow-600 hover:bg-yellow-700 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
          >
            {editing ? '✓ Listo' : '✏️ Editar resultados'}
          </button>
          <button
            onClick={onClose}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            Volver
          </button>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        {rankedTeams.map(({ item: team, score, rank }) => (
          <div key={team.id} className="bg-[#1e1e2e] rounded-xl px-5 py-4 flex flex-col items-center gap-1 min-w-32">
            <span className="text-2xl leading-none">{TEAM_MEDALS[rank] ?? `${rank}°`}</span>
            <p className="text-white font-semibold text-sm text-center">{team.name}</p>
            <p className="text-indigo-300 font-bold text-2xl">{score}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#1e1e2e] rounded-xl p-4 flex flex-col gap-2">
        <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Por participante</p>
        {rankedParticipants.map(({ item: { participant, team }, score, rank }) => {
          const found = scores.find(s => s.participantId === participant.id)
          const correct = found?.correct ?? 0
          const incorrect = found?.incorrect ?? 0
          return (
            <div key={participant.id} className="flex items-center gap-3 bg-[#2a2a3e] rounded-lg px-3 py-2">
              <span className="w-7 text-center text-sm shrink-0 text-gray-400">
                {TEAM_MEDALS[rank] ?? `${rank}°`}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{participant.name}</p>
                <p className="text-indigo-300 text-xs truncate">{team.name}</p>
              </div>
              {editing ? (
                <div className="flex items-center gap-2 shrink-0">
                  <label className="flex items-center gap-1 text-xs text-gray-400">
                    ✓
                    <input
                      type="number"
                      min={0}
                      value={correct}
                      onChange={e => onUpdateScore(participant.id, team.id, Number(e.target.value) || 0, incorrect)}
                      className="w-14 bg-[#161628] border border-gray-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </label>
                  <label className="flex items-center gap-1 text-xs text-gray-400">
                    ✗
                    <input
                      type="number"
                      min={0}
                      value={incorrect}
                      onChange={e => onUpdateScore(participant.id, team.id, correct, Number(e.target.value) || 0)}
                      className="w-14 bg-[#161628] border border-gray-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </label>
                </div>
              ) : (
                <span className="text-white font-bold tabular-nums shrink-0">{score}</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
