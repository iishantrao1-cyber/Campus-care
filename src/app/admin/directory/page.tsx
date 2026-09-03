import Link from "next/link";
import { desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import {
  BulkStaffCsvForm,
  BulkStudentCsvForm,
  ProvisionAdminForm,
  StaffImportForm,
  StudentImportForm,
  ToggleDirectoryButton,
  ToggleUserActiveButton,
} from "@/components/admin-directory-forms";
import { db } from "@/db";
import {
  authorizedStaff,
  authorizedStudents,
  emailOutbox,
  users,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { isSmtpConfigured } from "@/lib/mail";
import { formatDateTime } from "@/lib/utils";

export default async function AdminDirectoryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/admin");

  const students = await db
    .select()
    .from(authorizedStudents)
    .orderBy(desc(authorizedStudents.updatedAt))
    .limit(100);
  const staff = await db
    .select()
    .from(authorizedStaff)
    .orderBy(desc(authorizedStaff.updatedAt))
    .limit(100);
  const accounts = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      emailVerified: users.emailVerified,
      mfaEnabled: users.mfaEnabled,
      studentId: users.studentId,
      employeeId: users.employeeId,
      department: users.department,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(100);

  const outbox = await db
    .select()
    .from(emailOutbox)
    .orderBy(desc(emailOutbox.createdAt))
    .limit(20);

  const smtp = isSmtpConfigured();

  return (
    <main className="mx-auto max-w-6xl space-y-10 px-5 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/admin" className="text-sm font-semibold text-sage hover:underline">
            ← Welcome desk
          </Link>
          <Link href="/admin/review" className="ml-4 text-sm font-semibold text-sage hover:underline">
            Review complaints
          </Link>
          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-sage">College IT directory</p>
          <h1 className="font-display mt-1 text-4xl text-forest">Users & verification source</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink/70">
            Import authorized students and staff before registration opens. Roles are enforced
            on the server. Admin accounts are provisioned here only — never via public signup.
          </p>
        </div>
        <div className="rounded-2xl bg-cream px-4 py-3 text-xs text-ink/70">
          SMTP: {smtp ? "configured" : "not configured — OTPs appear in outbox below for IT"}
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-sand bg-white p-6 shadow-sm">
          <h2 className="font-display text-2xl text-forest">Authorized students</h2>
          <p className="mt-1 text-xs text-ink/60">
            Columns: Student ID · Name · Official email · Department · Course · Year · Hostel · Phone
          </p>
          <div className="mt-4">
            <StudentImportForm />
          </div>
          <div className="mt-6 border-t border-sand pt-4">
            <p className="mb-2 text-sm font-semibold">Bulk CSV</p>
            <BulkStudentCsvForm />
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-ink/50">
                <tr>
                  <th className="py-2">ID</th>
                  <th className="py-2">Name</th>
                  <th className="py-2">Email</th>
                  <th className="py-2">Active</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-t border-sand/70">
                    <td className="py-2 font-medium">{s.studentId}</td>
                    <td className="py-2">{s.name}</td>
                    <td className="py-2 text-ink/70">{s.email}</td>
                    <td className="py-2">
                      {s.isActive ? "Yes" : "No"}{" "}
                      <ToggleDirectoryButton kind="student" id={s.id} active={s.isActive} />
                    </td>
                  </tr>
                ))}
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-ink/50">
                      No authorized students imported yet — student registration stays closed.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-[2rem] border border-sand bg-white p-6 shadow-sm">
          <h2 className="font-display text-2xl text-forest">Authorized staff</h2>
          <p className="mt-1 text-xs text-ink/60">
            Columns: Employee ID · Name · Official email · Department · Designation · Phone
          </p>
          <div className="mt-4">
            <StaffImportForm />
          </div>
          <div className="mt-6 border-t border-sand pt-4">
            <p className="mb-2 text-sm font-semibold">Bulk CSV</p>
            <BulkStaffCsvForm />
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-ink/50">
                <tr>
                  <th className="py-2">ID</th>
                  <th className="py-2">Name</th>
                  <th className="py-2">Email</th>
                  <th className="py-2">Active</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((s) => (
                  <tr key={s.id} className="border-t border-sand/70">
                    <td className="py-2 font-medium">{s.employeeId}</td>
                    <td className="py-2">{s.name}</td>
                    <td className="py-2 text-ink/70">{s.email}</td>
                    <td className="py-2">
                      {s.isActive ? "Yes" : "No"}{" "}
                      <ToggleDirectoryButton kind="staff" id={s.id} active={s.isActive} />
                    </td>
                  </tr>
                ))}
                {staff.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-ink/50">
                      No authorized staff imported yet — staff registration stays closed.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-sand bg-white p-6 shadow-sm">
        <h2 className="font-display text-2xl text-forest">Registered accounts</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-ink/50">
              <tr>
                <th className="py-2">Name</th>
                <th className="py-2">Email</th>
                <th className="py-2">Role</th>
                <th className="py-2">Verified</th>
                <th className="py-2">MFA</th>
                <th className="py-2">Active</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.id} className="border-t border-sand/70">
                  <td className="py-2">
                    {a.name}
                    <div className="text-xs text-ink/50">
                      {a.studentId || a.employeeId || "—"} · {a.department || "—"}
                    </div>
                  </td>
                  <td className="py-2">{a.email}</td>
                  <td className="py-2 uppercase">{a.role}</td>
                  <td className="py-2">{a.emailVerified ? "Yes" : "No"}</td>
                  <td className="py-2">{a.mfaEnabled ? "On" : "Off"}</td>
                  <td className="py-2">
                    {a.isActive ? "Yes" : "No"}{" "}
                    <ToggleUserActiveButton userId={a.id} active={a.isActive} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-sand bg-white p-6 shadow-sm">
          <h2 className="font-display text-2xl text-forest">Provision administrator</h2>
          <p className="mt-1 text-sm text-ink/70">
            Only existing admins can create new admins. MFA is enabled automatically.
          </p>
          <div className="mt-4">
            <ProvisionAdminForm />
          </div>
        </div>

        <div className="rounded-[2rem] border border-sand bg-white p-6 shadow-sm">
          <h2 className="font-display text-2xl text-forest">Verification outbox</h2>
          <p className="mt-1 text-sm text-ink/70">
            When SMTP is not configured, OTPs are held here for campus IT only (never public).
          </p>
          <ul className="mt-4 max-h-96 space-y-3 overflow-y-auto text-sm">
            {outbox.map((m) => (
              <li key={m.id} className="rounded-xl bg-cream/80 p-3">
                <p className="text-xs text-ink/50">
                  {formatDateTime(m.createdAt)} · {m.purpose || "mail"} · {m.toEmail}
                </p>
                <p className="font-medium">{m.subject}</p>
                {!smtp && m.debugCode ? (
                  <p className="mt-1 font-mono text-xs text-forest">OTP: {m.debugCode}</p>
                ) : null}
              </li>
            ))}
            {outbox.length === 0 ? (
              <li className="text-ink/50">No messages yet.</li>
            ) : null}
          </ul>
        </div>
      </section>
    </main>
  );
}
