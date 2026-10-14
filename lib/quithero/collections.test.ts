import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));
vi.mock("./shop-visibility", async () => {
  const { productIsListedInShop } = await import("./helpers");
  return {
    filterShopProducts: async (products: import("./product-types").QuitHeroProduct[]) =>
      products.filter(
        (product) => productIsListedInShop(product) && product.id !== "hidden-scalar",
      ),
  };
});
vi.mock("@/sanity/lib/client", () => ({ client: { withConfig: vi.fn() } }));

import {
  getFastQuitHeroCollectionPage,
  getQuitHeroCollectionPage,
  getFreshQuitHeroCollections,
} from "./collections";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("collection picker pagination", () => {
  it("paginates named collections after removing hidden products across backend pages", async () => {
    vi.stubEnv("QUITHERO_API_KEY", "test-key");
    const source = Array.from({ length: 38 }, (_, index) => ({
      id: `named-${index}`,
      name: `Product ${index}`,
      images: [],
      variants: [],
      tags: index % 6 === 0 ? ["NOTOSHOP"] : [],
    }));
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      const params = new URL(url).searchParams;
      expect(params.getAll("brandId")).toEqual(["brand-one"]);
      const backendPage = Number(params.get("page"));
      return Response.json({
        data: {
          name: "Full pages",
          slug: "full-pages",
          products: source.slice((backendPage - 1) * 19, backendPage * 19),
        },
        pagination: { totalPages: 2 },
      });
    });
    vi.stubGlobal("fetch", fetchMock);
    const filters = { brandId: ["brand-one"] };
    const first = await getQuitHeroCollectionPage("full-pages", 1, 15, filters);
    const second = await getFastQuitHeroCollectionPage("full-pages", 2, 15, filters);
    const last = await getFastQuitHeroCollectionPage("full-pages", 3, 15, filters);
    expect([first.products.length, second.products.length, last.products.length]).toEqual([
      15, 15, 1,
    ]);
    expect(first.pagination.total).toBe(31);
    expect(last.pagination.hasNextPage).toBe(false);
    expect(
      [...first.products, ...second.products, ...last.products].map((product) => product.id),
    ).toEqual(source.filter((product) => !product.tags.length).map((product) => product.id));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("excludes NOTOSHOP products before creating named collection cards", async () => {
    vi.stubEnv("QUITHERO_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          data: {
            name: "Shop visibility",
            slug: "shop-visibility",
            products: [
              { id: "hidden-scalar" },
              { id: "hidden-collection", tags: [{ tag: { name: "NOTOSHOP" } }] },
              { id: "visible-collection", name: "Visible", variants: [], images: [] },
            ],
          },
          pagination: { page: 1, limit: 20, total: 2, totalPages: 1, hasNextPage: false },
        }),
      ),
    );
    const result = await getQuitHeroCollectionPage("shop-visibility", 1, 20);
    expect(result.products.map((product) => product.id)).toEqual(["visible-collection"]);
  });

  it("loads collections from every backend page", async () => {
    vi.stubEnv("QUITHERO_API_KEY", "test-key");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({ data: [{ id: "first", slug: "first" }], pagination: { totalPages: 2 } }),
      )
      .mockResolvedValueOnce(
        Response.json({ data: [{ id: "new", slug: "new" }], pagination: { totalPages: 2 } }),
      );
    vi.stubGlobal("fetch", fetchMock);
    expect(await getFreshQuitHeroCollections()).toEqual([
      { id: "first", slug: "first" },
      { id: "new", slug: "new" },
    ]);
    expect(fetchMock.mock.calls.map(([url]) => new URL(url).search)).toEqual([
      "?page=1&limit=100",
      "?page=2&limit=100",
    ]);
  });

  it("reads newly created collections on subsequent fresh requests", async () => {
    vi.stubEnv("QUITHERO_API_KEY", "test-key");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json([{ slug: "first" }]))
      .mockResolvedValueOnce(Response.json([{ slug: "first" }, { slug: "new" }]));
    vi.stubGlobal("fetch", fetchMock);
    expect(await getFreshQuitHeroCollections()).toHaveLength(1);
    expect(await getFreshQuitHeroCollections()).toHaveLength(2);
  });
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
  it("fills visible pages after filtering and hydrates only their cards", async () => {
    vi.stubEnv("QUITHERO_API_KEY", "test-key");
    const source = Array.from({ length: 40 }, (_, index) => ({
      id: `fill-${index}`,
      name: `Product ${index}`,
      images: [],
      variants: [],
      tags: index % 5 === 0 ? ["NOTOSHOP"] : [],
    }));
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      const backendPage = Number(new URL(url).searchParams.get("page"));
      return Response.json({
        products: source.slice((backendPage - 1) * 20, backendPage * 20),
        pagination: { totalPages: 2 },
      });
    });
    vi.stubGlobal("fetch", fetchMock);
    const result = await getQuitHeroCollectionPage("all-products", 1, 100);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/products\?page=1&limit=100&status=active$/);
    expect(result.pagination).toEqual({
      page: 1,
      limit: 15,
      total: 32,
      totalPages: 3,
      hasNextPage: true,
    });
    expect(result.products).toHaveLength(15);
    const second = await getFastQuitHeroCollectionPage("all-products", 2, 15);
    const last = await getFastQuitHeroCollectionPage("all-products", 3, 15);
    expect(second.products).toHaveLength(15);
    expect(last.products).toHaveLength(2);
    expect(last.pagination.hasNextPage).toBe(false);
    expect(
      [...result.products, ...second.products, ...last.products].map((product) => product.id),
    ).toEqual(source.filter((product) => !product.tags.length).map((product) => product.id));
    expect(fetchMock).toHaveBeenCalledTimes(2);
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
          pagination: { totalPages: 1 },
        }),
      )
      .mockResolvedValueOnce(Response.json({ id: "variant", inventory: 4 }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await getQuitHeroCollectionPage("all-products", 1, 10);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/products\?page=1&limit=100&status=active$/);
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

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const requestUrl = new URL(String(fetchMock.mock.calls[0][0]));
    expect(requestUrl.pathname).toBe("/collections/e-liquids");
    expect(requestUrl.searchParams.get("productFields")).toBe(
      "id,name,slug,status,brand,productType,variants,images,tags",
    );
  });
});
