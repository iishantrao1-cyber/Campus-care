import { portfolio } from '../config/portfolio'
import { useApp } from '../state/store'

/**
 * Holographic about panel — a floating 3D-tilted card that arrives while
 * the camera orbits the seated character. All content from config.
 */
export default function AboutPanel() {
  const section = useApp((s) => s.section)
  const show = section === 'about'
  const a = portfolio.about
  const t = portfolio.sectionTitles

  return (
    <div className={`about-wrap ${show ? 'show' : ''}`} aria-hidden={!show}>
      <div className="about-float">
        <article className="about-panel">
          <p className="about-kicker">{t.about.kicker}</p>
          <h2 className="about-title">{t.about.title}</h2>
          <p className="about-bio">{a.bio}</p>

          <div className="about-block">
            <h4>Currently learning</h4>
            <div className="chips">
              {a.learning.map((x) => (
                <span key={x} className="chip">
                  {x}
                </span>
              ))}
            </div>
          </div>

          <div className="about-block">
            <h4>What I build</h4>
            <div className="chips">
              {a.building.map((x) => (
                <span key={x} className="chip">
                  {x}
                </span>
              ))}
            </div>
          </div>

          <div className="about-block">
            <h4>Interests</h4>
            <div className="chips">
              {a.interests.map((x) => (
                <span key={x} className="chip">
                  {x}
                </span>
              ))}
            </div>
          </div>

          <div className="about-block">
            <h4>Education</h4>
            <div className="about-kv">
              <div>
                <span>School</span>
                {a.education.school}
              </div>
              <div>
                <span>Course</span>
                {a.education.course}
              </div>
              <div>
                <span>Period</span>
                {a.education.period}
              </div>
            </div>
          </div>

          <div className="about-goal">{a.goal}</div>
        </article>
      </div>
    </div>
  )
}
