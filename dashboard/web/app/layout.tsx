import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "TaxShield Enterprise",
  description: "R&D tax credit and nexus telemetry — student demo project",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        <Nav />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 py-6 text-xs text-slate-500">
          TaxShield Enterprise — student demonstration project. Estimates are
          simplified and are NOT tax advice. Insurance binders are SIMULATED.
        </footer>
      </body>
    </html>
  );
}
