"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { Card, ErrorBox, Loading, StatusPill, usePoll } from "@/components/widgets";

export default function LedgerPage() {
  const { data, error, loading, refresh } = usePoll(() => api.verify(), 5000);
  const [tampering, setTampering] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function tamper() {
    if (!confirming) {
      setConfirming(true);
      setNote("Click again to confirm — this will modify an encrypted row in the SQLite database to prove detection.");
      return;
    }
    setConfirming(false);
    setTampering(true);
    setNote(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000"}/demo/tamper`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("taxshield_token")}` },
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.detail ?? "failed");
      setNote(body.note);
      await refresh();
    } catch (err) {
      setNote(err instanceof Error ? err.message : "failed");
    } finally {
      setTampering(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Cryptographic Hash Chain Ledger
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Append-only SHA-256 chain ensuring telemetry records remain tamper-evident.
          </p>
        </div>

        {data && (
          <div className="flex items-center gap-2 rounded-2xl bg-white border border-slate-100 px-4 py-2 shadow-2xs">
            <span className={`h-2 w-2 rounded-full ${data.valid ? "bg-emerald-500" : "bg-rose-500 animate-pulse"}`} />
            <span className="text-xs font-bold text-slate-800">
              {data.valid ? "Full Chain Verified" : "Tamper Detected"}
            </span>
          </div>
        )}
      </div>

      {loading && <Loading />}
      {error && <ErrorBox message={error} />}

      {data && (
        <>
          {/* Main Hero Card */}
          <Card className="p-7 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                  data.valid ? "bg-emerald-50 text-emerald-500" : "bg-rose-50 text-rose-500"
                }`}>
                  {data.valid ? (
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                  ) : (
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  )}
                </div>

                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">
                    {data.valid ? "Chain Integrity Verified" : "Chain Integrity Compromised!"}
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-xl">
                    {data.detail}
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right border-t sm:border-t-0 sm:border-l border-slate-100 pt-4 sm:pt-0 sm:pl-6">
                <div className="text-[10px] uppercase font-bold text-slate-400">Records Checked</div>
                <div className="text-2xl font-black text-slate-900">{data.events}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {data.first_broken_seq != null ? `First broken: Seq #${data.first_broken_seq}` : "All signatures intact"}
                </div>
              </div>
            </div>
          </Card>

          {/* Tamper Demonstration Console Card */}
          <Card className="p-7">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-400"></span>
                  <h3 className="text-sm font-bold text-slate-900">
                    Live Tamper Detection Demo
                  </h3>
                </div>
                <p className="mt-1 text-xs text-slate-500 max-w-xl">
                  Simulate an adversarial attack by directly modifying one ciphertext row in the database.
                </p>
              </div>

              <button
                onClick={tamper}
                disabled={tampering}
                className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-xs ${
                  confirming
                    ? "bg-rose-500 text-white hover:bg-rose-600 animate-pulse"
                    : "bg-slate-900 text-white hover:bg-slate-800"
                } disabled:opacity-50`}
              >
                {tampering ? "Simulating Breach…" : confirming ? "Confirm: Modify Database?" : "Simulate Tampering"}
              </button>
            </div>

            {note && (
              <div className="mt-4 rounded-2xl bg-amber-50/80 p-4 text-xs text-amber-900 border border-amber-200/50">
                <strong>Feedback:</strong> {note}
              </div>
            )}

            <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400 pt-4 border-t border-slate-100">
              <span>To restore clean ledger state after test:</span>
              <code className="font-mono bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-[11px]">
                python scripts/seed.py --reset
              </code>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
