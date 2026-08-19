import { NextResponse } from "next/server";
import { clearCustomerSession } from "@/lib/customer-session";

export async function POST(request: Request) {
  await clearCustomerSession();
  return NextResponse.redirect(new URL("/account/login", request.url), 303);
}
