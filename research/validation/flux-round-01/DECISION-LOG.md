# Flux Round 01 — Decision Log

These are current product/design decisions and hypotheses. They are **not** validated outcomes.

## D-01 — Approval context stays in the payment detail

- **Decision:** Show policy rationale, current approver and next approver together via the Approval Rail.
- **Evidence state:** `PROJECT_CONTEXT + WORKING_PROTOTYPE / HYPOTHESIS`
- **Risk if wrong:** Reviewers approve without understanding why the control chain exists or who owns the next step.
- **Trade-off:** More operational detail versus a simpler payment detail pane.
- **Next evidence:** Task 1.
- **Status:** `PLANNED_VALIDATION`

## D-02 — Visibility remains stable while authority changes by role

- **Decision:** Employee and Approver roles share the same payment context; action permissions change without hiding the financial evidence.
- **Evidence state:** `WORKING_PROTOTYPE / HYPOTHESIS`
- **Risk if wrong:** Disabled actions are interpreted as broken product behavior, or users cannot tell how to obtain the required authority.
- **Trade-off:** A visible role switcher exposes complexity that a production permissions model might otherwise abstract away.
- **Next evidence:** Task 2.
- **Status:** `PLANNED_VALIDATION`

## D-03 — Settlement failure must state financial consequence and safe recovery

- **Decision:** A failed settlement explicitly states that no debit was posted, preserves the same payment/audit context and directs the user to verify/retry instead of creating a duplicate payment.
- **Evidence state:** `FORCED_STATE TECHNICAL_PROOF / HYPOTHESIS`
- **Risk if wrong:** Duplicate payment attempts or uncertainty about whether funds moved.
- **Trade-off:** More explicit recovery copy versus compact institutional UI.
- **Next evidence:** Task 3.
- **Status:** `PLANNED_VALIDATION`

## D-04 — Approval history remains reconstructable in context

- **Decision:** Creation, policy application and reviewer actions remain visible next to the payment instead of being moved entirely to a separate audit product area.
- **Evidence state:** `WORKING_PROTOTYPE / HYPOTHESIS`
- **Risk if wrong:** The activity trail becomes noise during review or still fails later reconstruction.
- **Trade-off:** More detail in the working surface versus denser visual scanning.
- **Next evidence:** Task 4.
- **Status:** `PLANNED_VALIDATION`

## Iteration rule

Only move a row to `ITERATED` when the cited direct/proxy evidence IDs exist and a concrete product change is traceable to them. Only move to `RETESTED` when the affected task is rerun on the changed build. Do not write “improved” unless compatible post-change evidence supports that claim.
