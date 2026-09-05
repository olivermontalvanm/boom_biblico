import type { Team } from '../../lib/types'
import { isPresent } from '../../lib/attendance'

interface Props {
  teams: Team[]
  onUpdateTeams: (teams: Team[]) => void
  onClose: () => void
}

export function AttendancePanel({ teams, onUpdateTeams, onClose }: Props) {
  function toggle(teamId: string, memberId: string) {
    onUpdateTeams(teams.map(t =>
      t.id === teamId
        ? { ...t, members: t.members.map(m => m.id === memberId ? { ...m, present: !isPresent(m) } : m) }
        : t
    ))
  }

  function markAll(teamId: string, present: boolean) {
    onUpdateTeams(teams.map(t =>
      t.id === teamId ? { ...t, members: t.members.map(m => ({ ...m, present })) } : t
    ))
  }

  return (
    <div className="flex-1 flex flex-col gap-5 p-6 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-lg">Asistencia</p>
          <p className="text-xs text-gray-500 mt-0.5">Solo las personas presentes serán elegidas para responder.</p>
        </div>
        <button
          onClick={onClose}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          Volver
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {teams.map(team => {
          const presentCount = team.members.filter(isPresent).length
          return (
            <div key={team.id} className="bg-[#1e1e2e] rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-white font-semibold text-sm">{team.name}</p>
                <span className="text-xs text-gray-500">{presentCount}/{team.members.length} presentes</span>
              </div>

              <div className="flex flex-col gap-2">
                {team.members.map(m => {
                  const present = isPresent(m)
                  return (
                    <button
                      key={m.id}
                      onClick={() => toggle(team.id, m.id)}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                        present ? 'bg-[#2a2a3e] text-white' : 'bg-[#161628] text-gray-500'
                      }`}
                    >
                      <span className={present ? '' : 'line-through'}>{m.name}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ml-2 ${
                        present ? 'bg-emerald-900/50 text-emerald-300' : 'bg-red-900/50 text-red-300'
                      }`}>
                        {present ? 'Presente' : 'Ausente'}
                      </span>
                    </button>
                  )
                })}
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => markAll(team.id, true)}
                  className="flex-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Marcar todos presentes
                </button>
                <button
                  onClick={() => markAll(team.id, false)}
                  className="flex-1 text-xs text-gray-500 hover:text-gray-400 transition-colors"
                >
                  Marcar todos ausentes
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
