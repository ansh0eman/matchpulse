import { z } from 'zod';
export const eventTypes = ['match_start','kickoff','half_time','full_time','offside','throw_in','corner','goal_kick','free_kick','penalty','dribble','challenge','yellow_card','red_card','injury','substitution','advantage','aerial_duel','blocked_shot','goalkeeper_claim','goalkeeper_punch','pass','receive','second_ball','interception','tackle','shot','save','miss','foul','goal','recovery'] as const;
const point = z.object({ x: z.number().finite(), y: z.number().finite() }).strict();
export const eventSchema = z.object({
  schema_version: z.literal(1), id: z.string().min(1), sequence: z.number().int().nonnegative(),
  time_seconds: z.number().finite().nonnegative(), period: z.union([z.literal(1), z.literal(2)]),
  team_id: z.enum(['NORTH','SOUTH']).nullable(), player_id: z.string().nullable(),
  secondary_player_id: z.string().nullable(), type: z.enum(eventTypes),
  position_m: point, attacking_position_m: point.nullable(), outcome: z.string().nullable(),
  possession_id: z.string(), possession_team_id: z.enum(['NORTH','SOUTH']).nullable(),
  score: z.object({ home: z.number().int().nonnegative(), away: z.number().int().nonnegative() }).strict(),
  evidence: z.object({ source_index: z.number().int().nonnegative(), field_zones: z.array(z.string()),
    attack_pattern: z.string(), chance_quality: z.number().finite().nullable(),
    possession_final_third_entries: z.number().int().nonnegative() }).strict(),
}).strict();
// Interface inherits the runtime-validated shape rather than duplicating its fields.
type ValidatedEvent = z.infer<typeof eventSchema>;
export interface CanonicalEvent extends ValidatedEvent {}
