"use client";
// Small typed API client for the TaxShield backend. Attaches the JWT from
// localStorage and normalises errors so no screen ever shows a blank page.

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("taxshield_token");
}

export function setToken(t: string) {
  localStorage.setItem("taxshield_token", t);
}

export function clearToken() {
  localStorage.removeItem("taxshield_token");
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(0, "Cannot reach the API — is the backend running on port 8000?");
  }
  if (res.status === 401) {
    clearToken();
    throw new ApiError(401, "Session expired or invalid — please log in again.");
  }
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.detail) detail = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
    } catch { /* keep default */ }
    throw new ApiError(res.status, detail);
  }
  return res.json() as Promise<T>;
}

// ---- types ----
export interface Summary {
  events: number;
  qualified_events: number;
  total_estimated_credit: number;
  total_qualified_expense: number;
  hash_chain_valid: boolean;
  chain_detail: string;
  first_broken_seq: number | null;
  by_source: Record<string, { events: number; qualified: number; credit: number }>;
  assumptions: Record<string, string | number>;
}

export interface EventRow {
  seq: number;
  id: string;
  source: string;
  timestamp: string;
  encrypted: string;
  qualified: boolean;
  confidence: number | null;
  reason: string | null;
  rule_cited: string | null;
  expense: number | null;
  credit: number | null;
  engine: string | null;
  hash: string;
}

export interface NexusState {
  code: string;
  name: string;
  status: "clear" | "approaching" | "triggered";
  sales_usd: number;
  transactions: number;
  threshold_dollars: number;
  threshold_transactions: number | null;
  pct_of_threshold: number;
  state_rate: number;
  rate_note: string;
  estimated_exposure_usd: number;
  verified: boolean;
  unverified_note: string | null;
  source_urls: string[];
}

export interface NexusView {
  states: NexusState[];
  total_sales_usd: number;
  total_transactions: number;
  triggered_states: string[];
  total_exposure_usd: number;
  simplifications: string[];
}

export interface RiskView {
  risk: {
    audit_risk_probability: number;
    model: string;
    features_used: Record<string, number>;
  };
  binder: {
    simulated: boolean;
    disclaimer: string;
    binds: boolean;
    policy_id: string | null;
    premium_usd: number | null;
    bind_threshold: number;
    premium_formula: string;
    claim_amount_usd: number;
    status: string;
  };
  revenue_estimate_usd: number;
  claim_estimate_usd: number;
}

export interface VerifyView {
  valid: boolean;
  events: number;
  first_broken_seq: number | null;
  detail: string;
}

// ---- endpoints ----
export const api = {
  login: (username: string, password: string) =>
    req<{ access_token: string }>("/auth/token", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  summary: () => req<Summary>("/summary"),
  events: (q: { source?: string; qualified?: string } = {}) => {
    const p = new URLSearchParams();
    if (q.source) p.set("source", q.source);
    if (q.qualified) p.set("qualified", q.qualified);
    const qs = p.toString();
    return req<EventRow[]>(`/events${qs ? `?${qs}` : ""}`);
  },
  nexus: () => req<NexusView>("/nexus"),
  risk: () => req<RiskView>("/risk"),
  verify: () => req<VerifyView>("/verify"),
  simulate: (count: number) =>
    req<{ stored: number }>("/demo/simulate", { method: "POST" }),
  ingestGithub: () => req<{ stored: number }>("/ingest/github?limit=15", { method: "POST" }),
  ingestStripe: () => req<{ stored: number }>("/ingest/stripe?limit=15", { method: "POST" }),
  tamper: () => req<{ ok: boolean }>("/demo/tamper", { method: "POST" }),
};
