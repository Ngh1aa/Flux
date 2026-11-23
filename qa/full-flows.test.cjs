/* Flux end-to-end flows.
   Run: serve the repo (py -3 -m http.server 8901 --bind 127.0.0.1), then
   NODE_PATH=<dir with playwright> node --test qa/full-flows.test.cjs
   Each test gets a fresh browser context, so sessionStorage starts from the seed. */
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');

const BASE = (process.env.FLUX_BASE_URL || 'http://127.0.0.1:8901').replace(/\/$/, '');
const APP_PAGES = ['index.html', 'payees.html', 'accounts.html', 'cards.html', 'team.html', 'expenses.html', 'reports.html', 'settings.html'];
const SIGNAL = /prototype|demo data|sandbox|simulat|fictional|state lab|portfolio review/i;
const DOC_PAGES = ['login.html', 'design-system.html', 'component-states.html', 'sitemap.html', 'user-flow.html', 'prototype.html', 'design-lens.html'];

let browser;
before(async () => { browser = await chromium.launch(); });
after(async () => { await browser?.close(); });

async function open(path, { width = 1440 } = {}) {
  const context = await browser.newContext({ viewport: { width, height: 1000 }, acceptDownloads: true });
  const page = await context.newPage();
  const errors = [];
  page.fluxRefused = [];
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    // Python's http.server has a small listen backlog on Windows and can refuse one of Chrome's
    // parallel connections. That is a test-server limit, handled by go() retrying the navigation.
    if (/ERR_CONNECTION_REFUSED/.test(m.text())) return;
    errors.push(`${m.text()} @ ${page.url()}`);
  });
  page.on('pageerror', (e) => errors.push(`pageerror ${e.message} @ ${page.url()}`));
  page.on('requestfailed', (r) => { if (r.url().startsWith(BASE)) page.fluxRefused.push(`${r.url()} ${r.failure()?.errorText}`); });
  await go(page, path);
  return { context, page, errors };
}

async function go(page, path, attempt = 1) {
  page.fluxRefused.length = 0;
  await page.goto(`${BASE}/${path}`);
  await page.waitForLoadState('load');
  if (page.fluxRefused.length) {
    assert.ok(attempt < 3, `local server kept refusing: ${page.fluxRefused.join(', ')}`);
    console.log(`  retrying ${path} after refused request: ${page.fluxRefused.join(', ')}`);
    return go(page, path, attempt + 1);
  }
  if (/simulate=load-error/.test(path)) return;
  const list = { index: '#payments-body tr[data-id]', payees: '#payees-body tr[data-id]', accounts: '#accounts-body tr[data-id]', cards: '#cards-body tr[data-id]', team: '#team-body tr[data-id]', expenses: '#expenses-body tr[data-id]', reports: '#chart-wrap svg', settings: '.policy-row' }[path.split('.')[0]];
  if (list) await page.waitForSelector(list);
}

async function done({ context, errors }) {
  await context.close();
  assert.deepEqual(errors, [], `console errors:\n${errors.join('\n')}`);
}

async function waitToast(page, text) {
  await page.waitForFunction((t) => {
    const node = document.querySelector('#flux-toast.show');
    return node && node.textContent.includes(t);
  }, text);
}

async function confirm(page, reason) {
  await page.waitForSelector('#flux-confirm[open]');
  if (reason !== undefined) await page.fill('#flux-confirm-reason', reason);
  await page.click('#flux-confirm-submit');
}

const text = (page, selector) => page.locator(selector).first().innerText();
const rowStatus = (page, tbody, id) => page.locator(`${tbody} tr[data-id="${id}"] .status`).innerText();

/* ------------------------------------------------------------------ */

test('every page loads without console errors and has no href="#"', async () => {
  const session = await open('index.html');
  for (const path of APP_PAGES.concat(DOC_PAGES)) {
    await go(session.page, path);
    await session.page.waitForLoadState('load');
    const deadLinks = await session.page.locator('a[href="#"], a[href=""], a:not([href])').count();
    assert.equal(deadLinks, 0, `${path} has ${deadLinks} dead links`);
  }
  await done(session);
});

