import type { Participant, Team } from '../../lib/types'

interface Props {
  participant: Participant
  team: Team
}

export function CallingView({ participant, team }: Props) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-8">
      <p className="text-indigo-300 text-2xl uppercase tracking-widest">Le toca a</p>
      <div className="bg-indigo-500 rounded-full w-40 h-40 flex items-center justify-center text-white font-bold text-7xl">
        {participant.name[0].toUpperCase()}
      </div>
      <p className="text-white font-bold text-6xl text-center">{participant.name}</p>
      <p className="text-yellow-400 text-3xl font-semibold">{team.name}</p>
      <p className="text-gray-500 text-xl mt-4">Pasa al frente...</p>
    </div>
  )
}
