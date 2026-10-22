from matchpulse.evaluation import match_alerts,summarize,cluster_intervals

def test_matching_one_to_one_wrong_team_early_late_and_duplicates():
    alerts=[{'time':t,'team':team} for t,team in [(900,'NORTH'),(1100,'SOUTH'),(1200,'NORTH'),(1250,'NORTH'),(1800,'NORTH')]]
    m=match_alerts(alerts,1000)
    assert m=={'tp':1,'fp':4,'fn':0,'duplicate_alerts':1,'delay_seconds':200}
    assert match_alerts([],1000)['fn']==1
    assert match_alerts(alerts,None)['fp']==5
    assert match_alerts([{'time':1600,'team':'NORTH'}],1000)['tp']==1
    assert match_alerts([{'time':1601,'team':'NORTH'}],1000)['fn']==1

def test_false_positive_rate_and_deterministic_metrics():
    rows=[{'seed':1,'scenario':'null','alert_count':2,'end_time_seconds':5400,**match_alerts([{'time':100,'team':'NORTH'},{'time':200,'team':'SOUTH'}],None)},
        {'seed':1,'scenario':'bundle','alert_count':1,'end_time_seconds':5400,**match_alerts([{'time':1200,'team':'NORTH'}],1000)}]
    stats=summarize(rows)
    assert stats['precision']==1/3 and stats['recall']==1 and stats['false_alerts_per_null_match']==2
    assert stats['false_alerts_per_null_90_minutes']==2
    assert cluster_intervals(rows,10)==cluster_intervals(rows,10)
    assert summarize([])['precision'] is None

def test_partition_protocol_excludes_original_seeds():
    original={11,29,47,83,101,137,173,211,257,307,353,401}
    development={1009+i*7919 for i in range(24)}
    holdout={1009+i*7919 for i in range(24,56)}
    assert not development&holdout and not (development|holdout)&original
    assert len(development|holdout)==56
