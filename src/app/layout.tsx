import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Fraunces, Outfit } from "next/font/google";
import { HeaderWrap } from "@/components/header-wrap";
import { SiteFooter } from "@/components/site-footer";
import { ensureSeeded } from "@/lib/seed";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

export const metadata: Metadata = {
  title: "Campus Care · Student Complaint Portal",
  description:
    "Campus Care is a Smart India Hackathon student grievance portal for confidential complaints, live ticket tracking and accountable campus resolution.",
  icons: { icon: "/images/logo.png" },
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: ReactNode }) {
  await ensureSeeded();
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${fraunces.variable} font-sans antialiased`}>
        <HeaderWrap />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
