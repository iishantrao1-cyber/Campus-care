/* ============================================================================
   PROCEDURAL TEXTURES
   ==========================================================================
   All in-scene art is drawn to canvases at runtime from the config data.
   Nothing to download, instantly re-themes, and crisp at any size.
   `whenFontsReady()` is awaited by the loader so text uses the web font.
   ==========================================================================*/
import * as THREE from 'three'
import { portfolio, type Certificate, type Project } from '../config/portfolio'
import { theme } from '../config/theme'
import { mulberry32 } from './utils'

const FONT = '"Sora", "Inter", system-ui, sans-serif'
const C = theme.colors

let fontsPromise: Promise<void> | null = null
export function whenFontsReady(): Promise<void> {
  if (!fontsPromise) {
    fontsPromise = new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, 2000)
      try {
        if (document.fonts?.ready) {
          document.fonts.ready.then(() => {
            clearTimeout(timer)
            resolve()
          })
          // warm up the exact faces we draw with
          void document.fonts.load(`800 100px ${FONT}`)
          void document.fonts.load(`600 100px ${FONT}`)
          void document.fonts.load(`400 100px ${FONT}`)
        }
      } catch {
        /* older browser — fine, fallback fonts */
      }
    })
  }
  return fontsPromise
}

function makeCanvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')!
  return [c, ctx] as const
}

function toTexture(c: HTMLCanvasElement): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

const texCache = new Map<string, THREE.CanvasTexture>()
const canvasCache = new Map<string, HTMLCanvasElement>()
const urlCache = new Map<string, string>()

function cached(key: string, setup: (c: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => void): HTMLCanvasElement {
  const hit = canvasCache.get(key)
  if (hit) return hit
  const c = document.createElement('canvas')
  const ctx = c.getContext('2d')!
  setup(c, ctx)
  canvasCache.set(key, c)
  return c
}

function tex(key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const hit = texCache.get(key)
  if (hit) return hit
  const c = cached(key, (cv, cx) => {
    cv.width = w
    cv.height = h
    draw(cx)
  })
  const t = toTexture(c)
  texCache.set(key, t)
  return t
}

/** PNG data-url of a cached canvas (used by DOM modals). */
export function dataUrl(key: string): string {
  const hit = urlCache.get(key)
  if (hit) return hit
  const c = canvasCache.get(key)
  if (!c) return ''
  const url = c.toDataURL('image/png')
  urlCache.set(key, url)
  return url
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = word
      if (lines.length === maxLines) break
    } else {
      line = test
    }
  }
  if (lines.length < maxLines && line) lines.push(line)
  return lines
}

/* ─────────────────────────── SHIRT NAME ─────────────────────────── */
export function nameTexture(): THREE.CanvasTexture {
  return tex('name', 1024, 448, (ctx) => {
    ctx.clearRect(0, 0, 1024, 448)
    const name = portfolio.name.toUpperCase()
    let size = 185
    ctx.font = `800 ${size}px ${FONT}`
    let w = ctx.measureText(name).width
    if (w > 880) {
      size = Math.floor((size * 880) / w)
      ctx.font = `800 ${size}px ${FONT}`
      w = ctx.measureText(name).width
    }
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.shadowColor = 'rgba(130, 225, 255, 0.6)'
    ctx.shadowBlur = 22
    ctx.fillStyle = '#eaf6ff'
    ctx.fillText(name, 512, 195)
    ctx.shadowBlur = 0
    ctx.fillStyle = C.accent
    ctx.globalAlpha = 0.9
    ctx.fillRect(512 - w / 2 / 1.6, 292, w / 1.6, 7)
    ctx.globalAlpha = 0.55
    ctx.font = `600 40px ${FONT}`
    ctx.fillStyle = '#9fd9ff'
    ctx.fillText('— DEVELOPER —', 512, 352)
    ctx.globalAlpha = 1
  })
}

