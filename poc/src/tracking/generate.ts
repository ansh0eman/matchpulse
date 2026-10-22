import {mkdirSync,readFileSync,writeFileSync,existsSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {runMatch,serialize,type ScheduledChange} from '../simulation';
import {projectSnapshot,type TrackingFrame} from './schema';
const root=new URL('../../../data/step25/',import.meta.url);
const protocol=JSON.parse(readFileSync(new URL('../../../research/step25/protocol.json',import.meta.url),'utf8'));
const split=process.argv.includes('--holdout')?'holdout':process.argv.includes('--validation')?'validation':'development';
const diagnostic=process.argv.includes('--2hz');
const [start,end]=protocol.seeds[`${split}_indices`] as [number,number];
const pin=execFileSync('git',['-C',fileURLToPath(new URL('../../../upstream/football-simulator/',import.meta.url)),'rev-parse','HEAD'],{encoding:'utf8'}).trim();
if(pin!==protocol.upstream_commit)throw new Error('Wrong upstream revision');
const hz=diagnostic?2:1;
const directory=new URL(diagnostic?'diagnostic/':'inference/',root);
mkdirSync(directory,{recursive:true});mkdirSync(new URL('evaluation/',root),{recursive:true});
const fingerprint=createHash('sha256').update(readFileSync(new URL('../simulation.ts',import.meta.url))).update(readFileSync(new URL('schema.ts',import.meta.url))).update(readFileSync(new URL('generate.ts',import.meta.url))).digest('hex');
const strong={style:'high_press' as const,press:90,defensiveLine:85,tempo:65,compactness:45,mentality:'attacking' as const};
const moderate={style:'high_press' as const,press:75,defensiveLine:70,tempo:58,compactness:48,mentality:'balanced' as const};
const normal={style:'balanced' as const,press:50,defensiveLine:50,tempo:50,compactness:50,mentality:'balanced' as const};
const low={style:'low_block' as const,press:25,defensiveLine:25,tempo:45,compactness:65,mentality:'defensive' as const};
const records=[];
const limit=process.argv.includes('--pilot')?Math.min(start+3,end):end;
for(let i=start;i<=limit;i++){
  if(diagnostic&&i>=start+4)break;
  const seed=700001+104729*i;const side=i%2===0?'home':'away';const target=side==='home'?'NORTH':'SOUTH';
  const onset=protocol.onsets_seconds[i%4];const offset=[-1,0,1][i%3];
  for(const scenario of protocol.scenarios as string[]){
    const hash=createHash('sha256').update(`step25-v1:${seed}:${scenario}`).digest('hex');
    const id=`${hash.slice(0,8)}-${hash.slice(8,12)}-4${hash.slice(13,16)}-a${hash.slice(17,20)}-${hash.slice(20,32)}`;
    const cache=new URL(`evaluation/${id}-${hz}hz.json`,root);
    const eventPath=new URL(`${id}.jsonl`,directory);const framePath=new URL(`${id}.tracking.jsonl.gz`,directory);
    if(existsSync(cache)&&existsSync(eventPath)&&existsSync(framePath)){
      const prior=JSON.parse(readFileSync(cache,'utf8'));if(prior.generator_fingerprint!==fingerprint)throw new Error('Generator changed; do not reuse stale cache');records.push(prior);continue;
    }
    const changes=scenario==='strong'||scenario==='pulse'?strong:scenario==='moderate'?moderate:scenario==='press_only'?{press:90}:scenario==='tempo'?{tempo:70}:low;
    const schedule:ScheduledChange[]=scenario==='null'?[]:[{at:onset,side,changes}];
    if(scenario==='pulse')schedule.push({at:onset+180,side,changes:normal});
    const frames:TrackingFrame[]=[];
    const run=runMatch({seed,schedule,homeAttributeOffset:offset,awayAttributeOffset:-offset,instrumentSnapshots:false,
      onSnapshot:snapshot=>{if(Math.abs(snapshot.time*hz-Math.round(snapshot.time*hz))<1e-8)frames.push(projectSnapshot(snapshot,frames.length));}});
    const events=serialize(run.events);const tracking=frames.map(f=>JSON.stringify(f)).join('\n')+'\n';
    writeFileSync(eventPath,events);writeFileSync(framePath,gzipSync(tracking,{level:4}));
    const record={match_id:id,split,seed,family_index:i,scenario,target_team:target,home_attribute_offset:offset,
      changes:run.appliedChanges,planned_onset:onset,expected_direction:scenario==='low_block'?'retreat':'advance',
      event_count:run.events.length,frame_count:frames.length,hz,end_time_seconds:run.endTime,
      event_sha256:createHash('sha256').update(events).digest('hex'),tracking_sha256:createHash('sha256').update(tracking).digest('hex'),
      generator_fingerprint:fingerprint,generation_ms:run.performance.runtime_ms,score:run.score,
      halftime:run.events.find(e=>e.type==='half_time')?.time_seconds,
      substitutions:run.events.filter(e=>e.type==='substitution').length,red_cards:run.events.filter(e=>e.type==='red_card').length};
    writeFileSync(cache,JSON.stringify(record,null,2)+'\n');records.push(record);
  }
  console.log(`${split} ${hz}Hz family ${i}: ${seed}`);
}
const name=diagnostic?`${split}-2hz`:process.argv.includes('--pilot')?`${split}-pilot`:split;
writeFileSync(new URL(`evaluation/${name}-manifest.json`,root),JSON.stringify({protocol,records,source_commit:pin},null,2)+'\n');
console.log(`Saved ${records.length} matches (${name})`);
