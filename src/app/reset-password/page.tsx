import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/components/auth-forms";
import { getCurrentUser } from "@/lib/auth";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "student" ? "/dashboard" : "/admin");
  const sp = await searchParams;

  return (
    <main className="mx-auto max-w-lg px-5 py-12">
      <section className="rounded-[2rem] border border-sand bg-white p-8 shadow-sm">
        <p className="text-xs uppercase tracking-[0.2em] text-sage">Password reset</p>
        <h1 className="font-display mt-2 text-3xl text-forest">Choose a new password</h1>
        <div className="mt-6">
          <ResetPasswordForm defaultEmail={sp.email || ""} />
        </div>
      </section>
    </main>
  );
}
