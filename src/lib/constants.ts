export const APP_NAME = "Campus Care";
export const APP_TAGLINE = "Your voice. Your campus. Heard.";

export const CATEGORIES = [
  {
    slug: "hostel",
    label: "Hostel & Accommodation",
    blurb: "Rooms, water, electricity, wardens and living conditions.",
    icon: "building",
    dept: "Hostel Administration",
  },
  {
    slug: "mess",
    label: "Mess & Canteen",
    blurb: "Food quality, hygiene, timings and overcharging.",
    icon: "utensils",
    dept: "Mess Committee",
  },
  {
    slug: "academics",
    label: "Academics",
    blurb: "Classes, exams, faculty, attendance and evaluation.",
    icon: "book",
    dept: "Academic Cell",
  },
  {
    slug: "infrastructure",
    label: "Infrastructure",
    blurb: "Classrooms, labs, washrooms, lighting and repairs.",
    icon: "wrench",
    dept: "Estate Office",
  },
  {
    slug: "it",
    label: "IT & Wi-Fi",
    blurb: "Campus network, portals, lab systems and outages.",
    icon: "wifi",
    dept: "IT Cell",
  },
  {
    slug: "library",
    label: "Library",
    blurb: "Books, seating, timings, AC and digital resources.",
    icon: "library",
    dept: "Central Library",
  },
  {
    slug: "transport",
    label: "Transport",
    blurb: "College buses, routes, delays and safety.",
    icon: "bus",
    dept: "Transport Office",
  },
  {
    slug: "ragging",
    label: "Ragging & Harassment",
    blurb: "Confidential reporting for safety and dignity.",
    icon: "shield",
    dept: "Anti-Ragging Cell",
  },
  {
    slug: "sports",
    label: "Sports & Recreation",
    blurb: "Grounds, equipment, events and facilities.",
    icon: "sport",
    dept: "Sports Council",
  },
  {
    slug: "admin",
    label: "Administration",
    blurb: "Fees, certificates, scholarships and office delays.",
    icon: "stamp",
    dept: "Registrar Office",
  },
] as const;

export const STATUSES = [
  { slug: "submitted", label: "Submitted", tone: "slate" },
  { slug: "under_review", label: "Under Review", tone: "amber" },
  { slug: "in_progress", label: "In Progress", tone: "teal" },
  { slug: "resolved", label: "Resolved", tone: "green" },
  { slug: "rejected", label: "Rejected", tone: "rose" },
  { slug: "closed", label: "Closed", tone: "stone" },
] as const;

export const PRIORITIES = [
  { slug: "low", label: "Low" },
  { slug: "medium", label: "Medium" },
  { slug: "high", label: "High" },
  { slug: "urgent", label: "Urgent" },
] as const;

export const DEPARTMENTS = [
  "Computer Science",
  "Electronics",
  "Mechanical",
  "Civil",
  "Electrical",
  "Information Technology",
  "Biotechnology",
  "Management",
  "Arts & Humanities",
  "Other",
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];
export type StatusSlug = (typeof STATUSES)[number]["slug"];
export type PrioritySlug = (typeof PRIORITIES)[number]["slug"];

export function categoryBySlug(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function statusBySlug(slug: string) {
  return STATUSES.find((s) => s.slug === slug);
}

export function priorityBySlug(slug: string) {
  return PRIORITIES.find((p) => p.slug === slug);
}
