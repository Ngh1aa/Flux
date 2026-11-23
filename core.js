/* Flux core: session store, clock, formatting, sign-in and shared UI states.
   Data lives in sessionStorage for this tab (there is no backend). Demo tools
   (reset, fail the next save) appear only with ?demo=1. */
(() => {
  'use strict';

  const SEED = window.FLUX_SEED;
  const STATE_KEY = 'flux-demo-state';
  const ROLE_KEY = 'flux-role';
  const LATENCY = 420;
  const LOAD_LATENCY = 300;
  const params = new URLSearchParams(window.location.search);
  // The design lens embeds the product in an iframe and needs stable, seed-only data.
  const lens = params.get('lens') === '1';

  /* Session sign-in. A first visit is signed in as the workspace user; signing out
     sets a tab flag and shows login.html until the user signs in again. */
  const SIGNED_OUT_KEY = 'flux-signed-out';
  const DEMO_KEY = 'flux-demo-tools';
  const tabStorage = (() => { try { return window.sessionStorage; } catch { return null; } })();
  const auth = {
    signedIn() {
      try { return !tabStorage || tabStorage.getItem(SIGNED_OUT_KEY) !== '1'; } catch { return true; }
    },
    signOut() {
      try { tabStorage?.setItem(SIGNED_OUT_KEY, '1'); } catch { /* ignore */ }
      window.location.href = 'login.html';
    },
    signIn() {
      try { tabStorage?.removeItem(SIGNED_OUT_KEY); } catch { /* ignore */ }
    }
  };
  if (!lens && !auth.signedIn()) {
    const back = window.location.pathname.split('/').pop() + window.location.search;
    window.location.replace(`login.html?next=${encodeURIComponent(back || 'index.html')}`);
  }
  const demoTools = (() => {
    if (lens) return false;
    const flag = params.get('demo');
    try {
      if (flag === '1') tabStorage.setItem(DEMO_KEY, '1');
      else if (flag === '0') tabStorage.removeItem(DEMO_KEY);
      return tabStorage.getItem(DEMO_KEY) === '1';
    } catch { return flag === '1'; }
  })();

  const storage = (() => {
    if (lens) return null;
    try { const s = window.sessionStorage; s.setItem('__flux', '1'); s.removeItem('__flux'); return s; } catch { return null; }
  })();

  const clone = (value) => JSON.parse(JSON.stringify(value));

  function freshState() {
    const state = clone(SEED);
    state.meta.sessionStartedAt = Date.now();
    state.meta.failNext = false;
    return state;
  }

  function loadState() {
    if (storage) {
      try {
        const parsed = JSON.parse(storage.getItem(STATE_KEY) || 'null');
        if (parsed && parsed.meta && parsed.meta.version === SEED.meta.version) return parsed;
      } catch { /* corrupted session copy: fall back to seed */ }
    }
    const state = freshState();
    persist(state);
    return state;
  }

  function persist(value) {
    if (!storage) return;
    try { storage.setItem(STATE_KEY, JSON.stringify(value)); } catch { /* quota or privacy mode */ }
  }

  let state = loadState();

  class FluxError extends Error {}

  const store = {
    get state() { return state; },
    list(name) { return state[name] || []; },
    find(name, id) { return (state[name] || []).find((item) => item.id === id) || null; },
    /* Simulates a network write. Resolves after a short delay, or rejects once
       when the "fail the next save" demo toggle is armed. Nothing is written on failure. */
    commit(mutate, options = {}) {
      const delay = options.delay ?? (lens ? 0 : LATENCY);
      return new Promise((resolve, reject) => {
        window.setTimeout(() => {
          if (state.meta.failNext) {
            state.meta.failNext = false;
            persist(state);
            syncDemoFlag();
            reject(new FluxError('The server did not respond, so nothing was saved. Try again.'));
            return;
          }
          try {
            const result = mutate(state);
            persist(state);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }, delay);
      });
    },
    setFailNext(value) { state.meta.failNext = Boolean(value); persist(state); syncDemoFlag(); },
    reset() {
      if (storage) { try { storage.removeItem(STATE_KEY); storage.removeItem(ROLE_KEY); } catch { /* ignore */ } }
      state = freshState();
      persist(state);
    },
    nextId(prefix, collection, start) {
      const numbers = (state[collection] || []).map((item) => Number(String(item.id).replace(/\D/g, ''))).filter(Number.isFinite);
      return `${prefix}${Math.max(start, ...numbers) + 1}`;
    }
  };

  /* ---------- Simulated clock ---------- */
  function now() {
    const base = parseDate(state.meta.clockStart).getTime();
    return new Date(base + Math.max(0, Date.now() - (state.meta.sessionStartedAt || Date.now())));
  }
  const pad = (n) => String(n).padStart(2, '0');
  function isoLocal(date = now()) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }
  function isoDate(date = now()) { return isoLocal(date).slice(0, 10); }
  function parseDate(value) {
    if (!value) return new Date(NaN);
    return new Date(value.length === 10 ? `${value}T00:00:00` : value);
  }

  /* ---------- Formatting ---------- */
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const SYMBOLS = { USD: '$', EUR: '€', GBP: '£', JPY: '¥', SGD: 'S$' };
  const decimals = (currency) => (currency === 'JPY' || currency === 'VND' ? 0 : 2);
  const fmt = {
    number(amount, currency = 'USD') {
      const d = decimals(currency);
      return new Intl.NumberFormat('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }).format(Number(amount) || 0);
    },
    money(amount, currency = 'USD') {
      const value = Number(amount) || 0;
      const symbol = SYMBOLS[currency];
      const body = fmt.number(Math.abs(value), currency);
      return `${value < 0 ? '-' : ''}${symbol ? symbol + body : `${currency} ${body}`}`;
    },
    code(amount, currency = 'USD') { return `${currency} ${fmt.number(amount, currency)}`; },
    whole(amount) { return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(Number(amount) || 0)); },
    date(value) { const d = parseDate(value); return Number.isNaN(d.getTime()) ? '' : `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; },
    day(value) { const d = parseDate(value); return Number.isNaN(d.getTime()) ? '' : `${pad(d.getDate())} ${MONTHS[d.getMonth()]}`; },
    time(value) { const d = parseDate(value); return Number.isNaN(d.getTime()) ? '' : `${pad(d.getHours())}:${pad(d.getMinutes())}`; },
    timeSec(value) { const d = parseDate(value); return Number.isNaN(d.getTime()) ? '' : `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; },
    dateTime(value) { return value ? `${fmt.date(value)}, ${fmt.time(value)}` : ''; },
    pad2(n) { return pad(n); }
  };
  function toUsd(amount, currency) { return (Number(amount) || 0) * (state.fx[currency] || 1); }
  function parseAmount(raw) {
    const cleaned = String(raw ?? '').replace(/[,\s]/g, '').replace(/^[A-Z$€£¥]+/i, '');
    if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return NaN;
    return Number(cleaned);
  }

  /* ---------- DOM helpers ---------- */
  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"`]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;', '`': '&#96;' }[char]));
  }
  function setText(id, value) { const node = document.getElementById(id); if (node) node.textContent = value ?? ''; }
  function getParam(name) { return new URLSearchParams(window.location.search).get(name); }
  function setParam(name, value) {
    const url = new URL(window.location.href);
    if (value === null || value === undefined || value === '') url.searchParams.delete(name); else url.searchParams.set(name, value);
    window.history.replaceState(null, '', url.pathname.split('/').pop() + url.search + url.hash);
  }
  const isNarrow = () => window.matchMedia('(max-width: 1180px)').matches;

  let toastTimer;
  function toast(message, tone = 'info') {
    let node = document.getElementById('flux-toast');
    if (!node) {
      node = document.createElement('div');
      node.id = 'flux-toast';
      node.className = 'flux-toast';
      node.setAttribute('role', 'status');
      node.setAttribute('aria-live', 'polite');
      document.body.appendChild(node);
    }
    node.textContent = message;
    node.dataset.tone = tone;
    node.classList.add('show');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => node.classList.remove('show'), 3600);
  }

  const ICONS = {
    empty: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16v16H4zM8 9h8M8 13h5"></path></svg>',
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6"></circle><path d="m20 20-4.5-4.5"></path></svg>',
    error: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 3 20h18zM12 9v4M12 17h.01"></path></svg>',
    missing: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14v14H5zM9 9l6 6M15 9l-6 6"></path></svg>',
    plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"></path></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"></path></svg>'
  };

  /** Empty, filtered-empty and not-found blocks share one structure. */
  function stateBlock({ icon = 'empty', title, body, action, actionId, tone = '' }) {
    const button = action ? `<button class="btn" type="button" ${actionId ? `id="${actionId}"` : ''} data-state-action>${escapeHtml(action)}</button>` : '';
    return `<div class="table-empty ${tone}" data-state-block>${ICONS[icon] || ''}<strong>${escapeHtml(title)}</strong><span>${escapeHtml(body)}</span>${button}</div>`;
  }

  function skeletonRows(columns, rows = 4) {
    const cells = Array.from({ length: columns }, () => '<td><span class="skeleton"></span></td>').join('');
    return Array.from({ length: rows }, () => `<tr class="skeleton-row" aria-hidden="true">${cells}</tr>`).join('');
  }

  /* Simulated list load: skeleton rows, then render. `?simulate=load-error`
     shows the recoverable load error once per page view. */
  function loadView({ region, tbody, columns, noun, render }) {
    if (lens || !tbody) { render(); return; }
    region?.querySelector('[data-load-error]')?.remove();
    tbody.innerHTML = skeletonRows(columns);
    region?.setAttribute('aria-busy', 'true');
    window.setTimeout(() => {
      region?.removeAttribute('aria-busy');
      if (getParam('simulate') === 'load-error') {
        tbody.innerHTML = '';
        const block = document.createElement('div');
        block.className = 'load-error';
        block.dataset.loadError = '';
        block.setAttribute('role', 'alert');
        block.innerHTML = `${ICONS.error}<strong>Could not load ${escapeHtml(noun)}</strong><span>The server did not respond. Your data is unchanged.</span><button class="btn" type="button">Retry</button>`;
        block.querySelector('button').addEventListener('click', () => { setParam('simulate', null); loadView({ region, tbody, columns, noun, render }); });
        tbody.closest('table')?.after(block);
        return;
      }
      render();
    }, LOAD_LATENCY);
  }

  /* Row selection by delegation (click, Enter, Space). */
  function bindRows(tbody, onSelect) {
    if (!tbody) return;
    tbody.addEventListener('click', (event) => {
      const row = event.target.closest('tr[data-id]');
      if (row) onSelect(row.dataset.id, true);
    });
    tbody.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const row = event.target.closest('tr[data-id]');
      if (!row) return;
      event.preventDefault();
      onSelect(row.dataset.id, true);
    });
  }
  function markSelected(tbody, id) {
    tbody?.querySelectorAll('tr[data-id]').forEach((row) => {
      const on = row.dataset.id === id;
      row.classList.toggle('selected', on);
      if (on) row.setAttribute('aria-current', 'true'); else row.removeAttribute('aria-current');
    });
  }
  function revealPane(pane, userInitiated) {
    if (userInitiated && pane && isNarrow()) pane.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  /* ---------- Forms and dialogs ---------- */
  function openDialog(dialog) {
    if (typeof dialog === 'string') dialog = document.getElementById(dialog);
    if (!dialog) return null;
    const form = dialog.querySelector('form');
    if (form) clearErrors(form, true);
    if (!dialog.open) dialog.showModal();
    return dialog;
  }

  function formValues(form) {
    const values = {};
    [...form.elements].forEach((el) => {
      if (!el.name || el.disabled) return;
      if (el.type === 'checkbox') values[el.name] = el.checked;
      else if (el.type === 'radio') { if (el.checked) values[el.name] = el.value; }
      else if (el.type === 'file') values[el.name] = el.files && el.files[0] ? el.files[0].name : '';
      else values[el.name] = el.value.trim();
    });
    return values;
  }

  function clearErrors(form, includeAlert = false) {
    form.querySelectorAll('.field-error').forEach((node) => node.remove());
    form.querySelectorAll('[aria-invalid="true"]').forEach((node) => {
      node.removeAttribute('aria-invalid');
      const described = (node.getAttribute('aria-describedby') || '').split(' ').filter((id) => !id.startsWith('err-')).join(' ');
      if (described) node.setAttribute('aria-describedby', described); else node.removeAttribute('aria-describedby');
    });
    if (includeAlert) form.querySelectorAll('.form-alert').forEach((node) => node.remove());
  }

  function showErrors(form, errors) {
    let first = null;
    Object.entries(errors).forEach(([name, message]) => {
      if (name === '_form') { showFormAlert(form, message, false); return; }
      const field = form.elements[name];
      const el = field instanceof RadioNodeList ? field[0] : field;
      if (!el) { showFormAlert(form, message, false); return; }
      const id = `err-${form.id || 'form'}-${name}`;
      el.setAttribute('aria-invalid', 'true');
      el.setAttribute('aria-describedby', `${el.getAttribute('aria-describedby') || ''} ${id}`.trim());
      const host = el.closest('.form-field') || el.parentElement;
      host.insertAdjacentHTML('beforeend', `<p class="field-error" id="${id}">${escapeHtml(message)}</p>`);
      if (!first) first = el;
    });
    first?.focus();
  }

  function showFormAlert(form, message, retry = true) {
    form.querySelectorAll('.form-alert').forEach((node) => node.remove());
    const host = form.querySelector('.dialog-body') || form;
    const alert = document.createElement('div');
    alert.className = 'form-alert';
    alert.setAttribute('role', 'alert');
    alert.innerHTML = `${ICONS.error}<div><strong>${retry ? 'Not saved' : 'Check this form'}</strong><span>${escapeHtml(message)}</span></div>${retry ? '<button class="btn" type="button" data-retry>Try again</button>' : ''}`;
    alert.querySelector('[data-retry]')?.addEventListener('click', () => {
      const last = form._lastSubmitter;
      form.requestSubmit(last && last.isConnected && !last.hidden ? last : undefined);
    });
    host.prepend(alert);
  }

  async function runBusy(button, label, task) {
    const original = button ? button.innerHTML : '';
    if (button) { button.disabled = true; button.setAttribute('aria-busy', 'true'); button.textContent = label; }
    try { return await task(); } finally {
      if (button && button.isConnected) { button.disabled = false; button.removeAttribute('aria-busy'); button.innerHTML = original; }
    }
  }

  /** Binds a dialog form: inline validation, simulated save, recoverable error. */
  function bindForm(form, { validate, submit, busyLabel = 'Saving…' }) {
    if (!form) return;
    form.noValidate = true;
    form.addEventListener('input', (event) => {
      const el = event.target;
      if (el.getAttribute('aria-invalid') !== 'true') return;
      el.removeAttribute('aria-invalid');
      (el.closest('.form-field') || el.parentElement)?.querySelector('.field-error')?.remove();
    });
    form.addEventListener('submit', async (event) => {
      const submitter = event.submitter;
      if (submitter && submitter.value === 'cancel') return;
      event.preventDefault();
      if (form.dataset.busy === 'true') return;
      form._lastSubmitter = submitter || form._lastSubmitter;
      const action = submitter?.value || 'default';
      const values = formValues(form);
      clearErrors(form, true);
      const errors = validate ? validate(values, action) || {} : {};
      if (Object.keys(errors).length) { showErrors(form, errors); return; }
      form.dataset.busy = 'true';
      const button = submitter || form.querySelector('.dialog-actions .btn-primary');
      try {
        const keepOpen = await runBusy(button, busyLabel, () => submit(values, action));
        if (keepOpen !== true) form.closest('dialog')?.close();
      } catch (error) {
        showFormAlert(form, error.message || 'Something went wrong. Try again.');
      } finally {
        form.dataset.busy = 'false';
      }
    });
  }

  /* One reusable confirmation dialog, with optional reason field and an async action. */
  function confirmAction({ title, body, confirmLabel = 'Confirm', tone = 'danger', kicker = 'Confirm action', reason, action, busyLabel = 'Working…' }) {
    let dialog = document.getElementById('flux-confirm');
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.id = 'flux-confirm';
      dialog.setAttribute('aria-labelledby', 'flux-confirm-title');
      document.body.appendChild(dialog);
    }
    dialog.innerHTML = `<form method="dialog" id="flux-confirm-form">
      <div class="dialog-head"><div><p class="section-label dialog-kicker">${escapeHtml(kicker)}</p><h2 id="flux-confirm-title">${escapeHtml(title)}</h2></div><button class="btn btn-icon" value="cancel" aria-label="Close dialog"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"></path></svg></button></div>
      <div class="dialog-body"><p class="confirm-copy">${escapeHtml(body)}</p>${reason ? `<div class="form-field confirm-reason"><label class="form-label" for="flux-confirm-reason">${escapeHtml(reason.label)}</label><textarea class="textarea" id="flux-confirm-reason" name="reason" rows="3" placeholder="${escapeHtml(reason.placeholder || '')}"></textarea></div>` : ''}</div>
      <div class="dialog-actions"><button class="btn" value="cancel">Keep as is</button><button class="btn ${tone === 'danger' ? 'btn-danger-solid' : 'btn-primary'}" value="confirm" id="flux-confirm-submit">${escapeHtml(confirmLabel)}</button></div>
    </form>`;
    const form = dialog.querySelector('form');
    return new Promise((resolve) => {
      let done = false;
      bindForm(form, {
        busyLabel,
        validate: (values) => (reason && reason.required && (values.reason || '').length < 4 ? { reason: reason.requiredMessage || 'Add a reason of at least 4 characters.' } : {}),
        submit: async (values) => { await action(values.reason || ''); done = true; }
      });
      dialog.addEventListener('close', () => resolve(done), { once: true });
      dialog.showModal();
      (dialog.querySelector('textarea') || dialog.querySelector('#flux-confirm-submit')).focus();
    });
  }

  function downloadCsv(filename, rows) {
    const csv = rows.map((row) => row.map((cell) => {
      const value = String(cell ?? '');
      return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
    }).join(',')).join('\r\n');
    const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /* ---------- Role switcher (Employee / Approver) ---------- */
  let role = 'employee';
  const roleListeners = [];
  function readRole() {
    if (!storage) return 'employee';
    try { return storage.getItem(ROLE_KEY) || 'employee'; } catch { return 'employee'; }
  }
  function setRole(next) {
    role = next === 'approver' ? 'approver' : 'employee';
    document.body.dataset.activeRole = role;
    document.querySelectorAll('button[data-role]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.role === role)));
    if (storage) { try { storage.setItem(ROLE_KEY, role); } catch { /* ignore */ } }
    roleListeners.forEach((fn) => fn(role));
  }
  function initRoles() {
    document.querySelectorAll('button[data-role]').forEach((button) => button.addEventListener('click', () => setRole(button.dataset.role)));
    setRole(readRole());
  }

  /* ---------- Navigation and demo controls ---------- */
  function initNavigation() {
    document.body.classList.add('flux-enhanced');
    const route = { payments: 'index.html', payees: 'index.html', accounts: 'accounts.html', cards: 'cards.html', team: 'team.html', expenses: 'expenses.html', reports: 'reports.html', settings: 'settings.html' }[document.body.dataset.page];
    if (!route) return;
    document.querySelectorAll('.nav-link').forEach((link) => {
      const active = link.getAttribute('href') === route;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
    });
  }

  function syncDemoFlag() {
    const flag = document.getElementById('demo-fail-flag');
    if (flag) flag.hidden = !state.meta.failNext;
    const toggle = document.getElementById('demo-fail-toggle');
    if (toggle) toggle.checked = Boolean(state.meta.failNext);
  }

  /* ---------- User menu (account + sign out) ---------- */
  function initUserMenu() {
    const trigger = document.querySelector('.user-menu');
    if (!trigger) return;
    const user = state.meta.currentUser || {};
    trigger.removeAttribute('aria-label');
    trigger.setAttribute('aria-haspopup', 'true');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', 'account-menu');
    const wrap = document.createElement('div');
    wrap.className = 'user-menu-wrap';
    trigger.replaceWith(wrap);
    wrap.appendChild(trigger);
    const menu = document.createElement('div');
    menu.className = 'account-menu';
    menu.id = 'account-menu';
    menu.hidden = true;
    menu.innerHTML = `
      <div class="account-menu-head"><strong>${escapeHtml(user.name)}</strong><span>${escapeHtml(user.email)}</span><span>${escapeHtml(user.role)}, ${escapeHtml(state.meta.workspace)}</span></div>
      <div class="account-menu-actions"><a class="account-menu-item" href="settings.html">Approval policies</a><a class="account-menu-item" href="team.html">Team and roles</a><button class="account-menu-item" type="button" id="sign-out">Sign out</button></div>`;
    wrap.appendChild(menu);
    const close = () => { menu.hidden = true; trigger.setAttribute('aria-expanded', 'false'); };
    trigger.addEventListener('click', (event) => {
      event.stopPropagation();
      menu.hidden = !menu.hidden;
      trigger.setAttribute('aria-expanded', String(!menu.hidden));
      if (!menu.hidden) menu.querySelector('.account-menu-item')?.focus();
    });
    document.addEventListener('click', (event) => { if (!wrap.contains(event.target)) close(); });
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !menu.hidden) { close(); trigger.focus(); } });
    menu.querySelector('#sign-out').addEventListener('click', () => auth.signOut());
  }

  /* ---------- Demo tools: only with ?demo=1 (kept for the tab, ?demo=0 turns off) ---------- */
  function initDemoTools() {
    if (!demoTools) return;
    const host = document.createElement('div');
    host.className = 'demo-tools';
    host.id = 'demo-tools';
    host.innerHTML = `
      <div class="demo-tools-panel" id="demo-tools-panel" hidden>
        <label class="demo-toggle"><input type="checkbox" id="demo-fail-toggle"><span>Fail the next save<small>Shows the recoverable error state once</small></span></label>
        <div class="demo-tools-actions"><button class="btn btn-danger" type="button" id="demo-reset">Reset demo data</button></div>
      </div>
      <button class="demo-tools-toggle" type="button" aria-expanded="false" aria-controls="demo-tools-panel">Demo tools<span class="demo-flag" id="demo-fail-flag" hidden>Next save fails</span></button>`;
    document.body.appendChild(host);
    const toggle = host.querySelector('.demo-tools-toggle');
    const panel = host.querySelector('#demo-tools-panel');
    const close = () => { panel.hidden = true; toggle.setAttribute('aria-expanded', 'false'); };
    toggle.addEventListener('click', (event) => {
      event.stopPropagation();
      panel.hidden = !panel.hidden;
      toggle.setAttribute('aria-expanded', String(!panel.hidden));
    });
    document.addEventListener('click', (event) => { if (!host.contains(event.target)) close(); });
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !panel.hidden) { close(); toggle.focus(); } });
    panel.querySelector('#demo-fail-toggle').addEventListener('change', (event) => {
      store.setFailNext(event.target.checked);
      toast(event.target.checked ? 'The next save will fail once so you can see the error state.' : 'Save failure turned off.');
    });
    panel.querySelector('#demo-reset').addEventListener('click', () => {
      close();
      confirmAction({
        kicker: 'Demo tools',
        title: 'Reset demo data?',
        body: 'Every change made in this tab returns to the original data. This cannot be undone.',
        confirmLabel: 'Reset demo data',
        busyLabel: 'Resetting…',
        action: async () => {
          store.reset();
          const url = new URL(window.location.href);
          url.searchParams.delete('id');
          url.searchParams.delete('simulate');
          url.searchParams.delete('demo');
          window.location.replace(url.pathname.split('/').pop() + url.search);
        }
      });
    });
    syncDemoFlag();
  }

  function onReady(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn();
  }

  onReady(() => {
    initNavigation();
    initRoles();
    initUserMenu();
    initDemoTools();
  });

  window.Flux = {
    lens, auth, demoTools, store, FluxError, now, isoLocal, isoDate, parseDate, fmt, toUsd, parseAmount,
    escapeHtml, setText, getParam, setParam, toast, ICONS, stateBlock, loadView, bindRows, markSelected, revealPane,
    openDialog, bindForm, showFormAlert, confirmAction, downloadCsv, onReady,
    get role() { return role; },
    onRoleChange(fn) { roleListeners.push(fn); }
  };
})();
