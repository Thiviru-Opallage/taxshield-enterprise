import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "TaxShield Enterprise | Telemetry & R&D Tax Credit Portfolio",
  description: "Enterprise operational telemetry turned into defensible IRS Section 41 credits and multi-state nexus watch.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-[#F4F6F9] text-slate-800 antialiased selection:bg-sky-100 selection:text-sky-900"
      >
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
