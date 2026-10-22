"""PR reliability review: real CLI parity, evidence checks and complete test suites.

Uses only the two documented local feeds. No holdout scoring or tuning occurs.
"""
from __future__ import annotations
import datetime,gzip,hashlib,json,math,subprocess,sys,time
from collections import defaultdict
from pathlib import Path
from statistics import mean
from common import ROOT,ART,DATA,dump
from matchpulse.schemas import MatchIdentity
from matchpulse.ingestion import load_match
from matchpulse.tracking.ingestion import load_frames
from matchpulse.tracking.evidence import PositionalEvidencePack,verify_geometry,verify_events
from matchpulse.tracking.presentation import VerifiedLineClaim,PresentationPolicy,review_episode

BASE='759aa226b508df2a69bbe7c5522b3743d812bd4c'
NODE='/Users/ansh0eman/.nvm/versions/node/v24.19.0/bin/node'
OUT=ROOT/'backend/output/step25/pr1-review'
OUT.mkdir(parents=True,exist_ok=True)
REPORT=ROOT/'research/step25/presentation-review-results.json'


def sha(data):return hashlib.sha256(data).hexdigest()


def independent_line(claim,pack,frames):
    """Separate coordinate arithmetic for the only metric allowed in a claim."""
    by_id={f.frame_id:f for f in frames};group={}
    for side,ids in pack.tracking_references.items():
        group[side]=defaultdict(list)
        for frame_id in ids:
            f=by_id[frame_id]
            own=[p for p in f.players if p.team_id==claim.team_id and not p.goalkeeper]
            opposite=[p for p in f.players if p.team_id!=claim.team_id and not p.goalkeeper]
            owner=next(p for p in f.players if p.id==f.ball.owner_id)
            forward=(claim.team_id=='NORTH')==(f.period==1)
            xs=sorted(p.x if forward else 105-p.x for p in own)
            carrier_x=owner.x if (owner.team_id=='NORTH')==(f.period==1) else 105-owner.x
            diff=(f.score.home-f.score.away)*(1 if claim.team_id=='NORTH' else -1)
            context=(int(carrier_x>=35),int(diff>0)-int(diff<0),len(own),len(opposite))
            group[side][context].append(sum(xs[:3])/3)
    total=sum(map(len,group['recent'].values()))
    before=sum(len(group['recent'][k])*mean(group['reference'][k]) for k in group['recent'])/total
    after=sum(len(group['recent'][k])*mean(group['recent'][k]) for k in group['recent'])/total
    assert math.isclose(claim.before_m,before,abs_tol=1e-9)
    assert math.isclose(claim.after_m,after,abs_tol=1e-9)
    assert math.isclose(claim.change_m,after-before,abs_tol=1e-9)


