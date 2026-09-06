# Interactive 3D Portfolio

A fully 3D, scroll-driven personal portfolio built as one continuous world:
an animated character (with **your name on his shirt**) walks to his desk,
sits down and starts coding as you scroll, then the camera flies you through
projects → a moving certificate conveyor → a physics skill arena → the contact
finale.

Built with **React 19 · Three.js · React Three Fiber · drei · GSAP · TypeScript · Vite**.
No 3D model files, no HDR downloads — every visual is generated procedurally
from the config data, so it loads fast and themes instantly.

---

## Quick start

```bash
cd portfolio
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build → dist/
npm run preview    # serve the production build
```

Deploy `dist/` to any static host (Vercel, Netlify, GitHub Pages). The build
uses relative paths (`base: './'`), so it works from a sub-path too.

---

## ⚡ Customize — everything lives in `src/config/`

You never need to touch components to update your portfolio.

### 1. Personal info, projects, certificates, skills
**`src/config/portfolio.ts`** — the single source of content.

- **Name** — `name` (printed big on the character's shirt + hero).
- **Email / socials / resume** — set them; for the resume drop your PDF into
  `public/resume.pdf` (already referenced by `resumeUrl`).
- **About** — bio, learning, building, interests, education, goal.
- **Projects** — add one by copying a `{ … }` block:
  ```ts
  {
    title: 'My New Project',
    tagline: 'one-line pitch',
    description: '…',
    role: 'What I did',
    technologies: ['React', 'Node.js'],
    features: ['…', '…'],
    github: 'https://github.com/…',
    liveDemo: 'https://…',          // '' hides the button
    image: '',                      // optional: '/covers/x.png' in /public
  }
  ```
  Leave `image` empty and a stylized cover is generated for you.
- **Certificates** — add one by copying a block:
  ```ts
  {
    title: 'My Certificate',
    issuer: 'Provider',
    date: '2026',
    image: '',            // optional: '/certs/x.png' (or PDF) in /public
    credentialLink: 'https://…',   // '' hides the "Original" button
  }
  ```
  Without an image, a designed certificate is rendered from the fields.
- **Skills** — one entry per floating sphere: `{ name, level (1–5), blurb }`.
  "Projects using it" in the panel is computed automatically.
- **Section titles / contact copy** — also in this file.

### 2. Look & feel
**`src/config/theme.ts`**

- `colors` — background, fog, accent, accent2, text, and the character's
  shirt/skin/hair colors.
- `fog`, `grid`, `lighting`, `glow` — atmosphere dials.
- `environment` — particle count/size/speed, holo screens, floor reflections.
- `camera` — FOV, scroll smoothing, idle sway, pointer parallax.
- `animation` — global speed, walk/typing speed, certificate conveyor speed.
- `physics` — skill-sphere spring, damping, pointer force.

Colors are copied to CSS variables at boot, so DOM UI re-themes automatically.

### 3. The journey itself
**`src/config/world.ts`**

- `scrollLengthVh` — total story length (page height).
- `stops` / `cameraPos` / `cameraLook` — the camera beat path. Each beat
  settles on a section; add a zone = add matching entries to all three.
- Zone anchors (desk, projects, certs, skills, contact positions).
- `sections` — nav items + jump targets. `sectionWindows` — when each DOM
  panel is on screen.

---

## Where things are

```
src/
├── config/        ← EDIT HERE (portfolio.ts, theme.ts, world.ts)
├── 3d/            Experience (canvas), CameraRig, Environment,
│                  Character (procedural, animated), DeskRig,
│                  ProjectsZone, CertsZone, SkillsZone, ContactZone
├── components/    DOM UI: Nav, Hero, AboutPanel, modals, SkillPanel,
│                  ContactSection, ScrollRail, Btn3D (physical buttons)
├── lib/           textures.ts (procedural art), tier.ts (device quality),
│                  utils.ts (math, scroll tween, scroll lock)
├── state/         tiny store, scroll & pointer channels
└── styles.css     all UI styling (CSS variables from theme.ts)
```

## Performance & accessibility (built in)

- **Device tiers** (`lib/tier.ts`): high/mid/low — pixel ratio, shadows,
  floor reflections, particle counts and sphere glow shells scale down
  automatically; `PerformanceMonitor` further lowers DPR if FPS drops.
- **Reduced motion**: conveyor stops, camera sway/parallax off, sphere
  turbulence softened, nav jumps become instant.
- **Keyboard & screen readers**: all actions are real buttons/links, modals
  close on Esc, arrows switch certificates, and the full content summary
  (projects with links, certificates, skills, contact) exists as hidden text.

## Tips

- Keep the name on the shirt ≤ 8 characters for the best fit (it auto-shrinks
  for longer names).
- Certificate images look best at 16:10 (e.g. 1280×800).
- If you add many projects (>6), increase the arc spacing in
  `src/3d/ProjectsZone.tsx` (`layout`).
