import "server-only";

const API_BASE = (process.env.QUITHERO_API_BASE_URL ?? "https://retail-api.quithero.com.au").replace(/\/$/, "");

export type RetailRecord = Record<string, unknown> & { id?: string };

function apiKey() {
  let value = process.env.QUITHERO_API_KEY?.trim();
  if (!value) throw new Error("QUITHERO_API_KEY is not configured.");

  // Vercel values are plain text, while copied .env entries may include the
  // variable name or escape `$`. Normalize those forms before authenticating.
  value = value.replace(/^QUITHERO_API_KEY\s*=\s*/, "");
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  value = value.replace(/\\\$/g, "$");

  if (!value) throw new Error("QUITHERO_API_KEY is not configured.");
  return value;
}

export async function retailRequest<T = unknown>(path: string, init: RequestInit = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey(),
      ...init.headers,
    },
    cache: "no-store",
  });

  const text = await response.text();
  let body: unknown;
  try { body = text ? JSON.parse(text) : undefined; } catch { body = text; }
  if (!response.ok) throw new Error(`QuitHero API returned ${response.status}.`);
  return body as T;
}

export function records(payload: unknown): RetailRecord[] {
  if (Array.isArray(payload)) return payload.filter((item): item is RetailRecord => Boolean(item && typeof item === "object"));
  if (!payload || typeof payload !== "object") return [];
  const wrapper = payload as Record<string, unknown>;
  for (const key of ["data", "items", "results", "products", "customers", "orders", "collections"]) {
    const result = records(wrapper[key]);
    if (result.length) return result;
  }
  return [];
}

export async function safeRetailList(path: string) {
  try {
    return { data: records(await retailRequest(path)), error: undefined };
  } catch (error) {
    return { data: [], error: error instanceof Error ? error.message : "Unable to reach QuitHero." };
  }
}
