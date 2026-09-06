import { useEffect, useRef } from 'react'
import { world } from '../config/world'
import { store, useApp } from '../state/store'
import { scrollState } from '../state/scroll'
import { jumpTo } from '../lib/utils'

/**
 * Journey progress rail (right edge). The fill tracks the damped scroll
 * value directly in the DOM — zero React re-renders per frame.
 */
export default function ScrollRail() {
  const section = useApp((s) => s.section)
  const fill = useRef<HTMLDivElement>(null)
  const active = section === 'walk' ? 'home' : section

  useEffect(() => {
    let raf = 0
    const step = () => {
      if (fill.current) fill.current.style.height = `${(scrollState.value * 100).toFixed(2)}%`
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className="rail" aria-label="Journey progress">
      <div className="rail-track">
        <div className="rail-fill" ref={fill} aria-hidden="true" />
        <div className="rail-dots">
          {world.sections.map((s) => (
            <button
              key={s.id}
              className={`rail-dot ${active === s.id ? 'active' : ''}`}
              style={{ top: `${Math.min(99, Math.max(1, s.at * 100))}%` }}
              title={s.label}
              aria-label={`Go to ${s.label}`}
              onClick={() => jumpTo(s.at, store.get().reducedMotion)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
