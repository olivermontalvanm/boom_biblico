import type { Participant, Team, Question } from '../../lib/types'

interface Props {
  participant: Participant
  team: Team
  question: Question
  value: number
}

const LABELS = ['A', 'B', 'C', 'D']

export function QuestionView({ participant, team, question, value }: Props) {
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

      <div className="flex-1 px-12 py-8 flex flex-col gap-8">
        <div className="flex items-start justify-between gap-6">
          <p className="text-white text-3xl font-medium leading-relaxed">{question.question}</p>
          <span className="shrink-0 bg-yellow-500 text-black font-bold text-lg px-4 py-2 rounded-full whitespace-nowrap">
            Vale {value} {value === 1 ? 'punto' : 'puntos'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-5">
          {question.options.map((opt, i) => (
            <div
              key={i}
              className="bg-[#1e1e3a] border border-gray-700 rounded-xl px-6 py-5 flex items-center gap-4"
            >
              <span className="bg-gray-700 text-gray-300 rounded-md px-3 py-1 text-sm font-mono font-bold">
                {LABELS[i]}
              </span>
              <span className="text-gray-200 text-xl">{opt.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
