"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  loginAction,
  registerStaffAction,
  registerStudentAction,
  requestPasswordResetAction,
  resetPasswordAction,
  verifyRegistrationAction,
  type AuthState,
} from "@/app/actions/auth";

export function LoginForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(loginAction, null);
  const [email, setEmail] = useState("");

  return (
    <form action={action} className="space-y-4">
      {state?.error ? (
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">{state.error}</p>
      ) : null}
      {state?.ok ? (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{state.ok}</p>
      ) : null}

      <label className="block text-sm font-medium">
        Campus Email
        <input
          className="field mt-1"
          type="email"
          name="email"
          required
          value={email || state?.email || ""}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@college.edu"
        />
      </label>

      <label className="block text-sm font-medium">
        Password
        <input
          className="field mt-1"
          type="password"
          name="password"
          required
          placeholder="••••••••"
        />
      </label>

      {state?.needsMfa ? (
        <div className="rounded-2xl border border-gold/40 bg-gold/5 p-4">
          <label className="block text-sm font-medium text-amber-900">
            MFA authentication code
            <input
              className="field mt-1 border-gold focus:ring-gold"
              type="text"
              name="mfaCode"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="6-digit authenticator or backup code"
              required
            />
          </label>
          <p className="mt-2 text-xs text-amber-800/80">
            Admin accounts require multi-factor authentication. Enter the code from your
            authenticator app or a one-time backup code.
          </p>
        </div>
      ) : null}

      {state?.needsVerify && state.purpose ? (
        <p className="text-sm text-ink/70">
          Need to finish verification?{" "}
          <Link
            href={`/verify?email=${encodeURIComponent(state.email || email)}&purpose=${state.purpose}`}
            className="font-semibold text-sage"
          >
            Enter OTP
          </Link>
        </p>
      ) : null}

      <button className="btn-primary w-full" disabled={pending} type="submit">
        {pending ? "Signing in…" : "Enter campus desk"}
      </button>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-ink/70">
        <Link href="/register" className="font-semibold text-sage">
          Create an account
        </Link>
        <Link href="/forgot-password" className="font-semibold text-sage">
          Forgot password?
        </Link>
      </div>
    </form>
  );
}

export function RegisterForm({
  studentDirectoryReady,
  staffDirectoryReady,
}: {
  studentDirectoryReady: boolean;
  staffDirectoryReady: boolean;
}) {
  const [tab, setTab] = useState<"student" | "staff">("student");
  const [studentState, studentAction, studentPending] = useActionState<AuthState, FormData>(
    registerStudentAction,
    null,
  );
  const [staffState, staffAction, staffPending] = useActionState<AuthState, FormData>(
    registerStaffAction,
    null,
  );

  const state = tab === "student" ? studentState : staffState;

  if (state?.needsVerify && state.email && state.purpose) {
    return (
      <div className="space-y-4">
        {state.ok ? (
          <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{state.ok}</p>
        ) : null}
        <VerifyForm
          defaultEmail={state.email}
          defaultPurpose={state.purpose}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex gap-2 rounded-full bg-cream p-1">
        <button
          type="button"
          className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold ${
            tab === "student" ? "bg-white text-forest shadow-sm" : "text-ink/60"
          }`}
          onClick={() => setTab("student")}
        >
          Student
        </button>
        <button
          type="button"
          className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold ${
            tab === "staff" ? "bg-white text-forest shadow-sm" : "text-ink/60"
          }`}
          onClick={() => setTab("staff")}
        >
          Staff
        </button>
      </div>

      {tab === "student" ? (
        !studentDirectoryReady ? (
          <DirectoryUnavailable kind="student" />
        ) : (
          <form action={studentAction} className="grid gap-4">
            {studentState?.error ? (
              <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">
                {studentState.error}
              </p>
            ) : null}
            <label className="block text-sm font-medium">
              Full name
              <input className="field mt-1" name="name" required placeholder="Aarav Sharma" />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium">
                Official college email
                <input
                  className="field mt-1"
                  type="email"
                  name="email"
                  required
                  placeholder="you@college.edu"
                />
              </label>
              <label className="block text-sm font-medium">
                Student ID
                <input className="field mt-1" name="studentId" required placeholder="CS21B1042" />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium">
                Hostel / residence (optional)
                <input className="field mt-1" name="hostel" placeholder="Tagore Block C" />
              </label>
              <label className="block text-sm font-medium">
                Phone (optional)
                <input className="field mt-1" name="phone" placeholder="98765 43210" />
              </label>
            </div>
            <label className="block text-sm font-medium">
              Password
              <input
                className="field mt-1"
                type="password"
                name="password"
                required
                minLength={8}
              />
            </label>
            <p className="text-xs text-ink/60">
              Your Student ID and official email must match the college-authorized directory.
              An OTP will be sent to that email before the account is created. Admin role cannot
              be self-assigned.
            </p>
            <button className="btn-primary w-full" disabled={studentPending} type="submit">
              {studentPending ? "Checking directory…" : "Send verification OTP"}
            </button>
          </form>
        )
      ) : !staffDirectoryReady ? (
        <DirectoryUnavailable kind="staff" />
      ) : (
        <form action={staffAction} className="grid gap-4">
          {staffState?.error ? (
            <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {staffState.error}
            </p>
          ) : null}
          <label className="block text-sm font-medium">
            Full name
            <input className="field mt-1" name="name" required placeholder="Rajesh Kulkarni" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium">
              Official college email
              <input
                className="field mt-1"
                type="email"
                name="email"
                required
                placeholder="you@college.edu"
              />
            </label>
            <label className="block text-sm font-medium">
              Staff / Employee ID
              <input className="field mt-1" name="employeeId" required placeholder="STF-1042" />
            </label>
          </div>
          <label className="block text-sm font-medium">
            Phone (optional)
            <input className="field mt-1" name="phone" placeholder="98765 43210" />
          </label>
          <label className="block text-sm font-medium">
            Password
            <input className="field mt-1" type="password" name="password" required minLength={8} />
          </label>
          <p className="text-xs text-ink/60">
            Staff accounts are created only after directory match + email OTP. Role is always
            set to Staff on the server — never Admin.
          </p>
          <button className="btn-primary w-full" disabled={staffPending} type="submit">
            {staffPending ? "Checking directory…" : "Send verification OTP"}
          </button>
        </form>
      )}

      <p className="mt-4 text-center text-sm text-ink/70">
        Already registered?{" "}
        <Link href="/login" className="font-semibold text-sage">
          Sign in
        </Link>
      </p>
    </div>
  );
}

