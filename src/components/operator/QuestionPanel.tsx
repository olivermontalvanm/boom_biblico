import type { Participant, Team, Question } from '../../lib/types'

interface Props {
  participant: Participant
  team: Team
  question: Question
  questionNumber: number
  selectedOptionIndex: number | null
  revealed: boolean
  onSelectOption: (index: number) => void
  onConfirm: () => void
  onNextTurn: () => void
}

const LABELS = ['A', 'B', 'C', 'D']

export function QuestionPanel({
  participant, team, question, questionNumber,
  selectedOptionIndex, revealed,
  onSelectOption, onConfirm, onNextTurn,
}: Props) {
  return (
    <div className="flex-1 flex flex-col gap-4 p-6 bg-[#13131f] overflow-y-auto">
      <div className="bg-[#1e1e2e] rounded-xl p-4 flex items-center gap-4">
        <div className="bg-indigo-500 rounded-full w-10 h-10 flex items-center justify-center text-white font-bold shrink-0">
          {participant.name[0].toUpperCase()}
        </div>
        <div className="flex-1">
          <p className="text-white font-bold">{participant.name}</p>
          <p className="text-indigo-300 text-sm">{team.name}</p>
        </div>
        <span className="text-gray-600 text-sm bg-[#2a2a3e] px-3 py-1 rounded">
          Pregunta #{questionNumber}
        </span>
      </div>

      <div className="bg-[#1e1e2e] rounded-xl p-5 flex-1 flex flex-col gap-4">
        <p className="text-[10px] text-gray-500 uppercase tracking-widest">Pregunta</p>
        <p className="text-white leading-relaxed">{question.question}</p>

        <div className="grid grid-cols-2 gap-3 mt-2">
          {question.options.map((opt, i) => {
            const isSelected = selectedOptionIndex === i
            const isCorrect = opt.isCorrect

            let cls = 'border-2 rounded-xl px-4 py-3 flex items-center gap-3 text-sm transition-colors '
            if (!revealed) {
              cls += isSelected
                ? 'bg-[#2a2a3e] border-indigo-500 text-white cursor-pointer'
                : 'bg-[#2a2a3e] border-gray-700 text-gray-400 hover:border-gray-500 cursor-pointer'
            } else {
              if (isCorrect) cls += 'bg-green-900/30 border-green-500 text-green-300'
              else if (isSelected) cls += 'bg-red-900/30 border-red-500 text-red-300'
              else cls += 'bg-[#2a2a3e] border-gray-700 text-gray-600'
            }

            return (
              <div key={i} className={cls} onClick={() => !revealed && onSelectOption(i)}>
                <span className={`rounded px-2 py-0.5 text-xs font-mono ${isSelected ? 'bg-indigo-500 text-white' : 'bg-gray-700 text-gray-400'}`}>
                  {LABELS[i]}
                </span>
                {opt.text}
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex gap-3">
        {!revealed ? (
          <button
            onClick={onConfirm}
            disabled={selectedOptionIndex === null}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            ✓ Confirmar respuesta
          </button>
        ) : (
          <button
            onClick={onNextTurn}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Siguiente turno →
          </button>
        )}
      </div>
    </div>
  )
}
