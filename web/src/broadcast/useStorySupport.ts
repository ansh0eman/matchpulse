import { useEffect, useRef, useState } from "react";
import type { Audience, Proof, Scenario, Story, Team } from "../contracts";
import { get } from "../api";

export type SupportState = { status: "idle" | "loading" | "ready" | "error"; proof: Proof | null; retry: () => void };
type BaseState = Pick<SupportState, "status" | "proof">;
const idle: BaseState = { status: "idle", proof: null };

/** Fetch one immutable, story-time proof receipt. Replay ticks never enter the key. */
export function useStorySupport(p: {
  scenario?: Scenario;
  matchId?: string;
  story?: Story;
  audience: Audience;
  favorite: Team | "";
  enabled: boolean;
}) {
  const cache = useRef(new Map<string, Proof>());
  const [retry, setRetry] = useState(0);
  const story = p.story;
  const claimId = story?.claim_ids[0];
  const validTarget = p.enabled && !!p.scenario && !!p.matchId && !!story &&
    story.type === "observed_line_height_change" && !!claimId;
  const key = validTarget
    ? [p.scenario!.id, p.matchId, story!.id, claimId, story!.presented_seconds, p.audience, p.favorite].join("|")
    : "";
  const [state, setState] = useState<BaseState>(idle);
  const [stateKey, setStateKey] = useState("");

  useEffect(() => {
    setStateKey(key);
    if (!key || !validTarget || !story || !claimId || !p.scenario || !p.matchId) {
      setState(idle);
      return;
    }
    const saved = cache.current.get(key);
    if (saved) {
      setState({ status: "ready", proof: saved });
      return;
    }
    const controller = new AbortController();
    const expected = {
      match: p.matchId,
      claim: claimId,
      asOf: story.presented_seconds,
      scenario: p.scenario.id,
    };
    const params = new URLSearchParams({
      scenario: expected.scenario,
      clock: String(expected.asOf),
      audience: p.audience,
      claim_id: expected.claim,
    });
    if (p.favorite) params.set("favorite", p.favorite);
    setState({ status: "loading", proof: null });
    get<Proof>(`/api/proof?${params}`, controller.signal)
      .then((proof) => {
        if (controller.signal.aborted) return;
        const support = proof.calculation.support;
        const verified = proof.verified && proof.match_id === expected.match &&
          proof.claim_id === expected.claim && proof.as_of_seconds === expected.asOf &&
          !!support && Number.isInteger(support.reference_frames) && support.reference_frames >= 0 &&
          Number.isInteger(support.recent_frames) && support.recent_frames >= 0;
        if (!verified) throw new Error("The comparison support could not be verified for this moment.");
        cache.current.set(key, proof);
        setState({ status: "ready", proof });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({ status: "error", proof: null });
      });
    return () => controller.abort();
    // Values in the key are the immutable request identity; deliberately omit replay clock/object identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, retry]);

  const visible: BaseState = stateKey === key ? state : key ? { status: "loading", proof: null } : idle;
  return { ...visible, retry: () => setRetry((n) => n + 1) };
}
