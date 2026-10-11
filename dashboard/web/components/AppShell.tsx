"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { clearToken, getToken } from "@/lib/api";
import { TaxShieldBrandMark } from "@/components/TaxShieldLogo";

const NAV_ITEMS = [
  {
    href: "/",
    label: "Home",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: "/events",
    label: "Telemetry",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    href: "/nexus",
    label: "Nexus Watch",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
  {
    href: "/risk",
    label: "Insurance",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    href: "/ledger",
    label: "Ledger",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setAuthed(!!getToken());
  }, [pathname]);

  // Login page gets a clean standalone presentation
  if (pathname === "/login") {
    return <main className="min-h-screen bg-[#F4F6F9] px-4 py-8">{children}</main>;
  }

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-800 flex">
      {/* 1. Left Vertical Sidebar (Inspired by Solace) */}
      <aside className="w-64 shrink-0 hidden md:flex flex-col justify-between py-7 px-5 border-r border-slate-200/50 bg-[#F4F6F9] sticky top-0 h-screen select-none">
        <div>
          {/* Logo Brand */}
          <Link href="/" className="px-2 group block">
            <TaxShieldBrandMark subtitle="Telemetry, quietly verified." />
          </Link>

          {/* Navigation Links */}
          <nav className="mt-10 space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-white text-slate-900 shadow-[0_4px_16px_rgba(0,0,0,0.03)] border border-slate-100/90 font-semibold"
                      : "text-slate-500 hover:text-slate-900 hover:bg-white/60"
                  }`}
                >
                  <span className={isActive ? "text-sky-500" : "text-slate-400"}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom indicator badge */}
        <div className="px-2 pt-6 border-t border-slate-200/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white font-bold text-xs shadow-xs">
              TS
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900">TaxShield v2.4</p>
              <p className="text-[10px] text-slate-400">Ledger Verified</p>
            </div>
          </div>
          {authed && (
            <button
              onClick={() => {
                clearToken();
                router.push("/login");
              }}
              className="text-slate-400 hover:text-rose-600 transition-colors p-1.5 rounded-lg hover:bg-white"
              title="Sign out"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          )}
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="px-5 sm:px-8 pt-6 pb-2 flex items-center justify-between gap-4 select-none">
          {/* Solace Pill Search Bar */}
          <div className="relative flex-1 max-w-xl">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your telemetry, claims, or IRS rules..."
              className="w-full rounded-full border border-slate-200/70 bg-white py-2.5 pl-11 pr-4 text-xs sm:text-sm text-slate-800 placeholder-slate-400 shadow-[0_2px_8px_rgba(0,0,0,0.02)] focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 transition-all"
            />
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">
            {/* Notification Bell with alert dot */}
            <button className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white border border-slate-200/70 text-slate-600 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:bg-slate-50 transition-colors">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-amber-400 ring-2 ring-white"></span>
            </button>

            {/* User Profile Pill */}
            <div className="flex items-center gap-2.5 rounded-full bg-white border border-slate-200/70 pl-1 pr-3.5 py-1 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <div className="relative h-9 w-9 overflow-hidden rounded-full border border-slate-200/60 shadow-2xs shrink-0">
                <img
                  src="/lego-avatar.jpg"
                  alt="Lego Profile Avatar"
                  className="h-full w-full object-cover object-top scale-110"
                />
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  Marcus Chen
                </div>
                <div className="text-[10px] text-slate-400 leading-tight">
                  Lead Auditor
                </div>
              </div>
              <svg className="h-3 w-3 text-slate-400 hidden sm:block ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </header>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden overflow-x-auto px-5 py-2.5 gap-2 border-b border-slate-200/60 bg-white/70">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-medium ${
                pathname === item.href
                  ? "bg-slate-900 text-white font-semibold"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Main Page Workspace */}
        <main className="flex-1 px-5 sm:px-8 py-6 max-w-7xl w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
