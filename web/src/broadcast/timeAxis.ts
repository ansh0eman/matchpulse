/** The rail and transport share this published replay-time domain. No second clock. */
export function timePercent(seconds: number, duration: number): number | null {
  if (!Number.isFinite(seconds) || !Number.isFinite(duration) || duration <= 0 || seconds < 0 || seconds > duration) return null;
  return Math.max(0, Math.min(100, seconds / duration * 100));
}
