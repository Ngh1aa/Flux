# Flux Round 01 — Canonical Flux-Native Participant Form

**Status:** `CANONICAL / READY_TO_USE`  
**Use this one form only for Flux Round 01.** Do not reuse or adapt the old Nova questionnaire.

## Research boundary

- Target: **3–5 participants** with real finance operations / AP-payments / treasury / finance approval experience.
- Preferred evidence class: `DIRECT_USER`.
- Adjacent accounting / compliance / procurement-approval participants may be included only as `PROXY` and must stay separate in synthesis.
- Preferred method: moderated task-based session.
- Allowed fallback: async self-report using the same form.
- Canonical product URL: `https://flux-six-liard.vercel.app/`
- Researcher must record the exact build/commit actually served during each session.
- Use only simulated prototype data. Never enter real credentials, account numbers, company payment data or customer information.

> **Method rule:** MODERATED responses may include observed behavior, help and task outcome. ASYNC_SELF_REPORT responses are self-report only; do not convert them into observed task success, timing or moderator-help claims.

---

# FORM COPY — DÁN NGUYÊN VÀO GOOGLE FORMS

## Form title

**Flux — Business Payment Approval Workflow Test · Round 01**

## Form description

Flux là prototype mô phỏng quy trình thanh toán doanh nghiệp, approval chain, phân quyền và xử lý settlement failure. Bài test mất khoảng **20–30 phút**.

- Chỉ dùng dữ liệu giả lập trong prototype.
- Không nhập hoặc chia sẻ dữ liệu tài chính thật.
- Không có giao dịch ngân hàng thật nào được thực hiện.
- Phản hồi sẽ được lưu dưới ID ẩn danh để cải thiện prototype và case study.

Prototype: **https://flux-six-liard.vercel.app/**

---

# SECTION 0 — Research setup

> Phần này do researcher điền trước hoặc ngay khi bắt đầu session.

### 1. Participant ID
**Loại:** Short answer · Required  
Ví dụ: `FLX-P01`

### 2. Session method
**Loại:** Multiple choice · Required
- MODERATED
- ASYNC_SELF_REPORT

### 3. Prototype URL / build reference used in this session
**Loại:** Short answer · Required  
Không để trống. Ghi URL chính xác và commit/build nếu biết.

---

# SECTION 1 — Screening + consent

### 4. Trong 6 tháng gần đây, bạn thường xuyên chuẩn bị, review, approve hoặc theo dõi business payment ở mức nào?
**Loại:** Multiple choice · Required
- Hằng ngày
- Vài lần mỗi tuần
- Khoảng mỗi tuần
- Khoảng mỗi tháng
- Hiếm hơn mỗi tháng
- Chưa từng

### 5. Bạn đã trực tiếp làm những công việc nào dưới đây?
**Loại:** Checkboxes · Required
- Chuẩn bị supplier/vendor payment
- Review hoặc approve payment
- Theo dõi payment status / settlement
- Xử lý failed / returned payment
- Quản lý treasury / liquidity / bank balances
- Theo dõi hoặc cấu hình approval policy
- Reconcile / audit payment history
- Khác
- Chưa từng làm các công việc trên

### 6. Vai trò gần nhất với công việc của bạn là gì?
**Loại:** Multiple choice · Required
- Finance Operations
- Accounts Payable / Payments
- Treasury
- Finance Manager / Controller
- CFO / Finance Approver
- Accountant / Bookkeeper
- Banking / Payment Operations
- Compliance / Procurement / Operations liên quan approval
- Khác

### 7. Bạn thường dùng công cụ nào cho công việc này?
**Loại:** Short answer · Required  
Ví dụ: business banking, ERP, AP tool, treasury platform, spreadsheet…

### 8. Bạn có trực tiếp tham gia xây Flux hoặc portfolio prototype này không?
**Loại:** Multiple choice · Required
- Có
- Không

### 9. Bạn hiểu Flux trong bài này chỉ là prototype mô phỏng, không phải dịch vụ ngân hàng/payment thật?
**Loại:** Multiple choice · Required
- Có
- Không

### 10. Bạn đồng ý tham gia và cho phép dùng ghi chú ẩn danh về hành động/phản hồi của mình để cải thiện prototype và case study?
**Loại:** Multiple choice · Required
- Có
- Không

### 11. Bạn xác nhận sẽ không nhập hoặc chia sẻ dữ liệu tài chính thật trong bài test?
**Loại:** Multiple choice · Required
- Có
- Không

**Eligibility rule:** Nếu câu 8 = Có, hoặc câu 10/11 = Không → không ingest như participant hợp lệ. Nếu không có kinh nghiệm business-payment gần với câu 5–7 → `PROXY` hoặc exclude, không tự nâng thành `DIRECT_USER`.

