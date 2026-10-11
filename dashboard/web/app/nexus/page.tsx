"use client";
import { api } from "@/lib/api";
import { Card, ErrorBox, Loading, StatusPill, usd, usePoll } from "@/components/widgets";

export default function NexusPage() {
  const { data, error, loading } = usePoll(() => api.nexus(), 8000);

  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} />;
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Multi-state nexus</h1>
        <div className="text-sm text-slate-400">
          {usd(data.total_sales_usd)} tracked · {data.total_transactions} transactions ·
          exposure {usd(data.total_exposure_usd)}
        </div>
      </div>

      <Card title="State status">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-2 pr-3">State</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Sales</th>
                <th className="py-2 pr-3">Threshold</th>
                <th className="py-2 pr-3">Txn</th>
                <th className="py-2 pr-3">Rate</th>
                <th className="py-2 pr-3">Exposure</th>
                <th className="py-2">Source</th>
              </tr>
            </thead>
            <tbody>
              {data.states.map((s) => (
                <tr key={s.code} className="border-t border-slate-800">
                  <td className="py-2 pr-3">
                    <span className="font-medium">{s.code}</span>{" "}
                    <span className="text-slate-500">{s.name}</span>
                    {!s.verified && (
                      <span className="ml-1 rounded bg-amber-950 px-1 text-[10px] text-amber-400 border border-amber-900">
                        unverified
                      </span>
                    )}
                  </td>
                  <td className="py-2 pr-3"><StatusPill status={s.status} /></td>
                  <td className="py-2 pr-3">{usd(s.sales_usd)}</td>
                  <td className="py-2 pr-3 text-slate-400">{usd(s.threshold_dollars)}</td>
                  <td className="py-2 pr-3 text-slate-400">{s.transactions}</td>
                  <td className="py-2 pr-3">{(s.state_rate * 100).toFixed(2)}%</td>
                  <td className="py-2 pr-3">{s.status === "triggered" ? usd(s.estimated_exposure_usd) : "—"}</td>
                  <td className="py-2 text-xs">
                    <a href={s.source_urls[0]} target="_blank" rel="noreferrer" className="text-teal-400 hover:underline">
                      official ↗
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Simplifications (read this before quoting the numbers)">
        <ul className="space-y-1 text-sm text-slate-300">
          {data.simplifications.map((s) => (
            <li key={s}>• {s}</li>
          ))}
          <li>• Unverified rows are marked — confirm at the state&apos;s site before relying on them</li>
        </ul>
      </Card>
    </div>
  );
}
