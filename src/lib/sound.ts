import correctSoundUrl from '../assets/sounds/correct.mp3'
import incorrectSoundUrl from '../assets/sounds/incorrect.mp3'

let unlocked = false

function play(url: string): void {
  try {
    const audio = new Audio(url)
    audio.volume = 0.8
    void audio.play().catch(() => {
      // playback blocked (no user gesture yet on this page) - ignore
    })
  } catch {
    // audio unsupported - fail silently
  }
}

/**
 * Primes both clips with a muted play/pause so the real playback later isn't
 * delayed or blocked. Must be called from a user-gesture handler (click/keydown)
 * to satisfy browser autoplay policies.
 */
export function unlockAudio(): void {
  if (unlocked) return
  unlocked = true
  for (const url of [correctSoundUrl, incorrectSoundUrl]) {
    try {
      const audio = new Audio(url)
      audio.muted = true
      audio.play().then(() => audio.pause()).catch(() => {})
    } catch {
      // ignore
    }
  }
}

export function playCorrectSound(): void {
  play(correctSoundUrl)
}

export function playIncorrectSound(): void {
  play(incorrectSoundUrl)
}
