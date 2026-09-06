import { Suspense, lazy, useEffect, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { theme } from './config/theme'
import { world } from './config/world'
import { store, useApp } from './state/store'
import { scrollState } from './state/scroll'
import { pointer } from './state/pointer'
import { detectTier, tierSettings, prefersReducedMotion } from './lib/tier'
import Loader from './components/Loader'
import Nav from './components/Nav'
import Hero from './components/Hero'
import SectionHeads from './components/SectionHeads'
import AboutPanel from './components/AboutPanel'
import ProjectModal from './components/ProjectModal'
import CertModal from './components/CertModal'
import SkillPanel from './components/SkillPanel'
import ContactSection from './components/ContactSection'
import ScrollRail from './components/ScrollRail'
import A11ySummary from './components/A11ySummary'

gsap.registerPlugin(ScrollTrigger)

// three.js arrives as its own async chunk behind the loading sequence
const Experience = lazy(() => import('./3d/Experience'))

export default function App() {
  const tier = useState(detectTier)[0]
  const reduced = useState(prefersReducedMotion)[0]

  /* device tier + reduced motion + theme → CSS variables (single source) */
  useEffect(() => {
    store.set({ tier, dprCap: tierSettings[tier].dpr, reducedMotion: reduced })
    const c = theme.colors
    const rs = document.documentElement.style
    rs.setProperty('--bg', c.background)
    rs.setProperty('--accent', c.accent)
    rs.setProperty('--accent2', c.accent2)
    rs.setProperty('--text', c.text)
    rs.setProperty('--muted', c.textMuted)
    rs.setProperty('--panel', c.panel)
  }, [tier, reduced])

  /* scroll → journey progress (GSAP ScrollTrigger, smoothed downstream) */
  useEffect(() => {
    const st = ScrollTrigger.create({
      trigger: '#scroll-space',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.65,
      onUpdate: (self) => {
        scrollState.target = self.progress
      },
    })
    const onMove = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.y = -(e.clientY / window.innerHeight) * 2 + 1
      pointer.active = true
    }
    const onLeave = () => {
      pointer.active = false
    }
    const onVis = () => {
      if (document.hidden) pointer.active = false
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      st.kill()
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  /* reveal the top nav once the world is live */
  const ready = useApp((s) => s.ready)
  useEffect(() => {
    if (!ready) return
    gsap.fromTo('.nav', { y: -18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7, delay: 0.3, ease: 'power2.out' })
  }, [ready])

  return (
    <>
      {/* the story length — everything else is fixed over the 3D world */}
      <div id="scroll-space" style={{ height: `${world.scrollLengthVh}vh` }} aria-hidden="true" />

      <div
        className="canvas-wrap"
        role="img"
        aria-label="Interactive 3D world: an animated developer walks to his desk and starts coding as you scroll, followed by projects, moving certificates, floating skill spheres and a contact scene"
      >
        <Suspense fallback={null}>
          <Experience />
        </Suspense>
      </div>

      <div className="vignette" aria-hidden="true" />

      <div className="ui">
        <ScrollRail />
        <Nav />
        <Hero />
        <SectionHeads />
        <AboutPanel />
        <SkillPanel />
        <ContactSection />
        <ProjectModal />
        <CertModal />
      </div>

      <A11ySummary />
      <Loader />
    </>
  )
}
