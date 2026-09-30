# Flux Round 01 — Study Plan

## Status
`PLANNED_VALIDATION / READY_TO_RECRUIT`

A completed plan is not a completed study. No direct-user result may be claimed until traceable real-participant evidence exists.

## Canonical questionnaire

Use exactly one participant form for this round:

`research/validation/flux-round-01/FLUX-NATIVE-FORM.md`

Do not reuse, map or adapt the Nova form. The previous separate screener/session-template flow is retired.

## Decision map

| Decision ID | Decision to challenge | Current evidence | Risk if wrong | Research question |
| --- | --- | --- | --- | --- |
| D-01 | Keep policy rationale, current approver and next approver visible in the payment detail via the Approval Rail. | PROJECT_CONTEXT + WORKING_PROTOTYPE / HYPOTHESIS | Reviewers approve without understanding why the control chain exists or who owns the next step. | Can finance users explain why the selected payment requires approval, who acts now and what happens next without being taught? |
| D-02 | Keep shared transaction context visible while action rights change between Employee and Approver roles. | WORKING_PROTOTYPE / HYPOTHESIS | Disabled actions look broken or users misunderstand who is authorized to commit the decision. | Can users distinguish visibility from authority and recover when the current role cannot approve? |
| D-03 | On settlement failure, state whether money moved and give a safe recovery path without creating a duplicate payment. | FORCED_STATE TECHNICAL_PROOF / HYPOTHESIS | Duplicate payment attempts or uncertainty about financial state. | After a settlement failure, can users state whether money moved and choose the safe next action? |
| D-04 | Preserve actor/action history in the payment workspace so later reviewers can reconstruct the control chain. | WORKING_PROTOTYPE / HYPOTHESIS | Approval history becomes decorative and cannot support handoff/audit reasoning. | Can a participant reconstruct who created, reviewed and advanced the payment using the visible trail? |

## Audience and participant criteria

**Target behavior/context:** People who review, approve, prepare or monitor business payments and approval chains.  
**Must-have characteristics:** Uses business banking, ERP/AP, treasury, payment operations or a comparable approval workflow in real work.  
**Preferred roles:** Finance Operations, Accounts Payable/Payments, Treasury, Finance Manager, Controller, CFO/finance approver.  
**Proxy allowance:** Adjacent accounting, banking operations, compliance or procurement-approval users can participate only as `PROXY`; do not pool them into DIRECT_USER counts.  
**Exclusions:** People with no relevant operational experience; people directly involved in building Flux; people who do not consent to anonymized research notes.  
**Target range:** 3 minimum / 5 preferred verified DIRECT_USER records.

## Method

**Preferred:** moderated remote or in-person task-based usability / decision-comprehension test.  
**Fallback:** async structured self-report using the same canonical form.  
**Session length:** 20–30 minutes.  
**Canonical product URL:** `https://flux-six-liard.vercel.app/`  
**Build rule:** record the exact URL/build/commit used for every participant. Do not silently change builds inside a comparison round.

Method boundaries:
- MODERATED may support claims about observed behavior, help, task outcome and recovery action.
- ASYNC_SELF_REPORT may support only reported interpretation, intended action, confidence and perceived clarity.
- Async responses must never be converted into observed task-success, time-on-task or moderator-help claims.

## Task order

1. **D-01 Approval context** — explain why Acme USD 18,400 requires approval, who acts now and what happens next.
2. **D-02 Role boundary** — start in Employee role and explain/recover from disabled approval action.
3. **D-03 Settlement recovery — PRIORITY** — inspect `SETTLEMENT FAILED`, state whether money moved and choose a safe next action.
4. **D-04 Audit reconstruction** — reconstruct actor/action history from the visible control trail.

Exact prompts, response fields, consent, screening and confidence scales live only in `FLUX-NATIVE-FORM.md`.

## Evidence capture

- Use anonymized IDs `FLX-P01` … `FLX-P05`.
- Separate observed behavior from participant interpretation.
- Record method accurately.
- Record every moderator hint/intervention in MODERATED sessions.
- Store no real financial/account data; use prototype values only.
- Atomic evidence goes to `evidence-ledger.jsonl` only after integrity review.
- Contradictions stay in the ledger and findings; do not average them away.
- PROXY evidence remains separate from DIRECT_USER evidence.

## Learning criteria

These are decision criteria, not desired success metrics:

- **D-01 weakened** if participants repeatedly cannot explain policy rationale + current approval owner + next step.
- **D-02 weakened** if disabled controls are interpreted as broken/unbuilt functionality rather than role permissions, or recovery is unclear.
- **D-03 weakened** if participants believe money may already have moved, create a duplicate payment, or cannot identify a safe recovery path.
- **D-04 weakened** if participants cannot reconstruct actor/action history from the visible trail without guessing key steps.

## Synthesis and iteration gate

Begin synthesis after at least **3 verified DIRECT_USER** records; **5 preferred** if evidence is mixed. Keep PROXY evidence separate. Any product change must cite affected decision IDs and atomic evidence IDs.

A changed UI is an **iteration**, not a validated improvement, until the same affected task is retested on a frozen post-change build.

## Open blockers / UNKNOWNs

- Verified DIRECT_USER sessions: **0**.
- Verified PROXY sessions: **0**.
- Exact participant mix is not yet known.
- No production behavior or business-outcome baseline exists.
- The conceptual BEFORE mode in `design-lens.html` is a critique baseline, not a historical shipped version.
