import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl px-5 py-24 text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-sage">404</p>
      <h1 className="font-display mt-2 text-4xl text-forest">This corridor does not exist</h1>
      <p className="mt-3 text-sm text-ink/70">
        The page may have been moved. Head back to Campus Care and try tracking a ticket instead.
      </p>
      <Link href="/" className="btn-primary mt-6">
        Return home
      </Link>
    </main>
  );
}
