# Campus Care — Student Complaint Portal

**Smart India Hackathon (SIH) · Fullstack grievance redressal web application**

Campus Care is a production-oriented student complaint management system for colleges and universities. Students file verified, trackable tickets; staff resolve department-scoped queues; admins manage users, directories, and assignments — with secure authentication, OTP email verification, and role-based access control.

---

## Live features

| Area | What it does |
| --- | --- |
| **Public home** | Explains the portal, categories, and verified access flow |
| **Student registration** | Student ID + official email must match college directory → OTP → account |
| **Staff registration** | Employee ID + official email must match staff directory → OTP → account |
| **Admin accounts** | Never self-registered; bootstrap env or existing admin provisions them |
| **Student desk** | File complaints, track own tickets, add updates, rate resolutions |
| **Public tracker** | Track any ticket by ID (e.g. `CC-2026-0001`) without login |
| **Staff / Admin control room** | Filter queue, update status, assign staff, departmental scoping |
| **Directory & users** | Import authorized students/staff (CSV), manage accounts, MFA admin setup |
| **Password reset** | OTP to verified college email |
| **Admin MFA** | TOTP authenticator + backup codes |

---

## Tech stack (tools used)

| Layer | Tool | Why |
| --- | --- | --- |
| Framework | **Next.js 16** (App Router) | Server Components, Server Actions, file-based routes |
| Language | **TypeScript** | End-to-end type safety with Drizzle models |
| UI | **React 19** | Component model for forms and interactive pieces |
| Styling | **Tailwind CSS v4** | Utility-first design; custom campus palette |
| Database | **PostgreSQL** | Relational integrity for users, tickets, directories |
| ORM | **Drizzle ORM** + **drizzle-kit** | Parameterized SQL, schema push, typed queries |
| DB driver | **node-postgres (`pg`)** | Connection pool to PostgreSQL |
| Auth crypto | **Node.js `crypto`** | `scrypt` password hashes, HMAC sessions, SHA-256 OTPs |
| MFA | **Custom TOTP (`src/lib/totp.ts`)** | RFC-style authenticator codes + backup codes |
| Mail | **SMTP env + admin outbox** | OTP delivery; outbox fallback when SMTP unset |
| Fonts | **next/font** (Outfit + Fraunces) | Brand typography without extra CDN config |
| Runtime | **Node.js** | Server Actions and API routes |

**Not used (intentionally):** plain-text passwords, client-trusted roles, public demo student logins in production mode, Auth0/Clerk (kept self-hosted for SIH control).

---

## Project structure

```text
campus-care/
├── .env.example              # Template for secrets (copy to .env)
├── .gitignore
├── drizzle.config.json       # Drizzle → PostgreSQL
├── package.json
├── public/images/            # Logo and static assets
├── src/
│   ├── app/
│   │   ├── actions/
│   │   │   ├── auth.ts                 # Login, register, OTP, reset
│   │   │   ├── admin-directory.ts      # Directory import, admin provision
│   │   │   └── complaints.ts           # File / update / feedback tickets
│   │   ├── admin/
│   │   │   ├── page.tsx                # Control room queue
│   │   │   ├── directory/page.tsx      # IT directory & users
│   │   │   └── complaints/[id]/page.tsx
│   │   ├── api/health/route.ts
│   │   ├── complaints/new/page.tsx
│   │   ├── complaints/[id]/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── reset-password/page.tsx
│   │   ├── track/page.tsx
│   │   ├── verify/page.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── auth-forms.tsx
│   │   ├── admin-directory-forms.tsx
│   │   ├── complaint-forms.tsx
│   │   ├── site-header.tsx
│   │   ├── site-footer.tsx
│   │   └── icons.tsx
│   ├── db/
│   │   ├── index.ts          # Drizzle client + pool
│   │   └── schema.ts         # All tables
│   └── lib/
│       ├── auth.ts           # Sessions, hashing, OTP, rate limits
│       ├── constants.ts      # Categories, statuses, departments
│       ├── directory.ts      # Authorized ID lookups
│       ├── mail.ts           # Email / outbox
│       ├── seed.ts           # Admin bootstrap only
│       ├── totp.ts           # MFA
│       └── utils.ts          # Formatting helpers
└── docs/
    └── BUILD_GUIDE.md        # Step-by-step rebuild guide
```

---

## Quick start

### 1. Prerequisites

- Node.js 20+
- PostgreSQL 14+
- npm

### 2. Install

```bash
git clone <your-repo-url> campus-care
cd campus-care
npm install
```

### 3. Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL=postgresql://USER:PASSWORD@127.0.0.1:5432/campus_care
SESSION_SECRET=generate-a-long-random-string-here
APP_URL=http://localhost:3000

