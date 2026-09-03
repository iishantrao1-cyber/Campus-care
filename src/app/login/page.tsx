import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth-forms";
import { getCurrentUser } from "@/lib/auth";
import { ensureSeeded } from "@/lib/seed";

export default async function LoginPage() {
  await ensureSeeded();
  const user = await getCurrentUser();
  if (user) {
    redirect(user.role === "student" ? "/dashboard" : "/admin");
  }

  return (
    <main className="mx-auto grid max-w-6xl gap-10 px-5 py-12 lg:grid-cols-2 lg:py-16">
      <div className="overflow-hidden rounded-[2rem]">
        <img
          src="https://images.pexels.com/photos/2982449/pexels-photo-2982449.jpeg?auto=compress&cs=tinysrgb&w=1400"
          alt="Campus courtyard"
          className="h-64 w-full object-cover lg:h-full"
        />
      </div>
      <section className="rounded-[2rem] border border-sand bg-white p-8 shadow-sm">
        <p className="text-xs uppercase tracking-[0.2em] text-sage">Welcome back</p>
        <h1 className="font-display mt-2 text-4xl text-forest">Sign in to Campus Care</h1>
        <p className="mt-2 text-sm text-ink/70">
          Use your verified college email. Admin sign-in requires MFA.{" "}
          <Link href="/forgot-password" className="font-semibold text-sage">
            Reset password
          </Link>
        </p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
