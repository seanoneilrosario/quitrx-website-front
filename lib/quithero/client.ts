import "server-only";

export const API_BASE = (
  process.env.QUITHERO_API_BASE_URL ?? "https://retail-api.quithero.com.au"
).replace(/\/$/, "");
export const RETRY_DELAYS_MS = [250, 750];
export const QUITHERO_CACHE_SECONDS = 60;
export const QUITHERO_CATALOG_CACHE_SECONDS = 300;

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function retryDelayFrom(response: Response, fallback: number) {
  const retryAfter = response.headers.get("retry-after");
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) return Math.max(250, Math.min(seconds * 1_000, 10_000));

    const retryAt = Date.parse(retryAfter);
    if (Number.isFinite(retryAt)) return Math.max(250, Math.min(retryAt - Date.now(), 10_000));
  }

  const resetSeconds = Number(response.headers.get("x-ratelimit-reset"));
  if (response.status === 429 && Number.isFinite(resetSeconds)) {
    return Math.max(250, Math.min(resetSeconds * 1_000, 10_000));
  }

  return fallback;
}

export async function quitHeroFetch<T>(path: string): Promise<T> {
  const apiKey = process.env.QUITHERO_API_KEY;

  if (!apiKey) {
    throw new Error("QuitHero API key is not configured.");
  }

  let lastError: unknown;
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    let response: Response;
    try {
      const startedAt = Date.now();

      response = await fetch(`${API_BASE}${path}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        cache: "no-store",
      });

      console.log("[QuitHero API]", {
        path,
        status: response.status,
        duration: `${Date.now() - startedAt}ms`,
      });
    } catch (error) {
      lastError = error;
      const retryDelay = RETRY_DELAYS_MS[attempt];
      if (retryDelay === undefined) break;
      await delay(retryDelay);
      continue;
    }

    if (response.ok) return response.json() as Promise<T>;

    const responseBody = await response.text();

    console.error("QuitHero API error:", {
      status: response.status,
      path,
      body: responseBody,
    });

    const error = new Error(`QuitHero request failed with ${response.status}.`);

    if (response.status !== 429 && response.status < 500) throw error;
    lastError = error;
    const retryDelay = RETRY_DELAYS_MS[attempt];
    if (retryDelay === undefined) break;
    await delay(retryDelayFrom(response, retryDelay));
  }

  throw lastError instanceof Error ? lastError : new Error("QuitHero request failed.");
}
