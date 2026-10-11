"use client";
import React from "react";
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

  const strokeColor = p < 0.05 ? "#34d399" : p < 0.25 ? "#fbbf24" : "#f87171";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Audit Risk &amp; Parametric Insurance
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-400">
          Predictive machine-learning risk modeling and automated policy binder simulation.
        </p>
      </div>

      {/* 2 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Audit-risk gauge */}
        <Card className="p-7">
          <div className="mb-6">
            <h2 className="text-base font-bold text-slate-900">Audit-Risk Score</h2>
            <p className="text-xs text-slate-400 mt-0.5">XGBoost model · Synthetic corporate training data</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-8 py-4">
            {/* Circular Gauge */}
            <div className="relative flex h-36 w-36 shrink-0 items-center justify-center">
              <svg viewBox="0 0 100 100" className="h-36 w-36 -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#F1F5F9" strokeWidth="10" />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${Math.max(p, 0.01) * 264} 264`}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-black text-slate-900 tracking-tight">{pct}%</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  Risk Level
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2 text-center sm:text-left">
              <div className="text-xs font-bold tracking-tight">
                {p < 0.05 ? (
                  <span className="text-emerald-700">Low Audit Exposure</span>
                ) : p < 0.25 ? (
                  <span className="text-amber-700">Moderate Audit Exposure</span>
                ) : (
                  <span className="text-rose-700">Elevated Audit Exposure</span>
                )}
              </div>
              <p className="text-xs text-slate-500 leading-relaxed pt-1">
                Projected claim of <strong className="text-slate-800">{usd(data.claim_estimate_usd)}</strong> evaluated against baseline company revenue of <strong className="text-slate-800">{usd(data.revenue_estimate_usd)}</strong>.
              </p>
            </div>
          </div>
        </Card>

        {/* Right: Insurance Binder */}
        <Card className="p-7">
          <div className="mb-6">
            <h2 className="text-base font-bold text-slate-900">Parametric Insurance Binder</h2>
            <p className="text-xs text-slate-400 mt-0.5">Automated tax audit defense policy · Simulation</p>
          </div>

          {b.binds ? (
            <div className="rounded-2xl bg-emerald-50/70 p-5 space-y-4 border border-emerald-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xs">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-emerald-950">Binder Issued</h3>
                    <p className="text-[11px] text-emerald-700">Audit defense policy active</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-emerald-800">Status: Bound</div>
                  <div className="text-[10px] text-emerald-600">Simulated coverage</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-emerald-200/60 text-xs">
                <div>
                  <div className="text-[10px] text-emerald-700 font-medium">Policy ID</div>
                  <div className="font-mono font-bold text-slate-900 truncate mt-0.5">{b.policy_id}</div>
                </div>
                <div>
                  <div className="text-[10px] text-emerald-700 font-medium">Premium</div>
                  <div className="font-bold text-slate-900 mt-0.5">{usd(b.premium_usd)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-emerald-700 font-medium">Coverage Limit</div>
                  <div className="font-bold text-slate-900 mt-0.5">{usd(b.claim_amount_usd)}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-50 p-6 text-center text-slate-500 text-xs border border-slate-100">
              {b.status} (Exceeds binding threshold of {(b.bind_threshold * 100).toFixed(0)}%)
            </div>
          )}

          <div className="mt-4 text-[11px] text-slate-400 leading-relaxed">
            Formula: {b.premium_formula} · {b.disclaimer}
          </div>
        </Card>
      </div>

      {/* Model Features */}
      <Card className="p-7">
        <h3 className="text-sm font-bold text-slate-900 mb-1">Evaluated Telemetry Features</h3>
        <p className="text-xs text-slate-400 mb-4">Input vector metrics fed into the XGBoost classifier</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries(data.risk.features_used).map(([key, val]) => (
            <div key={key} className="rounded-2xl bg-[#F8FAFC] p-4 border border-slate-100">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block truncate" title={key}>
                {key.replace(/_/g, " ")}
              </span>
              <span className="mt-1 text-base font-bold text-slate-900 block font-mono">
                {typeof val === "number" ? val.toFixed(3) : String(val)}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
