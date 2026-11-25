# Flux redesign: inventory, product DNA and direction gate

Size **L**, track "Redesign of a product with code", level **Redesign** (the owner asked to design the Flux
interface with uiux-ai-workspace). Branch `redesign/ui`. Nothing here changes product code yet: this file,
the two direction mock-ups and their screenshots are the input for the direction choice.

## 1. Interface ownership

| File | Lines | Owns | Loaded by |
|---|---|---|---|
| `style-base.css` | 297 | Tokens (`--page`, `--accent`, status colours, fonts, radius), base elements, `.status` badge | `style.css` |
| `style.css` | 2 | Imports `style-base.css` and `motion.css` | every product page |
| `motion.css` | 62 | Transitions, reduced motion | `style.css` |
| `workspace.css` | 462 | Shell (sidebar, topbar), tables, panels, forms for all product pages | every product page, after `style.css` |
| `login.css` | 17 | Sign-in screen | `login.html` |
| `documentation.css` | 35 | Doc pages (design system, sitemap, flows) | doc pages only |
| `core.js` | 554 | Shell, role switch, storage, icons, alerts | every product page |
| `app.js` | 1,206 | Payments renderers (`renderMetrics`, `renderList`, `renderDetail`, `renderRail`, `renderActions`), payees, settings | product pages |
| `workspace.js` | 1,121 | Accounts, cards, team, expenses, reports renderers | five product pages |
| `data/seed.js` | 234 | Seed data copied to `sessionStorage` | every product page |

No generated files. `!important`: 6 across CSS (style-base 2, workspace 3, motion 1). Markup for the main
views is produced by renderers in `app.js` and `workspace.js`, so a redesign changes those renderers, not
only CSS.

## 2. Tests (baseline on `main`, 2026-11-23)

`qa/full-flows.test.cjs` served by `py -3 -m http.server 8901`: **17/17 pass**. They check behaviour by role,
label and data (payments chain, drafts, failures, payees, accounts, cards, team, expenses, reports,
policies, demo reset, 390 px usability). They must stay green after every step.
`qa/evidence-lens.spec.mjs` and `qa/synthetic-dogfood-integrity.spec.mjs` cover the design lens and
research files, not the product UI.

## 3. Product DNA

From `PROJECT-CONTEXT.md` ("Locked design system") and the current screens.

| Trait | Keep as DNA | Execution flaw to fix |
|---|---|---|
| Precise, institutional console, not consumer fintech | Keep | None |
| IBM Plex Sans, IBM Plex Mono for every number, ID and time | Keep | Key numbers (awaiting approval count) are the same size as labels |
| Warm grey page `#F0F1EE`, white surfaces, hairlines | Keep | None |
| Navy `#1F3A5F` used sparingly for one primary action | Keep | None |
| Radius 0–2 px, no shadows, rectangular status badges | Keep | None |
| Table-first, ledger rows | Keep | Mobile cuts table columns; first screen on mobile is four metric boxes |
| Approval Rail as the signature | Keep and promote | At 1440 × 900 the rail and the Approve / Reject actions sit below the fold under payment data |
| Explanatory subtitles under titles and metrics | Not DNA | Remove (TASTE "Chữ trên màn") |

## 4. Visual plan (CRAFT section 1)

```text
Ngành và vật gốc:      B2B finance operations; vật gốc: the approval chain on a payment instruction (SWIFT/ledger)
Một câu cảm giác:      "a treasury desk at 9 a.m.: calm, exact, nothing waits unseen"
Chữ:                   tiêu đề IBM Plex Sans 28/500; thân IBM Plex Sans 14/1.5; số IBM Plex Mono tabular; có tiếng Việt: không (English product)
Màu theo vai trò:      nền #F0F1EE, bề mặt #FFFFFF, chữ #14171A, thương hiệu #1F3A5F, nhấn #1F3A5F, trạng thái từ token hiện có
Hình khối:             bo 0–2 px; viền hairline, không bóng; nét 1 px, rail 2 px
Bố cục màn chính:      A: sidebar | tabs with counts | list + detail (amount, rail, decision, data)
                       B: sidebar | lanes by chain position (rows with mini rail, open in place) | chain summary
Lưới và mật độ:        390: one column; 1280: sidebar 220 + content; density "gọn" (operations)
Card nổi bật:          none; the selected/opened payment is the focal block (ID; amount; rail and next approver)
Một điểm táo bạo:      the Approval Rail, large in A, on every row in B
Ba điểm khác starter:  1. ledger rows, not cards 2. mono numerals everywhere 3. rail as structure
Đã đối chiếu mục 2:    no Inter/Roboto, no gradient or glow, no left colour bar on rows (selection uses the product's existing active edge), no subtitles
```