/* ─────────────────────────── CERTIFICATES ─────────────────────────── */
export function certTexture(cert: Certificate, idx: number): THREE.CanvasTexture {
  const key = `cert-${idx}-${cert.title}`
  return tex(key, 1280, 800, (ctx) => {
    const bg = ctx.createLinearGradient(0, 0, 0, 800)
    bg.addColorStop(0, '#0c1222')
    bg.addColorStop(1, '#070b14')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, 1280, 800)

    // soft accent glow top-right
    const glow = ctx.createRadialGradient(1050, 120, 0, 1050, 120, 520)
    glow.addColorStop(0, 'rgba(69, 224, 255, 0.10)')
    glow.addColorStop(1, 'rgba(69, 224, 255, 0)')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, 1280, 800)

    // double frame
    ctx.strokeStyle = 'rgba(69, 224, 255, 0.85)'
    ctx.lineWidth = 3
    ctx.strokeRect(28, 28, 1224, 744)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)'
    ctx.lineWidth = 1
    ctx.strokeRect(44, 44, 1192, 712)
    // corner ticks
    ctx.strokeStyle = C.accent
    ctx.lineWidth = 5
    const corners: [number, number, number, number][] = [
      [28, 28, 1, 1],
      [1252, 28, -1, 1],
      [28, 772, 1, -1],
      [1252, 772, -1, -1],
    ]
    for (const [x, y, sx, sy] of corners) {
      ctx.beginPath()
      ctx.moveTo(x + sx * 34, y)
      ctx.lineTo(x, y)
      ctx.lineTo(x, y + sy * 34)
      ctx.stroke()
    }

    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `600 34px ${FONT}`
    ctx.fillStyle = 'rgba(238, 243, 251, 0.72)'
    ctx.save()
    ctx.translate(640, 150)
    ;(ctx as unknown as { letterSpacing?: string }).letterSpacing = '16px'
    ctx.fillText('CERTIFICATE', 0, 0)
    ctx.restore()
    ctx.font = `400 24px ${FONT}`
    ctx.fillStyle = C.textMuted
    ctx.fillText('OF  COMPLETION', 640, 196)

    // title (max 2 lines)
    ctx.font = `700 62px ${FONT}`
    ctx.fillStyle = '#f2f7ff'
    const lines = wrapText(ctx, cert.title, 980, 2)
    const lh = 74
    const y0 = lines.length === 2 ? 300 : 330
    lines.forEach((ln, i) => ctx.fillText(ln, 640, y0 + i * lh))

    // issuer
    ctx.font = `500 34px ${FONT}`
    ctx.fillStyle = '#a8b7cf'
    ctx.fillText(cert.issuer, 640, y0 + lines.length * lh + 18)

    // date
    ctx.font = `600 30px ${FONT}`
    ctx.fillStyle = C.accent
    ctx.fillText(cert.date, 640, y0 + lines.length * lh + 72)

    // id
    ctx.textAlign = 'left'
    ctx.font = `500 22px ${FONT}`
    ctx.fillStyle = 'rgba(148, 163, 189, 0.6)'
    ctx.fillText(`ID · CERT-${String(idx + 1).padStart(3, '0')}`, 60, 726)

    // seal
    const sx = 1120
    const sy = 668
    ctx.strokeStyle = 'rgba(69, 224, 255, 0.9)'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(sx, sy, 56, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([4, 6])
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(sx, sy, 45, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.textAlign = 'center'
    ctx.font = `400 40px ${FONT}`
    ctx.fillStyle = C.accent
    ctx.fillText('★', sx, sy - 4)
    ctx.font = `700 15px ${FONT}`
    ctx.fillText('VERIFIED', sx, sy + 24)
  })
}

/* ─────────────────────────── PROJECT COVERS ─────────────────────────── */
const PROJECT_PALETTE = ['#45e0ff', '#8a6bff', '#3ddc97', '#ffb454', '#ff6b9d', '#5aa9ff']

