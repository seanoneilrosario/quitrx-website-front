import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { clearCustomerSession, getCustomerSession } from "@/lib/customer-session";
import { findQuitHeroCustomerByEmail } from "@/lib/quithero-customers";

export async function GET() {
  const session = await auth();
  const customerSession = await getCustomerSession();
  const email = session?.user?.email ?? customerSession?.email;
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const customer = await findQuitHeroCustomerByEmail(email);
    if (!customer) {
      if (customerSession) await clearCustomerSession();
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(customer, { headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Unable to load customer account." }, { status: 502 });
  }
}
