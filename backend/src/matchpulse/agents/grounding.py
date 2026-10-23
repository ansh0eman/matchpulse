"""Code, rather than model agreement, authorizes every public decision."""
from .policy import default_director,category,default_overlay

def validate_envelope(envelope,result):
    original=next((i for i in result['insights'] if i.insight_id==envelope.insight.insight_id),None)
    if original!=envelope.insight or envelope.match_id!=result['index'].match_id:raise ValueError('Untrusted insight')
    by_id={c.claim_id:c for c in result['claims']}
    if tuple(c.claim_id for c in envelope.claims)!=envelope.insight.claim_ids:raise ValueError('Envelope claims mismatch')
    for c in envelope.claims:
        if c!=by_id.get(c.claim_id) or c.as_of_seconds>envelope.insight.as_of_seconds or not result['index'].verify(c):raise ValueError('Unverified envelope claim')

def claims_for(ids,envelope,tools):
    if not ids or len(set(ids))!=len(ids):raise ValueError('Empty or duplicate claim selection')
    selected=[]
    for cid in ids:
        if cid not in {c.claim_id for c in envelope.claims}:raise ValueError('Claim outside approved incident')
        c=tools.claims[cid]
        if c.match_id!=envelope.match_id or c.as_of_seconds>envelope.insight.as_of_seconds or not tools.index.verify(c):raise ValueError('Invalid selected claim')
        selected.append(c)
    return selected

def validate_director(value,envelope):
    expected=default_director(envelope)
    if len(set(value.specialists))!=len(value.specialists) or set(value.specialists)!=set(expected.specialists):raise ValueError('Unsupported specialist route')
    if expected.challenge and not value.challenge:raise ValueError('Required challenge cannot be disabled')
    needed=1+len(value.specialists)+int(value.challenge)+2
    if value.max_calls<needed:raise ValueError('Insufficient route budget')
    if value.angle=='measurement_first' and 'tactical_analyst' not in value.specialists:raise ValueError('Unjustified measurement angle')
    return value

def validate_analysis(value,envelope,tools,role):
    claims=claims_for(value.claim_ids,envelope,tools)
    if value.category!=category(envelope.insight.type):raise ValueError('Unsupported interpretation category')
    if role=='tactical_analyst' and any(c.type!='observed_line_height_change' for c in claims):raise ValueError('Tactical input requires approved position')
    if role=='match_analyst' and any(c.type=='observed_line_height_change' for c in claims):raise ValueError('Event analyst cannot supply positional inference')
    permitted={r for c in claims for r in c.references}
    if any(r not in permitted for r in value.requested_evidence):raise ValueError('Evidence reference mismatch')
    if 'synthetic' not in value.limitation_codes:raise ValueError('Missing synthetic qualifier')
    return value

def validate_challenge(value,envelope,tools):
    if value.affected_claim_ids:claims_for(value.affected_claim_ids,envelope,tools)
    if value.disposition=='accept' and value.objections:raise ValueError('Inconsistent challenge')
    return value

def validate_narration(value,envelope,tools,preferences):
    claims_for(value.claim_ids,envelope,tools)
    if set(value.claim_ids)!=set(envelope.insight.claim_ids):raise ValueError('Narration dropped primary fact')
    if preferences.audience=='analyst' and value.depth!='detailed':raise ValueError('Analyst requires measurement detail')
    if preferences.audience=='fan' and value.depth!='brief':raise ValueError('Fan requires brief wording')
    expected='sampled' if envelope.insight.type=='observed_line_height_change' else 'association' if envelope.insight.type=='turnover_to_shot' else 'synthetic'
    if value.qualification!=expected:raise ValueError('Required qualifier mismatch')
    if value.angle=='measurement_first' and envelope.insight.type!='observed_line_height_change':raise ValueError('Unsupported numeric angle')
    return value

def validate_overlay(value,envelope,tools):
    claims_for(value.claim_ids,envelope,tools)
    if set(value.claim_ids)!=set(envelope.insight.claim_ids):raise ValueError('Overlay dropped primary fact')
    if value.family!=default_overlay(envelope).family:raise ValueError('Overlay incompatible with verified incident')
    return value
