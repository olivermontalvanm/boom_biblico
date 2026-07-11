import { useEffect, useReducer, useRef, useState } from 'react'
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
  todayChapters: number[]
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
  | { type: 'SETUP_COMPLETE'; bookName: string; todayChapters: number[]; teams: Team[]; questions: Question[] }
  | { type: 'START_TURN'; team: Team; participant: Participant; question: Question }
  | { type: 'CHANGE_PARTICIPANT'; participant: Participant }
  | { type: 'SELECT_OPTION'; index: number }
  | { type: 'CONFIRM_ANSWER'; turn: Turn; scores: Score[] }
  | { type: 'NEXT_TURN' }
  | { type: 'FINISH_BOOK' }

function init(): State {
  const session = getSession()
  if (!session?.isActive) {
    return {
      phase: 'setup', bookName: '', todayChapters: [], questions: [], teams: [],
      turns: [], scores: [], currentTeam: null,
      currentParticipant: null, currentQuestion: null, selectedOptionIndex: null,
    }
  }
  return {
    phase: 'idle', bookName: session.bookName, todayChapters: session.todayChapters, questions: [],
    teams: getTeams(), turns: getTurns(), scores: getScores(),
    currentTeam: null, currentParticipant: null, currentQuestion: null, selectedOptionIndex: null,
  }
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SETUP_COMPLETE':
      return { ...state, phase: 'idle', bookName: action.bookName, todayChapters: action.todayChapters, teams: action.teams, questions: action.questions }
    case 'START_TURN':
      return { ...state, phase: 'question', currentTeam: action.team, currentParticipant: action.participant, currentQuestion: action.question, selectedOptionIndex: null }
    case 'CHANGE_PARTICIPANT':
      return { ...state, currentParticipant: action.participant, selectedOptionIndex: null }
    case 'SELECT_OPTION':
      return { ...state, selectedOptionIndex: action.index }
    case 'CONFIRM_ANSWER':
      return { ...state, phase: 'revealed', turns: [...state.turns, action.turn], scores: action.scores }
    case 'NEXT_TURN':
      return { ...state, phase: 'idle', currentTeam: null, currentParticipant: null, currentQuestion: null, selectedOptionIndex: null }
    case 'FINISH_BOOK':
      return {
        phase: 'setup', bookName: '', todayChapters: [], questions: [], teams: [], turns: [], scores: [],
        currentTeam: null, currentParticipant: null, currentQuestion: null, selectedOptionIndex: null,
      }
    default:
      return state
  }
}

