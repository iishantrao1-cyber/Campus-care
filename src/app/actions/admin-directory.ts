"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  authorizedStaff,
  authorizedStudents,
  emailOutbox,
  users,
} from "@/db/schema";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { generateBackupCodes, generateMfaSecret, otpauthUri } from "@/lib/totp";

export type AdminFormState = {
  error?: string;
  ok?: string;
  mfaUri?: string;
  backupCodes?: string[];
} | null;

function clean(value: string, max: number) {
  return value.trim().slice(0, max).replace(/[<>]/g, "");
}

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return null;
  return user;
}

export async function importStudentRowAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Admin authorization required." };

  const studentId = clean(String(formData.get("studentId") || ""), 30).toUpperCase();
  const name = clean(String(formData.get("name") || ""), 80);
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase()
    .slice(0, 100);
  const department = clean(String(formData.get("department") || ""), 80);
  const course = clean(String(formData.get("course") || ""), 80);
  const year = clean(String(formData.get("year") || ""), 30);
  const hostel = clean(String(formData.get("hostel") || ""), 50);
  const phone = clean(String(formData.get("phone") || ""), 20);
  const isActive = formData.get("isActive") !== "off";

  if (studentId.length < 3 || name.length < 2 || !email.includes("@")) {
    return { error: "Student ID, name, and official email are required." };
  }

  const existing = await db
    .select()
    .from(authorizedStudents)
    .where(eq(authorizedStudents.studentId, studentId))
    .limit(1);

  if (existing[0]) {
    await db
      .update(authorizedStudents)
      .set({
        name,
        email,
        department: department || null,
        course: course || null,
        year: year || null,
        hostel: hostel || null,
        phone: phone || null,
        isActive,
        updatedAt: new Date(),
        importedBy: admin.id,
      })
      .where(eq(authorizedStudents.id, existing[0].id));
  } else {
    await db.insert(authorizedStudents).values({
      studentId,
      name,
      email,
      department: department || null,
      course: course || null,
      year: year || null,
      hostel: hostel || null,
      phone: phone || null,
      isActive,
      importedBy: admin.id,
    });
  }

  revalidatePath("/admin/directory");
  return { ok: `Authorized student ${studentId} saved.` };
}

export async function importStaffRowAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Admin authorization required." };

  const employeeId = clean(String(formData.get("employeeId") || ""), 30).toUpperCase();
  const name = clean(String(formData.get("name") || ""), 80);
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase()
    .slice(0, 100);
  const department = clean(String(formData.get("department") || ""), 80);
  const designation = clean(String(formData.get("designation") || ""), 80);
  const phone = clean(String(formData.get("phone") || ""), 20);
  const isActive = formData.get("isActive") !== "off";

  if (employeeId.length < 2 || name.length < 2 || !email.includes("@")) {
    return { error: "Staff ID, name, and official email are required." };
  }

  const existing = await db
    .select()
    .from(authorizedStaff)
    .where(eq(authorizedStaff.employeeId, employeeId))
    .limit(1);

  if (existing[0]) {
    await db
      .update(authorizedStaff)
      .set({
        name,
        email,
        department: department || null,
        designation: designation || null,
        phone: phone || null,
        isActive,
        updatedAt: new Date(),
        importedBy: admin.id,
      })
      .where(eq(authorizedStaff.id, existing[0].id));
  } else {
    await db.insert(authorizedStaff).values({
      employeeId,
      name,
      email,
      department: department || null,
      designation: designation || null,
      phone: phone || null,
      isActive,
      importedBy: admin.id,
    });
  }

  revalidatePath("/admin/directory");
  return { ok: `Authorized staff ${employeeId} saved.` };
}

export async function bulkImportStudentsAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Admin authorization required." };

  const csv = String(formData.get("csv") || "").trim();
  if (!csv) return { error: "Paste CSV rows first." };

  const lines = csv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  let saved = 0;
  let skipped = 0;

  for (const line of lines) {
    if (/^studentid[,;\t]/i.test(line) || /^student_id/i.test(line)) continue;
    const parts = line.split(/[,;\t]/).map((p) => p.trim().replace(/^"|"$/g, ""));
    const [studentIdRaw, nameRaw, emailRaw, department, course, year, hostel, phone] =
      parts;
    const studentId = (studentIdRaw || "").toUpperCase();
    const name = nameRaw || "";
    const email = (emailRaw || "").toLowerCase();
    if (studentId.length < 3 || name.length < 2 || !email.includes("@")) {
      skipped += 1;
      continue;
    }

    const existing = await db
      .select({ id: authorizedStudents.id })
      .from(authorizedStudents)
      .where(eq(authorizedStudents.studentId, studentId))
      .limit(1);

    if (existing[0]) {
      await db
        .update(authorizedStudents)
        .set({
          name,
          email,
          department: department || null,
          course: course || null,
          year: year || null,
          hostel: hostel || null,
          phone: phone || null,
          isActive: true,
          updatedAt: new Date(),
          importedBy: admin.id,
        })
        .where(eq(authorizedStudents.id, existing[0].id));
    } else {
      await db.insert(authorizedStudents).values({
        studentId,
        name,
        email,
        department: department || null,
        course: course || null,
        year: year || null,
        hostel: hostel || null,
        phone: phone || null,
        isActive: true,
        importedBy: admin.id,
      });
    }
    saved += 1;
  }

  revalidatePath("/admin/directory");
  return { ok: `Imported/updated ${saved} student row(s). Skipped ${skipped}.` };
}

