import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';

const baseURL = process.env.FLUX_BASE_URL || 'http://127.0.0.1:4173';

test('source integrity repairs remain visible before human Round 01', async ({ page }) => {
  await page.goto(`${baseURL}/accounts.html`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Available to move', { exact: true })).toBeVisible();
  await expect(page.getByText('Excludes reserved balances · 5 currencies', { exact: true })).toBeVisible();

  await page.goto(`${baseURL}/cards.html`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.card-number')).toContainText('•••• · •••• · ••••');
  await expect(page.locator('.card-number')).not.toContainText('5412 · 8881 · 4902');

  await page.goto(`${baseURL}/index.html`, { waitUntil: 'domcontentloaded' });
  const processingRow = page.locator('.payment-row[data-status="processing"]').first();
  await expect(processingRow.locator('.stage-text')).toHaveText('Settlement');
  await processingRow.click();
  await expect(page.locator('#detail-status')).toHaveText('Processing');
  await expect(page.locator('.approval-rail .rail-step.current .rail-label')).toHaveText('Settlement');
  await expect(page.locator('.approval-rail .rail-step.current .rail-status')).toHaveText('In progress');

  const solventa = page.locator('.payment-row[data-counterparty="Solventa Sp. z o.o."]');
  await expect(solventa.locator('.stage-text')).toHaveText('Finance manager');

  await page.goto(`${baseURL}/reports.html`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Projected Sep close', { exact: true })).toBeVisible();
  await expect(page.getByText(/3 currency threshold signals are open/)).toBeVisible();
  await expect(page.getByText('Policy exceptions · 30d', { exact: true })).toBeVisible();
});

test('synthetic dogfood never mutates the human evidence boundary', async () => {
  const synthetic = await fs.readFile('research/synthetic/flux-form-dogfood-01/README.md', 'utf8');
  expect(synthetic).toContain('SYNTHETIC_DOGFOOD / NOT_DIRECT_USER_EVIDENCE');
  expect(synthetic).toContain('Verified DIRECT_USER sessions: **0**');

  const status = JSON.parse(await fs.readFile('research/validation/flux-round-01/status.json', 'utf8'));
  expect(status.verified_direct_user_sessions).toBe(0);

  const ledger = await fs.readFile('research/validation/flux-round-01/evidence-ledger.jsonl', 'utf8');
  expect(ledger).toBe('');
});
