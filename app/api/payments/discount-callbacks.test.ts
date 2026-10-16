import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/payments/eway", () => ({
  getEwayPaymentResult: vi.fn(async () => ({
    TransactionStatus: true,
    TotalAmount: 5000,
    TransactionID: 1,
  })),
}));
vi.mock("@/lib/payments/paypal", () => ({
  capturePayPalOrder: vi.fn(async () => ({
    status: "COMPLETED",
    purchase_units: [
      {
        payments: {
          captures: [
            {
              id: "capture",
              status: "COMPLETED",
              amount: { currency_code: "AUD", value: "50.00" },
            },
          ],
        },
      },
    ],
  })),
}));
vi.mock("@/lib/payments/eway-payment-session", () => ({
  getPendingEwayPayment: vi.fn(),
  setPendingEwayPayment: vi.fn(),
  clearPendingEwayPayment: vi.fn(),
}));
vi.mock("@/lib/payments/paypal-payment-session", () => ({
  getPendingPayPalPayment: vi.fn(),
  setPendingPayPalPayment: vi.fn(),
  clearPendingPayPalPayment: vi.fn(),
}));
vi.mock("@/lib/quithero", () => ({
  createQuitHeroOrder: vi.fn(),
  findRecentlyCreatedQuitHeroOrder: vi.fn(async () => undefined),
}));
vi.mock("@/lib/quithero/orders", async (original) => ({
  ...(await original<typeof import("@/lib/quithero/orders")>()),
  getQuitHeroOrderById: vi.fn(),
}));

import { GET as ewayGet, POST as eway } from "./eway/callback/route";
import { GET as paypal } from "./paypal/callback/route";
import { createQuitHeroOrder } from "@/lib/quithero";
import { getQuitHeroOrderById } from "@/lib/quithero/orders";
import {
  getPendingEwayPayment,
  clearPendingEwayPayment,
  setPendingEwayPayment,
} from "@/lib/payments/eway-payment-session";
import {
  getPendingPayPalPayment,
  clearPendingPayPalPayment,
  setPendingPayPalPayment,
} from "@/lib/payments/paypal-payment-session";

const pending = {
  customerId: "customer",
  subtotal: 60,
  total: 50,
  shippingTotal: 12.9,
  discountTotal: 22.9,
  discountCode: "SAVE",
  items: [{ variantId: "variant", quantity: 2 }],
  createdAt: Date.now(),
};
const order = {
  id: "retail-order",
  subtotal: "60",
  total: "50",
  shippingTotal: "12.9",
  discountTotal: "22.9",
  discountApplications: [{ discountName: "Offer", amount: "22.9", details: {} }],
};
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getPendingEwayPayment).mockResolvedValue({ ...pending, accessCode: "access" });
  vi.mocked(getPendingPayPalPayment).mockResolvedValue({ ...pending, orderId: "paypal" });
  vi.mocked(createQuitHeroOrder).mockResolvedValue(order);
  vi.mocked(getQuitHeroOrderById).mockResolvedValue(order);
});

describe.each(["eway", "paypal"] as const)("%s order confirmation", (gateway) => {
  const invoke = () =>
    gateway === "eway"
      ? eway(
          new NextRequest("https://shop.test/callback", {
            method: "POST",
            body: JSON.stringify({ accessCode: "access" }),
          }),
        )
      : paypal(new NextRequest("https://shop.test/callback?token=paypal"));
  it("passes the selected code and original shipping to the backend and verifies the order", async () => {
    const response = await invoke();
    expect(response.status).toBe(gateway === "eway" ? 200 : 307);
    expect(createQuitHeroOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        discountCode: "SAVE",
        shippingTotal: 12.9,
        total: 50,
        items: pending.items,
      }),
    );
    expect(
      gateway === "eway" ? setPendingEwayPayment : setPendingPayPalPayment,
    ).toHaveBeenCalledWith(expect.objectContaining({ retailOrderId: "retail-order" }));
    expect(
      gateway === "eway" ? clearPendingEwayPayment : clearPendingPayPalPayment,
    ).toHaveBeenCalled();
  });
  it("does not report success or discard recovery state when persisted totals differ", async () => {
    vi.mocked(createQuitHeroOrder).mockResolvedValue({ ...order, total: "51" });
    const response = await invoke();
    expect(response.status).toBe(502);
    expect(
      gateway === "eway" ? clearPendingEwayPayment : clearPendingPayPalPayment,
    ).not.toHaveBeenCalled();
  });
  it("reuses the saved retail order on a confirmation retry", async () => {
    vi.mocked(getPendingEwayPayment).mockResolvedValue({
      ...pending,
      accessCode: "access",
      retailOrderId: "retail-order",
    });
    vi.mocked(getPendingPayPalPayment).mockResolvedValue({
      ...pending,
      orderId: "paypal",
      retailOrderId: "retail-order",
    });
    await invoke();
    expect(getQuitHeroOrderById).toHaveBeenCalledWith("retail-order");
    expect(createQuitHeroOrder).not.toHaveBeenCalled();
  });
});

it("locks checkout for review when an approved eWAY payment cannot be confirmed", async () => {
  vi.mocked(createQuitHeroOrder).mockResolvedValue({ ...order, total: "51" });
  const response = await ewayGet(
    new NextRequest("https://shop.test/api/payments/eway/callback?AccessCode=access"),
  );
  expect(response.status).toBe(307);
  expect(response.headers.get("location")).toBe(
    "https://shop.test/checkout?payment=review&AccessCode=access",
  );
  expect(clearPendingEwayPayment).not.toHaveBeenCalled();
});

it("coalesces concurrent eWAY callbacks so the retail order is created once", async () => {
  const callback = () =>
    eway(
      new NextRequest("https://shop.test/callback", {
        method: "POST",
        body: JSON.stringify({ accessCode: "access" }),
      }),
    );

  const [first, second] = await Promise.all([callback(), callback()]);

  expect(first.status).toBe(200);
  expect(second.status).toBe(200);
  expect(createQuitHeroOrder).toHaveBeenCalledTimes(1);
});
