"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearToken, getToken } from "@/lib/api";

const LINKS = [
  { href: "/", label: "Overview" },
  { href: "/events", label: "Events" },
  { href: "/nexus", label: "Nexus" },
  { href: "/risk", label: "Risk & Insurance" },
  { href: "/ledger", label: "Ledger" },
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
    <nav className="border-b border-slate-800 bg-slate-900/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
        <Link href="/" className="font-semibold tracking-tight text-teal-400">
          TaxShield
        </Link>
        {authed && (
          <div className="flex flex-wrap items-center gap-4 text-sm">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={
                  path === l.href
                    ? "text-teal-400 border-b-2 border-teal-400 pb-0.5"
                    : "text-slate-300 hover:text-white"
                }
              >
                {l.label}
              </Link>
            ))}
          </div>
        )}
        <div className="ml-auto">
          {authed ? (
            <button
              onClick={() => {
                clearToken();
                router.push("/login");
              }}
              className="rounded-md border border-slate-700 px-3 py-1 text-sm text-slate-300 hover:bg-slate-800"
            >
              Log out
            </button>
          ) : (
            <Link href="/login" className="text-sm text-teal-400">
              Log in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
