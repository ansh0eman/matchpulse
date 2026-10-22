"""Reproducible evaluation-only charts; truth never enters replay/detectors."""
from pathlib import Path
import json
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matchpulse.ingestion import load_match
from matchpulse.schemas import MatchIdentity
from matchpulse.replay import observations

ROOT=Path(__file__).resolve().parents[2]
ART=ROOT/'research/step2-artifacts'
holdout=json.loads((ART/'holdout.json').read_text());example=json.loads((ART/'example-evidence.json').read_text())
selected=holdout['selected_result'];rows=selected['rows']
plt.rcParams.update({'font.size':10,'axes.spines.top':False,'axes.spines.right':False,'figure.dpi':140})
fig,axes=plt.subplots(1,3,figsize=(12,3.6))
nulls=[r['alert_count'] for r in rows if r['scenario']=='null']
axes[0].hist(nulls,bins=[i-.5 for i in range(max(nulls)+2)],color='#456990',rwidth=.85)
axes[0].set(xlabel='Alerts per unchanged match',ylabel='Independent seed families',title='Holdout false-alarm distribution')
axes[1].hist([x/60 for x in selected['summary']['delay_seconds']],bins=range(0,12,2),color='#2a9d8f',rwidth=.85)
axes[1].set(xlabel='Minutes after injected onset',ylabel='Matched interventions',title='Delay among detected targets only')
comparisons=holdout['comparisons']
axes[2].bar([r['config']['method'] for r in comparisons],[r['summary']['f1'] for r in comparisons],color=['#456990','#c47c5a','#999999'])
axes[2].set(ylabel='Turning-point F1',ylim=(0,1),title='Frozen method comparison')
axes[2].tick_params(axis='x',rotation=20)
fig.suptitle('Synthetic held-out evaluation — 32 families; correlated scenarios stay grouped',fontsize=11)
fig.tight_layout();fig.savefig(ART/'evaluation-overview.png');plt.close(fig)
identity=MatchIdentity(match_id=example['match_id'])
events=list(load_match(ROOT/'data/step2/inference'/f'{identity.match_id}.jsonl',identity))
obs=[o for o in observations(events,selected['config']['window_seconds']) if o.team=='NORTH']
fig,ax=plt.subplots(figsize=(11,3.8))
ax.plot([o.time/60 for o in obs],[o.after.mean_recovery_x_m if o.time-o.period_start>=selected['config']['window_seconds'] else None for o in obs],color='#456990',label='Trailing 8-minute mean recovery x')
pack=example['pack'];w=pack['comparison']
ax.axvspan(w['before_start']/60,w['split']/60,color='#9ec5dc',alpha=.35,label='Before evidence window')
ax.axvspan(w['split']/60,w['after_end']/60,color='#91c7b1',alpha=.4,label='After evidence window')
halftime=next(e.time_seconds for e in events if e.type=='half_time')
ax.axvline(halftime/60,color='#bbbbbb',linestyle='-.',label='Halftime; incomplete windows omitted')
ax.axvline(example['evaluation_only_onset_seconds']/60,color='#333333',linestyle='--',label='Injected onset (evaluation only)')
ax.axvline(pack['detected_at_seconds']/60,color='#b43e3e',linestyle=':',label='Example matched detection')
row=next(r for r in rows if r['match_id']==identity.match_id)
for alert in row['alerts']:
 if alert['team']=='NORTH':ax.scatter(alert['time']/60,100,marker='v',color='#b43e3e',s=25)
ax.set(xlabel='Cumulative match-clock minutes',ylabel='Attack-relative recovery x (metres)',title='Actual held-out match — triangles include all NORTH alerts, including unmatched ones',ylim=(-5,110))
ax.legend(loc='lower left',ncols=2,fontsize=8)
fig.tight_layout();fig.savefig(ART/'signal-example.png');plt.close(fig)
print('Wrote evaluation-overview.png and signal-example.png')