test('product pages show no prototype signals; demo tools only with ?demo=1', async () => {
  const session = await open('index.html');
  const { page } = session;
  for (const path of APP_PAGES) {
    await go(page, path);
    const body = await page.locator('body').innerText();
    assert.doesNotMatch(body, SIGNAL, `${path} shows a prototype signal: ${body.match(SIGNAL)?.[0]}`);
    assert.equal(await page.locator('#demo-tools').count(), 0, `${path} shows demo tools without ?demo=1`);
    assert.equal(await page.locator('a[href*="design-lens"], a[href*="prototype.html"], a[href*="design-system"], a[href*="component-states"], a[href*="sitemap"], a[href*="user-flow"]').count(), 0, `${path} links to documentation`);
    assert.match(await page.locator('.app-footer').innerText(), /^Concept product designed by Đỗ Anh Nghĩa\.$/);
  }
  // Dialog and menu copy that is hidden until opened.
  await go(page, 'index.html');
  await page.click('.user-menu');
  assert.doesNotMatch(await page.locator('#account-menu').innerText(), SIGNAL);
  await page.keyboard.press('Escape');
  await page.click('#open-payment-dialog');
  await page.click('#payment-dialog [data-nav="next"]');
  await page.fill('#amount-input', '900');
  await page.click('#payment-dialog [data-nav="next"]');
  assert.doesNotMatch(await page.locator('#payment-dialog').innerText(), SIGNAL);
  await page.click('#payment-dialog [value="cancel"]');

  await go(page, 'index.html?demo=1');
  await page.waitForSelector('#demo-tools .demo-tools-toggle', { state: 'visible' });
  await page.click('.demo-tools-toggle');
  await page.waitForSelector('#demo-reset', { state: 'visible' });
  await page.waitForSelector('#demo-fail-toggle', { state: 'visible' });
  await go(page, 'cards.html');
  await page.waitForSelector('#demo-tools', { state: 'visible' });
  await go(page, 'cards.html?demo=0');
  assert.equal(await page.locator('#demo-tools').count(), 0, '?demo=0 turns demo tools off');
  await done(session);
});

test('root opens signed in; sign out shows login; continue and credentials sign back in', async () => {
  const session = await open('');
  const { page } = session;
  await page.waitForSelector('#payments-body tr[data-id]');
  assert.match(await page.locator('.user-menu').innerText(), /Võ Ngọc Lan/);
  await page.click('.user-menu');
  await Promise.all([page.waitForURL(/login\.html/), page.click('#sign-out')]);
  await page.waitForSelector('#continue-as');
  assert.doesNotMatch(await page.locator('body').innerText(), SIGNAL);
  // Product pages stay behind the login screen while signed out.
  await page.goto(`${BASE}/cards.html`);
  await page.waitForURL(/login\.html\?next=cards\.html/);
  await page.fill('#login-password', 'wrong');
  await page.click('#login-form button[type="submit"]');
  await page.waitForSelector('#login-error:not([hidden])');
  await page.fill('#login-email', 'jamie.stone@northstar.co');
  await page.fill('#login-password', 'northstar');
  await Promise.all([page.waitForURL(/cards\.html$/), page.click('#login-form button[type="submit"]')]);
  await page.waitForSelector('#cards-body tr[data-id]');
  await page.click('.user-menu');
  await Promise.all([page.waitForURL(/login\.html/), page.click('#sign-out')]);
  await Promise.all([page.waitForURL(/index\.html$/), page.click('#continue-as')]);
  await page.waitForSelector('#payments-body tr[data-id]');
  await done(session);
});

test('requests: new request validates, picks the rule, submits and persists', async () => {
  const s = await open('index.html');
  const { page } = s;
  await page.click('#open-payment-dialog');
  await page.waitForSelector('#payment-dialog[open]');
  await page.selectOption('#type-select', 'Vendor payment');
  await page.selectOption('#payee-select', 'new');
  await page.click('#payment-dialog [data-nav="next"]');
  await page.waitForSelector('#err-new-payment-form-newPayeeName');
  await page.selectOption('#payee-select', 'PYE-1001');
  await page.click('#payment-dialog [data-nav="next"]');
  await page.waitForSelector('[data-step="2"]:not([hidden])');
  await page.fill('#amount-input', '');
  await page.fill('#execution-input', '2026-09-01');
  await page.click('#payment-dialog [data-nav="next"]');
  assert.match(await text(page, '#err-new-payment-form-amount'), /Enter an amount/);
  assert.match(await text(page, '#err-new-payment-form-executionDate'), /later date/);
  await page.fill('#amount-input', '24,000,000');
  await page.fill('#execution-input', '2026-09-20');
  await page.fill('#purpose-input', 'Booth banner printing');
  assert.match(await text(page, '#policy-preview'), /Rule 01/);
  await page.click('#payment-dialog [data-nav="next"]');
  await page.waitForSelector('[data-step="3"]:not([hidden])');
  assert.match(await text(page, '#review-chain'), /Team lead.*Director.*Payout/s);
  await page.click('#submit-payment-btn');
  await waitToast(page, 'submitted for approval');
  await page.waitForSelector('#payment-dialog', { state: 'hidden' });
  assert.equal(await rowStatus(page, '#payments-body', 'REQ-2042'), 'Pending');
  assert.equal(await text(page, '#detail-reference'), 'REQ-2042');
  assert.equal(await text(page, '#approval-rail .rail-step.current .rail-label'), 'Team lead');
  assert.match(await text(page, '#detail-policy'), /Rule 01/);
  await page.reload();
  await page.waitForSelector('#payments-body tr[data-id="REQ-2042"]');
  assert.match(page.url(), /id=REQ-2042/);
  await done(s);
});

