"use client";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, ErrorBox, Loading, usd, usePoll } from "@/components/widgets";
import { TaxShieldLogo } from "@/components/TaxShieldLogo";

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

export default function OverviewPage() {
  const { data, error, loading } = usePoll(() => api.summary(), 4000);
  const [greeting, setGreeting] = useState("Good afternoon");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} />;
  if (!data) return null;

  const gh = data.by_source?.github ?? { events: 0, qualified: 0, credit: 0 };
  const aws = data.by_source?.aws ?? { events: 0, qualified: 0, credit: 0 };
  const stripe = data.by_source?.stripe ?? { events: 0, qualified: 0, credit: 0 };

  const totalCredit = data.total_estimated_credit;
  const ghCredit = gh.credit;
  const awsCredit = aws.credit;
  const stripeCredit = stripe.credit;

  return (
    <div className="space-y-6">
      {/* 1. Header Greeting */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {greeting}, Marcus
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-400">
          You&apos;re well covered. Here&apos;s what&apos;s happening with your insurance.
        </p>
      </div>

      {/* 2. Asymmetric Bento Grid (2 cols on left, 1 on right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (spans 2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Hero "Your Coverage" Card */}
          <Card className="p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">Your Coverage</h2>
                <p className="text-xs text-slate-400 mt-0.5">Total insured value across all policies</p>
              </div>
              <Link
                href="/events"
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1"
              >
                <span>View all policies</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Huge bold metric with trend badge */}
            <div className="mt-5">
              <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                USD {totalCredit.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                <svg className="h-3.5 w-3.5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="7" y1="17" x2="17" y2="7" />
                  <polyline points="7 7 17 7 17 17" />
                </svg>
                <span>12% vs. last year</span>
              </div>
            </div>

            {/* Split row: Policies Breakdown on left, Donut chart on right */}
            <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Policies List (Left 7 cols) with authentic logos */}
              <div className="md:col-span-7 space-y-5">
                {/* 1. Home / GitHub */}
                <Link href="/events" className="group flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-xs transition-transform group-hover:scale-105">
                      <GitHubLogo className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                        Home Insurance
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Policy #HI-2873 · GitHub
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs sm:text-sm font-bold text-slate-900">
                        {usd(ghCredit > 0 ? ghCredit : 320000)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Coverage Amount
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
                  </div>
                </Link>

                {/* 2. Motor / AWS */}
                <Link href="/events" className="group flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#232F3E] text-[#FF9900] shadow-xs transition-transform group-hover:scale-105">
                      <AwsLogo className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                        Motor Insurance
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Policy #MO-9011 · AWS
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs sm:text-sm font-bold text-slate-900">
                        {usd(awsCredit > 0 ? awsCredit : 180000)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Coverage Amount
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
                  </div>
                </Link>

                {/* 3. Travel / Stripe */}
                <Link href="/events" className="group flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#635BFF] text-white shadow-xs transition-transform group-hover:scale-105">
                      <StripeLogo className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                        Travel Insurance
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Policy #TR-4022 · Stripe
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs sm:text-sm font-bold text-slate-900">
                        {usd(stripeCredit > 0 ? stripeCredit : 50000)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Coverage Amount
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
                  </div>
                </Link>
              </div>

              {/* Donut Chart (Right 5 cols) */}
              <div className="md:col-span-5 flex flex-col items-center justify-center pt-4 md:pt-0">
                <div className="relative flex h-36 w-36 items-center justify-center">
                  <svg viewBox="0 0 100 100" className="h-36 w-36 -rotate-90">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="11"
                      strokeDasharray="145 251"
                      strokeDashoffset="0"
                      strokeLinecap="round"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#34d399"
                      strokeWidth="11"
                      strokeDasharray="65 251"
                      strokeDashoffset="-150"
                      strokeLinecap="round"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#c084fc"
                      strokeWidth="11"
                      strokeDasharray="30 251"
                      strokeDashoffset="-220"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <TaxShieldLogo className="h-5 w-5 mb-0.5" />
                    <span className="text-lg font-black text-slate-900 leading-none">3</span>
                    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                      Active Policies
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Bottom Card: Claims Update Timeline Stepper */}
          <Card className="p-6 sm:p-7">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Claim Property Image (3 cols) */}
              <div className="md:col-span-3">
                <div className="relative h-28 w-full overflow-hidden rounded-2xl border border-slate-100/90 shadow-2xs">
                  <img
                    src="/claim-property.jpg"
                    alt="Insured Property"
                    className="h-full w-full object-cover object-center"
                  />
                </div>
              </div>

              {/* Status Text (4 cols) */}
              <div className="md:col-span-4">
                <span className="text-[11px] font-bold text-sky-600 uppercase tracking-wider">
                  Claims Update
                </span>
                <h3 className="mt-1 text-base font-bold text-slate-900 tracking-tight">
                  Your claim is in progress
                </h3>
                <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                  Water leak from second floor plumbing. Assessment completed.
                </p>
              </div>

              {/* Stepper Timeline (5 cols) */}
              <div className="md:col-span-5 flex items-center justify-between gap-2 pt-2 md:pt-0">
                {/* Step 1: Claim Submitted */}
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white shrink-0 shadow-xs">
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-800 leading-tight">Claim Submitted</div>
                    <div className="text-[10px] text-slate-400">Mar 16, 2025</div>
                  </div>
                </div>

                <div className="h-0.5 flex-1 bg-emerald-500/30 min-w-[12px]" />

                {/* Step 2: Info Requested */}
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white shrink-0 shadow-xs">
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-800 leading-tight">Info Requested</div>
                    <div className="text-[10px] text-slate-400">Mar 18, 2025</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column (spans 1): Quick Actions & Upcoming Reminders */}
        <div className="space-y-6">
          {/* Card 1: Quick Action Links */}
          <Card className="p-6 space-y-4">
            {/* File a Claim */}
            <Link
              href="/ledger"
              className="group flex items-center justify-between gap-3 p-2 rounded-2xl hover:bg-slate-50/80 transition-all"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-500 transition-transform group-hover:scale-105">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                    File a Claim
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Get support, fast
                  </div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
            </Link>

            {/* Payout History */}
            <Link
              href="/events"
              className="group flex items-center justify-between gap-3 p-2 rounded-2xl hover:bg-slate-50/80 transition-all"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500 transition-transform group-hover:scale-105">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                    Payout History
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Secure &amp; clear settlements
                  </div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
            </Link>

            {/* Manage Policies */}
            <Link
              href="/risk"
              className="group flex items-center justify-between gap-3 p-2 rounded-2xl hover:bg-slate-50/80 transition-all"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 text-purple-500 transition-transform group-hover:scale-105">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                    Manage Policies
                  </div>
                  <div className="text-[11px] text-slate-400">
                    DAC sharing &amp; coverage
                  </div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
            </Link>
          </Card>

          {/* Card 2: Upcoming Reminders */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Upcoming Reminders</h3>
              <Link href="/nexus" className="text-xs font-semibold text-slate-400 hover:text-slate-800 transition-colors">
                View all
              </Link>
            </div>

            <div className="space-y-4">
              {/* Reminder 1: Travel */}
              <Link href="/risk" className="group flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                      Travel Insurance Renewal
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Jul 15, 2026
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
              </Link>

              {/* Reminder 2: Home */}
              <Link href="/events" className="group flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-500">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                      Home Insurance Renewal
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Aug 01, 2026
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
              </Link>

              {/* Reminder 3: Motor */}
              <Link href="/ledger" className="group flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                      Motor Insurance Renewal
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Nov 20, 2026
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
