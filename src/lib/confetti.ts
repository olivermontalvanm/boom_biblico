import confetti from 'canvas-confetti'

const COLORS = ['#facc15', '#22c55e', '#6366f1', '#f97316']

// Kept low and paired with a higher z-index on the result content, so the
// confetti falls behind the "¡CORRECTO!" message instead of covering it.
const Z_INDEX = 1

export function fireConfetti(): void {
  confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 }, colors: COLORS, startVelocity: 48, zIndex: Z_INDEX })

  const end = Date.now() + 2000
  ;(function frame() {
    confetti({ particleCount: 4, angle: 60, spread: 65, origin: { x: 0 }, colors: COLORS, zIndex: Z_INDEX })
    confetti({ particleCount: 4, angle: 120, spread: 65, origin: { x: 1 }, colors: COLORS, zIndex: Z_INDEX })
    if (Date.now() < end) requestAnimationFrame(frame)
  })()
}
