import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { complaints } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { Icon } from "@/components/icons";
import { categoryLabel, formatDate, priorityClass, statusClass, statusLabel } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "student") redirect("/admin");

  const mine = await db
    .select()
    .from(complaints)
    .where(eq(complaints.userId, user.id))
    .orderBy(desc(complaints.createdAt));

  const open = mine.filter((c) => !["resolved", "closed", "rejected"].includes(c.status)).length;
  const done = mine.filter((c) => c.status === "resolved" || c.status === "closed").length;

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-sage">Student desk</p>
          <h1 className="font-display mt-1 text-4xl text-forest">Namaste, {user.name.split(" ")[0]}</h1>
          <p className="mt-1 text-sm text-ink/70">
            {user.studentId} · {user.department} · {user.year}
          </p>
        </div>
        <Link href="/complaints/new" className="btn-primary">
          <Icon name="plus" className="h-4 w-4" />
          New complaint
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 ring-1 ring-sand">
          <p className="text-xs uppercase tracking-wider text-ink/50">Your tickets</p>
          <p className="font-display mt-1 text-3xl">{mine.length}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 ring-1 ring-sand">
          <p className="text-xs uppercase tracking-wider text-ink/50">Open</p>
          <p className="font-display mt-1 text-3xl text-terra">{open}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 ring-1 ring-sand">
          <p className="text-xs uppercase tracking-wider text-ink/50">Resolved</p>
          <p className="font-display mt-1 text-3xl text-sage">{done}</p>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="font-display text-2xl text-forest">My complaints</h2>
        {mine.length === 0 ? (
          <div className="mt-4 rounded-3xl border border-dashed border-sand bg-white p-10 text-center">
            <p className="font-medium">No tickets yet.</p>
            <Link href="/complaints/new" className="btn-primary mt-4">
              File your first complaint
            </Link>
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-3xl border border-sand bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-cream text-xs uppercase tracking-wider text-ink/60">
                <tr>
                  <th className="px-4 py-3">Ticket</th>
                  <th className="px-4 py-3">Issue</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Filed</th>
                </tr>
              </thead>
              <tbody>
                {mine.map((c) => (
                  <tr key={c.id} className="border-t border-sand/80">
                    <td className="px-4 py-3 font-semibold text-forest">
                      <Link href={`/complaints/${c.id}`}>{c.ticketNo}</Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/complaints/${c.id}`} className="hover:underline">
                        {c.title}
                      </Link>
                      <span className={`ml-2 ${priorityClass(c.priority)}`}>{c.priority}</span>
                    </td>
                    <td className="px-4 py-3 text-ink/70">{categoryLabel(c.category)}</td>
                    <td className="px-4 py-3">
                      <span className={statusClass(c.status)}>{statusLabel(c.status)}</span>
                    </td>
                    <td className="px-4 py-3 text-ink/60">{formatDate(c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
