"""Reproducible evaluation-only plots; never imported by inference."""
from __future__ import annotations
import json
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from common import ROOT,DATA,ART,manifest,prepare,samples_from_cache
from compare import PRIMARY,matched
from matchpulse.tracking.detector import TrackingConfig
from matchpulse.tracking.replay import comparisons_from_samples
from matchpulse.tracking.ingestion import load_frames
from matchpulse.schemas import MatchIdentity
from matchpulse.ingestion import load_match
from matchpulse.signals import SignalState
FIG=ROOT/'research/step25/figures';FIG.mkdir(exist_ok=True)
plt.rcParams.update({'figure.dpi':150,'savefig.dpi':170,'font.size':10,'axes.spines.top':False,'axes.spines.right':False})
colors={'null':'#64748b','strong':'#007f5f','moderate':'#1585b5','press_only':'#d89d00','low_block':'#8645a8','tempo':'#e76f51','pulse':'#e54f6d'}
def save(fig,name):fig.savefig(FIG/name,bbox_inches='tight',facecolor='white');plt.close(fig)
sep=json.loads((ART/'feature-separation-detail.json').read_text());sums=json.loads((ART/'holdout-summary.json').read_text());detail=json.loads((ART/'holdout-detail.json').read_text());examples=json.loads((ART/'examples.json').read_text());records=manifest('holdout');byid={r['match_id']:r for r in records}
# Candidate distributions retain each family, including weak/negative scenarios.
fig,axes=plt.subplots(1,3,figsize=(14,4))
scenarios=['null','strong','moderate','press_only','low_block','tempo','pulse'];rng=np.random.default_rng(11)
for ax,feature,title in zip(axes,['line3_m','nearest_m','density10'],['Line change (m)','Carrier distance change (m)','Local density change (players)']):
    for index,scenario in enumerate(scenarios):
        values=[r['delta'][feature] for r in sep['changes'] if r['scenario']==scenario and r['supported']]
        ax.scatter(index+rng.uniform(-.12,.12,len(values)),values,s=17,alpha=.7,color=colors[scenario])
        if values:ax.plot([index-.22,index+.22],[np.median(values)]*2,color='black',lw=2)
    ax.axhline(0,color='gray',lw=.8);ax.set_xticks(range(7),scenarios,rotation=50,ha='right');ax.set_title(title)
fig.suptitle('Development: context-matched five-minute pre/post changes (dots = families)');save(fig,'feature-distributions.png')
fig,ax=plt.subplots(figsize=(10,8));im=ax.imshow(sep['correlation'],vmin=-1,vmax=1,cmap='RdBu_r');ax.set_xticks(range(13),sep['feature_names'],rotation=65,ha='right');ax.set_yticks(range(13),sep['feature_names']);fig.colorbar(im,ax=ax,label='Pearson correlation across supported development changes');ax.set_title('Redundant geometry is not independent confirmation');save(fig,'feature-correlations.png')
# Heldout finalist comparison; no finalist is selected with these results.
rs=sums['results'];labels=[r['config']['method'] for r in rs];x=np.arange(len(rs));fig,axes=plt.subplots(1,2,figsize=(12,4))
for j,k in enumerate(['precision','recall','f1']):axes[0].bar(x+(j-1)*.24,[r['metrics']['600'][k] or 0 for r in rs],width=.24,label=k)
axes[0].set_ylim(0,1);axes[0].legend();axes[0].set_title('Objective A, primary 600s horizon');axes[1].bar(x,[r['metrics']['600']['false_alerts_per_null_match'] for r in rs],color='#64748b');axes[1].axhline(.25,color='#b91c1c',ls='--',label='target .25');axes[1].legend();axes[1].set_title('Alerts per unchanged match')
for ax in axes:ax.set_xticks(x,labels,rotation=35,ha='right')
save(fig,'detector-comparison.png')
# Full selected alert matrix: all primary matches, no omitted failures.
rows=[r for r in detail['selected']['rows'] if r['scenario'] in PRIMARY];fig,ax=plt.subplots(figsize=(12,10))
for i,r in enumerate(rows):
    if r['onset'] is not None:ax.scatter(r['onset']/60,i,color=colors[r['scenario']],marker='|',s=28)
    for a in r['alerts']:ax.scatter(a['time']/60,i,s=8,color='#222' if a['team']==r['target_team'] else '#dc2626',marker='o' if a['direction']=='advance' else 'v')
ax.set(xlabel='Cumulative match minute',ylabel='All 200 primary held-out matches',title='Selected detector: external onset ticks; target-team black, other-team red alerts');ax.grid(axis='x',alpha=.2);save(fig,'all-alerts.png')
fig,axes=plt.subplots(1,2,figsize=(11,4));m=sums['selected_metrics']
for ax,h in zip(axes,['600','1200']):
    d=np.asarray(m[h]['delay_seconds'])/60;ax.hist(d,bins=np.arange(0,21,.5),color='#007f5f');ax.set(xlabel='Minutes after external intervention',ylabel='Matched interventions',title=f'{h}s matching horizon: matched delays only')
