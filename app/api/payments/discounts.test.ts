import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({ user: { email: "signed-in@example.test" } })),
}));
vi.mock("@/lib/auth/customer-session", () => ({
  getCustomerSession: vi.fn(async () => undefined),
}));
vi.mock("@/lib/quithero/customers", () => ({
  findQuitHeroCustomerByEmail: vi.fn(async () => ({ id: "authenticated-customer" })),
}));
vi.mock("@/lib/quithero", () => ({
  getFreshQuitHeroProductById: vi.fn(async () => ({
    id: "product",
    name: "Product",
    variants: [{ id: "variant", price: 30 }],
  })),
}));
vi.mock("@/lib/catalog/bundles", () => ({ getPurchasableStock: () => 99 }));
vi.mock("@/lib/quithero/discounts", async (original) => ({
  ...(await original<typeof import("@/lib/quithero/discounts")>()),
  previewQuitHeroDiscounts: vi.fn(),
}));
vi.mock("@/lib/payments/eway", () => ({
  createEwayTransparentRedirect: vi.fn(async () => ({
    AccessCode: "access",
    FormActionURL: "https://payment.test",
  })),
  EwayApiError: class extends Error {},
}));
vi.mock("@/lib/payments/paypal", () => ({
  createPayPalOrder: vi.fn(async () => ({
    id: "paypal-order",
    links: [{ rel: "approve", href: "https://payment.test" }],
  })),
  PayPalApiError: class extends Error {},
}));
vi.mock("@/lib/payments/eway-payment-session", () => ({ setPendingEwayPayment: vi.fn() }));
vi.mock("@/lib/payments/paypal-payment-session", () => ({ setPendingPayPalPayment: vi.fn() }));

import { POST as eway } from "./eway/route";
import { POST as paypal } from "./paypal/route";
import { POST as previewRoute } from "../checkout/discounts/route";
import { auth } from "@/auth";
import { previewQuitHeroDiscounts } from "@/lib/quithero/discounts";
import { QuitHeroApiError } from "@/lib/quithero/client";
import { createEwayTransparentRedirect } from "@/lib/payments/eway";
import { createPayPalOrder } from "@/lib/payments/paypal";
import { setPendingEwayPayment } from "@/lib/payments/eway-payment-session";
import { setPendingPayPalPayment } from "@/lib/payments/paypal-payment-session";

const preview = {
  subtotal: 60,
  shippingTotal: 12.9,
  shippingAfterDiscount: 0,
  discountAmount: 22.9,
  totalAfterDiscount: 50,
  appliedDiscounts: [
    { name: "Product", code: "SAVE", scope: "PRODUCT", discountAmount: 10 },
    { name: "Shipping", scope: "SHIPPING", discountAmount: 12.9 },
  ],
  lineDiscounts: [{ itemIndex: 0, variantId: "variant", discountAmount: 10 }],
  promotionalItems: [],
};
function request(extra = {}) {
  return new Request("https://shop.test/api/payments", {
    method: "POST",
    body: JSON.stringify({
      items: [{ productId: "product", variantId: "variant", quantity: 2 }],
      shippingMethod: "standard",
      discountCode: " SAVE ",
      expectedTotal: 50,
      customer: {
        firstName: "Test",
        lastName: "Customer",
        address: "Test street",
        city: "Brisbane",
        state: "QLD",
        postcode: "4000",
        phone: "0400000000",
        email: "test@example.test",
      },
      ...extra,
    }),
  });
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(previewQuitHeroDiscounts).mockResolvedValue(preview);
});

