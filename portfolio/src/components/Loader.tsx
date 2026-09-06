import { useEffect, useRef, useState } from 'react'
import { portfolio } from '../config/portfolio'
import { useApp, store } from '../state/store'
import { whenFontsReady } from '../lib/textures'
import { prefersReducedMotion } from '../lib/tier'
import { clamp } from '../lib/utils'

const STATUSES = ['INITIALIZING…', 'LOADING PORTFOLIO…', 'ENTERING MY WORLD…']

const initials = portfolio.fullName
  .split(' ')
  .map((w) => w[0])
  .slice(0, 2)
  .join('')

/**
 * Cinematic loading sequence: spinning monogram ring, cycling status text
 * and a progress bar. It gates on the real font load (so canvas textures
 * are crisp) plus a minimum duration, then fades the world in.
 */
export default function Loader() {
  const ready = useApp((s) => s.ready)
  const [status, setStatus] = useState(STATUSES[0])
  const [gone, setGone] = useState(false)
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const min = prefersReducedMotion() ? 300 : 1100
    const t0 = performance.now()
    let prog = 0
    let raf = 0
    let done = false
    let fontsDone = false
    whenFontsReady().then(() => {
      fontsDone = true
    })
    const step = () => {
      const elapsed = performance.now() - t0
      const target = clamp(elapsed / 2300, 0, 0.985)
      prog = Math.min(target, prog + (target - prog) * 0.07 + 0.0006)
      if (barRef.current) barRef.current.style.width = `${(prog * 100).toFixed(1)}%`
      setStatus(prog < 0.42 ? STATUSES[0] : prog < 0.78 ? STATUSES[1] : STATUSES[2])
      if (!done && fontsDone && elapsed > min && prog > 0.95) {
        done = true
        store.set({ ready: true })
        return
      }
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    if (!ready) return
    const t2 = setTimeout(() => setGone(true), 1150)
    return () => clearTimeout(t2)
  }, [ready])

  if (gone) return null
  return (
    <div className={`loader ${ready ? 'done' : ''}`} role="status" aria-live="polite" aria-label="Loading portfolio">
      <div className="loader-core">
        <div className="loader-ring">
          <span className="loader-mono">{initials}</span>
        </div>
        <p className="loader-status">{status}</p>
        <div className="loader-bar" aria-hidden="true">
          <div className="loader-bar-fill" ref={barRef} />
        </div>
      </div>
    </div>
  )
}
