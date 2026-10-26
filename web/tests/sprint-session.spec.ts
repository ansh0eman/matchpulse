import { openLineComparison } from "./helpers/readiness";
import { follow } from "./helpers/preferences";
import { revealMoment } from "./helpers/moments";
import { test, expect } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import type { View } from "../src/contracts";
const openProof = (page: import('@playwright/test').Page) => page.getByRole('button', { name: 'Open Proof Lens', exact: true });
function gate() { let release!: () => void; const promise = new Promise<void>(r => release = r); return { promise, release }; }

test('presentation preferences retain source playback while delayed scopes cannot win', async ({ page }, info) => {
  const requests: string[] = [];
  page.on('request', r => { if (r.url().includes('/api/')) requests.push(new URL(r.url()).pathname + new URL(r.url()).search); });
  await page.goto('/?scenario=line-shift'); await expect(openProof(page)).toBeEnabled();
  const view: View = await (await page.request.get('/api/view?scenario=line-shift&clock=3360&audience=fan')).json();
  const shot = view.timeline.find(s => s.type === 'observed_shot' && s.source_seconds === 3279.5)!;
  await (await revealMoment(page,shot.id)).focus(); await page.keyboard.press('Enter');
  const svg = page.getByRole('img', { name: 'Observed player and ball positions' });
  await svg.evaluate(el => Object.assign(window, { sessionPitchNode: el }));
  const paused = gate();
  await page.route('**/api/view?**audience=analyst**', async route => { await paused.promise; await route.continue().catch(() => {}); });
  await page.getByRole('button', { name: 'Analyst view', exact: true }).click();
  await expect(page.getByText('Updating explanation… Source playback continues.')).toBeVisible();
  await expect(page.getByTestId('clock')).toHaveText('56:00');
  expect(await svg.locator('title').count()).toBeGreaterThanOrEqual(22);
  await expect(openProof(page)).toHaveCount(0);
  paused.release(); await expect(openProof(page)).toBeEnabled();
  await expect(page.locator(`[data-story-id="${shot.id}"]`)).toHaveAttribute('aria-current', 'true');
  await page.unrouteAll({ behavior: 'wait' });
  await page.getByRole('button', { name: 'Fan view', exact: true }).click(); await expect(openProof(page)).toBeEnabled();
  await page.getByLabel('Playback speed').selectOption('1');
  await page.getByRole('button', { name: 'Play replay', exact: true }).click();
  const slider = page.getByRole('slider', { name: 'Replay clock', exact: true });
  await expect.poll(async () => Number(await slider.inputValue())).toBeGreaterThan(3360);
  const playing = gate(); let arrived = false;
  await page.route('**/api/playback?**audience=analyst**', async route => { arrived = true; await playing.promise; await route.continue().catch(() => {}); });
  await page.getByRole('button', { name: 'Analyst view', exact: true }).click();
  await expect.poll(() => arrived).toBe(true);
  const anchor = Number(await slider.inputValue());
  await expect.poll(async () => Number(await slider.inputValue())).toBeGreaterThan(anchor);
  await expect(page.locator('.theatre-loading')).toHaveCount(0);
  expect(await svg.locator('title').count()).toBeGreaterThanOrEqual(22);
  expect(await svg.evaluate(el => el === (window as any).sessionPitchNode)).toBe(true);
  const observed = await page.evaluate(() => ({ clock: Number((document.querySelector('input[aria-label="Replay clock"]') as HTMLInputElement).value), titles: Array.from(document.querySelectorAll('.theatre-pitch title')).map(el => el.textContent ?? ''), score: document.querySelector('[data-testid="score"]')!.textContent!.replace(/\s/g, '') }));
  const oracle: View = await (await page.request.get(`/api/view?scenario=line-shift&clock=${observed.clock}&audience=fan`)).json();
  expect(observed.score).toBe(`${oracle.score.home}:${oracle.score.away}`);
  for (const player of oracle.frame!.players) expect(observed.titles.some(text => text.startsWith(`Source ID ${player.id}: ${player.x.toFixed(2)}, ${player.y.toFixed(2)}m.`))).toBe(true);
  await page.getByRole('button', { name: 'Fan view', exact: true }).click();
  playing.release(); await page.unrouteAll({ behavior: 'wait' });
  await expect(page.getByRole('button', { name: 'Fan view', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Pause replay', exact: true })).toBeEnabled();
  await expect(page.getByLabel('Playback speed')).toHaveValue('1');
  await follow(page,"SOUTH");
  const followAnchor = Number(await slider.inputValue());
  await expect.poll(async () => Number(await slider.inputValue())).toBeGreaterThan(followAnchor);
  await expect(page.locator('.theatre-loading')).toHaveCount(0);
  expect(await svg.evaluate(el => el === (window as any).sessionPitchNode)).toBe(true);
  await page.getByRole('button', { name: 'Pause replay', exact: true }).click();
  const published = Number(await slider.inputValue());
  const beforeMode = requests.filter(r => /\/api\/(scenarios|activity)/.test(r)).length;
  await page.getByRole('button', { name: 'Investigate', exact: true }).click();
  await expect(page.getByRole('slider', { name: 'Replay clock', exact: true })).toHaveValue(String(published));
  await follow(page,"NORTH");
  await expect(page.locator('.current-story')).toContainText('Manchester City');
  await expect(page.getByRole('slider', { name: 'Replay clock', exact: true })).toHaveValue(String(published));
  await page.getByRole('button', { name: 'Matchday', exact: true }).click();
  await expect(page.getByRole('slider', { name: 'Replay clock', exact: true })).toHaveValue(String(published));
  expect(requests.filter(r => /\/api\/(scenarios|activity)/.test(r)).length).toBe(beforeMode);
  await writeFile(info.outputPath('preference-network.json'), JSON.stringify({ published, anchor, requests }, null, 2));
});

test('shared header sticks and source disclosure, surfaces and single proof host have consistent geometry', async ({ page }, info) => {
  await page.goto('/?scenario=line-shift'); await expect(openProof(page)).toBeEnabled();
  const header = await page.locator('.app-header').boundingBox();
  for (const theme of ['light', 'dark']) {
    if (theme === 'dark') await page.getByRole('button', { name: 'Switch to dark theme' }).click();
    await page.getByRole('button', { name: 'Investigate', exact: true }).click();
    await expect(page.locator('.app-header')).toHaveCSS('position', 'sticky');
    const current = await page.locator('.app-header').boundingBox(); expect(current?.height).toBe(header?.height);
    const disclosure = page.locator('.app-header .synthetic-disclosure');
    await disclosure.locator('summary').click(); await expect(disclosure).toHaveAttribute('open', '');
    await expect(disclosure.locator('summary')).toHaveCSS('list-style-type', 'none');
    await page.screenshot({ path: info.outputPath(`investigate-top-${theme}.png`), animations: 'disabled' });
    await page.keyboard.press('Escape'); await expect(disclosure).not.toHaveAttribute('open');
    await expect(disclosure.locator('summary')).toBeFocused();
    await page.locator('.ask-panel').scrollIntoViewIfNeeded();
    expect((await page.locator('.app-header').boundingBox())!.y).toBe(0);
    for (const selector of ['.ask-panel', '.recap-panel', '.current-story']) {
      const shape = await page.locator(selector).evaluate(el => ({ radius:parseFloat(getComputedStyle(el).borderRadius), padding:parseFloat(getComputedStyle(el).paddingLeft) }));
      expect(shape.radius).toBeGreaterThanOrEqual(20); expect(shape.padding).toBeGreaterThanOrEqual(16);
    }
    await page.screenshot({ path: info.outputPath(`ask-recap-${theme}.png`), animations: 'disabled' });
    expect(await openProof(page).count()).toBe(1);
    await openProof(page).click(); await expect(page.getByRole('dialog')).toHaveCount(1);
    await expect(page.locator('.verified-banner')).toBeVisible();
    const banner = await page.locator('.verified-banner').evaluate(el => ({padding:parseFloat(getComputedStyle(el).paddingLeft),radius:parseFloat(getComputedStyle(el).borderRadius)}));
    expect(banner.padding).toBeGreaterThanOrEqual(16); expect(banner.radius).toBeGreaterThanOrEqual(14);
    await page.screenshot({ path: info.outputPath(`proof-banner-${theme}.png`), animations:'disabled' });
    await page.keyboard.press('Escape'); await expect(openProof(page)).toBeFocused();
    await page.getByRole('button', {name:'Studio',exact:true}).click(); await expect(page.getByRole('dialog')).toHaveCount(1);
    await page.locator('.workflow-platform-boundary').first().locator('summary').click();
    await page.locator('.workflow-platform-boundary').first().scrollIntoViewIfNeeded();
    await page.screenshot({ path:info.outputPath(`studio-detail-${theme}.png`), animations:'disabled' });
    await page.getByRole('button',{name:'Close agent room'}).click();
    await page.getByRole('button',{name:'Matchday',exact:true}).click();
    await page.evaluate(()=>scrollTo(0,0));
    expect((await page.locator('.app-header').boundingBox())!.height).toBe(header?.height);
    await page.screenshot({path:info.outputPath(`matchday-${theme}.png`),animations:'disabled'});
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('comparison support scope hides the previous receipt while a new audience receipt is delayed', async ({ page },info) => {
  await openLineComparison(page,info);
  const pending = gate(); let arrived = false;
  await page.route('**/api/proof?**audience=analyst**', async route => { arrived = true; await pending.promise; await route.continue().catch(() => {}); });
  try {
    await page.getByRole('button', { name:'Analyst view', exact:true }).click();
    // Immediate read: a prior scope's support must not survive this transition.
    expect(await page.getByTestId('verified-support').count()).toBe(0);
    await expect.poll(()=>arrived).toBe(true);
    await expect(page.getByTestId('verified-support')).toHaveCount(0);
    await expect(page.getByText('Verifying source sample support…')).toBeVisible();
    pending.release();
    await expect(page.getByTestId('verified-support')).toHaveText('59 verified samples · 41 earlier / 18 recent');
  } finally {
    pending.release();
    await page.unrouteAll({behavior:'wait'});
  }
});
