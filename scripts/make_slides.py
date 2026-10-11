"""Generate the 12-slide presentation PDF with real dashboard screenshots.

Run from the repo root after capturing screenshots:
    venv/Scripts/python scripts/make_slides.py
Output: docs/taxshield_slides.pdf
"""
import os

from reportlab.lib import colors
from reportlab.lib.pagesizes import landscape, A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas

ROOT = os.path.join(os.path.dirname(__file__), "..")
SHOTS = os.path.join(ROOT, "docs", "screenshots")
OUT = os.path.join(ROOT, "docs", "taxshield_slides.pdf")

PAGE = landscape(A4)  # 11.7 x 8.3 in
W, H = PAGE
BG = colors.HexColor("#0f172a")
TEAL = colors.HexColor("#2dd4bf")
SLATE = colors.HexColor("#94a3b8")
WHITE = colors.HexColor("#f1f5f9")
AMBER = colors.HexColor("#fbbf24")
RED = colors.HexColor("#f87171")

TITLE = ParagraphStyle("t", fontName="Helvetica-Bold", fontSize=30, leading=36,
                       textColor=WHITE)
H2 = ParagraphStyle("h", fontName="Helvetica-Bold", fontSize=22, leading=27,
                    textColor=TEAL)
BODY = ParagraphStyle("b", fontName="Helvetica", fontSize=14.5, leading=21,
                      textColor=WHITE)
SMALL = ParagraphStyle("s", fontName="Helvetica", fontSize=11.5, leading=16,
                       textColor=SLATE)
BULLET = ParagraphStyle("bu", parent=BODY, leftIndent=14, bulletIndent=2,
                        spaceAfter=6)

c = canvas.Canvas(OUT, pagesize=PAGE)
slide_no = 0


def bg():
    c.setFillColor(BG)
    c.rect(0, 0, W, H, stroke=0, fill=1)


def new_slide(title: str | None = None, foot: str = "TaxShield Enterprise · Team Qubrix · INTELLICON '26"):
    global slide_no
    bg()
    slide_no += 1
    if title:
        c.setFillColor(TEAL)
        c.setFont("Helvetica-Bold", 22)
        c.drawString(54, H - 60, title)
    c.setFillColor(SLATE)
    c.setFont("Helvetica", 9)
    c.drawRightString(W - 40, 26, f"{foot}   ·   {slide_no}/12")


def wrap(text: str, style, x: float, y: float, width: float) -> float:
    from reportlab.platypus import Paragraph
    p = Paragraph(text, style)
    _, h = p.wrap(width, H)
    p.drawOn(c, x, y - h)
    return y - h


def bullets(items: list[str], x: float, y: float, width: float,
            style=BULLET) -> float:
    from reportlab.platypus import Paragraph
    for it in items:
        p = Paragraph(it, style, bulletText="•")
        _, h = p.wrap(width, H)
        p.drawOn(c, x, y - h)
        y -= h + 4
    return y


def screenshot(name: str, x: float, y: float, w: float, h: float) -> None:
    """Draw a screenshot scaled to FIT inside (x, y, w, h), centered,
    with a subtle border. No cropping — Canvas.drawImage has no crop args."""
    path = os.path.join(SHOTS, f"{name}.png")
    img = ImageReader(path)
    iw, ih = img.getSize()
    scale = min(w / iw, h / ih)
    dw, dh = iw * scale, ih * scale
    dx, dy = x + (w - dw) / 2, y + (h - dh) / 2
    c.drawImage(img, dx, dy, dw, dh)
    c.setStrokeColor(colors.HexColor("#334155"))
    c.setLineWidth(1)
    c.rect(dx, dy, dw, dh, stroke=1, fill=0)


# ---------------------------------------------------------------- 1 title
new_slide()
c.setFillColor(TEAL)
c.setFont("Helvetica-Bold", 40)
c.drawString(54, H / 2 + 60, "TaxShield Enterprise")
wrap("Turn operational telemetry into a defensible R&amp;D tax credit claim — "
     "with every number traceable to an encrypted, tamper-evident ledger.",
     ParagraphStyle("pitch", fontName="Helvetica", fontSize=19, leading=27,
                    textColor=WHITE), 54, H / 2 + 20, W - 300)
