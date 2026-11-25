# Flux — Next Evidence Plan

Status: `PLANNED / READY_FOR_EXECUTION`

Canonical reviewer prototype: https://flux-six-liard.vercel.app/

Workspace operating contract: `Ngh1aa/uiux-ai-workspace` — source truth → acceptance criteria → execution → verification → root-cause repair → report.

Current evidence boundary:
- recruiter-facing Design Lens exists;
- D-01…D-05 are product/design decisions under test, not validated outcomes;
- forced states are technical/product proof, not direct-user findings;
- verified DIRECT_USER sessions: **0**;
- verified PROXY sessions: **0**;
- do not claim faster approvals, fewer errors, better confidence, or improved recovery until compatible post-change evidence exists.

## Goal

Turn Flux, a spend-request prototype for a small Vietnamese company, into a recruiter-verifiable product-design case where a reviewer can trace:

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

Expose the current decisions on the relevant product surfaces:

- **D-01 Approval context** — the rule + current approver + next approver stay together in the request detail.
- **D-02 Role boundary** — the request stays visible while the right to decide changes by role.
- **D-03 Payout recovery** — a failed payout says what happened to the money and how to retry safely.
- **D-04 Reconstructable activity** — creation, the rule applied and every approval stay traceable beside the request.
- **D-05 Advance settlement** — receipts name the advance they settle; a missing receipt is a state (Settlements; listed in the lens without a pin).

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
3. vendor bank account changed (payout blocked until the accountant confirms it);
4. payout failed — **no money moved**.

For each state verify:
- trigger is visible;
- financial consequence is explicit;
- next safe action is visible;
- role/permission implications are understandable;
- user is not encouraged to create a duplicate request;
- recovery retains the request and its approvals.

### F3 — Before / current comparison

Keep the baseline explicitly labeled:

`CONCEPTUAL BASELINE / NOT A HISTORICAL SHIPPED SCREEN`

Compare only the decision structure:
- status and amount alone, without the rule, the next approver or the trail;
- versus one inspectable request decision surface.

Do not imply the conceptual baseline was a real shipped Flux version.

### F4 — 60-second reviewer tour

Five stops, one reason per stop:

1. **The request** — what purpose / payee / amount is being decided?
2. **The rule** — why does this request need the director?
3. **Approval Rail** — who approved, who acts now and who pays out?
4. **Role boundary** — what can this role see versus do?
5. **Activity trail** — can someone else reconstruct what happened and why?

Tour copy must explain design reasoning, not feature marketing.

### F5 — Direct-user Round 01

Target: **3–5 real participants**, preferably 5.

Preferred DIRECT_USER population, in companies of up to about 200 staff, with advance, reimbursement or vendor-payment work in the last 6 months:
- employees who ask for money;
- team leads or managers who approve;
- accountants who check receipts and pay out;
- directors or owners who approve large requests.

The same work only in larger companies, or approvals without money, remains `PROXY` and is analyzed separately. One pilot session runs first and is not counted. Full plan: `research/validation/flux-round-01/STUDY-PLAN.md`.

Priority tasks:
- **Task 1 / D-01:** explain why the director is required, current approver, next approver, and expected next step.
- **Task 2 / D-02:** switch/inspect role authority and explain what changed versus what stayed visible.
- **Task 3 / D-03:** handle a failed payout; state whether money moved and choose a safe retry.
- **Task 4 / D-04:** reconstruct how/why the request reached its current state from the activity trail.
- **Task 5 / D-05:** find the missing receipt on an advance and say what the requester should do.

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
- map each finding to D-01…D-05;
- assign P0/P1/P2/P3 based on consequence, frequency and recoverability;
- preserve evidence that contradicts the dominant pattern;
- update `DECISION-LOG.md` with cited evidence IDs.

No generic “users liked it” findings.

### F7 — Evidence-driven iteration

Change only decisions supported by verified evidence.

Likely repair owners:
- D-01 → approval rail / request-detail information hierarchy;
- D-02 → role/permission messaging and action controls;
- D-03 → payout failure copy/state model;
- D-04 → activity grouping, rationale visibility and audit reconstruction;
- D-05 → how receipts and advances are linked and listed.

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

`Problem → D-01…D-05 → N verified users → N atomic signals → what changed → retest result → what is still open`

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
