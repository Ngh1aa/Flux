# Flux — Evidence Deep Dive

Status: `F0–F4 IMPLEMENTED / TECHNICAL QA PASS / DIRECT_USER ROUND 01 READY_TO_RECRUIT`

Canonical product: https://flux-six-liard.vercel.app/

Canonical reviewer lens after deployment: https://flux-six-liard.vercel.app/design-lens.html

This package applies the evidence sequence used as the next step after a polished prototype:

`Decision Pins → state/edge cases → conceptual before/current → 60-second tour → direct-user test → Decision Log → iteration → retest`

## What is implemented now

- **F0 — Canonical reviewer entry:** the evidence lens is reachable by URL only (never linked from the product, so the product shows no prototype signals) and links back to the normal product.
- **F1 — Decision depth:** D-01…D-04 are pinned on the request detail with decision, evidence class, risk, trade-off, current status and the next validation task. D-05 (advance settlement) is listed in the lens but lives on Settlements, so it has no pin.
- **F2 — Forced states:** permission denied, approval expired, vendor account changed and payout failed / no money moved are directly inspectable.
- **F3 — Before/current:** the baseline is explicitly labeled `CONCEPTUAL BASELINE / NOT A HISTORICAL SHIPPED SCREEN`.
- **F4 — 60-second tour:** the five-step reasoning tour is gated at desktop and mobile reviewer widths.

These are recruiter-facing product/technical artifacts. They are not direct-user findings.

## Decision map

- `D-01` — Approval context / Approval Rail.
- `D-02` — Role visibility vs authority.
- `D-03` — Payout failure: what happened to the money + safe retry.
- `D-04` — Reconstructable activity/audit trail.
- `D-05` — Receipts against the advance they settle; missing receipt as a state.

## Human gate

Current verified DIRECT_USER sessions: **0**.  
Current verified PROXY sessions: **0**.

Round 01 was re-planned on 2026-11-25 for the new content and is `READY_TO_RECRUIT` for 3–5 real participants: employees, team leads, accountants and directors in companies of up to about 200 staff who handled advances, reimbursements or vendor payments in the last 6 months. A pilot session comes first and is not counted. Larger-company or money-free approval experience remains `PROXY` and is analyzed separately.

Do not start an evidence-driven product iteration from fictional participants, AI feedback or technical QA. After 3–5 verified DIRECT_USER sessions, synthesize traceable findings, update the Decision Log, change only evidence-supported decisions, freeze the changed build and rerun affected tasks as a retest.

## Verification

`qa/evidence-lens.spec.mjs` verifies:

- reviewer entry from the normal product;
- D-01…D-04 decision pins and deep metadata;
- conceptual-baseline truth label;
- all four forced states;
- explicit no-money-moved recovery boundary;
- (`qa/synthetic-dogfood-integrity.spec.mjs`) one canonical form covering D-01…D-05 with no treasury data left;
- five-step tour;
- mobile reviewer rail/tour usability;
- the empty human evidence ledger and 0-session truth boundary.
