import { beforeEach, expect, it, vi } from "vitest";
vi.mock("@/lib/quithero/client", () => ({ quitHeroFetch: vi.fn() }));
vi.mock("@/lib/quithero/shop-visibility", () => ({
  filterShopProducts: async (products: { id: string }[]) =>
    products.filter((product) => product.id !== "hidden"),
}));
import { quitHeroFetch } from "@/lib/quithero/client";
import { GET } from "./route";
beforeEach(() => vi.clearAllMocks());
it("forwards search and page to the products API without loading product relations", async () => {
  vi.mocked(quitHeroFetch).mockResolvedValue({
    data: [{ id: "one", name: "Product", slug: "product" }],
    pagination: { totalPages: 3 },
  });
  const response = await GET(new Request("https://test/api?search=nic%20salt&page=2"));
  expect(quitHeroFetch).toHaveBeenCalledExactlyOnceWith(
    "/products?page=2&limit=20&status=active&search=nic+salt",
  );
  expect(await response.json()).toEqual({
    products: [{ id: "one", title: "Product", slug: "product" }],
    hasNextPage: true,
  });
});
it("rejects invalid page numbers", async () => {
  expect((await GET(new Request("https://test/api?page=-1"))).status).toBe(400);
  expect(quitHeroFetch).not.toHaveBeenCalled();
});
it("keeps NOTOSHOP products discoverable with an explanation", async () => {
  vi.mocked(quitHeroFetch).mockResolvedValue({
    data: [{ id: "hidden", name: "Nicorette", status: "ACTIVE" }],
    pagination: { totalPages: 1 },
  });
  const response = await GET(new Request("https://test/api?search=Nicorette"));
  expect((await response.json()).products).toEqual([
    {
      id: "hidden",
      title: "Nicorette",
      unavailableReason:
        "Hidden from shop (NOTOSHOP). Remove this tag in the dashboard to feature this product.",
    },
  ]);
});
