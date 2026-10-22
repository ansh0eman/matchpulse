import { mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { runMatch, serialize } from './simulation';
import { metrics } from './metrics';
const bundled = process.argv.includes('--bundle');
const output = new URL(bundled ? '../output/bundle/' : '../output/', import.meta.url);
mkdirSync(output, {recursive: true});
mkdirSync(new URL('audit/',output), {recursive:true});
const write = (name: string, value: unknown) => writeFileSync(new URL(name, output), JSON.stringify(value, null, 2) + '\n');
const hash = (text: string) => createHash('sha256').update(text).digest('hex');
const seeds = [11,29,47,83,101,137,173,211,257,307,353,401];
type Result = {seed:number; intervention:boolean; event_count:number; jsonl_bytes:number;
  score:{home:number;away:number};end_time_seconds:number;performance:ReturnType<typeof runMatch>['performance'];
  pre:ReturnType<typeof metrics>;post:ReturnType<typeof metrics>};
const results: Result[] = [];
const groundTruth = [];
const hashes: Record<string,string> = {};
let firstText = '';
for (const seed of seeds) {
  for (const intervention of [false, true]) {
    const run = runMatch({seed, intervention, policy: bundled ? 'high-press-bundle' : 'press-only'});
    const name = `seed-${seed}-${intervention ? 'press' : 'baseline'}`;
    const text = serialize(run.events);
    writeFileSync(new URL(`${name}.jsonl`, output), text);
    hashes[name] = hash(text);
    writeFileSync(new URL(`audit/${name}.source.jsonl`, output), run.sourceEvents.map(e => JSON.stringify(e)).join('\n')+'\n');
    if (seed === seeds[0] && !intervention) {
      firstText = text;
      write('roster.json', run.roster);
      write('source-example.json', run.sourceEvents.slice(0, 30));
      writeFileSync(new URL('source-seed-11-baseline.jsonl', output), run.sourceEvents.map(e => JSON.stringify(e)).join('\n')+'\n');
    }
    groundTruth.push({run: name, intervention: run.intervention});
    results.push({seed, intervention, event_count: run.events.length, jsonl_bytes: Buffer.byteLength(text), score: run.score,
      end_time_seconds: run.endTime, performance: run.performance,
      pre: metrics(run.events, 1800,3600), post: metrics(run.events,3600,5400)});
    console.log(`${name}: ${run.events.length} events, ${Math.round(run.performance.runtime_ms)} ms`);
  }
}
const repeat = serialize(runMatch({seed: seeds[0]}).events);
writeFileSync(new URL('seed-11-repeat.jsonl', output), repeat);
hashes.repeat = hash(repeat);
const metricNames = Object.keys(results[0].post) as (keyof typeof results[0]['post'])[];
const effects = Object.fromEntries(metricNames.map(metric => {
  const differences = seeds.map(seed => {
    const baseline = results.find(r => r.seed === seed && !r.intervention)!;
    const press = results.find(r => r.seed === seed && r.intervention)!;
    const values = [baseline.post[metric], press.post[metric], baseline.pre[metric], press.pre[metric]];
    if (values.some(v => v === null)) return null;
    return {seed, post_difference: press.post[metric]! - baseline.post[metric]!,
      difference_in_differences: (press.post[metric]! - press.pre[metric]!) - (baseline.post[metric]! - baseline.pre[metric]!)};
  }).filter(v => v !== null);
  const deltas = differences.map(v => v.post_difference);
  const mean = deltas.reduce((a,b) => a+b,0) / deltas.length;
  const sd = Math.sqrt(deltas.reduce((n,v) => n+(v-mean)**2,0)/(deltas.length-1));
  return [metric, {n: deltas.length, mean_post_difference: mean, paired_sd: sd,
    descriptive_normal_95_interval: [mean - 1.96*sd/Math.sqrt(deltas.length),mean + 1.96*sd/Math.sqrt(deltas.length)],
    positive_pairs: deltas.filter(v => v>0).length, differences}];
}));
write('ground-truth.json', groundTruth);
write('results.json', {environment: {node: process.version, platform:process.platform, arch:process.arch},
  configuration: {seeds, tick_seconds:0.25, match_length_seconds:5400, intervention_at_seconds:3600,
    intervention: bundled ? 'home style high_press, press 90, defensiveLine 85, tempo 65, compactness 45, mentality attacking' : 'home press 50 -> 90 only; all other base settings unchanged', windows: '[1800,3600) and [3600,5400)'},
  reproducibility: {same_seed_equal: repeat === firstText, distinct_seed_different: hashes['seed-11-baseline'] !== hashes['seed-29-baseline'], hashes},
  results, effects});
if (repeat !== firstText) throw new Error('Reproducibility failed');
console.log(JSON.stringify({same_seed_equal: repeat === firstText, effects}, null, 2));
