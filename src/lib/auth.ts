import {
  createHmac,
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "crypto";
import { cookies } from "next/headers";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db";
import { emailVerifications, users, type User, type UserRole } from "@/db/schema";
import { verifyTotp } from "@/lib/totp";

const SECRET =
  process.env.SESSION_SECRET ||
  "campus-care-sih-secret-key-2026-secure-ultra-long";
const COOKIE = "campus_care_session";
const MFA_PENDING_COOKIE = "campus_care_mfa_pending";

const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();
const otpAttempts = new Map<string, { count: number; lockedUntil: number }>();

export function checkRateLimit(
  identifier: string,
  store: Map<string, { count: number; lockedUntil: number }> = loginAttempts,
  max = 5,
  lockMs = 60_000,
): { allowed: boolean; waitSec: number } {
  const now = Date.now();
  const record = store.get(identifier);
  if (record) {
    if (record.lockedUntil > now) {
      return {
        allowed: false,
        waitSec: Math.ceil((record.lockedUntil - now) / 1000),
      };
    }
    if (record.count >= max) {
      store.delete(identifier);
    }
  }
  return { allowed: true, waitSec: 0 };
}

export function recordFailedAttempt(
  identifier: string,
  store: Map<string, { count: number; lockedUntil: number }> = loginAttempts,
  max = 5,
  lockMs = 60_000,
) {
  const now = Date.now();
  const record = store.get(identifier) || { count: 0, lockedUntil: 0 };
  record.count += 1;
  if (record.count >= max) {
    record.lockedUntil = now + lockMs;
  }
  store.set(identifier, record);
}

export function resetFailedAttempts(
  identifier: string,
  store: Map<string, { count: number; lockedUntil: number }> = loginAttempts,
) {
  store.delete(identifier);
}

export function checkOtpRateLimit(identifier: string) {
  return checkRateLimit(identifier, otpAttempts, 8, 5 * 60_000);
}

export function recordOtpFailure(identifier: string) {
  recordFailedAttempt(identifier, otpAttempts, 8, 5 * 60_000);
}

export function resetOtpFailures(identifier: string) {
  resetFailedAttempts(identifier, otpAttempts);
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const computed = scryptSync(password, salt, 64);
  const original = Buffer.from(hash, "hex");
  if (computed.length !== original.length) return false;
  return timingSafeEqual(computed, original);
}

export function hashToken(value: string) {
  return createHash("sha256").update(`${SECRET}:${value}`).digest("hex");
}

export function generateOtpCode(length = 6) {
  const max = 10 ** length;
  const n = randomBytes(4).readUInt32BE(0) % max;
  return String(n).padStart(length, "0");
}

function sign(value: string) {
  return createHmac("sha256", SECRET).update(value).digest("hex");
}

function cookieSecure() {
  return process.env.NODE_ENV === "production" || process.env.FORCE_SECURE_COOKIES === "true";
}

export async function createSession(userId: number) {
  const payload = `${userId}.${Date.now()}`;
  const token = `${payload}.${sign(payload)}`;
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  store.delete(MFA_PENDING_COOKIE);
}

export async function createMfaPending(userId: number) {
  const payload = `${userId}.${Date.now()}`;
  const token = `${payload}.${sign(payload)}`;
  const store = await cookies();
  store.set(MFA_PENDING_COOKIE, token, {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(COOKIE);
  store.delete(MFA_PENDING_COOKIE);
}

function parseSignedToken(token: string | undefined, maxAgeMs: number) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, ts, sig] = parts;
  const payload = `${userId}.${ts}`;
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const sessionTime = Number(ts);
  if (!Number.isFinite(sessionTime) || Date.now() - sessionTime > maxAgeMs) return null;
  const id = Number(userId);
  return Number.isInteger(id) ? id : null;
}

export async function getSessionUserId() {
  const store = await cookies();
  return parseSignedToken(store.get(COOKIE)?.value, 7 * 24 * 60 * 60 * 1000);
}

export async function getMfaPendingUserId() {
  const store = await cookies();
  return parseSignedToken(store.get(MFA_PENDING_COOKIE)?.value, 10 * 60 * 1000);
}

export async function getCurrentUser(): Promise<User | null> {
  const id = await getSessionUserId();
  if (!id) return null;
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  const user = rows[0] ?? null;
  if (!user || !user.isActive || !user.emailVerified) return null;
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

export async function requireRole(...roles: UserRole[]) {
  const user = await getCurrentUser();
  if (!user || !roles.includes(user.role as UserRole)) {
    return null;
  }
  return user;
}

export function publicUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    studentId: user.studentId,
    employeeId: user.employeeId,
    role: user.role,
    department: user.department,
    phone: user.phone,
    hostel: user.hostel,
    year: user.year,
    course: user.course,
    emailVerified: user.emailVerified,
    mfaEnabled: user.mfaEnabled,
  };
}

