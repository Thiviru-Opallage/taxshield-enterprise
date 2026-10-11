"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api";

export function usePoll<T>(fn: () => Promise<T>, ms = 5000) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const stopped = useRef(false);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const refresh = useCallback(async () => {
    if (stopped.current) return;
    try {
      setData(await fnRef.current());
      setError(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        stopped.current = true;
        setError("Not logged in — redirecting to login…");
        if (typeof window !== "undefined" && window.location.pathname !== "/login") {
          window.location.assign("/login");
        }
        return;
      }
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    stopped.current = false;
    refresh();
    const id = setInterval(refresh, ms);
    return () => clearInterval(id);
  }, [refresh, ms]);

  return { data, error, loading, refresh };
}

export function Loading() {
  return (
    <div className="flex flex-col items-center justify-center rounded-[28px] bg-white p-16 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-100">
      <div className="relative flex h-12 w-12 items-center justify-center">
        <div className="absolute h-12 w-12 animate-ping rounded-full bg-sky-200/50"></div>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent"></div>
      </div>
      <p className="mt-4 text-sm font-semibold text-slate-700">Syncing telemetry ledger…</p>
      <p className="mt-1 text-xs text-slate-400">Verifying live IRS §41 qualification</p>
    </div>
  );
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-[24px] bg-white p-5 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-rose-100">
      <div className="flex items-center gap-3.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-500">
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800">Connection Alert</h3>
          <p className="text-xs text-slate-500 mt-0.5">{message}</p>
        </div>
      </div>
    </div>
  );
}

export function Card({
  title,
  subtitle,
  children,
  action,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-[28px] bg-white p-6 sm:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-100/80 ${className}`}>
      {(title || action) && (
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            {title && <h2 className="text-base font-bold text-slate-900 tracking-tight">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
          </div>
          {action && <div className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function usd(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

// Sophisticated, typography-first Status presentation (NO generic bubble dots)
export function StatusPill({ status, label }: { status: string; label?: string }) {
  const s = status.toLowerCase();

  if (s === "triggered" || s === "broken" || s === "failed") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50/90 px-2.5 py-1 rounded-lg">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
        <span>{label ?? (s === "triggered" ? "Nexus Triggered" : "Chain Compromised")}</span>
      </span>
    );
  }

  if (s === "approaching" || s === "warning") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50/90 px-2.5 py-1 rounded-lg">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        <span>{label ?? "Approaching Threshold"}</span>
      </span>
    );
  }

  if (s === "qualified") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 bg-teal-50/90 px-2.5 py-1 rounded-lg">
        <svg className="h-3 w-3 text-teal-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <span>Qualified §41</span>
      </span>
    );
  }

  // Clear / Valid / Clean states: Understated, quiet, non-generic
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100/70 px-2.5 py-1 rounded-lg">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      <span>{label ?? (s === "clear" ? "Within Limit" : "Verified Clean")}</span>
    </span>
  );
}
