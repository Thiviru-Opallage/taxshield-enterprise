"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearToken, getToken } from "@/lib/api";

const LINKS = [
  { href: "/", label: "Overview", icon: "dashboard" },
  { href: "/events", label: "Events Feed", icon: "activity" },
  { href: "/nexus", label: "Nexus Monitor", icon: "map" },
  { href: "/risk", label: "Risk & Insurance", icon: "shield" },
  { href: "/ledger", label: "Ledger Chain", icon: "lock" },
];

export default function Nav() {
  const path = usePathname();
  const router = useRouter();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    setAuthed(!!getToken());
  }, [path]);

  if (path === "/login") return null;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 py-3">
        {/* Brand & Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="group flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-teal-600 via-teal-500 to-emerald-400 text-white shadow-sm shadow-teal-500/20 ring-1 ring-black/5 transition-transform group-hover:scale-105">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-slate-900 text-lg">
                  TaxShield
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600 border border-slate-200/80">
                  Enterprise
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-400">R&D Telemetry & Nexus Audit</p>
            </div>
          </Link>

          {/* Navigation Items */}
          {authed && (
            <nav className="hidden md:flex items-center gap-1 rounded-xl bg-slate-100/70 p-1 border border-slate-200/60">
              {LINKS.map((l) => {
                const isActive = path === l.href;
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                      isActive
                        ? "bg-white text-slate-900 shadow-xs border border-slate-200/70"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                    }`}
                  >
                    {l.label}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          {authed ? (
            <>
              {/* Telemetry live status indicator */}
              <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50/60 px-2.5 py-1 text-xs text-emerald-800">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                </span>
                <span className="font-medium text-[11px]">Ledger Active</span>
              </div>

              {/* User profile / Logout */}
              <div className="flex items-center gap-2 pl-2">
                <div className="hidden lg:flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-800">CPA Demo Officer</span>
                  <span className="text-[10px] text-slate-400">demo@taxshield.local</span>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700 ring-2 ring-white">
                  DO
                </div>
                <button
                  onClick={() => {
                    clearToken();
                    router.push("/login");
                  }}
                  className="rounded-lg border border-slate-200/80 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-rose-600"
                  title="Sign out of TaxShield"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-teal-500 transition-colors"
            >
              Sign in to Portal
            </Link>
          )}
        </div>
      </div>

      {/* Mobile nav scrollbar */}
      {authed && (
        <div className="flex md:hidden overflow-x-auto border-t border-slate-200/60 bg-slate-50/50 px-4 py-2 gap-2">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`whitespace-nowrap rounded-lg px-3 py-1 text-xs font-medium ${
                path === l.href
                  ? "bg-white text-slate-900 border border-slate-200 shadow-xs"
                  : "text-slate-600"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