test('requests: an advance goes to the requester; a small one needs only the team lead', async () => {
  const s = await open('index.html');
  const { page } = s;
  await page.click('#open-payment-dialog');
  assert.equal(await page.inputValue('#type-select'), 'Advance');
  assert.equal(await page.locator('#payee-select').isVisible(), false, 'no vendor picker for an advance');
  assert.match(await text(page, '#payee-preview'), /Võ Ngọc Lan/);
  await page.click('#payment-dialog [data-nav="next"]');
  await page.fill('#amount-input', '3,000,000');
  await page.fill('#purpose-input', 'Client visit in Biên Hòa');
  assert.match(await text(page, '#policy-preview'), /Default: team lead approval/);
  await page.fill('#amount-input', '12,000,000');
  assert.match(await text(page, '#policy-preview'), /Rule 03/);
  await page.fill('#amount-input', '1500.5');
  await page.click('#payment-dialog [data-nav="next"]');
  assert.match(await text(page, '#err-new-payment-form-amount'), /whole dong/);
  await done(s);
});

test('requests: draft save, edit, submit and delete', async () => {
  const s = await open('index.html');
  const { page } = s;
  await page.click('#open-payment-dialog');
  await page.selectOption('#type-select', 'Vendor payment');
  await page.selectOption('#payee-select', 'new');
  await page.fill('#new-payee-name', 'Đức Thành Signage');
  await page.fill('#new-payee-account', '0071 0004 9988');
  await page.click('#payment-dialog [data-nav="next"]');
  await page.fill('#amount-input', '1500000');
  await page.click('#save-draft-btn');
  await waitToast(page, 'saved');
  const id = 'REQ-2042';
  assert.equal(await rowStatus(page, '#payments-body', id), 'Draft');
  await page.click('#edit-draft');
  await page.waitForSelector('#payment-dialog[open]');
  assert.match(await text(page, '#payment-dialog-title'), /Edit draft REQ-2042/);
  await page.click('#payment-dialog [data-nav="next"]');
  await page.fill('#amount-input', '1,750,000');
  await page.fill('#purpose-input', 'Shop sign repair');
  await page.click('#save-draft-btn');
  await waitToast(page, `Draft ${id} updated`);
  assert.equal(await text(page, '#detail-amount'), 'VND 1,750,000');
  await page.click('#submit-draft');
  await waitToast(page, 'submitted');
  assert.equal(await rowStatus(page, '#payments-body', id), 'Pending');
  // A vendor added today triggers the new vendor check.
  assert.match(await text(page, '#detail-policy'), /Rule 02/);
  // The new vendor was saved for next time.
  await go(page, 'payees.html');
  await page.waitForSelector('#payees-body tr:has-text("Đức Thành Signage")');
  // Delete the seeded draft.
  await go(page, 'index.html?id=REQ-2024');
  await page.waitForSelector('#delete-draft:not([hidden])');
  await page.click('#delete-draft');
  await confirm(page);
  await waitToast(page, 'Draft REQ-2024 deleted');
  assert.equal(await page.locator('#payments-body tr[data-id="REQ-2024"]').count(), 0);
  await done(s);
});

