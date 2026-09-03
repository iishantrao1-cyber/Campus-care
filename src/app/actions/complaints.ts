"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { complaintUpdates, complaints, feedback, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { CATEGORIES, PRIORITIES, STATUSES, categoryBySlug } from "@/lib/constants";
import { ensureSeeded } from "@/lib/seed";

export type FormState = { error?: string; ok?: string } | null;

function isCategory(value: string) {
  return CATEGORIES.some((c) => c.slug === value);
}

function isPriority(value: string) {
  return PRIORITIES.some((p) => p.slug === value);
}

function isStatus(value: string) {
  return STATUSES.some((s) => s.slug === value);
}

// Escapes special HTML characters to prevent XSS (Cross Site Scripting) payloads
function sanitizeText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

export async function createComplaintAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await ensureSeeded();
  const user = await getCurrentUser();
  
  // High-Security Check: Block non-students or unauthenticated / unverified sessions
  if (!user || user.role !== "student" || !user.emailVerified || !user.isActive) {
    return {
      error: "Authorization error: Please sign in as a verified student to file a complaint.",
    };
  }

  // Parse and truncate inputs strictly to block overflow attempts
  const rawTitle = String(formData.get("title") || "").trim().slice(0, 150);
  const rawDescription = String(formData.get("description") || "").trim().slice(0, 3000);
  const category = String(formData.get("category") || "");
  const priority = String(formData.get("priority") || "medium");
  const rawLocation = String(formData.get("location") || "").trim().slice(0, 150);
  const isAnonymous = formData.get("isAnonymous") === "on";

  if (rawTitle.length < 8) return { error: "Give a clearer title (at least 8 characters)." };
  if (rawDescription.length < 20) return { error: "Describe the issue in at least 20 characters." };
  if (!isCategory(category)) return { error: "Choose a valid category." };
  if (!isPriority(priority)) return { error: "Choose a valid priority." };

  // Sanitize text values to purge any executable HTML or JavaScript injections
  const title = sanitizeText(rawTitle);
  const description = sanitizeText(rawDescription);
  const location = sanitizeText(rawLocation);

  const dept = categoryBySlug(category)?.dept ?? "Administration";

  // Use Drizzle parameterized input to save record cleanly into PostgreSQL
  const [row] = await db
    .insert(complaints)
    .values({
      ticketNo: `TMP-${Date.now()}`,
      userId: user.id,
      title,
      description,
      category,
      priority,
      status: "submitted",
      location: location || null,
      isAnonymous,
      assignedDept: dept,
    })
    .returning();

  const ticketNo = `CC-2026-${String(row.id).padStart(4, "0")}`;
  await db.update(complaints).set({ ticketNo }).where(eq(complaints.id, row.id));

  // Add the first timeline update safely
  await db.insert(complaintUpdates).values({
    complaintId: row.id,
    authorId: user.id,
    message: isAnonymous
      ? "Anonymous complaint submitted. Identity is hidden from public tracking."
      : "Complaint submitted and awaiting review by the grievance cell.",
    status: "submitted",
  });

  redirect(`/complaints/${row.id}`);
}

export async function addStudentUpdateAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Authentication required: Sign in to add an update." };

  const id = Number(formData.get("complaintId"));
  const rawMessage = String(formData.get("message") || "").trim().slice(0, 1000);
  
  if (!id || rawMessage.length < 4) return { error: "Write a short update before sending (at least 4 characters)." };

  // Secure Authorization & IDOR verification
  const [complaint] = await db.select().from(complaints).where(eq(complaints.id, id)).limit(1);
  if (!complaint) return { error: "Ticket not found." };
  
  // If the user is a student, ensure they actually own this ticket!
  if (user.role === "student" && complaint.userId !== user.id) {
    return { error: "Authorization error: You do not have permission to comment on this ticket." };
  }

  // If the user is staff, verify they are admin or assigned to the correct workflow
  const isStaff = user.role === "admin" || user.role === "staff";
  if (!isStaff && complaint.userId !== user.id) {
    return { error: "Access denied." };
  }

  const message = sanitizeText(rawMessage);

  await db.insert(complaintUpdates).values({
    complaintId: id,
    authorId: user.id,
    message,
    status: complaint.status,
  });

  await db
    .update(complaints)
    .set({ updatedAt: new Date() })
    .where(eq(complaints.id, id));

  revalidatePath(`/complaints/${id}`);
  revalidatePath(`/admin/complaints/${id}`);
  return { ok: "Update posted successfully." };
}

