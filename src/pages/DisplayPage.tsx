import { useEffect, useReducer, useRef, useState } from 'react'
import type { DisplayEvent, Participant, Team, Question, Score } from '../lib/types'
import { createReceiver } from '../lib/broadcast'
import { IdleScreen } from '../components/display/IdleScreen'
import { CallingView } from '../components/display/CallingView'
import { QuestionView } from '../components/display/QuestionView'
import { ResultView } from '../components/display/ResultView'
import { ResultsBoard } from '../components/display/ResultsBoard'
import { Scoreboard } from '../components/display/Scoreboard'

type DisplayState =
  | { view: 'idle'; scores: Score[]; teams: Team[] }
  | { view: 'calling'; participant: Participant; team: Team; scores: Score[]; teams: Team[] }
  | { view: 'question'; participant: Participant; team: Team; question: Question; value: number; scores: Score[]; teams: Team[] }
  | { view: 'result'; correct: boolean; selectedOptionIndex: number; correctOptionIndex: number; participant: Participant; team: Team; question: Question; value: number; scores: Score[]; teams: Team[] }
  | { view: 'results'; scores: Score[]; teams: Team[] }
  | { view: 'final'; scores: Score[]; teams: Team[] }

function reducer(state: DisplayState, event: DisplayEvent): DisplayState {
  switch (event.type) {
    case 'IDLE':
      return { view: 'idle', scores: state.scores, teams: state.teams }
    case 'SHOW_PARTICIPANT':
      return { view: 'calling', participant: event.participant, team: event.team, scores: state.scores, teams: event.teams }
    case 'SHOW_QUESTION':
      return { view: 'question', participant: event.participant, team: event.team, question: event.question, value: event.value, scores: state.scores, teams: event.teams }
    case 'REVEAL_ANSWER':
      if (state.view !== 'question') return state
      return { view: 'result', correct: event.correct, selectedOptionIndex: event.selectedOptionIndex, correctOptionIndex: event.correctOptionIndex, participant: state.participant, team: state.team, question: state.question, value: state.value, scores: state.scores, teams: state.teams }
    case 'UPDATE_SCORES':
      return { ...state, scores: event.scores }
    case 'SHOW_RESULTS':
      return { view: 'results', scores: event.scores, teams: event.teams }
    case 'SHOW_FINAL_SCORES':
      return { view: 'final', scores: event.scores, teams: event.teams }
    default:
      return state
  }
}

const TRANSITION_MS = 320

export function DisplayPage() {
  const [state, dispatch] = useReducer(reducer, { view: 'idle', scores: [], teams: [] })
  const [displayed, setDisplayed] = useState<DisplayState>({ view: 'idle', scores: [], teams: [] })
  const [animClass, setAnimClass] = useState('bb-enter')
  const currentViewRef = useRef<DisplayState['view']>('idle')

  useEffect(() => {
    const receiver = createReceiver(dispatch)
    return () => receiver.close()
  }, [])

  useEffect(() => {
    if (state.view === currentViewRef.current) {
      setDisplayed(state)
      return
    }
    currentViewRef.current = state.view
    setAnimClass('bb-exit')
    const t = setTimeout(() => {
      setDisplayed(state)
      setAnimClass('bb-enter')
    }, TRANSITION_MS)
    return () => clearTimeout(t)
  }, [state])

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white flex flex-col">
      <style>{`
        .bb-enter { animation: bb-in  ${TRANSITION_MS + 80}ms cubic-bezier(0.22,1,0.36,1) both; }
        .bb-exit  { animation: bb-out ${TRANSITION_MS}ms cubic-bezier(0.55,0,1,0.45) both; }
        @keyframes bb-in  {
          from { opacity: 0; transform: scale(0.96) translateY(18px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
        @keyframes bb-out {
          from { opacity: 1; transform: scale(1)    translateY(0); }
          to   { opacity: 0; transform: scale(0.96) translateY(-14px); }
        }
      `}</style>

      <div key={displayed.view} className={`flex-1 flex flex-col ${animClass}`}>
        {displayed.view === 'idle' && <IdleScreen />}
        {displayed.view === 'calling' && (
          <CallingView participant={displayed.participant} team={displayed.team} />
        )}
        {displayed.view === 'question' && (
          <QuestionView
            participant={displayed.participant}
            team={displayed.team}
            question={displayed.question}
            value={displayed.value}
          />
        )}
        {displayed.view === 'result' && (
          <ResultView
            correct={displayed.correct}
            selectedOptionIndex={displayed.selectedOptionIndex}
            correctOptionIndex={displayed.correctOptionIndex}
            question={displayed.question}
            participant={displayed.participant}
            team={displayed.team}
            value={displayed.value}
          />
        )}
        {displayed.view === 'results' && (
          <ResultsBoard title="Resultados hasta el momento" teams={displayed.teams} scores={displayed.scores} />
        )}
        {displayed.view === 'final' && (
          <ResultsBoard title="Resultados Finales" teams={displayed.teams} scores={displayed.scores} />
        )}
      </div>

      {state.teams.length > 0 && <Scoreboard scores={state.scores} teams={state.teams} />}
    </div>
  )
}
