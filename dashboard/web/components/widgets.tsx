"use client";
// Shared data hook: fetches on an interval, tracks loading + error state,
// and surfaces auth failures so no screen shows a blank page.
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";

export function usePoll<T>(fn: () => Promise<T>, ms = 5000) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const refresh = useCallback(async () => {
    try {
      setData(await fnRef.current());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, ms);
    return () => clearInterval(id);
  }, [refresh, ms]);

  return { data, error, loading, refresh };
}

export function Loading() {
  return (
    <div className="animate-pulse rounded-lg border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">
      Loading…
    </div>
  );
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-900 bg-red-950/40 p-4 text-red-300">
      <p className="font-medium">Something went wrong</p>
      <p className="mt-1 text-sm">{message}</p>
    </div>
  );
}

export function Card({
  title,
  children,
  badge,
}: {
  title: string;
  children: React.ReactNode;
  badge?: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900 p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate-400">
          {title}
        </h2>
        {badge}
      </div>
      {children}
    </section>
  );
}

export function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-100">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

export function usd(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}

export function StatusPill({ status }: { status: string }) {
  const color =
    status === "triggered" || status === "broken"
      ? "bg-red-900/60 text-red-300 border-red-800"
      : status === "approaching"
        ? "bg-amber-900/50 text-amber-300 border-amber-800"
        : "bg-emerald-900/50 text-emerald-300 border-emerald-800";
  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${color}`}>
      {status}
    </span>
  );
}
