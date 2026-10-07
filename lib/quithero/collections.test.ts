import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));
vi.mock("@/sanity/lib/client", () => ({ client: { withConfig: vi.fn() } }));

import { getFastQuitHeroCollectionPage, getQuitHeroCollectionPage } from "./collections";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("all-products pagination", () => {
  it("shares simultaneous loads after normalizing the server and browser limits", async () => {
    vi.stubEnv("QUITHERO_API_KEY", "test-key");
    const fetchMock = vi
      .fn()
      .mockImplementation(async () =>
        Response.json({ data: [], pagination: { total: 0, totalPages: 1 } }),
      );
    vi.stubGlobal("fetch", fetchMock);
    await Promise.all([
      getFastQuitHeroCollectionPage("all-products", 1, 100),
      getFastQuitHeroCollectionPage("all-products", 1, 15),
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("caps actual backend attempts at 100", async () => {
    vi.stubEnv("QUITHERO_API_KEY", "test-key");
    const fetchMock = vi
      .fn()
      .mockImplementation(async (url: string) =>
        Response.json(
          new URL(url).pathname === "/products"
            ? { data: [{ id: "one", images: [] }], pagination: { totalPages: 1 } }
            : { data: [], pagination: { totalPages: 200 } },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);
    await expect(getQuitHeroCollectionPage("all-products", 1, 100)).rejects.toThrow(
      "Collection request limit reached",
    );
    expect(fetchMock).toHaveBeenCalledTimes(100);
  });
  it("requests only the visible page even when the catalog has many pages", async () => {
    vi.stubEnv("QUITHERO_API_KEY", "test-key");
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        products: [{ id: "one", name: "Product one", images: [], variants: [] }],
        pagination: { totalPages: 50 },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const result = await getQuitHeroCollectionPage("all-products", 1, 100);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/products\?page=1&limit=15&status=active$/);
    expect(result.pagination).toEqual({
      page: 1,
      limit: 15,
      total: 1,
      totalPages: 50,
      hasNextPage: true,
    });
    expect(result.products).toHaveLength(1);
  });

  it("does not fetch product details for bundles and detects the final page", async () => {
    vi.stubEnv("QUITHERO_API_KEY", "test-key");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          products: [
            {
              id: "bundle",
              images: [],
              tags: ["bundle"],
              variants: [{ id: "variant", inventory: 0 }],
            },
          ],
          pagination: { totalPages: 2 },
        }),
      )
      .mockResolvedValueOnce(Response.json({ id: "variant", inventory: 4 }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await getQuitHeroCollectionPage("all-products", 2, 10);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/products\?page=2&limit=10&status=active$/);
    expect(result.products[0].isBundle).toBe(true);
    expect(result.products[0].available).toBe(false);
    expect(result.pagination.hasNextPage).toBe(false);
  });
});

describe("collection product fields", () => {
  it("requests only the product data used by the collection catalog", async () => {
    vi.stubEnv("QUITHERO_API_KEY", "test-key");
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        data: { name: "E-liquids", slug: "e-liquids", products: [] },
        pagination: { page: 1, limit: 24, total: 0, totalPages: 1, hasNextPage: false },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await getQuitHeroCollectionPage("e-liquids", 1, 24);

    const requestUrl = new URL(String(fetchMock.mock.calls[0][0]));
    expect(requestUrl.pathname).toBe("/collections/e-liquids");
    expect(requestUrl.searchParams.get("productFields")).toBe(
      "id,name,slug,status,brand,productType,variants,images,tags",
    );
  });
});
