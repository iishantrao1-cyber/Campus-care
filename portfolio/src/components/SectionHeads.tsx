import { portfolio } from '../config/portfolio'
import { useApp } from '../state/store'

/**
 * Small fixed kicker + interaction hint for each journey window.
 * (The big in-world 3D titles are rendered by each zone itself.)
 */
export default function SectionHeads() {
  const section = useApp((s) => s.section)
  const t = portfolio.sectionTitles
  const heads: { key: string; kicker: string; hint: string; center?: boolean }[] = [
    { key: 'projects', kicker: t.projects.kicker, hint: 'Hover to lift a card · click to open it' },
    { key: 'certs', kicker: t.certs.kicker, hint: 'Touch a certificate to slow the belt · click to view', center: true },
    { key: 'skills', kicker: t.skills.kicker, hint: 'The spheres react to you · click one to inspect' },
  ]
  return (
    <>
      {heads.map((h) => (
        <div key={h.key} className={`section-head ${h.center ? 'center' : ''} ${section === h.key ? 'show' : ''}`} aria-hidden={section !== h.key}>
          <p className="section-kicker">{h.kicker}</p>
          <p className="section-hint">{h.hint}</p>
        </div>
      ))}
    </>
  )
}
