import type { Participant, Team } from '../../lib/types'

interface Props {
  participant: Participant
  team: Team
  canChangeParticipant: boolean
  questionValue: number
  onChangeParticipant: () => void
  onChangeQuestionValue: (value: number) => void
  onMarkReady: () => void
}

export function CallingPanel({
  participant, team, canChangeParticipant, questionValue,
  onChangeParticipant, onChangeQuestionValue, onMarkReady,
}: Props) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
      <p className="text-gray-400 text-lg">Esperando a que pase al frente</p>

      <div className="bg-[#1e1e2e] rounded-xl p-8 flex flex-col items-center gap-3">
        <div className="bg-indigo-500 rounded-full w-20 h-20 flex items-center justify-center text-white font-bold text-3xl">
          {participant.name[0].toUpperCase()}
        </div>
        <p className="text-white font-bold text-2xl">{participant.name}</p>
        <p className="text-indigo-300">{team.name}</p>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-400">
        Valor de esta pregunta
        <input
          type="number"
          min={1}
          value={questionValue}
          onChange={e => onChangeQuestionValue(Number(e.target.value) || 1)}
          className="w-16 bg-[#1e1e2e] border border-gray-600 rounded px-2 py-1 text-white text-center focus:outline-none focus:border-indigo-500"
        />
        {questionValue === 1 ? 'acierto' : 'aciertos'}
      </label>

      <div className="flex gap-3">
        <button
          onClick={onMarkReady}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
        >
          ✓ Ya está al frente
        </button>
        {canChangeParticipant && (
          <button
            onClick={onChangeParticipant}
            className="bg-gray-700 hover:bg-gray-600 text-gray-300 font-semibold px-4 py-3 rounded-xl transition-colors text-sm"
            title="Elegir otro participante del mismo equipo"
          >
            Cambiar persona
          </button>
        )}
      </div>
    </div>
  )
}
