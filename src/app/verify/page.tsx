import { redirect } from "next/navigation";
import { VerifyForm } from "@/components/auth-forms";
import { getCurrentUser } from "@/lib/auth";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; purpose?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "student" ? "/dashboard" : "/admin");

  const sp = await searchParams;
  const purpose =
    sp.purpose === "register_staff" ? "register_staff" : "register_student";

  return (
    <main className="mx-auto max-w-lg px-5 py-12">
      <section className="rounded-[2rem] border border-sand bg-white p-8 shadow-sm">
        <p className="text-xs uppercase tracking-[0.2em] text-sage">Email verification</p>
        <h1 className="font-display mt-2 text-3xl text-forest">Confirm your official email</h1>
        <p className="mt-2 text-sm text-ink/70">
          Enter the OTP sent to your college email. The account is created only after this step.
        </p>
        <div className="mt-6">
          <VerifyForm defaultEmail={sp.email || ""} defaultPurpose={purpose} />
        </div>
      </section>
    </main>
  );
}
