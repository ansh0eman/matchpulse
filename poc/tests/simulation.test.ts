import { test } from 'node:test';
import assert from 'node:assert/strict';
import {runMatch, serialize, seededRandom} from '../src/simulation';
import {eventSchema} from '../src/schema';
import {metrics} from '../src/metrics';
import {readFileSync} from 'node:fs';
test('seed constraints and known Park-Miller first value', () => {
  assert.throws(() => seededRandom(0)); assert.throws(() => seededRandom(2.2));
  assert.equal(seededRandom(1)(), 16806 / 2147483646);
});
test('full matches: reproducibility, seed divergence, ordering, validation and roster integrity', () => {
  const a=runMatch({seed:11}), b=runMatch({seed:11}), c=runMatch({seed:29});
  assert.equal(serialize(a.events),serialize(b.events)); assert.notEqual(serialize(a.events),serialize(c.events));
  const roster = new Map(a.roster.map(p=>[p.id,p.team_id]));
  a.events.forEach((e,i) => {
    assert.ok(eventSchema.safeParse(e).success); assert.equal(e.sequence,i); assert.equal(e.evidence.source_index,i);
    if(i) assert.ok(e.time_seconds>=a.events[i-1].time_seconds);
    if(e.player_id) assert.equal(roster.get(e.player_id),e.team_id);
    if(e.secondary_player_id) assert.ok(roster.has(e.secondary_player_id));
    if(e.attacking_position_m) {
      const forward=(e.team_id==='NORTH'&&e.period===1)||(e.team_id==='SOUTH'&&e.period===2);
      assert.equal(e.attacking_position_m.x,forward?e.position_m.x:105-e.position_m.x);
    }
  });
  assert.equal(a.events.at(-1)?.type,'full_time');
  assert.equal(a.performance.retained_snapshot_count,0);
  assert.equal(a.events.filter(e=>e.type==='goal').length,a.score.home+a.score.away);
  assert.ok(!eventSchema.safeParse({...a.events[0],time_seconds:NaN}).success);
});
test('intervention has identical prefix, no truth markers, valid effects and snapshot policy equivalence', () => {
  const a=runMatch({seed:47}), b=runMatch({seed:47,intervention:true});
  assert.equal(serialize(a.events.filter(e=>e.time_seconds<=3600)),serialize(b.events.filter(e=>e.time_seconds<=3600)));
  assert.notEqual(serialize(a.events),serialize(b.events));
  assert.equal(b.intervention?.time_seconds,3600);
  assert.ok(!serialize(b.events).includes('research_press_intervention'));
  assert.ok(!serialize(b.events).includes('tactical_change'));
  const retained=runMatch({seed:47,retainSnapshots:true});
  assert.equal(serialize(a.events),serialize(retained.events));
  assert.equal(retained.performance.retained_snapshot_count,retained.performance.snapshot_count);
  assert.deepEqual(metrics(a.events,1800,3600),metrics(b.events,1800,3600));
});
test('saved experiment covers 12 seed pairs with equal pre-window statistics', () => {
  const data=JSON.parse(readFileSync(new URL('../output/results.json',import.meta.url),'utf8'));
  assert.equal(data.results.length,24); assert.equal(data.reproducibility.same_seed_equal,true);
  for(const seed of data.configuration.seeds) {
    const pair=data.results.filter((r: {seed:number})=>r.seed===seed);
    assert.deepEqual(pair[0].pre,pair[1].pre);
  }
});

test('bundled policy saved results have identical prefixes and a broad spatial shift', () => {
  const data=JSON.parse(readFileSync(new URL('../output/bundle/results.json',import.meta.url),'utf8'));
  assert.equal(data.results.length,24);
  for(const seed of data.configuration.seeds) {
    const pair=data.results.filter((r: {seed:number})=>r.seed===seed);
    assert.deepEqual(pair[0].pre,pair[1].pre);
    const baseline=readFileSync(new URL(`../output/bundle/seed-${seed}-baseline.jsonl`,import.meta.url),'utf8').trim().split('\n').map(s=>JSON.parse(s));
    const press=readFileSync(new URL(`../output/bundle/seed-${seed}-press.jsonl`,import.meta.url),'utf8').trim().split('\n').map(s=>JSON.parse(s));
    assert.deepEqual(baseline.filter(e=>e.time_seconds<=3600),press.filter(e=>e.time_seconds<=3600));
  }
  // This is a fixture regression check, not a claim about unseen seeds.
  assert.equal(data.effects.high_recovery_actions.positive_pairs,11);
});