def main():
    commands=[]
    def run(name,args,cwd=ROOT):
        start=time.perf_counter()
        with (OUT/f'{name}.log').open('w') as log:
            result=subprocess.run(args,cwd=cwd,stdout=log,stderr=subprocess.STDOUT)
        commands.append({'name':name,'argv':list(map(str,args)),'cwd':str(cwd),
                         'exit_code':result.returncode,'seconds':time.perf_counter()-start})
        assert result.returncode==0,f'{name} failed: inspect {OUT/name}.log'
        print(name,'exit',result.returncode,flush=True)
    run('pytest',[sys.executable,'-m','pytest','backend/tests','-q'])
    run('typescript-tests',[NODE,'--import','tsx','--test',*[str(p.relative_to(ROOT/'poc')) for p in sorted((ROOT/'poc/tests').glob('*.test.ts'))]],ROOT/'poc')
    run('typecheck',[NODE,'node_modules/typescript/bin/tsc','--noEmit'],ROOT/'poc')
    frozen=json.loads((ART/'frozen.json').read_text());wrapper='backend/src/matchpulse/tracking/cli.py'
    assert sha((ART/'frozen.json').read_bytes())==(ART/'frozen.sha256').read_text().strip()
    checked=[]
    for name,digest in frozen['source_hashes'].items():
        if name==wrapper:continue
        assert sha((ROOT/name).read_bytes())==digest,name
        checked.append(name)
    assert json.loads((ART/'selected.json').read_text())==frozen['selected']
    assert frozen['selected']['line_threshold_m']==7
    base_cli=subprocess.check_output(['git','show',f'{BASE}:{wrapper}'],cwd=ROOT)
    assert sha(base_cli)==frozen['source_hashes'][wrapper]
    legacy=OUT/'frozen_cli.py';legacy.write_bytes(base_cli)
    # Execute the exact old CLI source with its package context. The inference
    # modules it imports are individually checked against the original freeze.
    bootstrap="import sys; p=sys.argv.pop(1); sys.argv[0]=p; exec(compile(open(p).read(),p,'exec'), {'__name__':'__main__','__package__':'matchpulse.tracking','__file__':p})"
    cases=[]
    for name,ident in [('success','f2a3e267-d3e5-4c90-ae07-b5a39607ab2d'),('stale','31c70a92-4ce1-4ec2-a570-e8112bfcc5fc')]:
        tracking=DATA/'inference'/f'{ident}.tracking.jsonl.gz';canonical=DATA/'inference'/f'{ident}.jsonl'
        example_name='success' if name=='success' else 'false_alert'
        original=json.loads((ART/'examples.json').read_text())[example_name]
        with gzip.open(tracking,'rb') as source:
            assert sha(source.read())==original['full_observable_tracking_sha256']
        assert sha(canonical.read_bytes())==original['events_sha256']
        output=OUT/f'{name}.json';old_output=OUT/f'{name}-frozen.json'
        shared=[str(tracking),'--events',str(canonical),'--config',str(ART/'selected.json'),'--debug']
        run(f'cli-{name}',[sys.executable,'-m','matchpulse.tracking.cli',*shared,'--output',str(output)])
        run(f'frozen-cli-{name}',[sys.executable,'-c',bootstrap,str(legacy),*shared,'--output',str(old_output)])
        assert output.read_bytes()==old_output.read_bytes(),'research alert export changed'
        assert output.with_suffix('.facts.json').read_bytes()==old_output.with_suffix('.facts.json').read_bytes(),'research fact export changed'
        packs=[PositionalEvidencePack.model_validate(p) for p in json.loads(output.read_text())]
        fixture='success' if name=='success' else 'false_alert'
        assert len(packs)==1
        assert packs[0].model_dump()==json.loads((ROOT/f'research/step25/fixtures/{fixture}-evidence.json').read_text())
        frames=list(load_frames(tracking,MatchIdentity(match_id=ident)))
        events=list(load_match(canonical,MatchIdentity(match_id=ident)))
        expected=[review_episode(p,frames,events) for p in packs]
        decisions=json.loads(output.with_suffix('.presentation.json').read_text())
        assert decisions==[d.model_dump() for d in expected]
        claims=[VerifiedLineClaim.model_validate(c) for c in json.loads(output.with_suffix('.broadcast.json').read_text())]
        assert [c.model_dump() for c in claims]==[d.claim.model_dump() for d in expected if d.claim]
        for claim in claims:
            pack=next(p for p in packs if p.detection_id==claim.detection_id)
            assert verify_geometry(pack,frames) and verify_events(pack,events)
            independent_line(claim,pack,frames)
            assert claim.reference_window==pack.reference_window and claim.recent_window==pack.recent_window
            assert claim.reference_frames==pack.support['reference_frames']>=12
            assert claim.recent_frames==pack.support['recent_frames']>=6
            assert claim.as_of_seconds==pack.detected_at_seconds
            assert claim.as_of_seconds-claim.latest_observation_seconds<=PresentationPolicy().max_recent_age_seconds
            assert 'coach' not in claim.statement.lower() and 'pressing' not in claim.statement.lower()
        assert len(claims)==(1 if name=='success' else 0)
        if name=='stale':
            assert decisions[0]['recent_age_seconds']==132
            assert decisions[0]['recent_span_seconds']==13
            assert 'stale_recent_evidence' in decisions[0]['reasons']
            assert 'insufficient_recent_time_coverage' in decisions[0]['reasons']
        cases.append({'case':name,'match_id':ident,'research_alerts':len(packs),'broadcast_claims':len(claims),
                      'research_export_byte_equal_to_frozen_cli':True,'research_facts_byte_equal_to_frozen_cli':True,
                      'decisions':decisions,'independent_line_arithmetic_passed':bool(claims)})
    preserved=subprocess.check_output(['git','diff','--name-only',BASE,'--','research/step25/artifacts','research/step2-artifacts','backend/config'],cwd=ROOT,text=True).splitlines()
    assert not preserved,preserved
    prefixes={}
    for name in ['success','false_alert']:
        path=ROOT/f'research/step25/fixtures/{name}-event-prefix.jsonl.gz'
        with gzip.open(path,'rb') as source:raw=source.read()
        prefixes[str(path.relative_to(ROOT))]={'uncompressed_sha256':sha(raw),'events':len(raw.splitlines())}
    reviewed_sources={name:sha((ROOT/name).read_bytes()) for name in [
        wrapper,'backend/src/matchpulse/tracking/presentation.py',
        'backend/tests/step25/test_presentation.py','backend/tests/step25/test_presentation_cli.py',
        'backend/scripts/step25/review_presentation.py']}
    report={'source_sha256':reviewed_sources,'new_canonical_prefixes':prefixes,'reviewed_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),
            'pr':1,'branch':'feat/presentation-quality-gate','frozen_base_commit':BASE,
            'frozen_sha256':sha((ART/'frozen.json').read_bytes()),'unchanged_frozen_inputs':checked,
            'historical_evaluation_artifacts_unchanged':True,'commands':commands,'cases':cases,
            'scope':'Reliability checks on documented fixtures only; no accuracy retuning, rescoring, or new calibration.'}
    dump(REPORT,report)
    print('Full review passed:',REPORT,flush=True)

if __name__=='__main__':main()
