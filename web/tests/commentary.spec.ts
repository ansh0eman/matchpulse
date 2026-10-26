import {openLineComparison} from "./helpers/readiness";
import {test,expect,type Page} from '@playwright/test';
import type { Story,View } from '../src/contracts';
import {commentaryCopy,narrationIdentity} from '../src/broadcast/commentaryCopy';
const names=(side:'NORTH'|'SOUTH')=>side==='NORTH'?'Manchester City':'Manchester United';
async function mockSpeech(page:Page){await page.addInitScript(()=>{
 const state={spoken:[] as {text:string;voice:string;rate:number}[],items:[] as {onend:(()=>void)|null;onerror:(()=>void)|null}[],cancels:0,active:0,maxActive:0,voices:[{name:'English A',voiceURI:'a',lang:'en-GB',localService:true},{name:'English B',voiceURI:'b',lang:'en-US',localService:true},{name:'Remote voice',voiceURI:'remote',lang:'en-US',localService:false},{name:'German',voiceURI:'de',lang:'de-DE',localService:true},{name:'Boing',voiceURI:'novelty',lang:'en-US',localService:true}]};
 Object.defineProperty(window,'__audio',{value:state,configurable:true});
 Object.defineProperty(window,'SpeechSynthesisUtterance',{value:class {text:string;voice:{voiceURI:string}|null=null;rate=1;lang='';pitch=1;onend=null;onerror=null;constructor(text:string){this.text=text}},configurable:true});
 Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>state.voices,onvoiceschanged:null,cancel:()=>{state.cancels++;state.active=0},speak:(item:{text:string;voice:{voiceURI:string};rate:number;onend:(()=>void)|null;onerror:(()=>void)|null})=>{state.spoken.push({text:item.text,voice:item.voice.voiceURI,rate:item.rate});state.items.push(item);state.active++;state.maxActive=Math.max(state.maxActive,state.active)}},configurable:true});
})}
type Audio={spoken:{text:string;voice:string;rate:number}[];items:{onend:(()=>void)|null;onerror:(()=>void)|null}[];voices:SpeechSynthesisVoice[];cancels:number;maxActive:number};
const audio=(page:Page)=>page.evaluate(()=>(window as unknown as {__audio:Audio}).__audio.spoken);
test('spoken copy uses registered values, complete supported sentences and exact incident identities',async({request})=>{
 const native:View=await(await request.get('/api/view?scenario=native-goals&clock=1640&audience=fan')).json();const goal=native.timeline.find(s=>s.type==='goal_context')!;
 expect(commentaryCopy(goal,names)).toBe("Manchester City have scored. It's one–nil.");
 expect(commentaryCopy({...goal,overlay:{...goal.overlay,metrics:[]}},names)).toBeNull();
 const line:View=await(await request.get('/api/view?scenario=line-shift&clock=3360&audience=fan')).json();const shift=line.timeline.find(s=>s.type==='observed_line_height_change')!,shot=line.timeline.find(s=>s.source_seconds===3279.5&&s.type==='observed_shot')!;
 expect(commentaryCopy(shift,names)).toBe("Manchester City's three deepest outfielders were about ten metres higher in the recent comparable samples.");
 expect(commentaryCopy(shot,names,true)).toBe('Selected historical moment. A shot from Manchester United.');
 expect(narrationIdentity(shot)).toEqual([`${line.match_id}|evt_003876`]);
 const different={...shot,id:shot.id+'other',overlay:{...shot.overlay,references:shot.overlay.references.map(r=>({...r,source_id:'evt_different'}))}};expect(narrationIdentity(different)).not.toEqual(narrationIdentity(shot));
 expect(commentaryCopy({...shot,type:'unknown'} as Story,names)).toBeNull();
});
test('local voice controls bound the queue and reject stale completion, seek and mapping callbacks',async({page},info)=>{
 await mockSpeech(page);await openLineComparison(page,info);await expect(page.getByTestId('verified-support')).toContainText('59 verified samples');await expect(page.getByRole('button',{name:'Commentary off',exact:true})).toBeEnabled();expect(await audio(page)).toEqual([]);
 await page.locator('.commentary-settings summary').click();await expect(page.getByLabel('Local English voice',{exact:true}).locator('option')).toHaveCount(2);
 await page.getByLabel('Local English voice',{exact:true}).selectOption('b');await page.getByLabel('Speaking rate',{exact:true}).selectOption('1.1');await page.getByRole('button',{name:'Preview selected voice',exact:true}).click();
 expect((await audio(page))[0]).toMatchObject({voice:'b',rate:1.1,text:'Welcome to Turn of Play. Explore the recorded moments, and check the evidence.'});
 await page.getByRole('button',{name:'Preview commentary for this moment',exact:true}).click();await page.getByRole('button',{name:'Preview commentary for this moment',exact:true}).click();
 expect((await audio(page)).at(-1)?.text).toContain('three deepest outfielders');expect(await page.evaluate(()=>(window as unknown as {__audio:Audio}).__audio.maxActive)).toBe(1);
 await page.locator('.synthetic-disclosure summary').click();await page.getByLabel('Home presentation club',{exact:true}).selectOption('arsenal');await page.keyboard.press('Escape');await expect(page.locator('.speech-status')).toContainText('idle');await expect(page.locator('.replay-caption-line')).toHaveCount(0);
 await page.getByLabel('Replay clock',{exact:true}).fill('3400');await expect(page.getByTestId('clock')).toHaveText('56:40');await page.evaluate(()=>{const s=(window as unknown as {__audio:Audio}).__audio;s.items[0].onerror?.();s.items[0].onend?.()});await expect(page.locator('.speech-status')).toContainText('idle');
 await page.getByRole('button',{name:'Commentary off',exact:true}).click();await page.evaluate(()=>{const s=(window as unknown as {__audio:Audio}).__audio;s.voices=[];window.speechSynthesis.onvoiceschanged?.(new Event('voiceschanged') as SpeechSynthesisEvent)});await expect(page.getByRole('button',{name:'Commentary unavailable: no local English voice'})).toBeDisabled();
 await expect(page.locator('.commentary-settings')).toContainText('Captions remain available');await page.getByRole('button',{name:'Captions on',exact:true}).click();await expect(page.getByRole('button',{name:'Captions off',exact:true})).toBeEnabled();
 await page.screenshot({path:info.outputPath('voice-unavailable.png'),animations:'disabled'});
});
test('arrival speaks once with no startup or seek backlog and cancels on pause and view exit',async({page},info)=>{
 await mockSpeech(page);await page.goto('/?scenario=native-goals&clock=1611');await expect(page.getByRole('button',{name:'Play replay',exact:true})).toBeEnabled({timeout:60000});expect(await audio(page)).toEqual([]);
 await page.getByRole('button',{name:'Commentary off',exact:true}).click();await page.getByLabel('Playback speed').selectOption('12');await page.getByRole('button',{name:'Play replay',exact:true}).click();
 await expect.poll(()=>audio(page)).toHaveLength(1);expect((await audio(page))[0].text).toBe("Manchester City have scored. It's one–nil.");await page.getByRole('button',{name:'Pause replay',exact:true}).click();
 const before=await page.evaluate(()=>(window as unknown as {__audio:Audio}).__audio.cancels);await page.getByLabel('Replay clock',{exact:true}).fill('1611');await expect(page.getByTestId('clock')).toHaveText('26:51');await page.getByLabel('Replay clock',{exact:true}).fill('1640');await expect(page.getByTestId('clock')).toHaveText('27:20');expect(await audio(page)).toHaveLength(1);
 await page.getByRole('button',{name:'Investigate',exact:true}).click();expect(await page.evaluate(()=>(window as unknown as {__audio:Audio}).__audio.cancels)).toBeGreaterThan(before);await page.evaluate(()=>{const s=(window as unknown as {__audio:Audio}).__audio;s.items[0].onend?.()});expect(await audio(page)).toHaveLength(1);
 await page.screenshot({path:info.outputPath('voice-view-exit.png'),animations:'disabled'});
});
