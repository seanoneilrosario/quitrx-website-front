import { NextRequest, NextResponse } from "next/server";
import { capturePayPalOrder } from "@/lib/paypal";
import { clearPendingPayPalPayment, getPendingPayPalPayment } from "@/lib/paypal-payment-session";
import { createQuitHeroOrder, findRecentlyCreatedQuitHeroOrder, type QuitHeroOrder, type QuitHeroOrderPayload } from "@/lib/quithero";

function checkoutUrl(request: NextRequest, payment: string) {
  const url = new URL("/checkout", request.url);
  url.searchParams.set("payment", payment);
  return url;
}

export async function GET(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get("token")?.trim();
  const pending = await getPendingPayPalPayment();
  if (!orderId || !pending || pending.orderId !== orderId) return NextResponse.redirect(checkoutUrl(request, "invalid"));

  try {
    const result = await capturePayPalOrder(orderId);
    const capture = result.purchase_units?.[0]?.payments?.captures?.[0];
    const capturedCents = Math.round(Number(capture?.amount?.value) * 100);
    if (result.status !== "COMPLETED" || capture?.status !== "COMPLETED" || !capture.id ||
      capture.amount?.currency_code !== "AUD" || capturedCents !== Math.round(pending.total * 100)) {
      await clearPendingPayPalPayment();
      return NextResponse.redirect(checkoutUrl(request, "failed"));
    }

    const orderPayload: QuitHeroOrderPayload = { source: "NATIVE", currencyCode: "AUD", subtotal: pending.subtotal, total: pending.total, customerId: pending.customerId, items: pending.items };
    let order = await findRecentlyCreatedQuitHeroOrder(orderPayload, pending.createdAt - 5_000).catch(() => undefined);
    if (!order) order = await createQuitHeroOrder(orderPayload) as QuitHeroOrder | undefined;
    void order;

    await clearPendingPayPalPayment();
    const response = NextResponse.redirect(checkoutUrl(request, "success"));
    response.headers.set("cache-control", "private, no-store");
    return response;
  } catch (error) {
    console.error("Unable to finalize PayPal payment:", error);
    return new NextResponse("We could not confirm your order. If payment was taken, refresh this page to retry order confirmation or contact support.", {
      status: 502,
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "private, no-store" },
    });
  }
}
