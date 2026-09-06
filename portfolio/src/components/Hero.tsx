import { portfolio } from '../config/portfolio'
import { useApp } from '../state/store'

/**
 * Opening frame: the character stands waist-up in the viewport (handled
 * by the 3D camera) while this minimal text floats on the left.
 */
export default function Hero() {
  const ready = useApp((s) => s.ready)
  const section = useApp((s) => s.section)
  const show = ready && section === 'home'

  const roles = portfolio.role.split('•').map((r) => r.trim())

  return (
    <>
      <section className={`hero ${show ? 'show' : ''}`} aria-hidden={!show}>
        <p className="hero-eyebrow">{portfolio.eyebrow}</p>
        <h1 className="hero-title">
          Hi, I&rsquo;m <span className="accent">{portfolio.fullName.split(' ')[0]}</span>
        </h1>
        <p className="hero-role">
          {roles.map((r, i) => (
            <span key={r}>
              {i > 0 && <span className="dot" aria-hidden="true">
                •
              </span>}
              {r}
            </span>
          ))}
        </p>
        <p className="hero-sub">Welcome to my little corner of the web — scroll and I&rsquo;ll walk you through my world.</p>
      </section>
      <div className={`scroll-hint ${show ? '' : 'off'}`} aria-hidden="true">
        <span>Scroll to begin</span>
        <span className="scroll-hint-chev" />
      </div>
    </>
  )
}
