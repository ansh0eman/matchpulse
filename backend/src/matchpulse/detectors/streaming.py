"""Pinned River alternatives; scalar drift must also pass spatial evidence guards."""
from river import drift
from .rolling import RollingDetector, DetectorConfig
from ..signals import Observation

class StreamingDetector(RollingDetector):
    def __init__(self, config: DetectorConfig):
        super().__init__(config)
        self._new_stream()

    def _new_stream(self):
        c=self.config
        self.stream=(drift.PageHinkley(min_instances=8,delta=.005,threshold=c.stream_threshold,alpha=.99,mode='up')
            if c.method=='page_hinkley' else drift.ADWIN(delta=c.adwin_delta,clock=1,min_window_length=5,grace_period=10))
        self.active_until=float('-inf')

    def reset_period(self, period: int) -> None:
        super().reset_period(period)
        self._new_stream()

    def stream_gate(self, observation: Observation) -> bool:
        sample=observation.minute
        if sample.recovery_count and sample.mean_recovery_x_m is not None and sample.high_recovery_share is not None:
            value=.6*min(1,max(0,sample.mean_recovery_x_m/105))+.4*sample.high_recovery_share
            self.stream.update(value)
            if self.stream.drift_detected:
                self.active_until=observation.time+180
        return observation.time<=self.active_until

def make_detector(config: DetectorConfig) -> RollingDetector:
    return RollingDetector(config) if config.method=='rolling' else StreamingDetector(config)
