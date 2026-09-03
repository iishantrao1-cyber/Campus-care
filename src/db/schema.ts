import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/** Application accounts — role is always set by the server, never trusted from the client. */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  /** Student roll / college ID for students */
  studentId: text("student_id"),
  /** Employee ID for staff/admin */
  employeeId: text("employee_id"),
  passwordHash: text("password_hash").notNull(),
  /** student | staff | admin — enforced server-side only */
  role: text("role").notNull().default("student"),
  department: text("department"),
  phone: text("phone"),
  hostel: text("hostel"),
  year: text("year"),
  course: text("course"),
  emailVerified: boolean("email_verified").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  mfaEnabled: boolean("mfa_enabled").notNull().default(false),
  mfaSecret: text("mfa_secret"),
  mfaBackupCodes: text("mfa_backup_codes"),
  lastLoginAt: timestamp("last_login_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

/**
 * College-provided authorized student directory.
 * Registration is allowed only when Student ID + official email match an active row.
 */
export const authorizedStudents = pgTable(
  "authorized_students",
  {
    id: serial("id").primaryKey(),
    studentId: text("student_id").notNull(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    department: text("department"),
    course: text("course"),
    year: text("year"),
    hostel: text("hostel"),
    phone: text("phone"),
    isActive: boolean("is_active").notNull().default(true),
    importedBy: integer("imported_by").references(() => users.id),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("authorized_students_student_id_uidx").on(t.studentId),
    uniqueIndex("authorized_students_email_uidx").on(t.email),
  ],
);

/**
 * College-provided authorized staff directory.
 * Staff cannot self-promote; role is always "staff" after verification.
 */
export const authorizedStaff = pgTable(
  "authorized_staff",
  {
    id: serial("id").primaryKey(),
    employeeId: text("employee_id").notNull(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    department: text("department"),
    designation: text("designation"),
    phone: text("phone"),
    isActive: boolean("is_active").notNull().default(true),
    importedBy: integer("imported_by").references(() => users.id),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("authorized_staff_employee_id_uidx").on(t.employeeId),
    uniqueIndex("authorized_staff_email_uidx").on(t.email),
  ],
);

/** OTP / magic-link tokens for email verification and password reset. */
export const emailVerifications = pgTable("email_verifications", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  /** register_student | register_staff | password_reset | email_verify */
  purpose: text("purpose").notNull(),
  codeHash: text("code_hash").notNull(),
  /** JSON blob of pending registration payload (never includes plain password long-term; short-lived). */
  payload: text("payload"),
  attempts: integer("attempts").notNull().default(0),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
  consumedAt: timestamp("consumed_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

/**
 * Outbox for verification emails when SMTP is not configured.
 * Visible only to admins so campus IT can complete onboarding during setup.
 */
export const emailOutbox = pgTable("email_outbox", {
  id: serial("id").primaryKey(),
  toEmail: text("to_email").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  purpose: text("purpose"),
  /** OTP is stored only when SMTP is disabled — never expose to students via API. */
  debugCode: text("debug_code"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const complaints = pgTable("complaints", {
  id: serial("id").primaryKey(),
  ticketNo: text("ticket_no").notNull().unique(),
  userId: integer("user_id").references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  priority: text("priority").notNull().default("medium"),
  status: text("status").notNull().default("submitted"),
  location: text("location"),
  isAnonymous: boolean("is_anonymous").notNull().default(false),
  assignedTo: integer("assigned_to").references(() => users.id),
  assignedDept: text("assigned_dept"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at", { mode: "date" }),
});

export const complaintUpdates = pgTable("complaint_updates", {
  id: serial("id").primaryKey(),
  complaintId: integer("complaint_id")
    .notNull()
    .references(() => complaints.id),
  authorId: integer("author_id").references(() => users.id),
  message: text("message").notNull(),
  status: text("status"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  complaintId: integer("complaint_id")
    .notNull()
    .references(() => complaints.id),
  userId: integer("user_id").references(() => users.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Complaint = typeof complaints.$inferSelect;
export type ComplaintUpdate = typeof complaintUpdates.$inferSelect;
export type Feedback = typeof feedback.$inferSelect;
export type AuthorizedStudent = typeof authorizedStudents.$inferSelect;
export type AuthorizedStaff = typeof authorizedStaff.$inferSelect;
export type UserRole = "student" | "staff" | "admin";