## 5. Direction gate

Template: uiux-ai-workspace `skills_UIUX/templates/ux/direction-approval.md`.

**Key screen:** Payments, signed in as Approver. **Main task:** decide on the payments waiting for me
without losing the control context. **Decision maker:** the owner (Đỗ Anh Nghĩa).

| | A: Ledger, decision first | B: Queue by control chain |
|---|---|---|
| File | `directions/a-ledger.html` | `directions/b-queue.html` |
| Screenshots | `shots/1440-a-ledger.png`, `shots/390-a-ledger-full.png` | `shots/1440-b-queue.png`, `shots/390-b-queue-full.png` |
| First thing seen | "Needs your approval 3, USD 32,395.60" tab, then the selected payment's amount and rail | "Waiting for your approval" lane with the first payment open |
| Density | Compact ledger, two panes | Compact rows, one column plus a summary column |
| Visual voice | Current Flux, cleaned up | Current Flux; the rail becomes the page structure |
| Serves the main task | Rail and Approve / Reject above the fold; metric strip folded into tabs | Payments grouped by where they wait; every row shows its chain; decide in place |
| Trade-off | Still one payment at a time in the panel | Less room per payment; scanning amounts across lanes is slower than one ledger |
| Risk | Close to today, so the change may read as polish | Bigger change to the payments renderer and to tests that read the detail panel |
| DNA | Keeps all; promotes the rail | Keeps all; promotes the rail further |

**Recommended:** A for the product (it fixes the real flaws with the least behaviour risk and keeps the
ledger reading that finance users expect), taking B's mini rail as the "Waiting on" cell in the ledger.

**Status:** `ĐÃ DUYỆT`. Owner chose A on 2026-11-23 ("chọn A, làm tiếp đi"). B's mini rail is taken into A as recommended.

## 6. Progress

| Screen | State | Evidence |
|---|---|---|
| Payments | Built in product code (direction A) | `shots/1440-payments-after.png`, `shots/390-payments-after-full.png`; flow tests 17/17; overlay-check 0 errors, 0 warnings |
| Shell, all pages | Done | Subtitles removed on 7 pages; mobile nav is a 4-column grid showing all 7 destinations; shell breakpoints live only in `style-base.css` (duplicate 820 px block deleted from `workspace.css`); metric strips sit 2 × 2 on phones. `shots/1440-all-screens-after.jpg`, `shots/390-all-screens-after.jpg` |
| Cards, Expenses | Done | Metric strip folded into counted status tabs; the work tab leads with its value (cards: spend this month; expenses: USD waiting for review) |
| Payees | Done | Metric strip removed (currency and country counts carried little); "6 saved, 4 currencies" sits in the list header |
| Accounts, Team, Reports, Settings | Done, strip kept | Their figures (liquidity, approvers, spend, rules) are not repeated anywhere else, so the strip stays; explanatory notes next to section titles removed |
| All tables | Done | Phones show a two-line ledger list per row (name and status left, money and one fact right); the forced 860 / 700 / 620 px table widths and sideways scrolling are deleted |
| Copy | Done | " · " joins replaced with commas or plain spacing (accounts note, card number mask, report label) |

Payments changes: subtitle and metric strip removed; status filter became counted tabs with the
approval tab first; "Waiting on" column with a mini rail; detail order is amount, Approval Rail,
decision, payment data, activity; phones get a ledger list with currency codes and a vertical rail.
At 1440 × 900 the rail starts at 444 px and Approve at 661 px (both below the fold before).
CSS after all screens: +61 / -40 lines (before the copy fixes), 0 new files, `!important` +0: the metric strip and subtitle rules are still used by other screens
and are deleted when those screens move.

## 7. Tests changed

| Test | Change | Why |
|---|---|---|
| `full-flows.test.cjs` reports label | `Policy exceptions · 30d` → `Policy exceptions, 30d` | Locks copy, not behaviour; " · " joins are banned by TASTE |
| `synthetic-dogfood-integrity.spec.mjs` accounts note | `· 5 currencies` → `, 5 currencies` | Same; intent (the corrected figure stays visible) kept |
| `synthetic-dogfood-integrity.spec.mjs` card mask | `•••• · •••• · ••••` → `••••  ••••  ••••` | Same; intent (number masked, no real-looking digits) kept, the negative check is unchanged |

Results on the final tree: `full-flows.test.cjs` 17/17; `synthetic-dogfood-integrity` and `evidence-lens` 6/6; rendered taste-check on 8 screens at 390 and 1440 px: 0 errors after the copy fixes; overlay-check 0 errors, 0 warnings.

## 8. Not verified

Independent review of the screenshots, real phones, screen readers, Safari and Firefox, and any user with a finance role.
