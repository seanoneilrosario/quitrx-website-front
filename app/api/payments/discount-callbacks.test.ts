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
  vi.mocked(getPendingEwayPayment).mockResolvedValue({
    ...pending,
    accessCode: "access",
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
    expect(response.status).toBe(gateway === "eway" ? 200 : 307);
    expect(createQuitHeroOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        discountCode: "SAVE",
        shippingTotal: 12.9,
        total: 50,
        items: pending.items,
      }),
    );
    expect(response.status).toBe(400);
    expect(getEwayPaymentResult).not.toHaveBeenCalled();
    expect(createQuitHeroOrder).not.toHaveBeenCalled();
    expect(updateQuitHeroOrderPaymentStatus).not.toHaveBeenCalled();
  });

  it("retains the session when the eWAY result lookup is temporarily unavailable", async () => {
    vi.mocked(getEwayPaymentResult).mockRejectedValueOnce(new Error("Network unavailable"));
    const response = await invoke();
    expect(response.status).toBe(502);
    expect(clearPendingEwayPayment).not.toHaveBeenCalled();
    expect(createQuitHeroOrder).not.toHaveBeenCalled();
    expect(updateQuitHeroOrderPaymentStatus).not.toHaveBeenCalled();
  });
  it("posts the order only after eWAY verifies payment and then marks it paid", async () => {
    const response = await invoke();
    expect(response.status).toBe(200);
    expect(updateQuitHeroOrderPaymentStatus).toHaveBeenCalledWith("retail-order", "PAID");
    expect(createQuitHeroOrder).toHaveBeenCalledExactlyOnceWith({
      ...Object.fromEntries(Object.entries(pending).filter(([key]) => key !== "createdAt")),
      source: "NATIVE",
      currencyCode: "AUD",
    });
    expect(vi.mocked(getEwayPaymentResult).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(createQuitHeroOrder).mock.invocationCallOrder[0],
    );
    expect(setPendingEwayPayment).toHaveBeenCalledWith(
      expect.objectContaining({ paymentVerified: true, retailOrderId: "retail-order" }),
    );
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
});
