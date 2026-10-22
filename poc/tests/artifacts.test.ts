import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {eventSchema} from '../src/schema';

test('every exported match validates, hashes match, source evidence joins and prefixes match',()=>{
  const roster = new Map(JSON.parse(readFileSync(new URL('../output/roster.json',import.meta.url),'utf8')).map((p:{id:string;team_id:string})=>[p.id,p.team_id]));
  for(const directory of ['../output/','../output/bundle/']) {
    const base=new URL(directory,import.meta.url);
    const results=JSON.parse(readFileSync(new URL('results.json',base),'utf8'));
    for(const seed of results.configuration.seeds) {
      const prefixes=[];
      for(const policy of ['baseline','press']) {
        const name=`seed-${seed}-${policy}`;
        const text=readFileSync(new URL(`${name}.jsonl`,base),'utf8');
        assert.equal(createHash('sha256').update(text).digest('hex'),results.reproducibility.hashes[name]);
        const source=readFileSync(new URL(`audit/${name}.source.jsonl`,base),'utf8').trim().split('\n').map(s=>JSON.parse(s));
        const events=text.trim().split('\n').map(s=>eventSchema.parse(JSON.parse(s)));
        assert.equal(events.length,source.length);
        for(let i=0;i<events.length;i++) {
          const e=events[i], raw=source[i];
          assert.equal(e.sequence,i);assert.equal(e.evidence.source_index,i);
          assert.equal(e.type,raw.type);assert.equal(e.time_seconds,raw.time);
          assert.deepEqual(e.position_m,raw.position);
          if(e.player_id) assert.equal(roster.get(e.player_id),e.team_id);
          if(e.secondary_player_id) assert.ok(roster.has(e.secondary_player_id));
          if(i)assert.ok(e.time_seconds>=events[i-1].time_seconds);
        }
        prefixes.push(events.filter(e=>e.time_seconds<=3600));
      }
      assert.deepEqual(prefixes[0],prefixes[1]);
    }
  }
});
