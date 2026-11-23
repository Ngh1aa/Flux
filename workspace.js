/* Flux workspace pages: accounts, cards, team, expenses and reports.
   Every change goes through Flux.store (session only, simulated latency). */
(() => {
  'use strict';

  const F = window.Flux;
  const { store, fmt, escapeHtml: esc, setText } = F;

  F.onReady(() => {
    const page = document.body.dataset.page;
    if (page === 'accounts') initAccounts();
    if (page === 'team') initTeam();
    if (page === 'expenses') initExpenses();
    if (page === 'reports') initReports();
    initCopyActions();
  });

  /* ---------- shared bits ---------- */
  function amountError(raw, currency, { max } = {}) {
    const amount = F.parseAmount(raw);
    if (!raw) return 'Enter an amount.';
    if (Number.isNaN(amount)) return 'Use digits only, with up to 2 decimals.';
    if (amount <= 0) return 'Amount must be greater than zero.';
    if ((currency === 'JPY' || currency === 'VND') && !Number.isInteger(amount)) return `${currency} amounts have no decimals.`;
    if (max && amount > max) return `Above the ${currency} ${fmt.whole(max)} limit.`;
    return '';
  }

  function paneMissing(missingEl, bodyEl, { empty, id, noun, onShowFirst }) {
    bodyEl.hidden = true;
    missingEl.hidden = false;
    missingEl.innerHTML = empty
      ? F.stateBlock({ title: 'Nothing selected', body: `${noun} details appear here once one exists.` })
      : F.stateBlock({ icon: 'missing', title: `${noun} ${id} not found`, body: 'It may have been removed, or the link is out of date.', action: `Show first ${noun.toLowerCase()}` });
    missingEl.querySelector('[data-state-action]')?.addEventListener('click', onShowFirst);
  }

  function paneShow(missingEl, bodyEl) { bodyEl.hidden = false; missingEl.hidden = true; }

  function listEmpty(host, { all, rows, emptyTitle, emptyBody, emptyAction, onEmptyAction, filteredTitle, onClear }) {
    if (!all) {
      host.innerHTML = F.stateBlock({ title: emptyTitle, body: emptyBody, action: emptyAction });
      host.querySelector('[data-state-action]')?.addEventListener('click', onEmptyAction);
    } else if (!rows) {
      host.innerHTML = F.stateBlock({ icon: 'search', title: filteredTitle, body: 'Adjust the filters or search query.', action: 'Clear filters' });
      host.querySelector('[data-state-action]')?.addEventListener('click', onClear);
    } else host.innerHTML = '';
  }

  function setSegment(buttons, attr, value) { buttons.forEach((b) => b.classList.toggle('active', b.dataset[attr] === value)); }

  function initCopyActions() {
    document.querySelectorAll('[data-copy-target]').forEach((button) => button.addEventListener('click', async () => {
      const value = document.getElementById(button.dataset.copyTarget)?.textContent?.trim();
      if (!value) return;
      try { await navigator.clipboard.writeText(value); F.toast('Account detail copied.'); } catch { F.toast('Copy is blocked in this browser. Select the text to copy it.'); }
    }));
  }

  /* =====================================================================
     Accounts
     ===================================================================== */
  function initAccounts() {
    const tbody = document.getElementById('accounts-body');
    const pane = document.getElementById('account-pane');
    const txBody = document.getElementById('tx-body');
    const txSearch = document.getElementById('tx-search');
    const txButtons = [...document.querySelectorAll('[data-tx-filter]')];
    let selectedId = F.getParam('id') || store.list('accounts')[0]?.id;
    let openTxId = null;

    const TX_STATUS = { posted: ['Posted', 'status status-neutral'], pending: ['Pending', 'status status-pending'], scheduled: ['Scheduled', 'status status-pending'], cancelled: ['Cancelled', 'status status-danger'] };

    function renderMetrics() {
      const accounts = store.list('accounts');
      const clock = F.now();
      setText('metric-available', `VND ${fmt.whole(accounts.reduce((s, a) => s + a.available, 0))}`);
      setText('metric-reserved', `VND ${fmt.whole(accounts.reduce((s, a) => s + a.reserved, 0))}`);
      const credits = store.list('transactions').filter((t) => t.direction === 'credit' && t.status === 'posted' && clock - F.parseDate(t.date) < 86400000 && clock - F.parseDate(t.date) >= 0);
      setText('metric-incoming', `VND ${fmt.whole(credits.reduce((s, t) => s + t.amount, 0))}`);
      setText('metric-incoming-note', `${credits.length} ${credits.length === 1 ? 'credit' : 'credits'} posted`);
      setText('metric-scheduled', fmt.pad2(store.list('transactions').filter((t) => t.status === 'scheduled' && t.direction === 'debit').length));
    }

    function renderList() {
      renderMetrics();
      tbody.innerHTML = store.list('accounts').map((a) => `<tr tabindex="0" data-id="${esc(a.id)}"><td><span class="currency-tag">${esc(a.id)}</span></td><td><span class="table-strong">${esc(a.name)}</span><span class="subcopy">${esc(a.purpose)}</span></td><td class="right mono">${fmt.number(a.available, a.currency)}</td><td class="right mono">${fmt.number(a.reserved, a.currency)}</td><td>${esc(a.country)}</td><td><span class="mono">${fmt.time(a.lastActivity)}</span><span class="subcopy">${fmt.day(a.lastActivity)}</span></td></tr>`).join('');
      F.markSelected(tbody, selectedId);
      renderPane();
    }

    function renderPane() {
      const account = store.find('accounts', selectedId);
      const missing = document.getElementById('account-not-found');
      const body = document.getElementById('account-pane-body');
      const panel = document.getElementById('tx-panel');
      if (!account) {
        panel.hidden = true;
        paneMissing(missing, body, { empty: !store.list('accounts').length, id: selectedId, noun: 'Account', onShowFirst: () => select(store.list('accounts')[0].id) });
        return;
      }
      panel.hidden = false;
      paneShow(missing, body);
      setText('account-pane-code', account.id);
      setText('account-pane-title', account.name);
      setText('account-pane-balance', fmt.money(account.available, account.currency));
      setText('account-pane-reserved', fmt.money(account.reserved, account.currency));
      setText('account-pane-iban', account.iban);
      setText('account-pane-type', account.rails);
      setText('account-pane-country', account.country);
      setText('account-pane-settlement', account.settlement);
      const accounts = store.list('accounts');
      const total = accounts.reduce((s, a) => s + a.available, 0) || 1;
      const shares = accounts.map((a) => ({ code: a.id, share: a.available / total })).sort((x, y) => y.share - x.share).slice(0, 4);
      const max = shares[0]?.share || 1;
      document.getElementById('liquidity-bars').innerHTML = shares.map((s) => `<div class="balance-row"><span class="code">${esc(s.code)}</span><div class="balance-track"><div class="balance-fill" style="width:${Math.max(4, (s.share / max) * 88).toFixed(1)}%"></div></div><span class="balance-value">${(s.share * 100).toFixed(1)}%</span></div>`).join('');
      const scheduled = store.list('transactions').filter((t) => t.accountId === account.id && t.status === 'scheduled' && t.direction === 'debit');
      // Petty cash runs low first; say so before an advance has to wait for cash.
      const lowCash = account.id === 'CASH' && account.available < 10000000;
      document.getElementById('treasury-signal').innerHTML = lowCash
        ? `<strong>Cash check:</strong> petty cash is below VND 10,000,000. Top it up from Vietcombank operating before the next advance.`
        : `<strong>Cash check:</strong> ${scheduled.length ? `${scheduled.length} scheduled ${scheduled.length === 1 ? 'transfer is' : 'transfers are'} reserved from this account.` : 'The balance covers approved requests waiting for payout.'} Reserved money cannot be moved.`;
      renderTransactions(account);
    }

    function renderTransactions(account) {
      const filter = document.querySelector('[data-tx-filter].active')?.dataset.txFilter || 'all';
      const q = (txSearch.value || '').trim().toLowerCase();
      const all = store.list('transactions').filter((t) => t.accountId === account.id).sort((a, b) => (a.date < b.date ? 1 : -1));
      const rows = all.filter((t) => {
        const ok = filter === 'all' || (filter === 'open' ? ['pending', 'scheduled'].includes(t.status) : t.direction === filter);
        return ok && (!q || `${t.description} ${t.counterparty} ${t.id} ${t.memo || ''}`.toLowerCase().includes(q));
      });
      setText('tx-title', `${account.name} transactions`);
      setText('tx-sub', `${all.length} ${all.length === 1 ? 'entry' : 'entries'}, newest first`);
      txBody.innerHTML = rows.map((t) => {
        const [label, cls] = TX_STATUS[t.status] || TX_STATUS.posted;
        const sign = t.direction === 'credit' ? '+' : '−';
        return `<tr tabindex="0" data-id="${esc(t.id)}"><td><span class="mono">${fmt.day(t.date)}</span><span class="subcopy mono">${fmt.time(t.date)}</span></td><td><span class="table-strong">${esc(t.description)}</span><span class="subcopy">${esc(t.counterparty)}</span></td><td><span class="${cls}">${label}</span></td><td class="right mono tx-amount ${t.direction}">${sign}${fmt.number(t.amount, account.currency)}</td></tr>`;
      }).join('');
      listEmpty(document.getElementById('tx-empty'), {
        all: all.length, rows: rows.length,
        emptyTitle: 'No transactions yet', emptyBody: 'Credits, debits and transfers for this account appear here.', emptyAction: 'Move money', onEmptyAction: openMove,
        filteredTitle: 'No matching transactions', onClear: () => { txSearch.value = ''; setSegment(txButtons, 'txFilter', 'all'); renderPane(); }
      });
    }

    function select(id, user) {
      selectedId = id;
      F.setParam('id', id);
      F.markSelected(tbody, id);
      renderPane();
      F.revealPane(pane, user);
    }

    /* Transaction detail */
    function openTx(id) {
      const t = store.find('transactions', id);
      if (!t) return;
      openTxId = id;
      const account = store.find('accounts', t.accountId);
      const [label] = TX_STATUS[t.status] || TX_STATUS.posted;
      setText('tx-dialog-kicker', `${account?.name || t.accountId}, ${t.id}`);
      setText('tx-dialog-title', t.description);
      const rows = [['Status', label], ['Date', fmt.dateTime(t.date)], ['Direction', t.direction === 'credit' ? 'Money in' : 'Money out'], ['Amount', fmt.money(t.amount, account?.currency)], ['Counterparty', t.counterparty]];
      if (t.memo) rows.push(['Memo', t.memo]);
      if (t.transferId) rows.push(['Transfer', t.transferId]);
      document.getElementById('tx-dialog-details').innerHTML = rows.map(([k, v]) => `<li><span>${esc(k)}</span><strong>${esc(v)}</strong></li>`).join('');
      document.getElementById('tx-cancel').hidden = !(t.status === 'scheduled' && t.transferId);
      F.openDialog('tx-dialog');
    }

    document.getElementById('tx-cancel').addEventListener('click', () => {
      const t = store.find('transactions', openTxId);
      if (!t) return;
      document.getElementById('tx-dialog').close();
      F.confirmAction({
        kicker: 'Scheduled transfer',
        title: `Cancel ${t.transferId}?`,
        body: 'The reserved amount returns to the source account. The transfer will not run.',
        confirmLabel: 'Cancel transfer',
        busyLabel: 'Cancelling…',
        action: () => store.commit((s) => {
          const legs = s.transactions.filter((x) => x.transferId === t.transferId);
          const debit = legs.find((x) => x.direction === 'debit');
          if (!debit || debit.status !== 'scheduled') throw new F.FluxError('This transfer is no longer scheduled.');
          legs.forEach((x) => { x.status = 'cancelled'; });
          const from = s.accounts.find((a) => a.id === debit.accountId);
          from.available += debit.amount;
          from.reserved = Math.max(0, from.reserved - debit.amount);
        }).then(() => { renderList(); F.toast(`${t.transferId} cancelled. Reserved funds released.`); })
      });
    });

    /* Move money */
    const moveForm = document.getElementById('move-money-form');
    function accountOptions() {
      return store.list('accounts').map((a) => `<option value="${esc(a.id)}">${esc(a.name)}, ${fmt.money(a.available, a.currency)}</option>`).join('');
    }
    function openMove() {
      moveForm.reset();
      moveForm.elements.from.innerHTML = accountOptions();
      moveForm.elements.to.innerHTML = accountOptions();
      const accounts = store.list('accounts');
      moveForm.elements.from.value = store.find('accounts', selectedId) ? selectedId : accounts[0].id;
      moveForm.elements.to.value = accounts.find((a) => a.id !== moveForm.elements.from.value)?.id;
      moveForm.elements.date.value = F.isoDate();
      moveForm.elements.date.min = F.isoDate();
      syncMove();
      F.openDialog('move-money-dialog');
    }
    function syncMove() {
      const from = store.find('accounts', moveForm.elements.from.value);
      const to = store.find('accounts', moveForm.elements.to.value);
      setText('move-prefix', from?.currency || '');
      const amount = F.parseAmount(moveForm.elements.amount.value);
      const preview = document.getElementById('move-preview');
      if (!from || !to || !(amount > 0)) { preview.textContent = 'Enter an amount to see the transfer.'; return; }
      const scheduled = moveForm.elements.date.value && moveForm.elements.date.value > F.isoDate();
      preview.innerHTML = `<strong class="mono">${fmt.money(amount, from.currency)}</strong> moves from ${esc(from.name)} to ${esc(to.name)}. ${scheduled ? 'The money is reserved until the transfer date.' : 'Recorded today.'}`;
    }
    ['from', 'to', 'amount', 'date'].forEach((n) => moveForm.elements[n].addEventListener(n === 'amount' ? 'input' : 'change', syncMove));
    F.bindForm(moveForm, {
      busyLabel: 'Recording…',
      validate(v) {
        const e = {};
        const from = store.find('accounts', v.from);
        if (v.from === v.to) e.to = 'Choose a different destination account.';
        const amountErr = amountError(v.amount, from?.currency);
        if (amountErr) e.amount = amountErr;
        else if (from && F.parseAmount(v.amount) > from.available) e.amount = `Exceeds the ${fmt.money(from.available, from.currency)} available. Reserved funds cannot move.`;
        if (!v.date) e.date = 'Choose a transfer date.';
        else if (v.date < F.isoDate()) e.date = 'The transfer date cannot be in the past.';
        return e;
      },
      submit(v) {
        return store.commit((s) => {
          const from = s.accounts.find((a) => a.id === v.from);
          const to = s.accounts.find((a) => a.id === v.to);
          const amount = F.parseAmount(v.amount);
          const converted = Math.round(amount * (s.fx[from.currency] / s.fx[to.currency]) * 100) / 100;
          const scheduled = v.date > F.isoDate();
          const status = scheduled ? 'scheduled' : 'posted';
          const when = scheduled ? `${v.date}T09:00:00` : F.isoLocal();
          const transferId = `TRN-${4101 + new Set(s.transactions.filter((t) => t.transferId).map((t) => t.transferId)).size}`;
          const base = Math.max(...s.transactions.map((t) => Number(t.id.replace(/\D/g, ''))));
          from.available -= amount;
          if (scheduled) from.reserved += amount; else to.available += converted;
          from.lastActivity = F.isoLocal();
          if (!scheduled) to.lastActivity = F.isoLocal();
          s.transactions.unshift(
            { id: `TX-${base + 1}`, accountId: from.id, date: when, description: `Transfer to ${to.name}`, counterparty: 'Internal transfer', direction: 'debit', amount, status, transferId, memo: v.memo },
            { id: `TX-${base + 2}`, accountId: to.id, date: when, description: `Transfer from ${from.name}`, counterparty: 'Internal transfer', direction: 'credit', amount: converted, status, transferId, memo: v.memo }
          );
          return { transferId, scheduled, from, amount };
        }).then((r) => {
          renderList();
          F.toast(r.scheduled
            ? `${r.transferId} scheduled. ${fmt.money(r.amount, r.from.currency)} is reserved until the transfer date.`
            : `${r.transferId} completed. Funds are available in the destination account.`);
        });
      }
    });

    /* Receive details + statement */
    document.getElementById('add-funds').addEventListener('click', () => {
      const a = store.find('accounts', selectedId) || store.list('accounts')[0];
      document.getElementById('receive-details').innerHTML = [['Account', a.name], ['Account holder', store.state.meta.workspace], ['Account number', a.iban], ['Transfer methods', a.rails], ['Branch', a.country]].map(([k, v]) => `<li><span>${esc(k)}</span><strong>${esc(v)}</strong></li>`).join('');
      setText('receive-title', `Receiving details, ${a.name}`);
      F.openDialog('receive-dialog');
    });
    document.getElementById('copy-receive').addEventListener('click', async () => {
      const text = [...document.querySelectorAll('#receive-details li')].map((li) => `${li.children[0].textContent}: ${li.children[1].textContent}`).join('\n');
      try { await navigator.clipboard.writeText(text); F.toast('Receiving details copied.'); } catch { F.toast('Copy is blocked in this browser. Select the text to copy it.'); }
    });
    document.getElementById('export-statement').addEventListener('click', () => {
      const a = store.find('accounts', selectedId);
      if (!a) { F.toast('Select an account to download its statement.'); return; }
      const rows = store.list('transactions').filter((t) => t.accountId === a.id).sort((x, y) => (x.date < y.date ? 1 : -1));
      F.downloadCsv(`flux-statement-${a.id}-${F.isoDate()}.csv`, [['Transaction', 'Date', 'Description', 'Counterparty', 'Direction', 'Status', `Amount (${a.currency})`]].concat(rows.map((t) => [t.id, F.isoLocal(F.parseDate(t.date)).replace('T', ' '), t.description, t.counterparty, t.direction, t.status, t.amount.toFixed(['JPY', 'VND'].includes(a.currency) ? 0 : 2)])));
      F.toast(`Statement for ${a.name} generated in your browser (${rows.length} entries).`);
    });

    document.getElementById('open-move-money').addEventListener('click', openMove);
    F.bindRows(tbody, select);
    F.bindRows(txBody, openTx);
    txSearch.addEventListener('input', renderPane);
    txButtons.forEach((b) => b.addEventListener('click', () => { setSegment(txButtons, 'txFilter', b.dataset.txFilter); renderPane(); }));
    F.loadView({ region: document.getElementById('accounts-region'), tbody, columns: 6, noun: 'accounts', render: renderList });
  }

  /* =====================================================================
     Team
     ===================================================================== */
  function initTeam() {
    const tbody = document.getElementById('team-body');
    const pane = document.getElementById('member-pane');
    const search = document.getElementById('member-search');
    const roleFilter = document.getElementById('role-filter');
    let selectedId = F.getParam('id');
    const AREAS = [['accounts', 'Funds'], ['payments', 'Requests'], ['cards', 'Settlements'], ['team', 'Team']];
    const LEVELS = [['view', 'View'], ['create', 'Create'], ['approve', 'Approve'], ['admin', 'Admin']];
    const initials = (name) => name.split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase();
    const perms = (role) => store.state.roleTemplates[role] || [];

    function rows() {
      const q = (search.value || '').trim().toLowerCase();
      const role = roleFilter.value;
      return store.list('members').filter((m) => (role === 'all' || m.role === role) && (!q || `${m.name} ${m.email} ${m.team}`.toLowerCase().includes(q)));
    }

    function render() {
      const all = store.list('members');
      const active = all.filter((m) => m.status === 'Active');
      setText('metric-members', fmt.pad2(active.length));
      setText('metric-members-note', `Across ${new Set(active.map((m) => m.team)).size} functional teams`);
      const approvers = active.filter((m) => ['Team lead', 'Accountant', 'Director'].includes(m.role));
      setText('metric-approvers', fmt.pad2(approvers.length));
      setText('metric-approvers-note', `${approvers.filter((m) => m.role === 'Director').length} with final approval`);
      setText('metric-roles', fmt.pad2(new Set(all.map((m) => m.role)).size));
      setText('metric-invites', fmt.pad2(all.filter((m) => m.status === 'Invited').length));
      const list = rows();
      tbody.innerHTML = list.map((m) => `<tr tabindex="0" data-id="${esc(m.id)}"><td><div class="identity-cell"><span class="avatar-box" aria-hidden="true">${esc(initials(m.name))}</span><div class="identity-copy"><strong>${esc(m.name)}</strong><span>${esc(m.email)}</span></div></div></td><td>${esc(m.role)}</td><td>${esc(m.team)}</td><td>${esc(m.region)}</td><td><span class="status ${m.status === 'Active' ? 'status-success' : 'status-pending'}">${esc(m.status)}</span></td><td class="mono">${m.lastSeen ? fmt.time(m.lastSeen) : '—'}</td></tr>`).join('');
      listEmpty(document.getElementById('team-empty'), {
        all: all.length, rows: list.length,
        emptyTitle: 'No team members', emptyBody: 'Invite people with a least-privilege role. You stay the workspace owner.', emptyAction: 'Invite member', onEmptyAction: openInvite,
        filteredTitle: 'No matching members', onClear: () => { search.value = ''; roleFilter.value = 'all'; render(); }
      });
      if (!selectedId && list.length) selectedId = list[0].id;
      F.markSelected(tbody, selectedId);
      renderPane();
    }

    function duty(m) {
      // Vietnamese names start with the family name, so the note uses the full name.
      const first = m.name;
      return {
        'Team lead': `<strong>First approval.</strong> ${esc(first)} approves requests from their team but cannot pay out or change the rules.`,
        Director: `<strong>Final approval.</strong> ${esc(first)} approves large requests and manages funds and team access. Rules still block approving their own requests.`,
        Accountant: `<strong>Checks and pays out.</strong> ${esc(first)} checks receipts and new vendors and pays out approved requests.`,
        Employee: `<strong>Own requests only.</strong> ${esc(first)} creates advances, reimbursements and vendor payments and settles their receipts.`,
        Admin: `<strong>Access administrator.</strong> ${esc(first)} manages who can use Flux but cannot approve or pay out.`
      }[m.role] || '';
    }

    function renderPane() {
      const m = store.find('members', selectedId);
      const missing = document.getElementById('member-not-found');
      const body = document.getElementById('member-pane-body');
      if (!m) { paneMissing(missing, body, { empty: !store.list('members').length, id: selectedId, noun: 'Member', onShowFirst: () => select(store.list('members')[0].id) }); return; }
      paneShow(missing, body);
      setText('member-pane-initials', initials(m.name));
      setText('member-pane-name', m.name);
      setText('member-pane-email', m.email);
      setText('member-pane-role', m.role);
      setText('member-pane-team', m.team);
      setText('member-pane-region', m.region);
      setText('member-pane-last-seen', m.status === 'Invited' ? `Invite recorded ${fmt.dateTime(m.invitedAt)}` : fmt.dateTime(m.lastSeen));
      const status = document.getElementById('member-pane-status');
      status.textContent = m.status;
      status.className = `status ${m.status === 'Active' ? 'status-success' : 'status-pending'}`;
      const granted = perms(m.role);
      document.getElementById('permission-grid').innerHTML = '<div class="permission-head"></div>' + LEVELS.map(([, l]) => `<div class="permission-head">${l}</div>`).join('')
        + AREAS.map(([key, label]) => `<div class="permission-label">${label}</div>` + LEVELS.map(([lvl, l]) => {
          const on = granted.includes(`${key}-${lvl}`);
          return `<span class="permission-cell"><span class="permission-dot${on ? ' on' : ''}" data-permission="${key}-${lvl}" aria-hidden="true"></span><span class="visually-hidden">${label} ${l}: ${on ? 'granted' : 'not granted'}</span></span>`;
        }).join('')).join('');
      document.getElementById('member-duty').innerHTML = duty(m);
      const invited = m.status === 'Invited';
      document.getElementById('resend-invite').hidden = !invited;
      setText('remove-member', invited ? 'Revoke invite' : 'Remove member');
    }

    function select(id, user) { selectedId = id; F.setParam('id', id); F.markSelected(tbody, id); renderPane(); F.revealPane(pane, user); }

    const onlyDirector = (m) => m.role === 'Director' && store.list('members').filter((x) => x.role === 'Director' && x.status === 'Active').length <= 1;

    /* Invite */
    const inviteForm = document.getElementById('invite-form');
    function openInvite() { inviteForm.reset(); F.openDialog('invite-member-dialog'); inviteForm.elements.name.focus(); }
    F.bindForm(inviteForm, {
      busyLabel: 'Recording…',
      validate(v) {
        const e = {};
        if (v.name.length < 2) e.name = 'Enter the full name.';
        const email = v.email.toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid work email.';
        else if (!email.endsWith('@minhan.vn')) e.email = 'Use a minhan.vn work email.';
        else {
          const existing = store.list('members').find((m) => m.email.toLowerCase() === email);
          if (existing) e.email = existing.status === 'Invited' ? 'This person is already invited. Resend the invite instead.' : 'This person is already a member.';
        }
        return e;
      },
      submit(v) {
        return store.commit((s) => {
          const id = `MEM-${fmt.pad2(Math.max(...s.members.map((m) => Number(m.id.replace(/\D/g, ''))), 0) + 1)}`;
          const member = { id, name: v.name, email: v.email.toLowerCase(), role: v.role, team: v.team, region: v.region, status: 'Invited', lastSeen: null, invitedAt: F.isoLocal() };
          s.members.push(member);
          return member;
        }).then((m) => {
          selectedId = m.id;
          F.setParam('id', m.id);
          search.value = '';
          roleFilter.value = 'all';
          render();
          F.toast(`Invite sent to ${m.email} as ${m.role}.`);
        });
      }
    });

    /* Edit role */
    const memberForm = document.getElementById('member-form');
    function openEdit() {
      const m = store.find('members', selectedId);
      if (!m) return;
      memberForm.reset();
      memberForm.elements.role.value = m.role;
      memberForm.elements.team.value = m.team;
      memberForm.elements.region.value = m.region;
      setText('member-dialog-title', `Edit role, ${m.name}`);
      syncRoleHint();
      F.openDialog('member-dialog');
    }
    function syncRoleHint() {
      const p = perms(memberForm.elements.role.value);
      setText('member-role-hint', `The ${memberForm.elements.role.value} template grants ${p.length} permissions. Changes apply on save.`);
    }
    memberForm.elements.role.addEventListener('change', syncRoleHint);
    F.bindForm(memberForm, {
      validate(v) {
        const m = store.find('members', selectedId);
        return m && onlyDirector(m) && v.role !== 'Director' ? { role: `${m.name} is the only active Director. Assign another Director first.` } : {};
      },
      submit(v) {
        const id = selectedId;
        return store.commit((s) => { const m = s.members.find((x) => x.id === id); Object.assign(m, { role: v.role, team: v.team, region: v.region }); return m; })
          .then((m) => { render(); F.toast(`${m.name} is now ${m.role}. Permissions follow the role template.`); });
      }
    });

    function removeMember() {
      const m = store.find('members', selectedId);
      if (!m) return;
      if (onlyDirector(m)) { F.toast(`${m.name} is the only active Director. Assign another Director before removing them.`, 'error'); return; }
      const invited = m.status === 'Invited';
      F.confirmAction({
        kicker: 'Identity and access',
        title: invited ? `Revoke invite for ${m.name}?` : `Remove ${m.name}?`,
        body: invited ? 'The invite link stops working. You can invite them again later.' : `${m.name} loses access to Northstar Holdings immediately. Their past approvals stay in activity trails.`,
        confirmLabel: invited ? 'Revoke invite' : 'Remove member',
        busyLabel: 'Removing…',
        action: () => store.commit((s) => { s.members = s.members.filter((x) => x.id !== m.id); }).then(() => {
          selectedId = null;
          F.setParam('id', null);
          render();
          F.toast(invited ? `Invite for ${m.name} revoked.` : `${m.name} removed from the workspace.`);
        })
      });
    }

    async function resend() {
      const m = store.find('members', selectedId);
      const button = document.getElementById('resend-invite');
      if (!m) return;
      button.disabled = true;
      button.textContent = 'Recording…';
      try {
        const at = await store.commit((s) => { const t = s.members.find((x) => x.id === m.id); t.invitedAt = F.isoLocal(); return t.invitedAt; });
        renderPane();
        F.toast(`Invite resent to ${m.email} at ${fmt.time(at)}.`);
      } catch (error) {
        F.toast(error.message, 'error');
      } finally {
        button.disabled = false;
        button.textContent = 'Resend invite';
      }
    }

    document.getElementById('open-invite').addEventListener('click', openInvite);
    document.getElementById('edit-member').addEventListener('click', openEdit);
    document.getElementById('remove-member').addEventListener('click', removeMember);
    document.getElementById('resend-invite').addEventListener('click', resend);
    search.addEventListener('input', render);
    roleFilter.addEventListener('change', render);
    F.bindRows(tbody, select);
    F.loadView({ region: document.getElementById('team-region'), tbody, columns: 6, noun: 'team members', render });
  }

  /* =====================================================================
     Expenses
     ===================================================================== */
  function initExpenses() {
    const tbody = document.getElementById('expenses-body');
    const pane = document.getElementById('expense-pane');
    const search = document.getElementById('expense-search');
    const category = document.getElementById('expense-category-filter');
    const filterButtons = [...document.querySelectorAll('[data-expense-filter]')];
    let selectedId = F.getParam('id');
    let editingId = null;
    const STATUS = { review: ['Needs review', 'status status-pending'], missing: ['Missing receipt', 'status status-danger'], approved: ['Approved', 'status status-success'], rejected: ['Rejected', 'status status-danger'] };
    category.innerHTML = '<option value="all">All categories</option>' + store.list('expenseCategories').map((c) => `<option>${esc(c)}</option>`).join('');

    function rows() {
      const filter = document.querySelector('[data-expense-filter].active')?.dataset.expenseFilter || 'all';
      const q = (search.value || '').trim().toLowerCase();
      const cat = category.value;
      return store.list('expenses').filter((x) => (filter === 'all' || x.status === filter) && (cat === 'all' || x.category === cat) && (!q || `${x.merchant} ${x.owner} ${x.category} ${x.id}`.toLowerCase().includes(q)));
    }

    function render() {
      const all = store.list('expenses');
      const total = (items) => items.reduce((s, x) => s + x.amount, 0);
      const review = all.filter((x) => x.status === 'review');
      // Counts live on the status tabs; the review tab also carries the VND value waiting.
      document.querySelectorAll('[data-count]').forEach((el) => { el.textContent = String(el.dataset.count === 'all' ? all.length : all.filter((x) => x.status === el.dataset.count).length); });
      document.querySelectorAll('[data-sum="review"]').forEach((el) => { el.textContent = review.length ? `VND ${fmt.number(total(review), 'VND')}` : ''; });
      const list = rows();
      tbody.innerHTML = list.map((x) => {
        const [label, cls] = STATUS[x.status];
        return `<tr tabindex="0" data-id="${esc(x.id)}" data-status="${esc(x.status)}"><td><span class="${cls}">${label}</span></td><td><span class="table-strong">${esc(x.merchant)}</span><span class="subcopy">${esc(x.detail || x.category)}</span></td><td>${esc(x.owner)}</td><td>${esc(x.category)}</td><td class="right mono">${fmt.number(x.amount, x.currency)}</td><td class="mono">${fmt.day(x.date)}</td></tr>`;
      }).join('');
      listEmpty(document.getElementById('expense-empty-state'), {
        all: all.length, rows: list.length,
        emptyTitle: 'No receipts yet', emptyBody: 'Add a receipt to settle an advance or claim money you spent.', emptyAction: 'Add receipt', onEmptyAction: () => openForm(null),
        filteredTitle: 'No matching receipts', onClear: () => { search.value = ''; category.value = 'all'; setSegment(filterButtons, 'expenseFilter', 'all'); render(); }
      });
      if (!selectedId && list.length) selectedId = list[0].id;
      F.markSelected(tbody, selectedId);
      renderPane();
    }

    function renderPane() {
      const x = store.find('expenses', selectedId);
      const missing = document.getElementById('expense-not-found');
      const body = document.getElementById('expense-pane-body');
      if (!x) { paneMissing(missing, body, { empty: !store.list('expenses').length, id: selectedId, noun: 'Expense', onShowFirst: () => select(store.list('expenses')[0].id) }); return; }
      paneShow(missing, body);
      const [label, cls] = STATUS[x.status];
      setText('expense-pane-id', x.id);
      setText('expense-pane-merchant', x.merchant);
      setText('expense-pane-owner', x.owner);
      setText('expense-pane-amount', fmt.money(x.amount, x.currency));
      const status = document.getElementById('expense-pane-status');
      status.textContent = label;
      status.className = cls;
      setText('expense-pane-category', x.category);
      setText('expense-pane-date', fmt.date(x.date));
      setText('expense-pane-card', x.card || 'Out of pocket');
      setText('expense-pane-note', x.note || 'None');
      const locked = x.status === 'approved';
      document.getElementById('receipt-host').innerHTML = x.receipt
        ? `<div class="receipt-preview"><div class="receipt-sheet"><div class="receipt-brand">${esc(x.merchant)}</div><div class="receipt-meta">${esc(fmt.date(x.date).toUpperCase())}</div><div class="receipt-line"><span>FILE</span><span class="receipt-file">${esc(x.receipt)}</span></div><div class="receipt-line"><span>${esc((x.detail || x.category).toUpperCase())}</span><span>${fmt.number(x.amount, x.currency)}</span></div><div class="receipt-total"><span>TOTAL</span><span id="receipt-total">${fmt.money(x.amount, x.currency)}</span></div></div></div>`
        : `<div class="receipt-missing">${F.ICONS.missing}<strong>No receipt attached</strong><span>A receipt is needed for anything above VND 200,000.</span>${locked ? '' : '<button class="btn" type="button" id="attach-receipt">Attach receipt</button>'}</div>`;
      document.getElementById('attach-receipt')?.addEventListener('click', () => openForm(x));
      const steps = [
        ['receipt', 'Receipt captured', x.receipt ? `File ${x.receipt}` : 'Waiting for the employee', x.receipt ? 'done' : 'current'],
        ['policy', 'Policy evaluated', x.receipt ? 'Within policy, no exception' : 'Runs after the receipt arrives', x.receipt ? 'done' : ''],
        ['coding', 'Accounting coding', `${x.category}, verify cost center`, x.status === 'approved' ? 'done' : x.status === 'review' ? 'current' : ''],
        ['approval', 'Accountant check', x.status === 'approved' ? `Approved by ${x.reviewedBy || 'Nguyễn Thu Hà'}` : x.status === 'rejected' ? `Rejected by ${x.reviewedBy || 'Nguyễn Thu Hà'}` : 'Waiting for Nguyễn Thu Hà', x.status === 'approved' ? 'done' : x.status === 'rejected' ? 'current rejected' : '']
      ];
      document.getElementById('review-track').innerHTML = steps.map(([key, title, note, state]) => `<div class="review-step ${state}" data-review-step="${key}"><strong>${esc(title)}</strong><span>${esc(note)}</span></div>`).join('');
      const outcome = document.getElementById('expense-outcome');
      outcome.hidden = x.status !== 'rejected';
      outcome.innerHTML = x.status === 'rejected' ? `<span><strong>Returned to ${esc(x.owner)}.</strong> Reason: ${esc(x.rejectReason || 'No reason given')}. Edit the expense to resubmit it.</span>` : '';
      const travelCap = x.category === 'Travel' && x.amount > 5000000;
      document.getElementById('expense-checks').innerHTML = [
        ['Receipt attached', x.receipt ? ['Pass', 'status-success'] : ['Missing', 'status-danger']],
        ['Merchant allowed', ['Pass', 'status-success']],
        [`${x.category} cap`, travelCap ? ['Review', 'status-pending'] : ['Pass', 'status-success']]
      ].map(([k, [v, c]]) => `<li><span>${esc(k)}</span><strong class="status ${c}">${v}</strong></li>`).join('');
      renderActions(x);
    }

    function renderActions(x) {
      const approver = F.role === 'approver';
      const canDecide = approver && x.status === 'review';
      const approve = document.getElementById('approve-expense');
      const reject = document.getElementById('reject-expense');
      approve.disabled = !canDecide;
      reject.disabled = !canDecide;
      approve.textContent = x.status === 'approved' ? 'Approved' : x.status === 'missing' ? 'Awaiting receipt' : 'Approve receipt';
      const locked = x.status === 'approved';
      document.getElementById('edit-expense').disabled = locked;
      document.getElementById('delete-expense').disabled = locked;
      let hint;
      if (locked) hint = 'Approved expenses are locked for accounting sync.';
      else if (x.status === 'missing') hint = 'Attach the receipt before the accountant can check it.';
      else if (x.status === 'rejected') hint = 'Edit the expense to fix it and resubmit.';
      else hint = approver ? 'Acting as Nguyễn Thu Hà, Accountant. Rejecting needs a reason.' : 'Switch to Approver to approve or reject this receipt.';
      setText('expense-hint', hint);
      approve.title = canDecide ? '' : hint;
      reject.title = approve.title;
    }

    function select(id, user) { selectedId = id; F.setParam('id', id); F.markSelected(tbody, id); renderPane(); F.revealPane(pane, user); }

    async function approve() {
      const x = store.find('expenses', selectedId);
      const button = document.getElementById('approve-expense');
      if (!x) return;
      button.disabled = true;
      button.textContent = 'Approving…';
      try {
        await store.commit((s) => { const t = s.expenses.find((e) => e.id === x.id); t.status = 'approved'; t.reviewedBy = 'Nguyễn Thu Hà'; t.reviewedAt = F.isoLocal(); });
        render();
        F.toast(`${x.merchant} approved and counted toward ${x.card === 'Out of pocket' ? 'the reimbursement' : x.card}.`);
      } catch (error) {
        renderPane();
        F.toast(error.message, 'error');
      }
    }

    function reject() {
      const x = store.find('expenses', selectedId);
      if (!x) return;
      F.confirmAction({
        kicker: 'Receipt check',
        title: `Reject ${x.merchant}, ${fmt.money(x.amount, x.currency)}?`,
        body: `${x.owner} sees your reason and can fix and resubmit the receipt.`,
        confirmLabel: 'Reject receipt',
        busyLabel: 'Rejecting…',
        reason: { label: 'Reason for rejection', required: true, placeholder: 'For example: the receipt shows a different total', requiredMessage: 'Add a reason so the employee knows what to fix.' },
        action: (reason) => store.commit((s) => { const t = s.expenses.find((e) => e.id === x.id); t.status = 'rejected'; t.rejectReason = reason; t.reviewedBy = 'Nguyễn Thu Hà'; }).then(() => { render(); F.toast(`${x.merchant} rejected and returned to ${x.owner}.`); })
      });
    }

    function remove() {
      const x = store.find('expenses', selectedId);
      if (!x) return;
      F.confirmAction({
        kicker: 'Receipt',
        title: `Delete ${x.id}?`,
        body: `${x.merchant}, ${fmt.money(x.amount, x.currency)} is removed from the queue. This cannot be undone.`,
        confirmLabel: 'Delete receipt',
        busyLabel: 'Deleting…',
        action: () => store.commit((s) => { s.expenses = s.expenses.filter((e) => e.id !== x.id); }).then(() => { selectedId = null; F.setParam('id', null); render(); F.toast(`${x.id} deleted.`); })
      });
    }

    /* New / edit */
    const form = document.getElementById('expense-form');
    function openForm(x) {
      editingId = x ? x.id : null;
      form.reset();
      form.elements.category.innerHTML = store.list('expenseCategories').map((c) => `<option>${esc(c)}</option>`).join('');
      const owners = [store.state.meta.currentUser.name].concat(store.list('members').filter((m) => m.status === 'Active').map((m) => m.name));
      if (x && !owners.includes(x.owner)) owners.push(x.owner);
      form.elements.owner.innerHTML = owners.map((o) => `<option>${esc(o)}</option>`).join('');
      form.elements.date.max = F.isoDate();
      if (x) {
        ['merchant', 'detail', 'currency', 'category', 'date', 'owner', 'note'].forEach((k) => { form.elements[k].value = x[k] || ''; });
        form.elements.amount.value = fmt.number(x.amount, x.currency);
      } else {
        form.elements.date.value = F.isoDate();
        form.elements.owner.value = owners[0];
      }
      setText('expense-receipt-current', x && x.receipt ? `Current file: ${x.receipt}. Choose a file to replace it.` : 'Only the file name is kept. Nothing is uploaded.');
      setText('expense-dialog-title', x ? `Edit ${x.id}` : 'New receipt');
      setText('expense-submit', x ? (x.status === 'rejected' ? 'Resubmit receipt' : 'Save changes') : 'Submit receipt');
      F.openDialog('expense-dialog');
      form.elements.merchant.focus();
    }
    F.bindForm(form, {
      busyLabel: 'Submitting…',
      validate(v) {
        const e = {};
        if (v.merchant.length < 2) e.merchant = 'Enter where the money was spent.';
        const err = amountError(v.amount, v.currency) || (F.parseAmount(v.amount) > 50000000 ? 'Above the VND 50,000,000 limit for one receipt.' : '');
        if (err) e.amount = err;
        if (!v.date) e.date = 'Enter the purchase date.';
        else if (v.date > F.isoDate()) e.date = 'The purchase date cannot be in the future.';
        else if ((F.parseDate(F.isoDate()) - F.parseDate(v.date)) / 86400000 > 90) e.date = 'Older than 90 days, outside the submission window.';
        if (v.receipt && !/\.(pdf|png|jpe?g)$/i.test(v.receipt)) e.receipt = 'Use a PDF, PNG or JPG file.';
        return e;
      },
      submit(v) {
        return store.commit((s) => {
          let x = editingId ? s.expenses.find((e) => e.id === editingId) : null;
          if (!x) {
            x = { id: store.nextId('EXP-', 'expenses', 44182), card: 'Out of pocket', receipt: '' };
            s.expenses.unshift(x);
          }
          const receipt = v.receipt || x.receipt;
          Object.assign(x, { merchant: v.merchant, detail: v.detail, currency: v.currency, amount: F.parseAmount(v.amount), category: v.category, date: v.date, owner: v.owner, note: v.note, receipt, status: receipt ? 'review' : 'missing', rejectReason: '' });
          return x;
        }).then((x) => {
          selectedId = x.id;
          F.setParam('id', x.id);
          search.value = '';
          category.value = 'all';
          setSegment(filterButtons, 'expenseFilter', 'all');
          render();
          F.toast(editingId ? `${x.id} updated.` : `${x.id} submitted${x.receipt ? '' : '. Attach a receipt so it can be reviewed'}.`);
        });
      }
    });

    document.getElementById('open-new-expense').addEventListener('click', () => openForm(null));
    document.getElementById('open-expense-policy').addEventListener('click', () => F.openDialog('expense-policy-dialog'));
    document.getElementById('approve-expense').addEventListener('click', approve);
    document.getElementById('reject-expense').addEventListener('click', reject);
    document.getElementById('edit-expense').addEventListener('click', () => { const x = store.find('expenses', selectedId); if (x) openForm(x); });
    document.getElementById('delete-expense').addEventListener('click', remove);
    filterButtons.forEach((b) => b.addEventListener('click', () => { setSegment(filterButtons, 'expenseFilter', b.dataset.expenseFilter); render(); }));
    search.addEventListener('input', render);
    category.addEventListener('change', render);
    F.onRoleChange(() => { const x = store.find('expenses', selectedId); if (x) renderActions(x); });
    F.bindRows(tbody, select);
    F.loadView({ region: document.getElementById('expenses-region'), tbody, columns: 6, noun: 'expenses', render });
  }

  /* =====================================================================
     Reports
     ===================================================================== */
  function initReports() {
    const LEDGER_END = '2026-09-15';
    const LEDGER_START = '2026-01-01';
    const rangeButtons = [...document.querySelectorAll('[data-report-range]')];
    const fromInput = document.getElementById('report-from');
    const toInput = document.getElementById('report-to');
    const currencyInput = document.getElementById('report-currency');
    const sourceInput = document.getElementById('report-source');
    const layout = document.getElementById('report-layout');
    let range = '30d';
    let current = [];

    const addDays = (iso, n) => { const d = F.parseDate(iso); d.setDate(d.getDate() + n); return F.isoDate(d); };
    const daysBetween = (a, b) => Math.round((F.parseDate(b) - F.parseDate(a)) / 86400000) + 1;

    function ledger() {
      const rows = window.FLUX_LEDGER();
      // Live rows: approved requests and receipts join the generated ledger. Field names follow the seed ledger.
      const SOURCE = { Advance: 'advance', 'Vendor payment': 'vendor', Reimbursement: 'receipt' };
      const CATEGORY = { Advance: 'Travel', 'Vendor payment': 'Vendor purchases', Reimbursement: 'Meals with clients' };
      const deptOf = (name) => ({ Finance: 'Office', Management: 'Office' })[store.list('members').find((m) => m.name === name)?.team] || store.list('members').find((m) => m.name === name)?.team || 'Sales';
      store.list('payments').filter((p) => ['processing', 'completed'].includes(p.status)).forEach((p) => rows.push({ id: p.id, date: p.createdAt.slice(0, 10), category: CATEGORY[p.type] || 'Vendor purchases', currency: deptOf(p.requester), source: SOURCE[p.type] || 'vendor', amountUsd: p.amount, fxCostUsd: p.type === 'Advance' ? p.amount : 0, exception: false }));
      store.list('expenses').filter((x) => x.status === 'approved').forEach((x) => rows.push({ id: x.id, date: x.date, category: x.category, currency: deptOf(x.owner), source: 'receipt', amountUsd: x.amount, fxCostUsd: 0, exception: false }));
      return rows;
    }
    const allRows = ledger();

    function presetDates(key) {
      if (key === '30d') return [addDays(LEDGER_END, -29), LEDGER_END];
      if (key === '90d') return [addDays(LEDGER_END, -89), LEDGER_END];
      if (key === 'ytd') return [LEDGER_START, LEDGER_END];
      return [fromInput.value, toInput.value];
    }

    function filterRows(from, to) {
      const ccy = currencyInput.value;
      const src = sourceInput.value;
      return allRows.filter((r) => r.date >= from && r.date <= to && (ccy === 'all' || r.currency === ccy) && (src === 'all' || r.source === src));
    }

    function clearRangeError() { document.querySelectorAll('#report-filters .field-error').forEach((n) => n.remove()); toInput.removeAttribute('aria-invalid'); fromInput.removeAttribute('aria-invalid'); }

    function apply() {
      clearRangeError();
      const [from, to] = presetDates(range);
      if (range !== 'custom') { fromInput.value = from; toInput.value = to; }
      if (!from || !to || from > to || from < LEDGER_START || to > LEDGER_END) {
        const input = !from || from < LEDGER_START ? fromInput : toInput;
        input.setAttribute('aria-invalid', 'true');
        input.closest('.filter-field').insertAdjacentHTML('beforeend', `<p class="field-error">${!from || !to ? 'Choose both dates.' : from > to ? 'End date must be on or after the start date.' : 'Data covers 1 Jan to 15 Sep 2026.'}</p>`);
        return;
      }
      current = filterRows(from, to);
      const days = daysBetween(from, to);
      const previous = filterRows(addDays(from, -days), addDays(from, -1));
      const total = current.reduce((s, r) => s + r.amountUsd, 0);
      const prevTotal = previous.reduce((s, r) => s + r.amountUsd, 0);
      const fx = current.reduce((s, r) => s + r.fxCostUsd, 0);
      const label = { '30d': '30d', '90d': '90d', ytd: 'YTD', custom: 'range' }[range];
      setText('report-total-spend', `VND ${fmt.whole(total)}`);
      setText('report-spend-delta', prevTotal ? `${total >= prevTotal ? '+' : '-'}${Math.abs(((total - prevTotal) / prevTotal) * 100).toFixed(1)}%` : 'n/a');
      setText('report-fx-cost', `VND ${fmt.whole(fx)}`);
      setText('report-fx-note', `${total ? ((fx / total) * 100).toFixed(1) : '0.0'}% of spend went out as advances`);
      setText('report-exceptions-label', `Policy exceptions, ${label}`);
      setText('report-exceptions', fmt.pad2(current.filter((r) => r.exception).length));
      setText('report-entries', fmt.whole(current.length));
      setText('report-range-label', range === '30d' ? '30-day operating window' : range === '90d' ? '90-day operating window' : range === 'ytd' ? 'Year-to-date operating window' : `${fmt.date(from)} to ${fmt.date(to)}`);
      setText('report-updated', `Updated ${fmt.time(F.now())}`);
      renderChart(from, to, total, days);
      renderRanks(total);
      renderExposure(total, fx);
    }

    function renderChart(from, to, total, days) {
      const wrap = document.getElementById('chart-wrap');
      const empty = document.getElementById('report-empty');
      const meta = document.querySelector('#chart-body .chart-meta');
      if (!current.length) {
        wrap.hidden = true;
        meta.hidden = true;
        empty.hidden = false;
        empty.innerHTML = F.stateBlock({ icon: 'search', title: 'No spend in this view', body: 'Widen the date range or clear the department and type filters.', action: 'Reset filters' });
        empty.querySelector('[data-state-action]').addEventListener('click', reset);
        return;
      }
      wrap.hidden = false;
      meta.hidden = false;
      empty.hidden = true;
      const byDay = new Map();
      current.forEach((r) => byDay.set(r.date, (byDay.get(r.date) || 0) + r.amountUsd));
      const weekly = days > 92;
      const buckets = [];
      for (let d = from; d <= to; d = addDays(d, weekly ? 7 : 1)) {
        let sum = 0;
        for (let i = 0; i < (weekly ? 7 : 1); i += 1) { const key = addDays(d, i); if (key <= to) sum += byDay.get(key) || 0; }
        buckets.push({ date: d, value: sum });
      }
      const peak = Math.max(...[...byDay.values()]);
      setText('chart-average', `VND ${fmt.whole(total / days)}`);
      setText('chart-peak', `VND ${fmt.whole(peak)}`);
      const sep = allRows.filter((r) => r.date >= '2026-09-01' && r.date <= LEDGER_END && (currencyInput.value === 'all' || r.currency === currencyInput.value) && (sourceInput.value === 'all' || r.source === sourceInput.value)).reduce((s, r) => s + r.amountUsd, 0);
      setText('chart-projected', `VND ${fmt.whole((sep / 15) * 30)}`);
      setText('chart-caption', `Approved spend in VND, ${weekly ? 'weekly' : 'daily'} totals`);
      const max = Math.max(...buckets.map((b) => b.value), 1);
      const niceMax = Math.ceil(max / 4000) * 4000 || 4000;
      const x = (i) => 40 + (buckets.length === 1 ? 350 : (i / (buckets.length - 1)) * 700);
      const y = (v) => 195 - (v / niceMax) * 165;
      const points = buckets.map((b, i) => `${x(i).toFixed(1)} ${y(b.value).toFixed(1)}`);
      const peakIndex = buckets.findIndex((b) => b.value === Math.max(...buckets.map((q) => q.value)));
      const ticks = [0, 1, 2, 3].map((i) => { const v = (niceMax / 4) * (4 - i) ; return `<line class="chart-grid" x1="40" y1="${30 + i * 55}" x2="740" y2="${30 + i * 55}"/><text class="chart-axis" x="0" y="${34 + i * 55}">${fmt.whole(v / 1000000)}M</text>`; }).join('');
      const mid = buckets[Math.floor((buckets.length - 1) / 2)].date;
      wrap.innerHTML = `<svg class="chart-svg" viewBox="0 0 760 220" role="img" aria-label="Operating spend from ${fmt.date(from)} to ${fmt.date(to)}, peak ${weekly ? 'week' : 'day'} VND ${fmt.whole(buckets[peakIndex].value)}">
        ${ticks}<line class="chart-grid" x1="40" y1="195" x2="740" y2="195"/>
        <path class="chart-area" d="M${points.join(' L')} L${x(buckets.length - 1).toFixed(1)} 195 L40 195 Z"/>
        <path class="chart-line" pathLength="1" d="M${points.join(' L')}"/>
        <circle class="chart-point" cx="${x(0).toFixed(1)}" cy="${y(buckets[0].value).toFixed(1)}" r="3.5"/>
        <circle class="chart-point alert" cx="${x(peakIndex).toFixed(1)}" cy="${y(buckets[peakIndex].value).toFixed(1)}" r="4.5"/>
        <circle class="chart-point" cx="${x(buckets.length - 1).toFixed(1)}" cy="${y(buckets[buckets.length - 1].value).toFixed(1)}" r="3.5"/>
        <text class="chart-axis" x="40" y="216">${fmt.day(from).toUpperCase()}</text><text class="chart-axis" x="360" y="216">${fmt.day(mid).toUpperCase()}</text><text class="chart-axis" x="740" y="216" text-anchor="end">${fmt.day(to).toUpperCase()}</text>
      </svg>`;
    }

    function renderRanks(total) {
      const map = new Map();
      current.forEach((r) => map.set(r.category, (map.get(r.category) || 0) + r.amountUsd));
      const ranked = [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
      document.getElementById('rank-list').innerHTML = ranked.length
        ? ranked.map(([name, value], i) => `<li class="rank-item"><span class="rank-index">${fmt.pad2(i + 1)}</span><div class="rank-copy"><strong>${esc(name)}</strong><span>${((value / total) * 100).toFixed(1)}% of total spend</span></div><span class="rank-value">${fmt.whole(value)}</span></li>`).join('')
        : '<li class="muted-line">No categories in this view.</li>';
    }

    function renderExposure(total, fx) {
      // Spend by department; the advance share replaces the old FX cost cell.
      const cells = ['Sales','Operations','Office','Marketing'].map((c) => {
        const v = current.filter((r) => r.currency === c).reduce((s, r) => s + r.amountUsd, 0);
        return [c.toUpperCase(), total ? `${((v / total) * 100).toFixed(1)}%` : '—', `VND ${fmt.whole(v)}`];
      });
      cells.push(['ADVANCES', total ? `${((fx / total) * 100).toFixed(1)}%` : '—', 'Of spend'], ['ENTRIES', fmt.whole(current.length), 'In this view'], ['EXCEPTIONS', fmt.pad2(current.filter((r) => r.exception).length), 'Flagged entries'], ['AVERAGE', current.length ? fmt.whole(total / current.length) : '—', 'VND per entry']);
      document.getElementById('exposure-matrix').innerHTML = cells.map(([k, v, note]) => `<div class="exposure-cell"><span>${esc(k)}</span><strong>${esc(v)}</strong><small>${esc(note)}</small></div>`).join('');
    }

    function setRange(key) { range = key; setSegment(rangeButtons, 'reportRange', key); apply(); }
    function reset() { currencyInput.value = 'all'; sourceInput.value = 'all'; setRange('30d'); }

    rangeButtons.forEach((b) => b.addEventListener('click', () => {
      if (b.dataset.reportRange === 'custom') { range = 'custom'; setSegment(rangeButtons, 'reportRange', 'custom'); fromInput.focus(); apply(); return; }
      setRange(b.dataset.reportRange);
      F.toast(`Report range changed to ${b.textContent.trim()}.`);
    }));
    [fromInput, toInput].forEach((input) => input.addEventListener('change', () => { range = 'custom'; setSegment(rangeButtons, 'reportRange', 'custom'); apply(); }));
    [currencyInput, sourceInput].forEach((input) => input.addEventListener('change', apply));
    document.getElementById('report-reset').addEventListener('click', reset);

    document.getElementById('export-report').addEventListener('click', () => {
      if (document.querySelector('#report-filters [aria-invalid="true"]')) { F.toast('Fix the date range before exporting.', 'error'); return; }
      if (!current.length) { F.toast('Nothing to export. The current view has no entries.', 'error'); return; }
      const filename = `flux-report-${fromInput.value}_${toInput.value}.csv`;
      const rows = [['Entry', 'Date', 'Category', 'Source', 'Department', 'Amount (VND)', 'Advance (VND)', 'Policy exception']]
        .concat(current.slice().sort((a, b) => (a.date < b.date ? -1 : 1)).map((r) => [r.id, r.date, r.category, r.source, r.currency, r.amountUsd.toFixed(0), r.fxCostUsd.toFixed(0), r.exception ? 'yes' : 'no']));
      F.downloadCsv(filename, rows);
      F.toast(`${current.length} rows exported to ${filename}. Generated in your browser.`);
    });

    /* Schedule (create / edit / remove) */
    const scheduleForm = document.getElementById('schedule-form');
    function renderSchedule() {
      const line = document.getElementById('schedule-line');
      const s = store.state.reportSchedule;
      line.hidden = !s;
      if (!s) { line.innerHTML = ''; return; }
      line.innerHTML = `<span><strong>Scheduled:</strong> ${esc(s.frequency)} to <span class="mono">${esc(s.recipient)}</span>.</span><span class="schedule-actions"><button class="btn" type="button" id="schedule-edit">Edit</button><button class="btn btn-danger" type="button" id="schedule-remove">Remove</button></span>`;
      document.getElementById('schedule-edit').addEventListener('click', openSchedule);
      document.getElementById('schedule-remove').addEventListener('click', () => F.confirmAction({
        kicker: 'Report delivery', title: 'Remove this schedule?', body: `${s.recipient} will no longer be listed as a recipient.`, confirmLabel: 'Remove schedule', busyLabel: 'Removing…',
        action: () => store.commit((st) => { st.reportSchedule = null; }).then(() => { renderSchedule(); F.toast('Report schedule removed.'); })
      }));
    }
    function openSchedule() {
      scheduleForm.reset();
      const s = store.state.reportSchedule;
      if (s) { scheduleForm.elements.frequency.value = s.frequency; scheduleForm.elements.recipient.value = s.recipient; }
      F.openDialog('schedule-dialog');
    }
    F.bindForm(scheduleForm, {
      validate(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.recipient) ? {} : { recipient: 'Enter a valid email address.' }; },
      submit(v) {
        return store.commit((s) => { s.reportSchedule = { frequency: v.frequency, recipient: v.recipient.toLowerCase(), range, currency: currencyInput.value, source: sourceInput.value }; })
          .then(() => { renderSchedule(); F.toast(`Schedule saved: ${v.frequency}.`); });
      }
    });
    document.getElementById('open-schedule').addEventListener('click', openSchedule);

    /* Initial load with skeleton and simulated load error */
    renderSchedule();
    if (F.lens) { apply(); return; }
    layout.setAttribute('aria-busy', 'true');
    layout.classList.add('is-loading');
    window.setTimeout(() => {
      layout.removeAttribute('aria-busy');
      layout.classList.remove('is-loading');
      if (F.getParam('simulate') === 'load-error') {
        layout.hidden = true;
        const block = document.createElement('div');
        block.className = 'load-error';
        block.setAttribute('role', 'alert');
        block.innerHTML = `${F.ICONS.error}<strong>Could not load reports</strong><span>The server did not respond. Your data is unchanged.</span><button class="btn" type="button">Retry</button>`;
        block.querySelector('button').addEventListener('click', () => { F.setParam('simulate', null); block.remove(); layout.hidden = false; apply(); });
        layout.before(block);
        return;
      }
      apply();
    }, 300);
  }
})();
