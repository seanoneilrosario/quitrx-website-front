import "server-only";

import { getToken } from "next-auth/jwt";
import { headers } from "next/headers";

const API_BASE = (process.env.QUITHERO_API_BASE_URL ?? "https://retail-api.quithero.com.au").replace(/\/$/, "");

export type RetailRecord = Record<string, unknown> & { id?: string };

async function staffAccessToken() {
  const secret = process.env.AUTH_SECRET ??
    process.env.AUTH_SESSION_SECRET ??
    (process.env.NODE_ENV !== "production" ? process.env.QUITHERO_API_KEY : undefined);
  const token = await getToken({
    req: { headers: await headers() },
    secret,
    secureCookie: process.env.NODE_ENV === "production",
  });
  if (token?.isStaff !== true || typeof token.staffAccessToken !== "string") {
    throw new Error("QuitHero staff session is not configured.");
  }
  return token.staffAccessToken;
}

export async function retailRequest<T = unknown>(path: string, init: RequestInit = {}) {
  const accessToken = await staffAccessToken();
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${accessToken}`,
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
