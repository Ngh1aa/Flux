# Flux — Next Evidence Plan

Status: `PLANNED / READY_FOR_EXECUTION`

Canonical reviewer prototype: https://flux-six-liard.vercel.app/

Workspace operating contract: `Ngh1aa/uiux-ai-workspace` — source truth → acceptance criteria → execution → verification → root-cause repair → report.

Current evidence boundary:
- recruiter-facing Design Lens exists;
- D-01…D-04 are product/design decisions under test, not validated outcomes;
- forced states are technical/product proof, not direct-user findings;
- verified DIRECT_USER sessions: **0**;
- verified PROXY sessions: **0**;
- do not claim faster approvals, fewer errors, better confidence, or improved recovery until compatible post-change evidence exists.

## Goal

Turn Flux from a polished B2B fintech prototype into a recruiter-verifiable product-design case where a reviewer can trace:

`Decision → state/edge case → evidence → change → retest → still open`

without reading repository internals first.

## Execution order

### F0 — One canonical reviewer surface

Use `https://flux-six-liard.vercel.app/` as the canonical live prototype. The evidence/reviewer surface must be reachable from the same deployment rather than living only in repository documentation.

Acceptance criteria:
- live Flux has a clear entry to the Design Lens / evidence view;
- reviewer can return to the normal product without losing context;
- links do not depend on GitHub Pages;
- no proof UI is presented as production functionality.

### F1 — Recruiter-visible Decision Pins

Expose the four current decisions on the relevant product surfaces:

- **D-01 Approval context** — policy rationale + current approver + next approver remain together in payment detail.
- **D-02 Role boundary** — financial evidence stays visible while action authority changes by role.
- **D-03 Settlement recovery** — failure states explicitly explain financial consequence and safe recovery.
- **D-04 Reconstructable activity** — creation, policy and reviewer actions remain traceable beside the payment.

Each pin/popover must show:
- decision;
- evidence class;
- risk if wrong;
- trade-off;
- current status (`PLANNED_VALIDATION`, later `ITERATED`, `RETESTED`, etc.);
- linked task/finding IDs when real evidence exists.

### F2 — State / edge-case depth

Make these states directly inspectable in the reviewer surface and in QA:

1. permission denied;
2. approval expired;
3. insufficient USD liquidity;
4. settlement failed — **no money moved**.

For each state verify:
- trigger is visible;
- financial consequence is explicit;
- next safe action is visible;
- role/permission implications are understandable;
- user is not encouraged to create a duplicate payment;
- recovery retains payment and audit context.

### F3 — Before / current comparison

Keep the baseline explicitly labeled:

`CONCEPTUAL BASELINE / NOT A HISTORICAL SHIPPED SCREEN`

Compare only the decision structure:
- fragmented balances / approval context / settlement status;
- versus one inspectable payment decision surface.

Do not imply the conceptual baseline was a real shipped Flux version.

### F4 — 60-second reviewer tour

Five stops, one reason per stop:

1. **Payment intent** — what amount / account / counterparty is being decided?
2. **Approval Rail** — why does this payment need approval and who owns the next step?
3. **Role boundary** — what can this role see versus do?
4. **Failure + recovery** — did money move and what is the safe next action?
5. **Audit trail** — can another reviewer reconstruct what happened and why?

Tour copy must explain design reasoning, not feature marketing.

### F5 — Direct-user Round 01

Target: **3–5 real participants**, preferably 5.

Preferred DIRECT_USER population:
- finance operations;
- treasury;
- AP / payments;
- finance manager / CFO users who review or approve business payments.

Adjacent accounting, banking-operations, compliance or operations participants remain `PROXY` and are analyzed separately.

Priority tasks:
- **Task 1 / D-01:** explain why approval is required, current approver, next approver, and expected next step.
- **Task 2 / D-02:** switch/inspect role authority and explain what changed versus what stayed visible.
- **Task 3 / D-03:** handle settlement failure; state whether funds moved and choose a safe recovery path.
- **Task 4 / D-04:** reconstruct how/why the payment reached its current state from the activity trail.

Evidence rules:
- no names, emails, account numbers or confidential company data in repo;
- record exact tested build/URL;
- record DIRECT_USER vs PROXY;
- observation and interpretation stay separate;
- atomic evidence only after integrity review;
- 0 sessions stays 0 until traceable real participant records exist.

### F6 — Synthesis + prioritization

After 3–5 verified sessions:
- append atomic evidence IDs;
- synthesize repeated patterns and contradictions;
- map each finding to D-01…D-04;
- assign P0/P1/P2/P3 based on consequence, frequency and recoverability;
- preserve evidence that contradicts the dominant pattern;
- update `DECISION-LOG.md` with cited evidence IDs.

No generic “users liked it” findings.

### F7 — Evidence-driven iteration

Change only decisions supported by verified evidence.

Likely repair owners:
- D-01 → approval rail / payment-detail information hierarchy;
- D-02 → role/permission messaging and action controls;
- D-03 → failure consequence + recovery copy/state model;
- D-04 → activity grouping, rationale visibility and audit reconstruction.

A changed interface is labeled `ITERATION`, not “improved”.

### F8 — Retest

Freeze the changed build and rerun the affected task with **3–5 new or explicitly marked returning participants**.

Only after compatible post-change evidence may a decision move to:
- `PARTIALLY_FIXED`;
- `FIXED_FOR_RETEST_SCOPE`;
- `RETESTED`.

If evidence is mixed or regresses, keep the finding open.

## Recruiter output after the loop

Homepage / case study / reviewer surface should expose, in 30–60 seconds:

`Problem → D-01…D-04 → N verified users → N atomic signals → what changed → retest result → what is still open`

Until Round 01 exists, use truthful placeholders:
- `Direct users · 0 verified`;
- `Round 01 · ready to recruit`;
- `Findings · not measured yet`.

## Definition of done for the next Flux phase

- canonical Vercel reviewer URL is used consistently;
- decision pins and all four forced states are inspectable on the live reviewer surface;
- 60-second tour works at desktop and mobile reviewer widths;
- no console/runtime errors on reviewer-critical flows;
- direct-user package is linked to the exact tested build;
- direct-user count remains truthful;
- iteration is blocked until evidence exists;
- any post-change claim is blocked until retest evidence exists.
