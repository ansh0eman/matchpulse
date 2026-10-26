import {test,expect,type Page,type Route} from '@playwright/test';
import type { PlaybackSegment } from '../src/contracts';
type Controls={hold:boolean; frames:Map<number,FrameRequestCallback>; settled:number; restore:()=>void; step:()=>void};
async function instrument(page:Page){await page.addInitScript(()=>{
 const originalRAF=window.requestAnimationFrame.bind(window),originalCancel=window.cancelAnimationFrame.bind(window),originalFetch=window.fetch.bind(window);
 const control={hold:false,frames:new Map<number,FrameRequestCallback>(),settled:0,restore:()=>{},step:()=>{}};
 const checkpoint=()=>{const channel=new MessageChannel();channel.port1.onmessage=()=>{control.settled++;channel.port1.close();channel.port2.close()};channel.port2.postMessage(null)};
 window.requestAnimationFrame=cb=>{const id=originalRAF(time=>{if(control.hold)control.frames.set(id,cb);else cb(time)});return id};
 window.cancelAnimationFrame=id=>{control.frames.delete(id);originalCancel(id)};
 window.fetch=async(...args)=>{const playback=String(args[0]).includes('/api/playback?');try{const response=await originalFetch(args[0],playback ? {...args[1],signal:undefined}:args[1]);if(playback){const json=response.json.bind(response);response.json=async()=>{try{return await json()}finally{checkpoint()}}}return response}catch(error){if(playback)checkpoint();throw error}};
 control.step=()=>{const frames=[...control.frames.values()];control.frames.clear();frames.forEach(cb=>cb(performance.now()))};
 control.restore=()=>{control.hold=false;control.step();window.requestAnimationFrame=originalRAF;window.cancelAnimationFrame=originalCancel;window.fetch=originalFetch};
 Object.assign(window,{__ownership:control});
})}
async function turn(page:Page){await page.evaluate(()=>new Promise<void>(resolve=>{const channel=new MessageChannel();channel.port1.onmessage=()=>{channel.port1.close();channel.port2.close();resolve()};channel.port2.postMessage(null)}))}
async function ready(page:Page){const proof=page.waitForResponse(r=>r.url().includes('/api/proof?')&&r.ok(),{timeout:60000});await page.goto('/?scenario=line-shift&clock=3360');await proof;await expect(page.getByRole('button',{name:'Play replay',exact:true})).toBeEnabled({timeout:60000});await expect(page.getByTestId('verified-support')).toHaveText('59 verified samples · 41 earlier / 18 recent')}
async function hold(page:Page){await page.evaluate(()=>(window as unknown as {__ownership:Controls}).__ownership.hold=true)}
async function step(page:Page){await page.evaluate(()=>(window as unknown as {__ownership:Controls}).__ownership.step())}
async function settled(page:Page,count:number){await expect.poll(()=>page.evaluate(()=>(window as unknown as {__ownership:Controls}).__ownership.settled)).toBeGreaterThanOrEqual(count);await turn(page);await turn(page)}
async function release(page:Page,routes:Route[]){await page.evaluate(()=>(window as unknown as {__ownership:Controls}).__ownership.restore()).catch(()=>{});await Promise.allSettled(routes.map(r=>r.abort()));await page.unrouteAll({behavior:'ignoreErrors'})}
for(const outcome of ['valid','malformed','http','network'] as const)test(`obsolete ${outcome} response before next frame cannot publish, pause or error`,async({page,request},info)=>{
 await instrument(page);await ready(page);const routes:Route[]=[];
 const packet:PlaybackSegment=await(await request.get('/api/playback?scenario=line-shift&clock=3360&audience=fan&window_seconds=16')).json();
 await page.route('**/api/playback?**',r=>{routes.push(r)});
 try{
  await hold(page);await page.getByLabel('Playback speed').selectOption('12');await page.getByRole('button',{name:'Play replay',exact:true}).click();await expect.poll(()=>routes.length).toBe(1);
  await page.getByRole('button',{name:'Analyst view',exact:true}).click();await expect(page.getByRole('button',{name:'Analyst view',exact:true})).toHaveAttribute('aria-pressed','true');
  if(outcome==='network')await routes[0].abort('failed');else if(outcome==='http')await routes[0].fulfill({status:503,json:{error:'Controlled obsolete failure'}});else await routes[0].fulfill({json:outcome==='malformed'?{...packet,schema_version:999}:packet});
  await settled(page,1);await expect(page.getByRole('alert')).toHaveCount(0);await expect(page.getByRole('button',{name:'Pause replay',exact:true})).toBeVisible();await expect(page.getByLabel('Playback speed')).toHaveValue('12');await expect(page.getByTestId('clock')).toHaveText('56:00');
  await expect.poll(()=>page.evaluate(()=>(window as unknown as {__ownership:Controls}).__ownership.frames.size)).toBeGreaterThan(0);await step(page);await expect.poll(()=>routes.length).toBe(2);expect(new URL(routes[1].request().url()).searchParams.get('audience')).toBe('analyst');
  const next=await(await request.get(routes[1].request().url())).json();await routes[1].fulfill({json:next});await settled(page,2);await expect(page.getByRole('alert')).toHaveCount(0);expect(await page.locator('.theatre-pitch title').count()).toBe(22);
  await page.screenshot({path:info.outputPath(`obsolete-${outcome}.png`),animations:'disabled'});
 }finally{await release(page,routes)}
});
test('Fan Analyst Fan out-of-order completions cannot replace the newest pending owner',async({page,request})=>{
 await instrument(page);await ready(page);const routes:Route[]=[];await page.route('**/api/playback?**',r=>{routes.push(r)});
 try{await hold(page);await page.getByRole('button',{name:'Play replay',exact:true}).click();await expect.poll(()=>routes.length).toBe(1);
 await page.getByRole('button',{name:'Analyst view',exact:true}).click();await expect.poll(()=>page.evaluate(()=>(window as unknown as {__ownership:Controls}).__ownership.frames.size)).toBeGreaterThan(0);await step(page);await expect.poll(()=>routes.length).toBe(2);
 await page.getByRole('button',{name:'Fan view',exact:true}).click();await expect.poll(()=>page.evaluate(()=>(window as unknown as {__ownership:Controls}).__ownership.frames.size)).toBeGreaterThan(0);await step(page);await expect.poll(()=>routes.length).toBe(3);
 const oldFan=await(await request.get(routes[0].request().url())).json();await routes[0].fulfill({json:oldFan});await settled(page,1);await routes[1].fulfill({json:{...oldFan,schema_version:999}});await settled(page,2);await step(page);expect(routes).toHaveLength(3);
 const latest=await(await request.get(routes[2].request().url())).json();await routes[2].fulfill({json:latest});await settled(page,3);await expect(page.getByRole('alert')).toHaveCount(0);await expect(page.getByRole('button',{name:'Fan view',exact:true})).toHaveAttribute('aria-pressed','true');await expect(page.getByTestId('clock')).toHaveText('56:00');
 }finally{await release(page,routes)}
});
test('current-scope malformed completion still fails closed before the next frame',async({page,request})=>{
 await instrument(page);await ready(page);const routes:Route[]=[];const packet=await(await request.get('/api/playback?scenario=line-shift&clock=3360&audience=fan&window_seconds=16')).json();await page.route('**/api/playback?**',r=>{routes.push(r)});
 try{await hold(page);await page.getByRole('button',{name:'Play replay',exact:true}).click();await expect.poll(()=>routes.length).toBe(1);await routes[0].fulfill({json:{...packet,schema_version:999}});await settled(page,1);await expect(page.getByRole('alert')).toContainText('Playback buffer unavailable or invalid');await expect(page.getByRole('button',{name:'Play replay',exact:true})).toBeVisible();await expect(page.getByTestId('clock')).toHaveText('56:00')}finally{await release(page,routes)}
});

