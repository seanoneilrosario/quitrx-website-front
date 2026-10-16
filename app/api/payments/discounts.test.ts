import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({ user: { email: "signed-in@example.test" } })),
}));
vi.mock("@/lib/auth/customer-session", () => ({
  getCustomerSession: vi.fn(async () => undefined),
}));
vi.mock("@/lib/quithero/customers", () => ({
  findQuitHeroCustomerByEmail: vi.fn(async () => ({
    id: "authenticated-customer",
    addresses: [],
  })),
  getQuitHeroCustomerAddresses: vi.fn(async () => []),
  createQuitHeroCustomerAddress: vi.fn(async () => ({ id: "checkout-address" })),
  setDefaultQuitHeroCustomerAddress: vi.fn(async () => ({})),
  ensureDefaultQuitHeroCustomerAddress: vi.fn(async () => ({ id: "checkout-address" })),
  updateQuitHeroCustomer: vi.fn(async () => ({})),
}));
vi.mock("@/lib/quithero", () => ({
  createQuitHeroOrder: vi.fn(async () => ({ id: "retail-order" })),
  getFreshQuitHeroProductById: vi.fn(async () => ({
    id: "product",
    name: "Product",
    variants: [{ id: "variant", price: 30 }],
  })),
}));
vi.mock("@/lib/quithero/orders", async (original) => ({
  ...(await original<typeof import("@/lib/quithero/orders")>()),
  updateQuitHeroOrderPaymentStatus: vi.fn(async (_id: string, paymentStatus: string) => ({
    id: "retail-order",
    paymentStatus,
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
vi.mock("@/lib/payments/eway-payment-session", () => ({ setPendingEwayPayment: vi.fn() }));

import { POST as eway } from "./eway/route";
import { POST as previewRoute } from "../checkout/discounts/route";
import { auth } from "@/auth";
import { previewQuitHeroDiscounts } from "@/lib/quithero/discounts";
import { createQuitHeroOrder } from "@/lib/quithero";
import { updateQuitHeroOrderPaymentStatus } from "@/lib/quithero/orders";
import {
  ensureDefaultQuitHeroCustomerAddress,
  updateQuitHeroCustomer,
} from "@/lib/quithero/customers";
import { QuitHeroApiError } from "@/lib/quithero/client";
import { createEwayTransparentRedirect } from "@/lib/payments/eway";
import { setPendingEwayPayment } from "@/lib/payments/eway-payment-session";

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

describe("eWAY discount payment", () => {
  const handler = eway;
  const gateway = createEwayTransparentRedirect;
  const save = setPendingEwayPayment;
  it("sends the supplied order contract with an empty code for an undiscounted checkout", async () => {
    vi.mocked(previewQuitHeroDiscounts).mockResolvedValueOnce({
      ...preview,
      discountAmount: 0,
      shippingAfterDiscount: 12.9,
      totalAfterDiscount: 72.9,
      appliedDiscounts: [],
      lineDiscounts: [],
    });
    const response = await handler(request({ discountCode: "", expectedTotal: 72.9 }));
    expect(response.status).toBe(200);
    expect(createQuitHeroOrder).toHaveBeenCalledExactlyOnceWith({
      customerId: "authenticated-customer",
      source: "NATIVE",
      currencyCode: "AUD",
      subtotal: 60,
      discountTotal: 0,
      shippingTotal: 12.9,
      shippingMethod: "standard",
      taxTotal: 0,
      total: 72.9,
      billingFirstName: "Test",
      billingLastName: "Customer",
      billingAddress1: "Test street",
      billingCity: "Brisbane",
      billingProvince: "QLD",
      billingCountry: "Australia",
      billingZip: "4000",
      billingPhone: "0400000000",
      discountCode: "",
      items: [{ variantId: "variant", quantity: 2 }],
    });
    expect(gateway).toHaveBeenCalledWith(
      expect.objectContaining({
        Payment: expect.objectContaining({ TotalAmount: 7290 }),
      }),
    );
  });
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
    expect(ensureDefaultQuitHeroCustomerAddress).toHaveBeenCalledWith(
      "authenticated-customer",
      expect.objectContaining({
        firstName: "Test",
        lastName: "Customer",
        phone: "0400000000",
        address1: "Test street",
        city: "Brisbane",
        state: "QLD",
        postcode: "4000",
        country: "Australia",
      }),
    );
    expect(updateQuitHeroCustomer).toHaveBeenCalledWith("authenticated-customer", {
      firstName: "Test",
      lastName: "Customer",
      phone: "0400000000",
    });
    expect(createQuitHeroOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        source: "NATIVE",
        currencyCode: "AUD",
        customerId: "authenticated-customer",
        subtotal: 60,
        discountTotal: 22.9,
        shippingTotal: 12.9,
        shippingMethod: "standard",
        taxTotal: 0,
        billingFirstName: "Test",
        billingLastName: "Customer",
        billingAddress1: "Test street",
        billingCity: "Brisbane",
        billingProvince: "QLD",
        billingCountry: "Australia",
        billingZip: "4000",
        billingPhone: "0400000000",
        discountCode: "SAVE",
        total: 50,
        items: [{ variantId: "variant", quantity: 2 }],
      }),
    );
    expect(updateQuitHeroOrderPaymentStatus).toHaveBeenCalledWith("retail-order", "PENDING");
    expect(vi.mocked(ensureDefaultQuitHeroCustomerAddress).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(createQuitHeroOrder).mock.invocationCallOrder[0],
    );
    expect(vi.mocked(createQuitHeroOrder).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(updateQuitHeroOrderPaymentStatus).mock.invocationCallOrder[0],
    );
    expect(vi.mocked(updateQuitHeroOrderPaymentStatus).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(createEwayTransparentRedirect).mock.invocationCallOrder[0],
    );
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
        retailOrderId: "retail-order",
        subtotal: 60,
        taxTotal: 0,
        total: 50,
        discountCode: "SAVE",
        shippingTotal: 12.9,
        discountTotal: 22.9,
        discountFingerprint: expect.any(String),
        shippingMethod: "standard",
        billingFirstName: "Test",
        billingLastName: "Customer",
        billingAddress1: "Test street",
        billingCity: "Brisbane",
        billingProvince: "QLD",
        billingCountry: "Australia",
        billingZip: "4000",
        billingPhone: "0400000000",
      }),
    );
    const payload = vi.mocked(gateway).mock.calls[0][0];
    expect(payload).toMatchObject({ Payment: { TotalAmount: 5000 }, Items: [{ Total: 5000 }] });
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
  it("does not start eWAY if QuitHero rejects the order", async () => {
    vi.mocked(createQuitHeroOrder).mockRejectedValueOnce(
      new QuitHeroApiError("Internal server error", 500),
    );

    const response = await handler(request());
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      error:
        "The order service failed while creating your order (HTTP 500). Payment has not been submitted. Please contact support before trying again.",
    });
    expect(gateway).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });
  it("does not start eWAY until QuitHero confirms the order is pending", async () => {
    vi.mocked(updateQuitHeroOrderPaymentStatus).mockRejectedValue(
      new Error("QuitHero did not confirm the pending payment status."),
    );

    await expect(handler(request())).resolves.toMatchObject({ status: 502 });
    expect(createQuitHeroOrder).toHaveBeenCalled();
    expect(gateway).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });
  it("requires review if discounts change before payment", async () => {
    const response = await handler(request({ expectedTotal: 60 }));
    expect(response.status).toBe(409);
    expect(gateway).not.toHaveBeenCalled();
  });
  it("does not create an order or start eWAY if setting the default address fails", async () => {
    vi.mocked(ensureDefaultQuitHeroCustomerAddress).mockRejectedValueOnce(
      new Error("Address could not be set as default"),
    );

    const response = await handler(request());

    expect(response.status).toBe(502);
    expect(createQuitHeroOrder).not.toHaveBeenCalled();
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
