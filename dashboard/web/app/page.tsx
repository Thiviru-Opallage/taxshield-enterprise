"use client";
import { api } from "@/lib/api";
import { Card, ErrorBox, Loading, Stat, usd, usePoll } from "@/components/widgets";

export default function OverviewPage() {
  const { data, error, loading } = usePoll(() => api.summary(), 4000);

  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} />;
  if (!data) return null;

  const rate = data.assumptions.simplified_credit_rate;
  const hourly = data.assumptions.developer_hourly_rate_usd;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Overview</h1>
        <span
          className={`rounded-full border px-3 py-1 text-sm ${
            data.hash_chain_valid
              ? "border-emerald-800 bg-emerald-950/50 text-emerald-300"
              : "border-red-800 bg-red-950/50 text-red-300"
          }`}
        >
          {data.hash_chain_valid ? "Hash chain: VALID" : "Hash chain: BROKEN"}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total events" value={data.events.toString()} />
        <Stat label="Qualified events" value={data.qualified_events.toString()} />
        <Stat label="Est. R&D credit" value={usd(data.total_estimated_credit)}
              sub="simplified flat rate — not a filing figure" />
        <Stat label="Qualified expense" value={usd(data.total_qualified_expense)} />
      </div>

      <Card title="By data source">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="py-1">Source</th>
              <th className="py-1 text-right">Events</th>
              <th className="py-1 text-right">Qualified</th>
              <th className="py-1 text-right">Credit</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(data.by_source).map(([src, s]) => (
              <tr key={src} className="border-t border-slate-800">
                <td className="py-2 capitalize">{src}</td>
                <td className="py-2 text-right">{s.events}</td>
                <td className="py-2 text-right">{s.qualified}</td>
                <td className="py-2 text-right">{usd(s.credit)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card title="Stated assumptions">
        <ul className="space-y-1 text-sm text-slate-300">
          <li>• Developer cost: <strong>{usd(Number(hourly))}/hour</strong> (labelled assumption — real tracking needs a timesheet)</li>
          <li>• Credit rate: <strong>{(Number(rate) * 100).toFixed(0)}%</strong> flat — real Section 41 is incremental and capped</li>
          <li>• Classifier engine per event is shown on the Events page; keyword fallback when no LLM key is set</li>
          <li>• Not tax advice. A CPA must review anything before filing.</li>
        </ul>
      </Card>
    </div>
  );
}