for(const action of ['pause','scenario'] as const)test(`pending work is invalidated by ${action}`,async({page,request})=>{
 await instrument(page);await ready(page);const routes:Route[]=[];const packet=await(await request.get('/api/playback?scenario=line-shift&clock=3360&audience=fan&window_seconds=16')).json();await page.route('**/api/playback?**',r=>{routes.push(r)});
 try{await hold(page);await page.getByRole('button',{name:'Play replay',exact:true}).click();await expect.poll(()=>routes.length).toBe(1);
 if(action==='pause')await page.getByRole('button',{name:'Pause replay',exact:true}).click();else await page.getByRole('button',{name:'Select When the evidence says wait',exact:true}).click();
 await routes[0].fulfill({json:{...packet,schema_version:999}});await settled(page,1);await expect(page.getByRole('alert')).toHaveCount(0);await expect(page.getByRole('button',{name:'Play replay',exact:true})).toBeVisible();await expect(page.getByTestId('clock')).toHaveText(action==='pause'?'56:00':'22:30');
 }finally{await release(page,routes)}
});
test('React hook unmount invalidates a pending completion without publishing callbacks',async({page,request})=>{
 await instrument(page);await ready(page);const routes:Route[]=[];const view=await(await request.get('/api/view?scenario=line-shift&clock=3360&audience=fan')).json();const packet=await(await request.get('/api/playback?scenario=line-shift&clock=3360&audience=fan&window_seconds=16')).json();await page.route('**/api/playback?**',r=>{routes.push(r)});
 try{await hold(page);await page.evaluate(async(seed)=>{
 const resources=performance.getEntriesByType('resource').map(e=>e.name);const reactUrl=resources.find(url=>/\/react.js\?/.test(url))!;const domUrl=resources.find(url=>/\/react-dom_client.js\?/.test(url))!;
 const React=await import(reactUrl),dom=await import(domUrl),hookUrl='/src/playback/useBufferedReplay.ts';const {useBufferedReplay}=await import(hookUrl);
 const calls={source:0,view:0,error:0,stop:0};const host=document.createElement('div');document.body.append(host);const root=(dom.default ?? dom).createRoot(host);
 function Harness(){useBufferedReplay({scenario:'line-shift',audience:'fan',favorite:'',playing:true,clock:3360,speed:4,retry:0,seed,onView:()=>calls.view++,onSource:()=>calls.source++,onError:()=>calls.error++,onStop:()=>calls.stop++});return null}
 root.render((React.default ?? React).createElement(Harness));Object.assign(window,{__hookUnmount:()=>{root.unmount();host.remove()},__hookCalls:calls});
 },view);await expect.poll(()=>routes.length).toBe(1);await page.evaluate(()=>(window as any).__hookUnmount());await routes[0].fulfill({json:{...packet,schema_version:999}});await settled(page,1);expect(await page.evaluate(()=>(window as any).__hookCalls)).toEqual({source:0,view:0,error:0,stop:0});
 }finally{await page.evaluate(()=>(window as any).__hookUnmount?.()).catch(()=>{});await release(page,routes)}
});