// Panel that handles loading questions + selecting today's chapters on session resume
function ResumePanel({
  bookName,
  savedChapters,
  teams,
  onStart,
}: {
  bookName: string
  savedChapters: number[]
  teams: Team[]
  onStart: (questions: Question[], todayChapters: number[]) => void
}) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [todayChapters, setTodayChapters] = useState<number[]>(savedChapters)
  const [error, setError] = useState('')

  const availableChapters = [...new Set(questions.map(q => q.chapter))].sort((a, b) => a - b)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const qs = JSON.parse(await file.text()) as Question[]
      setQuestions(qs)
      // pre-select previous chapters if still available in new file
      const newChapters = [...new Set(qs.map(q => q.chapter))]
      setTodayChapters(savedChapters.filter(c => newChapters.includes(c)))
      setError('')
    } catch {
      setError('JSON inválido')
    }
  }

  function toggle(ch: number) {
    setTodayChapters(prev =>
      prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch].sort((a, b) => a - b)
    )
  }

  const canStart = questions.length > 0 && todayChapters.length > 0

  return (
    <div className="flex flex-col items-center gap-5 bg-gray-800 rounded-xl p-8 max-w-md w-full">
      <div className="text-center">
        <p className="text-yellow-400 font-semibold text-lg">Sesión recuperada</p>
        <p className="text-white font-bold text-xl mt-1">{bookName}</p>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <label className="bg-gray-700 hover:bg-gray-600 cursor-pointer text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm w-full text-center">
        📄 {questions.length > 0 ? `✓ ${questions.length} preguntas cargadas` : 'Cargar preguntas'}
        <input type="file" accept=".json" className="hidden" onChange={handleFile} />
      </label>

      {availableChapters.length > 0 && (
        <div className="w-full flex flex-col gap-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Capítulos de hoy</p>
          <div className="flex flex-wrap gap-2">
            {availableChapters.map(ch => (
              <button
                key={ch}
                onClick={() => toggle(ch)}
                className={`w-10 h-10 rounded-lg text-sm font-bold transition-colors ${
                  todayChapters.includes(ch)
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                {ch}
              </button>
            ))}
          </div>
          {todayChapters.length === 0 && (
            <p className="text-yellow-500 text-xs">Selecciona al menos un capítulo</p>
          )}
        </div>
      )}

      <button
        onClick={() => onStart(questions, todayChapters)}
        disabled={!canStart}
        className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold py-3 px-8 rounded-xl transition-colors w-full"
      >
        Iniciar →
      </button>
    </div>
  )
}

export function OperatorPage() {
  const [state, dispatch] = useReducer(reducer, undefined, init)
  const senderRef = useRef<ReturnType<typeof createSender> | null>(null)

  useEffect(() => {
    const sender = createSender()
    senderRef.current = sender
    return () => {
      sender.close()
      senderRef.current = null
    }
  }, [])

  function handleSetupComplete(data: { bookName: string; todayChapters: number[]; teams: Team[]; questions: Question[] }) {
    saveSession({ bookName: data.bookName, todayChapters: data.todayChapters, startDate: new Date().toISOString(), isActive: true })
    saveTeams(data.teams)
    dispatch({ type: 'SETUP_COMPLETE', ...data })
    senderRef.current?.send({ type: 'IDLE' })
  }

  function handleResume(questions: Question[], todayChapters: number[]) {
    saveSession({ bookName: state.bookName, todayChapters, startDate: new Date().toISOString(), isActive: true })
    dispatch({ type: 'SETUP_COMPLETE', bookName: state.bookName, todayChapters, teams: state.teams, questions })
    senderRef.current?.send({ type: 'IDLE' })
  }

  function handleTeamSelect(team: Team) {
    const participant = pickParticipant(team.members, state.turns)
    const question = pickQuestion(state.questions, state.turns, state.todayChapters)
    if (!question) {
      alert('No hay más preguntas disponibles para los capítulos de hoy.')
      return
    }
    dispatch({ type: 'START_TURN', team, participant, question })
    senderRef.current?.send({ type: 'SHOW_QUESTION', participant, team, question, teams: state.teams })
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
    senderRef.current?.send({ type: 'REVEAL_ANSWER', selectedOptionIndex: state.selectedOptionIndex, correct, correctOptionIndex })
    senderRef.current?.send({ type: 'UPDATE_SCORES', scores: newScores })
  }

  function handleChangeParticipant() {
    if (!state.currentTeam || !state.currentParticipant || !state.currentQuestion) return
    const others = state.currentTeam.members.filter(m => m.id !== state.currentParticipant!.id)
    if (others.length === 0) return
    const newParticipant = pickParticipant(others, state.turns)
    dispatch({ type: 'CHANGE_PARTICIPANT', participant: newParticipant })
    senderRef.current?.send({ type: 'SHOW_QUESTION', participant: newParticipant, team: state.currentTeam, question: state.currentQuestion, teams: state.teams })
  }

  function handleNextTurn() {
    dispatch({ type: 'NEXT_TURN' })
    senderRef.current?.send({ type: 'IDLE' })
  }

  function handleFinishBook() {
    if (!confirm('¿Finalizar el libro actual? Esto borrará todos los datos de esta sesión.')) return
    senderRef.current?.send({ type: 'SHOW_FINAL_SCORES', scores: state.scores, teams: state.teams })
    clearAll()
    dispatch({ type: 'FINISH_BOOK' })
  }

  if (state.phase === 'setup') {
    return <SetupScreen onComplete={handleSetupComplete} />
  }

  const displayParticipants = state.currentTeam?.members ?? state.teams.flatMap(t => t.members)
  const lastTeamId = state.turns.at(-1)?.teamId ?? null

  return (
    <div className="h-screen bg-[#13131f] text-white flex overflow-hidden">
      <TeamSidebar
        teams={state.teams}
        scores={state.scores}
        bookName={state.bookName}
        todayChapters={state.todayChapters}
        lastTeamId={lastTeamId}
        onFinishBook={handleFinishBook}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {state.phase === 'idle' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
            {state.questions.length === 0 ? (
              <ResumePanel
                bookName={state.bookName}
                savedChapters={state.todayChapters}
                teams={state.teams}
                onStart={handleResume}
              />
            ) : (
              <>
                <p className="text-gray-400 text-lg">Selecciona el equipo que juega este turno</p>
                <div className="flex gap-4 flex-wrap justify-center">
                  {state.teams.map(team => (
                    <button
                      key={team.id}
                      onClick={() => handleTeamSelect(team)}
                      className="relative bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors"
                    >
                      {team.name}
                      {team.id === lastTeamId && (
                        <span className="absolute -top-2 -right-2 text-[10px] bg-gray-500 text-white rounded-full px-2 py-0.5">
                          último
                        </span>
                      )}
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
            canChangeParticipant={state.currentTeam.members.length > 1}
            onSelectOption={index => dispatch({ type: 'SELECT_OPTION', index })}
            onConfirm={handleConfirmAnswer}
            onNextTurn={handleNextTurn}
            onChangeParticipant={handleChangeParticipant}
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
