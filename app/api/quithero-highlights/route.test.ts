import { beforeEach, expect, it, vi } from "vitest";
vi.mock("@/lib/quithero/products", () => ({ getQuitHeroProductById: vi.fn() }));
vi.mock("@/lib/quithero/shop-visibility", () => ({
  filterShopProducts: vi.fn(async (products: { id: string }[]) =>
    products.filter((product) => product.id !== "hidden"),
  ),
}));
import { getQuitHeroProductById } from "@/lib/quithero/products";
import { GET } from "./route";
beforeEach(() => vi.clearAllMocks());
it("loads selected IDs in order, removes duplicates and omits hidden or deleted products", async () => {
  vi.mocked(getQuitHeroProductById).mockImplementation(async (id) => {
    if (id === "deleted") throw new Error("QuitHero request failed with 404.");
    return { id, name: id, variants: [], images: [] };
  });
  const response = await GET(
    new Request(
      "https://test/api?productId=second&productId=hidden&productId=deleted&productId=first&productId=second",
    ),
  );
  expect(response.status).toBe(200);
  expect((await response.json()).products.map((product: { id: string }) => product.id)).toEqual([
    "second",
    "first",
  ]);
  expect(getQuitHeroProductById).toHaveBeenCalledTimes(4);
});
it("rejects oversized selections without requesting products", async () => {
  const query = new URLSearchParams();
  for (let index = 0; index < 16; index++) query.append("productId", String(index));
  expect((await GET(new Request(`https://test/api?${query}`))).status).toBe(400);
  expect(getQuitHeroProductById).not.toHaveBeenCalled();
});
it("reports temporary failures instead of publishing a partial highlights list", async () => {
  vi.mocked(getQuitHeroProductById).mockRejectedValue(
    new Error("QuitHero request failed with 429."),
  );
  expect((await GET(new Request("https://test/api?productId=one"))).status).toBe(502);
});
