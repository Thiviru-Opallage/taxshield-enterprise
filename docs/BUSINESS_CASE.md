# TaxShield Enterprise — Business Case

**Team Qubrix · INTELLICON '26 Buildathon · October 2026**

> Status note: this business case is written at Gate 3. Where a number is
> carried over from the Gate 1 proposal without fresh verification, it says
> so. Where customer interviews were promised but not yet held, it says that
> too. We would rather show an honest gap than a fabricated survey.

---

## 1. Problem

Software companies that develop new or improved technology can claim the IRS
Section 41 research credit — a dollar-for-dollar reduction in tax liability for
qualified research expenses (wages, supplies, and certain cloud-compute costs).
Yet the credit is systematically under-claimed by small and mid-size technology
firms:

- **The IRS's own materials describe the credit as complex.** The Section 41
  Audit Technique Guide and the Form 6765 instructions exist because
  substantiating the four-part test (technological in nature, business
  component, technological uncertainty, process of experimentation) requires
  documentation most engineering organizations never produce in tax-ready form
  (irs.gov, Form 6765 instructions; IRS Section 41 ATG, 2024–2026).
- **The evidence exists — in the wrong systems.** Commit messages, experiment
  logs, GPU bills, and model-training runs live in GitHub, AWS, and Stripe.
  Tax workflows live in spreadsheets and CPA email threads. Nothing connects
  them, so qualifying activity goes unclaimed or is claimed with weak
  documentation that invites audit adjustments.
- **Sales-tax nexus compounds the exposure.** Multi-state digital firms that
  crossed economic-nexus thresholds (e.g. $500k in CA, $100k in WA) during the
  post-2018 economic-nexus expansion face registration and collection duties
  many never noticed (CDTFA MPF Act page; WA DOR remote sellers page; sources
  per state in `data/nexus_states.json`).

**Quantified size of the missed opportunity (Gate 1 figures, methodology
below):** our Gate 1 proposal estimated the research-credit preparation market
at $26.39B (TAM). That figure came from secondary market reports and has **not
been re-verified for this gate**; the SOM figure ($217.5M = 15,000 firms ×
$14,500 ACV) is arithmetic on assumptions we can defend: a $14,500 annual
price against a credit a 50-person firm typically leaves on the table worth
$50k–$250k/year.

**What contradicted our assumptions so far (learning log):** Gate 1 assumed the
hardest part would be the AI classification. Building it showed the harder,
more valuable part is *evidence quality* — an LLM cannot invent documentation
that a company never kept. That shifts the product from "AI that files your
taxes" toward "telemetry pipeline that makes the documentation exist." It also
reduces liability exposure: we classify and assemble; a licensed CPA files.

## 2. Target customer

**Primary profile (from Gate 1, unchanged pending interviews):** US-domiciled
digital firms, 10–250 employees, $2M–$50M ARR, multi-state sales, running on
AWS + GitHub + Stripe, without a full-time tax credit specialist. Buyer is the
CFO or VP Finance; daily user is the engineering manager who certifies hours.

**Interview status — honest disclosure:** Gate 1 promised 5+ conversations
with accountants/founders/finance staff. **As of Gate 3 these interviews have
not been conducted.** Reasons: build scheduling compressed the window, and we
did not want to conduct a first customer-discovery round with a half-built
demo. This is a real gap in the evidence base. The interview script, question
set, and note template are prepared; running 3–5 conversations before final
submission is the top non-engineering todo (see Roadmap). Any claim above that
depends on interviews is marked as such.

## 3. Solution and differentiation

TaxShield ingests operational telemetry (GitHub commits, AWS billing CSV,
Stripe payments), classifies each event against **official IRS Section 41
text** (241 chunks retrieved from the Form 6765 instructions and the §41 Audit
Technique Guide), computes a simplified credit estimate, encrypts every record
with AES-256-GCM, and seals the ledger with a SHA-256 hash chain so any later
edit is detectable and attributable to the exact record. The same pipeline
tracks multi-state nexus against thresholds researched from each state's
official revenue site.

**Differentiation:**

| Competitor class | What they do | Why they miss this wedge |
|---|---|---|
| CPA firms | Expert credit calculation | Priced per engagement; no continuous telemetry; documentation chase is manual |
| Avalara / tax engines | Sales-tax compliance & nexus | Nexus yes, but no R&D-credit evidence pipeline |
| TurboTax Business / DIY software | Form filling | Forms, not evidence; user must already know what qualifies |
| AI tax assistants (emerging) | Chat-based answers | Generically knowledgeable, not wired to *your* commit history and bills; cannot produce an audit trail |

