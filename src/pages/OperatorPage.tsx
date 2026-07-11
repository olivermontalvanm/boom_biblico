import { useEffect, useReducer, useRef } from 'react'
import type { Team, Participant, Question, Turn, Score } from '../lib/types'
import { createSender } from '../lib/broadcast'
import {
  getTeams, saveTeams, getTurns, addTurn,
  getScores, updateScore, getSession, saveSession, clearAll,
} from '../lib/storage'
import { pickParticipant, pickQuestion } from '../lib/randomizer'
import { SetupScreen } from '../components/operator/SetupScreen'
import { TeamSidebar } from '../components/operator/TeamSidebar'
import { ParticipantPanel } from '../components/operator/ParticipantPanel'
import { QuestionPanel } from '../components/operator/QuestionPanel'

type Phase = 'setup' | 'idle' | 'question' | 'revealed'

interface State {
  phase: Phase
  bookName: string
  questions: Question[]
  teams: Team[]
  turns: Turn[]
  scores: Score[]
  currentTeam: Team | null
  currentParticipant: Participant | null
  currentQuestion: Question | null
  selectedOptionIndex: number | null
}

type Action =
  | { type: 'SETUP_COMPLETE'; bookName: string; teams: Team[]; questions: Question[] }
  | { type: 'START_TURN'; team: Team; participant: Participant; question: Question }
  | { type: 'SELECT_OPTION'; index: number }
  | { type: 'CONFIRM_ANSWER'; turn: Turn; scores: Score[] }
  | { type: 'NEXT_TURN' }
  | { type: 'FINISH_BOOK' }

function init(): State {
  const session = getSession()
  if (!session?.isActive) {
    return {
      phase: 'setup', bookName: '', questions: [], teams: [],
      turns: [], scores: [], currentTeam: null,
      currentParticipant: null, currentQuestion: null, selectedOptionIndex: null,
    }
  }
  return {
    phase: 'idle', bookName: session.bookName, questions: [],
    teams: getTeams(), turns: getTurns(), scores: getScores(),
    currentTeam: null, currentParticipant: null, currentQuestion: null, selectedOptionIndex: null,
  }
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SETUP_COMPLETE':
      return { ...state, phase: 'idle', bookName: action.bookName, teams: action.teams, questions: action.questions }
    case 'START_TURN':
      return { ...state, phase: 'question', currentTeam: action.team, currentParticipant: action.participant, currentQuestion: action.question, selectedOptionIndex: null }
    case 'SELECT_OPTION':
      return { ...state, selectedOptionIndex: action.index }
    case 'CONFIRM_ANSWER':
      return { ...state, phase: 'revealed', turns: [...state.turns, action.turn], scores: action.scores }
    case 'NEXT_TURN':
      return { ...state, phase: 'idle', currentTeam: null, currentParticipant: null, currentQuestion: null, selectedOptionIndex: null }
    case 'FINISH_BOOK':
      return {
        phase: 'setup', bookName: '', questions: [], teams: [], turns: [], scores: [],
        currentTeam: null, currentParticipant: null, currentQuestion: null, selectedOptionIndex: null,
      }
    default:
      return state
  }
}

