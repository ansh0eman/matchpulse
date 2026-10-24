import type { View } from "../contracts";

/** Retain only a verified prefix in the identical fixture/viewer context.
 * Forward loading may reuse the past. Backward seeks must never reuse the future.
 */
export function visibleSnapshot(snapshot: View | null, loadedKey: string, requestedKey: string): View | null {
  if (!snapshot || !loadedKey) return null;
  const loaded = new URLSearchParams(loadedKey);
  const requested = new URLSearchParams(requestedKey);
  if (["scenario", "audience", "favorite"].some((key) => loaded.get(key) !== requested.get(key))) return null;
  const target = Number(requested.get("clock"));
  if (!Number.isFinite(target) || snapshot.clock > target || snapshot.clock !== Number(loaded.get("clock"))) return null;
  if (snapshot.scenario !== requested.get("scenario")) return null;
  return snapshot;
}
