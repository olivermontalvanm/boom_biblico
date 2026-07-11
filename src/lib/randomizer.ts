import type { Participant, Turn, Question } from './types'

function todayPrefix(): string {
  return new Date().toISOString().slice(0, 10)
}

function lastTurnDate(participantId: string, turns: Turn[]): string {
  const mine = turns.filter(t => t.participantId === participantId)
  return mine.length === 0 ? '' : mine.map(t => t.date).sort().at(-1)!
}

export function pickParticipant(participants: Participant[], turns: Turn[]): Participant {
  const today = todayPrefix()
  const participatedToday = new Set(
    turns.filter(t => t.date.startsWith(today)).map(t => t.participantId)
  )

  const notYetToday = participants.filter(p => !participatedToday.has(p.id))
  const pool = notYetToday.length > 0 ? notYetToday : participants

  const sorted = [...pool].sort((a, b) =>
    lastTurnDate(a.id, turns).localeCompare(lastTurnDate(b.id, turns))
  )

  const earliest = lastTurnDate(sorted[0].id, turns)
  const tied = sorted.filter(p => lastTurnDate(p.id, turns) === earliest)
  return tied[Math.floor(Math.random() * tied.length)]
}

export function pickQuestion(questions: Question[], turns: Turn[]): Question | null {
  const usedIds = new Set(turns.map(t => t.questionId))
  const available = questions.filter(q => !usedIds.has(q.id))
  if (available.length === 0) return null
  return available[Math.floor(Math.random() * available.length)]
}
