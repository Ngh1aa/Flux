# Flux — B2B Finance Operations Prototype

Flux is an independent Product Design / UI/UX concept for business payment operations, approval context, role-based authority, settlement state and audit reconstruction.

## Live product

https://flux-six-liard.vercel.app/ (portfolio entry URL). The root opens the Payments workspace already signed in as Jamie Stone (Northstar Holdings). **Sign out** in the user menu shows the login screen; use **Continue as Jamie Stone** or `jamie.stone@northstar.co` / `northstar`.

**Demo tools:** add `?demo=1` to any product URL (for example `https://flux-six-liard.vercel.app/?demo=1`) to show a small floating **Demo tools** panel with **Fail the next save** and **Reset demo data**. It stays on for that browser tab; `?demo=0` turns it off. Normal visitors never see it.

The design lens (`design-lens.html`, `index.html?lens=1`) and documentation pages (`design-system.html`, `component-states.html`, `sitemap.html`, `user-flow.html`, `prototype.html`) still work by direct URL but are not linked from the product.

## Evidence status

Current state: `TECHNICAL_PROOF READY / DIRECT_USER ROUND 01 READY_TO_RECRUIT`

Verified DIRECT_USER sessions: **0**  
Verified PROXY sessions: **0**

The repository intentionally separates technical/product proof from human evidence. Forced states, browser QA, AI critique and recruiter feedback are not counted as direct-user validation.

## Product decision map

- **D-01 — Approval context:** keep policy rationale, current approver and next approver together in payment detail.
- **D-02 — Role boundary:** keep financial evidence visible while action authority changes by role.
- **D-03 — Settlement recovery:** state financial consequence and safe recovery when settlement fails.
- **D-04 — Reconstructable activity:** keep creation, policy and reviewer actions traceable in context.

## Evidence deep dive

`Decision Pins → state/edge cases → conceptual before/current → 60-second tour → direct-user test → Decision Log → iteration → retest`

Open:
- `design-lens.html` for the current recruiter-facing review layer;
- `EVIDENCE-DEEP-DIVE.md` for current evidence boundaries;
- `NEXT-EVIDENCE-PLAN.md` for the next execution sequence;
- `research/validation/flux-round-01/` for the study plan, consent/screener, participant tracker, empty evidence ledger, findings boundary and Decision Log.

## Current forced states

- permission denied;
- approval expired;
- insufficient USD liquidity;
- settlement failed — no money moved.

These are prototype/technical fixtures, not observed user findings.

## Human validation gate

Round 01 targets **3–5 real participants** from finance operations, treasury, AP/payments, finance management or CFO approval workflows. Adjacent participants remain `PROXY` and are analyzed separately.

Do not claim faster approvals, fewer payment errors, better approval confidence or improved recovery until traceable participant evidence exists and the affected decision has been retested after iteration.

## Working prototype (no backend)

Every main workflow runs end to end in the browser. All data is fictional and nothing leaves the tab: no money moves and no email is sent.

- **Data:** seeded from `data/seed.js` and copied into `sessionStorage` on first load (`core.js`). Changes survive navigation and reload within the tab. Open `?demo=1` and use **Demo tools → Reset demo data** to start over.
- **Payments** (`index.html`): 3-step new payment (payee, amount and date, review), with the approval chain evaluated live from the policy rules. Drafts can be edited, submitted or deleted. Pending payments can be cancelled by the initiator, or approved or rejected (reason required) in the Approver role. Detail deep link: `index.html?id=TRF-98234`.
- **Saved payees** (`payees.html`): create, view, edit, delete.
- **Accounts:** account detail with searchable, filterable transactions, move money between own accounts (now or scheduled, with scheduled cancel), receiving details and a CSV statement.
- **Cards:** card detail, freeze or unfreeze, edit limit, issue card, cancel with confirmation.
- **Team:** invite, edit role, remove or revoke with confirmation, resend invite, last-CFO guard.
- **Expenses:** submit (receipt kept as a file name only), edit, delete, approve or reject with reason.
- **Reports:** 30d, 90d, YTD or custom range with currency and source filters, CSV export generated client-side, report schedule.
- **Approval policies** (`settings.html`): create, edit and delete rules with validation, change history, CSV export.
- **States:** skeleton loading, empty and filtered-empty lists, not-found detail (`?id=UNKNOWN`), inline validation, a simulated load error (`?simulate=load-error`) and a save failure (`?demo=1`, **Demo tools → Fail the next save**) with Try again.
- The design lens (`index.html?lens=1`) always uses the seed data, so forced evidence states stay stable.

### Tests

```bash
py -3 -m http.server 8901 --bind 127.0.0.1
NODE_PATH=<folder containing playwright> node --test qa/full-flows.test.cjs
```

`qa/full-flows.test.cjs` covers every CRUD flow above, sign out and sign in, demo tools via `?demo=1`, reset, console errors, `href="#"` on every page, and a check that no product page shows prototype wording or demo tools without `?demo=1`.

## Local review

This repository includes static prototype/reviewer surfaces alongside the project implementation. Use the project’s existing development setup for local work, and treat the Vercel URL above as the canonical reviewer prototype unless the source-of-truth plan is updated.