Our wedge: **the credit claim as a by-product of telemetry you already
generate, wrapped in a tamper-evident ledger an auditor can walk.**

## 4. Market size (methodology visible)

- **TAM $26.39B** — carried over from Gate 1 secondary market reports;
  *not re-verified this gate*; treat as directional.
- **SAM $5.20B** — TAM × share addressable with a self-serve telemetry product
  (US, tech sector, <$50M ARR firms). Assumption-driven.
- **SOM $217.5M** — 15,000 firms × $14,500 ACV; year-1 target 80–120 customers
  ≈ $1.2–1.7M ARR. The 15,000-firm count is an assumption (US software firms
  in-band who use GitHub+AWS+Stripe); validation requires the interview/data
  work listed above.

Each dollar of SOM is arbitrage: a customer paying $14,500 is buying an
estimated $50k–$250k credit (their numbers, their CPA's sign-off).

## 5. Business model

- **Tier 1 — Monitor ($499/mo):** telemetry ingest, classification, ledger,
  nexus watch. For firms <25 employees.
- **Tier 2 — Claim ($14,500/yr):** everything plus CPA-ready export package,
  audit-trail walkthrough, annual re-computation. Core SKU.
- **Tier 3 — Enterprise (custom):** SSO, Postgres/on-prem, enclave processing,
  multi-entity.

**Unit economics (illustrative, assumption-driven):** at Tier 2, gross margin
>85% — LLM classification costs run <$0.02/event on free/cheap tiers (and $0
on the keyword fallback engine, which is our default), hosting ~$50/mo per
customer band on shared infra. Sales-assisted CAC dominates; assume 6-month
payback at $14.5k ACV if close rate ≥20% from a qualified pipeline.

## 6. Go-to-market

1. **CPA channel first** — accounting firms doing R&D credit work for 10+
   clients are the fastest repeated sale; we sell evidence quality, they keep
   the filing relationship.
2. **Founder-led content** — teardown posts ("what your Git history says about
   Section 41") targeting finance leaders at 20–100-person SaaS companies.
3. **Incubator/accelerator partnerships** — portfolio firms claim credits at
   incorporation-time habits forming.
4. **Free nexus watch as top-of-funnel** — the nexus calculator is useful
   before the credit pitch lands.

## 7. Risks (candid)

| Risk | Severity | Mitigation |
|---|---|---|
| **Classifier error** → bad claim → client penalty + interest | High | CPA signs every filing; confidence scores surfaced per event; measured accuracy published (97.9% keyword engine on our own 48-label set; LLM engine unmeasured until a key is wired); fallback engine is explainable |
| **Regulatory change** (§41 rules, nexus thresholds) | Medium | Thresholds carry source URLs + check dates; rules corpus rebuildable from official PDFs in one command |
| **Liability for wrong filings** | High | We do not file. Product is evidence assembly + estimate; licensed professional signs |
| **Insurance product** needs a licensed underwriter | High | Currently SIMULATED, labelled everywhere; a real product requires an MGA/partner — named as a hard dependency, not glossed |
| **Stripe/GitHub API dependency** | Low | Simulator fallback; CSV import for AWS |
| **"Do nothing" is the real competitor** | High | Free-tier nexus watch + audit-trail demo lower activation friction |

## 8. Interview findings

**None held yet — stated plainly** (see §2). When held, contradictions to our
assumptions will be reported here verbatim, including any that kill the
business case.

## 9. Accuracy results (measured, this build)

48 hand-labeled events (each with rationale in `data/eval_labels.json`),
real pipeline, no cherry-picking:

| Engine | Accuracy | Precision | Recall | F1 |
|---|---|---|---|---|
| keyword-rules (default, offline) | 0.979 | 0.957 | 1.000 | 0.978 |
| llm-rag | *not measured* — needs an LLM API key; harness ready (`ml/eval.py`) | | | |

The single misclassification is documented: a hosted-model consumption event
("Bedrock model invocation") triggered on the word *model*. High numbers
reflect a balanced but small, self-labeled set — we say so rather than hide it.

## 10. Roadmap

1. Run 3–5 customer interviews; revise §2 and SOM with real evidence.
2. Wire a free-tier LLM key; measure llm-rag accuracy on the same 48 labels.
3. Verify the four unverified state thresholds from official sites.
4. Deploy (Render/Fly free tier) for a public demo link; Postgres migration.
5. Timesheet integration to replace the $75/hr hours assumption.
6. Enclaves/mTLS for enterprise; underwriting partner for real insurance.
