import { useEffect, useState } from 'react'
import logo from '../../assets/logo.png'

const FRASES = [
  'Calibrando nivel de dificultad de la próxima pregunta...',
  'Escaneando sala en busca de concordancias abiertas...',
  'Analizando expresiones faciales de los participantes...',
  'Verificando que las opciones incorrectas sean suficientemente convincentes...',
  'El operador está aplicando el algoritmo de selección óptima...',
  'Calculando probabilidad de respuesta correcta... datos insuficientes...',
  'Preseleccionando pregunta con máximo potencial de sorpresa...',
  'Sistema detectó movimiento sospechoso cerca de los libros...',
  'Revisando historial de versículos memorizados por equipo...',
  'Procesando señal del operador... por favor mantener la compostura...',
  'Cargando pregunta clasificada como "debería saberla"...',
  'Sincronizando nervios de los participantes con el sistema...',
  'El operador está consultando fuentes de alta confiabilidad...',
  'Preparando siguiente pregunta. Se recomienda no abrir el libro ahora.',
  'Detectando nivel de confianza en sala... resultados mixtos...',
  '👤 Él vive hoy 🎵',
]

const SPARKLES = [
  { left: '8%',  top: '18%', delay: '0s',    size: 22 },
  { left: '88%', top: '12%', delay: '0.6s',  size: 14 },
  { left: '92%', top: '65%', delay: '1.2s',  size: 18 },
  { left: '4%',  top: '70%', delay: '1.8s',  size: 12 },
  { left: '48%', top: '4%',  delay: '2.4s',  size: 16 },
  { left: '20%', top: '88%', delay: '0.9s',  size: 10 },
  { left: '75%', top: '85%', delay: '1.5s',  size: 20 },
]

export function IdleScreen() {
  const [fraseIdx, setFraseIdx] = useState(() => Math.floor(Math.random() * FRASES.length))
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setFraseIdx(i => (i + 1) % FRASES.length)
        setVisible(true)
      }, 600)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <>
      <style>{`
        @keyframes burst-spin   { to { transform: rotate(360deg); } }
        @keyframes breathe      { 0%,100% { transform: scale(1); } 50% { transform: scale(1.07); } }
        @keyframes glow-pulse   { 0%,100% { filter: drop-shadow(0 0 28px rgba(251,191,36,0.4)); }
                                  50%      { filter: drop-shadow(0 0 64px rgba(251,191,36,0.9)); } }
        @keyframes sparkle      { 0%,100% { opacity:0; transform: scale(0.4) rotate(0deg); }
                                  50%      { opacity:1; transform: scale(1.3) rotate(180deg); } }
        @keyframes dot-1        { 0%,15%,75%,100% { opacity:0; } 30%,60% { opacity:1; } }
        @keyframes dot-2        { 0%,30%,90%,100% { opacity:0; } 45%,75% { opacity:1; } }
        @keyframes dot-3        { 0%,45%,100%     { opacity:0; } 60%,90% { opacity:1; } }
      `}</style>

      <div className="relative flex-1 flex flex-col items-center justify-center gap-8 overflow-hidden">

        {SPARKLES.map((s, i) => (
          <span
            key={i}
            className="absolute select-none pointer-events-none text-yellow-300"
            style={{ left: s.left, top: s.top, fontSize: s.size, animation: `sparkle 2.8s ease-in-out ${s.delay} infinite` }}
          >✦</span>
        ))}

        <div
          className="relative w-80 h-80 flex items-center justify-center"
          style={{ animation: 'glow-pulse 2.8s ease-in-out infinite' }}
        >
          <div
            className="absolute inset-0 bg-gradient-to-br from-yellow-300 via-yellow-400 to-orange-500"
            style={{
              clipPath: 'polygon(50% 0%, 57% 26%, 75% 7%, 68% 32%, 93% 25%, 74% 44%, 100% 50%, 74% 56%, 93% 75%, 68% 68%, 75% 93%, 57% 74%, 50% 100%, 43% 74%, 25% 93%, 32% 68%, 7% 75%, 26% 56%, 0% 50%, 26% 44%, 7% 25%, 32% 32%, 25% 7%, 43% 26%)',
              animation: 'burst-spin 18s linear infinite',
            }}
          />
          <img
            src={logo}
            alt="Boom Bíblico"
            className="relative z-10 max-h-52 w-auto object-contain p-6"
            style={{ animation: 'breathe 3s ease-in-out infinite' }}
          />
        </div>

        <p
          className="text-gray-400 text-xl text-center max-w-lg px-8 transition-opacity duration-500"
          style={{ opacity: visible ? 1 : 0 }}
        >
          {FRASES[fraseIdx]}
        </p>
      </div>
    </>
  )
}
