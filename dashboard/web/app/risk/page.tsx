"use client";
import { api } from "@/lib/api";
import { Card, ErrorBox, Loading, usd, usePoll } from "@/components/widgets";

export default function RiskPage() {
  const { data, error, loading } = usePoll(() => api.risk(), 8000);

  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} />;
  if (!data) return null;

  const p = data.risk.audit_risk_probability;
  const pct = (p * 100).toFixed(1);
  const b = data.binder;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Audit risk &amp; insurance</h1>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Audit-risk score" badge={<span className="rounded bg-amber-950 border border-amber-900 px-2 py-0.5 text-[11px] text-amber-400">synthetic training data</span>}>
          <div className="flex items-center gap-6">
            <div className="relative h-32 w-32">
              <svg viewBox="0 0 100 100" className="h-32 w-32 -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#1e293b" strokeWidth="10" />
                <circle
                  cx="50" cy="50" r="42" fill="none"
                  stroke={p < 0.05 ? "#34d399" : p < 0.25 ? "#fbbf24" : "#f87171"}
                  strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={`${Math.max(p, 0.01) * 264} 264`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-semibold">{pct}%</span>
                <span className="text-[10px] text-slate-500">audit risk</span>
              </div>
            </div>
            <div className="text-sm text-slate-300">
              <p className="mb-2">{data.risk.model}</p>
              <p className="text-xs text-slate-500">
                Claim estimate {usd(data.claim_estimate_usd)} against estimated
                revenue {usd(data.revenue_estimate_usd)}.
              </p>
            </div>
          </div>
        </Card>

        <Card title="Insurance binder" badge={<span className="rounded bg-red-950 border border-red-900 px-2 py-0.5 text-[11px] text-red-400">SIMULATED</span>}>
          {b.binds ? (
            <div className="rounded-lg border border-emerald-800 bg-emerald-950/40 p-4">
              <p className="font-medium text-emerald-300">Binder issued (simulated)</p>
              <dl className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between"><dt className="text-slate-400">Policy ID</dt><dd className="font-mono">{b.policy_id}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-400">Premium</dt><dd>{usd(b.premium_usd)}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-400">Claim amount</dt><dd>{usd(b.claim_amount_usd)}</dd></div>
              </dl>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-700 bg-slate-950 p-4 text-slate-300">
              <p className="font-medium">{b.status}</p>
            </div>
          )}
          <p className="mt-3 text-xs text-slate-500">
            {b.disclaimer} · binds only when risk &lt; {(b.bind_threshold * 100).toFixed(0)}% ·
            premium = {b.premium_formula}
          </p>
        </Card>
      </div>

      <Card title="Model features (what the score saw)">
        <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(data.risk.features_used).map(([k, v]) => (
            <div key={k} className="rounded border border-slate-800 bg-slate-950 px-3 py-2">
              <p className="text-xs text-slate-500">{k}</p>
              <p>{typeof v === "number" ? v.toFixed(3) : String(v)}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
