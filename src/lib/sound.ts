let ctx: AudioContext | null = null

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioCtx) return null
  if (!ctx) ctx = new AudioCtx()
  return ctx
}

/** Must be called from a user-gesture handler to satisfy browser autoplay policies. */
export function unlockAudio(): void {
  const c = getContext()
  if (c && c.state === 'suspended') void c.resume()
}

function tone(c: AudioContext, freq: number, start: number, duration: number, type: OscillatorType, peak: number) {
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.value = freq
  const t0 = c.currentTime + start
  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.linearRampToValueAtTime(peak, t0 + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
  osc.connect(gain)
  gain.connect(c.destination)
  osc.start(t0)
  osc.stop(t0 + duration + 0.05)
}

export function playCorrectSound(): void {
  const c = getContext()
  if (!c) return
  try {
    tone(c, 523.25, 0, 0.16, 'triangle', 0.22)
    tone(c, 659.25, 0.11, 0.16, 'triangle', 0.22)
    tone(c, 783.99, 0.22, 0.22, 'triangle', 0.22)
    tone(c, 1046.5, 0.34, 0.45, 'triangle', 0.24)
  } catch {
    // audio unsupported or blocked - fail silently
  }
}

export function playIncorrectSound(): void {
  const c = getContext()
  if (!c) return
  try {
    tone(c, 196.0, 0, 0.32, 'sawtooth', 0.16)
    tone(c, 174.61, 0.26, 0.32, 'sawtooth', 0.16)
    tone(c, 146.83, 0.52, 0.55, 'sawtooth', 0.16)
  } catch {
    // audio unsupported or blocked - fail silently
  }
}
