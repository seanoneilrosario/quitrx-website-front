import { afterEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));
vi.mock("./client", () => ({
  quitHeroFetch: vi.fn(),
  QUITHERO_CACHE_SECONDS: 60,
  QUITHERO_CATALOG_CACHE_SECONDS: 300,
}));
import { quitHeroFetch } from "./client";
import { loadQuitHeroProductsPage } from "./products";
import { toCollectionProduct } from "@/lib/catalog/collection-product";
afterEach(() => vi.resetAllMocks());

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
  expect(fetch).toHaveBeenCalledWith("/products?page=2&limit=1&status=active", {
    beforeRequest: expect.any(Function),
  });
  expect(card.images?.[0].url).toBe("https://example.test/product.png");
  expect(card.available).toBe(true);
  expect(card.variants).toHaveLength(2);
  expect(result.total).toBe(20);
});
