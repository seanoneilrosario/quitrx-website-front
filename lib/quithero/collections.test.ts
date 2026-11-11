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
  normalizeCollectionFilters,
} from "./collections";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("collection picker pagination", () => {
  it("loads only requested named collection pages and hides NOTOSHOP items", async () => {
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
          products: source.slice((backendPage - 1) * 15, backendPage * 15),
        },
        pagination: { total: 38, totalPages: 3 },
      });
    });
    vi.stubGlobal("fetch", fetchMock);
    const filters = { brandId: ["brand-one"] };
    const first = await getQuitHeroCollectionPage("full-pages", 1, 15, filters);
    const second = await getFastQuitHeroCollectionPage("full-pages", 2, 15, filters);
    const last = await getFastQuitHeroCollectionPage("full-pages", 3, 15, filters);
    expect([first.products.length, second.products.length, last.products.length]).toEqual([
      12, 13, 6,
    ]);
    expect(first.pagination.total).toBe(38);
    expect(last.pagination.hasNextPage).toBe(false);
    expect(
      [...first.products, ...second.products, ...last.products].map((product) => product.id),
    ).toEqual(source.filter((product) => !product.tags.length).map((product) => product.id));
    expect(fetchMock).toHaveBeenCalledTimes(3);
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
              { id: "hidden-scalar", tags: ["NOTOSHOP"] },
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
  it("shares cache entries for equivalent server and browser filters", async () => {
    vi.stubEnv("QUITHERO_API_KEY", "test-key");
    const fetchMock = vi.fn().mockImplementation(async () =>
      Response.json({
        data: { name: "Cache", slug: "cache-equivalent", products: [] },
        pagination: { total: 1, totalPages: 1 },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    await getFastQuitHeroCollectionPage("cache-equivalent", 1, 15);
    await getFastQuitHeroCollectionPage("cache-equivalent", 1, 15, {
      brandId: [],
      tags: [],
      minPrice: undefined,
      attributeFilters: [],
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(normalizeCollectionFilters({ brandId: [" b ", "a", "b"], minPrice: 0 })).toEqual({
      sort: "MANUAL",
      brandId: ["a", "b"],
      minPrice: 0,
    });
    await getFastQuitHeroCollectionPage("cache-equivalent", 1, 15, { brandId: ["a"] });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
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
            ? { data: [{ id: "one", images: [] }], pagination: { total: 1, totalPages: 1 } }
            : { data: [], pagination: { totalPages: 200 } },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);
    await expect(getQuitHeroCollectionPage("all-products", 1, 100)).rejects.toThrow(
      "Collection request limit reached",
    );
    expect(fetchMock).toHaveBeenCalledTimes(100);
  });
  it("keeps backend page boundaries and totals while hiding products", async () => {
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
        products: source.slice((backendPage - 1) * 15, backendPage * 15),
        pagination: { total: 40, totalPages: 3 },
      });
    });
    vi.stubGlobal("fetch", fetchMock);
    const result = await getQuitHeroCollectionPage("all-products", 1, 100);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toMatch(
      /\/products\?page=1&limit=15&status=ACTIVE&excludeTags=NOTOSHOP&fields=/,
    );
    expect(result.pagination).toEqual({
      page: 1,
      limit: 15,
      total: 40,
      totalPages: 3,
      hasNextPage: true,
    });
    expect(result.products).toHaveLength(12);
    const second = await getFastQuitHeroCollectionPage("all-products", 2, 15);
    const last = await getFastQuitHeroCollectionPage("all-products", 3, 15);
    expect(second.products).toHaveLength(12);
    expect(last.products).toHaveLength(8);
    expect(last.pagination.hasNextPage).toBe(false);
    expect(
      [...result.products, ...second.products, ...last.products].map((product) => product.id),
    ).toEqual(source.filter((product) => !product.tags.length).map((product) => product.id));
    expect(fetchMock).toHaveBeenCalledTimes(3);
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
          pagination: { total: 1, totalPages: 1 },
        }),
      )
      .mockResolvedValueOnce(Response.json({ id: "variant", inventory: 4 }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await getQuitHeroCollectionPage("all-products", 1, 10);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toMatch(
      /\/products\?page=1&limit=10&status=ACTIVE&excludeTags=NOTOSHOP&fields=/,
    );
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
    expect(requestUrl.searchParams.get("excludeTags")).toBe("NOTOSHOP");
    expect(requestUrl.searchParams.has("fields")).toBe(false);
    expect(requestUrl.searchParams.get("productFields")).toBe(
      "id,name,slug,status,brand,productType,variants,images,tags",
    );
  });
});

