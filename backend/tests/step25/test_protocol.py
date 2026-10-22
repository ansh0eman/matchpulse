import importlib.util,sys,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3]
sys.path.insert(0,str(ROOT/'backend/scripts/step25'))
from compare import matched,metrics

def test_one_to_one_direction_horizons_and_unsupported_denominators():
    row={'seed':1,'scenario':'strong','target_team':'NORTH','expected_direction':'advance','onset':100,'end_time_seconds':5400,
        'alerts':[{'time':99,'team':'NORTH','direction':'advance'}, {'time':101,'team':'SOUTH','direction':'advance'},
        {'time':102,'team':'NORTH','direction':'retreat'},{'time':800,'team':'NORTH','direction':'advance'},
        {'time':801,'team':'NORTH','direction':'advance'}]}
    a=matched(row,600);b=matched(row,1200)
    assert (a['tp'],a['fp'],a['fn'])==(0,5,1)
    assert (b['tp'],b['fp'],b['fn'],b['duplicate_alerts'])==(1,4,0,1)
    assert b['wrong_team_alerts']==1 and b['early_alerts']==1
    no_support={**row,'alerts':[]}
    m=metrics([row,no_support],600)
    assert m['eligible_interventions']==2 and m['missed_interventions']==2

def test_fresh_grouped_seeds():
    protocol=json.loads((ROOT/'research/step25/protocol.json').read_text())
    groups=[{700001+104729*i for i in range(a,b+1)} for a,b in [protocol['seeds'][k] for k in ['development_indices','validation_indices','holdout_indices']]]
    assert [len(g) for g in groups]==[24,16,40]
    assert not any(groups[i]&groups[j] for i in range(3) for j in range(i))
    old_step1={11,29,47,83,101,137,173,211,257,307,353,401}
    old_step2={1009+7919*i for i in range(56)}
    assert not set.union(*groups)&(old_step1|old_step2)
    for split,g in zip(['development','validation','holdout'],groups):
        path=ROOT/'data/step25/evaluation'/f'{split}-manifest.json'
        if not path.exists():continue
        rows=json.loads(path.read_text())['records']
        assert {r['seed'] for r in rows}==g
        assert all(len([r for r in rows if r['seed']==seed])==7 for seed in g)