test('requests: approve through the chain, reject with reason, cancel pending', async () => {
  const s = await open('index.html?id=REQ-2041');
  const { page } = s;
  assert.equal(await page.locator('#approve-action').isDisabled(), true, 'employee cannot approve');
  await page.click('[data-role="approver"]');
  await page.click('#approve-action');
  await waitToast(page, 'Next: Director');
  assert.equal(await text(page, '#approval-rail .rail-step.current .rail-label'), 'Director');
  await page.click('#approve-action');
  await waitToast(page, 'pays it out next');
  assert.equal(await text(page, '#detail-status'), 'Processing');
  // Reject requires a reason.
  await page.click('#payments-body tr[data-id="REQ-2036"]');
  await page.click('#reject-action');
  await page.waitForSelector('#flux-confirm[open]');
  await page.click('#flux-confirm-submit');
  await page.waitForSelector('#flux-confirm .field-error');
  await page.fill('#flux-confirm-reason', 'The lunch receipt is missing');
  await page.click('#flux-confirm-submit');
  await waitToast(page, 'REQ-2036 rejected');
  assert.equal(await text(page, '#detail-status'), 'Rejected');
  assert.match(await text(page, '#detail-outcome'), /The lunch receipt is missing/);
  // The requester cancels a pending request.
  await page.click('[data-role="employee"]');
  await page.click('#payments-body tr[data-id="REQ-2031"]');
  await page.click('#cancel-payment');
  await confirm(page, 'Workshop moved to October');
  await waitToast(page, 'REQ-2031 cancelled');
  assert.equal(await rowStatus(page, '#payments-body', 'REQ-2031'), 'Cancelled');
  await page.click('[data-filter="closed"]');
  assert.equal(await page.locator('#payments-body tr[data-id]').count(), 2);
  await done(s);
});

test('requests: save failure (demo tools) is recoverable, unknown id shows not found, load error retries', async () => {
  const s = await open('index.html?demo=1&id=REQ-2041');
  const { page } = s;
  await page.click('.demo-tools-toggle');
  await page.check('#demo-fail-toggle');
  await page.keyboard.press('Escape');
  await page.waitForSelector('#demo-fail-flag:not([hidden])');
  await page.click('[data-role="approver"]');
  await page.click('#approve-action');
  await page.waitForSelector('.action-error');
  assert.match(await text(page, '.action-error'), /did not respond/i);
  assert.equal(await text(page, '#detail-status'), 'Pending', 'nothing saved on failure');
  await page.click('.action-error button');
  await waitToast(page, 'Next: Director');
  await page.waitForSelector('#demo-fail-flag', { state: 'hidden' });

  await go(page, 'index.html?id=REQ-0000');
  await page.waitForSelector('#payment-not-found:not([hidden])');
  assert.match(await text(page, '#payment-not-found'), /REQ-0000 not found/);
  await page.click('#payment-not-found [data-state-action]');
  await page.waitForSelector('#payment-detail-body:not([hidden])');

  await go(page, 'index.html?simulate=load-error');
  await page.waitForSelector('.load-error');
  await page.click('.load-error button');
  await page.waitForSelector('#payments-body tr[data-id]');

  await page.fill('#payment-search', 'no such request');
  await page.waitForSelector('#payment-empty-state:has-text("No matching requests")');
  await done(s);
});

test('request form failure keeps input and retries', async () => {
  const s = await open('index.html?demo=1');
  const { page } = s;
  await page.click('.demo-tools-toggle');
  await page.check('#demo-fail-toggle');
  await page.keyboard.press('Escape');
  await page.click('#open-payment-dialog');
  await page.click('#payment-dialog [data-nav="next"]');
  await page.fill('#amount-input', '900000');
  await page.fill('#purpose-input', 'Parking fees');
  await page.click('#payment-dialog [data-nav="next"]');
  await page.click('#submit-payment-btn');
  await page.waitForSelector('#new-payment-form .form-alert');
  assert.equal(await page.inputValue('#amount-input'), '900000');
  await page.click('#new-payment-form .form-alert [data-retry]');
  await waitToast(page, 'submitted for approval');
  await done(s);
});

test('vendors: create, view, edit, delete and empty state', async () => {
  const s = await open('payees.html');
  const { page } = s;
  await page.click('#add-payee');
  await page.click('#payee-submit');
  await page.waitForSelector('#err-payee-form-name');
  await page.fill('#payee-name', 'Ánh Dương Signs');
  await page.selectOption('#payee-country', 'Đà Nẵng');
  await page.fill('#payee-bank', 'BIDV');
  await page.fill('#payee-account', 'short');
  await page.fill('#payee-email', 'not-an-email');
  await page.click('#payee-submit');
  await page.waitForSelector('#err-payee-form-account');
  await page.waitForSelector('#err-payee-form-email');
  await page.fill('#payee-account', '3110 0045 7781');
  await page.fill('#payee-email', 'sales@anhduongsigns.vn');
  await page.click('#payee-submit');
  await waitToast(page, 'Ánh Dương Signs saved');
  assert.equal(await text(page, '#payee-pane-name'), 'Ánh Dương Signs');
  await page.click('#payee-edit');
  await page.fill('#payee-bank', 'ACB');
  await page.click('#payee-submit');
  await waitToast(page, 'Ánh Dương Signs updated');
  assert.equal(await text(page, '#payee-pane-bank'), 'ACB');
  assert.match(await page.getAttribute('#payee-pay', 'href'), /index\.html\?new=PYE-1006/);
  // Delete every payee to reach the true empty state.
  while (await page.locator('#payees-body tr[data-id]').count()) {
    const name = await text(page, '#payee-pane-name');
    await page.click('#payee-delete');
    await confirm(page);
    await waitToast(page, `${name} removed`);
  }
  await page.waitForSelector('#payees-empty:has-text("No saved vendors")');
  await page.click('#payees-empty [data-state-action]');
  await page.waitForSelector('#payee-dialog[open]');
  await done(s);
});

