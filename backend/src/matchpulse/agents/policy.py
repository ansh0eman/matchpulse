"""Version2 audience policy selects from already scheduled stories, never raw alerts."""
from .schemas import DirectorDecision,OverlayPlan,NarrationPlan

def category(kind):
    return {'goal_context':'score_context','observed_shot':'shot_sequence','shot_outcome':'shot_sequence',
        'turnover_to_shot':'regain_sequence','recent_attacking_activity':'attacking_activity',
        'observed_line_height_change':'position_comparison','match_boundary':'match_state',
        'player_dismissal':'match_state'}.get(kind,'observed_event')

def eligible(item,preferences):
    return not (preferences.audience=='fan' and item.insight.type=='high_turnover')

def expensive(insight):
    return insight.type in ('goal_context','turnover_to_shot','recent_attacking_activity','observed_line_height_change','player_dismissal')

def default_director(envelope):
    positional=any(c.type=='observed_line_height_change' for c in envelope.claims)
    event=any(c.type!='observed_line_height_change' for c in envelope.claims)
    roles=tuple(r for r,needed in [('match_analyst',event),('tactical_analyst',positional)] if needed)
    return DirectorDecision(specialists=roles,angle='measurement_first' if positional else 'score_first' if envelope.insight.type=='goal_context' else 'sequence_first',
        challenge=positional or len(envelope.claims)>1 or envelope.insight.priority>=95,max_calls=6)

def default_narration(envelope,preferences,angle='evidence_first'):
    return NarrationPlan(claim_ids=tuple(c.claim_id for c in envelope.claims),angle=angle,
        hook='direct',depth='detailed' if preferences.audience=='analyst' else 'brief',
        qualification='sampled' if envelope.insight.type=='observed_line_height_change' else 'association' if envelope.insight.type=='turnover_to_shot' else 'synthetic')

def default_overlay(envelope):
    family={'goal_context':'scoreline_change','turnover_to_shot':'regain_to_shot','observed_shot':'shot_sequence',
        'shot_outcome':'shot_sequence','recent_attacking_activity':'rolling_activity',
        'observed_line_height_change':'positional_comparison'}.get(envelope.insight.type,'event_location')
    return OverlayPlan(claim_ids=tuple(c.claim_id for c in envelope.claims),family=family,
                       emphasis='measurements' if family=='positional_comparison' else 'sequence' if family in ('shot_sequence','regain_to_shot') else 'incident')
