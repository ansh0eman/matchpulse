"""Real Microsoft Agent Framework typed graph adapter; optional SDK required.

This module is NOT imported by the offline harness. SDK build/run is a separate
integration test; never substitute a fake SDK or claim the harness executes MAF.
"""
async def run_graph(studio,state,item):
    from typing import Never
    from agent_framework import Executor,WorkflowBuilder,WorkflowContext,handler
    from .schemas import WorkflowState,BroadcastArtifact
    class Stage(Executor):
        def __init__(self,name,operation):super().__init__(id=name);self.operation=operation
        @handler
        async def process(self,message:WorkflowState,ctx:WorkflowContext[WorkflowState]) -> None:
            value=await self.operation(message)
            await ctx.send_message(value)
    class Publisher(Executor):
        def __init__(self):super().__init__(id='verified_publisher');self.final_state=None
        @handler
        async def process(self,message:WorkflowState,ctx:WorkflowContext[Never,BroadcastArtifact]) -> None:
            self.final_state=message
            await ctx.yield_output(studio.publish(message,item))
    director=Stage('director',studio.direct);specialists=Stage('conditional_specialists',studio.specialists)
    challenge=Stage('conditional_challenger',studio.challenge);presentation=Stage('parallel_narration_and_replay',studio.presentation)
    publisher=Publisher()
    if studio.mode=='simple':
        from .policy import default_director
        state=state.model_copy(update={'director':default_director(state.envelope)})
        builder=WorkflowBuilder(start_executor=specialists,output_from=[publisher])
    else:
        builder=WorkflowBuilder(start_executor=director,output_from=[publisher]).add_edge(director,specialists)
    graph=builder.add_edge(specialists,challenge).add_edge(challenge,presentation).add_edge(presentation,publisher).build()
    studio.trace.record('runtime','microsoft_agent_framework')
    events=await graph.run(state)
    outputs=events.get_outputs()
    if len(outputs)!=1 or not isinstance(outputs[0],BroadcastArtifact):raise ValueError('Framework did not yield one typed artifact')
    return outputs[0],publisher.final_state