test('funds: detail, transaction search and filter, move money, scheduled cancel, statement', async () => {
  const s = await open('accounts.html?id=TCB');
  const { page } = s;
  assert.equal(await text(page, '#account-pane-title'), 'Techcombank collections');
  await page.fill('#tx-search', 'Vinmart');
  assert.equal(await page.locator('#tx-body tr[data-id]').count(), 1);
  await page.click('[data-tx-filter="debit"]');
  await page.waitForSelector('#tx-empty:has-text("No matching transactions")');
  await page.click('#tx-empty [data-state-action]');
  assert.equal(await page.locator('#tx-body tr[data-id]').count(), 5);
  await page.click('#accounts-body tr[data-id="VCB"]');
  await page.click('#open-move-money');
  await page.selectOption('#move-to', 'VCB');
  await page.fill('#move-amount', '99999999999');
  await page.click('#move-money-form .btn-primary');
  await page.waitForSelector('#err-move-money-form-to');
  assert.match(await text(page, '#err-move-money-form-amount'), /Exceeds/);
  await page.selectOption('#move-to', 'TCB');
  await page.fill('#move-amount', '10,000,000');
  assert.match(await text(page, '#move-preview'), /VND 10,000,000.*Techcombank collections/);
  await page.click('#move-money-form .btn-primary');
  await waitToast(page, 'completed');
  assert.match(await text(page, '#accounts-body tr[data-id="VCB"] td:nth-child(3)'), /1,274,500,000/);
  // Scheduled top-up of petty cash, then cancel it from the transaction detail.
  await page.click('#open-move-money');
  await page.selectOption('#move-to', 'CASH');
  await page.fill('#move-amount', '5000000');
  await page.fill('#move-date', '2026-09-20');
  await page.click('#move-money-form .btn-primary');
  await waitToast(page, 'scheduled');
  assert.equal(await text(page, '#metric-scheduled'), '01');
  await page.click('[data-tx-filter="open"]');
  await page.click('#tx-body tr:has-text("Transfer to Petty cash")');
  await page.waitForSelector('#tx-cancel:not([hidden])');
  await page.click('#tx-cancel');
  await confirm(page);
  await waitToast(page, 'Reserved funds released');
  assert.equal(await text(page, '#metric-scheduled'), '00');
  const [download] = await Promise.all([page.waitForEvent('download'), page.click('#export-statement')]);
  assert.match(download.suggestedFilename(), /^flux-statement-VCB-.*\.csv$/);
  const csv = fs.readFileSync(await download.path(), 'utf8');
  assert.match(csv, /Transaction,Date,Description/);
  assert.match(csv, /Transfer to Techcombank collections/);
  await go(page, 'accounts.html?id=XYZ');
  await page.waitForSelector('#account-not-found:has-text("Account XYZ not found")');
  await done(s);
});

