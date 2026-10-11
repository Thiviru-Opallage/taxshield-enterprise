"use client";
import React, { useMemo, useState } from "react";
import Link from "next/link";
import { api, EventRow } from "@/lib/api";
import { Card, ErrorBox, Loading, usd, usePoll } from "@/components/widgets";

// ---- Authentic Vector Logos (NO EMOJIS) ----

function GitHubLogo({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

function AwsLogo({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.89 15.65c-2.36 1.73-5.78 2.66-8.73 2.66-4.14 0-7.87-1.52-10.69-4.06-.22-.2-.04-.51.24-.37 3.05 1.77 6.81 2.83 10.69 2.83 2.61 0 5.67-.65 8.35-2.02.41-.21.75.25.14.96zM19.98 14.39c-.3-.38-1.95-.18-2.69-.09-.23.03-.26-.17-.06-.31 1.29-.94 3.42-.67 3.68-.35.26.33-.07 2.47-1.29 3.51-.19.16-.37.07-.28-.14.28-.7 1.04-1.95.64-2.62zM11.66 8.33c0-.98.71-1.74 1.75-1.74.88 0 1.63.59 1.63 1.63v4.61c0 .76.4 1.09.92 1.09.43 0 .82-.23 1.24-.61.16-.14.33-.02.33.16v.92c-.62.61-1.35.98-2.19.98-1.27 0-1.84-.87-1.84-2.14V8.33zm-4.71 6.8c-.85 0-1.54-.36-2.01-.98v.79c0 .19-.11.27-.3.27h-1.1c-.19 0-.27-.11-.27-.3V4.93c0-.19.11-.27.3-.27h1.22c.19 0 .27.11.27.3v3.74c.48-.61 1.18-.98 2.01-.98 1.71 0 2.97 1.45 2.97 3.71s-1.27 3.7-3.09 3.7zm-.33-1.47c1.07 0 1.79-.89 1.79-2.23 0-1.33-.72-2.22-1.79-2.22-.96 0-1.7.83-1.7 2.22 0 1.39.73 2.23 1.7 2.23z" />
    </svg>
  );
}

function StripeLogo({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C17.652.795 15.087.27 12.192.27 6.452.27 2.44 3.298 2.44 8.01c0 5.437 5.12 6.786 8.57 8.082 2.502.946 3.393 1.656 3.393 2.665 0 .973-.872 1.488-2.345 1.488-2.583 0-5.405-1.164-7.243-2.196L3.9 23.582c2.091 1.05 5.347 1.838 8.652 1.838 6.07 0 10.378-2.923 10.378-7.904 0-5.877-5.326-7.14-8.954-8.366z" />
    </svg>
  );
}

function ChevronRight({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export default function TelemetryPage() {
  const [source, setSource] = useState("");
  const [qualified, setQualified] = useState("");
  const [search, setSearch] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<EventRow | null>(null);

  const { data, error, loading } = usePoll(
    () => api.events({ source: source || undefined, qualified: qualified || undefined }),
    4000
  );

  // Client-side quick filter on search text
  const filteredData = useMemo(() => {
    if (!data) return [];
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(
      (r) =>
        r.reason?.toLowerCase().includes(q) ||
        r.rule_cited?.toLowerCase().includes(q) ||
        r.source?.toLowerCase().includes(q) ||
        String(r.seq).includes(q) ||
        r.hash?.toLowerCase().includes(q)
    );
  }, [data, search]);

  // Aggregate calculations (SF Pro Numbers)
  const totalEvents = data?.length ?? 0;
  const qualifiedEvents = data?.filter((r) => r.qualified).length ?? 0;
  const totalCredit = data?.reduce((acc, r) => acc + (r.credit ?? 0), 0) ?? 0;

  // Source-specific metrics
  const ghEvents = data?.filter((r) => r.source.toLowerCase() === "github") ?? [];
  const awsEvents = data?.filter((r) => r.source.toLowerCase() === "aws") ?? [];
  const stripeEvents = data?.filter((r) => r.source.toLowerCase() === "stripe") ?? [];

  const ghCredit = ghEvents.reduce((acc, r) => acc + (r.credit ?? 0), 0);
  const awsCredit = awsEvents.reduce((acc, r) => acc + (r.credit ?? 0), 0);
  const stripeCredit = stripeEvents.reduce((acc, r) => acc + (r.credit ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Telemetry Streams
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Real-time engineering commits, cloud billing, and sales telemetry evaluated against IRS §41 qualification rules.
          </p>
        </div>

        {/* Global Sealed Badge */}
        <div className="flex items-center gap-2 rounded-2xl bg-white border border-slate-200/80 px-4 py-2 shadow-[0_2px_8px_rgba(0,0,0,0.02)] self-start sm:self-auto">
          <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
          <span className="text-xs font-bold text-slate-800">AES-256 Ledger Chained</span>
        </div>
      </div>

      {loading && <Loading />}
      {error && <ErrorBox message={error} />}

      {/* 2. Asymmetric Bento Layout: Left Stream & Right Panels */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Telemetry Feed (8 cols on desktop) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-[24px] bg-white p-3 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
              {/* Channel Selector Buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setSource("")}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    source === ""
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <span>All Channels</span>
                </button>

                <button
                  onClick={() => setSource("github")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    source === "github"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <GitHubLogo className="h-3.5 w-3.5" />
                  <span>GitHub</span>
                </button>

                <button
                  onClick={() => setSource("aws")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    source === "aws"
                      ? "bg-[#232F3E] text-[#FF9900] shadow-xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <AwsLogo className="h-3.5 w-3.5" />
                  <span>AWS</span>
                </button>

                <button
                  onClick={() => setSource("stripe")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    source === "stripe"
                      ? "bg-[#635BFF] text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <StripeLogo className="h-3.5 w-3.5" />
                  <span>Stripe</span>
                </button>
              </div>

              {/* Status and Search */}
              <div className="flex items-center gap-2">
                <div className="flex items-center rounded-xl bg-slate-100/70 p-1 text-xs">
                  <button
                    onClick={() => setQualified("")}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                      qualified === "" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setQualified("true")}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                      qualified === "true" ? "bg-white text-emerald-700 shadow-2xs" : "text-slate-500"
                    }`}
                  >
                    Qualified
                  </button>
                  <button
                    onClick={() => setQualified("false")}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                      qualified === "false" ? "bg-white text-slate-700 shadow-2xs" : "text-slate-500"
                    }`}
                  >
                    Non-Qualifying
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search events..."
                    className="w-32 sm:w-40 rounded-xl border border-slate-200/80 bg-[#F8FAFC] py-1 pl-7 pr-2.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-400 transition-all"
                  />
                  <svg
                    className="absolute left-2 top-2 h-3.5 w-3.5 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Event Records Card — Ultra User-Friendly Layout */}
            <Card className="p-0 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-slate-700">
                  Showing {filteredData.length} telemetry records
                </span>
                <span className="font-medium">Sequential Ledger Order</span>
              </div>

              {filteredData.length === 0 ? (
                <div className="py-20 text-center text-slate-400">
                  <svg className="mx-auto h-8 w-8 text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
                    <path d="M12 8v4m0 4h.01" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <p className="text-sm font-semibold text-slate-600">No events found</p>
                  <p className="text-xs text-slate-400 mt-0.5">Adjust channel or qualification filters</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredData.map((r: EventRow) => {
                    const s = r.source.toLowerCase();
                    const isStripe = s === "stripe";

                    return (
                      <div
                        key={r.seq}
                        onClick={() => setSelectedEvent(selectedEvent?.seq === r.seq ? null : r)}
                        className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-5 p-5 hover:bg-slate-50/70 transition-all cursor-pointer border-l-[3px] ${
                          r.qualified
                            ? "border-l-teal-500 bg-white"
                            : "border-l-slate-200 bg-white"
                        }`}
                      >
                        {/* Left: Brand Icon & Organized Rationale Content */}
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          {/* Brand Logo Container */}
                          <div className="shrink-0 mt-0.5">
                            {s === "github" ? (
                              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-xs group-hover:scale-105 transition-transform">
                                <GitHubLogo className="h-5.5 w-5.5" />
                              </div>
                            ) : s === "aws" ? (
                              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#232F3E] text-[#FF9900] shadow-xs group-hover:scale-105 transition-transform">
                                <AwsLogo className="h-5.5 w-5.5" />
                              </div>
                            ) : (
                              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#635BFF] text-white shadow-xs group-hover:scale-105 transition-transform">
                                <StripeLogo className="h-5.5 w-5.5" />
                              </div>
                            )}
                          </div>

                          {/* Content Body */}
                          <div className="flex-1 min-w-0 space-y-1.5">
                            {/* Line 1: Clear Header Hierarchy (All in SF Pro font) */}
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <span className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                                {r.source === "stripe" ? "Stripe Payment" : r.source === "github" ? "GitHub Commit" : "AWS Cloud"}
                              </span>

                              <span className="text-xs font-semibold text-slate-400">
                                Event #{r.seq}
                              </span>

                              {/* Clear, Positive Status Classification */}
                              {r.qualified ? (
                                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full">
                                  <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                                  <span>Eligible R&amp;D Expense</span>
                                </span>
                              ) : isStripe ? (
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                                  <span>Multi-State Nexus Event</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                                  <span>Routine Infrastructure</span>
                                </span>
                              )}
                            </div>

                            {/* Line 2: User-Friendly Description */}
                            <div className="text-sm font-semibold text-slate-800 leading-snug">
                              {r.reason}
                            </div>

                            {/* Line 3: Helpful Statutory Explanation */}
                            {r.rule_cited && (
                              <div className="text-xs text-slate-500 leading-relaxed">
                                {r.rule_cited}
                              </div>
                            )}

                            {/* Line 4: Clean Structured Metadata Strip */}
                            <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap pt-0.5">
                              <span className="text-slate-500 font-medium">
                                Engine: {r.engine}
                              </span>
                              <span>·</span>
                              {r.confidence != null && (
                                <>
                                  <span className="text-slate-500 font-medium">
                                    {(r.confidence * 100).toFixed(0)}% confidence
                                  </span>
                                  <span>·</span>
                                </>
                              )}
                              <span className="text-slate-400">
                                SHA-256: {r.hash.slice(0, 10)}…
                              </span>
                            </div>

                            {/* Expanded Technical Drawer */}
                            {selectedEvent?.seq === r.seq && (
                              <div className="mt-3 p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200/70 text-xs space-y-2.5">
                                <div className="font-bold text-slate-800 flex items-center gap-2">
                                  <svg className="h-4 w-4 text-sky-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                  </svg>
                                  <span>Cryptographic Record Inspection</span>
                                </div>
                                <div className="space-y-2 text-xs text-slate-600">
                                  <div>
                                    <span className="text-slate-400 font-medium">Encrypted Payload (AES-256-GCM):</span>
                                    <div className="bg-white p-2.5 rounded-xl border border-slate-200/60 mt-1 break-all text-[11px] text-slate-700">
                                      {r.encrypted}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 font-medium">Immutable Chain Block Hash:</span>
                                    <div className="bg-white p-2.5 rounded-xl border border-slate-200/60 mt-1 break-all text-[11px] text-slate-700 font-medium">
                                      {r.hash}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right: User-Friendly Financial Impact Box */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 pl-15 sm:pl-0 border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0 min-w-[130px]">
                          {r.qualified ? (
                            <>
                              <div className="text-base sm:text-lg font-black text-emerald-700">
                                +{usd(r.credit)}
                              </div>
                              <div className="text-xs text-slate-400 font-medium">
                                Basis: {usd(r.expense)}
                              </div>
                            </>
                          ) : isStripe ? (
                            <>
                              <div className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">
                                Nexus Tracked
                              </div>
                              <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                                Non-R&amp;D Revenue
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                                Routine Cost
                              </div>
                              <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                                No R&amp;D credit claimed
                              </div>
                            </>
                          )}

                          <div className="text-slate-400 group-hover:text-slate-700 text-xs font-semibold mt-2 hidden sm:flex items-center gap-1 transition-colors">
                            <span>{selectedEvent?.seq === r.seq ? "Close" : "Inspect"}</span>
                            <ChevronRight className="h-3 w-3" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Right Sidebar Panel (4 cols on desktop) */}
          <div className="lg:col-span-4 space-y-5">
            {/* 1. Channel Telemetry Status */}
            <Card className="p-6">
              <h3 className="text-sm font-bold text-slate-900 mb-4">
                Telemetry Ingestion Channels
              </h3>

              <div className="space-y-4">
                {/* GitHub Channel */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
                      <GitHubLogo className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">GitHub Commits</div>
                      <div className="text-[11px] text-slate-400">{ghEvents.length} events ingested</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-black text-slate-900">{usd(ghCredit)}</div>
                    <div className="text-[10px] text-emerald-600 font-semibold">Live Active</div>
                  </div>
                </div>

                {/* AWS Channel */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#232F3E] text-[#FF9900]">
                      <AwsLogo className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">AWS Cloud Compute</div>
                      <div className="text-[11px] text-slate-400">{awsEvents.length} events ingested</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-black text-slate-900">{usd(awsCredit)}</div>
                    <div className="text-[10px] text-emerald-600 font-semibold">Live Active</div>
                  </div>
                </div>

                {/* Stripe Channel */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#635BFF] text-white">
                      <StripeLogo className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Stripe Payments</div>
                      <div className="text-[11px] text-slate-400">{stripeEvents.length} events ingested</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-black text-slate-900">{usd(stripeCredit)}</div>
                    <div className="text-[10px] text-indigo-600 font-semibold">Nexus Engine</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* 2. IRS §41 4-Part Test Engine Summary */}
            <Card className="p-6">
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                IRS §41 Four-Part Test
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Automated qualification criteria applied to each event
              </p>

              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50">
                  <div className="h-5 w-5 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold text-[10px]">
                    1
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-xs">Permitted Purpose</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Creating new or improved functionality, performance, or reliability.</div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50">
                  <div className="h-5 w-5 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold text-[10px]">
                    2
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-xs">Technological in Nature</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Grounded in physical or biological science, engineering, or computer science.</div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50">
                  <div className="h-5 w-5 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold text-[10px]">
                    3
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-xs">Elimination of Uncertainty</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Resolving technical uncertainty regarding capability or method.</div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50">
                  <div className="h-5 w-5 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold text-[10px]">
                    4
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-xs">Process of Experimentation</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Evaluating alternatives through modeling, simulation, or trial commits.</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400">Ledger Security</span>
                <Link href="/ledger" className="text-sky-600 hover:text-sky-700 font-semibold flex items-center gap-1">
                  <span>Audit Chain</span>
                  <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
