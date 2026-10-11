# AI Usage Report — TaxShield Enterprise

**Team Qubrix · INTELLICON '26 · October 2026**

Judges expect AI use; what matters is honesty about its scope. This report
lists every way AI assisted this project and, equally important, what it did
not do and what the team verified by hand.

## Tools used

| Tool | Used for |
|---|---|
| **Claude (Codebuff agent)** | Architecture decisions, all backend/dashboard code drafting, debugging (slowapi `request` argument, Edge/puppeteer CRLF and headless issues), test design, README/business-case/SECURITY drafting, IRS source discovery, state-threshold web research orchestration |
| **Google Search (via agent)** | Locating official IRS §41 ATG pages (the ATG is HTML, not the PDF we first assumed); locating official state revenue pages for nexus thresholds |
| **Freebuff web research agents** | Nexus threshold research for 10 states from official state sites (CA, NY, TX, WA verified; FL, MA, CO, GA flagged unverified because official pages could not be read) |

**AI in the product itself (separate from AI in the making):** the classifier
optionally calls an LLM (Gemini/Groq/OpenAI/Ollama) with retrieved IRS rules.
With no key configured — the state of this build — the product's AI engine is
off and classification runs on explainable keyword rules. We do not claim LLM
accuracy we did not measure.

## Specific examples of AI contribution

1. **Discovering that the §41 Audit Technique Guide is HTML, not PDF.** Our
   first KB build 404'd on a guessed PDF URL; AI found the real irs.gov ATG
   section pages, which the KB now fetches (241 chunks, every chunk carries
   its official source URL).
2. **slowapi integration.** Rate-limited routes failed at import with
   `No "request" argument on function` — AI diagnosed the missing
   `request: Request` parameter (and the FastAPI gotcha that an unannotated
   `request` becomes a query parameter, causing a 422 on login).
3. **Headless screenshot capture.** puppeteer-core could not launch this
   machine's Edge (code 0, empty stderr); AI diagnosed shared-profile/headless
   mode incompatibility and rewrote the capture on raw CDP using Node's
   built-in WebSocket — zero extra dependencies.
4. **Eval harness design.** AI drafted the 48 hand-labeled events with
   per-label rationales against the four-part test; the team reviewed the
   labels and kept the one genuinely ambiguous case (hosted-model consumption)
   mislabeled on purpose in the model, not the label, so the miss shows up in
   the metrics instead of being hidden.

## Where the team corrected or rejected AI output

- **Rejected a fabricated-feeling "40–60 chunk" claim:** AI's first KB build
  produced 241 chunks from the actual IRS documents. Rather than trim the
  corpus to match the Gate 1 plan's wording, we documented what actually
  exists.
- **Corrected nexus numbers:** AI research returned four states'
  thresholds it could not verify from readable official pages. We refused to
  fill them from memory; they ship marked `verified: false` in
  `data/nexus_states.json` and appear with an "unverified" badge in the
  dashboard.
- **Rejected overclaiming on the tamper demo:** the hash chain proves
  tampering; SECURITY.md explicitly states it cannot prevent a full-rewrite
  attack by a key-holder. AI drafted that limitation after team review flagged
  the original wording as too strong.
- **Kept accuracy numbers ugly:** the one eval misclassification is printed by
  the harness and quoted in the README. No threshold massaging.

## What the team verified by hand

- **Tests:** 21 pytest tests pass (crypto round trips, wrong-key failure,
  ciphertext tamper, hash-chain detection incl. row reorder, JWT
  accept/reject, Pydantic validation, nexus math, CSV parser, insurance
  threshold, risk model). Run live: `pytest -q`.
- **Tamper demo executed against the real database** — chain flipped to
  invalid, `first_broken_seq` pointed at the right record, then the seed
  script restored a clean chain. Also clicked through the dashboard button.
- **Dashboard verified in a real browser**, every screen: login, overview,
  events, nexus, risk/insurance, ledger.
- **IRS sources:** all 241 chunks come from irs.gov URLs printed by the
  build script; the sources are public-domain US government works.
- **Nexus data:** thresholds for CA, NY, TX, WA, IL, NC were read from
  official state pages during this build (URLs in the config); FL, MA, CO, GA
  are flagged unverified.
- **Dependency audit:** `pip-audit -r requirements.txt` → no known
  vulnerabilities (2026-10-11).
- **Accuracy measurement:** the 97.9% figure comes from running the real
  pipeline over the labeled set on this machine, not an estimate.

## Honest share statement

Roughly: **AI wrote the majority of the code and prose; the team decided the
architecture, set the honesty constraints, reviewed and corrected outputs,
ran every verification, and owns every number in this repository.** Where AI
and the team disagree, the team decided — and in several cases (above) that
meant rejecting AI's first answer in favor of something less flattering but
true.

---

# Declarations

**Originality.** All work in this repository is Team Qubrix's, produced for
INTELLICON '26, except named open-source libraries (FastAPI, Next.js,
cryptography, XGBoost, scikit-learn, etc.) and the AI assistance disclosed
above. No code, text, data, or commit history was copied from other projects
or backdated. All git history in this repository is real and forward-dated.

**Pre-existing work.** Gate 2 (simulator → API → keyword classifier →
AES-GCM + hash chain → SQLite → terminal table) was built by the team before
this phase and is preserved in the git history. Gate 3 extends it; nothing was
rewritten to disguise the earlier state.

**Data handling.** All data is simulated, synthetic, or test-mode. No real
personal data, no real financial data, no real tax filings. Stripe usage is
test-mode only (live keys are refused by the connector by design). The
audit-risk model is trained on a synthetic dataset we generated. Insurance
binders are simulated — no underwriter, no coverage. IRS and state documents
referenced are public-domain US government works. The demo database contains
no customer information.

**Tax advice.** Nothing in this project constitutes tax, legal, or insurance
advice. Outputs are estimates for demonstration; a licensed professional must
review anything before filing.
