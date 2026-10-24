export type Team = "NORTH" | "SOUTH";
export type Audience = "fan" | "analyst";
export interface Scenario {
  id: string;
  title: string;
  subtitle: string;
  match_id: string;
  tracking: boolean;
  start: number;
}
export interface Player {
  id: string;
  team_id: Team;
  goalkeeper: boolean;
  x: number;
  y: number;
}
export interface Frame {
  frame_id: string;
  time_seconds: number;
  period: number;
  players: Player[];
  ball: { x: number; y: number; owner_id: string | null };
}
export interface Observation {
  source_id: string;
  time_seconds: number;
  period: number;
  action: string;
  team: Team | null;
  player: string | null;
  ball_position_m: { x: number; y: number };
  score: { home: number; away: number };
  possession_id: string;
}
export interface Story {
  /** Engine editorial ordering; never probability or confidence. */
  priority: number;
  narration_status: string;
  overlay_status: string;
  id: string;
  type: string;
  team: Team | null;
  source_seconds: number;
  available_seconds: number;
  presented_seconds: number;
  origin: string;
  claim_ids: string[];
  narration: {
    headline: string;
    sentences: { text: string; claim_ids: string[] }[];
    limitations: string[];
  };
  overlay: {
    references: { match_id: string; category: string; source_id: string }[];
    coordinates: [string, number, number][];
    metrics: { claim_id: string; name: string; value: number; unit: string }[];
  };
}
export interface View {
  preferences: {
    audience: Audience;
    favorite_team: Team | null;
    language: "en";
  };
  scenario: string;
  match_id: string;
  clock: number;
  duration: number;
  period: number;
  score: { home: number; away: number };
  frame: Frame | null;
  frame_age: number | null;
  tracking_available: boolean;
  timeline: Story[];
  recent_events: Observation[];
  diagnostics: {
    detected_at_seconds: number;
    reasons: string[];
    recent_age_seconds: number;
    recent_span_seconds: number;
  }[];
  source_hashes: {
    events: string;
    tracking: string | null;
    config: string | null;
  };
  recap: { id: string; time: number; text: string }[];
  provenance: string;
}
export interface PlaybackSegment {
  schema_version: 1;
  mode: "prefetched_causal_replay";
  start: number;
  end: number;
  base: View;
  events: (Observation & { sequence: number })[];
  frames: (Frame & { sequence: number })[];
  diagnostics: View["diagnostics"];
  publication_rule: string;
}
export interface Sample {
  frame_id: string;
  time: number;
  side: string;
  context: number[];
  line3_m: number;
  players: { id: string; x: number; y: number; attack_x: number }[];
}
export interface Proof {
  verified: boolean;
  match_id: string;
  claim_id: string;
  type: string;
  team: Team | null;
  as_of_seconds: number;
  calculation: {
    method: string;
    unit: string;
    window: number[];
    boundary: string;
    formula: string;
    value: unknown;
    before_m?: number;
    after_m?: number;
    change_m?: number;
    support?: { reference_frames: number; recent_frames: number };
    before?: { home: number; away: number };
    after?: { home: number; away: number };
    recomputed_shots?: number;
    elapsed_seconds?: number;
    regain_x_m?: number;
    latest_observation?: number;
    age?: number;
  };
  observations: Observation[];
  frames: Frame[];
  samples: Sample[];
  contexts: {
    context: number[];
    weight: number;
    before_m: number;
    after_m: number;
    reference_count: number;
    recent_count: number;
  }[];
  limitations: string[];
  source_hashes: { events: string; tracking: string | null };
  verification: string;
}
export interface Activity {
  mode: string;
  date: string;
  deployment: string;
  proof: {
    authenticated_call_succeeded: boolean;
    structured_validation: boolean;
    latency_seconds: number;
    usage: { input_token_count: number; output_token_count: number };
  };
  gates: string[];
  tests_passed: number;
  full_broadcast_capture: boolean;
  limitations: string;
  roles: { role: string; status: string }[];
  tools: string[];
  proof_sha256: string;
}
export interface Answer {
  status: string;
  explanation: string;
  limitations?: string[];
}
export interface Capture {
  label: string;
  origin: string;
  match_id: string;
  source_seconds: number;
  narration_status: string;
  overlay_status: string;
  events: {
    role: string;
    event: string;
    reason: string | null;
    elapsed_ms: number;
    usage_input: number | null;
    usage_output: number | null;
  }[];
  tools: { tool: string; as_of_seconds: number; status: string }[];
  source_sha256: string;
}
export interface Activity {
  capture: Capture;
  recovery_capture?: Capture;
  capture_summary?: {
    elapsed_seconds: number;
    agent_request_attempts: number;
    model_http_requests: number | null;
    counter_status: string;
    reported_tokens: { input: number; output: number };
  } | null;
}
