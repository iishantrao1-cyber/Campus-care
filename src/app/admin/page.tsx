import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { complaints } from "@/db/schema";
import { Icon } from "@/components/icons";
import { getCurrentUser } from "@/lib/auth";

export default async function AdminWelcomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin" && user.role !== "staff") redirect("/dashboard");

  const allRaw = await db
    .select({
      id: complaints.id,
      priority: complaints.priority,
      status: complaints.status,
      assignedTo: complaints.assignedTo,
      assignedDept: complaints.assignedDept,
      createdAt: complaints.createdAt,
    })
    .from(complaints)
    .orderBy(desc(complaints.createdAt));

  const scoped =
    user.role === "admin"
      ? allRaw
      : allRaw.filter(
          (c) =>
            c.assignedTo === user.id ||
            (user.department && c.assignedDept === user.department),
        );

  const open = scoped.filter(
    (c) => !["resolved", "closed", "rejected"].includes(c.status),
  ).length;
  const urgent = scoped.filter(
    (c) => c.priority === "urgent" && !["resolved", "closed", "rejected"].includes(c.status),
  ).length;
  const underReview = scoped.filter((c) => c.status === "under_review").length;
  const inProgress = scoped.filter((c) => c.status === "in_progress").length;
  const resolved = scoped.filter(
    (c) => c.status === "resolved" || c.status === "closed",
  ).length;

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const roleLabel = user.role === "admin" ? "Administrator" : "Staff officer";
  const deskLabel =
    user.role === "admin"
      ? "Grievance control room"
      : user.department || "Department desk";

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <section className="staff-hero-panel grain relative overflow-hidden rounded-[2rem] px-6 py-10 text-cream sm:px-10 sm:py-12">
        <div className="relative z-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-leaf">
              {roleLabel} · Campus Care
            </p>
            <h1 className="font-display mt-3 text-4xl leading-tight sm:text-5xl">
              {greeting}, {user.name.split(" ")[0]}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-cream/80 sm:text-base">
              Welcome to the {deskLabel}. This workspace is for reviewing and resolving
              student grievances only — filing complaints is reserved for verified students.
            </p>
            <p className="mt-4 text-xs text-cream/60">
              Signed in as {user.name}
              {user.department ? ` · ${user.department}` : ""}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
            <MiniStat label="Open queue" value={open} />
            <MiniStat label="Urgent" value={urgent} />
            <MiniStat label="In review" value={underReview + inProgress} />
            <MiniStat label="Resolved" value={resolved} />
          </div>
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-sage">Actions</p>
            <h2 className="font-display mt-1 text-3xl text-forest">Review complaints</h2>
            <p className="mt-1 text-sm text-ink/65">
              Choose a queue. Update status, assign owners, and publish timeline notes.
            </p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/admin/review" className="btn-3d btn-3d-forest">
            <span className="btn-3d-kicker">Primary desk</span>
            <span className="btn-3d-title">Review all complaints</span>
            <span className="btn-3d-meta">{scoped.length} ticket{scoped.length === 1 ? "" : "s"} in your scope</span>
          </Link>

          <Link href="/admin/review?status=submitted" className="btn-3d btn-3d-terra">
            <span className="btn-3d-kicker">Needs attention</span>
            <span className="btn-3d-title">Open queue</span>
            <span className="btn-3d-meta">
              {open} awaiting action · start with newly submitted
            </span>
          </Link>

          <Link href="/admin/review?status=under_review" className="btn-3d btn-3d-teal">
            <span className="btn-3d-kicker">Pipeline</span>
            <span className="btn-3d-title">Under review</span>
            <span className="btn-3d-meta">{underReview} ticket{underReview === 1 ? "" : "s"} being assessed</span>
          </Link>

          <Link href="/admin/review?priority=urgent" className="btn-3d btn-3d-gold">
            <span className="btn-3d-kicker">Priority lane</span>
            <span className="btn-3d-title">Urgent complaints</span>
            <span className="btn-3d-meta">{urgent} urgent open item{urgent === 1 ? "" : "s"}</span>
          </Link>

          <Link href="/admin/review?status=in_progress" className="btn-3d btn-3d-slate">
            <span className="btn-3d-kicker">Active work</span>
            <span className="btn-3d-title">In progress</span>
            <span className="btn-3d-meta">{inProgress} currently being resolved</span>
          </Link>

          {user.role === "admin" ? (
            <Link href="/admin/directory" className="btn-3d btn-3d-forest">
              <span className="btn-3d-kicker">Administration</span>
              <span className="btn-3d-title">Directory & users</span>
              <span className="btn-3d-meta">Import authorized IDs · manage accounts</span>
            </Link>
          ) : (
            <Link href="/admin/review?status=resolved" className="btn-3d btn-3d-forest">
              <span className="btn-3d-kicker">History</span>
              <span className="btn-3d-title">Resolved archive</span>
              <span className="btn-3d-meta">{resolved} closed or resolved in scope</span>
            </Link>
          )}
        </div>
      </section>

      <section className="mt-10 rounded-[2rem] border border-sand bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start gap-4">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-mist text-forest">
            <Icon name="shield" className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-2xl text-forest">Desk guidelines</h3>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink/75">
              <li>Review facts, update status, and leave a clear public note on the timeline.</li>
              <li>
                {user.role === "staff"
                  ? "You only see tickets assigned to you or your department."
                  : "Assign staff owners so departments stay accountable."}
              </li>
              <li>Students file complaints from their own desk — this control room is review-only.</li>
            </ul>
            <Link href="/admin/review" className="btn-primary mt-5">
              Go to complaint review
              <Icon name="arrow" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-black/20 px-3 py-3 backdrop-blur-sm">
      <p className="text-[10px] uppercase tracking-wider text-cream/65">{label}</p>
      <p className="font-display mt-1 text-2xl text-cream">{value}</p>
    </div>
  );
}
