import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { previewQuitHeroDiscounts, readDiscountCode } from "./discounts";
import { createQuitHeroOrder, verifyOrderDiscountTotals } from "./orders";
import { previewDiscountFingerprint } from "./discount-verification";
import { parseDiscountPreview } from "@/lib/checkout/discounts";

const preview = {
  subtotal: 60,
  shippingTotal: 12.9,
  shippingAfterDiscount: 0,
  discountAmount: 22.9,
  totalAfterDiscount: 50,
  appliedDiscounts: [
    { name: "Product offer", code: "SAVE", scope: "PRODUCT", discountAmount: 10 },
    { name: "Delivery offer", code: null, scope: "SHIPPING", discountAmount: 12.9 },
  ],
  lineDiscounts: [{ itemIndex: 0, variantId: "variant", discountAmount: 10 }],
};
const payload = {
  customerId: "customer",
  subtotal: 60,
  shippingTotal: 12.9,
  quantity: 2,
  items: [{ variantId: "variant", quantity: 2 }],
};
const fetchMock = vi.fn();
beforeEach(() => {
  vi.stubEnv("QUITHERO_API_KEY", "test-key");
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("discount API boundary", () => {
  it("forwards automatic discounts and combinations without recalculating them", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify(preview), { status: 201 }));
    expect(await previewQuitHeroDiscounts(payload)).toEqual(preview);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/discounts/preview"),
      expect.objectContaining({
        method: "POST",
        cache: "no-store",
        body: JSON.stringify(payload),
        headers: expect.objectContaining({ "x-api-key": "test-key" }),
      }),
    );
  });
  it.each(["Code has expired", "Customer is not in the assigned segment"])(
    "preserves backend rejection: %s",
    async (message) => {
      fetchMock.mockResolvedValue(new Response(JSON.stringify({ message }), { status: 400 }));
      await expect(previewQuitHeroDiscounts({ ...payload, discountCode: "SAVE" })).rejects.toThrow(
        message,
      );
      expect(fetchMock).toHaveBeenCalledTimes(1);
    },
  );
  it("rejects incomplete totals instead of inventing a payable amount", () => {
    expect(() => parseDiscountPreview({ ...preview, totalAfterDiscount: null })).toThrow();
    expect(() =>
      parseDiscountPreview({ ...preview, appliedDiscounts: [{ name: "Wrong shape", amount: 10 }] }),
    ).toThrow();
  });
  it("trims codes and rejects malformed inputs", () => {
    expect(readDiscountCode(" SAVE ")).toBe("SAVE");
    expect(readDiscountCode(" ")).toBeUndefined();
    expect(() => readDiscountCode({ code: "SAVE" })).toThrow();
  });
  it("sends the code and original shipping charge to order creation without a client discountTotal", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ id: "order" }), { status: 201 }));
    const order = {
      customerId: "customer",
      source: "NATIVE" as const,
      currencyCode: "AUD" as const,
      subtotal: 60,
      total: 50,
      shippingTotal: 12.9,
      discountCode: "SAVE",
      items: payload.items,
    };
    await createQuitHeroOrder(order);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual(order);
  });
});

describe("saved discount verification", () => {
  const order = {
    id: "order",
    subtotal: "60",
    total: "50",
    shippingTotal: "12.9",
    discountTotal: "22.9",
    items: [{ variantId: "variant", discountTotal: "10" }],
    discountApplications: preview.appliedDiscounts.map((entry) => ({
      discountName: entry.name,
      discountCode: entry.code,
      scope: entry.scope,
      amount: String(entry.discountAmount),
      details: { totalAfterDiscount: 50 },
    })),
  };
  const pending = {
    subtotal: 60,
    total: 50,
    shippingTotal: 12.9,
    discountTotal: 22.9,
    discountFingerprint: previewDiscountFingerprint(preview),
  };
  it("accepts persisted decimal strings and the full discount history", () => {
    expect(() => verifyOrderDiscountTotals(order, pending)).not.toThrow();
  });
  it.each([
    { total: "51" },
    { shippingTotal: "0" },
    { discountTotal: "12.9" },
    { discountApplications: [] },
    { items: [{ variantId: "variant", discountTotal: "0" }] },
  ])("rejects inconsistent persisted order data: %j", (change) => {
    expect(() => verifyOrderDiscountTotals({ ...order, ...change }, pending)).toThrow();
  });
});
