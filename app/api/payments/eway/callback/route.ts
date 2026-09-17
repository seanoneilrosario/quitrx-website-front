import { NextRequest, NextResponse } from "next/server";
import { getEwayPaymentResult } from "@/lib/eway";
import { clearPendingEwayPayment, getPendingEwayPayment } from "@/lib/eway-payment-session";
import { createQuitHeroOrder, findRecentlyCreatedQuitHeroOrder, type QuitHeroOrder, type QuitHeroOrderPayload } from "@/lib/quithero";

function checkoutUrl(request: NextRequest, payment: string) {
  const url = new URL("/checkout", request.url);
  url.searchParams.set("payment", payment);
  return url;
}

export async function GET(request: NextRequest) {
  const accessCode = request.nextUrl.searchParams.get("AccessCode")?.trim();
  const pending = await getPendingEwayPayment();
  if (!accessCode || !pending || pending.accessCode !== accessCode) {
    return NextResponse.redirect(checkoutUrl(request, "invalid"));
  }

  try {
    const result = await getEwayPaymentResult(accessCode);
    const expectedCents = Math.round(pending.total * 100);
    if (!result.TransactionStatus || result.TotalAmount !== expectedCents || !result.TransactionID) {
      await clearPendingEwayPayment();
      return NextResponse.redirect(checkoutUrl(request, "failed"));
    }

    const orderPayload: QuitHeroOrderPayload = {
      source: "NATIVE",
      currencyCode: "AUD",
      subtotal: pending.subtotal,
      total: pending.total,
      customerId: pending.customerId,
      items: pending.items,
    };
    let order = await findRecentlyCreatedQuitHeroOrder(orderPayload, pending.createdAt - 5_000).catch(() => undefined);
    if (!order) order = await createQuitHeroOrder(orderPayload) as QuitHeroOrder | undefined;
    void order;

    await clearPendingEwayPayment();
    const response = NextResponse.redirect(checkoutUrl(request, "success"));
    response.headers.set("cache-control", "private, no-store");
    return response;
  } catch (error) {
    console.error("Unable to finalize eWAY payment:", error);
    return new NextResponse("We could not confirm your order. If payment was taken, refresh this page to retry order confirmation or contact support.", {
      status: 502,
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "private, no-store" },
    });
  }
}
