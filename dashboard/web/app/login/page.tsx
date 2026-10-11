"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, setToken } from "@/lib/api";
import { TaxShieldLogo } from "@/components/TaxShieldLogo";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("demo@taxshield.local");
  const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { access_token } = await api.login(username, password);
      setToken(access_token);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed. Check credentials.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm pt-12 sm:pt-20">
      {/* Brand Icon & Heading */}
      <div className="text-center mb-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-[0_4px_16px_rgba(2,132,199,0.14)] border border-slate-100 mb-4">
          <TaxShieldLogo className="h-9 w-9" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Welcome back
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Enter your credentials to access your telemetry ledger.
        </p>
      </div>

      {/* Main Login Card */}
      <div className="rounded-[28px] bg-white p-7 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-100/90">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Email or Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-2xl border border-slate-200/80 bg-[#F8FAFC] px-4 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-slate-200/80 bg-[#F8FAFC] px-4 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100 transition-all"
              required
            />
          </div>

          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 text-rose-600 text-xs">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full mt-2 rounded-full bg-slate-900 py-3 text-xs font-bold text-white hover:bg-slate-800 active:scale-[0.99] transition-all disabled:opacity-50 shadow-xs"
          >
            {busy ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
