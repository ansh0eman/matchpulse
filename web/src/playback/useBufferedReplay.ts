import { useEffect, useRef, useState } from "react";
import type { PlaybackSegment, View } from "../contracts";
import { get } from "../api";
import {
  prefixView,
  replayKey,
  validateSegment,
  type ReplayScope,
} from "./segment";

interface Options extends ReplayScope {
  playing: boolean;
  clock: number;
  speed: number;
  retry: number;
  seed: View | null;
  onView: (view: View, key: string) => void;
  onStop: () => void;
  onError: (message: string) => void;
}

export function useBufferedReplay(options: Options) {
  const latest = useRef(options);
  latest.current = options;
  const [buffering, setBuffering] = useState(false);
  const context = JSON.stringify([
    options.scenario,
    options.audience,
    options.favorite,
    options.retry,
  ]);
  useEffect(() => {
    if (!options.playing || !options.seed) {
      setBuffering(false);
      return;
    }
    const scope: ReplayScope = {
      scenario: options.scenario,
      audience: options.audience,
      favorite: options.favorite,
    };
    const seed = options.seed;
    let active = true,
      pending = false,
      frameId = 0,
      packet: PlaybackSegment | null = null;
    let cursor = options.clock,
      virtualClock = cursor,
      lastTick = performance.now();
    const controller = new AbortController();
    setBuffering(true);
    async function fill() {
      if (pending || !active) return;
      pending = true;
      const anchor = cursor;
      const anchorView = packet ? prefixView(packet, anchor) : seed;
      try {
        const next = await get<PlaybackSegment>(
          `/api/playback?${replayKey(scope, anchor)}&window_seconds=16`,
          controller.signal,
        );
        if (!active || !latest.current.playing) return;
        validateSegment(next, scope, anchorView, anchor);
        packet = next;
        latest.current.onView(
          prefixView(next, cursor),
          replayKey(scope, cursor),
        );
        setBuffering(false);
      } catch (error) {
        if (!controller.signal.aborted && active) {
          active = false;
          cancelAnimationFrame(frameId);
          setBuffering(false);
          latest.current.onError(
            "Playback buffer unavailable or invalid. The replay was paused; retry the source.",
          );
          latest.current.onStop();
        }
      } finally {
        pending = false;
      }
    }
    function tick(now: number) {
      if (!active || !latest.current.playing) return;
      const elapsed = Math.min(0.25, Math.max(0, (now - lastTick) / 1000));
      lastTick = now;
      if (packet) {
        virtualClock = Math.min(
          packet.end,
          virtualClock + elapsed * latest.current.speed,
        );
        const nextClock =
          virtualClock >= packet.end
            ? packet.end
            : Math.max(packet.start, Math.floor((virtualClock + 1e-8) * 4) / 4);
        if (nextClock > cursor) {
          cursor = nextClock;
          latest.current.onView(
            prefixView(packet, cursor),
            replayKey(scope, cursor),
          );
        }
        if (cursor >= packet.base.duration) {
          latest.current.onStop();
          return;
        }
        if (packet.end - cursor <= 8 && packet.end < packet.base.duration)
          void fill();
        setBuffering(cursor >= packet.end && pending);
      }
      frameId = requestAnimationFrame(tick);
    }
    void fill();
    frameId = requestAnimationFrame(tick);
    return () => {
      active = false;
      controller.abort();
      cancelAnimationFrame(frameId);
    };
    // Clock/speed/callback changes must not restart a running stream; latest carries them.
  }, [options.playing, context]);
  return buffering;
}
