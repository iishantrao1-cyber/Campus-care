import { categoryBySlug, statusBySlug } from "@/lib/constants";

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function daysBetween(from: Date, to = new Date()) {
  const ms = to.getTime() - from.getTime();
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
}

export function ticketFromId(id: number, year = new Date().getFullYear()) {
  return `CC-${year}-${String(id).padStart(4, "0")}`;
}

export function categoryLabel(slug: string) {
  return categoryBySlug(slug)?.label ?? slug;
}

export function statusLabel(slug: string) {
  return statusBySlug(slug)?.label ?? slug;
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function statusClass(status: string) {
  switch (status) {
    case "submitted":
      return "badge-slate";
    case "under_review":
      return "badge-amber";
    case "in_progress":
      return "badge-teal";
    case "resolved":
      return "badge-green";
    case "rejected":
      return "badge-rose";
    case "closed":
      return "badge-stone";
    default:
      return "badge-slate";
  }
}

export function priorityClass(priority: string) {
  switch (priority) {
    case "low":
      return "prio-low";
    case "medium":
      return "prio-medium";
    case "high":
      return "prio-high";
    case "urgent":
      return "prio-urgent";
    default:
      return "prio-medium";
  }
}
