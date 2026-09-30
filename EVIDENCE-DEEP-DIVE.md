# Flux — Evidence Deep Dive

Status: `F0–F4 IMPLEMENTED / TECHNICAL QA PASS / DIRECT_USER ROUND 01 READY_TO_RECRUIT`

Canonical product: https://flux-six-liard.vercel.app/

Canonical reviewer lens after deployment: https://flux-six-liard.vercel.app/design-lens.html

This package applies the evidence sequence used as the next step after a polished prototype:

`Decision Pins → state/edge cases → conceptual before/current → 60-second tour → direct-user test → Decision Log → iteration → retest`

## What is implemented now

- **F0 — Canonical reviewer entry:** the normal Flux product exposes a clearly labeled `PORTFOLIO REVIEW` entry to the evidence lens, and the lens links back to the normal product.
- **F1 — Decision depth:** D-01…D-04 expose decision, evidence class, risk, trade-off, current status and the next validation task.
- **F2 — Forced states:** permission denied, approval expired, insufficient USD liquidity and settlement failed / no money moved are directly inspectable.
- **F3 — Before/current:** the baseline is explicitly labeled `CONCEPTUAL BASELINE / NOT A HISTORICAL SHIPPED SCREEN`.
- **F4 — 60-second tour:** the five-step reasoning tour is gated at desktop and mobile reviewer widths.

These are recruiter-facing product/technical artifacts. They are not direct-user findings.

## Decision map

- `D-01` — Approval context / Approval Rail.
- `D-02` — Role visibility vs authority.
- `D-03` — Settlement failure consequence + safe recovery.
- `D-04` — Reconstructable activity/audit trail.

## Human gate

Current verified DIRECT_USER sessions: **0**.  
Current verified PROXY sessions: **0**.

Round 01 remains `READY_TO_RECRUIT` for 3–5 real participants from finance operations, treasury, AP/payments or finance approval workflows. Adjacent participants remain `PROXY` and are analyzed separately.

Do not start an evidence-driven product iteration from fictional participants, AI feedback or technical QA. After 3–5 verified DIRECT_USER sessions, synthesize traceable findings, update the Decision Log, change only evidence-supported decisions, freeze the changed build and rerun affected tasks as a retest.

## Verification

`qa/evidence-lens.spec.mjs` verifies:

- reviewer entry from the normal product;
- D-01…D-04 decision pins and deep metadata;
- conceptual-baseline truth label;
- all four forced states;
- explicit no-money-moved recovery boundary;
- five-step tour;
- mobile reviewer rail/tour usability;
- the empty human evidence ledger and 0-session truth boundary.
