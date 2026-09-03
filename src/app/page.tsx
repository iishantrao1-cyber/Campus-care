import Link from "next/link";
import { db } from "@/db";
import { complaints } from "@/db/schema";
import { Icon } from "@/components/icons";
import { CATEGORIES } from "@/lib/constants";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  const allComplaints = await db.select().from(complaints);
  const totals = {
    all: allComplaints.length,
    resolved: allComplaints.filter((c) => c.status === "resolved" || c.status === "closed").length,
    urgent: allComplaints.filter((c) => c.priority === "urgent").length,
  };

  const isStaffDesk = user?.role === "admin" || user?.role === "staff";
  const ctaHref = user
    ? user.role === "student"
      ? "/complaints/new"
      : "/admin"
    : "/register";
  const ctaLabel = isStaffDesk
    ? "Open control room"
    : user?.role === "student"
      ? "File a complaint"
      : "File a complaint";

  return (
    <main>
      <section className="relative isolate overflow-hidden">
        <img
          src="https://images.pexels.com/photos/37145891/pexels-photo-37145891.jpeg?auto=compress&cs=tinysrgb&w=1800"
          alt="Indian college campus"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-forest/92 via-forest/78 to-forest/35" />
        <div className="grain absolute inset-0" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-5 py-24 lg:grid-cols-[1.1fr_0.9fr] lg:py-32">
          <div className="text-cream">
            <p className="inline-flex rounded-full border border-cream/25 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em]">
              Smart India Hackathon · Grievance Redressal
            </p>
            <h1 className="font-display mt-6 max-w-xl text-5xl leading-[1.05] sm:text-6xl">
              Campus Care
            </h1>
            <p className="mt-3 font-display text-2xl text-gold">Your voice. Your campus. Heard.</p>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-cream/85">
              File hostel, academic, ragging and infrastructure complaints in minutes. Every
              ticket gets a public ID, a responsible cell, and a timeline you can actually
              follow — without waiting outside an office.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={ctaHref} className="btn-terra">
                {ctaLabel}
                <Icon name="arrow" className="h-4 w-4" />
              </Link>
              <Link href="/track" className="btn-ghost border-cream/30 text-cream">
                Track a ticket
              </Link>
            </div>
          </div>
          <div className="rounded-3xl border border-white/15 bg-white/10 p-6 text-cream backdrop-blur-md">
            <p className="text-xs uppercase tracking-[0.2em] text-leaf">Live campus pulse</p>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <Stat n={totals.all} l="Tickets" />
              <Stat n={totals.resolved} l="Resolved" />
              <Stat n={totals.urgent} l="Urgent open" />
            </div>
            <ul className="mt-6 space-y-3 text-sm text-cream/85">
              <li className="flex gap-2">
                <Icon name="check" className="mt-0.5 h-4 w-4 text-leaf" />
                Anonymous mode for sensitive reports
              </li>
              <li className="flex gap-2">
                <Icon name="check" className="mt-0.5 h-4 w-4 text-leaf" />
                SLA-style status: submitted → review → action
              </li>
              <li className="flex gap-2">
                <Icon name="check" className="mt-0.5 h-4 w-4 text-leaf" />
                Admin desk with assignment and feedback loop
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16" id="how">
        <p className="text-xs uppercase tracking-[0.22em] text-sage">Three steps. No runaround.</p>
        <h2 className="font-display mt-2 text-4xl text-forest">How Campus Care works</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            {
              n: "01",
              t: "Tell us once",
              d: "Pick a category, add location and facts. Stay named or go anonymous.",
            },
            {
              n: "02",
              t: "We route it",
              d: "Hostel, IT, mess, anti-ragging cell — the right desk owns the ticket.",
            },
            {
              n: "03",
              t: "You track it",
              d: "Use CC-2026-XXXX anywhere. Rate the close so the campus learns.",
            },
          ].map((s) => (
            <article key={s.n} className="rounded-3xl border border-sand bg-white p-7 shadow-sm">
              <p className="font-display text-3xl text-gold">{s.n}</p>
              <h3 className="mt-3 text-xl font-semibold">{s.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/70">{s.d}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-cream/80 py-16" id="categories">
        <div className="mx-auto max-w-6xl px-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-sage">What you can raise</p>
              <h2 className="font-display mt-2 text-4xl text-forest">Ten desks. One door.</h2>
            </div>
            <Link href={ctaHref} className="btn-primary">
              {isStaffDesk ? "Review complaints" : "Start a ticket"}
            </Link>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {CATEGORIES.map((c) => (
              <article
                key={c.slug}
                className="card-lift rounded-2xl border border-sand bg-white p-5"
              >
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-mist text-forest">
                  <Icon name={c.icon} />
                </span>
                <h3 className="mt-4 text-sm font-semibold">{c.label}</h3>
                <p className="mt-1 text-xs leading-relaxed text-ink/65">{c.blurb}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 lg:grid-cols-2">
        <div className="overflow-hidden rounded-[2rem]">
          <img
            src="https://images.pexels.com/photos/7972373/pexels-photo-7972373.jpeg?auto=compress&cs=tinysrgb&w=1400"
            alt="Students walking on campus"
            className="h-full w-full object-cover"
          />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-sage">Why colleges adopt it</p>
          <h2 className="font-display mt-2 text-4xl text-forest">
            From suggestion box to a system that cannot lose a file.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-ink/75">
            UGC and AICTE expect a working grievance cell. Campus Care gives students a
            timestamped record, staff a queue they can clear, and the principal a dashboard
            instead of rumours on WhatsApp.
          </p>
          <dl className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-white p-5 ring-1 ring-sand">
              <dt className="text-xs uppercase tracking-wider text-ink/50">Confidential</dt>
              <dd className="mt-1 font-medium">Anonymous ragging & harassment lane</dd>
            </div>
            <div className="rounded-2xl bg-white p-5 ring-1 ring-sand">
              <dt className="text-xs uppercase tracking-wider text-ink/50">Accountable</dt>
              <dd className="mt-1 font-medium">Named owners, status history, ratings</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="px-5 pb-8">
        <div className="mx-auto grid max-w-6xl overflow-hidden rounded-[2rem] bg-forest lg:grid-cols-2">
          <div className="p-8 text-cream sm:p-12">
            <p className="text-xs uppercase tracking-[0.22em] text-leaf">Verified campus access</p>
            <h2 className="font-display mt-3 text-3xl">Register only after college authorization.</h2>
            <p className="mt-3 text-sm text-cream/75">
              Students and staff must match the official directory and verify their college email
              with an OTP. Admin accounts are provisioned by authorized administrators only — never
              through public signup.
            </p>
            <div className="mt-6 space-y-3 text-sm text-cream/85">
              <p>1. Campus IT imports authorized Student ID / Staff ID lists</p>
              <p>2. Users register with matching official email</p>
              <p>3. OTP verification unlocks the account</p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register" className="btn-terra">
                Create verified account
              </Link>
              <Link href="/login" className="btn-ghost border-cream/30 text-cream">
                Sign in
              </Link>
            </div>
          </div>
          <img
            src="https://images.pexels.com/photos/8199558/pexels-photo-8199558.jpeg?auto=compress&cs=tinysrgb&w=1400"
            alt="Students collaborating in a library"
            className="h-72 w-full object-cover lg:h-full"
          />
        </div>
      </section>
    </main>
  );
}

function Stat({ n, l }: { n: number; l: string }) {
  return (
    <div className="rounded-2xl bg-black/20 p-3 text-center">
      <p className="font-display text-2xl">{n}</p>
      <p className="text-[10px] uppercase tracking-wider text-cream/70">{l}</p>
    </div>
  );
}
