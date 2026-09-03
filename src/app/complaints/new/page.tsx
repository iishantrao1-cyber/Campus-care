import { redirect } from "next/navigation";
import { NewComplaintForm } from "@/components/complaint-forms";
import { getCurrentUser } from "@/lib/auth";

export default async function NewComplaintPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "student") redirect("/admin");

  return (
    <main className="mx-auto grid max-w-6xl gap-8 px-5 py-10 lg:grid-cols-[1fr_0.7fr]">
      <section className="rounded-[2rem] border border-sand bg-white p-8 shadow-sm">
        <p className="text-xs uppercase tracking-[0.2em] text-sage">New ticket</p>
        <h1 className="font-display mt-2 text-4xl text-forest">Tell us what needs fixing</h1>
        <p className="mt-2 text-sm text-ink/70">
          Facts help. Names of buildings, dates, and who you already informed speed up action.
        </p>
        <div className="mt-6">
          <NewComplaintForm />
        </div>
      </section>
      <aside className="space-y-5">
        <div className="overflow-hidden rounded-[2rem]">
          <img
            src="https://images.pexels.com/photos/8419263/pexels-photo-8419263.jpeg?auto=compress&cs=tinysrgb&w=1200"
            alt="Students discussing"
            className="h-52 w-full object-cover"
          />
        </div>
        <div className="rounded-[2rem] bg-forest p-6 text-cream">
          <p className="font-display text-2xl">Guidelines</p>
          <ul className="mt-4 space-y-2 text-sm text-cream/80">
            <li>One issue per ticket keeps routing clean.</li>
            <li>Use Urgent only for safety, water, electricity or exams.</li>
            <li>Ragging reports can stay anonymous — we still act.</li>
            <li>False complaints can be marked rejected with a note.</li>
          </ul>
        </div>
      </aside>
    </main>
  );
}
