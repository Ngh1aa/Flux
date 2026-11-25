# Flux — Spend requests for a small company

Flux is an independent Product Design / UI/UX concept for **advances, reimbursements and vendor payments
inside a Vietnamese SME**: an employee asks for money, the request moves through an approval chain, the
accountant pays it out, and every step stays traceable. UI language: English. Currency: VND.

The fictional company is **Minh An Trading**, about 40 staff in Hồ Chí Minh City. Flux started as a
cross-border treasury console for a holding group; in November 2026 the content moved to this more familiar
setting while the approval mechanics and the visual system stayed. The content model is in
`docs/redesign/content-advances.md`; the interface redesign is in `docs/redesign/inventory.md`.

## Live product

https://flux-six-liard.vercel.app/ (portfolio entry URL). The root opens **Requests** signed in as
Võ Ngọc Lan (Sales). **Sign out** in the user menu shows the login screen; use **Continue as Võ Ngọc Lan**
or `lan.vo@minhan.vn` / `minhan`. The **Approver** switch in the sidebar acts as the person whose turn it is
in the chain (team lead, director or accountant).

**Demo tools:** add `?demo=1` to any product URL to show a small **Demo tools** panel with **Fail the next
save** and **Reset demo data**. It stays on for that browser tab; `?demo=0` turns it off.

## Who does what

| Person | Role |
|---|---|
| Võ Ngọc Lan | Employee (Sales); creates requests and settles receipts |
| Lê Minh Khoa | Team lead (Sales); first approval |
| Trần Quốc Bảo | Director; approves requests above VND 20,000,000 |
| Nguyễn Thu Hà | Accountant; checks new vendors and receipts, pays out |

## Approval rules (seed)

| Rule | When | Chain |
|---|---|---|
| Default | Every request | Team lead → Payout |
| 01 Large requests | Amount above VND 20,000,000 | Team lead → Director → Payout |
| 02 New vendor check | Vendor added in the last 30 days | Team lead → Accountant → Payout |
| 03 Advances above 10 million | Advance above VND 10,000,000 | Team lead → Accountant → Payout |
| 04 Weekend submission hold | Inactive | Director |

## Product decision map

- **D-01 — Approval context:** the rule, the current approver and the next approver sit together in the
  request detail, above the request data.
- **D-02 — Role boundary:** request data stays visible; who can approve changes by role.
- **D-03 — Payout recovery:** when a payout fails, say what happened to the money and how to recover.
- **D-04 — Reconstructable activity:** creation, rules and every approval are traceable in context.

## Working prototype (no backend)

Every main workflow runs end to end in the browser. All companies, people and amounts are fictional and
nothing leaves the tab: no money moves and no email is sent.

- **Data:** seeded from `data/seed.js` into `sessionStorage` on first load (`core.js`). Changes survive
  navigation and reload within the tab; **Demo tools → Reset demo data** starts over.
- **Requests** (`index.html`): 3-step new request (type and payee, amount and purpose, review) with the
  chain evaluated live from the rules; advances and reimbursements go to the requester, vendor payments to a
  vendor. Drafts can be edited, submitted or deleted; pending requests can be cancelled by the requester, or
  approved or rejected (reason required) by the approver. Deep link: `index.html?id=REQ-2041`.
- **Settlements** (`expenses.html`): receipts that settle an advance or claim money spent out of pocket;
  add, edit, delete; the accountant approves or rejects with a reason.
- **Funds** (`accounts.html`): Vietcombank, Techcombank and petty cash; searchable, filterable transactions;
  move money now or scheduled, cancel a scheduled transfer; receiving details; CSV statement.
- **Vendors** (`payees.html`, opened from Requests): create, view, edit, delete.
- **Team:** invite, edit role, remove or revoke, resend invite; the last active Director is protected.
- **Reports:** 30d, 90d, YTD or custom range, department and type filters, client-side CSV export, schedule.
- **Approval rules** (`settings.html`): create, edit and delete rules with validation, history, CSV export.
- **States:** skeleton loading, empty and filtered-empty lists, not-found detail (`?id=UNKNOWN`), inline
  validation, a simulated load error (`?simulate=load-error`) and a save failure (`?demo=1`).

### Tests

```bash
py -3 -m http.server 8901 --bind 127.0.0.1
NODE_PATH=<folder containing playwright> node --test qa/full-flows.test.cjs
```

`qa/full-flows.test.cjs` (17 tests) covers every flow above, sign out and sign in, demo tools, reset,
console errors, `href="#"` on every page, no prototype wording on product pages, and use at 390 px.
`qa/synthetic-dogfood-integrity.spec.mjs` and `qa/evidence-lens.spec.mjs` run with `@playwright/test`.

## Evidence status

Verified DIRECT_USER sessions: **0**. Verified PROXY sessions: **0**.

Forced states, browser tests, AI critique and recruiter feedback are not user validation. Do not claim
faster approvals, fewer mistakes or better confidence until traceable sessions exist and the affected
decision has been retested.

## Not yet moved to the new content

The design lens and the five documentation pages were moved on 2026-11-25. One thing still describes the
earlier treasury version and must be updated before it is used:

- the Round 01 research package in `research/validation/flux-round-01/`, written for finance operations and
  treasury participants. The right participants are now office staff, team leads and accountants in small
  companies; the study has to be re-planned before recruiting. The design lens already says so
  (“R01 re-plan before recruiting”).

## Design lens and documentation

`design-lens.html` (reachable by URL only, never linked from the product) pins the four decisions on the live
request detail and forces five states: normal approval, permission denied, approval expired, vendor account
changed, and payout failed. Expiry and failed payout exist only there; the product itself stops at
Payout. The documentation pages (`design-system.html`, `component-states.html`, `sitemap.html`,
`user-flow.html`, `prototype.html`) describe the same company and data, and mark what is designed but not
built (submitting a rejected request again).
