# Pactum AI - Legal Document Intelligence Suite
> Built for the **PromptWars Exclusive Challenge** (Top 1–400 Exclusive).

**Pactum AI** makes legal documents and basic legal assistance accessible, actionable, and transparent. It helps users simplify legalese, spot predatory contractual traps, compare agreements side-by-side with risk deltas, ask grounded questions with verbatim clause citations, and generate actionable lawyer consultation prep kits.

---

## 🌟 Core Highlights & Capabilities

1. **Document Matrix & Plain-English Translation**
   - **Composite Risk Score (0–100)**: Evaluates legal trap density, broad indemnities, and termination asymmetry.
   - **Legalese Translator**: Plain-English explanations for every paragraph.
   - **Red Flag Detector**: High, Medium, and Safe risk badges flagging hidden traps.
   - **Attorney Advice**: Practical negotiation suggestions for every clause.

2. **Side-by-Side Contract Comparator & Risk Delta**
   - Compares Document A (Original Offer) vs. Document B (Counter-Offer).
   - Shows clause-level diffs (added, removed, modified, identical).
   - Calculates the net **Risk Delta** (e.g. -48 risk points) and declares which draft is more favorable.

3. **Interactive Grounded Assistant ("Ask Pactum AI")**
   - Context-grounded Q&A engine that quotes exact contract lines and clause numbers.
   - Pre-loaded quick prompts (`"Can I take side jobs?"`, `"Who owns my IP?"`, `"Payment terms & penalties?"`).
   - Server-side GenAI architecture: Uses Gemini through the Cloud Run backend when `GEMINI_API_KEY` is configured, with the grounded offline engine as a reliable zero-configuration fallback.

4. **Actionable Deliverables & Lawyer Prep Kit**
   - **Obligations & Deadlines Checklist**: Automatically extracts key calendar dates and milestones into an interactive to-do list.
   - **Negotiation Playbook**: Copy-pasteable balanced redlines with commercial arguments.
   - **Top 5 Questions To Ask Your Attorney**: High-impact questions tailored for legal consultation.
   - **Audit Brief Exporter**: 1-click Markdown export and printable summaries.

5. **Safety Notice & AI Transparency**
   - Prominent disclaimer clarifying that Pactum AI provides legal information and assistance, rather than replacing licensed legal counsel.

---

## 🚀 Live Deployment

Try Pactum AI on the live Google Cloud Run deployment:

[Open Pactum AI](https://promptwars-exclusive-460149421424.us-central1.run.app)

## ✅ Quality Checks

Run the offline engine tests before publishing changes:

```bash
npm test
```

The test suite covers risk scoring, deadline extraction, contract comparison, and lawyer prep-kit generation. The Cloud Run container also sends security headers for content type protection, framing protection, referrer control, and a restricted content policy.

## 🔐 Configure Gemini on Cloud Run

The browser never receives the Gemini key. Prefer a Secret Manager-backed Cloud Run value:

```bash
gcloud run services update promptwars-exclusive \
   --region us-central1 \
   --set-secrets GEMINI_API_KEY=gemini-api-key:latest \
   --set-env-vars GEMINI_MODEL=gemini-2.0-flash
```

Create `gemini-api-key` in Secret Manager first and grant the Cloud Run service account access. Never place a real key in frontend JavaScript, `.env.example`, or GitHub. Without the key, Pactum AI automatically uses its offline grounded engine.

---

## 📂 Project Structure

- `index.html` - Complete application layout and tabs
- `styles.css` - Custom dark glassmorphism design system
- `js/samples.js` - Pre-loaded contracts (Harsh MSA, Balanced MSA, Commercial Lease, SaaS ToS)
- `js/analyzer.js` - Document parsing, risk heuristics, and plain-English translation
- `js/comparator.js` - Visual diff and risk delta comparison
- `js/assistant.js` - Grounded citation assistant and multi-LLM integration
- `js/prepkit.js` - Checklist, redline playbook, and lawyer question generator
- `js/app.js` - UI controller and event bindings
