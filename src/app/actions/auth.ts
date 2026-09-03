"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  checkRateLimit,
  clearSession,
  consumeBackupCode,
  consumeEmailChallenge,
  createEmailChallenge,
  createMfaPending,
  createSession,
  getCurrentUser,
  getMfaPendingUserId,
  hashPassword,
  recordFailedAttempt,
  resetFailedAttempts,
  verifyPassword,
  verifyUserMfa,
} from "@/lib/auth";
import {
  findAuthorizedStaff,
  findAuthorizedStudent,
  isStaffDirectoryConfigured,
  isStudentDirectoryConfigured,
} from "@/lib/directory";
import { appBaseUrl, sendMail } from "@/lib/mail";
import { ensureSeeded } from "@/lib/seed";

export type AuthState = {
  error?: string;
  ok?: string;
  needsMfa?: boolean;
  needsVerify?: boolean;
  email?: string;
  purpose?: string;
} | null;

function cleanText(value: string, max: number) {
  return value.trim().slice(0, max).replace(/[<>]/g, "");
}

function isStrongPassword(password: string) {
  return password.length >= 8;
}

export async function loginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  await ensureSeeded();

  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase()
    .slice(0, 100);
  const password = String(formData.get("password") || "").slice(0, 128);
  const mfaCode = String(formData.get("mfaCode") || "").trim().slice(0, 32);

  if (!email || !password) {
    return { error: "Enter both email and password." };
  }

  const rate = checkRateLimit(email);
  if (!rate.allowed) {
    return {
      error: `Too many login attempts. Please wait ${rate.waitSec} seconds.`,
    };
  }

  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = rows[0];

  if (!user || !verifyPassword(password, user.passwordHash)) {
    recordFailedAttempt(email);
    return { error: "Invalid email or password credentials." };
  }

  if (!user.isActive) {
    recordFailedAttempt(email);
    return { error: "This account has been deactivated. Contact campus IT." };
  }

  if (!user.emailVerified) {
    return {
      error: "Email not verified yet. Complete OTP verification first.",
      needsVerify: true,
      email: user.email,
      purpose:
        user.role === "staff" ? "register_staff" : "register_student",
    };
  }

  // Admin always requires MFA. Staff requires MFA when enrolled.
  const mustMfa =
    user.role === "admin" || (user.role === "staff" && user.mfaEnabled);

  if (mustMfa) {
    if (!mfaCode) {
      await createMfaPending(user.id);
      return {
        error: "Multi-factor authentication code required.",
        needsMfa: true,
        email: user.email,
      };
    }

    const totpOk = verifyUserMfa(user, mfaCode);
    let backupOk = false;
    if (!totpOk && user.mfaBackupCodes) {
      backupOk = await consumeBackupCode(user, mfaCode);
    }
    if (!totpOk && !backupOk) {
      recordFailedAttempt(email);
      return {
        error: "Invalid MFA code. Use your authenticator app or a backup code.",
        needsMfa: true,
        email: user.email,
      };
    }
  }

  resetFailedAttempts(email);
  await db
    .update(users)
    .set({ lastLoginAt: new Date() })
    .where(eq(users.id, user.id));
  await createSession(user.id);

  if (user.role === "admin" || user.role === "staff") {
    redirect("/admin");
  }
  redirect("/dashboard");
}

export async function completeMfaAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const mfaCode = String(formData.get("mfaCode") || "").trim().slice(0, 32);
  const pendingId = await getMfaPendingUserId();
  if (!pendingId) {
    return { error: "MFA session expired. Sign in again." };
  }
  const [user] = await db.select().from(users).where(eq(users.id, pendingId)).limit(1);
  if (!user) return { error: "Account not found." };

  const rate = checkRateLimit(`mfa:${user.email}`);
  if (!rate.allowed) {
    return { error: `Too many MFA attempts. Wait ${rate.waitSec}s.` };
  }

  const totpOk = verifyUserMfa(user, mfaCode);
  let backupOk = false;
  if (!totpOk) backupOk = await consumeBackupCode(user, mfaCode);
  if (!totpOk && !backupOk) {
    recordFailedAttempt(`mfa:${user.email}`);
    return { error: "Invalid MFA code.", needsMfa: true, email: user.email };
  }

  await createSession(user.id);
  redirect(user.role === "student" ? "/dashboard" : "/admin");
}

/**
 * Student registration step 1: validate against college directory, then send OTP.
 * Role is NEVER taken from the client — always "student".
 */
