import type { Participant, Team, Question } from '../../lib/types'

interface Props {
  correct: boolean
  selectedOptionIndex: number
  correctOptionIndex: number
  question: Question
  participant: Participant
  team: Team
  value: number
}

const LABELS = ['A', 'B', 'C', 'D']

export function ResultView({ correct, correctOptionIndex, question, participant, team, value }: Props) {
  const correctOption = question.options[correctOptionIndex]

  return (
    <div className="flex-1 flex flex-col">
      <div className="bg-gradient-to-r from-[#1e1e3a] to-[#2d1b69] px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-500 rounded-full w-14 h-14 flex items-center justify-center text-white font-bold text-2xl">
            {participant.name[0].toUpperCase()}
          </div>
          <div>
            <p className="text-white font-bold text-2xl">{participant.name}</p>
            <p className="text-indigo-300">{team.name}</p>
          </div>
        </div>
        <span className="text-yellow-400 font-bold text-xl tracking-wide">BOOM BÍBLICO</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-12">
        {correct ? (
          <>
            <span className="text-7xl">✅</span>
            <p className="text-green-400 text-5xl font-bold">¡CORRECTO!</p>
            <div className="bg-[#1e1e3a] border-2 border-green-500 rounded-xl px-10 py-5 text-center">
              <p className="text-green-300 text-sm uppercase tracking-widest mb-2">Respuesta correcta</p>
              <p className="text-white text-2xl font-medium">
                {LABELS[correctOptionIndex]} · {correctOption.text}
              </p>
            </div>
            <p className="text-yellow-400 text-xl font-semibold">+{value} {value === 1 ? 'punto' : 'puntos'} para {team.name} 🎉</p>
          </>
        ) : (
          <>
            <span className="text-7xl">❌</span>
            <p className="text-red-400 text-5xl font-bold">Respuesta incorrecta</p>
            <div className="bg-[#1e1e3a] border-2 border-red-500 rounded-xl px-10 py-5 text-center">
              <p className="text-red-300 text-sm uppercase tracking-widest mb-2">La respuesta correcta era</p>
              <p className="text-white text-2xl font-medium">
                {LABELS[correctOptionIndex]} · {correctOption.text}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