describe.each([
  ["eway", eway, createEwayTransparentRedirect, setPendingEwayPayment],
  ["paypal", paypal, createPayPalOrder, setPendingPayPalPayment],
] as const)("%s discount payment", (_name, handler, gateway, save) => {
  it.each([
    ["no promotion", undefined, 0, 12.9, 72.9],
    ["automatic promotion", undefined, 5, 12.9, 67.9],
    ["product code", "PRODUCT", 10, 12.9, 62.9],
    ["order code", "ORDER", 6, 12.9, 66.9],
    ["free shipping", "SHIPPING", 12.9, 0, 60],
    ["product and order", "COMBINED", 16, 12.9, 56.9],
    ["product and shipping", "COMBINED", 22.9, 0, 50],
  ])(
    "uses backend totals for %s",
    async (_scenario, discountCode, discountAmount, shippingAfterDiscount, totalAfterDiscount) => {
      vi.mocked(previewQuitHeroDiscounts).mockResolvedValue({
        ...preview,
        discountAmount: Number(discountAmount),
        shippingAfterDiscount: Number(shippingAfterDiscount),
        totalAfterDiscount: Number(totalAfterDiscount),
      });
      const response = await handler(request({ discountCode, expectedTotal: totalAfterDiscount }));
      expect(response.status).toBe(200);
      expect(save).toHaveBeenCalledWith(
        expect.objectContaining({
          total: totalAfterDiscount,
          discountCode,
          discountTotal: discountAmount,
        }),
      );
    },
  );
  it("charges the backend total and carries the code and original shipping into the signed session", async () => {
    const response = await handler(request());
    expect(response.status).toBe(200);
    expect(previewQuitHeroDiscounts).toHaveBeenCalledWith(
      expect.objectContaining({
        customerId: "authenticated-customer",
        discountCode: "SAVE",
        subtotal: 60,
        shippingTotal: 12.9,
      }),
    );
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        subtotal: 60,
        total: 50,
        discountCode: "SAVE",
        shippingTotal: 12.9,
        discountTotal: 22.9,
        discountFingerprint: expect.any(String),
      }),
    );
    const payload = vi.mocked(gateway).mock.calls[0][0];
    if (_name === "eway")
      expect(payload).toMatchObject({ Payment: { TotalAmount: 5000 }, Items: [{ Total: 5000 }] });
    else expect(payload).toMatchObject({ purchase_units: [{ amount: { value: "50.00" } }] });
  });
  it("adds backend promotional items to the signed order session", async () => {
    vi.mocked(previewQuitHeroDiscounts).mockResolvedValue({
      ...preview,
      subtotal: 82.99,
      discountAmount: 22.99,
      shippingAfterDiscount: 12.9,
      totalAfterDiscount: 72.9,
      promotionalItems: [
        {
          discountId: "buy-x-get-y",
          role: "GET_Y",
          productId: "gift-product",
          variantId: "gift-variant",
          quantity: 1,
          unitPrice: 22.99,
          discountAmount: 22.99,
          lineTotal: 0,
          benefitType: "FREE",
          isPromotional: true,
        },
      ],
    });
    const response = await handler(request({ expectedTotal: 72.9 }));
    expect(response.status).toBe(200);
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [
          { variantId: "variant", quantity: 2 },
          {
            variantId: "gift-variant",
            quantity: 1,
            isPromotional: true,
            discountId: "buy-x-get-y",
            benefitType: "FREE",
          },
        ],
      }),
    );
  });
  it("stops before payment if the backend rejects eligibility", async () => {
    vi.mocked(previewQuitHeroDiscounts).mockRejectedValue(
      new QuitHeroApiError("Customer is not eligible", 400),
    );
    const response = await handler(request());
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Customer is not eligible" });
    expect(gateway).not.toHaveBeenCalled();
  });
  it("requires review if discounts change before payment", async () => {
    const response = await handler(request({ expectedTotal: 60 }));
    expect(response.status).toBe(409);
    expect(gateway).not.toHaveBeenCalled();
  });
});

describe("checkout preview route", () => {
  it("uses authenticated identity and fresh prices, ignoring supplied customer IDs and totals", async () => {
    const response = await previewRoute(request({ customerId: "forged", subtotal: 0, total: 0 }));
    expect(response.status).toBe(200);
    expect(previewQuitHeroDiscounts).toHaveBeenCalledWith(
      expect.objectContaining({
        customerId: "authenticated-customer",
        subtotal: 60,
        quantity: 2,
        discountCode: "SAVE",
      }),
    );
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
  it("refreshes shipping and removes the code for automatic promotions", async () => {
    await previewRoute(request({ shippingMethod: "express", discountCode: "" }));
    expect(previewQuitHeroDiscounts).toHaveBeenCalledWith(
      expect.objectContaining({ shippingTotal: 15.9, discountCode: undefined }),
    );
  });
  it("rejects malformed cart quantities", async () => {
    expect(
      (
        await previewRoute(
          request({ items: [{ productId: "product", variantId: "variant", quantity: -1 }] }),
        )
      ).status,
    ).toBe(400);
    expect(previewQuitHeroDiscounts).not.toHaveBeenCalled();
  });
  it("preserves the existing sign-in requirement", async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as never);
    expect((await previewRoute(request())).status).toBe(401);
    expect(previewQuitHeroDiscounts).not.toHaveBeenCalled();
  });
});
