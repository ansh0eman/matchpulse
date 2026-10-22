"""Descriptive development baseline diagnostics, not causal attribution."""
import json
from common import ROOT,DATA,ART,manifest,dump
from compare import PRIMARY,matched
from matchpulse.schemas import MatchIdentity
from matchpulse.ingestion import load_match
base=json.loads((ART/'development-detail.json').read_text())['results'][0];metadata={r['match_id']:r for r in manifest('development')}
counts={'primary_alerts':0,'alerts_within_120s_of_goal':0,'alerts_within_300s_of_halftime':0,'within_300s_before_halftime':0,'within_300s_after_halftime':0,'wrong_team':0,'early':0,'null_alerts':0};strata=[]
for row in base['rows']:
    if row['scenario'] not in PRIMARY:continue
    r=metadata[row['match_id']];events=list(load_match(DATA/'inference'/f"{r['match_id']}.jsonl",MatchIdentity(match_id=r['match_id'])))
    goals=[e.time_seconds for e in events if e.type=='goal'];half=next(e.time_seconds for e in events if e.type=='half_time');m=matched(row,600)
    counts['primary_alerts']+=len(row['alerts']);counts['wrong_team']+=m['wrong_team_alerts'];counts['early']+=m['early_alerts']
    counts['null_alerts']+=len(row['alerts']) if r['scenario']=='null' else 0
    for a in row['alerts']:
        counts['alerts_within_120s_of_goal']+=any(abs(a['time']-t)<=120 for t in goals)
        counts['alerts_within_300s_of_halftime']+=abs(a['time']-half)<=300
        counts['within_300s_before_halftime']+=half-300<=a['time']<=half
        counts['within_300s_after_halftime']+=half<a['time']<=half+300
    strata.append({'seed':r['seed'],'scenario':r['scenario'],'onset':r['planned_onset'],'hit':m['tp'],'alerts':len(row['alerts'])})
dump(ART/'event-baseline-context.json',{'split':'development','counts':counts,'warning':'Categories overlap; proximity to goals is not a causal explanation; old period support can structurally exclude near-half alerts.'})
print(json.dumps(counts))