save(fig,'detection-delays.png')
# Successful, false and missed examples, selected by first qualifying manifest order.
for kind in ['success','false_alert','miss']:
    e=examples[kind];r=byid[e['match_id']];anchor=e['pack']['detected_at_seconds'] if kind=='false_alert' else r['planned_onset'];team=e['pack']['team_id'] if kind=='false_alert' else r['target_team'];paired=next(q for q in records if q['seed']==r['seed'] and q['scenario']=='null');fig,axes=plt.subplots(3,1,figsize=(11,8),sharex=True)
    cases=[(r,'unchanged')] if paired['match_id']==r['match_id'] else [(paired,'paired unchanged'),(r,r['scenario'])]
    for q,label in cases:
        cache=prepare(q);c=TrackingConfig();comparisons=list(comparisons_from_samples(samples_from_cache(cache),cache['end_time'],c,cache['period_starts']))
        selected=[(t,o) for t,side,o in comparisons if side==team and anchor-600<=t<=anchor+900]
        for ax,feature in zip(axes[:2],['line3_m','nearest_m']):ax.plot([(t-anchor)/60 for t,o in selected],[o.after[feature] if o else np.nan for t,o in selected],label=label)
        state=SignalState(180);events=iter(load_match(DATA/'inference'/f"{q['match_id']}.jsonl",MatchIdentity(match_id=q['match_id'])));pending=next(events,None);times=[];values=[]
        for t in range(60,int(cache['end_time'])+1,60):
            while pending and pending.time_seconds<=t:state.update(pending);pending=next(events,None)
            if anchor-600<=t<=anchor+900:
                o=state.observe(t,team);times.append((t-anchor)/60);values.append(o.after.mean_recovery_x_m if o.after.mean_recovery_x_m is not None else np.nan)
        axes[2].plot(times,values,label=label)
    for ax,label in zip(axes,['Recent line height (m)','Recent nearest defender (m)','Recent recovery origin (m)']):
        ax.set_ylabel(label);ax.axvline(0,color='gray',ls='--');ax.legend(loc='best');ax.grid(alpha=.2)
    target_row=next(q for q in detail['selected']['rows'] if q['match_id']==r['match_id'])
    for a in target_row['alerts']:
        if anchor-600<=a['time']<=anchor+900:
            for ax in axes:ax.axvline((a['time']-anchor)/60,color='#b91c1c',alpha=.4)
    axes[2].set_xlabel('Minutes relative to emitted false alert; no external intervention' if kind=='false_alert' else 'Minutes relative to external intervention (paired null: reference time only)');fig.suptitle(f'{kind}: family {r["seed"]}, {r["scenario"]}, {team}; red = emitted alerts');save(fig,f'{kind}-timeseries.png')
# Raw spatial strip from the complete evidence source, showing coordinates as observed.
e=examples['success'];pack=e['pack'];ident=MatchIdentity(match_id=e['match_id']);frames={f.frame_id:f for f in load_frames(DATA/'inference'/f'{ident.match_id}.tracking.jsonl.gz',ident)}
fig,axes=plt.subplots(1,4,figsize=(15,4))
for ax,frame_id in zip(axes,pack['representative_frames']):
    f=frames[frame_id];ax.set(xlim=(0,105),ylim=(0,68),aspect='equal',title=f'{f.time_seconds/60:.1f} min, {frame_id}');ax.axvline(52.5,color='#aaa',lw=1);ax.add_patch(plt.Rectangle((0,0),105,68,fill=False,color='#777'))
    for team,color in [('NORTH','#007f5f'),('SOUTH','#d97706')]:
        ps=[p for p in f.players if p.team_id==team];ax.scatter([p.x for p in ps],[p.y for p in ps],color=color,s=23,label=team)
    ax.scatter(f.ball.x,f.ball.y,color='black',s=35,marker='x');ax.set_xlabel('Observed pitch x (m)');ax.set_ylabel('y (m)')
axes[0].legend(loc='lower left',fontsize=8);fig.suptitle('Raw representative geometry: two reference and two recent frames; no hidden intent/target');save(fig,'spatial-evidence-strip.png')
# Support and timing strata, not new independent experiments.
v=json.loads((ART/'verification-detail.json').read_text())['support'];fig,axes=plt.subplots(1,2,figsize=(11,4))
for ax,key,values in [(axes[0],'onset',[3300,3600,3900,4200]),(axes[1],'team',['NORTH','SOUTH'])]:
    eligible=[r for r in v if r['scenario'] in PRIMARY and r['scenario']!='null'];rates=[sum(r['hit600'] for r in eligible if r[key]==value)/sum(r[key]==value for r in eligible) for value in values];ax.bar([str(x/60) if key=='onset' else x for x in values],rates,color='#1585b5');ax.set_ylim(0,1);ax.set_title(f'Descriptive recall by {key}');ax.set_ylabel('Objective A recall')
save(fig,'robustness-strata.png')
print('Saved',len(list(FIG.glob('*.png'))),'figures')
