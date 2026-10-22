"""Reproduce the original detector's structural period warm-up bound, development only."""
import json,math
from common import ROOT,ART,dump
from matchpulse.schemas import MatchIdentity
from matchpulse.ingestion import load_match
rows=[]
records=json.loads((ROOT/'data/step2/evaluation/development-manifest.json').read_text())['records']
for r in records:
    if r['scenario'] not in ['bundle','moderate']:continue
    events=load_match(ROOT/'data/step2/inference'/f"{r['match_id']}.jsonl",MatchIdentity(match_id=r['match_id']))
    period_start=next(e.time_seconds for e in events if e.period==2)
    earliest=math.ceil((period_start+960)/60)*60+60
    onset=r['planned_change_seconds'];delay=max(0,earliest-onset)
    rows.append({'seed':r['seed'],'onset':onset,'half':period_start,'earliest':earliest,'minimum_possible_delay':delay,'horizon_available':max(0,600-delay)})
p=ART/'old-halftime-audit.json';old=json.loads(p.read_text())
assert rows==old,'Warm-up audit differs: investigate, do not overwrite silently'
print('Reproduced',len(rows),'development intervention eligibility bounds')