c.setFillColor(SLATE)
c.setFont("Helvetica", 13)
c.drawString(54, 60, "Team Qubrix · INTELLICON '26 Buildathon · student demonstration project")
c.setFillColor(AMBER)
c.setFont("Helvetica-Bold", 12)
c.drawString(54, 40, "Not tax advice · insurance simulated · risk model trained on synthetic data")
screenshot("login", W - 400, H / 2 - 190, 340, 260)
c.showPage()

# ---------------------------------------------------------------- 2 problem
new_slide("The problem")
y = H - 120
y = bullets([
    "<b>Mid-market digital firms leave R&amp;D credits unclaimed.</b> Section 41 "
    "credits reward technological experimentation — but the evidence lives in "
    "Git history and cloud bills, not in tax workflows.",
    "<b>The evidence exists — in the wrong systems.</b> Commit messages, GPU "
    "training runs, SageMaker experiments are exactly what the IRS four-part "
    "test asks for, and nobody converts them into tax-ready documentation.",
    "<b>Nexus compounds the risk.</b> Post-2018 economic-nexus rules "
    "($500k CA, $100k WA…) caught many multi-state SaaS firms unregistered.",
    "Gate 1 sized the market at $26.39B TAM (secondary sources, directional). "
    "A 50-person firm typically forgoes $50k–$250k per year.",
], 54, y, W - 110)
c.setFillColor(SLATE)
c.setFont("Helvetica-Oblique", 11)
c.drawString(54, 50, "Sources: IRS Form 6765 instructions and §41 Audit Technique Guide; per-state revenue departments (URLs in repo).")
c.showPage()

# ---------------------------------------------------------------- 3 who
new_slide("Who has it")
y = H - 120
y = wrap("<b>Target customer:</b> US software firms, 10–250 employees, "
         "$2M–$50M ARR, multi-state, on AWS + GitHub + Stripe, without a "
         "full-time credit specialist. Buyer: CFO/VP Finance.", BODY,
         54, y, W - 110) - 14
y = bullets([
    "Typical profile: 50 engineers, ~$12M ARR, 8 states of sales tax exposure, "
    "$2–4M/year of qualifying wages never mapped to the four-part test.",
    "Existing tools miss it: CPAs see spreadsheets, not telemetry; Avalara "
    "covers nexus, not credits; DIY software fills forms without evidence.",
], 54, y, W - 110) - 10
c.setFillColor(AMBER)
c.setFont("Helvetica-Bold", 13)
c.drawString(54, y - 6, "Honest disclosure: the 5+ customer interviews promised in Gate 1")
c.drawString(54, y - 24, "have not been held yet. Interview script is ready; findings will")
c.drawString(54, y - 42, "revise this slide. We report the gap rather than invent quotes.")
c.showPage()

# ---------------------------------------------------------------- 4 solution
new_slide("Solution")
y = H - 120
y = bullets([
    "<b>Ingest</b> GitHub commits, Stripe test-mode payments, AWS billing CSVs "
    "(or the built-in simulator for offline demos).",
    "<b>Classify</b> every event against official IRS §41 text: retrieval over "
    "241 chunks from the Form 6765 instructions + Audit Technique Guide, "
    "LLM verdict in strict JSON, explainable keyword fallback. Engine named on "
    "every result.",
    "<b>Encrypt &amp; chain:</b> AES-256-GCM per record, SHA-256 hash chain — "
    "tamper with one row and verification names the exact record.",
    "<b>Nexus watch</b> across 10 states with thresholds sourced from official "
    "revenue sites; unverified rows are flagged, not faked.",
    "<b>Risk score + simulated binder</b> with transparent formulas, labelled "
    "everywhere they appear.",
], 54, y, W - 110)
c.showPage()

# ---------------------------------------------------------------- 5 demo
new_slide("Live demo — the dashboard")
screenshot("overview", 54, H - 470, 500, 330)
screenshot("events", 586, H - 470, 500, 330)
c.setFillColor(SLATE)
c.setFont("Helvetica", 11)
c.drawString(54, H - 500, "Overview: live totals + chain badge")
c.drawString(586, H - 500, "Events: R&D verdict, confidence, IRS rule citation, engine, ciphertext")
c.showPage()

