"use client";

import { useActionState } from "react";
import {
  bulkImportStaffAction,
  bulkImportStudentsAction,
  importStaffRowAction,
  importStudentRowAction,
  provisionAdminAction,
  setUserActiveAction,
  toggleDirectoryActiveAction,
  type AdminFormState,
} from "@/app/actions/admin-directory";

function Status({ state }: { state: AdminFormState }) {
  if (!state) return null;
  return (
    <div className="space-y-2">
      {state.error ? (
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">{state.error}</p>
      ) : null}
      {state.ok ? (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{state.ok}</p>
      ) : null}
      {state.mfaUri ? (
        <div className="rounded-xl bg-cream px-4 py-3 text-xs break-all text-ink/80">
          <p className="font-semibold">Authenticator URI (share privately once):</p>
          <p className="mt-1">{state.mfaUri}</p>
          {state.backupCodes?.length ? (
            <p className="mt-2">
              Backup codes: {state.backupCodes.join(" · ")}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function StudentImportForm() {
  const [state, action, pending] = useActionState<AdminFormState, FormData>(
    importStudentRowAction,
    null,
  );
  return (
    <form action={action} className="grid gap-3">
      <Status state={state} />
      <div className="grid gap-3 sm:grid-cols-2">
        <input className="field" name="studentId" placeholder="Student ID" required />
        <input className="field" name="name" placeholder="Full name" required />
        <input className="field" name="email" type="email" placeholder="Official email" required />
        <input className="field" name="department" placeholder="Department" />
        <input className="field" name="course" placeholder="Course" />
        <input className="field" name="year" placeholder="Year" />
        <input className="field" name="hostel" placeholder="Hostel" />
        <input className="field" name="phone" placeholder="Phone" />
      </div>
      <button className="btn-primary" disabled={pending} type="submit">
        {pending ? "Saving…" : "Save authorized student"}
      </button>
    </form>
  );
}

export function StaffImportForm() {
  const [state, action, pending] = useActionState<AdminFormState, FormData>(
    importStaffRowAction,
    null,
  );
  return (
    <form action={action} className="grid gap-3">
      <Status state={state} />
      <div className="grid gap-3 sm:grid-cols-2">
        <input className="field" name="employeeId" placeholder="Staff / Employee ID" required />
        <input className="field" name="name" placeholder="Full name" required />
        <input className="field" name="email" type="email" placeholder="Official email" required />
        <input className="field" name="department" placeholder="Department" />
        <input className="field" name="designation" placeholder="Designation" />
        <input className="field" name="phone" placeholder="Phone" />
      </div>
      <button className="btn-primary" disabled={pending} type="submit">
        {pending ? "Saving…" : "Save authorized staff"}
      </button>
    </form>
  );
}

export function BulkStudentCsvForm() {
  const [state, action, pending] = useActionState<AdminFormState, FormData>(
    bulkImportStudentsAction,
    null,
  );
  return (
    <form action={action} className="space-y-3">
      <Status state={state} />
      <textarea
        className="field min-h-28 font-mono text-xs"
        name="csv"
        placeholder="studentId,name,email,department,course,year,hostel,phone"
        required
      />
      <button className="btn-ghost" disabled={pending} type="submit">
        {pending ? "Importing…" : "Bulk import students"}
      </button>
    </form>
  );
}

export function BulkStaffCsvForm() {
  const [state, action, pending] = useActionState<AdminFormState, FormData>(
    bulkImportStaffAction,
    null,
  );
  return (
    <form action={action} className="space-y-3">
      <Status state={state} />
      <textarea
        className="field min-h-28 font-mono text-xs"
        name="csv"
        placeholder="employeeId,name,email,department,designation,phone"
        required
      />
      <button className="btn-ghost" disabled={pending} type="submit">
        {pending ? "Importing…" : "Bulk import staff"}
      </button>
    </form>
  );
}

export function ProvisionAdminForm() {
  const [state, action, pending] = useActionState<AdminFormState, FormData>(
    provisionAdminAction,
    null,
  );
  return (
    <form action={action} className="grid gap-3">
      <Status state={state} />
      <div className="grid gap-3 sm:grid-cols-2">
        <input className="field" name="name" placeholder="Admin full name" required />
        <input className="field" name="email" type="email" placeholder="Official email" required />
        <input className="field" name="employeeId" placeholder="Employee ID" required />
        <input className="field" name="department" placeholder="Department" defaultValue="Administration" />
        <input
          className="field sm:col-span-2"
          name="password"
          type="password"
          placeholder="Temporary password (min 10 chars)"
          required
          minLength={10}
        />
      </div>
      <button className="btn-terra" disabled={pending} type="submit">
        {pending ? "Provisioning…" : "Provision admin account"}
      </button>
    </form>
  );
}

export function ToggleUserActiveButton({
  userId,
  active,
}: {
  userId: number;
  active: boolean;
}) {
  const [state, action, pending] = useActionState<AdminFormState, FormData>(
    setUserActiveAction,
    null,
  );
  return (
    <form action={action} className="inline">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="active" value={active ? "false" : "true"} />
      <button className="text-xs font-semibold text-sage underline" disabled={pending} type="submit">
        {pending ? "…" : active ? "Deactivate" : "Activate"}
      </button>
      {state?.error ? <span className="ml-2 text-xs text-rose-700">{state.error}</span> : null}
    </form>
  );
}

export function ToggleDirectoryButton({
  kind,
  id,
  active,
}: {
  kind: "student" | "staff";
  id: number;
  active: boolean;
}) {
  const [, action, pending] = useActionState<AdminFormState, FormData>(
    toggleDirectoryActiveAction,
    null,
  );
  return (
    <form action={action} className="inline">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="active" value={active ? "false" : "true"} />
      <button className="text-xs font-semibold text-sage underline" disabled={pending} type="submit">
        {pending ? "…" : active ? "Disable" : "Enable"}
      </button>
    </form>
  );
}
