import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {runMatch,serialize} from '../src/simulation';
import {projectSnapshot,trackingFrameSchema,type TrackingFrame} from '../src/tracking/schema';

test('observable extraction preserves full canonical bytes, cadence and old known seed hash',()=>{
  const base=runMatch({seed:11,instrumentSnapshots:false});
  const frames:TrackingFrame[]=[];
  const measured=runMatch({seed:11,instrumentSnapshots:false,onSnapshot:s=>{if(Number.isInteger(s.time))frames.push(projectSnapshot(s,frames.length));}});
  assert.equal(serialize(base.events),serialize(measured.events));
  const known=readFileSync(new URL('../output/seed-11-baseline.jsonl',import.meta.url),'utf8');
  assert.equal(createHash('sha256').update(serialize(measured.events)).digest('hex'),createHash('sha256').update(known).digest('hex'));
  for(let i=1;i<frames.length;i++)assert.equal(frames[i].time_seconds-frames[i-1].time_seconds,1);
  const text=JSON.stringify(frames);
  for(const forbidden of ['currentIntent','target','stamina','press','tactics','random','chanceQuality'])assert.ok(!text.includes(`"${forbidden}"`));
  assert.ok(frames.some(f=>f.period===2));
  assert.ok(frames.every(f=>f.players.length<=22));
});

test('sample frequency changes only observable samples, not simulation or canonical events',()=>{
  const one:TrackingFrame[]=[],two:TrackingFrame[]=[];
  const options={seed:50003,length:1200,instrumentSnapshots:false,schedule:[{at:800,side:'home' as const,changes:{press:90}}]};
  const a=runMatch({...options,onSnapshot:s=>{if(Number.isInteger(s.time))one.push(projectSnapshot(s,one.length));}});
  const b=runMatch({...options,onSnapshot:s=>{if(Number.isInteger(s.time*2))two.push(projectSnapshot(s,two.length));}});
  assert.equal(serialize(a.events),serialize(b.events));
  const thin=two.filter(f=>Number.isInteger(f.time_seconds)).map((f,i)=>({...f,sequence:i,frame_id:`frame_${String(i).padStart(6,'0')}`}));
  assert.deepEqual(one,thin);
});

test('tracking allowlist rejects internals and represents stale owner honestly',()=>{
  const frame={schema_version:1,frame_id:'frame_000000',sequence:0,time_seconds:0,period:1,phase:'open_play',score:{home:0,away:0},ball:{x:50,y:34,owner_id:'gone',owner_status:'inactive_reference'},players:[]};
  assert.ok(trackingFrameSchema.safeParse(frame).success);
  assert.ok(!trackingFrameSchema.safeParse({...frame,target:{x:70,y:20}}).success);
  assert.ok(!trackingFrameSchema.safeParse({...frame,ball:{...frame.ball,owner_status:'active'}}).success);
  assert.ok(!trackingFrameSchema.safeParse({...frame,players:[{id:'x',team_id:'NORTH',goalkeeper:false,x:1,y:2,currentIntent:'press'}]}).success);
});
