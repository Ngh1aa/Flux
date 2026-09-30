# Flux Round 01 — Study Plan

## Status
`PLANNED_VALIDATION / READY_TO_RECRUIT`

A completed plan is not a completed study. No direct-user result may be claimed until traceable evidence exists.

## Decision map

| Decision ID | Decision to challenge | Current evidence | Risk if wrong | Research question | Method |
| --- | --- | --- | --- | --- | --- |
| D-01 | Keep policy rationale, current approver and next approver visible in the payment detail via the Approval Rail. | PROJECT_CONTEXT + WORKING_PROTOTYPE / HYPOTHESIS | Reviewers approve without understanding why the control chain exists or who owns the next step. | Can finance users explain why the selected payment requires approval, who acts now and what happens next without being taught? | Moderated task-based usability / comprehension |
| D-02 | Keep shared transaction context visible while action rights change between Employee and Approver roles. | WORKING_PROTOTYPE / HYPOTHESIS | Disabled actions look broken or users misunderstand who is authorized to commit the decision. | Can users distinguish visibility from authority and recover when the current role cannot approve? | Moderated task-based usability / comprehension |
| D-03 | On execution failure, state whether money moved and give a safe recovery path without creating a duplicate payment. | FORCED_STATE TECHNICAL_PROOF / HYPOTHESIS | Duplicate payment attempts or uncertainty about financial state. | After a settlement failure, can users state whether money moved and choose the safe next action? | Moderated failure/recovery task |
| D-04 | Preserve actor/action history in the payment workspace so later reviewers can reconstruct the control chain. | WORKING_PROTOTYPE / HYPOTHESIS | Approval history becomes decorative and cannot support handoff/audit reasoning. | Can a participant reconstruct who created, reviewed and advanced the payment using the visible trail? | Moderated reconstruction task |

## Audience and participant criteria

**Target behavior/context:** People who review, approve, prepare or monitor business payments and approval chains.  
**Must-have characteristics:** Uses business banking, ERP/AP, treasury, payment operations or a comparable approval workflow at least monthly.  
**Preferred roles:** Finance Operations, Treasury, Accounts Payable/Payments, Finance Manager, Controller, CFO/finance approver.  
**Proxy allowance:** Adjacent accounting, banking operations, compliance or procurement-approval users can participate only as `PROXY`; do not pool them into DIRECT_USER counts.  
**Exclusions:** People with no experience preparing/reviewing/approving operational business payments; people directly involved in building Flux.  
**Relevant accessibility/support needs:** Ask candidates about assistive technology, language, device, zoom or interaction support needed to participate comfortably.  
**Target range:** 3 minimum / 5 preferred verified DIRECT_USER sessions.  
**Recruitment channels:** Professional network, finance/accounting communities, former colleagues with relevant responsibilities, public GitHub volunteer issue.  

## Method

**Round type:** Moderated remote or in-person task-based usability / decision-comprehension test.  
**Session length:** 20–30 minutes.  
**Prototype:** `design-lens.html` for recruiter/evidence framing; actual tasks should be performed in the live product surface opened from it.  

This method can provide evidence about comprehension, task behavior, errors, recovery and confidence in the prototype. It cannot prove production approval-time reduction, fraud/loss outcomes, adoption or business impact.

## Tasks

### Task 1 — Approval ownership / D-01
> You are reviewing a USD 18,400 supplier payment. Without changing anything yet, tell me why it needs approval, who needs to act now, and what happens after that person approves.

Capture: evidence inspected, current/next approver interpretation, hesitation, moderator help, confidence.

### Task 2 — Role boundary / D-02
> You need to approve this payment, but the interface is currently in the Employee role. Show me what you would do and explain what the disabled action means.

Capture: whether permission is understood, whether participant expects hidden data/context, recovery path, help required.

### Task 3 — Settlement failure / D-03 — PRIORITY
> The payment has passed approvals but settlement fails. Tell me whether any money moved and what you would do next.

Use the forced `SETTLEMENT FAILED` state. Capture: money-movement interpretation, duplicate-payment risk, recovery action, confidence.

### Task 4 — Reconstruct the decision / D-04
> A colleague asks what happened to this payment and who acted on it. Use the interface to reconstruct the control chain for them.

Capture: which trail/rail evidence is used, omissions, ambiguity, confidence.

## Evidence capture

- Use anonymized IDs `FLX-P01` … `FLX-P05`.
- Separate observed behavior from participant interpretation.
- Record moderator help exactly.
- Record method as MODERATED or ASYNC_SELF_REPORT; do not infer observed task success from async forms.
- Store no real financial/account data; use prototype values only.
- Atomic evidence goes to `evidence-ledger.jsonl` only after integrity review.
- Contradictions remain in the ledger and findings; do not average them away.

## Learning criteria

These are decision criteria, not desired success metrics:

- D-01 is weakened if participants repeatedly cannot explain current/next approval ownership or policy rationale.
- D-02 is weakened if disabled controls are interpreted as broken/unavailable product functionality rather than role permissions.
- D-03 is weakened if participants believe money may already have moved, create a second payment, or cannot identify a safe retry path.
- D-04 is weakened if participants cannot reconstruct actor/action history from the visible trail.

## Synthesis and iteration gate

Synthesize after at least 3 verified DIRECT_USER sessions; 5 is preferred if evidence is mixed. Keep proxy evidence in a separate column/evidence class. Any product change must cite the affected decision and evidence IDs. A changed UI is an **iteration**, not a validated improvement, until the same affected task is retested.

## Open blockers / UNKNOWNs

- No verified direct-user sessions yet.
- Exact participant mix is not yet known.
- No production behavior or business outcome baseline exists.
- The conceptual BEFORE mode in `design-lens.html` is deliberately a critique baseline, not a historical shipped version.
