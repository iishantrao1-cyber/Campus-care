import { useEffect, useState } from 'react'
import { portfolio } from '../config/portfolio'
import { world } from '../config/world'
import { store, useApp } from '../state/store'
import { jumpTo } from '../lib/utils'

const initials = portfolio.fullName
  .split(' ')
  .map((w) => w[0])
  .slice(0, 2)
  .join('')

/** Minimal floating navigation. Jumping is a smooth camera move through
 *  the world (never an anchor snap). Mobile gets a full-screen menu. */
export default function Nav() {
  const section = useApp((s) => s.section)
  const [open, setOpen] = useState(false)
  const active = section === 'walk' ? 'home' : section

  const go = (at: number) => {
    setOpen(false)
    jumpTo(at, store.get().reducedMotion)
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <header className="nav">
        <button className="nav-brand" onClick={() => go(0)} aria-label="Back to the start">
          <span className="nav-brand-ring" aria-hidden="true">
            {initials}
          </span>
          <span className="nav-brand-name">{portfolio.name}</span>
        </button>
        <nav aria-label="Primary">
          <ul className="nav-links">
            {world.sections.map((s) => (
              <li key={s.id}>
                <button
                  className={`nav-link ${active === s.id ? 'active' : ''}`}
                  onClick={() => go(s.at)}
                  aria-current={active === s.id ? 'true' : undefined}
                >
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <button
          className={`nav-burger ${open ? 'open' : ''}`}
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label="Toggle menu"
        >
          <span />
          <span />
          <span />
        </button>
      </header>
      <div className={`nav-mobile ${open ? 'open' : ''}`} aria-hidden={!open}>
        {world.sections.map((s) => (
          <button key={s.id} className={active === s.id ? 'active' : ''} onClick={() => go(s.at)} tabIndex={open ? 0 : -1}>
            {s.label}
          </button>
        ))}
      </div>
    </>
  )
}
