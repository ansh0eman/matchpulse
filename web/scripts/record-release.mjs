// Genuine browser recordings only. This utility never calls a model or changes data.
import { chromium, expect } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { performance } from 'node:perf_hooks';

const base = process.env.MATCHPULSE_TEST_URL ?? 'http://127.0.0.1:8013';
const root = resolve(import.meta.dirname, '../..');
const out = resolve(root, 'backend/output/release/video');
const script = JSON.parse(await readFile(resolve(root, 'research/step3e/demo-script.json'), 'utf8'));
await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const selected = new Set(process.argv.slice(2));
if ([...selected].some(id => !script.scenes.some(scene => scene.id === id))) throw new Error('Unknown scene');
const records = selected.size ? JSON.parse(await readFile(resolve(out, 'recordings.json'), 'utf8')).scenes : [];
const button = (page, name) => page.getByRole('button', { name, exact: true });
const proofReady = page => expect(button(page, 'Open Proof Lens')).toBeEnabled({ timeout: 90000 });

async function record(id, scenario, prepare, actions) {
  if (selected.size && !selected.has(id)) return;
  const scene = script.scenes.find(s => s.id === id);
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, recordVideo: { dir: out, size: { width: 1366, height: 768 } } });
  const page = await context.newPage();
  const created = performance.now();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${base}/?scenario=${scenario}`);
  await proofReady(page);
  await prepare(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  const start = performance.now();
  // Scheduled offsets are presentation pacing, not a substitute for readiness checks.
  const at = async (seconds, action) => {
    const delay = seconds * 1000 - (performance.now() - start);
    if (delay > 0) await page.waitForTimeout(delay);
    await action();
  };
  await actions(page, at);
  await at(scene.seconds, async () => {});
  const elapsed = (performance.now() - start) / 1000;
  if (elapsed > scene.seconds + 0.5) throw new Error(`${id} overran by ${elapsed - scene.seconds}s`);
  await page.screenshot({ path: resolve(out, `${id}.png`) });
  if (errors.length) throw new Error(`${id}: browser errors`);
  await page.close();
  const path = await page.video().path();
  await context.close();
  const prior = records.findIndex(row => row.id === id);
  if (prior >= 0) records.splice(prior, 1);
  records.push({ id, path, trim_start_seconds: (start - created) / 1000, seconds: scene.seconds, page_errors: errors });
  records.sort((a, b) => script.scenes.findIndex(s => s.id === a.id) - script.scenes.findIndex(s => s.id === b.id));
  await writeFile(resolve(out, 'recordings.json'), JSON.stringify({ base, scenes: records, scope: 'Real Chromium screen recordings; trim offsets are measured wall clock. Review assembled video before publication.' }, null, 2));
  console.log(`Recorded ${id}: ${scene.seconds}s`);
}

try {
  await record('opening', 'native-goals', async page => {
    await expect(page.getByTestId('score')).toHaveText('0:0');
    await page.getByRole('combobox', { name: 'Playback speed' }).selectOption('1');
  }, async (page, at) => {
    await at(1, () => button(page, 'Play replay').click());
    await expect(page.getByTestId('score')).toHaveText('1:0', { timeout: 12000 });
    await at(10, () => button(page, 'Pause replay').click());
  });
  await record('goal', 'opening-goal', async page => {
    await page.getByRole('slider', { name: 'Replay clock', exact: true }).fill('2370');
    await expect(page.getByTestId('score')).toHaveText('0:0');
  }, async (page, at) => {
    await at(4, () => page.getByRole('slider', { name: 'Replay clock', exact: true }).fill('2371'));
    await expect(page.getByTestId('score')).toHaveText('1:0');
    await at(10, () => button(page, 'Analyst view').click());
    await at(15, () => button(page, 'Fan view').click());
  });
  await record('proof', 'line-shift', async page => {
    await button(page, 'Open Proof Lens').click();
    await expect(page.locator('.summary-delta')).toContainText('+10.01');
  }, async (page, at) => {
    await at(8, () => page.getByText('Which players contributed to these snapshots?', { exact: true }).click());
    await expect(page.locator('.contributor-inspector tbody tr')).toHaveCount(6);
    await at(12, () => page.locator('.contributor-inspector').scrollIntoViewIfNeeded());
    await at(16, () => button(page, 'How calculated').click());
    await expect(page.locator('.formula')).toBeVisible();
    await at(23, () => button(page, 'audit').click());
  });
  await record('restraint', 'withheld', async page => {
    await expect(page.locator('.moment-copy')).toContainText('132s old');
  }, async () => {});
  await record('agents', 'opening-goal', async page => {
    await button(page, 'Agent room').click();
    await expect(page.getByLabel('Recorded Foundry workflow', { exact: true })).toBeVisible();
  }, async (page, at) => {
    const decisions = page.getByLabel('Recorded Foundry workflow', { exact: true }).getByLabel('Recorded agent decisions', { exact: true });
    await at(9, () => decisions.getByText('Challenger narrowed the scope', { exact: true }).scrollIntoViewIfNeeded());
    await at(21, () => page.getByText('See the historical narration recovery', { exact: true }).click());
    await expect(page.getByLabel('Historical Foundry recovery').locator('.workflow-node.narrator')).toContainText('fallback');
  });
  await record('close', 'line-shift', async page => {
    await button(page, 'Open Proof Lens').click();
    await expect(page.locator('.summary-delta')).toContainText('+10.01');
  }, async () => {});
} finally {
  await browser.close();
}
