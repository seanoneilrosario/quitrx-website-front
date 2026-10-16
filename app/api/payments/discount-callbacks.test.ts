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
vi.mock("@/lib/payments/eway-payment-session", () => ({
  getPendingEwayPayment: vi.fn(),
  setPendingEwayPayment: vi.fn(),
  clearPendingEwayPayment: vi.fn(),
}));
vi.mock("@/lib/quithero", () => ({
  createQuitHeroOrder: vi.fn(),
}));
vi.mock("@/lib/quithero/orders", async (original) => ({
  ...(await original<typeof import("@/lib/quithero/orders")>()),
  updateQuitHeroOrderPaymentStatus: vi.fn(async () => order),
}));

import { POST as eway } from "./eway/callback/route";
import { createQuitHeroOrder } from "@/lib/quithero";
import { updateQuitHeroOrderPaymentStatus } from "@/lib/quithero/orders";
import { QuitHeroApiError } from "@/lib/quithero/client";
import { getEwayPaymentResult } from "@/lib/payments/eway";
import {
  getPendingEwayPayment,
  clearPendingEwayPayment,
  setPendingEwayPayment,
} from "@/lib/payments/eway-payment-session";

const pending = {
  customerId: "customer",
  subtotal: 60,
  total: 50,
  shippingTotal: 12.9,
  shippingMethod: "standard" as const,
  discountTotal: 22.9,
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
  vi.mocked(getPendingEwayPayment).mockResolvedValue({
    ...pending,
    accessCode: "access",
    retailOrderId: "retail-order",
  });
  vi.mocked(createQuitHeroOrder).mockResolvedValue(order);
  vi.mocked(updateQuitHeroOrderPaymentStatus).mockResolvedValue(order);
});

describe("eWAY order confirmation", () => {
  const invoke = () =>
    eway(
      new NextRequest("https://shop.test/callback", {
        method: "POST",
        body: JSON.stringify({ accessCode: "access" }),
      }),
    );
  it.each([
    { TransactionStatus: false, TotalAmount: 5000, TransactionID: 1 },
    { TransactionStatus: true, TotalAmount: 4900, TransactionID: 1 },
    { TransactionStatus: true, TotalAmount: 5000, TransactionID: undefined },
  ])("does not mark an unverified payment as paid: %j", async (result) => {
    vi.mocked(getEwayPaymentResult).mockResolvedValueOnce(result);
    const response = await invoke();
    expect(response.status).toBe(402);
    expect(updateQuitHeroOrderPaymentStatus).not.toHaveBeenCalled();
    expect(setPendingEwayPayment).not.toHaveBeenCalled();
  });

  it("rejects a return for a different access code before querying eWAY", async () => {
    const response = await eway(
      new NextRequest("https://shop.test/callback", {
        method: "POST",
        body: JSON.stringify({ accessCode: "different-access-code" }),
      }),
    );
    expect(response.status).toBe(400);
    expect(getEwayPaymentResult).not.toHaveBeenCalled();
    expect(updateQuitHeroOrderPaymentStatus).not.toHaveBeenCalled();
  });

  it("retains the session when the eWAY result lookup is temporarily unavailable", async () => {
    vi.mocked(getEwayPaymentResult).mockRejectedValueOnce(new Error("Network unavailable"));
    const response = await invoke();
    expect(response.status).toBe(502);
    expect(clearPendingEwayPayment).not.toHaveBeenCalled();
    expect(updateQuitHeroOrderPaymentStatus).not.toHaveBeenCalled();
  });
  it("retrieves the pre-created QuitHero order and verifies payment totals", async () => {
    const response = await invoke();
    expect(response.status).toBe(200);
    expect(updateQuitHeroOrderPaymentStatus).toHaveBeenCalledWith("retail-order", "PAID");
    expect(createQuitHeroOrder).not.toHaveBeenCalled();
    expect(setPendingEwayPayment).toHaveBeenCalledWith(
      expect.objectContaining({ paymentVerified: true }),
    );
    expect(clearPendingEwayPayment).toHaveBeenCalled();
  });
  it("does not report success or discard recovery state when persisted totals differ", async () => {
    vi.mocked(updateQuitHeroOrderPaymentStatus).mockResolvedValue({ ...order, total: "51" });
    const response = await invoke();
    expect(response.status).toBe(502);
    expect(clearPendingEwayPayment).not.toHaveBeenCalled();
  });
  it("reuses the saved retail order on a confirmation retry", async () => {
    vi.mocked(getPendingEwayPayment).mockResolvedValue({
      ...pending,
      accessCode: "access",
      retailOrderId: "retail-order",
    });
    await invoke();
    expect(updateQuitHeroOrderPaymentStatus).toHaveBeenCalledWith("retail-order", "PAID");
    expect(createQuitHeroOrder).not.toHaveBeenCalled();
  });
  it("retries a verified payment without requiring the browser to resend its access code", async () => {
    vi.mocked(getPendingEwayPayment).mockResolvedValue({
      ...pending,
      accessCode: "access",
      retailOrderId: "retail-order",
      paymentVerified: true,
    });

    const response = await eway(
      new NextRequest("https://shop.test/callback", {
        method: "POST",
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(200);
    expect(getEwayPaymentResult).not.toHaveBeenCalled();
    expect(updateQuitHeroOrderPaymentStatus).toHaveBeenCalledWith("retail-order", "PAID");
    expect(createQuitHeroOrder).not.toHaveBeenCalled();
  });

  it("coalesces simultaneous callbacks into one order creation", async () => {
    const [first, second] = await Promise.all([invoke(), invoke()]);
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(updateQuitHeroOrderPaymentStatus).toHaveBeenCalledTimes(1);
    expect(createQuitHeroOrder).not.toHaveBeenCalled();
  });
});

it("surfaces the QuitHero validation error when a verified eWAY order retry is rejected", async () => {
  vi.mocked(getPendingEwayPayment).mockResolvedValue({
    ...pending,
    accessCode: "access",
    retailOrderId: "retail-order",
    paymentVerified: true,
  });
  vi.mocked(updateQuitHeroOrderPaymentStatus).mockRejectedValue(
    new QuitHeroApiError("billingAddress1 must be a string", 400),
  );

  const response = await eway(
    new NextRequest("https://shop.test/callback", {
      method: "POST",
      body: JSON.stringify({}),
    }),
  );

  expect(response.status).toBe(502);
  expect(await response.json()).toMatchObject({
    error: expect.stringContaining("billingAddress1 must be a string"),
  });
  expect(getEwayPaymentResult).not.toHaveBeenCalled();
  expect(createQuitHeroOrder).not.toHaveBeenCalled();
  expect(clearPendingEwayPayment).not.toHaveBeenCalled();
});