export async function registerStudentAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  await ensureSeeded();

  if (!(await isStudentDirectoryConfigured())) {
    return {
      error:
        "Student registration is unavailable. The college has not imported the authorized student directory yet. Contact campus IT.",
    };
  }

  const name = cleanText(String(formData.get("name") || ""), 80);
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase()
    .slice(0, 100);
  const studentId = String(formData.get("studentId") || "")
    .trim()
    .toUpperCase()
    .slice(0, 30);
  const password = String(formData.get("password") || "").slice(0, 128);
  const hostel = cleanText(String(formData.get("hostel") || ""), 50);
  const phone = cleanText(String(formData.get("phone") || ""), 20);

  if (name.length < 3) return { error: "Please enter your full name." };
  if (!email.includes("@")) return { error: "Enter your official college email." };
  if (studentId.length < 3) return { error: "Enter your Student ID." };
  if (!isStrongPassword(password)) {
    return { error: "Password must be at least 8 characters." };
  }

  const authorized = await findAuthorizedStudent(studentId, email);
  if (!authorized) {
    return {
      error:
        "Student ID and official email do not match the authorized college directory (or the record is inactive).",
    };
  }

  const existingEmail = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existingEmail.length) {
    return { error: "An account with this email already exists. Sign in instead." };
  }

  const existingSid = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.studentId, studentId))
    .limit(1);
  if (existingSid.length) {
    return { error: "An account with this Student ID already exists." };
  }

  const passwordHash = hashPassword(password);
  const { code } = await createEmailChallenge({
    email,
    purpose: "register_student",
    payload: {
      name: authorized.name || name,
      email,
      studentId: authorized.studentId,
      passwordHash,
      department: authorized.department,
      course: authorized.course,
      year: authorized.year,
      hostel: hostel || authorized.hostel || null,
      phone: phone || authorized.phone || null,
      // role intentionally omitted from client influence
    },
    ttlMinutes: 20,
  });

  const base = appBaseUrl();
  await sendMail({
    to: email,
    subject: "Campus Care — verify your student account",
    purpose: "register_student",
    debugCode: code,
    body: [
      `Hello ${authorized.name || name},`,
      "",
      "Your Campus Care student registration OTP is:",
      code,
      "",
      `Or open: ${base}/verify?email=${encodeURIComponent(email)}&purpose=register_student`,
      "",
      "This code expires in 20 minutes. If you did not request this, ignore this email.",
    ].join("\n"),
  });

  return {
    ok: "Verification code sent to your official college email. Enter the OTP to finish account creation.",
    needsVerify: true,
    email,
    purpose: "register_student",
  };
}

/**
 * Staff registration step 1: directory match + OTP. Role always "staff".
 */
export async function registerStaffAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  await ensureSeeded();

  if (!(await isStaffDirectoryConfigured())) {
    return {
      error:
        "Staff registration is unavailable. The college has not imported the authorized staff directory yet. Contact campus IT.",
    };
  }

  const name = cleanText(String(formData.get("name") || ""), 80);
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase()
    .slice(0, 100);
  const employeeId = String(formData.get("employeeId") || "")
    .trim()
    .toUpperCase()
    .slice(0, 30);
  const password = String(formData.get("password") || "").slice(0, 128);
  const phone = cleanText(String(formData.get("phone") || ""), 20);

  if (name.length < 3) return { error: "Please enter your full name." };
  if (!email.includes("@")) return { error: "Enter your official college email." };
  if (employeeId.length < 2) return { error: "Enter your Staff / Employee ID." };
  if (!isStrongPassword(password)) {
    return { error: "Password must be at least 8 characters." };
  }

  const authorized = await findAuthorizedStaff(employeeId, email);
  if (!authorized) {
    return {
      error:
        "Staff ID and official email do not match the authorized college directory (or the record is inactive).",
    };
  }

  const existingEmail = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existingEmail.length) {
    return { error: "An account with this email already exists." };
  }

  const existingEid = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.employeeId, employeeId))
    .limit(1);
  if (existingEid.length) {
    return { error: "An account with this Staff ID already exists." };
  }

  const passwordHash = hashPassword(password);
  const { code } = await createEmailChallenge({
    email,
    purpose: "register_staff",
    payload: {
      name: authorized.name || name,
      email,
      employeeId: authorized.employeeId,
      passwordHash,
      department: authorized.department,
      phone: phone || authorized.phone || null,
    },
    ttlMinutes: 20,
  });

  const base = appBaseUrl();
  await sendMail({
    to: email,
    subject: "Campus Care — verify your staff account",
    purpose: "register_staff",
    debugCode: code,
    body: [
      `Hello ${authorized.name || name},`,
      "",
      "Your Campus Care staff registration OTP is:",
      code,
      "",
      `Or open: ${base}/verify?email=${encodeURIComponent(email)}&purpose=register_staff`,
      "",
      "This code expires in 20 minutes.",
    ].join("\n"),
  });

  return {
    ok: "Verification code sent to your official college email.",
    needsVerify: true,
    email,
    purpose: "register_staff",
  };
}

