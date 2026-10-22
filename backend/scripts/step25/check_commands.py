"""Execute bounded final checks and persist actual exit statuses/timing."""
import json,subprocess,time,resource,sys
from common import ROOT,ART,dump
examples=json.loads((ART/'examples.json').read_text());python=str(ROOT/'backend/.venv/bin/python');node='/Users/ansh0eman/.nvm/versions/node/v24.19.0/bin/node'
commands=[('pytest',[python,'-m','pytest','backend/tests','-q'],ROOT),
    ('typecheck',[node,'node_modules/typescript/bin/tsc','--noEmit'],ROOT/'poc'),
    ('typescript-tests',[node,'--import','tsx','--test',*[str(p.relative_to(ROOT/'poc')) for p in sorted((ROOT/'poc/tests').glob('*.test.ts'))]],ROOT/'poc')]
for kind in ['success','false_alert']:
    identity=examples[kind]['match_id']
    commands.append((f'cli-{kind}',[python,'-m','matchpulse.tracking.cli',f'data/step25/inference/{identity}.tracking.jsonl.gz','--events',f'data/step25/inference/{identity}.jsonl','--config','research/step25/artifacts/selected.json','--debug','--output',f'backend/output/step25/{kind}-demo.json'],ROOT))
rows=[]
for name,args,cwd in commands:
    start=time.perf_counter()
    with (ART/f'{name}.log').open('w') as out:result=subprocess.run(args,cwd=cwd,stdout=out,stderr=subprocess.STDOUT)
    rows.append({'name':name,'argv':args,'cwd':str(cwd),'exit_code':result.returncode,'seconds':time.perf_counter()-start})
    print(name,result.returncode,round(rows[-1]['seconds'],3),flush=True)
    if result.returncode:dump(ART/'command-results.json',rows);sys.exit(result.returncode)
rows.append({'name':'candidate-development','exit_code':0,'evidence':'completed development-summary.json; original superseded comparison interrupted with exit130 before selection'})
rows.append({'name':'validation-freeze','exit_code':None,'evidence':'completed final JSON log and frozen artifacts; original session handle was not retained, so shell exit is not asserted or rerun after holdout'})
rows.append({'name':'holdout-score-and-raw-verification','exit_code':0,'evidence':'observed chained command exit0; holdout-summary.json + verification.json'})
rows.append({'name':'old-incomplete-comparison','exit_code':130,'evidence':'interrupted intentionally for equivalent shared-comparison implementation; not a completed experiment'})
rows.append({'name':'checks-and-cli-peak-child-rss-bytes','value':resource.getrusage(resource.RUSAGE_CHILDREN).ru_maxrss})
dump(ART/'command-results.json',rows)
