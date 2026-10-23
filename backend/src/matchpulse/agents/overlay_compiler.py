"""All numbers, coordinates and bounds come from verified source observations."""
from .schemas import VerifiedOverlay,Metric
from .grounding import validate_overlay,claims_for

def compile_overlay(plan,envelope,tools):
    validate_overlay(plan,envelope,tools);claims=claims_for(plan.claim_ids,envelope,tools)
    refs=tuple(dict.fromkeys(r for c in claims for r in c.references));metrics=[];points=[];times=[]
    for r in refs:
        if r.match_id!=envelope.match_id:raise ValueError('Overlay namespace mismatch')
        # Direct authoritative objects are used after the same capability check.
        source=(tools.index.events if r.category=='event' else tools.index.frames)[r.source_id]
        if source.time_seconds>envelope.insight.as_of_seconds:raise ValueError('Future overlay observation')
        times.append(source.time_seconds)
        if r.category=='event':points.append((r.source_id,source.position_m.x,source.position_m.y))
        # Do not invent trajectories; tracking frame refs are resolved by the UI.
    for c in claims:
        def metric(name,value,unit):metrics.append(Metric(claim_id=c.claim_id,name=name,value=float(value),unit=unit))
        if c.type=='goal_context':
            metric('NORTH_before',c.value.before.home,'goals');metric('SOUTH_before',c.value.before.away,'goals')
            metric('NORTH_after',c.value.after.home,'goals');metric('SOUTH_after',c.value.after.away,'goals')
        elif c.type=='observed_line_height_change':
            v=c.value.line;metric('before',v.before_m,'m');metric('after',v.after_m,'m');metric('change',v.change_m,'m')
        elif c.type in ('high_turnover','turnover_to_shot'):
            metric('regain_x',c.value.regain_x_m,'m');metric('elapsed',c.value.elapsed_seconds,'s')
        elif c.type=='recent_attacking_activity':metric('shot_attempts',c.value.shots,'shots')
    if not times:raise ValueError('Overlay has no source observations')
    return VerifiedOverlay(plan=plan,references=refs,replay_window=(min(times),max(times)),metrics=tuple(metrics),coordinates=tuple(points))
