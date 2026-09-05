import { useEffect, useState } from 'react'
import type { Participant, Team } from '../../lib/types'

interface Props {
  participant: Participant
  team: Team
}

const SPIN_DURATION_MS = 1700
const START_INTERVAL_MS = 70
const END_INTERVAL_MS = 260

export function CallingView({ participant, team }: Props) {
  const pool = team.members.length > 1 ? team.members : null
  const [displayName, setDisplayName] = useState(participant.name)
  const [spinning, setSpinning] = useState(Boolean(pool))
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!pool) {
      setDisplayName(participant.name)
      setSpinning(false)
      return
    }

    setSpinning(true)
    const start = Date.now()
    let timeoutId: ReturnType<typeof setTimeout>

    function step() {
      const elapsed = Date.now() - start
      if (elapsed >= SPIN_DURATION_MS) {
        setDisplayName(participant.name)
        setSpinning(false)
        setTick(t => t + 1)
        return
      }
      const progress = elapsed / SPIN_DURATION_MS
      const interval = START_INTERVAL_MS + (END_INTERVAL_MS - START_INTERVAL_MS) * progress ** 2
      const candidate = pool![Math.floor(Math.random() * pool!.length)]
      setDisplayName(candidate.name)
      setTick(t => t + 1)
      timeoutId = setTimeout(step, interval)
    }
    step()

    return () => clearTimeout(timeoutId)
  }, [participant.id, team.id, pool])

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-8">
      <style>{`
        @keyframes bb-tick {
          0%   { transform: scale(0.9) translateY(6px); opacity: 0.4; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        .bb-tick { animation: bb-tick 0.12s ease-out both; }
        @keyframes bb-lock-in {
          0%   { transform: scale(1.18); }
          55%  { transform: scale(0.95); }
          100% { transform: scale(1); }
        }
        .bb-lock-in { animation: bb-lock-in 0.4s cubic-bezier(.34,1.56,.64,1) both; }
        @keyframes bb-spin-glow {
          0%, 100% { box-shadow: 0 0 0 rgba(99,102,241,0); }
          50%      { box-shadow: 0 0 40px rgba(99,102,241,0.85); }
        }
        .bb-spin-glow { animation: bb-spin-glow 0.5s ease-in-out infinite; }
        @keyframes bb-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .bb-fade-in { animation: bb-fade-in 0.4s ease-out both; }
      `}</style>

      <p className="text-indigo-300 text-2xl uppercase tracking-widest">Le toca a</p>

      <div
        key={spinning ? `avatar-${tick}` : 'avatar-final'}
        className={`bg-indigo-500 rounded-full w-40 h-40 flex items-center justify-center text-white font-bold text-7xl ${
          spinning ? 'bb-tick bb-spin-glow' : 'bb-lock-in'
        }`}
      >
        {displayName[0]?.toUpperCase()}
      </div>

      <p
        key={spinning ? `name-${tick}` : 'name-final'}
        className={`text-white font-bold text-6xl text-center ${spinning ? 'bb-tick' : 'bb-lock-in'}`}
      >
        {displayName}
      </p>

      <p className="text-yellow-400 text-3xl font-semibold">{team.name}</p>

      {!spinning && <p className="text-gray-500 text-xl mt-4 bb-fade-in">Pasa al frente...</p>}
    </div>
  )
}
