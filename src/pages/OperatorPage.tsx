import { useEffect, useReducer, useRef, useState } from 'react'
import type { Team, Participant, Question, Turn, Score } from '../lib/types'
import { createSender } from '../lib/broadcast'
import {
  getTeams, saveTeams, getTurns, addTurn,
  getScores, updateScore, setScore, getSession, saveSession, clearAll,
} from '../lib/storage'
import { pickParticipant, pickQuestion } from '../lib/randomizer'
import { SetupScreen } from '../components/operator/SetupScreen'
import { TeamSidebar } from '../components/operator/TeamSidebar'
import { ParticipantPanel } from '../components/operator/ParticipantPanel'
import { CallingPanel } from '../components/operator/CallingPanel'
import { QuestionPanel } from '../components/operator/QuestionPanel'
import { ResultsPanel } from '../components/operator/ResultsPanel'

type Phase = 'setup' | 'idle' | 'calling' | 'question' | 'revealed' | 'results'

interface State {
  phase: Phase
  bookName: string
  todayChapters: number[]
  questions: Question[]
  teams: Team[]
  turns: Turn[]
  scores: Score[]
  questionMultiplier: number
  currentTeam: Team | null
  currentParticipant: Participant | null
  currentQuestion: Question | null
  currentQuestionValue: number
  selectedOptionIndex: number | null
}

type Action =
  | { type: 'SETUP_COMPLETE'; bookName: string; todayChapters: number[]; teams: Team[]; questions: Question[] }
  | { type: 'SET_MULTIPLIER'; multiplier: number }
  | { type: 'START_TURN'; team: Team; participant: Participant; question: Question }
  | { type: 'CHANGE_PARTICIPANT'; participant: Participant }
  | { type: 'SET_QUESTION_VALUE'; value: number }
  | { type: 'MARK_READY' }
  | { type: 'SELECT_OPTION'; index: number }
  | { type: 'CONFIRM_ANSWER'; turn: Turn; scores: Score[] }
  | { type: 'NEXT_TURN' }
  | { type: 'FINISH_BOOK' }
  | { type: 'SHOW_RESULTS' }
  | { type: 'HIDE_RESULTS' }
  | { type: 'UPDATE_SCORE'; scores: Score[] }

