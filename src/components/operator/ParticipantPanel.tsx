import type { Participant, Turn } from '../../lib/types'

interface Props {
  participants: Participant[]
  turns: Turn[]
  currentParticipantId: string | null
}

export function ParticipantPanel({ participants, turns, currentParticipantId }: Props) {
  const today = new Date().toISOString().slice(0, 10)
  const participatedToday = new Set(
    turns.filter(t => t.date.startsWith(today)).map(t => t.participantId)
  )

  return (
    <div className="w-44 bg-[#1a1a2a] p-4 flex flex-col gap-2 shrink-0 overflow-y-auto">
      <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Participantes hoy</p>
      {participants.map(p => {
        const isCurrent = p.id === currentParticipantId
        const wentToday = participatedToday.has(p.id)
        return (
          <div
            key={p.id}
            className={`rounded-md px-3 py-2 flex items-center gap-2 ${isCurrent ? 'bg-[#2a2a3e] border border-indigo-500' : 'bg-[#2a2a3e]'}`}
          >
            <span className="text-xs w-4 text-center">
              {isCurrent ? '▶' : wentToday ? '✓' : '○'}
            </span>
            <span className={`text-xs ${isCurrent ? 'text-white font-bold' : wentToday ? 'text-gray-500 line-through' : 'text-gray-400'}`}>
              {p.name}
            </span>
          </div>
        )
      })}
    </div>
  )
}
