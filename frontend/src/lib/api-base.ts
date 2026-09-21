/** API base URL for split deploy (e.g. https://your-api.onrender.com). Empty = same origin / dev proxy. */
export function getApiBaseUrl(): string {
  const base = import.meta.env.VITE_API_URL as string | undefined;
  return base?.replace(/\/$/, "") ?? "";
}

export function resolveApiUrl(url: string): string {
  if (!url.startsWith("/api/")) return url;
  const base = getApiBaseUrl();
  return base ? `${base}${url}` : url;
}
