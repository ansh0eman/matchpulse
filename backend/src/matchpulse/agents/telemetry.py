"""Safe local trace records; optional OpenTelemetry spans contain no prompt contents."""
import time
from uuid import uuid4
from contextlib import nullcontext
from .schemas import TraceEvent
class Trace:
    def __init__(self,trace_id=None):self.trace_id=trace_id or uuid4().hex;self.start=time.perf_counter();self.unix_start=time.time_ns();self.events=[];self.match_id=None;self.insight_id=None
    def record(self,role,event,reason=None,usage=None):
        item=TraceEvent(trace_id=self.trace_id,span_id=uuid4().hex[:16],role=role,event=event,
            elapsed_ms=(time.perf_counter()-self.start)*1000,reason=reason,
            usage_input=(usage or {}).get('input_token_count'),usage_output=(usage or {}).get('output_token_count'))
        self.events.append(item)
    def span(self,name):
        try:
            from opentelemetry import trace
            return trace.get_tracer('matchpulse.studio','2').start_as_current_span(name,attributes={'matchpulse.workflow_id':self.trace_id})
        except ImportError:return nullcontext()
    def export(self):
        # OTLP-style resource/scope envelope is local diagnostics, not an assertion of collector delivery.
        return {'schema_version':1,'trace_id':self.trace_id,'match_id':self.match_id,'insight_id':self.insight_id,'cloud_delivery':False,
                'events':[e.model_dump(mode='json') for e in self.events]}

    def otlp(self):
        spans=[]
        for event in self.events:
            stamp=str(self.unix_start+int(event.elapsed_ms*1000000))
            attrs={'agent.role':event.role,'matchpulse.event':event.event}
            if event.reason:attrs['matchpulse.reason']=event.reason
            if self.match_id:attrs['matchpulse.match_id']=self.match_id
            if self.insight_id:attrs['matchpulse.insight_id']=self.insight_id
            spans.append({'traceId':self.trace_id,'spanId':event.span_id,'name':event.role+'.'+event.event,
                'kind':1,'startTimeUnixNano':stamp,'endTimeUnixNano':stamp,
                'attributes':[{'key':k,'value':{'stringValue':v}} for k,v in attrs.items()]})
        return {'resourceSpans':[{'resource':{'attributes':[{'key':'service.name','value':{'stringValue':'matchpulse-studio'}}]},
            'scopeSpans':[{'scope':{'name':'matchpulse.studio','version':'2'},'spans':spans}]}]}
