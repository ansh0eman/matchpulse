import { openLineComparison, selectCanonicalFixture } from "./helpers/readiness";
import { test, expect } from '@playwright/test';
import type { Story, View } from '../src/contracts';
import { selectEditorial, eligibleAt } from '../src/broadcast/editorial';
import { timePercent } from '../src/broadcast/timeAxis';
import { clusterMoments } from '../src/broadcast/MatchTimeline';
import { revealMoment } from './helpers/moments';
const viewAt=async(request:import('@playwright/test').APIRequestContext,scenario:string,clock:number):Promise<View>=>(await request.get(`/api/view?scenario=${scenario}&clock=${clock}&audience=fan`)).json();

test('editorial policy uses replay seconds, fixed priorities, recorded diagnostics and irreversible selection validity', async({request})=>{
 const native=await viewAt(request,'native-goals',1640);const goal=native.timeline.find(s=>s.type==='goal_context')!;expect(goal).toBeTruthy();
 const shot=native.timeline.find(s=>s.type==='observed_shot')!;
 for(const age of [29.75,30,30.25]) {
  const clock=goal.presented_seconds+age;
  const sample={...native,clock,timeline:[{...goal,priority:0},{...shot,presented_seconds:goal.presented_seconds+1,priority:100}],diagnostics:[]};
  const result=selectEditorial({view:sample,scenario:sample.scenario,clock,selection:null});
  expect(result.presentation.kind).toBe(age<=30?'featured':'quiet');
  if(result.presentation.kind==='featured')expect(result.presentation.story.id).toBe(goal.id);
 }
 const line=await viewAt(request,'line-shift',3360);const story=line.timeline.find(s=>s.type==='observed_line_height_change')!;
 const selection={scenario:line.scenario,matchId:line.match_id,storyId:story.id,eligibleAt:eligibleAt(story)};
 const chosen=selectEditorial({view:{...line,clock:3400},scenario:line.scenario,clock:3400,selection});expect(chosen.presentation.kind).toBe('selected');
 expect(selectEditorial({view:null,scenario:line.scenario,clock:3360,matchId:line.match_id,selection}).selectionDisposition).toBe('pending');
 expect(selectEditorial({view:null,scenario:line.scenario,clock:3359.75,matchId:line.match_id,selection}).selectionDisposition).toBe('clear');
 expect(selectEditorial({view:{...line,timeline:[]},scenario:line.scenario,clock:3360,selection}).selectionDisposition).toBe('clear');
 const diagnostic={detected_at_seconds:goal.presented_seconds,reasons:['stale_recent_evidence'],recent_age_seconds:null,recent_span_seconds:null};
 const mixed={...native,clock:goal.presented_seconds,timeline:[goal],diagnostics:[diagnostic]};
 expect(selectEditorial({view:mixed,scenario:native.scenario,clock:mixed.clock,selection:null}).presentation.kind).toBe('featured');
 const noGoal={...mixed,timeline:[]};expect(selectEditorial({view:noGoal,scenario:native.scenario,clock:noGoal.clock,selection:null}).presentation.kind).toBe('withheld');
 expect(selectEditorial({view:{...noGoal,clock:noGoal.clock+30.25},scenario:native.scenario,clock:noGoal.clock+30.25,selection:null}).presentation.kind).toBe('quiet');
 const boundary={...shot,type:'match_boundary',id:shot.id+'-boundary',source_seconds:goal.source_seconds+1,presented_seconds:goal.presented_seconds+1,available_seconds:goal.presented_seconds+1};
 expect(selectEditorial({view:{...mixed,clock:boundary.presented_seconds,timeline:[goal,boundary],diagnostics:[]},scenario:native.scenario,clock:boundary.presented_seconds,selection:null}).presentation.kind).toBe('quiet');
 expect(timePercent(107,5600)).toBeCloseTo(1.910714);for(const n of [-1,Infinity,NaN,5601])expect(timePercent(n,5600)).toBeNull();
 const same=[{...goal,source_seconds:0},{...shot,source_seconds:0}];expect(clusterMoments(same,5600)[0].stories).toHaveLength(2);expect(same.map(s=>timePercent(s.source_seconds,5600))).toEqual([0,0]);
});

