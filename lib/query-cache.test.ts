import { afterEach, describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { persistQueryClientRestore, persistQueryClientSave, type PersistedClient } from "@tanstack/react-query-persist-client";
import { API_CACHE_TIME, API_STALE_TIME, shouldPersistQuery } from "./query-cache";
import { catalogListQuery } from "./catalog-queries";

afterEach(() => vi.unstubAllGlobals());

describe("shared API cache", () => {
  it("shares catalog requests across consumers and equivalent collection filters", async () => {
    const fetchMock = vi.fn().mockImplementation(async () => Response.json([{ id: "one" }]));
    vi.stubGlobal("fetch", fetchMock);
    const client = new QueryClient();
    try {
      await Promise.all([
        client.fetchQuery(catalogListQuery("products", ["b", "a", "a"])),
        client.fetchQuery(catalogListQuery("products", ["a", "b"])),
      ]);
      await client.fetchQuery(catalogListQuery("products", ["b", "a"]));
      expect(fetchMock).toHaveBeenCalledTimes(1);
    } finally { client.clear(); }
  });

  it("restores fresh catalog queries after reload without fetching or restoring private data", async () => {
    let snapshot: PersistedClient | undefined;
    const persister = {
      persistClient: (value: PersistedClient) => { snapshot = JSON.parse(JSON.stringify(value)); },
      restoreClient: () => snapshot,
      removeClient: () => { snapshot = undefined; },
    };
    const fetchMock = vi.fn().mockImplementation(async () => Response.json([{ id: "one" }]));
    vi.stubGlobal("fetch", fetchMock);
    const first = new QueryClient();
    const reloaded = new QueryClient();
    const options = { persister, buster: "test", maxAge: API_CACHE_TIME,
      dehydrateOptions: { shouldDehydrateQuery: shouldPersistQuery, shouldDehydrateMutation: () => false } };
    try {
      await first.fetchQuery(catalogListQuery());
      first.setQueryData(["api", "/api/account/me"], { email: "private@example.com" });
      first.setQueryData(["api", "/api/orders", "customer"], [{ id: "private-order" }]);
      await persistQueryClientSave({ queryClient: first, ...options });
      await persistQueryClientRestore({ queryClient: reloaded, ...options });
      await reloaded.fetchQuery(catalogListQuery());
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(reloaded.getQueryData(["api", "/api/account/me"])).toBeUndefined();
      expect(reloaded.getQueryData(["api", "/api/orders", "customer"])).toBeUndefined();

      // Expiry uses the original fetch timestamp, not the reload timestamp.
      reloaded.setQueryData(catalogListQuery().queryKey, [], { updatedAt: Date.now() - API_STALE_TIME - 1 });
      await reloaded.fetchQuery(catalogListQuery());
      expect(fetchMock).toHaveBeenCalledTimes(2);
      await reloaded.invalidateQueries({ queryKey: catalogListQuery().queryKey });
      await persistQueryClientSave({ queryClient: reloaded, ...options });
      expect(snapshot?.clientState.queries).toHaveLength(0);
    } finally { first.clear(); reloaded.clear(); }
  });
});
