import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { portfolio } from '../config/portfolio'
import { useApp, store } from '../state/store'
import { projectImageUrl } from '../lib/textures'
import { lockScroll, unlockScroll } from '../lib/utils'
import Btn3D from './Btn3D'
import { ExternalIcon, GithubIcon } from './Icons'

/** Project detail viewer, opened from a 3D project card. */
export default function ProjectModal() {
  const idx = useApp((s) => s.selectedProject)
  const card = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const p = idx !== null ? portfolio.projects[idx] : null

  useEffect(() => {
    if (idx === null) return
    lockScroll()
    gsap.fromTo(card.current, { autoAlpha: 0, y: 26, scale: 0.96 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: 'power3.out' })
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') store.set({ selectedProject: null })
    }
    window.addEventListener('keydown', onKey)
    return () => {
      unlockScroll()
      window.removeEventListener('keydown', onKey)
    }
  }, [idx])

  if (idx === null || !p) return null
  const close = () => store.set({ selectedProject: null })

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && close()}>
      <div className="modal-card" ref={card} role="dialog" aria-modal="true" aria-label={`${p.title} details`}>
        <button className="modal-close" ref={closeRef} onClick={close} aria-label="Close project details">
          ✕
        </button>
        <div className="proj-head">
          <img className="proj-art" src={projectImageUrl(p, idx)} alt={`Cover art for ${p.title}`} />
          <p className="proj-tagline">{p.tagline}</p>
          <h2 className="proj-title">{p.title}</h2>
          <p className="proj-role">{p.role}</p>
        </div>
        <p className="proj-desc">{p.description}</p>
        <div className="modal-grid">
          <div>
            <h4>Highlights</h4>
            <ul className="feat-list">
              {p.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Technologies</h4>
            <div className="chips">
              {p.technologies.map((t) => (
                <span key={t} className="chip">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="modal-actions">
          {p.github && (
            <Btn3D variant="primary" href={p.github} target="_blank" rel="noreferrer" aria-label={`Open ${p.title} on GitHub`}>
              <GithubIcon /> GitHub <ExternalIcon />
            </Btn3D>
          )}
          {p.liveDemo && (
            <Btn3D variant="accent2" href={p.liveDemo} target="_blank" rel="noreferrer" aria-label={`Open live demo of ${p.title}`}>
              Live Demo <ExternalIcon />
            </Btn3D>
          )}
        </div>
      </div>
    </div>
  )
}
