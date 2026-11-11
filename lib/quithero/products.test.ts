import { afterEach, expect, it, vi } from "vitest";
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
vi.mock("./client", () => ({
  quitHeroFetch: vi.fn(),
  QUITHERO_CACHE_SECONDS: 60,
  QUITHERO_CATALOG_CACHE_SECONDS: 300,
}));
import { quitHeroFetch } from "./client";
import {
  getFreshQuitHeroProductById,
  getFreshQuitHeroProducts,
  loadQuitHeroProductsPage,
} from "./products";
import { toCollectionProduct } from "@/lib/catalog/collection-product";
import { cacheProductCard } from "./cache/card-cache";
afterEach(() => vi.resetAllMocks());

it("excludes NOTOSHOP tags from every page of the search catalog", async () => {
  vi.mocked(quitHeroFetch)
    .mockResolvedValueOnce({
      data: [{ id: "hidden", tags: [" NOTOSHOP "] }, { id: "visible" }],
      pagination: { totalPages: 2 },
    })
    .mockResolvedValueOnce({
      data: [{ id: "also-hidden", tags: [{ tag: { slug: "notoshop" } }] }],
    });
  expect(await getFreshQuitHeroProducts()).toEqual([{ id: "visible" }]);
});

it("filters hidden products before loading paginated card relations", async () => {
  vi.mocked(quitHeroFetch).mockResolvedValue([
    { id: "hidden-scalar", tags: ["NOTOSHOP"] },
    { id: "hidden-page-card", tags: [{ name: "NOTOSHOP" }] },
    { id: "visible-page-card", images: [], variants: [] },
  ]);
  const result = await loadQuitHeroProductsPage(1, 20, "card");
  expect(result.products.map((product) => product.id)).toEqual(["visible-page-card"]);
  expect(quitHeroFetch).toHaveBeenCalledTimes(1);
});

it("loads fresh product variants by product ID for checkout validation", async () => {
  cacheProductCard({
    id: "product-one",
    name: "Old catalog card",
    images: [],
    variants: [{ id: "variant-one", inventory: 99, price: 1 }],
  });
  vi.mocked(quitHeroFetch).mockResolvedValue({
    data: {
      id: "product-one",
      name: "Product one",
      variants: [{ id: "variant-one", inventory: 5, allocatedInventory: 1, price: 20 }],
    },
  });

  const product = await getFreshQuitHeroProductById("product-one");

  expect(quitHeroFetch).toHaveBeenCalledWith("/products/product-one");
  expect(product.variants).toEqual([
    { id: "variant-one", inventory: 5, allocatedInventory: 1, price: 20 },
  ]);
});

it("loads missing card relations only for the requested page and paginates variants", async () => {
  const fetch = vi.mocked(quitHeroFetch).mockImplementation(async (path) => {
    const url = new URL(path, "https://example.test");
    if (url.pathname === "/products")
      return {
        data: [{ id: "one", name: "One", productType: "Bundle" }],
        pagination: { total: 20, totalPages: 20 },
      };
    expect(url.searchParams.get("productId")).toBe("one");
    if (url.pathname === "/product-images")
      return {
        data: [{ url: "https://example.test/product.png", isPrimary: true }],
        pagination: { totalPages: 1 },
      };
    if (url.pathname === "/product-variants")
      return {
        data: [
          {
            id: `v${url.searchParams.get("page")}`,
            inventory: 5,
            allocatedInventory: 1,
            price: "20",
          },
        ],
        pagination: { totalPages: 2 },
      };
    throw new Error(`Unexpected detail request: ${path}`);
  });
  const result = await loadQuitHeroProductsPage(2, 1);
  const card = toCollectionProduct(result.products[0]);
  expect(fetch).toHaveBeenCalledTimes(4);
  expect(fetch).toHaveBeenCalledWith(
    expect.stringContaining("/products?page=2&limit=1&status=ACTIVE&excludeTags=NOTOSHOP&fields="),
    {
      beforeRequest: expect.any(Function),
    },
  );
  expect(card.images?.[0].url).toBe("https://example.test/product.png");
  expect(card.available).toBe(true);
  expect(card.variants).toHaveLength(2);
  expect(result.total).toBe(20);
  await loadQuitHeroProductsPage(2, 1);
  expect(fetch).toHaveBeenCalledTimes(4); // snapshot and card relations are reused
  await loadQuitHeroProductsPage(2, 1, undefined, true);
  expect(fetch).toHaveBeenCalledTimes(8); // explicit refresh reloads snapshot and relations
});

it("reuses a card seeded by a named collection without fetching its relations", async () => {
  cacheProductCard({
    id: "seeded",
    name: "Seeded",
    images: [{ url: "image" }],
    variants: [{ id: "v", inventory: 3, price: 10 }],
  });
  const fetch = vi
    .mocked(quitHeroFetch)
    .mockResolvedValue({ data: [{ id: "seeded" }], pagination: { total: 1, totalPages: 1 } });
  const result = await loadQuitHeroProductsPage(1, 1, "seeded");
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(result.products[0]).toMatchObject({
    name: "Seeded",
    available: true,
    images: [{ url: "image" }],
  });
});

it("loads page 11 card relations without loading relations for earlier pages", async () => {
  const fetch = vi.mocked(quitHeroFetch).mockImplementation(async (path) => {
    const url = new URL(path, "https://example.test");
    if (url.pathname === "/products") {
      expect(url.searchParams.get("excludeTags")).toBe("NOTOSHOP");
      expect(url.searchParams.get("fields")).toBe(
        "id,name,slug,status,brand,productType,variants,images,tags",
      );
      expect(url.searchParams.has("productFields")).toBe(false);
      expect(url.searchParams.get("page")).toBe("11");
      expect(url.searchParams.get("limit")).toBe("15");
      const offset = 150;
      return {
        data: Array.from({ length: 15 }, (_, index) => ({
          id: `page-eleven-${offset + index}`,
          name: `Product ${offset + index}`,
        })),
        pagination: { total: 165, totalPages: 11 },
      };
    }
    const id = Number(url.searchParams.get("productId")?.replace("page-eleven-", ""));
    expect(id).toBeGreaterThanOrEqual(150);
    expect(id).toBeLessThan(165);
    return { data: [], pagination: { totalPages: 1 } };
  });
  const result = await loadQuitHeroProductsPage(11, 15, "page-eleven");
  expect(result.products).toHaveLength(15);
  expect(result.total).toBe(165);
  expect(fetch).toHaveBeenCalledTimes(31);
  await loadQuitHeroProductsPage(11, 15, "page-eleven");
  expect(fetch).toHaveBeenCalledTimes(31);
});

it("does not send collection sort values to the all-products endpoint", async () => {
  vi.mocked(quitHeroFetch).mockResolvedValue({ data: [], pagination: { total: 0, totalPages: 1 } });
  await loadQuitHeroProductsPage(1, 15, undefined, true, { sort: "MANUAL" });
  expect(quitHeroFetch).toHaveBeenCalled();
  for (const [path] of vi.mocked(quitHeroFetch).mock.calls) {
    expect(new URL(path, "https://example.test").searchParams.has("sort")).toBe(false);
  }
});
