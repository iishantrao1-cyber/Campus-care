import { redirect } from "next/navigation";
import { ForgotPasswordForm } from "@/components/auth-forms";
import { getCurrentUser } from "@/lib/auth";

export default async function ForgotPasswordPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "student" ? "/dashboard" : "/admin");

  return (
    <main className="mx-auto max-w-lg px-5 py-12">
      <section className="rounded-[2rem] border border-sand bg-white p-8 shadow-sm">
        <p className="text-xs uppercase tracking-[0.2em] text-sage">Account recovery</p>
        <h1 className="font-display mt-2 text-3xl text-forest">Reset your password</h1>
        <p className="mt-2 text-sm text-ink/70">
          We will send a one-time code to your verified official college email.
        </p>
        <div className="mt-6">
          <ForgotPasswordForm />
        </div>
      </section>
    </main>
  );
}
