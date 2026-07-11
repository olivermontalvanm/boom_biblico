import { useEffect, useReducer } from 'react'
import type { DisplayEvent, Participant, Team, Question, Score } from '../lib/types'
import { createReceiver } from '../lib/broadcast'
import { IdleScreen } from '../components/display/IdleScreen'
import { QuestionView } from '../components/display/QuestionView'
import { ResultView } from '../components/display/ResultView'
import { Scoreboard } from '../components/display/Scoreboard'

type DisplayState =
  | { view: 'idle'; scores: Score[]; teams: Team[] }
  | { view: 'question'; participant: Participant; team: Team; question: Question; scores: Score[]; teams: Team[] }
  | { view: 'result'; correct: boolean; selectedOptionIndex: number; correctOptionIndex: number; participant: Participant; team: Team; question: Question; scores: Score[]; teams: Team[] }
  | { view: 'final'; scores: Score[]; teams: Team[] }

function reducer(state: DisplayState, event: DisplayEvent): DisplayState {
  switch (event.type) {
    case 'IDLE':
      return { view: 'idle', scores: state.scores, teams: state.teams }
    case 'SHOW_QUESTION':
      return { view: 'question', participant: event.participant, team: event.team, question: event.question, scores: state.scores, teams: event.teams }
    case 'REVEAL_ANSWER':
      if (state.view !== 'question') return state
      return { view: 'result', correct: event.correct, selectedOptionIndex: event.selectedOptionIndex, correctOptionIndex: event.correctOptionIndex, participant: state.participant, team: state.team, question: state.question, scores: state.scores, teams: state.teams }
    case 'UPDATE_SCORES':
      return { ...state, scores: event.scores }
    case 'SHOW_FINAL_SCORES':
      return { view: 'final', scores: event.scores, teams: event.teams }
    default:
      return state
  }
}

export function DisplayPage() {
  const [state, dispatch] = useReducer(reducer, { view: 'idle', scores: [], teams: [] })

  useEffect(() => {
    const receiver = createReceiver(dispatch)
    return () => receiver.close()
  }, [])

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white flex flex-col">
      <div className="flex-1 flex flex-col">
        {state.view === 'idle' && <IdleScreen />}
        {state.view === 'question' && (
          <QuestionView
            participant={state.participant}
            team={state.team}
            question={state.question}
          />
        )}
        {state.view === 'result' && (
          <ResultView
            correct={state.correct}
            selectedOptionIndex={state.selectedOptionIndex}
            correctOptionIndex={state.correctOptionIndex}
            question={state.question}
            participant={state.participant}
            team={state.team}
          />
        )}
        {state.view === 'final' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-8">
            <h2 className="text-5xl font-bold text-yellow-400">Resultados Finales</h2>
            <div className="flex gap-8 flex-wrap justify-center">
              {state.teams.map(team => {
                const total = state.scores.filter(s => s.teamId === team.id).reduce((sum, s) => sum + s.correct, 0)
                return (
                  <div key={team.id} className="bg-[#1e1e3a] rounded-2xl px-12 py-8 text-center">
                    <p className="text-gray-400 text-lg">{team.name}</p>
                    <p className="text-white text-6xl font-bold mt-2">{total}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
      {state.teams.length > 0 && <Scoreboard scores={state.scores} teams={state.teams} />}
    </div>
  )
}
