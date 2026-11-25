# Flux Round 01 — Study Plan

## Status
`PLANNED_VALIDATION / READY_TO_RECRUIT`

A completed plan is not a completed study. No direct-user result may be claimed until traceable real-participant evidence exists.

**Re-planned on 2026-11-25.** Flux moved from a cross-border treasury console to advances, reimbursements and vendor payments in a Vietnamese SME. The earlier plan recruited treasury and finance-operations people and used USD data that no longer exists. No session had been run under it, so no evidence was lost or carried over.

## Canonical questionnaire

Use exactly one participant form for this round:

`research/validation/flux-round-01/FLUX-NATIVE-FORM.md`

Do not reuse, map or adapt the Nova form or the earlier treasury version of this form.

## Decision map

| Decision ID | Decision to challenge | Current evidence | Risk if wrong | Research question |
| --- | --- | --- | --- | --- |
| D-01 | Keep the rule, the current approver and the next approver together above the request data, on the Approval Rail. | PROJECT_CONTEXT + WORKING_PROTOTYPE / HYPOTHESIS | Approvers decide without knowing why the director was added, or requesters keep asking in chat who is next. | Can people say why a request needs the director, who approves now and who is next, without being taught? |
| D-02 | Keep the request fully visible to the requester while only the approver whose turn it is can decide. | WORKING_PROTOTYPE / HYPOTHESIS | Disabled Approve and Reject look broken, or the requester does not know what they can still do. | Can a requester tell seeing from deciding, and find what they can still do (cancel, wait for the named approver)? |
| D-03 | When a payout fails, say that no money left the account and how to retry without paying twice. | FORCED_STATE TECHNICAL_PROOF / HYPOTHESIS | The accountant pays the vendor twice, or people believe the money is gone. | After a failed payout, can people say whether money moved and choose the safe next action? |
| D-04 | Keep who created, approved and paid a request in the activity trail beside it. | WORKING_PROTOTYPE / HYPOTHESIS | The trail is decoration and nobody can answer "who approved this and when?" | Can people reconstruct who did what, and when, from the visible trail? |
| D-05 | Show receipts against the advance they settle, and show a missing receipt as a state. | WORKING_PROTOTYPE / HYPOTHESIS | Advances stay open for weeks because nobody sees which receipt is missing. | Can people find which receipt still blocks settling an advance, and what the requester should do? |

D-05 is new in this plan. It covers the second half of the product (receipts) and the target stated in the portfolio case study: "settle an advance that is missing a receipt".

## Audience and participant criteria

**Target behavior/context:** People in a small company who ask for money for work, approve those requests, check receipts or pay them out.  
**Must-have characteristics:** In the last 6 months, in a company of up to about 200 staff, did at least one of: asked for an advance (tạm ứng), claimed a reimbursement, submitted receipts to settle an advance (hoàn ứng), approved such requests, checked receipts or paid vendors or staff.  
**Preferred mix for 5:** 2 employees who ask, 1 team lead or manager who approves, 1 accountant, 1 director or owner. With 3, keep at least one requester, one approver and one accountant.  
**Proxy allowance:** The same work only in companies above about 200 staff, or approving similar requests without money (leave, purchase requests). Analyze separately; never count as DIRECT_USER.  
**Exclusions:** No relevant experience; people who helped build Flux; no consent.  
**Language:** The interface is in English. Record English reading comfort (form question 9). Do not exclude people who find English hard, but tag findings caused by language, not design, as `LANGUAGE` in the ledger.  
**Target range:** 3 minimum / 5 preferred verified DIRECT_USER records.

## Method

**Preferred:** moderated remote or in-person task-based usability / decision-comprehension test, in Vietnamese.  
**Fallback:** async structured self-report using the same canonical form.  
**Session length:** 25–35 minutes.  
**Pilot:** one session `FLX-PILOT` before `FLX-P01` to check wording, English and timing. Not counted as evidence; fixes to the form are noted in the decision log.  
**Canonical product URL:** `https://flux-six-liard.vercel.app/`  
**Build rule:** record the exact URL/build/commit used for every participant. Do not silently change builds inside a comparison round.  
**Data reset:** before each moderated session, open the product with `?demo=1` and use **Demo tools → Reset demo data**, so every participant starts from the same seed.

Method boundaries:
- MODERATED may support claims about observed behavior, help, task outcome and recovery action.
- ASYNC_SELF_REPORT may support only reported interpretation, intended action, confidence and perceived clarity.
- Async responses must never be converted into observed task-success, time-on-task or moderator-help claims.

## Task order

1. **D-01 Approval context:** open the request "Trade fair brochures" (VND 45,000,000) and explain why the director has to approve, who approves now and who is next.
2. **D-02 Role boundary:** stay in Employee role as Lan; explain why Approve and Reject are disabled and what Lan can still do.
3. **D-03 Payout recovery, PRIORITY:** in the design lens, inspect `PAYOUT FAILED`; say whether money moved and choose a safe next action.
4. **D-04 Audit reconstruction:** open the completed request "Twelve office chairs" and tell a colleague who did what, and when.
5. **D-05 Advance settlement:** in Settlements, find which of Lan's receipts for the Đà Nẵng advance (REQ-2038) still block settling it, and what she should do.

Exact prompts, response fields, consent, screening, confidence scales and expected answers live only in `FLUX-NATIVE-FORM.md`.

## Evidence capture

- Use anonymized IDs `FLX-P01` … `FLX-P05`.
- Separate observed behavior from participant interpretation.
- Record method accurately.
- Record every moderator hint/intervention in MODERATED sessions.
- Store no real company, financial or personal data; use prototype values only.
- Atomic evidence goes to `evidence-ledger.jsonl` only after integrity review.
- Contradictions stay in the ledger and findings; do not average them away.
- PROXY evidence remains separate from DIRECT_USER evidence.
- Tag evidence caused by the English interface as `LANGUAGE` so it is not read as a design finding.

## Learning criteria

These are decision criteria, not desired success metrics:

- **D-01 weakened** if participants repeatedly cannot name the rule, the current approver and the next step.
- **D-02 weakened** if disabled Approve and Reject are read as broken or unfinished, or the requester cannot say what they can still do.
- **D-03 weakened** if participants believe money may already have left, would create a duplicate request, or cannot name a safe next action.
- **D-04 weakened** if participants cannot reconstruct who created, approved and paid the request without guessing.
- **D-05 weakened** if participants cannot find the missing receipt, or believe the advance is settled while a receipt is missing.

The portfolio case study states the target: ≥ 4/5 participants correctly say who approves a request next and why (D-01), and settle an advance that is missing a receipt (D-05). It is a target, not a result.

## Synthesis and iteration gate

Begin synthesis after at least **3 verified DIRECT_USER** records; **5 preferred** if evidence is mixed. Keep PROXY evidence separate. Any product change must cite affected decision IDs and atomic evidence IDs.

A changed UI is an **iteration**, not a validated improvement, until the same affected task is retested on a frozen post-change build.

## Open blockers / UNKNOWNs

- Verified DIRECT_USER sessions: **0**.
- Verified PROXY sessions: **0**.
- The pilot has not been run.
- Exact participant mix is not yet known.
- The interface is English while participants are Vietnamese; how much this affects tasks is unknown until the pilot.
- No production behavior or business-outcome baseline exists.
- The conceptual BEFORE mode in `design-lens.html` is a critique baseline, not a historical shipped version.
