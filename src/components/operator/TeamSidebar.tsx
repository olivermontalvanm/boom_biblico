import type { Team, Score } from '../../lib/types'

interface Props {
  teams: Team[]
  scores: Score[]
  bookName: string
  todayChapters: number[]
  remainingQuestions: number | null
  lastTeamId: string | null
  onShowResults: () => void
  onFinishBook: () => void
}

const TEAM_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444']

export function TeamSidebar({ teams, scores, bookName, todayChapters, remainingQuestions, lastTeamId, onShowResults, onFinishBook }: Props) {
  return (
    <div className="w-52 bg-[#1e1e2e] flex flex-col gap-3 p-4 shrink-0">
      <div>
        <p className="text-[10px] text-gray-500 uppercase tracking-widest">Libro actual</p>
        <p className="text-white font-semibold mt-1 text-sm">{bookName}</p>
        {todayChapters.length > 0 && (
          <>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-2">Capítulos de hoy</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {todayChapters.map(ch => (
                <span key={ch} className="bg-indigo-900 text-indigo-300 text-xs font-bold rounded px-1.5 py-0.5">{ch}</span>
              ))}
            </div>
          </>
        )}
        {remainingQuestions !== null && (
          <p className={`text-xs mt-1 ${remainingQuestions === 0 ? 'text-red-400' : 'text-gray-500'}`}>
            {remainingQuestions} preg. disponible{remainingQuestions === 1 ? '' : 's'}
          </p>
        )}
      </div>

      <div className="h-px bg-gray-700" />

      <p className="text-[10px] text-gray-500 uppercase tracking-widest">Equipos</p>

      {teams.map((team, i) => {
        const total = scores.filter(s => s.teamId === team.id).reduce((sum, s) => sum + s.correct, 0)
        const color = TEAM_COLORS[i % TEAM_COLORS.length]
        const isLast = team.id === lastTeamId
        return (
          <div key={team.id} className="bg-[#2a2a3e] rounded-lg p-3" style={{ borderLeft: `3px solid ${color}` }}>
            <div className="flex items-center justify-between gap-1">
              <p className="text-white text-sm font-semibold">{team.name}</p>
              {isLast && (
                <span className="text-[9px] bg-gray-600 text-gray-300 rounded px-1.5 py-0.5 shrink-0">último</span>
              )}
            </div>
            <p className="text-xs mt-1" style={{ color }}>Puntaje: <strong>{total}</strong></p>
          </div>
        )
      })}

      <div className="flex-1" />

      <button
        onClick={onShowResults}
        className="bg-indigo-700 hover:bg-indigo-600 text-white rounded-lg py-2 text-sm font-medium transition-colors"
      >
        📊 Ver resultados
      </button>

      <button
        onClick={onFinishBook}
        className="bg-red-700 hover:bg-red-600 text-white rounded-lg py-2 text-sm font-medium transition-colors"
      >
        Finalizar libro
      </button>
    </div>
  )
}
