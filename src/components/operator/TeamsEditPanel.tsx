import type { Team, Participant, Score } from '../../lib/types'
import { generateId } from '../../lib/editor-utils'

interface Props {
  teams: Team[]
  scores: Score[]
  onUpdateTeams: (teams: Team[]) => void
  onMoveParticipant: (participantId: string, toTeamId: string) => void
  onClose: () => void
}

export function TeamsEditPanel({ teams, scores, onUpdateTeams, onMoveParticipant, onClose }: Props) {
  function addTeam() {
    const teamId = generateId()
    const member: Participant = { id: generateId(), name: 'Participante', teamId }
    onUpdateTeams([...teams, { id: teamId, name: 'Nuevo equipo', captainId: member.id, members: [member] }])
  }

  function updateTeamName(teamId: string, name: string) {
    onUpdateTeams(teams.map(t => t.id === teamId ? { ...t, name } : t))
  }

  function addMember(teamId: string) {
    const member: Participant = { id: generateId(), name: 'Participante', teamId }
    onUpdateTeams(teams.map(t => t.id === teamId ? { ...t, members: [...t.members, member] } : t))
  }

  function updateMemberName(teamId: string, memberId: string, name: string) {
    onUpdateTeams(teams.map(t =>
      t.id === teamId ? { ...t, members: t.members.map(m => m.id === memberId ? { ...m, name } : m) } : t
    ))
  }

  function setCaptain(teamId: string, memberId: string) {
    onUpdateTeams(teams.map(t => t.id === teamId ? { ...t, captainId: memberId } : t))
  }

  return (
    <div className="flex-1 flex flex-col gap-5 p-6 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-lg">Editar equipos</p>
          <p className="text-xs text-gray-500 mt-0.5">Al mover a alguien de equipo, su puntaje viaja con ella.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={addTeam}
            className="bg-indigo-700 hover:bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            + Agregar equipo
          </button>
          <button
            onClick={onClose}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            Volver
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {teams.map(team => (
          <div key={team.id} className="bg-[#1e1e2e] rounded-xl p-4 flex flex-col gap-3">
            <input
              value={team.name}
              onChange={e => updateTeamName(team.id, e.target.value)}
              className="bg-[#2a2a3e] border border-gray-600 rounded px-3 py-2 text-white text-sm font-semibold focus:outline-none focus:border-indigo-500"
            />

            <div className="flex flex-col gap-2">
              {team.members.map(m => {
                const score = scores.find(s => s.participantId === m.id)
                const otherTeams = teams.filter(t => t.id !== team.id)
                return (
                  <div key={m.id} className="flex items-center gap-2">
                    <button
                      onClick={() => setCaptain(team.id, m.id)}
                      title="Marcar como capitán"
                      className={`text-xs px-2 py-1 rounded transition-colors shrink-0 ${
                        team.captainId === m.id
                          ? 'bg-yellow-500 text-black font-bold'
                          : 'bg-[#2a2a3e] text-gray-400 hover:bg-gray-600'
                      }`}
                    >
                      ★
                    </button>
                    <input
                      value={m.name}
                      onChange={e => updateMemberName(team.id, m.id, e.target.value)}
                      className="flex-1 bg-[#2a2a3e] border border-gray-600 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500 min-w-0"
                    />
                    {score && (score.correct > 0 || score.incorrect > 0) && (
                      <span className="text-xs text-gray-500 shrink-0" title="Puntaje actual">
                        {score.correct}pt
                      </span>
                    )}
                    {otherTeams.length > 0 && (
                      <select
                        value=""
                        onChange={e => e.target.value && onMoveParticipant(m.id, e.target.value)}
                        className="bg-[#2a2a3e] border border-gray-600 rounded px-1.5 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-indigo-500 shrink-0"
                        title="Mover a otro equipo"
                      >
                        <option value="">Mover a...</option>
                        {otherTeams.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                )
              })}
              <button
                onClick={() => addMember(team.id)}
                className="text-indigo-400 hover:text-indigo-300 text-xs mt-1 text-left"
              >
                + Agregar participante
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
