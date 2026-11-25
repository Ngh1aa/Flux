# Flux content model: advances and reimbursements in a small company

Owner's choice (2026-11-23): move Flux from cross-border treasury for a holding group to a familiar
setting, **advances, reimbursements and vendor payments inside a Vietnamese SME**. UI stays in English.
The core mechanic, money moving through an approval chain shown by the Approval Rail, stays.

Status: `ĐÃ DUYỆT` by the owner on 2026-11-23 ("Đúng, làm theo").

## Company and people (fictional)

**Minh An Trading Co., Ltd.**, Ho Chi Minh City, about 40 staff. One currency: **VND**.

| Person | Role in Flux | Department |
|---|---|---|
| Nguyễn Thu Hà | Accountant (checks receipts, pays out) | Finance |
| Trần Quốc Bảo | Director (approves large amounts) | Management |
| Lê Minh Khoa | Team lead | Sales |
| Phạm Thanh Tâm | Team lead | Operations |
| Võ Ngọc Lan | Employee (signed-in user) | Sales |
| Đặng Hoàng Huy | Employee | Operations |

The signed-in user switches between **Employee** (Lan) and **Approver** (Khoa, Sales team lead), as today.

## Request types

| Type | Plain meaning | Example |
|---|---|---|
| Advance | Money before spending, settled later with receipts | 8,000,000 VND for the Đà Nẵng trade fair trip |
| Reimbursement | Pay back money an employee already spent | 1,250,000 VND taxi and client lunch |
| Vendor payment | Company pays a supplier directly | 45,000,000 VND brochures from a print shop |

An **advance** stays open until it is **settled**: the employee submits receipts, then returns the
unspent amount or is paid the difference.

## Approval rules (replace currency rules)

| Rule | When | Chain |
|---|---|---|
| Default | Every request | Team lead → Payout |
| Rule 01 | Amount above 20,000,000 VND | Team lead → Director → Payout |
| Rule 02 | Vendor payment to a vendor added in the last 30 days | Team lead → Accountant check → Payout |
| Rule 03 | Employee has an advance overdue (open more than 30 days) | New advance blocked until it is settled |

The last rail step becomes **Payout** (cash or bank transfer by the accountant) instead of SWIFT execution.

## Screens

| Today | Becomes | Main job |
|---|---|---|
| Payments | **Requests** | Create and approve advances, reimbursements, vendor payments |
| Expenses | **Settlements** | Settle open advances with receipts; see overdue ones |
| Accounts | **Funds** | Company bank account and petty cash; upcoming payouts |
| Payees | **Vendors** | Suppliers the company pays directly |
| Team | Team | Roles and approval limits |
| Reports | Reports | Spend by department and month, open and overdue advances |
| Settings | Approval rules | The rules above, editable |
| Cards | **Removed** | Company cards are rare in Vietnamese SMEs and add a second story |

## What disappears

Multi-currency balances, FX rates and FX cost, SWIFT, IBAN, country of beneficiary, currency
exposure report, company cards. One currency removes most of the currency code in `app.js`,
`workspace.js` and `core.js`.

## Tests

`full-flows.test.cjs` keeps every behaviour (create, draft, submit, approve through the chain, reject
with a reason, cancel, failure and retry, not found, filters, export, team guards, rule editing, demo
reset, 390 px). Its data (IDs, names, amounts, currencies) is rewritten for the new seed, and the Cards
test is replaced by an advance settlement test.

## Order of work

1. Seed data and formatting (VND, no decimals).
2. Requests (the decision screen) and the new request form.
3. Settlements, Funds, Vendors.
4. Team, Reports, Approval rules; remove Cards.
5. Tests, README, PROJECT-CONTEXT, case study captures.

## Progress

| Step | State | Evidence |
|---|---|---|
| 1. Seed and formatting | Done | 7 requests, 5 vendors, 4 VND rules; VND has no decimals; workspace and signed-in user renamed |
| 2. Requests and request form | Done | Request type first; vendor picker only for vendor payments; VND only; rail ends at Payout by the accountant; flow tests rewritten for the new data (18/18, one new advance test), Playwright specs 6/6 |
| 3. Settlements, Funds, Vendors | Done | Receipts settle advances; three VND funds; local vendors with city and bank |
| 4. Team, Reports, Approval rules, remove Cards | Done | New roles and Director guard; reports by department in VND; rule builder with request_type; Cards removed; sign-in lan.vo@minhan.vn |
| 5. README, PROJECT-CONTEXT, case study | Done in Flux; case study in the portfolio repo | Case study rewritten with new captures and the pivot recorded |
| 6. Design lens and doc pages | Done | Lens decisions, tour and forced states use the new content. `qa/evidence-lens.spec.mjs` changed: the states "Insufficient liquidity" and "Settlement failed" became "Vendor account changed" and "Payout failed", because Vietcombank holds VND 1.28 billion in the seed and a liquidity block would contradict the data; the assertions keep the same strength (warning note text, "NO MONEY MOVED", "duplicate"). Doc pages rewritten; text raised to 12px and the 980px overflow fixed in `documentation.css`; taste-check 789 → 4 errors (the 4 are the fidelity notes on `prototype.html`, which is the handoff page). Round 01 research package still to re-plan |
