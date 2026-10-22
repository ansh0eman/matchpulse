"""Causal fixed slots; no retroactive replacement with future knowledge."""
from .schemas import TimelineItem
PRIORITY={'goal_context':100,'player_dismissal':95,'match_boundary':90,'turnover_to_shot':80,
          'observed_line_height_change':70,'shot_outcome':60,'recent_attacking_activity':50,'high_turnover':40,'observed_shot':30}
class StoryScheduler:
    def __init__(self):self.incidents=set();self.seen=set();self.last={};self.next_slot=0.;self.timeline=[];self.suppressed=[]
    def submit(self,insight):
        key=(insight.type,insight.team_id);reason=None
        incident=None
        if insight.type in ('observed_shot','turnover_to_shot'):incident=insight.evidence[-1].source_id
        elif insight.type=='shot_outcome':incident=insight.evidence[0].source_id
        if insight.insight_id in self.seen:reason='duplicate'
        elif incident and incident in self.incidents:reason='incident_already_narrated'
        elif insight.type in ('recent_attacking_activity','high_turnover') and insight.as_of_seconds-self.last.get(key,-1e9)<120:reason='editorial_cooldown'
        if reason:
            self.suppressed.append({'insight_id':insight.insight_id,'reason':reason});return
        self.seen.add(insight.insight_id);self.last[key]=insight.as_of_seconds
        # Immediate major events bypass pending routine slots; timeline sorted by presentation clock.
        shown=insight.as_of_seconds if insight.priority>=90 else max(insight.as_of_seconds,self.next_slot)
        if shown-insight.as_of_seconds>15:
            self.suppressed.append({'insight_id':insight.insight_id,'reason':'editorial_delay_limit'});return
        if incident:self.incidents.add(incident)
        self.next_slot=max(self.next_slot,shown+4)
        visual=('scoreline' if insight.type in ('goal_context','match_boundary') else 'tracking_comparison' if
                insight.type=='observed_line_height_change' else 'window_comparison' if insight.type=='recent_attacking_activity' else 'event_location')
        self.timeline.append(TimelineItem(insight=insight,presented_at_seconds=shown,visualization=visual))