# ---------------------------------------------------------------- 6 architecture
new_slide("How it works")
try:
    from reportlab.graphics import renderPM
except ImportError:
    renderPM = None
# Draw the pipeline by hand (diagram-as-code, no external renderer needed).
bx, by = 70, H - 200
box_w, box_h = 150, 58


def node(x, yy, label, sub="", color=TEAL):
    c.setStrokeColor(color)
    c.setFillColor(colors.HexColor("#1e293b"))
    c.setLineWidth(1.4)
    c.roundRect(x, yy, box_w, box_h, 6, stroke=1, fill=1)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 11.5)
    c.drawCentredString(x + box_w / 2, yy + box_h / 2 + (2 if sub else -4), label)
    if sub:
        c.setFillColor(SLATE)
        c.setFont("Helvetica", 8.5)
        c.drawCentredString(x + box_w / 2, yy + box_h / 2 - 12, sub)


def arrow(x1, y1, x2, y2):
    c.setStrokeColor(SLATE)
    c.setLineWidth(1.2)
    c.line(x1, y1, x2, y2)
    c.setFillColor(SLATE)
    c.circle(x2, y2, 2, stroke=0, fill=1)


for i, (lbl, sub) in enumerate([("GitHub", "commits API"), ("Stripe", "test mode"),
                                ("AWS", "billing CSV"), ("Simulator", "offline")]):
    yy = H - 150 - i * 74
    node(bx, yy, lbl, sub)
    arrow(bx + box_w, yy + box_h / 2, bx + box_w + 26, yy + box_h / 2)
c.setLineWidth(1.2)
c.line(bx + box_w + 26, H - 150 - 37, bx + box_w + 26, H - 150 - 3 * 74 + 29)
arrow(bx + box_w + 26, H - 224, bx + box_w + 60, H - 224)

node(bx + box_w + 60, H - 253, "FastAPI + JWT", "validate · rate-limit", AMBER)
arrow(bx + 2 * box_w + 60, H - 224, bx + 2 * box_w + 94, H - 224)
node(bx + 2 * box_w + 94, H - 253, "Classifier", "RAG → LLM → fallback")
arrow(bx + 2 * box_w + 94 + box_w / 2, H - 253, bx + 2 * box_w + 94 + box_w / 2, H - 313)
node(bx + 2 * box_w + 94, H - 371, "AES-256-GCM + hash chain")
arrow(bx + 2 * box_w + 94 + box_w / 2, H - 371, bx + 2 * box_w + 94 + box_w / 2, H - 431)
node(bx + 2 * box_w + 94, H - 489, "SQLite ledger")
arrow(bx + 2 * box_w + 94 + box_w, H - 460, bx + 2 * box_w + 130, H - 460)
node(bx + 2 * box_w + 130, H - 489, "Next.js UI", "6 screens", colors.HexColor("#60a5fa"))
node(bx + 2 * box_w + 94 + 30, H - 371 + 120, "IRS §41 KB", "241 chunks", SLATE)
c.showPage()

# ---------------------------------------------------------------- 7 AI approach
new_slide("AI approach & measured accuracy")
y = H - 120
y = wrap("<b>Design:</b> retrieve the 3–4 most relevant official IRS rule chunks "
         "(TF-IDF, offline, free), ask the LLM for one strict JSON verdict "
         "(qualified, confidence, reason, rule_cited, expense), parse safely, "
         "fall back to explainable keyword rules on ANY failure. Results cached "
         "— repeat demos never re-hit an API.", BODY, 54, y, W - 110) - 16
c.setFillColor(WHITE)
c.setFont("Helvetica-Bold", 15)
c.drawString(54, y - 8, "Measured on 48 hand-labeled events (real pipeline, no cherry-picking):")
y -= 34
rows = [("Engine", "Accuracy", "Precision", "Recall", "F1"),
        ("keyword-rules (default, offline)", "97.9%", "95.7%", "100%", "97.8%"),
        ("llm-rag", "not measured — needs a free-tier API key; harness ready", "", "", "")]
