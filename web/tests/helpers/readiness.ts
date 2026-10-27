import { expect, type Page, type TestInfo } from '@playwright/test';
import type { Scenario, View, Proof } from '../../src/contracts';

/** A fixture click changes the source before its new geometry/proof can exist.
 * Await that real prerequisite; keep the subsequent 5s UI assertions intact. */
export async function selectCanonicalFixture(page: Page, target: {
  name: string; scenario: string; clock: number; support?: boolean;
}, info?: TestInfo) {
  const began = performance.now();
  const response = (path: string) => page.waitForResponse(reply => {
    const url = new URL(reply.url());
    return url.pathname === path && url.searchParams.get('scenario') === target.scenario &&
      url.searchParams.get('clock') === String(target.clock);
  }, { timeout: 60000 });
  const replies = Promise.all([response('/api/view'), ...(target.support ? [response('/api/proof')] : [])]);
  await page.getByRole('button', { name: `Select ${target.name}`, exact: true }).click();
  const [canonical, evidence] = await replies;
  expect(canonical.ok()).toBe(true);
  const view: View = await canonical.json();
  expect(view.scenario).toBe(target.scenario);
  expect(view.clock).toBe(target.clock);
  const catalogue = await page.request.get('/api/scenarios');
  expect(catalogue.ok()).toBe(true);
  const fixture = (await catalogue.json() as Scenario[]).find(row => row.id === target.scenario);
  expect(fixture).toBeTruthy();
  expect(view.match_id).toBe(fixture!.match_id);
  if (evidence) {
    expect(evidence.ok()).toBe(true);
    const proof: Proof = await evidence.json();
    const line = view.timeline.find(story => story.type === 'observed_line_height_change');
    expect(line).toBeTruthy();
    expect(proof.match_id).toBe(view.match_id);
    expect(proof.claim_id).toBe(line!.claim_ids[0]);
    expect(proof.as_of_seconds).toBe(line!.presented_seconds);
    expect(proof.verified).toBe(true);
    expect(proof.calculation.support).toMatchObject({ reference_frames: 41, recent_frames: 18 });
  }
  await info?.attach('canonical-fixture-switch', { contentType: 'application/json', body: JSON.stringify({
    scenario: target.scenario, match: view.match_id, clock: view.clock, elapsedMs: performance.now() - began,
  }) });
}

/** The established 60s startup budget belongs to real prerequisites, not each
 * short behavioral assertion. All watchers start before navigation; no warming,
 * fabricated data, retry or fixed sleep. The test's overall 60s bound remains. */
export async function openLineComparison(page: Page, info: TestInfo) {
  const began = performance.now();
  const response = (path: string) => page.waitForResponse(reply => {
    const url = new URL(reply.url());
    return url.pathname === path && (path === '/api/scenarios' ||
      url.searchParams.get('scenario') === 'line-shift' &&
      url.searchParams.get('audience') === 'fan' && url.searchParams.get('clock') === '3360');
  }, { timeout: 60000 }).then(reply => ({ reply, readyMs: performance.now() - began }));
  const startup = Promise.all([response('/api/scenarios'), response('/api/view'), response('/api/proof')]);
  await page.goto('/?scenario=line-shift&clock=3360');
  const [catalogue, canonical, evidence] = await startup;
  for (const phase of [catalogue, canonical, evidence]) expect(phase.reply.ok()).toBe(true);
  const scenarios: Scenario[] = await catalogue.reply.json();
  const view: View = await canonical.reply.json();
  const proof: Proof = await evidence.reply.json();
  const fixture = scenarios.find(s => s.id === 'line-shift');
  expect(fixture).toBeTruthy();
  expect(view.match_id).toBe(fixture!.match_id);
  expect(view.clock).toBe(3360);
  const line = view.timeline.find(s => s.type === 'observed_line_height_change');
  expect(line).toBeTruthy();
  expect(proof.match_id).toBe(view.match_id);
  expect(proof.claim_id).toBe(line!.claim_ids[0]);
  expect(proof.as_of_seconds).toBe(line!.presented_seconds);
  expect(proof.verified).toBe(true);
  expect(proof.calculation.support).toMatchObject({ reference_frames: 41, recent_frames: 18 });
  await expect(page.getByRole('button', {name:'Play replay',exact:true})).toBeEnabled();
  await expect(page.getByTestId('verified-support')).toHaveText('59 verified samples · 41 earlier / 18 recent');
  await info.attach('canonical-startup-phases', {contentType:'application/json',body:JSON.stringify({catalogueMs:catalogue.readyMs,canonicalViewMs:canonical.readyMs,proofMs:evidence.readyMs,match:view.match_id,claim:proof.claim_id,support:proof.calculation.support})});
}
