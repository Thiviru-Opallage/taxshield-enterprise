"use client";
import React from "react";
import { api } from "@/lib/api";
import { Card, ErrorBox, Loading, usd, usePoll } from "@/components/widgets";
import { StateFlag } from "@/components/StateFlag";

export default function NexusPage() {
  const { data, error, loading } = usePoll(() => api.nexus(), 8000);

  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Multi-State Nexus Watch
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Monitoring statutory sales-tax thresholds across digital commerce jurisdictions.
          </p>
        </div>

        {/* Global Summary Metric */}
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-white border border-slate-100 px-5 py-3 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Estimated Liability
            </span>
            <span className="text-lg font-black text-slate-900">
              {usd(data.total_exposure_usd)}
            </span>
          </div>
        </div>
      </div>

      {/* Top 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="p-5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Total Sales Monitored
          </span>
          <div className="mt-1 text-2xl font-black text-slate-900">
            {usd(data.total_sales_usd)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Across digital transactions</p>
        </Card>

        <Card className="p-5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Transactions Tracked
          </span>
          <div className="mt-1 text-2xl font-black text-slate-900">
            {data.total_transactions}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Customer payments</p>
        </Card>

        <Card className="p-5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Triggered Jurisdictions
          </span>
          <div className="mt-1 text-2xl font-black text-slate-900">
            {data.triggered_states.length > 0 ? (
              <span className="text-rose-600">{data.triggered_states.join(", ")}</span>
            ) : (
              <span className="text-slate-500 font-semibold text-lg">None Triggered</span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Wayfair statutory limits</p>
        </Card>
      </div>

      {/* States List Card — Completely Redesigned without generic bubble pills */}
      <Card className="p-0 overflow-hidden">
        <div className="px-7 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Monitored Jurisdictions ({data.states.length})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              South Dakota v. Wayfair statutory thresholds researched from state revenue sites
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            Auto-Sync Active
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {data.states.map((s) => {
            const pct = Math.min(Math.round(s.pct_of_threshold * 100), 100);
            const isTriggered = s.status === "triggered";
            const isApproaching = s.status === "approaching";

            return (
              <div
                key={s.code}
                className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-5 sm:px-7 hover:bg-slate-50/60 transition-colors"
              >
                {/* 1. Left: Flag + State Identity (Clean, NO stickers) */}
                <div className="flex items-center gap-3.5 min-w-[220px]">
                  <StateFlag code={s.code} className="h-7 w-10 shadow-2xs" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{s.name}</span>
                      <span className="font-mono text-xs text-slate-400">({s.code})</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Limit: {usd(s.threshold_dollars)} · {s.transactions} txns
                    </div>
                  </div>
                </div>

                {/* 2. Center: Integrated Status & Threshold Meter (Creative, NO generic pills) */}
                <div className="flex-1 max-w-xl">
                  {/* Status Headline + Dollar comparison */}
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    {isTriggered ? (
                      <div className="flex items-center gap-1.5 font-bold text-rose-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-pulse" />
                        <span>Nexus Triggered — Registration Required</span>
                      </div>
                    ) : isApproaching ? (
                      <div className="flex items-center gap-1.5 font-semibold text-amber-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        <span>Approaching Threshold ({(s.pct_of_threshold * 100).toFixed(0)}%)</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 font-medium text-slate-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                        <span>Within Safe Harbor</span>
                      </div>
                    )}

                    <div className="font-mono text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-800">{usd(s.sales_usd)}</span> / {usd(s.threshold_dollars)}
                    </div>
                  </div>

                  {/* Horizontal Threshold Track */}
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isTriggered
                          ? "bg-rose-500 shadow-xs"
                          : isApproaching
                          ? "bg-amber-400"
                          : "bg-slate-300"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* 3. Right: Financial Impact & Sourcing */}
                <div className="flex items-center justify-between lg:justify-end gap-6 min-w-[200px]">
                  {/* Exposure Amount */}
                  <div className="text-left lg:text-right">
                    <div className={`text-sm font-black ${isTriggered ? "text-rose-600" : "text-slate-400"}`}>
                      {isTriggered ? usd(s.estimated_exposure_usd) : "$0.00"}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {isTriggered ? "Est. Tax Liability" : "No Liability Due"}
                    </div>
                  </div>

                  {/* DOR Rate & Link */}
                  <div className="text-right border-l border-slate-100 pl-4">
                    <div className="text-xs font-bold text-slate-700">
                      {(s.state_rate * 100).toFixed(2)}%
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {s.verified ? (
                        <a
                          href={s.source_urls[0]}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-slate-800 underline decoration-slate-300"
                        >
                          DOR Sourced ↗
                        </a>
                      ) : (
                        <span className="text-amber-700 font-medium" title="DOR site research pending verification">
                          Est. Rate
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