export function projectArtTexture(p: Project, idx: number): THREE.CanvasTexture {
  const key = `proj-${idx}-${p.title}`
  const c0 = PROJECT_PALETTE[idx % PROJECT_PALETTE.length]
  return tex(key, 1024, 640, (ctx) => {
    ctx.fillStyle = '#070b14'
    ctx.fillRect(0, 0, 1024, 640)
    const rnd = mulberry32(idx * 9301 + 49297)

    const glow = ctx.createRadialGradient(760, 170, 0, 760, 170, 460)
    glow.addColorStop(0, hexA(c0, 0.2))
    glow.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, 1024, 640)

    // abstract motif (varies per project)
    ctx.strokeStyle = hexA(c0, 0.4)
    ctx.fillStyle = hexA(c0, 0.5)
    const motif = idx % 3
    if (motif === 0) {
      // node network
      const pts: [number, number][] = []
      for (let i = 0; i < 16; i++) pts.push([120 + rnd() * 780, 80 + rnd() * 420])
      ctx.lineWidth = 1
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i][0] - pts[j][0]
          const dy = pts[i][1] - pts[j][1]
          if (dx * dx + dy * dy < 90000) {
            ctx.globalAlpha = 0.25
            ctx.beginPath()
            ctx.moveTo(pts[i][0], pts[i][1])
            ctx.lineTo(pts[j][0], pts[j][1])
            ctx.stroke()
          }
        }
      }
      ctx.globalAlpha = 0.9
      for (const [x, y] of pts) {
        ctx.beginPath()
        ctx.arc(x, y, 3.5 + rnd() * 3, 0, Math.PI * 2)
        ctx.fill()
      }
    } else if (motif === 1) {
      // concentric arcs
      ctx.lineWidth = 2
      for (let r = 46; r <= 300; r += 34) {
        ctx.globalAlpha = 0.14 + 0.22 * rnd()
        ctx.beginPath()
        ctx.arc(300, 320, r, rnd() * Math.PI, rnd() * Math.PI + 1.6)
        ctx.stroke()
      }
    } else {
      // pixel grid
      const s = 34
      for (let gx = 0; gx < 26; gx++) {
        for (let gy = 0; gy < 16; gy++) {
          if (rnd() > 0.82) {
            ctx.globalAlpha = 0.25 + rnd() * 0.5
            ctx.fillRect(90 + gx * s, 90 + gy * s, s - 8, s - 8)
          }
        }
      }
    }
    ctx.globalAlpha = 1

    // giant index number
    ctx.font = `800 300px ${FONT}`
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'
    ctx.textAlign = 'right'
    ctx.fillText(String(idx + 1).padStart(2, '0'), 990, 520)

    // kicker
    ctx.textAlign = 'right'
    ctx.font = `600 22px ${FONT}`
    ctx.fillStyle = 'rgba(148, 163, 189, 0.75)'
    ctx.fillText(`PROJECT / 0${idx + 1}`, 970, 66)

    // title
    ctx.textAlign = 'left'
    ctx.font = `700 52px ${FONT}`
    ctx.fillStyle = '#f2f7ff'
    const tl = wrapText(ctx, p.title, 760, 2)
    tl.forEach((ln, i) => ctx.fillText(ln, 60, 468 + i * 56))

    // tech chips
    ctx.font = `500 22px ${FONT}`
    let cx = 60
    const cy = 468 + tl.length * 56 + 14
    for (const t of p.technologies.slice(0, 4)) {
      const w = ctx.measureText(t).width + 34
      ctx.strokeStyle = hexA(c0, 0.55)
      ctx.lineWidth = 1.5
      roundRect(ctx, cx, cy, w, 40, 20)
      ctx.stroke()
      ctx.fillStyle = 'rgba(226, 236, 250, 0.85)'
      ctx.fillText(t, cx + 17, cy + 21)
      cx += w + 14
      if (cx > 900) break
    }

    // frame
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
    ctx.lineWidth = 1
    ctx.strokeRect(14.5, 14.5, 995, 611)
  })
}

export function projectImageUrl(p: Project, idx: number): string {
  if (p.image) return p.image
  projectArtTexture(p, idx)
  return dataUrl(`proj-${idx}-${p.title}`)
}

/* ─────────────────────────── ANIMATED CODE SCREEN ─────────────────────────── */
const CODE_COLORS = ['#45e0ff', '#7ee787', '#c792ea', '#89a4c9', '#ffab70']
let codeCanvas: HTMLCanvasElement | null = null
let codeCtx: CanvasRenderingContext2D | null = null
let codeTex: THREE.CanvasTexture | null = null
let codeLines: { w: number; kind: number }[] = []
let codeLast = 0