test('cards: freeze, edit limit, issue, cancel with confirmation, not found', async () => {
  const s = await open('cards.html?id=CRD-4821');
  const { page } = s;
  await page.click('#freeze-card');
  await waitToast(page, 'frozen');
  assert.equal(await text(page, '#card-pane-status'), 'Frozen');
  await page.click('#freeze-card');
  await waitToast(page, 'unfrozen');
  assert.equal(await text(page, '#card-pane-status'), 'Active');
  await page.click('#edit-limit');
  await page.fill('#limit-input', '1000');
  await page.click('#limit-form .btn-primary');
  assert.match(await text(page, '#err-limit-form-limit'), /Below this cycle/);
  await page.fill('#limit-input', '9000');
  await page.click('#limit-form .btn-primary');
  await waitToast(page, 'set to $9,000.00');
  assert.equal(await text(page, '#card-pane-limit'), '$9,000.00');
  await page.click('#open-issue-card');
  await page.selectOption('#issue-holder', 'Mateo Ruiz');
  await page.click('#issue-card-form .btn-primary');
  await page.waitForSelector('#err-issue-card-form-limit');
  await page.fill('#issue-limit', '2500');
  await page.click('#issue-card-form .btn-primary');
  await waitToast(page, 'issued to Mateo Ruiz');
  assert.equal(await text(page, '#card-pane-owner'), 'Mateo Ruiz');
  assert.equal(await text(page, '#card-pane-status'), 'Active');
  await page.click('#cards-body tr[data-id="CRD-1104"]');
  await page.click('#cancel-card');
  await confirm(page, 'Employee changed team');
  await waitToast(page, '1104 cancelled');
  assert.equal(await text(page, '#card-pane-status'), 'Cancelled');
  assert.equal(await page.locator('#freeze-card').isDisabled(), true);
  await page.click('[data-card-filter="Cancelled"]');
  assert.equal(await page.locator('#cards-body tr[data-id]').count(), 1);
  await go(page, 'cards.html?id=CRD-0000');
  await page.waitForSelector('#card-not-found:has-text("Card CRD-0000 not found")');
  await done(s);
});

test('team: invite, resend, edit role, remove, last-CFO guard', async () => {
  const s = await open('team.html');
  const { page } = s;
  await page.click('#open-invite');
  await page.fill('#invite-name', 'Dana Okafor');
  await page.fill('#invite-email', 'dana@gmail.com');
  await page.click('#invite-form .btn-primary');
  assert.match(await text(page, '#err-invite-form-email'), /northstar\.co/);
  await page.fill('#invite-email', 'alex.smith@northstar.co');
  await page.click('#invite-form .btn-primary');
  assert.match(await text(page, '#err-invite-form-email'), /already a member/);
  await page.fill('#invite-email', 'dana.okafor@northstar.co');
  await page.selectOption('#invite-role', 'Bookkeeper');
  await page.click('#invite-form .btn-primary');
  await waitToast(page, 'Invite sent to dana.okafor@northstar.co');
  assert.equal(await text(page, '#member-pane-status'), 'Invited');
  await page.click('#resend-invite');
  await waitToast(page, 'Invite resent');
  await page.click('#edit-member');
  await page.selectOption('#member-role', 'Finance manager');
  await page.click('#member-form .btn-primary');
  await waitToast(page, 'Dana Okafor is now Finance manager');
  assert.equal(await text(page, '#member-pane-role'), 'Finance manager');
  await page.click('#remove-member');
  await confirm(page);
  await waitToast(page, 'Invite for Dana Okafor revoked');
  await page.click('#team-body tr[data-id="MEM-03"]');
  await page.click('#remove-member');
  await confirm(page);
  await waitToast(page, 'Priya Nair removed');
  assert.equal(await page.locator('#team-body tr[data-id="MEM-03"]').count(), 0);
  await page.click('#team-body tr[data-id="MEM-02"]');
  await page.click('#edit-member');
  await page.selectOption('#member-role', 'Employee');
  await page.click('#member-form .btn-primary');
  assert.match(await text(page, '#err-member-form-role'), /only active CFO/);
  await page.click('#member-form [value="cancel"]');
  await page.selectOption('#role-filter', 'Admin');
  await page.waitForSelector('#team-empty:has-text("No matching members")');
  await go(page, 'team.html?id=MEM-99');
  await page.waitForSelector('#member-not-found:has-text("Member MEM-99 not found")');
  await done(s);
});

