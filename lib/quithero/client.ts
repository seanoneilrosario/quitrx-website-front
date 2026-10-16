import "server-only";
import { createRequestGate } from "./request-gate";

const requestGate = createRequestGate();

export class QuitHeroApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/** Mutations are not retried: an ambiguous response must not create duplicate orders. */
export async function quitHeroPost<T>(path: string, payload: unknown): Promise<T> {
  const apiKey = process.env.QUITHERO_API_KEY;
  if (!apiKey) throw new Error("QuitHero API key is not configured.");
  const response = await requestGate.run(() =>
    fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify(payload),
      cache: "no-store",
    }),
  );
  const responseBody = await response.text();
  let body: unknown;
  try {
    body = responseBody ? JSON.parse(responseBody) : undefined;
  } catch {
    body = responseBody || undefined;
  }
  if (!response.ok) {
    const detail = extractApiErrorMessage(body);
    throw new QuitHeroApiError(
      detail || `QuitHero order request failed with status ${response.status}.`,
      response.status,
    );
  }
  return body as T;
}

export async function quitHeroPatch<T>(path: string, payload: unknown): Promise<T> {
  const apiKey = process.env.QUITHERO_API_KEY;
  if (!apiKey) throw new Error("QuitHero API key is not configured.");
  const response = await requestGate.run(() =>
    fetch(`${API_BASE}${path}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify(payload),
      cache: "no-store",
    }),
  );
  const responseBody = await response.text();
  let body: unknown;
  try {
    body = responseBody ? JSON.parse(responseBody) : undefined;
  } catch {
    body = responseBody || undefined;
  }
  if (!response.ok) {
    const detail = extractApiErrorMessage(body);
    throw new QuitHeroApiError(
      detail || `QuitHero order update failed with status ${response.status}.`,
      response.status,
    );
  }
  return body as T;
}

export function extractApiErrorMessage(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    const messages = value
      .map(extractApiErrorMessage)
      .filter((message): message is string => Boolean(message));
    return messages.length ? messages.join(" ") : undefined;
  }
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  for (const key of ["message", "error", "errors", "details"]) {
    const message = extractApiErrorMessage(record[key]);
    if (message) return message;
  }
  return undefined;
}

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

export async function quitHeroFetch<T>(
  path: string,
  options?: { beforeRequest?: () => void },
): Promise<T> {
  const apiKey = process.env.QUITHERO_API_KEY;

  if (!apiKey) {
    throw new Error("QuitHero API key is not configured.");
  }

  let lastError: unknown;
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    let response: Response;
    try {
      const startedAt = Date.now();

      response = await requestGate.run(async () => {
        options?.beforeRequest?.();
        const result = await fetch(`${API_BASE}${path}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
          },
          cache: "no-store",
        });
        if (result.status === 429) {
          const seconds = Number(result.headers.get("retry-after"));
          const date = Date.parse(result.headers.get("retry-after") ?? "");
          const cooldown =
            seconds > 0 ? seconds * 1000 : Number.isFinite(date) ? date - Date.now() : 30_000;
          requestGate.cooldown(Math.max(1000, cooldown));
        }
        return result;
      });

      // console.log("[QuitHero API]", {
      //   path,
      //   status: response.status,
      //   duration: `${Date.now() - startedAt}ms`,
      // });
    } catch (error) {
      // Stop queued work and budget failures immediately; do not create retry storms.
      if (error instanceof Error && /rate limited|request limit reached/.test(error.message))
        throw error;
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

    if (response.status < 500) throw error;
    lastError = error;
    const retryDelay = RETRY_DELAYS_MS[attempt];
    if (retryDelay === undefined) break;
    await delay(retryDelayFrom(response, retryDelay));
  }

  throw lastError instanceof Error ? lastError : new Error("QuitHero request failed.");
}
