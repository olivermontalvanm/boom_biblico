import { useEffect, useReducer, useRef, useState } from 'react'
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
        {displayed.view === 'question' && (
          <QuestionView
            participant={displayed.participant}
            team={displayed.team}
            question={displayed.question}
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
          />
        )}
        {displayed.view === 'final' && (() => {
          const MEDALS = [
            { emoji: '🥇', border: 'border-yellow-400', score: 'text-yellow-300', size: 'text-7xl px-14 py-10' },
            { emoji: '🥈', border: 'border-slate-300',  score: 'text-slate-200',  size: 'text-6xl px-12 py-8'  },
            { emoji: '🥉', border: 'border-amber-600',  score: 'text-amber-400',  size: 'text-6xl px-12 py-8'  },
          ]
          const ranked = [...displayed.teams]
            .map(team => ({
              team,
              total: displayed.scores.filter(s => s.teamId === team.id).reduce((sum, s) => sum + s.correct, 0),
            }))
            .sort((a, b) => b.total - a.total)

          return (
            <div className="flex-1 flex flex-col items-center justify-center gap-10">
              <h2 className="text-5xl font-bold text-yellow-400">Resultados Finales</h2>
              <div className="flex gap-6 flex-wrap justify-center items-end">
                {ranked.map(({ team, total }, rank) => {
                  const medal = MEDALS[rank]
                  return (
                    <div
                      key={team.id}
                      className={`bg-[#1e1e3a] border-2 rounded-2xl text-center flex flex-col items-center gap-1
                        ${medal ? `${medal.border} ${medal.size}` : 'border-gray-700 text-5xl px-10 py-7'}`}
                    >
                      {medal
                        ? <span className="text-5xl leading-none mb-1">{medal.emoji}</span>
                        : <span className="text-gray-600 text-xl font-bold mb-1">{rank + 1}°</span>
                      }
                      <p className="text-gray-300 text-xl font-semibold">{team.name}</p>
                      <p className={`font-bold mt-1 ${medal ? medal.score : 'text-white text-5xl'}`}>{total}</p>

                      {(() => {
                        const TOP_ICONS = ['🥇', '🥈', '🥉']
                        const topPlayers = team.members
                          .map(m => ({
                            name: m.name,
                            correct: displayed.scores.find(s => s.participantId === m.id)?.correct ?? 0,
                          }))
                          .filter(p => p.correct > 0)
                          .sort((a, b) => b.correct - a.correct)
                          .slice(0, 3)

                        if (topPlayers.length === 0) return null
                        return (
                          <div className="mt-3 pt-3 border-t border-white/10 w-full flex flex-col gap-1.5">
                            {topPlayers.map((p, i) => (
                              <div key={i} className="flex items-center justify-between gap-4 text-sm">
                                <span className="text-base leading-none">{TOP_ICONS[i]}</span>
                                <span className="text-gray-300 flex-1 text-left truncate">{p.name}</span>
                                <span className="text-white font-semibold tabular-nums">{p.correct}</span>
                              </div>
                            ))}
                          </div>
                        )
                      })()}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}
      </div>

      {state.teams.length > 0 && <Scoreboard scores={state.scores} teams={state.teams} />}
    </div>
  )
}
