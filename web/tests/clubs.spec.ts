import { test,expect } from '@playwright/test';
import { clubs,contrast,inkFor } from '../src/clubs/clubRegistry';
import { follow } from './helpers/preferences';
test('all twenty presentation clubs have source provenance and readable marker text',()=>{expect(clubs).toHaveLength(20);expect(new Set(clubs.map(c=>c.id)).size).toBe(20);for(const c of clubs){expect(c.sourceUrl).toMatch(/^https:\/\/resources.premierleague.com\//);expect(c.sourceSha256).toMatch(/^[a-f0-9]{64}$/);expect(contrast(c.primary,inkFor(c.primary))).toBeGreaterThanOrEqual(4.5);expect(c.sourceHexTokens.includes(c.primary)||c.notes.length>0).toBe(true)}expect(clubs.find(c=>c.id==='manchester-city')!.primary).toBe('#7AB2E1')});
test('club mapping is display-only, menu focus works and evidence survives label changes',async({page},info)=>{
 await page.goto('/?scenario=line-shift&clock=3360');await expect(page.getByTestId('verified-support')).toContainText('59 verified samples');
 const score=await page.getByTestId('score').textContent();const clock=await page.getByTestId('clock').textContent();
 await expect(page.locator('.md-score-row').getByRole('button',{name:'Fan view',exact:true})).toBeVisible();
 await expect(page.locator('.score-club').first()).toHaveText('MCI');await expect(page.locator('.score-club').last()).toHaveText('MUN');
 expect(await page.locator('[data-team="NORTH"]').first().getAttribute('fill')).toBe('#7AB2E1');
 await page.getByRole('button',{name:/^Favorite team:/}).press('ArrowDown');await page.keyboard.press('End');await expect(page.getByRole('menuitemradio',{name:'Manchester United',exact:true})).toBeFocused();await page.keyboard.press('Escape');await expect(page.getByRole('button',{name:/^Favorite team:/})).toBeFocused();
 await follow(page,'SOUTH');await expect(page.getByRole('button',{name:/Favorite team: Manchester United/})).toBeVisible();await expect(page.getByTestId('verified-support')).toContainText('59 verified samples');
 await page.getByRole('button',{name:'Investigate',exact:true}).click();await expect(page.locator('.team-home')).toContainText('Manchester City');expect(await page.locator('.crest.north').evaluate(el=>getComputedStyle(el).backgroundColor)).toBe('rgb(122, 178, 225)');await page.getByRole('button',{name:'Matchday',exact:true}).click();
 const requests:string[]=[];page.on('request',r=>{if(r.url().includes('/api/'))requests.push(r.url())});
 await page.locator('.synthetic-disclosure summary').click();await expect(page.locator('.club-choices')).toContainText('not actual club performances');
 await page.getByLabel('Home presentation club',{exact:true}).selectOption('arsenal');await page.getByLabel('Away presentation club',{exact:true}).selectOption('liverpool');
 await expect(page.locator('.club-mapping-note')).toHaveCount(0);await page.keyboard.press('Escape');
 await expect(page.getByTestId('clock')).toHaveText(clock!);await expect(page.getByTestId('score')).toHaveText(score!);expect(requests).toEqual([]);
 await expect(page.locator('.moment-copy')).toContainText("Arsenal's three deepest");
 const home=await page.locator('[data-team="NORTH"]').first().getAttribute('fill');const away=await page.locator('[data-team="SOUTH"]').first().getAttribute('fill');expect(home).not.toBe(away);
 await page.getByRole('button',{name:'Open Proof Lens',exact:true}).click();await expect(page.locator('.proof-summary h3')).toHaveText("Arsenal's sampled line comparison");await expect(page.locator('.aggregate-values')).toContainText('+10.01');await expect(page.locator('.summary-support')).toContainText('59 source frames');await expect(page.locator('.proof-drawer .club-mapping-note')).toHaveCount(1);await expect(page.locator('.proof-drawer .club-mapping-note')).toContainText('NORTH → Arsenal');await page.keyboard.press('Escape');
 for(const theme of ['light','dark']){if(theme==='dark')await page.getByRole('button',{name:'Switch to dark theme'}).click();await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:info.outputPath(`club-header-${theme}.png`),animations:'disabled'});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)}
});