export function getCodeScreenTexture(): THREE.CanvasTexture {
  if (codeTex) return codeTex
  const rnd = mulberry32(1234)
  codeLines = Array.from({ length: 16 }, () => ({ w: 60 + rnd() * 320, kind: Math.floor(rnd() * CODE_COLORS.length) }))
  const [c, ctx] = makeCanvas(512, 320)
  codeCanvas = c
  codeCtx = ctx
  drawCode()
  codeTex = toTexture(c)
  return codeTex
}

function drawCode() {
  const ctx = codeCtx!
  ctx.fillStyle = '#0a0f1e'
  ctx.fillRect(0, 0, 512, 320)
  // window chrome
  ctx.fillStyle = '#0e1526'
  ctx.fillRect(0, 0, 512, 26)
  ;['#ff5f57', '#febc2e', '#28c840'].forEach((col, i) => {
    ctx.fillStyle = col
    ctx.beginPath()
    ctx.arc(16 + i * 18, 13, 5, 0, Math.PI * 2)
    ctx.fill()
  })
  ctx.font = `500 11px ${FONT}`
  ctx.fillStyle = 'rgba(148, 163, 189, 0.7)'
  ctx.fillText('workshop.ts — campus', 70, 17)

  const lh = 17.5
  codeLines.forEach((ln, i) => {
    const y = 44 + i * lh
    ctx.fillStyle = '#39445c'
    ctx.font = `400 11px ${FONT}`
    ctx.textAlign = 'right'
    ctx.fillText(String(i + 1), 34, y)
    ctx.textAlign = 'left'
    const indent = (i % 3) * 16
    const col = CODE_COLORS[ln.kind]
    ctx.fillStyle = col
    ctx.globalAlpha = 0.85
    roundRect(ctx, 44 + indent, y - 8, ln.w / (1 + indent / 240), 8, 4)
    ctx.fill()
    // occasional "string" after the bar
    if (i % 4 === 1) {
      ctx.fillStyle = '#7ee787'
      ctx.globalAlpha = 0.5
      roundRect(ctx, 44 + indent + ln.w / (1 + indent / 240) + 8, y - 8, 30 + (i % 5) * 14, 8, 4)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  })
  // blinking cursor
  if (Math.floor(Date.now() / 500) % 2 === 0) {
    ctx.fillStyle = C.accent
    ctx.fillRect(44 + 16, 44 + 13 * lh - 8, 7, 11)
  }
  codeTex!.needsUpdate = true
}

export function codeScreenTick() {
  if (document.visibilityState !== 'visible') return
  const now = performance.now()
  if (now - codeLast < 420) return
  codeLast = now
  if (!codeTex) return
  const rnd = Math.random
  codeLines = codeLines.slice(1)
  codeLines.push({ w: 60 + rnd() * 320, kind: Math.floor(rnd() * CODE_COLORS.length) })
  drawCode()
}

/* ─────────────────────────── HOLO WALL SCREENS ─────────────────────────── */
export function holoTexture(kind: 'code' | 'stats'): THREE.CanvasTexture {
  return tex(`holo-${kind}`, 768, 384, (ctx) => {
    ctx.fillStyle = 'rgba(8, 13, 26, 0.92)'
    ctx.fillRect(0, 0, 768, 384)
    // scanlines
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)'
    for (let y = 0; y < 384; y += 4) ctx.fillRect(0, y, 768, 1)
    ctx.strokeStyle = 'rgba(69, 224, 255, 0.4)'
    ctx.lineWidth = 2
    ctx.strokeRect(10, 10, 748, 364)

    if (kind === 'code') {
      ctx.font = `500 15px ${FONT}`
      ctx.fillStyle = 'rgba(148, 163, 189, 0.8)'
      ctx.fillText('~/portfolio/shaders.tsx', 28, 44)
      const rnd = mulberry32(77)
      for (let i = 0; i < 15; i++) {
        const y = 76 + i * 19
        ctx.fillStyle = '#39445c'
        ctx.fillText(String(i + 1), 26, y)
        const indent = Math.floor(rnd() * 3) * 18
        ctx.fillStyle = CODE_COLORS[Math.floor(rnd() * CODE_COLORS.length)]
        ctx.globalAlpha = 0.8
        roundRect(ctx, 52 + indent, y - 10, 60 + rnd() * 380, 9, 4)
        ctx.fill()
        ctx.globalAlpha = 1
      }
    } else {
      ctx.font = `700 20px ${FONT}`
      ctx.fillStyle = '#eef3fb'
      ctx.fillText('SYSTEMS / LIVE', 28, 48)
      const rnd = mulberry32(42)
      // bars
      for (let i = 0; i < 10; i++) {
        const h = 30 + rnd() * 150
        const x = 40 + i * 46
        ctx.fillStyle = i % 3 === 0 ? C.accent2 : C.accent
        ctx.globalAlpha = 0.55
        roundRect(ctx, x, 340 - h, 26, h, 5)
        ctx.fill()
      }
      // wave
      ctx.globalAlpha = 1
      ctx.strokeStyle = 'rgba(69, 224, 255, 0.9)'
      ctx.lineWidth = 2.5
      ctx.beginPath()
      for (let x = 0; x <= 700; x += 8) {
        const y = 160 + Math.sin(x / 46) * 34 * Math.sin(x / 190)
        if (x === 0) ctx.moveTo(34 + x, y)
        else ctx.lineTo(34 + x, y)
      }
      ctx.stroke()
      ctx.font = `600 16px ${FONT}`
      ctx.fillStyle = C.accent
      ctx.fillText('● rendering @ 60fps', 40, 92)
    }
  })
}

