# Flux Project Context

## Project identity

- **Project name:** FLUX
- **Project type:** B2B Fintech / Global Business Money Desktop SaaS
- **Repository / workspace:** https://github.com/Ngh1aa/Flux
- **Current stage:** Design & Implementation

## Project goal

- **Primary goal:** Allow finance teams to manage international payments and team spending without losing visibility or control.
- **Success looks like:** A precise, institutional, and efficient dashboard that handles multi-currency transactions, team roles, payment approvals, and spend controls.
- **Primary users:** Employee, Finance Manager, CFO, Bookkeeper, Admin.
- **Main user problems:** Lack of visibility and control over global team spending and approvals.

## UX / product problem frame

- **Priority user / role:** Finance Manager / CFO.
- **Highest-value user task:** Managing and approving international payments.
- **Observed friction / unmet need:** Disconnected approval chains and lack of clear activity trails.
- **Owner / business objective:** Secure, controlled financial operations.
- **Primary behavior / conversion:** Seamless execution of approved payments.
- **Critical journey (Hero flow):** Employee creates $18,400 transfer → policy requires manager approval → manager reviews → CFO second approval → payment executed → immutable activity trail.

## Locked design system

Flux uses the direction **Precise / Institutional / Efficient**. It should feel like the internal operations console of a serious financial institution, not a consumer fintech app.

- Page background `#F0F1EE`; surfaces `#FFFFFF`; primary ink `#14171A`; secondary `#5B6560`; muted `#8A8F89`.
- Hairline borders `#D3D6D0`, stronger interactive borders `#C3C7C0`.
- Institutional navy accent `#1F3A5F`, used sparingly for links, active states, and one primary action per view.
- Approved/active: `#2F5D3A` on `#E4E8D8`; pending: `#6B4A0F` on `#F0E2C4`; rejected/blocked: `#6A2B20` on `#F0DDD1`.
- UI/body typography: **IBM Plex Sans**. All numbers, currency amounts/codes, transaction IDs, timestamps, and rule thresholds: **IBM Plex Mono** with tabular numbers.
- Radius `0–2px`; no drop shadows, glow, gradients, purple, playful illustration, emoji, or pill badges.
- Dense, table-first layouts with horizontal dividers are preferred over rounded card grids.
- Persistent ~220px left sidebar with workspace name, Employee/Approver role switcher, and left-border active nav. Top strip stays slim and functional.
- Status badges are rectangular. Numeric and operational information should scan like a ledger or SWIFT message.
- Signature components: **Approval Rail** and **Approval Policy Builder**.

## Reference material

- **Benchmarks:** Wise Business, Revolut Business, Airwallex, Ramp, Brex, Mercury.
- **Visual direction:** precise / institutional / efficient.
- **Visual signature:** Approval Rail (a timeline showing where a payment sits in the control chain).

## Architecture & IA

- Accounts (Currency Detail)
- Payments (New Payment, Approval Queue, Payment Detail)
- Cards
- Team (Members, Roles, Permissions)
- Expenses
- Reports
- Settings (Approval Policies)

## Important States

- draft
- needs approval
- partially approved
- rejected
- expired
- processing
- completed
- failed
- permission denied

## Special Screens

- **Approval Policy Builder:** IF/THEN rule form. Example: `IF amount > $10,000 AND currency != base currency THEN Finance Manager → CFO approval`. Keep the logic explicit and editable; avoid visual node-editor complexity.
