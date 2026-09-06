import { portfolio } from '../config/portfolio'

/**
 * Screen-reader / no-JS-content summary: everything important in the 3D
 * world is available as real text (visually hidden).
 */
export default function A11ySummary() {
  const p = portfolio
  return (
    <main className="sr-only">
      <h1>
        {p.fullName} — {p.role}
      </h1>
      <p>{p.about.bio}</p>

      <section>
        <h2>About</h2>
        <p>
          Currently learning: {p.about.learning.join(', ')}. Building: {p.about.building.join(', ')}. Interests:{' '}
          {p.about.interests.join(', ')}. Education: {p.about.education.course} at {p.about.education.school} (
          {p.about.education.period}).
        </p>
        <p>Career goal: {p.about.goal}</p>
      </section>

      <section>
        <h2>Projects</h2>
        <ul>
          {p.projects.map((pr) => (
            <li key={pr.title}>
              <a href={pr.github}>{pr.title}</a> — {pr.description} Technologies: {pr.technologies.join(', ')}.
              {pr.liveDemo ? ` Live demo: ${pr.liveDemo}` : ''}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Certificates</h2>
        <ul>
          {p.certificates.map((c) => (
            <li key={c.title}>
              {c.title} — {c.issuer}, {c.date}
              {c.credentialLink && c.credentialLink !== '#' ? ` (credential: ${c.credentialLink})` : ''}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Skills</h2>
        <ul>
          {p.skills.map((s) => (
            <li key={s.name}>
              {s.name} — level {s.level} of 5. {s.blurb}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Email: <a href={`mailto:${p.email}`}>{p.email}</a>. GitHub:{' '}
          <a href={p.socials.github}>{p.socials.github}</a>. LinkedIn: <a href={p.socials.linkedin}>{p.socials.linkedin}</a>.
        </p>
      </section>
    </main>
  )
}
