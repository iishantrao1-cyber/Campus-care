import Link from "next/link";
import { desc, eq, inArray } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { complaintUpdates, complaints, feedback, users } from "@/db/schema";
import { AdminUpdateForm } from "@/components/complaint-forms";
import { getCurrentUser } from "@/lib/auth";
import { categoryLabel, formatDateTime, priorityClass, statusClass, statusLabel } from "@/lib/utils";

function decodeHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/");
}

export default async function AdminComplaintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  
  // 1. High-Security Check: Reject access if user is not authorized staff or admin
  if (!user || (user.role !== "admin" && user.role !== "staff")) {
    redirect("/dashboard");
  }

  const { id } = await params;
  const complaintId = Number(id);
  if (!Number.isInteger(complaintId)) {
    notFound();
  }

  const [complaint] = await db
    .select()
    .from(complaints)
    .where(eq(complaints.id, complaintId))
    .limit(1);
    
  if (!complaint) {
    notFound();
  }

  if (user.role === "staff") {
    const allowed =
      complaint.assignedTo === user.id ||
      (user.department && complaint.assignedDept === user.department);
    if (!allowed) {
      redirect("/admin");
    }
  }

  const student = complaint.userId
    ? (
        await db.select().from(users).where(eq(users.id, complaint.userId)).limit(1)
      )[0]
    : null;

  const staff = await db
    .select({ id: users.id, name: users.name, role: users.role })
    .from(users)
    .where(inArray(users.role, ["admin", "staff"]));

  const timeline = await db
    .select({
      id: complaintUpdates.id,
      message: complaintUpdates.message,
      status: complaintUpdates.status,
      createdAt: complaintUpdates.createdAt,
      authorName: users.name,
    })
    .from(complaintUpdates)
    .leftJoin(users, eq(complaintUpdates.authorId, users.id))
    .where(eq(complaintUpdates.complaintId, complaint.id))
    .orderBy(desc(complaintUpdates.createdAt));

  const ratings = await db
    .select()
    .from(feedback)
    .where(eq(feedback.complaintId, complaint.id));

  return (
    <main className="mx-auto grid max-w-6xl gap-8 px-5 py-10 lg:grid-cols-[1fr_0.9fr]">
      <section>
        <Link href="/admin/review" className="text-sm font-semibold text-sage hover:underline">
          ← Complaint review
        </Link>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-mist px-3 py-1 text-xs font-semibold text-forest">
            {complaint.ticketNo}
          </span>
          <span className={statusClass(complaint.status)}>{statusLabel(complaint.status)}</span>
          <span className={priorityClass(complaint.priority)}>{complaint.priority}</span>
        </div>
        
        <h1 className="font-display mt-4 text-4xl text-forest">
          {decodeHtml(complaint.title)}
        </h1>
        
        <p className="mt-2 text-sm text-ink/60">
          {categoryLabel(complaint.category)} · {decodeHtml(complaint.location || "Unspecified location")} ·{" "}
          {formatDateTime(complaint.createdAt)}
        </p>
        
        <article className="mt-6 rounded-[2rem] border border-sand bg-white p-6 leading-relaxed text-ink/80 shadow-sm whitespace-pre-wrap">
          {decodeHtml(complaint.description)}
        </article>

        <div className="mt-6 rounded-[2rem] bg-cream p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-sage font-bold">Student Profile Details</p>
          {complaint.isAnonymous ? (
            <p className="mt-2 text-sm text-ink/80 leading-relaxed">
              <strong>Anonymous mode enabled.</strong> Display is hidden on public screens. <br />
              Grievance Officer view: {student?.name} ({student?.email}) · {student?.studentId}
            </p>
          ) : (
            <p className="mt-2 text-sm text-ink/80 leading-relaxed">
              <strong>Student:</strong> {student?.name} · {student?.studentId} · {student?.department} · {student?.email}
            </p>
          )}
        </div>

        <div className="mt-8">
          <h3 className="font-display text-2xl text-forest mb-4">Internal History Log</h3>
          <ol className="space-y-4">
            {timeline.map((t) => (
              <li key={t.id} className="rounded-2xl border border-sand bg-white p-4 shadow-sm">
                <p className="text-xs text-ink/50">
                  {formatDateTime(t.createdAt)} · {t.authorName ?? "System Update"}
                </p>
                <p className="mt-1 text-sm text-ink/80">{decodeHtml(t.message)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <aside className="space-y-5">
        <div className="rounded-[2rem] border border-sand bg-white p-6 shadow-sm">
          <h2 className="font-display text-2xl text-forest">Act on this ticket</h2>
          <div className="mt-4">
            <AdminUpdateForm
              complaintId={complaint.id}
              status={complaint.status}
              priority={complaint.priority}
              assignedTo={complaint.assignedTo}
              staff={staff}
            />
          </div>
        </div>
        
        {ratings[0] ? (
          <div className="rounded-[2rem] bg-forest p-6 text-cream shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-leaf font-bold">Student Feedback Rating</p>
            <p className="font-display mt-2 text-4xl">{ratings[0].rating} / 5</p>
            <p className="mt-2 text-sm text-cream/80 italic">
              "{decodeHtml(ratings[0].comment || "No comment left.")}"
            </p>
          </div>
        ) : null}
      </aside>
    </main>
  );
}