---

# SECTION 2 — D-01 Approval context

## Task prompt

Mở **Payments**. Hãy tìm khoản thanh toán **Acme · USD 18,400**.

> “Bạn đang review khoản thanh toán này. Chưa thay đổi gì cả, hãy cho biết **vì sao nó cần approval, ai cần hành động ở bước hiện tại, và sau khi người đó approve thì chuyện gì xảy ra tiếp theo**.”

### 12. Theo bạn, vì sao khoản USD 18,400 này cần approval?
**Loại:** Paragraph · Required

### 13. Ai là người/role cần hành động ở bước hiện tại?
**Loại:** Short answer · Required

### 14. Sau khi người đó approve, bước tiếp theo là gì?
**Loại:** Paragraph · Required

### 15. Bạn đã dựa vào thông tin nào để trả lời?
**Loại:** Checkboxes · Required
- Approval / control rail
- Amount
- Policy / threshold text
- Current approver / next approver
- Activity / history
- Status badge
- Khác

### 16. Bạn có cần hướng dẫn thêm ngoài task prompt để hiểu approval ownership không?
**Loại:** Multiple choice · Required
- Không
- Có một chút
- Có nhiều
- Không áp dụng — tôi đang tự làm async

### 17. Mức tự tin với câu trả lời của bạn
**Loại:** Linear scale 1–5 · Required  
1 = rất không chắc · 5 = rất chắc

**D-01 internal learning criterion:** weakened nếu participant không giải thích được policy rationale + current owner + next step mà không được dạy.

---

# SECTION 3 — D-02 Role boundary

## Task prompt

Giữ prototype ở **Employee role**.

> “Bạn cần approve khoản payment này nhưng giao diện hiện đang ở Employee role. Hãy cho biết bạn sẽ làm gì và giải thích vì sao nút approve hiện không dùng được.”

### 18. Việc đầu tiên bạn sẽ làm là gì?
**Loại:** Paragraph · Required

### 19. Theo bạn, nút approve bị disabled có nghĩa là gì?
**Loại:** Multiple choice · Required
- Employee role không có quyền approve
- Payment đang lỗi
- Chức năng approve chưa được build
- Payment đã được approve rồi
- Không chắc
- Khác

### 20. Theo bạn Employee vẫn được phép làm gì với payment này?
**Loại:** Paragraph · Required

### 21. Nếu cần approve, bạn kỳ vọng cách chuyển sang đúng quyền/role như thế nào?
**Loại:** Paragraph · Required

### 22. Bạn có cần hướng dẫn thêm ngoài task prompt để hiểu permission boundary không?
**Loại:** Multiple choice · Required
- Không
- Có một chút
- Có nhiều
- Không áp dụng — tôi đang tự làm async

### 23. Mức tự tin với cách hiểu role/permission của bạn
**Loại:** Linear scale 1–5 · Required

**D-02 internal learning criterion:** weakened nếu disabled action bị hiểu là product lỗi/chưa build thay vì permission-bound, hoặc participant không tìm được recovery path hợp lý.

---

# SECTION 4 — D-03 Settlement recovery · PRIORITY

## Setup

Researcher mở Evidence Lens và chọn state **SETTLEMENT FAILED**, sau đó giao lại quyền điều khiển cho participant. Với async session, gửi participant đường dẫn/state setup đã chuẩn bị sẵn.

## Task prompt

> “Payment đã đi qua approval nhưng settlement thất bại. Hãy cho biết **tiền đã đi chưa** và **bạn sẽ làm gì tiếp theo**.”

### 24. Theo bạn, ở trạng thái này tiền đã rời tài khoản chưa?
**Loại:** Multiple choice · Required
- Chưa
- Rồi
- Không chắc

### 25. Bạn dựa vào thông tin nào để kết luận như vậy?
**Loại:** Paragraph · Required

### 26. Hành động tiếp theo an toàn nhất theo bạn là gì?
**Loại:** Multiple choice · Required
- Kiểm tra failure reason / trạng thái rồi dùng recovery hoặc retry flow của payment hiện tại
- Tạo một payment mới giống hệt ngay lập tức
- Bỏ qua và chờ hệ thống tự xử lý, không kiểm tra gì thêm
- Không chắc
- Khác

### 27. Điều gì cần hiển thị thêm để bạn dám xử lý một failed settlement trong hệ thống thật?
**Loại:** Paragraph · Required

