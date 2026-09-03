import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { complaintUpdates, complaints } from "@/db/schema";
import { TrackForm } from "@/components/complaint-forms";
import { categoryLabel, formatDateTime, statusClass, statusLabel } from "@/lib/utils";

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

export default async function TrackPage({
  searchParams,
}: {
  searchParams: Promise<{ ticket?: string }>;
}) {
  const sp = await searchParams;
  const ticket = (sp.ticket || "").trim().toUpperCase();

  let complaint = null;
  let timeline: { id: number; message: string; status: string | null; createdAt: Date }[] = [];

  if (ticket) {
    // Standard parameterized query via Drizzle, completely immune to SQL Injections
    const rows = await db
      .select()
      .from(complaints)
      .where(eq(complaints.ticketNo, ticket))
      .limit(1);
      
    complaint = rows[0] ?? null;
    if (complaint) {
      timeline = await db
        .select({
          id: complaintUpdates.id,
          message: complaintUpdates.message,
          status: complaintUpdates.status,
          createdAt: complaintUpdates.createdAt,
        })
        .from(complaintUpdates)
        .where(eq(complaintUpdates.complaintId, complaint.id))
        .orderBy(desc(complaintUpdates.createdAt));
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <p className="text-xs uppercase tracking-[0.2em] text-sage">Public tracker</p>
      <h1 className="font-display mt-2 text-4xl text-forest">Follow a ticket without logging in</h1>
      <p className="mt-2 text-sm text-ink/70">
        Enter a Campus Care ID such as <strong>CC-2026-0001</strong>. Sensitive names remain hidden
        on anonymous reports to preserve students' security.
      </p>
      <div className="mt-6 rounded-[2rem] border border-sand bg-white p-6 shadow-sm">
        <TrackForm defaultTicket={ticket} />
      </div>

      {ticket && !complaint ? (
        <p className="mt-6 rounded-2xl bg-rose-50 p-4 text-sm text-rose-800">
          No ticket found for {ticket}. Check the digits or sign in to look at your personal list.
        </p>
      ) : null}

      {complaint ? (
        <section className="mt-8 rounded-[2rem] border border-sand bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-forest">{complaint.ticketNo}</span>
            <span className={statusClass(complaint.status)}>{statusLabel(complaint.status)}</span>
          </div>
          <h2 className="font-display mt-3 text-2xl">
            {decodeHtml(complaint.title)}
          </h2>
          <p className="mt-1 text-sm text-ink/60">
            {categoryLabel(complaint.category)} · {complaint.assignedDept} ·{" "}
            {complaint.isAnonymous ? "Anonymous reporter" : "Registered student"}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-ink/80 whitespace-pre-wrap">
            {decodeHtml(complaint.description)}
          </p>
          
          <div className="mt-6 border-t border-sand/60 pt-6">
            <h3 className="font-semibold text-sm text-forest mb-4">Official resolution timeline</h3>
            <ol className="space-y-4">
              {timeline.map((t) => (
                <li key={t.id} className="border-l-2 border-leaf pl-4">
                  <p className="text-xs text-ink/50">{formatDateTime(t.createdAt)}</p>
                  <p className="text-sm mt-1 text-ink/80">{decodeHtml(t.message)}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      ) : null}
    </main>
  );
}
