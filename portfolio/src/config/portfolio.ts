/* ============================================================================
   PORTFOLIO DATA — EDIT THIS FILE TO UPDATE YOUR SITE
   ==========================================================================
   Everything the visitor sees as content lives here.
   Add / remove / reorder projects, certificates and skills by editing the
   arrays — no component changes needed.

   Markers:  ← EDIT ME  means the default is a placeholder you should replace.
   ==========================================================================*/

export interface Project {
  title: string
  tagline: string
  description: string
  role: string
  technologies: string[]
  features: string[]
  github: string
  liveDemo: string
  /** Optional image URL / path (put files in /public).
   *  Leave as '' to auto-generate a stylized cover from the data. */
  image?: string
}

export interface Certificate {
  title: string
  issuer: string
  date: string
  /** Optional: put an image/PDF in /public and reference it, e.g. '/certs/python.png'.
   *  Leave as '' to auto-render a designed certificate from title/issuer/date. */
  image?: string
  credentialLink: string
}

export interface Skill {
  name: string
  /** 1–5 — controls sphere size + level bar */
  level: number
  blurb: string
}

export const portfolio = {
  /* ─────────────────────────── PERSONAL ─────────────────────────── */
  name: 'IISHAN', // ← EDIT ME — shown big on the character's shirt & hero
  fullName: 'Iishan Rao', // ← EDIT ME
  role: 'Developer • Builder • Learner',
  eyebrow: 'PORTFOLIO · 2026',
  email: 'your.email@example.com', // ← EDIT ME
  location: 'India', // ← EDIT ME
  resumeUrl: '/resume.pdf', // ← EDIT ME — drop your PDF into /public as resume.pdf
  socials: {
    github: 'https://github.com/iishantrao1-cyber',
    linkedin: 'https://www.linkedin.com/in/your-handle', // ← EDIT ME
    twitter: '',
    instagram: '',
  },

  /* ─────────────────────────── ABOUT ──────────────────────────── */
  about: {
    bio: 'I am a computer-science student who loves turning ideas into things that actually run. I build full-stack web apps, and lately I have been deep in WebGL, 3D interfaces and LLM-powered tools. This site is itself one of my projects — a scroll-driven 3D world built with React Three Fiber.',
    learning: ['Three.js & WebGL', 'React 19', 'System design', 'LLM apps'],
    building: ['3D web experiences', 'Full-stack products', 'Developer tools'],
    interests: ['Interactive design', 'Artificial intelligence', 'Open source', 'Gaming'],
    education: {
      school: 'Your University', // ← EDIT ME
      course: 'B.Tech, Computer Science', // ← EDIT ME
      period: '2023 — 2027', // ← EDIT ME
    },
    goal: 'To become a software engineer who ships polished, human-centred products — currently open to internships and collaborative projects.', // ← EDIT ME
  },

  /* ─────────────────────────── SECTION TITLES ─────────────────────────── */
  sectionTitles: {
    about: { kicker: '01 — WHO I AM', title: 'About' },
    projects: { kicker: '02 — SELECTED WORK', title: 'Projects' },
    certs: { kicker: '03 — PROOF OF LEARNING', title: 'Certificates' },
    skills: { kicker: '04 — MY TOOLKIT', title: 'Skills' },
    contact: { kicker: '05 — END OF LINE', title: 'Contact' },
  },

  /* ─────────────────────────── PROJECTS ───────────────────────────
     Add a project: copy one {} block, paste it, edit. That's it.   */
  projects: [
    {
      title: 'Campus Care',
      tagline: 'SIH full-stack grievance portal',
      description:
        'A production-oriented student complaint management system for colleges. Students file verified, trackable tickets; staff resolve department-scoped queues; admins manage users, directories and assignments — with OTP email verification and role-based access control.',
      role: 'Solo developer — Smart India Hackathon project',
      technologies: ['Next.js', 'TypeScript', 'React', 'PostgreSQL', 'Drizzle ORM', 'Tailwind CSS'],
      features: [
        'College-directory-verified identities with OTP email proof',
        'Role-based student / staff / admin control rooms',
        'Admin MFA via TOTP authenticator + backup codes',
        'Public ticket tracker (no login needed)',
      ],
      github: 'https://github.com/iishantrao1-cyber/Campus-care',
      liveDemo: '',
    },
    {
      title: '3D Portfolio World',
      tagline: 'This site — scroll-driven 3D journey',
      description:
        'A fully interactive 3D portfolio: an animated character, a scroll-driven camera journey, physics-reactive skill spheres and a moving certificate conveyor. Built to be fast on laptops, tablets and phones.',
      role: 'Design & development',
      technologies: ['React', 'Three.js', 'React Three Fiber', 'GSAP', 'TypeScript'],
      features: [
        'Procedural character with scroll-driven walk → sit → type animation',
        'Adaptive quality tiers for low-end devices',
        'Data-driven content — everything editable from one config file',
        'Reduced-motion & keyboard accessibility',
      ],
      github: 'https://github.com/iishantrao1-cyber/Campus-care/tree/main/portfolio',
      liveDemo: '',
    },
    {
      title: 'AI Study Buddy', // ← EXAMPLE PROJECT — replace with your own
      tagline: 'LLM study companion with RAG',
      description:
        'A chat assistant that answers questions from your own lecture notes and PDFs using retrieval-augmented generation, with citation links back to the source material.',
      role: 'Full-stack development',
      technologies: ['Python', 'FastAPI', 'React', 'PostgreSQL', 'OpenAI API'],
      features: [
        'Document ingestion & chunked embeddings',
        'Cited answers with source highlighting',
        'Per-user study workspaces',
      ],
      github: 'https://github.com/iishantrao1-cyber',
      liveDemo: '',
    },
    {
      title: 'DevFlow CLI', // ← EXAMPLE PROJECT — replace with your own
      tagline: 'Terminal productivity toolkit',
      description:
        'A command-line toolkit that chains git, npm and docs into repeatable workflows — release notes, changelog commits and PR summaries from one command.',
      role: 'Design & development',
      technologies: ['Node.js', 'TypeScript', 'Commander.js'],
      features: [
        'Scriptable workflow plugins',
        'Conventional-commit based changelog generation',
        'Works offline, zero telemetry',
      ],
      github: 'https://github.com/iishantrao1-cyber',
      liveDemo: '',
    },
  ] satisfies Project[],

  /* ─────────────────────────── CERTIFICATES ───────────────────────────
     Add a certificate: copy one {} block, paste it, edit.
     For a real certificate image/PDF: add the file to /public/certs and set
     image: '/certs/your-file'. The conveyor + viewer will use it directly.  */
  certificates: [
    {
      title: 'Python for Everybody',
      issuer: 'University of Michigan · Coursera',
      date: '2025',
      image: '',
      credentialLink: '',
    },
    {
      title: 'CS50x — Introduction to Computer Science',
      issuer: 'Harvard University · edX',
      date: '2025',
      image: '',
      credentialLink: '',
    },
    {
      title: 'Responsive Web Design',
      issuer: 'freeCodeCamp',
      date: '2024',
      image: '',
      credentialLink: '',
    },
    {
      title: 'JavaScript Algorithms & Data Structures',
      issuer: 'freeCodeCamp',
      date: '2024',
      image: '',
      credentialLink: '',
    },
    {
      title: 'Git & GitHub Essentials',
      issuer: 'Udemy',
      date: '2024',
      image: '',
      credentialLink: '',
    },
    {
      title: 'Web Development Bootcamp',
      issuer: 'Udemy',
      date: '2025',
      image: '',
      credentialLink: '',
    },
  ] satisfies Certificate[],

  /* ─────────────────────────── SKILLS ───────────────────────────
     Each entry becomes a floating physics sphere in the final arena.
     level 1–5. The "used in projects" list is computed automatically.   */
  skills: [
    { name: 'TypeScript', level: 4, blurb: 'End-to-end type safety across my full-stack projects.' },
    { name: 'JavaScript', level: 4, blurb: 'The language of everything I build in the browser.' },
    { name: 'React', level: 4, blurb: 'Component-driven UIs, hooks, suspense, performance work.' },
    { name: 'Next.js', level: 4, blurb: 'App Router, server components, server actions.' },
    { name: 'Python', level: 4, blurb: 'Scripting, data tooling and backend services.' },
    { name: 'Node.js', level: 3, blurb: 'APIs, auth flows and CLI tooling.' },
    { name: 'HTML / CSS', level: 5, blurb: 'Semantics, modern layout, motion and polish.' },
    { name: 'Tailwind CSS', level: 4, blurb: 'Utility-first design systems that stay consistent.' },
    { name: 'PostgreSQL', level: 3, blurb: 'Relational modelling and query design with Drizzle.' },
    { name: 'Git & GitHub', level: 5, blurb: 'Daily driver — branching, reviews, CI.' },
    { name: 'Three.js', level: 3, blurb: 'WebGL scenes, shaders, scroll-driven cameras.' },
    { name: 'AI & LLMs', level: 3, blurb: 'Prompting, RAG pipelines, tool-calling agents.' },
    { name: 'System Design', level: 2, blurb: 'Learning architecture of large distributed systems.' },
    { name: 'Problem Solving', level: 4, blurb: 'Algorithms, debugging, turning vague specs into code.' },
  ] satisfies Skill[],

  /* ─────────────────────────── CONTACT ─────────────────────────── */
  contact: {
    heading: "The journey doesn't end here.",
    subheading: 'Have an idea, a role, or just want to say hi — my inbox is open.',
    note: 'Currently open to internships & collaborations',
  },
} as const

export type Portfolio = typeof portfolio
