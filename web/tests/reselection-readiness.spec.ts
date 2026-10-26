import { test, expect } from '@playwright/test';

for (const mode of ['theatre', 'studio']) {
  test(`${mode}: retained source geometry cannot start replay before a reselected seed arrives`, async ({ page }) => {
    await page.goto(`/?view=${mode}&scenario=native-goals&clock=1611`);
    const play = page.getByRole('button', { name: 'Play replay', exact: true });
    await expect(play).toBeEnabled({ timeout: 60000 });
    const pitch = page.getByRole('img', { name: 'Observed player and ball positions', exact: true });
    await expect(pitch).toBeVisible();
    let release!: () => void;
    const held = new Promise<void>(resolve => { release = resolve; });
    let entered!: () => void;
    const started = new Promise<void>(resolve => { entered = resolve; });
    await page.route('**/api/view?**', async route => {
      entered();
      await held;
      await route.continue();
    });
    try {
      await page.getByRole('button', { name: 'Select Goals, in motion', exact: true }).click();
      await started;
      await expect(pitch).toBeVisible();
      await expect(page.getByTestId('score')).toHaveText('0:0');
      await expect(play).toBeDisabled();
    } finally { release(); }
    await expect(play).toBeEnabled();
    await page.getByLabel('Playback speed').selectOption('1');
    await play.click();
    await expect(page.getByTestId('score')).toHaveText('1:0', { timeout: 15000 });
    await page.getByRole('button', { name: 'Pause replay', exact: true }).click();
    await page.unrouteAll({ behavior: 'wait' });
  });
}
