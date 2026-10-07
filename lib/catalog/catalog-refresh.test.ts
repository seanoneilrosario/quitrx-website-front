import { afterEach, describe, expect, it, vi } from "vitest";
import { collectionCacheForRestore, isBrowserReload } from "./catalog-refresh";

afterEach(() => vi.unstubAllGlobals());

describe("browser reload collection cache", () => {
  it("detects reloads without treating internal navigation or SSR as reloads", () => {
    expect(isBrowserReload()).toBe(false);
    vi.stubGlobal("window", { performance: { getEntriesByType: () => [{ type: "navigate" }] } });
    expect(isBrowserReload()).toBe(false);
    vi.stubGlobal("window", { performance: { getEntriesByType: () => [{ type: "reload" }] } });
    expect(isBrowserReload()).toBe(true);
  });

  it("drops old collection pages on reload while retaining other persisted queries", () => {
    const snapshot = JSON.stringify({
      timestamp: 123,
      buster: "catalog-v1",
      clientState: {
        mutations: [],
        queries: [
          {
            queryKey: ["api", "/api/quithero-products", "collection", "all-products", 100],
            state: { data: { pages: ["deleted-product"] } },
          },
          {
            queryKey: ["api", "/api/quithero-products", "collection-summary-v3", "all-products", 15],
            state: { data: { pages: ["stale-summary"] } },
          },
          { queryKey: ["api", "/api/quithero-collections"], state: { data: [] } },
        ],
      },
    });
    expect(collectionCacheForRestore(snapshot, false)).toBe(snapshot);
    const restored = JSON.parse(collectionCacheForRestore(snapshot, true)!);
    expect(restored.clientState.queries).toHaveLength(1);
    expect(restored.clientState.queries[0].queryKey).toEqual(["api", "/api/quithero-collections"]);
    expect(restored.timestamp).toBe(123);
    expect(collectionCacheForRestore("invalid", true)).toBeNull();
  });
});