it("preserves next-page navigation when every product on a backend page is hidden", async () => {
  vi.stubEnv("QUITHERO_API_KEY", "test-key");
  const fetchMock = vi.fn().mockResolvedValue(
    Response.json({
      data: {
        name: "Hidden page",
        slug: "hidden-page",
        products: [{ id: "hidden-page-item", tags: ["NOTOSHOP"] }],
      },
      pagination: { page: 11, limit: 15, total: 180, totalPages: 12 },
    }),
  );
  vi.stubGlobal("fetch", fetchMock);
  const result = await getQuitHeroCollectionPage("hidden-page", 11, 15);
  expect(result.products).toEqual([]);
  expect(result.pagination).toMatchObject({
    page: 11,
    total: 180,
    totalPages: 12,
    hasNextPage: true,
  });
  expect(fetchMock).toHaveBeenCalledTimes(1);
  const url = new URL(fetchMock.mock.calls[0][0]);
  expect(url.searchParams.get("page")).toBe("11");
  expect(url.searchParams.get("limit")).toBe("15");
  expect(url.searchParams.get("status")).toBe("ACTIVE");
});

it("forwards sort to the backend and separates server cache entries", async () => {
  vi.stubEnv("QUITHERO_API_KEY", "test-key");
  const fetchMock = vi.fn().mockImplementation(async () =>
    Response.json({
      data: {
        name: "Sorted",
        slug: "sorted",
        products: [
          { id: "b", name: "B", variants: [], images: [] },
          { id: "a", name: "A", variants: [], images: [] },
        ],
      },
      pagination: { total: 2, totalPages: 1 },
    }),
  );
  vi.stubGlobal("fetch", fetchMock);
  const { COLLECTION_SORT_OPTIONS } = await import("@/lib/catalog/collection-sort");
  for (const { value } of COLLECTION_SORT_OPTIONS) {
    const result = await getFastQuitHeroCollectionPage("sorted", 1, 10, { sort: value });
    expect(new URL(fetchMock.mock.lastCall![0]).searchParams.get("sort")).toBe(value);
    expect(result.products.map((p) => p.id)).toEqual(["b", "a"]);
  }
  expect(fetchMock).toHaveBeenCalledTimes(8);
});

it.each([undefined, "MANUAL"] as const)(
  "preserves testsortcollection manual order with sort %s",
  async (sort) => {
    vi.stubEnv("QUITHERO_API_KEY", "test-key");
    const products = [
      {
        id: "20e9a71e-b4d2-4cbc-aeef-105aeb0378b6",
        name: "AIRSCREAM AIREGG KIT",
        slug: "airscream-airegg-kit",
      },
      {
        id: "779cccc7-db3c-4654-98d2-48437e79daff",
        name: "AIRSCREAM AIRSPOPS EMPTY REPLACEMENT PODS & COILS",
        slug: "airscream-airspops",
      },
      {
        id: "1d4a93eb-be57-41ff-8d33-f83ce9a89056",
        name: "FLOW 2 VAPING DEVICE",
        slug: "flow-2-vaping-device",
      },
    ];
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        data: { name: "Test sort", slug: "testsortcollection", products },
        pagination: { page: 1, limit: 15, total: 3, totalPages: 1 },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const result = await getQuitHeroCollectionPage("testsortcollection", 1, 15, { sort });
    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.pathname).toBe("/collections/testsortcollection");
    expect(url.searchParams.get("sort")).toBe("MANUAL");
    expect(url.searchParams.get("page")).toBe("1");
    expect(url.searchParams.get("limit")).toBe("15");
    expect(result.products.map((product) => product.id)).toEqual(
      products.map((product) => product.id),
    );
  },
);
