# Flux — Evidence Deep Dive

Status: `TECHNICAL_PROOF READY / DIRECT_USER ROUND 01 READY_TO_RECRUIT`

This package applies the evidence sequence used as the next step after a polished prototype:

`Decision Pins → state/edge cases → conceptual before/current → 60-second tour → direct-user test → Decision Log → iteration → retest`

## Inspect now

- `design-lens.html` — four decision pins, conceptual baseline/current comparison, five-step 60-second tour and forced operational states.
- `research/validation/flux-round-01/` — runnable moderated study package, empty evidence ledger, findings boundary and decision log.
- `qa/evidence-lens.spec.mjs` — browser gate for the design lens and research truth boundary.

## Decision map

- `D-01` — Approval context / Approval Rail.
- `D-02` — Role visibility vs authority.
- `D-03` — Settlement failure consequence + safe recovery.
- `D-04` — Reconstructable activity/audit trail.

## Forced states

- permission denied;
- approval expired;
- insufficient USD liquidity;
- settlement failed / no money moved.

These are prototype/technical states, not observed user findings.

## Human gate

Current verified direct-user sessions: **0**.

Do not start an evidence-driven product iteration from fictional participants, AI feedback or technical QA. After 3–5 verified DIRECT_USER sessions, synthesize traceable findings, update the Decision Log, change only evidence-supported decisions, freeze the changed build and rerun affected tasks as a retest.