function DirectoryUnavailable({ kind }: { kind: "student" | "staff" }) {
  return (
    <div className="rounded-2xl border border-dashed border-sand bg-cream/70 p-6 text-sm leading-relaxed text-ink/80">
      <p className="font-semibold text-forest">
        {kind === "student" ? "Student" : "Staff"} registration is currently unavailable
      </p>
      <p className="mt-2">
        The authorized {kind} directory has not been configured by the college IT / grievance
        admin yet. Open registration is disabled until official records are imported — this
        prevents unverified accounts.
      </p>
      <p className="mt-3 text-xs text-ink/60">
        Admins can import the directory from Control room → Directory after signing in with a
        provisioned administrator account.
      </p>
    </div>
  );
}

export function VerifyForm({
  defaultEmail = "",
  defaultPurpose = "register_student",
}: {
  defaultEmail?: string;
  defaultPurpose?: string;
}) {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    verifyRegistrationAction,
    null,
  );

  return (
    <form action={action} className="space-y-4">
      {state?.error ? (
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">{state.error}</p>
      ) : null}
      {state?.ok ? (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{state.ok}</p>
      ) : null}
      <input type="hidden" name="purpose" value={defaultPurpose} />
      <label className="block text-sm font-medium">
        Official email
        <input
          className="field mt-1"
          type="email"
          name="email"
          required
          defaultValue={defaultEmail}
        />
      </label>
      <label className="block text-sm font-medium">
        OTP verification code
        <input
          className="field mt-1"
          name="code"
          required
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="6-digit code"
        />
      </label>
      <button className="btn-primary w-full" disabled={pending} type="submit">
        {pending ? "Verifying…" : "Verify & create account"}
      </button>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    requestPasswordResetAction,
    null,
  );

  if (state?.needsVerify && state.email) {
    return (
      <div className="space-y-4">
        {state.ok ? (
          <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{state.ok}</p>
        ) : null}
        <ResetPasswordForm defaultEmail={state.email} />
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      {state?.error ? (
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">{state.error}</p>
      ) : null}
      {state?.ok ? (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{state.ok}</p>
      ) : null}
      <label className="block text-sm font-medium">
        Official college email
        <input className="field mt-1" type="email" name="email" required />
      </label>
      <button className="btn-primary w-full" disabled={pending} type="submit">
        {pending ? "Sending…" : "Send reset code"}
      </button>
      <p className="text-center text-sm text-ink/70">
        <Link href="/login" className="font-semibold text-sage">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}

export function ResetPasswordForm({ defaultEmail = "" }: { defaultEmail?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    resetPasswordAction,
    null,
  );

  return (
    <form action={action} className="space-y-4">
      {state?.error ? (
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">{state.error}</p>
      ) : null}
      {state?.ok ? (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {state.ok}{" "}
          <Link href="/login" className="font-semibold underline">
            Sign in
          </Link>
        </p>
      ) : null}
      <label className="block text-sm font-medium">
        Email
        <input
          className="field mt-1"
          type="email"
          name="email"
          required
          defaultValue={defaultEmail}
        />
      </label>
      <label className="block text-sm font-medium">
        Reset OTP
        <input className="field mt-1" name="code" required inputMode="numeric" />
      </label>
      <label className="block text-sm font-medium">
        New password
        <input className="field mt-1" type="password" name="password" required minLength={8} />
      </label>
      <label className="block text-sm font-medium">
        Confirm password
        <input className="field mt-1" type="password" name="confirm" required minLength={8} />
      </label>
      <button className="btn-primary w-full" disabled={pending} type="submit">
        {pending ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
