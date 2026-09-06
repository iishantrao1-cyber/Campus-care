import type { Tier } from '../state/store'

/**
 * Cheap heuristic device-tier detection.
 *   high — desktop-class GPU: shadows, floor reflections, full particles
 *   mid  — laptops / newer phones: no shadows or reflector, fewer particles
 *   low  — older / low-memory devices: minimal effects, low pixel ratio
 * The runtime PerformanceMonitor additionally lowers dpr if FPS drops.
 */
export function detectTier(): Tier {
  if (typeof navigator === 'undefined') return 'high'
  const cores = navigator.hardwareConcurrency ?? 8
  const mem = (navigator as unknown as { deviceMemory?: number }).deviceMemory ?? 8
  const coarse = matchMedia('(pointer: coarse)').matches
  const smallScreen = Math.min(screen.width, screen.height) < 640

  if (cores <= 3 || mem <= 2) return 'low'
  if (coarse && (cores <= 5 || mem <= 4)) return 'low'
  if (smallScreen && cores <= 4) return 'low'
  if (coarse || cores <= 6 || mem <= 4) return 'mid'
  return 'high'
}

export interface TierSettings {
  dpr: number
  shadows: boolean
  reflector: boolean
  particles: number
  glowShell: boolean
  antialias: boolean
}

export const tierSettings: Record<Tier, TierSettings> = {
  high: { dpr: 2, shadows: true, reflector: true, particles: 1, glowShell: true, antialias: true },
  mid: { dpr: 1.5, shadows: false, reflector: false, particles: 0.4, glowShell: true, antialias: true },
  low: { dpr: 1, shadows: false, reflector: false, particles: 0.25, glowShell: false, antialias: false },
}

export function prefersReducedMotion(): boolean {
  return typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
}
