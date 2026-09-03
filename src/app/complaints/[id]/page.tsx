import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { complaintUpdates, complaints, feedback, users } from "@/db/schema";
import { FeedbackForm, UpdateForm } from "@/components/complaint-forms";
import { getCurrentUser } from "@/lib/auth";
import { categoryLabel, formatDateTime, priorityClass, statusClass, statusLabel } from "@/lib/utils";

// Decodes standard HTML entities for rendering sanitized content safely as text strings
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

export default async function ComplaintDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  
  // 1. Authenticate check: Redirect immediately if session does not exist
  if (!user) {
    redirect("/login");
  }

  const complaintId = Number(id);
  if (!Number.isInteger(complaintId)) {
    notFound();
  }

  // Parameterized query via ORM safely pulls the complaint matching the ID
  const [complaint] = await db
    .select()
    .from(complaints)
    .where(eq(complaints.id, complaintId))
    .limit(1);
    
  if (!complaint) {
    notFound();
  }

  // 2. IDOR (Insecure Direct Object Reference) Protection:
  // If the logged-in student is NOT the owner, and is NOT a member of staff/admin, block and redirect immediately.
  const isOwner = complaint.userId === user.id;
  const isStaff = user.role === "admin" || user.role === "staff";
  
  if (!isOwner && !isStaff) {
    redirect("/dashboard");
  }

  // Load authorized updates for this specific complaint
  const timeline = await db
    .select({
      id: complaintUpdates.id,
      message: complaintUpdates.message,
      status: complaintUpdates.status,
      createdAt: complaintUpdates.createdAt,
      authorName: users.name,
      authorRole: users.role,
    })
    .from(complaintUpdates)
    .leftJoin(users, eq(complaintUpdates.authorId, users.id))
    .where(eq(complaintUpdates.complaintId, complaint.id))
    .orderBy(desc(complaintUpdates.createdAt));

  const [fb] = await db
    .select()
    .from(feedback)
    .where(eq(feedback.complaintId, complaint.id))
    .limit(1);

  // Sanitized view context: Only reveal names if it's non-anonymous or viewed by authorized staff
  const displayName = complaint.isAnonymous && !isStaff ? "Anonymous student" : (isOwner ? user.name : "Student");

  return (
    <main className="mx-auto grid max-w-6xl gap-8 px-5 py-10 lg:grid-cols-[1.2fr_0.8fr]">
      <section>
        <Link href={isStaff ? "/admin" : "/dashboard"} className="text-sm font-semibold text-sage hover:underline">
          ← Back to desk
        </Link>
        
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <p className="rounded-full bg-mist px-3 py-1 text-xs font-semibold text-forest">
            {complaint.ticketNo}
          </p>
          <span className={statusClass(complaint.status)}>{statusLabel(complaint.status)}</span>
          <span className={priorityClass(complaint.priority)}>{complaint.priority}</span>
        </div>

        <h1 className="font-display mt-4 text-4xl text-forest">
          {decodeHtml(complaint.title)}
        </h1>

        <p className="mt-2 text-sm text-ink/60">
          {categoryLabel(complaint.category)} · {decodeHtml(complaint.location || "Campus")} · Filed{" "}
          {formatDateTime(complaint.createdAt)}
          {complaint.isAnonymous ? " · Submitted anonymously" : ` · By ${displayName}`}
        </p>

        {/* Text is safely rendered inside standard react tags, preventing raw html/script parsing */}
        <article className="mt-6 rounded-[2rem] border border-sand bg-white p-6 leading-relaxed whitespace-pre-wrap shadow-sm">
          {decodeHtml(complaint.description)}
        </article>

        <div className="mt-10">
          <h2 className="font-display text-2xl text-forest">Progress timeline</h2>
          <ol className="mt-4 space-y-4">
            {timeline.map((t) => (
              <li key={t.id} className="rounded-2xl border border-sand bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-wider text-ink/50">
                  {formatDateTime(t.createdAt)} · {t.authorName ?? "System Update"} ·{" "}
                  {t.status ? statusLabel(t.status) : "Remark"}
                </p>
                <p className="mt-2 text-sm text-ink/80 leading-relaxed">
                  {decodeHtml(t.message)}
                </p>
              </li>
            ))}
          </ol>
        </div>

        {isOwner && complaint.status !== "closed" && complaint.status !== "resolved" ? (
          <div className="mt-8 rounded-[2rem] border border-sand bg-cream/50 p-6">
            <h3 className="font-display text-xl">Add follow-up notes</h3>
            <p className="text-xs text-ink/60 mt-1">Provide more proof or details for the responding cell.</p>
            <div className="mt-4">
              <UpdateForm complaintId={complaint.id} />
            </div>
          </div>
        ) : null}
      </section>

      <aside className="space-y-5">
        <div className="rounded-[2rem] bg-forest p-6 text-cream shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-leaf">Responding Cell</p>
          <p className="mt-2 font-display text-2xl">{complaint.assignedDept}</p>
          <p className="mt-2 text-sm text-cream/75 leading-relaxed">
            This ticket is locked in our server. Reference ticket ID: <strong>{complaint.ticketNo}</strong>
          </p>
          {isStaff ? (
            <Link href={`/admin/complaints/${complaint.id}`} className="btn-terra mt-5 block text-center">
              Configure resolution parameters
            </Link>
          ) : null}
        </div>

        {isOwner && (complaint.status === "resolved" || complaint.status === "closed") ? (
          fb ? (
            <div className="rounded-[2rem] border border-sand bg-white p-6 shadow-sm">
              <p className="font-display text-xl text-forest">Resolution Rating</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-3xl font-bold text-gold">{fb.rating}</span>
                <span className="text-sm text-ink/50">out of 5 stars</span>
              </div>
              <p className="mt-3 text-sm italic text-ink/70">
                "{decodeHtml(fb.comment || "No written comments shared.")}"
              </p>
            </div>
          ) : (
            <FeedbackForm complaintId={complaint.id} />
          )
        ) : null}
      </aside>
    </main>
  );
}
