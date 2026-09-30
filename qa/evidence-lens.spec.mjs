import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';

const baseURL = process.env.FLUX_BASE_URL || 'http://127.0.0.1:4173';

test('Flux product exposes a truthful recruiter evidence entry', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${baseURL}/index.html`, { waitUntil: 'domcontentloaded' });

  const entry = page.locator('.flux-review-entry');
  await expect(entry).toBeVisible();
  await expect(entry).toContainText('PORTFOLIO REVIEW');
  await expect(entry).toHaveAttribute('href', 'design-lens.html');

  await page.goto(`${baseURL}/index.html?lens=1`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.flux-review-entry')).toHaveCount(0);
});

test('Flux evidence lens exposes deep decision metadata, comparison, tour and safe forced states', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${baseURL}/design-lens.html`, { waitUntil: 'domcontentloaded' });

  const frame = page.frameLocator('#frame');
  await expect(frame.locator('.lens-pin')).toHaveCount(4);
  await expect(page.getByText('Direct-user evidence is currently')).toBeVisible();
  await expect(page.locator('.lens-proof-strip')).toContainText('0');
  await expect(page.locator('.lens-proof-strip')).toContainText('VERIFIED USERS');
  await expect(page.getByText('Research gate:')).toBeVisible();
  await expect(page.getByRole('link', { name: /RETURN TO NORMAL PRODUCT/ })).toHaveAttribute('href', 'index.html');

  await frame.locator('.lens-pin', { hasText: 'D-03' }).click();
  const pop = frame.locator('.lens-pop');
  await expect(pop).toContainText('Consequence + recovery');
  await expect(pop).toContainText('PLANNED_VALIDATION');
  await expect(pop).toContainText('Trade-off');
  await expect(pop).toContainText('Task 3');

  await page.getByRole('button', { name: 'CONCEPTUAL BASELINE' }).click();
  await expect(frame.locator('.lens-baseline-banner')).toContainText('NOT A HISTORICAL SHIPPED SCREEN');

  await page.getByRole('button', { name: 'CURRENT PROTOTYPE' }).click();
  await page.getByRole('button', { name: 'PERMISSION DENIED' }).click();
  await expect(frame.locator('.lens-state-note.warn')).toContainText('no action was committed');

  await page.getByRole('button', { name: 'APPROVAL EXPIRED' }).click();
  await expect(frame.locator('.lens-state-note')).toContainText(/expired/i);

  await page.getByRole('button', { name: 'INSUFFICIENT LIQUIDITY' }).click();
  await expect(frame.locator('.lens-state-note')).toContainText(/liquidity/i);

  await page.getByRole('button', { name: 'SETTLEMENT FAILED' }).click();
  await expect(frame.locator('.lens-state-note.danger')).toContainText('NO MONEY MOVED');
  await expect(frame.locator('#detail-status')).toHaveText('Failed');
  await expect(frame.locator('.lens-state-note.danger')).toContainText(/duplicate/i);

  await page.getByRole('button', { name: 'START 5-STEP TOUR' }).click();
  await expect(page.locator('#tourCard')).toBeVisible();
  await expect(page.locator('#tourIndex')).toHaveText('01 / 05');
  await expect(frame.locator('.lens-tour-focus')).toHaveCount(1);

  await fs.mkdir('qa-artifacts', { recursive: true });
  await page.screenshot({ path: 'qa-artifacts/flux-evidence-lens-desktop.png', fullPage: true });
});

test('Flux evidence lens remains usable at mobile reviewer width', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseURL}/design-lens.html`, { waitUntil: 'domcontentloaded' });

  const toggle = page.locator('.lens-mobile-toggle');
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(toggle).toContainText('EVIDENCE +');

  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('button', { name: 'START 5-STEP TOUR' })).toBeVisible();
  await expect(page.getByRole('link', { name: /RETURN TO NORMAL PRODUCT/ })).toBeVisible();

  await page.getByRole('button', { name: 'START 5-STEP TOUR' }).click();
  await expect(page.locator('#tourCard')).toBeVisible();
  await expect(page.locator('#tourIndex')).toHaveText('01 / 05');

  await fs.mkdir('qa-artifacts', { recursive: true });
  await page.screenshot({ path: 'qa-artifacts/flux-evidence-lens-mobile.png', fullPage: true });
});

test('Flux Round 01 research package keeps the human-evidence gate truthful', async () => {
  const status = JSON.parse(await fs.readFile('research/validation/flux-round-01/status.json', 'utf8'));
  expect(status.status).toBe('READY_TO_RECRUIT');
  expect(status.evidence_state).toBe('PLANNED_VALIDATION');
  expect(status.verified_direct_user_sessions).toBe(0);
  expect(status.verified_proxy_sessions).toBe(0);
  expect(status.forbidden_claims_until_verified.length).toBeGreaterThan(0);

  const ledger = await fs.readFile('research/validation/flux-round-01/evidence-ledger.jsonl', 'utf8');
  expect(ledger).toBe('');

  const findings = await fs.readFile('research/validation/flux-round-01/FINDINGS.md', 'utf8');
  expect(findings).toContain('NO DIRECT-USER FINDINGS YET');
});
