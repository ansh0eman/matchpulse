"""Optional private stdio MCP process. No HTTP listener or model-supplied paths."""
def main():
    import argparse
    from pathlib import Path
    from mcp.server import MCPServer
    from .cli import load_source
    from .tools import EvidenceTools
    p=argparse.ArgumentParser();p.add_argument('--events',type=Path,required=True)
    p.add_argument('--tracking',type=Path);p.add_argument('--positional-config',type=Path)
    p.add_argument('--as-of',type=float,required=True);a=p.parse_args()
    result=load_source(a.events,a.tracking,a.positional_config)
    tools=EvidenceTools(result,result['index'].match_id,a.as_of,max_calls=64)
    server=MCPServer('MatchPulse read-only scoped evidence')
    for function in tools.sdk_functions():server.tool()(function)
    server.run(transport='stdio')
if __name__=='__main__':main()
