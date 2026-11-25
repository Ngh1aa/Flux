import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';

const baseURL = process.env.FLUX_BASE_URL || 'http://127.0.0.1:4173';

test('source integrity repairs remain visible before human Round 01', async ({ page }) => {
  await page.goto(`${baseURL}/accounts.html`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Available to move', { exact: true })).toBeVisible();
  await expect(page.getByText('Excludes reserved money, 3 sources', { exact: true })).toBeVisible();


  await page.goto(`${baseURL}/index.html`, { waitUntil: 'domcontentloaded' });
  const processingRow = page.locator('.payment-row[data-status="processing"]').first();
  await expect(processingRow.locator('.stage-text')).toHaveText('Payout');
  await processingRow.click();
  await expect(page.locator('#detail-status')).toHaveText('Processing');
  await expect(page.locator('.approval-rail .rail-step.current .rail-label')).toHaveText('Payout');
  await expect(page.locator('.approval-rail .rail-step.current .rail-status')).toHaveText('In progress');

  const saoMai = page.locator('.payment-row[data-counterparty="Sao Mai Catering"]');
  await expect(saoMai.locator('.stage-text')).toHaveText('Team lead');

  await page.goto(`${baseURL}/reports.html`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Projected Sep close', { exact: true })).toBeVisible();
  await expect(page.getByText(/advances are close to the 15-day settlement window/)).toBeVisible();
  await expect(page.getByText('Policy exceptions, 30d', { exact: true })).toBeVisible();
});

test('Round 01 has one Flux-native canonical form and no human-evidence drift', async () => {
  const form = await fs.readFile('research/validation/flux-round-01/FLUX-NATIVE-FORM.md', 'utf8');
  expect(form).toContain('CANONICAL / READY_TO_USE');
  expect(form).toContain('D-01 Approval context');
  expect(form).toContain('D-02 Role boundary');
  // D-03 renamed on 2026-11-25: 'settlement' now means settling an advance with receipts. D-05 added with the re-plan.
  expect(form).toContain('D-03 Payout recovery');
  expect(form).toContain('D-04 Audit reconstruction');
  expect(form).toContain('D-05 Advance settlement');
  expect(form).not.toMatch(/USD|Arcwell|treasury console/);
  expect(form).toContain('https://flux-six-liard.vercel.app/');
  expect(form).not.toContain('Safe to spend');
  expect(form).not.toContain('Money Horizon');

  const status = JSON.parse(await fs.readFile('research/validation/flux-round-01/status.json', 'utf8'));
  expect(status.research_assets.canonical_form).toBe('research/validation/flux-round-01/FLUX-NATIVE-FORM.md');
  expect(status.verified_direct_user_sessions).toBe(0);
  expect(status.verified_proxy_sessions).toBe(0);

  const ledger = await fs.readFile('research/validation/flux-round-01/evidence-ledger.jsonl', 'utf8');
  expect(ledger).toBe('');
});
