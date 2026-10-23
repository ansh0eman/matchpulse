"""Read-only in-process capability scope; never accepts file paths or URLs."""
import json
from typing import Literal
from pydantic import Field
from ..schemas import StrictModel,MatchId,Nonnegative
from ..stories.schemas import Kind,Reference

class ClaimRequest(StrictModel):
    match_id: MatchId
    claim_id: str
    as_of_seconds: Nonnegative
class EvidenceRequest(StrictModel):
    match_id: MatchId
    category: Literal['event','tracking']
    source_id: str
    as_of_seconds: Nonnegative
class ContextRequest(StrictModel):
    match_id: MatchId
    as_of_seconds: Nonnegative
    requested_kinds: tuple[Kind,...]=Field(min_length=1,max_length=9)
    limit: int=Field(ge=1,le=8)
class ToolResult(StrictModel):
    schema_version: Literal[1]=1
    match_id: MatchId
    as_of_seconds: Nonnegative
    data_json: str

class EvidenceTools:
    def __init__(self,result,match_id,as_of,max_calls=8,max_bytes=32768):
        self.index=result['index'];self.claims={c.claim_id:c for c in result['claims']}
        scope=ClaimRequest(match_id=match_id,claim_id='scope',as_of_seconds=as_of)
        self.match_id=scope.match_id;self.as_of=scope.as_of_seconds;self.calls=[];self.max_calls=max_calls;self.max_bytes=max_bytes
        if self.index.match_id!=match_id:raise ValueError('Tool index namespace mismatch')
    def _check(self,request,name):
        if request.match_id!=self.match_id or not 0<=request.as_of_seconds<=self.as_of:raise ValueError('Tool scope rejected')
        if len(self.calls)>=self.max_calls:raise ValueError('Tool budget exhausted')
        self.calls.append({'tool':name,'match_scope':'active','as_of_seconds':request.as_of_seconds,'status':'rejected'})
    def _result(self,r,data):
        raw=json.dumps(data,sort_keys=True,allow_nan=False)
        if len(raw.encode())>self.max_bytes:raise ValueError('Tool result too large')
        self.calls[-1]['status']='success'
        return ToolResult(match_id=self.match_id,as_of_seconds=r.as_of_seconds,data_json=raw)
    def resolve_claim(self,**args):
        r=ClaimRequest.model_validate(args);self._check(r,'resolve_claim')
        c=self.claims[r.claim_id]
        if c.match_id!=r.match_id or c.as_of_seconds>r.as_of_seconds or not self.index.verify(c):raise ValueError('Claim unavailable')
        return self._result(r,c.model_dump(mode='json'))
    def resolve_evidence(self,**args):
        r=EvidenceRequest.model_validate(args);self._check(r,'resolve_evidence')
        if r.category not in ('event','tracking'):raise ValueError('Unsupported evidence category')
        source=(self.index.events if r.category=='event' else self.index.frames)[r.source_id]
        if source.time_seconds>r.as_of_seconds:raise ValueError('Future evidence rejected')
        return self._result(r,source.model_dump(mode='json'))
    def get_match_context(self,**args):
        # JSON clients encode tuples as arrays: validate through JSON boundary.
        r=ContextRequest.model_validate_json(json.dumps(args));self._check(r,'get_match_context')
        claims=[c for c in self.claims.values() if c.type in r.requested_kinds and c.as_of_seconds<=r.as_of_seconds and self.index.verify(c)]
        return self._result(r,[c.model_dump(mode='json') for c in sorted(claims,key=lambda c:(c.as_of_seconds,c.claim_id),reverse=True)[:r.limit]])
    def invoke(self,name,args):
        if name not in ('resolve_claim','resolve_evidence','get_match_context'):raise ValueError('Unsupported tool')
        return getattr(self,name)(**args)
    def sdk_functions(self):
        def resolve_claim(match_id:str,claim_id:str,as_of_seconds:float)->str:
            """Resolve a verified claim within the active match and clock capability."""
            return self.resolve_claim(match_id=match_id,claim_id=claim_id,as_of_seconds=as_of_seconds).model_dump_json()
        def resolve_evidence(match_id:str,category:str,source_id:str,as_of_seconds:float)->str:
            """Resolve one canonical event or observed tracking frame, never future data."""
            return self.resolve_evidence(match_id=match_id,category=category,source_id=source_id,as_of_seconds=as_of_seconds).model_dump_json()
        def get_match_context(match_id:str,as_of_seconds:float,requested_kinds:list[str],limit:int)->str:
            """Retrieve at most eight verified facts at or before the active clock."""
            return self.get_match_context(match_id=match_id,as_of_seconds=as_of_seconds,requested_kinds=requested_kinds,limit=limit).model_dump_json()
        return [resolve_claim,resolve_evidence,get_match_context]