c.setFont("Helvetica-Bold", 13)
for i, row in enumerate(rows):
    yy = y - i * 26
    c.setFillColor(TEAL if i == 0 else WHITE)
    c.setFont("Helvetica-Bold" if i == 0 else "Helvetica", 13)
    c.drawString(60, yy, row[0])
    if i == 0:
        for j, cell in enumerate(row[1:]):
            c.drawString(420 + j * 110, yy, cell)
    else:
        c.drawString(420, yy, row[1])
y -= len(rows) * 26 + 16
y = wrap("The single miss: a hosted-model consumption event ('Bedrock model "
         "invocation') triggered on the word <i>model</i>. We publish the miss "
         "because judges should trust measured numbers over claimed ones.",
         SMALL, 54, y, W - 110)
c.showPage()

# ---------------------------------------------------------------- 8 security
new_slide("Security & audit trail")
y = H - 120
y = bullets([
    "<b>AES-256-GCM</b> per event, fresh 12-byte nonce, key from environment only.",
    "<b>SHA-256 hash chain</b> over ciphertexts: edit or reorder one row and "
    "verification reports <i>first_broken_seq</i> — the exact record that broke.",
    "<b>JWT (HS256)</b> on every data route; rate limits (login 10/min, events "
    "120/min); CORS locked to the dashboard origin; Pydantic validation on "
    "every event shape.",
    "<b>21 passing pytest tests</b> incl. wrong-key failure, ciphertext tamper, "
    "chain reorder detection; pip-audit clean.",
], 54, y, W / 2 + 180)
screenshot("ledger", W - 500, H - 470, 446, 300)
c.setFillColor(SLATE)
c.setFont("Helvetica-Oblique", 11)
c.drawString(54, 60, "Stated limits (SECURITY.md): single non-rotating key; chain proves tampering but cannot stop a full rewrite by a key-holder; no enclaves/mTLS.")
c.showPage()

# ---------------------------------------------------------------- 9 market
new_slide("Market size (assumptions visible)")
y = H - 140
for label, val, note in [
    ("TAM", "$26.39B", "research-credit prep market — Gate 1 secondary sources, directional"),
    ("SAM", "$5.20B", "US tech firms &lt;$50M ARR addressable with self-serve telemetry"),
    ("SOM", "$217.5M", "15,000 firms × $14,500 ACV (firm count is an assumption)"),
]:
    c.setFillColor(TEAL)
    c.setFont("Helvetica-Bold", 26)
    c.drawString(60, y, label)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 30)
    c.drawString(180, y, val)
    c.setFillColor(SLATE)
    c.setFont("Helvetica", 12)
    c.drawString(430, y + 4, note)
    y -= 64
y = wrap("<b>Year-1 target:</b> 80–120 customers ≈ $1.2–1.7M ARR. Every dollar "
         "is arbitrage: the customer pays $14.5k for an estimated $50k–$250k "
         "credit (their numbers, their CPA's sign-off).", BODY, 54, y + 10, W - 110)
c.setFillColor(AMBER)
c.setFont("Helvetica-Oblique", 11)
c.drawString(54, 50, "TAM/SAM carried from Gate 1 and not re-verified this gate; SOM arithmetic shown so it can be challenged.")
c.showPage()

# ---------------------------------------------------------------- 10 competition
new_slide("Competition & differentiation")
rows = [
    ("CPA firms", "Expert credit calc", "Per-engagement pricing; manual evidence chase"),
    ("Avalara / tax engines", "Sales tax &amp; nexus", "Nexus yes — no R&amp;D evidence pipeline"),
    ("TurboTax Business", "Form filling", "Forms, not evidence; user must know what qualifies"),
    ("AI tax assistants", "Chat answers", "Generic knowledge; not wired to your telemetry; no audit trail"),
    ("<b>TaxShield</b>", "<b>Telemetry → claim</b>", "<b>Credit as a by-product of data you already generate, audit-trail wrapped</b>"),
]
y = H - 130
c.setFont("Helvetica-Bold", 13)
c.setFillColor(TEAL)
for x, w_, txt in [(60, 200, "Player"), (280, 240, "Does"), (540, 400, "Misses")]:
    c.drawString(x, y, txt)
