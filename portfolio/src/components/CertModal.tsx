import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { portfolio } from '../config/portfolio'
import { useApp, store } from '../state/store'
import { dataUrl } from '../lib/textures'
import { clamp, lockScroll, unlockScroll } from '../lib/utils'
import Btn3D from './Btn3D'
import { ExternalIcon } from './Icons'

const N = portfolio.certificates.length

/**
 * 3D certificate viewer: zoom (wheel / buttons), pan by drag, prev/next,
 * open original credential, Esc to close. Fully keyboard operable.
 */
export default function CertModal() {
  const idx = useApp((s) => s.selectedCert)
  const cert = idx !== null ? portfolio.certificates[idx] : null
  const card = useRef<HTMLDivElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const drag = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null)

  useEffect(() => {
    if (idx === null) return
    lockScroll()
    setZoom(1)
    setPan({ x: 0, y: 0 })
    gsap.fromTo(card.current, { autoAlpha: 0, y: 26, scale: 0.96 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: 'power3.out' })
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') store.set({ selectedCert: null })
      if (e.key === 'ArrowRight') store.set({ selectedCert: ((idx + 1) % N) as number })
      if (e.key === 'ArrowLeft') store.set({ selectedCert: ((idx - 1 + N) % N) as number })
    }
    window.addEventListener('keydown', onKey)
    return () => {
      unlockScroll()
      window.removeEventListener('keydown', onKey)
    }
  }, [idx])

  // wheel zoom — native listener so preventDefault works (React wheel is passive)
  useEffect(() => {
    const el = stage.current
    if (!el || idx === null) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      setZoom((z) => clamp(z * (e.deltaY < 0 ? 1.12 : 0.89), 1, 2.8))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [idx])

  useEffect(() => {
    if (zoom === 1) setPan({ x: 0, y: 0 })
  }, [zoom])

  if (idx === null || !cert) return null
  const close = () => store.set({ selectedCert: null })
  const src = cert.image || dataUrl(`cert-${idx}-${cert.title}`)

  const clampPan = (x: number, y: number, z: number) => {
    const r = stage.current?.getBoundingClientRect()
    const m = (z - 1) * ((r?.width ?? 600) / 2)
    const my = (z - 1) * ((r?.height ?? 400) / 2)
    return { x: clamp(x, -m, m), y: clamp(y, -my, my) }
  }

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && close()}>
      <div className="modal-card cert-stage-wrap" ref={card} role="dialog" aria-modal="true" aria-label={`Certificate: ${cert.title}`}>
        <button className="modal-close" ref={closeRef} onClick={close} aria-label="Close certificate viewer">
          ✕
        </button>
        <div
          ref={stage}
          className={`cert-stage ${drag.current ? 'dragging' : ''}`}
          onPointerDown={(e) => {
            if (zoom <= 1) return
            ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
            drag.current = { px: e.clientX, py: e.clientY, ox: pan.x, oy: pan.y }
          }}
          onPointerMove={(e) => {
            if (!drag.current) return
            const d = drag.current
            setPan(clampPan(d.ox + (e.clientX - d.px), d.oy + (e.clientY - d.py), zoom))
          }}
          onPointerUp={() => (drag.current = null)}
          onPointerCancel={() => (drag.current = null)}
        >
          <img
            src={src}
            alt={`Certificate — ${cert.title}, ${cert.issuer}, ${cert.date}`}
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
            draggable={false}
          />
        </div>
        <div className="cert-caption">
          <h3>{cert.title}</h3>
          <p>
            {cert.issuer} · {cert.date}
          </p>
        </div>
        <div className="cert-ctrls">
          <button className="cert-arrow" onClick={() => store.set({ selectedCert: ((idx - 1 + N) % N) as number })} aria-label="Previous certificate">
            ←
          </button>
          <div className="zoom-ctl">
            <button onClick={() => setZoom((z) => clamp(z * 0.85, 1, 2.8))} aria-label="Zoom out">
              −
            </button>
            <span>{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom((z) => clamp(z * 1.18, 1, 2.8))} aria-label="Zoom in">
              +
            </button>
          </div>
          <button className="cert-arrow" onClick={() => store.set({ selectedCert: ((idx + 1) % N) as number })} aria-label="Next certificate">
            →
          </button>
          {cert.credentialLink && cert.credentialLink !== '#' && (
            <Btn3D variant="ghost" href={cert.credentialLink} target="_blank" rel="noreferrer" aria-label="Open original certificate">
              Original <ExternalIcon />
            </Btn3D>
          )}
        </div>
      </div>
    </div>
  )
}
