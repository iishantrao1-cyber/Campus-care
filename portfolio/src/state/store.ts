import { useSyncExternalStore } from 'react'

export type Tier = 'high' | 'mid' | 'low'

export interface AppState {
  ready: boolean // loading sequence finished — 3D scene is live
  section: string // active journey window: home | walk | about | projects | certs | skills | contact
  selectedProject: number | null
  selectedCert: number | null
  selectedSkill: number | null
  tier: Tier
  reducedMotion: boolean
  dprCap: number
}

const initial: AppState = {
  ready: false,
  section: 'home',
  selectedProject: null,
  selectedCert: null,
  selectedSkill: null,
  tier: 'high',
  reducedMotion: false,
  dprCap: 2,
}

let state: AppState = initial
const subs = new Set<() => void>()

export const store = {
  get: (): AppState => state,
  set(patch: Partial<AppState>) {
    if (Object.keys(patch).length === 0) return
    state = { ...state, ...patch }
    subs.forEach((fn) => fn())
  },
  subscribe(fn: () => void) {
    subs.add(fn)
    return () => {
      subs.delete(fn)
    }
  },
}

/** Subscribe to a piece of app state (selector must return a primitive). */
export function useApp<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(store.subscribe, () => selector(store.get()))
}
