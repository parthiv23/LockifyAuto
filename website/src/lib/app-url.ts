/** Live Lumora app. Website CTAs always go here unless VITE_APP_URL overrides. */
export const LIVE_APP = "https://lumora0.netlify.app";

export function getAppOrigin(): string {
  const fromEnv = String(import.meta.env.VITE_APP_URL || "").replace(/\/$/, "");
  return fromEnv || LIVE_APP;
}

export function appUrl(path = "/"): string {
  const origin = getAppOrigin();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${origin}${normalized}`;
}
