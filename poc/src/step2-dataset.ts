import {mkdirSync, writeFileSync, readFileSync, existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {runMatch, serialize, type ScheduledChange} from './simulation';
const root = new URL('../../data/step2/', import.meta.url);
const source = new URL('../../upstream/football-simulator/', import.meta.url);
const pin = '39529b19c40868d66aa47db084ebc9ea29c86e70';
if(execFileSync('git',['-C',fileURLToPath(source),'rev-parse','HEAD'],{encoding:'utf8'}).trim() !== pin) throw new Error('Upstream pin mismatch');
const split = process.argv.includes('--holdout') ? 'holdout' : 'development';
const bundle = {style:'high_press' as const,press:90,defensiveLine:85,tempo:65,compactness:45,mentality:'attacking' as const};
const moderate = {style:'high_press' as const,press:75,defensiveLine:70,tempo:58,compactness:48,mentality:'balanced' as const};
const normal = {style:'balanced' as const,press:50,defensiveLine:50,tempo:50,compactness:50,mentality:'balanced' as const};
const scenarios = ['null','bundle','moderate','tempo','pulse'] as const;
const records = [];
const indices = split === 'development' ? Array.from({length:24},(_,i)=>i) : Array.from({length:32},(_,i)=>i+24);
mkdirSync(new URL('inference/',root),{recursive:true}); mkdirSync(new URL('evaluation/',root),{recursive:true});
for(const i of indices) {
  const seed = 1009 + i*7919;
  const changeAt = [3300,3600,3900,4200][i%4];
  // Strength variation is fixed before scoring; paired scenarios share roster strength.
  const offset = [-1,0,1][i%3];
  for(const scenario of scenarios) {
    const key=createHash('sha256').update(`matchpulse-step2-v1:${seed}:${scenario}`).digest('hex');
    const id=`${key.slice(0,8)}-${key.slice(8,12)}-4${key.slice(13,16)}-a${key.slice(17,20)}-${key.slice(20,32)}`;
    const path=new URL(`inference/${id}.jsonl`,root);
    const cache = new URL(`evaluation/${id}.json`,root);
    if(existsSync(path) && existsSync(cache)) {records.push(JSON.parse(readFileSync(cache,'utf8')));continue;}
    const schedule:ScheduledChange[] = scenario==='null' ? [] : [{at:changeAt,side:'home',changes:scenario==='moderate'?moderate:scenario==='tempo'?{tempo:70}:bundle}];
    if(scenario==='pulse')schedule.push({at:changeAt+180,side:'home',changes:normal});
    const run=runMatch({seed,schedule,homeAttributeOffset:offset,awayAttributeOffset:-offset,instrumentSnapshots:false});
    const text=serialize(run.events);writeFileSync(path,text);
    const record={match_id:id,split,seed,scenario,planned_change_seconds:scenario==='null'?null:changeAt,
      changes:run.appliedChanges,target_team:'NORTH',eligible:scenario==='bundle'||scenario==='moderate',
      home_attribute_offset:offset,end_time_seconds:run.endTime,event_count:run.events.length,
      score:run.score,sha256:createHash('sha256').update(text).digest('hex'),generation_ms:run.performance.runtime_ms};
    writeFileSync(cache,JSON.stringify(record,null,2)+'\n');records.push(record);
  }
  console.log(`${split} family ${i+1}: seed ${seed}`);
}
writeFileSync(new URL(`evaluation/${split}-manifest.json`,root),JSON.stringify({schema_version:1,source_commit:pin,split,
  protocol:{development_families:24,holdout_families:32,seeds:'1009 + 7919*i; i=0..55',
    old_seeds_excluded:[11,29,47,83,101,137,173,211,257,307,353,401],scenarios,
    change_times:[3300,3600,3900,4200],pulse_duration_seconds:180,
    matching_horizon_seconds:600,false_positive_target_per_null_match:0.25,
    targets:{precision:0.75,recall:0.70,median_delay_seconds:480}},records},null,2)+'\n');
console.log(`Saved ${records.length} ${split} matches`);