function init(): State {
  const session = getSession()
  if (!session?.isActive) {
    return {
      phase: 'setup', bookName: '', todayChapters: [], questions: [], teams: [],
      turns: [], scores: [], questionMultiplier: 1, currentTeam: null,
      currentParticipant: null, currentQuestion: null, currentQuestionValue: 1, selectedOptionIndex: null,
    }
  }
  return {
    phase: 'idle', bookName: session.bookName, todayChapters: session.todayChapters, questions: [],
    teams: getTeams(), turns: getTurns(), scores: getScores(), questionMultiplier: session.questionMultiplier ?? 1,
    currentTeam: null, currentParticipant: null, currentQuestion: null, currentQuestionValue: 1, selectedOptionIndex: null,
  }
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SETUP_COMPLETE':
      return { ...state, phase: 'idle', bookName: action.bookName, todayChapters: action.todayChapters, teams: action.teams, questions: action.questions }
    case 'SET_MULTIPLIER':
      return { ...state, questionMultiplier: action.multiplier }
    case 'START_TURN':
      return { ...state, phase: 'calling', currentTeam: action.team, currentParticipant: action.participant, currentQuestion: action.question, currentQuestionValue: state.questionMultiplier, selectedOptionIndex: null }
    case 'CHANGE_PARTICIPANT':
      return { ...state, currentParticipant: action.participant, selectedOptionIndex: null }
    case 'SET_QUESTION_VALUE':
      return { ...state, currentQuestionValue: action.value }
    case 'MARK_READY':
      return { ...state, phase: 'question' }
    case 'SELECT_OPTION':
      return { ...state, selectedOptionIndex: action.index }
    case 'CONFIRM_ANSWER':
      return { ...state, phase: 'revealed', turns: [...state.turns, action.turn], scores: action.scores }
    case 'NEXT_TURN':
      return { ...state, phase: 'idle', currentTeam: null, currentParticipant: null, currentQuestion: null, currentQuestionValue: state.questionMultiplier, selectedOptionIndex: null }
    case 'FINISH_BOOK':
      return {
        phase: 'setup', bookName: '', todayChapters: [], questions: [], teams: [], turns: [], scores: [], questionMultiplier: 1,
        currentTeam: null, currentParticipant: null, currentQuestion: null, currentQuestionValue: 1, selectedOptionIndex: null,
      }
    case 'SHOW_RESULTS':
      return { ...state, phase: 'results' }
    case 'HIDE_RESULTS':
      return { ...state, phase: 'idle' }
    case 'UPDATE_SCORE':
      return { ...state, scores: action.scores }
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
  const [pendingTeam, setPendingTeam] = useState<Team | null>(null)

  useEffect(() => {
    const sender = createSender()
    senderRef.current = sender
    return () => {
      sender.close()
      senderRef.current = null
    }
  }, [])

  function handleSetupComplete(data: { bookName: string; todayChapters: number[]; teams: Team[]; questions: Question[] }) {
    saveSession({ bookName: data.bookName, todayChapters: data.todayChapters, startDate: new Date().toISOString(), isActive: true, questionMultiplier: 1 })
    saveTeams(data.teams)
    dispatch({ type: 'SETUP_COMPLETE', ...data })
    senderRef.current?.send({ type: 'IDLE' })
  }

  function handleResume(questions: Question[], todayChapters: number[]) {
    saveSession({ bookName: state.bookName, todayChapters, startDate: new Date().toISOString(), isActive: true, questionMultiplier: state.questionMultiplier })
    dispatch({ type: 'SETUP_COMPLETE', bookName: state.bookName, todayChapters, teams: state.teams, questions })
    senderRef.current?.send({ type: 'IDLE' })
  }

  function handleSetMultiplier(multiplier: number) {
    const value = Math.max(1, multiplier)
    const session = getSession()
    if (session) saveSession({ ...session, questionMultiplier: value })
    dispatch({ type: 'SET_MULTIPLIER', multiplier: value })
  }

  function handleStartTurn(team: Team, participant: Participant) {
    const question = pickQuestion(state.questions, state.turns, state.todayChapters)
    if (!question) {
      alert('No hay más preguntas disponibles para los capítulos de hoy.')
      return
    }
    setPendingTeam(null)
    dispatch({ type: 'START_TURN', team, participant, question })
    senderRef.current?.send({ type: 'SHOW_PARTICIPANT', participant, team, teams: state.teams })
  }

  function handleSetQuestionValue(value: number) {
    dispatch({ type: 'SET_QUESTION_VALUE', value: Math.max(1, value) })
  }

  function handleMarkReady() {
    if (!state.currentTeam || !state.currentParticipant || !state.currentQuestion) return
    dispatch({ type: 'MARK_READY' })
    senderRef.current?.send({
      type: 'SHOW_QUESTION',
      participant: state.currentParticipant,
      team: state.currentTeam,
      question: state.currentQuestion,
      teams: state.teams,
      value: state.currentQuestionValue,
    })
  }

  function handleTeamSelect(team: Team) {
    handleStartTurn(team, pickParticipant(team.members, state.turns))
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
    const newScores = updateScore(state.currentParticipant.id, state.currentTeam.id, correct, state.currentQuestionValue)
    dispatch({ type: 'CONFIRM_ANSWER', turn, scores: newScores })
    senderRef.current?.send({ type: 'REVEAL_ANSWER', selectedOptionIndex: state.selectedOptionIndex, correct, correctOptionIndex })
    senderRef.current?.send({ type: 'UPDATE_SCORES', scores: newScores })
  }

  function handleChangeParticipant() {
    if (!state.currentTeam || !state.currentParticipant) return
    const others = state.currentTeam.members.filter(m => m.id !== state.currentParticipant!.id)
    if (others.length === 0) return
    const newParticipant = pickParticipant(others, state.turns)
    dispatch({ type: 'CHANGE_PARTICIPANT', participant: newParticipant })
    senderRef.current?.send({ type: 'SHOW_PARTICIPANT', participant: newParticipant, team: state.currentTeam, teams: state.teams })
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

  function handleShowResults() {
    dispatch({ type: 'SHOW_RESULTS' })
    senderRef.current?.send({ type: 'SHOW_RESULTS', scores: state.scores, teams: state.teams })
  }

  function handleHideResults() {
    dispatch({ type: 'HIDE_RESULTS' })
    senderRef.current?.send({ type: 'IDLE' })
  }

  function handleUpdateScore(participantId: string, teamId: string, correct: number, incorrect: number) {
    const newScores = setScore(participantId, teamId, correct, incorrect)
    dispatch({ type: 'UPDATE_SCORE', scores: newScores })
    senderRef.current?.send({ type: 'UPDATE_SCORES', scores: newScores })
  }

  if (state.phase === 'setup') {
    return <SetupScreen onComplete={handleSetupComplete} />
  }

  const displayParticipants = state.currentTeam?.members ?? state.teams.flatMap(t => t.members)
  const lastTeamId = state.turns.at(-1)?.teamId ?? null
  const usedIds = new Set(state.turns.map(t => t.questionId))
  const remainingQuestions = state.questions.length > 0
    ? state.questions.filter(q => state.todayChapters.includes(q.chapter) && !usedIds.has(q.id)).length
    : null

  return (
    <div className="h-screen bg-[#13131f] text-white flex overflow-hidden">
      <TeamSidebar
        teams={state.teams}
        scores={state.scores}
        bookName={state.bookName}
        todayChapters={state.todayChapters}
        remainingQuestions={remainingQuestions}
        lastTeamId={lastTeamId}
        questionMultiplier={state.questionMultiplier}
        onChangeMultiplier={handleSetMultiplier}
        onShowResults={handleShowResults}
        onFinishBook={handleFinishBook}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex justify-end gap-2 px-4 py-2 border-b border-[#2a2a3e] shrink-0">
          <button
            onClick={() => window.open('/editor', '_blank')}
            className="bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            ✏️ Editor
          </button>
          <button
            onClick={() => window.open('/display', '_blank')}
            className="bg-indigo-700 hover:bg-indigo-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            📺 Abrir pantalla
          </button>
        </div>
        {state.phase === 'idle' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
            {state.questions.length === 0 ? (
              <ResumePanel
                bookName={state.bookName}
                savedChapters={state.todayChapters}
                teams={state.teams}
                onStart={handleResume}
              />
            ) : pendingTeam ? (
              <div className="flex flex-col items-center gap-5 w-full max-w-sm">
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-widest">Equipo</p>
                  <p className="text-white font-bold text-xl mt-0.5">{pendingTeam.name}</p>
                  <p className="text-gray-400 text-sm mt-1">Selecciona un participante</p>
                </div>

                <div className="flex flex-col gap-2 w-full">
                  {pendingTeam.members.map(member => {
                    const turnCount = state.turns.filter(t => t.participantId === member.id).length
                    return (
                      <button
                        key={member.id}
                        onClick={() => handleStartTurn(pendingTeam, member)}
                        className="flex items-center justify-between bg-[#2a2a3e] hover:bg-indigo-700 text-white px-4 py-3 rounded-xl transition-colors w-full"
                      >
                        <span className="font-medium">{member.name}</span>
                        {turnCount > 0 && (
                          <span className="text-xs text-gray-400 bg-gray-700 rounded-full px-2 py-0.5">
                            {turnCount} {turnCount === 1 ? 'turno' : 'turnos'}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>

                <div className="flex gap-3 w-full pt-1">
                  <button
                    onClick={() => handleTeamSelect(pendingTeam)}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
                  >
                    Aleatorio
                  </button>
                  <button
                    onClick={() => setPendingTeam(null)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 font-semibold py-2.5 rounded-xl text-sm transition-colors"
                  >
                    Volver
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-gray-400 text-lg">Selecciona el equipo que juega este turno</p>
                <div className="flex gap-4 flex-wrap justify-center">
                  {state.teams.map(team => (
                    <button
                      key={team.id}
                      onClick={() => setPendingTeam(team)}
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
                {remainingQuestions !== null && (
                  <p className={`text-sm font-medium ${remainingQuestions === 0 ? 'text-red-400' : 'text-gray-500'}`}>
                    {remainingQuestions === 0
                      ? 'Sin preguntas disponibles para los capítulos de hoy'
                      : `${remainingQuestions} pregunta${remainingQuestions === 1 ? '' : 's'} disponible${remainingQuestions === 1 ? '' : 's'}`}
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {state.phase === 'calling' && state.currentParticipant && state.currentTeam && (
          <CallingPanel
            participant={state.currentParticipant}
            team={state.currentTeam}
            canChangeParticipant={state.currentTeam.members.length > 1}
            questionValue={state.currentQuestionValue}
            onChangeParticipant={handleChangeParticipant}
            onChangeQuestionValue={handleSetQuestionValue}
            onMarkReady={handleMarkReady}
          />
        )}

        {(state.phase === 'question' || state.phase === 'revealed') &&
          state.currentParticipant && state.currentTeam && state.currentQuestion && (
          <QuestionPanel
            participant={state.currentParticipant}
            team={state.currentTeam}
            question={state.currentQuestion}
            questionNumber={state.turns.length + (state.phase === 'question' ? 1 : 0)}
            questionValue={state.currentQuestionValue}
            selectedOptionIndex={state.selectedOptionIndex}
            revealed={state.phase === 'revealed'}
            onSelectOption={index => dispatch({ type: 'SELECT_OPTION', index })}
            onConfirm={handleConfirmAnswer}
            onNextTurn={handleNextTurn}
          />
        )}

        {state.phase === 'results' && (
          <ResultsPanel
            teams={state.teams}
            scores={state.scores}
            onUpdateScore={handleUpdateScore}
            onClose={handleHideResults}
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
