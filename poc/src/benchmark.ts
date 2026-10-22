import {runMatch, serialize} from './simulation';
const retainSnapshots = process.argv.includes('--retain');
const result = runMatch({seed:11, retainSnapshots});
console.log(JSON.stringify({retainSnapshots, ...result.performance, event_count:result.events.length,
  jsonl_bytes:Buffer.byteLength(serialize(result.events)), process_max_rss_bytes:process.resourceUsage().maxRSS*1024},null,2));