export async function bulkImportStaffAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Admin authorization required." };

  const csv = String(formData.get("csv") || "").trim();
  if (!csv) return { error: "Paste CSV rows first." };

  const lines = csv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  let saved = 0;
  let skipped = 0;

  for (const line of lines) {
    if (/^employeeid|^staffid|^employee_id/i.test(line)) continue;
    const parts = line.split(/[,;\t]/).map((p) => p.trim().replace(/^"|"$/g, ""));
    const [employeeIdRaw, nameRaw, emailRaw, department, designation, phone] = parts;
    const employeeId = (employeeIdRaw || "").toUpperCase();
    const name = nameRaw || "";
    const email = (emailRaw || "").toLowerCase();
    if (employeeId.length < 2 || name.length < 2 || !email.includes("@")) {
      skipped += 1;
      continue;
    }

    const existing = await db
      .select({ id: authorizedStaff.id })
      .from(authorizedStaff)
      .where(eq(authorizedStaff.employeeId, employeeId))
      .limit(1);

    if (existing[0]) {
      await db
        .update(authorizedStaff)
        .set({
          name,
          email,
          department: department || null,
          designation: designation || null,
          phone: phone || null,
          isActive: true,
          updatedAt: new Date(),
          importedBy: admin.id,
        })
        .where(eq(authorizedStaff.id, existing[0].id));
    } else {
      await db.insert(authorizedStaff).values({
        employeeId,
        name,
        email,
        department: department || null,
        designation: designation || null,
        phone: phone || null,
        isActive: true,
        importedBy: admin.id,
      });
    }
    saved += 1;
  }

  revalidatePath("/admin/directory");
  return { ok: `Imported/updated ${saved} staff row(s). Skipped ${skipped}.` };
}

export async function setUserActiveAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Admin authorization required." };

  const userId = Number(formData.get("userId"));
  const active = String(formData.get("active") || "") === "true";
  if (!Number.isInteger(userId)) return { error: "Invalid user." };

  const [target] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!target) return { error: "User not found." };
  if (target.role === "admin" && target.id === admin.id && !active) {
    return { error: "You cannot deactivate your own admin account." };
  }

  await db.update(users).set({ isActive: active }).where(eq(users.id, userId));
  revalidatePath("/admin/directory");
  return { ok: `User ${target.email} marked ${active ? "active" : "inactive"}.` };
}

/**
 * Provision another admin — only existing admins can do this.
 * Never accepts role from a public form; always writes role="admin" server-side.
 */
export async function provisionAdminAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Admin authorization required." };

  const name = clean(String(formData.get("name") || ""), 80);
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase()
    .slice(0, 100);
  const employeeId = clean(String(formData.get("employeeId") || ""), 30).toUpperCase();
  const password = String(formData.get("password") || "").slice(0, 128);
  const department = clean(String(formData.get("department") || "Administration"), 80);

  if (name.length < 3 || !email.includes("@") || employeeId.length < 2) {
    return { error: "Name, email, and employee ID are required." };
  }
  if (password.length < 10) {
    return { error: "Admin password must be at least 10 characters." };
  }

  const exists = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (exists.length) return { error: "Email already registered." };

  const mfaSecret = generateMfaSecret();
  const backups = generateBackupCodes(8);

  await db.insert(users).values({
    name,
    email,
    employeeId,
    passwordHash: hashPassword(password),
    role: "admin",
    department: department || "Administration",
    emailVerified: true,
    isActive: true,
    mfaEnabled: true,
    mfaSecret,
    mfaBackupCodes: JSON.stringify(backups),
  });

  revalidatePath("/admin/directory");
  return {
    ok: `Admin ${email} provisioned. Share MFA setup privately; backup codes shown once.`,
    mfaUri: otpauthUri(mfaSecret, email),
    backupCodes: backups,
  };
}

export async function toggleDirectoryActiveAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Admin authorization required." };

  const kind = String(formData.get("kind") || "");
  const id = Number(formData.get("id"));
  const active = String(formData.get("active") || "") === "true";
  if (!Number.isInteger(id)) return { error: "Invalid row." };

  if (kind === "student") {
    await db
      .update(authorizedStudents)
      .set({ isActive: active, updatedAt: new Date() })
      .where(eq(authorizedStudents.id, id));
  } else if (kind === "staff") {
    await db
      .update(authorizedStaff)
      .set({ isActive: active, updatedAt: new Date() })
      .where(eq(authorizedStaff.id, id));
  } else {
    return { error: "Unknown directory kind." };
  }

  revalidatePath("/admin/directory");
  return { ok: "Directory row updated." };
}

export async function listRecentOutboxForAdmin() {
  const admin = await requireAdmin();
  if (!admin) return [];
  return db
    .select()
    .from(emailOutbox)
    .orderBy(desc(emailOutbox.createdAt))
    .limit(30);
}