### 28. Bạn có cần hướng dẫn thêm ngoài task prompt để hiểu money movement / recovery không?
**Loại:** Multiple choice · Required
- Không
- Có một chút
- Có nhiều
- Không áp dụng — tôi đang tự làm async

### 29. Mức tự tin với cách xử lý của bạn
**Loại:** Linear scale 1–5 · Required

**D-03 internal learning criterion:** weakened nếu participant nghĩ tiền có thể đã đi, muốn tạo payment trùng, hoặc không tìm được safe recovery path.

---

# SECTION 5 — D-04 Audit reconstruction

## Task prompt

Quay lại payment detail / activity trail.

> “Một đồng nghiệp hỏi payment này đã xảy ra chuyện gì và ai đã hành động ở từng bước. Hãy dùng giao diện để kể lại control chain cho họ.”

### 30. Hãy mô tả lại thứ tự các actor/role và hành động bạn hiểu từ giao diện.
**Loại:** Paragraph · Required

### 31. Bạn đã dùng những bề mặt nào để reconstruct lịch sử?
**Loại:** Checkboxes · Required
- Approval / control rail
- Activity / history
- Status
- Current / next approver
- Payment detail
- Khác

### 32. Có bước nào bạn không chắc ai đã làm hoặc chuyện gì đã xảy ra không?
**Loại:** Paragraph · Required

### 33. Nếu đây là audit thật, thông tin nào còn thiếu?
**Loại:** Paragraph · Required

### 34. Bạn có cần hướng dẫn thêm ngoài task prompt để reconstruct control chain không?
**Loại:** Multiple choice · Required
- Không
- Có một chút
- Có nhiều
- Không áp dụng — tôi đang tự làm async

### 35. Mức tự tin với reconstruction của bạn
**Loại:** Linear scale 1–5 · Required

**D-04 internal learning criterion:** weakened nếu participant không thể reconstruct actor/action sequence từ visible trail hoặc phải đoán các bước quan trọng.

---

# SECTION 6 — Overall debrief

### 36. Phần nào của Flux rõ nhất đối với bạn?
**Loại:** Paragraph · Required

### 37. Phần nào khiến bạn thấy rủi ro hoặc dễ hiểu sai nhất?
**Loại:** Paragraph · Required

### 38. Trước khi approve một payment thật, bạn bắt buộc muốn nhìn thấy những thông tin nào?
**Loại:** Paragraph · Required

### 39. Có lúc nào bạn tưởng một hành động trong prototype sẽ thực hiện giao dịch ngân hàng thật không?
**Loại:** Multiple choice · Required
- Không
- Có
- Không chắc

### 40. Nếu chỉ được sửa **một** thứ trong Flux trước vòng test tiếp theo, bạn muốn sửa gì?
**Loại:** Paragraph · Required

### 41. Tổng thể, mức độ rõ ràng của approval workflow trong Flux
**Loại:** Linear scale 1–5 · Required

---

# INTERNAL RESEARCHER RUBRIC — KHÔNG ĐƯA VÀO PHẦN PARTICIPANT NHÌN THẤY

## Classification

- `DIRECT_USER`: có trách nhiệm thực tế gần đây với payment preparation/review/approval/monitoring/recovery trong business banking / ERP / AP / treasury workflow.
- `PROXY`: kinh nghiệm adjacent hữu ích nhưng không trực tiếp khớp payment context.
- `EXCLUDE`: không có kinh nghiệm liên quan, builder của Flux, hoặc consent không hợp lệ.

## Atomic evidence capture

Mỗi evidence record phải có:
- participant ID;
- method (`MODERATED` / `ASYNC_SELF_REPORT`);
- evidence class (`DIRECT_USER` / `PROXY`);
- decision ID (`D-01`…`D-04`);
- exact response/observation;
- whether moderator help occurred;
- exact prototype/build reference;
- confidence when available;
- contradiction preserved if present.

## What may be scored

**MODERATED**
- observed task behavior;
- help required;
- task outcome;
- duplicate-payment attempt;
- visible recovery path actually chosen.

**ASYNC_SELF_REPORT**
- reported interpretation;
- stated intended action;
- confidence;
- perceived clarity.

Do **not** infer observed task success, time-on-task or moderator help from async responses.

## Synthesis gate

- Begin synthesis after **3 verified DIRECT_USER** records.
- Prefer **5** if evidence is mixed.
- Keep PROXY evidence separate.
- Do not claim improvement before an evidence-driven change is frozen and the affected task is retested.

## Round 01 truth boundary at form creation

- Verified DIRECT_USER sessions: **0**
- Verified PROXY sessions: **0**
- Human evidence ledger: intentionally empty
- D-01…D-04: `PLANNED_VALIDATION`
