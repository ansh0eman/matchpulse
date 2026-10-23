export async function get<T>(url: string, signal?: AbortSignal): Promise<T> {
  const r = await fetch(url, { signal });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(
      e.error ?? "The evidence service is unavailable. Please retry.",
    );
  }
  return r.json();
}
