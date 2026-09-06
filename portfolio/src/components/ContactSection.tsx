import { portfolio } from '../config/portfolio'
import { useApp } from '../state/store'
import Btn3D from './Btn3D'
import { DownloadIcon, GithubIcon, LinkedinIcon, MailIcon } from './Icons'

/**
 * The ending. Arrives as the camera pushes into the final platform scene.
 */
export default function ContactSection() {
  const section = useApp((s) => s.section)
  const show = section === 'contact'
  const s = portfolio.socials

  return (
    <section className={`contact ${show ? 'show' : ''}`} aria-hidden={!show} aria-label="Contact">
      <p className="contact-kicker">{portfolio.sectionTitles.contact.kicker}</p>
      <h2 className="contact-heading">{portfolio.contact.heading}</h2>
      <p className="contact-sub">{portfolio.contact.subheading}</p>
      <div className="contact-actions">
        <Btn3D variant="primary" href={`mailto:${portfolio.email}`} aria-label="Send me an email">
          <MailIcon /> Email Me
        </Btn3D>
        {s.github && (
          <Btn3D variant="ghost" href={s.github} target="_blank" rel="noreferrer" aria-label="GitHub profile">
            <GithubIcon /> GitHub
          </Btn3D>
        )}
        {s.linkedin && (
          <Btn3D variant="ghost" href={s.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn profile">
            <LinkedinIcon /> LinkedIn
          </Btn3D>
        )}
        <Btn3D variant="accent2" href={portfolio.resumeUrl} target="_blank" rel="noreferrer" aria-label="Download resume">
          <DownloadIcon /> Resume
        </Btn3D>
      </div>
      <p className="contact-note">{portfolio.contact.note}</p>
    </section>
  )
}
