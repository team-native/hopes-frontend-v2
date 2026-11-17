import { useEffect, useState } from 'react'

const LOGO_PATH =
  'M600 1362V400A129 129 0 0 1 858 400V608C900 545 965 525 1040 525C1245 525 1400 675 1400 900V1366A124 124 0 0 1 1152 1366V960C1152 870 1100 815 1015 815C920 815 858 890 858 965V1362A129 129 0 0 1 600 1362Z'

const GRADIENT_STOPS = [
  { offset: '0%', color: '#034ef8' },
  { offset: '20%', color: '#066bfb' },
  { offset: '40%', color: '#0b8cfd' },
  { offset: '60%', color: '#119dfd' },
  { offset: '80%', color: '#1ab0fd' },
  { offset: '100%', color: '#18c4fd' },
]

const SHOW_MS = 1800
const FADE_MS = 450

type Phase = 'playing' | 'leaving' | 'done'

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function SplashScreen() {
  const [phase, setPhase] = useState<Phase>(() => (prefersReducedMotion() ? 'done' : 'playing'))

  useEffect(() => {
    if (phase === 'done') return
    const timer = window.setTimeout(
      () => setPhase(phase === 'playing' ? 'leaving' : 'done'),
      phase === 'playing' ? SHOW_MS : FADE_MS,
    )
    return () => window.clearTimeout(timer)
  }, [phase])

  if (phase === 'done') return null

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-50 flex items-center justify-center bg-bg-surface transition-opacity duration-[450ms] ${
        phase === 'leaving' ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <svg viewBox="596 266 808 1228" className="h-36 w-auto md:h-44" fill="none">
        <defs>
          <linearGradient
            id="splash-logo-gradient"
            gradientUnits="userSpaceOnUse"
            x1="700"
            y1="280"
            x2="1300"
            y2="1500"
          >
            {GRADIENT_STOPS.map(({ offset, color }) => (
              <stop key={offset} offset={offset} stopColor={color} />
            ))}
          </linearGradient>
        </defs>
        <path
          className="splash-logo-path"
          d={LOGO_PATH}
          pathLength={1}
          fill="url(#splash-logo-gradient)"
          stroke="url(#splash-logo-gradient)"
          strokeWidth={9}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

export default SplashScreen
