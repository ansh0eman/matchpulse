/** GET and Ask share the public error contract, including non-JSON gateway errors. */
export async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message = body !== null && typeof body === "object" && "error" in body
      ? body.error
      : null;
    throw new Error(typeof message === "string" && message.trim()
      ? message
      : "The evidence service is unavailable. Please retry.");
  }
  return response.json();
}

export async function get<T>(url: string, signal?: AbortSignal): Promise<T> {
  return readJson<T>(await fetch(url, { signal }));
}
