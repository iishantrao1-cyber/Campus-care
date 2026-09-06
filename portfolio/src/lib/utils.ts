import * as THREE from 'three'

export const lerp = THREE.MathUtils.lerp
export const clamp = THREE.MathUtils.clamp
export const damp = THREE.MathUtils.damp

export function smoothstep(x: number, a: number, b: number): number {
  const t = clamp((x - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

/**
 * Non-uniform Catmull-Rom sampling.
 * `stops[i]` is the scroll progress at which the camera sits exactly on
 * `points[i]`; between stops we ease (smoothstep) so each beat "settles".
 */
export function catmullSegment(
  points: THREE.Vector3[],
  stops: number[],
  t: number,
  out: THREE.Vector3,
): THREE.Vector3 {
  const n = stops.length
  if (t <= stops[0]) return out.copy(points[0])
  if (t >= stops[n - 1]) return out.copy(points[n - 1])
  let i = 0
  while (i < n - 2 && t > stops[i + 1]) i++
  const i0 = Math.max(0, i - 1)
  const i1 = i
  const i2 = Math.min(n - 1, i + 1)
  const i3 = Math.min(n - 1, i + 2)
  let u = (t - stops[i1]) / (stops[i2] - stops[i1])
  u = u * u * (3 - 2 * u)
  const p0 = points[i0]
  const p1 = points[i1]
  const p2 = points[i2]
  const p3 = points[i3]
  const t2 = u * u
  const t3 = t2 * u
  out.set(
    0.5 * (2 * p1.x + (-p0.x + p2.x) * u + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
    0.5 * (2 * p1.y + (-p0.y + p2.y) * u + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
    0.5 * (2 * p1.z + (-p0.z + p2.z) * u + (2 * p0.z - 5 * p1.z + 4 * p2.z - p3.z) * t2 + (-p0.z + 3 * p1.z - 3 * p2.z + p3.z) * t3),
  )
  return out
}

export function wrapRange(v: number, len: number): number {
  return ((v % len) + len) % len
}

/** Deterministic 0..1 hash from a string (for seeded randomness). */
export function hash01(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 100000) / 100000
}

/** mulberry32 PRNG — tiny, deterministic, good enough for art. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

let scrollTween: number | null = null

/**
 * Smooth-scroll to a document offset with a custom ease (used by nav jumps —
 * we never "teleport" the story). Cancelled if the user takes over.
 */
export function tweenScrollTo(top: number, duration = 1500) {
  cancelAnimationFrame(scrollTween as number)
  const from = window.scrollY
  const delta = top - from
  const t0 = performance.now()
  const cancel = () => cancelAnimationFrame(scrollTween as number)
  window.addEventListener('wheel', cancel, { once: true, passive: true })
  window.addEventListener('touchstart', cancel, { once: true, passive: true })
  const step = (now: number) => {
    const k = clamp((now - t0) / duration, 0, 1)
    window.scrollTo(0, from + delta * easeInOutCubic(k))
    if (k < 1) scrollTween = requestAnimationFrame(step)
    else scrollTween = null
  }
  scrollTween = requestAnimationFrame(step)
}

export function scrollMax(): number {
  return Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
}

export function jumpTo(progress: number, reducedMotion: boolean) {
  if (reducedMotion) window.scrollTo(0, progress * scrollMax())
  else tweenScrollTo(progress * scrollMax())
}

/* ── body scroll lock (used while modals are open) ── */
let locks = 0
export function lockScroll() {
  locks++
  document.body.classList.add('lock')
}
export function unlockScroll() {
  locks = Math.max(0, locks - 1)
  if (!locks) document.body.classList.remove('lock')
}
