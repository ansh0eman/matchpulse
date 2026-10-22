import {z} from 'zod';
import type {MatchSnapshot} from '../../../upstream/football-simulator/RealTimeEngine';
export const trackingFrameSchema=z.object({
  schema_version:z.literal(1),frame_id:z.string().min(1),sequence:z.number().int().nonnegative(),
  time_seconds:z.number().finite().nonnegative(),period:z.union([z.literal(1),z.literal(2)]),
  phase:z.enum(['kickoff','open_play','throw_in','corner','goal_kick','free_kick','penalty','injury_stoppage','substitution','half_time','full_time']),
  score:z.object({home:z.number().int().nonnegative(),away:z.number().int().nonnegative()}).strict(),
  ball:z.object({x:z.number().finite(),y:z.number().finite(),owner_id:z.string().nullable(),owner_status:z.enum(['active','unowned','inactive_reference'])}).strict(),
  players:z.array(z.object({id:z.string().min(1),team_id:z.enum(['NORTH','SOUTH']),goalkeeper:z.boolean(),x:z.number().finite(),y:z.number().finite()}).strict()).max(22),
}).strict().superRefine((frame,ctx)=>{
  const ids=new Set(frame.players.map(p=>p.id));
  if(ids.size!==frame.players.length)ctx.addIssue({code:'custom',message:'Duplicate player ID'});
  const expected=frame.ball.owner_id===null?'unowned':ids.has(frame.ball.owner_id)?'active':'inactive_reference';
  if(frame.ball.owner_status!==expected)ctx.addIssue({code:'custom',message:'Owner status inconsistent with observed roster'});
});
export type TrackingFrame=z.infer<typeof trackingFrameSchema>;
/** Explicit projection; never spread an upstream snapshot into inference data. */
export function projectSnapshot(snapshot:MatchSnapshot,sequence:number):TrackingFrame {
  return trackingFrameSchema.parse({schema_version:1,frame_id:`frame_${String(sequence).padStart(6,'0')}`,sequence,
    time_seconds:snapshot.time,period:snapshot.period===1?1:2,phase:snapshot.phase,
    score:{home:snapshot.score.home,away:snapshot.score.away},
    ball:{x:snapshot.ball.x,y:snapshot.ball.y,owner_id:snapshot.ball.ownerId,owner_status:snapshot.ball.ownerId===null?'unowned':snapshot.players.some(p=>p.id===snapshot.ball.ownerId)?'active':'inactive_reference'},
    players:snapshot.players.map(p=>({id:p.id,team_id:p.teamSide==='home'?'NORTH':'SOUTH',goalkeeper:p.roleName==='GK',x:p.x,y:p.y}))});
}
