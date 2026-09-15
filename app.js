(() => {
  'use strict';

  const CHECK_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"></path></svg>';
  const ARROW_LEFT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"></path></svg>';
  const ARROW_RIGHT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"></path></svg>';

  document.addEventListener('DOMContentLoaded', () => {
    initRoleSwitcher();
    initPaymentsWorkspace();
    initPolicyBuilder();
  });

  function initRoleSwitcher() {
    const buttons = [...document.querySelectorAll('[data-role]')];
    if (!buttons.length) return;

    const savedRole = safeStorageGet('flux-role') || 'employee';
    setRole(savedRole, buttons);

    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        const role = button.dataset.role;
        safeStorageSet('flux-role', role);
        setRole(role, buttons);
      });
    });
  }

  function setRole(role, buttons = [...document.querySelectorAll('[data-role]')]) {
    document.body.dataset.role = role;
    buttons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.role === role)));

    const approveButton = document.getElementById('approve-action');
    const rejectButton = document.getElementById('reject-action');
    if (!approveButton || !rejectButton) return;

    const selectedRow = document.querySelector('.payment-row.selected');
    const status = selectedRow?.dataset.status || 'pending';
    const canAct = role === 'approver' && status === 'pending';

    approveButton.disabled = !canAct;
    rejectButton.disabled = !canAct;
    approveButton.title = canAct ? '' : role === 'approver' ? 'Only pending payments can be approved.' : 'Switch to Approver to take an approval action.';
    rejectButton.title = approveButton.title;
  }

  function initPaymentsWorkspace() {
    const rows = [...document.querySelectorAll('.payment-row')];
    const search = document.getElementById('payment-search');
    const filterButtons = [...document.querySelectorAll('[data-filter]')];
    const dialog = document.getElementById('payment-dialog');
    const openDialog = document.getElementById('open-payment-dialog');
    const form = document.getElementById('new-payment-form');
    const currencyInput = document.getElementById('currency-input');
    const currencyPrefix = document.getElementById('currency-prefix');
    const approveButton = document.getElementById('approve-action');
    const rejectButton = document.getElementById('reject-action');

    if (!rows.length) return;

    rows.forEach((row) => {
      row.addEventListener('click', () => selectPayment(row));
      row.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          selectPayment(row);
        }
      });
    });

    filterButtons.forEach((button) => {
      button.addEventListener('click', () => {
        filterButtons.forEach((item) => item.classList.toggle('active', item === button));
        applyPaymentFilters();
      });
    });

    search?.addEventListener('input', applyPaymentFilters);

    openDialog?.addEventListener('click', () => dialog?.showModal());
    currencyInput?.addEventListener('change', () => {
      if (currencyPrefix) currencyPrefix.textContent = `${currencyInput.value} |`;
    });

    form?.addEventListener('submit', (event) => {
      const submitter = event.submitter;
      if (submitter?.value === 'cancel') return;
      event.preventDefault();
      createPaymentFromForm();
      dialog?.close();
    });

    approveButton?.addEventListener('click', approveSelectedPayment);
    rejectButton?.addEventListener('click', rejectSelectedPayment);

    selectPayment(rows[0]);
  }

  function selectPayment(row) {
    document.querySelectorAll('.payment-row').forEach((item) => item.classList.toggle('selected', item === row));

    setText('detail-reference', row.dataset.reference);
    setText('detail-amount', row.dataset.amount);
    setText('detail-counterparty', row.dataset.counterparty);
    setText('detail-currency', row.dataset.currency);
    setText('detail-country', row.dataset.country);
    setText('detail-initiated', row.dataset.initiated);
    setText('detail-purpose', row.dataset.purpose);

    updateDetailStatus(row.dataset.status);
    updateApprovalRail(Number(row.dataset.stageIndex || 1), row.dataset.status);
    setRole(document.body.dataset.role || 'employee');
  }

  function updateDetailStatus(status) {
    const detailStatus = document.getElementById('detail-status');
    if (!detailStatus) return;

    const config = {
      pending: ['Pending', 'status status-pending'],
      processing: ['Processing', 'status status-neutral'],
      completed: ['Completed', 'status status-success'],
      rejected: ['Rejected', 'status status-danger']
    }[status] || ['Pending', 'status status-pending'];

    detailStatus.textContent = config[0];
    detailStatus.className = config[1];
  }

  function updateApprovalRail(stageIndex, status) {
    const steps = [...document.querySelectorAll('[data-rail]')];
    if (!steps.length) return;

    const labels = ['Draft', 'Finance manager', 'CFO', 'Executed'];
    const notes = ['Jamie Stone · 14:15', 'Alex Smith', 'Sarah Jensen', 'System'];
    const isCompleted = status === 'completed';
    const isRejected = status === 'rejected';

    steps.forEach((step, index) => {
      const stepNumber = index + 1;
      const node = step.querySelector('.rail-node');
      const copy = step.querySelector('.rail-copy');
      step.className = 'rail-step';

      if (isCompleted || stepNumber < stageIndex) {
        step.classList.add('completed');
        if (node) node.innerHTML = CHECK_ICON;
      } else if (stepNumber === stageIndex && !isRejected) {
        step.classList.add('current');
        if (node) node.innerHTML = '';
      } else {
        step.classList.add('future');
        if (node) node.innerHTML = '';
      }

      if (copy) {
        copy.innerHTML = `<span class="rail-label">${labels[index]}</span><span class="rail-note">${notes[index]}</span>`;
        if (step.classList.contains('current')) copy.insertAdjacentHTML('beforeend', '<span class="status status-pending rail-status">Pending</span>');
      }
    });

    const nextApprover = document.getElementById('next-approver');
    const approvalStatus = document.getElementById('approval-status');
    if (!nextApprover || !approvalStatus) return;

    if (isCompleted) {
      nextApprover.textContent = 'None · Payment executed';
      approvalStatus.textContent = 'Completed';
      approvalStatus.className = 'status status-success';
    } else if (isRejected) {
      nextApprover.textContent = 'None · Payment rejected';
      approvalStatus.textContent = 'Rejected';
      approvalStatus.className = 'status status-danger';
    } else {
      const next = stageIndex === 2 ? 'Alex Smith, Finance manager' : stageIndex === 3 ? 'Sarah Jensen, CFO' : 'System execution';
      nextApprover.textContent = next;
      approvalStatus.textContent = 'Pending';
      approvalStatus.className = 'status status-pending';
    }
  }

  function approveSelectedPayment() {
    const row = document.querySelector('.payment-row.selected');
    if (!row || document.body.dataset.role !== 'approver' || row.dataset.status !== 'pending') return;

    let stage = Number(row.dataset.stageIndex || 2);
    if (stage < 3) {
      addActivity('15:03:08', 'Approved by Finance manager', 'Alex Smith · Approver');
      stage = 3;
      row.dataset.stageIndex = '3';
      row.dataset.stage = 'CFO';
      const stageCell = row.querySelector('.stage-text');
      if (stageCell) stageCell.textContent = 'CFO';
    } else {
      addActivity('15:04:31', 'Approved by CFO', 'Sarah Jensen · Approver');
      addActivity('15:04:34', 'Payment released for execution', 'Flux control engine');
      stage = 4;
      row.dataset.stageIndex = '4';
      row.dataset.stage = 'Executed';
      row.dataset.status = 'processing';
      const statusCell = row.querySelector('.status');
      if (statusCell) {
        statusCell.textContent = 'Processing';
        statusCell.className = 'status status-neutral';
      }
      const stageCell = row.querySelector('.stage-text');
      if (stageCell) stageCell.textContent = 'Executed';
      updateDetailStatus('processing');
    }

    updateApprovalRail(stage, row.dataset.status);
    setRole('approver');
  }

  function rejectSelectedPayment() {
    const row = document.querySelector('.payment-row.selected');
    if (!row || document.body.dataset.role !== 'approver' || row.dataset.status !== 'pending') return;

    row.dataset.status = 'rejected';
    const statusCell = row.querySelector('.status');
    if (statusCell) {
      statusCell.textContent = 'Rejected';
      statusCell.className = 'status status-danger';
    }
    addActivity('15:03:08', 'Payment rejected', 'Alex Smith · Finance manager');
    updateDetailStatus('rejected');
    updateApprovalRail(Number(row.dataset.stageIndex || 2), 'rejected');
    setRole('approver');
  }

  function addActivity(time, title, meta) {
    const list = document.getElementById('activity-list');
    if (!list) return;
    list.insertAdjacentHTML('beforeend', `<li class="activity-item"><time>${time}</time><div><strong>${escapeHtml(title)}</strong><span>${escapeHtml(meta)}</span></div></li>`);
  }

  function applyPaymentFilters() {
    const activeFilter = document.querySelector('[data-filter].active')?.dataset.filter || 'all';
    const query = (document.getElementById('payment-search')?.value || '').trim().toLowerCase();
    let visible = 0;

    document.querySelectorAll('.payment-row').forEach((row) => {
      const matchesFilter = activeFilter === 'all' || row.dataset.status === activeFilter;
      const haystack = `${row.dataset.reference} ${row.dataset.counterparty} ${row.dataset.currency} ${row.dataset.purpose}`.toLowerCase();
      const matchesQuery = !query || haystack.includes(query);
      const show = matchesFilter && matchesQuery;
      row.classList.toggle('hidden', !show);
      if (show) visible += 1;
    });

    document.getElementById('payment-empty-state')?.classList.toggle('hidden', visible !== 0);
  }

  function createPaymentFromForm() {
    const recipient = document.getElementById('recipient-input')?.value.trim() || 'New beneficiary';
    const currency = document.getElementById('currency-input')?.value || 'USD';
    const rawAmount = Number.parseFloat(document.getElementById('amount-input')?.value || '0');
    const reference = `TRF-${Math.floor(99000 + Math.random() * 900)}`;
    const formatted = formatCurrency(rawAmount, currency);
    const tbody = document.querySelector('#payments-table tbody');
    if (!tbody) return;

    const row = document.createElement('tr');
    row.className = 'payment-row';
    row.tabIndex = 0;
    Object.assign(row.dataset, {
      status: 'pending', reference, counterparty: recipient, country: 'Pending beneficiary verification', currency,
      amount: formatted, initiated: '15 Sep 2026 · 15:02', stage: 'Finance manager', stageIndex: '2', purpose: 'New payment instruction'
    });
    row.innerHTML = `<td><span class="status status-pending">Pending</span></td><td class="counterparty"><strong>${escapeHtml(recipient)}</strong><span>New payment instruction</span></td><td><span class="currency-tag">${escapeHtml(currency)}</span></td><td class="amount-col amount">${escapeHtml(formatNumber(rawAmount, currency))}</td><td><time datetime="2026-09-15T15:02">15 Sep · 15:02</time></td><td class="stage-column"><span class="stage-text">Finance manager</span></td>`;

    row.addEventListener('click', () => selectPayment(row));
    row.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        selectPayment(row);
      }
    });

    tbody.prepend(row);
    selectPayment(row);
    addActivity('15:02:00', 'Payment submitted for approval', 'Jamie Stone · Employee');
  }

  function initPolicyBuilder() {
    const builder = document.getElementById('policy-builder');
    if (!builder) return;

    const newRuleDialog = document.getElementById('new-rule-dialog');
    document.getElementById('new-rule-button')?.addEventListener('click', () => newRuleDialog?.showModal());

    const conditionRow = document.getElementById('condition-token-row');
    conditionRow?.addEventListener('click', (event) => {
      const remove = event.target.closest('.token-remove');
      if (!remove) return;
      remove.closest('.condition-token')?.remove();
      normalizeConditionLogic();
    });

    document.getElementById('add-condition')?.addEventListener('click', () => {
      const field = document.getElementById('condition-field')?.value || 'amount';
      const operator = document.getElementById('condition-operator')?.value || '>';
      const value = document.getElementById('condition-value')?.value.trim() || '0';
      addConditionToken(`${field} ${operator} ${value}`);
    });

    const approverRow = document.getElementById('approver-token-row');
    approverRow?.addEventListener('click', (event) => {
      const action = event.target.closest('button');
      if (!action) return;
      const token = action.closest('.approver-token');
      if (!token) return;

      const roles = getApproverRoles();
      const index = roles.indexOf(token.dataset.roleName);
      if (action.hasAttribute('data-remove-approver')) roles.splice(index, 1);
      if (action.dataset.move === 'left' && index > 0) [roles[index - 1], roles[index]] = [roles[index], roles[index - 1]];
      if (action.dataset.move === 'right' && index < roles.length - 1) [roles[index + 1], roles[index]] = [roles[index], roles[index + 1]];
      renderApprovers(roles);
    });

    document.getElementById('add-approver')?.addEventListener('click', () => {
      const select = document.getElementById('approver-select');
      if (!select) return;
      const roles = getApproverRoles();
      if (!roles.includes(select.value)) roles.push(select.value);
      renderApprovers(roles);
    });

    document.getElementById('scope-select')?.addEventListener('change', syncPolicyFooter);
    document.getElementById('status-select')?.addEventListener('change', syncPolicyFooter);

    document.getElementById('save-policy')?.addEventListener('click', (event) => {
      const button = event.currentTarget;
      const original = button.textContent;
      button.textContent = 'Saved';
      window.setTimeout(() => { button.textContent = original; }, 1100);
    });

    document.getElementById('delete-rule')?.addEventListener('click', () => {
      const status = document.getElementById('rule-status');
      if (status) {
        status.textContent = 'Inactive';
        status.className = 'status status-neutral';
      }
      const statusSelect = document.getElementById('status-select');
      if (statusSelect) statusSelect.value = 'Inactive';
      syncPolicyFooter();
    });

    renderApprovers(getApproverRoles());
    syncPolicyFooter();
  }

  function addConditionToken(expression) {
    const row = document.getElementById('condition-token-row');
    if (!row) return;
    row.insertAdjacentHTML('beforeend', `<span class="rule-token condition-token" data-expression="${escapeAttribute(expression)}">${escapeHtml(expression)} <button type="button" class="token-remove" aria-label="Remove condition">×</button></span>`);
    normalizeConditionLogic();
  }

  function normalizeConditionLogic() {
    const row = document.getElementById('condition-token-row');
    if (!row) return;
    row.querySelectorAll('.logic-word').forEach((node) => node.remove());
    const tokens = [...row.querySelectorAll('.condition-token')];
    tokens.forEach((token, index) => {
      if (index > 0) token.insertAdjacentHTML('beforebegin', '<span class="logic-word">AND</span>');
    });
  }

  function getApproverRoles() {
    return [...document.querySelectorAll('#approver-token-row .approver-token')].map((token) => token.dataset.roleName).filter(Boolean);
  }

  function renderApprovers(roles) {
    const row = document.getElementById('approver-token-row');
    if (!row) return;

    let html = '<span class="rule-token keyword">THEN require</span>';
    roles.forEach((role, index) => {
      if (index > 0) html += '<span class="arrow-separator">→</span>';
      const left = index > 0 ? `<button type="button" data-move="left" aria-label="Move ${escapeAttribute(role)} earlier">${ARROW_LEFT}</button>` : '';
      const right = index < roles.length - 1 ? `<button type="button" data-move="right" aria-label="Move ${escapeAttribute(role)} later">${ARROW_RIGHT}</button>` : '';
      html += `<span class="approver-token" data-role-name="${escapeAttribute(role)}"><strong>${index + 1}</strong> · ${escapeHtml(role)} <span class="approver-actions">${left}${right}<button type="button" data-remove-approver aria-label="Remove ${escapeAttribute(role)}">×</button></span></span>`;
    });
    row.innerHTML = html;
  }

  function syncPolicyFooter() {
    const scope = document.getElementById('scope-select')?.value || 'International wires';
    const status = document.getElementById('status-select')?.value || 'Active';
    setText('policy-scope-label', scope);

    const footerStatus = document.getElementById('policy-footer-status');
    const headerStatus = document.getElementById('rule-status');
    if (footerStatus) {
      footerStatus.textContent = status;
      footerStatus.style.color = status === 'Active' ? 'var(--success)' : 'var(--secondary)';
    }
    if (headerStatus) {
      headerStatus.textContent = status;
      headerStatus.className = status === 'Active' ? 'status status-success' : 'status status-neutral';
    }
  }

  function formatCurrency(amount, currency) {
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: currency === 'JPY' ? 0 : 2 }).format(amount);
    } catch {
      return `${currency} ${amount.toFixed(2)}`;
    }
  }

  function formatNumber(amount, currency) {
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: currency === 'JPY' ? 0 : 2, maximumFractionDigits: currency === 'JPY' ? 0 : 2 }).format(amount);
  }

  function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value ?? '';
  }

  function safeStorageGet(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  }

  function safeStorageSet(key, value) {
    try { localStorage.setItem(key, value); } catch {}
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replace(/`/g, '&#96;');
  }
})();
