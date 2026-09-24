import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCustomerSession } from "@/lib/customer-session";

export async function GET() {
  const session = await auth();
  const customerSession = await getCustomerSession();
  const email = session?.user?.email ?? customerSession?.email;

  if (!email) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json(
    { authenticated: true, email: email.trim().toLowerCase() },
    { headers: { "cache-control": "no-store" } },
  );
}
