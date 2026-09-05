import { useEffect } from 'react'
import type { Participant, Team, Question } from '../../lib/types'
import { fireConfetti } from '../../lib/confetti'
import { playCorrectSound, playIncorrectSound } from '../../lib/sound'

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

  useEffect(() => {
    if (correct) {
      fireConfetti()
      playCorrectSound()
    } else {
      playIncorrectSound()
    }
  }, [correct])

  return (
    <div className={`relative flex-1 flex flex-col overflow-hidden ${!correct ? 'bb-shake' : ''}`}>
      <style>{`
        @keyframes bb-shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-6px, 0, 0); }
          40%, 60% { transform: translate3d(6px, 0, 0); }
        }
        .bb-shake { animation: bb-shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
        @keyframes bb-flash-red {
          from { opacity: 0.6; }
          to   { opacity: 0; }
        }
        .bb-flash-red { animation: bb-flash-red 0.7s ease-out forwards; }
        @keyframes bb-pop {
          0%   { transform: scale(0.3); opacity: 0; }
          60%  { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .bb-pop { animation: bb-pop 0.5s cubic-bezier(.34,1.56,.64,1) both; }
      `}</style>

      {!correct && <div className="absolute inset-0 z-10 bg-red-600 pointer-events-none bb-flash-red" />}

      {/* z-20 keeps this above the confetti canvas (rendered at zIndex 1 in lib/confetti.ts) */}
      <div className="relative z-20 bg-gradient-to-r from-[#1e1e3a] to-[#2d1b69] px-8 py-5 flex items-center justify-between">
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

      <div className="relative z-20 flex-1 flex flex-col items-center justify-center gap-6 px-12">
        {correct ? (
          <>
            <span className="text-7xl bb-pop">✅</span>
            <p className="text-green-400 text-5xl font-bold bb-pop">¡CORRECTO!</p>
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
            <span className="text-7xl bb-pop">❌</span>
            <p className="text-red-400 text-5xl font-bold bb-pop">Respuesta incorrecta</p>
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
