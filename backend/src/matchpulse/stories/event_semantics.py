"""Conservative linkage rules grounded in the pinned simulator."""
from ..schemas import CanonicalEvent, Score

GAINS = frozenset(('tackle','interception','recovery'))
BOUNDARIES = frozenset(('match_start','kickoff','half_time','full_time'))
RESTARTS = BOUNDARIES | frozenset(('corner','goal_kick','free_kick','throw_in','penalty','foul','offside'))

def goal_context(before: Score, after: Score, team: str) -> str:
    own0,opp0 = (before.home,before.away) if team=='NORTH' else (before.away,before.home)
    own1,opp1 = (after.home,after.away) if team=='NORTH' else (after.away,after.home)
    if (own1,opp1)!=(own0+1,opp0):
        raise ValueError('Goal must increase only the attributed team score by one')
    if own0+opp0==0:return 'opening_goal'
    if own1==opp1:return 'equalizer'
    if own0==opp0:return 'go_ahead'
    return 'extends_lead' if own1>opp1 else 'reduces_deficit'

def high_transition(previous: CanonicalEvent | None, current: CanonicalEvent) -> bool:
    return bool(previous and current.type in GAINS and current.team_id and
        previous.possession_team_id and previous.possession_team_id!=current.team_id and
        current.possession_team_id==current.team_id and previous.possession_id!=current.possession_id and
        previous.period==current.period and previous.type in ('pass','receive','dribble','tackle','interception','recovery') and previous.team_id==previous.possession_team_id and
        0<=current.time_seconds-previous.time_seconds<=15 and current.attacking_position_m and
        70<=current.attacking_position_m.x<=105)

def linked_shot(shot: CanonicalEvent | None, outcome: CanonicalEvent) -> bool:
    if not shot or shot.period!=outcome.period or not 0<=outcome.time_seconds-shot.time_seconds<=15:
        return False
    shooter=outcome.secondary_player_id if outcome.type in ('save','blocked_shot') else outcome.player_id
    team_ok=outcome.team_id!=shot.team_id if outcome.type in ('save','blocked_shot') else outcome.team_id==shot.team_id
    return bool(shot.player_id and shooter==shot.player_id and team_ok)
