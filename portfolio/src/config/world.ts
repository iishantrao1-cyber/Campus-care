/* ============================================================================
   WORLD — SPATIAL LAYOUT, CAMERA PATH, SCROLL CHOREOGRAPHY
   ==========================================================================
   The whole journey is one continuous camera move through the world.
   `stops` are scroll progress values (0 → 1) where the camera "settles"
   on a beat; `cameraPos[i]` / `cameraLook[i]` define that beat's framing.
   If you add a zone, add matching entries to all three arrays (same index).
   ==========================================================================*/

export type V3 = [number, number, number]

export const world = {
  /* Total scrollable page height in viewport units (the "length" of the story). */
  scrollLengthVh: 900,

  /* ── Camera beats (index = beat, value = scroll progress) ── */
  stops: [0, 0.12, 0.215, 0.3, 0.42, 0.55, 0.68, 0.82, 0.93, 1],

  cameraPos: [
    [0.0, 1.44, 1.62], // 0 hero — waist-up framing of the character
    [0.85, 1.5, 2.35], // 1 step aside as he starts walking
    [1.55, 1.62, -1.4], // 2 following the walk
    [1.3, 1.52, -3.75], // 3 beside the desk — seated, typing
    [2.55, 1.66, -4.6], // 4 orbit right — ABOUT panel appears
    [0.0, 1.85, -11.0], // 5 approach PROJECTS
    [0.0, 1.8, -19.3], // 6 CERTIFICATES corridor
    [0.0, 2.15, -30.1], // 7 SKILLS arena
    [0.0, 1.6, -41.4], // 8 approach CONTACT
    [0.0, 1.42, -43.7], // 9 final push-in
  ] as V3[],

  cameraLook: [
    [-0.3, 1.24, 0.15], // hero — aim slightly left so the character sits right-of-center (text lives on the left)
    [0.2, 1.1, -0.9],
    [0.0, 1.05, -3.9],
    [0.0, 1.18, -5.95],
    [-0.55, 1.32, -5.9],
    [0.0, 1.5, -15.4],
    [0.0, 1.62, -24.0],
    [0.0, 1.5, -34.8],
    [0.0, 1.3, -45.3],
    [0.0, 1.28, -45.6],
  ] as V3[],

  /* ── Character travel ──────────────────────────────────── */
  character: {
    start: [0, 0, 0.15] as V3,
    seat: [0, 0, -5.42] as V3,
  },

  /* ── Zone anchors ───────────────────────────────────────── */
  desk: { pos: [0, 0, -6.15] as V3 },
  projects: { center: [0, 1.55, -15.4] as V3 },
  certs: {
    rows: [
      { z: -23.4, y: 1.78, scale: 1, alpha: 1, dir: 1 },
      { z: -26.4, y: 1.5, scale: 0.8, alpha: 0.5, dir: -1 },
    ],
  },
  skills: { center: [0, 1.55, -34.8] as V3, planeZ: -34.8 },
  contact: { pos: [0, 0, -45.3] as V3 },

  /* ── DOM section windows (scroll progress) ──────────────── */
  sectionWindows: {
    home: [0, 0.09],
    about: [0.3, 0.455],
    projects: [0.455, 0.605],
    certs: [0.605, 0.76],
    skills: [0.76, 0.905],
    contact: [0.905, 1.01],
  } as Record<string, [number, number]>,

  /* ── Navigation targets (scroll progress to land on) ────── */
  sections: [
    { id: 'home', label: 'Home', at: 0 },
    { id: 'about', label: 'About', at: 0.365 },
    { id: 'projects', label: 'Projects', at: 0.525 },
    { id: 'certs', label: 'Certificates', at: 0.668 },
    { id: 'skills', label: 'Skills', at: 0.825 },
    { id: 'contact', label: 'Contact', at: 0.975 },
  ] as { id: string; label: string; at: number }[],
}

export function sectionFor(p: number): string {
  for (const [id, [a, b]] of Object.entries(world.sectionWindows)) {
    if (p >= a && p <= b) return id
  }
  return p < 0.3 ? 'walk' : 'contact'
}
