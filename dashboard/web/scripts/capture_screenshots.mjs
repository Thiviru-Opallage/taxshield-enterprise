// Capture dashboard screenshots for the README and slide deck.
//
// Drives a headless Edge instance over the Chrome DevTools Protocol using
// Node 24's built-in fetch/WebSocket (no puppeteer — this Edge build's
// headless mode is incompatible with puppeteer-core's launch flags).
//
// Prereqs: backend on :8000, dashboard dev server on :3000.
// Run from dashboard/web:   node scripts/capture_screenshots.mjs
// Output: docs/screenshots/{login,overview,events,nexus,risk,ledger}.png
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";

const EDGE = process.env.EDGE_PATH
  ?? "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const API = process.env.API_BASE ?? "http://127.0.0.1:8000";
const WEB = process.env.WEB_BASE ?? "http://localhost:3000";
const PORT = 9333;
const OUT = path.resolve(process.cwd(), "..", "..", "docs", "screenshots");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const SHOTS = [
  { name: "login", url: "/login", marker: "Sign in" },
  { name: "overview", url: "/", marker: "Stated assumptions" },
  { name: "events", url: "/events", marker: "Reason / rule" },
  { name: "nexus", url: "/nexus", marker: "Simplifications" },
  { name: "risk", url: "/risk", marker: "Model features" },
  { name: "ledger", url: "/ledger", marker: "Demo control" },
];

// 1. Mint a JWT so the app is authenticated on every page.
const user = process.env.DEMO_USER ?? "demo@taxshield.local";
const pass = process.env.DEMO_PASSWORD ?? "demo1234";
const loginRes = await fetch(`${API}/auth/token`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username: user, password: pass }),
});
if (!loginRes.ok) throw new Error(`API login failed (${loginRes.status})`);
const token = (await loginRes.json()).access_token;

// 2. Launch headless Edge with a private profile and CDP port.
await mkdir(OUT, { recursive: true });
const profile = await mkdtemp(path.join(tmpdir(), "taxshield-cdp-"));
const edge = spawn(EDGE, [
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`,
  "--headless", "--disable-gpu", "--no-sandbox",
  "--window-size=1440,900", "about:blank",
], { stdio: "ignore" });

async function devtools(pathname) {
  for (let i = 0; i < 60; i++) {
    try {
      return await (await fetch(`http://127.0.0.1:${PORT}${pathname}`)).json();
    } catch { await sleep(250); }
  }
  throw new Error("Edge CDP endpoint never came up");
}
const targets = await devtools("/json/list");
const page = targets.find((t) => t.type === "page");
if (!page) throw new Error("no page target");

const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let msgId = 0;
const pending = new Map();
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
};
const send = (method, params = {}) => {
  const id = ++msgId;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((r) => pending.set(id, r));
};
const evaluate = async (expression) =>
  (await send("Runtime.evaluate", { expression, returnByValue: true }))
    .result?.result?.value;

// 3. Auth + viewport, then one screenshot per screen.
await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride",
  { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await send("Page.addScriptToEvaluateOnNewDocument", {
  source: `localStorage.setItem("taxshield_token", ${JSON.stringify(token)});`,
});

for (const shot of SHOTS) {
  await send("Page.navigate", { url: `${WEB}${shot.url}` });
  let ready = false;
  for (let i = 0; i < 80 && !ready; i++) {
    await sleep(250);
    ready = await evaluate(
      `document.readyState === "complete" && document.body.innerText.toLowerCase().includes(${JSON.stringify(shot.marker.toLowerCase())})`);
  }
  if (!ready) throw new Error(`${shot.name}: marker '${shot.marker}' never appeared`);
  await sleep(1200);  // let one polling cycle render
  const shotRes = await send("Page.captureScreenshot", { format: "png" });
  const file = path.join(OUT, `${shot.name}.png`);
  await writeFile(file, Buffer.from(shotRes.result.data, "base64"));
  console.log("captured", file);
}

ws.close();
spawnSync("taskkill", ["/T", "/F", "/PID", String(edge.pid)], { stdio: "ignore" });
console.log("done");
