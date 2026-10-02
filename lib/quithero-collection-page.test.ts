import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));
vi.mock("@/sanity/lib/client", () => ({ client: { withConfig: vi.fn() } }));

import { getQuitHeroCollectionPage } from "./quithero";

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("all-products pagination", () => {
  it("requests only the visible page even when the catalog has many pages", async () => {
    vi.stubEnv("QUITHERO_API_KEY", "test-key");
    const fetchMock = vi.fn().mockResolvedValue(Response.json({
      products: [{ id: "one", name: "Product one" }], pagination: { totalPages: 50 },
    }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await getQuitHeroCollectionPage("all-products", 1, 100);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/products\?page=1&limit=100$/);
    expect(result.pagination).toEqual({ page: 1, limit: 100, totalPages: 50, hasNextPage: true });
    expect(result.products).toHaveLength(1);
  });

  it("preserves bundle stock hydration and detects the final page", async () => {
    vi.stubEnv("QUITHERO_API_KEY", "test-key");
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json({ products: [{ id: "bundle", tags: ["bundle"], variants: [{ id: "variant", inventory: 0 }] }], pagination: { totalPages: 2 } }))
      .mockResolvedValueOnce(Response.json({ id: "variant", inventory: 4 }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await getQuitHeroCollectionPage("all-products", 2, 10);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/products\?page=2&limit=10$/);
    expect(result.products[0].variants?.[0].inventory).toBe(4);
    expect(result.pagination.hasNextPage).toBe(false);
  });
});