test('settlements: add a receipt, edit, delete, approve, reject with reason', async () => {
  const s = await open('expenses.html');
  const { page } = s;
  await page.click('#open-new-expense');
  await page.fill('#expense-date', '2026-12-01');
  await page.setInputFiles('#expense-receipt', { name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('x') });
  await page.click('#expense-submit');
  await page.waitForSelector('#err-expense-form-merchant');
  assert.match(await text(page, '#err-expense-form-date'), /future/);
  assert.match(await text(page, '#err-expense-form-receipt'), /PDF, PNG or JPG/);
  await page.fill('#expense-merchant', 'Vietjet Air');
  await page.fill('#expense-amount', '1480000.5');
  await page.click('#expense-submit');
  assert.match(await text(page, '#err-expense-form-amount'), /no decimals/);
  await page.fill('#expense-amount', '1,480,000');
  await page.selectOption('#expense-category', 'Travel');
  await page.fill('#expense-date', '2026-09-14');
  await page.setInputFiles('#expense-receipt', { name: 'vietjet-boarding.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF') });
  await page.click('#expense-submit');
  await waitToast(page, 'EXP-44183 submitted');
  assert.match(await text(page, '#receipt-host'), /vietjet-boarding\.pdf/);
  assert.equal(await text(page, '#expense-pane-status'), 'Needs review');
  await page.click('#edit-expense');
  await page.fill('#expense-amount', '1,520,000');
  await page.click('#expense-submit');
  await waitToast(page, 'EXP-44183 updated');
  assert.equal(await text(page, '#expense-pane-amount'), 'VND 1,520,000');
  await page.click('#delete-expense');
  await confirm(page);
  await waitToast(page, 'EXP-44183 deleted');
  // Accountant decisions.
  await page.click('[data-role="approver"]');
  await page.click('#expenses-body tr[data-id="EXP-44182"]');
  await page.click('#approve-expense');
  await waitToast(page, 'Mường Thanh Đà Nẵng approved and counted toward Advance REQ-2038');
  assert.equal(await rowStatus(page, '#expenses-body', 'EXP-44182'), 'Approved');
  await page.click('#expenses-body tr[data-id="EXP-44098"]');
  await page.click('#reject-expense');
  await page.waitForSelector('#flux-confirm[open]');
  await page.click('#flux-confirm-submit');
  await page.waitForSelector('#flux-confirm .field-error');
  await confirm(page, 'Book economy, not business class');
  await waitToast(page, 'Vietnam Airlines rejected');
  assert.match(await text(page, '#expense-outcome'), /economy/);
  // A receipt that never arrived shows the attach state.
  await page.click('#expenses-body tr[data-id="EXP-44169"]');
  await page.waitForSelector('#receipt-host:has-text("No receipt attached")');
  await page.click('[data-expense-filter="rejected"]');
  assert.equal(await page.locator('#expenses-body tr[data-id]').count(), 1);
  await go(page, 'expenses.html?id=EXP-1');
  await page.waitForSelector('#expense-not-found:has-text("Expense EXP-1 not found")');
  await done(s);
});

test('reports: date range, filters, empty state, client-side CSV export, schedule', async () => {
  const s = await open('reports.html');
  const { page } = s;
  const total30 = await text(page, '#report-total-spend');
  assert.notEqual(total30, '$0');
  assert.equal(await page.locator('#report-exceptions-label').textContent(), 'Policy exceptions, 30d');
  await page.click('[data-report-range="90d"]');
  await page.waitForFunction((t) => document.getElementById('report-total-spend').textContent !== t, total30);
  assert.equal(await text(page, '#report-range-label'), '90-day operating window');
  await page.fill('#report-from', '2026-09-10');
  await page.fill('#report-to', '2026-09-01');
  await page.dispatchEvent('#report-to', 'change');
  await page.waitForSelector('#report-filters .field-error');
  await page.fill('#report-to', '2026-09-15');
  await page.dispatchEvent('#report-to', 'change');
  await page.waitForSelector('#report-filters .field-error', { state: 'detached' });
  assert.match(await text(page, '#report-range-label'), /10 Sep 2026 to 15 Sep 2026/);
  await page.selectOption('#report-currency', 'SGD');
  await page.selectOption('#report-source', 'card');
  await page.waitForSelector('#report-empty:not([hidden])');
  assert.match(await text(page, '#report-empty'), /No spend in this view/);
  await page.click('#report-empty [data-state-action]');
  await page.waitForSelector('#chart-wrap:not([hidden]) svg');
  await page.selectOption('#report-currency', 'EUR');
  const [download] = await Promise.all([page.waitForEvent('download'), page.click('#export-report')]);
  assert.match(download.suggestedFilename(), /^flux-report-2026-08-17_2026-09-15\.csv$/);
  const lines = fs.readFileSync(await download.path(), 'utf8').trim().split(/\r?\n/);
  assert.match(lines[0], /Entry,Date,Category,Source,Currency,Amount \(USD\)/);
  assert.ok(lines.length > 10, 'export has rows');
  assert.ok(lines.slice(1).every((line) => line.split(',')[4] === 'EUR'), 'export respects the currency filter');
  await page.click('#open-schedule');
  await page.fill('#schedule-recipient', 'nope');
  await page.click('#schedule-form .btn-primary');
  await page.waitForSelector('#err-schedule-form-recipient');
  await page.fill('#schedule-recipient', 'sarah.jensen@northstar.co');
  await page.click('#schedule-form .btn-primary');
  await waitToast(page, 'Schedule saved');
  await page.waitForSelector('#schedule-line:not([hidden])');
  await page.click('#schedule-remove');
  await confirm(page);
  await waitToast(page, 'schedule removed');
  await page.waitForSelector('#schedule-line', { state: 'hidden' });
  await done(s);
});