export async function createEmailChallenge(opts: {
  email: string;
  purpose: string;
  payload?: Record<string, unknown>;
  ttlMinutes?: number;
}) {
  const code = generateOtpCode(6);
  const expiresAt = new Date(Date.now() + (opts.ttlMinutes ?? 20) * 60_000);
  await db
    .update(emailVerifications)
    .set({ consumedAt: new Date() })
    .where(
      and(
        eq(emailVerifications.email, opts.email.toLowerCase()),
        eq(emailVerifications.purpose, opts.purpose),
        isNull(emailVerifications.consumedAt),
      ),
    );

  await db.insert(emailVerifications).values({
    email: opts.email.toLowerCase(),
    purpose: opts.purpose,
    codeHash: hashToken(code),
    payload: opts.payload ? JSON.stringify(opts.payload) : null,
    expiresAt,
  });

  return { code, expiresAt };
}

export async function consumeEmailChallenge(opts: {
  email: string;
  purpose: string;
  code: string;
}) {
  const email = opts.email.toLowerCase();
  const rateKey = `${opts.purpose}:${email}`;
  const limit = checkOtpRateLimit(rateKey);
  if (!limit.allowed) {
    return { ok: false as const, error: `Too many OTP attempts. Wait ${limit.waitSec}s.` };
  }

  const rows = await db
    .select()
    .from(emailVerifications)
    .where(
      and(
        eq(emailVerifications.email, email),
        eq(emailVerifications.purpose, opts.purpose),
        isNull(emailVerifications.consumedAt),
        gt(emailVerifications.expiresAt, new Date()),
      ),
    )
    .limit(1);

  const row = rows[0];
  if (!row) {
    recordOtpFailure(rateKey);
    return { ok: false as const, error: "Invalid or expired verification code." };
  }

  if (row.attempts >= 8) {
    return { ok: false as const, error: "This code is locked. Request a new one." };
  }

  const expected = Buffer.from(row.codeHash);
  const provided = Buffer.from(hashToken(opts.code.trim()));
  const match =
    expected.length === provided.length && timingSafeEqual(expected, provided);

  if (!match) {
    await db
      .update(emailVerifications)
      .set({ attempts: row.attempts + 1 })
      .where(eq(emailVerifications.id, row.id));
    recordOtpFailure(rateKey);
    return { ok: false as const, error: "Invalid verification code." };
  }

  await db
    .update(emailVerifications)
    .set({ consumedAt: new Date() })
    .where(eq(emailVerifications.id, row.id));
  resetOtpFailures(rateKey);

  let payload: Record<string, unknown> | null = null;
  if (row.payload) {
    try {
      payload = JSON.parse(row.payload) as Record<string, unknown>;
    } catch {
      payload = null;
    }
  }

  return { ok: true as const, payload, row };
}

export function verifyUserMfa(user: User, code: string): boolean {
  const clean = code.trim();
  if (!clean) return false;

  if (user.mfaEnabled && user.mfaSecret) {
    if (verifyTotp(user.mfaSecret, clean)) return true;
    if (user.mfaBackupCodes) {
      try {
        const codes = JSON.parse(user.mfaBackupCodes) as string[];
        const idx = codes.findIndex((c) => c.toUpperCase() === clean.toUpperCase());
        if (idx >= 0) {
          // Backup code consumption is handled by caller if needed
          return true;
        }
      } catch {
        /* ignore */
      }
    }
    return false;
  }

  // Bootstrap / env fallback only when MFA secret not yet enrolled
  const envCode = process.env.ADMIN_MFA_BOOTSTRAP_CODE;
  if (envCode && clean === envCode) return true;
  return false;
}

export async function consumeBackupCode(user: User, code: string) {
  if (!user.mfaBackupCodes) return false;
  try {
    const codes = JSON.parse(user.mfaBackupCodes) as string[];
    const idx = codes.findIndex((c) => c.toUpperCase() === code.trim().toUpperCase());
    if (idx < 0) return false;
    const next = codes.filter((_, i) => i !== idx);
    await db
      .update(users)
      .set({ mfaBackupCodes: JSON.stringify(next) })
      .where(eq(users.id, user.id));
    return true;
  } catch {
    return false;
  }
}
