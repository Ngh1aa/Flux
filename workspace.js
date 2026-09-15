(() => {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    initWorkspaceNavigation();
    initAccountsPage();
    initCardsPage();
    initTeamPage();
    initExpensesPage();
    initReportsPage();
    initPrototypeDialogs();
    initCopyActions();
  });

  function initWorkspaceNavigation() {
    document.body.classList.add('flux-enhanced');
    const route = { accounts: 'accounts.html', cards: 'cards.html', team: 'team.html', expenses: 'expenses.html', reports: 'reports.html' }[document.body.dataset.page];
    if (!route) return;
    document.querySelectorAll('.nav-link').forEach((link) => {
      const active = link.getAttribute('href') === route;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }

  function initAccountsPage() {
    const rows = [...document.querySelectorAll('.account-row')];
    if (!rows.length) return;
    rows.forEach((row) => bindSelectableRow(row, rows, () => renderAccount(row)));
    renderAccount(rows.find((row) => row.getAttribute('aria-selected') === 'true') || rows[0]);
  }

  function renderAccount(row) {
    if (!row) return;
    setText('account-pane-code', row.dataset.currency); setText('account-pane-title', row.dataset.accountName); setText('account-pane-balance', row.dataset.available); setText('account-pane-reserved', row.dataset.reserved); setText('account-pane-iban', row.dataset.iban); setText('account-pane-type', row.dataset.accountType); setText('account-pane-settlement', row.dataset.settlement); setText('account-pane-country', row.dataset.country);
  }

  function initCardsPage() {
    const rows = [...document.querySelectorAll('.card-row')];
    if (!rows.length) return;
    rows.forEach((row) => bindSelectableRow(row, rows, () => renderCard(row)));
    renderCard(rows.find((row) => row.getAttribute('aria-selected') === 'true') || rows[0]);
    document.getElementById('freeze-card')?.addEventListener('click', () => {
      const row = rows.find((item) => item.getAttribute('aria-selected') === 'true');
      if (!row) return;
      const currentlyFrozen = row.dataset.status === 'Frozen';
      row.dataset.status = currentlyFrozen ? 'Active' : 'Frozen';
      const badge = row.querySelector('.status');
      if (badge) { badge.textContent = row.dataset.status; badge.className = currentlyFrozen ? 'status status-success' : 'status status-neutral'; }
      renderCard(row);
      showToast(currentlyFrozen ? `Card •••• ${row.dataset.last4} restored.` : `Card •••• ${row.dataset.last4} frozen immediately.`);
    });
  }

  function renderCard(row) {
    if (!row) return;
    setText('card-pane-holder', row.dataset.holder); setText('card-pane-last4', row.dataset.last4); setText('card-pane-type', row.dataset.cardType); setText('card-pane-owner', row.dataset.holder); setText('card-pane-monthly', row.dataset.monthly); setText('card-pane-limit', row.dataset.limit); setText('card-pane-department', row.dataset.department); setText('card-pane-program', row.dataset.program);
    const status = document.getElementById('card-pane-status');
    if (status) { status.textContent = row.dataset.status; status.className = row.dataset.status === 'Active' ? 'status status-success' : row.dataset.status === 'Frozen' ? 'status status-neutral' : 'status status-pending'; }
    const button = document.getElementById('freeze-card');
    if (button) button.textContent = row.dataset.status === 'Frozen' ? 'Unfreeze card' : 'Freeze card';
    const spend = Number(row.dataset.monthlyRaw || 0); const limit = Number(row.dataset.limitRaw || 1); const fill = document.getElementById('card-limit-fill');
    if (fill) fill.style.width = `${Math.min(100, Math.max(0, (spend / limit) * 100))}%`;
  }

  function initTeamPage() {
    const rows = [...document.querySelectorAll('.team-row')];
    if (!rows.length) return;
    rows.forEach((row) => bindSelectableRow(row, rows, () => renderMember(row)));
    renderMember(rows.find((row) => row.getAttribute('aria-selected') === 'true') || rows[0]);
  }

  function renderMember(row) {
    if (!row) return;
    setText('member-pane-initials', row.dataset.initials); setText('member-pane-name', row.dataset.name); setText('member-pane-email', row.dataset.email); setText('member-pane-role', row.dataset.role); setText('member-pane-region', row.dataset.region); setText('member-pane-last-seen', row.dataset.lastSeen);
    const status = document.getElementById('member-pane-status');
    if (status) { status.textContent = row.dataset.status; status.className = row.dataset.status === 'Active' ? 'status status-success' : 'status status-pending'; }
    document.querySelectorAll('[data-permission]').forEach((dot) => { const permission = dot.dataset.permission; const granted = (row.dataset.permissions || '').split(',').includes(permission); dot.classList.toggle('on', granted); dot.setAttribute('aria-label', `${permission}: ${granted ? 'granted' : 'not granted'}`); });
  }

  function initExpensesPage() {
    const rows = [...document.querySelectorAll('.expense-row')];
    if (!rows.length) return;
    rows.forEach((row) => bindSelectableRow(row, rows, () => renderExpense(row)));
    renderExpense(rows.find((row) => row.getAttribute('aria-selected') === 'true') || rows[0]);
    const filters = [...document.querySelectorAll('[data-expense-filter]')]; const search = document.getElementById('expense-search');
    filters.forEach((button) => button.addEventListener('click', () => { filters.forEach((item) => item.classList.toggle('active', item === button)); applyExpenseFilters(); }));
    search?.addEventListener('input', applyExpenseFilters);
    document.getElementById('approve-expense')?.addEventListener('click', () => {
      const row = rows.find((item) => item.getAttribute('aria-selected') === 'true');
      if (!row || row.dataset.status === 'approved') return;
      row.dataset.status = 'approved'; row.dataset.statusLabel = 'Approved';
      const badge = row.querySelector('.status'); if (badge) { badge.textContent = 'Approved'; badge.className = 'status status-success'; }
      renderExpense(row); applyExpenseFilters(); showToast(`${row.dataset.merchant} approved and queued for accounting sync.`);
    });
  }

  function applyExpenseFilters() {
    const active = document.querySelector('[data-expense-filter].active')?.dataset.expenseFilter || 'all'; const query = (document.getElementById('expense-search')?.value || '').trim().toLowerCase(); let visible = 0;
    document.querySelectorAll('.expense-row').forEach((row) => { const matchesFilter = active === 'all' || row.dataset.status === active; const haystack = `${row.dataset.merchant} ${row.dataset.owner} ${row.dataset.category} ${row.dataset.amount}`.toLowerCase(); const show = matchesFilter && (!query || haystack.includes(query)); row.classList.toggle('hidden', !show); if (show) visible += 1; });
    document.getElementById('expense-empty-state')?.classList.toggle('hidden', visible !== 0);
  }

  function renderExpense(row) {
    if (!row) return;
    setText('expense-pane-id', row.dataset.expenseId); setText('expense-pane-merchant', row.dataset.merchant); setText('expense-pane-amount', row.dataset.amount); setText('expense-pane-owner', row.dataset.owner); setText('expense-pane-category', row.dataset.category); setText('expense-pane-date', row.dataset.date); setText('expense-pane-card', row.dataset.card); setText('receipt-merchant', row.dataset.merchant); setText('receipt-total', row.dataset.amount);
    const status = document.getElementById('expense-pane-status');
    if (status) { const label = row.dataset.statusLabel || row.dataset.status; status.textContent = label; status.className = row.dataset.status === 'approved' ? 'status status-success' : row.dataset.status === 'missing' ? 'status status-danger' : 'status status-pending'; }
    const button = document.getElementById('approve-expense');
    if (button) { button.disabled = row.dataset.status === 'approved' || row.dataset.status === 'missing'; button.textContent = row.dataset.status === 'approved' ? 'Approved' : row.dataset.status === 'missing' ? 'Awaiting receipt' : 'Approve expense'; }
    document.querySelectorAll('[data-review-step]').forEach((step) => step.className = 'review-step');
    document.querySelector('[data-review-step="receipt"]')?.classList.add(row.dataset.status === 'missing' ? 'current' : 'done');
    if (row.dataset.status !== 'missing') document.querySelector('[data-review-step="policy"]')?.classList.add('done');
    const coding = document.querySelector('[data-review-step="coding"]');
    if (row.dataset.status === 'approved') coding?.classList.add('done'); else if (row.dataset.status === 'review') coding?.classList.add('current');
    if (row.dataset.status === 'approved') document.querySelector('[data-review-step="approval"]')?.classList.add('done');
  }

  function initReportsPage() {
    const ranges = [...document.querySelectorAll('[data-report-range]')];
    if (!ranges.length) return;
    const data = { '30d': { spend: '$482,940', delta: '+6.8%', fx: '$4,812', exceptions: '08', label: '30-day operating window' }, '90d': { spend: '$1,371,280', delta: '+3.1%', fx: '$13,906', exceptions: '21', label: '90-day operating window' }, ytd: { spend: '$4,826,410', delta: '-1.4%', fx: '$48,203', exceptions: '63', label: 'Year-to-date operating window' } };
    ranges.forEach((button) => button.addEventListener('click', () => { ranges.forEach((item) => item.classList.toggle('active', item === button)); const values = data[button.dataset.reportRange] || data['30d']; setText('report-total-spend', values.spend); setText('report-spend-delta', values.delta); setText('report-fx-cost', values.fx); setText('report-exceptions', values.exceptions); setText('report-range-label', values.label); showToast(`Report range changed to ${button.textContent.trim()}.`); }));
    document.getElementById('export-report')?.addEventListener('click', () => showToast('CSV export prepared for the current report window.'));
  }

  function initPrototypeDialogs() {
    document.querySelectorAll('[data-dialog-open]').forEach((button) => button.addEventListener('click', () => document.getElementById(button.dataset.dialogOpen)?.showModal()));
    document.querySelectorAll('dialog form[data-prototype-submit]').forEach((form) => form.addEventListener('submit', (event) => { if (event.submitter?.value === 'cancel') return; event.preventDefault(); form.closest('dialog')?.close(); showToast(form.dataset.prototypeSubmit || 'Saved.'); }));
  }

  function initCopyActions() {
    document.querySelectorAll('[data-copy-target]').forEach((button) => button.addEventListener('click', async () => { const target = document.getElementById(button.dataset.copyTarget); const value = target?.textContent?.trim(); if (!value) return; try { await navigator.clipboard.writeText(value); } catch {} showToast('Account detail copied.'); }));
  }

  function bindSelectableRow(row, rows, render) {
    row.addEventListener('click', () => select()); row.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select(); } });
    function select() { rows.forEach((item) => item.setAttribute('aria-selected', String(item === row))); render(); }
  }

  function setText(id, value) { const node = document.getElementById(id); if (node) node.textContent = value ?? ''; }
  let toastTimer;
  function showToast(message) { let toast = document.getElementById('flux-toast'); if (!toast) { toast = document.createElement('div'); toast.id = 'flux-toast'; toast.className = 'flux-toast'; toast.setAttribute('role', 'status'); toast.setAttribute('aria-live', 'polite'); document.body.appendChild(toast); } toast.textContent = message; toast.classList.add('show'); window.clearTimeout(toastTimer); toastTimer = window.setTimeout(() => toast.classList.remove('show'), 2400); }
})();
