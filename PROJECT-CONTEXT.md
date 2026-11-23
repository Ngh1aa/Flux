# Flux Project Context

## Project identity

- **Project name:** FLUX
- **Project type:** Spend requests for a small company (B2B SaaS, desktop first, usable on phones)
- **Repository / workspace:** https://github.com/Ngh1aa/Flux
- **Current stage:** Design & Implementation. On 2026-11-23 the content moved from cross-border treasury for a holding group to advances, reimbursements and vendor payments in a Vietnamese SME (`docs/redesign/content-advances.md`). The visual system below did not change.

## Project goal

- **Primary goal:** Let a small company handle advances, reimbursements and vendor payments without losing track of who approved what and what is still owed.
- **Success looks like:** An employee asks for money in a minute, approvers see the rule and the next step at once, and the accountant pays out and settles receipts with a clear trail.
- **Primary users:** Employee, Team lead, Accountant, Director, Admin.
- **Main user problems (HYPOTHESIS, not yet observed with users):** requests travel through chat and paper, nobody is sure who approves next, and advances stay open for weeks.

## UX / product problem frame

- **Priority user / role:** Team lead and Accountant.
- **Highest-value user task:** Approving a request with enough context, then paying it out.
- **Owner / business objective:** Controlled spending without slowing people down.
- **Primary behavior / conversion:** A request reaches payout with the right approvals and, for an advance, a settled set of receipts.
- **Critical journey (Hero flow):** Employee requests VND 45,000,000 for trade fair brochures → Rule 01 requires Team lead then Director → both approve → Accountant pays out → the activity trail shows every step.

## Locked design system

Flux uses the direction **Precise / Institutional / Efficient**. It should feel like a calm, exact operations console for a company's money, not a consumer fintech app.

- Page background `#F0F1EE`; surfaces `#FFFFFF`; primary ink `#14171A`; secondary `#5B6560`; muted `#8A8F89`.
- Hairline borders `#D3D6D0`, stronger interactive borders `#C3C7C0`.
- Institutional navy accent `#1F3A5F`, used sparingly for links, active states, and one primary action per view.
- Approved/active: `#2F5D3A` on `#E4E8D8`; pending: `#6B4A0F` on `#F0E2C4`; rejected/blocked: `#6A2B20` on `#F0DDD1`.
- UI/body typography: **IBM Plex Sans** (covers Vietnamese). Numbers, amounts, IDs, timestamps and rule thresholds: **IBM Plex Mono** with tabular numbers. People's names use Plex Sans so long Vietnamese names wrap cleanly.
- Radius `0–2px`; no drop shadows, glow, gradients, purple, playful illustration, emoji, or pill badges.
- Dense, table-first layouts with horizontal dividers are preferred over rounded card grids. On phones, tables become two-line ledger lists.
- Persistent ~220px left sidebar with workspace name, Employee/Approver role switcher, and left-border active nav. Top strip stays slim and functional.
- Status badges are rectangular. Numbers should scan like a ledger.
- Signature components: **Approval Rail** (in the request detail and as a mini rail in every row) and **Approval Rule Builder**.

## Reference material

- **Benchmarks:** Ramp, Brex and Payhawk for spend requests; MISA and Base.vn for how Vietnamese SMEs handle advances and approvals.
- **Visual direction:** precise / institutional / efficient.
- **Visual signature:** Approval Rail (where a request sits in the chain: Draft → Team lead → Director or Accountant → Payout).

## Architecture & IA

- Requests (New request, Approval queue, Request detail); Vendors reached from Requests
- Settlements (receipts against advances and out-of-pocket claims)
- Funds (bank accounts and petty cash)
- Team (Members, Roles, Permissions)
- Reports
- Settings (Approval rules)

## Important States

- draft
- needs approval
- partially approved
- rejected
- cancelled
- approved, waiting for payout
- paid
- payout failed
- receipt missing
- permission denied

## Special Screens

- **Approval Rule Builder:** IF/THEN rule form. Example: `IF amount > VND 20,000,000 THEN Team lead → Director`. Conditions: amount, request_type, vendor_age_days, outside_hours. Keep the logic explicit and editable; avoid visual node-editor complexity.
