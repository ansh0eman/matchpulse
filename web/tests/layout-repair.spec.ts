import {test,expect} from '@playwright/test';
import {openLineComparison,selectCanonicalFixture} from './helpers/readiness';
import {revealMoment} from './helpers/moments';
test('pitch-first composition retains geometry, visible controls and readable explanation across breakpoints',async({page},info)=>{
 await page.addInitScript(()=>Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>[],cancel:()=>{},speak:()=>{}},configurable:true}));
 await openLineComparison(page,info);
 const sizes=info.project.name==='laptop'?[[1366,768],[1440,900],[1024,768]]:[[390,844]];const rows=[];
 for(const [width,height] of sizes){await page.setViewportSize({width,height});for(const theme of ['light','dark']){
 if(await page.locator('html').getAttribute('data-theme')!==theme)await page.getByRole('button',{name:`Switch to ${theme} theme`,exact:true}).click();await page.evaluate(()=>scrollTo(0,0));
 const box=async(selector:string)=>(await page.locator(selector).boundingBox())!;
 const stage=await box('.theatre-stage'),rail=await box('.matchday-investigation'),pitch=await box('.theatre-pitch'),transport=await box('.theatre-transport'),timeline=await box('.md-moments'),action=await box('.investigation-actions .evidence-button');
 if(width>1100){expect(stage.width/rail.width).toBeGreaterThan(1.85);expect(stage.width/rail.width).toBeLessThan(2.15);expect(timeline.y+timeline.height).toBeLessThanOrEqual(height);expect(transport.y+transport.height).toBeLessThanOrEqual(height);expect(action.y+action.height).toBeLessThanOrEqual(height)}else expect(rail.y).toBeGreaterThan(stage.y+stage.height);
 const svg=await page.locator('.theatre-pitch svg').evaluate(node=>{const svg=node as SVGSVGElement,m=svg.getScreenCTM()!;return{a:m.a,d:m.d,meet:svg.getAttribute('preserveAspectRatio'),viewBox:svg.getAttribute('viewBox')}});expect(svg.a).toBeCloseTo(svg.d,6);expect(svg.meet).toBe('xMidYMid meet');expect(svg.viewBox).toBe('-4 -4 113 76');
 expect(await page.locator('.comparison-insights p').first().evaluate(el=>parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(13);
 await expect(page.locator('.moment-copy')).toContainText('three deepest outfielders in similar samples');await expect(page.locator('.comparison-insights')).toContainText('not evidence that the coach ordered a tactic');await expect(page.getByTestId('verified-support')).toHaveText('59 verified samples · 41 earlier / 18 recent');expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
 rows.push({width,height,theme,stage,rail,pitch,transport,timeline,action,svg});await page.screenshot({path:info.outputPath(`composition-${width}-${theme}.png`),animations:'disabled'});
 }}
 await info.attach('composition-geometry',{contentType:'application/json',body:JSON.stringify(rows)});
});
test('secondary details, long clubs, complete captions and history remain usable without clipping',async({page,request},info)=>{
 await page.addInitScript(()=>Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>[],cancel:()=>{},speak:()=>{}},configurable:true}));await openLineComparison(page,info);
 await page.locator('.moment-timing summary').click();await expect(page.locator('.moment-timing details')).toHaveAttribute('open','');expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);await page.screenshot({path:info.outputPath('timing-expanded.png'),animations:'disabled'});
 await page.locator('.synthetic-disclosure summary').click();await page.getByLabel('Home presentation club',{exact:true}).selectOption('brighton');await page.getByLabel('Away presentation club',{exact:true}).selectOption('nottingham-forest');await page.keyboard.press('Escape');await page.getByRole('button',{name:/^Favorite team:/}).click();await page.getByRole('menuitemradio',{name:'Brighton & Hove Albion',exact:true}).click();await expect(page.getByTestId('verified-support')).toContainText('59 verified samples');
 await page.getByRole('button',{name:'Preview commentary for this moment',exact:true}).click();await expect(page.locator('.replay-caption-line')).toHaveText("Brighton & Hove Albion's three deepest outfielders were about ten metres higher in the recent comparable samples.");await page.locator('.commentary-settings summary').click();await expect(page.locator('.commentary-settings')).toContainText('Captions remain available');expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);await page.screenshot({path:info.outputPath('long-clubs-caption-voice.png'),fullPage:true,animations:'disabled'});
 await page.getByLabel('Replay clock',{exact:true}).fill('3400');await expect(page.locator('.moment-copy h1')).toHaveText('No new featured moment.');await page.screenshot({path:info.outputPath('quiet.png'),animations:'disabled'});
 const view=await(await request.get('/api/view?scenario=line-shift&clock=3360&audience=fan')).json();const shot=view.timeline.find((s:any)=>s.type==='observed_shot'&&s.source_seconds===3279.5);await(await revealMoment(page,shot.id)).click();await expect(page.locator('.moment-label')).toHaveText('Selected moment');await expect(page.getByTestId('clock')).toHaveText('56:40');await page.screenshot({path:info.outputPath('selected-shot.png'),animations:'disabled'});
 await page.keyboard.press('Escape');
 await selectCanonicalFixture(page,{name:'When the evidence says wait',scenario:'withheld',clock:1350},info);await expect(page.locator('.moment-copy h1')).toHaveText('The evidence says wait.');await expect(page.getByRole('button',{name:'Open Proof Lens',exact:true})).toHaveCount(0);await page.screenshot({path:info.outputPath('withheld.png'),animations:'disabled'});
});