/** Complete registration after OTP — creates the user with server-assigned role. */
export async function verifyRegistrationAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  await ensureSeeded();

  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase()
    .slice(0, 100);
  const purpose = String(formData.get("purpose") || "").trim();
  const code = String(formData.get("code") || "").trim().slice(0, 12);

  if (
    purpose !== "register_student" &&
    purpose !== "register_staff"
  ) {
    return { error: "Invalid verification purpose." };
  }
  if (!email || !code) return { error: "Email and OTP code are required." };

  const result = await consumeEmailChallenge({ email, purpose, code });
  if (!result.ok) return { error: result.error, needsVerify: true, email, purpose };

  const payload = result.payload;
  if (!payload || typeof payload.passwordHash !== "string") {
    return { error: "Registration session expired. Start again." };
  }

  // Re-check uniqueness at commit time
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing.length) {
    return { error: "Account already exists. Please sign in." };
  }

  if (purpose === "register_student") {
    const studentId = String(payload.studentId || "").toUpperCase();
    const authorized = await findAuthorizedStudent(studentId, email);
    if (!authorized) {
      return { error: "Directory authorization expired or revoked." };
    }

    const [user] = await db
      .insert(users)
      .values({
        name: String(payload.name || authorized.name),
        email,
        studentId,
        passwordHash: payload.passwordHash,
        role: "student", // server-enforced
        department: authorized.department,
        course: authorized.course,
        year: authorized.year,
        hostel: payload.hostel ? String(payload.hostel) : authorized.hostel,
        phone: payload.phone ? String(payload.phone) : authorized.phone,
        emailVerified: true,
        isActive: true,
        mfaEnabled: false,
      })
      .returning();

    await createSession(user.id);
    redirect("/dashboard");
  }

  // staff
  const employeeId = String(payload.employeeId || "").toUpperCase();
  const authorized = await findAuthorizedStaff(employeeId, email);
  if (!authorized) {
    return { error: "Directory authorization expired or revoked." };
  }

  const [user] = await db
    .insert(users)
    .values({
      name: String(payload.name || authorized.name),
      email,
      employeeId,
      passwordHash: payload.passwordHash,
      role: "staff", // server-enforced — never admin via registration
      department: authorized.department,
      phone: payload.phone ? String(payload.phone) : authorized.phone,
      emailVerified: true,
      isActive: true,
      mfaEnabled: false,
    })
    .returning();

  await createSession(user.id);
  redirect("/admin");
}

export async function requestPasswordResetAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  await ensureSeeded();
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase()
    .slice(0, 100);

  if (!email.includes("@")) return { error: "Enter a valid email." };

  const rate = checkRateLimit(`reset:${email}`);
  if (!rate.allowed) {
    return { error: `Too many reset requests. Wait ${rate.waitSec}s.` };
  }

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  // Always return a generic success to avoid account enumeration
  const generic = {
    ok: "If that email is registered and verified, a reset code has been sent.",
    needsVerify: true,
    email,
    purpose: "password_reset",
  };

  if (!user || !user.emailVerified || !user.isActive) {
    recordFailedAttempt(`reset:${email}`);
    return generic;
  }

  const { code } = await createEmailChallenge({
    email,
    purpose: "password_reset",
    payload: { userId: user.id },
    ttlMinutes: 20,
  });

  const base = appBaseUrl();
  await sendMail({
    to: email,
    subject: "Campus Care — password reset code",
    purpose: "password_reset",
    debugCode: code,
    body: [
      `Hello ${user.name},`,
      "",
      "Your password reset OTP is:",
      code,
      "",
      `Open: ${base}/reset-password?email=${encodeURIComponent(email)}`,
      "",
      "Expires in 20 minutes. If you did not request this, ignore the email.",
    ].join("\n"),
  });

  return generic;
}

export async function resetPasswordAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase()
    .slice(0, 100);
  const code = String(formData.get("code") || "").trim().slice(0, 12);
  const password = String(formData.get("password") || "").slice(0, 128);
  const confirm = String(formData.get("confirm") || "").slice(0, 128);

  if (!isStrongPassword(password)) {
    return { error: "Password must be at least 8 characters.", email, purpose: "password_reset", needsVerify: true };
  }
  if (password !== confirm) {
    return { error: "Passwords do not match.", email, purpose: "password_reset", needsVerify: true };
  }

  const result = await consumeEmailChallenge({
    email,
    purpose: "password_reset",
    code,
  });
  if (!result.ok) {
    return { error: result.error, email, purpose: "password_reset", needsVerify: true };
  }

  const userId = Number(result.payload?.userId);
  if (!Number.isInteger(userId)) {
    return { error: "Invalid reset session." };
  }

  await db
    .update(users)
    .set({ passwordHash: hashPassword(password) })
    .where(and(eq(users.id, userId), eq(users.email, email)));

  return { ok: "Password updated. You can sign in now." };
}

export async function logoutAction() {
  await clearSession();
  redirect("/");
}

export async function getRegistrationAvailability() {
  await ensureSeeded();
  return {
    students: await isStudentDirectoryConfigured(),
    staff: await isStaffDirectoryConfigured(),
  };
}

export async function currentUserAction() {
  return getCurrentUser();
}