export function OperatorPage() {
  const [state, dispatch] = useReducer(reducer, undefined, init)
  const senderRef = useRef(createSender())

  useEffect(() => {
    const sender = senderRef.current
    return () => sender.close()
  }, [])

  function handleSetupComplete(data: { bookName: string; teams: Team[]; questions: Question[] }) {
    saveSession({ bookName: data.bookName, startDate: new Date().toISOString(), isActive: true })
    saveTeams(data.teams)
    dispatch({ type: 'SETUP_COMPLETE', ...data })
    senderRef.current.send({ type: 'IDLE' })
  }

  function handleTeamSelect(team: Team) {
    const participant = pickParticipant(team.members, state.turns)
    const question = pickQuestion(state.questions, state.turns)
    if (!question) {
      alert('No hay más preguntas disponibles. Carga un nuevo archivo de preguntas.')
      return
    }
    dispatch({ type: 'START_TURN', team, participant, question })
    senderRef.current.send({ type: 'SHOW_QUESTION', participant, team, question })
  }

  function handleConfirmAnswer() {
    if (state.selectedOptionIndex === null || !state.currentQuestion || !state.currentParticipant || !state.currentTeam) return
    const correct = state.currentQuestion.options[state.selectedOptionIndex].isCorrect
    const correctOptionIndex = state.currentQuestion.options.findIndex(o => o.isCorrect)

    const turn: Turn = {
      participantId: state.currentParticipant.id,
      teamId: state.currentTeam.id,
      date: new Date().toISOString(),
      questionId: state.currentQuestion.id,
      questionText: state.currentQuestion.question,
      answeredCorrectly: correct,
    }

    addTurn(turn)
    const newScores = updateScore(state.currentParticipant.id, state.currentTeam.id, correct)
    dispatch({ type: 'CONFIRM_ANSWER', turn, scores: newScores })
    senderRef.current.send({ type: 'REVEAL_ANSWER', selectedOptionIndex: state.selectedOptionIndex, correct, correctOptionIndex })
    senderRef.current.send({ type: 'UPDATE_SCORES', scores: newScores })
  }

  function handleNextTurn() {
    dispatch({ type: 'NEXT_TURN' })
    senderRef.current.send({ type: 'IDLE' })
  }

  function handleFinishBook() {
    if (!confirm('¿Finalizar el libro actual? Esto borrará todos los datos de esta sesión.')) return
    senderRef.current.send({ type: 'SHOW_FINAL_SCORES', scores: state.scores, teams: state.teams })
    clearAll()
    dispatch({ type: 'FINISH_BOOK' })
  }

  if (state.phase === 'setup') {
    return <SetupScreen onComplete={handleSetupComplete} />
  }

  const displayParticipants = state.currentTeam?.members ?? state.teams.flatMap(t => t.members)

  return (
    <div className="h-screen bg-[#13131f] text-white flex overflow-hidden">
      <TeamSidebar
        teams={state.teams}
        scores={state.scores}
        bookName={state.bookName}
        onFinishBook={handleFinishBook}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {state.phase === 'idle' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
            {state.questions.length === 0 ? (
              <div className="flex flex-col items-center gap-4 bg-gray-800 rounded-xl p-8 max-w-sm w-full text-center">
                <p className="text-yellow-400 font-semibold">Sesión recuperada: {state.bookName}</p>
                <p className="text-gray-400 text-sm">Carga el archivo de preguntas para continuar</p>
                <label className="bg-indigo-600 hover:bg-indigo-700 cursor-pointer text-white font-semibold px-6 py-3 rounded-xl transition-colors">
                  📄 Cargar preguntas
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={async e => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      const qs = JSON.parse(await file.text()) as Question[]
                      dispatch({ type: 'SETUP_COMPLETE', bookName: state.bookName, teams: state.teams, questions: qs })
                    }}
                  />
                </label>
              </div>
            ) : (
              <>
                <p className="text-gray-400 text-lg">Selecciona el equipo que juega este turno</p>
                <div className="flex gap-4 flex-wrap justify-center">
                  {state.teams.map(team => (
                    <button
                      key={team.id}
                      onClick={() => handleTeamSelect(team)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors"
                    >
                      {team.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {(state.phase === 'question' || state.phase === 'revealed') &&
          state.currentParticipant && state.currentTeam && state.currentQuestion && (
          <QuestionPanel
            participant={state.currentParticipant}
            team={state.currentTeam}
            question={state.currentQuestion}
            questionNumber={state.turns.length + (state.phase === 'question' ? 1 : 0)}
            selectedOptionIndex={state.selectedOptionIndex}
            revealed={state.phase === 'revealed'}
            onSelectOption={index => dispatch({ type: 'SELECT_OPTION', index })}
            onConfirm={handleConfirmAnswer}
            onNextTurn={handleNextTurn}
          />
        )}
      </div>

      <ParticipantPanel
        participants={displayParticipants}
        turns={state.turns}
        currentParticipantId={state.currentParticipant?.id ?? null}
      />
    </div>
  )
}
