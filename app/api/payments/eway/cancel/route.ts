import { NextRequest, NextResponse } from "next/server";
import { clearPendingEwayPayment } from "@/lib/payments/eway-payment-session";

export async function GET(request: NextRequest) {
  await clearPendingEwayPayment();
  return NextResponse.redirect(new URL("/checkout?payment=cancelled", request.url));
}
