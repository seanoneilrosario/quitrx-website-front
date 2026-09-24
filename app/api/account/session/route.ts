import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCustomerSession } from "@/lib/customer-session";

export async function GET() {
  const customerSession = await getCustomerSession();
  const session = customerSession?.email ? undefined : await auth();
  const email = customerSession?.email ?? session?.user?.email;

  if (!email) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json(
    { authenticated: true, email: email.trim().toLowerCase() },
    { headers: { "cache-control": "no-store" } },
  );
}
