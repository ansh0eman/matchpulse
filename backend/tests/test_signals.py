import pytest
from matchpulse.signals import SignalState,window_stats,changes
from conftest import event

def test_high_recoveries_and_direction():
    s=SignalState(60)
    for e in [event(0,1,70),event(1,2,69),event(2,3,80,team='SOUTH')]:s.update(e)
    n=s.observe(60,'NORTH').after;south=s.observe(60,'SOUTH').after
    assert (n.recovery_count,n.high_recovery_count,n.high_recovery_share)==(2,1,.5)
    assert n.mean_recovery_x_m==69.5
    assert south.mean_recovery_x_m==80 and south.high_recovery_count==1

def test_no_duplicate_recovery_or_challenge_tackle_episode():
    s=SignalState(60)
    for e in [event(0,1,80,kind='challenge'),event(1,1,80,kind='tackle'),event(2,1,80),event(3,1.75,80,kind='challenge'),event(4,8,80,kind='challenge')]:s.update(e)
    a=s.observe(60,'NORTH').after
    assert a.recovery_count==1 and a.defensive_episodes==2 and a.advanced_defensive_episodes==2

def test_entries_increments_across_window_and_possession():
    s=SignalState(60)
    for e in [event(0,10,entries=1),event(1,65,entries=1),event(2,70,entries=2),event(3,80,entries=2),event(4,90,entries=1,possession='pos_2')]:s.update(e)
    o=s.observe(120,'NORTH')
    assert o.before.final_third_entries==1
    assert o.after.final_third_entries==2

def test_boundaries_rates_zero_denominators_sparse():
    s=SignalState(60)
    for e in [event(0,0),event(1,60),event(2,120)]:s.update(e)
    o=s.observe(120,'NORTH')
    assert o.before.recovery_count==1 and o.after.recovery_count==1
    assert o.after.recovery_rate_per_minute==1
    empty=s.observe(120,'SOUTH').after
    assert empty.mean_recovery_x_m is None and empty.high_recovery_share is None
    assert changes(empty,o.after)['location_z']==0
    with pytest.raises(ValueError):window_stats([], 'NORTH',0,0)

def test_halftime_reset_and_counter_regression():
    s=SignalState(60);s.update(event(0,30,x=90));s.update(event(1,100,x=20,period=2))
    o=s.observe(120,'NORTH')
    assert o.before.recovery_count==0 and o.after.mean_recovery_x_m==20 and o.period_start==100
    s=SignalState(60);s.update(event(entries=2))
    with pytest.raises(ValueError,match='regressed'):s.update(event(1,10,entries=1))