/* ─────────────────────────── SPRITE TEXT (labels / headings) ─────────────────────────── */
export interface SpriteText {
  texture: THREE.CanvasTexture
  aspect: number
}

export function spriteText(
  text: string,
  opts: { size?: number; weight?: number; color?: string; accent?: string; glow?: boolean; letterSpacing?: number } = {},
): SpriteText {
  const { size = 64, weight = 700, color = '#eef3fb', glow = false, letterSpacing = 4 } = opts
  const key = `text|${text}|${size}|${weight}|${color}|${glow}|${letterSpacing}`
  const hit = texCache.get(key)
  if (hit) {
    const c = canvasCache.get(key)!
    return { texture: hit, aspect: c.width / c.height }
  }
  const [c, ctx] = makeCanvas(10, 10)
  ctx.font = `${weight} ${size}px ${FONT}`
  const w = Math.ceil(ctx.measureText(text).width + letterSpacing * Math.max(0, text.length - 1))
  c.width = Math.max(8, nextPow2(w + size * 0.9))
  c.height = nextPow2(size * 2.1)
  canvasCache.set(key, c)
  ctx.clearRect(0, 0, c.width, c.height)
  ctx.font = `${weight} ${size}px ${FONT}`
  ;(ctx as unknown as { letterSpacing?: string }).letterSpacing = `${letterSpacing}px`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  if (glow) {
    ctx.shadowColor = opts.accent ?? C.accent
    ctx.shadowBlur = size * 0.35
  }
  ctx.fillStyle = color
  ctx.fillText(text, c.width / 2, c.height / 2 + size * 0.05)
  const t = toTexture(c)
  texCache.set(key, t)
  return { texture: t, aspect: c.width / c.height }
}

function nextPow2(v: number): number {
  let p = 8
  while (p < v) p *= 2
  return Math.min(p, 2048)
}

/* ─────────────────────────── CONTACT PLATE ─────────────────────────── */
export function contactPlateTexture(): THREE.CanvasTexture {
  return tex('contact-plate', 1024, 420, (ctx) => {
    ctx.clearRect(0, 0, 1024, 420)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const ls = (v: string) => {
      ;(ctx as unknown as { letterSpacing?: string }).letterSpacing = v
    }
    ls('10px')
    ctx.font = `600 28px ${FONT}`
    ctx.fillStyle = C.accent
    ctx.fillText('HAVE AN IDEA? A ROLE? A MESSAGE?', 512, 66)
    ls('4px')
    ctx.font = `800 82px ${FONT}`
    ctx.shadowColor = 'rgba(69, 224, 255, 0.5)'
    ctx.shadowBlur = 26
    ctx.fillStyle = '#f2f7ff'
    ctx.fillText("LET'S BUILD", 512, 172)
    ctx.fillStyle = C.accent
    ctx.fillText('SOMETHING NEW.', 512, 278)
    ctx.shadowBlur = 0
  })
}

function hexA(hex: string, a: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${a})`
}
