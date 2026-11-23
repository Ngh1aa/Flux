/* Flux workspace pages: accounts, cards, team, expenses and reports.
   Every change goes through Flux.store (session only, simulated latency). */
(() => {
  'use strict';

  const F = window.Flux;
  const { store, fmt, escapeHtml: esc, setText } = F;

  F.onReady(() => {
    const page = document.body.dataset.page;
    if (page === 'accounts') initAccounts();
    if (page === 'cards') initCards();
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
    if (currency === 'JPY' && !Number.isInteger(amount)) return 'JPY amounts have no decimals.';
    if (max && F.toUsd(amount, currency) > max) return `Above the USD ${fmt.whole(max)} limit.`;
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
      setText('metric-available', `USD ${fmt.whole(accounts.reduce((s, a) => s + F.toUsd(a.available, a.currency), 0))}`);
      setText('metric-reserved', `USD ${fmt.whole(accounts.reduce((s, a) => s + F.toUsd(a.reserved, a.currency), 0))}`);
      const credits = store.list('transactions').filter((t) => t.direction === 'credit' && t.status === 'posted' && clock - F.parseDate(t.date) < 86400000 && clock - F.parseDate(t.date) >= 0);
      setText('metric-incoming', `USD ${fmt.whole(credits.reduce((s, t) => s + F.toUsd(t.amount, accountCurrency(t.accountId)), 0))}`);
      setText('metric-incoming-note', `${credits.length} ${credits.length === 1 ? 'credit' : 'credits'} posted`);
      setText('metric-scheduled', fmt.pad2(store.list('transactions').filter((t) => t.status === 'scheduled' && t.direction === 'debit').length));
    }

    const accountCurrency = (id) => store.find('accounts', id)?.currency || 'USD';

    function renderList() {
      renderMetrics();
      tbody.innerHTML = store.list('accounts').map((a) => `<tr tabindex="0" data-id="${esc(a.id)}"><td><span class="currency-tag">${esc(a.currency)}</span></td><td><span class="table-strong">${esc(a.name)}</span><span class="subcopy">${esc(a.purpose)}</span></td><td class="right mono">${fmt.number(a.available, a.currency)}</td><td class="right mono">${fmt.number(a.reserved, a.currency)}</td><td>${esc(a.country)}</td><td><span class="mono">${fmt.time(a.lastActivity)}</span><span class="subcopy">${fmt.day(a.lastActivity)}</span></td></tr>`).join('');
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
      setText('account-pane-code', account.currency);
      setText('account-pane-title', account.name);
      setText('account-pane-balance', fmt.money(account.available, account.currency));
      setText('account-pane-reserved', fmt.money(account.reserved, account.currency));
      setText('account-pane-iban', account.iban);
      setText('account-pane-type', account.rails);
      setText('account-pane-country', account.country);
      setText('account-pane-settlement', account.settlement);
      const accounts = store.list('accounts');
      const total = accounts.reduce((s, a) => s + F.toUsd(a.available, a.currency), 0) || 1;
      const shares = accounts.map((a) => ({ code: a.currency, share: F.toUsd(a.available, a.currency) / total })).sort((x, y) => y.share - x.share).slice(0, 4);
      const max = shares[0]?.share || 1;
      document.getElementById('liquidity-bars').innerHTML = shares.map((s) => `<div class="balance-row"><span class="code">${esc(s.code)}</span><div class="balance-track"><div class="balance-fill" style="width:${Math.max(4, (s.share / max) * 88).toFixed(1)}%"></div></div><span class="balance-value">${(s.share * 100).toFixed(1)}%</span></div>`).join('');
      const scheduled = store.list('transactions').filter((t) => t.accountId === account.id && t.status === 'scheduled' && t.direction === 'debit');
      document.getElementById('treasury-signal').innerHTML = account.currency === 'USD' && !scheduled.length
        ? '<strong>Treasury signal:</strong> USD reserve is 14% above the target operating band. Next vendor window can settle without conversion.'
        : `<strong>Treasury signal:</strong> ${scheduled.length ? `${scheduled.length} scheduled ${scheduled.length === 1 ? 'transfer is' : 'transfers are'} reserved from this account.` : `${esc(account.currency)} balance covers known debits.`} Reserved funds are not available to move.`;
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
      if (!from || !to || !(amount > 0)) { preview.textContent = 'Enter an amount to see the converted value.'; return; }
      const rate = store.state.fx[from.currency] / store.state.fx[to.currency];
      const scheduled = moveForm.elements.date.value && moveForm.elements.date.value > F.isoDate();
      preview.innerHTML = `<strong class="mono">${fmt.money(amount, from.currency)}</strong> arrives as <strong class="mono">${fmt.money(amount * rate, to.currency)}</strong>. Indicative rate 1 ${esc(from.currency)} = ${rate.toFixed(4)} ${esc(to.currency)}. ${scheduled ? 'Funds are reserved until the transfer date.' : 'Recorded today.'}`;
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
      document.getElementById('receive-details').innerHTML = [['Account', a.name], ['Account holder', store.state.meta.workspace], ['Routing / account', a.iban], ['Rails', a.rails], ['Jurisdiction', a.country]].map(([k, v]) => `<li><span>${esc(k)}</span><strong>${esc(v)}</strong></li>`).join('');
      setText('receive-title', `Receiving details, ${a.currency}`);
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
      F.downloadCsv(`flux-statement-${a.currency}-${F.isoDate()}.csv`, [['Transaction', 'Date', 'Description', 'Counterparty', 'Direction', 'Status', `Amount (${a.currency})`]].concat(rows.map((t) => [t.id, F.isoLocal(F.parseDate(t.date)).replace('T', ' '), t.description, t.counterparty, t.direction, t.status, t.amount.toFixed(a.currency === 'JPY' ? 0 : 2)])));
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
     Cards
     ===================================================================== */
  function initCards() {
    const tbody = document.getElementById('cards-body');
    const pane = document.getElementById('card-pane');
    const search = document.getElementById('card-search');
    const filterButtons = [...document.querySelectorAll('[data-card-filter]')];
    let selectedId = F.getParam('id');
    const STATUS = { Active: 'status status-success', Frozen: 'status status-neutral', Pending: 'status status-pending', Cancelled: 'status status-danger' };

    function rows() {
      const filter = document.querySelector('[data-card-filter].active')?.dataset.cardFilter || 'all';
      const q = (search.value || '').trim().toLowerCase();
      return store.list('cards').filter((c) => (filter === 'all' || c.status === filter) && (!q || `${c.holder} ${c.last4} ${c.program} ${c.department}`.toLowerCase().includes(q)));
    }

    function render() {
      const all = store.list('cards');
      const live = all.filter((c) => c.status !== 'Cancelled');
      // Counts live on the status tabs; the Active tab also carries this month's spend.
      document.querySelectorAll('[data-count]').forEach((el) => { el.textContent = String(el.dataset.count === 'all' ? all.length : all.filter((c) => c.status === el.dataset.count).length); });
      const spend = live.reduce((s, c) => s + F.toUsd(c.monthly, c.currency), 0);
      document.querySelectorAll('[data-sum="spend"]').forEach((el) => { el.textContent = `USD ${fmt.whole(spend)} this month`; });
      const list = rows();
      tbody.innerHTML = list.map((c) => `<tr tabindex="0" data-id="${esc(c.id)}" class="${c.status === 'Cancelled' ? 'row-muted' : ''}"><td><span class="table-strong">${esc(c.holder)}</span><span class="subcopy mono">•••• ${esc(c.last4)}</span></td><td>${esc(c.type)}</td><td><span class="${STATUS[c.status]}">${esc(c.status)}</span></td><td class="right mono">${fmt.number(c.monthly, c.currency)}</td><td class="right mono">${fmt.number(c.limit, c.currency)}</td><td>${esc(c.program)}</td></tr>`).join('');
      listEmpty(document.getElementById('cards-empty'), {
        all: all.length, rows: list.length,
        emptyTitle: 'No company cards', emptyBody: 'Issue a virtual or physical card with a monthly limit and a spend program.', emptyAction: 'Issue card', onEmptyAction: openIssue,
        filteredTitle: 'No matching cards', onClear: () => { search.value = ''; setSegment(filterButtons, 'cardFilter', 'all'); render(); }
      });
      if (!selectedId && list.length) selectedId = list[0].id;
      F.markSelected(tbody, selectedId);
      renderPane();
    }

    function renderPane() {
      const c = store.find('cards', selectedId);
      const missing = document.getElementById('card-not-found');
      const body = document.getElementById('card-pane-body');
      if (!c) { paneMissing(missing, body, { empty: !store.list('cards').length, id: selectedId, noun: 'Card', onShowFirst: () => select(store.list('cards')[0].id) }); return; }
      paneShow(missing, body);
      setText('card-pane-holder', c.holder);
      setText('card-pane-last4', c.last4);
      setText('card-pane-type', c.type);
      setText('card-pane-expiry', c.expiry);
      setText('card-pane-id', c.id);
      setText('card-pane-owner', c.holder);
      setText('card-pane-department', c.department);
      setText('card-pane-program', c.program);
      setText('card-pane-monthly', fmt.money(c.monthly, c.currency));
      setText('card-pane-limit', fmt.money(c.limit, c.currency));
      const status = document.getElementById('card-pane-status');
      status.textContent = c.status;
      status.className = STATUS[c.status];
      document.getElementById('corporate-card').classList.toggle('is-inactive', c.status !== 'Active');
      const fill = document.getElementById('card-limit-fill');
      const pct = Math.min(100, Math.max(0, (c.monthly / (c.limit || 1)) * 100));
      fill.style.width = `${pct}%`;
      fill.classList.toggle('warning', pct >= 85);
      const freeze = document.getElementById('freeze-card');
      const cancelled = c.status === 'Cancelled';
      freeze.textContent = c.status === 'Frozen' ? 'Unfreeze card' : c.status === 'Pending' ? 'Activate card' : 'Freeze card';
      freeze.disabled = cancelled;
      document.getElementById('cancel-card').disabled = cancelled;
      document.getElementById('edit-limit').disabled = cancelled;
      setText('card-hint', {
        Active: 'Freezing declines new spend immediately and can be undone.',
        Frozen: 'Frozen cards decline all spend. Unfreeze to restore the card.',
        Pending: 'Physical card issued. Activate it once the cardholder confirms receipt.',
        Cancelled: 'Cancelled cards cannot be reactivated. Issue a new card instead.'
      }[c.status]);
    }

    function select(id, user) { selectedId = id; F.setParam('id', id); F.markSelected(tbody, id); renderPane(); F.revealPane(pane, user); }

    async function toggleFreeze() {
      const c = store.find('cards', selectedId);
      const button = document.getElementById('freeze-card');
      if (!c || c.status === 'Cancelled') return;
      const next = c.status === 'Active' ? 'Frozen' : 'Active';
      const original = button.textContent;
      button.disabled = true;
      button.textContent = 'Saving…';
      try {
        await store.commit((s) => { s.cards.find((x) => x.id === c.id).status = next; });
        render();
        F.toast(next === 'Frozen' ? `Card •••• ${c.last4} frozen. New spend is declined.` : c.status === 'Pending' ? `Card •••• ${c.last4} activated.` : `Card •••• ${c.last4} unfrozen.`);
      } catch (error) {
        button.disabled = false;
        button.textContent = original;
        F.toast(`${error.message}`, 'error');
      }
    }

    function cancelCard() {
      const c = store.find('cards', selectedId);
      if (!c) return;
      F.confirmAction({
        kicker: 'Company card',
        title: `Cancel card •••• ${c.last4}?`,
        body: `${c.holder}'s ${c.type.toLowerCase()} card stops working permanently and pending authorisations are declined. This cannot be undone.`,
        confirmLabel: 'Cancel card',
        busyLabel: 'Cancelling…',
        reason: { label: 'Reason (optional)', required: false, placeholder: 'For example: card lost, employee left' },
        action: (reason) => store.commit((s) => { const t = s.cards.find((x) => x.id === c.id); t.status = 'Cancelled'; t.cancelReason = reason; }).then(() => { render(); F.toast(`Card •••• ${c.last4} cancelled.`); })
      });
    }

    /* Edit limit */
    const limitForm = document.getElementById('limit-form');
    function openLimit() {
      const c = store.find('cards', selectedId);
      if (!c) return;
      limitForm.reset();
      limitForm.elements.program.innerHTML = store.list('cardPrograms').map((p) => `<option>${esc(p)}</option>`).join('');
      limitForm.elements.limit.value = fmt.number(c.limit, c.currency);
      limitForm.elements.program.value = c.program;
      setText('limit-prefix', c.currency);
      setText('limit-kicker', `Card •••• ${c.last4}`);
      setText('limit-hint', `Spent this cycle: ${fmt.money(c.monthly, c.currency)}. Maximum limit USD 50,000.`);
      F.openDialog('limit-dialog');
    }
    F.bindForm(limitForm, {
      validate(v) {
        const c = store.find('cards', selectedId);
        const e = {};
        const err = amountError(v.limit, c.currency, { max: 50000 });
        if (err) e.limit = err;
        else if (F.parseAmount(v.limit) < c.monthly) e.limit = `Below this cycle's spend of ${fmt.money(c.monthly, c.currency)}. Freeze the card to stop spend instead.`;
        return e;
      },
      submit(v) {
        const id = selectedId;
        return store.commit((s) => { const t = s.cards.find((x) => x.id === id); t.limit = F.parseAmount(v.limit); t.program = v.program; return t; })
          .then((t) => { render(); F.toast(`Limit for •••• ${t.last4} set to ${fmt.money(t.limit, t.currency)}.`); });
      }
    });

    /* Issue card */
    const issueForm = document.getElementById('issue-card-form');
    function openIssue() {
      issueForm.reset();
      issueForm.elements.holder.innerHTML = store.list('members').map((m) => `<option value="${esc(m.name)}">${esc(m.name)}, ${esc(m.team)}${m.status === 'Invited' ? ' (invited)' : ''}</option>`).join('') + '<option value="Jamie Stone">Jamie Stone, Finance</option>';
      issueForm.elements.program.innerHTML = store.list('cardPrograms').map((p) => `<option>${esc(p)}</option>`).join('');
      F.openDialog('issue-card-dialog');
    }
    F.bindForm(issueForm, {
      busyLabel: 'Issuing…',
      validate(v) {
        const e = {};
        if (!v.holder) e.holder = 'Choose a cardholder.';
        const err = amountError(v.limit, v.currency, { max: 50000 });
        if (err) e.limit = err;
        if (store.list('cards').some((c) => c.holder === v.holder && c.type === v.type && c.program === v.program && c.status !== 'Cancelled')) e.holder = `${v.holder} already has a ${v.type.toLowerCase()} card in ${v.program}.`;
        return e;
      },
      submit(v) {
        return store.commit((s) => {
          const used = new Set(s.cards.map((c) => c.last4));
          let n = (Date.now() % 9000) + 1000;
          while (used.has(String(n))) n = n === 9999 ? 1000 : n + 1;
          const member = s.members.find((m) => m.name === v.holder);
          const card = { id: `CRD-${n}`, holder: v.holder, last4: String(n), type: v.type, status: v.type === 'Virtual' ? 'Active' : 'Pending', currency: v.currency, monthly: 0, limit: F.parseAmount(v.limit), department: member?.team || 'Finance', program: v.program, expiry: '09 / 29' };
          s.cards.unshift(card);
          return card;
        }).then((card) => {
          selectedId = card.id;
          F.setParam('id', card.id);
          search.value = '';
          setSegment(filterButtons, 'cardFilter', 'all');
          render();
          F.toast(card.status === 'Active' ? `Virtual card •••• ${card.last4} issued to ${card.holder}. It is ready to use.` : `Physical card •••• ${card.last4} issued to ${card.holder}. It stays Pending until activated.`);
        });
      }
    });

    document.getElementById('open-issue-card').addEventListener('click', openIssue);
    document.getElementById('freeze-card').addEventListener('click', toggleFreeze);
    document.getElementById('cancel-card').addEventListener('click', cancelCard);
    document.getElementById('edit-limit').addEventListener('click', openLimit);
    filterButtons.forEach((b) => b.addEventListener('click', () => { setSegment(filterButtons, 'cardFilter', b.dataset.cardFilter); render(); }));
    search.addEventListener('input', render);
    F.bindRows(tbody, select);
    F.loadView({ region: document.getElementById('cards-region'), tbody, columns: 6, noun: 'cards', render });
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
    const AREAS = [['accounts', 'Accounts'], ['payments', 'Payments'], ['cards', 'Cards'], ['team', 'Team']];
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
      const approvers = active.filter((m) => ['Finance manager', 'CFO'].includes(m.role));
      setText('metric-approvers', fmt.pad2(approvers.length));
      setText('metric-approvers-note', `${approvers.filter((m) => m.role === 'CFO').length} with CFO authority`);
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
      const first = m.name.split(' ')[0];
      return {
        'Finance manager': `<strong>Separation of duties intact.</strong> ${esc(first)} can create and approve payments for other team members, but cannot edit policy rules or grant access.`,
        CFO: `<strong>Final approval authority.</strong> ${esc(first)} can administer payments, cards and team access. Policy still blocks approving their own payments.`,
        Bookkeeper: `<strong>Read-only finance access.</strong> ${esc(first)} can reconcile accounts but cannot create or approve money movement.`,
        Employee: `<strong>Own spend only.</strong> ${esc(first)} can view their own cards. Payments and approvals are out of scope.`,
        Admin: `<strong>Access administrator.</strong> ${esc(first)} manages access and card programs but cannot approve payments.`
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

    const onlyCfo = (m) => m.role === 'CFO' && store.list('members').filter((x) => x.role === 'CFO' && x.status === 'Active').length <= 1;

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
        else if (!email.endsWith('@northstar.co')) e.email = 'Use a northstar.co work email.';
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
        return m && onlyCfo(m) && v.role !== 'CFO' ? { role: `${m.name} is the only active CFO. Assign another CFO first.` } : {};
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
      if (onlyCfo(m)) { F.toast(`${m.name} is the only active CFO. Assign another CFO before removing them.`, 'error'); return; }
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
      const usd = (items) => items.reduce((s, x) => s + F.toUsd(x.amount, x.currency), 0);
      const review = all.filter((x) => x.status === 'review');
      // Counts live on the status tabs; the review tab also carries the USD value waiting.
      document.querySelectorAll('[data-count]').forEach((el) => { el.textContent = String(el.dataset.count === 'all' ? all.length : all.filter((x) => x.status === el.dataset.count).length); });
      document.querySelectorAll('[data-sum="review"]').forEach((el) => { el.textContent = review.length ? `USD ${fmt.number(usd(review))}` : ''; });
      const list = rows();
      tbody.innerHTML = list.map((x) => {
        const [label, cls] = STATUS[x.status];
        return `<tr tabindex="0" data-id="${esc(x.id)}" data-status="${esc(x.status)}"><td><span class="${cls}">${label}</span></td><td><span class="table-strong">${esc(x.merchant)}</span><span class="subcopy">${esc(x.detail || x.category)}</span></td><td>${esc(x.owner)}</td><td>${esc(x.category)}</td><td class="right mono">${fmt.number(x.amount, x.currency)}</td><td class="mono">${fmt.day(x.date)}</td></tr>`;
      }).join('');
      listEmpty(document.getElementById('expense-empty-state'), {
        all: all.length, rows: list.length,
        emptyTitle: 'No expenses yet', emptyBody: 'Submit an expense with its receipt so it can be coded and approved.', emptyAction: 'New expense', onEmptyAction: () => openForm(null),
        filteredTitle: 'No matching expenses', onClear: () => { search.value = ''; category.value = 'all'; setSegment(filterButtons, 'expenseFilter', 'all'); render(); }
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
        : `<div class="receipt-missing">${F.ICONS.missing}<strong>No receipt attached</strong><span>Policy requires a receipt above USD 25.</span>${locked ? '' : '<button class="btn" type="button" id="attach-receipt">Attach receipt</button>'}</div>`;
      document.getElementById('attach-receipt')?.addEventListener('click', () => openForm(x));
      const steps = [
        ['receipt', 'Receipt captured', x.receipt ? `File ${x.receipt}` : 'Waiting for the cardholder', x.receipt ? 'done' : 'current'],
        ['policy', 'Policy evaluated', x.receipt ? 'Within policy, no exception' : 'Runs after the receipt arrives', x.receipt ? 'done' : ''],
        ['coding', 'Accounting coding', `${x.category}, verify cost center`, x.status === 'approved' ? 'done' : x.status === 'review' ? 'current' : ''],
        ['approval', 'Manager approval', x.status === 'approved' ? `Approved by ${x.reviewedBy || 'Alex Smith'}` : x.status === 'rejected' ? `Rejected by ${x.reviewedBy || 'Alex Smith'}` : 'Pending review by Alex Smith', x.status === 'approved' ? 'done' : x.status === 'rejected' ? 'current rejected' : '']
      ];
      document.getElementById('review-track').innerHTML = steps.map(([key, title, note, state]) => `<div class="review-step ${state}" data-review-step="${key}"><strong>${esc(title)}</strong><span>${esc(note)}</span></div>`).join('');
      const outcome = document.getElementById('expense-outcome');
      outcome.hidden = x.status !== 'rejected';
      outcome.innerHTML = x.status === 'rejected' ? `<span><strong>Returned to ${esc(x.owner)}.</strong> Reason: ${esc(x.rejectReason || 'No reason given')}. Edit the expense to resubmit it.</span>` : '';
      const travelCap = x.category === 'Travel' && F.toUsd(x.amount, x.currency) > 1000;
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
      approve.textContent = x.status === 'approved' ? 'Approved' : x.status === 'missing' ? 'Awaiting receipt' : 'Approve expense';
      const locked = x.status === 'approved';
      document.getElementById('edit-expense').disabled = locked;
      document.getElementById('delete-expense').disabled = locked;
      let hint;
      if (locked) hint = 'Approved expenses are locked for accounting sync.';
      else if (x.status === 'missing') hint = 'Attach a receipt before this expense can be reviewed.';
      else if (x.status === 'rejected') hint = 'Edit the expense to fix it and resubmit.';
      else hint = approver ? 'Acting as Alex Smith, Finance manager. Rejecting needs a reason.' : 'Switch to Approver to approve or reject this expense.';
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
        await store.commit((s) => { const t = s.expenses.find((e) => e.id === x.id); t.status = 'approved'; t.reviewedBy = 'Alex Smith'; t.reviewedAt = F.isoLocal(); });
        render();
        F.toast(`${x.merchant} approved and queued for accounting sync.`);
      } catch (error) {
        renderPane();
        F.toast(error.message, 'error');
      }
    }

    function reject() {
      const x = store.find('expenses', selectedId);
      if (!x) return;
      F.confirmAction({
        kicker: 'Expense review',
        title: `Reject ${x.merchant}, ${fmt.money(x.amount, x.currency)}?`,
        body: `${x.owner} sees your reason and can edit and resubmit the expense.`,
        confirmLabel: 'Reject expense',
        busyLabel: 'Rejecting…',
        reason: { label: 'Reason for rejection', required: true, placeholder: 'For example: receipt shows a different total', requiredMessage: 'Add a reason so the cardholder knows what to fix.' },
        action: (reason) => store.commit((s) => { const t = s.expenses.find((e) => e.id === x.id); t.status = 'rejected'; t.rejectReason = reason; t.reviewedBy = 'Alex Smith'; }).then(() => { render(); F.toast(`${x.merchant} rejected and returned to ${x.owner}.`); })
      });
    }

    function remove() {
      const x = store.find('expenses', selectedId);
      if (!x) return;
      F.confirmAction({
        kicker: 'Expense claim',
        title: `Delete ${x.id}?`,
        body: `${x.merchant}, ${fmt.money(x.amount, x.currency)} is removed from the queue. This cannot be undone.`,
        confirmLabel: 'Delete expense',
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
      const owners = ['Jamie Stone'].concat(store.list('members').filter((m) => m.status === 'Active').map((m) => m.name));
      if (x && !owners.includes(x.owner)) owners.push(x.owner);
      form.elements.owner.innerHTML = owners.map((o) => `<option>${esc(o)}</option>`).join('');
      form.elements.date.max = F.isoDate();
      if (x) {
        ['merchant', 'detail', 'currency', 'category', 'date', 'owner', 'note'].forEach((k) => { form.elements[k].value = x[k] || ''; });
        form.elements.amount.value = fmt.number(x.amount, x.currency);
      } else {
        form.elements.date.value = F.isoDate();
        form.elements.owner.value = 'Jamie Stone';
      }
      setText('expense-receipt-current', x && x.receipt ? `Current file: ${x.receipt}. Choose a file to replace it.` : 'Only the file name is kept. Nothing is uploaded.');
      setText('expense-dialog-title', x ? `Edit ${x.id}` : 'New expense');
      setText('expense-submit', x ? (x.status === 'rejected' ? 'Resubmit expense' : 'Save changes') : 'Submit expense');
      F.openDialog('expense-dialog');
      form.elements.merchant.focus();
    }
    F.bindForm(form, {
      busyLabel: 'Submitting…',
      validate(v) {
        const e = {};
        if (v.merchant.length < 2) e.merchant = 'Enter the merchant name.';
        const err = amountError(v.amount, v.currency, { max: 25000 });
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
      store.list('payments').filter((p) => ['processing', 'completed'].includes(p.status)).forEach((p) => rows.push({ id: p.id, date: p.createdAt.slice(0, 10), category: 'Supplier payments', currency: p.currency, source: 'payment', amountUsd: Math.round(F.toUsd(p.amount, p.currency) * 100) / 100, fxCostUsd: p.currency === 'USD' ? 0 : Math.round(F.toUsd(p.amount, p.currency) * 0.0099 * 100) / 100, exception: false }));
      store.list('expenses').filter((x) => x.status === 'approved').forEach((x) => rows.push({ id: x.id, date: x.date, category: x.category, currency: x.currency, source: 'expense', amountUsd: Math.round(F.toUsd(x.amount, x.currency) * 100) / 100, fxCostUsd: 0, exception: false }));
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
      setText('report-total-spend', `$${fmt.whole(total)}`);
      setText('report-spend-delta', prevTotal ? `${total >= prevTotal ? '+' : '-'}${Math.abs(((total - prevTotal) / prevTotal) * 100).toFixed(1)}%` : 'n/a');
      setText('report-fx-cost', `$${fmt.whole(fx)}`);
      setText('report-fx-note', `${total ? ((fx / total) * 100).toFixed(2) : '0.00'}% blended conversion cost`);
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
        empty.innerHTML = F.stateBlock({ icon: 'search', title: 'No spend in this view', body: 'Widen the date range or clear the currency and source filters.', action: 'Reset filters' });
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
      setText('chart-average', `$${fmt.whole(total / days)}`);
      setText('chart-peak', `$${fmt.whole(peak)}`);
      const sep = allRows.filter((r) => r.date >= '2026-09-01' && r.date <= LEDGER_END && (currencyInput.value === 'all' || r.currency === currencyInput.value) && (sourceInput.value === 'all' || r.source === sourceInput.value)).reduce((s, r) => s + r.amountUsd, 0);
      setText('chart-projected', `$${fmt.whole((sep / 15) * 30)}`);
      setText('chart-caption', `Settled and approved spend, USD equivalent, ${weekly ? 'weekly' : 'daily'} totals`);
      const max = Math.max(...buckets.map((b) => b.value), 1);
      const niceMax = Math.ceil(max / 4000) * 4000 || 4000;
      const x = (i) => 40 + (buckets.length === 1 ? 350 : (i / (buckets.length - 1)) * 700);
      const y = (v) => 195 - (v / niceMax) * 165;
      const points = buckets.map((b, i) => `${x(i).toFixed(1)} ${y(b.value).toFixed(1)}`);
      const peakIndex = buckets.findIndex((b) => b.value === Math.max(...buckets.map((q) => q.value)));
      const ticks = [0, 1, 2, 3].map((i) => { const v = (niceMax / 4) * (4 - i) ; return `<line class="chart-grid" x1="40" y1="${30 + i * 55}" x2="740" y2="${30 + i * 55}"/><text class="chart-axis" x="0" y="${34 + i * 55}">${fmt.whole(v / 1000)}K</text>`; }).join('');
      const mid = buckets[Math.floor((buckets.length - 1) / 2)].date;
      wrap.innerHTML = `<svg class="chart-svg" viewBox="0 0 760 220" role="img" aria-label="Operating spend from ${fmt.date(from)} to ${fmt.date(to)}, peak ${weekly ? 'week' : 'day'} USD ${fmt.whole(buckets[peakIndex].value)}">
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
        ? ranked.map(([name, value], i) => `<li class="rank-item"><span class="rank-index">${fmt.pad2(i + 1)}</span><div class="rank-copy"><strong>${esc(name)}</strong><span>${((value / total) * 100).toFixed(1)}% of total spend</span></div><span class="rank-value">$${fmt.whole(value)}</span></li>`).join('')
        : '<li class="muted-line">No categories in this view.</li>';
    }

    function renderExposure(total, fx) {
      const cells = ['USD', 'EUR', 'JPY', 'GBP', 'SGD'].map((c) => {
        const v = current.filter((r) => r.currency === c).reduce((s, r) => s + r.amountUsd, 0);
        return [c, total ? `${((v / total) * 100).toFixed(1)}%` : '—', c === 'USD' ? 'Base currency' : `$${fmt.whole(v)}`];
      });
      cells.push(['FX COST', total ? `${((fx / total) * 100).toFixed(2)}%` : '—', 'Blended'], ['ENTRIES', fmt.whole(current.length), 'In this view'], ['EXCEPTIONS', fmt.pad2(current.filter((r) => r.exception).length), 'Flagged entries']);
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
      const rows = [['Entry', 'Date', 'Category', 'Source', 'Currency', 'Amount (USD)', 'FX cost (USD)', 'Policy exception']]
        .concat(current.slice().sort((a, b) => (a.date < b.date ? -1 : 1)).map((r) => [r.id, r.date, r.category, r.source, r.currency, r.amountUsd.toFixed(2), r.fxCostUsd.toFixed(2), r.exception ? 'yes' : 'no']));
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
