"use client";

import Link from "next/link";
import { useState } from "react";
import { logoutAction } from "@/app/actions/auth";
import { Icon } from "@/components/icons";

type HeaderUser = {
  name: string;
  role: string;
} | null;

export function SiteHeader({ user }: { user: HeaderUser }) {
  const [open, setOpen] = useState(false);
  const isStaffDesk = user?.role === "admin" || user?.role === "staff";
  const dashboardHref = isStaffDesk ? "/admin" : "/dashboard";

  return (
    <header className="sticky top-0 z-40 border-b border-sand/80 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <img
            src="/images/logo.png"
            alt="Campus Care"
            className="h-10 w-10 rounded-xl object-cover shadow-sm"
          />
          <div>
            <p className="font-display text-lg leading-none text-forest">Campus Care</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-sage">
              {isStaffDesk ? "Staff control room" : "Student grievance cell"}
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-medium text-ink/80 md:flex">
          {isStaffDesk ? (
            <>
              <Link href="/admin" className="hover:text-forest">
                Welcome desk
              </Link>
              <Link href="/admin/review" className="hover:text-forest">
                Review complaints
              </Link>
              {user?.role === "admin" ? (
                <Link href="/admin/directory" className="hover:text-forest">
                  Directory
                </Link>
              ) : null}
            </>
          ) : (
            <>
              <Link href="/#how" className="hover:text-forest">
                How it works
              </Link>
              <Link href="/#categories" className="hover:text-forest">
                Categories
              </Link>
              <Link href="/track" className="hover:text-forest">
                Track ticket
              </Link>
              {user ? (
                <Link href={dashboardHref} className="hover:text-forest">
                  My desk
                </Link>
              ) : null}
            </>
          )}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <Link href={dashboardHref} className="text-sm font-semibold text-forest">
                {user.name.split(" ")[0]}
              </Link>
              {isStaffDesk ? (
                <Link href="/admin/review" className="btn-primary py-2 text-sm">
                  Review complaints
                </Link>
              ) : null}
              <form action={logoutAction}>
                <button className="btn-ghost px-3 py-2 text-sm" type="submit">
                  <Icon name="logout" className="h-4 w-4" />
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost py-2 text-sm">
                Sign in
              </Link>
              <Link href="/register" className="btn-primary py-2 text-sm">
                File a complaint
              </Link>
            </>
          )}
        </div>

        <button
          className="rounded-lg p-2 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          type="button"
        >
          <Icon name={open ? "close" : "menu"} />
        </button>
      </div>

      {open ? (
        <div className="space-y-3 border-t border-sand bg-paper px-5 py-4 md:hidden">
          {isStaffDesk ? (
            <>
              <Link href="/admin" onClick={() => setOpen(false)} className="block">
                Welcome desk
              </Link>
              <Link href="/admin/review" onClick={() => setOpen(false)} className="block">
                Review complaints
              </Link>
              {user?.role === "admin" ? (
                <Link href="/admin/directory" onClick={() => setOpen(false)} className="block">
                  Directory
                </Link>
              ) : null}
            </>
          ) : (
            <>
              <Link href="/#how" onClick={() => setOpen(false)} className="block">
                How it works
              </Link>
              <Link href="/#categories" onClick={() => setOpen(false)} className="block">
                Categories
              </Link>
              <Link href="/track" onClick={() => setOpen(false)} className="block">
                Track ticket
              </Link>
              {user ? (
                <Link href={dashboardHref} onClick={() => setOpen(false)} className="block">
                  My desk
                </Link>
              ) : (
                <Link href="/login" onClick={() => setOpen(false)} className="block">
                  Sign in
                </Link>
              )}
            </>
          )}
        </div>
      ) : null}
    </header>
  );
}
