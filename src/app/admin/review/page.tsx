import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { complaints, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { CATEGORIES } from "@/lib/constants";
import {
  categoryLabel,
  formatDate,
  priorityClass,
  statusClass,
  statusLabel,
} from "@/lib/utils";

export default async function AdminReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; category?: string; priority?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin" && user.role !== "staff") redirect("/dashboard");

  const sp = await searchParams;
  const status = sp.status || "";
  const category = sp.category || "";
  const priority = sp.priority || "";

  const allRaw = await db
    .select({
      id: complaints.id,
      ticketNo: complaints.ticketNo,
      title: complaints.title,
      category: complaints.category,
      priority: complaints.priority,
      status: complaints.status,
      createdAt: complaints.createdAt,
      isAnonymous: complaints.isAnonymous,
      assignedTo: complaints.assignedTo,
      assignedDept: complaints.assignedDept,
      studentName: users.name,
    })
    .from(complaints)
    .leftJoin(users, eq(complaints.userId, users.id))
    .orderBy(desc(complaints.createdAt));

  const all =
    user.role === "admin"
      ? allRaw
      : allRaw.filter(
          (c) =>
            c.assignedTo === user.id ||
            (user.department && c.assignedDept === user.department),
        );

  // "submitted" shortcut from welcome open-queue also surfaces other open statuses when only that filter is used from CTA — keep exact status filter.
  const rows = all.filter((c) => {
    if (status && c.status !== status) return false;
    if (category && c.category !== category) return false;
    if (priority && c.priority !== priority) return false;
    return true;
  });

  const openCount = all.filter(
    (c) => !["resolved", "closed", "rejected"].includes(c.status),
  ).length;

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/admin" className="text-sm font-semibold text-sage hover:underline">
            ← Welcome desk
          </Link>
          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-sage">Complaint review</p>
          <h1 className="font-display mt-1 text-4xl text-forest">
            {user.role === "admin" ? "Campus queue" : user.department || "Department queue"}
          </h1>
          <p className="mt-1 text-sm text-ink/70">
            Review and update student tickets · {openCount} open in scope
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin" className="btn-ghost text-sm">
            Dashboard
          </Link>
          {user.role === "admin" ? (
            <Link href="/admin/directory" className="btn-ghost text-sm">
              Directory & users
            </Link>
          ) : null}
        </div>
      </div>

      <form className="mt-8 flex flex-wrap gap-3">
        <select name="status" defaultValue={status} className="field max-w-48">
          <option value="">All statuses</option>
          <option value="submitted">Submitted</option>
          <option value="under_review">Under review</option>
          <option value="in_progress">In progress</option>
          <option value="resolved">Resolved</option>
          <option value="rejected">Rejected</option>
          <option value="closed">Closed</option>
        </select>
        <select name="priority" defaultValue={priority} className="field max-w-40">
          <option value="">All priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
        <select name="category" defaultValue={category} className="field max-w-56">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.label}
            </option>
          ))}
        </select>
        <button className="btn-ghost" type="submit">
          Filter
        </button>
        {(status || category || priority) && (
          <Link href="/admin/review" className="btn-ghost">
            Clear
          </Link>
        )}
      </form>

      <div className="mt-4 overflow-x-auto rounded-3xl border border-sand bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-cream text-xs uppercase tracking-wider text-ink/60">
            <tr>
              <th className="px-4 py-3">Ticket</th>
              <th className="px-4 py-3">Complaint</th>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Filed</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-ink/50">
                  No complaints match this filter.
                </td>
              </tr>
            ) : (
              rows.map((c) => (
                <tr key={c.id} className="border-t border-sand/80">
                  <td className="px-4 py-3 font-semibold">
                    <Link href={`/admin/complaints/${c.id}`} className="text-forest">
                      {c.ticketNo}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/complaints/${c.id}`}>{c.title}</Link>
                    <div className="mt-1 flex gap-2">
                      <span className="text-xs text-ink/50">{categoryLabel(c.category)}</span>
                      <span className={priorityClass(c.priority)}>{c.priority}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink/70">
                    {c.isAnonymous ? "Anonymous" : c.studentName}
                  </td>
                  <td className="px-4 py-3">
                    <span className={statusClass(c.status)}>{statusLabel(c.status)}</span>
                  </td>
                  <td className="px-4 py-3 text-ink/60">{formatDate(c.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
