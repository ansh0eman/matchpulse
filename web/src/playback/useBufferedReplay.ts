import { useEffect, useRef, useState } from "react";
import type { PlaybackSegment, View } from "../contracts";
import { get } from "../api";
import { prefixView, replayKey, validateSegment, type ReplayScope } from "./segment";
import { sourceSnapshot, type SourceSnapshot } from "./source";

interface Options extends ReplayScope {
  playing: boolean; clock: number; speed: number; retry: number; seed: View | null;
  onView: (view: View, key: string) => void;
  onSource: (source: SourceSnapshot) => void;
  onStop: () => void; onError: (message: string) => void;
}
const scopeOf = (p: ReplayScope): ReplayScope => ({ scenario: p.scenario, audience: p.audience, favorite: p.favorite });
const sameScope = (packet: PlaybackSegment, scope: ReplayScope) => packet.base.scenario === scope.scenario &&
  packet.base.preferences.audience === scope.audience && (packet.base.preferences.favorite_team ?? "") === scope.favorite;

/** One source clock. Preference projections may replace a packet only after its original validators pass. */
export function useBufferedReplay(options: Options) {
  const latest = useRef(options); latest.current = options;
  const [buffering, setBuffering] = useState(false);
  const context = JSON.stringify([options.scenario, options.retry]);
  useEffect(() => {
    if (!options.playing || !options.seed) { setBuffering(false); return; }
    const seed = options.seed;
    let active = true, frameId = 0, packet: PlaybackSegment | null = null;
    let cursor = options.clock, virtualClock = cursor, lastTick = performance.now();
    let pending: { id: number; key: string; controller: AbortController } | null = null;
    let requestId = 0;
    // Intent can change before the next RAF cancels an old request. Cancellation
    // is cleanup, not the authority to publish data, failures or pending state.
    const owns = (own: NonNullable<typeof pending>) => active && latest.current.playing &&
      context === JSON.stringify([latest.current.scenario, latest.current.retry]) &&
      !own.controller.signal.aborted && pending === own &&
      own.key === replayKey(latest.current, 0);
    setBuffering(true);
    function publish(view: View, scope: ReplayScope) {
      latest.current.onSource(sourceSnapshot(view));
      if (view.preferences.audience === latest.current.audience &&
          (view.preferences.favorite_team ?? "") === latest.current.favorite) {
        latest.current.onView(view, replayKey(scope, view.clock));
      }
    }
    async function fill() {
      if (pending || !active) return;
      const scope = scopeOf(latest.current), anchor = cursor;
      const anchorView = packet ? prefixView(packet, anchor) : seed;
      const own = { id: ++requestId, key: replayKey(scope, 0), controller: new AbortController() };
      pending = own;
      try {
        const next = await get<PlaybackSegment>(`/api/playback?${replayKey(scope, anchor)}&window_seconds=16`, own.controller.signal);
        if (!owns(own)) return;
        // Anchor, prefix/end boundaries, hashes, observations, namespace and audience validation remain authoritative.
        validateSegment(next, scope, anchorView, anchor);
        if (!owns(own) || cursor > next.end) return;
        packet = next;
        publish(prefixView(next, cursor), scope);
        setBuffering(false);
      } catch {
        if (owns(own)) {
          active = false; cancelAnimationFrame(frameId); setBuffering(false);
          latest.current.onError("Playback buffer unavailable or invalid. The replay was paused; retry the source.");
          latest.current.onStop();
        }
      } finally { if (owns(own)) pending = null; }
    }
    function tick(now: number) {
      if (!active || !latest.current.playing) return;
      const elapsed = Math.min(0.25, Math.max(0, (now - lastTick) / 1000)); lastTick = now;
      const wanted = scopeOf(latest.current);
      if (pending && pending.key !== replayKey(wanted, 0)) { pending.controller.abort(); pending = null; }
      if (packet) {
        virtualClock = Math.min(packet.end, virtualClock + elapsed * latest.current.speed);
        const nextClock = virtualClock >= packet.end ? packet.end : Math.max(packet.start, Math.floor((virtualClock + 1e-8) * 4) / 4);
        if (nextClock > cursor) {
          cursor = nextClock;
          publish(prefixView(packet, cursor), { scenario: packet.base.scenario, audience: packet.base.preferences.audience, favorite: packet.base.preferences.favorite_team ?? "" });
        }
        if (cursor >= packet.base.duration) { latest.current.onStop(); return; }
        if (!sameScope(packet, wanted) || (packet.end - cursor <= 8 && packet.end < packet.base.duration)) void fill();
        setBuffering(cursor >= packet.end && !!pending);
      } else void fill();
      frameId = requestAnimationFrame(tick);
    }
    void fill(); frameId = requestAnimationFrame(tick);
    return () => { active = false; pending?.controller.abort(); cancelAnimationFrame(frameId); };
    // Audience/favourite are projection scopes, not source-session lifecycles. Latest owns current intent.
  }, [options.playing, context]);
  return buffering;
}
