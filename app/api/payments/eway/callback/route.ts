import { createQuitHeroOrder } from "@/lib/quithero";
import {
  updateQuitHeroOrderPaymentStatus,
  verifyOrderDiscountTotals,
  orderConfirmationError,
} from "@/lib/quithero/orders";
import { NextRequest, NextResponse } from "next/server";
import { getEwayPaymentResult } from "@/lib/payments/eway";
import {
  clearPendingEwayPayment,
  getPendingEwayPayment,
  setPendingEwayPayment,
} from "@/lib/payments/eway-payment-session";

function checkoutUrl(request: NextRequest, payment: string) {
  const url = new URL("/checkout", request.url);
  url.searchParams.set("payment", payment);
  url.searchParams.set("method", "eway");
  return url;
}

const activeFinalizations = new Map<string, Promise<"success" | "failed" | "invalid">>();

async function finalizeVerifiedEwayPayment(accessCode?: string) {
  let pending = await getPendingEwayPayment();
  if (!pending || (accessCode && pending.accessCode !== accessCode)) {
    return "invalid" as const;
  }

  if (!pending.paymentVerified) {
    const result = await getEwayPaymentResult(pending.accessCode);
    const expectedCents = Math.round(pending.total * 100);
    if (
      !result.TransactionStatus ||
      result.TotalAmount !== expectedCents ||
      !result.TransactionID
    ) {
      await clearPendingEwayPayment();
      return "failed" as const;
    }
    pending = { ...pending, paymentVerified: true };
    await setPendingEwayPayment(pending);
  }

  if (!pending.retailOrderId) {
    const order = await createQuitHeroOrder({
      source: "NATIVE",
      currencyCode: "AUD",
      customerId: pending.customerId,
      items: pending.items,
      subtotal: pending.subtotal,
      shippingTotal: pending.shippingTotal,
      shippingMethod: pending.shippingMethod,
      discountCode: pending.discountCode ?? "",
      discountTotal: pending.discountTotal,
      taxTotal: pending.taxTotal,
      billingFirstName: pending.billingFirstName,
      billingLastName: pending.billingLastName,
      billingAddress1: pending.billingAddress1,
      billingCity: pending.billingCity,
      billingProvince: pending.billingProvince,
      billingCountry: pending.billingCountry,
      billingZip: pending.billingZip,
      billingPhone: pending.billingPhone,
      total: pending.total,
    });
    if (!order.id) throw new Error("QuitHero created an order without returning its ID.");
    pending = { ...pending, retailOrderId: order.id };
    await setPendingEwayPayment(pending);
  }
  if (!pending.retailOrderId) throw new Error("The payment session has no QuitHero order ID.");
  const order = await updateQuitHeroOrderPaymentStatus(pending.retailOrderId, "PAID");

  verifyOrderDiscountTotals(order, pending);
  await clearPendingEwayPayment();
  return "success" as const;
}

function finalizeEwayPayment(accessCode?: string) {
  if (!accessCode) return finalizeVerifiedEwayPayment();
  const active = activeFinalizations.get(accessCode);
  if (active) return active;

  const finalization = finalizeVerifiedEwayPayment(accessCode).finally(() => {
    activeFinalizations.delete(accessCode);
  });
  activeFinalizations.set(accessCode, finalization);
  return finalization;
}

export async function GET(request: NextRequest) {
  const accessCode = request.nextUrl.searchParams.get("AccessCode")?.trim();

  try {
    const status = await finalizeEwayPayment(accessCode);
    const response = NextResponse.redirect(checkoutUrl(request, status));
    response.headers.set("cache-control", "private, no-store");
    return response;
  } catch (error) {
    console.error("Unable to finalize eWAY payment:", error);
    const response = NextResponse.redirect(checkoutUrl(request, "review"));
    response.headers.set("cache-control", "private, no-store");
    return response;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as { accessCode?: unknown };
    const accessCode = typeof body.accessCode === "string" ? body.accessCode.trim() : undefined;
    const status = await finalizeEwayPayment(accessCode);

    if (status === "invalid")
      return NextResponse.json(
        { error: "We couldn't verify that payment session. Please try again." },
        { status: 400 },
      );
    if (status === "failed")
      return NextResponse.json(
        { error: "Payment was declined or could not be completed. Please try again." },
        { status: 402 },
      );

    return NextResponse.json(
      { status: "success" },
      { headers: { "cache-control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Unable to finalize eWAY payment:", error);
    return NextResponse.json({ error: orderConfirmationError(error) }, { status: 502 });
  }
}
