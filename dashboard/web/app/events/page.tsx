"use client";
import { useState } from "react";
import { api, EventRow } from "@/lib/api";
import { Card, ErrorBox, Loading, StatusPill, usd, usePoll } from "@/components/widgets";

export default function EventsPage() {
  const [source, setSource] = useState("");
  const [qualified, setQualified] = useState("");
  const { data, error, loading } = usePoll(
    () => api.events({ source: source || undefined, qualified: qualified || undefined }),
    4000
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Events feed</h1>
        <div className="flex gap-2 text-sm">
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1"
          >
            <option value="">all sources</option>
            <option value="github">github</option>
            <option value="aws">aws</option>
            <option value="stripe">stripe</option>
          </select>
          <select
            value={qualified}
            onChange={(e) => setQualified(e.target.value)}
            className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1"
          >
            <option value="">all</option>
            <option value="true">qualified</option>
            <option value="false">not qualified</option>
          </select>
        </div>
      </div>

      {loading && <Loading />}
      {error && <ErrorBox message={error} />}

      {data && (
        <Card title={`${data.length} events`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-2 pr-3">#</th>
                  <th className="py-2 pr-3">Source</th>
                  <th className="py-2 pr-3">R&amp;D?</th>
                  <th className="py-2 pr-3">Conf</th>
                  <th className="py-2 pr-3">Credit</th>
                  <th className="py-2 pr-3">Reason / rule</th>
                  <th className="py-2 pr-3">Engine</th>
                  <th className="py-2 pr-3">Encrypted</th>
                  <th className="py-2">Hash</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r: EventRow) => (
                  <tr key={r.seq} className="border-t border-slate-800 align-top">
                    <td className="py-2 pr-3 text-slate-500">{r.seq}</td>
                    <td className="py-2 pr-3 capitalize">{r.source}</td>
                    <td className="py-2 pr-3">
                      <StatusPill status={r.qualified ? "triggered" : "clear"} />
                    </td>
                    <td className="py-2 pr-3">{r.confidence != null ? r.confidence.toFixed(2) : "—"}</td>
                    <td className="py-2 pr-3">{usd(r.credit)}</td>
                    <td className="max-w-md py-2 pr-3 text-slate-300">
                      {r.reason}
                      {r.rule_cited && (
                        <p className="mt-0.5 text-xs text-slate-500">{r.rule_cited}</p>
                      )}
                    </td>
                    <td className="py-2 pr-3 text-xs text-slate-500">
                      {r.engine}
                      {r.qualified && ` · exp ${usd(r.expense)}`}
                    </td>
                    <td className="py-2 pr-3 font-mono text-xs text-slate-500">{r.encrypted}</td>
                    <td className="py-2 font-mono text-xs text-slate-500">{r.hash.slice(0, 12)}…</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
