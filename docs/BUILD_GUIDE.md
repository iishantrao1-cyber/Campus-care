# Campus Care — Complete Build Guide

**How to design, build, secure, and explain the Student Complaint Portal**

Use this document to rebuild the project for practice, train teammates, or present in Smart India Hackathon (SIH) evaluations.  
For a PDF: open `docs/Campus_Care_Guide.html` in a browser → **Print** → **Save as PDF**.

---

## Table of contents

1. [Problem statement](#1-problem-statement)
2. [Tools and stack](#2-tools-and-stack)
3. [System architecture](#3-system-architecture)
4. [Database design](#4-database-design)
5. [Step-by-step build plan](#5-step-by-step-build-plan)
6. [Authentication and verification](#6-authentication-and-verification)
7. [Role-based access control](#7-role-based-access-control)
8. [Complaint workflow](#8-complaint-workflow)
9. [Security checklist](#9-security-checklist)
10. [UI and branding](#10-ui-and-branding)
11. [Environment and deployment](#11-environment-and-deployment)
12. [Testing scenarios](#12-testing-scenarios)
13. [SIH presentation script](#13-sih-presentation-script)
14. [File map reference](#14-file-map-reference)

---

## 1. Problem statement

Colleges need a **transparent grievance system** (UGC/AICTE expectations):

- Students fear raising issues without a paper trail.
- Hostels, mess, IT, academics, and anti-ragging sit in different offices.
- WhatsApp complaints get lost; suggestion boxes are not accountable.
- Sensitive reports (ragging) need anonymity options.
- Fake or unauthorized accounts must not flood the system.

**Campus Care solution**

- Verified student/staff identity via **college-provided directory**
- **OTP email verification** before account activation
- Ticket IDs with **status timeline**
- **Department routing** and staff assignment
- **Admin-only** user/role management
- Public **track-by-ticket** without exposing private student data incorrectly

---

## 2. Tools and stack

### Core development tools

| Tool | Role in this project |
| --- | --- |
| **VS Code / Cursor / any IDE** | Edit TypeScript, Tailwind, Server Actions |
| **Node.js 20+ & npm** | Runtime and package manager |
| **Git** | Version control (never commit `.env`) |
| **PostgreSQL** | Primary database |
| **psql** or GUI (pgAdmin, DBeaver) | Inspect tables, run SQL if needed |
| **Chrome / Firefox DevTools** | Test cookies, network, responsive UI |
| **Browser Print → PDF** | Export this guide |

### Application libraries

| Package | Purpose |
| --- | --- |
| `next` | App Router framework |
| `react` / `react-dom` | UI |
| `typescript` | Static typing |
| `tailwindcss` + `@tailwindcss/postcss` | Styling |
| `drizzle-orm` | Type-safe SQL |
| `drizzle-kit` | Push/migrate schema |
| `pg` | PostgreSQL driver |
| `dotenv` | Load `.env` for tooling |

### Built-in Node modules (no extra auth SaaS)

| Module | Used for |
| --- | --- |
| `crypto.scryptSync` | Password hashing |
| `crypto.createHmac` | Session cookie signatures |
| `crypto.createHash` | OTP hashes |
| `crypto.randomBytes` | Salts, MFA secrets, OTPs |
| `crypto.timingSafeEqual` | Constant-time compares |

### Optional campus infrastructure

| Service | Purpose |
| --- | --- |
| **SMTP / college mail gateway** | Deliver OTP and password-reset mail |
| **Reverse proxy (Nginx)** + **HTTPS cert** | TLS termination in production |
| **Process manager (systemd / PM2)** | Keep `next start` alive |

---

## 3. System architecture

```text
┌─────────────┐     HTTPS      ┌──────────────────────────────┐
│   Browser   │ ─────────────► │  Next.js App (Node server)   │
│  Student /  │                │                              │
│  Staff /    │ ◄─ html/json ─ │  • Server Components (RSC)   │
│  Admin      │                │  • Server Actions (mutations)│
└─────────────┘                │  • httpOnly session cookies  │
                               └──────────────┬───────────────┘
                                              │ Drizzle ORM
                                              │ parameterized SQL
                               ┌──────────────▼───────────────┐
                               │         PostgreSQL           │
                               │  users · directories · tickets │
                               │  OTP · outbox · feedback     │
                               └──────────────────────────────┘
                                              │
                               ┌──────────────▼───────────────┐
                               │  SMTP (optional) / Outbox    │
                               │  for OTP delivery to IT      │
                               └──────────────────────────────┘
```

### Why Server Actions?

Instead of many `/api/*` REST endpoints for forms:

1. Form posts directly to a `"use server"` function.
2. Validation, authorization, and DB writes run **only on the server**.
3. `revalidatePath` refreshes UI data after mutations.
4. Reduces XSS surface from hand-rolled JSON APIs.

### Data flow example — file a complaint

1. Student session cookie verified → `getCurrentUser()`.
2. Role must be `student` + `emailVerified` + `isActive`.
3. Title/description sanitized and length-capped.
4. Insert `complaints` + first `complaint_updates` row.
5. Redirect to `/complaints/{id}`.

---

## 4. Database design

### Entity relationship (logical)

```text
authorized_students ──(match ID+email)──► users (role=student)
authorized_staff    ──(match ID+email)──► users (role=staff)
admin provision / bootstrap ────────────► users (role=admin)

users 1──* complaints
complaints 1──* complaint_updates
complaints 1──* feedback
email_verifications (OTP challenges)
email_outbox (mail audit / IT OTP holding)
```

### Table reference

#### `users`
Application login accounts.

| Column | Notes |
| --- | --- |
| `id` | PK |
| `email` | Unique official email |
| `student_id` / `employee_id` | College identifiers |
| `password_hash` | `salt:scryptHash` |
| `role` | `student` \| `staff` \| `admin` — **server only** |
| `email_verified` | Must be true to use app |
| `is_active` | Soft ban |
| `mfa_enabled`, `mfa_secret`, `mfa_backup_codes` | Admin MFA |

#### `authorized_students` / `authorized_staff`
College IT source of truth. Registration fails unless ID+email match an **active** row.

#### `email_verifications`
Stores **hashed** OTP, purpose (`register_student`, `register_staff`, `password_reset`), expiry, attempts, optional JSON payload (includes password hash during pending registration).

#### `complaints`
Tickets: category, priority, status, location, anonymity, assignment.

#### `complaint_updates`
Immutable-ish timeline messages.

#### `feedback`
1–5 star rating after resolve/close.

### Status machine

```text
submitted → under_review → in_progress → resolved → closed
                ↘ rejected
```

---

## 5. Step-by-step build plan

Follow this order when rebuilding from scratch.

### Phase A — Scaffold

```bash
npx create-next-app@latest campus-care --typescript --tailwind --app --eslint
cd campus-care
npm install drizzle-orm pg dotenv
npm install -D drizzle-kit @types/pg
```

Create:

- `src/db/index.ts` — Pool + `drizzle(pool)`
- `drizzle.config.json` — dialect `postgresql`, schema path, `DATABASE_URL`
- `.env` / `.env.example` / `.gitignore` (ignore `.env`)

### Phase B — Schema

Define all tables in `src/db/schema.ts` (see Section 4).  
Push schema:

```bash
npx drizzle-kit push
```

### Phase C — Auth primitives (`src/lib/auth.ts`)

Implement:

1. `hashPassword` / `verifyPassword` (scrypt)
2. Signed session cookie create/read/clear
3. Rate limiting maps for login and OTP
4. `createEmailChallenge` / `consumeEmailChallenge`
5. `getCurrentUser` (rejects inactive or unverified)
6. MFA verify helpers

### Phase D — Directory + mail

- `src/lib/directory.ts` — count/find authorized rows
- `src/lib/mail.ts` — send or outbox
- `src/lib/totp.ts` — MFA secret, verify, backup codes
- `src/lib/seed.ts` — **only** bootstrap admin from env if none exists

### Phase E — Server actions

- `auth.ts` — login, student/staff register, verify OTP, reset password, logout  
  **Never** set `role` from form fields.
- `admin-directory.ts` — import CSV, toggle active, provision admin
- `complaints.ts` — create/update/feedback with ownership checks

### Phase F — Pages

Keep design consistent (cream/forest palette):

| Page | Build notes |
| --- | --- |
| Home | Marketing + categories; no demo passwords in production copy |
| Register | Tabs Student/Staff; block if directory empty |
| Verify | OTP form |
| Login | MFA field when required |
| Dashboard | Student tickets only (`where userId = me`) |
| New complaint | Categories from constants |
| Complaint detail | IDOR check |
| Track | Public by `ticketNo` |
| Admin queue | Staff filtered by assignment/dept |
| Admin directory | Admin only |

### Phase G — Polish security

- Sanitize complaint text
- Field max lengths
- Staff cannot open other departments’ tickets
- Students cannot open `/admin/*`
- HTTPS + secure cookies in production

### Phase H — Validate

```bash
npx next typegen
npx tsc --noEmit
npm run build
```

---

## 6. Authentication and verification

### Student registration sequence

```text
1. POST name, studentId, email, password
2. IF authorized_students empty → "registration unavailable"
3. IF no row where student_id AND email AND is_active → reject
4. IF email or student_id already in users → reject
5. Hash password; store pending payload + hashed OTP
6. Email OTP (or admin outbox)
7. User submits OTP
8. Re-check directory; INSERT users role='student', email_verified=true
9. createSession → /dashboard
```

### Staff registration

Same pattern with `authorized_staff` and `role='staff'`.

### Admin creation

```text
Path A: ADMIN_BOOTSTRAP_EMAIL + PASSWORD on first boot (no admin yet)
Path B: Existing admin → Provision administrator form
         → role hardcoded 'admin', mfa_enabled=true
```

Public form can never become admin.

### Login

```text
1. Rate limit by email
2. Verify password
3. Require email_verified and is_active
4. If admin (or staff with MFA): require TOTP/backup
5. Set session cookie; redirect by role
```

### Password reset

1. Request by email (generic success message — anti-enumeration)
2. OTP purpose `password_reset`
3. Set new password hash after OTP consume

---

## 7. Role-based access control

### Rule

**Every protected page and every Server Action checks the session user from the database.**  
Hiding a button is not security.

### Implementation pattern

```ts
const user = await getCurrentUser();
if (!user) redirect("/login");
if (user.role !== "admin") redirect("/admin"); // example for directory
```

### Complaint privacy (IDOR)

```ts
const isOwner = complaint.userId === user.id;
const isStaff = user.role === "admin" || user.role === "staff";
if (!isOwner && !isStaff) redirect("/dashboard");

// staff further:
if (user.role === "staff") {
  const allowed =
    complaint.assignedTo === user.id ||
    complaint.assignedDept === user.department;
  if (!allowed) redirect("/admin");
}
```

---

## 8. Complaint workflow

### Categories (examples)

Hostel, Mess, Academics, Infrastructure, IT, Library, Transport, Ragging, Sports, Administration — each maps to an `assigned_dept`.

### Student journey

1. Register + verify  
2. Dashboard → New complaint  
3. Optional anonymous flag (identity still known to grievance cell when needed)  
4. Receive `CC-YYYY-####`  
5. Follow timeline; add updates  
6. After resolved → rate 1–5 → may auto-close  

### Staff journey

1. Login  
2. See departmental/assigned queue  
3. Update status, priority, public note  
4. Claim unassigned dept tickets when acting  

### Admin journey

1. MFA login  
2. Full queue + assign any staff  
3. Directory import  
4. Activate/deactivate users  
5. Provision more admins  
6. Read mail outbox if SMTP off  

---

## 9. Security checklist

Use this during SIH demos and production hardening.

- [ ] Passwords hashed (scrypt/argon2/bcrypt) — never plain text  
- [ ] Login rate limiting / lockout  
- [ ] httpOnly + Secure + SameSite cookies  
- [ ] Session signature verified with timing-safe compare  
- [ ] OTP hashed, expiring, attempt-limited  
- [ ] Admin MFA required  
- [ ] Role never taken from client body/query  
- [ ] Directory match on ID **and** email  
- [ ] Registration closed if directory empty  
- [ ] Parameterized SQL only (ORM)  
- [ ] XSS escape on user content  
- [ ] IDOR checks on every complaint id  
- [ ] Staff scoped to department/assignment  
- [ ] `.env` not in git  
- [ ] HTTPS in production  
- [ ] No public demo passwords on marketing pages  

---

## 10. UI and branding

### Design language

- **Forest green** authority (`#0b3d2e`)
- **Cream paper** backgrounds for campus warmth
- **Gold / terra** accents for CTAs
- Display font (Fraunces) + sans (Outfit)

### Principles

1. Do not redesign when adding auth — add tabs/OTP fields only.  
2. Status badges color-coded for queue scanning.  
3. Mobile sticky header with simple nav.  
4. Empty states when no tickets / no directory rows.

### Accessibility basics

- Labels on all inputs  
- Sufficient contrast on forest/cream  
- Meaningful button text (“Send verification OTP”)

---

## 11. Environment and deployment

### Required secrets

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection |
| `SESSION_SECRET` | Cookie + OTP pepper |
| `APP_URL` | Links inside emails |
| `ADMIN_BOOTSTRAP_*` | First admin only |

### Optional

`SMTP_*`, `ADMIN_MFA_BOOTSTRAP_CODE`, `FORCE_SECURE_COOKIES`

### Deploy outline

1. Provision managed Postgres  
2. Set env on host (Vercel/Railway/VPS)  
3. `drizzle-kit push` or migration job  
4. `npm run build && npm run start`  
5. Put TLS certificate in front  
6. Import directories as admin  
7. Rotate bootstrap password after first login  
8. Enroll real authenticator; discard bootstrap MFA code  

---

## 12. Testing scenarios

| # | Scenario | Expected |
| --- | --- | --- |
| 1 | Register before directory import | “Registration unavailable” |
| 2 | Wrong student ID/email pair | Rejected |
| 3 | Correct pair + OTP | Account created, student role |
| 4 | Try `role=admin` in form (if forged) | Still student/staff only |
| 5 | Student opens `/admin` | Redirect away |
| 6 | Student changes URL to another ticket id | Denied |
| 7 | Staff opens other department ticket | Denied |
| 8 | Admin login without MFA | Prompt for MFA |
| 9 | 5+ bad passwords | Temporary lockout |
| 10 | XSS string in complaint title | Shown as text, not executed |
| 11 | Password reset OTP | Can set new password |
| 12 | Track public ticket id | Timeline visible; anonymous name hidden |

---

## 13. SIH presentation script

**30-second pitch**

> Campus Care is a verified student grievance portal. Colleges upload official student and staff lists. Users prove identity with ID plus email OTP. Every complaint becomes a ticket with a timeline. Staff only see their department; admins assign and audit. Security is built in: hashed passwords, rate limits, MFA for admins, and server-side authorization.

**Demo order (5 minutes)**

1. Home page categories  
2. Show register blocked or directory import as admin  
3. Import one student CSV row  
4. Register that student → OTP (outbox if no SMTP) → dashboard  
5. File complaint → ticket ID  
6. Public `/track`  
7. Staff/admin update status  
8. Mention MFA + no self-admin signup  

**Judges’ technical Q&A cheatsheet**

- *Why not only check email domain?* → Domains can be guessed; directory binds ID↔email.  
- *Where is role stored?* → `users.role` in Postgres; set only by server.  
- *How OTP safe?* → SHA-256 hash, expiry, attempt counters.  
- *SQL injection?* → Drizzle bound parameters.  
- *Anonymous complaints?* → Public name hidden; cell may still know owner server-side.

---

## 14. File map reference

| Concern | Primary files |
| --- | --- |
| Schema | `src/db/schema.ts` |
| DB client | `src/db/index.ts` |
| Sessions / crypto | `src/lib/auth.ts` |
| MFA | `src/lib/totp.ts` |
| Mail | `src/lib/mail.ts` |
| Directory checks | `src/lib/directory.ts` |
| Categories | `src/lib/constants.ts` |
| Auth actions | `src/app/actions/auth.ts` |
| Admin IT actions | `src/app/actions/admin-directory.ts` |
| Complaints actions | `src/app/actions/complaints.ts` |
| Forms UI | `src/components/auth-forms.tsx`, `complaint-forms.tsx` |
| Global styles | `src/app/globals.css` |

---

## Appendix A — npm commands cheat sheet

```bash
npm install
cp .env.example .env
npx drizzle-kit push
npm run dev
npm run build
npm run start
npm run typecheck
```

## Appendix B — Generate PDF from this guide

1. Open `docs/Campus_Care_Guide.html` in Chrome.  
2. `Ctrl+P` / `Cmd+P`.  
3. Destination: **Save as PDF**.  
4. Enable “Background graphics” for colored badges.  
5. Share the PDF with teammates or evaluators.

## Appendix C — What college IT must supply

1. Authorized **student** CSV (ID, name, official email, dept, course, year, active).  
2. Authorized **staff** CSV (employee ID, name, email, dept, designation, active).  
3. SMTP credentials or mail relay.  
4. Decision on who the first grievance **admin** is.  
5. SSL certificate / domain for `APP_URL`.  
6. Retention and privacy policy for anonymous reports.

---

*End of Campus Care Build Guide · SIH Student Complaint Portal*
