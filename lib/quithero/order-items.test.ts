import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("./client", () => ({ quitHeroFetch: vi.fn() }));
vi.mock("./products", () => ({ getQuitHeroProductById: vi.fn() }));
import { quitHeroFetch } from "./client";
import { getQuitHeroProductById } from "./products";
import { enrichOrderItems } from "./order-items";

it("fills images and missing names, preserves purchase amounts, and reuses repeated products", async () => {
  vi.mocked(quitHeroFetch).mockResolvedValue({ data: [{ id: "v", productId: "p", name: "Mint", sku: "MINT", price: 99 }], pagination: { totalPages: 1 } });
  vi.mocked(getQuitHeroProductById).mockResolvedValue({ id: "p", name: "Current name", images: [{ url: "other.png" }, { url: "primary.png", isPrimary: true }] });
  const orders = await enrichOrderItems([
    { id: "one", total: 12, items: [{ variantId: "v", productName: "Purchased name", price: 6, total: 12, quantity: 2 }] },
    { id: "two", items: [{ variantId: "v" }] },
  ]);
  expect(orders[0].items?.[0]).toMatchObject({ productName: "Purchased name", variantName: "Mint", sku: "MINT", imageUrl: "primary.png", price: 6, total: 12, quantity: 2 });
  expect(orders[1].items?.[0].productName).toBe("Current name");
  expect(orders[1].items?.[0].price).toBeUndefined();
  expect(getQuitHeroProductById).toHaveBeenCalledTimes(1);
});

it("keeps order history available if a product has been removed", async () => {
  vi.mocked(getQuitHeroProductById).mockRejectedValue(new Error("404"));
  const [order] = await enrichOrderItems([{ id: "old", total: 10, items: [{ productId: "deleted", productName: "Old product", total: 10 }] }]);
  expect(order.total).toBe(10);
  expect(order.items?.[0]).toMatchObject({ productName: "Old product", total: 10 });
  expect(order.items?.[0].imageUrl).toBeUndefined();
});
