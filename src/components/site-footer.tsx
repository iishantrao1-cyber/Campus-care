import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-sand bg-forest text-cream">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <img src="/images/logo.png" alt="" className="h-10 w-10 rounded-xl" />
            <p className="font-display text-2xl">Campus Care</p>
          </div>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-cream/75">
            A Smart India Hackathon ready grievance portal for colleges — confidential
            reporting, live ticket tracking, and accountable resolution across hostel,
            academics, infrastructure and student safety.
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-leaf">Navigate</p>
          <div className="mt-3 space-y-2 text-sm">
            <Link href="/track" className="block hover:text-white">
              Track a ticket
            </Link>
            <Link href="/login" className="block hover:text-white">
              Student login
            </Link>
            <Link href="/register" className="block hover:text-white">
              Create account
            </Link>
            <Link href="/admin" className="block hover:text-white">
              Admin desk
            </Link>
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-leaf">Helplines</p>
          <p className="mt-3 text-sm text-cream/80">Anti-ragging: 1800-180-5522</p>
          <p className="text-sm text-cream/80">Campus care desk: 011-4455-2200</p>
          <p className="mt-3 text-sm text-cream/80">help@campuscare.in</p>
        </div>
      </div>
      <div className="border-t border-white/10 px-5 py-4 text-center text-xs text-cream/60">
        Campus Care · SIH Student Complaint Portal · Built for transparent campuses
      </div>
    </footer>
  );
}
