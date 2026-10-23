"""Audited English templates; models choose structure, code inserts facts."""
from .schemas import Narration,Sentence
from .grounding import validate_narration,claims_for
from ..stories.claims import wording

def compile_narration(plan,envelope,tools,preferences):
    validate_narration(plan,envelope,tools,preferences)
    claims=claims_for(plan.claim_ids,envelope,tools);sentences=[]
    for c in claims:
        text=wording(c).headline
        if c.type=='goal_context' and plan.angle=='score_first':
            v=c.value
            text=f'{c.team_id}: {v.context.replace("_"," ")}. The observed score is NORTH {v.after.home}, SOUTH {v.after.away}.' if v.context!='score_already_updated' else text
        elif c.type=='turnover_to_shot' and plan.angle=='sequence_first':
            v=c.value;text=f'A shot followed {c.team_id}\'s high regain in the same possession, {v.elapsed_seconds:g} seconds later.'
        elif c.type=='observed_line_height_change' and preferences.audience=='fan':
            v=c.value.line;text=f'During the compared build-up samples, {c.team_id}\'s three deepest outfield players were {abs(v.change_m):.1f}m {"farther from" if v.change_m>=0 else "closer to"} their own goal on average.'
        if plan.hook=='replay':text='Replay the evidence: '+text
        elif plan.hook=='evidence':text='The recorded observations show: '+text
        sentences.append(Sentence(text=text,claim_ids=(c.claim_id,)))
        if preferences.audience=='analyst':
            refs=', '.join(r.source_id for r in c.references[:3]);extra=f'Source window ({c.window[0]:g}, {c.window[1]:g}] seconds; units {c.unit}; evidence {refs}.'
            if c.type=='observed_line_height_change':
                v=c.value.line;extra+=f' Before {v.before_m:.1f}m; after {v.after_m:.1f}m; support {v.reference_frames} reference and {v.recent_frames} recent frames. Latest contributing observation {v.latest_observation_seconds:g}s.'
            sentences.append(Sentence(text=extra,claim_ids=(c.claim_id,)))
    if preferences.favorite_team:
        involved=any(c.team_id==preferences.favorite_team for c in claims)
        # This is a viewer label, not a claim about sentiment, intent or causation.
        prefix=f'{preferences.favorite_team} view — ' if involved else f'Opposition context for {preferences.favorite_team} — '
    else:prefix=''
    limitations=tuple(dict.fromkeys(x for c in claims for x in c.limitations))
    return Narration(headline=prefix+sentences[0].text,sentences=tuple(sentences),limitations=limitations)
