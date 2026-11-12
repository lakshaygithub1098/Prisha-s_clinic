export const API = "/api/v1";
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API}${path}`, { ...init, credentials: "include", headers: { "Content-Type": "application/json", ...init.headers } });
  const body = await response.json();
  if (!response.ok) throw new Error(body?.error?.message || "Request failed. Check that the API is running.");
  return body as T;
}
