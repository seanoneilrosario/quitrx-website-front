import type { Query } from "@tanstack/react-query";

export const API_STALE_TIME = 5 * 60_000;
export const API_CACHE_TIME = 30 * 60_000;

// Only public catalog responses survive reloads. Account/session/order data
// stays in memory and is authenticated again on a full page load.
export function shouldPersistQuery(query: Query) {
  const [scope, url] = query.queryKey;
  return scope === "api" && typeof url === "string"
    && (url === "/api/quithero-collections"
      || url === "/api/quithero-products"
      || url.startsWith("/api/quithero-products?")
      || url.startsWith("/api/quithero-products/"))
    && query.state.status === "success"
    && !query.state.isInvalidated;
}
