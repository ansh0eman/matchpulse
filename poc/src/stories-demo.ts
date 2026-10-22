/** First and only demo seed: execution date 20261023; no search/intervention. */
import {mkdirSync,writeFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {runMatch,serialize} from './simulation';
import {projectSnapshot,type TrackingFrame} from './tracking/schema';
const directory='../backend/output/stories/source';mkdirSync(directory,{recursive:true});
const matchId='5cc7f774-c215-4773-9318-3a01ad8b23af';
const frames:TrackingFrame[]=[];
const result=runMatch({seed:20261023,instrumentSnapshots:false,onSnapshot:s=>{
  if(Number.isInteger(s.time))frames.push(projectSnapshot(s,frames.length));
}});
writeFileSync(`${directory}/${matchId}.jsonl`,serialize(result.events));
writeFileSync(`${directory}/${matchId}.tracking.jsonl.gz`,gzipSync(frames.map(f=>JSON.stringify(f)).join('\n')+'\n'));
writeFileSync(`${directory}/provenance.json`,JSON.stringify({seed:20261023,match_id:matchId,
 selection:'date seed, first and only run; no intervention',upstream:'39529b19c40868d66aa47db084ebc9ea29c86e70',
 score:result.score,events:result.events.length,frames:frames.length},null,2)+'\n');
console.log(JSON.stringify({seed:20261023,events:result.events.length,frames:frames.length,score:result.score}));