export async function submitFeedbackAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Authentication required." };
  
  const id = Number(formData.get("complaintId"));
  const rating = Number(formData.get("rating"));
  const rawComment = String(formData.get("comment") || "").trim().slice(0, 500);

  if (!id || rating < 1 || rating > 5) return { error: "Choose a valid rating from 1 to 5." };

  // Secure ownership verification (IDOR mitigation)
  const [complaint] = await db.select().from(complaints).where(eq(complaints.id, id)).limit(1);
  if (!complaint || complaint.userId !== user.id) {
    return { error: "Authorization error: You do not have permission to rate this ticket." };
  }

  if (complaint.status !== "resolved" && complaint.status !== "closed") {
    return { error: "Feedback can only be shared after the issue has been resolved." };
  }

  const existing = await db
    .select({ id: feedback.id })
    .from(feedback)
    .where(and(eq(feedback.complaintId, id), eq(feedback.userId, user.id)))
    .limit(1);
  if (existing.length) return { error: "You already shared feedback for this ticket." };

  const comment = sanitizeText(rawComment);

  await db.insert(feedback).values({
    complaintId: id,
    userId: user.id,
    rating,
    comment: comment || null,
  });

  if (complaint.status === "resolved") {
    await db
      .update(complaints)
      .set({ status: "closed", updatedAt: new Date() })
      .where(eq(complaints.id, id));
      
    await db.insert(complaintUpdates).values({
      complaintId: id,
      authorId: user.id,
      message: `Student rated the resolution ${rating}/5. Ticket closed.`,
      status: "closed",
    });
  }

  revalidatePath(`/complaints/${id}`);
  return { ok: "Thank you for your valuable feedback." };
}

export async function adminUpdateComplaintAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentUser();
  
  // High-Security: Verify role state from database session before executing admin action
  if (!user || (user.role !== "admin" && user.role !== "staff")) {
    return { error: "Authorization error: Staff credentials required to alter tickets." };
  }

  const id = Number(formData.get("complaintId"));
  const status = String(formData.get("status") || "");
  const priority = String(formData.get("priority") || "");
  const assignedToRaw = String(formData.get("assignedTo") || "");
  const rawMessage = String(formData.get("message") || "").trim().slice(0, 1000);

  if (!id) return { error: "Missing ticket." };
  if (!isStatus(status)) return { error: "Choose a valid status." };
  if (!isPriority(priority)) return { error: "Choose a valid priority." };

  const [complaint] = await db.select().from(complaints).where(eq(complaints.id, id)).limit(1);
  if (!complaint) return { error: "Complaint not found." };

  // Staff may only update tickets assigned to them or their department.
  if (user.role === "staff") {
    const allowed =
      complaint.assignedTo === user.id ||
      (user.department && complaint.assignedDept === user.department);
    if (!allowed) {
      return {
        error: "Authorization error: this ticket is outside your department assignment.",
      };
    }
  }

  let assignedTo: number | null = complaint.assignedTo;
  if (user.role === "admin") {
    if (assignedToRaw === "") {
      assignedTo = null;
    } else {
      const n = Number(assignedToRaw);
      if (Number.isInteger(n)) {
        const [staff] = await db.select().from(users).where(eq(users.id, n)).limit(1);
        if (staff && (staff.role === "admin" || staff.role === "staff")) {
          assignedTo = staff.id;
        }
      }
    }
  } else if (assignedTo == null) {
    // Staff picking up an unassigned departmental ticket claims it.
    assignedTo = user.id;
  }

  const resolvedAt =
    status === "resolved" || status === "closed"
      ? complaint.resolvedAt ?? new Date()
      : null;

  const message = sanitizeText(rawMessage);

  await db
    .update(complaints)
    .set({
      status,
      priority,
      assignedTo,
      updatedAt: new Date(),
      resolvedAt,
    })
    .where(eq(complaints.id, id));

  await db.insert(complaintUpdates).values({
    complaintId: id,
    authorId: user.id,
    message:
      message ||
      `Status updated to ${status.replace("_", " ")} by ${user.name}.`,
    status,
  });

  revalidatePath(`/admin`);
  revalidatePath(`/admin/complaints/${id}`);
  revalidatePath(`/complaints/${id}`);
  return { ok: "Ticket updated successfully." };
}
