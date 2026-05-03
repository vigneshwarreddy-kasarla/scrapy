const TOKEN_KEY = "fillos_token";

export function getApiBase(): string {
  const u = import.meta.env.VITE_API_URL?.trim();
  return u && u.length > 0 ? u.replace(/\/$/, "") : "http://localhost:8080";
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const raw = url.trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) {
    try {
      const parsed = new URL(raw);
      // Keep image path stable across localhost/dev-host differences.
      if (parsed.pathname.startsWith("/dummyimages/")) {
        return `${getApiBase()}${parsed.pathname}`;
      }
      return raw;
    } catch {
      return raw;
    }
  }
  if (raw.startsWith("/")) return `${getApiBase()}${raw}`;
  return `${getApiBase()}/${raw}`;
}

function readErrorMessage(status: number, data: unknown): string {
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    if (typeof o.message === "string") return o.message;
    if (typeof o.error === "string") return o.error;
    if (typeof o.detail === "string") return o.detail;
    if (Array.isArray(o.errors)) return JSON.stringify(o.errors);
  }
  return `Request failed (${status})`;
}

export async function apiJson<T>(
  path: string,
  init?: RequestInit & { auth?: boolean }
): Promise<T> {
  const auth = init?.auth !== false;
  const headers = new Headers(init?.headers);
  if (init?.body != null && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (auth) {
    const t = getStoredToken();
    if (t) headers.set("Authorization", `Bearer ${t}`);
  }
  const res = await fetch(`${getApiBase()}${path}`, { ...init, headers });
  const text = await res.text();
  const data = text ? (JSON.parse(text) as unknown) : null;
  if (!res.ok) {
    throw new Error(readErrorMessage(res.status, data));
  }
  return data as T;
}
