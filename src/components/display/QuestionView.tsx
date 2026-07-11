import type { Participant, Team, Question, Score } from '../../lib/types'
import { Scoreboard } from './Scoreboard'

interface Props {
  participant: Participant
  team: Team
  question: Question
  scores: Score[]
  teams: Team[]
}

const LABELS = ['A', 'B', 'C', 'D']

export function QuestionView({ participant, team, question, scores, teams }: Props) {
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
        <p className="text-white text-3xl font-medium leading-relaxed">{question.question}</p>
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

      <Scoreboard scores={scores} teams={teams} />
    </div>
  )
}
