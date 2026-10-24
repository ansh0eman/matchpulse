/** A separately declared product fixture. Never writes into frozen research data. */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createReadStream, createWriteStream, mkdirSync, openSync, closeSync, writeSync, readFileSync, writeFileSync, unlinkSync, statSync } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import { createGzip } from 'node:zlib';
import { runMatch, serialize } from './simulation';
import { projectSnapshot } from './tracking/schema';

const root = new URL('../../', import.meta.url);
const goalShowcase = process.argv.includes('--goal-showcase');
const protocolPath = new URL(`research/product-excellence/${goalShowcase ? 'goal-showcase-protocol' : 'showcase-protocol'}.json`, root);
const protocol = JSON.parse(readFileSync(protocolPath, 'utf8'));
const sha = (bytes: Buffer | string) => createHash('sha256').update(bytes).digest('hex');
const pin = execFileSync('git', ['-C', fileURLToPath(new URL('upstream/football-simulator', root)), 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
if (pin !== protocol.upstream_commit ||
    sha(readFileSync(new URL('./simulation.ts', import.meta.url))) !== protocol.simulation_sha256 ||
    sha(readFileSync(new URL('./tracking/schema.ts', import.meta.url))) !== protocol.projection_sha256)
  throw new Error('Pinned source/projection differs from declared showcase protocol');
const derivedSeed = (text: string) => createHash('sha256').update(text).digest().readUInt32BE(0) % 2147483646 + 1;
if ((!goalShowcase && protocol.seed !== derivedSeed('MatchPulse AI product showcase v1')) || protocol.schedule.length || protocol.tick_seconds !== 0.25)
  throw new Error('Unsupported showcase protocol');
const candidates: { seed: number; score: { home: number; away: number }; event_sha256: string; goals: number }[] = [];
let seed: number = protocol.seed;
if (goalShowcase) {
  if (protocol.candidate_seeds.length !== 8 || protocol.candidate_seeds.some((s: number, i: number) => s !== derivedSeed(`MatchPulse AI goal showcase v1:${i}`)))
    throw new Error('Goal selection differs from the bounded declared candidates');
  for (const candidate of protocol.candidate_seeds as number[]) {
    const trial = runMatch({ seed: candidate, length: protocol.match_length_seconds, homeAttributeOffset: protocol.home_attribute_offset, awayAttributeOffset: protocol.away_attribute_offset, instrumentSnapshots: false });
    const goals = trial.events.filter(e => e.type === 'goal').length;
    candidates.push({ seed: candidate, score: trial.score, event_sha256: sha(serialize(trial.events)), goals });
    if (goals) { seed = candidate; break; }
  }
}
const parent = new URL('backend/output/showcase/', root);
mkdirSync(parent, { recursive: true });
const output = new URL(`${goalShowcase ? 'goal' : 'run'}-${process.argv.includes('--repeat') ? 'b' : 'a'}/`, parent);
// Exclusive directory/file creation: an existing source is never overwritten.
mkdirSync(output);
if (goalShowcase) {
  writeFileSync(new URL('selection.json', output), JSON.stringify({ purpose: protocol.purpose, candidates }, null, 2) + '\n', { flag: 'wx' });
  if (seed === undefined) throw new Error('No goal in the declared eight candidates; selection.json records the result');
}
const eventsPath = new URL(`${protocol.match_id}.jsonl`, output);
const rawPath = new URL(`${protocol.match_id}.tracking.jsonl`, output);
const trackingPath = new URL(`${protocol.match_id}.tracking.jsonl.gz`, output);
const fd = openSync(rawPath, 'wx');
const trackingHash = createHash('sha256');
let frameCount = 0, priorTime = -1, repeatedTimeSnapshots = 0, largestInterval = 0;
let run: ReturnType<typeof runMatch>;
try {
  run = runMatch({
    seed, length: protocol.match_length_seconds,
    homeAttributeOffset: protocol.home_attribute_offset, awayAttributeOffset: protocol.away_attribute_offset,
    instrumentSnapshots: false,
    onSnapshot(snapshot) {
      const frame = projectSnapshot(snapshot, frameCount++);
      if (frame.time_seconds < priorTime) throw new Error('Native source clock went backwards');
      if (frame.time_seconds === priorTime) repeatedTimeSnapshots++;
      if (priorTime >= 0) largestInterval = Math.max(largestInterval, frame.time_seconds - priorTime);
      priorTime = frame.time_seconds;
      const line = JSON.stringify(frame) + '\n';
      trackingHash.update(line);
      writeSync(fd, line);
    },
  });
} finally { closeSync(fd); }
const eventBytes = serialize(run.events);
if (goalShowcase && sha(eventBytes) !== candidates.at(-1)!.event_sha256)
  throw new Error('Native snapshot capture changed original events');
writeFileSync(eventsPath, eventBytes, { flag: 'wx' });
await pipeline(createReadStream(rawPath), createGzip({ level: 4 }), createWriteStream(trackingPath, { flags: 'wx' }));
const rawBytes = statSync(rawPath).size;
unlinkSync(rawPath);
const record = {
  schema_version: 1, origin: 'original seeded simulator run; native projected snapshots; no model calls',
  purpose: protocol.purpose, match_id: protocol.match_id, seed, candidates,
  upstream_commit: pin, generator_sha256: sha(readFileSync(fileURLToPath(import.meta.url))),
  protocol_sha256: sha(readFileSync(protocolPath)),
  event_count: run.events.length, frame_count: frameCount, end_seconds: run.endTime,
  repeated_time_snapshots: repeatedTimeSnapshots, largest_snapshot_interval_seconds: largestInterval,
  score: run.score, goals: run.events.filter(e => e.type === 'goal').map(e => ({ source_id: e.id, time_seconds: e.time_seconds, score: e.score })),
  event_sha256: sha(eventBytes), tracking_uncompressed_sha256: trackingHash.digest('hex'),
  tracking_gzip_sha256: sha(readFileSync(trackingPath)),
  event_bytes: Buffer.byteLength(eventBytes), tracking_raw_bytes: rawBytes, tracking_gzip_bytes: statSync(trackingPath).size,
  generation_ms: run.performance.runtime_ms,
};
writeFileSync(new URL('generation.json', output), JSON.stringify(record, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(record, null, 2));
