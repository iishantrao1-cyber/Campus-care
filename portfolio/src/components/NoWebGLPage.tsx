import { portfolio } from '../config/portfolio'

/**
 * Shown when the browser cannot do WebGL: the entire portfolio as a
 * normal, fully readable page — nothing important is lost.
 */
export default function NoWebGLPage() {
  const p = portfolio
  return (
    <div className="nogl">
      <div className="nogl-inner">
        <div className="nogl-notice" role="status">
          <strong>Heads-up:</strong> this portfolio is normally a full interactive 3D world, but
          WebGL isn&rsquo;t available in your browser — so here&rsquo;s everything as a regular page.
        </div>

        <header className="nogl-hero">
          <p className="hero-eyebrow">{p.eyebrow}</p>
          <h1>
            Hi, I&rsquo;m <span className="accent">{p.fullName.split(' ')[0]}</span>
          </h1>
          <p className="hero-role">{p.role}</p>
          <p className="nogl-bio">{p.about.bio}</p>
        </header>

        <section>
          <h2>Currently learning</h2>
          <div className="chips">
            {p.about.learning.map((x) => (
              <span key={x} className="chip">{x}</span>
            ))}
          </div>
          <h2>Education</h2>
          <p className="nogl-kv">
            {p.about.education.course} · {p.about.education.school} · {p.about.education.period}
          </p>
          <h2>Goal</h2>
          <p className="nogl-goal">{p.about.goal}</p>
        </section>

        <section>
          <h2>Projects</h2>
          <div className="nogl-projects">
            {p.projects.map((pr) => (
              <article key={pr.title} className="nogl-card">
                <h3>{pr.title}</h3>
                <p className="nogl-tagline">{pr.tagline}</p>
                <p>{pr.description}</p>
                <p className="nogl-role">{pr.role}</p>
                <ul className="feat-list">
                  {pr.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <div className="chips">
                  {pr.technologies.map((t) => (
                    <span key={t} className="chip">{t}</span>
                  ))}
                </div>
                <div className="nogl-links">
                  {pr.github && (
                    <a className="btn3d btn3d--primary" href={pr.github} target="_blank" rel="noreferrer">
                      GitHub ↗
                    </a>
                  )}
                  {pr.liveDemo && (
                    <a className="btn3d btn3d--accent2" href={pr.liveDemo} target="_blank" rel="noreferrer">
                      Live demo ↗
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section>
          <h2>Certificates</h2>
          <ul className="nogl-certs">
            {p.certificates.map((c) => (
              <li key={c.title}>
                {c.title} — {c.issuer}, {c.date}
                {c.credentialLink && c.credentialLink !== '#' && (
                  <>
                    {' '}(<a href={c.credentialLink} target="_blank" rel="noreferrer">view credential</a>)
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2>Skills</h2>
          <div className="nogl-skills">
            {p.skills.map((s) => (
              <div key={s.name} className="nogl-skill">
                <span className="nogl-skill-name">{s.name}</span>
                <span className="nogl-skill-level" aria-label={`level ${s.level} of 5`}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <i key={i} className={i <= s.level ? 'on' : ''} />
                  ))}
                </span>
                <span className="nogl-skill-blurb">{s.blurb}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="nogl-contact">
          <h2>{p.contact.heading}</h2>
          <p>{p.contact.subheading}</p>
          <div className="contact-actions">
            <a className="btn3d btn3d--primary" href={`mailto:${p.email}`}>✉ {p.email}</a>
            {p.socials.github && (
              <a className="btn3d btn3d--ghost" href={p.socials.github} target="_blank" rel="noreferrer">GitHub</a>
            )}
            {p.socials.linkedin && (
              <a className="btn3d btn3d--ghost" href={p.socials.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
            )}
            <a className="btn3d btn3d--accent2" href={p.resumeUrl} target="_blank" rel="noreferrer">Resume</a>
          </div>
        </section>
      </div>
    </div>
  )
}