y -= 26
for i, (a, b, cc) in enumerate(rows):
    yy = y - i * 44
    c.setFillColor(TEAL if i == len(rows) - 1 else WHITE)
    c.setFont("Helvetica-Bold" if i == len(rows) - 1 else "Helvetica", 12.5)
    c.drawString(60, yy, a)
    c.setFillColor(WHITE if i == len(rows) - 1 else SLATE)
    wrap(b, SMALL if i < len(rows) - 1 else BODY, 280, yy + 6, 240)
    wrap(cc, SMALL if i < len(rows) - 1 else BODY, 540, yy + 6, 420)
c.showPage()

# ---------------------------------------------------------------- 11 model
new_slide("Business model & go-to-market")
y = H - 125
y = bullets([
    "<b>Monitor — $499/mo:</b> telemetry ingest, classification, ledger, nexus watch (&lt;25 employees).",
    "<b>Claim — $14,500/yr (core):</b> + CPA-ready export package, audit-trail walkthrough, annual recompute.",
    "<b>Enterprise — custom:</b> SSO, Postgres/on-prem, enclave processing, multi-entity.",
], 54, y, W / 2 + 150) - 6
y = wrap("<b>Unit economics (illustrative):</b> &gt;85% gross margin at Tier 2 — "
         "LLM cost &lt;$0.02/event (keyword fallback = $0), hosting ~$50/mo per "
         "customer band; 6-month payback at $14.5k ACV if close rate ≥20%.",
         BODY, 54, y, W / 2 + 150)
c.setFillColor(WHITE)
c.setFont("Helvetica-Bold", 15)
c.drawString(W / 2 + 190, H - 125, "Go-to-market")
bullets([
    "<b>CPA channel first:</b> firms doing credits for 10+ clients — sell "
    "evidence quality, they keep the filing relationship.",
    "<b>Founder-led content:</b> 'what your Git history says about §41'.",
    "<b>Incubator partnerships:</b> portfolio firms form habits early.",
    "<b>Free nexus watch</b> as top-of-funnel.",
], W / 2 + 190, H - 155, W / 2 - 230)
c.showPage()

# ---------------------------------------------------------------- 12 roadmap
new_slide("Roadmap, team & ask")
y = H - 120
y = bullets([
    "Run 3–5 customer interviews; revise the business case with real evidence.",
    "Wire a free-tier LLM key; measure llm-rag accuracy on the same 48 labels.",
    "Verify the four unverified state thresholds from official sites.",
    "Deploy for a public demo link; Postgres migration.",
    "Timesheet integration to replace the $75/hr hours assumption.",
    "Enclaves/mTLS for enterprise; underwriting partner for real insurance.",
], 54, y, W / 2 + 130)
c.setFillColor(WHITE)
c.setFont("Helvetica-Bold", 16)
c.drawString(W / 2 + 170, H - 125, "Team Qubrix")
c.setFillColor(SLATE)
c.setFont("Helvetica", 13)
c.drawString(W / 2 + 170, H - 152, "AI/ML  ·  Cyber-Security  ·  IoT & Cloud")
c.setFillColor(WHITE)
c.setFont("Helvetica-Bold", 15)
c.drawString(W / 2 + 170, H - 200, "Ask")
c.setFillColor(SLATE)
c.setFont("Helvetica", 12.5)
c.drawString(W / 2 + 170, H - 224, "Mentor intro to a CPA firm running §41")
c.drawString(W / 2 + 170, H - 244, "credits for 10+ clients (channel test),")
c.drawString(W / 2 + 170, H - 264, "and feedback on the honesty of our")
c.drawString(W / 2 + 170, H - 284, "real/partial/mocked claims.")
c.setFillColor(AMBER)
c.setFont("Helvetica-Oblique", 11)
c.drawString(54, 50, "Demo: python run.py → dashboard on :3000 · everything runs offline · full evidence in github.com/Thiviru-Opallage/taxshield-enterprise")
c.showPage()

c.save()
print(f"wrote {OUT} ({slide_no} slides)")