test('time axis follows the source clock, clusters original IDs, and never resurrects cleared history', async({page,request},info)=>{
 await page.goto('/?scenario=native-goals&clock=0');
 await expect(page.getByRole('button',{name:'Play replay',exact:true})).toBeEnabled({timeout:60000});
 await expect(page.getByTestId('clock')).toHaveText('00:00');
 await expect(page.getByTestId('timeline-playhead')).toHaveAttribute('data-clock','0');
 await expect(page.locator('.incident-anchor[data-source-seconds="0"]')).toHaveCount(2);
 const originalZero=await page.locator('.incident-anchor[data-source-seconds="0"]').evaluateAll(items=>items.map(el=>el.getAttribute('data-source-story-id')));
 const zeroCluster=page.locator('.cluster-trigger').first();await zeroCluster.click();
 for(const id of originalZero)await expect(page.locator(`[data-story-id="${id}"]`)).toBeVisible();
 await page.keyboard.press('Escape');
 await expect(page.locator('.axis-cluster-popup:visible')).toHaveCount(0);
 await page.getByLabel('Replay clock',{exact:true}).fill('107');await expect(page.getByTestId('clock')).toHaveText('01:47');
 const duration=Number(await page.locator('.time-axis').getAttribute('data-duration'));
 expect(Number(await page.getByTestId('timeline-playhead').getAttribute('data-time-percent'))).toBeCloseTo(107/duration*100);
 await expect(page.locator('.moment-copy h1')).toHaveText('No new featured moment.');await expect(page.getByRole('button',{name:'Open Proof Lens',exact:true})).toHaveCount(0);
 expect(await page.locator('.incident-anchor').evaluateAll((items)=>items.every(el=>Number(el.getAttribute('data-source-seconds'))<=107))).toBe(true);
 expect((await page.locator('.app-header').boundingBox())!.y).toBe(0);
 await page.evaluate(()=>scrollTo(0,0));
 await page.screenshot({path:info.outputPath('quiet-107.png'),animations:'disabled'});
 await selectCanonicalFixture(page,{name:'A higher line, proved',scenario:'line-shift',clock:3360,support:true},info);await expect(page.getByTestId('verified-support')).toHaveText('59 verified samples · 41 earlier / 18 recent');
 await page.evaluate(()=>scrollTo(0,0));
 await page.screenshot({path:info.outputPath('featured-line.png'),animations:'disabled'});
 const line=await viewAt(request,'line-shift',3360);const shot=line.timeline.find(s=>s.type==='observed_shot'&&s.source_seconds===3279.5)!;
 await(await revealMoment(page,shot.id)).click();await expect(page.getByTestId('clock')).toHaveText('56:00');
 await page.getByRole('button',{name:'Open Proof Lens',exact:true}).click();await expect(page.locator('.proof-summary h3')).toContainText('54:39');
 await page.getByRole('button',{name:'Audit',exact:true}).click();await expect(page.locator('.observation')).toContainText('evt_003876');await expect(page.locator('.observation')).toContainText('3279.5s');await page.keyboard.press('Escape');
 await page.screenshot({path:info.outputPath('selected-shot.png'),animations:'disabled'});
 await page.getByLabel('Replay clock',{exact:true}).fill('0');await expect(page.getByTestId('clock')).toHaveText('00:00');await page.getByLabel('Replay clock',{exact:true}).fill('3400');await expect(page.getByTestId('clock')).toHaveText('56:40');
 await expect(page.locator('.axis-cluster-popup:visible')).toHaveCount(0);
 await expect(page.locator('.md-moments [aria-current="true"]')).toHaveCount(0);await expect(page.locator('.moment-copy h1')).toHaveText('No new featured moment.');await expect(page.locator('.incident-anchor.is-arrival')).toHaveCount(0);
 const comparison=line.timeline.find(s=>s.type==='observed_line_height_change')!;await(await revealMoment(page,comparison.id)).click();await expect(page.locator('.moment-copy h1')).toHaveText('Spot the shift.');
 await page.getByRole('button',{name:'Open Proof Lens',exact:true}).click();await expect(page.locator('.summary-support')).toContainText('59 source frames');await expect(page.locator('.aggregate-values')).toContainText('+10.01');await page.keyboard.press('Escape');
 await page.screenshot({path:info.outputPath('selected-line-history.png'),animations:'disabled'});
 await selectCanonicalFixture(page,{name:'When the evidence says wait',scenario:'withheld',clock:1350},info);await expect(page.locator('.moment-copy')).toContainText('recorded review at 22:30');await expect(page.getByRole('button',{name:'Open Proof Lens',exact:true})).toHaveCount(0);
 await page.screenshot({path:info.outputPath('withheld-light.png'),animations:'disabled'});
 await page.getByRole('button',{name:'Switch to dark theme'}).click();await page.screenshot({path:info.outputPath('withheld-dark.png'),animations:'disabled'});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('unknown diagnostic ages remain unknown and cannot override verified features',async({page,request})=>{
 const original=await viewAt(request,'withheld',1350);const diagnostic={...original.diagnostics.at(-1)!,recent_age_seconds:null,recent_span_seconds:null};
 await page.route('**/api/view?**',route=>route.fulfill({json:{...original,diagnostics:[diagnostic]}}));
 await page.goto('/?scenario=withheld');await expect(page.locator('.moment-copy')).toContainText('evidence age was unknown');await expect(page.locator('.moment-copy')).not.toContainText('null');
 await expect(page.getByRole('button',{name:'Open Proof Lens',exact:true})).toHaveCount(0);await page.unrouteAll({behavior:'wait'});
});

test('published quarter-second boundaries, pause and speed preserve the editorial window and end coordinates',async({page,request},info)=>{
 await openLineComparison(page,info);
 await page.getByRole('button',{name:'Switch to dark theme'}).click();
 const clock=page.getByRole('slider',{name:'Replay clock',exact:true});
 await page.getByLabel('Playback speed').selectOption('12');await page.waitForTimeout(200);
 await expect(clock).toHaveValue('3360');await expect(page.locator('.moment-copy h1')).toHaveText('Spot the shift.');
 for(const second of [3389.75,3390,3390.25]){
  await clock.fill(String(second));await expect(page.getByTestId('timeline-playhead')).toHaveAttribute('data-clock',String(second));
  await expect(page.locator('.moment-copy h1')).toHaveText(second<=3390?'Spot the shift.':'No new featured moment.');
  expect(Number(await clock.getAttribute('data-time-percent'))).toBe(Number(await page.getByTestId('timeline-playhead').getAttribute('data-time-percent')));
  await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:info.outputPath(`boundary-${second}-dark.png`),animations:'disabled'});
 }
 await clock.fill('3389.75');await expect(page.getByTestId('timeline-playhead')).toHaveAttribute('data-clock','3389.75');await page.getByLabel('Playback speed').selectOption('1');await page.getByRole('button',{name:'Play replay',exact:true}).click();
 await expect(page.locator('.moment-copy h1')).toHaveText('No new featured moment.');await page.getByRole('button',{name:'Pause replay',exact:true}).click();
 await expect(page.getByRole('button',{name:'Open Proof Lens',exact:true})).toHaveCount(0);
 const view=await viewAt(request,'line-shift',3360);const line=view.timeline.find(s=>s.type==='observed_line_height_change')!;await(await revealMoment(page,line.id)).click();await expect(page.locator('.moment-copy h1')).toHaveText('Spot the shift.');
 await page.screenshot({path:info.outputPath('selected-history-dark.png'),animations:'disabled'});
 await clock.fill(String(view.duration));await expect(page.getByRole('button',{name:'Play replay',exact:true})).toBeEnabled({timeout:60000});await expect(page.getByTestId('timeline-playhead')).toHaveAttribute('data-clock',String(view.duration));
 await expect(page.getByTestId('timeline-playhead')).toHaveAttribute('data-time-percent','100');await expect(clock).toHaveValue(String(view.duration));
 await expect(page.locator('.incident-anchor.is-arrival')).toHaveCount(0);await expect(page.locator('.md-moments [aria-current="true"]')).toHaveAttribute('data-story-id',line.id);
 await expect(page.locator('.moment-label')).toHaveText('Selected moment');
 const end=await viewAt(request,'line-shift',view.duration);await expect(page.getByTestId('score')).toHaveText(`${end.score.home}:${end.score.away}`);
 await page.screenshot({path:info.outputPath('match-end-dark.png'),animations:'disabled'});
});
