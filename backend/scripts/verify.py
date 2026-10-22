"""Record exact validation argv/exit codes; verbose output stays in local logs."""
import json
from pathlib import Path
import subprocess
import sys
ROOT=Path(__file__).resolve().parents[2]
ART=ROOT/'research/step2-artifacts'
example=json.loads((ART/'example-evidence.json').read_text())
commands=[
    (ROOT,['uv','sync','--project','backend','--frozen','--extra','dev'],'sync-final.log'),
    (ROOT,['uv','run','--project','backend','pytest','backend/tests','-q'],'pytest.log'),
    (ROOT/'poc',['npm','run','typecheck'],'typescript-typecheck.log'),
    (ROOT/'poc',['npm','test'],'typescript-tests.log'),
    (ROOT,['uv','run','--project','backend','python','-m','compileall','-q','backend/src','backend/scripts'],'python-compile.log'),
    (ROOT,['uv','run','--project','backend','matchpulse',f"data/step2/inference/{example['match_id']}.jsonl",'--debug','--output','backend/output/cli-demo.json'],'cli-demo.log'),
]
results=[]
for cwd,args,name in commands:
    with (ART/name).open('w') as stream:
        process=subprocess.run(args,cwd=cwd,stdout=stream,stderr=subprocess.STDOUT,timeout=180)
    results.append({'cwd':str(cwd.relative_to(ROOT)), 'argv':args,'exit_code':process.returncode,'log':name})
    print(f'{name}: exit {process.returncode}',flush=True)
(ART/'verification.json').write_text(json.dumps(results,indent=2)+'\n')
sys.exit(int(any(r['exit_code'] for r in results)))
