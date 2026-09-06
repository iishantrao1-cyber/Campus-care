import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { portfolio } from '../config/portfolio'
import { useApp, store } from '../state/store'

/**
 * Floating info panel for a focused skill sphere.
 * "Used in projects" is computed automatically from project technologies.
 */
export default function SkillPanel() {
  const idx = useApp((s) => s.selectedSkill)
  const skill = idx !== null ? portfolio.skills[idx] : null
  const panel = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (idx === null) return
    gsap.fromTo(panel.current, { autoAlpha: 0, x: 40, rotateY: -14 }, { autoAlpha: 1, x: 0, rotateY: -7, duration: 0.5, ease: 'power3.out' })
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') store.set({ selectedSkill: null })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [idx])

  if (idx === null || !skill) return null

  const n = skill.name.toLowerCase()
  const projects = portfolio.projects
    .filter((p) => p.technologies.some((t) => t.toLowerCase().includes(n) || n.includes(t.toLowerCase())))
    .slice(0, 3)

  return (
    <aside className="skill-panel-wrap show" aria-label={`Skill details: ${skill.name}`}>
      <div className="skill-panel" ref={panel}>
        <button className="skill-close" ref={closeRef} onClick={() => store.set({ selectedSkill: null })} aria-label="Close skill details">
          ✕
        </button>
        <p className="skill-kicker">Skill</p>
        <h2 className="skill-name">{skill.name}</h2>
        <p className="skill-blurb">{skill.blurb}</p>
        <div className="skill-level">
          <h4>
            Experience <b>Level {skill.level} / 5</b>
          </h4>
          <div className="skill-bar" role="img" aria-label={`Level ${skill.level} out of 5`}>
            {[1, 2, 3, 4, 5].map((i) => (
              <i key={i} className={i <= skill.level ? 'on' : ''} />
            ))}
          </div>
        </div>
        <div className="skill-projects">
          <h4>Projects using it</h4>
          {projects.length ? (
            <ul>
              {projects.map((p) => (
                <li key={p.title}>
                  {p.title}
                  <span>{p.tagline}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="skill-empty">Practice it in the projects coming next.</p>
          )}
        </div>
      </div>
    </aside>
  )
}
