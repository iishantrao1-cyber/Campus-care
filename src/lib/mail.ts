import nodemailer from "nodemailer";

export type MailPayload = {
  to: string;
  subject: string;
  body: string;
  purpose?: string;
  debugCode?: string;
};

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendMail(
  payload: MailPayload,
): Promise<{ delivered: boolean; mode: "smtp" | "outbox" }> {
  const smtpReady = isSmtpConfigured();

  if (!smtpReady) {
    console.error("[Campus Care mail] SMTP is not configured.");
    return { delivered: false, mode: "outbox" };
  }

  const from =
    process.env.SMTP_FROM ||
    process.env.MAIL_FROM ||
    process.env.SMTP_USER;

  const transporter = getTransporter();

  await transporter.sendMail({
    from,
    to: payload.to,
    subject: payload.subject,
    text: payload.body,
  });

  console.info(
    `[Campus Care mail] Email sent successfully to=${payload.to} purpose=${payload.purpose ?? "n/a"}`,
  );

  return { delivered: true, mode: "smtp" };
}

export function isSmtpConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS,
  );
}

export function appBaseUrl() {
  return (
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}