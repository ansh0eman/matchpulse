"""Recheck exported facts, words and overlays against immutable workflow inputs."""
from .grounding import validate_envelope
from .policy import default_narration,default_overlay,category
from .narrative_compiler import compile_narration
from .overlay_compiler import compile_overlay
from .schemas import Narration,Sentence

def verify_publication(artifact,state,item,result,tools,mode='adaptive'):
    try:
        e=state.envelope;validate_envelope(e,result)
        if (artifact.match_id!=e.match_id or artifact.insight_id!=e.insight.insight_id or
            artifact.source_seconds!=e.insight.event_time_seconds or artifact.available_seconds!=e.insight.as_of_seconds or
            artifact.presented_seconds!=item.presented_at_seconds or artifact.preferences!=state.preferences or
            artifact.claim_ids!=e.insight.claim_ids or artifact.evidence!=e.insight.evidence or artifact.category!=category(e.insight.type)):
            return False
        if mode=='fallback':
            expected=Narration(headline=e.insight.fallback.headline,sentences=(Sentence(text=e.insight.fallback.explanation,claim_ids=e.insight.claim_ids),),limitations=e.insight.limitations)
        else:
            plan=state.narration_plan if artifact.narration_status=='enriched' else default_narration(e,state.preferences)
            expected=compile_narration(plan,e,tools,state.preferences)
        if artifact.narration!=expected:return False
        if artifact.overlay:
            plan=state.overlay_plan if artifact.overlay_status=='enriched' else default_overlay(e)
            if artifact.overlay!=compile_overlay(plan,e,tools):return False
        elif artifact.overlay_status!='unavailable':return False
        return all(tools.index.verify(tools.claims[cid]) for cid in artifact.claim_ids)
    except (ValueError,KeyError,TypeError,AttributeError):return False
