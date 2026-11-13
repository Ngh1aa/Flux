/* Flux payments, saved payees and approval policies.
   Reads and writes the session store in core.js. */
(() => {
  'use strict';

  const F = window.Flux;
  const { store, fmt, escapeHtml: esc, setText } = F;
  const CHECK_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"></path></svg>';
  const ARROW_LEFT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"></path></svg>';
  const ARROW_RIGHT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"></path></svg>';
  const CURRENT_USER = 'Jamie Stone';

  F.onReady(() => {
    const page = document.body.dataset.page;
    if (page === 'payments') initPayments();
    if (page === 'payees') initPayees();
    if (page === 'settings') initPolicies();
  });

  /* =====================================================================
     Policy evaluation (shared by payments and the policy builder)
     ===================================================================== */
  const FIELD_LABELS = { amount: 'amount', currency: 'currency', beneficiary_age_days: 'beneficiary_age_days', created_outside_hours: 'created_outside_hours' };

  function thresholdOf(value) { return Number(String(value).replace(/[^\d.]/g, '')); }

  function compare(left, op, right) {
    if (op === '>') return left > right;
    if (op === '<') return left < right;
    if (op === '=') return left === right;
    if (op === '!=') return left !== right;
    return false;
  }

  function conditionMatches(condition, context) {
    const { field, op, value } = condition;
    if (field === 'amount') return compare(context.usd, op, thresholdOf(value));
    if (field === 'currency') {
      const target = /base/i.test(value) ? store.state.meta.baseCurrency : String(value).trim().toUpperCase();
      return compare(context.currency, op, target);
    }
    if (field === 'beneficiary_age_days') return compare(context.ageDays, op, Number(value));
    if (field === 'created_outside_hours') return compare(String(context.outsideHours), op, String(value).trim().toLowerCase());
    return false;
  }

  function scopeMatches(scope, international) {
    if (scope === 'All payments') return true;
    if (scope === 'International wires') return international;
    if (scope === 'Domestic ACH') return !international;
    return false;
  }

  function evaluatePolicy({ amount, currency, payee }) {
    const clock = F.now();
    const created = payee && payee.createdAt ? F.parseDate(payee.createdAt) : clock;
    const context = {
      usd: F.toUsd(amount, currency),
      currency,
      ageDays: Math.max(0, Math.floor((clock - created) / 86400000)),
      outsideHours: clock.getDay() === 0 || clock.getDay() === 6 || clock.getHours() < 8 || clock.getHours() >= 18
    };
    const international = !payee || payee.country !== 'United States';
    const rules = store.list('policies');
    for (let index = 0; index < rules.length; index += 1) {
      const rule = rules[index];
      if (rule.status !== 'Active' || !scopeMatches(rule.scope, international)) continue;
      if (rule.conditions.length && rule.conditions.every((c) => conditionMatches(c, context))) {
        return { rule, number: index + 1, chain: rule.approvers.slice(), label: `Rule ${fmt.pad2(index + 1)}: ${rule.name}` };
      }
    }
    return { rule: null, number: 0, chain: ['Finance manager'], label: 'Workspace default: one approval' };
  }

  const approverName = (role) => store.state.approverDirectory[role] || 'Unassigned';

  /* =====================================================================
     Payments
     ===================================================================== */
  const STATUS = {
    draft: ['Draft', 'status status-neutral'],
    pending: ['Pending', 'status status-pending'],
    processing: ['Processing', 'status status-neutral'],
    completed: ['Completed', 'status status-success'],
    rejected: ['Rejected', 'status status-danger'],
    cancelled: ['Cancelled', 'status status-neutral']
  };

  function stageText(payment) {
    if (payment.status === 'draft') return 'Not submitted';
    if (payment.status === 'pending') return payment.chain[payment.stage] || 'Execution';
    if (payment.status === 'processing') return 'Settlement';
    if (payment.status === 'completed') return 'Executed';
    return payment.status === 'rejected' ? 'Rejected' : 'Cancelled';
  }

  function initPayments() {
    const tbody = document.getElementById('payments-body');
    const region = document.getElementById('payments-region');
    const emptyHost = document.getElementById('payment-empty-state');
    const pane = document.getElementById('payment-detail');
    const search = document.getElementById('payment-search');
    const currencyFilter = document.getElementById('payment-currency-filter');
    const filterButtons = [...document.querySelectorAll('[data-filter]')];
    let selectedId = F.getParam('id');
    let loaded = false;

    function visiblePayments() {
      const filter = document.querySelector('[data-filter].active')?.dataset.filter || 'all';
      const query = (search?.value || '').trim().toLowerCase();
      const currency = currencyFilter?.value || 'all';
      return store.list('payments').filter((p) => {
        const statusOk = filter === 'all' || (filter === 'closed' ? ['rejected', 'cancelled'].includes(p.status) : p.status === filter);
        const currencyOk = currency === 'all' || p.currency === currency;
        const haystack = `${p.id} ${p.counterparty} ${p.currency} ${p.purpose} ${p.reference}`.toLowerCase();
        return statusOk && currencyOk && (!query || haystack.includes(query));
      });
    }

    function renderMetrics() {
      const all = store.list('payments');
      const sumUsd = (items) => items.reduce((sum, p) => sum + F.toUsd(p.amount, p.currency), 0);
      const pending = all.filter((p) => p.status === 'pending');
      const completed = all.filter((p) => p.status === 'completed');
      setText('metric-pending', fmt.pad2(pending.length));
      setText('metric-pending-note', `USD ${fmt.number(sumUsd(pending))} equivalent`);
      setText('metric-processing', fmt.pad2(all.filter((p) => p.status === 'processing').length));
      setText('metric-drafts', fmt.pad2(all.filter((p) => p.status === 'draft').length));
      setText('metric-completed', fmt.pad2(completed.length));
      setText('metric-completed-note', `USD ${fmt.number(sumUsd(completed))} equivalent`);
    }

    function rowHtml(p) {
      const [label, cls] = STATUS[p.status] || STATUS.pending;
      return `<tr class="payment-row" tabindex="0" data-id="${esc(p.id)}" data-status="${esc(p.status)}" data-reference="${esc(p.id)}" data-counterparty="${esc(p.counterparty)}" data-currency="${esc(p.currency)}">
        <td><span class="${cls}">${label}</span></td>
        <td class="counterparty"><strong>${esc(p.counterparty)}</strong><span>${esc(p.purpose || 'No purpose yet')}</span></td>
        <td><span class="currency-tag">${esc(p.currency)}</span></td>
        <td class="amount-col amount">${p.amount ? fmt.number(p.amount, p.currency) : '—'}</td>
        <td><time datetime="${esc(p.createdAt)}">${fmt.day(p.createdAt)}, ${fmt.time(p.createdAt)}</time></td>
        <td class="stage-column"><span class="stage-text">${esc(stageText(p))}</span></td>
      </tr>`;
    }

    function renderList() {
      renderMetrics();
      const all = store.list('payments');
      const rows = visiblePayments();
      tbody.innerHTML = rows.map(rowHtml).join('');
      if (!all.length) {
        emptyHost.innerHTML = F.stateBlock({ title: 'No payments yet', body: 'Create a payment to start an approval chain. Drafts stay private until you submit them.', action: 'New payment', actionId: 'empty-new-payment' });
        emptyHost.querySelector('[data-state-action]')?.addEventListener('click', () => openPaymentDialog('new'));
      } else if (!rows.length) {
        emptyHost.innerHTML = F.stateBlock({ icon: 'search', title: 'No matching payments', body: 'Adjust the status filter, currency or search query.', action: 'Clear filters' });
        emptyHost.querySelector('[data-state-action]')?.addEventListener('click', clearFilters);
      } else {
        emptyHost.innerHTML = '';
      }
      if (!selectedId && rows.length) selectedId = rows[0].id;
      if (!selectedId && !rows.length && all.length) selectedId = all[0].id;
      F.markSelected(tbody, selectedId);
      renderDetail();
    }

    function clearFilters() {
      filterButtons.forEach((b) => b.classList.toggle('active', b.dataset.filter === 'all'));
      if (search) search.value = '';
      if (currencyFilter) currencyFilter.value = 'all';
      renderList();
    }

    function select(id, user) {
      selectedId = id;
      F.setParam('id', id);
      F.markSelected(tbody, id);
      renderDetail();
      F.revealPane(pane, user);
    }

    function renderDetail() {
      const body = document.getElementById('payment-detail-body');
      const missing = document.getElementById('payment-not-found');
      clearActionError();
      const payment = selectedId ? store.find('payments', selectedId) : null;
      if (!payment) {
        body.hidden = true;
        missing.hidden = false;
        const empty = !store.list('payments').length;
        missing.innerHTML = empty
          ? F.stateBlock({ title: 'Nothing selected', body: 'Payment details, the approval rail and the activity trail appear here.' })
          : F.stateBlock({ icon: 'missing', title: `Payment ${selectedId} not found`, body: 'It may have been deleted, or the link is out of date.', action: 'Show latest payment' });
        missing.querySelector('[data-state-action]')?.addEventListener('click', () => { const first = store.list('payments')[0]; if (first) select(first.id); });
        return;
      }
      body.hidden = false;
      missing.hidden = true;
      const [label, cls] = STATUS[payment.status] || STATUS.pending;
      setText('detail-reference', payment.id);
      const status = document.getElementById('detail-status');
      status.textContent = label;
      status.className = cls;
      setText('detail-amount', payment.amount ? fmt.money(payment.amount, payment.currency) : `${payment.currency} amount not set`);
      setText('detail-counterparty', payment.counterparty);
      setText('detail-currency', payment.currency);
      setText('detail-country', payment.country);
      setText('detail-initiated', fmt.dateTime(payment.createdAt));
      setText('detail-execution', payment.executionDate ? fmt.date(payment.executionDate) : 'Not set');
      setText('detail-purpose', payment.purpose || 'Not set');
      setText('detail-payment-reference', payment.reference || 'None');
      setText('detail-policy', payment.status === 'draft' ? 'Evaluated when you submit. Rules run in order.' : payment.policy);
      renderRail(payment);
      renderActivity(payment);
      renderActions(payment);
    }

    function renderRail(p) {
      const rail = document.getElementById('approval-rail');
      const finalLabel = p.status === 'completed' ? 'Executed' : p.status === 'processing' ? 'Settlement' : 'Execution';
      const steps = [{ label: 'Draft', note: `${CURRENT_USER}, ${fmt.time(p.createdAt)}` }]
        .concat(p.chain.map((role, i) => ({ label: role, note: p.approvals[i] ? `${p.approvals[i].by}, ${fmt.time(p.approvals[i].at)}` : approverName(role) })))
        .concat([{ label: finalLabel, note: 'System' }]);
      const lastChain = p.chain.length; // index of the execution step minus one
      steps.forEach((step, index) => {
        let state = 'future';
        let badge = '';
        if (p.status === 'draft') {
          if (index === 0) { state = 'current'; badge = '<span class="status status-neutral rail-status">Draft</span>'; }
        } else if (p.status === 'completed') {
          state = 'completed';
        } else if (p.status === 'processing') {
          if (index <= lastChain) state = 'completed';
          else { state = 'current'; badge = '<span class="status status-neutral rail-status">In progress</span>'; }
        } else {
          const at = p.stage + 1;
          if (index < at) state = 'completed';
          else if (index === at) {
            state = 'current';
            if (p.status === 'pending') badge = '<span class="status status-pending rail-status">Pending</span>';
            if (p.status === 'rejected') badge = '<span class="status status-danger rail-status">Rejected</span>';
            if (p.status === 'cancelled') badge = '<span class="status status-neutral rail-status">Cancelled</span>';
          }
        }
        step.state = state;
        step.badge = badge;
      });
      rail.style.setProperty('--rail-steps', String(steps.length));
      rail.setAttribute('aria-label', `Approval chain: ${steps.map((s) => s.label).join(', ')}`);
      rail.innerHTML = steps.map((s, i) => `<div class="rail-step ${s.state}" data-rail="${i + 1}"><div class="rail-node">${s.state === 'completed' ? CHECK_ICON : ''}</div><div class="rail-copy"><span class="rail-label">${esc(s.label)}</span><span class="rail-note">${esc(s.note)}</span>${s.badge}</div></div>`).join('');

      const next = document.getElementById('next-approver');
      const approval = document.getElementById('approval-status');
      const outcome = document.getElementById('detail-outcome');
      const map = {
        draft: ['None, not submitted yet', 'Draft', 'status status-neutral'],
        pending: [`${approverName(p.chain[p.stage])}, ${p.chain[p.stage]}`, 'Pending', 'status status-pending'],
        processing: ['Settlement network, awaiting confirmation', 'Released', 'status status-neutral'],
        completed: ['None, payment executed', 'Completed', 'status status-success'],
        rejected: ['None, payment rejected', 'Rejected', 'status status-danger'],
        cancelled: ['None, payment cancelled', 'Cancelled', 'status status-neutral']
      }[p.status];
      next.textContent = map[0];
      approval.textContent = map[1];
      approval.className = map[2];
      if (p.status === 'rejected' || p.status === 'cancelled') {
        const who = p.status === 'rejected' ? p.rejectedBy : CURRENT_USER;
        const reason = p.status === 'rejected' ? p.rejectReason : p.cancelReason;
        outcome.innerHTML = `<span><strong>${p.status === 'rejected' ? 'Rejected' : 'Cancelled'} by ${esc(who || 'Unknown')}.</strong> ${reason ? `Reason: ${esc(reason)}` : 'No reason given.'} Nothing was debited.</span>`;
        outcome.hidden = false;
      } else {
        outcome.hidden = true;
        outcome.innerHTML = '';
      }
    }

    function renderActivity(p) {
      const list = document.getElementById('activity-list');
      list.innerHTML = p.activity.map((a) => `<li class="activity-item"><time datetime="${esc(a.at)}"><span class="activity-day">${fmt.day(a.at)}</span>${fmt.timeSec(a.at)}</time><div><strong>${esc(a.title)}</strong><span>${esc(a.meta)}</span></div></li>`).join('');
    }

    const show = (id, visible) => { const el = document.getElementById(id); if (el) el.hidden = !visible; };

    function renderActions(p) {
      const role = F.role;
      const approve = document.getElementById('approve-action');
      const reject = document.getElementById('reject-action');
      const isDraft = p.status === 'draft';
      const canAct = role === 'approver' && p.status === 'pending';
      show('delete-draft', isDraft);
      show('edit-draft', isDraft);
      show('submit-draft', isDraft);
      show('cancel-payment', p.status === 'pending' && role === 'employee');
      approve.hidden = isDraft;
      reject.hidden = isDraft;
      approve.disabled = !canAct;
      reject.disabled = !canAct;
      const blocked = role === 'approver' ? 'Only pending payments can be approved.' : 'Switch to Approver to take an approval action.';
      approve.title = canAct ? '' : blocked;
      reject.title = approve.title;
      let hint = '';
      if (isDraft) hint = 'Drafts stay private to you until you submit them for approval.';
      else if (p.status === 'pending') hint = role === 'approver'
        ? `Acting as ${approverName(p.chain[p.stage])}, ${p.chain[p.stage]}. Rejecting needs a reason.`
        : 'Switch to Approver to approve or reject. As the initiator you can cancel while approval is pending.';
      else if (p.status === 'processing') hint = 'Released for settlement. Nothing left to approve.';
      else hint = 'This payment is closed. Its history stays in the activity trail.';
      setText('action-hint', hint);
    }

    function clearActionError() { pane.querySelector('.action-error')?.remove(); }
    function showActionError(message, retry) {
      clearActionError();
      const host = pane.querySelector('.action-row')?.parentElement;
      if (!host) return;
      const alert = document.createElement('div');
      alert.className = 'form-alert action-error';
      alert.setAttribute('role', 'alert');
      alert.innerHTML = `${F.ICONS.error}<div><strong>Not saved</strong><span>${esc(message)}</span></div><button class="btn" type="button">Try again</button>`;
      alert.querySelector('button').addEventListener('click', retry);
      host.prepend(alert);
    }

    async function runAction(button, busyLabel, mutate, success) {
      clearActionError();
      const original = button.innerHTML;
      button.disabled = true;
      button.setAttribute('aria-busy', 'true');
      button.textContent = busyLabel;
      try {
        const message = await store.commit(mutate);
        renderList();
        F.toast(success(message));
      } catch (error) {
        button.innerHTML = original;
        button.removeAttribute('aria-busy');
        renderDetail();
        showActionError(error.message, () => runAction(document.getElementById(button.id), busyLabel, mutate, success));
        return;
      }
      button.removeAttribute('aria-busy');
    }

    function approve() {
      const id = selectedId;
      runAction(document.getElementById('approve-action'), 'Approving…', (s) => {
        const p = s.payments.find((x) => x.id === id);
        if (!p || p.status !== 'pending') throw new F.FluxError('This payment is no longer pending.');
        const role = p.chain[p.stage];
        const by = approverName(role);
        const at = F.isoLocal();
        p.approvals.push({ role, by, at });
        p.activity.push({ at, title: `Approved by ${role}`, meta: by });
        p.stage += 1;
        if (p.stage >= p.chain.length) {
          p.status = 'processing';
          p.activity.push({ at: F.isoLocal(), title: 'Released for settlement', meta: 'Flux policy engine' });
          return `${p.id} fully approved and released for settlement.`;
        }
        return `${role} approval recorded. Next: ${p.chain[p.stage]}.`;
      }, (m) => m);
    }

    function reject() {
      const p = store.find('payments', selectedId);
      if (!p) return;
      F.confirmAction({
        kicker: 'Approval decision',
        title: `Reject ${p.id}?`,
        body: `The initiator sees your reason. ${p.counterparty} is not paid and a new payment is needed to retry.`,
        confirmLabel: 'Reject payment',
        busyLabel: 'Rejecting…',
        reason: { label: 'Reason for rejection', required: true, placeholder: 'For example: invoice amount does not match the PO', requiredMessage: 'Add a reason so the initiator knows what to fix.' },
        action: (reason) => store.commit((s) => {
          const target = s.payments.find((x) => x.id === p.id);
          const role = target.chain[target.stage];
          target.status = 'rejected';
          target.rejectReason = reason;
          target.rejectedBy = approverName(role);
          target.activity.push({ at: F.isoLocal(), title: `Rejected by ${role}`, meta: `${approverName(role)}: ${reason}` });
        }).then(() => { renderList(); F.toast(`${p.id} rejected. The initiator can see your reason.`); })
      });
    }

    function cancelPayment() {
      const p = store.find('payments', selectedId);
      if (!p) return;
      F.confirmAction({
        kicker: 'Pending payment',
        title: `Cancel ${p.id}?`,
        body: 'Approvers will no longer see it in their queue and the reserved amount returns to the available balance. This cannot be undone.',
        confirmLabel: 'Cancel payment',
        busyLabel: 'Cancelling…',
        reason: { label: 'Reason (optional)', required: false, placeholder: 'For example: supplier sent a corrected invoice' },
        action: (reason) => store.commit((s) => {
          const target = s.payments.find((x) => x.id === p.id);
          if (target.status !== 'pending') throw new F.FluxError('Only pending payments can be cancelled.');
          target.status = 'cancelled';
          target.cancelReason = reason;
          target.activity.push({ at: F.isoLocal(), title: 'Payment cancelled', meta: `${CURRENT_USER}, Employee${reason ? `: ${reason}` : ''}` });
        }).then(() => { renderList(); F.toast(`${p.id} cancelled. Reserved funds were released.`); })
      });
    }

    function deleteDraft() {
      const p = store.find('payments', selectedId);
      if (!p) return;
      F.confirmAction({
        kicker: 'Draft payment',
        title: `Delete draft ${p.id}?`,
        body: `The draft to ${p.counterparty} is removed from this workspace. This cannot be undone.`,
        confirmLabel: 'Delete draft',
        busyLabel: 'Deleting…',
        action: () => store.commit((s) => { s.payments = s.payments.filter((x) => x.id !== p.id); }).then(() => {
          selectedId = null;
          F.setParam('id', null);
          renderList();
          F.toast(`Draft ${p.id} deleted.`);
        })
      });
    }

    function submitDraft() {
      const p = store.find('payments', selectedId);
      if (!p) return;
      const payee = store.find('payees', p.payeeId);
      const problems = [];
      if (!p.amount) problems.push('amount');
      if (!p.executionDate || p.executionDate < F.isoDate()) problems.push('date');
      if (!p.purpose) problems.push('purpose');
      if (problems.length) {
        openPaymentDialog('edit', p, null, 2);
        F.showFormAlert(document.getElementById('new-payment-form'), 'Complete the amount, a future execution date and the purpose before submitting.', false);
        return;
      }
      runAction(document.getElementById('submit-draft'), 'Submitting…', (s) => {
        const target = s.payments.find((x) => x.id === p.id);
        applySubmission(target, payee || { country: target.country, createdAt: target.createdAt });
        return `${target.id} submitted. ${target.chain[0]} approval is next.`;
      }, (m) => m);
    }

    function applySubmission(target, payee) {
      const result = evaluatePolicy({ amount: target.amount, currency: target.currency, payee });
      const at = F.isoLocal();
      target.status = 'pending';
      target.chain = result.chain;
      target.stage = 0;
      target.approvals = [];
      target.policy = result.label;
      target.activity.push({ at, title: 'Submitted for approval', meta: `${CURRENT_USER}, Employee` });
      target.activity.push({ at, title: result.rule ? `Policy ${fmt.pad2(result.number)} applied` : 'Workspace default applied', meta: `${result.chain.join(' → ')} approval required` });
    }

    /* ---------- New payment / edit draft dialog ---------- */
    const dialog = document.getElementById('payment-dialog');
    const form = document.getElementById('new-payment-form');
    const payeeSelect = document.getElementById('payee-select');
    let mode = 'new';
    let editingId = null;
    let step = 1;

    function fillPayeeOptions(selected) {
      const payees = store.list('payees');
      payeeSelect.innerHTML = payees.map((p) => `<option value="${esc(p.id)}">${esc(p.name)}, ${esc(p.currency)}</option>`).join('') + '<option value="new">New payee…</option>';
      payeeSelect.value = selected && (selected === 'new' || payees.some((p) => p.id === selected)) ? selected : (payees[0]?.id || 'new');
    }

    function syncPayeeFields() {
      const isNew = payeeSelect.value === 'new';
      form.querySelectorAll('.new-payee-fields').forEach((el) => { el.hidden = !isNew; });
      const payee = store.find('payees', payeeSelect.value);
      const preview = document.getElementById('payee-preview');
      preview.innerHTML = payee
        ? `<span>${esc(payee.bank)}</span><strong class="mono">${esc(payee.account)}</strong><span>${esc(payee.country)}, saved ${fmt.date(payee.createdAt)}</span>`
        : '<span>New payees are verified by your bank before first settlement.</span>';
    }

    function syncCurrency() {
      setText('currency-prefix', form.elements.currency.value);
      updatePolicyPreview();
    }

    function currentPayee() {
      const values = F.store && form ? form : null;
      if (!values) return null;
      if (payeeSelect.value === 'new') return { name: form.elements.newPayeeName.value.trim(), country: form.elements.newPayeeCountry.value, createdAt: F.isoDate() };
      return store.find('payees', payeeSelect.value);
    }

    function updatePolicyPreview() {
      const note = document.getElementById('policy-preview');
      const amount = F.parseAmount(form.elements.amount.value);
      const span = note.querySelector('span');
      if (!amount) { span.textContent = 'Enter an amount to see which approval rule applies.'; return; }
      const result = evaluatePolicy({ amount, currency: form.elements.currency.value, payee: currentPayee() });
      span.textContent = result.rule
        ? `${result.label} applies. ${result.chain.join(' → ')} approval is required before execution.`
        : `No rule matches. ${result.label}: Finance manager approval before execution.`;
    }

    function goStep(next) {
      step = next;
      form.querySelectorAll('[data-step]').forEach((el) => { el.hidden = Number(el.dataset.step) !== step; });
      form.querySelectorAll('[data-step-tab]').forEach((el) => {
        const n = Number(el.dataset.stepTab);
        if (n === step) el.setAttribute('aria-current', 'step'); else el.removeAttribute('aria-current');
        el.classList.toggle('done', n < step);
      });
      form.querySelectorAll('[data-step-show]').forEach((el) => { el.hidden = !el.dataset.stepShow.split(' ').includes(String(step)); });
      if (step === 3) buildReview();
      if (step === 2) updatePolicyPreview();
      form.querySelector(`[data-step="${step}"] input:not([type=checkbox]), [data-step="${step}"] select`)?.focus();
    }

    function validateStep(values, n) {
      const errors = {};
      if (n === 1) {
        if (values.payeeId === 'new') {
          const name = values.newPayeeName || '';
          if (name.length < 2) errors.newPayeeName = 'Enter the payee legal name.';
          else if (store.list('payees').some((p) => p.name.toLowerCase() === name.toLowerCase())) errors.newPayeeName = 'A saved payee already has this name. Select it from the list instead.';
          if (!values.newPayeeCountry) errors.newPayeeCountry = 'Select the payee country.';
          if ((values.newPayeeAccount || '').replace(/\W/g, '').length < 8) errors.newPayeeAccount = 'Enter at least 8 letters or digits.';
        } else if (!store.find('payees', values.payeeId)) {
          errors.payeeId = 'Select a payee.';
        }
      }
      if (n === 2) {
        const amount = F.parseAmount(values.amount);
        if (!values.amount) errors.amount = 'Enter an amount.';
        else if (Number.isNaN(amount)) errors.amount = 'Use digits only, with up to 2 decimals.';
        else if (amount <= 0) errors.amount = 'Amount must be greater than zero.';
        else if (values.currency === 'JPY' && !Number.isInteger(amount)) errors.amount = 'JPY amounts have no decimals.';
        else if (F.toUsd(amount, values.currency) > 5000000) errors.amount = 'Above the USD 5,000,000 single-payment limit.';
        if (!values.executionDate) errors.executionDate = 'Choose an execution date.';
        else if (values.executionDate < F.isoDate()) errors.executionDate = `Choose today (${fmt.date(F.isoDate())}) or a later date.`;
        if ((values.purpose || '').length < 3) errors.purpose = 'Add a purpose so approvers have context.';
      }
      return errors;
    }

    function stepNav(direction) {
      const values = F.store && formValuesLite();
      if (direction === 'back') { goStep(Math.max(1, step - 1)); return; }
      form.querySelectorAll('.field-error').forEach((n) => n.remove());
      form.querySelectorAll('.form-alert').forEach((n) => n.remove());
      form.querySelectorAll('[aria-invalid="true"]').forEach((n) => n.removeAttribute('aria-invalid'));
      const errors = validateStep(values, step);
      if (Object.keys(errors).length) { showFieldErrors(errors); return; }
      goStep(Math.min(3, step + 1));
    }

    function formValuesLite() {
      const v = {};
      [...form.elements].forEach((el) => { if (el.name) v[el.name] = el.type === 'checkbox' ? el.checked : el.value.trim(); });
      return v;
    }

    function showFieldErrors(errors) {
      let first = null;
      Object.entries(errors).forEach(([name, message]) => {
        const el = form.elements[name];
        if (!el) return;
        el.setAttribute('aria-invalid', 'true');
        const id = `err-new-payment-form-${name}`;
        el.setAttribute('aria-describedby', id);
        (el.closest('.form-field') || el.parentElement).insertAdjacentHTML('beforeend', `<p class="field-error" id="${id}">${esc(message)}</p>`);
        if (!first) first = el;
      });
      first?.focus();
    }

    function buildReview() {
      const v = formValuesLite();
      const payee = currentPayee();
      const amount = F.parseAmount(v.amount);
      const result = evaluatePolicy({ amount, currency: v.currency, payee });
      const rows = [
        ['Payee', `${payee?.name || ''}${payee?.country ? `, ${payee.country}` : ''}`],
        ['Account', payee?.account || v.newPayeeAccount || ''],
        ['Amount', fmt.money(amount, v.currency)],
        ['USD equivalent', `USD ${fmt.number(F.toUsd(amount, v.currency))}`],
        ['Execution date', fmt.date(v.executionDate)],
        ['Purpose', v.purpose],
        ['Reference', v.reference || 'None']
      ];
      document.getElementById('payment-review').innerHTML = rows.map(([k, val]) => `<li><span>${esc(k)}</span><strong>${esc(val)}</strong></li>`).join('');
      const chain = ['Draft'].concat(result.chain.map((r) => `${r} (${approverName(r)})`), ['Execution']);
      document.getElementById('review-chain').innerHTML = `<p class="section-label">Approval chain</p><p class="review-chain-line">${chain.map(esc).join(' <span aria-hidden="true">→</span> ')}</p><p class="review-chain-rule">${esc(result.label)}</p>`;
    }

    function openPaymentDialog(nextMode, payment = null, payeeId = null, startStep = 1) {
      mode = nextMode;
      editingId = payment ? payment.id : null;
      form.reset();
      F.openDialog(dialog);
      setText('payment-dialog-title', mode === 'edit' ? `Edit draft ${payment.id}` : 'New cross-border payment');
      setText('payment-dialog-kicker', mode === 'edit' ? 'Draft payment' : 'Payment instruction');
      const saved = payment && store.find('payees', payment.payeeId);
      fillPayeeOptions(payment ? (saved ? saved.id : 'new') : payeeId);
      if (payment && !saved) {
        form.elements.newPayeeName.value = payment.counterparty;
        form.elements.newPayeeCountry.value = payment.country;
      }
      const payee = store.find('payees', payeeSelect.value);
      form.elements.currency.value = payment ? payment.currency : (payee?.currency || 'USD');
      form.elements.amount.value = payment && payment.amount ? fmt.number(payment.amount, payment.currency) : '';
      const tomorrow = new Date(F.now().getTime() + 86400000);
      form.elements.executionDate.value = payment?.executionDate || F.isoDate(tomorrow);
      form.elements.executionDate.min = F.isoDate();
      form.elements.purpose.value = payment?.purpose || '';
      form.elements.reference.value = payment?.reference || '';
      syncPayeeFields();
      syncCurrency();
      goStep(startStep);
    }

    payeeSelect.addEventListener('change', () => {
      syncPayeeFields();
      const payee = store.find('payees', payeeSelect.value);
      if (payee && mode === 'new') { form.elements.currency.value = payee.currency; syncCurrency(); }
    });
    form.elements.currency.addEventListener('change', syncCurrency);
    form.elements.amount.addEventListener('input', updatePolicyPreview);
    form.querySelectorAll('[data-nav]').forEach((button) => button.addEventListener('click', () => stepNav(button.dataset.nav)));

    F.bindForm(form, {
      busyLabel: 'Saving…',
      validate(values, action) {
        if (action === 'draft') {
          const errors = validateStep(values, 1);
          if (values.amount && Number.isNaN(F.parseAmount(values.amount))) errors.amount = 'Use digits only, with up to 2 decimals.';
          if (errors.newPayeeName || errors.newPayeeCountry || errors.newPayeeAccount || errors.payeeId) goStep(1);
          return errors;
        }
        const first = validateStep(values, 1);
        if (Object.keys(first).length) { goStep(1); return first; }
        const second = validateStep(values, 2);
        if (Object.keys(second).length) { goStep(2); return second; }
        return {};
      },
      submit(values, action) {
        const isSubmit = action === 'submit';
        return store.commit((s) => {
          let payee = s.payees.find((p) => p.id === values.payeeId);
          if (values.payeeId === 'new') {
            payee = { id: store.nextId('PYE-', 'payees', 1000), name: values.newPayeeName, country: values.newPayeeCountry, currency: values.currency, bank: 'Pending verification', account: values.newPayeeAccount, email: '', createdAt: F.isoDate() };
            if (values.savePayee) s.payees.push(payee);
          }
          let record = editingId ? s.payments.find((p) => p.id === editingId) : null;
          if (!record) {
            record = { id: store.nextId('TRF-', 'payments', 98234), createdAt: F.isoLocal(), status: 'draft', chain: [], stage: 0, approvals: [], policy: '', activity: [] };
            s.payments.unshift(record);
          }
          Object.assign(record, {
            payeeId: values.savePayee || values.payeeId !== 'new' ? payee.id : null,
            counterparty: payee.name,
            country: payee.country,
            currency: values.currency,
            amount: F.parseAmount(values.amount) || 0,
            executionDate: values.executionDate,
            purpose: values.purpose,
            reference: values.reference
          });
          if (isSubmit) {
            if (record.activity.length === 0) record.activity.push({ at: record.createdAt, title: 'Payment created', meta: `${CURRENT_USER}, Employee` });
            applySubmission(record, payee);
          } else {
            record.activity.push({ at: F.isoLocal(), title: mode === 'edit' ? 'Draft updated' : 'Draft saved', meta: `${CURRENT_USER}, Employee` });
          }
          return record;
        }).then((record) => {
          selectedId = record.id;
          F.setParam('id', record.id);
          clearFilters();
          F.toast(isSubmit
            ? `${record.id} submitted for approval. ${record.chain.join(' → ')} must approve before funds are released.`
            : mode === 'edit' ? `Draft ${record.id} updated.` : `Draft ${record.id} saved. Submit it when it is ready.`);
        });
      }
    });

    /* ---------- Wiring ---------- */
    F.bindRows(tbody, select);
    filterButtons.forEach((button) => button.addEventListener('click', () => {
      filterButtons.forEach((b) => b.classList.toggle('active', b === button));
      renderList();
    }));
    search?.addEventListener('input', renderList);
    currencyFilter?.addEventListener('change', renderList);
    document.getElementById('open-payment-dialog')?.addEventListener('click', () => openPaymentDialog('new'));
    document.getElementById('approve-action').addEventListener('click', approve);
    document.getElementById('reject-action').addEventListener('click', reject);
    document.getElementById('cancel-payment').addEventListener('click', cancelPayment);
    document.getElementById('delete-draft').addEventListener('click', deleteDraft);
    document.getElementById('edit-draft').addEventListener('click', () => { const p = store.find('payments', selectedId); if (p) openPaymentDialog('edit', p); });
    document.getElementById('submit-draft').addEventListener('click', submitDraft);
    F.onRoleChange(() => { if (loaded) renderDetail(); });

    F.loadView({
      region, tbody, columns: 6, noun: 'payments',
      render() {
        loaded = true;
        renderList();
        const preset = F.getParam('new');
        if (preset !== null) { F.setParam('new', null); openPaymentDialog('new', null, preset); }
      }
    });
    if (!loaded) renderDetailSkeleton();

    function renderDetailSkeleton() {
      // Keep the detail pane meaningful while the list loads.
      const payment = selectedId ? store.find('payments', selectedId) : store.list('payments')[0];
      if (payment && !F.getParam('simulate')) { selectedId = selectedId || payment.id; renderDetail(); }
    }
  }

  /* =====================================================================
     Saved payees
     ===================================================================== */
  function initPayees() {
    const tbody = document.getElementById('payees-body');
    const region = document.getElementById('payees-region');
    const emptyHost = document.getElementById('payees-empty');
    const pane = document.getElementById('payee-pane');
    const search = document.getElementById('payee-search');
    const dialog = document.getElementById('payee-dialog');
    const form = document.getElementById('payee-form');
    let selectedId = F.getParam('id');
    let editingId = null;

    function rows() {
      const q = (search?.value || '').trim().toLowerCase();
      return store.list('payees').filter((p) => !q || `${p.name} ${p.country} ${p.currency} ${p.bank} ${p.email}`.toLowerCase().includes(q));
    }

    function render() {
      const all = store.list('payees');
      const list = rows();
      setText('payee-count', fmt.pad2(all.length));
      setText('payee-new-count', fmt.pad2(all.filter((p) => (F.now() - F.parseDate(p.createdAt)) / 86400000 < 30).length));
      setText('payee-currency-count', fmt.pad2(new Set(all.map((p) => p.currency)).size));
      setText('payee-country-count', fmt.pad2(new Set(all.map((p) => p.country)).size));
      tbody.innerHTML = list.map((p) => `<tr tabindex="0" data-id="${esc(p.id)}">
        <td><span class="table-strong">${esc(p.name)}</span><span class="subcopy">${esc(p.email || 'No remittance email')}</span></td>
        <td>${esc(p.country)}</td>
        <td><span class="currency-tag">${esc(p.currency)}</span></td>
        <td class="mono">${esc(p.account)}</td>
        <td class="mono">${fmt.day(p.createdAt)}</td>
      </tr>`).join('');
      if (!all.length) {
        emptyHost.innerHTML = F.stateBlock({ title: 'No saved payees', body: 'Save the businesses you pay often so new payments start with verified details.', action: 'Add payee' });
        emptyHost.querySelector('[data-state-action]').addEventListener('click', () => openForm(null));
      } else if (!list.length) {
        emptyHost.innerHTML = F.stateBlock({ icon: 'search', title: 'No matching payees', body: 'Try a different name, country or currency.', action: 'Clear search' });
        emptyHost.querySelector('[data-state-action]').addEventListener('click', () => { search.value = ''; render(); });
      } else emptyHost.innerHTML = '';
      if (!selectedId && list.length) selectedId = list[0].id;
      F.markSelected(tbody, selectedId);
      renderPane();
    }

    function renderPane() {
      const body = document.getElementById('payee-pane-body');
      const missing = document.getElementById('payee-not-found');
      const p = selectedId ? store.find('payees', selectedId) : null;
      if (!p) {
        body.hidden = true;
        missing.hidden = false;
        missing.innerHTML = !store.list('payees').length
          ? F.stateBlock({ title: 'Nothing selected', body: 'Payee details appear here once you add one.' })
          : F.stateBlock({ icon: 'missing', title: `Payee ${selectedId} not found`, body: 'It may have been deleted, or the link is out of date.', action: 'Show first payee' });
        missing.querySelector('[data-state-action]')?.addEventListener('click', () => select(store.list('payees')[0].id));
        return;
      }
      body.hidden = false;
      missing.hidden = true;
      setText('payee-pane-id', p.id);
      setText('payee-pane-name', p.name);
      setText('payee-pane-country', p.country);
      setText('payee-pane-bank', p.bank);
      setText('payee-pane-account', p.account);
      setText('payee-pane-currency', p.currency);
      setText('payee-pane-email', p.email || 'Not set');
      setText('payee-pane-added', fmt.date(p.createdAt));
      const payments = store.list('payments').filter((x) => x.payeeId === p.id);
      const list = document.getElementById('payee-payments');
      list.innerHTML = payments.length
        ? payments.slice(0, 5).map((x) => `<li><a href="index.html?id=${encodeURIComponent(x.id)}"><span class="mono">${esc(x.id)}</span><span>${esc((STATUS[x.status] || STATUS.pending)[0])}</span><strong class="mono">${fmt.money(x.amount, x.currency)}</strong></a></li>`).join('')
        : '<li class="muted-line">No payments to this payee yet.</li>';
      document.getElementById('payee-pay').href = `index.html?new=${encodeURIComponent(p.id)}`;
    }

    function select(id, user) {
      selectedId = id;
      F.setParam('id', id);
      F.markSelected(tbody, id);
      renderPane();
      F.revealPane(pane, user);
    }

    function openForm(payee) {
      editingId = payee ? payee.id : null;
      form.reset();
      F.openDialog(dialog);
      setText('payee-dialog-title', payee ? `Edit ${payee.name}` : 'Add payee');
      setText('payee-submit', payee ? 'Save changes' : 'Add payee');
      if (payee) ['name', 'country', 'currency', 'bank', 'account', 'email'].forEach((k) => { form.elements[k].value = payee[k] || ''; });
      form.elements.name.focus();
    }

    F.bindForm(form, {
      validate(v) {
        const e = {};
        if (v.name.length < 2) e.name = 'Enter the payee legal name.';
        else if (store.list('payees').some((p) => p.id !== editingId && p.name.toLowerCase() === v.name.toLowerCase())) e.name = 'Another saved payee already uses this name.';
        if (!v.country) e.country = 'Select a country.';
        if (v.bank.length < 2) e.bank = 'Enter the receiving bank.';
        if (v.account.replace(/\W/g, '').length < 8) e.account = 'Enter at least 8 letters or digits.';
        if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) e.email = 'Enter a valid email, for example ap@company.com.';
        return e;
      },
      submit(v) {
        return store.commit((s) => {
          if (editingId) {
            const p = s.payees.find((x) => x.id === editingId);
            Object.assign(p, v);
            return p;
          }
          const p = { id: store.nextId('PYE-', 'payees', 1000), ...v, createdAt: F.isoDate() };
          s.payees.push(p);
          return p;
        }).then((p) => {
          selectedId = p.id;
          F.setParam('id', p.id);
          search.value = '';
          render();
          F.toast(editingId ? `${p.name} updated.` : `${p.name} saved to payees.`);
        });
      }
    });

    document.getElementById('add-payee').addEventListener('click', () => openForm(null));
    document.getElementById('payee-edit').addEventListener('click', () => openForm(store.find('payees', selectedId)));
    document.getElementById('payee-delete').addEventListener('click', () => {
      const p = store.find('payees', selectedId);
      if (!p) return;
      F.confirmAction({
        kicker: 'Saved payees',
        title: `Delete ${p.name}?`,
        body: 'Existing payments keep their own copy of these details. You can add the payee again later.',
        confirmLabel: 'Delete payee',
        busyLabel: 'Deleting…',
        action: () => store.commit((s) => { s.payees = s.payees.filter((x) => x.id !== p.id); }).then(() => {
          selectedId = null;
          F.setParam('id', null);
          render();
          F.toast(`${p.name} removed from saved payees.`);
        })
      });
    });
    F.bindRows(tbody, select);
    search.addEventListener('input', render);
    F.loadView({ region, tbody, columns: 5, noun: 'payees', render });
  }

  /* =====================================================================
     Approval policies (Settings)
     ===================================================================== */
  function initPolicies() {
    const listHost = document.getElementById('policy-list');
    const builder = document.getElementById('policy-builder');
    const builderBody = document.getElementById('policy-builder-body');
    const missing = document.getElementById('policy-not-found');
    let selectedId = F.getParam('id');
    let draft = null;
    let dirty = false;

    function describe(rule) {
      return rule.conditions.map((c) => `${FIELD_LABELS[c.field] || c.field} ${c.op} ${c.value}`).join(' AND ');
    }

    function renderMetrics() {
      const rules = store.list('policies');
      setText('metric-active-rules', fmt.pad2(rules.filter((r) => r.status === 'Active').length));
      setText('metric-total-rules', `${rules.length} rules, evaluated top to bottom`);
      const last = store.list('policyHistory')[0];
      setText('metric-last-change', last ? fmt.day(last.at).toUpperCase() : 'NONE');
      setText('metric-last-change-note', last ? `${last.by}, ${fmt.time(last.at)}` : 'No changes recorded');
    }

    function renderList() {
      renderMetrics();
      const rules = store.list('policies');
      if (!rules.length) {
        listHost.innerHTML = F.stateBlock({ title: 'No approval rules', body: 'Payments fall back to the workspace default: one Finance manager approval.', action: 'Create rule' });
        listHost.querySelector('[data-state-action]').addEventListener('click', openNewRule);
        return;
      }
      listHost.innerHTML = rules.map((r, i) => `<article class="policy-row${r.id === selectedId ? ' selected' : ''}" data-policy="${i + 1}" data-id="${esc(r.id)}">
        <span class="policy-index">Rule ${fmt.pad2(i + 1)}</span>
        <div class="policy-summary"><strong>${esc(r.name)}</strong><p><span class="mono">${esc(describe(r))}</span> requires ${esc(r.approvers.join(' → '))}.</p></div>
        <div class="policy-scope">${esc(r.scope)}<br><span class="status ${r.status === 'Active' ? 'status-success' : 'status-neutral'}">${esc(r.status)}</span></div>
        <button class="btn btn-icon policy-select" type="button" aria-label="Edit Rule ${fmt.pad2(i + 1)}">${ARROW_RIGHT}</button>
      </article>`).join('');
    }

    function load(id) {
      const rule = store.find('policies', id);
      draft = rule ? JSON.parse(JSON.stringify(rule)) : null;
      dirty = false;
      renderBuilder();
    }

    function select(id) {
      if (id === selectedId && draft) return;
      if (dirty) {
        F.confirmAction({
          kicker: 'Unsaved changes',
          title: 'Discard changes to this rule?',
          body: 'Your edits to the open rule have not been saved.',
          confirmLabel: 'Discard changes',
          action: async () => { dirty = false; select(id); }
        });
        return;
      }
      selectedId = id;
      F.setParam('id', id);
      load(id);
      renderList();
      if (window.matchMedia('(max-width: 980px)').matches) builder.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }

    function renderBuilder() {
      clearBuilderErrors();
      if (!draft) {
        builderBody.hidden = true;
        missing.hidden = false;
        const none = !store.list('policies').length;
        missing.innerHTML = none
          ? F.stateBlock({ title: 'No rule selected', body: 'Create a rule to define who approves which payments.' })
          : F.stateBlock({ icon: 'missing', title: `Rule ${selectedId} not found`, body: 'It may have been deleted, or the link is out of date.', action: 'Open first rule' });
        missing.querySelector('[data-state-action]')?.addEventListener('click', () => select(store.list('policies')[0].id));
        return;
      }
      builderBody.hidden = false;
      missing.hidden = true;
      const index = store.list('policies').findIndex((r) => r.id === draft.id);
      setText('rule-number', `Rule ${fmt.pad2(index + 1)}`);
      setText('policy-builder-title', draft.name || 'Untitled rule');
      document.getElementById('rule-name').value = draft.name;
      document.getElementById('scope-select').value = draft.scope;
      document.getElementById('status-select').value = draft.status;
      const conditions = document.getElementById('condition-token-row');
      conditions.innerHTML = '<span class="rule-token keyword">IF</span>' + draft.conditions.map((c, i) => `${i ? '<span class="logic-word">AND</span>' : ''}<span class="rule-token condition-token" data-index="${i}">${esc(`${c.field} ${c.op} ${c.value}`)} <button type="button" class="token-remove" aria-label="Remove condition ${esc(`${c.field} ${c.op} ${c.value}`)}">×</button></span>`).join('');
      renderApprovers();
      syncFooter();
    }

    function renderApprovers() {
      const row = document.getElementById('approver-token-row');
      let html = '<span class="rule-token keyword">THEN require</span>';
      draft.approvers.forEach((role, index) => {
        if (index > 0) html += '<span class="arrow-separator">→</span>';
        const left = index > 0 ? `<button type="button" data-move="left" aria-label="Move ${esc(role)} earlier">${ARROW_LEFT}</button>` : '';
        const right = index < draft.approvers.length - 1 ? `<button type="button" data-move="right" aria-label="Move ${esc(role)} later">${ARROW_RIGHT}</button>` : '';
        html += `<span class="approver-token" data-index="${index}"><strong>${index + 1}</strong> ${esc(role)} <span class="approver-actions">${left}${right}<button type="button" data-remove-approver aria-label="Remove ${esc(role)}">×</button></span></span>`;
      });
      if (!draft.approvers.length) html += '<span class="token-empty">No approver yet</span>';
      row.innerHTML = html;
    }

    function syncFooter() {
      const scope = document.getElementById('scope-select').value;
      const status = document.getElementById('status-select').value;
      setText('policy-scope-label', scope);
      const footerStatus = document.getElementById('policy-footer-status');
      footerStatus.textContent = dirty ? `${status}, unsaved changes` : status;
      footerStatus.className = dirty ? 'footer-status dirty' : status === 'Active' ? 'footer-status active' : 'footer-status';
      const header = document.getElementById('rule-status');
      header.textContent = status;
      header.className = status === 'Active' ? 'status status-success' : 'status status-neutral';
    }

    function markDirty() { dirty = true; syncFooter(); }

    function clearBuilderErrors() {
      builder.querySelectorAll('.field-error, .form-alert').forEach((n) => n.remove());
      builder.querySelectorAll('[aria-invalid="true"]').forEach((n) => n.removeAttribute('aria-invalid'));
    }

    function builderError(host, message, input) {
      host.insertAdjacentHTML('beforeend', `<p class="field-error">${esc(message)}</p>`);
      if (input) { input.setAttribute('aria-invalid', 'true'); input.focus(); }
    }

    function validateCondition(field, op, rawValue) {
      const value = rawValue.trim();
      if (!value) return { error: 'Enter a value for this condition.' };
      if (field === 'amount') {
        const m = value.match(/^(?:USD\s*)?([\d,]+(?:\.\d{1,2})?)$/i);
        if (!m) return { error: 'Use an amount such as USD 25,000.' };
        const n = Number(m[1].replace(/,/g, ''));
        if (!(n > 0)) return { error: 'Amount threshold must be above zero.' };
        if (op === '=' || op === '!=') return { error: 'Use > or < for amount thresholds.' };
        return { value: `USD ${fmt.whole(n)}` };
      }
      if (field === 'currency') {
        if (op === '>' || op === '<') return { error: 'Currency supports = or != only.' };
        if (/^base( currency)?$/i.test(value)) return { value: 'base currency' };
        if (!/^[A-Za-z]{3}$/.test(value)) return { error: 'Use a 3-letter code such as EUR, or "base currency".' };
        return { value: value.toUpperCase() };
      }
      if (field === 'beneficiary_age_days') {
        if (!/^\d{1,4}$/.test(value)) return { error: 'Use a whole number of days, 0 to 9999.' };
        return { value: String(Number(value)) };
      }
      if (field === 'created_outside_hours') {
        if (op !== '=') return { error: 'Use = with true or false.' };
        if (!/^(true|false)$/i.test(value)) return { error: 'Use true or false.' };
        return { value: value.toLowerCase() };
      }
      return { error: 'Unknown field.' };
    }

    function save() {
      clearBuilderErrors();
      draft.name = document.getElementById('rule-name').value.trim();
      draft.scope = document.getElementById('scope-select').value;
      draft.status = document.getElementById('status-select').value;
      let invalid = false;
      if (draft.name.length < 3) { builderError(document.getElementById('rule-name').closest('.form-field'), 'Name the rule, at least 3 characters.', document.getElementById('rule-name')); invalid = true; }
      else if (store.list('policies').some((r) => r.id !== draft.id && r.name.toLowerCase() === draft.name.toLowerCase())) { builderError(document.getElementById('rule-name').closest('.form-field'), 'Another rule already uses this name.', document.getElementById('rule-name')); invalid = true; }
      if (!draft.conditions.length) { builderError(document.getElementById('conditions-section'), 'Add at least one condition. A rule without conditions would match every payment.'); invalid = true; }
      if (!draft.approvers.length) { builderError(document.getElementById('approvers-section'), 'Add at least one approver to the chain.'); invalid = true; }
      if (invalid) return;
      const button = document.getElementById('save-policy');
      const snapshot = JSON.parse(JSON.stringify(draft));
      const original = button.textContent;
      button.disabled = true;
      button.textContent = 'Saving…';
      store.commit((s) => {
        const index = s.policies.findIndex((r) => r.id === snapshot.id);
        s.policies[index] = snapshot;
        s.policyHistory.unshift({ at: F.isoLocal(), by: CURRENT_USER, action: `Rule ${fmt.pad2(index + 1)} "${snapshot.name}" saved` });
      }).then(() => {
        dirty = false;
        renderList();
        renderBuilder();
        F.toast(`${snapshot.name} saved. New payments are evaluated with this rule.`);
      }).catch((error) => {
        const alert = document.createElement('div');
        alert.className = 'form-alert';
        alert.setAttribute('role', 'alert');
        alert.innerHTML = `${F.ICONS.error}<div><strong>Not saved</strong><span>${esc(error.message)}</span></div><button class="btn" type="button">Try again</button>`;
        alert.querySelector('button').addEventListener('click', save);
        builderBody.querySelector('.policy-card-body').prepend(alert);
      }).finally(() => { button.disabled = false; button.textContent = original; });
    }

    function remove() {
      if (!draft) return;
      const index = store.list('policies').findIndex((r) => r.id === draft.id);
      const name = draft.name;
      const id = draft.id;
      F.confirmAction({
        kicker: 'Approval policies',
        title: `Delete Rule ${fmt.pad2(index + 1)}?`,
        body: `"${name}" stops applying to new payments. Payments already in approval keep their current chain.`,
        confirmLabel: 'Delete rule',
        busyLabel: 'Deleting…',
        action: () => store.commit((s) => {
          s.policies = s.policies.filter((r) => r.id !== id);
          s.policyHistory.unshift({ at: F.isoLocal(), by: CURRENT_USER, action: `Rule "${name}" deleted` });
        }).then(() => {
          dirty = false;
          selectedId = store.list('policies')[0]?.id || null;
          F.setParam('id', selectedId);
          load(selectedId);
          renderList();
          F.toast(`Rule "${name}" deleted.`);
        })
      });
    }

    /* New rule dialog */
    const newDialog = document.getElementById('new-rule-dialog');
    const newForm = document.getElementById('new-rule-form');
    function openNewRule() {
      newForm.reset();
      F.openDialog(newDialog);
      newForm.elements.name.focus();
    }
    F.bindForm(newForm, {
      validate(v) {
        const e = {};
        if (v.name.length < 3) e.name = 'Name the rule, at least 3 characters.';
        else if (store.list('policies').some((r) => r.name.toLowerCase() === v.name.toLowerCase())) e.name = 'Another rule already uses this name.';
        const check = validateCondition(v.field, v.op, v.value);
        if (check.error) e.value = check.error;
        const priority = Number(v.priority);
        if (!Number.isInteger(priority) || priority < 1 || priority > store.list('policies').length + 1) e.priority = `Use a position from 1 to ${store.list('policies').length + 1}.`;
        return e;
      },
      submit(v) {
        const check = validateCondition(v.field, v.op, v.value);
        return store.commit((s) => {
          const rule = { id: `POL-${fmt.pad2(Math.max(0, ...s.policies.map((r) => Number(r.id.replace(/\D/g, '')))) + 1)}`, name: v.name, scope: v.scope, status: v.status, conditions: [{ field: v.field, op: v.op, value: check.value }], approvers: [v.approver] };
          s.policies.splice(Number(v.priority) - 1, 0, rule);
          s.policyHistory.unshift({ at: F.isoLocal(), by: CURRENT_USER, action: `Rule "${rule.name}" created at position ${v.priority}` });
          return rule;
        }).then((rule) => {
          dirty = false;
          selectedId = rule.id;
          F.setParam('id', rule.id);
          load(rule.id);
          renderList();
          F.toast(`Rule "${rule.name}" created. Add more conditions or approvers if needed.`);
        });
      }
    });

    /* Builder wiring */
    listHost.addEventListener('click', (event) => {
      const row = event.target.closest('.policy-row');
      if (row) select(row.dataset.id);
    });
    document.getElementById('condition-token-row').addEventListener('click', (event) => {
      const remove = event.target.closest('.token-remove');
      if (!remove || !draft) return;
      draft.conditions.splice(Number(remove.closest('.condition-token').dataset.index), 1);
      renderBuilder();
      markDirty();
    });
    document.getElementById('add-condition').addEventListener('click', () => {
      if (!draft) return;
      clearBuilderErrors();
      const field = document.getElementById('condition-field').value;
      const op = document.getElementById('condition-operator').value;
      const input = document.getElementById('condition-value');
      const check = validateCondition(field, op, input.value);
      if (check.error) { builderError(document.getElementById('conditions-section'), check.error, input); return; }
      if (draft.conditions.some((c) => c.field === field && c.op === op && c.value === check.value)) { builderError(document.getElementById('conditions-section'), 'This condition is already in the rule.', input); return; }
      draft.conditions.push({ field, op, value: check.value });
      renderBuilder();
      markDirty();
    });
    document.getElementById('approver-token-row').addEventListener('click', (event) => {
      const action = event.target.closest('button');
      const token = action?.closest('.approver-token');
      if (!token || !draft) return;
      const index = Number(token.dataset.index);
      const roles = draft.approvers;
      if (action.hasAttribute('data-remove-approver')) roles.splice(index, 1);
      if (action.dataset.move === 'left' && index > 0) [roles[index - 1], roles[index]] = [roles[index], roles[index - 1]];
      if (action.dataset.move === 'right' && index < roles.length - 1) [roles[index + 1], roles[index]] = [roles[index], roles[index + 1]];
      renderApprovers();
      markDirty();
    });
    document.getElementById('add-approver').addEventListener('click', () => {
      if (!draft) return;
      clearBuilderErrors();
      const role = document.getElementById('approver-select').value;
      if (draft.approvers.includes(role)) { builderError(document.getElementById('approvers-section'), `${role} is already in the chain.`); return; }
      draft.approvers.push(role);
      renderApprovers();
      markDirty();
    });
    ['scope-select', 'status-select'].forEach((id) => document.getElementById(id).addEventListener('change', markDirty));
    document.getElementById('rule-name').addEventListener('input', (e) => { setText('policy-builder-title', e.target.value || 'Untitled rule'); markDirty(); });
    document.getElementById('save-policy').addEventListener('click', save);
    document.getElementById('delete-rule').addEventListener('click', remove);
    document.getElementById('discard-policy').addEventListener('click', () => { load(selectedId); F.toast('Unsaved changes discarded.'); });
    document.getElementById('new-rule-button').addEventListener('click', openNewRule);
    document.getElementById('history-button').addEventListener('click', () => {
      const history = store.list('policyHistory');
      document.getElementById('history-list').innerHTML = history.length
        ? history.map((h) => `<li class="activity-item"><time datetime="${esc(h.at)}"><span class="activity-day">${fmt.day(h.at)}</span>${fmt.time(h.at)}</time><div><strong>${esc(h.action)}</strong><span>${esc(h.by)}</span></div></li>`).join('')
        : '<li class="muted-line">No policy changes recorded yet.</li>';
      F.openDialog('history-dialog');
    });
    document.getElementById('export-rules').addEventListener('click', () => {
      const rules = store.list('policies');
      if (!rules.length) { F.toast('There are no rules to export.'); return; }
      F.downloadCsv(`flux-approval-rules-${F.isoDate()}.csv`, [['Priority', 'Rule', 'Scope', 'Status', 'Conditions', 'Approvers']].concat(rules.map((r, i) => [i + 1, r.name, r.scope, r.status, describe(r), r.approvers.join(' > ')])));
      F.toast(`${rules.length} rules exported as CSV.`);
    });
    window.addEventListener('beforeunload', (event) => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });

    if (!selectedId) selectedId = store.list('policies')[0]?.id || null;
    function start() { renderList(); load(selectedId); }
    if (F.lens) { start(); return; }
    // Simulated load: skeleton rows first, optional recoverable load error.
    builderBody.hidden = true;
    listHost.setAttribute('aria-busy', 'true');
    listHost.innerHTML = Array.from({ length: 4 }, () => '<div class="policy-skeleton" aria-hidden="true"><span class="skeleton"></span><span class="skeleton"></span></div>').join('');
    window.setTimeout(() => {
      listHost.removeAttribute('aria-busy');
      if (F.getParam('simulate') === 'load-error') {
        listHost.innerHTML = `<div class="load-error" role="alert">${F.ICONS.error}<strong>Could not load approval rules</strong><span>The server did not respond. Your data is unchanged.</span><button class="btn" type="button">Retry</button></div>`;
        listHost.querySelector('button').addEventListener('click', () => { F.setParam('simulate', null); start(); });
        return;
      }
      start();
    }, 300);
  }
})();
