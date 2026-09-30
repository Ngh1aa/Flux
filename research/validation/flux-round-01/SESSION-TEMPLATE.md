# Flux Round 01 — Session Template

## Session metadata

- Participant ID: `FLX-P__`
- Date/time:
- Method: `MODERATED` / `ASYNC_SELF_REPORT`
- Evidence class: `DIRECT_USER` / `PROXY`
- Relevant role/context:
- Prototype URL/build reference:
- Consent confirmed: YES / NO
- Returning participant from a later retest: YES / NO

> For MODERATED sessions, record observed behavior separately from interpretation. For ASYNC_SELF_REPORT, do not infer observed task success, timing or moderator help.

## Moderator rules

- Use the task prompts as written before probing.
- Do not teach the Approval Rail, role switcher or failure meaning.
- Do not tell the participant what the design is trying to prove.
- Record every hint or intervention.
- Use only simulated prototype data.

## Task 1 — Approval ownership / D-01

**Prompt**  
“You are reviewing a USD 18,400 supplier payment. Without changing anything yet, tell me why it needs approval, who needs to act now, and what happens after that person approves.”

**Observed behavior**  
- First evidence inspected:
- Policy rationale identified without help: YES / PARTIAL / NO / NOT_SCORED
- Current approver identified without help: YES / PARTIAL / NO / NOT_SCORED
- Next approver/step identified without help: YES / PARTIAL / NO / NOT_SCORED
- Moderator help:

**Participant interpretation**  
- Explanation:
- Confidence 1–5:

## Task 2 — Role boundary / D-02

**Prompt**  
“You need to approve this payment, but the interface is currently in the Employee role. Show me what you would do and explain what the disabled action means.”

**Observed behavior**  
- Notices role boundary: YES / PARTIAL / NO / NOT_SCORED
- Safe recovery/navigation:
- Interprets disabled control as permission-bound: YES / PARTIAL / NO / NOT_SCORED
- Moderator help:

**Participant interpretation**  
- What they believe Employee can/cannot do:
- Confidence 1–5:

## Task 3 — Settlement failure / D-03 — PRIORITY

**Setup**  
Open `design-lens.html`, choose `SETTLEMENT FAILED`, then hand control to participant.

**Prompt**  
“The payment has passed approvals but settlement fails. Tell me whether any money moved and what you would do next.”

**Observed behavior**  
- States whether money moved:
- Attempts to create a duplicate payment: YES / NO / NOT_SCORED
- Identifies safe recovery action:
- Evidence used:
- Moderator help:

**Participant interpretation**  
- What happened financially:
- Confidence 1–5:

## Task 4 — Reconstruct decision / D-04

**Prompt**  
“A colleague asks what happened to this payment and who acted on it. Use the interface to reconstruct the control chain for them.”

**Observed behavior**  
- Evidence surfaces used:
- Actor/action sequence reconstructed:
- Important omission/ambiguity:
- Moderator help:

**Participant interpretation**  
- What information feels missing:
- Confidence 1–5:

## Debrief

- Clearest part of the workflow:
- Most confusing/risky part:
- What would they verify before approving a real payment:
- Anything that looked like real-bank behavior when it is only prototype behavior:

## Integrity review before ingestion

- [ ] Eligible participant class recorded.
- [ ] Consent confirmed.
- [ ] Method recorded accurately.
- [ ] Exact prototype/build reference recorded.
- [ ] No PII or real financial data committed.
- [ ] Observation separated from interpretation.
- [ ] Moderator help preserved.
- [ ] Contradictions preserved.
- [ ] Only then append atomic evidence records.
