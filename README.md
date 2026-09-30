# Flux — B2B Finance Operations Prototype

Flux is an independent Product Design / UI/UX concept for business payment operations, approval context, role-based authority, settlement state and audit reconstruction.

## Live prototype

https://flux-six-liard.vercel.app/

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

## Local review

This repository includes static prototype/reviewer surfaces alongside the project implementation. Use the project’s existing development setup for local work, and treat the Vercel URL above as the canonical reviewer prototype unless the source-of-truth plan is updated.
