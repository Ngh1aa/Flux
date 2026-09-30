import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';

const baseURL = process.env.FLUX_BASE_URL || 'http://127.0.0.1:4173';

test('Flux evidence lens exposes decisions, baseline, tour and forced recovery state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${baseURL}/design-lens.html`, { waitUntil: 'domcontentloaded' });

  const frame = page.frameLocator('#frame');
  await expect(frame.locator('.lens-pin')).toHaveCount(4);
  await expect(page.getByText('Direct-user evidence is currently')).toBeVisible();

  await frame.locator('.lens-pin', { hasText: 'D-03' }).click();
  await expect(frame.locator('.lens-pop')).toContainText('Consequence + recovery');
  await expect(frame.locator('.lens-pop')).toContainText('PLANNED_VALIDATION');

  await page.getByRole('button', { name: 'CONCEPTUAL BASELINE' }).click();
  await expect(frame.locator('.lens-baseline-banner')).toContainText('NOT A HISTORICAL SHIPPED SCREEN');

  await page.getByRole('button', { name: 'SETTLEMENT FAILED' }).click();
  await expect(frame.locator('.lens-state-note.danger')).toContainText('NO MONEY MOVED');
  await expect(frame.locator('#detail-status')).toHaveText('Failed');

  await page.getByRole('button', { name: 'START 5-STEP TOUR' }).click();
  await expect(page.locator('#tourCard')).toBeVisible();
  await expect(page.locator('#tourIndex')).toHaveText('01 / 05');
  await expect(frame.locator('.lens-tour-focus')).toHaveCount(1);

  await fs.mkdir('qa-artifacts', { recursive: true });
  await page.screenshot({ path: 'qa-artifacts/flux-evidence-lens.png', fullPage: true });
});

test('Flux Round 01 research package keeps the human-evidence gate truthful', async () => {
  const status = JSON.parse(await fs.readFile('research/validation/flux-round-01/status.json', 'utf8'));
  expect(status.status).toBe('READY_TO_RECRUIT');
  expect(status.evidence_state).toBe('PLANNED_VALIDATION');
  expect(status.verified_direct_user_sessions).toBe(0);
  expect(status.forbidden_claims_until_verified.length).toBeGreaterThan(0);

  const ledger = await fs.readFile('research/validation/flux-round-01/evidence-ledger.jsonl', 'utf8');
  expect(ledger).toBe('');

  const findings = await fs.readFile('research/validation/flux-round-01/FINDINGS.md', 'utf8');
  expect(findings).toContain('NO DIRECT-USER FINDINGS YET');
});
