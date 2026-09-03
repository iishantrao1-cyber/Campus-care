"use client";

import { useActionState, useState } from "react";
import {
  addStudentUpdateAction,
  adminUpdateComplaintAction,
  createComplaintAction,
  submitFeedbackAction,
  type FormState,
} from "@/app/actions/complaints";
import { CATEGORIES, PRIORITIES, STATUSES } from "@/lib/constants";

export function NewComplaintForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(
    createComplaintAction,
    null,
  );
  const [count, setCount] = useState(0);

  return (
    <form action={action} className="space-y-5">
      {state?.error ? (
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">{state.error}</p>
      ) : null}
      <label className="block text-sm font-medium">
        Title
        <input
          className="field mt-1"
          name="title"
          required
          minLength={8}
          placeholder="Short, specific — e.g. Wi-Fi down in Block C after 9 PM"
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          Category
          <select className="field mt-1" name="category" required defaultValue="hostel">
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium">
          Priority
          <select className="field mt-1" name="priority" defaultValue="medium">
            {PRIORITIES.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block text-sm font-medium">
        Location on campus
        <input className="field mt-1" name="location" placeholder="Tagore Hostel, 3rd floor washroom" />
      </label>
      <label className="block text-sm font-medium">
        Describe the issue
        <textarea
          className="field mt-1 min-h-36"
          name="description"
          required
          minLength={20}
          onChange={(e) => setCount(e.target.value.length)}
          placeholder="What happened, since when, who was informed, and what resolution you expect."
        />
        <span className="mt-1 block text-xs text-ink/50">{count} characters</span>
      </label>
      <label className="flex items-start gap-3 rounded-2xl border border-sand bg-cream/60 p-4 text-sm">
        <input type="checkbox" name="isAnonymous" className="mt-1" />
        <span>
          <strong>File anonymously.</strong> Your name stays hidden on the public tracker and
          from other students. The grievance cell can still reach you internally if needed.
        </span>
      </label>
      <button className="btn-primary" disabled={pending} type="submit">
        {pending ? "Submitting…" : "Submit complaint"}
      </button>
    </form>
  );
}

export function UpdateForm({ complaintId }: { complaintId: number }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    addStudentUpdateAction,
    null,
  );
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="complaintId" value={complaintId} />
      <textarea
        className="field min-h-24"
        name="message"
        required
        placeholder="Add a follow-up, extra photo description, or new information…"
      />
      {state?.error ? <p className="text-sm text-rose-700">{state.error}</p> : null}
      {state?.ok ? <p className="text-sm text-sage">{state.ok}</p> : null}
      <button className="btn-ghost" disabled={pending} type="submit">
        {pending ? "Posting…" : "Post update"}
      </button>
    </form>
  );
}

export function FeedbackForm({ complaintId }: { complaintId: number }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    submitFeedbackAction,
    null,
  );
  return (
    <form action={action} className="space-y-3 rounded-2xl border border-sand bg-white p-5">
      <input type="hidden" name="complaintId" value={complaintId} />
      <p className="font-display text-xl">How did we do?</p>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="cursor-pointer">
            <input className="peer sr-only" type="radio" name="rating" value={n} required />
            <span className="grid h-10 w-10 place-items-center rounded-full border border-sand peer-checked:bg-gold peer-checked:text-white">
              {n}
            </span>
          </label>
        ))}
      </div>
      <textarea className="field min-h-20" name="comment" placeholder="Optional comment" />
      {state?.error ? <p className="text-sm text-rose-700">{state.error}</p> : null}
      {state?.ok ? <p className="text-sm text-sage">{state.ok}</p> : null}
      <button className="btn-terra" disabled={pending} type="submit">
        {pending ? "Sending…" : "Submit feedback"}
      </button>
    </form>
  );
}

export function AdminUpdateForm({
  complaintId,
  status,
  priority,
  assignedTo,
  staff,
}: {
  complaintId: number;
  status: string;
  priority: string;
  assignedTo: number | null;
  staff: { id: number; name: string; role: string }[];
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    adminUpdateComplaintAction,
    null,
  );
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="complaintId" value={complaintId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          Status
          <select className="field mt-1" name="status" defaultValue={status}>
            {STATUSES.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium">
          Priority
          <select className="field mt-1" name="priority" defaultValue={priority}>
            {PRIORITIES.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block text-sm font-medium">
        Assign to
        <select className="field mt-1" name="assignedTo" defaultValue={assignedTo ?? ""}>
          <option value="">Unassigned</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} · {s.role}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium">
        Public note
        <textarea
          className="field mt-1 min-h-24"
          name="message"
          placeholder="This note appears on the student timeline."
        />
      </label>
      {state?.error ? <p className="text-sm text-rose-700">{state.error}</p> : null}
      {state?.ok ? <p className="text-sm text-sage">{state.ok}</p> : null}
      <button className="btn-primary w-full" disabled={pending} type="submit">
        {pending ? "Saving…" : "Update ticket"}
      </button>
    </form>
  );
}

export function TrackForm({ defaultTicket }: { defaultTicket?: string }) {
  return (
    <form action="/track" className="flex flex-col gap-3 sm:flex-row">
      <input
        className="field flex-1"
        name="ticket"
        defaultValue={defaultTicket}
        placeholder="CC-2026-0001"
        required
      />
      <button className="btn-primary" type="submit">
        Track status
      </button>
    </form>
  );
}
