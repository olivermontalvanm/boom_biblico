import { useState, useRef } from 'react'
import type { Team, Participant, Question, TeamsImport } from '../../lib/types'
import { generateId } from '../../lib/editor-utils'

interface Props {
  onComplete: (data: { bookName: string; todayChapters: number[]; teams: Team[]; questions: Question[] }) => void
}

function importTeams(raw: TeamsImport): Team[] {
  return raw.teams.map(t => {
    const teamId = generateId()
    const members: Participant[] = t.members.map(name => ({
      id: generateId(),
      name,
      teamId,
    }))
    const captain = members.find(m => m.name === t.captain) ?? members[0]
    return { id: teamId, name: t.name, captainId: captain.id, members }
  })
}

function availableChapters(questions: Question[]): number[] {
  return [...new Set(questions.map(q => q.chapter))].sort((a, b) => a - b)
}

export function SetupScreen({ onComplete }: Props) {
  const [bookName, setBookName] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [todayChapters, setTodayChapters] = useState<number[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [error, setError] = useState('')

  const questionsRef = useRef<HTMLInputElement>(null)
  const teamsRef = useRef<HTMLInputElement>(null)

  async function handleQuestionsFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const qs = JSON.parse(await file.text()) as Question[]
      setQuestions(qs)
      setTodayChapters([])
      setError('')
    } catch {
      setError('Error al leer el archivo de preguntas. Verifica que sea un JSON válido.')
    }
  }

  async function handleTeamsFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setTeams(importTeams(JSON.parse(await file.text()) as TeamsImport))
      setError('')
    } catch {
      setError('Error al leer el archivo de equipos. Verifica que sea un JSON válido.')
    }
  }

  function toggleChapter(ch: number) {
    setTodayChapters(prev =>
      prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch].sort((a, b) => a - b)
    )
  }

  function addTeam() {
    const teamId = generateId()
    const member: Participant = { id: generateId(), name: 'Participante', teamId }
    setTeams(prev => [...prev, { id: teamId, name: 'Nuevo equipo', captainId: member.id, members: [member] }])
  }

  function updateTeamName(teamId: string, name: string) {
    setTeams(prev => prev.map(t => t.id === teamId ? { ...t, name } : t))
  }

  function addMember(teamId: string) {
    const member: Participant = { id: generateId(), name: 'Participante', teamId }
    setTeams(prev => prev.map(t => t.id === teamId ? { ...t, members: [...t.members, member] } : t))
  }

  function updateMemberName(teamId: string, memberId: string, name: string) {
    setTeams(prev => prev.map(t =>
      t.id === teamId ? { ...t, members: t.members.map(m => m.id === memberId ? { ...m, name } : m) } : t
    ))
  }

  function setCaptain(teamId: string, memberId: string) {
    setTeams(prev => prev.map(t => t.id === teamId ? { ...t, captainId: memberId } : t))
  }

  function removeMember(teamId: string, memberId: string) {
    setTeams(prev => prev.map(t =>
      t.id === teamId ? { ...t, members: t.members.filter(m => m.id !== memberId) } : t
    ))
  }

  const chapters = availableChapters(questions)
  const canStart = bookName.trim().length > 0 && todayChapters.length > 0 &&
    questions.length > 0 && teams.length > 0 && teams.every(t => t.members.length > 0)

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 overflow-y-auto">
      <div className="max-w-3xl mx-auto flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold text-yellow-400">BOOM BÍBLICO</h1>
          <p className="text-gray-400 mt-1">Configuración de nueva sesión</p>
        </div>

        {error && (
          <p className="bg-red-900/40 border border-red-500 text-red-300 rounded-lg px-4 py-3 text-sm">{error}</p>
        )}

        <section className="flex flex-col gap-3">
          <label className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Nombre del libro</label>
          <input
            value={bookName}
            onChange={e => setBookName(e.target.value)}
            placeholder="ej: Génesis"
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
          />
        </section>

        <section className="flex flex-col gap-3">
          <label className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Preguntas</label>
          <div className="flex items-center gap-4">
            <button
              onClick={() => questionsRef.current?.click()}
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm transition-colors"
            >
              📄 Cargar JSON
            </button>
            <input ref={questionsRef} type="file" accept=".json" className="hidden" onChange={handleQuestionsFile} />
            {questions.length > 0 && (
              <span className="text-green-400 text-sm">✓ {questions.length} preguntas cargadas</span>
            )}
          </div>

          {chapters.length > 0 && (
            <div className="flex flex-col gap-2 mt-1">
              <p className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Capítulos de hoy</p>
              <div className="flex flex-wrap gap-2">
                {chapters.map(ch => (
                  <button
                    key={ch}
                    onClick={() => toggleChapter(ch)}
                    className={`w-10 h-10 rounded-lg text-sm font-bold transition-colors ${
                      todayChapters.includes(ch)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                  >
                    {ch}
                  </button>
                ))}
              </div>
              {todayChapters.length === 0 && (
                <p className="text-yellow-500 text-xs">Selecciona al menos un capítulo</p>
              )}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Equipos y participantes</label>
            <div className="flex gap-2">
              <button
                onClick={() => teamsRef.current?.click()}
                className="bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded text-xs transition-colors"
              >
                📥 Importar JSON
              </button>
              <input ref={teamsRef} type="file" accept=".json" className="hidden" onChange={handleTeamsFile} />
              <button
                onClick={addTeam}
                className="bg-indigo-700 hover:bg-indigo-600 px-3 py-1.5 rounded text-xs transition-colors"
              >
                + Agregar equipo
              </button>
            </div>
          </div>

          {teams.map(team => (
            <div key={team.id} className="bg-gray-800 rounded-xl p-4 flex flex-col gap-3">
              <input
                value={team.name}
                onChange={e => updateTeamName(team.id, e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm font-semibold focus:outline-none focus:border-indigo-500"
              />
              <div className="flex flex-col gap-2">
                {team.members.map(m => (
                  <div key={m.id} className="flex items-center gap-2">
                    <input
                      value={m.name}
                      onChange={e => updateMemberName(team.id, m.id, e.target.value)}
                      className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      onClick={() => setCaptain(team.id, m.id)}
                      title="Marcar como capitán"
                      className={`text-xs px-2 py-1 rounded transition-colors ${
                        team.captainId === m.id
                          ? 'bg-yellow-500 text-black font-bold'
                          : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                      }`}
                    >
                      ★
                    </button>
                    <button
                      onClick={() => removeMember(team.id, m.id)}
                      className="text-gray-600 hover:text-red-400 text-xs px-2 py-1 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addMember(team.id)}
                  className="text-indigo-400 hover:text-indigo-300 text-xs mt-1 text-left"
                >
                  + Agregar participante
                </button>
              </div>
            </div>
          ))}
        </section>

        <button
          onClick={() => onComplete({ bookName: bookName.trim(), todayChapters, teams, questions })}
          disabled={!canStart}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold py-4 rounded-xl text-lg transition-colors"
        >
          Iniciar competencia →
        </button>
      </div>
    </div>
  )
}
