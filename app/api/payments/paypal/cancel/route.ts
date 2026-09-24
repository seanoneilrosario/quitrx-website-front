import { NextRequest, NextResponse } from "next/server";
import { clearPendingPayPalPayment } from "@/lib/paypal-payment-session";

export async function GET(request: NextRequest) {
  await clearPendingPayPalPayment();
  return NextResponse.redirect(new URL("/checkout?payment=cancelled", request.url));
}
