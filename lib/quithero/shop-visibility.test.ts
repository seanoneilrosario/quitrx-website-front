import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("./client", () => ({ quitHeroFetch: vi.fn() }));
import { quitHeroFetch } from "./client";
import { filterShopProducts } from "./shop-visibility";

it("hides scalar products using tag assignments and shares the cached index", async () => {
  vi.mocked(quitHeroFetch).mockResolvedValue([
    { productId: "hidden", tag: { name: " NOTOSHOP ", slug: "notoshop" } },
    { productId: "visible", tag: { name: "Other" } },
  ]);
  const products = [{ id: "hidden" }, { id: "visible" }];
  expect(await filterShopProducts(products, true)).toEqual([{ id: "visible" }]);
  expect(await filterShopProducts(products)).toEqual([{ id: "visible" }]);
  expect(quitHeroFetch).toHaveBeenCalledTimes(1);
  expect(quitHeroFetch).toHaveBeenCalledWith("/product-tags");

  vi.mocked(quitHeroFetch).mockResolvedValue([]);
  expect(await filterShopProducts(products, true)).toEqual(products);
});

it("excludes archived products while retaining active products", async () => {
  vi.mocked(quitHeroFetch).mockResolvedValue([]);
  const active = { id: "active", status: "ACTIVE" };
  expect(await filterShopProducts([
    { id: "archived", status: "ARCHIVED" },
    { id: "archived-spaces", status: " archived " },
    active,
  ], true)).toEqual([active]);
});

it("does not silently show unchecked products when assignments fail", async () => {
  vi.mocked(quitHeroFetch).mockRejectedValue(new Error("Unavailable"));
  await expect(filterShopProducts([{ id: "unchecked" }], true)).rejects.toThrow("Unavailable");
});
