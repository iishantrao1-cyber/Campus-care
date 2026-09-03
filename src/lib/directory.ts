import { and, count, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  authorizedStaff,
  authorizedStudents,
} from "@/db/schema";

export async function isStudentDirectoryConfigured() {
  const [row] = await db
    .select({ n: count() })
    .from(authorizedStudents)
    .where(eq(authorizedStudents.isActive, true));
  return Number(row?.n ?? 0) > 0;
}

export async function isStaffDirectoryConfigured() {
  const [row] = await db
    .select({ n: count() })
    .from(authorizedStaff)
    .where(eq(authorizedStaff.isActive, true));
  return Number(row?.n ?? 0) > 0;
}

export async function findAuthorizedStudent(studentId: string, email: string) {
  const sid = studentId.trim().toUpperCase();
  const em = email.trim().toLowerCase();
  const rows = await db
    .select()
    .from(authorizedStudents)
    .where(
      and(
        eq(authorizedStudents.studentId, sid),
        eq(authorizedStudents.email, em),
        eq(authorizedStudents.isActive, true),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function findAuthorizedStaff(employeeId: string, email: string) {
  const eid = employeeId.trim().toUpperCase();
  const em = email.trim().toLowerCase();
  const rows = await db
    .select()
    .from(authorizedStaff)
    .where(
      and(
        eq(authorizedStaff.employeeId, eid),
        eq(authorizedStaff.email, em),
        eq(authorizedStaff.isActive, true),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}
