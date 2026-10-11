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
    // Two-click confirmation: no native dialog, works in the demo video.
    if (!confirming) {
      setConfirming(true);
      setNote("Click again to confirm — this will modify the database.");
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
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Ledger verification</h1>

      {loading && <Loading />}
      {error && <ErrorBox message={error} />}

      {data && (
        <Card
          title="Hash chain"
          badge={<StatusPill status={data.valid ? "valid" : "broken"} />}
        >
          <div className="space-y-2 text-sm">
            <p className="text-2xl font-semibold">
              {data.valid ? "All records verify" : "Chain integrity compromised"}
            </p>
            <p className="text-slate-400">{data.detail}</p>
            <p className="text-slate-500">
              {data.events} events checked ·{" "}
              {data.first_broken_seq != null
                ? `first broken record: seq ${data.first_broken_seq}`
                : "no broken records"}
            </p>
          </div>

          <div className="mt-5 rounded-lg border border-amber-900 bg-amber-950/30 p-4">
            <p className="text-sm font-medium text-amber-300">Demo control</p>
            <p className="mt-1 text-xs text-slate-400">
              Modifies one stored event directly in the database (as an attacker
              would), then re-runs verification. Restore with{" "}
              <code className="rounded bg-slate-900 px-1">python scripts/seed.py --reset</code>.
            </p>
            <button
              onClick={tamper}
              disabled={tampering}
              className="mt-3 rounded-md border border-amber-700 px-3 py-1.5 text-sm text-amber-300 hover:bg-amber-950 disabled:opacity-50"
            >
              {tampering ? "Tampering…" : confirming ? "Confirm tamper?" : "Simulate tampering"}
            </button>
            {note && <p className="mt-2 text-xs text-slate-400">{note}</p>}
          </div>
        </Card>
      )}
    </div>
  );
}
