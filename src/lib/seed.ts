import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { generateBackupCodes, generateMfaSecret } from "@/lib/totp";

let seeding: Promise<void> | null = null;

export async function ensureSeeded() {
  if (!seeding) {
    seeding = runSeed()
      .catch((error) => {
        console.error("Campus Care seed skipped:", error);
      })
      .finally(() => {
        seeding = null;
      });
  }
  await seeding;
}

/**
 * Production-oriented bootstrap:
 * - Does NOT invent student/staff directory rows.
 * - Does NOT create open registration accounts.
 * - Creates a single admin only when ADMIN_BOOTSTRAP_EMAIL + ADMIN_BOOTSTRAP_PASSWORD
 *   are set AND no admin exists yet.
 * - Directory must be imported by college IT before registration opens.
 */
async function runSeed() {
  const [adminCount] = await db
    .select({ n: count() })
    .from(users)
    .where(eq(users.role, "admin"));

  if (Number(adminCount?.n ?? 0) > 0) return;

  const email = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  const name = process.env.ADMIN_BOOTSTRAP_NAME?.trim() || "Campus Administrator";

  if (!email || !password) {
    console.info(
      "Campus Care: no admin bootstrap env set. Create the first admin via ADMIN_BOOTSTRAP_EMAIL / ADMIN_BOOTSTRAP_PASSWORD, then import authorized students/staff.",
    );
    return;
  }

  if (password.length < 10) {
    console.error("ADMIN_BOOTSTRAP_PASSWORD must be at least 10 characters.");
    return;
  }

  const mfaSecret = generateMfaSecret();
  const backups = generateBackupCodes(8);

  await db.insert(users).values({
    name,
    email,
    employeeId: process.env.ADMIN_BOOTSTRAP_EMPLOYEE_ID?.trim().toUpperCase() || "ADM-001",
    passwordHash: hashPassword(password),
    role: "admin",
    department: "Administration",
    emailVerified: true,
    isActive: true,
    mfaEnabled: true,
    mfaSecret,
    mfaBackupCodes: JSON.stringify(backups),
  });

  console.info(
    `Campus Care: bootstrap admin created for ${email}. Enroll TOTP with the stored MFA secret or use backup codes from secure admin setup logs (not exposed to the public).`,
  );
}
