"""SDK/MCP/schema integrations are explicit checks, never fake module substitutes."""
import asyncio,json,os
from pathlib import Path
import pytest
ROOT=Path(__file__).resolve().parents[3]

def test_exported_json_schema_meta_validation():
    jsonschema=pytest.importorskip('jsonschema',reason='External schema validator unavailable; dependency download blocked')
    for path in (ROOT/'research/step3b/artifacts').glob('*.schema.json'):
        jsonschema.Draft202012Validator.check_schema(json.loads(path.read_text()))


def test_private_mcp_in_memory():
    pytest.importorskip('mcp',reason='MCP SDK unavailable; direct scoped tools tested separately')
    from mcp import Client
    from mcp.server import MCPServer
    from matchpulse.agents.tools import EvidenceTools
    from matchpulse.agents.cli import load_source
    result=load_source(ROOT/'data/step2/inference/02840f35-cb05-4812-aa9d-1237e4ab1b9d.jsonl')
    claim=next(c for c in result['claims'] if c.type=='goal_context')
    tools=EvidenceTools(result,claim.match_id,claim.as_of_seconds)
    server=MCPServer('test-private-scope')
    for function in tools.sdk_functions():server.tool()(function)
    async def check():
        async with Client(server) as client:
            response=await client.call_tool('resolve_claim',{'match_id':claim.match_id,'claim_id':claim.claim_id,'as_of_seconds':claim.as_of_seconds})
            assert 'schema_version' in str(response)
    asyncio.run(check())

@pytest.mark.skipif(os.getenv('MATCHPULSE_LIVE_TEST')!='1',reason='Live Foundry test requires explicit opt-in, SDK and authenticated project')
def test_real_foundry_minimal_proof():
    from matchpulse.agents.cli import load_source
    from matchpulse.agents.config import ProviderConfig
    from matchpulse.agents.provider import FoundryProvider
    from matchpulse.stories.export import agent_input,grounded_response
    result=load_source(ROOT/'data/step2/inference/02840f35-cb05-4812-aa9d-1237e4ab1b9d.jsonl')
    i=next(i for i in result['insights'] if i.type=='goal_context')
    envelope=agent_input(i,{c.claim_id:c for c in result['claims']})
    provider=FoundryProvider(ProviderConfig.from_environment())
    raw,_=asyncio.run(asyncio.wait_for(provider.proof(envelope),provider.config.timeout_seconds))
    assert grounded_response(raw,envelope)[1]

@pytest.mark.skipif(os.getenv('MATCHPULSE_LIVE_WORKFLOW_TEST')!='1',reason='Full live workflow requires separate explicit opt-in after minimal proof')
def test_real_foundry_framework_and_tool_use():
    from matchpulse.agents.cli import load_source
    from matchpulse.agents.config import ProviderConfig
    from matchpulse.agents.provider import FoundryProvider
    from matchpulse.agents.workflow import Studio
    from matchpulse.agents.schemas import Preferences
    from matchpulse.stories.export import agent_input
    result=load_source(ROOT/'data/step2/inference/02840f35-cb05-4812-aa9d-1237e4ab1b9d.jsonl')
    item=next(t for t in result['timeline'] if t.insight.type=='goal_context')
    envelope=agent_input(item.insight,{c.claim_id:c for c in result['claims']})
    studio=Studio(result,FoundryProvider(ProviderConfig.from_environment()),Preferences())
    artifact,_=asyncio.run(studio.run(envelope,item,runtime='framework'))
    assert artifact.origin=='foundry' and artifact.narration_status=='enriched' and artifact.overlay_status=='enriched'
    assert {'resolve_claim','resolve_evidence'}<={c['tool'] for c in studio.tools.calls if c['status']=='success'}
