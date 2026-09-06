/* ============================================================================
   THEME — COLORS, LIGHTING, FOG, GLOW, GRID, ENVIRONMENT INTENSITY
   ==========================================================================
   Every visual dial of the 3D world lives here.
   Colors also feed the DOM UI (they are copied to CSS variables at startup).
   ==========================================================================*/

export const theme = {
  /* ── Palette ─────────────────────────────────────────────── */
  colors: {
    background: '#050810', // scene background + page background
    fog: '#050810', // match background for seamless depth fade
    accent: '#45e0ff', // primary neon (cyan)
    accent2: '#8a6bff', // secondary neon (violet)
    text: '#eef3fb',
    textMuted: '#94a3bd',
    panel: '#0a0f1e',
    floor: '#070b14',
    /* Character */
    skin: '#e8b48c',
    hair: '#1b2130',
    shirt: '#1d2c49', // T-shirt color — the name is printed on it
    pants: '#151d2e',
  },

  /* ── Atmosphere ──────────────────────────────────────────── */
  fog: { enabled: true, near: 9, far: 40 },
  grid: {
    visible: true,
    cellSize: 0.6,
    sectionSize: 3,
    opacity: 0.5, // overall shader fade strength
    fadeDistance: 26,
  },

  /* ── Lighting (intensity multipliers) ───────────────────── */
  lighting: {
    ambient: 0.4, // hemisphere fill
    key: 1.15, // main directional (casts the shadow)
    rim: 0.5, // cool back light
    accentPoints: 4.5, // per-zone accent point lights
  },

  /* ── Glow / emissive ─────────────────────────────────────── */
  glow: {
    edges: 1.1, // emissive strength of accent edge strips
    sphereBase: 0.32, // skill sphere idle emissive
    sphereHover: 1.05, // skill sphere hovered emissive
    holo: 0.85, // holographic wall screens
  },

  /* ── Environment ─────────────────────────────────────────── */
  environment: {
    intensity: 1, // master scale for decorative density
    particles: { count: 130, size: 1.7, speed: 0.32, opacity: 0.34 },
    holoScreens: true,
    /* Floor reflections — desktop / high-end only (auto-disabled elsewhere) */
    reflector: { resolution: 1024, blur: [300, 100] as [number, number], mirror: 0.38 },
  },

  /* ── Camera ──────────────────────────────────────────────── */
  camera: {
    fov: 44,
    fovPortrait: 60, // wider framing on narrow screens
    smoothing: 3.6, // scroll damping (higher = snappier)
    sway: 0.02, // idle camera breathing amplitude
    parallax: 0.14, // pointer parallax strength (0 = off)
  },

  /* ── Animation ───────────────────────────────────────────── */
  animation: {
    speed: 1, // global multiplier for world motion
    walk: 1, // character walk cycle speed
    typing: 1, // typing oscillation speed
    certSpeedNear: 0.55, // certificate conveyor, near row (units / s)
    certSpeedFar: 0.34, // far row
    sphereTurbulence: 1, // ambient drift of skill spheres
  },

  /* ── Physics (skill spheres) ─────────────────────────────── */
  physics: {
    spring: 2.4, // pull back to home position
    damping: 0.9, // velocity retention per 60fps step
    cursorRadius: 1.5, // how close the pointer "touches"
    cursorForce: 6.0, // repulsion strength from the pointer
    neighborForce: 3.4, // sphere ↔ sphere push
  },
} as const

export type Theme = typeof theme
