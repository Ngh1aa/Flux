# Flux Round 01 — Decision Log

These are current product/design decisions and hypotheses. They are **not** validated outcomes.

On 2026-11-25 the decisions were restated for small-company spend requests (advances, reimbursements, vendor payments). D-03 was renamed from "Settlement recovery" to "Payout recovery", because "settlement" now means settling an advance with receipts. D-05 was added. No evidence existed before the change.

## D-01 — Approval context stays in the request detail

- **Decision:** Show the rule, the current approver and the next approver together on the Approval Rail, above the request data.
- **Evidence state:** `PROJECT_CONTEXT + WORKING_PROTOTYPE / HYPOTHESIS`
- **Risk if wrong:** Approvers decide without knowing why the director was added, or requesters keep asking in chat who is next.
- **Trade-off:** More approval context in the detail pane versus a simpler pane.
- **Next evidence:** Task 1.
- **Status:** `PLANNED_VALIDATION`

## D-02 — The request stays visible while the right to decide changes by role

- **Decision:** The requester sees the same request as the approver; only the approver whose turn it is can approve or reject, and the requester can still cancel while it is pending.
- **Evidence state:** `WORKING_PROTOTYPE / HYPOTHESIS`
- **Risk if wrong:** Disabled Approve and Reject read as broken, or the requester does not know what they can still do.
- **Trade-off:** A visible Employee / Approver switch exposes a permission model a production app would hide behind sign-in.
- **Next evidence:** Task 2.
- **Status:** `PLANNED_VALIDATION`

## D-03 — A failed payout states what happened to the money and how to retry safely

- **Decision:** A failed payout says that no money left the account, keeps the same request and approvals, and points to checking the vendor account and retrying instead of creating a new request.
- **Evidence state:** `FORCED_STATE TECHNICAL_PROOF / HYPOTHESIS` (the state exists only in the design lens; the product stops at Payout).
- **Risk if wrong:** The vendor is paid twice, or people believe the money is gone.
- **Trade-off:** Explicit copy about the money versus a more compact interface.
- **Next evidence:** Task 3.
- **Status:** `PLANNED_VALIDATION`

## D-04 — The activity trail stays beside the request

- **Decision:** Creation, each approval and the payout stay visible with names and times next to the request instead of in a separate audit area.
- **Evidence state:** `WORKING_PROTOTYPE / HYPOTHESIS`
- **Risk if wrong:** The trail is noise while deciding, or still not enough to answer "who approved this and when?"
- **Trade-off:** More detail in the working surface versus faster scanning.
- **Next evidence:** Task 4.
- **Status:** `PLANNED_VALIDATION`

## D-05 — Receipts are shown against the advance they settle

- **Decision:** Each receipt names the advance it settles, and a claimed amount without a file is shown as the state "Missing receipt" rather than a footnote.
- **Evidence state:** `WORKING_PROTOTYPE / HYPOTHESIS`
- **Risk if wrong:** Advances stay open because nobody sees which receipt is missing; the Settlements list does not show the advance until a receipt is opened.
- **Trade-off:** A receipt-first list (what the accountant reviews) versus an advance-first view (what the requester needs to close).
- **Next evidence:** Task 5.
- **Status:** `PLANNED_VALIDATION`

## Iteration rule

Only move a row to `ITERATED` when the cited direct/proxy evidence IDs exist and a concrete product change is traceable to them. Only move to `RETESTED` when the affected task is rerun on the changed build. Do not write “improved” unless compatible post-change evidence supports that claim.
