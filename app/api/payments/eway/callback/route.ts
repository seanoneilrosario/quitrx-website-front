import {
  getQuitHeroOrderById,
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
import {
  createQuitHeroOrder,
  findRecentlyCreatedQuitHeroOrder,
  type QuitHeroOrder,
  type QuitHeroOrderPayload,
} from "@/lib/quithero";

function checkoutUrl(request: NextRequest, payment: string, accessCode?: string) {
  const url = new URL("/checkout", request.url);
  url.searchParams.set("payment", payment);
  if (accessCode) url.searchParams.set("AccessCode", accessCode);
  return url;
}

async function finalizeEwayPayment(accessCode?: string) {
  const pending = await getPendingEwayPayment();
  if (!accessCode || !pending || pending.accessCode !== accessCode) {
    return "invalid" as const;
  }

  const result = await getEwayPaymentResult(accessCode);
  const expectedCents = Math.round(pending.total * 100);
  if (!result.TransactionStatus || result.TotalAmount !== expectedCents || !result.TransactionID) {
    await clearPendingEwayPayment();
    return "failed" as const;
  }

  const orderPayload: QuitHeroOrderPayload = {
    source: "NATIVE",
    currencyCode: "AUD",
    subtotal: pending.subtotal,
    shippingTotal: pending.shippingTotal,
    discountCode: pending.discountCode,
    total: pending.total,
    customerId: pending.customerId,
    items: pending.items,
  };
  let order = pending.retailOrderId
    ? await getQuitHeroOrderById(pending.retailOrderId)
    : await findRecentlyCreatedQuitHeroOrder(orderPayload, pending.createdAt - 5_000).catch(
        () => undefined,
      );
  if (!order) order = (await createQuitHeroOrder(orderPayload)) as QuitHeroOrder | undefined;
  if (order?.id && order.id !== pending.retailOrderId)
    await setPendingEwayPayment({ ...pending, retailOrderId: order.id });

  verifyOrderDiscountTotals(order, pending);
  await clearPendingEwayPayment();
  return "success" as const;
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
    const response = NextResponse.redirect(checkoutUrl(request, "review", accessCode));
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
    return NextResponse.json(
      {
        error: orderConfirmationError(error),
      },
      { status: 502 },
    );
  }
}