# First admin (only when no admin exists yet)
ADMIN_BOOTSTRAP_EMAIL=grievance.admin@college.edu
ADMIN_BOOTSTRAP_PASSWORD=UseAStrongPassword10+
ADMIN_BOOTSTRAP_NAME=Campus Grievance Administrator
ADMIN_BOOTSTRAP_EMPLOYEE_ID=ADM-001
ADMIN_MFA_BOOTSTRAP_CODE=482917

# Optional SMTP
# SMTP_HOST=smtp.college.edu
# SMTP_PORT=587
# SMTP_USER=...
# SMTP_PASS=...
# SMTP_FROM=Campus Care <noreply@college.edu>
```

### 4. Database schema

```bash
npx drizzle-kit push
```

### 5. Run

```bash
npm run dev
# open http://localhost:3000
```

Production:

```bash
npm run build
npm run start
```

---

## First-time campus setup (IT checklist)

1. **Start the app** with `ADMIN_BOOTSTRAP_*` set so the first admin is created.
2. **Sign in** as that admin → enter MFA bootstrap code (or enroll authenticator).
3. Open **Control room → Directory & users**.
4. **Import authorized students** (single row or CSV):
   ```text
   studentId,name,email,department,course,year,hostel,phone
   CS21B1042,Aarav Sharma,aarav@college.edu,Computer Science,B.Tech,3rd Year,Tagore C,
   ```
5. **Import authorized staff**:
   ```text
   employeeId,name,email,department,designation,phone
   STF-2001,Rajesh Kulkarni,warden@college.edu,Hostel Administration,Warden,
   ```
6. Configure **SMTP** so OTPs reach real inboxes (otherwise OTPs appear only in admin outbox).
7. Tell students/staff to register at `/register` with **exact** ID + official email.
8. Never publish bootstrap passwords or MFA codes publicly.

Until directories are imported, `/register` shows **registration unavailable** — by design.

---

## Roles (server-enforced)

| Role | Can do | Cannot do |
| --- | --- | --- |
| **Student** | File complaints, view own tickets, updates, feedback | See others' tickets, open `/admin` |
| **Staff** | View/update tickets assigned to them or their department | Admin directory, provision admins, all-campus unrestricted queue |
| **Admin** | Full queue, assign staff, directory import, user activate/deactivate, provision admins | Self-register as admin from public form |

Role is **always** written by the server from directory purpose or admin provision APIs. Client `role=admin` is ignored.

---

## Security model (summary)

1. **Passwords** — `scrypt` with random salt; never plain text.
2. **Sessions** — HMAC-signed `httpOnly` cookies; `Secure` in production; `SameSite=Lax`.
3. **Login rate limit** — lockout after repeated failures.
4. **OTP** — hashed at rest; expiry; attempt limits.
5. **MFA** — required for admin; TOTP + single-use backup codes.
6. **SQL** — Drizzle parameterized queries only.
7. **XSS** — sanitize/escape user text; React text rendering.
8. **IDOR** — every complaint load checks owner or staff/admin scope.
9. **CSRF** — Server Actions + SameSite cookies.
10. **Secrets** — `.env` only; listed in `.gitignore`.

---

## Main routes

| Path | Access |
| --- | --- |
| `/` | Public landing |
| `/register` | Student/staff verified signup |
| `/verify` | OTP completion |
| `/login` | Sign in (+ MFA for admin) |
| `/forgot-password` · `/reset-password` | Password recovery |
| `/dashboard` | Student desk |
| `/complaints/new` | File ticket |
| `/complaints/[id]` | Ticket detail (owner/staff/admin) |
| `/track` | Public ticket tracker |
| `/admin` | Staff/admin queue |
| `/admin/complaints/[id]` | Staff/admin ticket actions |
| `/admin/directory` | Admin-only directory & users |
| `/api/health` | Health check |

---

## Scripts

```bash
npm run dev        # development server
npm run build      # production build
npm run start      # production server
npm run typecheck  # tsc --noEmit
npx drizzle-kit push   # apply schema
```

---

## Documentation

- **[docs/BUILD_GUIDE.md](docs/BUILD_GUIDE.md)** — full step-by-step guide to rebuild Campus Care from scratch (architecture, schema, auth, RBAC, UI, deploy, SIH talking points).
- **[docs/Campus_Care_Guide.html](docs/Campus_Care_Guide.html)** — same guide as a print-ready HTML document (**File → Print → Save as PDF**).

---

## SIH one-liner

> Campus Care turns campus grievances into accountable tickets: college-directory verified identities, OTP email proof, hashed credentials, department-scoped staff workflows, and an admin control room — built with Next.js, PostgreSQL, and Drizzle.

---

## License / academic use

Built as an educational / SIH project template. Adapt branding, SMTP, and directory import to your institution’s IT policies before production use.