test('approval policies: create, edit, delete with validation; history; export; not found', async () => {
  const s = await open('settings.html');
  const { page } = s;
  await page.click('#new-rule-button');
  await page.click('#new-rule-form .btn-primary');
  await page.waitForSelector('#err-new-rule-form-name');
  await page.waitForSelector('#err-new-rule-form-value');
  await page.fill('#rule-new-name', 'High-value EUR payments');
  await page.fill('#rule-new-value', 'lots');
  await page.click('#new-rule-form .btn-primary');
  assert.match(await text(page, '#err-new-rule-form-value'), /USD 25,000/);
  await page.fill('#rule-new-value', '50000');
  await page.selectOption('#rule-new-approver', 'CFO');
  await page.click('#new-rule-form .btn-primary');
  await waitToast(page, 'High-value EUR payments');
  assert.equal(await text(page, '.policy-row >> nth=0 >> .policy-summary strong'), 'High-value EUR payments');
  assert.match(await text(page, '#condition-token-row'), /amount > USD 50,000/);
  // Edit: invalid condition, then valid condition + approver, then save.
  await page.selectOption('#condition-field', 'currency');
  await page.selectOption('#condition-operator', '>');
  await page.fill('#condition-value', 'EUR');
  await page.click('#add-condition');
  await page.waitForSelector('#conditions-section .field-error');
  await page.selectOption('#condition-operator', '=');
  await page.click('#add-condition');
  assert.match(await text(page, '#condition-token-row'), /currency = EUR/);
  await page.selectOption('#approver-select', 'Controller');
  await page.click('#add-approver');
  await page.waitForSelector('#policy-footer-status:has-text("unsaved changes")');
  await page.fill('#rule-name', '');
  await page.click('#save-policy');
  await page.waitForSelector('#policy-builder .field-error');
  await page.fill('#rule-name', 'High-value EUR payments');
  await page.click('#save-policy');
  await waitToast(page, 'saved');
  assert.match(await text(page, '.policy-row >> nth=0'), /CFO → Controller/);
  await page.reload();
  await page.waitForSelector('.policy-row');
  assert.match(await text(page, '.policy-row >> nth=0'), /currency = EUR/);
  await page.click('#delete-rule');
  await confirm(page);
  await waitToast(page, 'deleted');
  assert.equal(await page.locator('.policy-row').count(), 4);
  await page.click('#history-button');
  await page.waitForSelector('#history-dialog[open]');
  assert.match(await text(page, '#history-list'), /deleted/);
  await page.click('#history-dialog [value="cancel"]');
  const [download] = await Promise.all([page.waitForEvent('download'), page.click('#export-rules')]);
  assert.match(fs.readFileSync(await download.path(), 'utf8'), /Large requests/);
  await go(page, 'settings.html?id=POL-99');
  await page.waitForSelector('#policy-not-found:has-text("Rule POL-99 not found")');
  await done(s);
});

test('reset demo data (demo tools) restores the seed and survives navigation', async () => {
  const s = await open('payees.html?demo=1&id=PYE-1001');
  const { page } = s;
  await page.click('#payee-delete');
  await confirm(page);
  await waitToast(page, 'removed');
  await go(page, 'index.html');
  await go(page, 'payees.html');
  assert.equal(await page.locator('#payees-body tr[data-id="PYE-1001"]').count(), 0, 'deletion persists across navigation');
  await page.click('.demo-tools-toggle');
  await page.click('#demo-reset');
  await Promise.all([page.waitForURL(/payees\.html$/), confirm(page)]);
  await page.waitForSelector('#payees-body tr[data-id="PYE-1001"]');
  assert.equal(await page.locator('#payees-body tr[data-id]').count(), 5);
  await done(s);
});

test('mobile width: core flows stay usable at 390px', async () => {
  const s = await open('index.html', { width: 390 });
  const { page } = s;
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert.ok(overflow <= 0, `page overflows horizontally by ${overflow}px`);
  await page.click('#open-payment-dialog');
  await page.waitForSelector('#payment-dialog[open]');
  await page.click('#payment-dialog [data-nav="next"]');
  await page.fill('#amount-input', '250');
  await page.fill('#purpose-input', 'Courier');
  await page.click('#payment-dialog [data-nav="next"]');
  await page.click('#submit-payment-btn');
  await waitToast(page, 'submitted for approval');
  await done(s);
});
