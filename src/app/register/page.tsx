import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth-forms";
import { getCurrentUser } from "@/lib/auth";
import {
  isStaffDirectoryConfigured,
  isStudentDirectoryConfigured,
} from "@/lib/directory";
import { ensureSeeded } from "@/lib/seed";

export default async function RegisterPage() {
  await ensureSeeded();
  const user = await getCurrentUser();
  if (user) redirect(user.role === "student" ? "/dashboard" : "/admin");

  const studentDirectoryReady = await isStudentDirectoryConfigured();
  const staffDirectoryReady = await isStaffDirectoryConfigured();

  return (
    <main className="mx-auto grid max-w-6xl gap-10 px-5 py-12 lg:grid-cols-[0.85fr_1.15fr]">
      <aside className="rounded-[2rem] bg-forest p-8 text-cream">
        <p className="text-xs uppercase tracking-[0.2em] text-leaf">Verified registration</p>
        <h1 className="font-display mt-3 text-4xl">Join only with college-authorized identity.</h1>
        <p className="mt-4 text-sm leading-relaxed text-cream/75">
          Student and staff accounts require a matching ID + official email in the college
          directory, then OTP verification. Admin accounts cannot be self-registered.
        </p>
        <img
          src="https://images.pexels.com/photos/7777715/pexels-photo-7777715.jpeg?auto=compress&cs=tinysrgb&w=1200"
          alt="Students in library"
          className="mt-8 h-56 w-full rounded-2xl object-cover"
        />
      </aside>
      <section className="rounded-[2rem] border border-sand bg-white p-8 shadow-sm">
        <h2 className="font-display text-3xl text-forest">Create your account</h2>
        <div className="mt-6">
          <RegisterForm
            studentDirectoryReady={studentDirectoryReady}
            staffDirectoryReady={staffDirectoryReady}
          />
        </div>
      </section>
    </main>
  );
}
